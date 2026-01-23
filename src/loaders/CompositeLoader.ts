/**
 * CompositeLoader.ts
 * Combines multiple image loaders and loads them in parallel
 *
 * Public API:
 * - prepare(filter) - Async discovery of images from all loaders in parallel
 * - imagesLength() - Get combined count of discovered images
 * - imageURLs() - Get combined ordered list of image URLs
 * - isPrepared() - Check if loader has been prepared
 */

import type { ImageLoader, IImageFilter } from '../config/types';

export interface CompositeLoaderConfig {
  loaders: ImageLoader[];
  debugLogging?: boolean;
}

export class CompositeLoader implements ImageLoader {
  private loaders: ImageLoader[];
  private debugLogging: boolean;

  // State for interface
  private _prepared: boolean = false;
  private _discoveredUrls: string[] = [];

  constructor(config: CompositeLoaderConfig) {
    this.loaders = config.loaders;
    this.debugLogging = config.debugLogging ?? false;

    // Validate that we have at least one loader
    if (!this.loaders || this.loaders.length === 0) {
      throw new Error('CompositeLoader requires at least one loader to be configured');
    }

    this.log(`CompositeLoader initialized with ${this.loaders.length} loader(s)`);
  }

  /**
   * Prepare all loaders in parallel and combine their results
   * @param filter - Filter to apply to discovered images
   */
  async prepare(filter: IImageFilter): Promise<void> {
    this._discoveredUrls = [];

    this.log(`Preparing ${this.loaders.length} loader(s) in parallel`);

    // Prepare all loaders in parallel
    const preparePromises = this.loaders.map((loader, index) => {
      return loader.prepare(filter).then(() => {
        this.log(`Loader ${index} prepared with ${loader.imagesLength()} images`);
      }).catch(error => {
        console.warn(`Loader ${index} failed to prepare:`, error);
        // Continue with other loaders even if one fails
      });
    });

    await Promise.all(preparePromises);

    // Combine URLs from all prepared loaders (preserves order of loaders array)
    for (const loader of this.loaders) {
      if (loader.isPrepared()) {
        const urls = loader.imageURLs();
        this._discoveredUrls.push(...urls);
      }
    }

    this._prepared = true;
    this.log(`CompositeLoader prepared with ${this._discoveredUrls.length} total images`);
  }

  /**
   * Get the combined number of discovered images
   * @throws Error if called before prepare()
   */
  imagesLength(): number {
    if (!this._prepared) {
      throw new Error('CompositeLoader.imagesLength() called before prepare()');
    }
    return this._discoveredUrls.length;
  }

  /**
   * Get the combined ordered list of image URLs
   * @throws Error if called before prepare()
   */
  imageURLs(): string[] {
    if (!this._prepared) {
      throw new Error('CompositeLoader.imageURLs() called before prepare()');
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
   * Debug logging helper
   * @param args - Arguments to log
   */
  private log(...args: unknown[]): void {
    if (this.debugLogging && typeof console !== 'undefined') {
      console.log('[CompositeLoader]', ...args);
    }
  }
}
