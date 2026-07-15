import tailwindcss from '@tailwindcss/vite';
<<<<<<< HEAD
import legacy from '@vitejs/plugin-legacy';
=======
>>>>>>> e0c84d9 (done)
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
<<<<<<< HEAD
    plugins: [
      react(),
      tailwindcss(),
      legacy({
        targets: ['defaults', 'not IE 11'],
        modernPolyfills: true,
      }),
    ],
=======
    plugins: [react(), tailwindcss()],
>>>>>>> e0c84d9 (done)
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
