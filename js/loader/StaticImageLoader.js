/**
 * StaticImageLoader.js
 * Loads images from predefined URL sources and local paths
 * Compatible with ImageGallery's loader interface
 */

class StaticImageLoader {
    constructor(config = {}) {
        this.validateUrls = config.validateUrls !== false;
        this.validationTimeout = config.validationTimeout || 5000;
        this.validationMethod = config.validationMethod || 'head';
        this.failOnAllMissing = config.failOnAllMissing !== false;
        this.imageExtensions = config.imageExtensions ||
            ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
        this.preserveOrder = config.preserveOrder !== false;
        this.sources = config.sources || [];

        debugLog('StaticImageLoader initialized with config:', config);
    }

    /**
     * Main entry point - Load images from static sources
     * @param {Array<Object>} sources - Array of source objects with type, urls, basePath, files
     * @returns {Promise<Array<string>>} - Array of validated image URLs
     */
    async loadImagesFromFolder(sources) {
        // Use sources from parameter or fallback to constructor config
        const sourcesToProcess = sources || this.sources;

        if (!sourcesToProcess || sourcesToProcess.length === 0) {
            throw new Error('No image sources provided');
        }

        debugLog(`Processing ${sourcesToProcess.length} source(s)`);

        const allUrls = [];

        // Process sources sequentially to preserve order
        for (const source of sourcesToProcess) {
            try {
                const urls = await this.processSource(source);
                allUrls.push(...urls);
            } catch (error) {
                console.warn('Failed to process source:', source, error);
                // Continue processing other sources
            }
        }

        if (allUrls.length === 0 && this.failOnAllMissing) {
            throw new Error('No valid images found in any source');
        }

        debugLog(`Successfully loaded ${allUrls.length} image(s)`);
        return allUrls;
    }

    /**
     * Process a single source object
     * @param {Object} source - Source configuration with type, urls, basePath, files
     * @returns {Promise<Array<string>>} - Array of valid URLs from this source
     */
    async processSource(source) {
        if (!source || !source.type) {
            console.warn('Invalid source object (missing type):', source);
            return [];
        }

        if (source.type === 'urls') {
            return await this.processUrls(source.urls || []);
        } else if (source.type === 'path') {
            return await this.processPath(source.basePath, source.files || []);
        } else {
            console.warn(`Unknown source type: ${source.type}`);
            return [];
        }
    }

    /**
     * Process a list of direct URLs
     * @param {Array<string>} urls - Array of image URLs
     * @returns {Promise<Array<string>>} - Array of validated URLs
     */
    async processUrls(urls) {
        if (!Array.isArray(urls)) {
            console.warn('URLs must be an array:', urls);
            return [];
        }

        const validUrls = [];

        for (const url of urls) {
            if (this.validateUrls) {
                const isValid = await this.validateUrl(url);
                if (isValid) {
                    validUrls.push(url);
                } else {
                    console.warn(`Skipping invalid/missing URL: ${url}`);
                }
            } else {
                // No validation - add all URLs
                validUrls.push(url);
            }
        }

        return validUrls;
    }

    /**
     * Process a path-based source
     * @param {string} basePath - Base path (relative or absolute)
     * @param {Array<string>} files - Array of filenames
     * @returns {Promise<Array<string>>} - Array of validated URLs
     */
    async processPath(basePath, files) {
        if (!basePath) {
            console.warn('basePath is required for path-type sources');
            return [];
        }

        if (!Array.isArray(files)) {
            console.warn('files must be an array:', files);
            return [];
        }

        const validUrls = [];

        for (const file of files) {
            const url = this.constructUrl(basePath, file);

            if (this.validateUrls) {
                const isValid = await this.validateUrl(url);
                if (isValid) {
                    validUrls.push(url);
                } else {
                    console.warn(`Skipping invalid/missing file: ${url}`);
                }
            } else {
                // No validation - add all URLs
                validUrls.push(url);
            }
        }

        return validUrls;
    }

    /**
     * Validate a single URL using HEAD request
     * @param {string} url - URL to validate
     * @returns {Promise<boolean>} - True if valid and accessible
     */
    async validateUrl(url) {
        if (this.validationMethod === 'none') {
            return true;
        }

        if (this.validationMethod === 'simple') {
            // Basic URL format check
            try {
                new URL(url, window.location.origin);
                return true;
            } catch {
                return false;
            }
        }

        // validationMethod === 'head' (default)
        // For cross-origin URLs, we can't validate due to CORS
        // So we only validate same-origin URLs
        const isSameOrigin = url.startsWith(window.location.origin) ||
                             url.startsWith('/');

        if (!isSameOrigin) {
            // Cross-origin URL - assume valid, can't validate due to CORS
            debugLog(`Skipping validation for cross-origin URL: ${url}`);
            return true;
        }

        // Same-origin URL - validate with HEAD request
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.validationTimeout);

            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return true;
            } else {
                debugLog(`Validation failed for ${url}: HTTP ${response.status}`);
                return false;
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                debugLog(`Validation timeout for ${url}`);
            } else {
                debugLog(`Validation failed for ${url}:`, error.message);
            }
            return false;
        }
    }

    /**
     * Construct full URL from basePath and filename
     * @param {string} basePath - Base path (relative or absolute)
     * @param {string} filename - Filename to append
     * @returns {string} - Complete URL
     */
    constructUrl(basePath, filename) {
        // Remove trailing slash from basePath
        const cleanBase = basePath.replace(/\/$/, '');

        // Check if basePath is absolute URL
        if (this.isAbsoluteUrl(basePath)) {
            return `${cleanBase}/${filename}`;
        }

        // Relative path - prepend current origin
        const origin = window.location.origin;
        // Ensure basePath starts with /
        const normalizedPath = basePath.startsWith('/') ? basePath : '/' + basePath;
        const cleanPath = normalizedPath.replace(/\/$/, '');

        return `${origin}${cleanPath}/${filename}`;
    }

    /**
     * Check if URL is absolute (contains protocol)
     * @param {string} url - URL to check
     * @returns {boolean} - True if absolute URL
     */
    isAbsoluteUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}
