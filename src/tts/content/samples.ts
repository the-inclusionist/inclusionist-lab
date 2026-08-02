import type { Lang } from '@jrocha-io/tts';

/** The five literacy drills the lab benchmarks, per language. */
export interface Task {
  readonly id: TaskId;
  readonly label: string;
}
export type TaskId = 'phon' | 'letr' | 'silab' | 'palav' | 'frase';

export const TASKS: readonly Task[] = [
  { id: 'phon', label: '1 · Fonemas' },
  { id: 'letr', label: '2 · Soletrar letras' },
  { id: 'silab', label: '3 · Sílabas' },
  { id: 'palav', label: '4 · Palavras' },
  { id: 'frase', label: '5 · Frases' },
];

/** Sample text per language × task. */
export const SAMPLES: Readonly<Record<Lang, Readonly<Record<TaskId, string>>>> = {
  pt: {
    phon: 'a, é, i, ó, u, fê, sê',
    letr: 'a, bê, cê, dê, é, efe, gê, agá, i, jota, ká, ele, eme, ene, ó, pê, quê, erre, esse, tê, u, vê, xis, zê',
    silab: 'ba be bi bo bu, ca ce ci co cu, da de di do du',
    palav: 'casa, bola, gato, escola, pato, uva',
    frase: 'O gato preto subiu no telhado da casa amarela.',
  },
  en: {
    phon: 'a, e, i, o, u, ef, es',
    letr: 'ay, bee, see, dee, ee, ef, gee, aitch, eye, jay, kay, el, em, en, oh, pee, cue, ar, ess, tee, you, vee, ex, zee',
    silab: 'ba be bi bo bu, ca ce ci co cu, da de di do du',
    palav: 'house, ball, cat, school, duck, apple',
    frase: 'The black cat climbed onto the roof of the yellow house.',
  },
  es: {
    phon: 'a, e, i, o, u, efe, ese',
    letr: 'a, be, ce, de, e, efe, ge, hache, i, jota, ka, ele, eme, ene, eñe, o, pe, cu, erre, ese, te, u, uve, equis, zeta',
    silab: 'ba be bi bo bu, ca ce ci co cu, da de di do du',
    palav: 'casa, pelota, gato, escuela, pato, uva',
    frase: 'El gato negro subió al tejado de la casa amarilla.',
  },
};
