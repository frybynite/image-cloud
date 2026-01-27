/**
 * PathAnimator.ts
 * Provides path calculation functions for bounce, elastic, and wave entry animations
 *
 * These animations require JavaScript-driven frame updates because they involve
 * complex mathematical curves that can't be expressed with CSS transitions alone.
 *
 * Public API:
 * - animatePath(element, startPos, endPos, pathConfig, duration, onComplete)
 * - calculateBouncePosition(t, start, end, config)
 * - calculateElasticPosition(t, start, end, config)
 * - calculateWavePosition(t, start, end, config)
 */

import type {
  BouncePathConfig,
  ElasticPathConfig,
  WavePathConfig,
  EntryPathConfig,
  EntryPathType,
  EntryRotationConfig
} from '../config/types';
import {
  resolveBounceConfig,
  resolveElasticConfig,
  resolveWavePathConfig
} from '../config/defaults';

export interface Point {
  x: number;
  y: number;
}

export interface PathAnimationOptions {
  element: HTMLElement;
  startPosition: Point;
  endPosition: Point;
  pathConfig: EntryPathConfig;
  duration: number;
  imageWidth: number;
  imageHeight: number;
  rotation: number;           // Final rotation
  scale: number;
  onComplete?: () => void;
  // Rotation animation options
  rotationConfig?: EntryRotationConfig;
  startRotation?: number;     // Starting rotation (if different from final)
}

/**
 * Linear interpolation helper
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Calculate position along a bounce path
 * Overshoot and settle animation
 */
export function calculateBouncePosition(
  t: number,
  start: Point,
  end: Point,
  config: BouncePathConfig
): Point {
  const { overshoot, bounces, decayRatio } = config;

  // Direction vector from start to end
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // Calculate keyframe timings based on number of bounces
  const keyframes = generateBounceKeyframes(bounces, decayRatio);

  // Find current segment
  let progress = 0;
  let segmentStart = 0;
  let segmentEnd = 1;
  let segmentOvershoot = overshoot;
  let isOvershootPhase = false;

  for (let i = 0; i < keyframes.length; i++) {
    if (t <= keyframes[i].time) {
      segmentStart = i === 0 ? 0 : keyframes[i - 1].time;
      segmentEnd = keyframes[i].time;
      segmentOvershoot = keyframes[i].overshoot;
      isOvershootPhase = keyframes[i].isOvershoot;
      break;
    }
  }

  // Calculate progress within current segment
  const segmentT = (t - segmentStart) / (segmentEnd - segmentStart);

  if (isOvershootPhase) {
    // Ease out into overshoot
    progress = 1 + segmentOvershoot * easeOutQuad(segmentT);
  } else if (segmentStart === 0) {
    // Initial travel to target - ease out
    progress = easeOutQuad(segmentT);
  } else {
    // Settling back from overshoot
    const prevOvershoot = keyframes.find((k, i) =>
      k.time > segmentStart && i > 0 && keyframes[i - 1].isOvershoot
    );
    const fromProgress = 1 + (prevOvershoot?.overshoot || segmentOvershoot);
    progress = lerp(fromProgress, 1, easeOutQuad(segmentT));
  }

  return {
    x: start.x + dx * progress,
    y: start.y + dy * progress
  };
}

/**
 * Generate keyframe timings for bounce animation
 */
function generateBounceKeyframes(
  bounces: number,
  decayRatio: number
): Array<{ time: number; overshoot: number; isOvershoot: boolean }> {
  const keyframes: Array<{ time: number; overshoot: number; isOvershoot: boolean }> = [];

  // Initial travel takes 60% of time
  let currentTime = 0.6;
  keyframes.push({ time: currentTime, overshoot: 0, isOvershoot: false });

  let currentOvershoot = 0.15; // Initial overshoot amount
  const remainingTime = 0.4;
  const bounceTime = remainingTime / (bounces * 2);

  for (let i = 0; i < bounces; i++) {
    // Overshoot phase
    currentTime += bounceTime;
    keyframes.push({ time: currentTime, overshoot: currentOvershoot, isOvershoot: true });

    // Settle phase
    currentTime += bounceTime;
    keyframes.push({ time: currentTime, overshoot: currentOvershoot * decayRatio, isOvershoot: false });

    currentOvershoot *= decayRatio;
  }

  // Final settle
  keyframes.push({ time: 1, overshoot: 0, isOvershoot: false });

  return keyframes;
}

/**
 * Calculate position along an elastic path
 * Spring-like oscillation animation
 */
export function calculateElasticPosition(
  t: number,
  start: Point,
  end: Point,
  config: ElasticPathConfig
): Point {
  const { stiffness, damping, mass, oscillations } = config;

  // Direction vector from start to end
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // Normalized spring physics
  // Natural frequency based on stiffness and mass
  const omega = Math.sqrt(stiffness / mass);

  // Damping ratio (normalized)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  // Progress using damped harmonic oscillator
  let progress: number;

  if (zeta < 1) {
    // Underdamped - oscillates
    const dampedFreq = omega * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * omega * t * 3);
    const oscillation = Math.cos(dampedFreq * t * oscillations * Math.PI);
    progress = 1 - envelope * oscillation;
  } else {
    // Critically damped or overdamped - no oscillation
    progress = 1 - Math.exp(-omega * t * 3);
  }

  // Clamp progress
  progress = Math.max(0, Math.min(progress, 1.3)); // Allow slight overshoot

  return {
    x: start.x + dx * progress,
    y: start.y + dy * progress
  };
}

/**
 * Calculate position along a wave path
 * Sinusoidal path from start to end
 */
export function calculateWavePosition(
  t: number,
  start: Point,
  end: Point,
  config: WavePathConfig
): Point {
  const { amplitude, frequency, decay, decayRate, phase } = config;

  // Direction vector from start to end
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Perpendicular vector (normalized)
  const perpX = length > 0 ? -dy / length : 0;
  const perpY = length > 0 ? dx / length : 1;

  // Wave calculation
  const wavePhase = frequency * Math.PI * 2 * t + phase;
  const decayFactor = decay ? Math.pow(1 - t, decayRate) : 1;
  const waveOffset = amplitude * Math.sin(wavePhase) * decayFactor;

  // Ease out for smooth arrival
  const progressT = easeOutCubic(t);

  // Linear interpolation + wave offset
  return {
    x: lerp(start.x, end.x, progressT) + waveOffset * perpX,
    y: lerp(start.y, end.y, progressT) + waveOffset * perpY
  };
}

/**
 * Easing functions
 */
function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Calculate wobble rotation for a given animation progress
 */
function calculateWobbleRotation(
  progress: number,
  finalRotation: number,
  wobbleConfig: { amplitude: number; frequency: number; decay: boolean }
): number {
  const { amplitude, frequency, decay } = wobbleConfig;

  // Oscillation using sine wave
  const oscillation = Math.sin(progress * frequency * Math.PI * 2);

  // Apply decay if enabled (stronger decay toward end)
  const decayFactor = decay ? Math.pow(1 - progress, 2) : 1;

  // Calculate wobble offset
  const wobbleOffset = amplitude * oscillation * decayFactor;

  return finalRotation + wobbleOffset;
}

/**
 * Animate an element along a path using requestAnimationFrame
 */
export function animatePath(options: PathAnimationOptions): void {
  const {
    element,
    startPosition,
    endPosition,
    pathConfig,
    duration,
    imageWidth,
    imageHeight,
    rotation: finalRotation,
    scale,
    onComplete,
    rotationConfig,
    startRotation
  } = options;

  const pathType = pathConfig.type;

  // Determine if we need to animate rotation
  const animateRotation = startRotation !== undefined && startRotation !== finalRotation;
  const isWobbleMode = rotationConfig?.mode === 'wobble';
  const wobbleConfig = rotationConfig?.wobble || { amplitude: 15, frequency: 3, decay: true };
  const needsRotationAnimation = animateRotation || isWobbleMode;

  // For linear/arc paths WITHOUT rotation animation, use CSS transitions (handled elsewhere)
  if ((pathType === 'linear' || pathType === 'arc') && !needsRotationAnimation) {
    if (onComplete) onComplete();
    return;
  }

  const startTime = performance.now();

  // Build center offset for transform
  const centerOffsetX = -imageWidth / 2;
  const centerOffsetY = -imageHeight / 2;

  function tick(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const t = Math.min(elapsed / duration, 1);

    // Calculate position based on path type
    let position: Point;

    switch (pathType) {
      case 'bounce': {
        const config = resolveBounceConfig(
          pathConfig.bouncePreset,
          pathConfig.bounce
        );
        position = calculateBouncePosition(t, startPosition, endPosition, config);
        break;
      }
      case 'elastic': {
        const config = resolveElasticConfig(
          pathConfig.elasticPreset,
          pathConfig.elastic
        );
        position = calculateElasticPosition(t, startPosition, endPosition, config);
        break;
      }
      case 'wave': {
        const config = resolveWavePathConfig(
          pathConfig.wavePreset,
          pathConfig.wave
        );
        position = calculateWavePosition(t, startPosition, endPosition, config);
        break;
      }
      default:
        position = {
          x: lerp(startPosition.x, endPosition.x, t),
          y: lerp(startPosition.y, endPosition.y, t)
        };
    }

    // Calculate translate offset from final position
    const translateX = position.x - endPosition.x;
    const translateY = position.y - endPosition.y;

    // Calculate current rotation
    let currentRotation: number;
    if (isWobbleMode) {
      // Wobble mode: oscillating rotation
      currentRotation = calculateWobbleRotation(t, finalRotation, wobbleConfig);
    } else if (animateRotation) {
      // Interpolate from start to final rotation
      currentRotation = lerp(startRotation!, finalRotation, t);
    } else {
      // No rotation animation
      currentRotation = finalRotation;
    }

    // Apply transform
    element.style.transform =
      `translate(${centerOffsetX}px, ${centerOffsetY}px) ` +
      `translate(${translateX}px, ${translateY}px) ` +
      `rotate(${currentRotation}deg) scale(${scale})`;

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // Ensure we end exactly at the final position and rotation
      element.style.transform =
        `translate(${centerOffsetX}px, ${centerOffsetY}px) ` +
        `rotate(${finalRotation}deg) scale(${scale})`;
      if (onComplete) onComplete();
    }
  }

  requestAnimationFrame(tick);
}

/**
 * Check if a path type requires JavaScript animation (vs CSS transitions)
 */
export function requiresJSAnimation(pathType: EntryPathType): boolean {
  return pathType === 'bounce' || pathType === 'elastic' || pathType === 'wave';
}

/**
 * Get CSS easing for bounce (approximation for simple bounce)
 * Note: This is only used as a fallback; full bounce uses JS animation
 */
export function getBounceCSSEasing(): string {
  return 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
}
