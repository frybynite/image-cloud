import { test, expect } from '@playwright/test';

// Unit tests for ImageFilter
// Tests extension filtering, case insensitivity, edge cases, and custom extensions

test.describe('ImageFilter Unit Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/test/fixtures/image-filter-unit-test.html');
    await page.waitForFunction(() => typeof window.ImageFilter !== 'undefined');
  });

  test.describe('Default Extensions', () => {

    test('allows jpg files', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('photo.jpg');
      });
      expect(result).toBe(true);
    });

    test('allows jpeg files', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('photo.jpeg');
      });
      expect(result).toBe(true);
    });

    test('allows png files', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('photo.png');
      });
      expect(result).toBe(true);
    });

    test('allows gif files', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('photo.gif');
      });
      expect(result).toBe(true);
    });

    test('allows webp files', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('photo.webp');
      });
      expect(result).toBe(true);
    });

    test('allows bmp files', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('photo.bmp');
      });
      expect(result).toBe(true);
    });

    test('rejects pdf files', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('document.pdf');
      });
      expect(result).toBe(false);
    });

    test('rejects txt files', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('readme.txt');
      });
      expect(result).toBe(false);
    });

    test('rejects mp4 files', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('video.mp4');
      });
      expect(result).toBe(false);
    });

  });

  test.describe('Case Insensitivity', () => {

    test('allows uppercase JPG extension', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('photo.JPG');
      });
      expect(result).toBe(true);
    });

    test('allows mixed-case PNG extension', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('photo.Png');
      });
      expect(result).toBe(true);
    });

    test('allows uppercase WEBP extension', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('photo.WEBP');
      });
      expect(result).toBe(true);
    });

    test('allows uppercase JPEG extension', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('photo.JPEG');
      });
      expect(result).toBe(true);
    });

  });

  test.describe('Query String Handling', () => {

    test('strips query string before checking extension', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('photo.jpg?w=800&h=600');
      });
      expect(result).toBe(true);
    });

    test('strips complex query string from URL', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('https://example.com/photo.png?size=large&format=auto');
      });
      expect(result).toBe(true);
    });

    test('rejects non-image URL with query string stripping', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('document.pdf?download=true');
      });
      expect(result).toBe(false);
    });

  });

  test.describe('Edge Cases', () => {

    test('rejects filename with no extension', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('photonoext');
      });
      expect(result).toBe(false);
    });

    test('rejects empty string', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('');
      });
      expect(result).toBe(false);
    });

    test('handles filename with multiple dots - uses last extension', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('photo.backup.jpg');
      });
      expect(result).toBe(true);
    });

    test('rejects filename with multiple dots if last extension is not image', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('image.jpg.bak');
      });
      expect(result).toBe(false);
    });

    test('handles full URL path with extension', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('/path/to/photos/image1.jpg');
      });
      expect(result).toBe(true);
    });

    test('handles full https URL', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('https://cdn.example.com/images/photo.webp');
      });
      expect(result).toBe(true);
    });

    test('URL with fragment but no query string - documents current behavior', async ({ page }) => {
      // The implementation splits on '?' but not '#'.
      // A URL like 'image.jpg#section' results in extension 'jpg#section',
      // which does not match 'jpg'. This test documents current behavior.
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.isAllowed('image.jpg#section');
      });
      // Fragment is not stripped; extension resolves to 'jpg#section' → not allowed
      expect(result).toBe(false);
    });

  });

  test.describe('Custom Extensions', () => {

    test('uses only provided extensions when constructor arg given', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter(['tiff', 'avif']);
        return {
          tiff: f.isAllowed('photo.tiff'),
          avif: f.isAllowed('photo.avif'),
          jpg: f.isAllowed('photo.jpg'),  // not in custom list
        };
      });
      expect(result.tiff).toBe(true);
      expect(result.avif).toBe(true);
      expect(result.jpg).toBe(false);
    });

    test('empty custom extensions array rejects all filenames', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter([]);
        return f.isAllowed('photo.jpg');
      });
      expect(result).toBe(false);
    });

    test('custom extensions are case-insensitive too', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter(['tiff']);
        return {
          lowercase: f.isAllowed('photo.tiff'),
          uppercase: f.isAllowed('photo.TIFF'),
          mixed: f.isAllowed('photo.Tiff'),
        };
      });
      expect(result.lowercase).toBe(true);
      expect(result.uppercase).toBe(true);
      expect(result.mixed).toBe(true);
    });

  });

  test.describe('getAllowedExtensions', () => {

    test('returns all six default extensions', async ({ page }) => {
      const exts = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        return f.getAllowedExtensions();
      });
      expect(exts).toContain('jpg');
      expect(exts).toContain('jpeg');
      expect(exts).toContain('png');
      expect(exts).toContain('gif');
      expect(exts).toContain('webp');
      expect(exts).toContain('bmp');
      expect(exts.length).toBe(6);
    });

    test('returns defensive copy - mutation does not affect internal state', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter();
        const exts = f.getAllowedExtensions();
        exts.push('pdf');  // Mutate the returned array
        const exts2 = f.getAllowedExtensions();
        return {
          mutatedLength: exts.length,
          internalLength: exts2.length,
        };
      });
      expect(result.mutatedLength).toBe(result.internalLength + 1);
    });

    test('returns custom extensions when provided', async ({ page }) => {
      const exts = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter(['tiff', 'svg']);
        return f.getAllowedExtensions();
      });
      expect(exts).toEqual(['tiff', 'svg']);
    });

    test('getAllowedExtensions and isAllowed agree on allowed types', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        const f = new window.ImageFilter(['svg', 'tiff']);
        const allowed = f.getAllowedExtensions();
        // Every extension in the list should be allowed
        return allowed.every((ext: string) => f.isAllowed(`photo.${ext}`));
      });
      expect(result).toBe(true);
    });

  });

});
