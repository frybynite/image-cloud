import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/loaders/index-static.ts'),
      formats: ['es'],
      fileName: () => 'loaders/static.js'
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      external: ['@frybynite/image-cloud']
    }
  },
  plugins: [
    dts({
      include: ['src/loaders/index-static.ts'],
      rollupTypes: true,
      outDir: 'dist',
      beforeWriteFile: (_filePath, content) => ({
        filePath: resolve(__dirname, 'dist/loaders/static.d.ts'),
        content
      })
    })
  ]
});
