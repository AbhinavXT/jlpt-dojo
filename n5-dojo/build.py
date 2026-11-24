#!/usr/bin/env python3
"""Build n5-dojo.html (single offline file) from src/ + jlpt_vocab.csv.
Usage: python3 n5-dojo/build.py"""
import csv, json, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "src"
JP = HERE.parent
OUT = JP / "n5-dojo.html"

def load_vocab():
    """{level: [[word, reading, english], ...]} for N5..N1; duplicates merged, a word is kept at its easiest level."""
    levels, seen = {l: [] for l in (5, 4, 3, 2, 1)}, {}
    with open(JP / "jlpt_vocab.csv", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    rows.sort(key=lambda r: -int(r["JLPT Level"].strip()[1]))  # N5 first
    for r in rows:
        lv = int(r["JLPT Level"].strip()[1])
        w, k, e = r["Original"].strip(), r["Furigana"].strip(), r["English"].strip()
        if not (w and k and e):
            continue
        key = (w, k)
        if key in seen:  # merge duplicate meanings
            old = seen[key]
            if e not in old[2]:
                old[2] += "; " + e
            continue
        item = [w, k, e]
        seen[key] = item
        levels[lv].append(item)
    # Learning order: plain words first, shorter readings first, affixes (～) last.
    for lv in levels:
        levels[lv].sort(key=lambda x: (x[0].startswith("～"), len(x[1]), x[1]))
    return levels

def main():
    vocab = load_vocab()
    dumps = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
    data = "const VOCAB = " + dumps(vocab) + ";\n"
    data += "const KANJI_UP = " + (SRC / "data" / "kanji_levels.json").read_text(encoding="utf-8") + ";\n"
    data += "const STROKES = " + (SRC / "data" / "strokes.json").read_text(encoding="utf-8") + ";\n"
    for name in ["core.js", "data_kana.js", "data_kanji.js", "data_grammar.js", "data_grammar_up.js", "data_words.js",
                 "data_reading.js", "data_order.js", "curriculum.js"]:
        data += (SRC / name).read_text(encoding="utf-8") + "\n"
    html = (SRC / "template.html").read_text(encoding="utf-8")
    for tag, content in [("/*CSS*/", (SRC / "style.css").read_text(encoding="utf-8")),
                         ("/*DATA*/", data), ("/*APP*/", (SRC / "app.js").read_text(encoding="utf-8"))]:
        assert "</script" not in content.lower() or tag == "/*CSS*/", tag
        html = html.replace(tag, content, 1)
    OUT.write_text(html, encoding="utf-8")
    counts = ", ".join(f"N{l}:{len(v)}" for l, v in vocab.items())
    print(f"wrote {OUT.relative_to(JP.parent)} ({OUT.stat().st_size//1024} KB; vocab {counts})")

if __name__ == "__main__":
    main()
