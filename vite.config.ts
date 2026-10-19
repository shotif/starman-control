import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the static build works from any sub-path
  // (GitHub Pages project sites, file servers, tunnels).
  base: './',
  define: {
    __BUILD_ID__: JSON.stringify((process.env.GITHUB_SHA ?? '').slice(0, 7) || 'local'),
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  server: { port: 5173 },
  preview: { port: 4173 },
});
