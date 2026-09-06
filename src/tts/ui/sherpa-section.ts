import {
  groupPiperByLocale,
  KOKORO_VOICES,
  parseDownloadedRepos,
  langOf,
  type Lang,
  type SherpaEngine,
  type TtsEngine,
} from '@the-inclusionist/tts';
import type { Logger } from '@the-inclusionist/logging';
import { createSherpaEngine } from '../engines/sherpa.js';
import { createTaskTable } from './task-table.js';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}): HTMLElementTagNameMap[K] {
  return Object.assign(document.createElement(tag), props);
}

function fillPiper(sel: HTMLSelectElement, wantHigh: boolean): void {
  for (const g of groupPiperByLocale(wantHigh)) {
    const og = el('optgroup', { label: g.locale });
    for (const o of g.options) og.appendChild(el('option', { value: o.value, textContent: o.label }));
    sel.appendChild(og);
  }
}
function fillKokoro(sel: HTMLSelectElement): void {
  for (const group of KOKORO_VOICES) {
    const og = el('optgroup', { label: group.label });
    for (const v of group.voices) {
      og.appendChild(el('option', { value: `kokoro:${v.name}:${v.sid}:${v.espeakLang}:fp32`, textContent: v.name }));
    }
    sel.appendChild(og);
  }
}

/** Section 2 — sherpa: Piper médio/high + Kokoro fp32; radio picks the active box; load only on the button. */
export function buildSherpaSection(logger: Logger, getRate: () => number): HTMLElement {
  const section = el('section', { className: 'lab' });
  const h2 = el('h2', { className: 'sec' });
  h2.innerHTML = '2 · sherpa-onnx-wasm <span class="mut">— Piper médio/high + Kokoro fp32 (fallback neural offline)</span>';
  section.appendChild(h2);

  // The three voice boxes, each fronted by a radio that says which is active (human's point of view).
  const rMed = el('input', { type: 'radio', name: 'shActive', value: 'med', checked: true });
  const rHigh = el('input', { type: 'radio', name: 'shActive', value: 'high' });
  const rKok = el('input', { type: 'radio', name: 'shActive', value: 'kok' });
  const selMed = el('select');
  const selHigh = el('select');
  const selKok = el('select');
  fillPiper(selMed, false);
  fillPiper(selHigh, true);
  fillKokoro(selKok);
  // Touching a box marks its radio (does NOT load — only the button loads).
  selMed.addEventListener('change', () => (rMed.checked = true));
  selHigh.addEventListener('change', () => (rHigh.checked = true));
  selKok.addEventListener('change', () => (rKok.checked = true));

  const activeVoiceId = (): string => (rHigh.checked ? selHigh.value : rKok.checked ? selKok.value : selMed.value);
  const getLang = (): Lang => langOf(activeVoiceId());

  const voices = el('div', { className: 'voices' });
  voices.append(
    row(rMed, 'Piper médio', selMed),
    row(rHigh, 'Piper high', selHigh),
    row(rKok, 'Kokoro fp32', selKok),
  );

  // Controls: Carregar, multi-thread toggle, status.
  const loadBtn = el('button', { className: 'primary', textContent: 'Carregar' });
  const mtToggle = el('input', { type: 'checkbox', id: 'shMt' });
  const status = el('span', { className: 'mut' });
  const ctrls = el('div', { className: 'ctrls' });
  ctrls.append(
    loadBtn,
    labeled(mtToggle, 'multi-thread (exige COOP/COEP)'),
    status,
  );

  // Downloaded-voices list beside the panel.
  const dlBox = el('textarea', { className: 'dl', readOnly: true, value: '—' });
  const dlWrap = el('div', { className: 'dlwrap' });
  dlWrap.append(el('label', { className: 'mut', textContent: 'vozes baixadas (cache)' }), dlBox);

  const bar = el('div', { className: 'bar' });
  bar.append(voices, ctrls, dlWrap);

  // Engine (created lazily; recreated when the multi-thread build changes).
  let engine: SherpaEngine | null = null;
  const getEngine = (): TtsEngine => {
    if (!engine) throw new Error('carregue uma voz primeiro');
    return engine;
  };
  mtToggle.addEventListener('change', () => {
    engine = null; // force a rebuild with the other WASM build on next Carregar
    logger.log(`[sherpa] multi-thread = ${mtToggle.checked} — recarregue uma voz`);
  });

  const refreshDownloaded = async (): Promise<void> => {
    try {
      const names = await caches.keys();
      const urls: string[] = [];
      for (const n of names) {
        const c = await caches.open(n);
        for (const req of await c.keys()) urls.push(req.url);
      }
      dlBox.value = parseDownloadedRepos(urls).join('\n') || '(nenhuma baixada ainda)';
    } catch {
      dlBox.value = '(cache indisponível)';
    }
  };

  const table = createTaskTable({ getEngine, logger, getLang, getVoiceId: () => activeVoiceId(), getRate });

  loadBtn.addEventListener('click', () => void load());
  async function load(): Promise<void> {
    const voiceId = activeVoiceId();
    if (!voiceId) return;
    loadBtn.disabled = true;
    status.textContent = '';
    try {
      if (!engine) {
        status.textContent = 'iniciando o motor WASM…';
        engine = await createSherpaEngine({ multiThread: mtToggle.checked, logger });
      }
      status.textContent = `baixando ${voiceId}…`;
      await engine.load(voiceId, (f) => (status.textContent = `baixando ${voiceId}… ${Math.round(f * 100)}%`));
      table.setLang(getLang());
      status.textContent = `pronto: ${voiceId}`;
      logger.log(`[sherpa] carregado: ${voiceId}`);
      void refreshDownloaded();
    } catch (err) {
      status.textContent = `erro: ${(err as Error).message}`;
      logger.log(`[sherpa] ERRO ao carregar ${voiceId}: ${(err as Error).message}`);
    } finally {
      loadBtn.disabled = false;
    }
  }

  section.append(bar, table.el);
  void refreshDownloaded();
  logger.log('[boot] Seção 2 (sherpa) pronta — escolha a voz e clique Carregar.');
  return section;
}

function row(radio: HTMLElement, text: string, sel: HTMLSelectElement): HTMLLabelElement {
  const l = el('label', { className: 'toggle' });
  l.append(radio, document.createTextNode(' ' + text + ' '), sel);
  return l;
}
function labeled(input: HTMLElement, text: string): HTMLLabelElement {
  const l = el('label', { className: 'toggle' });
  l.append(input, document.createTextNode(' ' + text));
  return l;
}
