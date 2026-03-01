# Dead Code Audit

Identified unused parameters, functions, and exports as of 2026-03-01.

---

## Unused Config Parameters

### Stub parameters (defined but explicitly marked "not implemented yet")

These are declared in `src/config/types.ts` and `src/config/defaults.ts` but never read by any implementation.

| Parameter | Notes |
|---|---|
| `interaction.navigation.mouseWheel` | Stub — never referenced |
| `rendering.responsive.breakpoints.tablet` | Stub — breakpoints handled by LayoutEngine logic, not this config |
| `rendering.responsive.breakpoints.desktop` | Stub — same as above |
| `rendering.responsive.mobileDetection` | Stub — never called |

**Options:** Remove the remaining stub namespace (`rendering.responsive`) or keep with a documented "reserved" status. `interaction.navigation.mouseWheel` can be removed or reserved for a future implementation.

---

## Configurator Mismatch

- **`debugCenters`** appears in `configurator/field-descriptions.json` as a top-level parameter, but it was moved to `config.debug.centers`. The configurator field wiring may be incorrect.

---

## Recommended Actions

1. **Remove stub parameters** — strip out `interaction.navigation.mouseWheel` and the `rendering.responsive` stub fields from types, defaults, and any config merging logic, unless there is a concrete plan to implement them. (`animation.performance`, `animation.queue.maxConcurrent`, and `interaction.gestures` already removed. `interaction.navigation.keyboard` and `interaction.navigation.swipe` are now implemented and documented.)
2. **Fix configurator `debugCenters`** field path mapping.
