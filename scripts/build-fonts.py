#!/usr/bin/env python3
"""Download and slim the two web fonts used by the site.

Fonts (both SIL Open Font License, served by Google Fonts):
  - Cormorant Garamond (display serif): roman and italic as variable fonts,
    weights 400-600.
  - Manrope (text and interface sans): variable font, weights 400-600.

Only the Latin subset is kept. Output goes to site/assets/fonts/.

Requires: pip install fonttools brotli
Run from the project root: python3 scripts/build-fonts.py
"""
import io
import pathlib
import re
import urllib.request

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "assets" / "fonts"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/130.0 Safari/537.36")

FAMILIES = {
    "Cormorant Garamond": "family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700",
    "Manrope": "family=Manrope:wght@200..800",
}

# (family, style) -> (output file, axis limits)
TARGETS = {
    ("Cormorant Garamond", "normal"): ("cormorant-roman.woff2", {"wght": (400, 600)}),
    ("Cormorant Garamond", "italic"): ("cormorant-italic.woff2", {"wght": (400, 600)}),
    ("Manrope", "normal"): ("manrope.woff2", {"wght": (400, 600)}),
}


def fetch(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as res:
        data = res.read()
    return data if binary else data.decode("utf-8")


def latin_faces(query):
    css = fetch(f"https://fonts.googleapis.com/css2?{query}&display=swap")
    for subset, body in re.findall(r"/\* ([\w-]+) \*/\s*@font-face\s*{([^}]*)}", css):
        if subset != "latin":
            continue
        style = re.search(r"font-style: (\w+)", body).group(1)
        url = re.search(r"url\((https://[^)]+)\)", body).group(1)
        yield style, url


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for family, query in FAMILIES.items():
        for style, url in latin_faces(query):
            target = TARGETS.get((family, style))
            if not target:
                continue
            filename, limits = target
            font = TTFont(io.BytesIO(fetch(url, binary=True)))
            font = instancer.instantiateVariableFont(font, limits)
            font.flavor = "woff2"
            font.save(OUT / filename)
            print(f"{filename}: {(OUT / filename).stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
