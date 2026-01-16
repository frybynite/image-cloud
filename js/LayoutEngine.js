/**
 * LayoutEngine.js
 * Generates random overlapping layouts for image cloud
 * 
 * Public API:
 * - generateLayout(imageCount, containerBounds)
 * - getOriginalState(imageId)
 * - reset()
 */

class LayoutEngine {
    constructor(config = {}) {
        this.config = {
            type: config.type || 'random',
            rotationRange: config.rotationRange || 15,
            sizeVarianceMin: config.sizeVarianceMin || 0.8,
            sizeVarianceMax: config.sizeVarianceMax || 1.2,
            baseImageSize: config.baseImageSize || 200,
            padding: config.padding || 50,
            minSpacing: config.minSpacing || 20,
            ...config // merging other potential config
        };
        
        this.layouts = new Map();  // Store original states by image ID
        
        // Initialize generator strategy
        this.initGenerator();
    }
    
    initGenerator() {
        switch (this.config.type) {
            case 'radial':
                this.generator = new RadialPlacementGenerator(this.config);
                break;
            case 'random':
            default:
                this.generator = new RandomPlacementGenerator(this.config);
                break;
        }
    }

    /**
     * Generate layou positions for images
     * @param {number} imageCount - Number of images to layout
     * @param {Object} containerBounds - Container dimensions {width, height}
     * @param {Object} options - Optional overrides for configuration (e.g. fixedHeight)
     * @returns {Array} - Array of layout objects with position, rotation, scale
     */
    generateLayout(imageCount, containerBounds, options = {}) {
        const layouts = this.generator.generate(imageCount, containerBounds, options);
        
        // Store layouts for state retrieval
        layouts.forEach(layout => {
            this.layouts.set(layout.id, layout);
        });
        
        return layouts;
    }
    
    /**
     * Get the original layout state for an image
     * @param {number|string} imageId - The image ID
     * @returns {Object} - Original layout state
     */
    getOriginalState(imageId) {
        return this.layouts.get(Number(imageId));
    }
    
    /**
     * Reset all stored layouts
     */
    reset() {
        this.layouts.clear();
    }
    
    /**
     * Utility: Generate random number between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number}
     */
    random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * Update config dynamically (useful for responsive changes)
     * @param {Object} newConfig - Updated configuration
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayoutEngine;
}
