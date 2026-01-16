/**
 * StaticImageLoader.ts
 * Loads images from predefined URL sources and local paths
 * Compatible with ImageGallery's loader interface
 */

import type { ImageLoader, StaticSource, StaticLoaderConfig } from '../config/types';

export class StaticImageLoader implements ImageLoader {
  private validateUrls: boolean;
  private validationTimeout: number;
  private validationMethod: 'head' | 'simple' | 'none';
  private failOnAllMissing: boolean;
  private sources: StaticSource[];
  private debugLogging: boolean;

  constructor(config: Partial<StaticLoaderConfig> & { sources?: StaticSource[]; preserveOrder?: boolean; debugLogging?: boolean } = {}) {
    this.validateUrls = config.validateUrls !== false;
    this.validationTimeout = config.validationTimeout ?? 5000;
    this.validationMethod = config.validationMethod ?? 'head';
    this.failOnAllMissing = config.failOnAllMissing !== false;
    this.sources = config.sources ?? [];
    this.debugLogging = config.debugLogging ?? false;

    this.log('StaticImageLoader initialized with config:', config);
  }

  /**
   * Main entry point - Load images from static sources
   * @param sources - Array of source objects with type, urls, basePath, files
   * @returns Promise resolving to array of validated image URLs
   */
  async loadImagesFromFolder(sources: StaticSource[] | string): Promise<string[]> {
    // If string is passed (for interface compatibility), use configured sources
    const sourcesToProcess = typeof sources === 'string' ? this.sources : (sources || this.sources);

    if (!sourcesToProcess || sourcesToProcess.length === 0) {
      throw new Error('No image sources provided');
    }

    this.log(`Processing ${sourcesToProcess.length} source(s)`);

    const allUrls: string[] = [];

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

    this.log(`Successfully loaded ${allUrls.length} image(s)`);
    return allUrls;
  }

  /**
   * Process a single source object
   * @param source - Source configuration with type, urls, basePath, files
   * @returns Promise resolving to array of valid URLs from this source
   */
  private async processSource(source: StaticSource): Promise<string[]> {
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
   * @param urls - Array of image URLs
   * @returns Promise resolving to array of validated URLs
   */
  private async processUrls(urls: string[]): Promise<string[]> {
    if (!Array.isArray(urls)) {
      console.warn('URLs must be an array:', urls);
      return [];
    }

    const validUrls: string[] = [];

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
   * @param basePath - Base path (relative or absolute)
   * @param files - Array of filenames
   * @returns Promise resolving to array of validated URLs
   */
  private async processPath(basePath: string | undefined, files: string[]): Promise<string[]> {
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
