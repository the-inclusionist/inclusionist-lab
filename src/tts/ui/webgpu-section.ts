import { langOf, type KokoroDevice, type KokoroDtype, type KokoroWebGpuEngine, type TtsEngine } from '@jrocha-io/tts';
import type { Logger } from '@jrocha-io/logging';
import { createKokoroEngine } from '../engines/kokoro.js';
import { createTaskTable } from './task-table.js';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}): HTMLElementTagNameMap[K] {
  return Object.assign(document.createElement(tag), props);
}

/** Section 3 — WebGPU: Kokoro-82M via kokoro-js. fp32/fp16/q8 × webgpu/wasm; EN voices measure RTF. */
export function buildWebgpuSection(logger: Logger, getRate: () => number): HTMLElement {
  const section = el('section', { className: 'lab' });
  const h2 = el('h2', { className: 'sec' });
  h2.innerHTML =
    '3 · WebGPU <span class="mut">— Kokoro-82M (kokoro-js/onnxruntime-web); voz EN só p/ medir RTF, g2p pt-BR é passo futuro</span>';
  section.appendChild(h2);

  const dtypeSel = el('select');
  for (const d of ['fp32', 'fp16', 'q8']) dtypeSel.appendChild(el('option', { value: d, textContent: d }));
  const deviceSel = el('select');
  for (const d of ['webgpu', 'wasm']) deviceSel.appendChild(el('option', { value: d, textContent: d }));
  if (!('gpu' in navigator)) deviceSel.value = 'wasm';
  const voiceSel = el('select');

  const gpu = el('span', { className: 'mut', textContent: `navigator.gpu = ${'gpu' in navigator ? 'presente' : 'ausente'}` });
  const loadBtn = el('button', { className: 'primary', textContent: 'Carregar (WebGPU)' });
  const status = el('span', { className: 'mut' });

  let engine: KokoroWebGpuEngine | null = null;
  const getEngine = (): TtsEngine => {
    if (!engine) throw new Error('carregue o modelo primeiro');
    return engine;
  };
  const fillVoices = (): void => {
    voiceSel.textContent = '';
    // Voice list is engine-independent (EN); build a throwaway to read it.
    for (const v of createKokoroEngine({ dtype: 'fp32', device: 'wasm' }).listVoices('en')) {
      voiceSel.appendChild(el('option', { value: v.id, textContent: v.label }));
    }
  };
  fillVoices();
  const resetEngine = (): void => {
    engine = null;
    status.textContent = 'config mudou — recarregue';
  };
  dtypeSel.addEventListener('change', resetEngine);
  deviceSel.addEventListener('change', resetEngine);

  const table = createTaskTable({
    getEngine,
    logger,
    getLang: () => langOf('en'),
    getVoiceId: () => voiceSel.value,
    getRate,
  });
  table.setLang('en');

  loadBtn.addEventListener('click', () => void load());
  async function load(): Promise<void> {
    loadBtn.disabled = true;
    const dtype = dtypeSel.value as KokoroDtype;
    const device = deviceSel.value as KokoroDevice;
    status.textContent = `baixando kokoro-js + modelo (${dtype}/${device}, 1ª vez)…`;
    try {
      engine = createKokoroEngine({ dtype, device });
      await engine.load();
      status.textContent = `pronto (${dtype}/${device}) — ▶ nas tarefas`;
      logger.log(`[webgpu] kokoro-js pronto: ${dtype}/${device}`);
    } catch (err) {
      engine = null;
      status.textContent = `erro: ${(err as Error).message}`;
      logger.log(`[webgpu] ERRO: ${(err as Error).message}`);
    } finally {
      loadBtn.disabled = false;
    }
  }

  const bar = el('div', { className: 'bar' });
  bar.append(
    lbl('Precisão', dtypeSel),
    lbl('Dispositivo', deviceSel),
    lbl('Voz (EN)', voiceSel),
    loadBtn,
    gpu,
    status,
  );
  section.append(bar, table.el);
  logger.log('[boot] Seção 3 (WebGPU) pronta.');
  return section;
}

function lbl(text: string, control: HTMLElement): HTMLLabelElement {
  const l = el('label', { textContent: text + ' ' });
  l.appendChild(control);
  return l;
}
