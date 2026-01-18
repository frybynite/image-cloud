import { test, expect } from '@playwright/test';

// Unit tests for GoogleDriveLoader
// These test URL parsing and validation logic without making real API calls

test.describe('GoogleDriveLoader Unit Tests', () => {

  test.describe('extractFolderId', () => {

    test('extracts folder ID from standard URL', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({});
        return loader.extractFolderId('https://drive.google.com/drive/folders/19JY4GPJkTIVa5DwrqNftYOuJfGUWRU5t');
      });
      expect(result).toBe('19JY4GPJkTIVa5DwrqNftYOuJfGUWRU5t');
    });

    test('extracts folder ID from URL with sharing parameter', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({});
        return loader.extractFolderId('https://drive.google.com/drive/folders/19JY4GPJkTIVa5DwrqNftYOuJfGUWRU5t?usp=sharing');
      });
      expect(result).toBe('19JY4GPJkTIVa5DwrqNftYOuJfGUWRU5t');
    });

    test('extracts folder ID from id= format', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({});
        return loader.extractFolderId('https://drive.google.com/open?id=19JY4GPJkTIVa5DwrqNftYOuJfGUWRU5t');
      });
      expect(result).toBe('19JY4GPJkTIVa5DwrqNftYOuJfGUWRU5t');
    });

    test('returns null for invalid URL', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({});
        return loader.extractFolderId('https://example.com/not-a-drive-url');
      });
      expect(result).toBeNull();
    });

    test('returns null for empty string', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({});
        return loader.extractFolderId('');
      });
      expect(result).toBeNull();
    });

  });

  test.describe('manualImageUrls', () => {

    test('generates correct URLs from image IDs', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({});
        return loader.manualImageUrls(['abc123', 'def456']);
      });
      expect(result).toEqual([
        'https://drive.google.com/uc?export=view&id=abc123',
        'https://drive.google.com/uc?export=view&id=def456'
      ]);
    });

    test('handles empty array', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({});
        return loader.manualImageUrls([]);
      });
      expect(result).toEqual([]);
    });

  });

  test.describe('loadImagesFromFolder validation', () => {

    test('throws error for invalid folder URL', async ({ page }) => {
      const error = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({});
        try {
          await loader.loadImagesFromFolder('invalid-url');
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toContain('Invalid Google Drive folder URL');
    });

    test('throws error for array input (StaticSource format)', async ({ page }) => {
      const error = await page.evaluate(async () => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({});
        try {
          await loader.loadImagesFromFolder([{ type: 'urls', urls: [] }]);
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      });
      expect(error).toContain('does not support StaticSource');
    });

  });

  test.describe('allowedExtensions', () => {

    test('uses default extensions when not specified', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({});
        // Access private property for testing
        return loader.allowedExtensions;
      });
      expect(result).toContain('jpg');
      expect(result).toContain('jpeg');
      expect(result).toContain('png');
      expect(result).toContain('gif');
      expect(result).toContain('webp');
    });

    test('uses custom extensions when specified', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const loader = new window.GoogleDriveLoader({
          allowedExtensions: ['png', 'svg']
        });
        return loader.allowedExtensions;
      });
      expect(result).toEqual(['png', 'svg']);
    });

  });

  // Setup: load a page that exposes GoogleDriveLoader
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/fixtures/google-drive-unit-test.html');
    await page.waitForFunction(() => typeof window.GoogleDriveLoader !== 'undefined');
  });

});
