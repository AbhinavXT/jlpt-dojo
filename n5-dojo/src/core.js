"use strict";
/* Pure logic (no DOM): FSRS-6 scheduler, romaji→kana IME, conjugation engine, number/counter readings.
   Loaded in the browser before app.js and require()-able from Node for tests. */

// ---------------- FSRS-6 (port of py-fsrs default parameters / formulas) ----------------
const FSRS = (() => {
  const W = [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835,
    0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542];
  const DECAY = -W[20], FACTOR = Math.pow(0.9, 1 / DECAY) - 1, SMIN = 0.001;
  const clampD = d => Math.min(10, Math.max(1, d));
  const clampS = s => Math.max(SMIN, s);
  const R = (t, S) => Math.pow(1 + (FACTOR * t) / S, DECAY);
  const initS = g => clampS(W[g - 1]);
  const initDraw = g => W[4] - Math.exp(W[5] * (g - 1)) + 1;
  const initD = g => clampD(initDraw(g));
  const nextD = (D, g) => { const delta = -W[6] * (g - 3); const d2 = D + ((10 - D) * delta) / 9; return clampD(W[7] * initDraw(4) + (1 - W[7]) * d2); };
  const recallS = (D, S, r, g) => clampS(S * (1 + Math.exp(W[8]) * (11 - D) * Math.pow(S, -W[9]) * (Math.exp((1 - r) * W[10]) - 1) * (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1)));
  const forgetS = (D, S, r) => clampS(Math.min(W[11] * Math.pow(D, -W[12]) * (Math.pow(S + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]), S / Math.exp(W[17] * W[18])));
  const shortS = (S, g) => { let inc = Math.exp(W[17] * (g - 3 + W[18])) * Math.pow(S, -W[19]); if (g >= 2) inc = Math.max(1, inc); return clampS(S * inc); };
  const interval = (S, retention = 0.9, max = 36500) => Math.min(max, Math.max(1, Math.round((S / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1))));
  /** Returns the new memory state. card: {s,d,reps,lapses,ivl}; elapsed: whole days since last review (0 = same day). */
  function review(card, g, elapsed, opts = {}) {
    const c = Object.assign({ s: 0, d: 0, reps: 0, lapses: 0, ivl: 0 }, card);
    const ret = opts.retention || 0.9, max = opts.maxIvl || 36500;
    if (!c.reps || !c.s) { c.s = initS(g); c.d = initD(g); }
    else if (elapsed <= 0) { c.s = shortS(c.s, g); c.d = nextD(c.d, g); }
    else {
      const r = R(elapsed, c.s);
      c.s = g === 1 ? forgetS(c.d, c.s, r) : recallS(c.d, c.s, r, g);
      c.d = nextD(c.d, g);
    }
    if (g === 1 && c.ivl >= 1) c.lapses++;
    c.ivl = g === 1 ? 0 : interval(c.s, ret, max);
    c.reps++;
    return c;
  }
  return { W, R, review, interval, initS, initD };
})();

// ---------------- romaji → kana ----------------
const IME = (() => {
  const T = {
    a: "あ", i: "い", u: "う", e: "え", o: "お",
    ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ", kya: "きゃ", kyu: "きゅ", kyo: "きょ",
    ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご", gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
    sa: "さ", shi: "し", si: "し", su: "す", se: "せ", so: "そ", sha: "しゃ", shu: "しゅ", sho: "しょ", she: "しぇ", sya: "しゃ", syu: "しゅ", syo: "しょ",
    za: "ざ", ji: "じ", zi: "じ", zu: "ず", ze: "ぜ", zo: "ぞ", ja: "じゃ", ju: "じゅ", jo: "じょ", je: "じぇ", jya: "じゃ", jyu: "じゅ", jyo: "じょ", zya: "じゃ", zyu: "じゅ", zyo: "じょ",
    ta: "た", chi: "ち", ti: "ち", tsu: "つ", tu: "つ", te: "て", to: "と", cha: "ちゃ", chu: "ちゅ", cho: "ちょ", che: "ちぇ", tya: "ちゃ", tyu: "ちゅ", tyo: "ちょ", cya: "ちゃ", cyu: "ちゅ", cyo: "ちょ",
    da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど", dya: "ぢゃ", dyu: "ぢゅ", dyo: "ぢょ",
    na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の", nya: "にゃ", nyu: "にゅ", nyo: "にょ",
    ha: "は", hi: "ひ", fu: "ふ", hu: "ふ", he: "へ", ho: "ほ", hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ", fa: "ふぁ", fi: "ふぃ", fe: "ふぇ", fo: "ふぉ",
    ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ", bya: "びゃ", byu: "びゅ", byo: "びょ",
    pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ", pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
    ma: "ま", mi: "み", mu: "む", me: "め", mo: "も", mya: "みゃ", myu: "みゅ", myo: "みょ",
    ya: "や", yu: "ゆ", yo: "よ",
    ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ", rya: "りゃ", ryu: "りゅ", ryo: "りょ",
    la: "ら", li: "り", lu: "る", le: "れ", lo: "ろ", lya: "りゃ", lyu: "りゅ", lyo: "りょ",
    wa: "わ", wo: "を", wi: "うぃ", we: "うぇ", va: "ゔぁ", vi: "ゔぃ", vu: "ゔ", ve: "ゔぇ", vo: "ゔぉ",
    xa: "ぁ", xi: "ぃ", xu: "ぅ", xe: "ぇ", xo: "ぉ", xya: "ゃ", xyu: "ゅ", xyo: "ょ", xtsu: "っ", xtu: "っ", ltu: "っ", ltsu: "っ",
    "-": "ー", "~": "〜", ".": "。", ",": "、", "?": "？", "!": "！"
  };
  const VOW = "aiueo";
  function toKana(input) {
    const s = String(input).toLowerCase();
    let out = "", i = 0;
    while (i < s.length) {
      const c = s[i], n = s[i + 1];
      if (c === "n") {
        if (n === "n") { out += "ん"; i += VOW.includes(s[i + 2]) || s[i + 2] === "y" ? 1 : 2; continue; }
        if (n === "'") { out += "ん"; i += 2; continue; }
        if (n === undefined || (!VOW.includes(n) && n !== "y")) { out += "ん"; i++; continue; }
      }
      if (c === n && /[bcdfghjklmpqrstvwxyz]/.test(c)) { out += "っ"; i++; continue; }
      if (c === "t" && n === "c" && s[i + 2] === "h") { out += "っ"; i++; continue; } // matcha
      let hit = false;
      for (const L of [4, 3, 2, 1]) {
        const k = s.substr(i, L);
        if (T[k]) { out += T[k]; i += L; hit = true; break; }
      }
      if (!hit) { out += c; i++; }
    }
    return out;
  }
  const kata2hira = s => String(s).replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  const hira2kata = s => String(s).replace(/[ぁ-ゖ]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));
  /** Normalise any answer (romaji, kana, mixed) to hiragana for comparison. */
  const norm = s => kata2hira(toKana(String(s).trim().replace(/[\s　]/g, ""))).replace(/[。、．,.!?！？]/g, "");
  return { toKana, kata2hira, hira2kata, norm };
})();

// ---------------- conjugation ----------------
const CONJ = (() => {
  const ROW = { う: "わいうえお", く: "かきくけこ", ぐ: "がぎぐげご", す: "さしすせそ", つ: "たちつてと", ぬ: "なにぬねの", ぶ: "ばびぶべぼ", む: "まみむめも", る: "らりるれろ" };
  const TE = { う: "って", つ: "って", る: "って", む: "んで", ぶ: "んで", ぬ: "んで", く: "いて", ぐ: "いで", す: "して" };
  const stemU = (v, col) => v.slice(0, -1) + ROW[v.slice(-1)][col];
  /** cls: 'ru' | 'u' | 'suru' | 'kuru' | 'iku' | 'aru'. v is the dictionary form in kana (compounds like べんきょうする allowed). Returns array of accepted answers (first = canonical) or null if N/A. */
  function verb(v, cls, form) {
    if (cls === "suru") { const p = v.slice(0, -2); const m = { masu: "します", masen: "しません", mashita: "しました", masendeshita: "しませんでした", te: "して", ta: "した", nai: "しない", nakatta: "しなかった", pot: "できる", vol: "しよう", ba: "すれば", pass: "される", caus: "させる", tara: "したら", dict: "する", want: "したい" }[form]; return m ? [p + m] : null; }
    if (cls === "kuru") { const p = v.slice(0, -2); const m = { masu: "きます", masen: "きません", mashita: "きました", masendeshita: "きませんでした", te: "きて", ta: "きた", nai: "こない", nakatta: "こなかった", pot: ["こられる", "これる"], vol: "こよう", ba: "くれば", pass: "こられる", caus: "こさせる", tara: "きたら", dict: "くる", want: "きたい" }[form]; return m ? [].concat(m).map(x => p + x) : null; }
    const ru = cls === "ru";
    const base = ru ? v.slice(0, -1) : null;
    const end = v.slice(-1);
    const i = ru ? base : stemU(v, 1);
    const te = ru ? base + "て" : cls === "iku" ? v.slice(0, -1) + "って" : v.slice(0, -1) + TE[end];
    const ta = te.replace(/て$/, "た").replace(/で$/, "だ");
    const a = ru ? base : stemU(v, 0);
    const nai = cls === "aru" ? "ない" : a + "ない";
    switch (form) {
      case "dict": return [v];
      case "masu": return [i + "ます"];
      case "masen": return [i + "ません"];
      case "mashita": return [i + "ました"];
      case "masendeshita": return [i + "ませんでした"];
      case "want": return cls === "aru" ? null : [i + "たい"];
      case "te": return [te];
      case "ta": return [ta];
      case "tara": return [ta + "ら"];
      case "nai": return [nai];
      case "nakatta": return [nai.slice(0, -1) + "かった"];
      case "pot": return cls === "aru" ? null : ru ? [base + "られる", base + "れる"] : [stemU(v, 3) + "る"];
      case "vol": return [ru ? base + "よう" : stemU(v, 4) + "う"];
      case "ba": return [ru ? base + "れば" : stemU(v, 3) + "ば"];
      case "pass": return cls === "aru" ? null : [ru ? base + "られる" : a + "れる"];
      case "caus": return cls === "aru" ? null : [ru ? base + "させる" : a + "せる"];
    }
    return null;
  }
  /** type: 'i' | 'na'. a: dictionary form in kana (na-adjectives without な). */
  function adj(a, type, form) {
    if (type === "i") {
      const s = a === "いい" ? "よ" : a.slice(0, -1);
      return { plain: [a], polite: [a + "です"], neg: [s + "くない"], negpol: [s + "くないです", s + "くありません"], past: [s + "かった"], pastpol: [s + "かったです"], pastneg: [s + "くなかった"], te: [s + "くて"], adv: [s + "く"], naru: [s + "くなる"] }[form] || null;
    }
    return { plain: [a + "だ"], polite: [a + "です"], neg: [a + "じゃない", a + "ではない"], negpol: [a + "じゃないです", a + "じゃありません", a + "ではありません"], past: [a + "だった"], pastpol: [a + "でした"], pastneg: [a + "じゃなかった", a + "ではなかった"], te: [a + "で"], adv: [a + "に"], naru: [a + "になる"], attr: [a + "な"] }[form] || null;
  }
  const VFORMS = { // [label, level]
    masu: ["polite ～ます", 5], masen: ["polite negative ～ません", 5], mashita: ["polite past ～ました", 5], masendeshita: ["polite past negative ～ませんでした", 5],
    te: ["て-form", 5], ta: ["た-form (plain past)", 5], nai: ["ない-form (plain negative)", 5], nakatta: ["plain past negative ～なかった", 5], want: ["want to ～たい", 5],
    pot: ["potential (can do)", 4], vol: ["volitional (let's / I'll)", 4], ba: ["conditional ～ば", 4], tara: ["conditional ～たら", 4], pass: ["passive ～られる", 4], caus: ["causative ～させる", 4]
  };
  const AFORMS = { polite: ["polite ～です", 5], neg: ["plain negative", 5], negpol: ["polite negative", 5], past: ["plain past", 5], pastpol: ["polite past", 5], pastneg: ["plain past negative", 5], te: ["て-form (and…)", 5], adv: ["adverb (～く / ～に)", 5], naru: ["become ～なる", 5] };
  return { verb, adj, VFORMS, AFORMS };
})();

// ---------------- numbers, time, dates, counters ----------------
const NUM = (() => {
  const U = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];
  const H = ["", "ひゃく", "にひゃく", "さんびゃく", "よんひゃく", "ごひゃく", "ろっぴゃく", "ななひゃく", "はっぴゃく", "きゅうひゃく"];
  const S = ["", "せん", "にせん", "さんぜん", "よんせん", "ごせん", "ろくせん", "ななせん", "はっせん", "きゅうせん"];
  function under1e4(n, isMan) {
    const th = Math.floor(n / 1000), hu = Math.floor((n % 1000) / 100), te = Math.floor((n % 100) / 10), un = n % 10;
    return (th === 1 && isMan ? "いっせん" : S[th]) + H[hu] + (te ? (te === 1 ? "" : U[te]) + "じゅう" : "") + U[un];
  }
  function read(n) {
    if (n === 0) return "ゼロ";
    const oku = Math.floor(n / 1e8), man = Math.floor((n % 1e8) / 1e4), rest = n % 1e4;
    return (oku ? under1e4(oku) + "おく" : "") + (man ? under1e4(man, true) + "まん" : "") + under1e4(rest);
  }
  const HOUR = ["", "いちじ", "にじ", "さんじ", "よじ", "ごじ", "ろくじ", "しちじ", "はちじ", "くじ", "じゅうじ", "じゅういちじ", "じゅうにじ"];
  const MINU = ["", "いっぷん", "にふん", "さんぷん", "よんぷん", "ごふん", "ろっぷん", "ななふん", "はっぷん", "きゅうふん"];
  function minutes(m) {
    const te = Math.floor(m / 10), un = m % 10;
    if (!un) return [(te === 1 ? "" : U[te]) + "じゅっぷん", (te === 1 ? "" : U[te]) + "じっぷん"];
    const pre = te ? (te === 1 ? "" : U[te]) + "じゅう" : "";
    const alts = [pre + MINU[un]];
    if (un === 8) alts.push(pre + "はちふん");
    return alts;
  }
  function time(h, m) {
    const hr = HOUR[h];
    if (!m) return [hr];
    const ms = minutes(m).map(x => hr + x);
    if (m === 30) ms.push(hr + "はん");
    return ms;
  }
  const MONTH = ["", "いちがつ", "にがつ", "さんがつ", "しがつ", "ごがつ", "ろくがつ", "しちがつ", "はちがつ", "くがつ", "じゅうがつ", "じゅういちがつ", "じゅうにがつ"];
  const DAY10 = ["", "ついたち", "ふつか", "みっか", "よっか", "いつか", "むいか", "なのか", "ようか", "ここのか", "とおか"];
  function day(d) {
    if (d <= 10) return [DAY10[d]];
    if (d === 14) return ["じゅうよっか"]; if (d === 20) return ["はつか"]; if (d === 24) return ["にじゅうよっか"];
    const te = Math.floor(d / 10), un = d % 10;
    const u = un === 7 ? "しち" : un === 9 ? "く" : U[un];
    return [(te === 1 ? "" : U[te]) + "じゅう" + u + "にち"];
  }
  const WEEK = ["にちようび", "げつようび", "かようび", "すいようび", "もくようび", "きんようび", "どようび"];
  const WEEKK = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
  // counters: readings for 1..10; [kanji, meaning, readings[1..10] (string or array)]
  const C = {
    tsu: ["つ", "things (general)", [, "ひとつ", "ふたつ", "みっつ", "よっつ", "いつつ", "むっつ", "ななつ", "やっつ", "ここのつ", "とお"]],
    nin: ["人", "people", [, "ひとり", "ふたり", "さんにん", "よにん", "ごにん", "ろくにん", ["しちにん", "ななにん"], "はちにん", ["きゅうにん", "くにん"], "じゅうにん"]],
    hon: ["本", "long things (pens, bottles)", [, "いっぽん", "にほん", "さんぼん", "よんほん", "ごほん", "ろっぽん", "ななほん", ["はっぽん", "はちほん"], "きゅうほん", ["じゅっぽん", "じっぽん"]]],
    mai: ["枚", "flat things (paper, tickets)", [, "いちまい", "にまい", "さんまい", "よんまい", "ごまい", "ろくまい", "ななまい", "はちまい", "きゅうまい", "じゅうまい"]],
    satsu: ["冊", "books", [, "いっさつ", "にさつ", "さんさつ", "よんさつ", "ごさつ", "ろくさつ", "ななさつ", "はっさつ", "きゅうさつ", ["じゅっさつ", "じっさつ"]]],
    ko: ["個", "small objects", [, "いっこ", "にこ", "さんこ", "よんこ", "ごこ", "ろっこ", "ななこ", ["はっこ", "はちこ"], "きゅうこ", ["じゅっこ", "じっこ"]]],
    kai: ["回", "times (occurrences)", [, "いっかい", "にかい", "さんかい", "よんかい", "ごかい", "ろっかい", "ななかい", ["はっかい", "はちかい"], "きゅうかい", ["じゅっかい", "じっかい"]]],
    kaif: ["階", "floors", [, "いっかい", "にかい", ["さんがい", "さんかい"], "よんかい", "ごかい", "ろっかい", "ななかい", ["はっかい", "はちかい"], "きゅうかい", ["じゅっかい", "じっかい"]]],
    hai: ["杯", "cups, glasses", [, "いっぱい", "にはい", "さんばい", "よんはい", "ごはい", "ろっぱい", "ななはい", ["はっぱい", "はちはい"], "きゅうはい", ["じゅっぱい", "じっぱい"]]],
    hiki: ["匹", "small animals", [, "いっぴき", "にひき", "さんびき", "よんひき", "ごひき", "ろっぴき", "ななひき", ["はっぴき", "はちひき"], "きゅうひき", ["じゅっぴき", "じっぴき"]]],
    sai: ["歳", "years of age", [, "いっさい", "にさい", "さんさい", "よんさい", "ごさい", "ろくさい", "ななさい", "はっさい", "きゅうさい", ["じゅっさい", "じっさい"]]],
    dai: ["台", "machines, vehicles", [, "いちだい", "にだい", "さんだい", "よんだい", "ごだい", "ろくだい", "ななだい", "はちだい", "きゅうだい", "じゅうだい"]],
    fun: ["分", "minutes", [, ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(minutes)]],
    ji: ["時間", "hours (duration)", [, "いちじかん", "にじかん", "さんじかん", "よじかん", "ごじかん", "ろくじかん", ["しちじかん", "ななじかん"], "はちじかん", "くじかん", "じゅうじかん"]],
    shuu: ["週間", "weeks", [, "いっしゅうかん", "にしゅうかん", "さんしゅうかん", "よんしゅうかん", "ごしゅうかん", "ろくしゅうかん", "ななしゅうかん", ["はっしゅうかん", "はちしゅうかん"], "きゅうしゅうかん", ["じゅっしゅうかん", "じっしゅうかん"]]],
    kagetsu: ["か月", "months (duration)", [, "いっかげつ", "にかげつ", "さんかげつ", "よんかげつ", "ごかげつ", "ろっかげつ", "ななかげつ", ["はっかげつ", "はちかげつ"], "きゅうかげつ", ["じゅっかげつ", "じっかげつ"]]],
    nen: ["年", "years", [, "いちねん", "にねん", "さんねん", "よねん", "ごねん", "ろくねん", ["ななねん", "しちねん"], "はちねん", ["きゅうねん", "くねん"], "じゅうねん"]]
  };
  const counter = (k, n) => [].concat(C[k][2][n]);
  function yen(n) {
    const r = read(n);
    return [(n % 10 === 4 ? r.replace(/よん$/, "よ") : r) + "えん"];
  }
  return { read, time, minutes, day, MONTH, WEEK, WEEKK, C, counter, yen };
})();

if (typeof module !== "undefined") module.exports = { FSRS, IME, CONJ, NUM };
