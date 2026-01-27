/**
 * ImageCloud.ts
 * Main application class
 * Manages initialization and coordination of the interactive image cloud
 */

import type { ImageCloudOptions, ImageCloudConfig, ImageLayout, ContainerBounds, ImageLoader, EntryAnimationConfig } from './config/types';
import { mergeConfig, DEFAULT_CONFIG } from './config/defaults';
import { AnimationEngine } from './engines/AnimationEngine';
import { EntryAnimationEngine } from './engines/EntryAnimationEngine';
import { LayoutEngine } from './engines/LayoutEngine';
import { ZoomEngine } from './engines/ZoomEngine';
import { animatePath } from './engines/PathAnimator';
import { GoogleDriveLoader } from './loaders/GoogleDriveLoader';
import { StaticImageLoader } from './loaders/StaticImageLoader';
import { CompositeLoader } from './loaders/CompositeLoader';
import { ImageFilter } from './loaders/ImageFilter';
import { buildStyleProperties, applyStylesToElement, applyClassNameToElement, removeClassNameFromElement, StyleProperties } from './utils/styleUtils';

export class ImageCloud {
  private containerId: string;

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
  private hoverStyles: StyleProperties;
  private defaultClassName: string | string[] | undefined;
  private hoverClassName: string | string[] | undefined;

  // Modules
  private animationEngine: AnimationEngine;
  private entryAnimationEngine: EntryAnimationEngine;
  private layoutEngine: LayoutEngine;
  private zoomEngine: ZoomEngine;
  private imageLoader: ImageLoader;
  private imageFilter: ImageFilter;

  // DOM Elements
  private containerEl: HTMLElement | null;
  private loadingEl: HTMLElement | null;
  private errorEl: HTMLElement | null;

  constructor(options: ImageCloudOptions = {}) {
    this.fullConfig = mergeConfig(options);
    this.containerId = options.container || 'imageCloud';

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

    // Initialize engines with new config structure
    this.animationEngine = new AnimationEngine(this.fullConfig.animation);
    this.layoutEngine = new LayoutEngine({
      layout: this.fullConfig.layout,
      image: this.fullConfig.image,
      breakpoints: this.fullConfig.rendering.responsive.breakpoints
    });
    this.zoomEngine = new ZoomEngine(this.fullConfig.interaction.focus, this.animationEngine, this.fullConfig.styling);

    // Precompute styling properties
    this.defaultStyles = buildStyleProperties(this.fullConfig.styling?.default);
    this.hoverStyles = buildStyleProperties(this.fullConfig.styling?.hover);
    this.defaultClassName = this.fullConfig.styling?.default?.className;
    this.hoverClassName = this.fullConfig.styling?.hover?.className;

    // Initialize entry animation engine with layout-aware defaults
    const entryConfig = this.fullConfig.animation.entry || DEFAULT_CONFIG.animation.entry!;
    this.entryAnimationEngine = new EntryAnimationEngine(
      entryConfig as EntryAnimationConfig,
      this.fullConfig.layout.algorithm
    );

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
   * Create image filter based on config
   */
  private createImageFilter(): ImageFilter {
    const loaderType = this.fullConfig.loader.type;

    // Get extensions from the appropriate loader config
    let extensions: string[] | undefined;
    if (loaderType === 'googleDrive') {
      extensions = this.fullConfig.loader.googleDrive?.allowedExtensions;
    } else {
      extensions = this.fullConfig.loader.static?.allowedExtensions;
    }

    return new ImageFilter(extensions);
  }

  /**
   * Create appropriate image loader based on config
   */
  private createLoader(): ImageLoader {
    return this.createLoaderFromConfig(this.fullConfig.loader);
  }

  /**
   * Create a loader from a LoaderConfig object (supports recursive composite loaders)
   */
  private createLoaderFromConfig(config: typeof this.fullConfig.loader): ImageLoader {
    const loaderType = config.type;

    if (loaderType === 'static') {
      const staticConfig = config.static!;
      return new StaticImageLoader(staticConfig);
    } else if (loaderType === 'composite') {
      const compositeConfig = config.composite!;
      const childLoaders = compositeConfig.loaders.map(loaderConfig =>
        this.createLoaderFromConfig(loaderConfig)
      );
      return new CompositeLoader({
        loaders: childLoaders,
        debugLogging: compositeConfig.debugLogging
      });
    } else {
      const driveConfig = config.googleDrive!;
      return new GoogleDriveLoader(driveConfig);
    }
  }

  /**
   * Initialize the gallery
   */
  async init(): Promise<void> {
    try {
      // 1. Setup DOM
      this.containerEl = document.getElementById(this.containerId);
      if (!this.containerEl) {
        throw new Error(`Container #${this.containerId} not found`);
      }

      // Add gallery class for CSS scoping
      this.containerEl.classList.add('fbn-ic-gallery');

      // Create or bind UI elements
      this.setupUI();

      // 2. Setup Event Listeners
      this.setupEventListeners();

      // 3. Load Images
      this.logDebug('ImageCloud initialized');
      await this.loadImages();

    } catch (error) {
      console.error('Gallery initialization failed:', error);
      if (this.errorEl && error instanceof Error) {
        this.showError('Gallery failed to initialize: ' + error.message);
      }
    }
  }

  private setupUI(): void {
    // Look for existing elements or create them
    this.loadingEl = document.getElementById('loading');
    this.errorEl = document.getElementById('error');
  }

  private setupEventListeners(): void {
    // Global keyboard events
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.zoomEngine.unfocusImage();
        this.currentFocusIndex = null;
      } else if (e.key === 'ArrowRight') {
        this.navigateToNextImage();
      } else if (e.key === 'ArrowLeft') {
        this.navigateToPreviousImage();
      } else if ((e.key === 'Enter' || e.key === ' ') && this.hoveredImage) {
        // Focus the hovered image (works whether or not another image is focused)
        this.handleImageClick(this.hoveredImage.element, this.hoveredImage.layout);
        e.preventDefault(); // Prevent space from scrolling the page
      }
    });

    document.addEventListener('click', (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.fbn-ic-image')) {
        this.zoomEngine.unfocusImage();
        this.currentFocusIndex = null;
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

    const nextIndex = (this.currentFocusIndex + 1) % this.imageElements.length;
    this.navigateToImage(nextIndex);
  }

  /**
   * Navigate to the previous image (Left arrow)
   */
  private navigateToPreviousImage(): void {
    if (this.currentFocusIndex === null || this.imageElements.length === 0) return;

    const prevIndex = (this.currentFocusIndex - 1 + this.imageElements.length) % this.imageElements.length;
    this.navigateToImage(prevIndex);
  }

  /**
   * Navigate to a specific image by index
   */
  private async navigateToImage(index: number): Promise<void> {
    if (index < 0 || index >= this.imageElements.length) return;

    const imageElement = this.imageElements[index];
    const layout = this.imageLayouts[index];

    if (!imageElement || !layout) return;

    // Reuse the same focus mechanism as clicking
    await this.handleImageClick(imageElement, layout);
  }

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
    const heights = this.fullConfig.layout.sizing.responsive || [];
    for (const bh of heights) {
      if (width >= bh.minWidth) {
        return bh.height;
      }
    }
    return 120; // Fallback
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
    if (this.fullConfig.debug && typeof console !== 'undefined') {
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

    this.displayQueue = [];
    let processedCount = 0;

    // Helper to display a single image with animation
    const displayImage = (img: HTMLImageElement) => {
      if (!this.containerEl) return;

      this.containerEl.appendChild(img);
      this.imageElements.push(img);

      requestAnimationFrame(() => {
        void img.offsetWidth; // Force reflow
        // Use configured default opacity, or 1 if not specified
        img.style.opacity = this.defaultStyles.opacity ?? '1';

        // Check if we need JS animation for path type, rotation, or scale
        const needsJSAnimation = img.dataset.startX &&
          (this.entryAnimationEngine.requiresJSAnimation() ||
           this.entryAnimationEngine.requiresJSRotation() ||
           this.entryAnimationEngine.requiresJSScale() ||
           img.dataset.startRotation !== img.dataset.rotation ||
           img.dataset.startScale !== img.dataset.scale);

        if (needsJSAnimation) {
          // Use animatePath for bounce, elastic, wave paths or rotation/scale animation
          const startPosition = {
            x: parseFloat(img.dataset.startX!),
            y: parseFloat(img.dataset.startY!)
          };
          const endPosition = {
            x: parseFloat(img.dataset.endX!),
            y: parseFloat(img.dataset.endY!)
          };
          const imageWidth = parseFloat(img.dataset.imageWidth!);
          const imageHeight = parseFloat(img.dataset.imageHeight!);
          const rotation = parseFloat(img.dataset.rotation!);
          const scale = parseFloat(img.dataset.scale!);
          const startRotation = img.dataset.startRotation
            ? parseFloat(img.dataset.startRotation)
            : rotation;
          const startScale = img.dataset.startScale
            ? parseFloat(img.dataset.startScale)
            : scale;
          const timing = this.entryAnimationEngine.getTiming();

          animatePath({
            element: img,
            startPosition,
            endPosition,
            pathConfig: this.entryAnimationEngine.getPathConfig(),
            duration: timing.duration,
            imageWidth,
            imageHeight,
            rotation,
            scale,
            rotationConfig: this.entryAnimationEngine.getRotationConfig(),
            startRotation,
            scaleConfig: this.entryAnimationEngine.getScaleConfig(),
            startScale
          });
        } else {
          // Use CSS transition for linear/arc paths without rotation animation
          const finalTransform = img.dataset.finalTransform || '';
          img.style.transform = finalTransform;
        }

        // Debug: log final state for first few images
        const imgIndex = parseInt(img.dataset.imageId || '0');
        if (this.fullConfig.debug && imgIndex < 3) {
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
      });

      processedCount++;
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

    // Debug: Draw center markers if debugCenters is enabled
    if (this.fullConfig.layout.debugCenters && this.containerEl) {
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
      img.dataset.imageId = String(index);

      const layout = layouts[index];
      img.style.position = 'absolute';
      img.style.width = 'auto';
      img.style.height = `${imageHeight}px`;
      img.style.left = `${layout.x}px`;
      img.style.top = `${layout.y}px`;
      // Transform will be applied in onload after we know the actual dimensions

      // Apply layout-specified border only if no styling config border is set
      if (layout.borderColor && !this.fullConfig.styling?.default?.border) {
        img.style.border = `5px solid ${layout.borderColor}`;
        img.style.boxSizing = 'border-box';
      }
      if (layout.zIndex) img.style.zIndex = String(layout.zIndex);

      // Apply default styling state
      applyStylesToElement(img, this.defaultStyles);
      applyClassNameToElement(img, this.defaultClassName);

      // Hover event handlers
      // Use isInvolved() to prevent hover styles on images that are focused or animating
      img.addEventListener('mouseenter', () => {
        this.hoveredImage = { element: img, layout };
        if (!this.zoomEngine.isInvolved(img)) {
          applyStylesToElement(img, this.hoverStyles);
          applyClassNameToElement(img, this.hoverClassName);
        }
      });

      img.addEventListener('mouseleave', () => {
        this.hoveredImage = null;
        if (!this.zoomEngine.isInvolved(img)) {
          applyStylesToElement(img, this.defaultStyles);
          removeClassNameFromElement(img, this.hoverClassName);
          applyClassNameToElement(img, this.defaultClassName);
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

        // Set explicit width so transform calculations are accurate
        img.style.width = `${renderedWidth}px`;

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

        if (this.fullConfig.debug && index < 3) {
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

        // Store animation data for JS-animated paths (bounce, elastic, wave)
        // or when rotation/scale animation is needed
        const needsJSAnimation = this.entryAnimationEngine.requiresJSAnimation() ||
          this.entryAnimationEngine.requiresJSRotation() ||
          this.entryAnimationEngine.requiresJSScale() ||
          startRotation !== layout.rotation ||
          startScale !== layout.scale;

        if (needsJSAnimation) {
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
        }

        this.displayQueue.push(img);
      };

      img.onerror = () => processedCount++;

      // Set src AFTER onload handler to ensure it catches cached images
      img.src = url;
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
    } else {
      // Track the focused image index for keyboard navigation
      const imageId = imageElement.dataset.imageId;
      this.currentFocusIndex = imageId !== undefined ? parseInt(imageId, 10) : null;
      await this.zoomEngine.focusImage(imageElement, bounds, originalLayout);
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

    if (this.containerEl) {
      this.containerEl.innerHTML = '';
    }
    this.imageElements = [];
    this.imageLayouts = [];
    this.currentFocusIndex = null;
    this.hoveredImage = null;
    this.layoutEngine.reset();
    this.zoomEngine.reset();
    this.imagesLoaded = false;
  }

  private showLoading(show: boolean): void {
    if (!this.fullConfig.rendering.ui.showLoadingSpinner || !this.loadingEl) return;
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

  /**
   * Destroy the gallery and clean up resources
   */
  destroy(): void {
    this.clearImageCloud();
    // Remove event listeners
    if (this.resizeTimeout !== null) {
      clearTimeout(this.resizeTimeout);
    }
  }
}
