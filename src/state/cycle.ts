// src/state/cycle.ts — lógica pura del ciclo (sin DOM), verbatim del original.
// Original: líneas 1143–1262 del HTML (sección "state").
// Cambios vs. el original (solo des-globalización, comportamiento idéntico):
// - `doors` y `s9On` eran variables globales: ahora son parámetros explícitos
//   (stateOf(ph, ctx), segOn(s, doors), nodeOn(id, doors), partOn(id, doors),
//   passable(id, open, doors), medOf(id, St, doors), sealState(St, n, doors),
//   activeParts(St, doors), neighbors(part, doors)).
// - `tr`/`L` eran globales: stateText(id, St, tr, L, doors) los recibe como parámetros.
// - CYCLES ahora se exporta desde data/phases (en el original se definía aquí,
//   línea 1172); este módulo no lo necesita.
// - `const`/`function` → `export` con tipos. Todo lo demás verbatim.

import { ND, SG, PATH } from '../data/placard';
import type { SegEntry } from '../data/placard';
import { STEP } from '../data/content';
import type { Phase } from '../data/phases';

export interface CycleState {
  ph: Phase;
  open: Set<string>;
  ener: Set<string>;
  flow: Record<string, { m: string; dir: number; slow: boolean }>;
  hold: Record<string, string>;
  chk: Set<string>;
  trap: Set<string>;
  thru: Set<string>;
  pump: boolean;
}

export interface CycleCtx { doors: number; s9On: boolean; }
export type TrFn = (k: string) => string;
export type LFn = (o: any) => any;

export const SEGS: Record<string, SegEntry> = {};SG.forEach(s=>{SEGS[s.id]=s;});
export const ADJ: Record<string, string[]> = {};SG.forEach(s=>{(ADJ[s.a]=ADJ[s.a]||[]).push(s.id);(ADJ[s.b]=ADJ[s.b]||[]).push(s.id);});
export const GRPMAP: Record<string, string> = {CH:"CHAMBER",JK:"JACKET",DS1:"DS1",DS2:"DS2",HXp:"HX1",HXc:"HX1",VP:"VP1",TK:"TANK",WASTE:"WASTE",PR1:"PR1"};
export const grpOf = (id: string): string => id.split(":")[0];
export function partOf(id: string): string | null {const n=ND[id];if(!n)return id;if(n.k==="port"||n.k==="waste")return GRPMAP[grpOf(id)]||null;if(n.k==="jn"||n.k==="atm"||n.k==="end")return null;return id;}
export const KIND: Record<string, string> = {};
Object.keys(ND).forEach(id=>{if(partOf(id)===id)KIND[id]=ND[id].k;});
Object.assign(KIND,{CHAMBER:"chamber",JACKET:"jacket",DOOR:"door",DOOR2:"door",DS1:"seal",DS2:"seal",HX1:"hx",VP1:"pump",TANK:"tank",F2:"diff",WASTE:"waste",CTRL:"ctrl",STARTER:"starter",SB1:"fixed",CS1:"float",ST4:"fixed"});
export const DDP: Set<string> = new Set(["S36","PS2","S38","FC4","DS2","DOOR2"]);
export const EXTRA_NB: Record<string, string[]> = {DOOR:["DS1","CHAMBER"],DOOR2:["DS2","CHAMBER"],SB1:["S2","CHAMBER"],CS1:["CHAMBER","CTRL"],ST4:["CHAMBER","RTD1","TR1","S40","S3"],F2:["TANK","CK4","CK3","TR3"],CTRL:["RTD1","RTD3","RTD2","PT1","PS1","CS1","STARTER"],STARTER:["VP1","CTRL"],CHAMBER:["SB1","CS1","ST4"],TANK:["F2"],DS1:["DOOR"],DS2:["DOOR2"]};
export const SOLS: string[] = Object.keys(ND).filter(id=>ND[id].k==="sol"||ND[id].k==="solb");
export const SOL_ORDER: string[] = ["S1","S2","S3","S4","S7","S9","S35","S36","S37","S38","S40","S43"];

/* path node sequences */
export const PN: Record<string, string[]> = {};
Object.keys(PATH).forEach(k=>{
  const segs=PATH[k].slice(1),nodes=[];
  segs.forEach((id,i)=>{const s=SEGS[id];
    if(i===0){if(segs.length===1){nodes.push(s.a,s.b);return;}const nx=SEGS[segs[1]];const sh=[s.a,s.b].find(n=>n===nx.a||n===nx.b);nodes.push(sh===s.b?s.a:s.b,sh);}
    else{const last=nodes[nodes.length-1];nodes.push(s.a===last?s.b:s.a);}
  });
  PN[k]=nodes;
});

/* ---------- state ---------- */
export const cycOf = (ph: Phase): Set<string> => {const c=new Set(ph.int||[]);if(!ph.s9on)c.add("S9");return c;};export const cycPh = (id: string): boolean => id==="S9";export const NORING: Set<string> = new Set(["CHAMBER","JACKET","DOOR","DOOR2"]);
export const segOn = (s: SegEntry, doors: number): boolean => !(doors===1&&s.dd);
export const nodeOn = (id: string, doors: number): boolean => !(doors===1&&ND[id]&&ND[id].dd);
export const partOn = (id: string, doors: number): boolean => !(doors===1&&DDP.has(id));
export const PASSK: Set<string> = new Set(["jn","str","orf","ndl","rtdi","reg","src"]);
export function passable(id: string, open: Set<string>, doors: number): boolean {const n=ND[id];if(!n||!nodeOn(id,doors))return false;const k=n.k;if(PASSK.has(k))return true;if(k==="man")return id==="MV1"||id==="MV2";if(k==="sol"||k==="solb")return open.has(id);return false;}
export const CHMED: Record<string, string> = {flow:"steam",steam:"steam",hot:"steam",out:"steam",vac:"vac",hold:"vac"};
export const SLOWP: Set<string> = new Set(["SEAL1","SEAL2"]);
export function stateOf(ph: Phase, ctx: CycleCtx): CycleState {
  const doors = ctx.doors, s9On = ctx.s9On;
  const open=new Set(ph.open.filter(id=>nodeOn(id,doors)));const cyc=cycOf(ph);cyc.forEach(id=>{if(cycPh(id)!==s9On)open.delete(id);});
  const ener=new Set(SOLS.filter(id=>nodeOn(id,doors)).filter(id=>id==="S1"?!open.has("S1"):open.has(id)));
  const flow: CycleState["flow"]={},chk=new Set<string>(),trap=new Set<string>(),thru=new Set<string>();
  ph.paths.forEach(pn=>{
    const P=PATH[pn],m=P[0],segs=P.slice(1);
    if(segs.some(id=>!segOn(SEGS[id],doors)))return;
    const nodes=PN[pn];
    if(nodes.slice(1,-1).some(n=>{const k=ND[n].k;return (k==="sol"||k==="solb")&&nodeOn(n,doors)&&!open.has(n);}))return;
    const slow=SLOWP.has(pn)&&ph.seal!=="fill";segs.forEach((id,i)=>{const s=SEGS[id];if(!flow[id])flow[id]={m,dir:s.a===nodes[i]?1:-1,slow};});
    nodes.forEach((n,i)=>{thru.add(n);if(i>0&&i<nodes.length-1){const k=ND[n].k;if(k==="chk")chk.add(n);if(k==="trap")trap.add(n);}});
  });
  const hold: CycleState["hold"]={};
  const fill=(starts,m)=>{const seen=new Set(starts),q=starts.slice();while(q.length){const u=q.shift();(ADJ[u]||[]).forEach(sid=>{const s=SEGS[sid];if(!segOn(s,doors))return;const v=s.a===u?s.b:s.a;if(!flow[sid]&&!hold[sid])hold[sid]=m;if(!seen.has(v)&&passable(v,open,doors)){seen.add(v);q.push(v);}});}};
  fill(["SRC_S"],"steam");
  fill(["JK:s9","JK:rv","JK:s2","JK:dr"],"steam");
  if(ph.seal==="on"||ph.seal==="fill"){fill(["DS1:in","DS1:out"],"steam");if(doors===2)fill(["DS2:in","DS2:out"],"steam");}
  if(CHMED[ph.ch])fill(["CH:in","CH:dr","CH:pt"],CHMED[ph.ch]);
  fill(["SRC_W"],"water");
  if(!flow.s_rtd2)hold.s_rtd2="water";
  return {ph,open,ener,flow,hold,chk,trap,thru,pump:!!ph.pump};
}
export function medOf(id: string, St: CycleState, doors: number): string | null {const segs=ADJ[id]||[];for(const sid of segs){if(St.flow[sid]&&segOn(SEGS[sid],doors))return St.flow[sid].m;}for(const sid of segs){if(St.hold[sid])return St.hold[sid];}return null;}
export const flowsAny=(St: CycleState,ids: string[]): boolean=>ids.some(id=>St.flow[id]);
export function hxState(St: CycleState): { proc: string | null; cool: boolean } {const proc=St.flow.s_ex5||St.flow.s_hxo;return {proc:proc?proc.m:null,cool:!!St.flow.s_hxc};}
export function sealState(St: CycleState,n: number,doors: number): string {const s=St.ph.seal;if(n===2&&doors===1)return "na";return s;}
export function stateText(id: string, St: CycleState, tr: TrFn, L: LFn, doors: number): [string, boolean, string | null] {
  const k=KIND[id];const ph=St.ph;
  if(!partOn(id,doors))return [tr("ddOnly"),false,null];
  switch(k){
    case "sol":case "solb":
      if(id==="S1")return St.open.has("S1")?[tr("stS1Open"),true,medOf(id,St,doors)||"air"]:[tr("stS1Closed"),false,null];
      if(id==="S9")return ph.s9on?[tr("stS9on"),true,"steam"]:[tr("stS9"),true,"steam"];
      if(id==="S4"&&(ph.int||[]).includes("S4"))return [tr("stS4int"),true,"water"];
      if(St.open.has(id)){if(id==="S2"&&ph.key==="ster")return [tr("stS2mod"),true,"steam"];if(id==="S40"&&!St.thru.has("S40"))return [tr("stS40nf"),true,null];if((id==="S35"||id==="S36")&&ph.seal==="on")return [tr("stSealMk"),true,"steam"];if(!St.thru.has(id))return [tr("stOpenNoDP"),true,null];return [tr("stOpenE"),true,medOf(id,St,doors)];}
      return [tr("stClosed"),false,null];
    case "chk":return St.chk.has(id)?[tr("stChkOpen"),true,medOf(id,St,doors)]:[tr("stChkClosed"),false,null];
    case "trap":return St.trap.has(id)?[tr("stTrapOpen"),true,"cond"]:[tr("stTrapClosed"),false,null];
    case "man":return (id==="MV1"||id==="MV2")?[tr("stManOpen"),true,medOf(id,St,doors)]:[tr("stManClosed"),false,null];
    case "reg":return [tr("stReg"),true,"steam"];
    case "gauge":case "pt":case "psw":case "rtd":case "rtdi":case "float":return [tr("stMeasure"),true,null];
    case "safety":return [tr("stSafety"),false,null];
    case "str":case "orf":case "ndl":case "filter":return St.thru.has(id)?[tr("stPassFlow"),true,medOf(id,St,doors)]:[tr("stPass"),false,null];
    case "fixed":return id==="ST4"&&flowsAny(St,["s_dr"])?[tr("stPassFlow"),true,St.flow.s_dr.m]:[tr("stInside"),false,null];
    case "src":if(id==="SRC_S")return [tr("stSrcS"),true,"steam"];return (St.open.has("S7")||St.open.has("S4"))?[tr("stSrcWOn"),true,"water"]:[tr("stSrcW"),false,null];
    case "pump":return St.pump?[tr("stPumpOn"),true,"vac"]:[tr("stPumpOff"),false,null];
    case "starter":return St.pump?[tr("stStarterOn"),true,null]:[tr("stStarterOff"),false,null];
    case "hx":{const h=hxState(St);if(h.proc&&h.cool)return [tr("stHxBoth"),true,h.proc];if(h.proc)return [tr("stHxProc"),true,h.proc];return [tr("stHxOff"),false,null];}
    case "tank":return flowsAny(St,["s_tt","s_ch3"])?[tr("stTankOn"),true,"water"]:[tr("stTankOff"),false,null];
    case "diff":return St.flow.s_ch3?[tr("stF2On"),true,"cond"]:[tr("stF2Off"),false,null];
    case "waste":return flowsAny(St,["s_of","s_s43b","s_mvw"])?[tr("stWasteOn"),true,"water"]:[tr("stWasteOff"),false,null];
    case "chamber":return [L(STEP[ph.id].cs),true,CHMED[ph.ch]||(ph.ch==="airin"?"air":null)];
    case "jacket":return [tr("stJacket"),true,"steam"];
    case "door":return ph.lock?[tr("stDoorLock"),true,null]:[tr("stDoorFree"),false,null];
    case "seal":{const s=ph.seal;if(s==="on")return [tr("stSealOn"),true,"steam"];if(s==="fill")return [tr("stSealFill"),true,"steam"];if(s==="retract")return [tr("stSealRet"),true,"vac"];return [tr("stSealOff"),false,null];}
    case "ctrl":return ph.key==="standby"?[tr("stCtrlIdle"),false,null]:[tr("stCtrlRun"),true,null];
  }
  return [tr("stPass"),false,null];
}
export function activeParts(St: CycleState, doors: number): Set<string> {
  const a=new Set<string>();
  St.open.forEach(id=>a.add(id));St.ener.forEach(id=>a.add(id));St.chk.forEach(id=>a.add(id));St.trap.forEach(id=>a.add(id));
  St.thru.forEach(n=>{const p=partOf(n);if(p&&KIND[p]&&!["jn","port"].includes(KIND[p]))a.add(p);});
  if(St.pump)a.add("VP1");
  const h=hxState(St);if(h.proc||h.cool)a.add("HX1");
  if(St.ph.seal!=="off"){a.add("DS1");if(doors===2)a.add("DS2");}
  if(St.flow.s_ch3)a.add("F2");
  ["MV1","MV2","PR1","SRC_W","RV1","PG2","PG1","PT1","PS1","PS2","RTD1","RTD2","RTD3","ST1","ST2","ST3","FC1","FC2","FC3","FC4","F1","TR3","TR2","CK3"].forEach(id=>{if(!St.thru.has(id))a.delete(id);});
  if(St.ph.seal==="on"||St.ph.seal==="fill"){a.add("PS1");if(doors===2)a.add("PS2");}
  return a;
}
export function neighbors(part: string, doors: number): string[] {
  const starts=[];
  if(ND[part])starts.push(part);
  Object.keys(ND).forEach(id=>{if(ND[id].k==="port"||ND[id].k==="waste"){if(GRPMAP[grpOf(id)]===part&&id!==part)starts.push(id);}});
  const out=[],seen=new Set(starts),q=starts.slice();
  while(q.length){const u=q.shift();(ADJ[u]||[]).forEach(sid=>{const s=SEGS[sid];if(!segOn(s,doors))return;const v=s.a===u?s.b:s.a;if(seen.has(v))return;seen.add(v);const n=ND[v];if(n.k==="jn"){q.push(v);return;}const p=partOf(v);if(p&&p!==part&&!out.includes(p)&&partOn(p,doors))out.push(p);});}
  (EXTRA_NB[part]||[]).forEach(p=>{if(!out.includes(p)&&partOn(p,doors))out.push(p);});
  return out;
}
