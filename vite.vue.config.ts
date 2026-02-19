import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/vue/index.ts'),
      formats: ['es'],
      fileName: () => 'vue.js'
    },
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      external: ['vue', '@frybynite/image-cloud']
    }
  },
  plugins: [
    dts({
      include: ['src/vue/index.ts'],
      rollupTypes: true,
      outDir: 'dist',
      beforeWriteFile: (_filePath, content) => ({
        filePath: resolve(__dirname, 'dist/vue.d.ts'),
        content
      })
    })
  ]
});
