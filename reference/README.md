# reference/ — the legacy TTS monolith

The original single-file TTS labs, kept **only as the porting reference** for the modular `/tts/` subpage.
They were moved out of `the-inclusionist` (which holds only the game) per ADR-0025.

- `sherpa-lab.html` — the 3-section monolith (fallback · sherpa · WebGPU). **Section 1 is already ported** to
  `src/tts/` + `@jrocha-io/*`; **Sections 2 (sherpa) and 3 (WebGPU) are still being extracted** from here.
- `kokoro-webgpu-lab.html` — the standalone WebGPU speed test.
- `serve.json`, `sw.js`, `manifest.webmanifest` — the monolith's static-server + PWA setup.
- `sherpa-wasm/README.md` — the recipe to build the sherpa-onnx-wasm engine + espeak-ng-data (binaries are
  git-ignored; the Dev builds them). These assets migrate into the app proper during the sherpa stage.

**Delete this folder once Sections 2 and 3 are ported** (migration Stage 6).
