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
        loader: {
            type: 'static',
            static: {
                sources: [
                    {
                        type: 'urls',
                        urls: [
                            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
                            'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800'
                        ]
                    }
                ]
            }
        }
    });

    cloud.init();
}

// Example 2: With full type safety and pattern-based config (NEW FORMAT)
function typedExample() {
    const options: ImageCloudOptions = {
        container: 'cloud',
        loader: {
            type: 'static',
            static: {
                sources: [
                    {
                        type: 'path',
                        basePath: '/images',
                        files: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg']
                    }
                ]
            }
        },
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
        loader: {
            type: 'googleDrive',
            googleDrive: {
                apiKey: 'YOUR_GOOGLE_API_KEY',
                sources: [
                    {
                        type: 'folder',
                        folders: ['https://drive.google.com/drive/folders/FOLDER_ID_1'],
                        recursive: true
                    },
                    {
                        type: 'folder',
                        folders: ['https://drive.google.com/drive/folders/FOLDER_ID_2'],
                        recursive: false  // Only images directly in this folder
                    },
                    {
                        type: 'files',
                        files: [
                            'https://drive.google.com/file/d/FILE_ID_1/view',
                            'https://drive.google.com/file/d/FILE_ID_2/view'
                        ]
                    }
                ]
            }
        },
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

// Example 4: React component (NEW FORMAT)
import { useEffect, useRef } from 'react';

function CloudComponent() {
    const containerRef = useRef<HTMLDivElement>(null);
    const cloudRef = useRef<ImageCloud | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            cloudRef.current = new ImageCloud({
                container: containerRef.current.id,
                loader: {
                    type: 'static',
                    static: {
                        sources: [
                            {
                                type: 'urls',
                                urls: ['img1.jpg', 'img2.jpg', 'img3.jpg']
                            }
                        ]
                    }
                }
            });

            cloudRef.current.init();
        }

        return () => {
            cloudRef.current?.destroy();
        };
    }, []);

    return <div id="cloud" ref={containerRef} className="image-cloud" />;
}

// Example 5: Vue 3 Composition API (NEW FORMAT)
import { onMounted, onUnmounted, ref } from 'vue';

function useImageCloud(containerId: string, options: Omit<ImageCloudOptions, 'container'>) {
    const imageCloud = ref<ImageCloud | null>(null);

    onMounted(async () => {
        imageCloud.value = new ImageCloud({
            container: containerId,
            ...options
        });

        try {
            await imageCloud.value.init();
        } catch (error) {
            console.error('Cloud initialization failed:', error);
        }
    });

    onUnmounted(() => {
        imageCloud.value?.destroy();
    });

    return { imageCloud };
}

// Export examples
export {
    basicExample,
    typedExample,
    googleDriveExample,
    CloudComponent,
    useImageCloud
};
