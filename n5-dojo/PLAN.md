---
date: 2026-11-24
type: reference
topic: japanese
tags: [reference, japanese]
status: growing
---

# JLPT Plan N5 → N1 + N5 Dojo

**Near-term goal:** pass **JLPT N5 on Sun 4 July 2027**. The plan is 31 weeks at about 35 min a day, starting Mon 30 Nov 2026.
**Long-term goal:** climb N4 → N3 → N2 → N1, consolidating each level before moving up.
**Tool:** `n5-dojo.html`, an offline single-file app (about 1 MB) that runs in any browser on Linux, Windows or Android.

> [!question] Unverified
> The official 2027 JLPT dates aren't published yet. July 4 and December 5, 2027 follow the "first Sunday of July/December" rule. Check with your local test centre, and register around March for July or around August for December.

## Daily routine (35–45 min)

| Block | Time | What |
|---|---|---|
| 1. Reviews | 10–15 min | Every due card. **Never skip.** If you only have 5 minutes, do this. |
| 2. New material | ~10 min | **Learn** whatever the plan has scheduled today, then the short quiz. |
| 3. Practice | 5–10 min | Drill of the day (conjugation, numbers, dictation, sentence order, reading, kana). |
| 4. Weekly task | ~10 min | Checklist item: Tae Kim section, writing sheets, audio, mock test. |

## Level roadmap

Hours are rough cumulative study-time estimates for learners without a kanji background. Pass marks are from jlpt.jp.

| Level | Content in app | Exam sections (min) | Pass mark | ~Hours (cumulative) | Suggested sitting | Daily time |
|---|---|---|---|---|---|---|
| **N5** | 718 words · 102 kanji · 67 grammar | 20 / 40 / 30 | 80/180 (≥38 + ≥19) | 325–500 | **Jul 2027** | 35–45 min |
| **N4** | 666 · 145 · 76 | 25 / 55 / 35 | 90/180 (≥38 + ≥19) | 575–1,000 | Jul 2028 | 45–60 min |
| **N3** | 2,139 · 366 · 61 | 30 / 70 / 40 | 95/180 (each ≥19) | 950–1,700 | Dec 2029 | 60 min + immersion |
| **N2** | 1,809 · 367 · 57 | 105 / 50 | 90/180 (each ≥19) | 1,600–2,600 | Dec 2031 | 60–90 min + immersion |
| **N1** | 2,699 · 1,232 · 50 | 110 / 55 | 100/180 (each ≥19) | 3,000–4,800 | 2034+ | 90 min + heavy immersion |

The later dates assume daily time increases as shown. At a flat 30 min a day, N1 takes 10+ years (see [the roadmap note](../The%20Complete%20Japanese%20Learning%20Roadmap%20-%20Zero%20to%20N1%20in%2030%20Minutes%20Daily.md)).

**Rule for moving up:** the app marks a level **foundation solid** when 95% of its items are started, 50% are mature (21+ day interval), and a full mock or official sample scores 70%+. Use Plan → Roadmap → Start N(x). Cards from earlier levels stay in your reviews, so each level keeps being consolidated. Unlearned items from easier levels appear as **Foundation gaps** on Today.

### What changes at each level
- **N5:** kana, basic grammar, ~100 kanji. Habit building matters most; the app's 31-week plan (below) covers it.
- **N4:** plain-form fluency, conjugation (potential, passive, causative, ば/たら), giving and receiving, keigo basics. Start graded readers (Tadoku L1–2) and Nihongo con Teppei for Beginners.
- **N3:** the classic plateau. Vocabulary roughly triples. Shift from textbook to native-ish input: NHK News Web Easy daily, Tadoku L2–3, simple manga (Yotsuba&!), intermediate podcasts. Grammar here is mostly nuance (わけ, はず, ように, ばかり…).
- **N2:** news, articles and opinion pieces; written-style grammar (に伴って, ものの, ざるを得ない). Reading speed becomes the bottleneck, so read every day.
- **N1:** abstract and academic texts, editorials and novels; formal written grammar (をもって, ならでは, ずにはいられない). Extensive reading and listening matter more than cards.

## N5: 31-week plan (in the app's Plan tab)

| Phase | Weeks | Dates | Output |
|---|---|---|---|
| A Kana | 1–2 | 30 Nov – 13 Dec | 104 hiragana + 104 katakana. Kana test ≥ 90%. |
| B Foundation | 3–12 | 14 Dec – 21 Feb | ~8 words/day, ~1.2 kanji/day, ~4 grammar points/week. **Week 12: official sample #1.** |
| C Build | 13–18 | 22 Feb – 4 Apr | Kanji done by week 14, vocab by week 15, grammar by week 18. **Register for the exam.** |
| D Consolidate | 19–24 | 5 Apr – 16 May | No new cards; production mode, shadowing, reading, weekly mock. **Week 22: sample #2.** |
| E Exam prep | 25–31 | 17 May – 4 Jul | Two mocks a week, weak areas, **week 29: sample #3**, then taper. |

Tae Kim reading order (`grammar_guide.pdf`), weeks 3–17: state-of-being → particles → adjectives → verbs and negatives → past tense → transitive/relative clauses → noun particles → polite form → questions → compound sentences → te-form → must/desire → counting → requests/giving → する/なる → conditionals.
Files used from this folder: Tofugu guide, the `jap/` writing sheets, flash cards and self-quiz, `kanjibookjlptn5.pdf`, `grammar_guide.pdf`, the official N5 sample (`N5V/G/R/L.pdf`, `N5Q1–4.mp3`, `N5answer.pdf`).

For N4 and above, the app generates a plan automatically: about 55% of the weeks for learning, then consolidation, then exam prep with official timings. Use the free sample questions on jlpt.jp and the 公式問題集 workbooks for official practice.

## Methods built into the app (and why)
- **Spaced repetition with FSRS-6**, the scheduler modern Anki uses. It models stability and difficulty per card and schedules reviews at your target recall (default 90%). Intervals are capped at half the days left before the exam, so everything comes back before exam day.
- **Retrieval over recognition:** kana, conjugations, numbers and dictation are typed (romaji → kana converter), not just recognised. Production mode shows English first for mature vocab.
- **Context:** every grammar point comes with example sentences, and N4–N1 quizzes are fill-in-the-blank on real sentences. Sentence-order (★) drills build word-order intuition.
- **Listening:** offline text-to-speech for every word and sentence, dictation, and number/time listening (the most common N5/N4 listening trap).
- **Writing:** KanjiVG stroke-order animation for all kana and N5/N4 kanji, plus a trace-then-recall writing pad.
- **Interleaving and testing:** mixed review sessions, a daily rotating drill, per-level timed mocks with the official section names, and wrong answers fed back into reviews.

## Using the app
- **Tabs:** Today · Review · Browse (all levels) · Drills · Test · Plan (roadmap + weeks) · Stats · Settings.
- **Audio** needs a Japanese text-to-speech voice. Android: install the Google TTS Japanese voice. Windows: add a Japanese speech voice. Linux Chromium usually has none.
- **Sync:** export progress to `n5-dojo/progress/` so git carries it between devices; Import merges (the newer review of each card wins). Older v1 progress files are migrated automatically.
- **Build:** `python3 n5-dojo/build.py`, offline, from `src/` and `jlpt_vocab.csv`. `fetch_data.py` re-downloads the kanji and stroke datasets (needs internet).
- **Tests:** `node n5-dojo/tests/unit.test.js` checks the engine and data integrity (21 checks). `node n5-dojo/tests/e2e.js [shotDir]` runs a full Playwright walkthrough of every view, drill and mock.

## Sources
- JLPT test sections, timings and pass marks: [jlpt.jp test sections](https://www.jlpt.jp/e/guideline/testsections.html), [scoring](https://jlpt.jp/e/guideline/results.html).
- FSRS: [py-fsrs](https://github.com/open-spaced-repetition/py-fsrs) default parameters; [algorithm notes](https://expertium.github.io/Algorithm.html).
- Kanji levels and readings: [davidluzgouveia/kanji-data](https://github.com/davidluzgouveia/kanji-data) (KANJIDIC, EDRDG licence; JLPT levels from tanos.co.uk).
- Stroke order: [KanjiVG](https://kanjivg.tagaini.net/) (CC BY-SA 3.0).
- Graded readers: [Tadoku free books](https://tadoku.org/japanese/en/free-books-en/).
- Study-method background: [Tofugu on the intermediate plateau](https://tofugu.com/japanese/intermediate-japanese-plateau), [Tofugu on SRS](https://www.tofugu.com/japanese/spaced-repetition/).

> [!question] Approximate data
> JLPT publishes no official vocabulary, kanji or grammar lists since 2010, so all level placement is community-derived. N4–N1 grammar lists and all reading passages were written for this app; report any errors and they're easy to fix in `src/`.
