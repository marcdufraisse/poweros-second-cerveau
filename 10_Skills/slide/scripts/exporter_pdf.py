#!/usr/bin/env python3
"""Exporte des slides HTML validées en PDF : une page 1920 x 1080 par slide, texte vectoriel.

Usage : python3 exporter_pdf.py <slides.html> [<sortie.pdf>]
Sans sortie, le PDF est posé à côté du HTML, même nom. Utilise Google Chrome en mode headless.
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

CHROMES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
]


def main() -> None:
    if len(sys.argv) not in (2, 3):
        sys.exit(__doc__)
    src = Path(sys.argv[1]).resolve()
    out = Path(sys.argv[2]).resolve() if len(sys.argv) == 3 else src.with_suffix(".pdf")
    chrome = next((c for c in CHROMES if Path(c).exists()), None)
    if not chrome:
        sys.exit("Aucun Chrome, Brave ou Chromium trouvé dans /Applications.")
    with tempfile.TemporaryDirectory() as profil:
        cmd = [chrome, "--headless=new", "--disable-gpu", "--no-sandbox", f"--user-data-dir={profil}",
               "--no-pdf-header-footer", "--virtual-time-budget=6000", f"--print-to-pdf={out}",
               src.as_uri() + "?pdf=1"]
        subprocess.run(cmd, check=True, capture_output=True, timeout=120)
    pages = len(re.findall(rb"/Type\s*/Page\b", out.read_bytes()))
    print(f"OK {out} ({out.stat().st_size // 1024} Ko, {pages} pages)")


if __name__ == "__main__":
    main()
