# Image Styling Configuration Design

## Overview

Add comprehensive image styling options to allow users to customize borders, shadows, filters, and other visual properties through configuration, with support for different styles per interaction state (default, hover, focused).

## Goals

- Enable rich visual customization without requiring custom CSS
- Support three interaction states: default, hover, focused
- Allow CSS class injection for power users
- Maintain backward compatibility with existing galleries

## Configuration Structure

```typescript
interface GalleryConfig {
  // ... existing config ...
  styling?: ImageStylingConfig;
}

interface ImageStylingConfig {
  default?: ImageStyleState;
  hover?: Partial<ImageStyleState>;    // inherits from default
  focused?: Partial<ImageStyleState>;  // inherits from default
}

interface ImageStyleState {
  // CSS class names (space-separated string or array)
  className?: string | string[];

  // Border (shorthand applies to all sides)
  border?: BorderConfig;
  borderTop?: Partial<BorderConfig>;
  borderRight?: Partial<BorderConfig>;
  borderBottom?: Partial<BorderConfig>;
  borderLeft?: Partial<BorderConfig>;

  // Shadow (preset name or custom CSS string)
  shadow?: ShadowPreset | string;

  // Filters
  filter?: FilterConfig;

  // Other properties
  opacity?: number;           // 0-1
  cursor?: string;            // CSS cursor value
  outline?: OutlineConfig;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  aspectRatio?: string;       // e.g., '16/9', '1/1'
}
```

### Border Configuration

```typescript
interface BorderConfig {
  width?: number;             // pixels, default: 0
  color?: string;             // CSS color, default: '#000'
  radius?: number;            // pixels, default: 8
  style?: 'solid' | 'dashed' | 'dotted' | 'none';  // default: 'solid'
}
```

Per-side overrides (`borderTop`, etc.) only override specified properties; unspecified properties inherit from `border`.

### Shadow Presets

| Preset | CSS Value |
|--------|-----------|
| `'none'` | `none` |
| `'sm'` | `0 2px 4px rgba(0,0,0,0.1)` |
| `'md'` | `0 4px 16px rgba(0,0,0,0.4)` |
| `'lg'` | `0 8px 32px rgba(0,0,0,0.5)` |
| `'glow'` | `0 0 30px rgba(255,255,255,0.6)` |

Custom CSS shadow strings are passed through directly:
```typescript
shadow: '0 0 20px blue, 0 4px 8px black'
```

### Filter Configuration

```typescript
interface FilterConfig {
  grayscale?: number;    // 0-1
  blur?: number;         // pixels
  brightness?: number;   // multiplier (1 = normal)
  contrast?: number;     // multiplier
  saturate?: number;     // multiplier
  opacity?: number;      // 0-1
  sepia?: number;        // 0-1
  hueRotate?: number;    // degrees
  invert?: number;       // 0-1
  dropShadow?: DropShadowConfig | string;
}

interface DropShadowConfig {
  x: number;
  y: number;
  blur: number;
  color: string;
}
```

### Outline Configuration

```typescript
interface OutlineConfig {
  width?: number;        // pixels
  color?: string;        // CSS color
  style?: 'solid' | 'dashed' | 'dotted' | 'none';
  offset?: number;       // pixels
}
```

## Style Inheritance

1. **Default state** provides base styles
2. **Hover state** inherits from default, overrides only specified properties
3. **Focused state** inherits from default, overrides only specified properties

Classes are additive:
- Default className is always applied
- Hover className is added on hover (alongside default)
- Focused className is added when zoomed (alongside default)

Inline styles from structured config are applied first, then className allows CSS override via specificity.

## Example Configurations

### Basic Border and Shadow

```typescript
{
  styling: {
    default: {
      border: { width: 2, color: '#333', radius: 12 },
      shadow: 'md'
    },
    hover: {
      shadow: 'lg'
    },
    focused: {
      border: { color: '#fff' },
      shadow: 'glow'
    }
  }
}
```

### Grayscale to Color on Focus

```typescript
{
  styling: {
    default: {
      filter: { grayscale: 1, brightness: 0.8 }
    },
    hover: {
      filter: { grayscale: 0.5, brightness: 1 }
    },
    focused: {
      filter: { grayscale: 0, brightness: 1 }
    }
  }
}
```

### Using Custom CSS Classes

```typescript
{
  styling: {
    default: {
      className: 'gallery-image custom-border'
    },
    hover: {
      className: 'gallery-image-hover'
    },
    focused: {
      className: 'gallery-image-focused'
    }
  }
}
```

### Asymmetric Borders

```typescript
{
  styling: {
    default: {
      border: { width: 0 },
      borderBottom: { width: 4, color: '#007bff', style: 'solid' }
    }
  }
}
```

## Default Values

```typescript
const DEFAULT_STYLING: ImageStylingConfig = {
  default: {
    border: {
      width: 0,
      color: '#000000',
      radius: 8,
      style: 'solid'
    },
    shadow: 'md',
    filter: {},
    opacity: 1,
    cursor: 'pointer',
    outline: {
      width: 0,
      color: '#000000',
      style: 'solid',
      offset: 0
    }
  },
  hover: {
    shadow: 'lg'
  },
  focused: {
    shadow: 'glow'
  }
};
```

## Implementation Notes

### Files to Modify

1. **src/config/types.ts** - Add new interfaces
2. **src/config/defaults.ts** - Add default values and merge logic
3. **src/ImageGallery.ts** - Apply styles to images
4. **src/engines/ZoomEngine.ts** - Apply focused state styles
5. **src/styles/gallery.css** - Remove hardcoded values that become configurable

### Style Application Order

1. Base CSS from gallery.css (reset/foundation)
2. Default state inline styles
3. Default state className
4. State-specific inline styles (hover/focused)
5. State-specific className (hover/focused)

### Backward Compatibility

- Existing `borderColor` in layout generator continues to work
- Existing CSS variable overrides continue to work
- New `styling` config is optional, defaults provide current behavior

## Open Questions

None - design is complete.

## Testing Plan

1. Unit tests for style merging logic
2. Visual regression tests for each state
3. Test className + inline style interaction
4. Test per-side border overrides
5. Test filter combinations
6. Verify backward compatibility with existing galleries
