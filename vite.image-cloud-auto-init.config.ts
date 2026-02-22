import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/image-cloud-auto-init.ts'),
      formats: ['es'],
      fileName: () => 'image-cloud-auto-init.js'
    },
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      external: [
        '@frybynite/image-cloud/loaders/static',
        '@frybynite/image-cloud/loaders/google-drive',
        '@frybynite/image-cloud/loaders/composite'
      ]
    }
  }
});
