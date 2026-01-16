/**
 * RandomPlacementGenerator.js
 * Generates random overlapping layouts for image cloud
 */

class RandomPlacementGenerator {
    constructor(config) {
        this.config = config;
    }

    /**
     * Generate random layout positions for images
     * @param {number} imageCount - Number of images to layout
     * @param {Object} containerBounds - Container dimensions {width, height}
     * @param {Object} options - Optional overrides
     * @returns {Array} - Array of layout objects with position, rotation, scale
     */
    generate(imageCount, containerBounds, options = {}) {
        const layouts = [];
        const { width, height } = containerBounds;
        const { padding, baseImageSize, rotationRange, sizeVarianceMin, sizeVarianceMax } = this.config;
        
        // Calculate safe bounds (accounting for image size and padding)
        const maxX = width - baseImageSize - padding;
        const maxY = height - baseImageSize - padding;
        const minX = padding;
        const minY = padding;
        
        for (let i = 0; i < imageCount; i++) {
            // Random position within safe bounds
            const x = this.random(minX, maxX);
            const y = this.random(minY, maxY);
            
            // Random rotation within range
            const rotation = this.random(-rotationRange, rotationRange);
            
            // Random size variance
            const scale = this.random(sizeVarianceMin, sizeVarianceMax);
            
            const layout = {
                id: i,
                x,
                y,
                rotation,
                scale,
                baseSize: baseImageSize
            };
            
            layouts.push(layout);
        }
        
        return layouts;
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
}
