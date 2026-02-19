import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/web-component/index.ts'),
      formats: ['es'],
      fileName: () => 'web-component.js'
    },
    emptyOutDir: false,
    sourcemap: true
  },
  plugins: [
    dts({
      include: ['src/web-component/index.ts'],
      rollupTypes: true,
      outDir: 'dist',
      beforeWriteFile: (_filePath, content) => ({
        filePath: resolve(__dirname, 'dist/web-component.d.ts'),
        content
      })
    })
  ]
});
