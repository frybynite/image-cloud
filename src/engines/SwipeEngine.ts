/**
 * SwipeEngine.ts
 * Handles touch swipe gestures for navigating between focused images
 *
 * Public API:
 * - enable() - Start listening for touch events
 * - disable() - Stop listening (when no image focused)
 * - destroy() - Clean up all event listeners
 * - setDragCallback(callback) - Set callback for drag offset updates
 */

// Constants for swipe detection
const SWIPE_THRESHOLD_PX = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.5; // px/ms
const SWIPE_MIN_DISTANCE_FOR_VELOCITY = 20;
const DRAG_DAMPING = 0.3;
const SNAP_BACK_DURATION_MS = 150;
const HORIZONTAL_ANGLE_THRESHOLD_DEG = 30;

interface SwipeCallbacks {
  onNext: () => void;
  onPrev: () => void;
  onDragOffset: (offset: number) => void;
  onDragEnd: (navigated: boolean) => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  isDragging: boolean;
  isHorizontalSwipe: boolean | null; // null = not determined yet
}

export class SwipeEngine {
  private container: HTMLElement;
  private callbacks: SwipeCallbacks;
  private enabled: boolean = false;
  private touchState: TouchState | null = null;

  // Track recent touch activity to prevent click-outside from unfocusing
  private recentTouchTimestamp: number = 0;
  private static readonly TOUCH_CLICK_DELAY = 300; // ms to ignore clicks after touch

  // Bound event handlers for proper cleanup
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  private boundTouchCancel: (e: TouchEvent) => void;

  constructor(container: HTMLElement, callbacks: SwipeCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Bind handlers
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
    this.boundTouchCancel = this.handleTouchCancel.bind(this);
  }

  /**
   * Start listening for touch events
   */
  enable(): void {
    if (this.enabled) return;
    this.enabled = true;

    this.container.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    this.container.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    this.container.addEventListener('touchend', this.boundTouchEnd, { passive: true });
    this.container.addEventListener('touchcancel', this.boundTouchCancel, { passive: true });
  }

  /**
   * Stop listening for touch events
   */
  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;

    this.container.removeEventListener('touchstart', this.boundTouchStart);
    this.container.removeEventListener('touchmove', this.boundTouchMove);
    this.container.removeEventListener('touchend', this.boundTouchEnd);
    this.container.removeEventListener('touchcancel', this.boundTouchCancel);

    // Reset any in-progress drag
    if (this.touchState?.isDragging) {
      this.callbacks.onDragEnd(false);
    }
    this.touchState = null;
  }

  /**
   * Clean up all event listeners
   */
  destroy(): void {
    this.disable();
  }

  /**
   * Check if a touch interaction happened recently
   * Used to prevent click-outside from unfocusing immediately after touch
   */
  hadRecentTouch(): boolean {
    return Date.now() - this.recentTouchTimestamp < SwipeEngine.TOUCH_CLICK_DELAY;
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) return;

    // Mark recent touch to prevent click-outside unfocus
    this.recentTouchTimestamp = Date.now();

    const touch = e.touches[0];
    this.touchState = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: performance.now(),
      currentX: touch.clientX,
      isDragging: false,
      isHorizontalSwipe: null
    };
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.touchState || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchState.startX;
    const deltaY = touch.clientY - this.touchState.startY;

    // Determine swipe direction on first significant movement
    if (this.touchState.isHorizontalSwipe === null) {
      const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (totalDistance > 10) {
        // Calculate angle from horizontal
        const angleRad = Math.atan2(Math.abs(deltaY), Math.abs(deltaX));
        const angleDeg = angleRad * (180 / Math.PI);
        this.touchState.isHorizontalSwipe = angleDeg <= HORIZONTAL_ANGLE_THRESHOLD_DEG;
      }
    }

    // If determined to be vertical, don't capture
    if (this.touchState.isHorizontalSwipe === false) {
      return;
    }

    // If horizontal swipe, prevent default and track drag
    if (this.touchState.isHorizontalSwipe === true) {
      e.preventDefault();
      this.touchState.isDragging = true;
      this.touchState.currentX = touch.clientX;

      // Apply damped offset to focused image
      const dampedOffset = deltaX * DRAG_DAMPING;
      this.callbacks.onDragOffset(dampedOffset);
    }
  }

  private handleTouchEnd(_e: TouchEvent): void {
    if (!this.touchState) return;

    // Update timestamp to prevent click-outside unfocus
    this.recentTouchTimestamp = Date.now();

    const deltaX = this.touchState.currentX - this.touchState.startX;
    const deltaTime = performance.now() - this.touchState.startTime;
    const velocity = Math.abs(deltaX) / deltaTime;
    const absDistance = Math.abs(deltaX);

    let navigated = false;

    // Only process if it was a horizontal swipe
    if (this.touchState.isHorizontalSwipe === true && this.touchState.isDragging) {
      // Check if swipe threshold met (distance or velocity)
      const thresholdMet =
        absDistance >= SWIPE_THRESHOLD_PX ||
        (velocity >= SWIPE_VELOCITY_THRESHOLD && absDistance >= SWIPE_MIN_DISTANCE_FOR_VELOCITY);

      if (thresholdMet) {
        navigated = true;
        if (deltaX < 0) {
          // Swipe left -> next image
          this.callbacks.onNext();
        } else {
          // Swipe right -> previous image
          this.callbacks.onPrev();
        }
      }
    }

    // Notify drag end (handles snap-back if not navigated)
    if (this.touchState.isDragging) {
      this.callbacks.onDragEnd(navigated);
    }

    this.touchState = null;
  }

  private handleTouchCancel(_e: TouchEvent): void {
    if (this.touchState?.isDragging) {
      this.callbacks.onDragEnd(false);
    }
    this.touchState = null;
  }
}

export { SNAP_BACK_DURATION_MS };
