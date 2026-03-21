/**
 * ImageCloud.ts
 * Main application class
 * Manages initialization and coordination of the interactive image cloud
 */

import type { ImageCloudOptions, ImageCloudConfig, ImageLayout, ContainerBounds, ImageLoader, EntryAnimationConfig, LoaderEntry, SharedLoaderConfig, StaticLoaderInnerConfig, GoogleDriveLoaderInnerConfig, ImageCloudCallbacks, ImageStateContext, BeforeLoadContext, BeforeLoadResult, ImageLoadedContext, ImageErrorContext, LoadProgressContext, GalleryReadyContext, EntryStartContext, EntryProgressContext, EntryCompleteContext, LayoutCompleteContext } from './config/types';
import { mergeConfig, DEFAULT_CONFIG } from './config/defaults';
import { AnimationEngine } from './engines/AnimationEngine';
import { EntryAnimationEngine } from './engines/EntryAnimationEngine';
import { IdleAnimationEngine } from './engines/IdleAnimationEngine';
import { LayoutEngine } from './engines/LayoutEngine';
import { ZoomEngine } from './engines/ZoomEngine';
import { SwipeEngine, SNAP_BACK_DURATION_MS } from './engines/SwipeEngine';
import { animatePath } from './engines/PathAnimator';
import { GoogleDriveLoader } from './loaders/GoogleDriveLoader';
import { StaticImageLoader } from './loaders/StaticImageLoader';
import { CompositeLoader } from './loaders/CompositeLoader';
import { ImageFilter } from './loaders/ImageFilter';
import { buildStyleProperties, applyStylesToElementWithState, applyClassNameToElement, removeClassNameFromElement, StyleProperties } from './utils/styleUtils';
import { injectFunctionalStyles } from './styles/functionalStyles';

export class ImageCloud {
  private containerId: string | null;
  private containerRef: HTMLElement | null;

  // Internal state
  private fullConfig: ImageCloudConfig;
  private imagesLoaded: boolean;
  private imageElements: HTMLImageElement[];
  private imageLayouts: ImageLayout[];
  private currentImageHeight: number;
  private currentFocusIndex: number | null;
  private hoveredImage: { element: HTMLImageElement; layout: ImageLayout } | null;
  private resizeTimeout: number | null;
  private displayQueue: HTMLImageElement[];
  private queueInterval: number | null;
  private loadGeneration: number;

  // Precomputed styling
  private defaultStyles: StyleProperties;
  private defaultClassName: string | string[] | undefined;
  private hoverClassName: string | string[] | undefined;

  // Modules
  private animationEngine: AnimationEngine;
  private entryAnimationEngine: EntryAnimationEngine;
  private idleAnimationEngine: IdleAnimationEngine | null;
  private layoutEngine: LayoutEngine;
  private zoomEngine: ZoomEngine;
  private swipeEngine: SwipeEngine | null;
  private imageLoader: ImageLoader;
  private imageFilter: ImageFilter;

  // User callbacks
  private callbacks: ImageCloudCallbacks;

  // DOM Elements
  private containerEl: HTMLElement | null;
  private loadingEl: HTMLElement | null;
  private errorEl: HTMLElement | null;
  private loadingElAutoCreated: boolean;
  private errorElAutoCreated: boolean;
  private counterEl: HTMLElement | null;
  private counterElAutoCreated: boolean;
  private prevButtonEl: HTMLElement | null;
  private nextButtonEl: HTMLElement | null;
  private ariaLiveEl: HTMLElement | null = null;
  private prevButtonElAutoCreated: boolean;
  private nextButtonElAutoCreated: boolean;

  constructor(options: ImageCloudOptions = {}) {
    this.fullConfig = mergeConfig(options);

    // Container can be a string ID or an HTMLElement reference
    if (options.container instanceof HTMLElement) {
      this.containerRef = options.container;
      this.containerId = null;
    } else {
      this.containerRef = null;
      this.containerId = options.container || 'imageCloud';
    }

    // Store user callbacks
    this.callbacks = options.on ?? {};

    // Internal state
    this.imagesLoaded = false;
    this.imageElements = [];
    this.imageLayouts = [];
    this.currentImageHeight = 225;
    this.currentFocusIndex = null;
    this.hoveredImage = null;
    this.resizeTimeout = null;
    this.displayQueue = [];
    this.queueInterval = null;
    this.loadGeneration = 0;
    this.loadingElAutoCreated = false;
    this.errorElAutoCreated = false;
    this.counterEl = null;
    this.counterElAutoCreated = false;
    this.prevButtonEl = null;
    this.nextButtonEl = null;
    this.prevButtonElAutoCreated = false;
    this.nextButtonElAutoCreated = false;

    // Initialize engines with new config structure
    this.animationEngine = new AnimationEngine(this.fullConfig.animation);
    this.layoutEngine = new LayoutEngine({
      layout: this.fullConfig.layout,
      image: this.fullConfig.image
    });
    this.zoomEngine = new ZoomEngine(this.fullConfig.interaction.focus, this.animationEngine, this.fullConfig.styling);

    // Precompute styling properties
    this.defaultStyles = buildStyleProperties(this.fullConfig.styling?.default);
    this.defaultClassName = this.fullConfig.styling?.default?.className;
    this.hoverClassName = this.fullConfig.styling?.hover?.className;

    // Initialize entry animation engine with layout-aware defaults
    const entryConfig = this.fullConfig.animation.entry || DEFAULT_CONFIG.animation.entry!;
    this.entryAnimationEngine = new EntryAnimationEngine(
      entryConfig as EntryAnimationConfig,
      this.fullConfig.layout.algorithm
    );

    // Initialize idle animation engine if configured
    const idleConfig = this.fullConfig.animation.idle;
    if (idleConfig && idleConfig.type !== 'none') {
      this.idleAnimationEngine = new IdleAnimationEngine(
        idleConfig,
        (entryConfig as EntryAnimationConfig).timing?.duration ?? 600
      );
    } else {
      this.idleAnimationEngine = null;
    }

    // Wire unfocus complete callback to resume idle animations and re-apply hover styles
    this.zoomEngine.setOnUnfocusCompleteCallback((el) => {
      this.idleAnimationEngine?.resumeForImage(el as HTMLImageElement);
      // If the cursor is still over this image, mouseenter won't re-fire — re-apply hover styles.
      // Defer to next frame so the browser updates :hover after the animation finishes.
      const img = el as HTMLImageElement;
      const unfocusIdx = this.imageElements.indexOf(img);
      if (this.callbacks.onImageUnfocus && unfocusIdx !== -1) {
        const urls = this.imageLoader.imageURLs();
        const ctx: ImageStateContext = {
          element: img,
          index: unfocusIdx,
          url: urls[unfocusIdx] ?? '',
          layout: this.imageLayouts[unfocusIdx]
        };
        this.callbacks.onImageUnfocus(ctx);
      }
      requestAnimationFrame(() => {
        if (img.matches(':hover') && this.fullConfig.styling?.hover) {
          const idx = this.imageElements.indexOf(img);
          if (idx !== -1) {
            const imageHeight = img.offsetHeight;
            const cachedWidth = (img as any).cachedRenderedWidth;
            applyStylesToElementWithState(img, this.fullConfig.styling.hover, imageHeight, cachedWidth);
            applyClassNameToElement(img, this.hoverClassName);
            this.hoveredImage = { element: img, layout: this.imageLayouts[idx] };
          }
        }
      });
    });

    // SwipeEngine will be initialized after container is available
    this.swipeEngine = null;

    // Initialize image filter with configured extensions
    this.imageFilter = this.createImageFilter();

    // Initialize image loader based on type
    this.imageLoader = this.createLoader();

    // DOM Elements (will be fetched on init)
    this.containerEl = null;
    this.loadingEl = null;
    this.errorEl = null;
  }

  /**
   * Create image filter based on shared loader config
   */
  private createImageFilter(): ImageFilter {
    const extensions = this.fullConfig.config.loaders?.allowedExtensions;
    return new ImageFilter(extensions);
  }

  /**
   * Create appropriate image loader based on config
   * Processes loaders array, merges shared config, wraps in CompositeLoader if needed
   */
  private createLoader(): ImageLoader {
    const entries = this.fullConfig.loaders;
    const shared = this.fullConfig.config.loaders ?? {};

    if (!entries || entries.length === 0) {
      throw new Error('No loaders configured. Provide `images`, `loaders`, or both.\n  Example: imageCloud({ container: \'id\', images: [\'https://...\'] })');
    }

    const childLoaders = entries.map(entry => this.createLoaderFromEntry(entry, shared));

    if (childLoaders.length === 1) {
      return childLoaders[0];
    }

    return new CompositeLoader({
      loaders: childLoaders,
      debugLogging: this.fullConfig.config.debug?.loaders
    });
  }

  /**
   * Create a single loader from a LoaderEntry, merging shared config
   */
  private createLoaderFromEntry(entry: LoaderEntry, shared: SharedLoaderConfig): ImageLoader {
    if ('static' in entry) {
      const inner = entry.static;
      const merged: StaticLoaderInnerConfig = {
        ...inner,
        validateUrls: inner.validateUrls ?? shared.validateUrls,
        validationTimeout: inner.validationTimeout ?? shared.validationTimeout,
        validationMethod: inner.validationMethod ?? shared.validationMethod,
        allowedExtensions: inner.allowedExtensions ?? shared.allowedExtensions,
        debugLogging: inner.debugLogging ?? this.fullConfig.config.debug?.loaders
      };
      return new StaticImageLoader(merged);
    } else if ('googleDrive' in entry) {
      const inner = entry.googleDrive;
      const merged: GoogleDriveLoaderInnerConfig = {
        ...inner,
        allowedExtensions: inner.allowedExtensions ?? shared.allowedExtensions,
        debugLogging: inner.debugLogging ?? this.fullConfig.config.debug?.loaders
      };
      return new GoogleDriveLoader(merged);
    } else {
      throw new Error(`Unknown loader entry: ${JSON.stringify(entry)}`);
    }
  }

  /**
   * Initialize the gallery
   */
  async init(): Promise<void> {
    try {
      // Inject functional styles (idempotent)
      injectFunctionalStyles();

      // 1. Setup DOM
      if (this.containerRef) {
        this.containerEl = this.containerRef;
      } else {
        this.containerEl = document.getElementById(this.containerId!);
        if (!this.containerEl) {
          throw new Error(`Container "#${this.containerId}" not found. Ensure an element with id="${this.containerId}" exists in the DOM before calling imageCloud().`);
        }
      }

      // Add gallery class for CSS scoping
      this.containerEl.classList.add('fbn-ic-gallery');
      this.containerEl.setAttribute('tabindex', '0');
      this.containerEl.setAttribute('role', 'region');
      this.containerEl.setAttribute('aria-label', 'Image gallery');

      // Initialize swipe engine for touch navigation (guarded by config flag)
      if (this.fullConfig.interaction.navigation?.swipe !== false) {
        this.swipeEngine = new SwipeEngine(this.containerEl, {
          onNext: () => this.navigateToNextImage(),
          onPrev: () => this.navigateToPreviousImage(),
          onDragOffset: (offset) => this.zoomEngine.setDragOffset(offset),
          onDragEnd: (navigated) => {
            if (!navigated) {
              // Snap back to center with animation
              this.zoomEngine.clearDragOffset(true, SNAP_BACK_DURATION_MS);
            } else {
              // Clear offset immediately (navigation handles transition)
              this.zoomEngine.clearDragOffset(false);
            }
          }
        });
      }

      // Create or bind UI elements
      this.setupUI();

      // 2. Setup Event Listeners
      this.setupEventListeners();

      // 3. Load Images
      this.logDebug('ImageCloud initialized');
      await this.loadImages();

    } catch (error) {
      console.error(`ImageCloud initialization failed (container: "${this.containerId ?? 'element'}"):`, error);
      if (this.errorEl && error instanceof Error) {
        this.showError('Gallery failed to initialize: ' + error.message);
      }
    }
  }

  private setupUI(): void {
    const uiConfig = this.fullConfig.ui;

    // Manage focus outline: suppress browser ring by default, restore when showFocusOutline: true
    if (!uiConfig.showFocusOutline) {
      this.containerEl?.classList.add('fbn-ic-suppress-outline');
    } else {
      this.containerEl?.classList.remove('fbn-ic-suppress-outline');
    }

    // Loading element
    if (uiConfig.showLoadingSpinner) {
      if (uiConfig.loadingElement) {
        this.loadingEl = this.resolveElement(uiConfig.loadingElement);
        this.loadingElAutoCreated = false;
      } else {
        this.loadingEl = this.createDefaultLoadingElement();
        this.loadingElAutoCreated = true;
      }
    }

    // Error element
    if (uiConfig.errorElement) {
      this.errorEl = this.resolveElement(uiConfig.errorElement);
      this.errorElAutoCreated = false;
    } else {
      this.errorEl = this.createDefaultErrorElement();
      this.errorElAutoCreated = true;
    }

    // Counter element
    if (uiConfig.showImageCounter) {
      if (uiConfig.counterElement) {
        this.counterEl = this.resolveElement(uiConfig.counterElement);
        this.counterElAutoCreated = false;
      } else {
        this.counterEl = this.createDefaultCounterElement();
        this.counterElAutoCreated = true;
      }
    }

    // Nav button elements
    if (uiConfig.showNavButtons) {
      if (uiConfig.prevButtonElement) {
        this.prevButtonEl = this.resolveElement(uiConfig.prevButtonElement);
        this.prevButtonElAutoCreated = false;
      } else {
        this.prevButtonEl = this.createDefaultPrevButtonElement();
        this.prevButtonElAutoCreated = true;
      }
      if (uiConfig.nextButtonElement) {
        this.nextButtonEl = this.resolveElement(uiConfig.nextButtonElement);
        this.nextButtonElAutoCreated = false;
      } else {
        this.nextButtonEl = this.createDefaultNextButtonElement();
        this.nextButtonElAutoCreated = true;
      }
      this.prevButtonEl?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.navigateToPreviousImage();
      });
      this.nextButtonEl?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.navigateToNextImage();
      });
    }

    // Create aria-live region for screen reader announcements
    this.ariaLiveEl = document.createElement('div');
    this.ariaLiveEl.setAttribute('aria-live', 'polite');
    this.ariaLiveEl.setAttribute('aria-atomic', 'true');
    this.ariaLiveEl.className = 'fbn-ic-sr-only';
    this.containerEl!.appendChild(this.ariaLiveEl);
  }

  private resolveElement(ref: string | HTMLElement): HTMLElement | null {
    if (ref instanceof HTMLElement) return ref;
    return document.getElementById(ref);
  }

  private createDefaultLoadingElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'fbn-ic-loading fbn-ic-hidden';
    const spinner = document.createElement('div');
    spinner.className = 'fbn-ic-spinner';
    el.appendChild(spinner);
    const text = document.createElement('p');
    text.textContent = 'Loading images...';
    el.appendChild(text);
    this.containerEl!.appendChild(el);
    return el;
  }

  private createDefaultErrorElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'fbn-ic-error fbn-ic-hidden';
    this.containerEl!.appendChild(el);
    return el;
  }

  private createDefaultCounterElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'fbn-ic-counter fbn-ic-hidden';
    this.containerEl!.appendChild(el);
    return el;
  }

  private createDefaultPrevButtonElement(): HTMLElement {
    const el = document.createElement('button');
    el.className = 'fbn-ic-nav-btn fbn-ic-nav-btn-prev fbn-ic-hidden';
    el.textContent = '‹';
    el.setAttribute('aria-label', 'Previous image');
    el.setAttribute('tabindex', '-1');
    this.containerEl!.appendChild(el);
    return el;
  }

  private createDefaultNextButtonElement(): HTMLElement {
    const el = document.createElement('button');
    el.className = 'fbn-ic-nav-btn fbn-ic-nav-btn-next fbn-ic-hidden';
    el.textContent = '›';
    el.setAttribute('aria-label', 'Next image');
    el.setAttribute('tabindex', '-1');
    this.containerEl!.appendChild(el);
    return el;
  }

  private setupEventListeners(): void {
    // Keyboard navigation — scoped to container, guarded by config flag
    if (this.fullConfig.interaction.navigation?.keyboard !== false) {
      this.containerEl!.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          this.zoomEngine.unfocusImage();
          this.currentFocusIndex = null;
          this.swipeEngine?.disable();
          this.hideCounter();
          this.hideNavButtons();
          this.hideFocusIndicator();
        } else if (e.key === 'ArrowRight') {
          this.navigateToNextImage();
        } else if (e.key === 'ArrowLeft') {
          this.navigateToPreviousImage();
        } else if ((e.key === 'Enter' || e.key === ' ') && this.hoveredImage) {
          this.handleImageClick(this.hoveredImage.element, this.hoveredImage.layout);
          e.preventDefault();
        }
      });
    }

    document.addEventListener('click', (e: MouseEvent) => {
      // Ignore clicks that follow touch events (prevents unfocus during swipe)
      if (this.swipeEngine?.hadRecentTouch()) {
        return;
      }
      if (!(e.target as HTMLElement).closest('.fbn-ic-image') &&
          !(e.target as HTMLElement).closest('.fbn-ic-nav-btn')) {
        this.zoomEngine.unfocusImage();
        this.currentFocusIndex = null;
        this.swipeEngine?.disable();
        this.hideCounter();
        this.hideNavButtons();
        this.hideFocusIndicator();
      }
    });

    // Resize handler
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Navigate to the next image (Right arrow)
   */
  private navigateToNextImage(): void {
    if (this.currentFocusIndex === null || this.imageElements.length === 0) return;

    const nextId = (this.currentFocusIndex + 1) % this.imageLayouts.length;
    const nextElement = this.imageElements.find(
      el => el.dataset.imageId === String(nextId)
    );
    if (!nextElement) return;

    const layout = this.imageLayouts[nextId];
    if (!layout) return;

    this.currentFocusIndex = nextId;
    this.handleImageClick(nextElement, layout);
    this.updateCounter(nextId);
    this.showNavButtons();
    this.showFocusIndicator();
  }

  /**
   * Navigate to the previous image (Left arrow)
   */
  private navigateToPreviousImage(): void {
    if (this.currentFocusIndex === null || this.imageElements.length === 0) return;

    const prevId = (this.currentFocusIndex - 1 + this.imageLayouts.length) % this.imageLayouts.length;
    const prevElement = this.imageElements.find(
      el => el.dataset.imageId === String(prevId)
    );
    if (!prevElement) return;

    const layout = this.imageLayouts[prevId];
    if (!layout) return;

    this.currentFocusIndex = prevId;
    this.handleImageClick(prevElement, layout);
    this.updateCounter(prevId);
    this.showNavButtons();
    this.showFocusIndicator();
  }

  /**
   * Navigate to a specific image by index
   */
  private handleResize(): void {
    if (!this.imagesLoaded) return;

    if (this.resizeTimeout !== null) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = window.setTimeout(() => {
      const newHeight = this.getImageHeight();

      if (newHeight !== this.currentImageHeight) {
        this.logDebug(`Window resized to new breakpoint (height: ${newHeight}px). Reloading images...`);
        // Reload images with new breakpoint
        this.loadImages();
      } else {
        this.logDebug('Window resized (no breakpoint change)');
      }
    }, 500);
  }

  private getImageHeight(): number {
    const width = window.innerWidth;
    const responsive = this.fullConfig.layout.responsive;

    // Get sizing config for adaptive mode defaults
    const sizing = this.fullConfig.image.sizing;
    const maxSize = sizing?.maxSize ?? 400;

    // Use responsive breakpoints to determine max height
    // These serve as upper bounds for the adaptive sizing
    if (!responsive) {
      // Fallback defaults if responsive not configured
      if (width <= 767) return Math.min(100, maxSize);
      if (width <= 1199) return Math.min(180, maxSize);
      return Math.min(225, maxSize);
    }

    if (width <= responsive.mobile.maxWidth) {
      return Math.min(100, maxSize);  // Mobile
    }
    if (width <= responsive.tablet.maxWidth) {
      return Math.min(180, maxSize);  // Tablet
    }
    return Math.min(225, maxSize);  // Screen (desktop)
  }

  /**
   * Get container bounds for layout calculations
   */
  private getContainerBounds(): { width: number; height: number } {
    if (!this.containerEl) {
      return { width: window.innerWidth, height: window.innerHeight * 0.7 };
    }
    return {
      width: this.containerEl.offsetWidth,
      height: this.containerEl.offsetHeight || window.innerHeight * 0.7
    };
  }

  /**
   * Load images using the unified loader interface
   */
  private async loadImages(): Promise<void> {
    try {
      this.showLoading(true);
      this.hideError();
      this.clearImageCloud();

      // Prepare the loader (show spinner during this)
      await this.imageLoader.prepare(this.imageFilter);

      // Get image count and URLs from loader
      const imageCount = this.imageLoader.imagesLength();
      let imageUrls = this.imageLoader.imageURLs();

      if (imageCount === 0) {
        this.showError('No images found.');
        this.showLoading(false);
        return;
      }

      // Calculate adaptive sizing based on container and image count
      const containerBounds = this.getContainerBounds();
      const responsiveHeight = this.getImageHeight();
      const viewportWidth = window.innerWidth;

      this.logDebug(`Adaptive sizing input: container=${containerBounds.width}x${containerBounds.height}px, images=${imageCount}, responsiveMax=${responsiveHeight}px`);

      const sizingResult = this.layoutEngine.calculateAdaptiveSize(
        containerBounds,
        imageCount,
        responsiveHeight,
        viewportWidth
      );

      this.logDebug(`Adaptive sizing result: height=${sizingResult.height}px`);

      await this.createImageCloud(imageUrls, sizingResult.height);

      this.showLoading(false);
      this.imagesLoaded = true;

    } catch (error) {
      console.error('Error loading images:', error);
      if (error instanceof Error) {
        this.showError(error.message || 'Failed to load images.');
      }
      this.showLoading(false);
    }
  }

  /**
   * Helper for debug logging
   */
  private logDebug(...args: unknown[]): void {
    if (this.fullConfig.config.debug?.enabled && typeof console !== 'undefined') {
      console.log(...args);
    }
  }

  private async createImageCloud(imageUrls: string[], imageHeight: number): Promise<void> {
    if (!this.containerEl) return;

    const containerBounds = this.getContainerBounds();
    this.currentImageHeight = imageHeight;

    // Capture current generation to detect stale callbacks
    const currentGeneration = this.loadGeneration;

    // Generate layout
    const layouts = this.layoutEngine.generateLayout(imageUrls.length, containerBounds, { fixedHeight: imageHeight } as any);
    this.imageLayouts = layouts;

    if (this.callbacks.onLayoutComplete) {
      const ctx: LayoutCompleteContext = {
        layouts:         [...layouts],  // shallow copy — caller should not mutate
        containerBounds: { ...containerBounds },
        algorithm:       this.fullConfig.layout.algorithm,
        imageCount:      imageUrls.length,
      };
      this.callbacks.onLayoutComplete(ctx);
    }

    this.displayQueue = [];
    let processedCount = 0;
    let loadedCount = 0;
    let failedCount = 0;
    let firstSrcSetTime = 0;
    let galleryReadyFired = false;
    const srcSetTimes = new Map<number, number>();

    const fireGalleryReady = () => {
      if (galleryReadyFired || currentGeneration !== this.loadGeneration) return;
      if (!this.callbacks.onGalleryReady) return;
      galleryReadyFired = true;
      const ctx: GalleryReadyContext = {
        totalImages: imageUrls.length,
        failedImages: failedCount,
        loadDuration: firstSrcSetTime > 0 ? performance.now() - firstSrcSetTime : 0,
      };
      this.callbacks.onGalleryReady(ctx);
    };

    const checkGalleryReady = () => {
      if (processedCount >= imageUrls.length && this.displayQueue.length === 0) {
        fireGalleryReady();
      }
    };

    // Helper to display a single image with animation
    const displayImage = (img: HTMLImageElement) => {
      if (!this.containerEl) return;

      this.containerEl.appendChild(img);
      this.imageElements.push(img);

      requestAnimationFrame(async () => {
        void img.offsetWidth; // Force reflow
        // Use configured default opacity, or 1 if not specified
        img.style.opacity = this.defaultStyles.opacity ?? '1';

        const imgIndex = parseInt(img.dataset.imageId || '0');
        const layout = this.imageLayouts[imgIndex];
        const timing = this.entryAnimationEngine.getTiming();
        const entryStartTime = performance.now();

        // Parse animation data (always available since img.onload stores it unconditionally)
        const fromX        = parseFloat(img.dataset.startX   || '0');
        const fromY        = parseFloat(img.dataset.startY   || '0');
        const toX          = parseFloat(img.dataset.endX     || '0');
        const toY          = parseFloat(img.dataset.endY     || '0');
        const toRotation   = parseFloat(img.dataset.rotation || '0');
        const toScale      = parseFloat(img.dataset.scale    || '1');
        const fromRotation = parseFloat(img.dataset.startRotation || img.dataset.rotation || '0');
        const fromScale    = parseFloat(img.dataset.startScale    || img.dataset.scale    || '1');
        const imageWidth   = parseFloat(img.dataset.imageWidth  || '0');
        const imageHeight  = parseFloat(img.dataset.imageHeight || '0');

        // Fire onEntryStart
        if (this.callbacks.onEntryStart && layout) {
          const ctx: EntryStartContext = {
            element:     img,
            index:       imgIndex,
            totalImages: this.imageLayouts.length,
            layout,
            from: { x: fromX, y: fromY, rotation: fromRotation, scale: fromScale },
            to:   { x: toX,   y: toY,   rotation: toRotation,   scale: toScale   },
            startTime: entryStartTime,
            duration:  timing.duration,
          };
          this.callbacks.onEntryStart(ctx);
        }

        // Check if we need JS animation for path type, rotation, or scale
        const needsJSAnimation =
          this.entryAnimationEngine.requiresJSAnimation() ||
          this.entryAnimationEngine.requiresJSRotation() ||
          this.entryAnimationEngine.requiresJSScale() ||
          img.dataset.startRotation !== img.dataset.rotation ||
          img.dataset.startScale    !== img.dataset.scale;

        if (needsJSAnimation) {
          // Use animatePath for bounce, elastic, wave paths or rotation/scale animation
          animatePath({
            element:       img,
            startPosition: { x: fromX, y: fromY },
            endPosition:   { x: toX,   y: toY   },
            pathConfig:    this.entryAnimationEngine.getPathConfig(),
            duration:      timing.duration,
            imageWidth,
            imageHeight,
            rotation:      toRotation,
            scale:         toScale,
            rotationConfig: this.entryAnimationEngine.getRotationConfig(),
            startRotation:  fromRotation,
            scaleConfig:    this.entryAnimationEngine.getScaleConfig(),
            startScale:     fromScale,
            onProgress: this.callbacks.onEntryProgress && layout ? (t, elapsed, current) => {
              const ctx: EntryProgressContext = {
                element:     img,
                index:       imgIndex,
                totalImages: this.imageLayouts.length,
                layout,
                from: { x: fromX, y: fromY, rotation: fromRotation, scale: fromScale },
                to:   { x: toX,   y: toY,   rotation: toRotation,   scale: toScale   },
                startTime:   entryStartTime,
                duration:    timing.duration,
                progress:    t,
                rawProgress: t,
                elapsed,
                current,
              };
              this.callbacks.onEntryProgress!(ctx);
            } : undefined,
            onComplete: layout ? () => {
              if (this.callbacks.onEntryComplete) {
                const ctx: EntryCompleteContext = {
                  element:   img,
                  index:     imgIndex,
                  layout,
                  startTime: entryStartTime,
                  endTime:   performance.now(),
                  duration:  timing.duration,
                };
                this.callbacks.onEntryComplete(ctx);
              }
            } : undefined,
          });
        } else {
          // Use CSS transition for linear paths without rotation animation
          const finalTransform = img.dataset.finalTransform || '';
          img.style.transform = finalTransform;

          // Fire onEntryComplete when the transform transition ends
          if (this.callbacks.onEntryComplete && layout) {
            const handleTransitionEnd = (e: TransitionEvent) => {
              if (e.propertyName !== 'transform') return;
              img.removeEventListener('transitionend', handleTransitionEnd);
              const ctx: EntryCompleteContext = {
                element:   img,
                index:     imgIndex,
                layout,
                startTime: entryStartTime,
                endTime:   performance.now(),
                duration:  timing.duration,
              };
              this.callbacks.onEntryComplete!(ctx);
            };
            img.addEventListener('transitionend', handleTransitionEnd);
          }
        }

        // Debug: log final state for first few images
        if (this.fullConfig.config.debug?.enabled && imgIndex < 3) {
          const finalTransform = img.dataset.finalTransform || '';
          console.log(`Image ${imgIndex} final state:`, {
            left: img.style.left,
            top: img.style.top,
            width: img.style.width,
            height: img.style.height,
            computedWidth: img.offsetWidth,
            computedHeight: img.offsetHeight,
            transform: finalTransform,
            pathType: this.entryAnimationEngine.getPathType()
          });
        }

        // Register with idle animation engine (starts after entry completes)
        if (this.idleAnimationEngine) {
          const entryDuration = this.entryAnimationEngine.getTiming().duration;
          this.idleAnimationEngine.register(img, imgIndex, this.imageElements.length, entryDuration);
        }
      });

      processedCount++;
      checkGalleryReady();
    };

    const startQueueProcessing = () => {
      this.logDebug('Starting queue processing, enabled:', this.fullConfig.animation.queue.enabled);

      // If queue is disabled, display all images immediately
      if (!this.fullConfig.animation.queue.enabled) {
        while (this.displayQueue.length > 0) {
          const img = this.displayQueue.shift();
          if (img) {
            displayImage(img);
          }
        }
        return;
      }

      // Queue is enabled - stagger images with interval
      // Clear any existing interval before creating new one
      if (this.queueInterval !== null) {
        clearInterval(this.queueInterval);
      }
      this.queueInterval = window.setInterval(() => {
        // Check if this interval is still valid (generation hasn't changed)
        if (currentGeneration !== this.loadGeneration) {
          if (this.queueInterval !== null) {
            clearInterval(this.queueInterval);
            this.queueInterval = null;
          }
          return;
        }

        if (this.displayQueue.length > 0) {
          const img = this.displayQueue.shift();
          if (img) {
            displayImage(img);
          }
        }

        if (processedCount >= imageUrls.length && this.displayQueue.length === 0) {
          if (this.queueInterval !== null) {
            clearInterval(this.queueInterval);
            this.queueInterval = null;
          }
          fireGalleryReady();
        }
      }, this.fullConfig.animation.queue.interval);
    };

    // Visibility Check
    if ('IntersectionObserver' in window && this.containerEl) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            startQueueProcessing();
            observer.disconnect();
          }
        });
      }, { threshold: 0.1, rootMargin: '50px' });
      observer.observe(this.containerEl);
    } else {
      startQueueProcessing();
    }

    // Debug: Draw center markers if debug.centers is enabled
    if (this.fullConfig.config.debug?.centers && this.containerEl) {
      // Remove any existing debug markers
      this.containerEl.querySelectorAll('.fbn-ic-debug-center').forEach(el => el.remove());

      layouts.forEach((layout, index) => {
        const marker = document.createElement('div');
        marker.className = 'fbn-ic-debug-center';
        marker.style.position = 'absolute';
        marker.style.width = '12px';
        marker.style.height = '12px';
        marker.style.borderRadius = '50%';
        marker.style.backgroundColor = 'red';
        marker.style.border = '2px solid yellow';
        marker.style.zIndex = '9999';
        marker.style.pointerEvents = 'none';
        // Center position: layout.x and layout.y now store the center position directly
        const centerX = layout.x;
        const centerY = layout.y;
        marker.style.left = `${centerX - 6}px`;  // Offset by half marker size
        marker.style.top = `${centerY - 6}px`;
        marker.title = `Image ${index}: center (${Math.round(centerX)}, ${Math.round(centerY)})`;
        this.containerEl!.appendChild(marker);
      });
    }

    // Create elements
    imageUrls.forEach((url, index) => {
      const img = document.createElement('img');
      // NOTE: img.src is set AFTER onload handler to ensure handler catches cached images
      img.referrerPolicy = 'no-referrer';
      img.classList.add('fbn-ic-image');
      if (this.fullConfig.interaction.dragging === false) {
        img.draggable = false;
      }
      img.dataset.imageId = String(index);
      img.dataset.createdFlag = 'true';  // Debug flag

      const layout = layouts[index];
      img.style.position = 'absolute';
      img.style.width = 'auto';
      img.style.height = `${imageHeight}px`;
      img.style.left = `${layout.x}px`;
      img.style.top = `${layout.y}px`;
      // Transform will be applied in onload after we know the actual dimensions

      if (layout.zIndex) img.style.zIndex = String(layout.zIndex);

      // NOTE: Default styling will be applied in onload after image dimensions are known
      // This ensures height-relative clip-path is calculated correctly with proper width
      // Element starts with opacity 0 so it's not visible until onload completes
      applyClassNameToElement(img, this.defaultClassName);

      // Hover event handlers
      // Use isInvolved() to prevent hover styles on images that are focused or animating
      img.addEventListener('mouseenter', () => {
        this.hoveredImage = { element: img, layout };
        if (!this.zoomEngine.isInvolved(img)) {
          // Use cached rendered width for consistent clip-path centering (prevents shifting)
          const cachedWidth = (img as any).cachedRenderedWidth;
          applyStylesToElementWithState(img, this.fullConfig.styling?.hover, imageHeight, cachedWidth);
          applyClassNameToElement(img, this.hoverClassName);
        }
        if (this.callbacks.onImageHover) {
          const ctx: ImageStateContext = { element: img, index, url, layout };
          this.callbacks.onImageHover(ctx);
        }
      });

      img.addEventListener('mouseleave', () => {
        this.hoveredImage = null;
        if (!this.zoomEngine.isInvolved(img)) {
          // Use cached rendered width for consistent clip-path centering (prevents shifting)
          const cachedWidth = (img as any).cachedRenderedWidth;
          applyStylesToElementWithState(img, this.fullConfig.styling?.default, imageHeight, cachedWidth);
          removeClassNameFromElement(img, this.hoverClassName);
          applyClassNameToElement(img, this.defaultClassName);
        }
        if (this.callbacks.onImageUnhover) {
          const ctx: ImageStateContext = { element: img, index, url, layout };
          this.callbacks.onImageUnhover(ctx);
        }
      });

      img.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        this.handleImageClick(img, layout);
      });

      img.style.opacity = '0';
      img.style.transition = this.entryAnimationEngine.getTransitionCSS();

      img.onload = () => {
        // Ignore if generation has changed (stale callback from previous load)
        if (currentGeneration !== this.loadGeneration) {
          return;
        }

        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const renderedWidth = imageHeight * aspectRatio;

        // Debug: mark that onload was called
        img.dataset.onloadCalled = 'true';
        if ((window as any).DEBUG_CLIPPATH) {
          console.log(`[onload #${index}] Called with imageHeight=${imageHeight}, renderedWidth=${renderedWidth}`);
        }

        // Set explicit width so transform calculations are accurate
        img.style.width = `${renderedWidth}px`;

        // Store rendered width and aspect ratio on element for use in event handlers and focused state
        (img as any).cachedRenderedWidth = renderedWidth;
        (img as any).aspectRatio = aspectRatio;

        // Reapply default styling with correct width for height-relative clip-path centering
        // Now we know both height and the rendered width (from aspect ratio)
        applyStylesToElementWithState(img, this.fullConfig.styling?.default, imageHeight, renderedWidth);

        // Use EntryAnimationEngine for start position calculation
        const finalPosition = { x: layout.x, y: layout.y };
        const imageSize = { width: renderedWidth, height: imageHeight };

        const startPosition = this.entryAnimationEngine.calculateStartPosition(
          finalPosition,
          imageSize,
          containerBounds,
          index,
          imageUrls.length
        );

        // Calculate start rotation based on entry rotation config
        const startRotation = this.entryAnimationEngine.calculateStartRotation(layout.rotation);

        // Calculate start scale based on entry scale config
        const startScale = this.entryAnimationEngine.calculateStartScale(layout.scale);

        const finalTransform = this.entryAnimationEngine.buildFinalTransform(
          layout.rotation,
          layout.scale,
          renderedWidth,
          imageHeight
        );
        const startTransform = this.entryAnimationEngine.buildStartTransform(
          startPosition,
          finalPosition,
          layout.rotation,
          layout.scale,
          renderedWidth,
          imageHeight,
          startRotation,
          startScale
        );

        if (this.fullConfig.config.debug?.enabled && index < 3) {
          console.log(`Image ${index}:`, {
            finalPosition,
            imageSize,
            left: layout.x,
            top: layout.y,
            finalTransform,
            renderedWidth,
            renderedHeight: imageHeight
          });
        }

        img.style.transform = startTransform;
        img.dataset.finalTransform = finalTransform;

        // Always store animation data so entry hooks and displayImage can access it
        img.dataset.startX = String(startPosition.x);
        img.dataset.startY = String(startPosition.y);
        img.dataset.endX = String(finalPosition.x);
        img.dataset.endY = String(finalPosition.y);
        img.dataset.imageWidth = String(renderedWidth);
        img.dataset.imageHeight = String(imageHeight);
        img.dataset.rotation = String(layout.rotation);
        img.dataset.scale = String(layout.scale);
        img.dataset.startRotation = String(startRotation);
        img.dataset.startScale = String(startScale);

        loadedCount++;
        if (this.callbacks.onImageLoaded) {
          const ctx: ImageLoadedContext = {
            element: img,
            url,
            index,
            totalImages: imageUrls.length,
            loadTime: performance.now() - (srcSetTimes.get(index) ?? performance.now()),
          };
          this.callbacks.onImageLoaded(ctx);
        }
        if (this.callbacks.onLoadProgress) {
          const ctx: LoadProgressContext = {
            loaded: loadedCount,
            failed: failedCount,
            total: imageUrls.length,
            percent: (loadedCount + failedCount) / imageUrls.length * 100,
          };
          this.callbacks.onLoadProgress(ctx);
        }

        this.displayQueue.push(img);
      };

      const handleImageError = () => {
        if (currentGeneration !== this.loadGeneration) return;
        failedCount++;
        if (this.callbacks.onImageError) {
          const ctx: ImageErrorContext = { url, index, totalImages: imageUrls.length };
          this.callbacks.onImageError(ctx);
        }
        if (this.callbacks.onLoadProgress) {
          const ctx: LoadProgressContext = {
            loaded: loadedCount,
            failed: failedCount,
            total: imageUrls.length,
            percent: (loadedCount + failedCount) / imageUrls.length * 100,
          };
          this.callbacks.onLoadProgress(ctx);
        }
        processedCount++;
        checkGalleryReady();
      };

      img.onerror = () => handleImageError();

      // Set src AFTER onload handler to ensure it catches cached images.
      // Wrapped in async IIFE to support onBeforeImageLoad (which may be async).
      (async () => {
        let effectiveUrl = url;

        if (this.callbacks.onBeforeImageLoad) {
          const beforeCtx: BeforeLoadContext = { url, index, totalImages: imageUrls.length };
          const result: BeforeLoadResult | void = await this.callbacks.onBeforeImageLoad(beforeCtx);
          if (result) {
            if (result.fetch !== undefined) {
              // Fetch mode: retrieve image via fetch() and create a blob URL
              const fetchUrl = result.url ?? url;
              try {
                const response = await fetch(fetchUrl, result.fetch);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                effectiveUrl = blobUrl;
                // Wrap onload to revoke blob URL after the image is decoded
                const origOnload = img.onload;
                img.onload = (e) => {
                  URL.revokeObjectURL(blobUrl);
                  (origOnload as ((e: Event) => void) | null)?.call(img, e);
                };
              } catch {
                handleImageError();
                return;
              }
            } else if (result.url) {
              effectiveUrl = result.url;
            }
          }
        }

        if (firstSrcSetTime === 0) firstSrcSetTime = performance.now();
        srcSetTimes.set(index, performance.now());
        img.src = effectiveUrl;
      })();
    });
  }

  private async handleImageClick(imageElement: HTMLImageElement, originalLayout: ImageLayout): Promise<void> {
    if (!this.containerEl) return;

    const isFocused = this.zoomEngine.isFocused(imageElement);
    const bounds: ContainerBounds = {
      width: this.containerEl.offsetWidth,
      height: this.containerEl.offsetHeight
    };

    if (isFocused) {
      await this.zoomEngine.unfocusImage();
      this.currentFocusIndex = null;
      this.swipeEngine?.disable();
      this.hideCounter();
      this.hideNavButtons();
      this.hideFocusIndicator();
    } else {
      // Pause idle animation immediately before focus animation begins
      this.idleAnimationEngine?.pauseForImage(imageElement);

      // Track the focused image index for keyboard navigation
      const imageId = imageElement.dataset.imageId;
      this.currentFocusIndex = imageId !== undefined ? parseInt(imageId, 10) : null;
      this.swipeEngine?.enable();
      this.containerEl?.focus({ preventScroll: true });
      await this.zoomEngine.focusImage(imageElement, bounds, originalLayout);
      if (this.currentFocusIndex !== null) {
        this.updateCounter(this.currentFocusIndex);
      }
      this.showNavButtons();
      this.showFocusIndicator();
      if (this.callbacks.onImageFocus && this.currentFocusIndex !== null) {
        const urls = this.imageLoader.imageURLs();
        const ctx: ImageStateContext = {
          element: imageElement,
          index: this.currentFocusIndex,
          url: urls[this.currentFocusIndex] ?? '',
          layout: originalLayout
        };
        this.callbacks.onImageFocus(ctx);
      }
    }
  }

  /**
   * Clear the image cloud and reset state
   */
  clearImageCloud(): void {
    // Clear queue processing interval to prevent stale images from being added
    if (this.queueInterval !== null) {
      clearInterval(this.queueInterval);
      this.queueInterval = null;
    }
    // Increment generation to invalidate pending image onload handlers
    this.loadGeneration++;
    this.displayQueue = [];

    this.hideFocusIndicator();

    if (this.containerEl) {
      this.containerEl.querySelectorAll('.fbn-ic-image, .fbn-ic-debug-center').forEach(el => el.remove());
    }
    this.imageElements = [];
    this.imageLayouts = [];
    this.currentFocusIndex = null;
    this.hoveredImage = null;
    this.layoutEngine.reset();
    this.zoomEngine.reset();
    this.idleAnimationEngine?.stopAll();
    this.imagesLoaded = false;
  }

  private showLoading(show: boolean): void {
    if (!this.fullConfig.ui.showLoadingSpinner || !this.loadingEl) return;
    if (show) {
      this.loadingEl.classList.remove('fbn-ic-hidden');
    } else {
      this.loadingEl.classList.add('fbn-ic-hidden');
    }
  }

  private showError(message: string): void {
    if (!this.errorEl) return;
    this.errorEl.textContent = message;
    this.errorEl.classList.remove('fbn-ic-hidden');
  }

  private hideError(): void {
    if (this.errorEl) {
      this.errorEl.classList.add('fbn-ic-hidden');
    }
  }

  private updateCounter(index: number): void {
    if (!this.fullConfig.ui.showImageCounter || !this.counterEl) return;
    this.counterEl.textContent = `${index + 1} of ${this.imageElements.length}`;
    this.counterEl.classList.remove('fbn-ic-hidden');
  }

  private hideCounter(): void {
    if (this.counterEl) {
      this.counterEl.classList.add('fbn-ic-hidden');
    }
  }

  private showFocusIndicator(): void {
    this.containerEl?.classList.add('fbn-ic-has-focus');
  }

  private hideFocusIndicator(): void {
    this.containerEl?.classList.remove('fbn-ic-has-focus');
  }

  private showNavButtons(): void {
    this.prevButtonEl?.classList.remove('fbn-ic-hidden');
    this.nextButtonEl?.classList.remove('fbn-ic-hidden');
  }

  private hideNavButtons(): void {
    this.prevButtonEl?.classList.add('fbn-ic-hidden');
    this.nextButtonEl?.classList.add('fbn-ic-hidden');
  }

  /**
   * Destroy the gallery and clean up resources
   */
  destroy(): void {
    this.clearImageCloud();
    // Remove auto-created UI elements
    if (this.loadingElAutoCreated && this.loadingEl) {
      this.loadingEl.remove();
      this.loadingEl = null;
    }
    if (this.errorElAutoCreated && this.errorEl) {
      this.errorEl.remove();
      this.errorEl = null;
    }
    if (this.counterElAutoCreated && this.counterEl) {
      this.counterEl.remove();
      this.counterEl = null;
    }
    if (this.prevButtonElAutoCreated && this.prevButtonEl) {
      this.prevButtonEl.remove();
      this.prevButtonEl = null;
    }
    if (this.nextButtonElAutoCreated && this.nextButtonEl) {
      this.nextButtonEl.remove();
      this.nextButtonEl = null;
    }
    // Remove event listeners
    if (this.resizeTimeout !== null) {
      clearTimeout(this.resizeTimeout);
    }
    this.swipeEngine?.destroy();
    this.idleAnimationEngine?.stopAll();
    this.idleAnimationEngine = null;
  }
}
