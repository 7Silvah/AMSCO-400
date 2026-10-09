// src/components/Schematic2D.tsx — placa 2D animada (SVG).
// Porte declarativo de init2D() del original (líneas 1677–1755).
// El original mutaba el DOM con apply()/relabel()/refresh(); aquí el SVG se
// re-renderiza desde props (state, doors, selected, focus, hover), que es
// equivalente porque todo el dibujo deriva de esos valores.
// Props extra vs. la spec mínima (necesarias para el 1:1):
// - doors: apply() lo usa para segOn/partOn y ocultar lo de dos puertas.
// - selected/focus/hover: reproduce refresh() (anillo .sel de la pieza).
import React from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { ND, SG } from '../data/placard';
import { INFO, SHORT, NOCODE } from '../data/content';
import { tr, L, useLang } from '../i18n';
import type { CycleState } from '../state/cycle';
import { partOf, KIND, NORING, DDP, ADJ, SEGS, segOn, partOn, medOf } from '../state/cycle';
import { stepEntry } from './helpers';

export interface Schematic2DProps {
  state: CycleState;
  doors: number;
  onSelect: (id: string | null) => void;
  selected?: string | null;
  focus?: string[];
  hover?: string | null;
}

/* ---------- estáticos (no dependen del estado) ---------- */
function axis2(id: string): { h: boolean; d: number } {
  const segs = ADJ[id] || [];
  for (const sid of segs) {
    const s = SEGS[sid];
    const pts: number[][] = [ND[s.a].p2, ...s.v2, ND[s.b].p2];
    let a: number[], b: number[];
    if (s.b === id) { a = pts[pts.length - 2]; b = pts[pts.length - 1]; }
    else { a = pts[0]; b = pts[1]; }
    const dx = b[0] - a[0], dy = b[1] - a[1];
    if (Math.abs(dx) + Math.abs(dy) > 0) return Math.abs(dx) >= Math.abs(dy) ? { h: true, d: Math.sign(dx) * (s.b === id ? 1 : 1) } : { h: false, d: Math.sign(dy) };
  }
  return { h: true, d: 1 };
}
const AX: Record<string, { h: boolean; d: number }> = {};
const JDOTS: string[] = Object.keys(ND).filter(id => ND[id].k === "jn" && (ADJ[id] || []).length >= 3);
const E2DOTS = SG.filter(s => s.e2);
const COMPS: string[] = Object.keys(ND).filter(id => partOf(id) === id && ND[id].k !== "src");
Object.keys(ND).forEach(id => { AX[id] = axis2(id); });

const LAB2: Record<string, [number, number, "start" | "middle" | "end"]> = { PR1: [-13, -9, "end"], ST2: [0, -11, "middle"], MV2: [0, -17, "middle"], TR3: [8, -8, "start"], S9: [-22, 4, "end"], S35: [0, -22, "middle"], PS1: [0, -9, "middle"], S36: [-22, 4, "end"], PS2: [0, -9, "middle"], PG2: [0, -13, "middle"], RV1: [0, -16, "middle"], S2: [0, 17, "middle"], F1: [12, 4, "start"], S1: [12, 4, "start"], CK1: [12, 4, "start"], PG1: [0, -13, "middle"], PT1: [0, -11, "middle"], FC3: [8, 4, "start"], S37: [9, 4, "start"], MV4: [0, -17, "middle"], FC4: [0, -9, "middle"], S38: [12, 4, "start"], RTD1: [0, 16, "middle"], MV3: [-10, 4, "end"], S40: [12, 10, "start"], TR1: [-11, 4, "end"], S3: [9, 4, "start"], CK4: [11, 4, "start"], CK8: [0, -10, "middle"], FC2: [10, 4, "start"], CK2: [10, 4, "start"], MV1: [0, -17, "middle"], ST1: [0, -11, "middle"], S7: [-22, 4, "end"], FC1: [10, 4, "start"], S4: [-22, 4, "end"], RTD3: [12, 4, "start"], ST3: [11, 4, "start"], TR2: [-11, 4, "end"], CK3: [0, -10, "middle"], RTD2: [0, -8, "middle"], S43: [0, 19, "middle"] };
const bow = (x: number, y: number, h: boolean): string => h ? `M${x - 8} ${y - 5.5}L${x + 8} ${y + 5.5}L${x + 8} ${y - 5.5}L${x - 8} ${y + 5.5}Z` : `M${x - 5.5} ${y - 8}L${x + 5.5} ${y + 8}L${x - 5.5} ${y + 8}L${x + 5.5} ${y - 8}Z`;

/* ---------- símbolo de cada pieza (switch(k) del original) ---------- */
function Sym({ id }: { id: string }): ReactNode {
  const n = ND[id], k = n.k, x = n.p2[0], y = n.p2[1];
  const h = AX[id].h;
  let inner: ReactNode = null;
  switch (k) {
    case "sol": case "solb":
      inner = (<>{h
        ? <><line x1={x} y1={y} x2={x} y2={y - 10} className="ln" /><rect x={x - 5} y={y - 19} width={10} height={9} rx={1.5} className="sym" /><circle cx={x} cy={y - 14.5} r={2.2} className="led" /></>
        : <><line x1={x} y1={y} x2={x - 10} y2={y} className="ln" /><rect x={x - 19} y={y - 5} width={9} height={10} rx={1.5} className="sym" /><circle cx={x - 14.5} cy={y} r={2.2} className="led" /></>}
        <path d={bow(x, y, h)} className="sym vb" /></>);
      break;
    case "man":
      inner = (<>{h
        ? <><line x1={x} y1={y} x2={x} y2={y - 11} className="ln" /><line x1={x - 5} y1={y - 11} x2={x + 5} y2={y - 11} className="ln" /></>
        : <><line x1={x} y1={y} x2={x + 11} y2={y} className="ln" /><line x1={x + 11} y1={y - 5} x2={x + 11} y2={y + 5} className="ln" /></>}
        <path d={bow(x, y, h)} className="sym vb" /></>);
      break;
    case "reg":
      inner = (<><circle cx={x} cy={y} r={7.5} className="sym vb" /><circle cx={x} cy={y} r={2.2} className="solid" /></>);
      break;
    case "chk": {
      const d = AX[id].d || 1;
      const p = h ? `M${x - 6 * d} ${y - 6}L${x + 6 * d} ${y}L${x - 6 * d} ${y + 6}Z` : `M${x - 6} ${y - 6 * d}L${x} ${y + 6 * d}L${x + 6} ${y - 6 * d}Z`;
      inner = (<><path d={p} className="sym vb" />
        {h ? <line x1={x + 7 * d} y1={y - 7} x2={x + 7 * d} y2={y + 7} className="ln" />
          : <line x1={x - 7} y1={y + 7 * d} x2={x + 7} y2={y + 7 * d} className="ln" />}</>);
      break;
    }
    case "trap":
      inner = (<><circle cx={x} cy={y} r={7} className="sym vb" /><path d={`M${x - 5} ${y - 5}L${x + 5} ${y + 5}M${x + 5} ${y - 5}L${x - 5} ${y + 5}`} className="ln" /></>);
      break;
    case "str":
      inner = (<>{h
        ? <path d={`M${x - 4} ${y}L${x + 4} ${y + 8}M${x + 1} ${y + 10}L${x + 7} ${y + 6}`} className="ln" />
        : <path d={`M${x} ${y - 4}L${x + 8} ${y + 4}M${x + 10} ${y + 1}L${x + 6} ${y + 7}`} className="ln" />}
        <circle cx={x} cy={y} r={2.4} className="solid" /></>);
      break;
    case "orf":
      inner = (h
        ? <path d={`M${x - 4} ${y - 6}L${x} ${y - 1.5}L${x + 4} ${y - 6}M${x - 4} ${y + 6}L${x} ${y + 1.5}L${x + 4} ${y + 6}`} className="ln" />
        : <path d={`M${x - 6} ${y - 4}L${x - 1.5} ${y}L${x - 6} ${y + 4}M${x + 6} ${y - 4}L${x + 1.5} ${y}L${x + 6} ${y + 4}`} className="ln" />);
      break;
    case "ndl":
      inner = (<><path d={bow(x, y, h)} className="sym vb" /><path d={`M${x - 8} ${y + 8}L${x + 8} ${y - 8}M${x + 8} ${y - 8}L${x + 3} ${y - 7}M${x + 8} ${y - 8}L${x + 7} ${y - 3}`} className="ln" /></>);
      break;
    case "safety":
      inner = (<><path d={bow(x, y, true)} className="sym vb" /><polyline points={`${x},${y} ${x - 4},${y - 3} ${x + 4},${y - 6} ${x - 4},${y - 9} ${x + 4},${y - 12} ${x},${y - 14}`} className="ln" /></>);
      break;
    case "gauge":
      inner = (<><circle cx={x} cy={y} r={9.5} className="sym" /><text x={x} y={y + 3} className="lbl" textAnchor="middle" style={{ fontSize: "7.5px" }}>{id}</text></>);
      break;
    case "pt":
      inner = (<path d={`M${x} ${y - 8}L${x + 8} ${y}L${x} ${y + 8}L${x - 8} ${y}Z`} className="sym" />);
      break;
    case "psw":
      inner = (<><rect x={x - 6} y={y - 6} width={12} height={12} className="sym" /><line x1={x - 6} y1={y + 6} x2={x + 6} y2={y - 6} className="ln" /></>);
      break;
    case "rtd": case "rtdi": {
      const path = h ? `M${x - 9} ${y - 4}q3 -5 6 0t6 0t6 0` : `M${x - 9} ${y + 3}q3 -5 6 0t6 0t6 0`;
      inner = (<><path d={path} className="ln" /><line x1={x - 10} y1={y + 4} x2={x + 10} y2={y - 6} className="ln" /></>);
      break;
    }
    case "filter":
      inner = (<><rect x={x - 6} y={y - 9} width={12} height={18} rx={1.5} className="sym" /><rect x={x - 6} y={y - 9} width={12} height={5} className="solid" /></>);
      break;
  }
  const lb = k === "gauge" ? null : (LAB2[id] || (h ? [0, -14, "middle"] as [number, number, "start" | "middle" | "end"] : [11, 4, "start"] as [number, number, "start" | "middle" | "end"]));
  return (<>
    <circle cx={x} cy={y} r={k === "solb" ? 16 : 13} className="halo" />
    {inner}
    {lb && <text x={x + lb[0]} y={y + lb[1]} className="lbl" textAnchor={lb[2]}>{id === "RTD1" ? "RTD1/4" : id}</text>}
    <circle cx={x} cy={y} r={k === "solb" ? 14 : 11} className="hit" />
  </>);
}

/* ---------- componente ---------- */
export function Schematic2D({ state: St, doors, onSelect, selected = null, focus = [], hover = null }: Schematic2DProps): ReactNode {
  useLang();
  const ph = St.ph;
  const ss = ph.seal;

  if (!COMPS.length) return <p className="small">{tr("noGL")}</p>;

  const compClass = (id: string): string => {
    const k = KIND[id];
    let c = "comp" + (DDP.has(id) ? " dd" : "");
    let open = false;
    if (k === "sol" || k === "solb") open = St.open.has(id);
    else if (k === "chk") open = St.chk.has(id);
    else if (k === "trap") open = St.trap.has(id);
    else if (k === "man") open = id === "MV1" || id === "MV2";
    else if (k === "reg") open = true;
    else if (k === "pump") open = St.pump;
    if (open) c += " open";
    if (St.ener.has(id)) c += " ener";
    if (!NORING.has(id) && (id === selected || id === hover || focus.includes(id))) c += " sel";
    return c;
  };
  const comp = (id: string, children: ReactNode): ReactNode => {
    const m = medOf(id, St, doors);
    const info = INFO[id];
    return (
      <g key={id} className={compClass(id)} data-id={id} tabIndex={0} role="button"
        data-hide={partOn(id, doors) ? "0" : "1"}
        aria-label={(NOCODE.has(id) ? "" : id + ": ") + (info ? L(info).n : "")}
        style={{ "--c": m ? "var(--" + m + ")" : "var(--ink2)" } as CSSProperties}
        onClick={() => onSelect(selected === id ? null : id)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(id); } }}>
        {children}
      </g>
    );
  };

  const ddNone = { display: doors === 2 ? "" : "none" } as CSSProperties;

  return (
    <svg id="sch2d" viewBox="14 30 862 712" role="img" aria-labelledby="sch2dT">
      <title id="sch2dT">{tr("title")}</title>
      {/* gBg: recipiente + fuentes/extremos */}
      <g>
        {comp("JACKET", (<>
          <rect x={175} y={266} width={282} height={166} rx={6} className="jacket" />
          <text x={316} y={272.5} className="zone" textAnchor="middle" style={{ fontSize: "8.5px" }}>{tr("s2Jk")}</text>
        </>))}
        {comp("CHAMBER", (<>
          <rect x={186} y={277} width={261} height={144} rx={4} className={"chamber ch-" + ph.ch} />
          <text x={316} y={334} className="zone" textAnchor="middle">{tr("s2Ch")}</text>
          <text x={316} y={350} className="note" textAnchor="middle">{L(stepEntry(ph.id || "").cs)}</text>
        </>))}
        {comp("SB1", (<>
          <line x1={404} y1={300} x2={446} y2={290} className="ln" />
          <text x={400} y={298} className="lbl" textAnchor="end">SB1</text>
          <circle cx={425} cy={295} r={12} className="hit" />
          <circle cx={425} cy={295} r={13} className="halo" />
        </>))}
        {comp("CS1", (<>
          <rect x={197} y={398} width={12} height={18} className="box" />
          <line x1={203} y1={402} x2={203} y2={412} className="ln" />
          <circle cx={203} cy={401} r={2.5} className="solid" />
          <text x={212} y={396} className="lbl">CS1</text>
          <circle cx={203} cy={407} r={13} className="halo" />
          <circle cx={203} cy={407} r={12} className="hit" />
        </>))}
        {comp("ST4", (<>
          <path d="M218 421 L234 421 L226 413 Z" className="sym" />
          <text x={238} y={415} className="lbl">ST4</text>
          <circle cx={226} cy={417} r={11} className="halo" />
          <circle cx={226} cy={417} r={10} className="hit" />
        </>))}
        {comp("DOOR", (<>
          <rect x={158} y={258} width={9} height={182} rx={2} className="box" />
          <text x={150} y={250} className="zone" textAnchor="end" style={{ fontSize: "9px" }}>{tr("s2OE")}</text>
        </>))}
        {comp("DS1", (<>
          <rect x={168} y={268} width={5.5} height={162} rx={2} className={"seal" + (ss === "off" ? "" : " " + ss)} />
          <text x={150} y={345} className="lbl" textAnchor="end">DS1</text>
          <rect x={160} y={268} width={20} height={162} className="hit" />
        </>))}
        {comp("DOOR2", (<>
          <rect x={466} y={258} width={9} height={182} rx={2} className="box" />
          <text x={482} y={250} className="zone" textAnchor="start" style={{ fontSize: "9px" }}>{tr("s2NOE")}</text>
        </>))}
        {comp("DS2", (<>
          <rect x={459} y={268} width={5.5} height={162} rx={2} className={"seal" + (ss === "off" ? "" : " " + ss)} />
          <text x={482} y={345} className="lbl" textAnchor="start">DS2</text>
          <rect x={452} y={268} width={20} height={162} className="hit" />
        </>))}
        <path d="M392 52 L380 59 L392 66 Z" className="sym" />
        <text x={398} y={56} className="zone">{tr("s2Steam")}</text>
        <text x={398} y={68} className="zone">{tr("s2Steam2")}</text>
        <path d="M784 220 L772 227 L784 234 Z" className="sym" />
        <text x={790} y={225} className="zone">{tr("s2Water")}</text>
        <text x={790} y={237} className="zone">{tr("s2Water2")}</text>
        <path d="M536 40 L542 52 L548 40 Z" className="sym" />
        <text x={552} y={46} className="note">{tr("zAtm")}</text>
        <path d="M608 404 L614 414 L620 404 Z" className="sym" />
        <text x={614} y={388} className="note" textAnchor="middle">{tr("s2Anti")}</text>
        <text x={614} y={398} className="note" textAnchor="middle">{tr("s2Anti2")}</text>
        <path d="M569 340 L575 352 L581 340 Z" className="sym" />
        <text x={565} y={350} className="note" textAnchor="end">{tr("s2Floor")}</text>
        <text x={292} y={128} className="note ddt" style={ddNone}>{tr("s2DD")}</text>
        <text x={36} y={684} className="note">{tr("s2N1")}</text>
        <text x={36} y={698} className="note">{tr("s2N2")}</text>
        <text x={36} y={712} className="note">{tr("s2N3")}</text>
      </g>
      {/* gPipe: tuberías + uniones */}
      <g>
        {SG.map(s => {
          const pts: number[][] = [ND[s.a].p2, ...s.v2, s.e2 || ND[s.b].p2];
          const f = St.flow[s.id], hh = St.hold[s.id];
          let c = "p2" + (s.size === "L" ? " big" : s.size === "T" ? " tube" : "");
          if (f) c += " flow m-" + f.m + (f.dir < 0 ? " rev" : "") + (f.slow ? " slow" : "");
          else if (hh) c += " hold m-" + hh;
          return <polyline key={s.id} points={pts.map(p => p.join(",")).join(" ")} className={c}
            data-dd={s.dd ? "1" : undefined} style={{ display: segOn(s, doors) ? "" : "none" } as CSSProperties} />;
        })}
        {JDOTS.map(id => (
          <circle key={id} cx={ND[id].p2[0]} cy={ND[id].p2[1]} r={2.6} className="jd"
            data-dd={ND[id].dd ? "1" : undefined}
            style={(ND[id].dd ? ddNone : undefined) as CSSProperties} />
        ))}
        {E2DOTS.map(s => (
          <circle key={"e2" + s.id} cx={s.e2[0]} cy={s.e2[1]} r={2.6} className="jd" />
        ))}
      </g>
      {/* gComp: equipos + piezas */}
      <g>
        {comp("HX1", (<>
          <circle cx={647} cy={517} r={15} className="box" />
          <path d="M635 523 L640 511 L645 523 L650 511 L655 523 L660 511" className="ln" />
          <text x={666} y={503} className="lbl">HX1</text>
          <circle cx={647} cy={517} r={19} className="halo" />
          <circle cx={647} cy={517} r={16} className="hit" />
        </>))}
        {comp("VP1", (<>
          <circle cx={790} cy={547} r={22} className="pumpb" />
          <g className="imp">
            {[0, 1, 2, 3].map(a => {
              const r = a * Math.PI / 4;
              return <line key={a} x1={790 - 14 * Math.cos(r)} y1={547 - 14 * Math.sin(r)} x2={790 + 14 * Math.cos(r)} y2={547 + 14 * Math.sin(r)} />;
            })}
          </g>
          <circle cx={790} cy={547} r={3} className="solid" />
          <text x={764} y={586} className="lbl" textAnchor="end">VP1</text>
          <circle cx={790} cy={547} r={26} className="halo" />
          <circle cx={790} cy={547} r={22} className="hit" />
        </>))}
        {comp("TANK", (<>
          <rect x={577} y={646} width={63} height={72} className="box" />
          <rect x={578.5} y={660} width={60} height={56.5} className="tankw" />
          <line x1={608} y1={646} x2={608} y2={692} className="ln" />
          <circle cx={608} cy={682} r={40} className="halo" />
          <rect x={577} y={646} width={63} height={72} className="hit" />
        </>))}
        {comp("F2", (<>
          <rect x={600} y={706.5} width={40} height={5} rx={1.5} className="sym" />
          <text x={596} y={704} className="lbl" textAnchor="end">F2</text>
          <circle cx={620} cy={709} r={12} className="halo" />
          <rect x={598} y={701} width={44} height={14} className="hit" />
        </>))}
        {comp("WASTE", (<>
          <path d="M509 690 L545 690 L533 705 L521 705 Z" className="box" />
          <line x1={527} y1={705} x2={527} y2={718} className="ln" />
          <text x={527} y={731} className="zone" textAnchor="middle" style={{ fontSize: "9.5px" }}>{tr("s2Waste")}</text>
          <circle cx={527} cy={700} r={20} className="halo" />
          <rect x={505} y={684} width={44} height={36} className="hit" />
        </>))}
        {comp("CTRL", (<>
          <rect x={46} y={600} width={66} height={30} rx={4} className="box" />
          <text x={79} y={619} className="lbl" textAnchor="middle">CTRL</text>
          <circle cx={79} cy={615} r={26} className="halo" />
          <rect x={46} y={600} width={66} height={30} className="hit" />
        </>))}
        {comp("STARTER", (<>
          <rect x={46} y={640} width={66} height={22} rx={4} className="box" />
          <text x={79} y={655} className="lbl" textAnchor="middle">{L(SHORT.STARTER)}</text>
          <circle cx={79} cy={651} r={24} className="halo" />
          <rect x={46} y={640} width={66} height={22} className="hit" />
        </>))}
        {COMPS.map(id => comp(id, <Sym key={"s" + id} id={id} />))}
      </g>
    </svg>
  );
}
