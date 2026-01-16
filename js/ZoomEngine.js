/**
 * ZoomEngine.js
 * Manages zoom/focus behavior for image cloud
 * 
 * Public API:
 * - focusImage(imageElement, containerBounds)
 * - unfocusImage()
 * - getCurrentFocus()
 * - swapFocus(newImageElement, containerBounds)
 */

class ZoomEngine {
    constructor(config = {}, animationEngine) {
        this.config = {
            focusScale: config.focusScale || 2.5,
            focusZIndex: config.focusZIndex || 1000
        };
        
        this.animationEngine = animationEngine;
        this.currentFocus = null;  // Currently focused image element
        this.focusData = null;  // Data about focused image
    }
    
    /**
     * Focus (zoom) an image to center
     * @param {HTMLElement} imageElement - The image to focus
     * @param {Object} containerBounds - Container dimensions {width, height}
     * @param {Object} originalState - Original position/rotation from layout
     * @returns {Promise} - Resolves when zoom completes
     */
    async focusImage(imageElement, containerBounds, originalState) {
        // If there's already a focused image, unfocus it first
        if (this.currentFocus && this.currentFocus !== imageElement) {
            await this.unfocusImage();
        }
        
        // Calculate center position
        // Create center position
        const centerX = containerBounds.width / 2;
        const centerY = containerBounds.height / 2;
        
        // Get un-transformed dimensions
        const imageWidth = imageElement.offsetWidth;
        const imageHeight = imageElement.offsetHeight;
        
        // Calculate position to center the image
        // Target is simply center minus half size (to place top-left) minus current position
        const currentX = originalState.x;
        const currentY = originalState.y;
        
        const targetX = centerX - (imageWidth / 2) - currentX;
        const targetY = centerY - (imageHeight / 2) - currentY;
        
        // Store focus data
        this.focusData = {
            element: imageElement,
            originalState: originalState,
            focusTransform: {
                x: targetX,
                y: targetY,
                rotation: 0,  // Reset rotation when focused
                scale: this.config.focusScale
            }
        };
        
        // Update z-index
        imageElement.style.zIndex = this.config.focusZIndex;
        imageElement.classList.add('focused');
        
        // Animate to focused state
        this.currentFocus = imageElement;
        
        return this.animationEngine.animateTransform(
            imageElement,
            this.focusData.focusTransform
        );
    }
    
    /**
     * Unfocus current image, returning it to original position
     * @returns {Promise} - Resolves when animation completes
     */
    async unfocusImage() {
        if (!this.currentFocus || !this.focusData) {
            return;
        }
        
        const element = this.currentFocus;
        const originalState = this.focusData.originalState;
        
        // Animate back to original state
        await this.animationEngine.animateTransform(element, {
            x: 0,
            y: 0,
            rotation: originalState.rotation,
            scale: originalState.scale
        });
        
        // Reset z-index after animation completes
        element.style.zIndex = '';
        element.classList.remove('focused');
        
        // Clear focus state
        this.currentFocus = null;
        this.focusData = null;
    }
    
    /**
     * Swap focus from current image to a new one
     * @param {HTMLElement} newImageElement - The new image to focus
     * @param {Object} containerBounds - Container dimensions
     * @param {Object} originalState - Original state of new image
     * @returns {Promise} - Resolves when swap completes
     */
    async swapFocus(newImageElement, containerBounds, originalState) {
        // Simply focus the new image (focusImage handles unfocusing the old one)
        return this.focusImage(newImageElement, containerBounds, originalState);
    }
    
    /**
     * Get currently focused image element
     * @returns {HTMLElement|null}
     */
    getCurrentFocus() {
        return this.currentFocus;
    }
    
    /**
     * Check if an image is currently focused
     * @param {HTMLElement} imageElement
     * @returns {boolean}
     */
    isFocused(imageElement) {
        return this.currentFocus === imageElement;
    }
    
    /**
     * Reset zoom state
     */
    reset() {
        this.currentFocus = null;
        this.focusData = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZoomEngine;
}
