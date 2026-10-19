// Writes the list of every file of the build a player needs (scripts, styles, fonts, icons) into
// index.html, for the service worker to keep after one visit (public/sw.js, src/main.tsx).
// Adapted from Starman Reborn, scripts/bootFiles.ts at ba4ef73 (D-10).

import type { Plugin } from 'vite';

interface BundleLike {
  [file: string]: { fileName: string };
}

export function offlineFiles(bundle: BundleLike): string[] {
  return Object.values(bundle)
    .map((b) => b.fileName)
    .filter((f) => /\.(js|css|woff2|webp|png|svg)$/.test(f))
    .map((f) => `./${f}`)
    .sort();
}

export function offlineFilesPlugin(): Plugin {
  return {
    name: 'starman-offline-files',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const files = offlineFiles(ctx.bundle as unknown as BundleLike);
        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: { type: 'application/json', id: 'offline-files' },
              children: JSON.stringify(files),
              injectTo: 'head',
            },
          ],
        };
      },
    },
  };
}
