/**
 * TypeScript Usage Example
 *
 * This example shows how to use the Image Gallery library in a TypeScript project.
 * Install: npm install @keithfry/image-gallery
 */

import { ImageGallery, type ImageGalleryOptions } from '@keithfry/image-gallery';
import '@keithfry/image-gallery/style.css';

// Example 1: Basic usage with static images
function basicExample() {
    const gallery = new ImageGallery({
        containerId: 'gallery',
        loaderType: 'static',
        staticLoader: {
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
    });

    gallery.init();
}

// Example 2: With full type safety
function typedExample() {
    const options: ImageGalleryOptions = {
        containerId: 'gallery',
        loaderType: 'static',
        staticLoader: {
            sources: [
                {
                    type: 'path',
                    basePath: '/images',
                    files: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg']
                }
            ]
        },
        config: {
            layout: {
                type: 'radial',
                baseImageSize: 250,
                rotationRange: 15,
                padding: 60
            },
            animation: {
                duration: 800,
                easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
                bounceEasing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                queueInterval: 150
            },
            zoom: {
                focusScale: 3.0,
                mobileScale: 2.0,
                focusZIndex: 1000
            }
        }
    };

    const gallery = new ImageGallery(options);
    gallery.init();
}

// Example 3: Google Drive integration
async function googleDriveExample() {
    const gallery = new ImageGallery({
        containerId: 'gallery',
        loaderType: 'googleDrive',
        folderUrl: 'https://drive.google.com/drive/folders/YOUR_FOLDER_ID',
        googleDrive: {
            apiKey: 'YOUR_GOOGLE_API_KEY'
        },
        config: {
            layout: { type: 'radial' }
        }
    });

    try {
        await gallery.init();
        console.log('Gallery initialized successfully');
    } catch (error) {
        console.error('Failed to initialize gallery:', error);
    }
}

// Example 4: React component
import { useEffect, useRef } from 'react';

function GalleryComponent() {
    const containerRef = useRef<HTMLDivElement>(null);
    const galleryRef = useRef<ImageGallery | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            galleryRef.current = new ImageGallery({
                containerId: containerRef.current.id,
                loaderType: 'static',
                staticLoader: {
                    sources: [
                        {
                            type: 'urls',
                            urls: ['img1.jpg', 'img2.jpg', 'img3.jpg']
                        }
                    ]
                }
            });

            galleryRef.current.init();
        }

        return () => {
            galleryRef.current?.destroy();
        };
    }, []);

    return <div id="gallery" ref={containerRef} className="image-cloud" />;
}

// Example 5: Vue 3 Composition API
import { onMounted, onUnmounted, ref } from 'vue';

function useImageGallery(containerId: string, options: Omit<ImageGalleryOptions, 'containerId'>) {
    const gallery = ref<ImageGallery | null>(null);

    onMounted(async () => {
        gallery.value = new ImageGallery({
            containerId,
            ...options
        });

        try {
            await gallery.value.init();
        } catch (error) {
            console.error('Gallery initialization failed:', error);
        }
    });

    onUnmounted(() => {
        gallery.value?.destroy();
    });

    return { gallery };
}

// Export examples
export {
    basicExample,
    typedExample,
    googleDriveExample,
    GalleryComponent,
    useImageGallery
};
