/**
 * Loader Registry - Manages registration and lookup of image loader implementations
 *
 * This registry enables dynamic loading of loaders through separate bundles
 * while maintaining a central registry of available loaders. It mirrors the
 * LayoutEngine registry pattern for consistency.
 *
 * Public API:
 * - registerLoader(name, LoaderClass)
 * - getLoader(name)
 * - isRegistered(name)
 */

import type { ImageLoader, StaticLoaderInnerConfig, GoogleDriveLoaderInnerConfig } from '../config/types';

/**
 * Constructor signature for loader classes
 * Supports both simple loaders and composite loaders with their respective config types
 */
export type LoaderConstructor =
  | (new (config: StaticLoaderInnerConfig) => ImageLoader)
  | (new (config: GoogleDriveLoaderInnerConfig) => ImageLoader)
  | (new (config: any) => ImageLoader);

export class LoaderRegistry {
  private static readonly registry = new Map<string, LoaderConstructor>();

  /**
   * Register a loader implementation with the registry
   * @param name - Loader identifier (e.g., 'static', 'google-drive', 'composite')
   * @param Loader - Loader class constructor to register
   */
  static registerLoader(name: string, Loader: LoaderConstructor): void {
    LoaderRegistry.registry.set(name, Loader);
  }

  /**
   * Get a registered loader implementation
   * @param name - Loader identifier
   * @returns Loader class constructor
   * @throws Error if loader is not registered
   */
  static getLoader(name: string): LoaderConstructor {
    const Loader = LoaderRegistry.registry.get(name);

    if (!Loader) {
      throw new Error(
        `Loader "${name}" is not registered. ` +
        `Import "@frybynite/image-cloud/loaders/${name}" or "@frybynite/image-cloud/loaders/all".`
      );
    }

    return Loader;
  }

  /**
   * Check if a loader is registered
   * @param name - Loader identifier
   * @returns True if the loader is registered, false otherwise
   */
  static isRegistered(name: string): boolean {
    return LoaderRegistry.registry.has(name);
  }
}
