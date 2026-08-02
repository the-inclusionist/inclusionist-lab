// Composition root — instantiate the concrete adapters and inject them into the section controllers.
// Stage 3a: Section 1 (fallback) wired with the WebSpeechEngine. eSpeak, sherpa and WebGPU land next.

import { WebSpeechEngine, platformSpeechApi, type Lang, type TtsEngine } from '@jrocha-io/tts';
import { DomLogger, type Logger } from '@jrocha-io/logging';
import { createTaskTable } from './ui/task-table.js';
import { createESpeakEngine } from './engines/espeak.js';
import './style.css';

const LANGS: readonly Lang[] = ['pt', 'en', 'es'];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}): HTMLElementTagNameMap[K] {
  return Object.assign(document.createElement(tag), props);
}

function boot(root: HTMLElement): void {
  root.textContent = '';

  const h1 = el('h1');
  h1.innerHTML = 'TTS Lab <span class="mut">— fallback · sherpa · WebGPU</span>';
  const sub = el('p', { className: 'sub', textContent: 'Bancada de comparação de TTS. Rodada 3a: Seção 1 (fallback) ligada por injeção de dependência sobre @jrocha-io/*.' });

  // Shared speed slider (all sections read it).
  const rate = el('input', { type: 'range', min: '0.5', max: '1.3', step: '0.05', value: '0.9' });
  const rateVal = el('span', { className: 'mut', textContent: '0.90×' });
  rate.addEventListener('input', () => (rateVal.textContent = `${Number(rate.value).toFixed(2)}×`));
  const getRate = (): number => Number(rate.value);

  // On-page log.
  const logEl = el('pre', { id: 'log' });
  const logger: Logger = new DomLogger(logEl);

  const section = buildFallbackSection(logger, getRate);

  const rateBar = el('div', { className: 'bar' });
  rateBar.append(el('label', { textContent: 'Velocidade ' }), rate, rateVal);

  root.append(h1, sub, section, rateBar, el('h2', { textContent: 'Log' }), logEl);
}

function buildFallbackSection(logger: Logger, getRate: () => number): HTMLElement {
  const section = el('section', { className: 'lab' });
  const h2 = el('h2', { className: 'sec' });
  h2.innerHTML = '1 · eSpeak NG + Web Speech <span class="mut">— fallbacks de zero download</span>';
  section.appendChild(h2);

  // Web Speech (native).
  let webSpeech: TtsEngine | null = null;
  try {
    webSpeech = new WebSpeechEngine(platformSpeechApi());
  } catch (err) {
    logger.log(`[boot] Web Speech indisponível: ${(err as Error).message}`);
  }

  // eSpeak (meSpeak WASM) — loaded ASYNC on first selection so its ~4MB blob (and any init failure) never
  // touches Web Speech.
  let espeak: TtsEngine | null = null;
  let espeakLoading = false;

  const wsRadio = el('input', { type: 'radio', name: 'fbEngine', value: 'webspeech', checked: true });
  const esRadio = el('input', { type: 'radio', name: 'fbEngine', value: 'espeak' });
  const activeEngine = (): TtsEngine => {
    if (esRadio.checked && espeak) return espeak;
    if (!webSpeech) throw new Error('nenhum motor de fallback disponível');
    return webSpeech;
  };

  const langSel = el('select');
  for (const l of LANGS) langSel.appendChild(el('option', { value: l, textContent: l }));
  const voiceSel = el('select');
  const getLang = (): Lang => langSel.value as Lang;
  const getVoiceId = (): string | undefined => voiceSel.value || undefined;

  const refreshVoices = (): void => {
    let voices: readonly { id: string; label: string }[] = [];
    try {
      voices = activeEngine().listVoices(getLang());
    } catch {
      voices = [];
    }
    voiceSel.textContent = '';
    voiceSel.appendChild(el('option', { value: '', textContent: '(padrão)' }));
    for (const v of voices) voiceSel.appendChild(el('option', { value: v.id, textContent: v.label }));
  };

  const ensureESpeak = async (): Promise<void> => {
    if (espeak || espeakLoading) return;
    espeakLoading = true;
    logger.log('[eSpeak] carregando meSpeak (WASM ~4MB)…');
    try {
      espeak = await createESpeakEngine();
      logger.log('[eSpeak] pronto.');
    } catch (err) {
      logger.log(`[eSpeak] falha: ${(err as Error).message}`);
      esRadio.checked = false;
      wsRadio.checked = true;
    } finally {
      espeakLoading = false;
      refreshVoices();
    }
  };

  const table = createTaskTable({ getEngine: activeEngine, logger, getLang, getVoiceId, getRate });
  langSel.addEventListener('change', () => {
    table.setLang(getLang());
    refreshVoices();
  });
  esRadio.addEventListener('change', () => {
    if (esRadio.checked) void ensureESpeak();
    refreshVoices();
  });
  wsRadio.addEventListener('change', refreshVoices);
  if (globalThis.speechSynthesis) globalThis.speechSynthesis.onvoiceschanged = refreshVoices;
  refreshVoices();

  const engineBar = el('div', { className: 'bar' });
  engineBar.append(
    labeled('Web Speech', wsRadio),
    labeled('eSpeak NG', esRadio),
  );
  const bar = el('div', { className: 'bar' });
  bar.append(el('label', { textContent: 'Idioma ' }), langSel, el('label', { textContent: 'Voz ' }), voiceSel);
  section.append(engineBar, bar, table.el);
  logger.log('[boot] Seção 1 (eSpeak + Web Speech) pronta.');
  return section;
}

/** A radio/checkbox wrapped in a label with trailing text. */
function labeled(text: string, input: HTMLElement): HTMLLabelElement {
  const l = el('label', { className: 'toggle' });
  l.append(input, document.createTextNode(' ' + text));
  return l;
}

const app = document.querySelector<HTMLDivElement>('#app');
if (app) boot(app);
