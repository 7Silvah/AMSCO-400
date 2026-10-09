// src/components/helpers.tsx — utilidades compartidas de los componentes UI.
// - stepEntry(): STEP[ph.id] con tolerancia a los ids nulos del original
//   (l1/l2/l9/l10 son null en content.ts; el original rompería en esos pasos
//   de la prueba de fugas — aquí se mapean a su fase equivalente del ciclo
//   normal: l1→n2 sello, l2→n3 purga, l9→n10 ruptura de vacío, l10→n11 retraer).
// - ddText(): porte verbatim de ddText() del original (líneas ~1806-1810).
// - LinkText: porte declarativo de linkify() del original (línea ~1800):
//   convierte los códigos de pieza del texto en botones .plink que seleccionan
//   la pieza (onSelect) y la resaltan al pasar el mouse (onHover).
import React from 'react';
import type { ReactNode } from 'react';
import { STEP, INFO } from '../data/content';
import type { StepEntry } from '../data/content';
import { L } from '../i18n';

const STEP_ALIAS: Record<string, string> = { l1: 'n2', l2: 'n3', l9: 'n10', l10: 'n11' };

export function stepEntry(id: string): StepEntry {
  return STEP[id] || STEP[STEP_ALIAS[id]];
}

export function ddText(s: string, doors: number): string {
  return s.replace(/\s*\((y|and) (S3[68])(?: con dos puertas| on two-door units)?\)/g, (m, w, id) => doors === 2 ? " " + w + " " + id : "")
    .replace(/el empaque DS1 contra la puerta/g, doors === 2 ? "los empaques DS1 y DS2 contra sus puertas" : "el empaque DS1 contra la puerta").replace(/gasket DS1 against the door/g, doors === 2 ? "gaskets DS1 and DS2 against their doors" : "gasket DS1 against the door").replace(/Sin la señal de PS1/g, doors === 2 ? "Sin la señal de PS1 y PS2" : "Sin la señal de PS1").replace(/Without PS1's signal/g, doors === 2 ? "Without PS1 and PS2's signals" : "Without PS1's signal").replace(/el empaque DS1/g, doors === 2 ? "los empaques DS1 y DS2" : "el empaque DS1").replace(/gasket DS1/g, doors === 2 ? "gaskets DS1 and DS2" : "gasket DS1")
    .replace(/DS1\/DS2/g, doors === 2 ? "DS1/DS2" : "DS1").replace(/las uniones de S37\/S38/g, doors === 2 ? "las uniones de S37/S38" : "la unión de S37").replace(/the S37\/S38 tie-ins/g, doors === 2 ? "the S37/S38 tie-ins" : "the S37 tie-in").replace(/PS1 confirma la presión/g, doors === 2 ? "PS1 y PS2 confirman la presión" : "PS1 confirma la presión").replace(/PS1 confirms the pressure/g, doors === 2 ? "PS1 and PS2 confirm the pressure" : "PS1 confirms the pressure");
}

const PRE = /\b(RTD[1-4]|S\d{1,2}|CK\d|TR\d|PG\d|PT1|PS\d|FC\d|MV\d|ST\d|RV1|F[12]|HX1|VP1|SB1|CS1|DS[12])\b/g;

export interface LinkTextProps {
  text: string;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export function LinkText({ text, onSelect, onHover }: LinkTextProps): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0, key = 0;
  text.replace(PRE, (m: string, _g: string, i: number) => {
    const id = m === "RTD4" ? "RTD1" : m;
    if (!INFO[id]) return m;
    if (i > last) parts.push(text.slice(last, i));
    parts.push(
      <button key={key++} type="button" className="plink" aria-label={m + ": " + L(INFO[id]).n}
        onMouseEnter={() => { if (onHover) onHover(id); }}
        onMouseLeave={() => { if (onHover) onHover(null); }}
        onFocus={() => { if (onHover) onHover(id); }}
        onBlur={() => { if (onHover) onHover(null); }}
        onClick={(e) => { e.preventDefault(); if (onSelect) onSelect(id); }}>
        {m}
      </button>
    );
    last = i + m.length;
    return m;
  });
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
