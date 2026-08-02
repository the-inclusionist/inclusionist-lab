// Wires the concrete sherpa-onnx-wasm runtime into @jrocha-io/tts's SherpaEngine. The ~18MB engine assets
// (the .js loaders + .wasm + .data with espeak-ng-data) are same-origin PUBLIC assets under
// public/sherpa-wasm/<engine>/ — build them with the recipe in reference/sherpa-wasm/README.md. NO CDN.
// The multi-thread build (`tts`) needs COOP/COEP (set by the dev server + public/_headers).

import { SherpaEngine, type SherpaRuntime } from '@jrocha-io/tts';
import { HttpModelFetcher } from '@jrocha-io/model-fetch';
import { WebAudioPlayer } from '@jrocha-io/audio';
import type { Logger } from '@jrocha-io/logging';

interface SherpaModule {
  FS: { writeFile(path: string, data: Uint8Array): void };
}
type CreateModule = (opts: unknown) => Promise<SherpaModule>;
type OfflineTts = {
  generate(o: { text: string; sid: number; speed: number }): { samples: Float32Array; sampleRate: number };
};
type CreateOfflineTts = (module: SherpaModule, config: unknown) => OfflineTts;

/** Load the sherpa WASM runtime and return a ready SherpaEngine. `multiThread` picks the pthread build. */
export async function createSherpaEngine(opts: { multiThread: boolean; logger: Logger }): Promise<SherpaEngine> {
  const engine = opts.multiThread ? 'tts' : 'tts-single-thread';
  const base = `${import.meta.env.BASE_URL}sherpa-wasm/${engine}`;

  // Runtime imports of same-origin public assets (not bundled) — @vite-ignore keeps the bundler out.
  const mainMod = (await import(/* @vite-ignore */ `${base}/sherpa-onnx-wasm-main-tts.js`)) as { default: CreateModule };
  const ttsMod = (await import(/* @vite-ignore */ `${base}/sherpa-onnx-tts.js`)) as { createOfflineTts: CreateOfflineTts };

  const module = await mainMod.default({
    locateFile: (p: string) => `${base}/${p}`,
    print: (t: string) => opts.logger.log('[sherpa] ' + t),
    printErr: (t: string) => opts.logger.log('[sherpa!] ' + t),
  });

  const runtime: SherpaRuntime = {
    writeFile: (path, bytes) => module.FS.writeFile(path, bytes),
    createOfflineTts: (config) => ttsMod.createOfflineTts(module, config),
  };

  return new SherpaEngine({
    runtime,
    fetcher: new HttpModelFetcher({ cacheName: 'sherpa-models-v1' }),
    player: new WebAudioPlayer(),
    numThreads: opts.multiThread ? 4 : 1,
  });
}
