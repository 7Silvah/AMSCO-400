// src/components/DetailPanel.tsx — panel de detalle de la pieza seleccionada.
// Porte de renderDetail() del original (#detail + showDetail, líneas ~1786–1800).
// Si no hay selección (o la pieza no tiene INFO), no renderiza nada
// (equivale al hidden + innerHTML="" del original).
import React from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { INFO, PARTNO, PNNOTE, NOCODE, SHORT } from '../data/content';
import { tr, L, useLang } from '../i18n';
import type { CycleState } from '../state/cycle';
import { stateText, neighbors } from '../state/cycle';
import { LinkText } from './helpers';

export interface DetailPanelProps {
  selected: string | null;
  state: CycleState;
  doors: number;
  onClose: () => void;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export function DetailPanel({ selected, state: St, doors, onClose, onSelect, onHover }: DetailPanelProps): ReactNode {
  useLang();
  if (!selected) return null;
  const info = INFO[selected];
  if (!info) return null;
  const i = L(info);
  const [txt, on, m] = stateText(selected, St, tr, L, doors);
  const nb = neighbors(selected, doors).filter(p => INFO[p]);
  const pk = tr("pk") as unknown as Record<string, string>;

  const row = (label: string, v: string): ReactNode => !v ? null : (
    <><dt>{label}</dt><dd><LinkText text={v} onSelect={onSelect} onHover={onHover} /></dd></>
  );

  return (
    <aside className="detail" id="detail" aria-live="polite">
      <button className="dclose" type="button" aria-label={tr('close')} onClick={onClose}>×</button>
      <div className="dhead">
        {!NOCODE.has(selected) && <span className="dcode">{selected === "RTD1" ? "RTD1/4" : selected}</span>}
        <span className="dname">{i.n}</span>
      </div>
      <span className={'badge' + (on ? ' on' : '')}
        style={(m && on ? { "--c": "var(--" + m + ")" } : undefined) as CSSProperties}>
        {tr('dStep')}{txt}
      </span>
      <dl>
        {row(tr('dWhat'), i.what)}
        {row(tr('dWhen'), i.when)}
        {row(tr('dAna'), i.ana)}
        {row(tr('dFoto'), i.foto)}
        {PARTNO[selected] && (
          <><dt>{tr('dPN')}</dt><dd>
            {PARTNO[selected].map(x => {
              const k = x.indexOf(":");
              return k < 0 ? x : (pk[x.slice(0, k)] || x.slice(0, k)) + " " + x.slice(k + 1);
            }).join(" · ")}
            <span className="small" style={{ display: "block" }}>
              {tr('pnNote') + (PNNOTE[selected] ? " " + L(PNNOTE[selected]) : "")}
            </span>
          </dd></>
        )}
        {nb.length > 0 && (
          <><dt>{tr('dConn')}</dt><dd className="conn">
            {nb.map(p => (
              <button key={p} type="button" aria-label={L(INFO[p]).n} onClick={() => onSelect(p)}>
                {NOCODE.has(p) ? L(SHORT[p]) : (p === "RTD1" ? "RTD1/4" : p)}
              </button>
            ))}
          </dd></>
        )}
      </dl>
    </aside>
  );
}
