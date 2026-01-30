/**
 * Minimal functional CSS required for the library to work.
 * Injected automatically - no external CSS file needed.
 */
export const FUNCTIONAL_CSS = `
.fbn-ic-gallery {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  perspective: 1000px;
}

.fbn-ic-image {
  position: absolute;
  cursor: pointer;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    filter 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    outline 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    z-index 0s 0.6s;
  will-change: transform;
  user-select: none;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.fbn-ic-image.fbn-ic-focused {
  z-index: 1000;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    filter 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    outline 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    z-index 0s 0s;
  will-change: auto;
}

.fbn-ic-hidden {
  display: none !important;
}
`;

/**
 * Inject functional styles into document head.
 * Idempotent - safe to call multiple times.
 */
export function injectFunctionalStyles(): void {
  if (typeof document === 'undefined') return;
  const id = 'fbn-ic-functional-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = FUNCTIONAL_CSS;
  document.head.appendChild(style);
}
