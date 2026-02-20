import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/loaders/index-google-drive.ts'),
      formats: ['es'],
      fileName: () => 'loaders/google-drive.js'
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
      include: ['src/loaders/index-google-drive.ts'],
      rollupTypes: true,
      outDir: 'dist',
      beforeWriteFile: (_filePath, content) => ({
        filePath: resolve(__dirname, 'dist/loaders/google-drive.d.ts'),
        content
      })
    })
  ]
});
