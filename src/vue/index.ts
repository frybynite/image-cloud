import {
  defineComponent,
  h,
  ref,
  onMounted,
  onUnmounted,
  watch,
  type PropType,
} from 'vue';
import { ImageCloud as ImageCloudCore } from '@frybynite/image-cloud';
import type { ImageCloudOptions } from '@frybynite/image-cloud';

export type ImageCloudVueOptions = Omit<ImageCloudOptions, 'container'>;

export const ImageCloud = defineComponent({
  name: 'ImageCloud',
  props: {
    options: {
      type: Object as PropType<ImageCloudVueOptions>,
      required: true,
    },
  },
  setup(props, { expose }) {
    const containerRef = ref<HTMLElement | null>(null);
    const instance = ref<ImageCloudCore | null>(null);

    function init() {
      if (!containerRef.value) return;

      instance.value?.destroy();

      const cloud = new ImageCloudCore({
        container: containerRef.value,
        ...props.options,
      });
      instance.value = cloud;

      cloud.init().catch((err) => {
        console.error('ImageCloud init failed:', err);
      });
    }

    onMounted(() => {
      init();
    });

    onUnmounted(() => {
      instance.value?.destroy();
      instance.value = null;
    });

    watch(
      () => props.options,
      () => {
        init();
      },
      { deep: true }
    );

    expose({ instance });

    return () =>
      h('div', {
        ref: containerRef,
      });
  },
});

// Re-export core types for convenience
export type {
  ImageCloudOptions,
  LayoutAlgorithm,
  LayoutConfig,
  AnimationConfig,
  ImageStylingConfig,
} from '@frybynite/image-cloud';
