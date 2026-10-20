#!/usr/bin/env python3
"""Download and slim the one web font used by the site.

Manrope (SIL Open Font License, served by Google Fonts): the variable font,
limited to weights 400-700 and the Latin subset. Output goes to
site/assets/fonts/manrope.woff2.

Requires: pip install fonttools brotli
Run from the coolcare folder: python3 scripts/build-fonts.py
"""
import io
import pathlib
import re
import urllib.request

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "assets" / "fonts" / "manrope.woff2"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/130.0 Safari/537.36")
QUERY = "family=Manrope:wght@200..800"
WEIGHTS = (400, 700)


def fetch(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as res:
        data = res.read()
    return data if binary else data.decode("utf-8")


def latin_url():
    css = fetch(f"https://fonts.googleapis.com/css2?{QUERY}&display=swap")
    for subset, body in re.findall(r"/\* ([\w-]+) \*/\s*@font-face\s*{([^}]*)}", css):
        if subset == "latin":
            return re.search(r"url\((https://[^)]+)\)", body).group(1)
    raise SystemExit("No Latin Manrope face found in the Google Fonts response")


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    font = TTFont(io.BytesIO(fetch(latin_url(), binary=True)))
    font = instancer.instantiateVariableFont(font, {"wght": WEIGHTS})
    font.flavor = "woff2"
    font.save(OUT)
    print(f"{OUT.name}: {OUT.stat().st_size / 1024:.1f} KB, weights {WEIGHTS[0]}-{WEIGHTS[1]}")


if __name__ == "__main__":
    main()
