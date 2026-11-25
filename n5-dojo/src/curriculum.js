// 31-week plan. Week 1 starts on settings.start (default Mon 2026-11-30); exam on settings.exam.
// New-item pacing (in day offsets from the start) is defined in PACING; weekly tasks are below.
const PACING = {
  kanaHira: 0,          // hiragana groups on days 0-6
  kanaKata: 7,          // katakana groups on days 7-13
  vocab:   { from: 14, to: 104 },   // ~8 words/day, weeks 3-15
  kanji:   { from: 14, to: 97 },    // ~1.2 kanji/day, weeks 3-14
  grammar: { from: 14, to: 125 }    // ~4 points/week, weeks 3-18
};
const PHASES = [
  { id:"A", name:"Kana", weeks:[1,2], goal:"Read all hiragana and katakana at sight (90%+ on the kana test)." },
  { id:"B", name:"Foundation", weeks:[3,12], goal:"Daily: new vocab, kanji and grammar plus reviews. Week 12: first official sample test (diagnostic)." },
  { id:"C", name:"Build", weeks:[13,18], goal:"Finish all new material: kanji by week 14, vocab by week 15, grammar by week 18. Register for the exam." },
  { id:"D", name:"Consolidate", weeks:[19,24], goal:"No new cards. Production practice, reading and listening. Weekly full mock. Week 22: official sample #2." },
  { id:"E", name:"Exam prep", weeks:[25,31], goal:"Timed mocks, weak-area drills, official sample #3 in week 29, then rest and sit the exam." }
];
const F = { // files in japanese/ (relative to n5-dojo.html)
  tofugu: "Learn Hiragana_ Tofugu's Ultimate Guide.pdf",
  booklet: "Hiragana-and-Katakana-booklet.pdf",
  chart: "printable-hiragana-chart.pdf",
  hsheet: "Practice_sheet_Hiragana.pdf",
  tk: "grammar_guide.pdf",
  bjp: "Beginning Japanese for Professionals_ Book 1.pdf",
  kb: "kanjibookjlptn5.pdf",
  names: "jap/600 Common Names.pdf",
  fca: "jap/Flash Card Practice Activities.pdf",
  quiz: "jap/SELF QUIZ/SELF QUIZ.pdf", quizKey: "jap/SELF QUIZ/Self Quiz ANSWER KEY.pdf",
  hw: n => `jap/WRITING PRACTICE/Hiragana Writing Practice ${n}.pdf`,
  kw: n => `jap/WRITING PRACTICE/Katakana Writing Practice ${n}.pdf`,
  hfc: "jap/FLASH CARDS/Flash Cards_HIRA_fronts.pdf", hbc: "jap/FLASH CARDS/Flash Cards_HIRA_backs.pdf",
  kfc: "jap/FLASH CARDS/Flash Cards_KATA_fronts.pdf", kbc: "jap/FLASH CARDS/Flash Cards_KATA_backs.pdf",
  V:"N5V.pdf", G:"N5G.pdf", R:"N5R.pdf", L:"N5L.pdf", ans:"N5answer.pdf", mondai:"N5-mondai.pdf",
  q:n=>`N5Q${n}.mp3`, sample:"N5Sample.mp3"
};
// Task strings: [label, optional file]. Kept short; the app adds the auto-scheduled items for the week.
const WEEKS = {
  1: [["Read the Tofugu hiragana guide for each day's rows (mnemonics)", F.tofugu],
      ["Write each new hiragana 10x: Hiragana Writing Practice 1", F.hw(1)],
      ["Hiragana Writing Practice 2", F.hw(2)],["Hiragana Writing Practice 3", F.hw(3)],
      ["Print and cut the hiragana flash cards (fronts + backs)", F.hfc],
      ["Do 1 drill from Flash Card Practice Activities", F.fca],
      ["Keep the hiragana chart open as a reference", F.chart],
      ["Extra handwriting: Practice_sheet_Hiragana", F.hsheet],["Guide lessons 1–3: scripts, sounds, handwriting rules (Guide tab)"],["Writing cards: trace each new kana once, then write it from memory"]],
  2: [["Katakana Writing Practice 1", F.kw(1)],["Katakana Writing Practice 2", F.kw(2)],["Katakana Writing Practice 3", F.kw(3)],
      ["Katakana flash cards (fronts + backs)", F.kfc],
      ["Read small っ, long vowels and ー in the booklet", F.booklet],
      ["Read 20 katakana names a day (cover the English)", F.names],
      ["SELF QUIZ, then check with the answer key", F.quiz],
      ["Checkpoint: Test tab, Kana test, 90%+ on both scripts"],["Drills → Writing → Kana: 5 minutes a day from memory"]],
  3: [["Tae Kim: Expressing state-of-being + Introduction to particles", F.tk],
      ["Kanji book: study each scheduled kanji page and write it 5x", F.kb],
      ["Routine: reviews first, then new cards"],["Guide lessons 4–5: sentence structure and particles"],["Drills → Sentence reading: 10 sentences a day"]],
  4: [["Tae Kim: Adjectives", F.tk],["Listen once to the official sample audio just to hear the format", F.sample],
      ["Sunday: Quick test (learned items)"],["Guide lesson 6: nouns and です"]],
  5: [["Tae Kim: Verb Basics + Negative Verbs", F.tk],["Write 3 sentences about your day using です/ます"],["Guide lesson 7: adjectives"],["Drills → Writing → Words: 5 words a day"]],
  6: [["Tae Kim: Past Tense + Particles used with verbs", F.tk],["Write and say a 5-line self-introduction (じこしょうかい)"],["Guide lesson 8: verbs (groups and forms); then Drills → Conjugation"]],
  7: [["Tae Kim: Transitive/Intransitive (skim) + Relative Clauses", F.tk],["Sunday: Quick test"],["Guide lesson 9: existence and location"]],
  8: [["Tae Kim: Noun-related particles + Adverbs and sentence-ending particles", F.tk],["Shadow 5 grammar example sentences a day (TTS button)"],["Guide lessons 10–11: こそあど and numbers; Drills → Numbers (listen)"]],
  9: [["Tae Kim: Polite Form and Verb Stems", F.tk],["Optional: read 1 dialog a week in Beginning Japanese for Professionals", F.bjp],["Sunday: Quick test"],["Guide lesson 12: polite vs casual speech"]],
 10: [["Tae Kim: The Question Marker + Addressing People", F.tk],["Write 5 questions you could ask a classmate"]],
 11: [["Tae Kim: Compound Sentences (te-form, から, が)", F.tk],["Sunday: Quick test"]],
 12: [["Tae Kim: Other uses of the te-form", F.tk],
      ["MILESTONE: Official sample #1 (diagnostic). Vocab 20 min", F.V],["Grammar + Reading 40 min", F.G],["Reading section", F.R],
      ["Listening 30 min (audio on the Test tab)", F.L],["Score it with the answer sheet and log it on the Test tab", F.ans]],
 13: [["Tae Kim: Expressing must / have to + Desire and Suggestions", F.tk],["Re-read the sample reading passages slowly, looking up every word", F.R]],
 14: [["Tae Kim: Numbers and Counting", F.tk],["Kanji: all new kanji are done this week; review the whole kanji book once", F.kb],
      ["REGISTER for the July JLPT (registration usually opens around March; check your local host institution)"]],
 15: [["Tae Kim: Making Requests + Giving and Receiving", F.tk],["Vocab: all new words are done this week"],["Sunday: Full mock"]],
 16: [["Tae Kim: Using する and なる", F.tk],["Turn on production mode in Settings (English shown first for mature vocab)"],["Confirm the JLPT registration went through"],["Optional: start the N4 Guide lessons (plain form, conditionals)"]],
 17: [["Tae Kim: Conditionals (preview; it helps with listening)", F.tk],["Shadow sample audio Q1 10 min x3", F.q(1)],["Sunday: Full mock"]],
 18: [["Grammar: last new points. Reread the 5 grammar points you miss most", F.tk],["Sunday: Full mock"]],
 19: [["Consolidate: Full mock (Sunday)"],["Listening: shadow Q2 audio 10 min x3", F.q(2)],["Reading: 1 dialog from Beginning Japanese for Professionals", F.bjp],["Write a 5-sentence diary entry twice"]],
 20: [["Full mock (Sunday)"],["Listening: shadow Q3 audio", F.q(3)],["Re-read the sample reading passages; time yourself", F.R],["Diary x2"]],
 21: [["Full mock (Sunday)"],["Listening: shadow Q4 audio", F.q(4)],["Clear every 'leech' card (failed 4+ times) on the Stats tab"],["Diary x2"]],
 22: [["MILESTONE: Official sample #2, fully timed (20 / 40 / 30 min)", F.V],["Listening section", F.L],["Score and log it on the Test tab", F.ans],["Compare with sample #1: pick your 2 weakest areas"]],
 23: [["Full mock (Sunday)"],["Weak area #1: 15 min a day"],["Listening: full sample audio at 1.0x, no pausing", F.sample]],
 24: [["Full mock (Sunday)"],["Weak area #2: 15 min a day"],["Read the N5-mondai booklet as extra practice", F.mondai]],
 25: [["Full mock x2 (Wed + Sun)"],["Review every wrong mock answer (they're added back to your reviews)"],["Listening 10 min every day"]],
 26: [["Full mock x2"],["Kanji: write all 102 from memory once", F.kb],["Listening 10 min every day"]],
 27: [["Full mock x2"],["Grammar: go through the whole grammar list, retest weak points"],["Check the exam venue and download or print the admission voucher when it's issued"]],
 28: [["Full mock x2"],["Particles day: redo every particle quiz (は/が/を/に/で/へ/と/も)"],["Listening 10 min every day"]],
 29: [["MILESTONE: Official sample #3 under exam conditions (same time of day as the real exam)", F.V],["Listening section", F.L],["Score and log it", F.ans]],
 30: [["Weak areas only. Reviews every day. No new material"],["One last Full mock mid-week"]],
 31: [["Light reviews only (15 min)"],["Pack: admission voucher, photo ID, HB pencils, eraser, analog watch"],["Sleep well. Exam on Sunday!"]]
};
