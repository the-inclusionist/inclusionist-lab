# Inclusionist Lab

A hub of experiments for **accessibility/inclusion** libraries and models, backing the educational game
[The Inclusionist](https://github.com/jrocha-io/the-inclusionist). One **subpage per lab**; the landing page
(`/`) links to each. Nothing is removed — even weak models stay for comparison.

Multi-page [Vite](https://vite.dev) + TypeScript app. Shared code comes from the versioned
[`@jrocha-io/*`](https://github.com/jrocha-io/inclusionist-commons) packages. Deploys to Cloudflare Pages.

## Labs

| Page | What | Status |
|---|---|---|
| [`/tts/`](tts/) | **TTS Lab** — compare speech engines: fallback (eSpeak NG + Web Speech), sherpa (Piper + Kokoro), WebGPU | Section 1 (fallbacks) done |
| `/libras/` | Libras avatar / sign recognition | planned |
| `/vision/` | Face/eye tracking (MediaPipe) | planned |

## Develop

```bash
npm install
npm run dev        # COOP/COEP set by the dev server (cross-origin isolation for the sherpa multi-thread build)
npm run build      # tsc --noEmit && vite build → dist/ (multi-page)
npm run preview
npm run test
```

Production cross-origin isolation comes from `public/_headers` (Cloudflare Pages). On Windows + Bitdefender/Avast,
run npm with `NODE_OPTIONS=--use-system-ca` and `UV_NATIVE_TLS=1`.

## Add a lab

1. `src/<lab>/` for the TypeScript, `<lab>/index.html` for the page.
2. Add the html entry to `build.rollupOptions.input` in `vite.config.ts`.
3. Add a card to the landing `index.html`.

## eSpeak asset

`public/vendor/mespeak.iife.js` is a pre-bundled esbuild IIFE of meSpeak (it embeds a non-UTF-8 emscripten blob
no UTF-8 bundler can inline). Regenerate with:

```bash
npx esbuild node_modules/mespeak/src/index.js --bundle --format=iife --global-name=meSpeakLib --outfile=public/vendor/mespeak.iife.js
```

License: GPL-3.0-or-later.
