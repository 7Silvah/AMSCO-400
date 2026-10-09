// src/components/Stage.tsx — la zona principal (tarjeta .stage del original).
// Incluye: toolbar (#vmode, puertas, #camgroup solo en 3d, #labgroup solo en
// 3d, rayos X), la vista (.view con .v3/.v2 + panel de detalle), la leyenda,
// los 5 botones de modo de ciclo, stepbar + dots y la descripción del paso
// (#ph-desc con STEP[ph.id] y códigos de pieza enlazables).
// El SVG 2D y el panel de detalle se renderizan aquí dentro para conservar la
// estructura .view del original; la vista 3D llega por la prop view3d.
// Nota para App: los clics en prev/next/dots/modos del original llamaban a
// stop() (detener la reproducción); el manejador onStep/onMode de App debe
// hacerlo.
import React from 'react';
import type { ReactNode } from 'react';
import { CYCLES } from '../data/phases';
import type { CycleMode } from '../data/phases';
import { tr, L, useLang } from '../i18n';
import type { CycleState } from '../state/cycle';
import { Schematic2D } from './Schematic2D';
import { DetailPanel } from './DetailPanel';
import { stepEntry, ddText, LinkText } from './helpers';

export type ViewMode = '3d' | '2d';
export type LabMode = 'active' | 'all' | 'none';

export interface StageProps {
  mode: CycleMode;
  onMode: (m: CycleMode) => void;
  stepIdx: number;
  onStep: (i: number) => void;
  doors: number;
  onDoors: (n: number) => void;
  viewMode: ViewMode;
  onViewMode: (v: ViewMode) => void;
  labMode: LabMode;
  onLabMode: (l: LabMode) => void;
  xray: boolean;
  onXray: (x: boolean) => void;
  cam: string;
  onCam: (c: string) => void;
  state: CycleState;
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  /** Clics en vecinos/enlaces del panel de detalle (vuelan a la pieza). */
  onSelectFly?: (id: string) => void;
  onHover?: (id: string | null) => void;
  focus?: string[];
  hover?: string | null;
  view3d?: ReactNode;
}

const CAMS: [string, string][] = [
  ['general', 'camGeneral'], ['top', 'camTop'], ['under', 'camUnder'],
  ['door', 'camDoor'], ['rear', 'camRear'],
];
const MODES: [CycleMode, string][] = [
  ['normal', 'modeNormal'], ['leak', 'modeLeak'], ['dartw', 'modeDartw'],
  ['dart', 'modeDart'], ['serv', 'modeServ'],
];

export function Stage(props: StageProps): ReactNode {
  useLang();
  const { mode, stepIdx, doors, viewMode, labMode, xray, state,
    selected = null, focus = [], hover = null, view3d } = props;
  const { onMode, onStep, onDoors, onViewMode, onLabMode, onXray, onCam, onSelect, onSelectFly, onHover } = props;
  const Lst = CYCLES[mode];
  const ph = Lst[stepIdx] || Lst[0];
  const tx = stepEntry(ph.id || "");
  const sel = (id: string | null) => { if (onSelect) onSelect(id); };

  return (
    <section className="card stage" id="stage" aria-labelledby="steptitle">
      <div className="toolbar">
        <div className="seg" role="group" id="vmode">
          <button id="vm-3d" data-vm="3d" aria-pressed={viewMode === '3d'} onClick={() => onViewMode('3d')}>3D</button>
          <button id="vm-2d" data-vm="2d" aria-pressed={viewMode === '2d'} onClick={() => onViewMode('2d')}>{tr('view2d')}</button>
        </div>
        <div className="tgroup">
          <span className="tcap">{tr('doorsGroup')}</span>
          <div className="seg" role="group" id="doorsSeg" aria-label={tr('doorsGroup')}>
            <button id="doors-1" data-doors="1" aria-pressed={doors === 1} onClick={() => onDoors(1)}>1</button>
            <button id="doors-2" data-doors="2" aria-pressed={doors === 2} onClick={() => onDoors(2)}>2</button>
          </div>
        </div>
        <div className="tgroup" id="camgroup" hidden={viewMode !== '3d'}>
          <span className="tcap">{tr('camGroup')}</span>
          <div className="seg" role="group" id="cams" aria-label={tr('camGroup')}>
            {CAMS.map(([c, k]) => (
              <button key={c} id={'cam-' + c} data-cam={c} onClick={() => onCam(c)}>{tr(k)}</button>
            ))}
          </div>
        </div>
        <div className="tgroup" id="labgroup" hidden={viewMode !== '3d'}>
          <span className="tcap">{tr('labGroup')}</span>
          <div className="seg" role="group" id="labmode" aria-label={tr('labGroup')}>
            <button id="lab-active" data-lab="active" aria-pressed={labMode === 'active'} onClick={() => onLabMode('active')}>{tr('labActive')}</button>
            <button id="lab-all" data-lab="all" aria-pressed={labMode === 'all'} onClick={() => onLabMode('all')}>{tr('labAll')}</button>
            <button id="lab-none" data-lab="none" aria-pressed={labMode === 'none'} onClick={() => onLabMode('none')}>{tr('labNone')}</button>
          </div>
        </div>
        <button className="tog" id="xray" aria-pressed={xray} hidden={viewMode !== '3d'} onClick={() => onXray(!xray)}>{tr('xray')}</button>
      </div>

      <div className="view" id="view">
        <div className="v3" id="v3" hidden={viewMode !== '3d'}>
          {view3d !== undefined ? view3d : (<><div className="labels" id="labels"></div><p className="v3msg" id="v3msg" hidden></p></>)}
        </div>
        <div className="v2" id="v2" hidden={viewMode !== '2d'}>
          <Schematic2D state={state} doors={doors} onSelect={sel} selected={selected} focus={focus} hover={hover} />
        </div>
        <DetailPanel selected={selected} state={state} doors={doors}
          onClose={() => sel(null)} onSelect={(id) => { if (onSelectFly) onSelectFly(id); else sel(id); }} onHover={onHover} />
      </div>

      <div className="legend" aria-hidden="true">
        <span><i style={{ background: "var(--steam)" }}></i><span>{tr('legSteam')}</span></span>
        <span><i style={{ background: "var(--water)" }}></i><span>{tr('legWater')}</span></span>
        <span><i style={{ background: "var(--air)" }}></i><span>{tr('legAir')}</span></span>
        <span><i style={{ background: "var(--vac)" }}></i><span>{tr('legVac')}</span></span>
        <span><i style={{ background: "var(--cond)" }}></i><span>{tr('legCond')}</span></span>
        <span><i className="hold" style={{ background: "var(--steam)" }}></i><span>{tr('legHold')}</span></span>
        <span><i className="slow"></i><span>{tr('legSlow')}</span></span>
        <span><b></b><span>{tr('legRing')}</span></span>
        <span><em></em><span>{tr('legLed')}</span></span>
      </div>
      <p className="hint" id="hint">{viewMode === '3d' ? tr('hint3d') : tr('hint2d')}</p>

      <div className="seg modes" role="group" aria-label={tr('modeGroup')}>
        {MODES.map(([m, k]) => (
          <button key={m} id={'mode-' + m} data-mode={m} aria-pressed={mode === m} onClick={() => onMode(m)}>{tr(k)}</button>
        ))}
      </div>
      <div className="stepbar">
        <button className="navb" id="prev" aria-label={tr('prev')} onClick={() => onStep((stepIdx - 1 + Lst.length) % Lst.length)}>‹</button>
        <div className="stepinfo">
          <div className="stepnum" id="stepnum">{tr('stepOf').replace("{a}", String(stepIdx + 1)).replace("{b}", String(Lst.length))}</div>
          <div className="steptitle" id="steptitle">{L(tx.t)}</div>
        </div>
        <button className="navb" id="next" aria-label={tr('next')} onClick={() => onStep((stepIdx + 1) % Lst.length)}>›</button>
      </div>
      <div className="dots" id="dots">
        {Lst.map((p, i) => (
          <button key={p.id || i} className={'dot' + (i === stepIdx ? ' on' : '')} type="button"
            aria-label={tr('stepAria').replace("{a}", String(i + 1)).replace("{t}", L(stepEntry(p.id || '').t))}
            aria-current={i === stepIdx ? 'step' : undefined}
            onClick={() => onStep(i)}>{i + 1}</button>
        ))}
      </div>
      <p id="ph-desc" aria-live="polite">
        <LinkText text={ddText(L(tx.d), doors)} onSelect={(id) => sel(id)} onHover={onHover} />
      </p>
    </section>
  );
}
