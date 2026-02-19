import { ImageCloud } from '@frybynite/image-cloud';
import type { ImageCloudOptions } from '@frybynite/image-cloud';

export class ImageCloudElement extends HTMLElement {
  static observedAttributes = ['config', 'images', 'layout'];

  private _instance: ImageCloud | null = null;
  private _container: HTMLDivElement | null = null;

  connectedCallback(): void {
    this._container = document.createElement('div');
    this._container.style.width = '100%';
    this._container.style.height = '100%';
    this.appendChild(this._container);
    this._init();
  }

  disconnectedCallback(): void {
    this._destroy();
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue === newValue) return;
    if (this._container) {
      this._destroy();
      this._init();
    }
  }

  getInstance(): ImageCloud | null {
    return this._instance;
  }

  private _getOptions(): Omit<ImageCloudOptions, 'container'> {
    const options: Omit<ImageCloudOptions, 'container'> = {};

    const configAttr = this.getAttribute('config');
    if (configAttr) {
      try {
        const parsed = JSON.parse(configAttr) as ImageCloudOptions;
        // Spread everything except container (we manage that)
        const { container: _container, ...rest } = parsed;
        Object.assign(options, rest);
      } catch (e) {
        console.error('<image-cloud> invalid config JSON:', e);
      }
    }

    const imagesAttr = this.getAttribute('images');
    if (imagesAttr) {
      try {
        options.images = JSON.parse(imagesAttr) as string[];
      } catch (e) {
        console.error('<image-cloud> invalid images JSON:', e);
      }
    }

    const layoutAttr = this.getAttribute('layout');
    if (layoutAttr) {
      options.layout = {
        ...options.layout,
        algorithm: layoutAttr as NonNullable<ImageCloudOptions['layout']>['algorithm'],
      };
    }

    return options;
  }

  private _init(): void {
    if (!this._container) return;

    try {
      const options = this._getOptions();
      this._instance = new ImageCloud({
        container: this._container,
        ...options,
      });

      this._instance.init().then(() => {
        this.dispatchEvent(new CustomEvent('initialized', { bubbles: true }));
      }).catch((err) => {
        console.error('<image-cloud> init failed:', err);
        this.dispatchEvent(new CustomEvent('error', { detail: err, bubbles: true }));
      });
    } catch (err) {
      console.error('<image-cloud> creation failed:', err);
      this.dispatchEvent(new CustomEvent('error', { detail: err, bubbles: true }));
    }
  }

  private _destroy(): void {
    this._instance?.destroy();
    this._instance = null;
  }
}

// Auto-register the custom element
if (typeof customElements !== 'undefined' && !customElements.get('image-cloud')) {
  customElements.define('image-cloud', ImageCloudElement);
}

// Re-export core types for convenience
export type {
  ImageCloudOptions,
  LayoutAlgorithm,
  LayoutConfig,
  AnimationConfig,
  ImageStylingConfig,
} from '@frybynite/image-cloud';
