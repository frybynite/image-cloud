/**
 * AnimationEngine.js
 * Handles smooth animations with easing for the image cloud
 * 
 * Public API:
 * - animateTransform(element, properties, duration, easing)
 * - resetTransform(element)
 */

class AnimationEngine {
    constructor(config = {}) {
        this.duration = config.duration || 600;
        this.easing = config.easing || 'cubic-bezier(0.4, 0.0, 0.2, 1)';
    }
    
    /**
     * Animate element transform with smooth easing
     * @param {HTMLElement} element - The element to animate
     * @param {Object} properties - Transform properties {x, y, rotation, scale}
     * @param {number} duration - Animation duration in ms (optional)
     * @param {string} easing - CSS easing function (optional)
     * @returns {Promise} - Resolves when animation completes
     */
    animateTransform(element, properties, duration = null, easing = null) {
        return new Promise((resolve) => {
            const animDuration = duration || this.duration;
            const animEasing = easing || this.easing;
            
            // Build transform string
            const transforms = [];
            
            if (properties.x !== undefined || properties.y !== undefined) {
                const x = properties.x || 0;
                const y = properties.y || 0;
                transforms.push(`translate(${x}px, ${y}px)`);
            }
            
            if (properties.rotation !== undefined) {
                transforms.push(`rotate(${properties.rotation}deg)`);
            }
            
            if (properties.scale !== undefined) {
                transforms.push(`scale(${properties.scale})`);
            }
            
            // Apply transition
            element.style.transition = `transform ${animDuration}ms ${animEasing}, box-shadow ${animDuration}ms ${animEasing}`;
            
            // Apply transform
            element.style.transform = transforms.join(' ');
            
            // Resolve promise when animation completes
            setTimeout(() => {
                resolve();
            }, animDuration);
        });
    }
    
    /**
     * Reset element to its original transform
     * @param {HTMLElement} element - The element to reset
     * @param {Object} originalState - Original transform state {x, y, rotation, scale}
     * @returns {Promise} - Resolves when animation completes
     */
    resetTransform(element, originalState) {
        return this.animateTransform(element, originalState);
    }
    
    /**
     * Remove transition styles from element
     * @param {HTMLElement} element - The element to clear
     */
    clearTransition(element) {
        element.style.transition = '';
    }
    
    /**
     * Utility: Wait for a specified duration
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise}
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationEngine;
}
