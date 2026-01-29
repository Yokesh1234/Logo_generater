
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Injects process.env from the build environment (Netlify) into the client-side code
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
