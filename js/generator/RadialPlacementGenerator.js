/**
 * RadialPlacementGenerator.js
 * Generates concentric radial layouts for image cloud
 */

class RadialPlacementGenerator {
    constructor(config) {
        this.config = config;
    }

    /**
     * Generate radial layout positions for images
     * @param {number} imageCount - Number of images to layout
     * @param {Object} containerBounds - Container dimensions {width, height}
     * @param {Object} options - Optional overrides
     * @returns {Array} - Array of layout objects with position, rotation, scale
     */
    generate(imageCount, containerBounds, options = {}) {
        const layouts = [];
        const { width, height } = containerBounds;
        const { baseImageSize, rotationRange, debugRadials } = this.config;
        
        // Debug color palette
        const debugPalette = ['green', 'blue', 'red', 'yellow', 'orange', 'purple'];
        
        // Use override fixedHeight if provided, else config fixedHeight, else baseImageSize
        const fixedHeight = options.fixedHeight || this.config.fixedHeight;
        const imageSize = fixedHeight || baseImageSize;
        const cx = width / 2;
        const cy = height / 2;
        
        // Initial placement at center
        const startX = cx - imageSize / 2; // Approximate centering ignoring aspect ratio width variance
        const startY = cy - imageSize / 2;
        
        // Add center image
        if (imageCount > 0) {
            layouts.push({
                id: 0,
                x: cx - (this.estimateWidth(imageSize) / 2),
                y: startY,
                rotation: this.random(-5, 5), // Less rotation for center
                scale: 1.0,
                baseSize: imageSize,
                zIndex: 100, // Center image is highest
                borderColor: debugRadials ? 'cyan' : null // Special color for center
            });
        }
        
        let processedCount = 1;
        let currentRing = 1;
        
        while (processedCount < imageCount) {
            // Ring settings
            // Scale X more than Y to create horizontal oval shape
            const radiusY = currentRing * (imageSize * 0.8); // Reduce overlap by 20% (1.0 -> 0.8)
            const radiusX = radiusY * 1.5; // Horizontal stretching factor
            
            const circumference = Math.PI * (3 * (radiusX + radiusY) - Math.sqrt((3 * radiusX + radiusY) * (radiusX + 3 * radiusY))); // Ramanujan's approximation
            
            const estimatedItemWidth = this.estimateWidth(imageSize);
            // Increase density by ~40% (1.1 -> 0.7)
            const itemsInRing = Math.floor(circumference / (estimatedItemWidth * 0.7)); 
            
            if (itemsInRing === 0) {
                currentRing++;
                continue;
            }
            
            const angleStep = (2 * Math.PI) / itemsInRing;
            
            // Add offset of 20 degrees per ring
            const ringOffset = currentRing * (20 * Math.PI / 180);
            
            for (let i = 0; i < itemsInRing && processedCount < imageCount; i++) {
                const angle = (i * angleStep) + ringOffset;
                
                // Calculate center position of image using elliptical formula
                const centerX = cx + Math.cos(angle) * radiusX;
                const centerY = cy + Math.sin(angle) * radiusY;
                
                // Top-left position
                let x = centerX - (estimatedItemWidth / 2);
                let y = centerY - (imageSize / 2);
                
                // Boundary Clamping
                // Use padding from config or default to 50
                const padding = this.config.padding || 50;
                
                // Clamp X
                if (x < padding) {
                    x = padding;
                } else if (x + estimatedItemWidth > width - padding) {
                    x = width - padding - estimatedItemWidth;
                }
                
                // Clamp Y
                if (y < padding) {
                    y = padding;
                } else if (y + imageSize > height - padding) {
                    y = height - padding - imageSize;
                }
                
                const rotation = this.random(-rotationRange, rotationRange);
                
                layouts.push({
                    id: processedCount,
                    x,
                    y,
                    rotation,
                    rotation,
                    scale: 1.0,
                    baseSize: imageSize,
                    zIndex: Math.max(1, 100 - currentRing), // Outer rings have lower z-index
                    borderColor: debugRadials ? debugPalette[(currentRing - 1) % debugPalette.length] : null
                });
                
                processedCount++;
            }
            
            currentRing++;
        }
        
        return layouts;
    }
    
    estimateWidth(height) {
        // Assume landscape aspect ratio approx 4:3 or 16:9 on average?
        // Let's assume 1.4 ratio
        return height * 1.4;
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
