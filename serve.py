#!/usr/bin/env python3
"""Servidor local rapido para revisar el proyecto AMSCO 400.

Uso:
    python3 serve.py            # sirve en http://localhost:8080
    python3 serve.py 3000       # sirve en http://localhost:3000
    python3 serve.py --no-build # no compila, solo sirve lo que ya hay en dist/

Si no existe la carpeta dist/, instala dependencias (npm install) y
compila el proyecto (npm run build) automaticamente.
Funciona en Windows, macOS y Linux.
"""
import http.server
import os
import shutil
import subprocess
import sys
from functools import partial

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")
NODE_MODULES = os.path.join(ROOT, "node_modules")
PORT = 8080
IS_WIN = os.name == "nt"


def die(msg):
    sys.exit("!! " + msg)


def find_node():
    """Localiza node y npm (en Windows npm es npm.cmd)."""
    node = shutil.which("node")
    npm = shutil.which("npm") or (shutil.which("npm.cmd") if IS_WIN else None)
    if not node or not npm:
        die(
            "No encontre Node.js o npm en tu sistema.\n"
            "   1. Instalalo desde https://nodejs.org (version 20 o superior).\n"
            "   2. Cierra y vuelve a abrir la terminal.\n"
            "   3. Verifica con: node --version  y  npm --version"
        )
    return npm


def sh(exe, args):
    # En Windows la ruta del ejecutable suele tener espacios
    # ("C:\Program Files\..."): hay que entrecomillarla o el shell la parte.
    return '"%s" %s' % (exe, args) if IS_WIN else [exe] + args.split()


def run(cmd, what):
    print(">> " + what + "...")
    # En Windows los .cmd necesitan shell para resolverse bien.
    r = subprocess.run(cmd, cwd=ROOT, shell=IS_WIN)
    if r.returncode != 0:
        die("Fallo '" + what + "'. Revisa los errores de arriba.")


def ensure_built(npm):
    if os.path.isdir(DIST):
        return
    if not os.path.isdir(NODE_MODULES):
        run(sh(npm, "install"),
            "Instalando dependencias (npm install, solo la primera vez)")
    run(sh(npm, "run build"),
        "Compilando el proyecto (npm run build)")


def main():
    args = [a for a in sys.argv[1:] if a != "--no-build"]
    try:
        port = int(args[0]) if args else PORT
    except ValueError:
        die("Puerto invalido. Ejemplo: python3 serve.py 3000")

    if "--no-build" not in sys.argv[1:]:
        ensure_built(find_node())
    if not os.path.isdir(DIST):
        die("No existe dist/. Corre: npm run build")

    handler = partial(http.server.SimpleHTTPRequestHandler, directory=DIST)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    print(">> AMSCO 400 corriendo en: http://localhost:%d" % port)
    print("   Ctrl+C para detenerlo.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n>> Servidor detenido.")


if __name__ == "__main__":
    main()
