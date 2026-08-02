import type { Lang, TtsEngine } from '@jrocha-io/tts';
import type { Logger } from '@jrocha-io/logging';
import { SAMPLES, TASKS } from '../content/samples.js';

export interface TaskTableDeps {
  /** The currently-active engine (may change as the user flips an engine radio). */
  readonly getEngine: () => TtsEngine;
  readonly logger: Logger;
  readonly getLang: () => Lang;
  readonly getVoiceId: () => string | undefined;
  readonly getRate: () => number;
}

export interface TaskTable {
  readonly el: HTMLElement;
  /** Refill the textareas for a language. */
  setLang(lang: Lang): void;
}

/** A table of the five literacy drills; each row speaks through the injected engine and shows its metric. */
export function createTaskTable(deps: TaskTableDeps): TaskTable {
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  const areas = new Map<string, HTMLTextAreaElement>();

  for (const task of TASKS) {
    const tr = document.createElement('tr');

    const tdTask = document.createElement('td');
    tdTask.className = 'task';
    const lbl = document.createElement('span');
    lbl.className = 'lbl';
    lbl.textContent = task.label;
    const ta = document.createElement('textarea');
    ta.rows = 2;
    areas.set(task.id, ta);
    tdTask.append(lbl, ta);

    const tdPlay = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = '▶';
    const metric = document.createElement('span');
    metric.className = 'metric';
    tdPlay.append(btn, metric);

    btn.addEventListener('click', () => {
      void speak(deps, ta.value.trim(), metric, btn);
    });

    tr.append(tdTask, tdPlay);
    tbody.appendChild(tr);
  }

  const api: TaskTable = {
    el: table,
    setLang(lang: Lang): void {
      for (const task of TASKS) {
        const ta = areas.get(task.id);
        if (ta) ta.value = SAMPLES[lang][task.id];
      }
    },
  };
  api.setLang(deps.getLang());
  return api;
}

async function speak(deps: TaskTableDeps, text: string, metric: HTMLElement, btn: HTMLButtonElement): Promise<void> {
  if (!text) return;
  metric.textContent = '…';
  btn.disabled = true;
  const engine = deps.getEngine();
  try {
    const voiceId = deps.getVoiceId();
    const m = await engine.speak({
      text,
      lang: deps.getLang(),
      rate: deps.getRate(),
      ...(voiceId !== undefined ? { voiceId } : {}),
    });
    metric.textContent = m.rtf !== undefined ? `RTF ${m.rtf.toFixed(2)}` : `${Math.round(m.synthMs)} ms`;
    deps.logger.log(`[${engine.meta.id}] ${text.slice(0, 24)} → ${metric.textContent}`);
  } catch (err) {
    metric.textContent = 'erro';
    deps.logger.log(`[${engine.meta.id}] ERRO: ${(err as Error).message}`);
  } finally {
    btn.disabled = false;
  }
}
