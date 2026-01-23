/**
 * StaticImageLoader.ts
 * Loads images from predefined URL sources and local paths
 * Compatible with ImageCloud's loader interface
 *
 * Public API:
 * - prepare(filter) - Async discovery of images
 * - imagesLength() - Get count of discovered images
 * - imageURLs() - Get ordered list of image URLs
 * - isPrepared() - Check if loader has been prepared
 */

import type { ImageLoader, IImageFilter, StaticSource, StaticLoaderConfig } from '../config/types';

export class StaticImageLoader implements ImageLoader {
  private validateUrls: boolean;
  private validationTimeout: number;
  private validationMethod: 'head' | 'simple' | 'none';
  private sources: StaticSource[];
  private debugLogging: boolean;

  // State for new interface
  private _prepared: boolean = false;
  private _discoveredUrls: string[] = [];

  constructor(config: Partial<StaticLoaderConfig> = {}) {
    this.validateUrls = config.validateUrls !== false;
    this.validationTimeout = config.validationTimeout ?? 5000;
    this.validationMethod = config.validationMethod ?? 'head';
    this.sources = config.sources ?? [];
    this.debugLogging = config.debugLogging ?? false;

    // Validate that we have sources configured
    if (!this.sources || this.sources.length === 0) {
      throw new Error('StaticImageLoader requires at least one source to be configured');
    }

    this.log('StaticImageLoader initialized with config:', config);
  }

  /**
   * Prepare the loader by discovering all images from configured sources
   * @param filter - Filter to apply to discovered images
   */
  async prepare(filter: IImageFilter): Promise<void> {
    this._discoveredUrls = [];

    this.log(`Processing ${this.sources.length} source(s)`);

    // Process sources sequentially to preserve order
    for (const source of this.sources) {
      try {
        const urls = await this.processSource(source, filter);
        this._discoveredUrls.push(...urls);
      } catch (error) {
        console.warn('Failed to process source:', source, error);
        // Continue processing other sources
      }
    }

    this._prepared = true;
    this.log(`Successfully loaded ${this._discoveredUrls.length} image(s)`);
  }

  /**
   * Get the number of discovered images
   * @throws Error if called before prepare()
   */
  imagesLength(): number {
    if (!this._prepared) {
      throw new Error('StaticImageLoader.imagesLength() called before prepare()');
    }
    return this._discoveredUrls.length;
  }

  /**
   * Get the ordered list of image URLs
   * @throws Error if called before prepare()
   */
  imageURLs(): string[] {
    if (!this._prepared) {
      throw new Error('StaticImageLoader.imageURLs() called before prepare()');
    }
    return [...this._discoveredUrls];
  }

  /**
   * Check if the loader has been prepared
   */
  isPrepared(): boolean {
    return this._prepared;
  }

  /**
   * Process a single source object
   * @param source - Source configuration with type, urls, basePath, files
   * @param filter - Filter to apply to discovered images
   * @returns Promise resolving to array of valid URLs from this source
   */
  private async processSource(source: StaticSource, filter: IImageFilter): Promise<string[]> {
    if (!source || !source.type) {
      console.warn('Invalid source object (missing type):', source);
      return [];
    }

    if (source.type === 'urls') {
      return await this.processUrls(source.urls || [], filter);
    } else if (source.type === 'path') {
      return await this.processPath(source.basePath, source.files || [], filter);
    } else {
      console.warn(`Unknown source type: ${source.type}`);
      return [];
    }
  }

  /**
   * Process a list of direct URLs
   * @param urls - Array of image URLs
   * @param filter - Filter to apply to discovered images
   * @returns Promise resolving to array of validated URLs
   */
  private async processUrls(urls: string[], filter: IImageFilter): Promise<string[]> {
    if (!Array.isArray(urls)) {
      console.warn('URLs must be an array:', urls);
      return [];
    }

    const validUrls: string[] = [];

    for (const url of urls) {
      // Apply filter based on URL filename
      const filename = url.split('/').pop() || url;
      if (!filter.isAllowed(filename)) {
        this.log(`Skipping filtered URL: ${url}`);
        continue;
      }

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
   * @param basePath - Base path (relative or absolute)
   * @param files - Array of filenames
   * @param filter - Filter to apply to discovered images
   * @returns Promise resolving to array of validated URLs
   */
  private async processPath(basePath: string | undefined, files: string[], filter: IImageFilter): Promise<string[]> {
    if (!basePath) {
      console.warn('basePath is required for path-type sources');
      return [];
    }

    if (!Array.isArray(files)) {
      console.warn('files must be an array:', files);
      return [];
    }

    const validUrls: string[] = [];

    for (const file of files) {
      // Apply filter based on filename
      if (!filter.isAllowed(file)) {
        this.log(`Skipping filtered file: ${file}`);
        continue;
      }

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
   * @param url - URL to validate
   * @returns Promise resolving to true if valid and accessible
   */
  private async validateUrl(url: string): Promise<boolean> {
    if (this.validationMethod === 'none') {
      return true;
    }

    if (this.validationMethod === 'simple') {
      // Basic URL format check
      try {
        if (typeof window !== 'undefined') {
          new URL(url, window.location.origin);
        } else {
          new URL(url);
        }
        return true;
      } catch {
        return false;
      }
    }

    // validationMethod === 'head' (default)
    // For cross-origin URLs, we can't validate due to CORS
    // So we only validate same-origin URLs
    if (typeof window === 'undefined') {
      return true; // In non-browser environment, assume valid
    }

    const isSameOrigin = url.startsWith(window.location.origin) ||
                         url.startsWith('/');

    if (!isSameOrigin) {
      // Cross-origin URL - assume valid, can't validate due to CORS
      this.log(`Skipping validation for cross-origin URL: ${url}`);
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
        this.log(`Validation failed for ${url}: HTTP ${response.status}`);
        return false;
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          this.log(`Validation timeout for ${url}`);
        } else {
          this.log(`Validation failed for ${url}:`, error.message);
        }
      }
      return false;
    }
  }

  /**
   * Construct full URL from basePath and filename
   * @param basePath - Base path (relative or absolute)
   * @param filename - Filename to append
   * @returns Complete URL
   */
  private constructUrl(basePath: string, filename: string): string {
    // Remove trailing slash from basePath
    const cleanBase = basePath.replace(/\/$/, '');

    // Check if basePath is absolute URL
    if (this.isAbsoluteUrl(basePath)) {
      return `${cleanBase}/${filename}`;
    }

    // Relative path - prepend current origin
    if (typeof window === 'undefined') {
      return `${cleanBase}/${filename}`; // In non-browser environment, return as-is
    }

    const origin = window.location.origin;
    // Ensure basePath starts with /
    const normalizedPath = basePath.startsWith('/') ? basePath : '/' + basePath;
    const cleanPath = normalizedPath.replace(/\/$/, '');

    return `${origin}${cleanPath}/${filename}`;
  }

  /**
   * Check if URL is absolute (contains protocol)
   * @param url - URL to check
   * @returns True if absolute URL
   */
  private isAbsoluteUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Debug logging helper
   * @param args - Arguments to log
   */
  private log(...args: unknown[]): void {
    if (this.debugLogging && typeof console !== 'undefined') {
      console.log(...args);
    }
  }
}
