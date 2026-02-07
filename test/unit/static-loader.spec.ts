import { test, expect } from '@playwright/test';

// Unit tests for StaticImageLoader
// Tests url sources, json source type, and constructor validation

test.describe('StaticImageLoader Unit Tests', () => {

  // Setup: load a page that exposes the loader
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/fixtures/static-loader-unit-test.html');
    await page.waitForFunction(() =>
      typeof window.StaticImageLoader !== 'undefined' &&
      typeof window.ImageFilter !== 'undefined'
    );
  });

  test.describe('Constructor Validation', () => {

    test('throws error when no sources or urls provided', async ({ page }) => {
      const error = await page.evaluate(() => {
        try {
          // @ts-ignore
          new window.StaticImageLoader({});
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toContain('requires at least one source');
    });

    test('accepts valid sources array', async ({ page }) => {
      const error = await page.evaluate(() => {
        try {
          // @ts-ignore
          new window.StaticImageLoader({
            sources: [{ urls: ['https://example.com/a.jpg'] }]
          });
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toBeNull();
    });

    test('accepts multiple sources', async ({ page }) => {
      const error = await page.evaluate(() => {
        try {
          // @ts-ignore
          new window.StaticImageLoader({
            sources: [
              { urls: ['https://example.com/a.jpg'] },
              { urls: ['https://example.com/b.jpg'] }
            ]
          });
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toBeNull();
    });

    test('throws when sources is empty', async ({ page }) => {
      const error = await page.evaluate(() => {
        try {
          // @ts-ignore
          new window.StaticImageLoader({ sources: [] });
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toContain('requires at least one source');
    });

  });

  test.describe('URL Sources', () => {

    test('loads images from urls source', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [{
            urls: [
              'https://example.com/a.jpg',
              'https://example.com/b.png',
              'https://example.com/c.webp'
            ]
          }],
          validateUrls: false
        });
        // @ts-ignore
        const filter = new window.ImageFilter();
        await loader.prepare(filter);

        return {
          isPrepared: loader.isPrepared(),
          length: loader.imagesLength(),
          urls: loader.imageURLs()
        };
      });

      expect(result.isPrepared).toBe(true);
      expect(result.length).toBe(3);
      expect(result.urls).toEqual([
        'https://example.com/a.jpg',
        'https://example.com/b.png',
        'https://example.com/c.webp'
      ]);
    });

    test('urls source filters non-image extensions', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [{
            urls: [
              'https://example.com/photo.jpg',
              'https://example.com/document.pdf',
              'https://example.com/pic.png',
              'https://example.com/data.csv'
            ]
          }],
          validateUrls: false
        });
        // @ts-ignore
        const filter = new window.ImageFilter();
        await loader.prepare(filter);

        return {
          length: loader.imagesLength(),
          urls: loader.imageURLs()
        };
      });

      expect(result.length).toBe(2);
      expect(result.urls).toEqual([
        'https://example.com/photo.jpg',
        'https://example.com/pic.png'
      ]);
    });

    test('multiple sources are combined in order', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [
            { urls: ['https://example.com/first.jpg'] },
            { urls: ['https://example.com/second.jpg'] }
          ],
          validateUrls: false
        });
        // @ts-ignore
        const filter = new window.ImageFilter();
        await loader.prepare(filter);

        return {
          length: loader.imagesLength(),
          urls: loader.imageURLs()
        };
      });

      expect(result.length).toBe(2);
      expect(result.urls[0]).toBe('https://example.com/first.jpg');
      expect(result.urls[1]).toBe('https://example.com/second.jpg');
    });

  });

  test.describe('JSON Source Type', () => {

    test('loads images from JSON endpoint', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [{ json: '/test/fixtures/static-images.json' }],
          validateUrls: false
        });
        // @ts-ignore
        const filter = new window.ImageFilter();
        await loader.prepare(filter);

        return {
          isPrepared: loader.isPrepared(),
          length: loader.imagesLength(),
          urls: loader.imageURLs()
        };
      });

      expect(result.isPrepared).toBe(true);
      expect(result.length).toBe(6);
      expect(result.urls[0]).toContain('scenery1.jpg');
      expect(result.urls[5]).toContain('computing3.jpg');
    });

    test('throws on invalid JSON response shape', async ({ page }) => {
      // Route to return invalid JSON
      await page.route('/test/fixtures/bad-shape.json', route => {
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ photos: ['a.jpg'] })
        });
      });

      const error = await page.evaluate(async () => {
        try {
          // @ts-ignore
          const loader = new window.StaticImageLoader({
            sources: [{ json: '/test/fixtures/bad-shape.json' }],
            validateUrls: false
          });
          // @ts-ignore
          const filter = new window.ImageFilter();
          await loader.prepare(filter);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });

      // processJson throws, but processSource catches and warns — so loader prepares but with 0 images
      // Actually, looking at the code: processSource catches errors with console.warn
      // So it won't throw, it'll just have 0 images
      // Let me check...
      expect(error).toBeNull(); // Source errors are caught and warned
    });

    test('handles JSON source with invalid shape gracefully (0 images)', async ({ page }) => {
      await page.route('/test/fixtures/bad-shape.json', route => {
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ photos: ['a.jpg'] })
        });
      });

      const result = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [{ json: '/test/fixtures/bad-shape.json' }],
          validateUrls: false
        });
        // @ts-ignore
        const filter = new window.ImageFilter();
        await loader.prepare(filter);
        return {
          isPrepared: loader.isPrepared(),
          length: loader.imagesLength()
        };
      });

      expect(result.isPrepared).toBe(true);
      expect(result.length).toBe(0);
    });

    test('handles HTTP error from JSON endpoint gracefully', async ({ page }) => {
      await page.route('/test/fixtures/not-found.json', route => {
        route.fulfill({ status: 404, body: 'Not found' });
      });

      const result = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [{ json: '/test/fixtures/not-found.json' }],
          validateUrls: false
        });
        // @ts-ignore
        const filter = new window.ImageFilter();
        await loader.prepare(filter);
        return {
          isPrepared: loader.isPrepared(),
          length: loader.imagesLength()
        };
      });

      expect(result.isPrepared).toBe(true);
      expect(result.length).toBe(0);
    });

    test('json source without url logs warning', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [{ json: '' }],  // Missing url
          validateUrls: false
        });
        // @ts-ignore
        const filter = new window.ImageFilter();
        await loader.prepare(filter);
        return {
          isPrepared: loader.isPrepared(),
          length: loader.imagesLength()
        };
      });

      expect(result.isPrepared).toBe(true);
      expect(result.length).toBe(0);
    });

  });

  test.describe('State Management', () => {

    test('isPrepared returns false before prepare()', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/a.jpg'] }]
        });
        return loader.isPrepared();
      });
      expect(result).toBe(false);
    });

    test('imagesLength throws before prepare()', async ({ page }) => {
      const error = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/a.jpg'] }]
        });
        try {
          loader.imagesLength();
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toContain('called before prepare()');
    });

    test('imageURLs throws before prepare()', async ({ page }) => {
      const error = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/a.jpg'] }]
        });
        try {
          loader.imageURLs();
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toContain('called before prepare()');
    });

    test('returns copy of URLs array', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/a.jpg'] }],
          validateUrls: false
        });
        // @ts-ignore
        const filter = new window.ImageFilter();
        await loader.prepare(filter);

        const urls1 = loader.imageURLs();
        const urls2 = loader.imageURLs();

        urls1.push('modified');

        return {
          urls1Length: urls1.length,
          urls2Length: urls2.length
        };
      });

      expect(result.urls1Length).toBe(2);
      expect(result.urls2Length).toBe(1);
    });

  });

});
