/**
 * Configuration file for Interactive Image Cloud
 * Centralized settings for animation, layout, and API configuration
 */

const CONFIG = {
    // Animation settings
    animation: {
        duration: 600,  // milliseconds
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',  // smooth easing
        bounceEasing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',  // bounce effect
        queueInterval: 150 // ms between processing queue items
    },

    // UI settings
    ui: {
        showLoadingSpinner: false
    },
    
    // Layout settings
    layout: {
        type: 'radial', // 'random' or 'radial'
        debugRadials: false,
        rotationRange: 15,  // degrees (+/-)
        minRotation: -15,
        maxRotation: 15,
        sizeVarianceMin: 1.0,  // No variance for consistent height
        sizeVarianceMax: 1.0,  // No variance for consistent height
        baseImageSize: 200,  // pixels
        // responsive heights based on window width
        responsiveHeights: [
            { minWidth: 1200, height: 225 }, // Large screens
            { minWidth: 768, height: 180 },  // Tablet / Small desktop
            { minWidth: 0, height: 100 }     // Mobile / Default
        ],
        padding: 50,  // padding from viewport edges
        minSpacing: 20  // minimum spacing between images to encourage overlap
    },
    
    // Zoom settings
    zoom: {
        focusScale: 2.5,  // how much to scale focused image
        mobileScale: 2.0,  // slightly smaller scale for mobile
        unfocusedOpacity: 0.3,  // opacity of other images when one is focused (optional)
        focusZIndex: 1000
    },
    
    // Google Drive API settings
    googleDrive: {
        apiKey: '',  // Value provided by ImageCloud initialization
        apiEndpoint: 'https://www.googleapis.com/drive/v3/files',
        imageExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
    },
    
    // Responsive breakpoints
    breakpoints: {
        mobile: 768
    },

    // Debugging
    debugLogging: false,

    // Image loader settings
    loader: {
        type: 'googleDrive',  // 'googleDrive' or 'static'
        static: {
            validateUrls: true,
            validationTimeout: 5000,
            validationMethod: 'head',  // 'head', 'simple', or 'none'
            failOnAllMissing: true,
            imageExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
        }
    }
};

// Helper function to check if device is mobile
CONFIG.isMobile = () => window.innerWidth <= CONFIG.breakpoints.mobile;

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG.animation);
Object.freeze(CONFIG.layout);
Object.freeze(CONFIG.zoom);
Object.freeze(CONFIG.ui);
Object.freeze(CONFIG.googleDrive);
Object.freeze(CONFIG.breakpoints);
Object.freeze(CONFIG.loader);
Object.freeze(CONFIG.loader.static);

/**
 * Centralized debug logger
 * Safe wrapper for console.log
 * Explicitly attached to window for global access
 */
function debugLog(...args) {
    if (typeof CONFIG !== 'undefined' && CONFIG.debugLogging) {
        console.log(...args);
    }
}
window.debugLog = debugLog;

