#!/usr/bin/env python3
"""One-off: download open datasets and write compact derived files into src/data/.
Run only when you want to refresh the data (needs internet); build.py works offline from the outputs.

Sources (see src/data/ATTRIBUTION.md):
  - kanji.json  by davidluzgouveia/kanji-data (KANJIDIC-derived, CC BY-SA 4.0 via EDRDG; JLPT levels from tanos.co.uk)
  - KanjiVG stroke-order SVGs (CC BY-SA 3.0, Ulrich Apel)
"""
import json, pathlib, re, sys, time, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "src" / "data"
OUT.mkdir(parents=True, exist_ok=True)
KANJI_URL = "https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji.json"
KVG_URL = "https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/{:05x}.svg"

def get(url):
    for i in range(4):
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                return r.read().decode("utf-8")
        except Exception as e:  # noqa
            if "404" in str(e):
                return None
            time.sleep(2 ** i)
    return None

def kata(s):
    return "".join(chr(ord(c) + 0x60) if "ぁ" <= c <= "ゖ" else c for c in s)

def clean(xs):
    return [x for x in (xs or []) if not x.startswith("!")]

def kanji():
    sys.path.insert(0, str(HERE))
    raw = json.loads(get(KANJI_URL))
    n5_curated = set(re.findall(r'^\["(.)"', (HERE / "src" / "data_kanji.js").read_text(encoding="utf-8"), re.M))
    rows = []
    for k, v in raw.items():
        lvl = v.get("jlpt_new")
        if not lvl or k in n5_curated:
            continue
        lvl = max(lvl, 4) if lvl == 5 else lvl  # dataset-N5 kanji missing from the curated list -> N4
        means = [m.lstrip("^") for m in clean(v.get("wk_meanings"))] or (v.get("meanings") or [])
        means = [m for m in means if "radical" not in m.lower()][:3]
        on = "・".join(kata(r) for r in (v.get("readings_on") or [])[:3])
        kun = "・".join(r.replace(".", "(", 1) + (")" if "." in r else "") for r in (v.get("readings_kun") or [])[:4])
        rows.append([k, lvl, ", ".join(means).lower(), on or "—", kun or "—", v.get("strokes") or 0, v.get("freq") or 9999])
    rows.sort(key=lambda r: (-r[1], r[6]))  # N4 first, then by frequency
    (OUT / "kanji_levels.json").write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("kanji:", len(rows))
    return rows

def strokes(chars):
    out = {}
    for i, ch in enumerate(chars):
        svg = get(KVG_URL.format(ord(ch)))
        if not svg:
            print("  no KanjiVG for", ch)
            continue
        out[ch] = re.findall(r'<path[^>]*\sd="([^"]+)"', svg)
        if i % 50 == 0:
            print("  strokes", i, "/", len(chars))
    (OUT / "strokes.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("strokes:", len(out))

if __name__ == "__main__":
    rows = kanji()
    js = (HERE / "src" / "data_kana.js").read_text(encoding="utf-8")
    kana = sorted(set(c for c in re.findall(r'"([぀-ヿ])"', js)))
    n5 = re.findall(r'^\["(.)"', (HERE / "src" / "data_kanji.js").read_text(encoding="utf-8"), re.M)
    n4 = [r[0] for r in rows if r[1] == 4]
    strokes(kana + n5 + n4)
