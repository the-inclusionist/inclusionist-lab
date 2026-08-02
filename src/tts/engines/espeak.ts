// Builds the eSpeak-NG (meSpeak WASM) engine — NO CDN. meSpeak embeds its ~4MB emscripten runtime as a
// binary (non-UTF-8) string, which no UTF-8 bundler (rolldown, esbuild output) can inline. So we ship an
// esbuild IIFE build as a same-origin PUBLIC asset (public/vendor/mespeak.iife.js) and load it at runtime
// via fetch → latin1 decode (preserves the binary bytes) → indirect eval, which defines globalThis.meSpeakLib.
// The config + voice JSON are UTF-8 and bundle normally (lazy dynamic imports). Regenerate the asset with:
//   npx esbuild node_modules/mespeak/src/index.js --bundle --format=iife --global-name=meSpeakLib \
//     --outfile=public/vendor/mespeak.iife.js

import { MeSpeakEngine, type MeSpeakApi } from '@jrocha-io/tts';

let cached: MeSpeakApi | null = null;

async function loadMeSpeak(): Promise<MeSpeakApi> {
  if (cached) return cached;
  const url = `${import.meta.env.BASE_URL}vendor/mespeak.iife.js`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`meSpeak asset HTTP ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const code = new TextDecoder('latin1').decode(bytes); // keep the emscripten binary string bytes intact
  // The IIFE is "use strict" → its `var meSpeakLib` stays in the eval's own scope; append an explicit
  // global assignment (meSpeakLib is in scope there) so we can reach it afterwards.
  (0, eval)(code + '\n;globalThis.meSpeakLib = meSpeakLib;');
  const lib = (globalThis as unknown as { meSpeakLib?: { default?: unknown } }).meSpeakLib;
  const api = ((lib as { default?: unknown })?.default ?? lib) as MeSpeakApi | undefined;
  if (!api || typeof api.loadConfig !== 'function') throw new Error('meSpeak global não encontrado');
  cached = api;
  return api;
}

/** Construct the eSpeak engine (async: loads the WASM asset + voice data on demand). May reject on failure. */
export async function createESpeakEngine(): Promise<MeSpeakEngine> {
  const [meSpeak, cfg, pt, en, es] = await Promise.all([
    loadMeSpeak(),
    import('mespeak/src/mespeak_config.json'),
    import('mespeak/voices/pt.json'),
    import('mespeak/voices/en/en.json'),
    import('mespeak/voices/es.json'),
  ]);
  return new MeSpeakEngine({
    meSpeak,
    config: cfg.default,
    voices: {
      pt: { id: 'pt', data: pt.default },
      en: { id: 'en', data: en.default },
      es: { id: 'es', data: es.default },
    },
  });
}
