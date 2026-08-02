// meSpeak ships no types. We only touch it through @jrocha-io/tts's MeSpeakApi (injected + cast), so an
// opaque module declaration is enough; its JSON assets are typed by resolveJsonModule.
declare module 'mespeak' {
  const meSpeak: unknown;
  export default meSpeak;
}
