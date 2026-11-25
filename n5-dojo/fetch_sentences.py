#!/usr/bin/env python3
"""Download everyday-ranked Tatoeba Japanese–English pairs and derive:
  - src/data/examples.json   : up to 2 short example sentences per N5/N4/N3 vocab word
  - src/data/sentences.json  : graded reading sentences (N5 / N4 kanji only) for the Sentence-reading drill
Source: Tatoeba.org (CC BY 2.0 FR) via the everyday-ranked packs in github.com/TheSunphis/Tatoeba-Rework.
Usage: python3 n5-dojo/fetch_sentences.py [cache_dir]   (needs internet once; outputs are committed)
"""
import csv, json, pathlib, re, sys, time, urllib.parse, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "src" / "data"
CACHE = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE / ".cache" / "tatoeba")
BASE = "https://raw.githubusercontent.com/TheSunphis/Tatoeba-Rework/main/Japanese/"
PACKS = [1, 2]  # ranks 1–50,000 (the most everyday sentences)

def fetch(pack, n):
    name = f"pack{pack:02d}_{n:03d}.json"
    dest = CACHE / name
    if dest.exists() and dest.stat().st_size > 1000:
        return dest
    url = BASE + urllib.parse.quote(f"Pack {pack:02d}/{name}")
    for i in range(4):
        try:
            with urllib.request.urlopen(url, timeout=40) as r:
                dest.write_bytes(r.read())
            return dest
        except Exception as e:  # noqa
            time.sleep(2 ** i)
    print("failed", name)
    return None

HAN = re.compile(r"[一-龯々]")

def load():
    CACHE.mkdir(parents=True, exist_ok=True)
    rows = []
    for p in PACKS:
        for n in range(1, 101):
            f = fetch(p, n)
            if not f:
                continue
            for s in json.loads(f.read_text(encoding="utf-8"))["sentences"]:
                en = s["translations"][0]["en"] if s.get("translations") else None
                ja = s["ja"].strip()
                if not en or len(ja) < 4 or len(ja) > 40 or "\n" in ja:
                    continue
                rows.append((s["rank"], ja, s["ja_furigana"].strip(), en.strip()))
        print("pack", p, "loaded", len(rows))
    rows.sort()
    return rows

def kanji_levels():
    lv = {}
    for k in re.findall(r'^\["(.)"', (HERE / "src" / "data_kanji.js").read_text(encoding="utf-8"), re.M):
        lv[k] = 5
    for r in json.loads((OUT / "kanji_levels.json").read_text(encoding="utf-8")):
        lv.setdefault(r[0], r[1])
    return lv

def vocab():
    words = {5: [], 4: [], 3: []}
    seen = set()
    with open(HERE.parent / "jlpt_vocab.csv", encoding="utf-8") as f:
        rows = sorted(csv.DictReader(f), key=lambda r: -int(r["JLPT Level"][1]))
    for r in rows:
        l = int(r["JLPT Level"][1]); w, k = r["Original"].strip(), r["Furigana"].strip()
        if l in words and w and k and (w, k) not in seen:
            seen.add((w, k)); words[l].append((w, k, r["English"]))
    return words

def stem(w, eng):
    """Match form: verbs/adjectives drop the last kana so conjugated forms match (食べる→食べ, 高い→高)."""
    w = w.lstrip("～〜").rstrip("～〜")
    if len(w) >= 2 and not HAN.search(w[-1]) and (eng.startswith("to ") or w.endswith("い")):
        if HAN.search(w[:-1]):
            return w[:-1]
    return w

TOK = re.compile(r"\[([^\]|]+)((?:\|[^\]|]*)+)\]|([^\[]+)")

def tokens(fu):
    """[(surface, reading)] where reading is per-character list or a single group reading."""
    out = []
    for m in TOK.finditer(fu):
        if m.group(3):
            for ch in m.group(3):
                out.append((ch, ch))
        else:
            surf, reads = m.group(1), m.group(2).split("|")[1:]
            if len(reads) == len(surf) and all(reads):
                out += list(zip(surf, reads))
            else:  # group reading spread over the token: first char carries it
                r = "".join(reads)
                out += [(surf[0], r)] + [(c, "") for c in surf[1:]]
    return out

def covered_reading(fu, st):
    toks = tokens(fu)
    surf = "".join(t[0] for t in toks)
    i = surf.find(st)
    if i < 0:
        return None
    # extend to the start of a group token if we landed inside one
    j = i
    while j > 0 and toks[j][1] == "":
        j -= 1
    return "".join(t[1] for t in toks[j:i + len(st)])

def main():
    rows = load()
    klv = kanji_levels()
    def max_level_ok(ja, lv):  # every kanji in the sentence is at level >= lv (i.e. no harder kanji)
        return all(klv.get(c, 0) >= lv for c in ja if HAN.match(c))
    words = vocab()
    examples, freq = {}, {}
    # max kanji difficulty (lowest JLPT number) appearing in a sentence: 5 = only N5 kanji / kana, 0 = non-JLPT kanji
    hardest = [min([klv.get(c, 0) for c in ja if HAN.match(c)] or [5]) for _, ja, _, _ in rows]
    for lv, ws in words.items():
        need = 2 if lv >= 4 else 1
        for w, k, eng in ws:
            key = f"{w}|{k}"
            forms = []  # (surface to find, required covered reading or None)
            st = stem(w, eng)
            if HAN.search(w):
                okuri = len(w.strip("～〜")) - len(st)
                kr = k.strip("～〜")
                forms.append((st, kr[:len(kr) - okuri] if okuri else kr))
            kana = stem(k, eng) if not HAN.search(k) else k
            kana = kana.strip("～〜")
            if len(kana) >= 3 or (not HAN.search(w) and len(kana) >= 2 and len(w) >= 3):
                forms.append((kana, None))
            if not forms:
                continue
            freq[key] = sum(1 for _, ja, fu, _ in rows if any(f in ja and (want is None or covered_reading(fu, f) == want) for f, want in forms)) if lv >= 4 else 0
            tiers = {0: [], 1: [], 2: []}  # 0: kanji within the word's level, 1: one level harder, 2: anything
            for idx, (rank, ja, fu, en) in enumerate(rows):
                for f, want in forms:
                    if f in ja and (want is None or covered_reading(fu, f) == want):
                        h = hardest[idx]
                        t = 0 if h >= lv else 1 if h >= lv - 1 and h > 0 else 2
                        if len(tiers[t]) < need:
                            tiers[t].append([fu, en])
                        break
                if len(tiers[0]) >= need:
                    break
            picks = (tiers[0] + tiers[1] + tiers[2])[:need]
            if picks:
                examples[key] = picks
    print("examples for", len(examples), "words")
    # graded reading sentences: only kanji up to the level, 8–32 chars, at least one kanji or N5: any
    graded = {5: [], 4: []}
    for rank, ja, fu, en in rows:
        if not (8 <= len(ja) <= 32) or not HAN.search(ja):
            continue
        for lv in (5, 4):
            if max_level_ok(ja, lv) and (lv == 5 or not max_level_ok(ja, 5)) and len(graded[lv]) < 1500:
                graded[lv].append([fu, en]); break
    print("graded sentences", {k: len(v) for k, v in graded.items()})
    dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
    (OUT / "examples.json").write_text(dump(examples), encoding="utf-8")
    (OUT / "freq.json").write_text(dump({k: v for k, v in freq.items() if v}), encoding="utf-8")
    (OUT / "sentences.json").write_text(dump(graded), encoding="utf-8")

if __name__ == "__main__":
    main()
