/**
 * Image Cloud Library - Auto-Initialization Entry Point
 *
 * Automatically initializes galleries from HTML data attributes
 * Usage: Include this script and add data-image-cloud attribute to containers
 */

// Import CSS as inline string for self-contained bundle
import css from './styles/image-cloud.css?inline';

import { ImageCloud } from './ImageCloud';

/** Inject library styles into <head> (idempotent) */
function injectStyles(): void {
  if (typeof document === 'undefined') return;
  const id = 'fbn-ic-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}
injectStyles();
import type { ImageCloudOptions } from './config/types';

/**
 * Auto-initialize galleries from data attributes
 */
function autoInitialize(): void {
  if (typeof document === 'undefined') {
    console.warn('ImageCloud: Document not available (not in browser environment)');
    return;
  }

  const initGalleries = () => {
    // Find all elements marked with data-image-cloud or data-image-gallery (legacy)
    const containers = document.querySelectorAll('[data-image-cloud], [data-image-gallery]');

    if (containers.length === 0) {
      // Quietly return if no galleries found (normal case for some pages)
      return;
    }

    // Initialize each gallery
    containers.forEach(container => {
      const element = container as HTMLElement;

      // Container must have an ID for the gallery to work
      if (!element.id) {
        console.error('ImageCloud: Container with data-image-cloud must have an id attribute');
        return;
      }

      // Check for JSON configuration
      // Supports data-config (preferred) or data-gallery-config (legacy alias)
      const jsonConfig = element.dataset.config || element.dataset.galleryConfig;
      let options: ImageCloudOptions;

      if (jsonConfig) {
        try {
          const parsed = JSON.parse(jsonConfig);
          options = {
            container: element.id,
            ...parsed
          };
        } catch (error) {
          console.error(`ImageCloud: Failed to parse configuration JSON for #${element.id}:`, error);
          return;
        }
      } else {
        console.error(`ImageCloud: Missing configuration for #${element.id}. Add data-config='{...}' attribute.`);
        return;
      }

      // Initialize gallery
      const gallery = new ImageCloud(options);
      gallery.init().catch(error => {
        console.error('ImageCloud initialization failed:', error);
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
export { ImageCloud } from './ImageCloud';
// Backwards compatibility
export { ImageCloud as ImageGallery } from './ImageCloud';
