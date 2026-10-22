#!/usr/bin/env python3
"""
Auto-vérification d'un rendu (demandée par l'utilisateur le 17/08 : « la plupart des
choses que je te dis, tu aurais pu t'en rendre compte toi-même en regardant ou
écoutant la vidéo »).

Vit dans scripts/ et pas dans le projet : la recette disait « copier ce fichier
dans chaque projet et adapter ses mots-sentinelles », et le résultat était
qu'un seul projet sur quatre pouvait être vérifié — les autres copies
n'existaient pas, et celles qui auraient existé auraient divergé. Un seul
fichier, la configuration dans le meta.json du projet.

PASSE 1 — audio : re-transcrit le rendu (whisper) et vérifie
  - que chaque mot-sentinelle est présent (mots de fin de phrase, les premiers
    à sauter quand une coupe est trop courte)
  - qu'aucune phrase ne se répète (prises multiples restées au montage)
  - que la parole se termine près de la fin de la vidéo (pas de queue morte)
PASSE 2 — image : échantillonne des frames et vérifie que la zone haute
  (illustrations) n'est jamais visuellement vide (flottement). Verticaux
  seulement, sauf indication contraire.
PASSE 3 — niveau : -14 LUFS intégré, true peak <= -1 dBTP. Bloquant sur un
  master, informatif sur un draft (un draft n'est pas censé être au niveau).

Usage :
    python3 scripts/autoverify.py video-projects/<slug>/renders/reel-v19.mp4
    python3 scripts/autoverify.py --project <slug>          # dernier rendu
    python3 scripts/autoverify.py --project <slug> --master # dernier master

Configuration, dans le meta.json du projet (tout est optionnel) :
    "language": "fr",
    "verify": {
      "sentinels": ["résultat", "CapCut"],   # sinon déduits du transcript
      "forbiddenRepeats": ["si tu veux faire"],
      "topZone": true,                        # false pour couper la passe 2
      "tailMax": 1.6                          # secondes de queue tolérées
    }
"""
import argparse, glob, json, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, "models")
PROJECTS = os.path.join(ROOT, "video-projects")
MASTER_RE = re.compile(r"-master\.(mp4|mov|webm)$", re.I)


def sh(args, **kw):
    return subprocess.run(args, capture_output=True, text=True, **kw)


def newest_render(proj_dir, master_only=False):
    files = glob.glob(os.path.join(proj_dir, "renders", "*.mp4"))
    files += glob.glob(os.path.join(proj_dir, "renders", "final", "*.mp4"))
    if master_only:
        files = [f for f in files if MASTER_RE.search(f)]
    if not files:
        return None
    return max(files, key=os.path.getmtime)


def load_meta(proj_dir):
    try:
        with open(os.path.join(proj_dir, "meta.json"), encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return {}


def derive_sentinels(proj_dir, cap=20):
    """
    À défaut de liste écrite à la main, les mots-sentinelles se déduisent du
    transcript : le dernier mot de chaque phrase est celui qu'une coupe trop
    courte emporte en premier. C'est ce qui rend l'outil utilisable sur un
    projet neuf sans rien configurer.
    """
    # Uniquement le transcript du MONTAGE. Un transcript de rush (raw.json)
    # contient les phrases qu'on a coupées exprès et les prises abandonnées :
    # en tirer des mots-sentinelles ferait échouer la vérification sur du
    # contenu supprimé volontairement. Si le projet n'a que son rush, on le dit
    # et on laisse la liste à meta.json plutôt que d'inventer.
    assets = os.path.join(proj_dir, "assets")
    preferred = ["transcript.json", "edit.json", "edited.json", "clean.json"]
    found = sorted(os.path.basename(f) for f in glob.glob(os.path.join(assets, "*.json")))
    order = [n for n in preferred if n in found]
    order += [n for n in found
              if n not in preferred and re.search(r"(edit|clean|monta)", n, re.I)]
    for name in order:
        p = os.path.join(assets, name)
        if not os.path.isfile(p):
            continue
        try:
            with open(p, encoding="utf-8") as fh:
                data = json.load(fh)
        except Exception:
            continue
        words = [w for w in data.get("words", []) if w.get("type", "word") == "word"]
        if not words:
            continue
        # Un mot de fin de segment, c'est soit une ponctuation forte, soit un
        # blanc qui suit — et dans un transcript whisper le blanc est le signal
        # le plus fiable des deux. Ce sont ces mots-là qu'une coupe trop courte
        # emporte en premier, donc ceux qu'il faut retrouver dans le rendu.
        def clean(t):
            return re.sub(r"[^\wÀ-ÿ'-]", "", str(t or "").strip())

        out = []
        for i, w in enumerate(words):
            t = clean(w.get("text"))
            if len(t) <= 4:
                continue
            ends_sentence = bool(re.search(r"[.!?]$", str(w.get("text", "")).strip()))
            gap_after = False
            try:
                if i + 1 < len(words):
                    gap_after = float(words[i + 1]["start"]) - float(w["end"]) > 0.35
                else:
                    gap_after = True
            except (KeyError, TypeError, ValueError):
                pass
            if ends_sentence or gap_after:
                out.append(t)
        seen, uniq = set(), []
        for w in out:
            k = w.lower()
            if k in seen:
                continue
            seen.add(k)
            uniq.append(w)
        if uniq:
            return uniq[:cap], f"déduits du transcript ({name})"
    return [], "aucun transcript de montage (un rush ne fait pas foi) — les lister dans meta.json \"verify.sentinels\""


def has_audio(path):
    """
    Une démo graphique n'a pas de piste son. Sans ce test, l'extraction audio
    échoue et le script casse avec une trace — alors que la bonne réponse est
    « ces passes ne s'appliquent pas ».
    """
    out = sh(["ffprobe", "-v", "error", "-select_streams", "a",
              "-show_entries", "stream=index", "-of", "csv=p=0", path]).stdout.strip()
    return bool(out)


def probe_dims(path):
    out = sh(["ffprobe", "-v", "error", "-select_streams", "v:0",
              "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", path]).stdout.strip()
    try:
        w, h = out.split("x")[:2]
        return int(w), int(h)
    except Exception:
        return 0, 0


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("video", nargs="?", help="chemin du rendu")
    ap.add_argument("--project", help="slug du projet (prend le dernier rendu)")
    ap.add_argument("--master", action="store_true", help="avec --project : dernier master")
    ap.add_argument("--language", help="langue de la re-transcription (défaut : meta.json ou fr)")
    args = ap.parse_args()

    if args.project:
        proj_dir = os.path.join(PROJECTS, args.project)
        if not os.path.isdir(proj_dir):
            sys.exit(f"projet inconnu : {args.project}")
        video = newest_render(proj_dir, args.master)
        if not video:
            sys.exit(f"aucun rendu{' master' if args.master else ''} dans {args.project}")
    elif args.video:
        video = os.path.abspath(args.video)
        if not os.path.isfile(video):
            sys.exit(f"fichier introuvable : {video}")
        proj_dir = video
        while proj_dir != "/" and os.path.dirname(proj_dir) != PROJECTS:
            proj_dir = os.path.dirname(proj_dir)
        if not os.path.isdir(proj_dir):
            proj_dir = os.path.dirname(os.path.dirname(video))
    else:
        ap.error("donner un chemin de rendu ou --project <slug>")

    meta = load_meta(proj_dir)
    cfg = meta.get("verify", {}) or {}
    lang = args.language or cfg.get("language") or meta.get("language") or "fr"
    tail_max = float(cfg.get("tailMax", 1.6))
    is_master = bool(MASTER_RE.search(video))

    print(f"projet   : {os.path.basename(proj_dir)}")
    print(f"rendu    : {os.path.relpath(video, ROOT)}{'  (master)' if is_master else '  (draft)'}\n")

    fails, oks, warns = [], [], []

    dur = float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                    "-of", "csv=p=0", video]).stdout.strip() or 0)
    width, height = probe_dims(video)

    audio = has_audio(video)
    if not audio:
        warns.append("aucune piste audio : passes parole et niveau sans objet")

    # ---------------------------------------------------------------- PASSE 1
    wav = tempfile.mktemp(suffix=".wav")
    out = ""
    if audio:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", video, "-vn", "-ac", "1",
                        "-ar", "16000", "-c:a", "pcm_s16le", wav], check=True)
        model = os.path.join(MODELS, "ggml-large-v3-turbo.bin")
        vad = os.path.join(MODELS, "ggml-silero-v5.1.2.bin")
        whisper = ["whisper-cli", "-m", model, "-f", wav, "-l", lang, "-np"]
        if os.path.isfile(vad):
            whisper += ["--vad", "-vm", vad]
        out = sh(whisper).stdout
        os.unlink(wav)
    text = " ".join(re.sub(r"\[.*?\]", "", l).strip() for l in out.splitlines() if l.strip())
    norm = text.lower()
    if audio:
        print("— transcript du rendu —\n" + text.strip()[:600] + "\n")

    sentinels = cfg.get("sentinels") if audio else []
    origin = "meta.json"
    if audio and not sentinels:
        sentinels, origin = derive_sentinels(proj_dir)
    if sentinels:
        print(f"— {len(sentinels)} mots-sentinelles ({origin}) —\n")
        for s in sentinels:
            alts = [s.lower()] + (["cloud", "claude"] if s.lower() in ("claude", "cloud") else [])
            if any(a in norm for a in alts):
                oks.append(f"mot présent : {s}")
            else:
                fails.append(f"MOT MANQUANT ou coupé : « {s} »")
    elif audio:
        warns.append("passe mots-sentinelles ignorée : " + origin)

    for ph in (cfg.get("forbiddenRepeats", []) if audio else []):
        n = norm.count(ph.lower())
        if n > 1:
            fails.append(f"RÉPÉTITION : « {ph} » apparaît {n} fois (garder la dernière prise)")
        else:
            oks.append(f"pas de répétition : « {ph} »")

    stamps = list(re.finditer(r"\[(\d\d):(\d\d):(\d\d)\.(\d{3}) --> (\d\d):(\d\d):(\d\d)\.(\d{3})\]", out))
    if stamps:
        g = stamps[-1].groups()
        last_end = int(g[4]) * 3600 + int(g[5]) * 60 + int(g[6]) + int(g[7]) / 1000
        tail = dur - last_end
        if tail > tail_max:
            fails.append(f"QUEUE MORTE : {tail:.1f}s après la fin de parole ({last_end:.1f}s / {dur:.1f}s)")
        else:
            oks.append(f"fin propre : parole à {last_end:.1f}s, vidéo à {dur:.1f}s")

    # ---------------------------------------------------------------- PASSE 2
    # La zone haute n'a de sens que sur un vertical à carte (le visage occupe
    # le tiers bas, le haut porte les illustrations). Sur un 16:9 l'image est
    # pleine : le test n'aurait rien à dire.
    top_zone = cfg.get("topZone", height > width)
    if top_zone and dur > 2 and height:
        crop_h = int(cfg.get("topZoneHeight", height * 0.45))
        crop_y = int(cfg.get("topZoneY", height * 0.03))
        probe = []
        for t in range(1, int(dur), 2):
            png = tempfile.mktemp(suffix=".png")
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(t), "-i", video,
                            "-frames:v", "1", "-vf",
                            f"crop={width}:{crop_h}:0:{crop_y},scale=54:50,format=gray", png],
                           check=True)
            st = sh(["ffmpeg", "-v", "error", "-i", png, "-vf",
                     "signalstats,metadata=print:file=-", "-f", "null", "-"]).stdout
            lo, hi = re.search(r"YMIN=(\d+)", st), re.search(r"YMAX=(\d+)", st)
            if lo and hi:
                probe.append((t, int(hi.group(1)) - int(lo.group(1))))
            os.unlink(png)
        empty = [t for t, spread in probe if spread < int(cfg.get("minSpread", 26))]
        if empty:
            fails.append(f"ZONE HAUTE quasi vide (flottement) aux secondes : {empty}")
        elif probe:
            oks.append(f"zone haute vivante sur {len(probe)} échantillons")
    elif not top_zone:
        oks.append("zone haute : non applicable (format horizontal)")

    # ---------------------------------------------------------------- PASSE 3
    ln = sh(["ffmpeg", "-v", "info", "-i", video, "-af",
             "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"]).stderr if audio else ""
    try:
        lj = json.loads(ln[ln.rindex("{"):ln.rindex("}") + 1])
        li, ltp = float(lj["input_i"]), float(lj["input_tp"])
        if abs(li - (-14.0)) <= 1.5 and ltp <= -0.8:
            oks.append(f"niveau publiable : {li:.1f} LUFS, true peak {ltp:.1f} dBTP")
        else:
            msg = (f"{li:.1f} LUFS (cible -14 ±1.5), true peak {ltp:.1f} dBTP (max -1) "
                   f"— passer scripts/master.py")
            # Un draft n'est pas censé être au niveau : ce serait un faux
            # échec. Sur un master, c'est bloquant : c'est le fichier publié.
            (fails if is_master else warns).append(("NIVEAU AUDIO non publiable : " if is_master
                                                    else "niveau non masterisé : ") + msg)
    except ValueError:
        if audio:
            warns.append("niveau audio : mesure loudnorm illisible")

    print("— RAPPORT —")
    for o in oks:
        print("  ✓", o)
    for w in warns:
        print("  !", w)
    for f in fails:
        print("  ✗", f)
    print(f"\n{'ÉCHEC' if fails else 'PASS'} — {len(fails)} problème(s), "
          f"{len(oks)} vérifs ok, {len(warns)} avertissement(s)")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
