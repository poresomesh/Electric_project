import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {viteCampusApiPlugin} from './server/viteApiPlugin.ts';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), viteCampusApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true, // Render चा होस्ट आणि बाहेरील सर्व डोमेन्स ब्लॉक न करता परवानगी देण्यासाठी
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});