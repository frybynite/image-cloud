/**
 * Image Gallery Library - Auto-Initialization Entry Point
 *
 * Automatically initializes galleries from HTML data attributes
 * Usage: Include this script and add data-image-gallery attribute to containers
 */

// Import CSS for bundlers that support it
import './styles/gallery.css';

import { ImageGallery } from './ImageGallery';
import type { ImageGalleryOptions, NewImageGalleryOptions } from './config/types';

/**
 * Auto-initialize galleries from data attributes
 */
function autoInitialize(): void {
  if (typeof document === 'undefined') {
    console.warn('ImageGallery: Document not available (not in browser environment)');
    return;
  }

  const initGalleries = () => {
    // Find all elements marked with data-image-gallery
    const containers = document.querySelectorAll('[data-image-gallery]');

    if (containers.length === 0) {
      console.warn('ImageGallery: No containers found with data-image-gallery attribute');
      return;
    }

    // Initialize each gallery
    containers.forEach(container => {
      const element = container as HTMLElement;

      // Container must have an ID for the gallery to work
      if (!element.id) {
        console.error('ImageGallery: Container with data-image-gallery must have an id attribute');
        return;
      }

      // Check for new JSON-based config first
      const jsonConfig = element.dataset.galleryConfig;
      let options: ImageGalleryOptions | NewImageGalleryOptions;

      if (jsonConfig) {
        // New format: JSON configuration
        try {
          const parsed = JSON.parse(jsonConfig);
          options = {
            container: element.id,
            ...parsed
          };
        } catch (error) {
          console.error('ImageGallery: Failed to parse data-gallery-config JSON:', error);
          return;
        }
      } else {
        // Legacy format: individual data attributes (with deprecation warning)
        console.warn(
          '[ImageGallery Deprecation Warning] Individual data attributes (data-loader-type, data-google-drive-api-key, etc.) are deprecated. ' +
          'Use data-gallery-config with JSON configuration instead.\n' +
          'See migration guide: https://github.com/frybynite/image-cloud#migration-guide'
        );

        const loaderType = (element.dataset.loaderType || 'googleDrive') as 'googleDrive' | 'static';

        // GoogleDrive specific attributes
        const googleDriveApiKey = element.dataset.googleDriveApiKey || '';
        const googleDriveFolderUrl = element.dataset.googleDriveFolderUrl || '';

        // Static loader specific attributes
        const staticSources = element.dataset.staticSources ?
          JSON.parse(element.dataset.staticSources) : null;

        // Build legacy options (will be auto-converted by ImageGallery constructor)
        options = {
          containerId: element.id,
          folderUrl: googleDriveFolderUrl,
          loaderType: loaderType,
          googleDrive: {
            apiKey: googleDriveApiKey
          }
        } as ImageGalleryOptions;

        // Add static loader config if present
        if (staticSources) {
          (options as ImageGalleryOptions).staticLoader = { sources: staticSources };
        }
      }

      // Initialize gallery
      const gallery = new ImageGallery(options);
      gallery.init().catch(error => {
        console.error('ImageGallery initialization failed:', error);
      });
    });
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGalleries);
  } else {
    // DOM is already ready
    initGalleries();
  }
}

// Auto-run when this module is imported
autoInitialize();

// Also export for manual control if needed
export { autoInitialize };
export { ImageGallery } from './ImageGallery';
