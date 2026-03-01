# Dead Code Audit

Identified unused parameters, functions, and exports as of 2026-03-01.

---

## Unused Config Parameters

### Stub parameters (defined but explicitly marked "not implemented yet")

These are declared in `src/config/types.ts` and `src/config/defaults.ts` but never read by any implementation.

| Parameter | Notes |
|---|---|
| `interaction.navigation.mouseWheel` | Stub — never referenced |

**Options:** Remove `interaction.navigation.mouseWheel` or reserve for a future implementation. (`rendering.responsive` fully removed.)

---

## Configurator Mismatch

- **`debugCenters`** appears in `configurator/field-descriptions.json` as a top-level parameter, but it was moved to `config.debug.centers`. The configurator field wiring may be incorrect.

---

## Recommended Actions

1. **Remove `interaction.navigation.mouseWheel`** — stub, never referenced. (`rendering.responsive`, `animation.performance`, `animation.queue.maxConcurrent`, and `interaction.gestures` already removed. `interaction.navigation.keyboard` and `.swipe` are now implemented.)
2. **Fix configurator `debugCenters`** field path mapping.
