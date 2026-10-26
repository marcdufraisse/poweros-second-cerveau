#!/usr/bin/env python3
"""Exporte des slides HTML validées en PDF : une page 1920 x 1080 par slide, texte vectoriel.

Usage : python3 exporter_pdf.py (sous Windows : py exporter_pdf.py) <slides.html> [<sortie.pdf>]
Sans sortie, le PDF est posé à côté du HTML, même nom. Utilise Chrome, Edge, Brave ou Chromium en mode headless (Mac et Windows).
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

_PF = os.environ.get("PROGRAMFILES", r"C:\Program Files")
_PF86 = os.environ.get("PROGRAMFILES(X86)", r"C:\Program Files (x86)")
_LOCAL = os.environ.get("LOCALAPPDATA", "")
CHROMES = [
    # macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    # Windows (Edge est installé d'office sur Windows 10 et 11)
    os.path.join(_PF, "Google", "Chrome", "Application", "chrome.exe"),
    os.path.join(_PF86, "Google", "Chrome", "Application", "chrome.exe"),
    os.path.join(_LOCAL, "Google", "Chrome", "Application", "chrome.exe"),
    os.path.join(_PF86, "Microsoft", "Edge", "Application", "msedge.exe"),
    os.path.join(_PF, "Microsoft", "Edge", "Application", "msedge.exe"),
    os.path.join(_PF, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
]


def main() -> None:
    if len(sys.argv) not in (2, 3):
        sys.exit(__doc__)
    src = Path(sys.argv[1]).resolve()
    out = Path(sys.argv[2]).resolve() if len(sys.argv) == 3 else src.with_suffix(".pdf")
    chrome = next((c for c in CHROMES if c and Path(c).exists()), None)
    chrome = chrome or next((shutil.which(n) for n in ("google-chrome", "chromium", "chrome", "msedge") if shutil.which(n)), None)
    if not chrome:
        sys.exit("Aucun navigateur Chrome, Edge, Brave ou Chromium trouvé.")
    with tempfile.TemporaryDirectory() as profil:
        cmd = [chrome, "--headless=new", "--disable-gpu", "--no-sandbox", f"--user-data-dir={profil}",
               "--no-pdf-header-footer", "--virtual-time-budget=6000", f"--print-to-pdf={out}",
               src.as_uri() + "?pdf=1"]
        subprocess.run(cmd, check=True, capture_output=True, timeout=120)
    pages = len(re.findall(rb"/Type\s*/Page\b", out.read_bytes()))
    print(f"OK {out} ({out.stat().st_size // 1024} Ko, {pages} pages)")


if __name__ == "__main__":
    main()
