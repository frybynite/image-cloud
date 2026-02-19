import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from 'react';
import { ImageCloud as ImageCloudCore } from '@frybynite/image-cloud';
import type { ImageCloudOptions } from '@frybynite/image-cloud';

export type ImageCloudProps = Omit<ImageCloudOptions, 'container'> & {
  className?: string;
  style?: CSSProperties;
};

export interface ImageCloudRef {
  instance: ImageCloudCore | null;
}

export const ImageCloud = forwardRef<ImageCloudRef, ImageCloudProps>(
  function ImageCloud({ className, style, ...options }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<ImageCloudCore | null>(null);

    useImperativeHandle(ref, () => ({
      get instance() {
        return instanceRef.current;
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const cloud = new ImageCloudCore({
        container: containerRef.current,
        ...options,
      });
      instanceRef.current = cloud;

      cloud.init().catch((err) => {
        console.error('ImageCloud init failed:', err);
      });

      return () => {
        cloud.destroy();
        instanceRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(options)]);

    return <div ref={containerRef} className={className} style={style} />;
  }
);

// Re-export core types for convenience
export type {
  ImageCloudOptions,
  LayoutAlgorithm,
  LayoutConfig,
  AnimationConfig,
  ImageStylingConfig,
} from '@frybynite/image-cloud';
