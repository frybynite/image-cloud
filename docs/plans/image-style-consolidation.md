# Image Style Consolidation Plan

## Overview

Consolidate the configurator's styling section to use a single form with a state selector (default/hover/focus) instead of three separate control groups. All style properties will be available for all states, with hover and focus inheriting from default when not explicitly set.

## Current State

### Type System (Already Supports Full Parity)
```typescript
export interface ImageStylingConfig {
  default?: ImageStyleState;
  hover?: Partial<ImageStyleState>;    // Can have ALL properties
  focused?: Partial<ImageStyleState>;  // Can have ALL properties
}
```

The `ImageStyleState` interface includes:
- `border` (width, color, style, radius)
- `borderTop/Right/Bottom/Left` (per-side overrides)
- `shadow` (preset or custom CSS)
- `opacity`
- `filter` (grayscale, blur, brightness, contrast, saturate, sepia, hueRotate, invert, dropShadow)
- `outline` (width, color, style, offset)
- `cursor`
- `className`
- `objectFit`, `aspectRatio`

### Current Configurator Limitations
| Property | Default | Hover | Focused |
|----------|---------|-------|---------|
| Border (all) | Yes | No | No |
| Shadow | Yes | Yes | Yes |
| Opacity | Yes | No | No |
| Grayscale | Yes | Yes | Yes |
| Blur | Yes | No | No |
| Brightness | Yes | Yes | No |
| Contrast | Yes | No | No |
| Saturate | Yes | No | No |
| Sepia | Yes | No | No |
| Hue Rotate | Yes | No | No |

**Goal**: All properties available for all states.

---

## Proposed Design

### UI Changes

1. **State Selector**: Add selector at top of Styling accordion
   - Options: Default, Hover, Focused
   - Visual indicator showing which state is active

2. **Single Form**: One set of controls that updates based on selected state
   - Same controls for all states
   - Values reflect the selected state's configuration

3. **Inheritance Indicator**: Show when a value is inherited vs explicitly set
   - Checkbox unchecked = inheriting from default
   - Checkbox checked = explicitly set for this state

4. **Value Display**: When switching states:
   - Show effective value (inherited or explicit)
   - Checkbox reflects whether value is explicitly set for THIS state

---

## Design Decisions (Resolved)

### Q1: State Selector Style
**Decision: Segmented Control** - Modern pill-style buttons, compact and visually clear

### Q2: Inherited Value Display
**Decision: Grayed value, checkbox unchecked** - Show inherited value dimmed when viewing hover/focused state and property is not explicitly set. Makes effective value visible.

### Q3: Checkbox Semantics
**Decision: Per-state** - Each state tracks its own enabled/disabled independently, providing more flexibility.

### Q4: Clear/Reset Functionality
**Decision: Yes** - Include a "Clear overrides" button to reset hover/focused to pure inheritance.

---

## Implementation Approach

### Phase 1: Data Model
- Create internal state object to track per-state configurations
- Track which properties are explicitly set vs inherited per state

### Phase 2: UI Components
- Add state selector component
- Update control IDs/naming to be state-agnostic
- Add visual indicators for inheritance

### Phase 3: Event Handling
- State selector change → populate form with state values
- Control change → update only the selected state's config
- Checkbox change → mark property as explicit/inherited

### Phase 4: Config Generation
- Build config from internal state object
- Only include explicitly set properties in hover/focused

---

## Files to Modify

1. `configurator/index.html` - UI restructure
2. `configurator/field-descriptions.json` - Update help text
3. `docs/PARAMETERS.md` - Document full property support for all states

---

## Risks & Considerations

1. **Complexity**: More JavaScript state management
2. **UX Learning Curve**: Users need to understand state selector
3. **Backwards Compatibility**: Existing presets may need updates
4. **Testing**: Need to test all state combinations

---

## Status: COMPLETED
