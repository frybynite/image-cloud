# Idle Animations Implementation Plan

> **Note:** Save this file as `docs/plans/idle-animations.md` at the start of implementation.
> Work in a worktree: `worktrees/idle-animations` on branch `feature/idle-animations`.

## Context

Images in Image Cloud galleries are static once placed. This feature adds continuous ambient animations that run during default and hover states, making galleries feel more alive. Animations pause immediately when an image is clicked/focused and resume only after the unfocus animation fully completes (image returns to normal size). Types: wiggle, pulse, blink, spin, custom.

## Architecture: Web Animations API with `composite: 'add'`

Multiple engines (ZoomEngine, EntryAnimationEngine, hover styles) write to `img.style.transform`. Rather than coordinate, idle animations use the Web Animations API with `composite: 'add'`, which **appends** the idle transform on top of the base transform without replacing it. Zero coordination needed.

**Key behaviors:**
- Keyframes start/end at neutral (rotate(0deg), scale(1)) so pausing at `currentTime=0` contributes zero to the base transform — focus animation starts cleanly
- `sync: 'random'` uses negative delay `-(Math.random() * speed)` to offset phase per image
- Idle starts after entry animation via `setTimeout(delay = entryDuration)` in `register()`
- Blink animates `opacity` (no composite needed)

---

## Files to Create

### `src/engines/IdleAnimationEngine.ts` (new)

```typescript
import type { IdleAnimationConfig, IdleWiggleConfig, IdlePulseConfig, IdleBlinkConfig, IdleSpinConfig } from '../config/types';
import { DEFAULT_IDLE_WIGGLE, DEFAULT_IDLE_PULSE, DEFAULT_IDLE_BLINK, DEFAULT_IDLE_SPIN } from '../config/defaults';

interface IdleEntry {
  element: HTMLElement;
  index: number;
  animation: Animation | null;       // transform-composite animation (wiggle/pulse/spin)
  blinkAnimation: Animation | null;  // opacity animation (blink)
  customTeardown: (() => void) | null;
  paused: boolean;
  stopped: boolean;
}

export class IdleAnimationEngine {
  private config: IdleAnimationConfig;
  private entries: Map<HTMLElement, IdleEntry> = new Map();
  private entryDurationMs: number;

  constructor(config: IdleAnimationConfig, entryDurationMs = 600) { ... }

  register(element: HTMLElement, index: number, totalImages: number, entryDuration?: number): void
  pauseForImage(element: HTMLElement): void    // currentTime=0 then pause
  resumeForImage(element: HTMLElement): void   // play()
  stopForImage(element: HTMLElement): void     // cancel() + delete from map
  pauseAll(): void
  resumeAll(): void
  stopAll(): void

  // Private:
  _startAnimation(entry, totalImages): void
  _computeDelay(sync, speed): number   // 'random' → -(Math.random() * speed), 'together' → 0
  _startWiggle(entry, totalImages): void
  _startPulse(entry, totalImages): void
  _startBlink(entry): void
  _startSpin(entry): void
  _startCustom(entry, totalImages): void
  _pauseEntry(entry): void   // animation.currentTime=0; animation.pause()
  _resumeEntry(entry): void  // animation.play()
  _cancelEntry(entry): void  // animation.cancel()
}
```

**Wiggle keyframes** (neutral start/end):
```typescript
[
  { transform: 'rotate(0deg)',      offset: 0    },
  { transform: `rotate(${max}deg)`, offset: 0.25 },
  { transform: 'rotate(0deg)',      offset: 0.5  },
  { transform: `rotate(${-max}deg)`,offset: 0.75 },
  { transform: 'rotate(0deg)',      offset: 1    }
]
// options: { duration: speed, delay, iterations: Infinity, composite: 'add' }
```

**Pulse keyframes** (neutral start/end, scale(1) = adds nothing):
```typescript
[
  { transform: 'scale(1)',               offset: 0    },
  { transform: `scale(${cfg.maxScale})`, offset: 0.25 },
  { transform: 'scale(1)',               offset: 0.5  },
  { transform: `scale(${cfg.minScale})`, offset: 0.75 },
  { transform: 'scale(1)',               offset: 1    }
]
// options: { duration: speed, delay, iterations: Infinity, composite: 'add' }
```

**Blink keyframes** (opacity, no composite):
```typescript
// style: 'snap' — sharp cut (default)
[
  { opacity: 1, offset: 0              },
  { opacity: 1, offset: onRatio        },
  { opacity: 0, offset: onRatio + 0.01 },
  { opacity: 0, offset: 0.99           },
  { opacity: 1, offset: 1              }
]
// options: { duration: speed, delay: -(Math.random()*speed), iterations: Infinity }

// style: 'fade' — soft fade in/out
[
  { opacity: 1, offset: 0              },
  { opacity: 0, offset: 0.5           },
  { opacity: 1, offset: 1             }
]
// options: { duration: speed, delay: -(Math.random()*speed), iterations: Infinity, easing: 'ease-in-out' }
```

**Spin keyframes**:
```typescript
[{ transform: 'rotate(0deg)' }, { transform: `rotate(${endDeg}deg)` }]
// options: { duration: speed, iterations: Infinity, easing: 'linear', composite: 'add' }
```

**Custom hook** — user returns `Animation` or teardown `() => void`:
```typescript
type IdleCustomAnimationFn = (ctx: { element: HTMLElement, index: number, totalImages: number })
  => Animation | (() => void);
```

### `test/fixtures/idle-animations.html` (new)
### `test/fixtures/idle-animations-blink.html` (new)
### `test/e2e/idle-animations.spec.ts` (new)

---

## Files to Modify

### `src/config/types.ts`
Add after `AnimationConfig` interface (~line 439):

```typescript
export type IdleAnimationType = 'wiggle' | 'pulse' | 'blink' | 'spin' | 'custom' | 'none';
export type IdleSyncMode = 'together' | 'random';

export interface IdleWiggleConfig { maxAngle: number; speed: number; sync: IdleSyncMode; }
export interface IdlePulseConfig  { minScale: number; maxScale: number; speed: number; sync: IdleSyncMode; }
export interface IdleBlinkConfig  { onRatio: number; speed: number; style: 'snap' | 'fade'; }
export interface IdleSpinConfig   { speed: number; direction: 'clockwise' | 'counterclockwise'; }
export type IdleCustomAnimationFn = (ctx: IdleCustomContext) => Animation | (() => void);
export interface IdleCustomContext { element: HTMLElement; index: number; totalImages: number; }

export interface IdleAnimationConfig {
  type: IdleAnimationType;
  wiggle?: IdleWiggleConfig;
  pulse?: IdlePulseConfig;
  blink?: IdleBlinkConfig;
  spin?: IdleSpinConfig;
  custom?: IdleCustomAnimationFn;
  startDelay?: number;  // ms before idle starts; defaults to entry animation duration
}
```

Add `idle?: IdleAnimationConfig` to `AnimationConfig` (~line 433).

### `src/config/defaults.ts`
Add exported constants:
```typescript
export const DEFAULT_IDLE_WIGGLE: IdleWiggleConfig = Object.freeze({ maxAngle: 5, speed: 2000, sync: 'random' });
export const DEFAULT_IDLE_PULSE:  IdlePulseConfig  = Object.freeze({ minScale: 0.95, maxScale: 1.05, speed: 2400, sync: 'random' });
export const DEFAULT_IDLE_BLINK:  IdleBlinkConfig  = Object.freeze({ onRatio: 0.7, speed: 3000, style: 'snap' });
export const DEFAULT_IDLE_SPIN:   IdleSpinConfig   = Object.freeze({ speed: 4000, direction: 'clockwise' });
export const DEFAULT_IDLE_CONFIG: IdleAnimationConfig = Object.freeze({ type: 'none' });
```

Add `idle: DEFAULT_IDLE_CONFIG` to `DEFAULT_CONFIG.animation`.

Update `mergeConfig()` (~line 571) to deep-merge `animation.idle`.

### `src/engines/ZoomEngine.ts`
Add unfocus callback for cross-animation support (outgoing image resolves internally, doesn't go through `handleImageClick`):

```typescript
// Add field:
private onUnfocusComplete: ((element: HTMLElement) => void) | null = null;

// Add method:
setOnUnfocusCompleteCallback(callback: ((element: HTMLElement) => void) | null): void {
  this.onUnfocusComplete = callback;
}

// Fire at every unfocus completion point (after removeFocusedStyling, ~lines 831-924):
if (this.onUnfocusComplete && completedElement) {
  this.onUnfocusComplete(completedElement);
}
```

### `src/ImageCloud.ts`

**Add field** (~line 49):
```typescript
private idleAnimationEngine: IdleAnimationEngine | null = null;
```

**Constructor** (~line 96), after zoomEngine init:
```typescript
const idleConfig = this.fullConfig.animation?.idle;
if (idleConfig && idleConfig.type !== 'none') {
  this.idleAnimationEngine = new IdleAnimationEngine(
    idleConfig,
    this.fullConfig.animation?.entry?.timing?.duration ?? 600
  );
}

this.zoomEngine.setOnUnfocusCompleteCallback((el) => {
  this.idleAnimationEngine?.resumeForImage(el as HTMLImageElement);
});
```

**`displayImage()`** (~line 582), after entry animation starts:
```typescript
if (this.idleAnimationEngine) {
  const entryDuration = this.entryAnimationEngine.getTiming().duration;
  const idx = parseInt(img.dataset.imageId || '0');
  this.idleAnimationEngine.register(img, idx, this.imageElements.length, entryDuration);
}
```

**`handleImageClick()`** (~line 853):
```typescript
// Before focusImage():
this.idleAnimationEngine?.pauseForImage(imageElement);

// After await unfocusImage() (the primary path — cross-anim handled via callback):
// (callback handles resume; no explicit call needed here for same-image unfocus
//  EXCEPT: the zoomEngine callback fires for all paths, so we're covered)
```

> **Note:** `zoomEngine.setOnUnfocusCompleteCallback` fires for ALL unfocus completions including the primary single-image case and cross-animation. The `handleImageClick` path doesn't need an explicit `resumeForImage` call since the callback covers it.

**`clearImageCloud()`** (~line 895): `this.idleAnimationEngine?.stopAll();`

**`destroy()`** (~line 959): `this.idleAnimationEngine?.stopAll(); this.idleAnimationEngine = null;`

### `configurator/index.html`
Add **Idle Animation accordion section** after the existing Animation section. Controls:
- **Type** dropdown: none / wiggle / pulse / blink / spin (with `onchange="updateIdleOptions()"`)
- **Wiggle**: maxAngle range (1–30°, default 5), speed number (500–8000ms, default 2000), sync dropdown
- **Pulse**: minScale range (0.5–1.0, default 0.95), maxScale range (1.0–2.0, default 1.05), speed number, sync dropdown
- **Blink**: onRatio range (0.1–0.99, default 0.7), speed number (500–10000ms, default 3000), style dropdown (snap/fade, default snap)
- **Spin**: speed number (500–20000ms, default 4000), direction dropdown
- **Start Delay**: number (0–5000ms, default 600)

Show/hide sub-options via `updateIdleOptions()` JS function (same pattern as `updateRotationOptions`/`updateWaveSyncOptions`).

Wire into config builder (`buildConfig()` or equivalent): read enabled values and assemble `animation.idle` object.

### `configurator/field-descriptions.json`
Add `animation.idle` section with description for each parameter. Include defaults in descriptions per project convention.

### `docs/PARAMETERS.md`
Add `animation.idle` section documenting all parameters with types, defaults, ranges.

---

## Test Strategy

**`test/fixtures/idle-animations.html`** — gallery with `animation.idle.type: 'wiggle'`, short durations for fast tests (`entry: 300ms, startDelay: 300ms`).

**`test/e2e/idle-animations.spec.ts`** — behavioral tests using `element.getAnimations()`:

| Test | Assertion |
|---|---|
| Wiggle starts after entry completes | `img.getAnimations().some(a => a.playState === 'running')` after delay |
| Idle pauses immediately on click | `img.getAnimations().every(a => a.playState !== 'running')` right after click |
| Idle resumes after unfocus completes | `img.getAnimations().some(a => a.playState === 'running')` after unfocus |
| Idle NOT running during unfocus animation | Paused mid-animation |
| Idle not running before entry completes | False at 100ms (entry = 300ms) |
| sync: 'together' phases are aligned | `currentTime` spread < 100ms across images |
| Blink creates opacity animation | `getAnimations()` has running animation |
| destroy() stops all idle | `img.getAnimations().length === 0` |

---

## Verification Steps

1. `npm run type-check` — no errors
2. `npm run build` — clean build
3. `npm test -- test/e2e/idle-animations.spec.ts` — all pass
4. Open configurator, select Idle Animation = Wiggle, verify images wiggle
5. Click an image — verify it immediately goes upright as focus animation plays
6. Unfocus — verify wiggle resumes after image returns to normal size
7. `npm test` — full suite passes (≤ pre-existing flaky failures)
