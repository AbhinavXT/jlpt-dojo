// Unit + data-integrity tests. Run: node n5-dojo/tests/unit.test.js
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const SRC = path.join(__dirname, "..", "src");
const { FSRS, IME, CONJ, NUM } = require(path.join(SRC, "core.js"));

let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); pass++; } catch (e) { fail++; console.log("FAIL:", name, "\n   ", e.message); } };
const eq = (a, b, msg = "") => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const ok = (c, msg) => { if (!c) throw new Error(msg); };

// load data files into a sandbox
const ctx = {}; vm.createContext(ctx);
for (const f of ["data_kana.js", "data_kanji.js", "data_grammar.js", "data_grammar_up.js", "data_words.js", "data_reading.js", "data_order.js", "curriculum.js"])
  vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8") + `\n;globalThis.__=Object.assign(globalThis.__||{}, {${{
    "data_kana.js": "KANA_GROUPS,KANA_NOTES", "data_kanji.js": "KANJI", "data_grammar.js": "GRAMMAR", "data_grammar_up.js": "GRAMMAR_UP",
    "data_words.js": "VERBS,ADJS", "data_reading.js": "READINGS", "data_order.js": "ORDER_SENTENCES", "curriculum.js": "PACING,PHASES,WEEKS,F" }[f]}});`, ctx);
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
