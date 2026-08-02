# public/sherpa-wasm/ — sherpa-onnx-wasm engine assets (NOT committed)

Section 2 loads the engine from `/sherpa-wasm/<tts|tts-single-thread>/` at runtime. Build these ~18MB
assets (the .js loaders + .wasm + .data with espeak-ng-data) with the recipe in
`../../reference/sherpa-wasm/README.md`, then drop them here:

- `tts/` — the pthread (multi-thread) build (needs COOP/COEP).
- `tts-single-thread/` — the single-thread build.

They are git-ignored (large binaries). Models are fetched on demand from HuggingFace and cached.
