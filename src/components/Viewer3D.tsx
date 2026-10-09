// src/components/Viewer3D.tsx — visor 3D (three.js r128) del AMSCO 400.
// Porte de la sección /* ---------- 3D ---------- */ del original
// (función init3D(), líneas 1264–1673 de reference/AMSCO_400_por_dentro.html).
// La escena se crea UNA sola vez; las props se sincronizan con efectos
// separados. La API imperativa (vía ref) reproduce la del original:
// { apply, relabel, flyView, flyTo, setXray, setDoors, screenX, setActive, refresh }.
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Nota: la ruta examples/js de r128 es un script no-modular (IIFE que cuelga
// THREE.OrbitControls del global, sin exports); la variante ESM examples/jsm
// exporta la misma clase OrbitControls (misma API que usaba el original).
import { ND, SG } from '../data/placard';
import { INFO, SHORT, MAJOR, NOCODE, GV } from '../data/content';
import { tr, L, useLang } from '../i18n';
import type { CycleState } from '../state/cycle';
import { partOf, KIND, NORING, DDP, ADJ, SEGS, hxState, activeParts, medOf } from '../state/cycle';

export interface Viewer3DApi {
  apply(state: CycleState): void;
  relabel(): void;
  flyView(cam: string): void;
  flyTo(x: number, y: number, z: number): void;
  setXray(b: boolean): void;
  setDoors(n: number): void;
  screenX(id: string): { x: number; y: number } | null;
  setActive(b: boolean): void;
  refresh(): void;
}

// Valores verificados en el original (botones [data-lab], línea 1860):
// labMode="none" | "all" | "active"
export type LabMode = 'none' | 'all' | 'active';

export interface Viewer3DProps {
  state: CycleState;
  doors: number;
  cam: string;
  labMode: LabMode;
  xray: boolean;
  onSelect: (id: string | null) => void;
}

type Api = {
  apply: (St: CycleState) => void;
  relabel: () => void;
  flyView: (cam: string, ms?: number) => void;
  flyToXYZ: (x: number, y: number, z: number) => void;
  setXray: (b: boolean) => void;
  setDoors: (n: number) => void;
  screenX: (id: string) => { x: number; y: number } | null;
  setActive: (a: boolean) => void;
  refresh: () => void;
};

/* ---------- construcción de la escena (corre una sola vez) ---------- */
function buildViewer(
  host: HTMLDivElement,
  labelsEl: HTMLDivElement,
  env: {
    state: React.MutableRefObject<CycleState>;
    doors: React.MutableRefObject<number>;
    labMode: React.MutableRefObject<LabMode>;
    xray: React.MutableRefObject<boolean>;
    onSelect: React.MutableRefObject<(id: string | null) => void>;
  }
): Api & { dispose: () => void } {
  const T: any = THREE;
  const stateRef = env.state, doorsRef = env.doors, labModeRef = env.labMode, xrayRef = env.xray, onSelectRef = env.onSelect;
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const cv: HTMLCanvasElement = renderer.domElement;
  cv.setAttribute('role', 'img');
  host.insertBefore(cv, host.firstChild);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(34, 1, 0.1, 200);
  const controls = new OrbitControls(camera, cv);
  controls.enableDamping = true; controls.dampingFactor = .08;
  controls.minDistance = 1.4; controls.maxDistance = 34;
  controls.maxPolarAngle = Math.PI * .6;
  scene.add(new T.HemisphereLight(0xffffff, 0x66717a, .85));
  const d1 = new T.DirectionalLight(0xffffff, .8); d1.position.set(6, 12, 9); scene.add(d1);
  const d2 = new T.DirectionalLight(0xffffff, .35); d2.position.set(-8, 5, -7); scene.add(d2);
  const css = (n: string) => (getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888888');
  const MC: any = { steam: new T.Color(), water: new T.Color(), air: new T.Color(), vac: new T.Color(), cond: new T.Color() };
  const TC: any = { pipe: new T.Color(), tag: new T.Color(), scene: new T.Color(), floor: new T.Color(), grid: new T.Color(), ink2: new T.Color() };
  function readTheme() { for (const k in MC) MC[k].set(css('--' + k)); for (const k in TC) TC[k].set(css('--' + k)); }
  readTheme(); scene.background = TC.scene.clone();
  const V = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
  const VA = (a: number[]) => new T.Vector3(a[0], a[1], a[2]);
  const std = (c: any, m: number, r: number, o?: any) => new T.MeshStandardMaterial(Object.assign({ color: c, metalness: m, roughness: r }, o || {}));
  const M: any = {
    brass: std(0xB8963E, .5, .38), bronze: std(0x9C7A3C, .45, .45), copper: std(0xB8733A, .45, .4),
    steel: std(0xB4BDC3, .45, .33), dark: std(0x2A3036, .3, .6), coil: std(0x3F7D5E, .1, .55),
    coilB: std(0x23272B, .2, .55), ptfe: std(0xEDEDE6, 0, .5), white: std(0xF5F5F0, 0, .6),
    frame: std(0x30363B, .35, .65), pump: std(0x8A949B, .3, .55), motor: std(0x6F7C86, .3, .5),
    beige: std(0xD8CCA6, 0, .75, { side: T.DoubleSide }), red: std(0xC0392B, .2, .5),
    black: std(0x1E2226, .2, .6), green: std(0x2F7D4A, 0, .7), tagW: std(0xF2F2EA, 0, .8),
    fab: std(0x9EA4A8, 0, .95), bluePack: std(0x7FA7C9, 0, .85), ss: std(0xC4CBD0, .55, .3),
    bz: std(0x9C7A3C, .45, .45), can: std(0xB9C0C5, .55, .42)
  };
  const pickA: any[] = [], pickB: any[] = []; const ddObjs: any[] = [];
  function tagPart(obj: any, id: string, list: any[]) { obj.traverse((o: any) => { if (o.isMesh) { o.userData.id = id; list.push(o); } }); }
  function markDD(obj: any) { obj.userData.dd = true; ddObjs.push(obj); }
  const cylY = (r: number, h: number, mat: any, seg?: number) => new T.Mesh(new T.CylinderGeometry(r, r, h, seg || 18), mat);
  const cylX = (r: number, h: number, mat: any, seg?: number) => { const m = cylY(r, h, mat, seg); m.rotation.z = Math.PI / 2; return m; };
  const cylZ = (r: number, h: number, mat: any, seg?: number) => { const m = cylY(r, h, mat, seg); m.rotation.x = Math.PI / 2; return m; };
  const box = (x: number, y: number, z: number, mat: any) => new T.Mesh(new T.BoxGeometry(x, y, z), mat);
  const at = (m: any, x: number, y: number, z: number) => { m.position.set(x, y, z); return m; };

  /* ---- vessel ---- */
  function rr(hw: number, y0: number, y1: number, rb: number, rt: number) { const s = new T.Shape(); s.moveTo(-hw + rb, y0); s.lineTo(hw - rb, y0); s.absarc(hw - rb, y0 + rb, rb, -Math.PI / 2, 0, false); s.lineTo(hw, y1 - rt); s.absarc(hw - rt, y1 - rt, rt, 0, Math.PI / 2, false); s.lineTo(-hw + rt, y1); s.absarc(-hw + rt, y1 - rt, rt, Math.PI / 2, Math.PI, false); s.lineTo(-hw, y0 + rb); s.absarc(-hw + rb, y0 + rb, rb, Math.PI, Math.PI * 1.5, false); return s; }
  function rrPath(hw: number, y0: number, y1: number, rb: number, rt: number) { const p = new T.Path(); p.moveTo(-hw + rb, y0); p.absarc(-hw + rb, y0 + rb, rb, -Math.PI / 2, -Math.PI, true); p.lineTo(-hw, y1 - rt); p.absarc(-hw + rt, y1 - rt, rt, Math.PI, Math.PI / 2, true); p.lineTo(hw - rt, y1); p.absarc(hw - rt, y1 - rt, rt, Math.PI / 2, 0, true); p.lineTo(hw, y0 + rb); p.absarc(hw - rb, y0 + rb, rb, 0, -Math.PI / 2, true); p.lineTo(-hw + rb, y0); return p; }
  function exX(shape: any, x0: number, x1: number, seg?: number) { const g = new T.ExtrudeGeometry(shape, { depth: x1 - x0, bevelEnabled: false, curveSegments: seg || 16 }); g.rotateY(Math.PI / 2); g.translate(x0, 0, 0); return g; }
  const CHR = [1.3, 2.2, 5.95, .28, .45], JKR = [1.45, 2.02, 6.18, .36, .56], INR = [1.54, 1.96, 6.2, .42, .62], ENR = [1.56, 1.94, 6.21, .44, .64];
  const chMat = std(0xC9D1D6, .3, .4, { transparent: true, opacity: .1, depthWrite: false, side: T.DoubleSide });
  const chamber = new T.Mesh(exX(rr(...(CHR as [number, number, number, number, number])), -2.3, 2.3), chMat); chamber.renderOrder = 2; scene.add(chamber);
  const edgeMat = new T.LineBasicMaterial({ color: TC.ink2.clone(), transparent: true, opacity: .42 });
  const chEdge = new T.LineSegments(new T.EdgesGeometry(chamber.geometry, 30), edgeMat); scene.add(chEdge);
  const fillMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .07, depthWrite: false });
  const chFill = new T.Mesh(exX(rr(1.27, 2.23, 5.92, .26, .42), -2.28, 2.28), fillMat); chFill.renderOrder = 1; scene.add(chFill); tagPart(chFill, 'CHAMBER', pickB);
  const jkMat = std(0xB3BCC2, .25, .5, { transparent: true, opacity: .16, depthWrite: false, side: T.DoubleSide });
  const jacket = new T.Mesh(exX(rr(...(JKR as [number, number, number, number, number])), -2.3, 2.3), jkMat); jacket.renderOrder = 3; scene.add(jacket); tagPart(jacket, 'JACKET', pickB);
  const jkEdge = new T.LineSegments(new T.EdgesGeometry(jacket.geometry, 30), edgeMat); scene.add(jkEdge);
  const inMat = std(0x9EA4A8, 0, .95, { transparent: true, opacity: 1 });
  const insul = new T.Mesh(exX(rr(...(INR as [number, number, number, number, number])), -2.28, 2.28, 20), inMat); scene.add(insul); tagPart(insul, 'JACKET', pickB);
  const seamMat = new T.LineBasicMaterial({ color: 0x6E767C, transparent: true, opacity: .6 });
  const seams = new T.Group(); [-1.4, -.45, .5, 1.45].forEach(x => { const pts = rr(1.545, 1.955, 6.205, .42, .62).getPoints(40).map((p: any) => V(x, p.y, p.x)); pts.push(pts[0].clone()); seams.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), seamMat)); }); scene.add(seams);
  // end rings
  function ringShape(hole: boolean) { const s = rr(...(ENR as [number, number, number, number, number])); if (hole) s.holes.push(rrPath(1.3, 2.2, 5.95, .28, .45)); return s; }
  const ringMat = std(0xBFC7CC, .45, .35, { transparent: true, opacity: 1 });
  const ringOE = new T.Mesh(exX(ringShape(true), -2.42, -2.3), ringMat); scene.add(ringOE); tagPart(ringOE, 'DOOR', pickB);
  const ringNOEo = new T.Mesh(exX(ringShape(true), 2.3, 2.42), ringMat); scene.add(ringNOEo); markDD(ringNOEo); tagPart(ringNOEo, 'DOOR2', pickB);
  const headNOE = new T.Mesh(exX(ringShape(false), 2.3, 2.42), ringMat); scene.add(headNOE); tagPart(headNOE, 'CHAMBER', pickB);
  [[-2.36, 1], [2.36, 2]].forEach(([x, n]) => { for (let i = 0; i < 10; i++) { const a = i / 10; const p = rr(1.535, 1.965, 6.185, .43, .63).getPointAt(a); const b = at(cylX(.016, .03, M.steel, 8), x + (x < 0 ? -.075 : .075), p.y, p.x); scene.add(b); if (n === 2) { b.userData.dd2 = true; } } });
  // doors
  const drMat = std(0xC5CDD2, .45, .32, { transparent: true, opacity: 1 });
  function mkDoor(x0: number, x1: number, id: string) { const g = new T.Group(); const d = new T.Mesh(exX(rr(1.5, 2.0, 6.15, .4, .58), x0, x1), drMat); g.add(d); scene.add(g); tagPart(g, id, pickB); return { g, d }; }
  const doorOE = mkDoor(-2.64, -2.43, 'DOOR');
  const doorNOE = mkDoor(2.43, 2.64, 'DOOR2'); markDD(doorNOE.g);
  const doorEdge = new T.LineSegments(new T.EdgesGeometry(doorOE.d.geometry, 30), edgeMat); scene.add(doorEdge);
  const doorEdge2 = new T.LineSegments(new T.EdgesGeometry(doorNOE.d.geometry, 30), edgeMat); scene.add(doorEdge2); markDD(doorEdge2);
  // seals
  function roundPath(pts: any[], rad: number) {
    const P = pts.map(VA); const path = new T.CurvePath(); let cp = P[0].clone();
    for (let i = 1; i < P.length - 1; i++) {
      const a = P[i].clone().sub(P[i - 1]); const la = a.length(); a.normalize();
      const b = P[i + 1].clone().sub(P[i]); const lb = b.length(); b.normalize();
      if (Math.abs(a.dot(b)) > .999) { continue; }
      const r = Math.min(rad, la / 2, lb / 2); const c = P[i].clone().addScaledVector(a, -r), d = P[i].clone().addScaledVector(b, r);
      if (cp.distanceTo(c) > 1e-4) path.add(new T.LineCurve3(cp.clone(), c)); path.add(new T.QuadraticBezierCurve3(c, P[i].clone(), d)); cp = d;
    }
    path.add(new T.LineCurve3(cp.clone(), P[P.length - 1].clone())); return path;
  }
  function sealMesh(x: number) { const pts = rr(1.37, 2.12, 6.03, .33, .5).getPoints(64).map((p: any) => V(x, p.y, p.x)); pts.push(pts[0].clone()); const c = new T.CatmullRomCurve3(pts, true); const mat = std(0x7A858D, .1, .6); const m = new T.Mesh(new T.TubeGeometry(c, 240, .045, 8, true), mat); scene.add(m); return { m, mat }; }
  const seal1 = sealMesh(-2.425); tagPart(seal1.m, 'DS1', pickA);
  const seal2 = sealMesh(2.425); tagPart(seal2.m, 'DS2', pickA); markDD(seal2.m);
  const sealLinks: any[] = [];
  function sealLink(pid: string, dd: boolean) {
    const p = ND[pid].p3; const xr = p[0] < 0 ? -2.425 : 2.425;
    const tg = p[1] > 2.3 ? [xr, p[1], p[2] < 0 ? -1.37 : 1.37] : [xr, 2.12, p[2]];
    const mid = [(p[0] + xr) / 2, (p[1] + tg[1]) / 2, (p[2] + tg[2]) / 2];
    const mat = std(0x7A858D, .1, .6);
    const m = new T.Mesh(new T.TubeGeometry(roundPath([p, mid, tg], .05), 20, .02, 6, false), mat);
    scene.add(m); if (dd) markDD(m); sealLinks.push({ m, mat, n: dd ? 2 : 1 });
  }
  sealLink('DS1:in', false); sealLink('DS1:out', false); sealLink('DS2:in', true); sealLink('DS2:out', true);
  // chamber internals: baffle, drain strainer, float switch, load rack
  const sb1 = new T.Group(); sb1.add(at(box(.42, 2.1, .025, M.steel), 0, 0, 0)); sb1.add(at(cylZ(.014, .17, M.steel, 6), 0, .95, .085)); sb1.add(at(cylZ(.014, .17, M.steel, 6), 0, -.95, .085)); sb1.position.set(2.0, 4.4, 1.1); scene.add(sb1); tagPart(sb1, 'SB1', pickA);
  const st4 = new T.Group(); st4.add(cylY(.12, .03, M.steel, 20)); st4.add(at(cylY(.07, .06, M.steel, 12), 0, -.04, 0)); st4.position.set(-1.6, 2.235, .3); scene.add(st4); tagPart(st4, 'ST4', pickA);
  const cs1 = new T.Group(); cs1.add(at(cylY(.05, .2, M.steel), 0, .1, 0)); cs1.add(at(new T.Mesh(new T.SphereGeometry(.06, 14, 10), M.white), 0, .12, 0)); cs1.add(at(box(.14, .03, .14, M.steel), 0, .015, 0)); cs1.position.set(-2.0, 2.22, .85); scene.add(cs1); tagPart(cs1, 'CS1', pickA);
  const rack = new T.Group(); [3.0, 4.25].forEach(y => { rack.add(at(box(3.6, .025, 2.0, M.steel), 0, y, 0)); }); [-1.75, 1.75].forEach(x => [-.95, .95].forEach(z => rack.add(at(cylY(.02, 2.2, M.steel, 6), x, 3.65, z))));
  [[-1.1, 3.17, -.45], [0, 3.17, .35], [1.05, 3.17, -.3], [-.6, 4.42, .3], [.75, 4.42, -.35]].forEach(([x, y, z]) => rack.add(at(box(.75, .3, .6, M.bluePack), x, y, z)));
  rack.position.set(0, 0, 0); scene.add(rack);
  // frame
  [[-2.35, -1.38], [-2.35, 1.38], [2.35, -1.38], [2.35, 1.38]].forEach(([x, z]) => { scene.add(at(box(.08, 1.92, .08, M.frame), x, .96, z)); scene.add(at(box(.16, .02, .16, M.frame), x, .01, z)); });
  [-1.38, 1.38].forEach(z => { scene.add(at(box(4.78, .08, .08, M.frame), 0, 1.9, z)); scene.add(at(box(4.78, .06, .06, M.frame), 0, .12, z)); });
  [-2.2, 2.2].forEach(x => scene.add(at(box(.08, .08, 2.84, M.frame), x, 1.9, 0)));
  // floor
  const floorMat = new T.MeshStandardMaterial({ color: TC.floor.clone(), roughness: 1, metalness: 0 });
  const floor = new T.Mesh(new T.PlaneGeometry(24, 18), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.set(.6, 0, -.4); scene.add(floor);
  let grid: any = null;
  function rebuildGrid() { if (grid) { scene.remove(grid); grid.geometry.dispose(); grid.material.dispose(); } grid = new T.GridHelper(24, 48, TC.grid.getHex(), TC.grid.getHex()); grid.position.set(.6, .003, -.4); scene.add(grid); }
  rebuildGrid();

  /* ---- pipes ---- */
  const uTime = { value: 0 };
  const VS = 'varying vec2 vUv;varying vec3 vN;varying vec3 vP;void main(){vUv=uv;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vP=mv.xyz;gl_Position=projectionMatrix*mv;}';
  const FS = 'uniform vec3 uBase;uniform vec3 uFlow;uniform float uMode;uniform float uDir;uniform float uTime;uniform float uLen;uniform float uSpeed;uniform float uHoldMix;varying vec2 vUv;varying vec3 vN;varying vec3 vP;void main(){vec3 n=normalize(vN);vec3 v=normalize(-vP);vec3 l=normalize(vec3(0.35,0.8,0.5));float dif=max(dot(n,l),0.0);float sp=pow(max(dot(reflect(-l,n),v),0.0),28.0)*0.28;float rim=pow(1.0-max(dot(n,v),0.0),2.0);vec3 c=uBase;float on=0.0;if(uMode>1.5){float sh=0.07*sin(vUv.x*uLen*7.0)*sin(uTime*1.6*uSpeed+vUv.y*6.2832);c=mix(uBase,uFlow,uHoldMix)*(1.0+sh);on=0.45*uHoldMix;}else if(uMode>0.5){float s=fract(vUv.x*uLen*2.0-uTime*uSpeed*uDir);float dash=smoothstep(0.0,0.08,s)*(1.0-smoothstep(0.46,0.56,s));c=mix(uFlow*0.6,min(uFlow*1.2+0.1,vec3(1.0)),dash);on=1.0;}vec3 col=c*(0.5+0.6*dif)+sp+on*uFlow*rim*0.3;gl_FragColor=vec4(col,1.0);}';
  const RAD: Record<string, number> = { L: .06, M: .048, S: .038, T: .024 };
  const MATC: Record<string, any> = { cu: new T.Color(0xB8733A), br: new T.Color(0xB8963E), pt: new T.Color(0xE9E9E2), ss: new T.Color(0xAEB8BF) };
  const pipes: Record<string, any> = {};
  const poly3 = (s: any) => [ND[s.a].p3].concat(s.v3, [ND[s.b].p3]);
  function baseFor(mat: string) { return MATC[mat].clone().lerp(TC.pipe, mat === 'pt' ? .3 : .62); }
  SG.forEach(s => {
    const pts = poly3(s); const r = (s as any).stub ? .017 : RAD[s.size];
    const path = roundPath(pts, s.size === 'T' ? .07 : .12); const len = path.getLength();
    const geo = new T.TubeGeometry(path, Math.max(8, Math.ceil(len * 26)), r, s.size === 'L' || s.size === 'M' ? 10 : 8, false);
    const mat = new T.ShaderMaterial({ uniforms: { uBase: { value: baseFor(s.mat) }, uFlow: { value: new T.Color() }, uMode: { value: 0 }, uDir: { value: 1 }, uTime: uTime, uLen: { value: len }, uSpeed: { value: reduce ? 0 : 1.15 }, uHoldMix: { value: (s as any).stub ? .5 : .84 } }, vertexShader: VS, fragmentShader: FS });
    const m = new T.Mesh(geo, mat); scene.add(m); if ((s as any).dd) markDD(m);
    pipes[s.id] = { m, mat, s };
  });
  // fittings at junctions (tee, cross) and ports
  function orientY(mesh: any, d: any) { const q = new T.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); mesh.quaternion.premultiply(q); }
  function dirAt(id: string): any {
    let inc: any = null, out: any = null;
    (ADJ[id] || []).forEach(sid => {
      const s = SEGS[sid]; const P = poly3(s);
      if (s.b === id && !inc) { const a = P[P.length - 2], b = P[P.length - 1]; inc = V(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); }
      if (s.a === id && !out) { const a = P[0], b = P[1]; out = V(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); }
    });
    return inc || out || V(1, 0, 0);
  }
  function sizeAt(id: string) { const segs = (ADJ[id] || []).map(x => SEGS[x]); const o: Record<string, number> = { L: 1.25, M: 1, S: .85, T: .72 }; return Math.max(.72, ...segs.map(s => o[s.size])); }
  function fitting(id: string) {
    const n = ND[id]; const segs = (ADJ[id] || []).map(x => SEGS[x]); const r = Math.max(...segs.map(s => RAD[s.size]));
    const mat = n.fit === 'ss' ? M.ss : (segs.every(s => s.mat === 'cu') ? M.copper : M.brass); const g = new T.Group();
    g.add(new T.Mesh(new T.SphereGeometry(r * 1.36, 14, 10), mat));
    (ADJ[id] || []).forEach(sid => {
      const s = SEGS[sid]; const P = poly3(s); let a: any, b: any;
      if (s.a === id) { a = P[0]; b = P[1]; } else { a = P[P.length - 1]; b = P[P.length - 2]; }
      const d = V(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); const rr0 = RAD[s.size];
      const c = cylY(Math.max(rr0, r * .8) * 1.3, .08, mat, 14); orientY(c, d); c.position.copy(d.clone().multiplyScalar(.05)); g.add(c);
      if (n.fit === 'ss') { const h = cylY(Math.max(rr0, r * .8) * 1.45, .025, mat, 6); orientY(h, d); h.position.copy(d.clone().multiplyScalar(.1)); g.add(h); }
    });
    return g;
  }
  Object.keys(ND).forEach(id => {
    const n = ND[id]; if (n.k !== 'jn' && n.k !== 'port' && n.k !== 'waste' && n.k !== 'atm' && n.k !== 'end') return;
    const segs = (ADJ[id] || []).map(x => SEGS[x]); if (!segs.length) return; const r = Math.max(...segs.map(s => RAD[s.size]));
    let m: any = null;
    if (n.k === 'jn') { m = fitting(id); }
    else if (n.k === 'port' && /^(JK|CH):/.test(id)) { m = new T.Group(); const d = dirAt(id); const f = cylY(r * 1.9, .035, M.steel, 16); orientY(f, d); m.add(f); }
    else if (n.k === 'waste' || n.k === 'end') { m = new T.Group(); const d = dirAt(id); const f = new T.Mesh(new T.TorusGeometry(r * 1.05, r * .3, 6, 16), M.copper); f.rotation.x = Math.PI / 2; orientY(f, d); m.add(f); }
    else if (n.k === 'atm') { m = new T.Group(); const c = new T.Mesh(new T.ConeGeometry(r * 1.9, .08, 14, 1, true), M.steel); const d = dirAt(id); orientY(c, d.clone().negate()); m.add(c); }
    if (!m) return; m.position.copy(VA(n.p3)); scene.add(m); if (n.dd) markDD(m);
  });

  /* ---- components ---- */
  const UPO: Record<string, number[]> = { S37: [0, 0, 1], S38: [0, 0, 1], S4: [0, 0, -1], MV2: [0, 0, -1] };
  const comps: Record<string, any> = {};
  const ledOff = new T.Color(0x2B2D30), ledOn = new T.Color(0xFF3B30);
  function framed(id: string, Uw?: any) {
    const A = dirAt(id);
    let U = Uw ? Uw.clone() : UPO[id] ? VA(UPO[id]) : (Math.abs(A.y) > .9 ? V(0, 0, 1) : V(0, 1, 0));
    const Z = new T.Vector3().crossVectors(A, U).normalize(); U = new T.Vector3().crossVectors(Z, A).normalize();
    const g = new T.Group(); const mtx = new T.Matrix4().makeBasis(A, U, Z);
    g.quaternion.setFromRotationMatrix(mtx); g.position.copy(VA(ND[id].p3)); return { g, A, U };
  }
  const flowRingTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!; x.strokeStyle = '#ffffff'; x.lineWidth = 9; x.beginPath(); x.arc(64, 64, 52, 0, Math.PI * 2); x.stroke(); return new T.CanvasTexture(c); })();
  function ringX(g: any, r: number) { const m = new T.Sprite(new T.SpriteMaterial({ map: flowRingTex, color: 0xffffff, transparent: true, depthWrite: false })); m.userData.base = r * 2.3; m.scale.setScalar(m.userData.base); m.renderOrder = 7; m.visible = false; g.add(m); return m; }
  function bSol(id: string, big: boolean) {
    const { g, U } = framed(id); const s = (big ? 1.32 : 1) * Math.min(1.1, sizeAt(id));
    g.add(box(.2 * s, .15 * s, .17 * s, M.brass)); g.add(cylX(.062 * s, .34 * s, M.brass));
    if (big) { g.add(at(cylY(.1 * s, .035 * s, M.brass, 20), 0, .09 * s, 0)); [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => g.add(at(cylY(.014 * s, .03 * s, M.steel, 6), a * .07 * s, .115 * s, b * .07 * s))); }
    g.add(at(cylY(.035 * s, .12 * s, M.steel), 0, .13 * s, 0));
    const coil = at(cylY(.085 * s, .17 * s, id === 'S3' ? M.coilB : M.coil), 0, .27 * s, 0); g.add(coil); g.add(at(cylY(.03 * s, .045 * s, M.dark), 0, .38 * s, 0));
    g.add(at(box(.09 * s, .1 * s, .075 * s, M.dark), 0, .27 * s, .115 * s));
    const ledM = new T.MeshBasicMaterial({ color: ledOff.clone() }); const led = at(new T.Mesh(new T.SphereGeometry(.022 * s, 10, 8), ledM), 0, .3 * s, .157 * s); g.add(led);
    const ring = ringX(g, .2 * s); return { g, ring, ledM, top: U.clone().multiplyScalar(.45 * s) };
  }
  function bMan(id: string) {
    const { g, U } = framed(id); const s = sizeAt(id); g.add(new T.Mesh(new T.SphereGeometry(.085 * s, 16, 12), M.brass)); g.add(cylX(.058 * s, .3 * s, M.brass)); g.add(at(cylY(.02 * s, .1 * s, M.steel), 0, .1 * s, 0));
    const open = id === 'MV1' || id === 'MV2'; const lm = (id === 'MV3' || id === 'MV4') ? M.red : M.black;
    g.add(open ? at(box(.3 * s, .024 * s, .045 * s, lm), .12 * s, .155 * s, 0) : at(box(.045 * s, .024 * s, .3 * s, lm), 0, .155 * s, .12 * s)); return { g, top: U.clone().multiplyScalar(.25) };
  }
  function bReg(id: string) {
    const { g } = framed(id, V(0, 1, 0)); g.add(cylX(.072, .34, M.bz)); [-.15, .15].forEach(x => g.add(at(cylX(.084, .045, M.bz, 6), x, 0, 0))); g.add(new T.Mesh(new T.SphereGeometry(.098, 18, 12), M.bz));
    g.add(at(box(.15, .12, .15, M.bz), 0, .1, 0)); g.add(at(cylY(.168, .025, M.can, 30), 0, .172, 0)); g.add(at(cylY(.162, .42, M.can, 30), 0, .39, 0)); g.add(at(cylY(.045, .035, M.brass, 6), 0, .618, 0));
    return { g, top: V(0, .78, 0) };
  }
  function bChk(id: string) { const { g } = framed(id); const s = sizeAt(id); g.add(cylX(.06 * s, .26 * s, M.brass)); g.add(cylX(.082 * s, .09 * s, M.brass, 6)); const c = new T.Mesh(new T.ConeGeometry(.032 * s, .08 * s, 10), M.dark); c.rotation.z = -Math.PI / 2; c.position.set(.02 * s, .1 * s, 0); g.add(c); g.add(at(box(.07 * s, .012 * s, .012 * s, M.dark), -.04 * s, .1 * s, 0)); const ring = ringX(g, .15 * s); return { g, ring, top: V(0, .24, 0) }; }
  function bTrap(id: string) {
    if (ND[id].td) {
      const g = new T.Group(); g.position.copy(VA(ND[id].p3)); g.add(box(.13, .12, .12, M.ss)); g.add(at(cylY(.05, .04, M.ss, 6), 0, .08, 0)); g.add(at(cylX(.03, .07, M.ss), .09, 0, 0));
      const cap = cylZ(.072, .05, M.ss, 26); cap.position.z = -.085; g.add(cap);
      const dome = new T.Mesh(new T.SphereGeometry(.07, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.ss); dome.scale.set(1, .3, 1); dome.rotation.x = -Math.PI / 2; dome.position.z = -.11; g.add(dome);
      const ring = ringX(g, .15); return { g, ring, top: V(0, .24, 0) };
    }
    const { g } = framed(id); const s = sizeAt(id); g.add(cylX(.055 * s, .28 * s, M.brass)); g.add(at(cylY(.11 * s, .15 * s, M.brass, 22), 0, .02 * s, 0)); g.add(at(cylY(.075 * s, .05 * s, M.brass, 6), 0, .12 * s, 0)); const ring = ringX(g, .2 * s); return { g, ring, top: V(0, .3, 0) };
  }
  function bStr(id: string) { const lg = ND[id].leg; const { g } = lg ? framed(id, VA(lg).negate()) : framed(id); const s = sizeAt(id); g.add(cylX(.058 * s, .28 * s, M.brass)); g.add(cylX(.07 * s, .13 * s, M.brass)); const leg = cylY(.045 * s, .18 * s, M.brass); leg.rotation.z = Math.PI / 4; leg.position.set(.05 * s, -.06 * s, 0); g.add(leg); const cap = at(cylY(.05 * s, .03 * s, M.brass, 6), .115 * s, -.125 * s, 0); cap.rotation.z = Math.PI / 4; g.add(cap); return { g, top: V(0, .25, 0) }; }
  function bOrf(id: string) { const { g } = framed(id); const s = sizeAt(id); g.add(cylX(.048 * s, .13 * s, M.brass, 6)); [-.045, .045].forEach(x => { const t = new T.Mesh(new T.TorusGeometry(.05 * s, .01 * s, 6, 16), M.brass); t.rotation.y = Math.PI / 2; t.position.x = x * s; g.add(t); }); return { g, top: V(0, .2, 0) }; }
  function bNdl(id: string) { const { g } = framed(id); g.add(cylX(.045, .16, M.brass)); g.add(at(cylY(.028, .1, M.brass), 0, .07, 0)); const w = new T.Mesh(new T.TorusGeometry(.05, .01, 6, 18), M.red); w.rotation.x = Math.PI / 2; w.position.y = .14; g.add(w); return { g, top: V(0, .25, 0) }; }
  function bFilter(id: string) {
    const { g } = framed(id); g.add(cylX(.13, .32, M.white, 24)); [-.165, .165].forEach(x => g.add(at(cylX(.11, .02, M.white, 24), x, 0, 0)));
    const tg = new T.Group(); tg.add(at(box(.004, .16, .1, M.green), 0, 0, 0)); tg.add(at(box(.006, .11, .07, M.tagW), 0, .01, 0)); tg.position.set(0, -.22, .05); g.add(tg); return { g, top: V(0, .3, 0) };
  }
  function dialTex(label: string) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d')!;
    x.fillStyle = '#141618'; x.beginPath(); x.arc(128, 128, 126, 0, Math.PI * 2); x.fill();
    const ang = (d: number) => (d - 90) * Math.PI / 180; x.strokeStyle = '#F2F2EE'; x.fillStyle = '#F2F2EE';
    const tick = (d: number, r0: number, w: number) => { const a = ang(d); x.lineWidth = w; x.beginPath(); x.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0); x.lineTo(128 + Math.cos(a) * 114, 128 + Math.sin(a) * 114); x.stroke(); };
    for (let p = 0; p <= 100; p += 2) tick(-90 + 2.25 * p, p % 20 === 0 ? 92 : p % 10 === 0 ? 99 : 105, p % 20 === 0 ? 3.2 : 1.5);
    for (let v = 5; v <= 30; v += 5) tick(-90 - 2 * v, v % 10 === 0 ? 96 : 104, v % 10 === 0 ? 2.6 : 1.4);
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '600 20px Arial'; [0, 20, 40, 60, 80, 100].forEach(p => { const a = ang(-90 + 2.25 * p); x.fillText(String(p), 128 + Math.cos(a) * 73, 128 + Math.sin(a) * 73); });
    x.font = '700 22px Arial'; x.fillText(label, 128, 95); x.font = '600 10px Arial'; x.fillText('INTERNAL SYPHON GAUGE', 128, 160); x.font = '700 15px Arial'; x.fillText('STERIS', 140, 214); x.font = '600 13px Arial'; x.fillText('Psi', 204, 196); x.font = '600 11px Arial'; x.fillText('in Hg', 70, 196); x.fillText('VAC', 70, 208);
    return new T.CanvasTexture(c);
  }
  const gaugeOf: Record<string, any> = {};
  function bGauge(id: string) {
    const n = ND[id]; const A = dirAt(id); const g = new T.Group(); g.position.copy(VA(n.p3));
    const nrm = n.face ? VA(n.face).normalize() : V(0, 0, 1); const par = Math.abs(A.dot(nrm)) > .9; const c = par ? nrm.clone().multiplyScalar(.03) : A.clone().multiplyScalar(.13);
    const head = new T.Group(); head.position.copy(c); head.quaternion.setFromUnitVectors(V(0, 0, 1), nrm); g.add(head);
    head.add(cylZ(.12, .05, M.dark, 30)); const bez = new T.Mesh(new T.TorusGeometry(.115, .01, 8, 40), M.steel); bez.position.z = .026; head.add(bez);
    const face = new T.Mesh(new T.CircleGeometry(.108, 40), new T.MeshBasicMaterial({ map: dialTex(n.dial || '') })); face.position.z = .027; head.add(face);
    const ng = new T.BoxGeometry(.009, .095, .003); ng.translate(0, .035, 0); const needle = new T.Mesh(ng, new T.MeshBasicMaterial({ color: 0xF4F4F0 })); needle.position.z = .031; head.add(needle);
    head.add(at(new T.Mesh(new T.CircleGeometry(.012, 16), new T.MeshBasicMaterial({ color: 0xB08850 })), 0, 0, .033));
    if (!par) { const st = cylY(.022, .12, M.brass, 10); orientY(st, A); st.position.copy(A.clone().multiplyScalar(.05)); g.add(st); } else { const st = cylY(.022, .05, M.brass, 10); orientY(st, nrm); st.position.copy(nrm.clone().multiplyScalar(.0)); g.add(st); }
    gaugeOf[id] = { needle, cur: -90, tgt: -90 }; return { g, top: V(0, .3, 0) };
  }
  function bPT(id: string) { const n = ND[id]; const A = dirAt(id); const g = new T.Group(); g.position.copy(VA(n.p3)); const b = cylY(.045, .17, M.steel); orientY(b, A); b.position.copy(A.clone().multiplyScalar(.08)); g.add(b); const k = at(cylY(.012, .25, M.dark, 6), 0, 0, 0); k.position.copy(A.clone().multiplyScalar(.18)).add(V(0, .12, 0)); g.add(k); return { g, top: V(0, .25, 0) }; }
  function bPS(id: string) { const n = ND[id]; const A = dirAt(id); const g = new T.Group(); g.position.copy(VA(n.p3)); const b = box(.13, .12, .12, M.pump); b.position.copy(A.clone().multiplyScalar(.06)); g.add(b); const c = box(.07, .08, .06, M.dark); c.position.copy(A.clone().multiplyScalar(.15)); g.add(c); return { g, top: V(0, .28, 0) }; }
  function bRtd(id: string) { const n = ND[id]; const A = dirAt(id); const g = new T.Group(); g.position.copy(VA(n.p3)); const h = cylY(.045, .06, M.steel, 6); orientY(h, A); h.position.copy(A.clone().multiplyScalar(.02)); g.add(h); const c = cylY(.02, .14, M.dark, 8); orientY(c, A); c.position.copy(A.clone().multiplyScalar(.12)); g.add(c); return { g, top: V(0, .2, 0) }; }
  function bRtdi(id: string) { const { g } = framed(id); g.add(box(.12, .12, .12, M.brass)); g.add(cylX(.05, .26, M.brass)); const p = cylZ(.03, .12, M.steel); p.position.z = .1; g.add(p); const h = cylZ(.045, .05, M.steel, 6); h.position.z = .18; g.add(h); const c = cylZ(.02, .12, M.dark, 8); c.position.z = .26; g.add(c); return { g, top: V(0, .25, 0) }; }
  function bSafety(id: string) {
    const g = new T.Group(); g.position.copy(VA(ND[id].p3)); g.add(at(cylY(.085, .2, M.brass), 0, .06, 0)); g.add(at(cylY(.062, .3, M.brass), 0, .31, 0)); g.add(at(cylY(.042, .08, M.brass), 0, .5, 0)); const lv = at(box(.02, .26, .02, M.steel), .08, .4, 0); lv.rotation.z = .22; g.add(lv); g.add(at(cylZ(.065, .16, M.brass), 0, 0, .1));
    const tg = at(box(.004, .14, .09, std(0xF2C300, 0, .7)), .1, .2, 0); g.add(tg); return { g, top: V(0, .72, 0) };
  }
  function bSrc(id: string) {
    const g = new T.Group(); g.position.copy(VA(ND[id].p3));
    if (id === 'SRC_S') { g.add(cylY(.11, .04, M.steel, 20)); g.add(at(cylY(.13, 1.0, M.white, 20), 0, .52, 0)); const f = at(new T.Mesh(new T.CylinderGeometry(.13, .13, .7, 20, 1, true), new T.MeshBasicMaterial({ color: 0xF5F5F0, transparent: true, opacity: .35, depthWrite: false })), 0, 1.37, 0); g.add(f); }
    else { g.add(cylY(.08, .04, M.steel, 20)); g.add(at(cylY(.05, .9, M.copper), 0, .47, 0)); const f = at(new T.Mesh(new T.CylinderGeometry(.05, .05, .7, 14, 1, true), new T.MeshBasicMaterial({ color: 0xB8733A, transparent: true, opacity: .35, depthWrite: false })), 0, 1.27, 0); g.add(f); }
    return { g, top: V(0, 1.9, 0) };
  }
  Object.keys(ND).forEach(id => {
    if (partOf(id) !== id) return; const k = ND[id].k; let c: any = null;
    switch (k) { case 'sol': c = bSol(id, false); break; case 'solb': c = bSol(id, true); break; case 'man': c = bMan(id); break; case 'reg': c = bReg(id); break; case 'chk': c = bChk(id); break; case 'trap': c = bTrap(id); break; case 'str': c = bStr(id); break; case 'orf': c = bOrf(id); break; case 'ndl': c = bNdl(id); break; case 'filter': c = bFilter(id); break; case 'gauge': c = bGauge(id); break; case 'pt': c = bPT(id); break; case 'psw': c = bPS(id); break; case 'rtd': c = bRtd(id); break; case 'rtdi': c = bRtdi(id); break; case 'safety': c = bSafety(id); break; case 'src': c = bSrc(id); break; }
    if (!c) return; scene.add(c.g); tagPart(c.g, id, pickA); if (ND[id].dd) markDD(c.g); comps[id] = Object.assign({ k }, c);
  });

  /* ---- heat exchanger HX1 ---- */
  const hx = new T.Group(); const plates: any[] = [];
  for (let i = 0; i < 14; i++) { const mat = std(0xB9AE9A, .45, .4); const p = at(box(.036, .32, .48, mat), 1.17 + i * (.66 / 13), 1.33, .3); hx.add(p); plates.push(p); }
  [1.135, 1.865].forEach(x => hx.add(at(box(.03, .36, .52, M.steel), x, 1.33, .3)));
  [[1.18, .07], [1.48, .07], [1.18, .53], [1.48, .53]].forEach(([y, z]) => hx.add(at(cylX(.012, .8, M.steel, 8), 1.5, y, z)));
  scene.add(hx); tagPart(hx, 'HX1', pickA);
  /* ---- vacuum pump VP1 ---- */
  const vp = new T.Group();
  const caseMat = std(0x8A949B, .3, .5, { transparent: true, opacity: 1 });
  const casing = at(cylX(.29, .4, caseMat, 32), 2.05, .75, .3); vp.add(casing); vp.add(at(cylY(.055, .06, M.pump), 2.05, 1.05, .3)); vp.add(at(cylZ(.055, .06, M.pump), 2.05, .75, .0)); vp.add(at(cylZ(.04, .06, M.pump), 2.15, .75, .6)); { const n = at(cylY(.035, .08, M.pump), 2.05, .54, .48); n.rotation.x = .6; vp.add(n); }
  const coverMat = std(0xBFD3DD, 0, .3, { transparent: true, opacity: .22, depthWrite: false }); const cover = at(cylX(.3, .012, coverMat, 32), 2.26, .75, .3); vp.add(cover);
  const motor = at(cylX(.24, .9, M.motor, 32), 1.4, .75, .3); vp.add(motor);
  for (let i = 0; i < 7; i++) { const t = new T.Mesh(new T.TorusGeometry(.242, .012, 6, 30), M.motor); t.rotation.y = Math.PI / 2; t.position.set(1.02 + i * .12, .75, .3); vp.add(t); }
  const fan = new T.Mesh(new T.SphereGeometry(.24, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.motor); fan.rotation.z = Math.PI / 2; fan.position.set(.95, .75, .3); vp.add(fan);
  vp.add(at(box(.18, .12, .08, M.motor), 1.4, .75, .02));
  [[1.1, .07], [1.1, .53], [1.95, .07], [1.95, .53]].forEach(([x, z]) => vp.add(at(box(.1, .1, .06, M.frame), x, .43, z)));
  const ringW = new T.Mesh(new T.TorusGeometry(.19, .06, 10, 30), new T.MeshStandardMaterial({ color: 0x3E8ED0, transparent: true, opacity: .45, roughness: .2 })); ringW.rotation.y = Math.PI / 2; ringW.position.set(2.2, .72, .3); vp.add(ringW);
  const imp = new T.Group(); imp.position.set(2.2, .79, .3); const bladeMat = std(0x6E7880, .3, .5); imp.add(cylX(.06, .06, M.dark)); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const b = box(.05, .17, .03, bladeMat); b.position.set(0, Math.cos(a) * .11, Math.sin(a) * .11); b.rotation.x = -a; imp.add(b); } vp.add(imp);
  const vpRing = new T.Sprite(new T.SpriteMaterial({ map: flowRingTex, color: 0xffffff, transparent: true, depthWrite: false })); vpRing.userData.base = .95; vpRing.scale.setScalar(.95); vpRing.renderOrder = 7; vpRing.position.set(2.05, .75, .3); vpRing.visible = false; vp.add(vpRing);
  scene.add(vp); tagPart(vp, 'VP1', pickA);
  scene.add(at(box(1.4, .07, .7, M.frame), 1.6, .365, .3)); [[.95, -.02], [.95, .62], [2.25, -.02], [2.25, .62]].forEach(([x, z]) => scene.add(at(cylY(.03, .33, M.dark, 8), x, .165, z)));
  /* ---- drain tank ---- */
  const tk = new T.Group();
  const tkMat = std(0xB4BDC3, .4, .35, { transparent: true, opacity: 1, side: T.DoubleSide });
  const tkWall = new T.Mesh(new T.CylinderGeometry(.24, .24, .85, 30, 1, true), tkMat); tkWall.position.set(3.05, .775, -.55); tk.add(tkWall);
  tk.add(at(cylY(.245, .02, M.steel, 30), 3.05, 1.2, -.55)); tk.add(at(cylY(.24, .02, M.steel, 30), 3.05, .35, -.55));
  const water = at(new T.Mesh(new T.CylinderGeometry(.225, .225, .73, 30), new T.MeshStandardMaterial({ color: 0x2C6FB8, transparent: true, opacity: .35, depthWrite: false, roughness: .2 })), 3.05, .725, -.55); tk.add(water);
  tk.add(at(box(.012, .5, .4, M.steel), 3.15, .95, -.55));
  const f2 = new T.Group(); f2.add(at(cylX(.03, .36, M.steel, 12), 3.0, .45, -.55)); for (let i = 0; i < 6; i++) f2.add(at(cylY(.008, .012, M.dark, 6), 2.88 + i * .05, .48, -.55)); tk.add(f2);
  [[2.88, -.7], [3.22, -.7], [3.05, -.32]].forEach(([x, z]) => tk.add(at(cylY(.015, .35, M.steel, 6), x, .175, z)));
  scene.add(tk); tagPart(tk, 'TANK', pickA); tagPart(f2, 'F2', pickA);
  /* ---- waste funnel and floor drain ---- */
  const wf = new T.Group();
  const fun = new T.Mesh(new T.CylinderGeometry(.27, .075, .26, 30, 1, true), M.beige); fun.position.set(3.62, .23, -.55); wf.add(fun);
  const rim = new T.Mesh(new T.TorusGeometry(.27, .014, 6, 30), M.beige); rim.rotation.x = Math.PI / 2; rim.position.set(3.62, .36, -.55); wf.add(rim);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + .4; const w = box(.07, .07, .01, M.dark); w.position.set(3.62 + Math.sin(a) * .2, .27, -.55 + Math.cos(a) * .2); w.rotation.y = a; w.rotation.x = -.5 * Math.cos(0); wf.add(w); }
  wf.add(at(cylY(.075, .1, M.dark), 3.62, .05, -.55));
  wf.add(at(new T.Mesh(new T.CircleGeometry(.4, 28), std(0x1D2328, 0, 1)), 3.62, .004, -.55)); wf.children[wf.children.length - 1].rotation.x = -Math.PI / 2;
  for (let i = -2; i <= 2; i++) wf.add(at(box(.7, .012, .025, M.steel), 3.62, .01, -.55 + i * .12));
  scene.add(wf); tagPart(wf, 'WASTE', pickA);
  /* ---- control and starter ---- */
  const ctrl = new T.Group(); ctrl.add(at(box(.4, 2.2, .5, M.steel), 1.75, 3.1, -2.2)); [[3.9, 0xF08C00], [3.65, 0xF2C300], [3.4, 0xF08C00]].forEach(([y, c]) => { const p = at(new T.Mesh(new T.PlaneGeometry(.28, .15), new T.MeshBasicMaterial({ color: c })), 1.75, y, -2.452); p.rotation.y = Math.PI; ctrl.add(p); });
  scene.add(ctrl); tagPart(ctrl, 'CTRL', pickA);
  const starter = new T.Group(); starter.add(at(box(.5, .8, .4, std(0xE4DDC8, 0, .7)), 1.0, 2.6, -2.2)); const lampM = new T.MeshBasicMaterial({ color: 0x4A4A4A }); const lamp = at(new T.Mesh(new T.SphereGeometry(.035, 12, 8), lampM), 1.0, 2.85, -2.41); starter.add(lamp); scene.add(starter); tagPart(starter, 'STARTER', pickA);

  /* ---- particles ---- */
  const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!; const gr = x.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.beginPath(); x.arc(32, 32, 30, 0, Math.PI * 2); x.fill(); return new T.CanvasTexture(c); })();
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  function insideRR(z: number, y: number, hw: number, y0: number, y1: number, rb: number, rt: number) {
    const az = Math.abs(z); if (az > hw || y < y0 || y > y1) return false;
    if (y < y0 + rb && az > hw - rb) { const dz = az - (hw - rb), dy = y - (y0 + rb); return dz * dz + dy * dy <= rb * rb; }
    if (y > y1 - rt && az > hw - rt) { const dz = az - (hw - rt), dy = y - (y1 - rt); return dz * dz + dy * dy <= rt * rt; }
    return true;
  }
  const CB = { x0: -2.22, x1: 2.22, hw: 1.22, y0: 2.27, y1: 5.88 };
  const inCh = (y: number, z: number) => insideRR(z, y, CB.hw, CB.y0, CB.y1, .24, .4);
  const IN = V(2.0, 4.4, 1.02), DR = V(-1.6, 2.3, .3);
  function mkPts(n: number, size: number) { const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3), life = new Float32Array(n), kind = new Uint8Array(n); const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); const mat = new T.PointsMaterial({ size, map: dotTex, transparent: true, depthWrite: false, opacity: .8, sizeAttenuation: true }); const p = new T.Points(g, mat); p.frustumCulled = false; p.renderOrder = 5; scene.add(p); return { pos, vel, life, kind, g, mat, p, n }; }
  const PA = mkPts(380, .085), PB = mkPts(70, .09);
  let pMode = '', nA = 0, nB = 0;
  const PCFG: Record<string, any[]> = { air: [110, 'air', .07, 0], flow: [260, 'steam', .085, 25], vac: [110, 'vac', .075, 0], steam: [300, 'steam', .085, 45], hot: [360, 'steam', .095, 0], out: [260, 'steam', .085, 0], airin: [220, 'air', .08, 0], hold: [60, 'vac', .07, 0] };
  function seedIn(P: any, i: number, spread: number) { const j = i * 3; P.pos[j] = IN.x + rnd(-.3, .3) * spread; P.pos[j + 1] = IN.y - rnd(0, .15); P.pos[j + 2] = IN.z + rnd(-.3, .3) * spread; const a = Math.random() * Math.PI * 2, s = rnd(.6, 1.6); P.vel[j] = Math.cos(a) * s * 1.4; P.vel[j + 1] = rnd(-.9, .5); P.vel[j + 2] = -rnd(.3, 1.3); P.life[i] = rnd(2, 4.5); }
  function seedAny(P: any, i: number) { const j = i * 3; let y: number, z: number, n = 0; do { y = rnd(CB.y0, CB.y1); z = rnd(-CB.hw, CB.hw); n++; } while (n < 40 && !inCh(y, z)); P.pos[j] = rnd(CB.x0, CB.x1); P.pos[j + 1] = y; P.pos[j + 2] = z; P.vel[j] = rnd(-.15, .15); P.vel[j + 1] = rnd(-.15, .15); P.vel[j + 2] = rnd(-.15, .15); P.life[i] = rnd(.5, 4.5); }
  function setPMode(m: string) {
    if (m === pMode) return; pMode = m; const c = PCFG[m] || PCFG.air; nA = c[0]; nB = c[3];
    PA.mat.color.copy(MC[c[1]]); PA.mat.size = c[2]; PB.mat.color.copy(MC.air);
    for (let i = 0; i < PA.n; i++) { if (m === 'airin') seedIn(PA, i, 1.2); else seedAny(PA, i); } for (let i = 0; i < PB.n; i++) seedAny(PB, i);
    PA.g.setDrawRange(0, nA); PB.g.setDrawRange(0, nB); PA.g.attributes.position.needsUpdate = true; PB.g.attributes.position.needsUpdate = true;
  }
  function keepIn(P: any, j: number) {
    if (P.pos[j] < CB.x0) { P.pos[j] = CB.x0; P.vel[j] = Math.abs(P.vel[j]) * .6; } if (P.pos[j] > CB.x1) { P.pos[j] = CB.x1; P.vel[j] = -Math.abs(P.vel[j]) * .6; }
    if (!inCh(P.pos[j + 1], P.pos[j + 2])) { P.pos[j + 1] = Math.min(Math.max(P.pos[j + 1], CB.y0 + .05), CB.y1 - .05); P.pos[j + 2] *= .95; P.vel[j + 1] *= -.5; P.vel[j + 2] *= -.5; }
  }
  function toward(P: any, j: number, tgt: any, sp: number, dt: number) { const dx = tgt.x - P.pos[j], dy = tgt.y - P.pos[j + 1], dz = tgt.z - P.pos[j + 2]; const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1; P.pos[j] += dx / d * sp * dt; P.pos[j + 1] += dy / d * sp * dt; P.pos[j + 2] += dz / d * sp * dt; return d; }
  function stepParticles(dt: number) {
    const m = pMode;
    for (let i = 0; i < nA; i++) {
      const j = i * 3;
      if (m === 'air' || m === 'hold') { const k = m === 'air' ? .45 : .08; for (let a = 0; a < 3; a++) { PA.vel[j + a] += rnd(-1, 1) * k * dt; PA.vel[j + a] *= .985; PA.pos[j + a] += PA.vel[j + a] * dt; } keepIn(PA, j); }
      else if (m === 'vac') { const d = toward(PA, j, DR, .6 + 2.6 / (Math.hypot(DR.x - PA.pos[j], DR.y - PA.pos[j + 1]) + .5), dt); if (d < .16) seedAny(PA, i); }
      else if (m === 'out') { const d = toward(PA, j, DR, 1.2 + 2.4 / (Math.hypot(DR.x - PA.pos[j], DR.y - PA.pos[j + 1]) + .4), dt); if (d < .16) seedAny(PA, i); }
      else if (m === 'airin') { PA.life[i] -= dt; PA.vel[j + 1] -= .08 * dt; for (let a = 0; a < 3; a++) PA.pos[j + a] += PA.vel[j + a] * dt * .8; keepIn(PA, j); if (PA.life[i] <= 0) seedIn(PA, i, 1.2); }
      else {
        PA.life[i] -= dt; PA.vel[j + 1] -= (m === 'flow' ? .5 : .12) * dt; const sl = m === 'hot' ? .5 : 1; const ag = m === 'hot' ? .9 : m === 'steam' ? .5 : m === 'flow' ? .3 : .15;
        for (let a = 0; a < 3; a++) PA.pos[j + a] += (PA.vel[j + a] * sl + rnd(-1, 1) * ag * 3) * dt; keepIn(PA, j);
        if (m === 'flow' && PA.pos[j + 1] < 2.6) { toward(PA, j, DR, 1.2, dt); if (Math.hypot(DR.x - PA.pos[j], DR.y - PA.pos[j + 1], DR.z - PA.pos[j + 2]) < .2) seedIn(PA, i, 1); }
        if (PA.life[i] <= 0) seedIn(PA, i, 1);
      }
    }
    for (let i = 0; i < nB; i++) { const j = i * 3; PB.vel[j + 1] -= .06 * dt; PB.pos[j + 1] += PB.vel[j + 1] * dt; PB.pos[j] += (DR.x - PB.pos[j]) * .12 * dt; PB.pos[j + 2] += (DR.z - PB.pos[j + 2]) * .12 * dt; keepIn(PB, j); if (PB.pos[j + 1] < CB.y0 + .08) { toward(PB, j, DR, .8, dt); if (Math.hypot(DR.x - PB.pos[j], DR.z - PB.pos[j + 2]) < .2) seedAny(PB, i); } }
    PA.g.attributes.position.needsUpdate = true; PB.g.attributes.position.needsUpdate = true;
  }
  // jacket steam
  const NJ = 260, jp = new Float32Array(NJ * 3), jv = new Float32Array(NJ), jb = new Float32Array(NJ * 2), jph = new Float32Array(NJ); let jt = 0;
  for (let i = 0; i < NJ; i++) { let z: number, y: number, n = 0; do { z = rnd(-1.43, 1.43); y = rnd(2.03, 6.17); n++; } while (n < 300 && !(insideRR(z, y, 1.43, 2.04, 6.16, .34, .54) && !insideRR(z, y, 1.32, 2.18, 5.97, .29, .46))); jp[i * 3] = rnd(-2.28, 2.28); jp[i * 3 + 1] = y; jp[i * 3 + 2] = z; jb[i * 2] = y; jb[i * 2 + 1] = z; jph[i] = Math.random() * 6.3; jv[i] = rnd(.25, .6) * (Math.random() < .5 ? -1 : 1); }
  const jg = new T.BufferGeometry(); jg.setAttribute('position', new T.BufferAttribute(jp, 3));
  const jpm = new T.PointsMaterial({ size: .07, map: dotTex, transparent: true, depthWrite: false, opacity: .6, color: MC.steam.clone() });
  const jpts = new T.Points(jg, jpm); jpts.frustumCulled = false; scene.add(jpts);
  function stepJacket(dt: number) {
    jt += dt; for (let i = 0; i < NJ; i++) {
      let x = jp[i * 3] + jv[i] * dt + rnd(-1, 1) * .02; if (x > 2.28) x = -2.28; if (x < -2.28) x = 2.28; jp[i * 3] = x;
      const w = jt * 11 + jph[i]; jp[i * 3 + 1] = jb[i * 2] + Math.sin(w) * .025 + rnd(-1, 1) * .012; jp[i * 3 + 2] = jb[i * 2 + 1] + Math.cos(w * 1.3) * .025 + rnd(-1, 1) * .012;
    }
    jpm.opacity = .6 + .25 * Math.sin(jt * 5); jg.attributes.position.needsUpdate = true;
  }
  // tank bubbles
  const NBb = 36, bp = new Float32Array(NBb * 3); const bg = new T.BufferGeometry(); bg.setAttribute('position', new T.BufferAttribute(bp, 3));
  const bpm = new T.PointsMaterial({ size: .045, map: dotTex, transparent: true, depthWrite: false, opacity: .85, color: 0xffffff }); const bpts = new T.Points(bg, bpm); bpts.frustumCulled = false; bpts.renderOrder = 6; scene.add(bpts);
  function seedB(i: number, any: boolean) { bp[i * 3] = rnd(2.86, 3.14); bp[i * 3 + 1] = any ? rnd(.46, 1.08) : .47; bp[i * 3 + 2] = -.55 + rnd(-.05, .05); } for (let i = 0; i < NBb; i++) seedB(i, true);
  let bubbles = false;
  function stepBubbles(dt: number) { for (let i = 0; i < NBb; i++) { bp[i * 3 + 1] += dt * rnd(.25, .45); bp[i * 3] += rnd(-.02, .02) * dt; if (bp[i * 3 + 1] > 1.08) seedB(i, false); } bg.attributes.position.needsUpdate = true; }

  /* ---- highlight rings ---- */
  const ringTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!; x.strokeStyle = '#ffffff'; x.lineWidth = 7; x.beginPath(); x.arc(64, 64, 50, 0, Math.PI * 2); x.stroke(); return new T.CanvasTexture(c); })();
  const hiPool: any[] = [];
  function hiSprite(i: number) { if (!hiPool[i]) { const s = new T.Sprite(new T.SpriteMaterial({ map: ringTex, color: TC.tag.clone(), depthTest: false, transparent: true })); s.renderOrder = 999; scene.add(s); hiPool[i] = s; } return hiPool[i]; }
  const BIG: Record<string, [any, number]> = {
    CHAMBER: [V(0, 4.1, 0), 3.2], JACKET: [V(0, 4.1, 0), 3.4], DOOR: [V(-2.55, 4.1, 0), 2.6], DOOR2: [V(2.55, 4.1, 0), 2.6],
    DS1: [V(-2.43, 4.1, 0), 2.6], DS2: [V(2.43, 4.1, 0), 2.6], HX1: [V(1.5, 1.33, .3), 1.0], VP1: [V(1.7, .75, .3), 1.35],
    TANK: [V(3.05, .78, -.55), .95], F2: [V(3.0, .45, -.55), .5], WASTE: [V(3.62, .3, -.55), .75], CTRL: [V(1.75, 3.1, -2.2), 1.3],
    STARTER: [V(1.0, 2.6, -2.2), .9], SB1: [V(2.0, 4.4, 1.1), 1.2], CS1: [V(-2.0, 2.32, .85), .4], ST4: [V(-1.6, 2.24, .3), .4]
  };
  function centerOf(id: string) {
    if (BIG[id]) return BIG[id][0].clone();
    const n = ND[id]; if (!n) return V(0, 0, 0); const p = VA(n.p3);
    if (KIND[id] === 'gauge') { const A = dirAt(id); const nf = n.face ? VA(n.face) : V(0, 0, 1); if (Math.abs(A.dot(nf)) > .9) p.add(nf.multiplyScalar(.04)); else p.add(A.multiplyScalar(.13)); }
    if (KIND[id] === 'safety') p.y += .3; if (KIND[id] === 'reg') p.y += .25; if (KIND[id] === 'src') p.y += id === 'SRC_S' ? .4 : 0;
    return p;
  }
  function sizeOf(id: string) { if (BIG[id]) return BIG[id][1]; const k = KIND[id]; return ({ sol: .55, solb: .7, safety: .8, reg: .75, filter: .55, src: .6, gauge: .42 } as Record<string, number>)[k] || .42; }
  // selección interna (el padre la recibe vía onSelect; aquí solo pinta los anillos/etiquetas)
  let sel: string | null = null, hov: string | null = null; const focus: string[] = [];
  function partOn2(id: string) { return !(doorsRef.current === 1 && DDP.has(id)); }
  function updateHi() {
    const ids: string[] = []; if (sel) ids.push(sel); if (hov && !ids.includes(hov)) ids.push(hov); focus.forEach(f => { if (!ids.includes(f)) ids.push(f); });
    let i = 0;
    ids.forEach(id => {
      if (!partOn2(id) || NORING.has(id)) return;
      const s = hiSprite(i++); s.visible = true; s.position.copy(centerOf(id));
      s.userData.base = sizeOf(id); s.userData.pulse = id !== sel;
      s.material.color.copy(TC.tag); s.scale.setScalar(s.userData.base);
    });
    for (; i < hiPool.length; i++) hiPool[i].visible = false;
  }
  function doSelect(id: string | null) {
    sel = id || null;
    labelVis(); updateHi();
    onSelectRef.current(sel);
  }

  /* ---- labels ---- */
  const labels: any[] = [];
  const LANCH: Record<string, any> = {
    CHAMBER: V(.2, 4.55, 1.32), JACKET: V(-.9, 6.32, 1.0), DOOR: V(-2.66, 5.6, .9), DOOR2: V(2.66, 5.6, .9),
    DS1: V(-2.45, 2.55, 1.2), DS2: V(2.45, 2.55, 1.2), HX1: V(1.5, 1.62, .3), VP1: V(2.05, .75, .75),
    TANK: V(3.05, 1.35, -.55), F2: V(2.86, .45, -.3), WASTE: V(3.62, .5, -.2), CTRL: V(1.75, 4.35, -2.2),
    STARTER: V(1.0, 3.15, -2.25), SB1: V(2.0, 5.6, 1.05), CS1: V(-2.0, 2.55, .85), ST4: V(-1.6, 2.45, .3),
    SRC_S: V(-2.15, 9.0, -2.0), SRC_W: V(2.5, 9.0, -2.6)
  };
  function anchorOf(id: string) {
    if (LANCH[id]) return LANCH[id].clone();
    const c = comps[id]; const p = VA(ND[id].p3);
    if (c && c.top) { const t = c.top.clone(); if (t.y < .2) t.y = .2; p.add(V(0, Math.max(t.y, .2), 0)); if (Math.abs(t.z) > .3) p.z += .15; }
    else p.y += .25;
    return p;
  }
  function mkLabel(id: string, anchor: any, major: boolean, zone: boolean): any {
    const el = document.createElement(zone ? 'span' : 'button') as HTMLElement;
    el.className = 't3' + (major ? ' major' : ''); el.style.visibility = 'hidden';
    if (!zone) { (el as HTMLButtonElement).type = 'button'; el.addEventListener('click', e => { e.stopPropagation(); doSelect(sel === id ? null : id); }); }
    const dot = document.createElement('i'); const sp = document.createElement('span');
    el.appendChild(dot); el.appendChild(sp); labelsEl.appendChild(el);
    const o = { id, el, anchor, major, zone, txt: sp, dd: DDP.has(id) }; labels.push(o); return o;
  }
  Object.keys(INFO).forEach(id => mkLabel(id, anchorOf(id), MAJOR.has(id), false));
  const ZL: [string, any][] = [['zOE', V(-3.05, 6.55, 0)], ['zNOE', V(3.05, 6.55, 0)], ['zEnd', V(2.9, 6.5, 0)], ['zFloor', V(-.35, .3, 1.95)], ['zAtm', V(1.65, 6.82, 1.95)]];
  ZL.forEach(([k, p]) => { const o = mkLabel(k, p, false, true); o.zk = k; });
  function relabel() {
    cv.setAttribute('aria-label', tr('canvasAria'));
    labels.forEach(o => {
      o.w = 0;
      if (o.zone) { o.txt.textContent = tr(o.zk); return; }
      o.txt.textContent = SHORT[o.id] ? L(SHORT[o.id]) : o.id;
      o.el.setAttribute('aria-label', (NOCODE.has(o.id) ? '' : o.id + ': ') + (L(INFO[o.id]) as any).n);
    });
  }
  function labelVis() {
    const St = stateRef.current; if (!St) return;
    const act = activeParts(St, doorsRef.current);
    const labMode = labModeRef.current, doors = doorsRef.current;
    labels.forEach(o => {
      let show: boolean;
      if (o.zone) { show = labMode !== 'none' && (o.zk === 'zNOE' ? doors === 2 : o.zk === 'zEnd' ? doors === 1 : true); if (o.zk === 'zAtm') show = labMode === 'all' || (labMode === 'active' && !!St.flow.s_atm1); if (o.zk === 'zFloor') show = labMode === 'all'; }
      else {
        const isF = focus.includes(o.id) || o.id === hov, isS = o.id === sel;
        if (!partOn2(o.id)) show = false;
        else if (labMode === 'none') show = isF || isS;
        else if (labMode === 'all') show = true;
        else show = o.major || act.has(o.id) || isF || isS;
        o.el.classList.toggle('on', act.has(o.id) && !o.major);
        const m = medOf(o.id, St, doors) || (o.id === 'VP1' ? 'vac' : null);
        if (m) o.el.style.setProperty('--c', 'var(--' + m + ')');
        o.el.classList.toggle('sel', isS); o.el.classList.toggle('focus', isF && !isS);
      }
      if (o.el.hidden === show) o.w = 0; o.el.hidden = !show;
    });
  }
  const tmp = V(0, 0, 0);
  function placeLabels() {
    const w = host.clientWidth, h = host.clientHeight, vis: any[] = [], placed: any[] = [];
    for (const o of labels) {
      if (o.el.hidden) continue;
      tmp.copy(o.anchor).project(camera);
      if (tmp.z > 1 || tmp.z < -1) { o.el.style.visibility = 'hidden'; continue; }
      const x = (tmp.x * .5 + .5) * w, y = (-tmp.y * .5 + .5) * h;
      if (x < -60 || x > w + 60 || y < -30 || y > h + 30) { o.el.style.visibility = 'hidden'; continue; }
      if (!o.w) { o.w = o.el.offsetWidth; o.h = o.el.offsetHeight; }
      o.sx = x; o.sy = y;
      o.pri = (o.id === sel ? 4 : 0) + (focus.includes(o.id) ? 3 : 0) + (o.major ? 2 : 0) + (o.el.classList.contains('on') ? 1 : 0);
      vis.push(o);
    }
    vis.sort((a, b) => (b.pri - a.pri) || (a.sy - b.sy));
    const hits = (x: number, y: number, hw: number, hh: number) => placed.some(p => Math.abs(p.x - x) < p.hw + hw && Math.abs(p.y - y) < p.hh + hh);
    for (const o of vis) {
      const hw = o.w / 2 + 2, hh = o.h / 2 + 1;
      const x = Math.min(Math.max(o.sx, hw + 2), w - hw - 2); let y: number | null = null;
      const col = placed.find(p => Math.abs(p.x - x) < p.hw + hw && Math.abs(p.y - o.sy) < p.hh + hh);
      const order = !col ? [0] : (col.y <= o.sy ? [0, 1, -1, 2, -2, 3, -3] : [0, -1, 1, -2, 2, -3, 3]);
      for (const k of order) { const yy = o.sy + k * (hh * 2 + 1); if (yy < hh + 2 || yy > h - hh - 2) continue; if (!hits(x, yy, hw, hh)) { y = yy; break; } }
      if (y === null) { if (o.pri >= 3) { y = Math.min(Math.max(o.sy, hh + 2), h - hh - 2); } else { o.el.style.visibility = 'hidden'; continue; } }
      placed.push({ x, y, hw, hh }); o.el.style.visibility = 'visible'; o.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)';
    }
  }

  /* ---- picking ---- */
  const ray = new T.Raycaster(), ndc = new T.Vector2(); let down: any = null;
  const visDeep = (o: any) => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };
  function onPointerDown(e: PointerEvent) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; }
  function onPointerUp(e: PointerEvent) {
    if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y, quick = performance.now() - down.t < 600; down = null;
    if (dx * dx + dy * dy > 49 || !quick) return;
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    let h = ray.intersectObjects(pickA, false).filter((x: any) => visDeep(x.object) && x.object.userData.id && partOn2(x.object.userData.id));
    if (h.length) { doSelect(h[0].object.userData.id); return; }
    h = ray.intersectObjects(pickB, false).filter((x: any) => visDeep(x.object) && partOn2(x.object.userData.id));
    if (h.length) { const ids = h.map((x: any) => x.object.userData.id); doSelect(ids[0]); } else doSelect(null);
  }
  cv.addEventListener('pointerdown', onPointerDown);
  cv.addEventListener('pointerup', onPointerUp);

  /* ---- camera ---- */
  const VIEWS: Record<string, { p: number[]; t: number[] }> = {
    general: { p: [-6.4, 10.6, -16.4], t: [.3, 4.3, -.6] },
    top: { p: [-3.6, 13.6, -7.4], t: [-.4, 5.5, -.8] },
    under: { p: [1.6, 2.3, 10.4], t: [.75, 1.0, -.2] },
    door: { p: [-12.2, 6.2, 7.4], t: [-2.2, 4.3, -.2] },
    rear: { p: [-.4, 6.7, -9.2], t: [-.6, 5.45, -2.0] }
  };
  let tw: any = null;
  function fly(p: any, t: any, ms: number) { if (reduce || !ms) { camera.position.copy(p); controls.target.copy(t); controls.update(); tw = null; return; } tw = { p0: camera.position.clone(), t0: controls.target.clone(), p1: p, t1: t, start: performance.now(), ms }; }
  function flyView(name: string, ms?: number) {
    const v = VIEWS[name] || VIEWS.general; const t = VA(v.t), p = VA(v.p);
    const a = camera.aspect || 1; const k = a < 1 ? Math.pow(1 / a, .7) : 1;
    p.sub(t).multiplyScalar(k).add(t);
    fly(p, t, ms === undefined ? 900 : ms);
  }
  function flyToXYZ(x: number, y: number, z: number) {
    // adaptación: la interfaz imperativa pide flyTo(x,y,z); el original volaba a una
    // pieza (flyTo(id)). Centramos el target en el punto conservando la dirección de vista.
    const t = V(x, y, z); const delta = t.clone().sub(controls.target);
    const p = camera.position.clone().add(delta); if (p.y < .4) p.y = .4; fly(p, t, 900);
  }
  function onControlsStart() { tw = null; }
  controls.addEventListener('start', onControlsStart);

  /* ---- apply a step ---- */
  let pumpOn = false; const BLACK = new T.Color(0, 0, 0);
  const FILL: Record<string, [string, number]> = { air: ['air', .06], flow: ['steam', .12], vac: ['vac', .12], steam: ['steam', .15], hot: ['steam', .25], out: ['steam', .1], airin: ['air', .09], hold: ['vac', .1] };
  const PLATE = new T.Color(0xB9AE9A);
  function apply(St: CycleState) {
    stateRef.current = St;
    const doors = doorsRef.current;
    for (const id in pipes) {
      const P = pipes[id]; const f = St.flow[id], h = St.hold[id]; const u = P.mat.uniforms;
      if (f) { u.uMode.value = 1; u.uFlow.value.copy(MC[f.m]); u.uDir.value = f.dir; u.uSpeed.value = reduce ? 0 : (f.slow ? .28 : 1.15); }
      else if (h) { u.uMode.value = 2; u.uFlow.value.copy(MC[h]); u.uSpeed.value = reduce ? 0 : 1.15; }
      else u.uMode.value = 0;
    }
    for (const id in comps) {
      const c = comps[id];
      if (c.ring) { const on = St.thru.has(id) && (c.k !== 'sol' && c.k !== 'solb' ? true : St.open.has(id)); c.ring.visible = on; if (on) c.ring.material.color.copy(MC[medOf(id, St, doors) || 'steam']); }
      if (c.ledM) { c.ledM.color.copy(St.ener.has(id) ? ledOn : ledOff); }
    }
    pumpOn = St.pump; vpRing.visible = pumpOn; vpRing.material.color.copy(MC.vac);
    bladeMat.emissive.copy(pumpOn ? MC.vac : BLACK).multiplyScalar(pumpOn ? .5 : 0);
    lampM.color.set(pumpOn ? 0xFFB020 : 0x4A4A4A);
    const hs = hxState(St);
    plates.forEach((p, i) => { const coolPlate = i % 2 === 1; let c: any = null; if (coolPlate && hs.cool) c = MC.water; if (!coolPlate && hs.proc) c = MC[hs.proc]; if (c) { p.material.color.copy(c); p.material.emissive.copy(c).multiplyScalar(.4); } else { p.material.color.copy(PLATE); p.material.emissive.copy(BLACK); } });
    const ss = St.ph.seal; const sc = ss === 'retract' ? MC.vac : (ss === 'on' || ss === 'fill') ? MC.steam : null;
    [seal1, seal2].forEach(s => { if (sc) { s.mat.color.copy(sc); s.mat.emissive.copy(sc).multiplyScalar(.35); } else { s.mat.color.set(0x7A858D); s.mat.emissive.copy(BLACK); } });
    sealLinks.forEach(l => { if (sc) { l.mat.color.copy(sc); l.mat.emissive.copy(sc).multiplyScalar(.3); } else { l.mat.color.set(0x7A858D); l.mat.emissive.copy(BLACK); } });
    const fl = FILL[St.ph.ch] || FILL.air; fillMat.color.copy(MC[fl[0]]); fillMat.opacity = fl[1]; setPMode(St.ph.ch);
    bubbles = !!St.flow.s_ch3; bpts.visible = bubbles;
    const gdeg = (v: number) => v >= 0 ? -90 + 2.25 * v : -90 + 2 * v;
    if (gaugeOf.PG1) gaugeOf.PG1.tgt = gdeg(GV[St.ph.id || ''] || 0); if (gaugeOf.PG2) gaugeOf.PG2.tgt = gdeg(GV.jacket);
    if (reduce) for (const k in gaugeOf) { gaugeOf[k].cur = gaugeOf[k].tgt; gaugeOf[k].needle.rotation.z = -gaugeOf[k].cur * Math.PI / 180; }
    labelVis(); updateHi();
  }
  function setXray(on: boolean) {
    xrayRef.current = on;
    inMat.transparent = on; inMat.opacity = on ? .0 : 1; inMat.depthWrite = !on; inMat.needsUpdate = true; insul.visible = !on; seams.visible = !on;
    jkMat.opacity = on ? .16 : .55; jkMat.emissive.copy(on ? MC.steam : BLACK).multiplyScalar(on ? .1 : 0); jkMat.needsUpdate = true;
    chamber.visible = on; chEdge.visible = on; chFill.visible = on; PA.p.visible = on; PB.p.visible = on; jpts.visible = on; rack.visible = on; sb1.visible = on; st4.visible = on; cs1.visible = on;
    drMat.transparent = on; drMat.opacity = on ? .22 : 1; drMat.depthWrite = !on; drMat.needsUpdate = true;
    ringMat.opacity = on ? .45 : 1; ringMat.depthWrite = !on; ringMat.needsUpdate = true;
    tkMat.opacity = on ? .3 : 1; tkMat.depthWrite = !on; tkMat.needsUpdate = true;
    caseMat.opacity = on ? .35 : 1; caseMat.transparent = true; caseMat.depthWrite = !on; caseMat.needsUpdate = true; ringW.visible = on;
  }
  function setDoors(n: number) {
    doorsRef.current = n;
    ddObjs.forEach(o => { o.visible = n === 2; }); headNOE.visible = n === 1;
    scene.traverse((o: any) => { if (o.userData.dd2) o.visible = true; });
    labels.forEach(o => { o.w = 0; });
  }
  function onTheme() {
    readTheme(); scene.background = TC.scene.clone(); floorMat.color.copy(TC.floor); rebuildGrid();
    for (const id in pipes) { pipes[id].mat.uniforms.uBase.value.copy(baseFor(pipes[id].s.mat)); }
    edgeMat.color.copy(TC.ink2); jpm.color.copy(MC.steam); hiPool.forEach(s => s.material.color.copy(TC.tag));
    pMode = ''; setXray(xrayRef.current); if (stateRef.current) apply(stateRef.current);
  }
  const cleanups: (() => void)[] = [];
  if (window.matchMedia) {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const mqCb = () => onTheme();
    if ((mq as any).addEventListener) { (mq as any).addEventListener('change', mqCb); cleanups.push(() => (mq as any).removeEventListener('change', mqCb)); }
  }
  const mo = new MutationObserver(onTheme);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  cleanups.push(() => mo.disconnect());

  /* ---- size, loop ---- */
  function resize() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); labels.forEach(o => { o.w = 0; }); }
  let ro: ResizeObserver | null = null;
  if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(host); cleanups.push(() => ro && ro.disconnect()); }
  else { const wcb = () => resize(); window.addEventListener('resize', wcb); cleanups.push(() => window.removeEventListener('resize', wcb)); }
  resize();
  let visible = true, active = true;
  let io: IntersectionObserver | null = null;
  if (window.IntersectionObserver) { io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }); io.observe(host); cleanups.push(() => io && io.disconnect()); }
  const clock = new T.Clock();
  let raf = 0, disposed = false;
  function loop() {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), .05);
    if (!active || !visible || document.hidden) return;
    const t = clock.elapsedTime; uTime.value = t;
    if (tw) { const k = Math.min(1, (performance.now() - tw.start) / tw.ms); const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; camera.position.lerpVectors(tw.p0, tw.p1, e); controls.target.lerpVectors(tw.t0, tw.t1, e); if (k >= 1) tw = null; }
    controls.update();
    for (const k in gaugeOf) { const G = gaugeOf[k]; if (Math.abs(G.tgt - G.cur) > .05) { G.cur += (G.tgt - G.cur) * Math.min(1, dt * 2.5); G.needle.rotation.z = -G.cur * Math.PI / 180; } }
    const xray = xrayRef.current;
    if (!reduce) {
      if (pumpOn) imp.rotation.x += dt * 12;
      if (xray) { stepParticles(dt); stepJacket(dt); }
      if (bubbles) stepBubbles(dt);
      const pulse = 1 + .08 * Math.sin(t * 4);
      for (const id in comps) { const r = comps[id].ring; if (r && r.visible) r.scale.setScalar(r.userData.base * pulse); }
      if (vpRing.visible) vpRing.scale.setScalar(vpRing.userData.base * pulse);
      hiPool.forEach(s => { if (s.visible && s.userData.pulse) s.scale.setScalar(s.userData.base * (1 + .12 * Math.sin(t * 5))); });
    }
    renderer.render(scene, camera); placeLabels();
  }
  flyView('general', 0);
  setXray(xrayRef.current); setDoors(doorsRef.current); relabel();
  raf = requestAnimationFrame(loop);

  function screenX(id: string) {
    // adaptación: el original devolvía solo la x normalizada (línea 1672).
    // La interfaz imperativa pide {x, y} | null.
    const p = centerOf(id).project(camera);
    if (p.z > 1 || p.z < -1) return null;
    return { x: p.x * .5 + .5, y: -p.y * .5 + .5 };
  }
  const api: Api = {
    apply, relabel, flyView: (cam: string) => flyView(cam), flyToXYZ, setXray, setDoors, screenX,
    setActive: (a: boolean) => { active = a; if (a) resize(); },
    refresh: () => { labelVis(); updateHi(); }
  };
  function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    cleanups.forEach(fn => fn());
    controls.removeEventListener('start', onControlsStart);
    cv.removeEventListener('pointerdown', onPointerDown);
    cv.removeEventListener('pointerup', onPointerUp);
    controls.dispose();
    scene.traverse((o: any) => {
      if (o.geometry) o.geometry.dispose();
      const m = o.material;
      if (Array.isArray(m)) m.forEach((x: any) => { if (x.map) x.map.dispose(); x.dispose(); });
      else if (m) { if (m.map) m.map.dispose(); m.dispose(); }
    });
    renderer.dispose();
    labelsEl.innerHTML = '';
    if (cv.parentNode === host) host.removeChild(cv);
  }
  return Object.assign(api, { dispose }) as Api & { dispose: () => void };
}

/* ---------- componente React ---------- */
export const Viewer3D = forwardRef<Viewer3DApi, Viewer3DProps>(function Viewer3D(props, ref) {
  const { state, doors, cam, labMode, xray, onSelect } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<(Api & { dispose: () => void }) | null>(null);
  const [noGL, setNoGL] = useState(false);
  const { lang } = useLang();

  // refs mutables que el cierre de buildViewer lee en cada frame
  const stateRef = useRef(state); stateRef.current = state;
  const doorsRef = useRef(doors); doorsRef.current = doors;
  const labModeRef = useRef(labMode); labModeRef.current = labMode;
  const xrayRef = useRef(xray); xrayRef.current = xray;
  const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect;

  // crear la escena una sola vez
  useEffect(() => {
    const host = hostRef.current, labelsEl = labelsRef.current;
    if (!host || !labelsEl) return;
    try {
      apiRef.current = buildViewer(host, labelsEl, { state: stateRef, doors: doorsRef, labMode: labModeRef, xray: xrayRef, onSelect: onSelectRef });
    } catch (e) {
      // como el original (#v3msg): mensaje de fallback en vez de la escena
      console.error(e);
      setNoGL(true);
      return;
    }
    return () => { apiRef.current?.dispose(); apiRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sincronización de props (sin recrear la escena)
  useEffect(() => { apiRef.current?.apply(state); }, [state]);
  useEffect(() => { apiRef.current?.setDoors(doors); }, [doors]);
  useEffect(() => { apiRef.current?.flyView(cam); }, [cam]);
  useEffect(() => { apiRef.current?.setXray(xray); }, [xray]);
  useEffect(() => { apiRef.current?.refresh(); }, [labMode]);
  useEffect(() => { apiRef.current?.relabel(); }, [lang]);

  useImperativeHandle(ref, () => ({
    apply: (s: CycleState) => apiRef.current?.apply(s),
    relabel: () => apiRef.current?.relabel(),
    flyView: (c: string) => apiRef.current?.flyView(c),
    flyTo: (x: number, y: number, z: number) => apiRef.current?.flyToXYZ(x, y, z),
    setXray: (b: boolean) => apiRef.current?.setXray(b),
    setDoors: (n: number) => apiRef.current?.setDoors(n),
    screenX: (id: string) => apiRef.current?.screenX(id) ?? null,
    setActive: (b: boolean) => apiRef.current?.setActive(b),
    refresh: () => apiRef.current?.refresh()
  }), []);

  if (noGL) {
    return (
      <div className="v3">
        <p className="v3msg">{tr('noGL')}</p>
      </div>
    );
  }
  return (
    <div className="v3" ref={hostRef}>
      <div className="labels" ref={labelsRef}></div>
    </div>
  );
});

export default Viewer3D;
