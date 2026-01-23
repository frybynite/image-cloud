import { test, expect } from '@playwright/test';
import { getImageCount } from '../utils/test-helpers';

const TEST_IMAGES = [
  '/test/fixtures/images/image1.jpg',
  '/test/fixtures/images/image2.jpg',
  '/test/fixtures/images/image3.jpg',
  '/test/fixtures/images/food1.jpg'
];

async function initGallery(page: any, stylingConfig: object = {}) {
  await page.goto('/test/fixtures/styling.html');
  await page.evaluate(() => {
    // @ts-ignore
    if (window.gallery) window.gallery.destroy();
    const container = document.getElementById('imageCloud');
    if (container) container.innerHTML = '';
  });

  await page.evaluate(async ({ urls, styling }: { urls: string[], styling: object }) => {
    // @ts-ignore
    window.gallery = new window.ImageGallery({
      container: 'imageCloud',
      loader: {
        type: 'static',
        static: { sources: [{ type: 'urls', urls }], validateUrls: false }
      },
      layout: {
        algorithm: 'grid',
        rotation: { enabled: false },
        grid: { columns: 2, rows: 2, gap: 20 }
      },
      styling,
      animation: { duration: 100, queue: { enabled: true, interval: 20 } }
    });
    // @ts-ignore
    await window.gallery.init();
  }, { urls: TEST_IMAGES, styling: stylingConfig });

  await page.waitForSelector('#imageCloud img', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(300);
}

test.describe('Image Styling', () => {

  test.describe('Border Configuration', () => {

    test('applies border width', async ({ page }) => {
      await initGallery(page, {
        default: {
          border: { width: 5, color: '#ff0000', style: 'solid' }
        }
      });

      const image = page.locator('#imageCloud img').first();
      const border = await image.evaluate((el) => window.getComputedStyle(el).border);

      expect(border).toContain('5px');
      expect(border).toContain('solid');
    });

    test('applies border color', async ({ page }) => {
      await initGallery(page, {
        default: {
          border: { width: 3, color: '#00ff00', style: 'solid' }
        }
      });

      const image = page.locator('#imageCloud img').first();
      const borderColor = await image.evaluate((el) => window.getComputedStyle(el).borderColor);

      // Color may be in rgb format
      expect(borderColor).toMatch(/rgb\(0,\s*255,\s*0\)|#00ff00/i);
    });

    test('applies border radius', async ({ page }) => {
      await initGallery(page, {
        default: {
          border: { radius: 20 }
        }
      });

      const image = page.locator('#imageCloud img').first();
      const borderRadius = await image.evaluate((el) => window.getComputedStyle(el).borderRadius);

      expect(borderRadius).toBe('20px');
    });

    test('applies dashed border style', async ({ page }) => {
      await initGallery(page, {
        default: {
          border: { width: 3, color: '#000000', style: 'dashed' }
        }
      });

      const image = page.locator('#imageCloud img').first();
      const borderStyle = await image.evaluate((el) => window.getComputedStyle(el).borderStyle);

      expect(borderStyle).toBe('dashed');
    });

    test('applies dotted border style', async ({ page }) => {
      await initGallery(page, {
        default: {
          border: { width: 3, color: '#000000', style: 'dotted' }
        }
      });

      const image = page.locator('#imageCloud img').first();
      const borderStyle = await image.evaluate((el) => window.getComputedStyle(el).borderStyle);

      expect(borderStyle).toBe('dotted');
    });

    test('no border when width is 0', async ({ page }) => {
      await initGallery(page, {
        default: {
          border: { width: 0 }
        }
      });

      const image = page.locator('#imageCloud img').first();
      const borderWidth = await image.evaluate((el) => window.getComputedStyle(el).borderWidth);

      expect(borderWidth).toBe('0px');
    });

  });

  test.describe('Per-Side Borders', () => {

    test('applies different border on top only', async ({ page }) => {
      await initGallery(page, {
        default: {
          border: { width: 0 },
          borderTop: { width: 5, color: '#ff0000', style: 'solid' }
        }
      });

      const image = page.locator('#imageCloud img').first();
      const styles = await image.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          top: computed.borderTopWidth,
          right: computed.borderRightWidth,
          bottom: computed.borderBottomWidth,
          left: computed.borderLeftWidth
        };
      });

      expect(styles.top).toBe('5px');
      expect(styles.right).toBe('0px');
      expect(styles.bottom).toBe('0px');
      expect(styles.left).toBe('0px');
    });

    test('applies different borders on each side', async ({ page }) => {
      await initGallery(page, {
        default: {
          borderTop: { width: 2, color: '#ff0000', style: 'solid' },
          borderRight: { width: 4, color: '#00ff00', style: 'solid' },
          borderBottom: { width: 6, color: '#0000ff', style: 'solid' },
          borderLeft: { width: 8, color: '#ffff00', style: 'solid' }
        }
      });

      const image = page.locator('#imageCloud img').first();
      const styles = await image.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          top: computed.borderTopWidth,
          right: computed.borderRightWidth,
          bottom: computed.borderBottomWidth,
          left: computed.borderLeftWidth
        };
      });

      expect(styles.top).toBe('2px');
      expect(styles.right).toBe('4px');
      expect(styles.bottom).toBe('6px');
      expect(styles.left).toBe('8px');
    });

  });

  test.describe('Shadow Presets', () => {

    test('applies no shadow preset', async ({ page }) => {
      await initGallery(page, {
        default: { shadow: 'none' }
      });

      const image = page.locator('#imageCloud img').first();
      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      expect(boxShadow).toBe('none');
    });

    test('applies sm shadow preset', async ({ page }) => {
      await initGallery(page, {
        default: { shadow: 'sm' }
      });

      const image = page.locator('#imageCloud img').first();
      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      expect(boxShadow).not.toBe('none');
      // sm = '0 2px 4px rgba(0,0,0,0.1)'
      expect(boxShadow).toContain('rgba');
    });

    test('applies md shadow preset (default)', async ({ page }) => {
      await initGallery(page, {
        default: { shadow: 'md' }
      });

      const image = page.locator('#imageCloud img').first();
      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      expect(boxShadow).not.toBe('none');
    });

    test('applies lg shadow preset', async ({ page }) => {
      await initGallery(page, {
        default: { shadow: 'lg' }
      });

      const image = page.locator('#imageCloud img').first();
      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      expect(boxShadow).not.toBe('none');
    });

    test('applies glow shadow preset', async ({ page }) => {
      await initGallery(page, {
        default: { shadow: 'glow' }
      });

      const image = page.locator('#imageCloud img').first();
      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      expect(boxShadow).not.toBe('none');
      // glow = '0 0 30px rgba(255,255,255,0.6)'
    });

    test('applies custom shadow CSS string', async ({ page }) => {
      await initGallery(page, {
        default: { shadow: '10px 10px 20px red' }
      });

      const image = page.locator('#imageCloud img').first();
      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      expect(boxShadow).not.toBe('none');
      expect(boxShadow).toContain('10px');
    });

  });

  test.describe('Filter Effects', () => {

    test('applies grayscale filter', async ({ page }) => {
      await initGallery(page, {
        default: { filter: { grayscale: 1 } }
      });

      const image = page.locator('#imageCloud img').first();
      const filter = await image.evaluate((el) => window.getComputedStyle(el).filter);

      expect(filter).toContain('grayscale');
    });

    test('applies blur filter', async ({ page }) => {
      await initGallery(page, {
        default: { filter: { blur: 5 } }
      });

      const image = page.locator('#imageCloud img').first();
      const filter = await image.evaluate((el) => window.getComputedStyle(el).filter);

      expect(filter).toContain('blur');
    });

    test('applies brightness filter', async ({ page }) => {
      await initGallery(page, {
        default: { filter: { brightness: 1.5 } }
      });

      const image = page.locator('#imageCloud img').first();
      const filter = await image.evaluate((el) => window.getComputedStyle(el).filter);

      expect(filter).toContain('brightness');
    });

    test('applies contrast filter', async ({ page }) => {
      await initGallery(page, {
        default: { filter: { contrast: 1.5 } }
      });

      const image = page.locator('#imageCloud img').first();
      const filter = await image.evaluate((el) => window.getComputedStyle(el).filter);

      expect(filter).toContain('contrast');
    });

    test('applies saturate filter', async ({ page }) => {
      await initGallery(page, {
        default: { filter: { saturate: 2 } }
      });

      const image = page.locator('#imageCloud img').first();
      const filter = await image.evaluate((el) => window.getComputedStyle(el).filter);

      expect(filter).toContain('saturate');
    });

    test('applies sepia filter', async ({ page }) => {
      await initGallery(page, {
        default: { filter: { sepia: 0.8 } }
      });

      const image = page.locator('#imageCloud img').first();
      const filter = await image.evaluate((el) => window.getComputedStyle(el).filter);

      expect(filter).toContain('sepia');
    });

    test('applies hue-rotate filter', async ({ page }) => {
      await initGallery(page, {
        default: { filter: { hueRotate: 90 } }
      });

      const image = page.locator('#imageCloud img').first();
      const filter = await image.evaluate((el) => window.getComputedStyle(el).filter);

      expect(filter).toContain('hue-rotate');
    });

    test('applies invert filter', async ({ page }) => {
      await initGallery(page, {
        default: { filter: { invert: 1 } }
      });

      const image = page.locator('#imageCloud img').first();
      const filter = await image.evaluate((el) => window.getComputedStyle(el).filter);

      expect(filter).toContain('invert');
    });

    test('applies multiple filters', async ({ page }) => {
      await initGallery(page, {
        default: {
          filter: {
            grayscale: 0.5,
            brightness: 1.2,
            contrast: 1.1
          }
        }
      });

      const image = page.locator('#imageCloud img').first();
      const filter = await image.evaluate((el) => window.getComputedStyle(el).filter);

      expect(filter).toContain('grayscale');
      expect(filter).toContain('brightness');
      expect(filter).toContain('contrast');
    });

    test('applies drop-shadow filter', async ({ page }) => {
      await initGallery(page, {
        default: {
          filter: {
            dropShadow: { x: 5, y: 5, blur: 10, color: 'rgba(0,0,0,0.5)' }
          }
        }
      });

      const image = page.locator('#imageCloud img').first();
      const filter = await image.evaluate((el) => window.getComputedStyle(el).filter);

      expect(filter).toContain('drop-shadow');
    });

  });

  test.describe('Opacity', () => {

    test('applies custom opacity config', async ({ page }) => {
      await initGallery(page, {
        default: { opacity: 0.5 }
      });

      const image = page.locator('#imageCloud img').first();
      const opacity = await image.evaluate((el) => window.getComputedStyle(el).opacity);

      // Opacity should be reduced (may be combined with unfocused opacity)
      expect(parseFloat(opacity)).toBeLessThan(1);
    });

    test('opacity is applied to images', async ({ page }) => {
      await initGallery(page, {
        default: { opacity: 1 }
      });

      const image = page.locator('#imageCloud img').first();
      const opacity = await image.evaluate((el) => window.getComputedStyle(el).opacity);

      // Opacity should be a valid value
      expect(parseFloat(opacity)).toBeGreaterThan(0);
      expect(parseFloat(opacity)).toBeLessThanOrEqual(1);
    });

  });

  test.describe('Cursor', () => {

    test('applies pointer cursor by default', async ({ page }) => {
      await initGallery(page, {});

      const image = page.locator('#imageCloud img').first();
      const cursor = await image.evaluate((el) => window.getComputedStyle(el).cursor);

      expect(cursor).toBe('pointer');
    });

    test('applies custom cursor', async ({ page }) => {
      await initGallery(page, {
        default: { cursor: 'zoom-in' }
      });

      const image = page.locator('#imageCloud img').first();
      const cursor = await image.evaluate((el) => window.getComputedStyle(el).cursor);

      expect(cursor).toBe('zoom-in');
    });

  });

  test.describe('Hover State', () => {

    test('hover state changes shadow', async ({ page }) => {
      await initGallery(page, {
        default: { shadow: 'sm' },
        hover: { shadow: 'lg' }
      });

      const image = page.locator('#imageCloud img').first();

      // Get initial shadow
      const initialShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      // Hover over image
      await image.hover();
      await page.waitForTimeout(100);

      // Get hover shadow
      const hoverShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      // Shadows should be different
      expect(hoverShadow).not.toBe(initialShadow);
    });

    test('hover state changes border', async ({ page }) => {
      await initGallery(page, {
        default: { border: { width: 0 } },
        hover: { border: { width: 3, color: '#ff0000', style: 'solid' } }
      });

      const image = page.locator('#imageCloud img').first();

      // Get initial border
      const initialBorder = await image.evaluate((el) => window.getComputedStyle(el).borderWidth);

      // Hover over image
      await image.hover();
      await page.waitForTimeout(100);

      // Get hover border
      const hoverBorder = await image.evaluate((el) => window.getComputedStyle(el).borderWidth);

      expect(initialBorder).toBe('0px');
      expect(hoverBorder).toBe('3px');
    });

    test('hover state applies filter', async ({ page }) => {
      await initGallery(page, {
        default: { filter: {} },
        hover: { filter: { brightness: 1.2 } }
      });

      const image = page.locator('#imageCloud img').first();

      // Hover over image
      await image.hover();
      await page.waitForTimeout(100);

      // Get hover filter
      const filter = await image.evaluate((el) => window.getComputedStyle(el).filter);

      expect(filter).toContain('brightness');
    });

  });

  test.describe('Focused State', () => {

    test('focused state applies when image is clicked', async ({ page }) => {
      await initGallery(page, {
        default: { shadow: 'md' },
        focused: { shadow: 'glow' }
      });

      const image = page.locator('#imageCloud img').first();

      // Click to focus
      await image.click();
      await page.waitForTimeout(300);

      // Get focused shadow
      const focusedShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);

      // Glow shadow should be applied
      expect(focusedShadow).not.toBe('none');
    });

    test('focused state changes border', async ({ page }) => {
      await initGallery(page, {
        default: { border: { width: 0 } },
        focused: { border: { width: 4, color: '#00ff00', style: 'solid' } }
      });

      const image = page.locator('#imageCloud img').first();

      // Click to focus
      await image.click();
      await page.waitForTimeout(300);

      // Get focused border
      const borderWidth = await image.evaluate((el) => window.getComputedStyle(el).borderWidth);

      expect(borderWidth).toBe('4px');
    });

    test('unfocusing restores default state', async ({ page }) => {
      await initGallery(page, {
        default: { border: { width: 1, color: '#000000', style: 'solid' } },
        focused: { border: { width: 5, color: '#ff0000', style: 'solid' } }
      });

      const image = page.locator('#imageCloud img').first();

      // Get initial border
      const initialBorder = await image.evaluate((el) => window.getComputedStyle(el).borderWidth);

      // Click to focus
      await image.click();
      await page.waitForTimeout(300);

      // Verify focused state
      const focusedBorder = await image.evaluate((el) => window.getComputedStyle(el).borderWidth);
      expect(focusedBorder).toBe('5px');

      // Press Escape to unfocus
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Verify restored state
      const restoredBorder = await image.evaluate((el) => window.getComputedStyle(el).borderWidth);
      expect(restoredBorder).toBe(initialBorder);
    });

  });

  test.describe('Custom Class Name', () => {

    test('applies single className string', async ({ page }) => {
      await initGallery(page, {
        default: { className: 'custom-test-class' }
      });

      const image = page.locator('#imageCloud img').first();
      const hasClass = await image.evaluate((el) => el.classList.contains('custom-test-class'));

      expect(hasClass).toBe(true);
    });

    test('applies multiple classNames from array', async ({ page }) => {
      await initGallery(page, {
        default: { className: ['custom-test-class', 'another-class'] }
      });

      const image = page.locator('#imageCloud img').first();
      const classes = await image.evaluate((el) => ({
        hasCustom: el.classList.contains('custom-test-class'),
        hasAnother: el.classList.contains('another-class')
      }));

      expect(classes.hasCustom).toBe(true);
      expect(classes.hasAnother).toBe(true);
    });

  });

  test.describe('Object Fit', () => {

    test('applies cover object-fit', async ({ page }) => {
      await initGallery(page, {
        default: { objectFit: 'cover' }
      });

      const image = page.locator('#imageCloud img').first();
      const objectFit = await image.evaluate((el) => window.getComputedStyle(el).objectFit);

      expect(objectFit).toBe('cover');
    });

    test('applies contain object-fit', async ({ page }) => {
      await initGallery(page, {
        default: { objectFit: 'contain' }
      });

      const image = page.locator('#imageCloud img').first();
      const objectFit = await image.evaluate((el) => window.getComputedStyle(el).objectFit);

      expect(objectFit).toBe('contain');
    });

  });

  test.describe('Combined Styling', () => {

    test('applies multiple style properties together', async ({ page }) => {
      await initGallery(page, {
        default: {
          border: { width: 2, color: '#333333', radius: 12, style: 'solid' },
          shadow: 'lg',
          filter: { brightness: 1.1 },
          opacity: 0.95,
          cursor: 'pointer'
        }
      });

      const image = page.locator('#imageCloud img').first();
      const styles = await image.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          borderWidth: computed.borderWidth,
          borderRadius: computed.borderRadius,
          boxShadow: computed.boxShadow,
          filter: computed.filter,
          opacity: computed.opacity,
          cursor: computed.cursor
        };
      });

      expect(styles.borderWidth).toBe('2px');
      expect(styles.borderRadius).toBe('12px');
      expect(styles.boxShadow).not.toBe('none');
      expect(styles.filter).toContain('brightness');
      expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
      expect(styles.cursor).toBe('pointer');
    });

  });

  test.describe('Edge Cases', () => {

    test('handles empty styling config', async ({ page }) => {
      await initGallery(page, {});

      const count = await getImageCount(page);
      expect(count).toBe(4);

      // Default styles should be applied
      const image = page.locator('#imageCloud img').first();
      const boxShadow = await image.evaluate((el) => window.getComputedStyle(el).boxShadow);
      expect(boxShadow).not.toBe('none'); // Default md shadow
    });

    test('handles partial hover config', async ({ page }) => {
      await initGallery(page, {
        default: {
          border: { width: 1, color: '#000', radius: 8, style: 'solid' },
          shadow: 'md'
        },
        hover: {
          shadow: 'lg'
          // border should inherit from default
        }
      });

      const image = page.locator('#imageCloud img').first();

      // Hover over image
      await image.hover();
      await page.waitForTimeout(100);

      // Border should still be applied (inherited)
      const borderWidth = await image.evaluate((el) => window.getComputedStyle(el).borderWidth);
      expect(borderWidth).toBe('1px');
    });

  });

});
