// src/App.tsx — ensamblado de la app AMSCO 400.
// Porte del bloque de aplicación del original (líneas ~1168-1176 estado,
// 1740-1876 lógica: select/ask/setMode/go/stop/play/teclado/tickS9 y el layout
// del body: header.top, .main (stage + rail), bloques learn/tape/cat/photos/
// sources y footer).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLang, tr } from './i18n';
import { CYCLES, CYC_NORMAL } from './data/phases';
import type { CycleMode } from './data/phases';
import { ND } from './data/placard';
import type { QItem } from './data/content';
import { stateOf, partOf, partOn, DDP } from './state/cycle';
import type { CycleState } from './state/cycle';
import { Stage } from './components/Stage';
import type { LabMode, ViewMode } from './components/Stage';
import { Rail } from './components/Rail';
import { Sections } from './components/Sections';
import { Viewer3D } from './components/Viewer3D';
import type { Viewer3DApi } from './components/Viewer3D';

// Centroide de los nodos 3D (p3) de una pieza: aproximación al "volar a la
// pieza" del original (api3.flyTo(id)), ya que la API portada de Viewer3D
// recibe coordenadas (x, y, z) en vez de un id.
function partCenter(id: string): [number, number, number] {
  let x = 0, y = 0, z = 0, n = 0;
  for (const nid of Object.keys(ND)) {
    if (partOf(nid) === id) {
      const p = ND[nid].p3;
      if (p) { x += p[0]; y += p[1]; z += p[2]; n++; }
    }
  }
  return n ? [x / n, y / n, z / n] : [0, 3, 0];
}

export default function App(): React.ReactElement {
  useLang();
  const [mode, setMode] = useState<CycleMode>('normal');
  const [idx, setIdx] = useState(0);
  const [doors, setDoors] = useState(1);
  const [vmode, setVmode] = useState<ViewMode>('3d');
  const [labMode, setLabMode] = useState<LabMode>('none');
  const [xray, setXray] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<string[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const [qActive, setQActive] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [s9On, setS9On] = useState(true);
  const [cam, setCam] = useState('general');

  const v3Ref = useRef<Viewer3DApi | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Estado del ciclo (S en el original): se recalcula con modo/paso/puertas/s9On.
  const list = CYCLES[mode];
  const cur = list[Math.min(idx, list.length - 1)];
  const S: CycleState = useMemo(() => stateOf(cur, { doors, s9On }), [cur, doors, s9On]);

  const stop = useCallback(() => setPlaying(false), []);

  const go = useCallback((d: number) => {
    const Lst = CYCLES[modeRef.current];
    setIdx((i) => (i + d + Lst.length) % Lst.length);
  }, []);

  // select(id, o) del original. Versión simple (SVG 2D, clic 3D, cerrar panel):
  // sin vuelo ni scroll. Los enlaces de texto/catálogo/vecinos usan selectFly.
  const select = useCallback((id: string | null, o?: { fly?: boolean; scroll?: boolean }) => {
    setSelected(id);
    if (id && !xrayRef.current && ['SB1', 'CS1', 'ST4', 'CHAMBER'].includes(id)) {
      setXray(true);
    }
    if (id && o && o.fly && vmodeRef.current === '3d') {
      const [x, y, z] = partCenter(id);
      v3Ref.current?.flyTo(x, y, z);
    }
    if (id && o && o.scroll) {
      document.getElementById('stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const xrayRef = useRef(xray);
  xrayRef.current = xray;
  const vmodeRef = useRef(vmode);
  vmodeRef.current = vmode;

  const selectFly = useCallback((id: string) => {
    setDoors((d) => {
      if (DDP.has(id) && d === 1) return 2;
      return d;
    });
    setHover(null);
    select(id, { fly: true, scroll: true });
  }, [select]);

  const handleMode = useCallback((m: CycleMode) => {
    stop();
    setQActive(null);
    setFocus([]);
    setMode(m);
    setIdx(0);
  }, [stop]);

  const handleStep = useCallback((i: number) => { stop(); setIdx(i); }, [stop]);

  const handleDoors = useCallback((n: number) => {
    setDoors(n);
    setSelected((prev) => (prev && !partOn(prev, n) ? null : prev));
    setFocus((prev) => prev.filter((p) => partOn(p, n)));
  }, []);

  const handleCam = useCallback((c: string) => {
    setCam(c);
    v3Ref.current?.flyView(c);
  }, []);

  // ask(q) del original.
  const ask = useCallback((q: QItem | null) => {
    stop();
    if (!q || qActiveRef.current === q.id) {
      setQActive(null);
      setFocus([]);
      v3Ref.current?.refresh();
      return;
    }
    setQActive(q.id);
    setFocus(q.focus.slice());
    if (modeRef.current !== 'normal') { setMode('normal'); setIdx(0); }
    setIdx(Math.max(0, CYC_NORMAL.findIndex((p) => p.id === q.step)));
    setSelected(null);
    if (vmodeRef.current === '3d') v3Ref.current?.flyView(q.cam);
  }, [stop]);

  const qActiveRef = useRef(qActive);
  qActiveRef.current = qActive;

  const togglePlay = useCallback(() => setPlaying((p) => !p), []);

  // Reproducción automática: un paso cada 5.2 s.
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => go(1), 5200);
    return () => window.clearInterval(t);
  }, [playing, go]);

  // tickS9 del original: S9/S4 intermitente (3600/2400 ms).
  useEffect(() => {
    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (reduce) return;
    let alive = true;
    const s9 = { v: true };
    const tick = () => {
      if (!alive) return;
      s9.v = !s9.v;
      setS9On(s9.v);
      window.setTimeout(tick, s9.v ? 3600 : 2400);
    };
    const t0 = window.setTimeout(tick, 3600);
    return () => { alive = false; window.clearTimeout(t0); };
  }, []);

  // Teclado: flechas para pasos, Escape para deseleccionar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest && t.closest('input,textarea,select')) return;
      if (e.key === 'ArrowRight') { stop(); go(1); }
      else if (e.key === 'ArrowLeft') { stop(); go(-1); }
      else if (e.key === 'Escape') setSelected((s) => (s ? null : s));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [stop, go]);

  // applyLang: título + lang del documento (los textos los re-renderiza React).
  const { lang, setLang } = useLang();
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = tr('docTitle');
  }, [lang]);

  return (
    <div className="wrap">
      <header className="top">
        <div className="intro">
          <h1>{tr('title')}</h1>
          <p className="lede">{tr('lede')}</p>
        </div>
        <div className="seg lang" role="group" aria-label={tr('langGroup')}>
          <button type="button" data-lang="es" aria-pressed={lang === 'es'} lang="es"
            onClick={() => setLang('es')}>Español</button>
          <button type="button" data-lang="en" aria-pressed={lang === 'en'} lang="en"
            onClick={() => setLang('en')}>English</button>
        </div>
      </header>

      <div className="main">
        <Stage
          mode={mode} onMode={handleMode}
          stepIdx={idx} onStep={handleStep}
          doors={doors} onDoors={handleDoors}
          viewMode={vmode} onViewMode={setVmode}
          labMode={labMode} onLabMode={setLabMode}
          xray={xray} onXray={setXray}
          cam={cam} onCam={handleCam}
          state={S}
          selected={selected} onSelect={select} onSelectFly={selectFly}
          onHover={setHover} focus={focus} hover={hover}
          view3d={
            <Viewer3D
              ref={v3Ref}
              state={S} doors={doors} cam={cam} labMode={labMode} xray={xray}
              onSelect={select}
            />
          }
        />
        <div className="rail">
          <Rail
            mode={mode} state={S} doors={doors} s9On={s9On}
            playing={playing} onPlay={togglePlay}
            qActive={qActive} onAsk={ask}
            onSelect={selectFly} onHover={setHover}
          />
        </div>
      </div>

      <Sections doors={doors} onSelect={selectFly} onDoors={handleDoors} />

      <footer><p>{tr('footer')}</p></footer>
    </div>
  );
}
