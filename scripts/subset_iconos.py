"""Genera una fuente de iconos con SOLO los iconos que usa la página.

La fuente completa de Tabler pesa ~528 KB (más de 5.000 iconos). Con señal lenta eso es demasiado
para unos 60 iconos. Este script:

  1. busca en el código todas las clases `ti-nombre` que se usan,
  2. recorta la fuente a esos iconos (fontTools),
  3. escribe `public/fonts/iconos.woff2` y `src/iconos.css`.

Uso (desde la carpeta frontend):  npm run iconos
Hay que volver a correrlo cuando se agrega un icono nuevo.
Requiere:  pip install fonttools brotli
"""
import os
import re
import sys
from pathlib import Path

from fontTools import subset

FRONTEND = Path(__file__).resolve().parents[1]
RAIZ = FRONTEND.parent
DIST = FRONTEND / "node_modules" / "@tabler" / "icons-webfont" / "dist"
FUENTE = DIST / "fonts" / "tabler-icons.woff2"
CSS_TABLER = DIST / "tabler-icons.css"

# Algunos iconos no están escritos en este código: vienen de la base de datos (el backend los define,
# por ejemplo en las preguntas del test). El backend vive en otro repositorio, así que:
#   - si se encuentra (carpeta hermana `backend/app` o la que indique GUIA_BACKEND), se lee y se actualiza
#     la lista guardada `scripts/iconos-del-backend.txt`;
#   - si no, se usa esa lista guardada, para no perder ningún icono.
BACKEND = Path(os.getenv("GUIA_BACKEND", RAIZ / "backend" / "app"))
LISTA_BACKEND = FRONTEND / "scripts" / "iconos-del-backend.txt"
CARPETAS = [FRONTEND / "src", FRONTEND / "index.html"]
EXTENSIONES = {".vue", ".js", ".css", ".html", ".py"}
_PATRON = re.compile(r"\bti-([a-z0-9]+(?:-[a-z0-9]+)*)")


def _buscar(base: Path) -> set[str]:
    nombres: set[str] = set()
    archivos = [base] if base.is_file() else [p for p in base.rglob("*") if p.suffix in EXTENSIONES]
    for archivo in archivos:
        if archivo.name == "iconos.css":
            continue  # es la salida de este mismo script
        nombres.update(_PATRON.findall(archivo.read_text(encoding="utf-8", errors="ignore")))
    return nombres


def usados() -> set[str]:
    nombres: set[str] = set()
    for base in CARPETAS:
        nombres |= _buscar(base)
    if BACKEND.exists():
        del_backend = _buscar(BACKEND)
        LISTA_BACKEND.write_text("\n".join(sorted(del_backend)) + "\n", encoding="utf-8")
    elif LISTA_BACKEND.exists():
        del_backend = set(LISTA_BACKEND.read_text(encoding="utf-8").split())
        print("No encontré el backend: uso la lista guardada en scripts/iconos-del-backend.txt")
    else:
        del_backend = set()
        print("AVISO: no encontré el backend ni la lista guardada: los iconos que define el backend podrían faltar.")
    return nombres | del_backend


def codigos() -> dict[str, int]:
    """nombre -> punto de código, leído del CSS oficial de Tabler."""
    texto = CSS_TABLER.read_text(encoding="utf-8")
    pares = re.findall(r"\.ti-([a-z0-9-]+):before\s*\{\s*content:\s*\"\\([0-9a-fA-F]+)\"", texto)
    return {nombre: int(codigo, 16) for nombre, codigo in pares}


def main() -> int:
    todos = codigos()
    pedidos = usados()
    existentes = sorted(n for n in pedidos if n in todos)
    # Los que no existen en Tabler suelen ser clases de otra cosa (ti-spin, etc.): se avisan, no se rompen.
    ausentes = sorted(n for n in pedidos if n not in todos and n not in {"spin"})

    opciones = subset.Options()
    opciones.flavor = "woff2"
    opciones.layout_features = []
    opciones.glyph_names = False
    opciones.notdef_outline = False
    fuente = subset.load_font(str(FUENTE), opciones)
    subsetter = subset.Subsetter(opciones)
    subsetter.populate(unicodes=[todos[n] for n in existentes])
    subsetter.subset(fuente)

    destino_fuente = FRONTEND / "public" / "fonts" / "iconos.woff2"
    destino_fuente.parent.mkdir(parents=True, exist_ok=True)
    subset.save_font(fuente, str(destino_fuente), opciones)

    reglas = "\n".join(f'.ti-{n}:before {{ content: "\\{todos[n]:x}"; }}' for n in existentes)
    css = (
        "/* Generado por scripts/subset_iconos.py: no editar a mano. */\n"
        '@font-face {\n  font-family: "ti-subset";\n  font-style: normal;\n  font-weight: 400;\n'
        '  font-display: swap;\n  src: url("/fonts/iconos.woff2") format("woff2");\n}\n'
        '.ti {\n  font-family: "ti-subset" !important;\n  speak: none;\n  font-style: normal;\n'
        "  font-weight: normal;\n  font-variant: normal;\n  text-transform: none;\n  line-height: 1;\n"
        "  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n"
        f"{reglas}\n"
    )
    (FRONTEND / "src" / "iconos.css").write_text(css, encoding="utf-8")

    kb = destino_fuente.stat().st_size / 1024
    print(f"{len(existentes)} iconos -> {destino_fuente.name} ({kb:.1f} KB, antes ~528 KB)")
    if ausentes:
        print("Clases ti-* sin icono en Tabler (se ignoran):", ", ".join(ausentes))
    return 0


if __name__ == "__main__":
    sys.exit(main())
