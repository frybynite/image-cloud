/**
 * ImageGallery.ts
 * Main application class
 * Manages initialization and coordination of the interactive image cloud
 */

import type { ImageGalleryOptions, GalleryConfig, ImageLayout, ContainerBounds } from './config/types';
import { DEFAULT_CONFIG, mergeConfig, debugLog } from './config/defaults';
import { AnimationEngine } from './engines/AnimationEngine';
import { LayoutEngine } from './engines/LayoutEngine';
import { ZoomEngine } from './engines/ZoomEngine';
import { GoogleDriveLoader } from './loaders/GoogleDriveLoader';
import { StaticImageLoader } from './loaders/StaticImageLoader';
import type { ImageLoader } from './config/types';

export class ImageGallery {
  private options: ImageGalleryOptions;
  private apiKey: string;
  private containerId: string;

  // Internal state
  private fullConfig: GalleryConfig;
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

  constructor(options: ImageGalleryOptions = {}) {
    this.options = options;

    // Default configuration overrides
    this.apiKey = options.googleDrive?.apiKey || '';
    this.containerId = options.containerId || 'imageCloud';

    // Merge user config with defaults
    this.fullConfig = mergeConfig(DEFAULT_CONFIG, options.config || {});

    // Internal state
    this.imagesLoaded = false;
    this.imageElements = [];
    this.currentImageHeight = 225;
    this.resizeTimeout = null;
    this.displayQueue = [];

    // Initialize modules
    this.animationEngine = new AnimationEngine(this.fullConfig.animation);
    this.layoutEngine = new LayoutEngine(this.fullConfig.layout);
    this.zoomEngine = new ZoomEngine(this.fullConfig.zoom, this.animationEngine);

    // Initialize image loader based on type (factory pattern)
    const loaderType = this.options.loaderType || this.fullConfig.loader?.type || 'googleDrive';

    if (loaderType === 'static') {
      const staticConfig = {
        ...this.fullConfig.loader?.static,
        ...(this.options.staticLoader || {}),
        debugLogging: this.fullConfig.debugLogging
      };
      this.imageLoader = new StaticImageLoader(staticConfig);
    } else {
      // Default to GoogleDrive loader
      const driveConfig = {
        ...this.fullConfig.googleDrive,
        apiKey: this.apiKey || this.fullConfig.googleDrive.apiKey,
        debugLogging: this.fullConfig.debugLogging
      };
      this.imageLoader = new GoogleDriveLoader(driveConfig);
    }

    // DOM Elements (will be fetched on init)
    this.containerEl = null;
    this.loadingEl = null;
    this.errorEl = null;
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
      debugLog(this.fullConfig, 'ImageGallery initialized');

      // For static loader, sources are in config; for GoogleDrive, use folderUrl
      const loaderType = this.options.loaderType || this.fullConfig.loader?.type || 'googleDrive';
      if (loaderType === 'static') {
        // Static loader uses sources from config, pass null as folderUrl
        await this.handleLoadImages(null);
      } else {
        // GoogleDrive loader uses folderUrl
        const folderUrl = this.options.folderUrl || '';
        if (!folderUrl) {
          throw new Error('Google Drive folder URL is required');
        }
        await this.handleLoadImages(folderUrl);
      }

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
        debugLog(this.fullConfig, `Window resized to new breakpoint (height: ${newHeight}px). Reloading images...`);
        // Reloading with current images would be ideal, but for now we re-fetch to reset layout
        const loaderType = this.options.loaderType || this.fullConfig.loader?.type || 'googleDrive';
        if (loaderType === 'static') {
          this.handleLoadImages(null);
        } else {
          const folderUrl = this.options.folderUrl || '';
          if (folderUrl) {
            this.handleLoadImages(folderUrl);
          }
        }
      } else {
        debugLog(this.fullConfig, 'Window resized (no breakpoint change)');
      }
    }, 500);
  }

  private getImageHeight(): number {
    const width = window.innerWidth;
    const heights = this.fullConfig.layout.responsiveHeights || [];
    for (const bh of heights) {
      if (width >= bh.minWidth) {
        return bh.height;
      }
    }
    return 120; // Fallback
  }

  private async handleLoadImages(folderUrl: string | null): Promise<void> {
    // For static loader, folderUrl is null (sources are in config)
    // For GoogleDrive loader, folderUrl is required
    const loaderType = this.options.loaderType || this.fullConfig.loader?.type || 'googleDrive';
    if (!folderUrl && loaderType !== 'static') {
      this.showError('No folder URL provided');
      return;
    }

    try {
      this.showLoading(true);
      this.hideError();
      this.clearImageCloud();

      // Load images using configured loader
      const imageUrls = await this.imageLoader.loadImagesFromFolder(folderUrl || '');

      if (imageUrls.length === 0) {
        this.showError('No images found in the folder.');
        this.showLoading(false);
        return;
      }

      debugLog(this.fullConfig, `Loaded ${imageUrls.length} images`);

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
      debugLog(this.fullConfig, 'Starting queue processing');
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
      }, this.fullConfig.animation.queueInterval);
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
    if (!this.fullConfig.ui.showLoadingSpinner || !this.loadingEl) return;
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
