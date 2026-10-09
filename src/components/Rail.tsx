// src/components/Rail.tsx — columna lateral (.rail del original).
// Incluye: preguntas guiadas (finder: QS, #qlist, qans), lecturas (readout:
// PG1 según STEP + fase; facts: jacket PG2, seal PS1, door, waste RTD2),
// gráfica SVG de presión del ciclo (#graph, a partir de TRACE[mode] y ph.r),
// estados como chips (#states: válvulas abiertas/energizadas) y botón play.
// Props extra vs. la spec mínima:
// - mode: drawChart() usa TRACE[mode]; sin él no hay gráfica 1:1.
// - qActive/onAsk: ask() cambia modo/paso (estado de App); si onAsk no se
//   pasa, la pregunta solo se muestra sin mover el ciclo.
// - onSelect/onHover: chips y respuestas enlazan piezas como en el original.
import React, { useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import type { CycleMode } from '../data/phases';
import { QS, TRACE, INFO } from '../data/content';
import type { QItem } from '../data/content';
import { tr, L, useLang } from '../i18n';
import type { CycleState } from '../state/cycle';
import { cycOf, cycPh, nodeOn, medOf, SOL_ORDER } from '../state/cycle';
import { stepEntry, ddText, LinkText } from './helpers';

export interface RailProps {
  mode: CycleMode;
  state: CycleState;
  doors: number;
  s9On: boolean;
  playing: boolean;
  onPlay: () => void;
  qActive?: string | null;
  onAsk?: (q: QItem | null) => void;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export function Rail(props: RailProps): ReactNode {
  useLang();
  const { mode, state: S, doors, s9On, playing, onPlay, onAsk, onSelect, onHover } = props;
  const ph = S.ph;
  const tx = stepEntry(ph.id || "");
  const ss = ph.seal;

  const [innerQ, setInnerQ] = useState<string | null>(null);
  const qa = onAsk ? (props.qActive ?? null) : innerQ;
  const handleAsk = (q: QItem) => {
    const next = qa === q.id ? null : q;
    if (onAsk) onAsk(next); else setInnerQ(next ? next.id : null);
  };
  const q = QS.find(x => x.id === qa);

  const ord = (a: Set<string>): string[] => SOL_ORDER.filter(x => a.has(x));
  const withS9 = (s: Set<string>): Set<string> => {
    const x = new Set(s);
    cycOf(S.ph).forEach(id => { if (nodeOn(id, doors)) x.add(id); });
    return x;
  };
  const chip = (id: string, led: boolean): ReactNode => {
    const cy = cycOf(S.ph).has(id);
    const cls = "chip" + (led ? " led" : "") + (cy ? " cyc" : "") + (cy && cycPh(id) !== s9On ? " off" : "");
    const m = medOf(id, S, doors);
    return (
      <button key={id} type="button" className={cls} data-cyc={cy ? (cycPh(id) ? "a" : "b") : ""}
        style={(m && !led ? { "--c": "var(--" + m + ")" } : undefined) as CSSProperties}
        aria-label={id + ": " + L(INFO[id]).n}
        onClick={() => { if (onSelect) onSelect(id); }}>
        <i></i>{id}
      </button>
    );
  };
  const srow = (title: string, ids: string[], led: boolean, emptyText?: string): ReactNode => (
    <div className="srow" key={title}>
      <h4>{title}</h4>
      <div className="chips">
        {ids.length === 0
          ? <span className="none">{emptyText || tr('none')}</span>
          : ids.map(id => chip(id, led))}
      </div>
    </div>
  );

  const sealTxt = ss === "on" ? tr('stSealOn') : ss === "fill" ? tr('stSealFill') : ss === "retract" ? tr('stSealRet') : tr('stSealOff');
  const r = ph.r || [0, 0];

  return (
    <div className="rail">
      <details className="card find" id="findBox">
        <summary>
          <span className="fsum">
            <span id="findT" className="ftitle">{tr('findT')}</span>
            <span className="small">{tr('findHint')}</span>
          </span>
          <span className="chev" aria-hidden="true"></span>
        </summary>
        <div className="fbody">
          <p className="small">{tr('findNote')}</p>
          <div className="qlist" id="qlist">
            {QS.map(qq => (
              <button key={qq.id} className="qbtn" type="button"
                aria-pressed={qq.id === qa} onClick={() => handleAsk(qq)}>
                {L(qq.t)}
              </button>
            ))}
          </div>
          <p className="qans" id="qans" hidden={!q} aria-live="polite">
            {q ? <LinkText text={ddText(L(q.a), doors)} onSelect={onSelect} onHover={onHover} /> : null}
          </p>
        </div>
      </details>

      <section className="card pad" aria-labelledby="readT">
        <h2 id="readT">{tr('readT')}</h2>
        <div className="readout"><span id="ro-p">{L(tx.p)}</span><span id="ro-u">{tx.u}</span></div>
        <p id="ro-n">{L(tx.n)}</p>
        <div className="facts">
          <div className="fact"><span>{tr('fJacket')}</span><b id="f-jk">{tr('jkFact')}</b></div>
          <div className="fact"><span>{tr('fSeal')}</span><b id="f-seal">{sealTxt}</b></div>
          <div className="fact"><span>{tr('fDoor')}</span><b id="f-door" className={ph.lock ? "lk" : "fr"}>{ph.lock ? tr('stDoorLock') : tr('stDoorFree')}</b></div>
          <div className="fact"><span>{tr('fWaste')}</span><b id="f-waste">{S.open.has("S4") ? tr('wasteS4') : tr('wasteFact')}</b></div>
        </div>
        <svg id="chart" viewBox="0 0 328 112" role="img" aria-label={tr('chartAria')}>
          <line x1={14} y1={55} x2={314} y2={55} className="atm" />
          <rect id="hlr" x={(14 + r[0] * 300).toFixed(1)} y={4} width={Math.max(4, (r[1] - r[0]) * 300).toFixed(1)} height={100} className="hlr" />
          <polyline points={TRACE[mode].map(p => [(14 + p[0] * 300).toFixed(1), p[1]].join(",")).join(" ")} className="trace" />
          <text x={16} y={12} className="ctext">{tr('chartP') + " (psig)"}</text>
          <text x={16} y={108} className="ctext">{tr('chartV') + " (inHg)"}</text>
        </svg>
        <p className="small">{tr('chartNote')}</p>
        <div className="states" id="states">
          {srow(tr('openSol'), ord(withS9(S.open)), false)}
          {srow(tr('ledOn'), ord(withS9(S.ener)), true)}
          {srow(tr('openChk'), ["CK1", "CK2", "CK3", "CK4", "CK8"].filter(x => S.chk.has(x)), false)}
          {srow(tr('trapsT'), ["TR1", "TR2", "TR3"].filter(x => S.trap.has(x)), false)}
          {srow(tr('pumpT'), S.pump ? ["VP1"] : [], false, tr('pumpOff'))}
        </div>
        <button className="btn" id="play" onClick={onPlay}>{playing ? tr('pause') : tr('play')}</button>
      </section>
    </div>
  );
}
