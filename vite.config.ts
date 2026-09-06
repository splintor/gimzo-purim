import { reactRouter } from '@react-router/dev/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    // Replaces vite-tsconfig-paths: mirrors the "~/*" -> "./app/*" mapping in
    // tsconfig.json without pulling in another dependency.
    alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) },
  },
});
