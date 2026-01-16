/**
 * ImageGallery.ts
 * Main application class
 * Manages initialization and coordination of the interactive image cloud
 */

import type { ImageGalleryOptions, GalleryConfig, ImageLayout, ContainerBounds, NewImageGalleryOptions, NewGalleryConfig } from './config/types';
import { mergeNewConfig } from './config/defaults';
import { LegacyOptionsAdapter } from './config/adapter';
import { AnimationEngine } from './engines/AnimationEngine';
import { LayoutEngine } from './engines/LayoutEngine';
import { ZoomEngine } from './engines/ZoomEngine';
import { GoogleDriveLoader } from './loaders/GoogleDriveLoader';
import { StaticImageLoader } from './loaders/StaticImageLoader';
import type { ImageLoader } from './config/types';

export class ImageGallery {
  private options: ImageGalleryOptions | NewImageGalleryOptions;
  private containerId: string;

  // Internal state
  private fullConfig: GalleryConfig | NewGalleryConfig;
  private isNewFormat: boolean;  // Track which config format we're using
  private imagesLoaded: boolean;
  private imageElements: HTMLImageElement[];
  private currentImageHeight: number;
  private resizeTimeout: number | null;
  private displayQueue: HTMLImageElement[];

  // Modules
  private animationEngine: AnimationEngine;
  private layoutEngine: LayoutEngine;
  private zoomEngine: ZoomEngine;
  private imageLoader: ImageLoader;

  // DOM Elements
  private containerEl: HTMLElement | null;
  private loadingEl: HTMLElement | null;
  private errorEl: HTMLElement | null;

  constructor(options: ImageGalleryOptions | NewImageGalleryOptions = {}) {
    // Detect format and convert if legacy
    this.isNewFormat = !LegacyOptionsAdapter.isLegacyFormat(options);

    if (!this.isNewFormat) {
      // Convert legacy options to new format
      const convertedOptions = LegacyOptionsAdapter.convert(options as ImageGalleryOptions);
      this.options = convertedOptions;
      this.fullConfig = mergeNewConfig(convertedOptions as any);
    } else {
      // Use new format directly
      this.options = options as NewImageGalleryOptions;
      this.fullConfig = mergeNewConfig(options as any);
    }

    // Extract common properties
    const newConfig = this.fullConfig as NewGalleryConfig;
    const newOpts = this.options as NewImageGalleryOptions;
    this.containerId = newOpts.container || 'imageCloud';

    // Internal state
    this.imagesLoaded = false;
    this.imageElements = [];
    this.currentImageHeight = 225;
    this.resizeTimeout = null;
    this.displayQueue = [];

    // Create legacy-compatible config for engines (they expect old structure)
    const legacyAnimationConfig = {
      duration: newConfig.animation.duration,
      easing: newConfig.animation.easing.default,
      bounceEasing: newConfig.animation.easing.bounce,
      queueInterval: newConfig.animation.queue.interval
    };

    const legacyLayoutConfig = {
      type: newConfig.layout.algorithm,
      debugRadials: newConfig.layout.debugRadials || false,
      rotationRange: newConfig.layout.rotation.range.max - newConfig.layout.rotation.range.min,
      minRotation: newConfig.layout.rotation.range.min,
      maxRotation: newConfig.layout.rotation.range.max,
      sizeVarianceMin: newConfig.layout.sizing.variance.min,
      sizeVarianceMax: newConfig.layout.sizing.variance.max,
      baseImageSize: newConfig.layout.sizing.base,
      responsiveHeights: newConfig.layout.sizing.responsive,
      padding: newConfig.layout.spacing.padding,
      minSpacing: newConfig.layout.spacing.minGap
    };

    const legacyZoomConfig = {
      focusScale: newConfig.interaction.focus.scale,
      mobileScale: newConfig.interaction.focus.mobileScale,
      unfocusedOpacity: newConfig.interaction.focus.unfocusedOpacity,
      focusZIndex: newConfig.interaction.focus.zIndex
    };

    this.animationEngine = new AnimationEngine(legacyAnimationConfig);
    this.layoutEngine = new LayoutEngine(legacyLayoutConfig);
    this.zoomEngine = new ZoomEngine(legacyZoomConfig, this.animationEngine);

    // Initialize image loader based on type
    this.imageLoader = this.createLoader();

    // DOM Elements (will be fetched on init)
    this.containerEl = null;
    this.loadingEl = null;
    this.errorEl = null;
  }

  /**
   * Create appropriate image loader based on config
   */
  private createLoader(): ImageLoader {
    const newConfig = this.fullConfig as NewGalleryConfig;
    const loaderType = newConfig.loader.type;

    if (loaderType === 'static') {
      const staticConfig = newConfig.loader.static!;
      return new StaticImageLoader(staticConfig);
    } else {
      const driveConfig = newConfig.loader.googleDrive!;
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

      // Create or bind UI elements
      this.setupUI();

      // 2. Setup Event Listeners
      this.setupEventListeners();

      // 3. Load Images
      this.logDebug('ImageGallery initialized');
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
    // Global events
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.zoomEngine.unfocusImage();
    });

    document.addEventListener('click', (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.cloud-image')) {
        this.zoomEngine.unfocusImage();
      }
    });

    // Resize handler
    window.addEventListener('resize', () => this.handleResize());
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
    const newConfig = this.fullConfig as NewGalleryConfig;
    const heights = newConfig.layout.sizing.responsive || [];
    for (const bh of heights) {
      if (width >= bh.minWidth) {
        return bh.height;
      }
    }
    return 120; // Fallback
  }

  /**
   * Load images based on configured loader type
   */
  private async loadImages(): Promise<void> {
    try {
      this.showLoading(true);
      this.hideError();
      this.clearImageCloud();

      const newConfig = this.fullConfig as NewGalleryConfig;
      const loaderType = newConfig.loader.type;

      let imageUrls: string[] = [];

      if (loaderType === 'googleDrive') {
        // Load from Google Drive sources (folders and/or files)
        imageUrls = await this.loadGoogleDriveSources();
      } else {
        // Load from static sources
        imageUrls = await this.imageLoader.loadImagesFromFolder(newConfig.loader.static!.sources);
      }

      if (imageUrls.length === 0) {
        this.showError('No images found.');
        this.showLoading(false);
        return;
      }

      this.logDebug(`Loaded ${imageUrls.length} images`);

      await this.createImageCloud(imageUrls);

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
   * Load images from multiple Google Drive sources (folders and files)
   */
  private async loadGoogleDriveSources(): Promise<string[]> {
    const newConfig = this.fullConfig as NewGalleryConfig;
    const sources = newConfig.loader.googleDrive!.sources;

    if (sources.length === 0) {
      throw new Error('No Google Drive sources configured');
    }

    const loader = this.imageLoader as GoogleDriveLoader;
    const allImageUrls: string[] = [];

    for (const source of sources) {
      if (source.type === 'folder') {
        // Load from folder(s)
        for (const folderUrl of source.folders) {
          const recursive = source.recursive !== undefined ? source.recursive : true;
          const urls = await loader.loadImagesFromFolder(folderUrl, recursive);
          allImageUrls.push(...urls);
        }
      } else if (source.type === 'files') {
        // Load specific files
        const urls = await loader.loadFiles(source.files);
        allImageUrls.push(...urls);
      }
    }

    return allImageUrls;
  }

  /**
   * Helper for debug logging (supports both old and new config)
   */
  private logDebug(...args: unknown[]): void {
    const newConfig = this.fullConfig as NewGalleryConfig;
    if (newConfig.debug && typeof console !== 'undefined') {
      console.log(...args);
    }
  }

  private async createImageCloud(imageUrls: string[]): Promise<void> {
    if (!this.containerEl) return;

    const containerBounds: ContainerBounds = {
      width: this.containerEl.offsetWidth,
      height: this.containerEl.offsetHeight || window.innerHeight * 0.7
    };

    const imageHeight = this.getImageHeight();
    this.currentImageHeight = imageHeight;

    // Generate layout
    const layouts = this.layoutEngine.generateLayout(imageUrls.length, containerBounds, { fixedHeight: imageHeight } as any);

    this.displayQueue = [];
    let processedCount = 0;

    const startQueueProcessing = () => {
      this.logDebug('Starting queue processing');
      const newConfig = this.fullConfig as NewGalleryConfig;
      const queueInterval = setInterval(() => {
        if (this.displayQueue.length > 0 && this.containerEl) {
          const img = this.displayQueue.shift();
          if (img) {
            this.containerEl.appendChild(img);
            this.imageElements.push(img);

            requestAnimationFrame(() => {
              void img.offsetWidth; // Force reflow
              img.style.opacity = '1';
              const finalTransform = img.dataset.finalTransform || '';
              img.style.transform = finalTransform;
            });

            processedCount++;
          }
        }

        if (processedCount >= imageUrls.length && this.displayQueue.length === 0) {
          if (processedCount === imageUrls.length) clearInterval(queueInterval);
        }
      }, newConfig.animation.queue.interval);
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

    // Create elements
    imageUrls.forEach((url, index) => {
      const img = document.createElement('img');
      img.src = url;
      img.referrerPolicy = 'no-referrer';
      img.classList.add('cloud-image');
      img.dataset.imageId = String(index);

      const layout = layouts[index];
      img.style.width = 'auto';
      img.style.height = `${imageHeight}px`;
      img.style.left = `${layout.x}px`;
      img.style.top = `${layout.y}px`;
      img.style.transform = `rotate(${layout.rotation}deg) scale(${layout.scale})`;

      if (layout.borderColor) {
        img.style.border = `5px solid ${layout.borderColor}`;
        img.style.boxSizing = 'border-box';
      }
      if (layout.zIndex) img.style.zIndex = String(layout.zIndex);

      img.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        this.handleImageClick(img, layout);
      });

      img.style.opacity = '0';
      img.style.transition = 'opacity 0.6s ease-out, transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';

      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const renderedWidth = imageHeight * aspectRatio;

        // Animation calculations
        const centerX = layout.x + renderedWidth / 2;
        const centerY = layout.y + imageHeight / 2;
        const containerWidth = containerBounds.width;
        const containerHeight = containerBounds.height;

        let startTx = 0, startTy = 0;
        const buffer = 100;

        const distLeft = centerX;
        const distRight = containerWidth - centerX;
        const distTop = centerY;
        const distBottom = containerHeight - centerY;
        const minDist = Math.min(distLeft, distRight, distTop, distBottom);

        if (minDist === distLeft) startTx = -(layout.x + renderedWidth + buffer);
        else if (minDist === distRight) startTx = (containerWidth - layout.x) + buffer;
        else if (minDist === distTop) startTy = -(layout.y + imageHeight + buffer);
        else startTy = (containerHeight - layout.y) + buffer;

        const finalTransform = `rotate(${layout.rotation}deg) scale(${layout.scale})`;
        const startTransform = `translate(${startTx}px, ${startTy}px) ${finalTransform}`;

        img.style.transform = startTransform;
        img.dataset.finalTransform = finalTransform;

        this.displayQueue.push(img);
      };

      img.onerror = () => processedCount++;
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
    } else {
      await this.zoomEngine.focusImage(imageElement, bounds, originalLayout);
    }
  }

  /**
   * Clear the image cloud and reset state
   */
  clearImageCloud(): void {
    if (this.containerEl) {
      this.containerEl.innerHTML = '';
    }
    this.imageElements = [];
    this.layoutEngine.reset();
    this.zoomEngine.reset();
    this.imagesLoaded = false;
  }

  private showLoading(show: boolean): void {
    const newConfig = this.fullConfig as NewGalleryConfig;
    if (!newConfig.rendering.ui.showLoadingSpinner || !this.loadingEl) return;
    if (show) {
      this.loadingEl.classList.remove('hidden');
    } else {
      this.loadingEl.classList.add('hidden');
    }
  }

  private showError(message: string): void {
    if (!this.errorEl) return;
    this.errorEl.textContent = message;
    this.errorEl.classList.remove('hidden');
  }

  private hideError(): void {
    if (this.errorEl) {
      this.errorEl.classList.add('hidden');
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
