---
date: 2026-11-24
type: reference
topic: japanese
tags: [reference, japanese]
---

# Data attribution

- `kanji_levels.json`: derived from [davidluzgouveia/kanji-data](https://github.com/davidluzgouveia/kanji-data), which is built from **KANJIDIC** (© Electronic Dictionary Research and Development Group, used under the EDRDG licence, CC BY-SA 4.0). JLPT levels come from Jonathan Waller's lists (tanos.co.uk). Fields kept: level, meanings, on/kun readings, stroke count, frequency.
- `strokes.json`: stroke paths extracted from **KanjiVG** © Ulrich Apel, licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). This derived file is shared under the same licence.
- `../../jlpt_vocab.csv` (vocabulary) was already in the vault before this app was built.
- `examples.json`, `sentences.json`, `freq.json`: derived from **Tatoeba** sentences (Tatoeba.org contributors, CC BY 2.0 FR; some CC0), via the everyday-ranked packs in [TheSunphis/Tatoeba-Rework](https://github.com/TheSunphis/Tatoeba-Rework). Rebuilt with `python3 n5-dojo/fetch_sentences.py`.
- `parts.json`: kanji component structure from KanjiVG (CC BY-SA 3.0).
- FSRS-6 default weights come from open-spaced-repetition/py-fsrs (MIT).

Regenerate with `python3 n5-dojo/fetch_data.py`.
