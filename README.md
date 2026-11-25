# JLPT Dojo: N5 → N1 course

A self-contained, offline Japanese course: study materials, a 31-week N5 plan, level plans up to N1, and **N5 Dojo**, a single-file trainer app.

**Start here:** open [`n5-dojo.html`](n5-dojo.html) in any browser (desktop or Android). No install and no internet needed. Then read [`n5-dojo/PLAN.md`](n5-dojo/PLAN.md).

## What's inside

| Path | What |
|---|---|
| `n5-dojo.html` | The app (built file, ~1.7 MB): FSRS spaced repetition, kana/vocab/kanji/grammar for N5–N1, **handwriting cards graded stroke by stroke**, 8 drills, 20 Guide lessons, real example sentences with furigana, mocks per level, roadmap |
| `n5-dojo/PLAN.md` | Study plan: daily routine, N5 31-week plan, N4–N1 roadmap, methods, sources |
| `n5-dojo/src/` | App source: `app.js`, `core.js` (FSRS, romaji→kana, conjugation, numbers), data files, styles |
| `n5-dojo/tests/` | `unit.test.js` (engine + data integrity), `e2e.js` (Playwright walkthrough) |
| `jlpt_vocab.csv` | JLPT vocabulary N5–N1 (8,130 rows) |
| `grammar_guide.pdf` | Tae Kim's Guide to Japanese Grammar (main grammar text) |
| `Beginning Japanese for Professionals_ Book 1.pdf` | Optional textbook, used for dialogs |
| `kanjibookjlptn5.pdf` | The first 103 kanji (N5) |
| `Learn Hiragana_ Tofugu's Ultimate Guide.pdf`, `Hiragana-and-Katakana-booklet.pdf`, `printable-hiragana-chart.pdf`, `Practice_sheet_Hiragana.pdf` | Kana learning and practice |
| `jap/` | Kana starter pack: flash cards, writing sheets, self-quiz, 600 names in katakana |
| `N5V/G/R/L.pdf`, `N5Q1–4.mp3`, `N5Sample.mp3`, `N5answer.pdf`, `N5-mondai.pdf` | Official JLPT N5 sample test and audio |
| `The Complete Japanese Learning Roadmap…md` | Background research on methods and resources |

The app links to these files by relative path, so **keep the folder layout as it is**.

## Requirements

| Use | Needs |
|---|---|
| Studying | Any modern browser. For audio, a Japanese text-to-speech voice (Android: Google TTS Japanese; Windows: add a Japanese speech voice) |
| Rebuilding the app | Python 3.9+ (standard library only) |
| Running tests | Node 18+; Playwright for the end-to-end test (`npm install && npx playwright install chromium`) |
| Refreshing kanji/stroke data | Internet + Python (`npm run fetch-data`) |
| Refreshing example sentences | Internet + Python (`python3 n5-dojo/fetch_sentences.py`) |

```bash
npm run build    # python3 n5-dojo/build.py  → regenerates n5-dojo.html
npm test         # unit + data-integrity tests
npm run e2e      # full browser walkthrough (needs Playwright)
npm run check    # all of the above
```

CI (`.github/workflows/ci.yml`) rebuilds the app, fails if the committed `n5-dojo.html` is stale, and runs both test suites.

## Progress and sync
Progress is stored in each browser. Use **Settings → Export** to save a JSON file into `n5-dojo/progress/`, commit it, and **Import** on your other devices. Import merges, so the newer review of each card wins.

## Licences and copyright
- App code and the content written for it (grammar notes, reading passages, drills, plans): personal project.
- Example and reading sentences: Tatoeba.org contributors, CC BY 2.0 FR.
- `n5-dojo/src/data/strokes.json`: from KanjiVG © Ulrich Apel, CC BY-SA 3.0. `kanji_levels.json`: from KANJIDIC (EDRDG licence, CC BY-SA 4.0) via davidluzgouveia/kanji-data. See `n5-dojo/src/data/ATTRIBUTION.md`.
- Tae Kim's guide is CC BY-NC-SA. The **PDFs and MP3s from other publishers** (Tofugu, the JLPT sample tests by the Japan Foundation / JEES, the kanji book, the kana booklet and starter pack) are copyrighted by their owners and are included **for personal study only**. Keep this repository **private**, or remove those files before making it public.
