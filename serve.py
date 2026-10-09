#!/usr/bin/env python3
"""Servidor local rapido para revisar el proyecto AMSCO 400.

Uso:
    python3 serve.py            # sirve en http://localhost:8080
    python3 serve.py 3000       # sirve en http://localhost:3000
    python3 serve.py --no-build # no compila, solo sirve lo que ya hay en dist/

Si no existe la carpeta dist/, compila el proyecto primero (npm run build).
"""
import http.server
import os
import subprocess
import sys
from functools import partial

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")
PORT = 8080


def build():
    print(">> Compilando el proyecto (npm run build)...")
    r = subprocess.run(["npm", "run", "build"], cwd=ROOT)
    if r.returncode != 0:
        sys.exit("!! La compilacion fallo. Revisa los errores de arriba.")


def main():
    args = [a for a in sys.argv[1:] if a != "--no-build"]
    port = int(args[0]) if args else PORT
    if "--no-build" not in sys.argv[1:] and not os.path.isdir(DIST):
        build()
    if not os.path.isdir(DIST):
        sys.exit("!! No existe dist/. Corre: npm run build")

    handler = partial(http.server.SimpleHTTPRequestHandler, directory=DIST)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    print(f">> AMSCO 400 corriendo en: http://localhost:{port}")
    print("   Ctrl+C para detenerlo.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n>> Servidor detenido.")


if __name__ == "__main__":
    main()
