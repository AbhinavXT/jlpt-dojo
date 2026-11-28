// Unit + data-integrity tests. Run: node n5-dojo/tests/unit.test.js
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const SRC = path.join(__dirname, "..", "src");
const { FSRS, IME, CONJ, NUM, STAGE } = require(path.join(SRC, "core.js"));

let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); pass++; } catch (e) { fail++; console.log("FAIL:", name, "\n   ", e.message); } };
const eq = (a, b, msg = "") => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const ok = (c, msg) => { if (!c) throw new Error(msg); };

// load data files into a sandbox
const ctx = {}; vm.createContext(ctx);
for (const f of ["data_kana.js", "data_kanji.js", "data_grammar.js", "data_grammar_up.js", "data_words.js", "data_reading.js", "data_reading2.js", "data_order.js", "data_phrases.js", "data_mnemonics.js", "data_guide.js", "data_n4notes.js", "curriculum.js"])
  vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8") + `\n;globalThis.__=Object.assign(globalThis.__||{}, {${{
    "data_kana.js": "KANA_GROUPS,KANA_NOTES", "data_kanji.js": "KANJI", "data_grammar.js": "GRAMMAR", "data_grammar_up.js": "GRAMMAR_UP",
    "data_words.js": "VERBS,ADJS", "data_reading.js": "READINGS", "data_order.js": "ORDER_SENTENCES", "data_phrases.js": "PHRASES", "data_reading2.js": "READINGS", "data_mnemonics.js": "MNEMO", "data_guide.js": "GUIDE", "data_n4notes.js": "N4_NOTES", "curriculum.js": "PACING,PHASES,WEEKS,F" }[f]}});`, ctx);
const D = ctx.__;
const KANJI_UP = JSON.parse(fs.readFileSync(path.join(SRC, "data", "kanji_levels.json"), "utf8"));
const STROKES = JSON.parse(fs.readFileSync(path.join(SRC, "data", "strokes.json"), "utf8"));

// ---- IME ----
t("IME basics", () => {
  const cases = { kyou: "きょう", gakkou: "がっこう", konnichiha: "こんにちは", onna: "おんな", "kon'ya": "こんや", shinbun: "しんぶん", matcha: "まっちゃ",
    "ko-hi-": "こーひー", tsukue: "つくえ", chotto: "ちょっと", jitensha: "じてんしゃ", hon: "ほん", sanpo: "さんぽ", ryokou: "りょこう", minna: "みんな", fun: "ふん", nyuugaku: "にゅうがく" };
  for (const [k, v] of Object.entries(cases)) eq(IME.toKana(k), v, k);
});
t("IME norm compares kana/katakana/romaji", () => { eq(IME.norm("コーヒー"), IME.norm("ko-hi-")); eq(IME.norm(" たべます "), "たべます"); });

// ---- conjugation ----
const V = (v, c, f, exp) => eq(CONJ.verb(v, c, f)[0], exp, `${v} ${f}`);
t("godan te/ta forms", () => {
  V("かく", "u", "te", "かいて"); V("およぐ", "u", "te", "およいで"); V("はなす", "u", "te", "はなして"); V("まつ", "u", "te", "まって"); V("しぬ", "u", "te", "しんで");
  V("あそぶ", "u", "te", "あそんで"); V("のむ", "u", "te", "のんで"); V("かえる", "u", "te", "かえって"); V("かう", "u", "te", "かって"); V("いく", "iku", "te", "いって"); V("いく", "iku", "ta", "いった");
});
t("negatives / masu", () => { V("かう", "u", "nai", "かわない"); V("ある", "aru", "nai", "ない"); V("ある", "aru", "nakatta", "なかった"); V("たべる", "ru", "masu", "たべます"); V("のむ", "u", "masendeshita", "のみませんでした"); V("する", "suru", "nai", "しない"); V("くる", "kuru", "nai", "こない"); });
t("N4 forms", () => { V("かく", "u", "pot", "かける"); V("たべる", "ru", "pot", "たべられる"); V("する", "suru", "pot", "できる"); V("いく", "iku", "vol", "いこう"); V("みる", "ru", "ba", "みれば"); V("よむ", "u", "pass", "よまれる"); V("いう", "u", "caus", "いわせる"); V("くる", "kuru", "caus", "こさせる"); V("もってくる", "kuru", "te", "もってきて"); V("べんきょうする", "suru", "vol", "べんきょうしよう"); });
t("adjectives", () => { eq(CONJ.adj("いい", "i", "past")[0], "よかった"); eq(CONJ.adj("たかい", "i", "neg")[0], "たかくない"); eq(CONJ.adj("しずか", "na", "attr")[0], "しずかな"); eq(CONJ.adj("きれい", "na", "pastpol")[0], "きれいでした"); });
t("every drill word conjugates in every applicable form", () => {
  for (const lv of [5, 4]) {
    for (const [cls, str] of Object.entries(D.VERBS[lv])) for (const v of str.split(/\s+/).filter(Boolean)) {
      ok(/[うくぐすつぬぶむる]$/.test(v), `bad verb ending ${v}`);
      if (cls === "ru") ok(/[いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ]る$/.test(v), `ru-verb must end in -iru/-eru: ${v}`);
      for (const f of Object.keys(CONJ.VFORMS)) { const r = CONJ.verb(v, cls, f); if (cls === "aru" && ["pot", "pass", "caus", "want"].includes(f)) continue; ok(r && r[0] && /^[぀-ゟ]+$/.test(r[0]), `${v}/${cls}/${f} -> ${r}`); }
    }
    for (const [cls, str] of Object.entries(D.ADJS[lv])) for (const a of str.split(/\s+/).filter(Boolean)) {
      if (cls === "i") ok(a.endsWith("い"), `i-adj ${a}`);
      for (const f of Object.keys(CONJ.AFORMS)) ok(CONJ.adj(a, cls, f), `${a} ${f}`);
    }
  }
});

// ---- numbers ----
t("number readings", () => {
  const n = { 4: "よん", 14: "じゅうよん", 300: "さんびゃく", 600: "ろっぴゃく", 800: "はっぴゃく", 1000: "せん", 3000: "さんぜん", 8000: "はっせん", 10000: "いちまん", 36000: "さんまんろくせん", 10000000: "いっせんまん", 19: "じゅうきゅう", 99: "きゅうじゅうきゅう" };
  for (const [k, v] of Object.entries(n)) eq(NUM.read(+k), v, k);
});
t("time, dates, counters, yen", () => {
  eq(NUM.time(4, 0), ["よじ"]); eq(NUM.time(9, 0), ["くじ"]); eq(NUM.time(7, 0), ["しちじ"]); ok(NUM.time(3, 30).includes("さんじはん"), "はん");
  eq(NUM.time(1, 1)[0], "いちじいっぷん"); eq(NUM.time(2, 10)[0], "にじじゅっぷん"); eq(NUM.time(2, 3)[0], "にじさんぷん"); eq(NUM.time(5, 46)[0], "ごじよんじゅうろっぷん");
  eq(NUM.day(1), ["ついたち"]); eq(NUM.day(14), ["じゅうよっか"]); eq(NUM.day(20), ["はつか"]); eq(NUM.day(24), ["にじゅうよっか"]); eq(NUM.day(17), ["じゅうしちにち"]); eq(NUM.day(29), ["にじゅうくにち"]);
  eq(NUM.counter("nin", 1), ["ひとり"]); eq(NUM.counter("hon", 3), ["さんぼん"]); eq(NUM.counter("hon", 6), ["ろっぽん"]); eq(NUM.counter("satsu", 8)[0], "はっさつ"); eq(NUM.counter("hiki", 3), ["さんびき"]); eq(NUM.counter("hai", 3), ["さんばい"]);
  eq(NUM.yen(4), ["よえん"]); eq(NUM.yen(104), ["ひゃくよえん"]); eq(NUM.yen(40), ["よんじゅうえん"]);
  for (const k of Object.keys(NUM.C)) for (let i = 1; i <= 10; i++) ok(NUM.counter(k, i).length, `counter ${k} ${i}`);
});

// ---- FSRS ----
t("FSRS behaves sensibly", () => {
  let c = {}; c = FSRS.review(c, 3, 0); ok(c.ivl >= 1 && c.ivl <= 4, "first good 1-4d: " + c.ivl);
  const g = FSRS.review(c, 3, c.ivl), e = FSRS.review(c, 4, c.ivl), h = FSRS.review(c, 2, c.ivl), a = FSRS.review(c, 1, c.ivl);
  ok(e.ivl >= g.ivl && g.ivl >= h.ivl, `easy>=good>=hard ${e.ivl} ${g.ivl} ${h.ivl}`); eq(a.ivl, 0); eq(a.lapses, 1); ok(a.s < g.s, "lapse lowers stability");
  ok(Math.abs(FSRS.R(0, 5) - 1) < 1e-9, "R(0)=1"); ok(Math.abs(FSRS.R(5, 5) - 0.9) < 1e-6, "R(S)=0.9");
  const capped = FSRS.review(g, 3, g.ivl, { maxIvl: 5 }); ok(capped.ivl <= 5, "max interval respected");
  const hi = FSRS.review(c, 3, c.ivl, { retention: 0.95 }), lo = FSRS.review(c, 3, c.ivl, { retention: 0.8 }); ok(hi.ivl < lo.ivl, "higher retention → shorter interval");
});

// ---- data integrity ----
t("kana table: unique chars, romaji present", () => {
  const seen = new Set(); D.KANA_GROUPS.forEach(g => g.rows.forEach(r => { ok(r.length >= 3, "row " + r); ok(!seen.has(r[0]) && !seen.has(r[1]), "dup " + r[0]); seen.add(r[0]); seen.add(r[1]); }));
  eq(seen.size, 208);
});
t("N5 kanji: 102 unique, all fields", () => { eq(D.KANJI.length, 102); eq(new Set(D.KANJI.map(k => k[0])).size, 102); D.KANJI.forEach(k => ok(k.length === 7 && k.every(x => x), "kanji row " + k[0])); });
t("upper kanji: no overlap with N5, valid levels", () => { const n5 = new Set(D.KANJI.map(k => k[0])); KANJI_UP.forEach(k => { ok(!n5.has(k[0]), "overlap " + k[0]); ok([1, 2, 3, 4].includes(k[1]), "level " + k[0]); ok(k[2], "meaning " + k[0]); }); ok(KANJI_UP.length > 2000, "count"); });
t("stroke data for all kana and N5 kanji", () => {
  D.KANA_GROUPS.forEach(g => g.rows.forEach(r => [r[0], r[1]].forEach(ch => { if (ch.length === 1) ok(STROKES[ch] && STROKES[ch].length, "strokes " + ch); })));
  D.KANJI.forEach(k => ok(STROKES[k[0]] && STROKES[k[0]].length, "strokes " + k[0]));
  ok(STROKES["一"].length === 1 && STROKES["日"].length === 4 && STROKES["書"].length === 10, "stroke counts");
});
t("N5 grammar: answer not among distractors, 3 distractors, cloze marker", () => {
  D.GRAMMAR.forEach(g => g.q.forEach(q => { ok(q[0].includes("＿＿"), "no blank: " + g.p); ok(!q[2].includes(q[1]), "answer in distractors: " + g.p); eq(q[2].length, 3, g.p); ok(g.ex.length, "examples " + g.p); }));
});
t("N4–N1 grammar: key appears in example, distractors distinct", () => {
  let n = 0;
  for (const [lv, rows] of Object.entries(D.GRAMMAR_UP)) rows.forEach(r => {
    n++; ok(r.length >= 5 && r.slice(0, 5).every(Boolean), `row N${lv} ${r[0]}`); ok(r[2].includes(r[4]), `key not in example: N${lv} ${r[0]} (${r[4]})`);
    if (r[5]) { ok(!r[5].includes(r[4]), "answer in distractors " + r[0]); eq(new Set(r[5]).size, r[5].length, "dup distractors " + r[0]); }
  });
  ok(n >= 200, "grammar count " + n);
});
t("unique grammar patterns per level", () => { eq(new Set(D.GRAMMAR.map(g => g.p)).size, D.GRAMMAR.length); for (const rows of Object.values(D.GRAMMAR_UP)) eq(new Set(rows.map(r => r[0])).size, rows.length); });
t("reading passages: answers distinct from distractors", () => {
  D.READINGS.forEach(r => { ok(r.text && r.en && [5, 4, 3, 2, 1].includes(r.lv), r.t); r.q.forEach(q => { ok(q.length === 5, "4 options " + q[0]); eq(new Set(q.slice(1)).size, 4, "dup options " + q[0]); }); });
});
t("sentence-order items: 5+ unique chunks", () => {
  D.ORDER_SENTENCES.forEach(([lv, txt, en]) => { const c = txt.split("|"); ok(c.length >= 5, "too short: " + txt); eq(new Set(c).size, c.length, "dup chunk: " + txt); ok(en && [5, 4].includes(lv), txt); });
  ok(D.ORDER_SENTENCES.length >= 40, "count");
});
t("curriculum covers 31 weeks and links real files", () => {
  for (let w = 1; w <= 31; w++) ok(D.WEEKS[w] && D.WEEKS[w].length, "week " + w);
  const JP = path.join(__dirname, "..", "..");
  const files = new Set(); Object.values(D.WEEKS).forEach(ts => ts.forEach(x => x[1] && files.add(x[1])));
  files.forEach(f => ok(fs.existsSync(path.join(JP, f)), "missing file " + f));
});
t("vocab CSV parses for all levels", () => {
  const csv = fs.readFileSync(path.join(__dirname, "..", "..", "jlpt_vocab.csv"), "utf8");
  for (const l of ["N5", "N4", "N3", "N2", "N1"]) ok(csv.includes("," + l), l);
});

// ---- v3: writing, reading, lessons ----
global.esc = s => String(s);
const W = require(path.join(SRC, "writer.js"));
t("furigana: ruby, plain text, reading", () => {
  eq(W.plainJa("[説明|せつ|めい]している"), "説明している"); eq(W.readingOf("[説明|せつ|めい]している"), "せつめいしている");
  ok(W.ruby("[日本|にほん]").includes("<rt>にほん</rt>"), "group ruby"); ok(W.ruby("[説明|せつ|めい]").split("<ruby>").length === 3, "per-char ruby");
  eq(W.ruby("[7|]"), "7");
});
t("stroke grader geometry", () => {
  const line = (x1, y1, x2, y2) => Array.from({ length: 24 }, (_, i) => [x1 + ((x2 - x1) * i) / 23, y1 + ((y2 - y1) * i) / 23]);
  const exp = line(20, 50, 90, 50), L = 70;
  ok(W.WGEO.compare(W.WGEO.resample(line(22, 53, 88, 48)), exp, L).ok, "near-identical stroke accepted");
  eq(W.WGEO.compare(W.WGEO.resample(line(90, 50, 20, 50)), exp, L).why, "dir", "reversed stroke");
  ok(!W.WGEO.compare(W.WGEO.resample(line(55, 10, 55, 95)), exp, L).ok, "vertical vs horizontal rejected");
  ok(!W.WGEO.compare(W.WGEO.resample(line(20, 90, 90, 90)), exp, L).ok, "shifted stroke rejected");
  eq(W.WGEO.resample([[1, 1], [9, 1]], 5).length, 5);
});
t("mnemonics cover every basic kana", () => { D.KANA_GROUPS.slice(0, 5).forEach(g => g.rows.forEach(r => { if (!/[がぎぐげござじずぜぞガギグゲゴザジズゼゾ]/.test(r[0])) { ok(D.MNEMO[r[0]], "mnemonic " + r[0]); ok(D.MNEMO[r[1]], "mnemonic " + r[1]); } })); });
t("guide lessons: unique ids, valid checks", () => {
  eq(new Set(D.GUIDE.map(g => g.id)).size, D.GUIDE.length);
  D.GUIDE.forEach(g => { ok(g.body && g.t && [5, 4].includes(g.lv), g.id); (g.check || []).forEach(c => { eq(c.length, 5, g.id); eq(new Set(c.slice(1)).size, 4, "dup options " + g.id); }); });
  ok(D.GUIDE.filter(g => g.lv === 5).length >= 12 && D.GUIDE.filter(g => g.lv === 4).length >= 6, "lesson counts");
});
t("N4 notes match N4 grammar patterns", () => { const pats = new Set(D.GRAMMAR_UP[4].map(r => r[0])); const keys = Object.keys(D.N4_NOTES); keys.forEach(k => ok(pats.has(k), "unknown pattern " + k)); ok(keys.length >= pats.size - 2, `notes ${keys.length}/${pats.size}`); });
t("passages: furigana markup well-formed", () => {
  D.READINGS.forEach(r => { const plain = W.plainJa(r.text); ok(!/[\[\]|]/.test(plain), "unbalanced markup in " + r.t); });
  ok(D.READINGS.filter(r => r.lv === 5).length >= 13 && D.READINGS.filter(r => r.lv === 4).length >= 10, "passage counts");
});
t("example + graded sentence data", () => {
  const ex = JSON.parse(fs.readFileSync(path.join(SRC, "data", "examples.json"), "utf8")), sen = JSON.parse(fs.readFileSync(path.join(SRC, "data", "sentences.json"), "utf8"));
  ok(Object.keys(ex).length > 2000, "examples"); ok(sen[5].length >= 1000 && sen[4].length >= 1000, "graded sentences");
  Object.values(ex).slice(0, 300).forEach(v => v.forEach(([fu, en]) => ok(fu && en && !/[\[\]]/.test(W.plainJa(fu)), "bad example " + fu)));
  const parts = JSON.parse(fs.readFileSync(path.join(SRC, "data", "parts.json"), "utf8")); ok(parts["休"] && parts["休"].length === 2, "parts 休 = 亻 + 木");
});

t("learner stage: readable() only passes known kana/kanji", () => {
  const ks = { h: new Set([..."あいうえおかきくけこ"]), k: new Set(), kanji: new Set(), yoonH: false, yoonK: false };
  ok(STAGE.readable("かお", ks) && STAGE.readable("あおい。", ks), "known kana + punctuation");
  ok(!STAGE.readable("かさ", ks) && !STAGE.readable("コーヒー", ks) && !STAGE.readable("何", ks) && !STAGE.readable("3じ", ks), "unknown kana / katakana / kanji / digits");
  ok(!STAGE.readable("きょう", ks), "yoon needs the combination lesson");
  ks.h.add("よ"); ks.h.add("つ"); ks.yoonH = true; ok(STAGE.readable("きょう", ks) && STAGE.readable("こっか", ks), "small kana map to their base kana");
  ks.k = new Set([..."コヒ"]); ok(STAGE.readable("コーヒー", ks), "long mark with katakana");
  ks.kanji.add("日"); ok(STAGE.readable("日", ks), "known kanji");
});
t("phrases and starter sentences", () => {
  ok(D.PHRASES.length >= 35, "phrase count"); D.PHRASES.forEach(p => ok(p.length === 3 && p.every(Boolean), "phrase " + p[0]));
  eq(new Set(D.PHRASES.map(p => p[1])).size, D.PHRASES.length, "unique meanings (quiz options)");
  const sen = JSON.parse(fs.readFileSync(path.join(SRC, "data", "sentences.json"), "utf8")); ok(sen.s && sen.s.length >= 2000, "starter pool");
  ok(sen.s.filter(x => !/\[/.test(x[0])).length > 300, "kana-only starter sentences exist");
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
