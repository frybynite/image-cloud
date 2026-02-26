/**
 * IdleAnimationEngine.ts
 * Manages continuous ambient animations for idle images using the Web Animations API.
 *
 * Uses composite: 'add' for transform-based animations (wiggle, pulse, spin) so
 * idle animations layer on top of the base transform without replacing it.
 * Blink uses opacity with no composite.
 */

import type {
  IdleAnimationConfig,
  IdleWiggleConfig,
  IdlePulseConfig,
  IdleBlinkConfig,
  IdleSpinConfig
} from '../config/types';
import {
  DEFAULT_IDLE_WIGGLE,
  DEFAULT_IDLE_PULSE,
  DEFAULT_IDLE_BLINK,
  DEFAULT_IDLE_SPIN
} from '../config/defaults';

interface IdleEntry {
  element: HTMLElement;
  index: number;
  totalImages: number;
  animation: Animation | null;
  blinkAnimation: Animation | null;
  customTeardown: (() => void) | null;
  paused: boolean;
  stopped: boolean;
  startTimer: ReturnType<typeof setTimeout> | null;
}

export class IdleAnimationEngine {
  private config: IdleAnimationConfig;
  private entries: Map<HTMLElement, IdleEntry> = new Map();
  private entryDurationMs: number;

  // Single rAF loop shared across all 'together'-sync animations.
  // Each frame, all active together-mode animations get the same currentTime.
  private togetherRafId: number | null = null;
  private togetherSpeed: number = 0;

  constructor(config: IdleAnimationConfig, entryDurationMs = 600) {
    this.config = config;
    this.entryDurationMs = entryDurationMs;
  }

  /**
   * Register an image element for idle animation.
   * Starts animation after entry duration completes.
   */
  register(element: HTMLElement, index: number, totalImages: number, entryDuration?: number): void {
    if (this.entries.has(element)) return;

    const delay = entryDuration ?? this.entryDurationMs;
    const startDelay = this.config.startDelay ?? delay;

    const entry: IdleEntry = {
      element,
      index,
      totalImages,
      animation: null,
      blinkAnimation: null,
      customTeardown: null,
      paused: false,
      stopped: false,
      startTimer: null
    };

    this.entries.set(element, entry);

    entry.startTimer = setTimeout(() => {
      entry.startTimer = null;
      if (!entry.stopped && !entry.paused) {
        this._startAnimation(entry);
      }
    }, startDelay);
  }

  /**
   * Pause idle animation for a specific image (set to neutral then pause).
   */
  pauseForImage(element: HTMLElement): void {
    const entry = this.entries.get(element);
    if (!entry) return;
    entry.paused = true;
    // Cancel start timer if still pending
    if (entry.startTimer !== null) {
      clearTimeout(entry.startTimer);
      entry.startTimer = null;
    }
    this._pauseEntry(entry);
  }

  /**
   * Resume idle animation for a specific image by starting a fresh animation.
   * Always restarts rather than resuming, to avoid Web Animations API
   * quirks with negative-delay animations after pause/cancel.
   */
  resumeForImage(element: HTMLElement): void {
    const entry = this.entries.get(element);
    if (!entry || entry.stopped) return;
    entry.paused = false;
    this._startAnimation(entry);
  }

  /**
   * Stop and remove idle animation for a specific image.
   */
  stopForImage(element: HTMLElement): void {
    const entry = this.entries.get(element);
    if (!entry) return;
    entry.stopped = true;
    if (entry.startTimer !== null) {
      clearTimeout(entry.startTimer);
      entry.startTimer = null;
    }
    this._cancelEntry(entry);
    this.entries.delete(element);
  }

  pauseAll(): void {
    for (const entry of this.entries.values()) {
      entry.paused = true;
      if (entry.startTimer !== null) {
        clearTimeout(entry.startTimer);
        entry.startTimer = null;
      }
      this._pauseEntry(entry);
    }
  }

  resumeAll(): void {
    for (const entry of this.entries.values()) {
      if (!entry.stopped) {
        entry.paused = false;
        this._startAnimation(entry);
      }
    }
  }

  stopAll(): void {
    for (const entry of this.entries.values()) {
      entry.stopped = true;
      if (entry.startTimer !== null) {
        clearTimeout(entry.startTimer);
        entry.startTimer = null;
      }
      this._cancelEntry(entry);
    }
    this.entries.clear();
    this._stopTogetherLoop();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────────────────────

  private _startAnimation(entry: IdleEntry): void {
    const { type } = this.config;
    switch (type) {
      case 'wiggle':  this._startWiggle(entry); break;
      case 'pulse':   this._startPulse(entry);  break;
      case 'blink':   this._startBlink(entry);  break;
      case 'spin':    this._startSpin(entry);   break;
      case 'custom':  this._startCustom(entry); break;
      default: break;
    }
  }

  private _startWiggle(entry: IdleEntry): void {
    const cfg: IdleWiggleConfig = { ...DEFAULT_IDLE_WIGGLE, ...this.config.wiggle };

    const keyframes: Keyframe[] = [
      { transform: 'rotate(0deg)',                  offset: 0    },
      { transform: `rotate(${cfg.maxAngle}deg)`,    offset: 0.25 },
      { transform: 'rotate(0deg)',                  offset: 0.5  },
      { transform: `rotate(${-cfg.maxAngle}deg)`,   offset: 0.75 },
      { transform: 'rotate(0deg)',                  offset: 1    }
    ];

    if (cfg.sync === 'together') {
      entry.animation = entry.element.animate(keyframes, {
        duration: cfg.speed, iterations: Infinity, composite: 'add', fill: 'both'
      });
      entry.animation.pause();
      this._startTogetherLoop(cfg.speed);
    } else {
      entry.animation = entry.element.animate(keyframes, {
        duration: cfg.speed,
        delay: -(Math.random() * cfg.speed),
        iterations: Infinity,
        composite: 'add'
      });
    }
  }

  private _startPulse(entry: IdleEntry): void {
    const cfg: IdlePulseConfig = { ...DEFAULT_IDLE_PULSE, ...this.config.pulse };

    const keyframes: Keyframe[] = [
      { transform: 'scale(1)',               offset: 0    },
      { transform: `scale(${cfg.maxScale})`, offset: 0.25 },
      { transform: 'scale(1)',               offset: 0.5  },
      { transform: `scale(${cfg.minScale})`, offset: 0.75 },
      { transform: 'scale(1)',               offset: 1    }
    ];

    if (cfg.sync === 'together') {
      entry.animation = entry.element.animate(keyframes, {
        duration: cfg.speed, iterations: Infinity, composite: 'add', fill: 'both'
      });
      entry.animation.pause();
      this._startTogetherLoop(cfg.speed);
    } else {
      entry.animation = entry.element.animate(keyframes, {
        duration: cfg.speed,
        delay: -(Math.random() * cfg.speed),
        iterations: Infinity,
        composite: 'add'
      });
    }
  }

  private _startBlink(entry: IdleEntry): void {
    const cfg: IdleBlinkConfig = { ...DEFAULT_IDLE_BLINK, ...this.config.blink };
    const delay = -(Math.random() * cfg.speed);

    // Use the element's current opacity as the "visible" state so blink
    // respects the configured default (and hover) opacity.
    const onOpacity = parseFloat(getComputedStyle(entry.element).opacity) || 1;

    let keyframes: Keyframe[];
    let options: KeyframeAnimationOptions;

    if (cfg.style === 'fade') {
      keyframes = [
        { opacity: onOpacity, offset: 0   },
        { opacity: 0,         offset: 0.5 },
        { opacity: onOpacity, offset: 1   }
      ];
      options = {
        duration: cfg.speed,
        delay,
        iterations: Infinity,
        easing: 'ease-in-out'
      };
    } else {
      // snap (default)
      keyframes = [
        { opacity: onOpacity, offset: 0              },
        { opacity: onOpacity, offset: cfg.onRatio    },
        { opacity: 0,         offset: Math.min(cfg.onRatio + 0.01, 0.99) },
        { opacity: 0,         offset: 0.99           },
        { opacity: onOpacity, offset: 1              }
      ];
      options = {
        duration: cfg.speed,
        delay,
        iterations: Infinity
      };
    }

    entry.blinkAnimation = entry.element.animate(keyframes, options);
  }

  private _startSpin(entry: IdleEntry): void {
    const cfg: IdleSpinConfig = { ...DEFAULT_IDLE_SPIN, ...this.config.spin };
    const endDeg = cfg.direction === 'clockwise' ? 360 : -360;

    entry.animation = entry.element.animate(
      [{ transform: 'rotate(0deg)' }, { transform: `rotate(${endDeg}deg)` }],
      {
        duration: cfg.speed,
        iterations: Infinity,
        easing: 'linear',
        composite: 'add'
      }
    );
  }

  private _startCustom(entry: IdleEntry): void {
    const fn = this.config.custom;
    if (!fn) return;

    const result = fn({ element: entry.element, index: entry.index, totalImages: entry.totalImages });

    if (typeof result === 'function') {
      entry.customTeardown = result;
    } else if (result && typeof (result as Animation).play === 'function') {
      entry.animation = result as Animation;
    }
  }

  private _startTogetherLoop(speed: number): void {
    this.togetherSpeed = speed;
    if (this.togetherRafId !== null) return; // already ticking
    const tick = () => {
      const t = performance.now() % this.togetherSpeed;
      for (const entry of this.entries.values()) {
        if (!entry.stopped && !entry.paused && entry.animation) {
          entry.animation.currentTime = t;
        }
      }
      this.togetherRafId = requestAnimationFrame(tick);
    };
    this.togetherRafId = requestAnimationFrame(tick);
  }

  private _stopTogetherLoop(): void {
    if (this.togetherRafId !== null) {
      cancelAnimationFrame(this.togetherRafId);
      this.togetherRafId = null;
    }
  }

  private _pauseEntry(entry: IdleEntry): void {
    // Cancel rather than pause — avoids Web Animations API quirks with
    // negative-delay infinite animations. resumeForImage() always restarts fresh.
    if (entry.animation) {
      entry.animation.cancel();
      entry.animation = null;
    }
    if (entry.blinkAnimation) {
      entry.blinkAnimation.cancel();
      entry.blinkAnimation = null;
    }
  }

  private _cancelEntry(entry: IdleEntry): void {
    if (entry.animation) {
      entry.animation.cancel();
      entry.animation = null;
    }
    if (entry.blinkAnimation) {
      entry.blinkAnimation.cancel();
      entry.blinkAnimation = null;
    }
    if (entry.customTeardown) {
      entry.customTeardown();
      entry.customTeardown = null;
    }
  }
}
