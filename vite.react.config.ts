import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/react/index.tsx'),
      formats: ['es'],
      fileName: () => 'react.js'
    },
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react-dom']
    }
  },
  plugins: [
    dts({
      include: ['src/react/index.tsx'],
      rollupTypes: true,
      outDir: 'dist',
      beforeWriteFile: (_filePath, content) => ({
        filePath: resolve(__dirname, 'dist/react.d.ts'),
        content
      })
    })
  ]
});
