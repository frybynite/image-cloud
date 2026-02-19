import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/layouts/index-grid.ts'),
      formats: ['es'],
      fileName: () => 'layouts/grid.js'
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
      include: ['src/layouts/index-grid.ts'],
      rollupTypes: true,
      outDir: 'dist',
      beforeWriteFile: (_filePath, content) => ({
        filePath: resolve(__dirname, 'dist/layouts/grid.d.ts'),
        content
      })
    })
  ]
});
