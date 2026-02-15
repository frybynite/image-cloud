/**
 * TypeScript Usage Example (v0.2.0+ with new pattern-based configuration)
 *
 * This example shows how to use the Image Cloud library in a TypeScript project.
 * Install: npm install @frybynite/image-cloud
 */

import { ImageCloud, type ImageCloudOptions } from '@frybynite/image-cloud';
import '@frybynite/image-cloud/style.css';

// Example 1: Basic usage with static images (NEW FORMAT)
function basicExample() {
    const cloud = new ImageCloud({
        container: 'cloud',
        loaders: [
            {
                static: {
                    sources: [
                        {
                            urls: [
                                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
                                'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800'
                            ]
                        }
                    ]
                }
            }
        ]
    });

    cloud.init();
}

// Example 2: With full type safety and pattern-based config (NEW FORMAT)
function typedExample() {
    const options: ImageCloudOptions = {
        container: 'cloud',
        loaders: [
            {
                static: {
                    sources: [
                        {
                            path: '/images',
                            files: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg']
                        }
                    ]
                }
            }
        ],
        layout: {
            algorithm: 'radial',
            sizing: {
                base: 250
            },
            rotation: {
                enabled: true,
                range: { min: -15, max: 15 }
            },
            spacing: {
                padding: 60
            }
        },
        animation: {
            duration: 800,
            easing: {
                default: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
                bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                focus: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
            },
            queue: {
                enabled: true,
                interval: 150
            }
        },
        interaction: {
            focus: {
                scale: 3.0,
                mobileScale: 2.0,
                zIndex: 1000
            }
        }
    };

    const cloud = new ImageCloud(options);
    cloud.init();
}

// Example 3: Google Drive integration with multiple sources (NEW FORMAT)
async function googleDriveExample() {
    const cloud = new ImageCloud({
        container: 'cloud',
        loaders: [
            {
                googleDrive: {
                    apiKey: 'YOUR_GOOGLE_API_KEY',
                    sources: [
                        {
                            folders: ['https://drive.google.com/drive/folders/FOLDER_ID_1'],
                            recursive: true
                        },
                        {
                            folders: ['https://drive.google.com/drive/folders/FOLDER_ID_2'],
                            recursive: false  // Only images directly in this folder
                        },
                        {
                            files: [
                                'https://drive.google.com/file/d/FILE_ID_1/view',
                                'https://drive.google.com/file/d/FILE_ID_2/view'
                            ]
                        }
                    ]
                }
            }
        ],
        layout: {
            algorithm: 'radial'
        }
    });

    try {
        await cloud.init();
        console.log('Cloud initialized successfully');
    } catch (error) {
        console.error('Failed to initialize cloud:', error);
    }
}

// Example 4: React wrapper component
// See examples/react-example.html for a runnable demo
//
// import { ImageCloud } from '@frybynite/image-cloud/react';
//
// function App() {
//     return (
//         <ImageCloud
//             className="image-cloud"
//             images={['img1.jpg', 'img2.jpg', 'img3.jpg']}
//             layout={{ algorithm: 'radial' }}
//         />
//     );
// }

// Example 5: Vue 3 wrapper component
// See examples/vue-example.html for a runnable demo
//
// import { ImageCloud } from '@frybynite/image-cloud/vue';
//
// <template>
//     <ImageCloud :options="{ images: ['img1.jpg'], layout: { algorithm: 'radial' } }" class="image-cloud" />
// </template>

// Example 6: Web Component (no framework needed)
// See examples/web-component-example.html for a runnable demo
//
// <script type="module">
//     import '@frybynite/image-cloud/web-component';
// </script>
// <image-cloud images='["img1.jpg", "img2.jpg"]' layout="radial"></image-cloud>

// Export examples
export {
    basicExample,
    typedExample,
    googleDriveExample
};
