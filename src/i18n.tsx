// src/i18n.tsx — idioma es/en. Lógica verbatim del original:
// - `lang` con persistencia en localStorage ("amsco400-lang"), líneas 706–708.
// - `L = o => (typeof o === 'object' && o !== null) ? (o[lang] ?? o.es) : o`, línea 708.
// - `tr = k => UI[lang][k] ?? UI.es[k] ?? k`, línea 794 (UI vive en data/content.ts).
// En React el idioma vive en contexto (LangProvider/useLang); las funciones
// tr()/L() de módulo leen el idioma actual para que el resto del código
// (puro, sin hooks) pueda usarlas igual que en el original.
import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { UI } from './data/content';

export type Lang = 'es' | 'en';
const KEY = 'amsco400-lang';

let current: Lang = 'es';
try { const v = localStorage.getItem(KEY); if (v === 'es' || v === 'en') current = v; } catch (e) { /* sin localStorage */ }

export function L(o: any): any {
  return (o !== null && typeof o === 'object') ? (o[current] !== undefined ? o[current] : o.es) : o;
}

export function tr(k: string): string {
  const d = UI[current];
  return d[k] !== undefined ? d[k] : (UI.es[k] !== undefined ? UI.es[k] : k);
}

export interface LangCtxValue { lang: Lang; setLang: (l: Lang) => void; }
const LangCtx = createContext<LangCtxValue>({ lang: 'es', setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);
  const setLang = (l: Lang) => {
    current = l;
    try { localStorage.setItem(KEY, l); } catch (e) { /* sin localStorage */ }
    setLangState(l);
  };
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export function useLang(): LangCtxValue {
  return useContext(LangCtx);
}
