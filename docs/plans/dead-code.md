# Dead Code Audit

Identified unused parameters, functions, and exports as of 2026-03-01.

---

## Unused Config Parameters

### Stub parameters (defined but explicitly marked "not implemented yet")

These are declared in `src/config/types.ts` and `src/config/defaults.ts` but never read by any implementation.

| Parameter | Notes |
|---|---|
| `animation.performance.useGPU` | Stub — never accessed |
| `animation.performance.reduceMotion` | Stub — never accessed |
| `interaction.navigation.keyboard` | Stub — keyboard nav is always-on, config flag ignored |
| `interaction.navigation.swipe` | Stub — SwipeEngine always initialised, config flag ignored |
| `interaction.navigation.mouseWheel` | Stub — never referenced |
| `interaction.gestures.pinchToZoom` | Stub — never accessed |
| `interaction.gestures.doubleTapToFocus` | Stub — never accessed |
| `rendering.responsive.breakpoints.tablet` | Stub — breakpoints handled by LayoutEngine logic, not this config |
| `rendering.responsive.breakpoints.desktop` | Stub — same as above |
| `rendering.responsive.mobileDetection` | Stub — never called |

**Options:** Remove the entire stub namespaces (`animation.performance`, `animation.queue`, `interaction.navigation`, `interaction.gestures`, `rendering.responsive`) or keep with a documented "reserved" status.

### Functional dead parameters

| Parameter | Notes |
|---|---|
| `layout.spacing.minGap` | Defined in types + defaults, no layout implementation reads it — already tracked in backlog |

---

## Unused Functions / Constants

| Symbol | Location | Notes |
|---|---|---|
| `getBounceCSSEasing()` | `src/engines/PathAnimator.ts:465` | Exported but never called anywhere in the codebase |
| `ENTRY_SCALE_PRESETS` | `src/config/defaults.ts:72-78` | Exported constant, never imported or used |

---

## Missing / Inconsistent Exports

| Symbol | Notes |
|---|---|
| `HoneycombPlacementLayout` | Used internally by LayoutEngine but not exported from `src/index.ts` — inconsistent with other layout classes |
| `IdleAnimationEngine` | Used internally, not exported |
| `SwipeEngine` | Used internally, not exported |

---

## Configurator Mismatch

- **`debugCenters`** appears in `configurator/field-descriptions.json` as a top-level parameter, but it was moved to `config.debug.centers`. The configurator field wiring may be incorrect.

---

## Recommended Actions

1. **Remove stub namespaces** — strip out `animation.performance`, `animation.queue`, `interaction.navigation`, `interaction.gestures`, `rendering.responsive` from types, defaults, and any config merging logic, unless there is a concrete plan to implement them.
2. **Remove `getBounceCSSEasing()`** — or document and use it if bounce easing is needed.
3. **Remove `ENTRY_SCALE_PRESETS`** — or export it from `src/index.ts` if it is intended as a public utility.
4. **Export `HoneycombPlacementLayout`** from `src/index.ts` for consistency.
5. **Fix configurator `debugCenters`** field path mapping.
6. **Resolve `layout.spacing.minGap`** — implement or remove (tracked in backlog).
