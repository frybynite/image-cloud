import { test, expect } from '@playwright/test';

// Unit tests for GoogleDriveLoader
// These test URL parsing and validation logic without making real API calls

// Minimal config to satisfy constructor validation
const minimalConfig = {
  sources: [{ type: 'folder', folders: ['https://drive.google.com/drive/folders/test'] }]
};

test.describe('GoogleDriveLoader Unit Tests', () => {

  test.describe('extractFolderId', () => {

    test('extracts folder ID from standard URL', async ({ page }) => {
      const result = await page.evaluate((config) => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader(config);
        return loader.extractFolderId('https://drive.google.com/drive/folders/1HYxzGcUmPl5I5pUHlGUHDx2i5IS1f3Ph');
      }, minimalConfig);
      expect(result).toBe('1HYxzGcUmPl5I5pUHlGUHDx2i5IS1f3Ph');
    });

    test('extracts folder ID from URL with sharing parameter', async ({ page }) => {
      const result = await page.evaluate((config) => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader(config);
        return loader.extractFolderId('https://drive.google.com/drive/folders/1HYxzGcUmPl5I5pUHlGUHDx2i5IS1f3Ph?usp=sharing');
      }, minimalConfig);
      expect(result).toBe('1HYxzGcUmPl5I5pUHlGUHDx2i5IS1f3Ph');
    });

    test('extracts folder ID from id= format', async ({ page }) => {
      const result = await page.evaluate((config) => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader(config);
        return loader.extractFolderId('https://drive.google.com/open?id=1HYxzGcUmPl5I5pUHlGUHDx2i5IS1f3Ph');
      }, minimalConfig);
      expect(result).toBe('1HYxzGcUmPl5I5pUHlGUHDx2i5IS1f3Ph');
    });

    test('returns null for invalid URL', async ({ page }) => {
      const result = await page.evaluate((config) => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader(config);
        return loader.extractFolderId('https://example.com/not-a-drive-url');
      }, minimalConfig);
      expect(result).toBeNull();
    });

    test('returns null for empty string', async ({ page }) => {
      const result = await page.evaluate((config) => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader(config);
        return loader.extractFolderId('');
      }, minimalConfig);
      expect(result).toBeNull();
    });

  });

  test.describe('manualImageUrls', () => {

    test('generates correct URLs from image IDs', async ({ page }) => {
      const result = await page.evaluate((config) => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader(config);
        return loader.manualImageUrls(['abc123', 'def456']);
      }, minimalConfig);
      expect(result).toEqual([
        'https://drive.google.com/uc?export=view&id=abc123',
        'https://drive.google.com/uc?export=view&id=def456'
      ]);
    });

    test('handles empty array', async ({ page }) => {
      const result = await page.evaluate((config) => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader(config);
        return loader.manualImageUrls([]);
      }, minimalConfig);
      expect(result).toEqual([]);
    });

  });

  test.describe('Constructor Validation', () => {

    test('throws error when no sources configured', async ({ page }) => {
      const error = await page.evaluate(() => {
        try {
          // @ts-ignore
          new window.GoogleDriveLoader({});
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toContain('requires at least one source');
    });

    test('throws error when sources array is empty', async ({ page }) => {
      const error = await page.evaluate(() => {
        try {
          // @ts-ignore
          new window.GoogleDriveLoader({ sources: [] });
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toContain('requires at least one source');
    });

  });

  test.describe('prepare() validation', () => {

    test('throws error for invalid folder URL during prepare', async ({ page }) => {
      const error = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({
          sources: [{ type: 'folder', folders: ['invalid-url'] }]
        });
        const filter = { isAllowed: () => true };
        try {
          await loader.prepare(filter);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toContain('Invalid Google Drive folder URL');
    });

  });

  test.describe('State Management', () => {

    test('isPrepared returns false before prepare()', async ({ page }) => {
      const result = await page.evaluate((config) => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader(config);
        return loader.isPrepared();
      }, minimalConfig);
      expect(result).toBe(false);
    });

    test('imagesLength throws before prepare()', async ({ page }) => {
      const error = await page.evaluate((config) => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader(config);
        try {
          loader.imagesLength();
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, minimalConfig);
      expect(error).toContain('called before prepare()');
    });

    test('imageURLs throws before prepare()', async ({ page }) => {
      const error = await page.evaluate((config) => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader(config);
        try {
          loader.imageURLs();
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      }, minimalConfig);
      expect(error).toContain('called before prepare()');
    });

  });

  // Setup: load a page that exposes GoogleDriveLoader
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/fixtures/google-drive-unit-test.html');
    await page.waitForFunction(() => typeof window.GoogleDriveLoader !== 'undefined');
  });

});
