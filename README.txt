============================================================
  AMSCO 400 - Modelo de ciclos de esterilizacion por vapor (STERIS)
============================================================

Proyecto en React que reconstruye el esterilizador STERIS AMSCO 400
Medium (prevacio y SFPP) en 3D y en placa 2D, con los 5 ciclos
completos paso a paso: que abre, que cierra, que lleva cada tubo.

Repositorio: https://github.com/7Silvah/AMSCO-400

Para clonarlo en tu computadora:
  git clone https://github.com/7Silvah/AMSCO-400.git
  cd AMSCO-400
  git checkout development   # rama activa de trabajo

----------------------------------------------------------------
1. QUE NECESITAS
----------------------------------------------------------------
- Node.js 20 o superior  (revisa con: node --version)
- npm (viene con Node)
- Python 3 (solo para la opcion B, servidor rapido)
- Git

----------------------------------------------------------------
2. COMO CORRERLO (elige una opcion)
----------------------------------------------------------------

OPCION A - Modo desarrollo (recomendado para trabajar)
  cd "AMSCO 400"
  npm install        # solo la primera vez
  npm run dev
  Abre: http://localhost:5173
  Los cambios que guardes se ven al instante en el navegador.

OPCION B - Servidor rapido con Python (revisar la version final)
  cd "AMSCO 400"
  python3 serve.py
  Abre: http://localhost:8080
  Compila el proyecto solo y lo sirve. Para otro puerto:
  python3 serve.py 3000

Otros comandos utiles:
  npm run build      # compila a la carpeta dist/
  npm run preview    # sirve la version compilada (vite)

----------------------------------------------------------------
3. COMO TRABAJAMOS ENTRE LOS DOS (ramas y PR)
----------------------------------------------------------------
Ramas:
  main          -> version estable. NO se trabaja directo aqui.
  development   -> rama activa donde se junta todo el trabajo.

Flujo para cada cambio:
  1. Ponte en development y actualiza:  git checkout development && git pull
  2. Crea tu rama de trabajo:            git checkout -b feature/nombre-corto
  3. Haz tus cambios y commitea:          git add . && git commit -m "Descripcion clara"
  4. Sube tu rama:                       git push -u origin feature/nombre-corto
  5. Abre un Pull Request hacia development, el otro lo revisa y lo aprueba.
  6. Cuando development este estable, se hace PR de development -> main.

Reglas:
  - Nunca commits directos en main ni en development; todo pasa por rama + PR.
  - Una rama = un cambio. Nombres cortos: feature/, fix/, docs/.
  - Los mensajes de commit en espanol y claros: que cambio y por que.

----------------------------------------------------------------
4. ESTRUCTURA DEL PROYECTO
----------------------------------------------------------------
  src/data/placard.ts     Nodos ND, segmentos SG y rutas PATH (datos de la placa)
  src/data/phases.ts      Fases PH_* y los 5 ciclos (normal, leak, dartw, dart, serv)
  src/data/content.ts     Textos en espanol/ingles (piezas, pasos, preguntas, cinta)
  src/state/cycle.ts      Logica pura del ciclo: que esta abierto, que fluye
  src/i18n.tsx            Idioma ES/EN con memoria en el navegador
  src/components/Viewer3D.tsx      Visor 3D (three.js)
  src/components/Schematic2D.tsx   Placa 2D animada
  src/components/Stage.tsx         Barra de herramientas, modos y pasos del ciclo
  src/components/DetailPanel.tsx   Detalle de cada pieza
  src/components/Rail.tsx          Preguntas guiadas, lecturas y grafica
  src/components/Sections.tsx      Aprende, cinta, catalogo, fotos, fuentes
  src/App.tsx             Estado global y armado de la pagina
  src/index.css           Estilos y temas claro/oscuro
  reference/              HTML original intacto, para comparar

----------------------------------------------------------------
5. NOTAS
----------------------------------------------------------------
- El puerto por defecto del servidor Python es 8080 (cambiable).
- La logica de estado esta probada identica al original (212 + 1152 chequeos).
- Dudas o ideas: abre un issue o mencionalo en el chat.
============================================================
