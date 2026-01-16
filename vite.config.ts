import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ImageGallery',
      formats: ['es', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'image-cloud.js';
        return `image-cloud.${format}.js`;
      }
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css';
          return assetInfo.name || 'asset';
        }
      }
    }
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true
    })
  ],
  css: {
    extract: true
  }
});
