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
      // Quietly return if no galleries found (normal case for some pages)
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

      // Check for JSON configuration
      // Supports data-config (preferred) or data-gallery-config (legacy alias)
      const jsonConfig = element.dataset.config || element.dataset.galleryConfig;
      let options: ImageGalleryOptions;

      if (jsonConfig) {
        try {
          const parsed = JSON.parse(jsonConfig);
          options = {
            container: element.id,
            ...parsed
          };
        } catch (error) {
          console.error(`ImageGallery: Failed to parse configuration JSON for #${element.id}:`, error);
          return;
        }
      } else {
        console.error(`ImageGallery: Missing configuration for #${element.id}. Add data-config='{...}' attribute.`);
        return;
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