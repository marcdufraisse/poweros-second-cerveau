#!/usr/bin/env python3
"""
Master audio de publication (demandé par l'utilisateur le 17/08 : « faut s'assurer
que le niveau audio soit bon pour être publié »).

Normalise un rendu aux standards des plateformes (Instagram / TikTok /
YouTube) : -14 LUFS intégré, true peak -1 dBTP, via loudnorm en deux passes
(mesure, puis application des valeurs mesurées). La vidéo est copiée telle
quelle, seul l'audio est réencodé — donc c'est rapide et sans perte d'image.

Un mix brut sort vers -23 LUFS : envoyé tel quel, il paraît deux fois moins
fort que tout ce qui l'entoure dans le fil.

Usage :
    python3 scripts/master.py video-projects/<slug>/renders/reel-v19.mp4
    python3 scripts/master.py --project <slug>        # dernier rendu non-master
    python3 scripts/master.py <src> <dst>
"""
import argparse, glob, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECTS = os.path.join(ROOT, "video-projects")
MASTER_RE = re.compile(r"-master\.(mp4|mov|webm)$", re.I)
TARGET_I, TARGET_TP, TARGET_LRA = -14.0, -1.0, 11.0


def measure(path):
    out = subprocess.run(["ffmpeg", "-v", "info", "-i", path, "-af",
                          f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    return json.loads(out[out.rindex("{"):out.rindex("}") + 1])


def newest_source(proj_dir):
    """Le dernier rendu qui n'est pas déjà un master."""
    files = [f for f in glob.glob(os.path.join(proj_dir, "renders", "*.mp4"))
             if not MASTER_RE.search(f)]
    return max(files, key=os.path.getmtime) if files else None


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("src", nargs="?", help="rendu à masteriser")
    ap.add_argument("dst", nargs="?", help="sortie (défaut : <src>-master.mp4)")
    ap.add_argument("--project", help="slug du projet (prend le dernier rendu non-master)")
    args = ap.parse_args()

    if args.project:
        proj_dir = os.path.join(PROJECTS, args.project)
        if not os.path.isdir(proj_dir):
            sys.exit(f"projet inconnu : {args.project}")
        src = newest_source(proj_dir)
        if not src:
            sys.exit(f"aucun rendu à masteriser dans {args.project}")
    elif args.src:
        src = os.path.abspath(args.src)
        if not os.path.isfile(src):
            sys.exit(f"fichier introuvable : {src}")
    else:
        ap.error("donner un chemin de rendu ou --project <slug>")

    dst = os.path.abspath(args.dst) if args.dst else re.sub(r"\.mp4$", "-master.mp4", src)
    if MASTER_RE.search(src):
        print(f"! {os.path.basename(src)} est déjà un master — on le re-masterise quand même")

    print(f"source : {os.path.relpath(src, ROOT)}")
    m = measure(src)
    print(f"avant  : {m['input_i']} LUFS · true peak {m['input_tp']} dBTP · LRA {m['input_lra']}")

    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-af",
                    (f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}"
                     f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
                     f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
                     f":offset={m['target_offset']}"),
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
                    "-movflags", "+faststart", dst], check=True)

    v = measure(dst)
    i, tp = float(v["input_i"]), float(v["input_tp"])
    print(f"après  : {v['input_i']} LUFS · true peak {v['input_tp']} dBTP → {os.path.relpath(dst, ROOT)}")
    ok = abs(i - TARGET_I) <= 1.5 and tp <= -0.8
    print("MASTER OK" if ok else f"ÉCHEC : cible {TARGET_I} LUFS / {TARGET_TP} dBTP non atteinte")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
