import { defineConfig } from 'vite';

// Multi-page: the landing page + one page per lab. Add a new lab = a new html entry + its own src/<lab>/.
// COOP/COEP give cross-origin isolation (crossOriginIsolated → SharedArrayBuffer) for the sherpa-onnx-wasm
// multi-thread build. Scoped to THIS deploy (dev/preview here; public/_headers on Cloudflare Pages).
const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
};

export default defineConfig({
  server: { headers: isolationHeaders },
  preview: { headers: isolationHeaders },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Paths relative to the Vite root (this repo). Add a lab → add its html entry here.
      input: {
        main: 'index.html',
        tts: 'tts/index.html',
      },
    },
  },
});
