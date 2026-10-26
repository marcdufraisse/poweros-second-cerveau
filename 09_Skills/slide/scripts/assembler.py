#!/usr/bin/env python3
"""Assemble des slides autonomes : remplace {{FONTS}}, {{LOGO}}, {{NOM}} et {{TITRE}} du modèle.

Usage : python3 assembler.py <modele.html> <sortie.html> "<Titre des slides>" --nom "<Nom affiché>" [--logo <logo.png>]
Sans --logo, le script cherche 02_Contexte/Branding/logo.png en remontant l'arborescence. Sans logo, seul le nom s'affiche.
Le fichier de sortie n'a plus aucune dépendance : polices Outfit et JetBrains Mono et logo sont embarqués.
"""
from __future__ import annotations

import argparse
import base64
from pathlib import Path

RES = Path(__file__).resolve().parent.parent / "ressources"
WEIGHTS = [400, 500, 600, 700, 800]
MIMES = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp"}


def b64(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("ascii")


def trouver_logo() -> Path | None:
    for parent in [Path.cwd().resolve(), *Path.cwd().resolve().parents]:
        for ext in MIMES:
            cand = parent / "02_Contexte/Branding" / f"logo{ext}"
            if cand.exists():
                return cand
    return None


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("modele")
    ap.add_argument("sortie")
    ap.add_argument("titre")
    ap.add_argument("--nom", default="")
    ap.add_argument("--logo")
    a = ap.parse_args()

    fonts = "\n".join(
        "@font-face { font-family: Outfit; font-weight: %d; font-display: block; "
        "src: url(data:font/woff2;base64,%s) format('woff2'); }" % (w, b64(RES / "fonts" / f"Outfit-{w}.woff2"))
        for w in WEIGHTS
    )
    fonts += ("\n@font-face { font-family: 'JetBrains Mono'; font-weight: 700; font-display: block; "
              "src: url(data:font/woff2;base64,%s) format('woff2'); }" % b64(RES / "fonts" / "JetBrainsMono-700.woff2"))

    logo_path = Path(a.logo) if a.logo else trouver_logo()
    logo = ""
    if logo_path and logo_path.exists():
        mime = MIMES.get(logo_path.suffix.lower(), "image/png")
        logo = '<img src="data:%s;base64,%s" alt="">' % (mime, b64(logo_path))

    html = Path(a.modele).read_text(encoding="utf-8")
    for cle, val in (("{{FONTS}}", fonts), ("{{LOGO}}", logo), ("{{NOM}}", a.nom), ("{{TITRE}}", a.titre)):
        html = html.replace(cle, val)
    sortie = Path(a.sortie)
    sortie.parent.mkdir(parents=True, exist_ok=True)
    sortie.write_text(html, encoding="utf-8")
    print(f"OK {sortie} ({sortie.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
