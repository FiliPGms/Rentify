import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: dirname,
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:3333'
    }
  },
  build: {
    outDir: path.resolve(process.cwd(), 'dist/web'),
    emptyOutDir: true
  }
});
