# AMSCO 400 — Steam Sterilization Cycle Graphs (STERIS)

Modelo interactivo del esterilizador por vapor **AMSCO 400**: muestra todos los
ciclos (prevacío, prueba de fugas, DART warm-up, DART/Bowie-Dick, servicio) y
qué hace cada pieza en cada etapa. Refactorización a **React + TypeScript**
del archivo monolítico original `reference/AMSCO_400_por_dentro.html`.

## Cómo correrlo

```bash
npm install
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # compilación de producción (tsc + vite)
```

Requisitos: Node 18+.

## Mapa del proyecto

```
src/
├── main.tsx                 # punto de entrada (LangProvider + App)
├── App.tsx                  # estado global: modo, paso, puertas, vista, selección,
│                            #   reproducción (5.2 s) y tick S9 (3600/2400 ms)
├── i18n.tsx                 # contexto ES/EN (tr/L), persiste en localStorage
├── index.css                # CSS del original (variables, tema claro/oscuro)
├── data/
│   ├── placard.ts           # ND (nodos), SG (segmentos), PATH (rutas de flujo)
│   ├── phases.ts            # PH_* (fases), CYC_* (los 5 ciclos)
│   └── content.ts           # UI, INFO, STEP, TRACE, QS, LEARN, FIXES, TAPE,
│                            #   GROUPS, PHOTOS, SOURCES, PARTNO, GV, …
├── state/
│   └── cycle.ts             # lógica pura: stateOf, stateText, activeParts,
│                            #   neighbors, partOf, SOL_ORDER, GRPMAP, DDP, …
└── components/
    ├── Viewer3D.tsx         # visor three.js r128 (escena, partículas, picking)
    ├── Schematic2D.tsx     # placa 2D en SVG
    ├── Stage.tsx            # toolbar, vista, modos de ciclo, stepbar, leyenda
    ├── DetailPanel.tsx      # detalle de la pieza seleccionada
    ├── Rail.tsx             # preguntas guiadas, lecturas, gráfica, estados, play
    └── Sections.tsx         # Learn, Tape, Catalog, Photos, Sources
reference/
└── AMSCO_400_por_dentro.html  # original intacto (solo consulta)
```

## Qué se portó verbatim y qué se adaptó

**Verbatim (comportamiento 1:1, verificado por comparación):**
- Todos los datos: 99 nodos, 91 segmentos, 26 rutas PATH, 60 entradas INFO,
  53 pasos STEP, 12 preguntas, 165 claves UI por idioma, fases por ciclo
  (12/11/12/12/6).
- La lógica de estado (`stateOf`, `stateText`, `activeParts`, `neighbors`…):
  comprobada idéntica en 212 combinaciones de fase/puertas/S9.
- El CSS, los textos ES/EN y los shaders de flujo del 3D.

**Adaptaciones inevitables al pasar a React:**
- Los globales del original (`doors`, `s9On`, `tr`) ahora son parámetros o
  contexto: p. ej. `stateOf(ph, { doors, s9On })`, `stateText(id, St, tr, L, doors)`.
- El `apply()` imperativo del 2D se reemplazó por re-render declarativo desde props.
- `OrbitControls` se importa de `three/examples/jsm/...` (la ruta `js` de r128
  es un script no modular sin exports; es la misma clase).
- `flyTo(id)` del original recibe coordenadas `(x, y, z)` en la API portada;
  `App` calcula el centroide de los nodos 3D de la pieza para volar a ella.
- El bug del original con `STEP.l1/l2/l9/l10` (nulos en la prueba de fugas) se
  mapea a su fase equivalente para no romper el render.

## Ramas

- `main` — scaffold limpio (punto de partida).
- `development` — rama de trabajo (activa). El trabajo futuro va aquí y se
  fusiona a `main` cuando esté estable.
