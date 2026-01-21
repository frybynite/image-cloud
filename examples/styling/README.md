# Image Styling Examples

This folder contains comprehensive examples demonstrating all image styling configuration options.

## How to Run

1. Build the library: `npm run build`
2. Serve the examples: `npm run serve`
3. Navigate to `http://localhost:8080/examples/styling/`

## Examples

### Border Configuration
- **borders-basic.html** - `border.width`, `border.color`, `border.radius`, `border.style`
- **borders-asymmetric.html** - `borderTop`, `borderBottom`, `borderLeft`, `borderRight`

### Shadow Configuration
- **shadows.html** - Shadow presets (`'none'`, `'sm'`, `'md'`, `'lg'`, `'glow'`) and custom CSS strings

### Filter Configuration
- **filters-grayscale.html** - `filter.grayscale`, `filter.brightness`
- **filters-effects.html** - `filter.contrast`, `filter.saturate`, `filter.sepia`, `filter.hueRotate`
- **filters-blur-invert.html** - `filter.blur`, `filter.opacity`, `filter.invert`
- **filters-dropshadow.html** - `filter.dropShadow` (object and string formats)

### Other Properties
- **opacity-cursor.html** - `opacity`, `cursor`
- **outline.html** - `outline.width`, `outline.color`, `outline.style`, `outline.offset`
- **classnames.html** - `className` injection (string and array formats)

### Combined Effects
- **combined-polaroid.html** - Polaroid photo frame effect
- **combined-vintage.html** - Vintage/retro photo effect
- **combined-neon.html** - Cyberpunk neon glow effect

## Configuration Reference

```typescript
styling: {
  default: {
    // CSS class names
    className: string | string[];

    // Border (uniform)
    border: {
      width: number;      // pixels
      color: string;      // CSS color
      radius: number;     // pixels
      style: 'solid' | 'dashed' | 'dotted' | 'none';
    };

    // Per-side border overrides
    borderTop: Partial<BorderConfig>;
    borderRight: Partial<BorderConfig>;
    borderBottom: Partial<BorderConfig>;
    borderLeft: Partial<BorderConfig>;

    // Shadow
    shadow: 'none' | 'sm' | 'md' | 'lg' | 'glow' | string;

    // Filters
    filter: {
      grayscale: number;   // 0-1
      blur: number;        // pixels
      brightness: number;  // multiplier
      contrast: number;    // multiplier
      saturate: number;    // multiplier
      opacity: number;     // 0-1
      sepia: number;       // 0-1
      hueRotate: number;   // degrees
      invert: number;      // 0-1
      dropShadow: { x, y, blur, color } | string;
    };

    // Other
    opacity: number;       // 0-1
    cursor: string;        // CSS cursor
    outline: {
      width: number;
      color: string;
      style: 'solid' | 'dashed' | 'dotted' | 'none';
      offset: number;
    };
    objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    aspectRatio: string;   // e.g., '16/9'
  },

  // Hover state (inherits from default)
  hover: Partial<ImageStyleState>;

  // Focused/zoomed state (inherits from default)
  focused: Partial<ImageStyleState>;
}
```
