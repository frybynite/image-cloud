/**
 * Image Gallery Library - Auto-Initialization Entry Point
 *
 * Automatically initializes galleries from HTML data attributes
 * Usage: Include this script and add data-image-gallery attribute to containers
 */

// Import CSS for bundlers that support it
import './styles/gallery.css';

import { ImageGallery } from './ImageGallery';
import type { ImageGalleryOptions } from './config/types';

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

      // Read configuration from data attributes
      const loaderType = (element.dataset.loaderType || 'googleDrive') as 'googleDrive' | 'static';

      // GoogleDrive specific attributes
      const googleDriveApiKey = element.dataset.googleDriveApiKey || '';
      const googleDriveFolderUrl = element.dataset.googleDriveFolderUrl || '';

      // Static loader specific attributes
      const staticSources = element.dataset.staticSources ?
        JSON.parse(element.dataset.staticSources) : null;

      // Build options
      const options: ImageGalleryOptions = {
        containerId: element.id,
        folderUrl: googleDriveFolderUrl,
        loaderType: loaderType,
        googleDrive: {
          apiKey: googleDriveApiKey
        }
      };

      // Add static loader config if present
      if (staticSources) {
        options.staticLoader = { sources: staticSources };
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
