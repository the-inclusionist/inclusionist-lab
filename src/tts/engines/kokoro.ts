// Wires the concrete kokoro-js (onnxruntime-web) into @the-inclusionist/tts's KokoroWebGpuEngine — NO CDN, bundled
// by Vite (dynamic import → lazy chunk). Model weights stream from HuggingFace on first load and cache.

import { KokoroWebGpuEngine, type KokoroTts, type KokoroDtype, type KokoroDevice } from '@the-inclusionist/tts';
import { WebAudioPlayer } from '@the-inclusionist/audio';

interface KokoroModule {
  KokoroTTS: { from_pretrained(model: string, opts: { dtype: string; device: string }): Promise<KokoroTts> };
}

/** Build a KokoroWebGpuEngine for the given precision/device. */
export function createKokoroEngine(opts: { dtype: KokoroDtype; device: KokoroDevice }): KokoroWebGpuEngine {
  return new KokoroWebGpuEngine({
    loadTts: async ({ dtype, device }) => {
      const mod = (await import('kokoro-js')) as unknown as KokoroModule;
      return mod.KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype, device });
    },
    player: new WebAudioPlayer(),
    dtype: opts.dtype,
    device: opts.device,
  });
}
