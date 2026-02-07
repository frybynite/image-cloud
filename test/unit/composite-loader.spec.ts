import { test, expect } from '@playwright/test';

// Unit tests for CompositeLoader
// These test the loader combining logic without making real API calls

test.describe('CompositeLoader Unit Tests', () => {

  test.describe('Constructor Validation', () => {

    test('throws error when no loaders configured', async ({ page }) => {
      const error = await page.evaluate(() => {
        try {
          // @ts-ignore
          new window.CompositeLoader({ loaders: [] });
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toContain('requires at least one loader');
    });

    test('throws error when loaders is undefined', async ({ page }) => {
      const error = await page.evaluate(() => {
        try {
          // @ts-ignore
          new window.CompositeLoader({});
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toContain('requires at least one loader');
    });

    test('accepts valid loader array', async ({ page }) => {
      const error = await page.evaluate(() => {
        try {
          // @ts-ignore
          const staticLoader = new window.StaticImageLoader({
            sources: [{ urls: ['https://example.com/image.jpg'] }]
          });
          // @ts-ignore
          new window.CompositeLoader({ loaders: [staticLoader] });
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toBeNull();
    });

  });

  test.describe('State Management', () => {

    test('isPrepared returns false before prepare()', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const staticLoader = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/image.jpg'] }]
        });
        // @ts-ignore
        const loader = new window.CompositeLoader({ loaders: [staticLoader] });
        return loader.isPrepared();
      });
      expect(result).toBe(false);
    });

    test('imagesLength throws before prepare()', async ({ page }) => {
      const error = await page.evaluate(() => {
        // @ts-ignore
        const staticLoader = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/image.jpg'] }]
        });
        // @ts-ignore
        const loader = new window.CompositeLoader({ loaders: [staticLoader] });
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
        const staticLoader = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/image.jpg'] }]
        });
        // @ts-ignore
        const loader = new window.CompositeLoader({ loaders: [staticLoader] });
        try {
          loader.imageURLs();
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toContain('called before prepare()');
    });

  });

  test.describe('prepare() with StaticImageLoaders', () => {

    test('combines URLs from multiple static loaders', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // @ts-ignore
        const loader1 = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'] }],
          validationMethod: 'none'
        });
        // @ts-ignore
        const loader2 = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/c.jpg'] }],
          validationMethod: 'none'
        });
        // @ts-ignore
        const composite = new window.CompositeLoader({ loaders: [loader1, loader2] });
        // @ts-ignore
        const filter = new window.ImageFilter();
        await composite.prepare(filter);

        return {
          isPrepared: composite.isPrepared(),
          length: composite.imagesLength(),
          urls: composite.imageURLs()
        };
      });

      expect(result.isPrepared).toBe(true);
      expect(result.length).toBe(3);
      expect(result.urls).toEqual([
        'https://example.com/a.jpg',
        'https://example.com/b.jpg',
        'https://example.com/c.jpg'
      ]);
    });

    test('preserves order of loaders', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // @ts-ignore
        const loader1 = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/first.jpg'] }],
          validationMethod: 'none'
        });
        // @ts-ignore
        const loader2 = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/second.jpg'] }],
          validationMethod: 'none'
        });
        // @ts-ignore
        const loader3 = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/third.jpg'] }],
          validationMethod: 'none'
        });
        // @ts-ignore
        const composite = new window.CompositeLoader({ loaders: [loader1, loader2, loader3] });
        // @ts-ignore
        const filter = new window.ImageFilter();
        await composite.prepare(filter);

        return composite.imageURLs();
      });

      expect(result[0]).toContain('first');
      expect(result[1]).toContain('second');
      expect(result[2]).toContain('third');
    });

    test('handles empty loader gracefully', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // Loader with URLs that will be filtered out
        // @ts-ignore
        const emptyLoader = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/file.pdf'] }], // PDFs filtered
          validationMethod: 'none'
        });
        // @ts-ignore
        const validLoader = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/image.jpg'] }],
          validationMethod: 'none'
        });
        // @ts-ignore
        const composite = new window.CompositeLoader({ loaders: [emptyLoader, validLoader] });
        // @ts-ignore
        const filter = new window.ImageFilter();
        await composite.prepare(filter);

        return {
          length: composite.imagesLength(),
          urls: composite.imageURLs()
        };
      });

      expect(result.length).toBe(1);
      expect(result.urls[0]).toBe('https://example.com/image.jpg');
    });

    test('returns copy of URLs array', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/a.jpg'] }],
          validationMethod: 'none'
        });
        // @ts-ignore
        const composite = new window.CompositeLoader({ loaders: [loader] });
        // @ts-ignore
        const filter = new window.ImageFilter();
        await composite.prepare(filter);

        const urls1 = composite.imageURLs();
        const urls2 = composite.imageURLs();

        // Modify the first array
        urls1.push('modified');

        // Second array should not be affected
        return {
          urls1Length: urls1.length,
          urls2Length: urls2.length
        };
      });

      expect(result.urls1Length).toBe(2);
      expect(result.urls2Length).toBe(1);
    });

  });

  test.describe('Mixed Loader Types', () => {

    test('combines StaticImageLoader with GoogleDriveLoader (unprepared)', async ({ page }) => {
      // This test verifies the composite can be created with different loader types
      // We can't actually call prepare() on GoogleDriveLoader without valid API/URLs
      const result = await page.evaluate(() => {
        // @ts-ignore
        const staticLoader = new window.StaticImageLoader({
          sources: [{ urls: ['https://example.com/static.jpg'] }],
          validationMethod: 'none'
        });
        // @ts-ignore
        const driveLoader = new window.GoogleDriveLoader({
          sources: [{ folders: ['https://drive.google.com/drive/folders/test'] }]
        });
        // @ts-ignore
        const composite = new window.CompositeLoader({
          loaders: [staticLoader, driveLoader]
        });

        return {
          isPrepared: composite.isPrepared()
        };
      });

      expect(result.isPrepared).toBe(false);
    });

  });

  // Setup: load a page that exposes the loaders
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/fixtures/composite-loader-unit-test.html');
    await page.waitForFunction(() =>
      typeof window.CompositeLoader !== 'undefined' &&
      typeof window.StaticImageLoader !== 'undefined' &&
      typeof window.GoogleDriveLoader !== 'undefined' &&
      typeof window.ImageFilter !== 'undefined'
    );
  });

});
