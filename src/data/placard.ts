// src/data/placard.ts — grafo de tubería trazado de la placa 755718-493.
// Original: /*DATA-START*/ … /*DATA-END*/, líneas 374–641 del HTML
// (llamadas nd() → ND, llamadas sg() → SG, y PATH en la línea 614).
// Cambios vs. el original: `var ND/SG/PATH` → `export const` con tipos;
// nd()/sg() quedan como helpers locales (ya no globales). Todo lo demás verbatim.

export interface NdNode {
  id: string;
  p3: [number, number, number];
  p2: [number, number];
  k: string;
  [key: string]: any;
}

export interface SegEntry {
  id: string;
  a: string;
  b: string;
  v3: number[][];
  v2: number[][];
  size: string;
  mat: string;
  [key: string]: any;
}

/*DATA-START*/
/* Piping graph traced from placard 755718-493 (AMSCO 400 Series Medium, 26 x 37.5, Prevacuum & SFPP).
   3D units: 1 = 10 in. x along the vessel (operating end at -x), y up, z toward the front.
   2D coordinates follow the placard drawing (operating end on the left). */
export const ND: Record<string, NdNode> = {};
function nd(id: string, p3: [number, number, number], p2: [number, number], k: string, o?: Record<string, any>): void {
  ND[id] = Object.assign({ id: id, p3: p3, p2: p2, k: k }, o || {}) as NdNode;
}
export const SG: SegEntry[] = [];
function sg(id: string, a: string, b: string, v3: number[][], v2: number[][], size: string, mat: string, o?: Record<string, any>): void {
  SG.push(Object.assign({ id: id, a: a, b: b, v3: v3 || [], v2: v2 || [], size: size, mat: mat }, o || {}) as SegEntry);
}

/* ---- steam supply riser and regulated header (rear side, as in the photo of the header) ----
   Physical order on the machine: MV2 -> ST2 (Y strainer) -> stainless tee [down: TR3 drip leg | side: PR1]
   -> PR1 -> stainless tee "150-3/4" [up: S9 -> jacket | side: brass cross -> S35, S36; top of the cross: PR1 sensing line] */
nd('SRC_S', [-2.15, 7.5, -2.0], [376, 59], 'src', { med: 'steam' });
nd('MV2', [-2.15, 6.95, -2.0], [342, 59], 'man');
nd('ST2', [-2.15, 6.3, -2.0], [312, 59], 'str', { leg: [-1, 0, 0] });
nd('T_SUP', [-2.15, 5.0, -2.0], [284, 59], 'jn', { fit: 'ss' });
nd('TR3', [-2.15, 4.42, -2.0], [284, 165], 'trap', { td: 1 });
nd('PR1', [-1.6, 5.0, -2.0], [256, 60], 'reg');
nd('PR1:sen', [-1.6, 5.68, -2.0], [248, 60], 'port');
nd('T_REG', [-0.85, 5.0, -2.0], [256, 134], 'jn', { fit: 'ss' });
nd('S9', [-1.15, 5.72, -2.0], [256, 182], 'solb');
nd('JK:s9', [-1.4, 5.72, -1.46], [256, 266], 'port');
nd('X_SEAL', [0.05, 5.72, -2.0], [256, 134], 'jn');
nd('S35', [-0.33, 5.72, -2.0], [210, 134], 'sol');
nd('PS1T', [-1.25, 4.62, -2.2], [171, 242], 'jn');
nd('PS1', [-1.25, 4.3, -2.2], [192, 242], 'psw');
nd('DS1:in', [-2.36, 4.62, -1.6], [171, 266], 'port');
nd('S36', [0.43, 5.72, -2.0], [462, 152], 'sol', { dd: 1 });
nd('PS2T', [1.35, 4.62, -2.2], [462, 242], 'jn', { dd: 1 });
nd('PS2', [1.35, 4.3, -2.2], [441, 242], 'psw', { dd: 1 });
nd('DS2:in', [2.36, 4.62, -1.6], [462, 266], 'port', { dd: 1 });

/* ---- jacket safety valve (top) and jacket gauge (rear, next to the header) ---- */
nd('JK:rv', [-0.35, 6.2, -1.0], [284, 266], 'port');
nd('T_PG2', [-0.35, 6.62, -1.0], [325, 206], 'jn');
nd('PG2', [-0.35, 6.62, -1.38], [325, 185], 'gauge', { face: [0, 0, -1], dial: 'JACKET' });
nd('RV1', [-0.35, 6.86, -1.0], [353, 206], 'safety');
nd('RV_END', [-0.35, 0.45, 1.95], [575, 346], 'end');

/* ---- chamber steam (from the jacket) and filtered air ---- */
nd('JK:s2', [0.95, 6.2, 0.45], [367, 266], 'port');
nd('E_S2', [0.95, 6.82, 0.45], [367, 228], 'jn');
nd('S2', [1.3, 6.82, 0.45], [400, 228], 'solb');
nd('T_CH', [1.65, 6.82, 0.45], [427, 228], 'jn');
nd('CH:in', [2.0, 4.4, 1.3], [427, 277], 'port');
nd('CK1', [1.65, 6.82, 0.8], [542, 140], 'chk');
nd('S1', [1.65, 6.82, 1.12], [542, 106], 'sol');
nd('F1', [1.65, 6.82, 1.46], [542, 79], 'filter');
nd('ATM:f1', [1.65, 6.82, 1.8], [542, 56], 'atm');

/* ---- chamber pressure transducer and gauge (operating end) ---- */
nd('CH:pt', [-2.15, 5.45, 1.3], [186, 411], 'port');
nd('PTa', [-2.15, 5.45, 1.64], [150, 411], 'jn');
nd('T_PT', [-2.15, 6.35, 1.64], [107, 411], 'jn');
nd('PG1', [-2.15, 6.62, 1.64], [107, 389], 'gauge', { face: [0, 0, 1], dial: 'CHAMBER' });
nd('PT1', [-1.86, 6.35, 1.64], [72, 411], 'pt');

/* ---- door seal OE: exhaust/retraction and manual exhaust ---- */
nd('DS1:out', [-2.38, 1.98, -0.6], [171, 432], 'port');
nd('SL1', [-2.38, 1.62, -0.6], [171, 450], 'jn');
nd('FC3', [-2.12, 1.62, -0.6], [56, 487], 'orf');
nd('S37', [-1.76, 1.62, -0.6], [56, 524], 'sol');
nd('MV4', [-2.38, 1.12, -0.6], [252, 450], 'man');
nd('MVJ', [-2.2, 0.25, -0.6], [265, 528], 'jn');

/* ---- door seal NOE (two-door units only) ---- */
nd('DS2:out', [2.38, 1.98, -0.2], [462, 432], 'port', { dd: 1 });
nd('SL2', [2.38, 1.72, -0.2], [462, 496], 'jn', { dd: 1 });
nd('FC4', [2.15, 1.72, -0.2], [486, 496], 'orf', { dd: 1 });
nd('S38', [1.8, 1.72, -0.2], [510, 527], 'sol', { dd: 1 });

/* ---- chamber drain manifold ---- */
nd('CH:dr', [-1.6, 2.2, 0.3], [226, 421], 'port');
nd('DM0', [-1.6, 1.3, 0.3], [226, 477], 'jn');
nd('RTD1', [-1.6, 1.1, 0.3], [226, 514], 'rtd');
nd('MV3', [-1.92, 1.3, 0.3], [265, 498], 'man');
nd('DMa', [-1.33, 1.3, 0.3], [174, 477], 'jn');
nd('S40', [-1.33, 1.0, 0.3], [174, 503], 'sol');
nd('D5', [-1.33, 0.62, 0.3], [174, 522], 'jn');
nd('DMb', [-1.0, 1.3, 0.3], [143, 477], 'jn');
nd('TR1', [-1.0, 0.98, 0.3], [143, 498], 'trap');
nd('S3', [-0.66, 1.3, 0.3], [100, 512], 'solb');
nd('CK4', [-1.33, 0.62, -0.08], [174, 541], 'chk');
nd('CH0', [-1.33, 0.45, -1.8], [174, 563], 'jn');

/* ---- exhaust / vacuum line ---- */
nd('EX1', [-0.3, 1.3, 0.3], [100, 547], 'jn');
nd('EX2', [0.05, 1.3, 0.3], [510, 583], 'jn');
nd('CK8', [0.4, 1.3, 0.3], [558, 583], 'chk');
nd('AC', [0.8, 1.3, 0.3], [614, 517], 'jn');
nd('CK2', [0.8, 1.3, 0.66], [614, 485], 'chk');
nd('FC2', [0.8, 1.3, 0.98], [614, 447], 'ndl');
nd('ATM:ac', [0.8, 1.3, 1.32], [614, 416], 'atm');
nd('HXp:in', [1.12, 1.3, 0.3], [632, 517], 'port');
nd('HXp:out', [1.88, 1.25, 0.3], [662, 517], 'port');
nd('HXc:in', [1.3, 1.51, 0.3], [647, 502], 'port');
nd('HXc:out', [1.7, 1.15, 0.14], [647, 532], 'port');
nd('VP:suc', [2.05, 1.08, 0.3], [779, 528], 'port');
nd('VP:dis', [2.05, 0.75, -0.03], [801, 528], 'port');
nd('VP:win', [2.15, 0.75, 0.63], [789, 525], 'port');
nd('VP:sump', [2.05, 0.52, 0.53], [790, 569], 'port');

/* ---- water supply ---- */
nd('SRC_W', [2.5, 7.5, -2.6], [768, 227], 'src', { med: 'water' });
nd('MV1', [2.5, 0.62, -2.28], [729, 227], 'man');
nd('ST1', [2.5, 0.62, -1.9], [671, 227], 'str');
nd('W1', [2.5, 0.62, -1.25], [647, 312], 'jn');
nd('S7', [2.5, 0.62, -0.85], [789, 417], 'sol');
nd('FC1', [2.5, 0.62, -0.2], [789, 499], 'orf');
nd('S4', [1.9, 1.85, -1.25], [647, 360], 'sol');
nd('TT', [2.05, 1.38, -0.32], [647, 656], 'jn');

/* ---- drain tank, funnel ---- */
nd('TK:top', [3.05, 1.2, -0.55], [640, 656], 'port');
nd('TK:f2', [2.81, 0.45, -0.55], [640, 709], 'port');
nd('TK:of', [3.29, 1.1, -0.55], [577, 656], 'port');
nd('TK:rt', [3.05, 0.78, -0.31], [640, 686], 'port');
nd('RTD2', [3.05, 0.78, -0.17], [656, 686], 'rtd');
nd('WASTE:of', [3.62, 0.42, -0.55], [536, 690], 'waste');
nd('WASTE:mv', [3.62, 0.42, -0.72], [518, 690], 'waste');
nd('WASTE:s43', [3.62, 0.42, -0.38], [527, 690], 'waste');
nd('S43', [2.75, 0.45, 0.75], [675, 615], 'sol');

/* ---- condensate header ---- */
nd('CH_TR2', [0.6, 0.45, -1.8], [438, 563], 'jn');
nd('CH_TR3', [1.4, 0.45, -1.8], [586, 563], 'jn');

/* ---- jacket drain ---- */
nd('JK:dr', [0.6, 2.02, -1.0], [390, 432], 'port');
nd('RTD3', [0.6, 1.78, -1.0], [390, 448], 'rtdi');
nd('ST3', [0.6, 1.47, -1.0], [390, 477], 'str');
nd('TR2', [0.6, 1.12, -1.0], [390, 510], 'trap');
nd('CK3', [0.6, 0.8, -1.0], [415, 510], 'chk');

/* ===== segments (a -> b is the normal flow direction) =====
   size: L 1", M 3/4", S 1/2", T 1/4" tubing;  mat: cu copper, br brass, pt PTFE tube, ss stainless */
sg('s_src', 'SRC_S', 'MV2', [], [], 'L', 'cu');
sg('s_mv2', 'MV2', 'ST2', [], [], 'L', 'br');
sg('s_st2', 'ST2', 'T_SUP', [], [], 'L', 'br');
sg('s_dl', 'T_SUP', 'TR3', [], [], 'S', 'ss');
sg('s_h0', 'T_SUP', 'PR1', [], [], 'M', 'br');
sg('s_h1', 'PR1', 'T_REG', [], [], 'M', 'br');
sg('s_s9a', 'T_REG', 'S9', [[-0.85, 5.72, -2.0]], [], 'M', 'br');
sg('s_s9b', 'S9', 'JK:s9', [[-1.4, 5.72, -2.0]], [], 'M', 'br');
sg('s_hx', 'T_REG', 'X_SEAL', [[0.05, 5.0, -2.0]], [], 'S', 'br');
sg('s_h3', 'X_SEAL', 'S35', [], [], 'S', 'br');
sg('s_s35', 'S35', 'PS1T', [[-0.55, 5.72, -2.0], [-0.55, 5.72, -2.2], [-0.55, 4.62, -2.2]], [[171, 134]], 'T', 'pt');
sg('s_ds1', 'PS1T', 'DS1:in', [[-2.36, 4.62, -2.2]], [], 'T', 'pt');
sg('s_ps1', 'PS1T', 'PS1', [], [], 'T', 'cu', { stub: 1 });
sg('s_dd', 'X_SEAL', 'S36', [], [[462, 134]], 'S', 'br', { dd: 1 });
sg('s_s36', 'S36', 'PS2T', [[0.62, 5.72, -2.0], [0.62, 5.72, -2.2], [0.62, 4.62, -2.2]], [], 'T', 'pt', { dd: 1 });
sg('s_ds2', 'PS2T', 'DS2:in', [[2.36, 4.62, -2.2]], [], 'T', 'pt', { dd: 1 });
sg('s_ps2', 'PS2T', 'PS2', [], [], 'T', 'cu', { dd: 1, stub: 1 });
/* external sensing line: copper tube from the top of PR1 to the top of the S35/S36 cross (downstream pressure) */
sg('s_sen', 'PR1:sen', 'X_SEAL', [[-1.6, 6.42, -2.0], [0.05, 6.42, -2.0]], [[232, 60], [232, 77]], 'T', 'cu', { stub: 1, e2: [256, 77] });

sg('s_rv0', 'JK:rv', 'T_PG2', [], [[284, 206]], 'M', 'br');
sg('s_pg2', 'T_PG2', 'PG2', [], [], 'T', 'br', { stub: 1 });
sg('s_rv1', 'T_PG2', 'RV1', [], [], 'M', 'br');
sg('s_rvd', 'RV1', 'RV_END', [[-0.35, 6.86, 1.95]], [[575, 206]], 'M', 'cu');

sg('s_s2a', 'JK:s2', 'E_S2', [], [], 'L', 'br');
sg('s_s2b', 'E_S2', 'S2', [], [], 'L', 'br');
sg('s_s2c', 'S2', 'T_CH', [], [], 'L', 'br');
sg('s_cin', 'T_CH', 'CH:in', [[2.0, 6.82, 0.45], [2.0, 6.82, 1.68], [2.0, 4.4, 1.68]], [], 'L', 'ss');
sg('s_atm1', 'ATM:f1', 'F1', [], [], 'M', 'br');
sg('s_f1', 'F1', 'S1', [], [], 'M', 'br');
sg('s_s1', 'S1', 'CK1', [], [], 'M', 'br');
sg('s_ck1', 'CK1', 'T_CH', [], [[542, 228]], 'M', 'br');

sg('s_pt0', 'CH:pt', 'PTa', [], [], 'T', 'cu', { stub: 1 });
sg('s_pt1', 'PTa', 'T_PT', [], [], 'T', 'cu', { stub: 1 });
sg('s_pg1', 'T_PT', 'PG1', [], [], 'T', 'cu', { stub: 1 });
sg('s_ptx', 'T_PT', 'PT1', [], [], 'T', 'cu', { stub: 1 });

sg('s_sl1', 'DS1:out', 'SL1', [], [], 'T', 'pt');
sg('s_fc3', 'SL1', 'FC3', [], [[56, 450]], 'T', 'pt');
sg('s_s37', 'FC3', 'S37', [], [], 'T', 'pt');
sg('s_s37b', 'S37', 'EX1', [[-0.3, 1.62, -0.6], [-0.3, 1.62, 0.3]], [[56, 547]], 'T', 'pt');
sg('s_mv4a', 'SL1', 'MV4', [], [], 'T', 'pt');
sg('s_mv4b', 'MV4', 'MVJ', [[-2.38, 0.25, -0.6]], [[293, 450], [293, 528]], 'S', 'cu');

sg('s_sl2', 'DS2:out', 'SL2', [], [], 'T', 'pt', { dd: 1 });
sg('s_fc4', 'SL2', 'FC4', [], [], 'T', 'pt', { dd: 1 });
sg('s_s38', 'FC4', 'S38', [], [[510, 496]], 'T', 'pt', { dd: 1 });
sg('s_s38b', 'S38', 'EX2', [[0.05, 1.72, -0.2], [0.05, 1.72, 0.3]], [], 'T', 'pt', { dd: 1 });

sg('s_dr', 'CH:dr', 'DM0', [], [], 'L', 'br');
sg('s_rtd', 'DM0', 'RTD1', [], [], 'M', 'br', { stub: 1 });
sg('s_mvm', 'DM0', 'MV3', [], [[265, 477]], 'M', 'br');
sg('s_mv3o', 'MV3', 'MVJ', [[-2.2, 1.3, 0.3], [-2.2, 0.25, 0.3]], [], 'S', 'cu');
sg('s_dma', 'DM0', 'DMa', [], [], 'L', 'br');
sg('s_s40a', 'DMa', 'S40', [], [], 'S', 'br');
sg('s_s40b', 'S40', 'D5', [], [], 'T', 'pt');
sg('s_dmb', 'DMa', 'DMb', [], [], 'L', 'br');
sg('s_tr1a', 'DMb', 'TR1', [], [], 'S', 'br');
sg('s_tr1b', 'TR1', 'D5', [[-1.0, 0.62, 0.3]], [[143, 522]], 'S', 'br');
sg('s_s3a', 'DMb', 'S3', [], [[100, 477]], 'L', 'br');
sg('s_ck4a', 'D5', 'CK4', [], [], 'S', 'br');
sg('s_ck4b', 'CK4', 'CH0', [[-1.33, 0.62, -1.8]], [], 'T', 'pt');

sg('s_ex1', 'S3', 'EX1', [], [], 'L', 'cu');
sg('s_ex2', 'EX1', 'EX2', [], [[100, 583]], 'L', 'cu');
sg('s_ex3', 'EX2', 'CK8', [], [], 'L', 'cu');
sg('s_ex4', 'CK8', 'AC', [], [[614, 583]], 'L', 'cu');
sg('s_ex5', 'AC', 'HXp:in', [], [], 'L', 'cu');
sg('s_ac1', 'ATM:ac', 'FC2', [], [], 'T', 'br');
sg('s_ac2', 'FC2', 'CK2', [], [], 'T', 'br');
sg('s_ac3', 'CK2', 'AC', [], [], 'T', 'br');
sg('s_hxo', 'HXp:out', 'VP:suc', [[2.05, 1.25, 0.3]], [[779, 517]], 'L', 'cu');

sg('s_w0', 'SRC_W', 'MV1', [[2.5, 0.62, -2.6]], [], 'M', 'cu');
sg('s_w1', 'MV1', 'ST1', [], [], 'M', 'br');
sg('s_w2', 'ST1', 'W1', [], [[604, 227], [604, 312]], 'M', 'cu');
sg('s_w7a', 'W1', 'S7', [], [[789, 312]], 'S', 'cu');
sg('s_w7b', 'S7', 'FC1', [], [], 'S', 'cu');
sg('s_w7c', 'FC1', 'VP:win', [[2.5, 0.62, 0.63], [2.5, 0.75, 0.63]], [], 'S', 'cu');
sg('s_w4a', 'W1', 'S4', [[2.5, 1.85, -1.25]], [], 'S', 'cu');
sg('s_w4b', 'S4', 'HXc:in', [[1.3, 1.85, -1.25], [1.3, 1.85, 0.3]], [], 'S', 'cu');
sg('s_hxc', 'HXc:out', 'TT', [[1.7, 1.15, -0.32], [1.7, 1.38, -0.32]], [], 'M', 'cu');
sg('s_vpd', 'VP:dis', 'TT', [[2.05, 0.75, -0.32]], [[801, 514], [835, 514], [835, 656]], 'L', 'cu');
sg('s_tt', 'TT', 'TK:top', [[3.05, 1.38, -0.32], [3.05, 1.38, -0.55]], [], 'L', 'cu');
sg('s_s43a', 'VP:sump', 'S43', [[2.05, 0.45, 0.53], [2.05, 0.45, 0.75]], [[790, 615]], 'S', 'cu');
sg('s_s43b', 'S43', 'WASTE:s43', [[3.62, 0.45, 0.75], [3.62, 0.45, -0.38]], [[527, 615]], 'S', 'cu');
sg('s_of', 'TK:of', 'WASTE:of', [[3.62, 1.1, -0.55]], [[536, 656]], 'L', 'ss');
sg('s_mvw', 'MVJ', 'WASTE:mv', [[-2.2, 0.25, -1.55], [3.62, 0.25, -1.55], [3.62, 0.25, -0.72]], [[265, 617], [518, 617]], 'S', 'cu');

sg('s_rtd2', 'TK:rt', 'RTD2', [], [], 'T', 'ss', { stub: 1 });
sg('s_ch1', 'CH0', 'CH_TR2', [], [], 'S', 'cu');
sg('s_ch2', 'CH_TR2', 'CH_TR3', [], [], 'S', 'cu');
sg('s_ch3', 'CH_TR3', 'TK:f2', [[2.25, 0.45, -1.8], [2.25, 0.45, -0.55]], [[586, 591], [710, 591], [710, 709]], 'S', 'cu');

sg('s_jd0', 'JK:dr', 'RTD3', [], [], 'S', 'br');
sg('s_jd1', 'RTD3', 'ST3', [], [], 'S', 'br');
sg('s_jd2', 'ST3', 'TR2', [], [], 'S', 'br');
sg('s_jd3', 'TR2', 'CK3', [], [], 'S', 'br');
sg('s_jd4', 'CK3', 'CH_TR2', [[0.6, 0.45, -1.0]], [[438, 510]], 'S', 'cu');
sg('s_tr3', 'TR3', 'CH_TR3', [[-1.85, 4.42, -2.0], [-1.85, 0.62, -2.0], [1.4, 0.62, -2.0], [1.4, 0.62, -1.8]], [[586, 165]], 'T', 'pt');

/* ===== flow paths: [medium, segments...] ===== */
export const PATH: Record<string, string[]> = {
  SUP: ['steam', 's_src', 's_mv2', 's_st2', 's_h0', 's_h1', 's_s9a', 's_s9b'],
  DRIP: ['steam', 's_src', 's_mv2', 's_st2'],
  TR3: ['cond', 's_dl', 's_tr3', 's_ch3'],
  TR2: ['cond', 's_jd0', 's_jd1', 's_jd2', 's_jd3', 's_jd4', 's_ch2', 's_ch3'],
  OF: ['water', 's_of'],
  SEAL1: ['steam', 's_h0', 's_h1', 's_hx', 's_h3', 's_s35', 's_ds1'],
  SPRG1: ['steam', 's_sl1', 's_fc3', 's_s37', 's_s37b', 's_ex2', 's_ex3', 's_ex4', 's_ex5'],
  SPRG2: ['steam', 's_sl2', 's_fc4', 's_s38', 's_s38b', 's_ex3', 's_ex4', 's_ex5'],
  SEAL2: ['steam', 's_h0', 's_h1', 's_hx', 's_dd', 's_s36', 's_ds2'],
  S2: ['steam', 's_s2a', 's_s2b', 's_s2c', 's_cin'],
  EXs: ['steam', 's_dr', 's_dma', 's_dmb', 's_s3a', 's_ex1', 's_ex2', 's_ex3', 's_ex4', 's_ex5'],
  EXv: ['vac', 's_dr', 's_dma', 's_dmb', 's_s3a', 's_ex1', 's_ex2', 's_ex3', 's_ex4', 's_ex5'],
  HXO: ['cond', 's_hxo'],
  HXOa: ['air', 's_hxo'],
  VPD: ['cond', 's_vpd', 's_tt'],
  VPDw: ['water', 's_vpd', 's_tt'],
  AC: ['air', 's_ac1', 's_ac2', 's_ac3', 's_ex5'],
  S7: ['water', 's_w0', 's_w1', 's_w2', 's_w7a', 's_w7b', 's_w7c'],
  S4: ['water', 's_w0', 's_w1', 's_w2', 's_w4a', 's_w4b'],
  HXC: ['water', 's_hxc', 's_tt'],
  TR1: ['cond', 's_dr', 's_dma', 's_dmb', 's_tr1a', 's_tr1b', 's_ck4a', 's_ck4b', 's_ch1', 's_ch2', 's_ch3'],
  S40: ['cond', 's_dr', 's_dma', 's_s40a', 's_s40b', 's_ck4a', 's_ck4b', 's_ch1', 's_ch2', 's_ch3'],
  AIR: ['air', 's_atm1', 's_f1', 's_s1', 's_ck1', 's_cin'],
  RET1: ['vac', 's_sl1', 's_fc3', 's_s37', 's_s37b', 's_ex2', 's_ex3', 's_ex4', 's_ex5'],
  RET2: ['vac', 's_sl2', 's_fc4', 's_s38', 's_s38b', 's_ex3', 's_ex4', 's_ex5'],
  S43: ['water', 's_s43a', 's_s43b']
};
