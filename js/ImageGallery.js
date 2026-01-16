/**
 * ImageGallery.js
 * Main application class
 * Manages dependencies, initialization, and coordination of the interactive image cloud
 */

class ImageGallery {
    constructor(options = {}) {
        this.options = options;
        
        // Default configuration overrides
        this.apiKey = options.googleDrive?.apiKey || '';
        this.containerId = options.containerId || 'imageCloud';
        
        // Internal state
        this.fullConfig = null;
        this.dependenciesLoaded = false;
        this.imagesLoaded = false;
        this.imageElements = [];
        this.currentImageHeight = 225;
        this.resizeTimeout = null;
        this.displayQueue = [];
        
        // Modules (will be initialized after loading dependencies)
        this.animationEngine = null;
        this.layoutEngine = null;
        this.zoomEngine = null;
        this.imageLoader = null;
        
        // DOM Elements (will be fetched on init)
        this.containerEl = null;
        this.loadingEl = null;
        this.errorEl = null;
    }

    /**
     * Load required script dependencies dynamically
     */
    async loadDependencies() {
        const scripts = [
            'js/config.js',
            'js/AnimationEngine.js',
            'js/generator/RandomPlacementGenerator.js',
            'js/generator/RadialPlacementGenerator.js',
            'js/LayoutEngine.js',
            'js/ZoomEngine.js',
            'js/loader/GoogleDriveLoader.js',
            'js/loader/StaticImageLoader.js'
        ];

        for (const src of scripts) {
            await this.loadScript(src);
        }
        
        this.dependenciesLoaded = true;
    }

    /**
     * Helper to load a single script and wait for it
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve(); // Already loaded
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.body.appendChild(script);
        });
    }

    /**
     * Initialize the gallery
     */
    async init() {
        try {
            // 1. Load dependencies
            if (!this.dependenciesLoaded) {
                await this.loadDependencies();
            }

            // 2. Setup Configuration
            if (typeof CONFIG === 'undefined') {
                throw new Error('Configuration failed to load');
            }

            this.fullConfig = CONFIG;

            // 3. Initialize Modules
            this.animationEngine = new AnimationEngine(CONFIG.animation);
            this.layoutEngine = new LayoutEngine(CONFIG.layout);
            this.zoomEngine = new ZoomEngine(CONFIG.zoom, this.animationEngine);

            // Initialize image loader based on type (factory pattern)
            const loaderType = this.options.loaderType || CONFIG.loader?.type || 'googleDrive';

            if (loaderType === 'static') {
                const staticConfig = {
                    ...CONFIG.loader?.static,
                    ...(this.options.staticLoader || {})
                };
                this.imageLoader = new StaticImageLoader(staticConfig);
            } else {
                // Default to GoogleDrive loader
                const driveConfig = {
                    ...CONFIG.googleDrive,
                    apiKey: this.apiKey || CONFIG.googleDrive.apiKey
                };
                this.imageLoader = new GoogleDriveLoader(driveConfig);
            }

            // 4. Setup DOM
            this.containerEl = document.getElementById(this.containerId);
            if (!this.containerEl) throw new Error(`Container #${this.containerId} not found`);
            
            // Create or bind UI elements
            this.setupUI();

            // 5. Setup Polyfills
            this.setupPolyfills();

            // 6. Setup Event Listeners
            this.setupEventListeners();

            // 7. Load Images
            debugLog('ImageGallery initialized');

            // For static loader, sources are in config; for GoogleDrive, use folderUrl
            if (loaderType === 'static') {
                // Static loader uses sources from config, pass null as folderUrl
                await this.handleLoadImages(null);
            } else {
                // GoogleDrive loader uses folderUrl
                const folderUrl = this.options.folderUrl || 'https://drive.google.com/drive/folders/19JY4GPJkTIVa5DwrqNftYOuJfGUWRU5t?usp=sharing';
                await this.handleLoadImages(folderUrl);
            }

        } catch (error) {
            console.error('Gallery initialization failed:', error);
            if (this.errorEl) {
                this.showError('Gallery failed to initialize: ' + error.message);
            }
        }
    }

    setupUI() {
        // Look for existing elements or create them
        this.loadingEl = document.getElementById('loading');
        this.errorEl = document.getElementById('error');
    }

    setupPolyfills() {
        if (typeof window.debugLog !== 'function') {
            window.debugLog = (...args) => {
                if (typeof CONFIG !== 'undefined' && CONFIG.debugLogging) {
                    console.log(...args);
                }
            };
        }
    }

    setupEventListeners() {
        // Global events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.zoomEngine.unfocusImage();
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.cloud-image')) {
                this.zoomEngine.unfocusImage();
            }
        });

        // Resize handler
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        if (!this.imagesLoaded) return;

        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            const newHeight = this.getImageHeight();

            if (newHeight !== this.currentImageHeight) {
                debugLog(`Window resized to new breakpoint (height: ${newHeight}px). Reloading images...`);
                // Reloading with current images would be ideal, but for now we re-fetch to reset layout
                const loaderType = this.options.loaderType || CONFIG.loader?.type || 'googleDrive';
                if (loaderType === 'static') {
                    this.handleLoadImages(null);
                } else {
                    const folderUrl = this.options.folderUrl || 'https://drive.google.com/drive/folders/19JY4GPJkTIVa5DwrqNftYOuJfGUWRU5t?usp=sharing';
                    this.handleLoadImages(folderUrl);
                }
            } else {
                 debugLog('Window resized (no breakpoint change)');
            }
        }, 500);
    }

    getImageHeight() {
        const width = window.innerWidth;
        const heights = CONFIG.layout.responsiveHeights || [];
        for (const bh of heights) {
            if (width >= bh.minWidth) {
                return bh.height;
            }
        }
        return 120; // Fallback
    }

    async handleLoadImages(folderUrl) {
        // For static loader, folderUrl is null (sources are in config)
        // For GoogleDrive loader, folderUrl is required
        const loaderType = this.options.loaderType || CONFIG.loader?.type || 'googleDrive';
        if (!folderUrl && loaderType !== 'static') {
            this.showError('No folder URL provided');
            return;
        }

        try {
            this.showLoading(true);
            this.hideError();
            this.clearImageCloud();

            // Load images using configured loader
            const imageUrls = await this.imageLoader.loadImagesFromFolder(folderUrl);
            
            if (imageUrls.length === 0) {
                this.showError('No images found in the folder.');
                this.showLoading(false);
                return;
            }
            
            debugLog(`Loaded ${imageUrls.length} images from Google Drive`);
            
            await this.createImageCloud(imageUrls);
            
            this.showLoading(false);
            this.imagesLoaded = true;
            
        } catch (error) {
            console.error('Error loading images:', error);
            this.showError(error.message || 'Failed to load images.');
            this.showLoading(false);
        }
    }

    async createImageCloud(imageUrls) {
        const containerBounds = {
            width: this.containerEl.offsetWidth,
            height: this.containerEl.offsetHeight || window.innerHeight * 0.7
        };
        
        const imageHeight = this.getImageHeight();
        this.currentImageHeight = imageHeight;
        
        // Generate layout
        const layouts = this.layoutEngine.generateLayout(imageUrls.length, containerBounds, { fixedHeight: imageHeight });
        
        this.displayQueue = [];
        let processedCount = 0;
        
        const startQueueProcessing = () => {
             debugLog('Starting queue processing');
             const queueInterval = setInterval(() => {
                if (this.displayQueue.length > 0) {
                    const img = this.displayQueue.shift();
                    this.containerEl.appendChild(img);
                    this.imageElements.push(img);
                    
                    requestAnimationFrame(() => {
                        void img.offsetWidth; // Force reflow
                        img.style.opacity = '1';
                        img.style.transform = img.dataset.finalTransform;
                    });
                    
                    processedCount++;
                }
                
                if (processedCount >= imageUrls.length && this.displayQueue.length === 0) {
                    if (processedCount === imageUrls.length) clearInterval(queueInterval);
                }
             }, CONFIG.animation.queueInterval);
        };

        // Visibility Check
        if ('IntersectionObserver' in window) {
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
            img.dataset.imageId = index;
            
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
            if (layout.zIndex) img.style.zIndex = layout.zIndex;
            
            img.addEventListener('click', (e) => {
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

    async handleImageClick(imageElement, originalLayout) {
        const isFocused = this.zoomEngine.isFocused(imageElement);
        const bounds = {
            width: this.containerEl.offsetWidth,
            height: this.containerEl.offsetHeight
        };
        
        if (isFocused) {
            await this.zoomEngine.unfocusImage();
        } else {
            await this.zoomEngine.focusImage(imageElement, bounds, originalLayout);
        }
    }

    clearImageCloud() {
        this.containerEl.innerHTML = '';
        this.imageElements = [];
        this.layoutEngine.reset();
        this.zoomEngine.reset();
        this.imagesLoaded = false;
    }

    showLoading(show) {
        if (!CONFIG.ui.showLoadingSpinner || !this.loadingEl) return;
        show ? this.loadingEl.classList.remove('hidden') : this.loadingEl.classList.add('hidden');
    }

    showError(message) {
        if (!this.errorEl) return;
        this.errorEl.textContent = message;
        this.errorEl.classList.remove('hidden');
    }

    hideError() {
        if (this.errorEl) this.errorEl.classList.add('hidden');
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Find all elements marked with data-image-gallery
    const containers = document.querySelectorAll('[data-image-gallery]');

    if (containers.length === 0) {
        console.warn('ImageGallery: No containers found with data-image-gallery attribute');
        return;
    }

    // Initialize each gallery
    containers.forEach(container => {
        // Container must have an ID for the gallery to work
        if (!container.id) {
            console.error('ImageGallery: Container with data-image-gallery must have an id attribute');
            return;
        }

        // Read configuration from data attributes
        const loaderType = container.dataset.loaderType || 'googleDrive';

        // GoogleDrive specific attributes
        const googleDriveApiKey = container.dataset.googleDriveApiKey || '';
        const googleDriveFolderUrl = container.dataset.googleDriveFolderUrl || '';

        // Static loader specific attributes
        const staticSources = container.dataset.staticSources ?
            JSON.parse(container.dataset.staticSources) : null;

        // Initialize gallery
        const gallery = new ImageGallery({
            containerId: container.id,
            folderUrl: googleDriveFolderUrl,
            loaderType: loaderType,
            googleDrive: {
                apiKey: googleDriveApiKey
            },
            staticLoader: staticSources ? { sources: staticSources } : {}
        });

        gallery.init();
    });
});
