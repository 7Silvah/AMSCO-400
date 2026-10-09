// src/data/phases.ts — fases y ciclos del AMSCO 400.
// Original: líneas 643–701 del HTML (dentro de /*DATA-START*/…/*DATA-END*/).
// ph() añade BASEP al inicio de paths y pone 'S9' primera en open si falta;
// cp() clona una plantilla PH_* y le aplica ph(), así que cada fase de un ciclo
// resulta con paths = BASEP.concat(...) y open con S9 primero.
// Cambios vs. el original: `var` → `export const` con tipos; CYCLES se exporta
// desde aquí (en el original vivía en la sección APP, línea 1172).

export type CycleMode = 'normal' | 'leak' | 'dartw' | 'dart' | 'serv';

export interface Phase {
  key: string;
  id?: string;
  r?: [number, number];
  open: string[];
  paths: string[];
  pump: 0 | 1;
  ch: string;
  seal: string;
  lock: 0 | 1;
  int?: string[];
  s9on?: number;
}

/* ===== phases =====
   open: solenoids commanded open (S1 is normally open: listed when de-energized)
   pump: vacuum pump running; ch: chamber contents; seal: on | fill | retract | off; lock: door locked */
/* Phases follow the AMSCO 400 Medium Maintenance Manual (P764334-669), 4 - Principles of Operation and
   Figure 4-7 Prevac/DART Cycle Graph. int: valves the manual shows as intermittent in that phase;
   s9on: S9 held on (pressure pulses, start of charge). S9 is intermittent everywhere else. */
export const BASEP: string[] = ['DRIP', 'SUP', 'TR3', 'TR2', 'OF'];
function ph(o: Phase): Phase { o.paths = BASEP.concat(o.paths || []); if (o.open.indexOf('S9') < 0) o.open = ['S9'].concat(o.open); o.int = o.int || []; return o; }
export const PH_STANDBY: Phase = { key: 'standby', open: ['S1'], paths: [], pump: 0, ch: 'air', seal: 'off', lock: 0, int: ['S4'] };
export const PH_SEAL: Phase = { key: 'seal', open: ['S1', 'S3', 'S35', 'S36', 'S37', 'S38'], paths: ['SEAL1', 'SEAL2', 'SPRG1', 'SPRG2', 'HXO', 'VPD'], pump: 0, ch: 'air', seal: 'fill', lock: 1, int: ['S4'] };
export const PH_PURGE: Phase = { key: 'purge', open: ['S35', 'S36', 'S2', 'S3', 'S7', 'S4', 'S40'], paths: ['S2', 'EXs', 'TR1', 'S40', 'HXO', 'VPD', 'S7', 'S4', 'HXC', 'SEAL1', 'SEAL2'], pump: 1, ch: 'flow', seal: 'on', lock: 1 };
export const PH_VAC: Phase = { key: 'vac', open: ['S35', 'S36', 'S3', 'S7', 'S4', 'S40'], paths: ['EXv', 'AC', 'HXO', 'VPD', 'S7', 'S4', 'HXC', 'SEAL1', 'SEAL2'], pump: 1, ch: 'vac', seal: 'on', lock: 1, int: ['S4'] };
export const PH_PRESS: Phase = { key: 'press', open: ['S35', 'S36', 'S2', 'S4', 'S40'], paths: ['S2', 'TR1', 'S40', 'S4', 'HXC', 'SEAL1', 'SEAL2'], pump: 0, ch: 'steam', seal: 'on', lock: 1, int: ['S4'], s9on: 1 };
export const PH_CHARGE: Phase = { key: 'charge', open: ['S35', 'S36', 'S2', 'S4', 'S40'], paths: ['S2', 'TR1', 'S40', 'S4', 'HXC', 'SEAL1', 'SEAL2'], pump: 0, ch: 'steam', seal: 'on', lock: 1, int: ['S4'], s9on: 1 };
export const PH_STER: Phase = { key: 'ster', open: ['S35', 'S36', 'S2', 'S4', 'S40'], paths: ['S2', 'TR1', 'S40', 'S4', 'HXC', 'SEAL1', 'SEAL2'], pump: 0, ch: 'hot', seal: 'on', lock: 1, int: ['S4'] };
export const PH_EXH: Phase = { key: 'exh', open: ['S35', 'S36', 'S3', 'S7', 'S4', 'S40'], paths: ['EXs', 'TR1', 'S40', 'HXO', 'VPD', 'S7', 'S4', 'HXC', 'SEAL1', 'SEAL2'], pump: 1, ch: 'out', seal: 'on', lock: 1 };
export const PH_DRY: Phase = { key: 'dry', open: ['S35', 'S36', 'S3', 'S7', 'S4', 'S40'], paths: ['EXv', 'AC', 'HXO', 'VPD', 'S7', 'S4', 'HXC', 'SEAL1', 'SEAL2'], pump: 1, ch: 'vac', seal: 'on', lock: 1, int: ['S4'] };
export const PH_AIR: Phase = { key: 'air', open: ['S35', 'S36', 'S1', 'S4', 'S40'], paths: ['AIR', 'S4', 'HXC', 'SEAL1', 'SEAL2'], pump: 0, ch: 'airin', seal: 'on', lock: 1, int: ['S4'] };
export const PH_RET: Phase = { key: 'ret', open: ['S1', 'S37', 'S38', 'S7', 'S40'], paths: ['RET1', 'RET2', 'AC', 'HXOa', 'VPDw', 'S7'], pump: 1, ch: 'air', seal: 'retract', lock: 1 };
export const PH_DONE: Phase = { key: 'done', open: ['S1', 'S37', 'S38', 'S4'], paths: ['S4', 'HXC'], pump: 0, ch: 'air', seal: 'off', lock: 0, int: ['S4'] };
export const PH_HOLD: Phase = { key: 'hold', open: ['S35', 'S36'], paths: ['SEAL1', 'SEAL2'], pump: 0, ch: 'hold', seal: 'on', lock: 1 };

function cp(o: Phase, x?: Partial<Phase>): Phase { return ph(Object.assign({}, o, { paths: o.paths.slice() }, x || {})); }
export const CYC_NORMAL: Phase[] = [
  cp(PH_STANDBY, { id: 'n1', r: [0, 0.03] }),
  cp(PH_SEAL, { id: 'n2', r: [0.03, 0.06] }),
  cp(PH_PURGE, { id: 'n3', r: [0.06, 0.1] }),
  cp(PH_VAC, { id: 'n4', r: [0.1, 0.46] }),
  cp(PH_PRESS, { id: 'n5', r: [0.1, 0.46] }),
  cp(PH_CHARGE, { id: 'n6', r: [0.46, 0.5] }),
  cp(PH_STER, { id: 'n7', r: [0.5, 0.68] }),
  cp(PH_EXH, { id: 'n8', r: [0.68, 0.72] }),
  cp(PH_DRY, { id: 'n9', r: [0.72, 0.9] }),
  cp(PH_AIR, { id: 'n10', r: [0.9, 0.95] }),
  cp(PH_RET, { id: 'n11', r: [0.95, 0.98] }),
  cp(PH_DONE, { id: 'n12', r: [0.98, 1] })
];
export const CYC_LEAK: Phase[] = [
  cp(PH_SEAL, { id: 'l1', r: [0, 0.04] }),
  cp(PH_PURGE, { id: 'l2', r: [0.04, 0.07] }),
  cp(PH_VAC, { id: 'l3', r: [0.07, 0.2] }),
  cp(PH_PRESS, { id: 'l4', r: [0.07, 0.2] }),
  cp(PH_CHARGE, { id: 'l5', r: [0.2, 0.25] }),
  cp(PH_DRY, { id: 'l6', r: [0.25, 0.45] }),
  cp(PH_HOLD, { id: 'l7', r: [0.45, 0.52] }),
  cp(PH_HOLD, { id: 'l8', r: [0.52, 0.88] }),
  cp(PH_AIR, { id: 'l9', r: [0.88, 0.94] }),
  cp(PH_RET, { id: 'l10', r: [0.94, 0.97] }),
  cp(PH_DONE, { id: 'l11', r: [0.97, 1] })
];
export const CYC_DARTW: Phase[] = CYC_NORMAL.map(function (p, i) { return Object.assign({}, p, { id: 'w' + (i + 1) }); });
export const CYC_DART: Phase[] = CYC_NORMAL.map(function (p, i) { return Object.assign({}, p, { id: 'd' + (i + 1) }); });
export const CYC_SERV: Phase[] = [
  cp(PH_SEAL, { id: 'v1', r: [0, 0.08] }),
  cp(PH_VAC, { id: 'v2', r: [0.08, 0.35] }),
  cp(PH_HOLD, { id: 'v3', r: [0.35, 0.8] }),
  cp(PH_AIR, { id: 'v4', r: [0.8, 0.88] }),
  cp(PH_RET, { id: 'v5', r: [0.88, 0.94] }),
  cp(PH_DONE, { id: 'v6', r: [0.94, 1] })
];

export const CYCLES: Record<CycleMode, Phase[]> = { normal: CYC_NORMAL, leak: CYC_LEAK, dartw: CYC_DARTW, dart: CYC_DART, serv: CYC_SERV };
