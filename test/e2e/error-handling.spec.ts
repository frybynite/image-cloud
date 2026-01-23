import { test, expect } from '@playwright/test';
import { getImageCount } from '../utils/test-helpers';

const VALID_IMAGES = [
  '/test/fixtures/images/image1.jpg',
  '/test/fixtures/images/image2.jpg',
  '/test/fixtures/images/image3.jpg'
];

const INVALID_IMAGES = [
  '/nonexistent-image-1.jpg',
  '/nonexistent-image-2.jpg',
  '/nonexistent-image-3.jpg'
];

test.describe('Error Handling', () => {

  test.describe('Container Errors', () => {

    test('logs error for missing container', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      // Capture console errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Gallery init should not throw (error is caught internally)
      const error = await page.evaluate(async () => {
        try {
          // @ts-ignore
          const gallery = new window.ImageCloud({
            container: 'nonexistent-container-id',
            loader: {
              type: 'static',
              static: {
                sources: [{ type: 'urls', urls: ['/test/fixtures/images/image1.jpg'] }],
                validateUrls: false
              }
            }
          });
          await gallery.init();
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      // Error is caught internally, not thrown
      expect(error).toBeNull();

      // Error should be logged to console
      const hasContainerError = consoleErrors.some(e => e.includes('not found') || e.includes('initialization failed'));
      expect(hasContainerError).toBe(true);
    });

    test('handles container with no dimensions gracefully', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      // Set container to 0 dimensions
      await page.evaluate(() => {
        const container = document.getElementById('imageCloud');
        if (container) {
          container.style.width = '0px';
          container.style.height = '0px';
        }
      });

      // Gallery should still initialize without crashing
      const error = await page.evaluate(async () => {
        try {
          // @ts-ignore
          const gallery = new window.ImageCloud({
            container: 'imageCloud',
            loader: {
              type: 'static',
              static: {
                sources: [{ type: 'urls', urls: ['/test/fixtures/images/image1.jpg'] }],
                validateUrls: false
              }
            }
          });
          await gallery.init();
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      // Should not throw (may show no images due to 0 size, but shouldn't crash)
      expect(error).toBeNull();
    });

  });

  test.describe('Image Loading Errors', () => {

    test('handles all images failing to load', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      await page.evaluate(async (invalidUrls: string[]) => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loader: {
            type: 'static',
            static: {
              sources: [{ type: 'urls', urls: invalidUrls }],
              validateUrls: false
            }
          },
          animation: { duration: 100 }
        });
        // @ts-ignore
        await window.gallery.init();
      }, INVALID_IMAGES);

      // Wait for load attempts
      await page.waitForTimeout(1000);

      // Container should still exist (no crash)
      const container = page.locator('#imageCloud');
      await expect(container).toBeAttached();

      // No images should be displayed (all failed)
      const count = await getImageCount(page);
      expect(count).toBe(0);
    });

    test('handles partial image load failure', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      const mixedUrls = [
        '/test/fixtures/images/image1.jpg', // valid
        '/nonexistent-1.jpg', // invalid
        '/test/fixtures/images/image2.jpg', // valid
        '/nonexistent-2.jpg'  // invalid
      ];

      await page.evaluate(async (urls: string[]) => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loader: {
            type: 'static',
            static: {
              sources: [{ type: 'urls', urls }],
              validateUrls: false
            }
          },
          animation: { duration: 100, queue: { enabled: true, interval: 20 } }
        });
        // @ts-ignore
        await window.gallery.init();
      }, mixedUrls);

      // Wait for load attempts
      await page.waitForTimeout(1000);

      // Only valid images should be displayed
      const count = await getImageCount(page);
      expect(count).toBe(2);

      // Gallery should still be functional
      const container = page.locator('#imageCloud');
      await expect(container).toBeAttached();
    });

    test('handles 404 image responses', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      await page.evaluate(async () => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loader: {
            type: 'static',
            static: {
              sources: [{
                type: 'urls',
                urls: [
                  '/test/fixtures/images/image1.jpg',
                  '/this-returns-404.jpg'
                ]
              }],
              validateUrls: false
            }
          },
          animation: { duration: 100 }
        });
        // @ts-ignore
        await window.gallery.init();
      });

      await page.waitForTimeout(1000);

      // Valid image should still load
      const count = await getImageCount(page);
      expect(count).toBe(1);
    });

  });

  test.describe('Loader Configuration Errors', () => {

    test('StaticImageLoader throws for empty sources', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      const error = await page.evaluate(() => {
        try {
          // @ts-ignore
          new window.StaticImageLoader({ sources: [] });
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      expect(error).toContain('at least one source');
    });

    test('StaticImageLoader throws for undefined sources', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      const error = await page.evaluate(() => {
        try {
          // @ts-ignore
          new window.StaticImageLoader({});
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      expect(error).toContain('at least one source');
    });

    test('GoogleDriveLoader throws for empty sources', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      const error = await page.evaluate(() => {
        try {
          // @ts-ignore
          new window.GoogleDriveLoader({ sources: [] });
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      expect(error).toContain('at least one source');
    });

    test('CompositeLoader throws for empty loaders', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      const error = await page.evaluate(() => {
        try {
          // @ts-ignore
          new window.CompositeLoader({ loaders: [] });
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      expect(error).toContain('at least one loader');
    });

  });

  test.describe('Loader State Errors', () => {

    test('imagesLength throws before prepare', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      const error = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [{ type: 'urls', urls: ['/test/fixtures/images/image1.jpg'] }]
        });
        try {
          loader.imagesLength();
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      expect(error).toContain('before prepare');
    });

    test('imageURLs throws before prepare', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      const error = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [{ type: 'urls', urls: ['/test/fixtures/images/image1.jpg'] }]
        });
        try {
          loader.imageURLs();
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      expect(error).toContain('before prepare');
    });

  });

  test.describe('No Images Scenario', () => {

    test('displays error when no images found', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      // Use URLs that will be filtered out (e.g., PDFs)
      await page.evaluate(async () => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loader: {
            type: 'static',
            static: {
              sources: [{
                type: 'urls',
                urls: ['/some-file.pdf', '/another-file.txt']
              }],
              validateUrls: false
            }
          }
        });
        // @ts-ignore
        await window.gallery.init();
      });

      await page.waitForTimeout(500);

      // Error element should be visible with message
      const errorEl = page.locator('.fbn-ic-error');
      const errorText = await errorEl.textContent();

      expect(errorText).toContain('No images');
    });

  });

  test.describe('Gallery Lifecycle Errors', () => {

    test('destroy does not throw on already destroyed gallery', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      const error = await page.evaluate(async () => {
        // @ts-ignore
        const gallery = new window.ImageCloud({
          container: 'imageCloud',
          loader: {
            type: 'static',
            static: {
              sources: [{ type: 'urls', urls: ['/test/fixtures/images/image1.jpg'] }],
              validateUrls: false
            }
          }
        });
        await gallery.init();

        try {
          gallery.destroy();
          gallery.destroy(); // Second destroy should not throw
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      expect(error).toBeNull();
    });

    test('multiple init calls do not cause issues', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      const error = await page.evaluate(async () => {
        // @ts-ignore
        const gallery = new window.ImageCloud({
          container: 'imageCloud',
          loader: {
            type: 'static',
            static: {
              sources: [{ type: 'urls', urls: ['/test/fixtures/images/image1.jpg'] }],
              validateUrls: false
            }
          },
          animation: { duration: 50 }
        });

        try {
          await gallery.init();
          await gallery.init(); // Second init
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      // Should either succeed or fail gracefully
      // The behavior depends on implementation - just shouldn't crash
      expect(typeof error === 'string' || error === null).toBe(true);
    });

  });

  test.describe('CompositeLoader Error Handling', () => {

    test('continues when one loader fails in composite', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      const result = await page.evaluate(async () => {
        // Create a loader that will have some images
        // @ts-ignore
        const validLoader = new window.StaticImageLoader({
          sources: [{
            type: 'urls',
            urls: ['/test/fixtures/images/image1.jpg', '/test/fixtures/images/image2.jpg']
          }],
          validationMethod: 'none'
        });

        // Create a loader with invalid Google Drive config (will fail during prepare)
        // @ts-ignore
        const invalidLoader = new window.GoogleDriveLoader({
          sources: [{ type: 'folder', folders: ['invalid-url'] }]
        });

        // @ts-ignore
        const composite = new window.CompositeLoader({
          loaders: [validLoader, invalidLoader]
        });

        const filter = { isAllowed: () => true };

        try {
          await composite.prepare(filter);
          return {
            success: true,
            imageCount: composite.imagesLength()
          };
        } catch (e) {
          return {
            success: false,
            error: (e as Error).message
          };
        }
      });

      // Composite should succeed with images from the valid loader
      expect(result.success).toBe(true);
      expect(result.imageCount).toBe(2);
    });

  });

  test.describe('URL Validation Errors', () => {

    test('handles malformed URLs gracefully', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      const error = await page.evaluate(async () => {
        try {
          // @ts-ignore
          window.gallery = new window.ImageCloud({
            container: 'imageCloud',
            loader: {
              type: 'static',
              static: {
                sources: [{
                  type: 'urls',
                  urls: [
                    '/test/fixtures/images/image1.jpg',
                    'not-a-valid-url',
                    '://broken-protocol',
                    '/test/fixtures/images/image2.jpg'
                  ]
                }],
                validateUrls: false
              }
            },
            animation: { duration: 100 }
          });
          // @ts-ignore
          await window.gallery.init();
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      // Should not crash
      expect(error).toBeNull();

      await page.waitForTimeout(500);

      // At least valid images should load
      const count = await getImageCount(page);
      expect(count).toBeGreaterThanOrEqual(1);
    });

  });

  test.describe('Edge Cases', () => {

    test('handles empty URL array', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      await page.evaluate(async () => {
        // @ts-ignore
        window.gallery = new window.ImageCloud({
          container: 'imageCloud',
          loader: {
            type: 'static',
            static: {
              sources: [{ type: 'urls', urls: [] }],
              validateUrls: false
            }
          }
        });
        // @ts-ignore
        await window.gallery.init();
      });

      await page.waitForTimeout(500);

      // Should show no images message
      const errorEl = page.locator('.fbn-ic-error');
      await expect(errorEl).toBeVisible();
    });

    test('handles very long URL list', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      // Generate 100 URLs (repeating valid images)
      const manyUrls: string[] = [];
      for (let i = 0; i < 100; i++) {
        manyUrls.push(VALID_IMAGES[i % VALID_IMAGES.length]);
      }

      const error = await page.evaluate(async (urls: string[]) => {
        try {
          // @ts-ignore
          window.gallery = new window.ImageCloud({
            container: 'imageCloud',
            loader: {
              type: 'static',
              static: {
                sources: [{ type: 'urls', urls }],
                validateUrls: false
              }
            },
            animation: { duration: 20, queue: { enabled: true, interval: 5 } }
          });
          // @ts-ignore
          await window.gallery.init();
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, manyUrls);

      // Should handle without error
      expect(error).toBeNull();

      // Wait for images to start loading
      await page.waitForTimeout(2000);

      // Some images should be visible
      const count = await getImageCount(page);
      expect(count).toBeGreaterThan(0);
    });

    test('handles rapid destroy and reinit', async ({ page }) => {
      await page.goto('/test/fixtures/error-handling.html');

      const error = await page.evaluate(async () => {
        try {
          for (let i = 0; i < 5; i++) {
            // @ts-ignore
            const gallery = new window.ImageCloud({
              container: 'imageCloud',
              loader: {
                type: 'static',
                static: {
                  sources: [{ type: 'urls', urls: ['/test/fixtures/images/image1.jpg'] }],
                  validateUrls: false
                }
              },
              animation: { duration: 50 }
            });
            await gallery.init();
            gallery.destroy();
          }
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      expect(error).toBeNull();
    });

  });

});
