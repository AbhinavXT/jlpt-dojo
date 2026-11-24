"use strict";
/* N5 Dojo (now N5→N1): offline JLPT trainer.
   Data: VOCAB/KANJI_UP/STROKES (build.py), data_*.js, curriculum.js. Logic: core.js (FSRS, IME, CONJ, NUM). */

// ---------- utils ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const z2 = n => String(n).padStart(2, "0");
const ymd = d => `${d.getFullYear()}-${z2(d.getMonth() + 1)}-${z2(d.getDate())}`;
const parseD = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
const diffDays = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5); // b - a
const today = () => ymd(new Date());
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const rnd = a => a[Math.floor(Math.random() * a.length)];
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const fmtDate = s => parseD(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: Math.abs(diffDays(today(), s)) > 300 ? "numeric" : undefined });
const HAS_KANJI = /[一-龯々]/;
const IS_JP = /[぀-ヿ一-龯]/;
const href = p => esc(encodeURI(p));

// ---------- levels ----------
const LEVELS = [5, 4, 3, 2, 1];
const LV = {
  5: { secs: [["文字・語彙", 20], ["文法・読解", 40], ["聴解", 30]], pass: "80/180 · Language+Reading ≥38/120 · Listening ≥19/60", hours: "325–500", mock: 45,
       can: "Read and understand typical expressions and sentences in hiragana, katakana and basic kanji. Follow slow, short conversations about everyday topics." },
  4: { secs: [["文字・語彙", 25], ["文法・読解", 55], ["聴解", 35]], pass: "90/180 · Language+Reading ≥38/120 · Listening ≥19/60", hours: "575–1,000", mock: 55,
       can: "Read passages on familiar daily topics written in basic vocabulary and kanji. Follow conversations spoken slightly slowly." },
  3: { secs: [["文字・語彙", 30], ["文法・読解", 70], ["聴解", 40]], pass: "95/180 · each section ≥19/60", hours: "950–1,700", mock: 65,
       can: "Read writings with specific content on everyday topics, and grasp summaries such as newspaper headlines. Follow near-natural-speed conversations." },
  2: { secs: [["言語知識・読解", 105], ["聴解", 50]], pass: "90/180 · each section ≥19/60", hours: "1,600–2,600", mock: 70,
       can: "Read clearly written articles and commentaries on a wide range of topics. Follow natural-speed conversations and news." },
  1: { secs: [["言語知識・読解", 110], ["聴解", 55]], pass: "100/180 · each section ≥19/60", hours: "3,000–4,800", mock: 75,
       can: "Read logically complex and abstract writing, and grasp structure and intent. Follow natural-speed lectures, news and conversations in depth." }
};
// Next JLPT session (first Sunday of July / December) at least `min` days away.
function nextExam(from, min = 120) {
  for (let y = parseD(from).getFullYear(); y < parseD(from).getFullYear() + 4; y++) {
    for (const m of [7, 12]) {
      const d = new Date(y, m - 1, 1); while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
      const s = ymd(d); if (diffDays(from, s) >= min) return s;
    }
  }
  return addDays(from, 180);
}
const nextMonday = s => { const d = parseD(s); while (d.getDay() !== 1) d.setDate(d.getDate() + 1); return ymd(d); };

// ---------- content model ----------
const ITEMS = {};
const ORDER = { kana: {}, vocab: {}, kanji: {}, grammar: {} };
LEVELS.forEach(l => Object.values(ORDER).forEach(o => (o[l] = [])));
const spread = (i, n, r) => r.from + Math.floor((i * (r.to - r.from + 1)) / Math.max(1, n));
const add = (it, lv) => { it.lv = lv; ITEMS[it.id] = it; ORDER[it.type][lv].push(it.id); };

KANA_GROUPS.forEach(g => {
  for (const sc of ["h", "k"]) g.rows.forEach(row => {
    const ch = sc === "h" ? row[0] : row[1];
    add({ id: `k${sc}:${ch}`, type: "kana", script: sc, ch, ans: row.slice(2), r: row[2], grp: g.day, gname: g.name, kday: (sc === "h" ? PACING.kanaHira : PACING.kanaKata) + g.day }, 5);
  });
});
ORDER.kana[5].sort((a, b) => ITEMS[a].kday - ITEMS[b].kday);
LEVELS.forEach(lv => (VOCAB[lv] || []).forEach(v => {
  const id = `v:${v[0]}|${v[1]}`; if (ITEMS[id]) return;
  add({ id, type: "vocab", w: v[0], r: v[1], e: v[2] }, lv);
}));
KANJI.forEach(k => add({ id: `j:${k[0]}`, type: "kanji", k: k[0], m: k[1], on: k[2], kun: k[3], ex: k[4], exr: k[5], exm: k[6] }, 5));
KANJI_UP.forEach(k => add({ id: `j:${k[0]}`, type: "kanji", k: k[0], m: k[2], on: k[3], kun: k[4], strokes: k[5] }, k[1]));
GRAMMAR.forEach((g, i) => add(Object.assign({ id: `g:${g.p}`, type: "grammar", n_: i + 1 }, g), 5));
[4, 3, 2, 1].forEach(lv => {
  const rows = GRAMMAR_UP[lv] || []; const keys = rows.map(r => r[4]);
  rows.forEach((r, i) => {
    const [p, m, jp, en, key, dis] = r;
    const others = shuffle(keys.filter(k => k !== key && !jp.includes(k)));
    const near = others.filter(k => Math.abs(k.length - key.length) <= 2);
    const d = dis || [...near, ...others].filter((k, j, a) => a.indexOf(k) === j).slice(0, 3);
    add({ id: `g${lv}:${p}`, type: "grammar", n_: i + 1, p, m, n: "", ex: [[jp, en]], q: [[jp.replace(key, "＿＿"), key, d, en]] }, lv);
  });
});
const KANJI_BY_CHAR = {}; Object.values(ITEMS).forEach(i => { if (i.type === "kanji") KANJI_BY_CHAR[i.k] = i; });
const ALL = t => LEVELS.flatMap(l => ORDER[t][l]);
const VOCAB_BY_READING = {}; ALL("vocab").forEach(id => { const i = ITEMS[id]; (VOCAB_BY_READING[i.r] = VOCAB_BY_READING[i.r] || []).push(i); });
const exCache = {};
function kanjiExample(i) {
  if (i.ex) return { w: i.ex, r: i.exr, e: i.exm };
  if (exCache[i.k] !== undefined) return exCache[i.k];
  for (const l of [i.lv, ...LEVELS.filter(l => l !== i.lv)]) { const v = ORDER.vocab[l].map(id => ITEMS[id]).find(v => v.w.includes(i.k) && v.w !== i.k); if (v) return (exCache[i.k] = { w: v.w, r: v.r, e: v.e }); }
  return (exCache[i.k] = null);
}
const kanjiKnownUpTo = (c, lv) => KANJI_BY_CHAR[c] && KANJI_BY_CHAR[c].lv >= lv;
const vMain = it => { // show kana if the word uses kanji beyond its own level (as on the exam)
  if (!HAS_KANJI.test(it.w)) return it.w;
  return [...it.w].filter(c => HAS_KANJI.test(c)).every(c => kanjiKnownUpTo(c, it.lv)) ? it.w : it.r;
};
const vKanjiTestable = it => HAS_KANJI.test(it.w) && it.w !== it.r && [...it.w].filter(c => HAS_KANJI.test(c)).every(c => kanjiKnownUpTo(c, it.lv));
const TYPE_LABEL = { kana: "Kana", vocab: "Vocab", kanji: "Kanji", grammar: "Grammar" };
const BATCH = { vocab: 8, kanji: 3, grammar: 2 };
const TYPES = ["kana", "vocab", "kanji", "grammar"];

// ---------- state ----------
const KEY = "n5dojo.v1";
const DEFAULTS = () => ({ v: 2, settings: { level: 5, start: "2026-11-30", exam: "2027-07-04", tts: true, rate: 0.85, production: false, retention: 0.9, theme: "auto" },
  cards: {}, log: {}, tests: [], tasks: {}, drills: {}, read: {}, history: [], lastExport: null, created: today() });
let S;
function migrate(s) {
  const d = DEFAULTS();
  s = Object.assign(d, s, { settings: Object.assign(d.settings, s.settings || {}) });
  for (const c of Object.values(s.cards)) {
    if (c.s === undefined) { // v1 SM-2 card → FSRS state
      c.s = Math.max(0.5, c.ivl || 0.5); c.d = Math.min(10, Math.max(1, 5 + (2.5 - (c.ef || 2.5)) * 5));
      c.lastDay = c.last ? ymd(new Date(c.last)) : c.added || today(); delete c.ef;
    }
  }
  s.v = 2; return s;
}
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return migrate(JSON.parse(raw)); }
  catch (e) { console.warn("load failed", e); }
  return DEFAULTS();
}
let saveWarned = false;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { if (!saveWarned) { saveWarned = true; alert("Could not save progress in this browser (storage blocked). Use Settings → Export often."); } }
}
S = load();
const applyTheme = () => { const t = S.settings.theme; if (t === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t); };
applyTheme();

// ---------- schedule ----------
const L = () => S.settings.level;
const dayIdx = () => diffDays(S.settings.start, today());
const effDay = () => Math.max(0, dayIdx());
const totalWeeks = () => Math.max(1, Math.ceil((diffDays(S.settings.start, S.settings.exam) + 1) / 7));
const weekNo = () => (dayIdx() < 0 ? 0 : Math.floor(dayIdx() / 7) + 1);
const daysToExam = () => diffDays(today(), S.settings.exam);
function pacing(lv) {
  if (lv === 5) return PACING;
  const D = Math.max(28, diffDays(S.settings.start, S.settings.exam)); const e = Math.round(D * 0.55);
  return { vocab: { from: 0, to: e }, kanji: { from: 0, to: Math.round(e * 0.9) }, grammar: { from: 0, to: e } };
}
let UNLOCK = {};
function computeUnlocks() {
  UNLOCK = {}; const cur = L(), P = pacing(cur);
  TYPES.forEach(t => LEVELS.forEach(lv => ORDER[t][lv].forEach((id, i, arr) => {
    if (lv > cur) UNLOCK[id] = -1;                 // easier level → foundation
    else if (lv < cur) UNLOCK[id] = Infinity;      // harder level → later
    else UNLOCK[id] = t === "kana" ? ITEMS[id].kday : spread(i, arr.length, P[t]);
  })));
}
computeUnlocks();
const curIds = t => ORDER[t][L()] || [];
const unlocked = t => curIds(t).filter(id => UNLOCK[id] <= effDay());
const fresh = t => unlocked(t).filter(id => !S.cards[id]);
const ahead = t => curIds(t).filter(id => !S.cards[id]);
const gaps = t => LEVELS.filter(l => l > L()).flatMap(l => ORDER[t][l]).filter(id => !S.cards[id]);
const dueIds = () => Object.keys(S.cards).filter(id => ITEMS[id] && S.cards[id].due <= today());
const introducedIn = ids => ids.filter(id => S.cards[id]);
const matureIn = ids => ids.filter(id => S.cards[id] && S.cards[id].ivl >= 21);
const knownIn = ids => ids.filter(id => S.cards[id] && S.cards[id].ivl >= 1);
function phasesFor(lv) {
  if (lv === 5) return PHASES;
  const tw = totalWeeks(), a = Math.max(1, Math.ceil(tw * 0.55)), b = Math.max(a + 1, Math.ceil(tw * 0.8));
  return [
    { id: "A", name: "Learn", weeks: [1, a], goal: `All new N${lv} vocab, kanji and grammar, alongside daily reviews of everything below.` },
    { id: "B", name: "Consolidate", weeks: [a + 1, b], goal: "No new cards. Reading and listening volume, weekly mock, clear your leeches." },
    { id: "C", name: "Exam prep", weeks: [b + 1, Math.max(b + 1, tw)], goal: `Timed mocks with the official timings (${LV[lv].secs.map(s => s[0] + " " + s[1] + "m").join(" / ")}), then rest.` }
  ];
}
const phaseOf = w => { const P = phasesFor(L()); return P.find(p => w >= p.weeks[0] && w <= p.weeks[1]) || (w < 1 ? P[0] : P[P.length - 1]); };
const READ_TIP = { 4: "Read 1 Tadoku graded reader (level 1–2) or an NHK News Web Easy article a day", 3: "NHK News Web Easy daily + 1 Tadoku level 2–3 book a week; try a simple manga (Yotsuba&!)", 2: "Regular NHK News articles and one light-novel chapter a week", 1: "Newspaper columns and editorials, essays and novels; summarise one in Japanese weekly" };
const LISTEN_TIP = { 4: "Listening: Nihongo con Teppei for Beginners, 10 min/day", 3: "Listening: Nihongo con Teppei (intermediate) or Japanese with Noriko, 15 min/day", 2: "Listening: podcasts and dramas with Japanese subtitles, 20 min/day", 1: "Listening: NHK radio news, debates and lectures, 20 min/day" };
function weekTasks(w) {
  const lv = L();
  if (lv === 5) return WEEKS[Math.min(w, 31)] || [];
  const ph = phaseOf(w), t = [];
  if (ph.id === "A") {
    t.push(["Grammar: write 2 sentences of your own with each new point this week"], [READ_TIP[lv]], [LISTEN_TIP[lv]]);
    if (lv === 4) t.push(["Drills → Conjugation with N4 forms (potential, passive, causative, ば/たら), 5 min x3"]);
    if (lv === 4 && w <= 6) t.push(["Tae Kim: Potential Form, Conditionals, Giving and Receiving, Causative and Passive", F.tk]);
    t.push([w % 4 === 0 ? "Sunday: Full mock (Test tab)" : "Sunday: Quick test (Test tab)"]);
  } else if (ph.id === "B") {
    t.push(["Sunday: Full mock"], ["Drill your leeches (Stats tab) until none are left"], [READ_TIP[lv]], [LISTEN_TIP[lv]],
      [`Free official sample questions for N${lv} from jlpt.jp, timed`],
      [lv >= 4 ? "Write a 5–8 sentence diary entry twice a week" : "Write a 300–400 character journal entry twice a week and get it corrected (e.g. LangCorrect)"]);
  } else {
    t.push(["Full mock x2 (Wed + Sun)"], [`Official practice workbook (公式問題集) under exam timing: ${LV[lv].secs.map(s => s[0] + " " + s[1] + " min").join(", ")}`], ["Review every wrong mock answer"], ["Final week: light reviews only, prepare the admission voucher and ID"]);
  }
  return t;
}

// ---------- SRS: FSRS-6 ----------
const maxIvl = () => { const h = Math.floor(daysToExam() / 2); return h > 4 ? Math.min(365, h) : 365; };
const fsrsOpts = () => ({ retention: S.settings.retention || 0.9, maxIvl: maxIvl() });
function previewIvl(c, g) { const el = c.lastDay ? diffDays(c.lastDay, today()) : 0; return FSRS.review(c, g, el, fsrsOpts()).ivl; }
function introduce(id) { if (!S.cards[id]) { S.cards[id] = { due: today(), ivl: 0, s: 0, d: 0, reps: 0, lapses: 0, last: 0, lastDay: null, added: today() }; logDay().n++; } }
function logDay() { const t = today(); return (S.log[t] = S.log[t] || { r: 0, ok: 0, n: 0, sec: 0 }); }
let lastAct = Date.now();
function grade(id, g) {
  const c = S.cards[id]; if (!c) return;
  const el = c.lastDay ? diffDays(c.lastDay, today()) : 0;
  const nc = FSRS.review(c, g, el, fsrsOpts());
  Object.assign(c, nc, { due: addDays(today(), nc.ivl), last: Date.now(), lastDay: today() });
  const Lg = logDay(); Lg.r++; if (g > 1) Lg.ok++;
  Lg.sec += Math.min(60, (Date.now() - lastAct) / 1000); lastAct = Date.now();
  save();
}
function drillLog(name, ok) {
  const d = (S.drills[name] = S.drills[name] || { n: 0, ok: 0 }); d.n++; if (ok) d.ok++;
  const Lg = logDay(); Lg.sec += Math.min(60, (Date.now() - lastAct) / 1000); lastAct = Date.now(); Lg.dr = (Lg.dr || 0) + 1;
  save();
}
const ivlLabel = d => (d === 0 ? "again" : d < 30 ? `${d}d` : d < 365 ? `${Math.round(d / 30)}mo` : `${(d / 365).toFixed(1)}y`);
const active = Lg => Lg && (Lg.r || Lg.dr);
function streak() {
  let n = 0, d = today();
  if (!active(S.log[d])) d = addDays(d, -1);
  while (active(S.log[d])) { n++; d = addDays(d, -1); }
  return n;
}
const retrievNow = c => (c.lastDay && c.s ? FSRS.R(diffDays(c.lastDay, today()), c.s) : null);

// ---------- TTS ----------
let JA_VOICE = null;
function initVoices() { if (!("speechSynthesis" in window)) return; const vs = speechSynthesis.getVoices(); JA_VOICE = vs.find(v => /^ja/i.test(v.lang)) || null; }
if ("speechSynthesis" in window) { initVoices(); speechSynthesis.onvoiceschanged = () => { initVoices(); if (/^#(settings|drills|test)/.test(location.hash)) render(); }; }
const canSpeak = () => !!(JA_VOICE && S.settings.tts);
function speak(t, rate) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(t).replace(/＿＿/g, "").replace(/\[.*?\]/g, "").replace(/[～〜]/g, "").replace(/\s+/g, " "));
  u.voice = JA_VOICE; u.lang = JA_VOICE.lang; u.rate = rate || S.settings.rate; speechSynthesis.speak(u);
}
const sayBtn = t => (canSpeak() ? `<button class="say" data-say="${esc(t)}" title="Listen" aria-label="Listen">&#9654;</button>` : "");

// ---------- stroke order + writing pad ----------
function strokeSVG(ch, cls = "") {
  const ps = STROKES[ch]; if (!ps) return "";
  return `<svg class="strk ${cls}" viewBox="0 0 109 109" data-ch="${esc(ch)}" role="img" aria-label="stroke order for ${esc(ch)}">${ps.map(d => `<path d="${d}"/>`).join("")}</svg>`;
}
function animateStrokes(svg) {
  if (!svg) return; const ps = [...svg.querySelectorAll("path")]; if (svg._t) clearTimeout(svg._t);
  ps.forEach(p => { const l = p.getTotalLength(); p.style.transition = "none"; p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
  let i = 0;
  const step = () => { if (i >= ps.length || !svg.isConnected) return; const p = ps[i++]; const l = p.getTotalLength(); const dur = Math.max(0.25, l / 110);
    p.getBoundingClientRect(); p.style.transition = `stroke-dashoffset ${dur}s linear`; p.style.strokeDashoffset = 0; svg._t = setTimeout(step, dur * 1000 + 90); };
  svg._t = setTimeout(step, 60);
}
const strokeBox = ch => (STROKES[ch] ? `<div class="sbox">${strokeSVG(ch)}<div class="sbtns"><button class="btn ghost sm" data-act="play" data-ch="${esc(ch)}">&#9654; strokes (${STROKES[ch].length})</button><button class="btn ghost sm" data-act="pad" data-ch="${esc(ch)}">&#9998; write</button></div></div>` : "");
function openPad(ch) {
  const ov = document.createElement("div"); ov.className = "overlay";
  ov.innerHTML = `<div class="padwrap"><div class="spread"><b class="jp">${esc(ch)}</b><span class="small muted">Trace it, then hide the guide and write from memory</span></div>
    <div class="pad"><div class="guide">${strokeSVG(ch)}</div><canvas width="600" height="600"></canvas></div>
    <div class="bar center"><button class="btn ghost" data-p="guide">Hide guide</button><button class="btn ghost" data-p="clear">Clear</button><button class="btn ghost" data-p="anim">Show order</button><button class="btn" data-p="close">Done</button></div></div>`;
  document.body.appendChild(ov);
  const cv = $("canvas", ov), ctx = cv.getContext("2d"); let drawing = false;
  ctx.lineWidth = 22; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = getComputedStyle(document.body).color || "#222";
  const pos = e => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) * cv.width) / r.width, ((e.clientY - r.top) * cv.height) / r.height]; };
  cv.addEventListener("pointerdown", e => { drawing = true; cv.setPointerCapture(e.pointerId); const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); e.preventDefault(); });
  cv.addEventListener("pointermove", e => { if (!drawing) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); e.preventDefault(); });
  cv.addEventListener("pointerup", () => (drawing = false));
  ov.addEventListener("click", e => {
    const b = e.target.closest("[data-p]"); if (!b) { if (e.target === ov) ov.remove(); return; }
    const p = b.dataset.p;
    if (p === "close") ov.remove();
    if (p === "clear") ctx.clearRect(0, 0, cv.width, cv.height);
    if (p === "guide") { const g = $(".guide", ov); g.classList.toggle("off"); b.textContent = g.classList.contains("off") ? "Show guide" : "Hide guide"; }
    if (p === "anim") { $(".guide", ov).classList.remove("off"); animateStrokes($(".guide svg", ov)); }
  });
}

// ---------- router ----------
const app = () => $("#app");
const VIEWS = {}, ACTS = {};
function render() {
  const [name, arg, arg2] = (location.hash.slice(1) || "today").split("/");
  $$("nav a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === `#${name}`));
  const due = dueIds().length;
  $("#dueBadge").textContent = due ? due : "";
  $("#lvBadge").textContent = `N${L()}`;
  (VIEWS[name] || VIEWS.today)(arg, arg2);
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", render);
const go = h => { if (location.hash === h) render(); else location.hash = h; };
document.addEventListener("click", e => {
  const s = e.target.closest("[data-say]"); if (s) { e.preventDefault(); speak(s.dataset.say); return; }
  const a = e.target.closest("[data-act]"); if (a && ACTS[a.dataset.act]) { e.preventDefault(); ACTS[a.dataset.act](a.dataset, a); return; }
  const sv = e.target.closest("svg.strk"); if (sv && !sv.closest(".pad")) animateStrokes(sv);
});
document.addEventListener("change", e => { const t = e.target; if (t.matches("[data-task]")) { S.tasks[t.dataset.task] = t.checked; save(); } });
ACTS.play = d => animateStrokes($(`svg.strk[data-ch="${CSS.escape(d.ch)}"]`));
ACTS.pad = d => openPad(d.ch);

// ---- Today ----
const DRILL_OF_DAY = [["conj", "Conjugation"], ["num", "Numbers & time"], ["dict", "Dictation"], ["order", "Sentence order"], ["read", "Reading"], ["kana", "Kana look-alikes"]];
VIEWS.today = () => {
  const w = weekNo(), tw = totalWeeks(), ph = phaseOf(w), dl = daysToExam(), due = dueIds().length, lv = L();
  const Lg = S.log[today()] || { r: 0, ok: 0, n: 0, sec: 0 };
  const newRows = TYPES.filter(t => curIds(t).length).map(t => {
    const f = fresh(t).length, a = ahead(t).length;
    if (!a) return `<div class="row"><span class="tag t-${t}">${TYPE_LABEL[t]}</span><span class="muted">All N${lv} learned</span></div>`;
    return `<div class="row"><span class="tag t-${t}">${TYPE_LABEL[t]}</span>
      <span>${f ? `<b>${f}</b> new ready` : `<span class="muted">Nothing scheduled today</span>`}</span><span class="sp"></span>
      ${f ? `<button class="btn" data-act="learn" data-type="${t}">Learn</button>` : `<button class="btn ghost" data-act="learn" data-type="${t}" data-ahead="1">Learn ahead</button>`}</div>`;
  }).join("");
  const gapN = TYPES.reduce((s, t) => s + gaps(t).length, 0);
  const behind = TYPES.reduce((s, t) => s + fresh(t).length, 0);
  const exportOld = !S.lastExport || diffDays(S.lastExport.slice(0, 10), today()) >= 7;
  const dd = DRILL_OF_DAY[(effDay() + lv) % DRILL_OF_DAY.length];
  app().innerHTML = `
  <section class="hero">
    <div class="kicker">${w === 0 ? `N${lv} plan starts ${fmtDate(S.settings.start)}. You can start now` : `JLPT N${lv} · Week ${w} of ${tw} · Phase ${ph.id}: ${ph.name}`}</div>
    <h1>${dl >= 0 ? `${dl} days to JLPT N${lv}` : "Exam day has passed. Plan your next level"}</h1>
    <p class="muted">${esc(ph.goal)}</p>
    <div class="stats3"><div><b>${streak()}</b><span>day streak</span></div><div><b>${Lg.r}</b><span>reviews today</span></div><div><b>${Math.round(Lg.sec / 60)}</b><span>min today</span></div></div>
  </section>
  ${dl < 0 ? `<div class="note">Exam done? Open <a href="#plan">Plan → Roadmap</a> to start the next level. Your earlier cards keep coming back in reviews.</div>` : ""}
  ${behind > 25 ? `<div class="note warn"><b>${behind} scheduled items not started yet.</b> Catch up with one extra Learn batch a day after reviews.</div>` : ""}
  ${exportOld && Object.keys(S.cards).length ? `<div class="note">Back up your progress: <a href="#settings">Settings → Export</a> (last: ${S.lastExport ? fmtDate(S.lastExport.slice(0, 10)) : "never"}).</div>` : ""}
  <section class="card"><h2>1 · Reviews <span class="muted small">~10–15 min</span></h2>
    ${due ? `<p><b>${due}</b> cards due${due > 150 ? " (do them in 2–3 sittings)" : ""}.</p><button class="btn big" data-act="review">Start reviews</button>` : `<p class="muted">No reviews due. Nice.</p>`}</section>
  <section class="card"><h2>2 · New N${lv} material <span class="muted small">~10 min</span></h2>${newRows}
    ${gapN ? `<div class="row gap"><span class="tag">Foundation</span><span><b>${gapN}</b> items from easier levels not learned yet</span><span class="sp"></span><a class="btn ghost" href="#gaps">Fill gaps</a></div>` : ""}</section>
  <section class="card"><h2>3 · Practice <span class="muted small">~5–10 min</span></h2>
    <div class="row"><span>Drill of the day: <b>${dd[1]}</b></span><span class="sp"></span><a class="btn" href="#drills/${dd[0]}">Start</a></div>
    <div class="small muted">More in the <a href="#drills">Drills</a> tab: conjugation, numbers & time, dictation, sentence order, reading, kana look-alikes.</div></section>
  <section class="card"><h2>4 · This week's tasks</h2>${weekTasksHTML(Math.max(1, w))}</section>`;
};
VIEWS.gaps = () => {
  const rows = TYPES.map(t => { const g = gaps(t); if (!g.length) return "";
    const byLv = LEVELS.filter(l => l > L()).map(l => [l, g.filter(id => ITEMS[id].lv === l).length]).filter(x => x[1]);
    return `<div class="row"><span class="tag t-${t}">${TYPE_LABEL[t]}</span><span>${byLv.map(([l, n]) => `N${l}: ${n}`).join(" · ")}</span><span class="sp"></span><button class="btn" data-act="learn" data-type="${t}" data-gap="1">Learn ${t === "kana" ? "next row" : BATCH[t]}</button></div>`; }).join("");
  app().innerHTML = `<section class="card"><h2>Foundation gaps</h2><p class="muted small">Items from easier levels you haven't studied yet. Each level builds on the last, so fill these before or alongside new N${L()} material. Your already-learned cards from every level stay in your daily reviews.</p>${rows || "<p>No gaps. Your foundation is complete.</p>"}<div class="bar"><a class="btn ghost" href="#today">Back</a></div></section>`;
};
function weekTasksHTML(w) {
  const tasks = weekTasks(w), lv = L();
  const from = (w - 1) * 7, to = w * 7 - 1;
  const inWeek = t => curIds(t).filter(id => UNLOCK[id] >= from && UNLOCK[id] <= to);
  const k = inWeek("kanji"), g = inWeek("grammar"), v = inWeek("vocab"), ka = inWeek("kana");
  const auto = [];
  if (ka.length) auto.push(`Kana: ${[...new Set(ka.map(id => ITEMS[id].gname + (ITEMS[id].script === "h" ? " (hiragana)" : " (katakana)")))].join(", ")}`);
  if (v.length) auto.push(`Vocab: ${v.length} new words`);
  if (k.length) auto.push(`Kanji: <span class="jp">${k.map(id => ITEMS[id].k).join(" ")}</span>`);
  if (g.length) auto.push(`Grammar: ${g.map(id => `<span class="jp">${esc(ITEMS[id].p)}</span>`).join(" · ")}`);
  return `${auto.length ? `<ul class="auto">${auto.map(a => `<li>${a}</li>`).join("")}</ul>` : ""}
  <ul class="tasks">${tasks.map((t, i) => { const id = `n${lv}w${w}-${i}`;
    const on = S.tasks[id] || (lv === 5 && S.tasks[`w${w}-${i}`]);
    return `<li><label><input type="checkbox" data-task="${id}" ${on ? "checked" : ""}> <span>${esc(t[0])}</span></label>${t[1] ? ` <a class="file" href="${href(t[1])}" target="_blank" rel="noopener">open</a>` : ""}</li>`; }).join("")}</ul>`;
}

// ---- Learn (lesson) ----
let LESSON = [];
ACTS.learn = d => {
  const t = d.type; const pool = d.gap ? gaps(t) : d.ahead ? ahead(t) : fresh(t);
  if (!pool.length) return;
  let ids;
  if (t === "kana") { const g0 = ITEMS[pool[0]]; ids = pool.filter(id => ITEMS[id].kday === g0.kday); }
  else ids = pool.slice(0, BATCH[t]);
  LESSON = ids; go("#lesson");
};
VIEWS.lesson = () => {
  if (!LESSON.length) return go("#today");
  const t = ITEMS[LESSON[0]].type; let body = "";
  if (t === "kana") {
    const it0 = ITEMS[LESSON[0]];
    body = `<p class="muted">${esc(it0.gname)} · ${it0.script === "h" ? "Hiragana" : "Katakana"}. Tap a character to replay its stroke order, or press ✎ to practise writing. Say each one aloud. Mnemonics: ${it0.script === "h" ? `<a href="${href(F.tofugu)}" target="_blank">Tofugu guide</a>` : `<a href="${href(F.booklet)}" target="_blank">kana booklet</a>`}.</p>
      <div class="kgrid big">${LESSON.map(id => { const i = ITEMS[id]; return `<div class="kcell">${STROKES[i.ch] ? strokeSVG(i.ch) : `<div class="jp xl">${i.ch}</div>`}<div><b>${i.r}</b> ${sayBtn(i.ch)}${STROKES[i.ch] ? ` <button class="say" data-act="pad" data-ch="${esc(i.ch)}" title="Practise writing">&#9998;</button>` : ""}</div></div>`; }).join("")}</div>
      ${KANA_NOTES[it0.grp] ? `<div class="note">${esc(KANA_NOTES[it0.grp])}</div>` : ""}`;
  } else if (t === "vocab") {
    body = LESSON.map(id => { const i = ITEMS[id]; const m = vMain(i);
      return `<div class="lrow"><div class="jp lg">${esc(m)} ${sayBtn(i.r)} <span class="tag">N${i.lv}</span></div><div class="jp">${m !== i.r ? esc(i.r) : ""}${m !== i.w ? ` <span class="muted">(${esc(i.w)})</span>` : ""}</div><div>${esc(i.e)}</div>${kanjiBreak(i.w)}</div>`; }).join("");
  } else if (t === "kanji") {
    body = LESSON.map(id => kanjiCard(ITEMS[id], true)).join("") + (ITEMS[LESSON[0]].lv === 5 ? `<p class="muted">Also study these in the <a href="${href(F.kb)}" target="_blank">kanji book</a>.</p>` : "");
  } else body = LESSON.map(id => grammarCard(ITEMS[id], true)).join("");
  app().innerHTML = `<section class="card"><h2>New ${TYPE_LABEL[t].toLowerCase()} (${LESSON.length})</h2>${body}
    <div class="bar"><button class="btn big" data-act="lessonDone">I've studied these. Quiz me</button><a class="btn ghost" href="#today">Later</a></div></section>`;
  $$("#app svg.strk").forEach((s, i) => setTimeout(() => animateStrokes(s), 200 + i * 150));
};
ACTS.lessonDone = () => { LESSON.forEach(introduce); save(); startSession(LESSON.slice(), "learn"); LESSON = []; };
function kanjiBreak(w) {
  const ks = [...new Set([...w].filter(c => KANJI_BY_CHAR[c]))];
  return ks.length ? `<div class="small muted">${ks.map(c => `<a href="#kanji/${encodeURIComponent(c)}" class="jp">${c}</a> = ${esc(KANJI_BY_CHAR[c].m)}`).join(" · ")}</div>` : "";
}
function kanjiCard(i, strokes) {
  const ex = kanjiExample(i);
  return `<div class="lrow kanji">${strokes && STROKES[i.k] ? strokeBox(i.k) : `<div class="jp xxl">${i.k}</div>`}<div><div><span class="jp lg">${i.k}</span> <b>${esc(i.m)}</b> <span class="tag">N${i.lv}</span></div>
   <div class="small"><span class="muted">on</span> <span class="jp">${esc(i.on)}</span> · <span class="muted">kun</span> <span class="jp">${esc(i.kun)}</span>${i.strokes ? ` · <span class="muted">${i.strokes} strokes</span>` : ""}</div>
   ${ex ? `<div class="jp">${esc(ex.w)} 【${esc(ex.r)}】 ${sayBtn(ex.r)} <span class="muted">${esc(ex.e)}</span></div>` : ""}</div></div>`;
}
function grammarCard(i, full) {
  return `<div class="lrow"><div class="gp"><span class="muted small">N${i.lv} #${i.n_}</span> <b class="jp">${esc(i.p)}</b>: ${esc(i.m)}</div>
   ${full && i.n ? `<p>${esc(i.n)}</p>` : ""}
   <ul class="ex">${i.ex.map(e => `<li><span class="jp">${esc(e[0])}</span> ${sayBtn(e[0])}<br><span class="muted">${esc(e[1])}</span></li>`).join("")}</ul>
   ${full && i.tk ? `<div class="small muted">Tae Kim: “${esc(i.tk)}” in <a href="${href(F.tk)}" target="_blank">grammar_guide.pdf</a></div>` : ""}</div>`;
}

// ---- Review session ----
let SES = null;
ACTS.review = () => startSession(dueIds(), "review");
ACTS.reviewIds = d => startSession(d.ids.split(",").filter(id => S.cards[id]), "review");
function startSession(ids, mode) {
  if (!ids.length) return go("#today");
  const sorted = ids.slice().sort((a, b) => (S.cards[a].due < S.cards[b].due ? -1 : 1)).slice(0, 200); // most overdue first
  SES = { q: shuffle(sorted), total: sorted.length, done: 0, ok: 0, miss: new Set(), mode, state: "front", rev: false };
  lastAct = Date.now(); go("#session");
}
VIEWS.session = () => {
  if (!SES) return go("#today");
  if (!SES.q.length) {
    const misses = [...SES.miss];
    app().innerHTML = `<section class="card center"><h2>Session done</h2><p><b>${SES.done}</b> answers · <b>${pct(SES.ok, SES.done)}%</b> correct first time</p>
      ${misses.length ? `<p class="muted">Missed: <span class="jp">${misses.slice(0, 30).map(id => esc(itemShort(ITEMS[id]))).join(" · ")}</span></p>` : ""}
      <div class="bar center"><a class="btn big" href="#today">Back to Today</a></div></section>`;
    SES = null; return;
  }
  const id = SES.q[0], it = ITEMS[id], c = S.cards[id];
  const prog = `<div class="prog"><div style="width:${pct(SES.total - SES.q.length, SES.total)}%"></div></div>
    <div class="small muted spread"><span>${SES.q.length} left</span><span><span class="tag">N${it.lv}</span> <span class="tag t-${it.type}">${TYPE_LABEL[it.type]}</span></span></div>`;
  let front = "", back = "", ctrl = "";
  if (it.type === "kana") {
    front = `<div class="jp huge">${it.ch}</div>`;
    if (SES.state === "front") ctrl = `<input id="kin" class="kin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type romaji, Enter">`;
    else back = `<div class="ans ${SES.lastOk ? "ok" : "bad"}">${it.r}${it.ans.length > 1 ? ` <span class="muted small">(also ${it.ans.slice(1).join(", ")})</span>` : ""}</div>${strokeBox(it.ch)}`;
  } else if (it.type === "vocab") {
    if (SES.state === "front") SES.rev = S.settings.production && c.ivl >= 7 && Math.random() < 0.5;
    front = SES.rev ? `<div class="big-en">${esc(it.e)}</div><div class="muted small">Say the Japanese word</div>` : `<div class="jp huge2">${esc(vMain(it))}</div>`;
    if (SES.state === "back") back = `<div class="jp lg">${esc(it.w)}${it.w !== it.r ? `【${esc(it.r)}】` : ""} ${sayBtn(it.r)}</div><div class="big-en">${esc(it.e)}</div>${kanjiBreak(it.w)}`;
  } else if (it.type === "kanji") {
    front = `<div class="jp huge">${it.k}</div><div class="muted small">Meaning + one reading?</div>`;
    if (SES.state === "back") back = kanjiCard(it, true);
  } else {
    if (SES.state === "front" || !SES.opts) { const q = it.q[0]; SES.opts = shuffle([q[1], ...q[2]]); SES.qa = q; }
    const q = SES.qa;
    front = `<div class="jp cloze">${clozeHTML(q[0])}</div><div class="muted">${esc(q[3] || "")}</div>` + optsHTML(SES.opts, q[1], SES.state === "back" ? SES.pickd : null, "gpick");
    if (SES.state === "back") back = grammarCard(it, true);
  }
  const auto = it.type === "kana" || it.type === "grammar";
  if (SES.state === "front" && !auto) ctrl = `<button class="btn big wide" data-act="flip">Show answer <span class="k">Space</span></button>`;
  if (SES.state === "back") ctrl += auto ? `<button class="btn big wide" data-act="next">Next <span class="k">Enter</span></button>`
    : `<div class="grades">${[[1, "Again"], [2, "Hard"], [3, "Good"], [4, "Easy"]].map(([g, l]) => `<button class="g g${g}" data-act="grade" data-g="${g}"><span>${l}</span><small>${ivlLabel(previewIvl(c, g))}</small></button>`).join("")}</div>`;
  app().innerHTML = `<section class="card session">${prog}<div class="front">${front}</div>${back ? `<div class="back">${back}</div>` : ""}<div class="ctrl">${ctrl}</div>
    <div class="bar"><a class="small muted" href="#today" data-act="endSession">End session</a></div></section>`;
  const kin = $("#kin"); if (kin) { kin.focus(); kin.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); kanaCheck(kin.value); } }); }
};
const clozeHTML = s => esc(s).replace("＿＿", '<span class="blank">＿＿</span>');
function optsHTML(opts, ans, picked, act) {
  return `<div class="opts">${opts.map((o, k) => { let cls = "";
    if (picked !== null && picked !== undefined) cls = o === ans ? "ok" : o === picked ? "bad" : "";
    return `<button class="opt ${IS_JP.test(o) ? "jp" : ""} ${cls}" data-act="${act}" data-o="${esc(o)}" ${picked != null ? "disabled" : ""}><span class="k">${k + 1}</span>${esc(o)}</button>`; }).join("")}</div>`;
}
function itemShort(i) { return i.type === "kana" ? i.ch : i.type === "vocab" ? vMain(i) : i.type === "kanji" ? i.k : i.p; }
function kanaCheck(v) { const it = ITEMS[SES.q[0]]; const val = v.trim().toLowerCase(); if (!val) return; SES.lastOk = it.ans.includes(val); SES.state = "back"; speak(it.ch); render(); }
ACTS.flip = () => { SES.state = "back"; const it = ITEMS[SES.q[0]]; if (it.type === "vocab" && SES.rev) speak(it.r); render(); };
ACTS.gpick = d => { const q = SES.qa; SES.pickd = d.o; SES.lastOk = d.o === q[1]; SES.state = "back"; render(); };
ACTS.next = () => answer(SES.lastOk ? 3 : 1);
ACTS.grade = d => answer(+d.g);
ACTS.endSession = () => { SES = null; go("#today"); };
function answer(g) {
  const id = SES.q.shift(); grade(id, g); SES.done++;
  if (g === 1) { SES.miss.add(id); SES.q.splice(Math.min(SES.q.length, 3 + Math.floor(Math.random() * 3)), 0, id); }
  else if (!SES.miss.has(id)) SES.ok++;
  SES.state = "front"; SES.opts = null; SES.pickd = null; render();
}
document.addEventListener("keydown", e => {
  if (location.hash !== "#session" || !SES || e.target.matches("input,textarea")) return;
  const it = SES.q.length && ITEMS[SES.q[0]]; if (!it) return;
  const auto = it.type === "kana" || it.type === "grammar";
  if (SES.state === "front") {
    if (it.type === "grammar" && /^[1-4]$/.test(e.key)) { const o = SES.opts[+e.key - 1]; if (o) ACTS.gpick({ o }); }
    else if ((e.key === " " || e.key === "Enter") && !auto) { e.preventDefault(); ACTS.flip(); }
  } else {
    if (auto && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); ACTS.next(); }
    else if (!auto && /^[1-4]$/.test(e.key)) answer(+e.key);
    else if (!auto && e.key === " ") { e.preventDefault(); answer(3); }
  }
});

// ---- Browse ----
VIEWS.browse = (tab = "vocab", lvArg) => {
  if (!TYPES.includes(tab)) tab = "vocab";
  const lv = lvArg ? +lvArg : L();
  const tabs = TYPES.map(t => `<a class="pill ${t === tab ? "on" : ""}" href="#browse/${t}/${lv}">${TYPE_LABEL[t]}</a>`).join("");
  const lvs = tab === "kana" ? "" : `<div class="pills">${LEVELS.map(l => `<a class="pill sm ${l === lv ? "on" : ""}" href="#browse/${tab}/${l}">N${l} <span class="muted">${ORDER[tab][l].length}</span></a>`).join("")}</div>`;
  const st = id => { const c = S.cards[id]; return !c ? "s-new" : c.ivl >= 21 ? "s-mature" : c.ivl >= 1 ? "s-known" : "s-learn"; };
  let body = "";
  if (tab === "kana") {
    body = ["h", "k"].map(sc => `<h3>${sc === "h" ? "Hiragana" : "Katakana"}</h3>` + KANA_GROUPS.map(g =>
      `<div class="small muted">${esc(g.name)}</div><div class="kgrid sm">${g.rows.map(r => { const id = `k${sc}:${sc === "h" ? r[0] : r[1]}`;
        return `<a class="kcell ${st(id)}" href="#kana/${encodeURIComponent(ITEMS[id].ch)}"><div class="jp lg">${ITEMS[id].ch}</div><div class="small">${r[2]}</div></a>`; }).join("")}</div>`).join("")).join("");
  } else if (tab === "vocab") body = `<input id="vq" class="search" placeholder="Search N${lv}: romaji, kana, kanji or English" autocomplete="off"><label class="small chk"><input type="checkbox" id="vall"> search all levels</label><div id="vlist"></div>`;
  else if (tab === "kanji") body = `<div class="kgrid">${ORDER.kanji[lv].map(id => { const i = ITEMS[id]; return `<a class="kcell ${st(id)}" href="#kanji/${encodeURIComponent(i.k)}"><div class="jp xl">${i.k}</div><div class="small">${esc(i.m.split(",")[0])}</div></a>`; }).join("")}</div>`;
  else body = ORDER.grammar[lv].map(id => { const i = ITEMS[id]; return `<details class="gitem ${st(id)}"><summary><span class="muted small">#${i.n_}</span> <b class="jp">${esc(i.p)}</b>: ${esc(i.m)}</summary>${grammarCard(i, true)}</details>`; }).join("") +
    (lv < 5 ? `<p class="small muted">Level placement follows common community lists. JLPT publishes no official grammar list.</p>` : "");
  app().innerHTML = `<section class="card"><h2>Browse</h2><div class="pills">${tabs}</div>${lvs}
    <div class="legend small"><span class="s-new">not started</span><span class="s-learn">learning</span><span class="s-known">known</span><span class="s-mature">mature (21d+)</span></div>${body}</section>`;
  if (tab === "vocab") {
    const draw = () => {
      const q = ($("#vq").value || "").trim().toLowerCase(), all = $("#vall").checked, qk = IME.toKana(q);
      const src = all ? ALL("vocab") : ORDER.vocab[lv];
      const ids = src.filter(id => { const i = ITEMS[id]; return !q || i.w.includes(q) || i.r.includes(q) || (qk && i.r.includes(qk)) || i.e.toLowerCase().includes(q); });
      $("#vlist").innerHTML = `<div class="small muted">${ids.length} words${ids.length > 200 ? " (showing 200)" : ""}</div><table class="vt">${ids.slice(0, 200).map(id => { const i = ITEMS[id];
        return `<tr class="${st(id)}"><td class="jp">${esc(i.w)}</td><td class="jp small">${i.w !== i.r ? esc(i.r) : ""}</td><td>${esc(i.e)}</td><td>${all ? `<span class="tag">N${i.lv}</span>` : ""}${sayBtn(i.r)}</td></tr>`; }).join("")}</table>`;
    };
    $("#vq").addEventListener("input", draw); $("#vall").addEventListener("change", draw); draw();
  }
};
VIEWS.kanji = k => {
  const i = KANJI_BY_CHAR[decodeURIComponent(k || "")]; if (!i) return go("#browse/kanji");
  const words = ALL("vocab").map(id => ITEMS[id]).filter(v => v.w.includes(i.k)).slice(0, 15);
  app().innerHTML = `<section class="card">${kanjiCard(i, true)}<h3>Words with ${i.k}</h3>
    <table class="vt">${words.map(v => `<tr><td class="jp">${esc(v.w)}</td><td class="jp small">${esc(v.r)}</td><td>${esc(v.e)}</td><td><span class="tag">N${v.lv}</span>${sayBtn(v.r)}</td></tr>`).join("") || "<tr><td class='muted'>No JLPT vocab uses this kanji.</td></tr>"}</table>
    <div class="bar"><a class="btn ghost" href="#browse/kanji/${i.lv}">Back</a></div></section>`;
  setTimeout(() => animateStrokes($("#app svg.strk")), 200);
};
VIEWS.kana = ch => {
  ch = decodeURIComponent(ch || ""); const it = ORDER.kana[5].map(id => ITEMS[id]).find(i => i.ch === ch); if (!it) return go("#browse/kana");
  app().innerHTML = `<section class="card center"><div class="jp huge">${it.ch}</div><div class="ans">${it.r} ${sayBtn(it.ch)}</div>${strokeBox(it.ch) || "<p class='muted'>Combination: write each part.</p>"}
   <div class="bar center"><a class="btn ghost" href="#browse/kana">Back</a></div></section>`;
  setTimeout(() => animateStrokes($("#app svg.strk")), 200);
};

// ---- Drills ----
const DRILLS = {
  conj: ["Conjugation", "Type verb and adjective forms. Builds the grammar foundation for every level."],
  num: ["Numbers, time & counters", "Prices, clock times, dates and counters, with the tricky sound changes. Listening mode makes you type what you hear."],
  dict: ["Dictation", "Hear a word and type it in kana. Trains your ear and spelling."],
  order: ["Sentence order", "Put the words in order (JLPT ★ question). Trains Japanese word order."],
  read: ["Reading", "Short graded passages with questions, read-aloud and translation."],
  kana: ["Kana look-alikes", "シ/ツ, ソ/ン, ぬ/め, わ/ね/れ… plus katakana loanword reading."]
};
const DRILL_VIEWS = {};
let DR = null;
VIEWS.drills = (name, arg) => {
  if (name && DRILL_VIEWS[name]) return DRILL_VIEWS[name](arg);
  DR = null;
  app().innerHTML = `<section class="card"><h2>Drills</h2><p class="muted small">Short, focused practice for skills flashcards can't train. Drills count toward your streak and study time.</p>
   <div class="tests">${Object.entries(DRILLS).map(([k, [t, d]]) => { const s = S.drills[k]; return `<a class="tbtn" href="#drills/${k}"><b>${t}</b><span>${d}</span>${s ? `<span class="small">${s.n} done · ${pct(s.ok, s.n)}% correct</span>` : ""}</a>`; }).join("")}</div></section>`;
};
function drillShell(name, inner, extra = "") {
  const s = S.drills[name] || { n: 0, ok: 0 };
  app().innerHTML = `<section class="card session"><div class="spread small muted"><a href="#drills">← Drills</a><span>${DRILLS[name][0]} · ${s.n} done · ${pct(s.ok, s.n)}%</span></div>${extra}${inner}</section>`;
}
const typedInput = ph => `<input id="din" class="kin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(ph)}"><div id="dprev" class="jp preview"></div>`;
function wireTyped(onEnter, kana = true) {
  const inp = $("#din"); if (!inp) return; inp.focus();
  inp.addEventListener("input", () => { if (kana) $("#dprev").textContent = IME.toKana(inp.value); });
  inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); if (inp.value.trim()) onEnter(inp.value); } });
}
document.addEventListener("keydown", e => {
  if (!location.hash.startsWith("#drills/") || !DR || !DR.done) return;
  if (e.key === "Enter" && !e.target.matches("input,textarea")) { e.preventDefault(); ACTS.dnext(); }
});
ACTS.dnext = () => { const keep = DR && DR.name === "read"; DR = keep ? DR : null; render(); };
const resultHTML = (ok, main, extra = "") => `<div class="back"><div class="ans ${ok ? "ok" : "bad"}">${ok ? "✓" : "✗"} ${main}</div>${extra}</div><button class="btn big wide" data-act="dnext">Next <span class="k">Enter</span></button>`;

// conjugation
function conjWords() {
  const lv = L(), levels = lv <= 4 ? [5, 4] : [5], words = [];
  levels.forEach(l => {
    Object.entries(VERBS[l]).forEach(([cls, str]) => str.split(/\s+/).filter(Boolean).forEach(v => words.push({ v, cls, kind: "v" })));
    Object.entries(ADJS[l]).forEach(([cls, str]) => str.split(/\s+/).filter(Boolean).forEach(v => words.push({ v, cls, kind: "a" })));
  });
  return words;
}
function wordDisplay(kana, verb) {
  const base = kana.endsWith("する") && kana.length > 2 ? kana.slice(0, -2) : null;
  const cands = (VOCAB_BY_READING[kana] || []).filter(i => (verb ? /^to /i.test(i.e) : !/^to /i.test(i.e)));
  if (cands[0]) return { w: cands[0].w, e: cands[0].e };
  if (base && VOCAB_BY_READING[base]) { const b = VOCAB_BY_READING[base][0]; return { w: b.w + "する", e: "to do: " + b.e }; }
  return { w: kana, e: "" };
}
const CONJ_RULE = {
  te: "う/つ/る→って · む/ぶ/ぬ→んで · く→いて · ぐ→いで · す→して · 行く→行って · ru-verbs: る→て · する→して · くる→きて",
  ta: "Same as the て-form with た/だ: 書いた, 飲んだ, 行った, 食べた",
  nai: "godan: u→a + ない (う→わ: 買わない) · ru: る→ない · する→しない · くる→こない · ある→ない",
  masu: "godan: u→i + ます · ru: る→ます · します · きます", pot: "godan: u→e + る (書ける) · ru: られる · する→できる · くる→こられる",
  vol: "godan: u→o + う (行こう) · ru: よう · しよう · こよう", ba: "godan: u→e + ば · ru: れば · すれば · くれば",
  pass: "godan: u→a + れる · ru: られる · される · こられる", caus: "godan: u→a + せる · ru: させる · する→させる · こさせる",
  i: "い-adj: drop い → くない / かった / くなかった / くて / く · いい→よ-", na: "な-adj: じゃない / だった / じゃなかった / で / に / な+noun"
};
const CLS_NAME = { ru: "る-verb (ichidan)", u: "う-verb (godan)", iku: "う-verb (行く: special て/た)", aru: "う-verb (ある: negative ない)", suru: "irregular (する)", kuru: "irregular (くる)", i: "い-adjective", na: "な-adjective" };
DRILL_VIEWS.conj = () => {
  const opt = S.drills.conjOpt || (S.drills.conjOpt = { verbs: true, adjs: true, adv: L() <= 4 });
  if (!DR || DR.name !== "conj") {
    let pool = conjWords().filter(w => (w.kind === "v" ? opt.verbs : opt.adjs)); if (!pool.length) pool = conjWords();
    let w, f, ans;
    for (let k = 0; k < 40 && !ans; k++) {
      w = rnd(pool);
      const forms = Object.entries(w.kind === "v" ? CONJ.VFORMS : CONJ.AFORMS).filter(([, [, fl]]) => fl === 5 || opt.adv).map(([x]) => x);
      f = rnd(forms); ans = w.kind === "v" ? CONJ.verb(w.v, w.cls, f) : CONJ.adj(w.v, w.cls, f);
    }
    DR = { name: "conj", w, f, ans, disp: wordDisplay(w.v, w.kind === "v"), label: (w.kind === "v" ? CONJ.VFORMS : CONJ.AFORMS)[f][0] };
  }
  const q = DR;
  const opts = `<div class="pills small"><label class="chk"><input type="checkbox" data-copt="verbs" ${opt.verbs ? "checked" : ""}> verbs</label><label class="chk"><input type="checkbox" data-copt="adjs" ${opt.adjs ? "checked" : ""}> adjectives</label><label class="chk"><input type="checkbox" data-copt="adv" ${opt.adv ? "checked" : ""}> N4 forms (potential, passive, causative, ば/たら, volitional)</label></div>`;
  const ruleKey = q.w.kind === "a" ? q.w.cls : ({ tara: "ta", nakatta: "nai", masen: "masu", mashita: "masu", masendeshita: "masu", want: "masu" }[q.f] || q.f);
  drillShell("conj", `<div class="front"><div class="jp huge2">${esc(q.disp.w)}</div><div class="jp">${q.disp.w !== q.w.v ? esc(q.w.v) : ""} ${sayBtn(q.w.v)}</div><div class="muted small">${esc(q.disp.e)}</div>
     <div class="target">→ <b>${esc(q.label)}</b></div></div>
    ${q.done ? resultHTML(q.ok, `<span class="jp">${esc(q.ans.join(" / "))}</span> ${sayBtn(q.ans[0])}`, `${q.ok ? "" : `<div class="small">You typed: <span class="jp badtxt">${esc(q.typed)}</span></div>`}<div class="small muted">${esc(CLS_NAME[q.w.cls])} · ${esc(CONJ_RULE[ruleKey] || "")}</div>`) : typedInput("type in romaji or kana, Enter")}`, opts);
  $$("[data-copt]").forEach(c => c.addEventListener("change", () => { opt[c.dataset.copt] = c.checked; save(); DR = null; render(); }));
  if (!q.done) wireTyped(v => { q.typed = IME.norm(v); q.ok = q.ans.some(a => IME.norm(a) === q.typed); q.done = true; drillLog("conj", q.ok); speak(q.ans[0]); render(); });
};

// numbers / time / counters
function numQuestion(mode) {
  const kinds = mode === "listen" ? ["num", "yen", "time", "date"] : ["num", "yen", "time", "date", "week", "counter", "counter"];
  const k = rnd(kinds);
  if (k === "num") { const n = rnd([rint(1, 99), rint(100, 999), rint(1000, 9999), rint(10000, 99999)]); return { k, show: n.toLocaleString("en-US"), ans: [NUM.read(n)], digits: String(n), hint: "number" }; }
  if (k === "yen") { const n = rnd([rint(10, 999), rint(100, 9999) * (Math.random() < 0.5 ? 1 : 10), rint(1, 99) * 100]); return { k, show: `¥${n.toLocaleString("en-US")}`, ans: NUM.yen(n), digits: String(n), hint: "price" }; }
  if (k === "time") { const h = rint(1, 12), m = rnd([0, rint(1, 59), rint(1, 11) * 5, 30]); return { k, show: `${h}:${z2(m)}`, ans: NUM.time(h, m), digits: `${h}${z2(m)}`, hint: "time" }; }
  if (k === "date") { const mo = rint(1, 12), d = rint(1, 31); return { k, show: `${mo}月${d}日`, ans: NUM.day(d).map(x => NUM.MONTH[mo] + x), digits: `${mo}${z2(d)}`, hint: "date" }; }
  if (k === "week") { const i = rint(0, 6); return { k, show: NUM.WEEKK[i], ans: [NUM.WEEK[i]], hint: "day of the week" }; }
  const ck = rnd(Object.keys(NUM.C)), n = rint(1, 10), c = NUM.C[ck];
  return { k: "counter", show: `${n}${c[0]}`, ans: NUM.counter(ck, n), hint: `counter for ${c[1]}` };
}
const digitsOf = s => s.replace(/\D/g, "");
DRILL_VIEWS.num = mode => {
  mode = mode === "listen" && canSpeak() ? "listen" : "read";
  if (!DR || DR.name !== "num" || DR.mode !== mode) { DR = Object.assign({ name: "num", mode }, numQuestion(mode)); const a = DR.ans[0]; if (mode === "listen") setTimeout(() => speak(a), 300); }
  const q = DR;
  const tabs = `<div class="pills"><a class="pill ${mode === "read" ? "on" : ""}" href="#drills/num/read">Say it (type the reading)</a><a class="pill ${mode === "listen" ? "on" : ""}" href="#drills/num/listen">${canSpeak() ? "Listen (type the digits)" : "Listen (needs a Japanese voice)"}</a></div>`;
  const front = mode === "read" ? `<div class="jp huge2">${esc(q.show)}</div><div class="muted small">${esc(q.hint)}: type the reading</div>`
    : `<div><button class="btn big" data-say="${esc(q.ans[0])}">&#9654; Play again</button></div><div class="muted small">${esc(q.hint)}: type the digits you hear${q.k === "time" ? " (e.g. 9:45)" : q.k === "date" ? " (month/day, e.g. 4/14)" : ""}</div>`;
  drillShell("num", `<div class="front">${front}</div>${q.done ? resultHTML(q.ok, `<span class="jp">${esc(q.ans.join(" / "))}</span> ${sayBtn(q.ans[0])}`, `${mode === "listen" ? `<div class="jp lg">${esc(q.show)}</div>` : ""}${q.ok ? "" : `<div class="small">You typed: <span class="jp badtxt">${esc(q.typed)}</span></div>`}`)
    : typedInput(mode === "read" ? "romaji or kana, Enter" : "digits, Enter")}`, tabs);
  if (!q.done) wireTyped(v => {
    if (mode === "listen") { q.typed = v; const t = digitsOf(v); q.ok = q.k === "date" ? (() => { const [m, d] = v.split(/\D+/).filter(Boolean).map(Number); return `${m}${z2(d || 0)}` === q.digits; })() : t === q.digits; }
    else { q.typed = IME.norm(v); q.ok = q.ans.some(a => IME.norm(a) === q.typed); }
    q.done = true; drillLog("num", q.ok); if (mode === "read") speak(q.ans[0]); render();
  }, mode === "read");
};

// dictation
DRILL_VIEWS.dict = () => {
  if (!canSpeak()) { drillShell("dict", `<p>Dictation needs a Japanese text-to-speech voice. See <a href="#settings">Settings</a> for how to install one (Android and Windows have free voices).</p>`); return; }
  if (!DR || DR.name !== "dict") {
    let pool = ALL("vocab").filter(id => S.cards[id] && S.cards[id].ivl >= 1).map(id => ITEMS[id]);
    if (pool.length < 20) pool = curIds("vocab").map(id => ITEMS[id]);
    pool = pool.filter(i => !/[～〜]/.test(i.r));
    const it = rnd(pool); DR = { name: "dict", it }; setTimeout(() => speak(it.r), 300);
  }
  const q = DR;
  drillShell("dict", `<div class="front"><button class="btn big" data-say="${esc(q.it.r)}">&#9654; Play again</button><div class="muted small">Type what you hear (romaji → kana)</div></div>
   ${q.done ? resultHTML(q.ok, `<span class="jp">${esc(q.it.r)}</span>`, `<div class="jp lg">${esc(q.it.w)}</div><div>${esc(q.it.e)}</div>${q.ok ? "" : `<div class="small">You typed: <span class="jp badtxt">${esc(q.typed)}</span></div>`}`) : typedInput("romaji or kana, Enter")}`);
  if (!q.done) wireTyped(v => { q.typed = IME.norm(v); q.ok = IME.norm(q.it.r) === q.typed; q.done = true; drillLog("dict", q.ok); render(); });
};

// sentence order (並べ替え)
const ORDER_ALL = ORDER_SENTENCES.map(([lv, txt, en]) => ({ lv, toks: txt.split("|"), en, end: "。" }));
const orderPool = () => { const p = ORDER_ALL.filter(o => o.lv >= Math.min(4, L())); return p.length ? p : ORDER_ALL; };
function orderQuestion(lv) {
  const pool = lv ? ORDER_ALL.filter(o => o.lv === lv) : orderPool(); const s = rnd(pool.length ? pool : ORDER_ALL); const n = s.toks.length;
  const start = rint(0, Math.max(0, n - 4));
  return { s, start, blank: s.toks.slice(start, start + 4), star: 2, pool: shuffle(s.toks.slice(start, start + 4)) };
}
DRILL_VIEWS.order = () => {
  if (!DR || DR.name !== "order") DR = Object.assign({ name: "order", picked: [] }, orderQuestion());
  const q = DR, s = q.s;
  const slots = q.blank.map((_, i) => { const p = q.picked[i]; return `<span class="slot ${i === q.star ? "star" : ""} ${q.done ? (p === q.blank[i] ? "okb" : "badb") : ""}">${p ? esc(p) : i === q.star ? "★" : "＿＿"}</span>`; }).join("");
  const sentence = `${esc(s.toks.slice(0, q.start).join(" "))} ${slots} ${esc(s.toks.slice(q.start + 4).join(" "))}${s.end}`;
  drillShell("order", `<div class="front"><div class="jp cloze">${sentence}</div>${s.en ? `<div class="muted small">${esc(s.en)}</div>` : ""}</div>
   ${q.done ? resultHTML(q.ok, q.ok ? "Correct" : "", `<div class="jp lg">${esc(s.toks.join(" "))}${s.end} ${sayBtn(s.toks.join(""))}</div><div class="small muted">★ = <span class="jp">${esc(q.blank[q.star])}</span></div>`)
     : `<div class="opts">${q.pool.map((p, k) => `<button class="opt jp" data-act="opick" data-k="${k}" ${q.picked.includes(p) ? "disabled" : ""}>${esc(p)}</button>`).join("")}</div><div class="bar"><button class="btn ghost" data-act="oundo">Undo</button></div>`}`,
   `<p class="small muted">Tap the words in order. On the exam, you only answer which word goes in ★.</p>`);
};
ACTS.opick = d => { const q = DR; q.picked.push(q.pool[+d.k]); if (q.picked.length === 4) { q.ok = q.picked.every((p, i) => p === q.blank[i]); q.done = true; drillLog("order", q.ok); } render(); };
ACTS.oundo = () => { DR.picked.pop(); render(); };

// reading
DRILL_VIEWS.read = id => {
  if (id === undefined || !READINGS[+id]) {
    DR = null;
    app().innerHTML = `<section class="card"><div class="spread small muted"><a href="#drills">← Drills</a><span>Reading</span></div><h2>Reading passages</h2>
      ${LEVELS.map(l => { const rs = READINGS.map((r, i) => [r, i]).filter(([r]) => r.lv === l); if (!rs.length) return "";
        return `<h3>N${l}</h3><div class="tests">${rs.map(([r, i]) => { const d = S.read[i]; return `<a class="tbtn" href="#drills/read/${i}"><b class="jp">${esc(r.t)}</b><span>${r.q.length} questions${d ? ` · best ${d.best}/${r.q.length}` : ""}</span></a>`; }).join("")}</div>`; }).join("")}
      <p class="small muted">For more: free graded readers at tadoku.org (Levels 0–4, PDF + audio; download once and they work offline) and NHK News Web Easy.</p></section>`;
    return;
  }
  const r = READINGS[+id];
  if (!DR || DR.name !== "read" || DR.id !== +id) DR = { name: "read", id: +id, picks: {}, showEn: false, qs: r.q.map(q => ({ q: q[0], a: q[1], opts: shuffle(q.slice(1)) })) };
  const q = DR, answered = Object.keys(q.picks).length, score = q.qs.filter((x, k) => q.picks[k] === x.a).length;
  app().innerHTML = `<section class="card"><div class="spread small muted"><a href="#drills/read">← Passages</a><span class="tag">N${r.lv}</span></div>
    <h2 class="jp">${esc(r.t)} ${sayBtn(r.text)}</h2><div class="jp passage">${esc(r.text)}</div>
    <button class="btn ghost sm" data-act="ren">${q.showEn ? "Hide" : "Show"} translation</button>${q.showEn ? `<p class="muted">${esc(r.en)}</p>` : ""}
    ${q.qs.map((x, k) => `<div class="rq"><div class="jp"><b>Q${k + 1}.</b> ${esc(x.q)}</div>${optsHTML(x.opts, x.a, q.picks[k] ?? null, "rpick").replace(/data-o=/g, `data-q="${k}" data-o=`)}</div>`).join("")}
    ${answered === q.qs.length ? `<div class="ans ${score === q.qs.length ? "ok" : "bad"}">${score}/${q.qs.length}</div><div class="bar"><a class="btn" href="#drills/read">More passages</a></div>` : ""}</section>`;
};
ACTS.ren = () => { DR.showEn = !DR.showEn; const y = window.scrollY; render(); window.scrollTo(0, y); };
ACTS.rpick = d => {
  const q = DR, k = +d.q; if (q.picks[k] !== undefined) return; q.picks[k] = d.o; drillLog("read", d.o === q.qs[k].a);
  if (Object.keys(q.picks).length === q.qs.length) { const sc = q.qs.filter((x, j) => q.picks[j] === x.a).length; const rec = (S.read[q.id] = S.read[q.id] || { best: 0, n: 0 }); rec.n++; rec.best = Math.max(rec.best, sc); save(); }
  const y = window.scrollY; render(); window.scrollTo(0, y);
};

// kana look-alikes + katakana words
const CONFUSE = [["シ", "ツ"], ["ソ", "ン"], ["ソ", "リ"], ["ぬ", "め"], ["わ", "ね", "れ"], ["る", "ろ"], ["さ", "ち"], ["は", "ほ"], ["き", "さ"], ["い", "り"], ["ク", "ケ", "タ"], ["ウ", "ワ", "フ"], ["コ", "ユ"], ["ノ", "メ"], ["チ", "テ"], ["あ", "お"], ["ま", "も"], ["た", "な"], ["シ", "ミ"], ["う", "つ"], ["こ", "い"], ["ぬ", "ね"], ["ナ", "メ"], ["ハ", "ル"], ["ア", "マ"], ["ヌ", "ス"], ["そ", "ろ"], ["け", "は"], ["ほ", "ま"], ["シ", "ン"], ["ツ", "ソ"]];
const KANA_R = {}; ORDER.kana[5].forEach(id => (KANA_R[ITEMS[id].ch] = ITEMS[id].r));
const KATA_WORDS = ALL("vocab").map(id => ITEMS[id]).filter(i => /^[゠-ヿ]+$/.test(i.w) && i.w.length >= 3);
DRILL_VIEWS.kana = () => {
  if (!DR || DR.name !== "kana") {
    if (Math.random() < 0.6 || !KATA_WORDS.length) {
      const grp = rnd(CONFUSE), ch = rnd(grp), ans = KANA_R[ch];
      const opts = [...new Set([...grp.map(c => KANA_R[c]), ...shuffle(Object.values(KANA_R).filter(r => r.length <= 3))])].slice(0, 4);
      DR = { name: "kana", mode: "mc", ch, ans, opts: shuffle(opts) };
    } else {
      const lvPool = KATA_WORDS.filter(i => i.lv >= Math.max(3, L())); DR = { name: "kana", mode: "kw", it: rnd(lvPool.length ? lvPool : KATA_WORDS) };
    }
  }
  const q = DR;
  if (q.mode === "mc") {
    drillShell("kana", `<div class="front"><div class="jp huge">${q.ch}</div><div class="muted small">Which sound?</div>${optsHTML(q.opts, q.ans, q.done ? q.picked : null, "kpick")}</div>
      ${q.done ? `<div class="back">${strokeBox(q.ch)}</div><button class="btn big wide" data-act="dnext">Next <span class="k">Enter</span></button>` : ""}`);
  } else {
    drillShell("kana", `<div class="front"><div class="jp huge2">${esc(q.it.w)}</div><div class="muted small">Katakana word: type it in romaji (long vowel ー = -)</div></div>
      ${q.done ? resultHTML(q.ok, esc(q.it.e), `<div class="jp">${esc(q.it.w)} ${sayBtn(q.it.w)}</div>`) : typedInput("romaji, Enter")}`);
    if (!q.done) wireTyped(v => { q.ok = IME.norm(v) === IME.norm(q.it.w); q.done = true; drillLog("kana", q.ok); speak(q.it.w); render(); });
  }
};
ACTS.kpick = d => { const q = DR; q.picked = d.o; q.ok = d.o === q.ans; q.done = true; drillLog("kana", q.ok); speak(q.ch); render(); };
document.addEventListener("keydown", e => {
  if (!DR || DR.done || e.target.matches("input,textarea") || !/^[1-4]$/.test(e.key)) return;
  if (DR.name === "kana" && DR.mode === "mc" && DR.opts[+e.key - 1]) ACTS.kpick({ o: DR.opts[+e.key - 1] });
});

// ---- Tests ----
let TEST = null;
function distract(pool, correct, n, key) {
  const seen = new Set([key(correct)]); const out = [];
  for (const x of shuffle(pool)) { const k = key(x); if (!seen.has(k)) { seen.add(k); out.push(x); } if (out.length >= n) break; }
  return out;
}
function mcq(sec, prompt, correct, wrongs, src, say) { const opts = shuffle([correct, ...wrongs]); return { sec, prompt, opts, ans: opts.indexOf(correct), src, say }; }
const vocabAt = lv => ORDER.vocab[lv].map(id => ITEMS[id]);
function qReading(pool, lv) {
  const ks = pool.filter(vKanjiTestable); if (!ks.length) return null; const it = rnd(ks);
  const all = vocabAt(lv).filter(v => v.r !== it.r); const near = all.filter(v => Math.abs(v.r.length - it.r.length) <= 1);
  return mcq("文字・語彙", `<span class="muted small">How is the underlined word read?</span><div class="jp lg"><u>${esc(it.w)}</u></div>`, it.r, distract(near.length > 10 ? near : all, it, 3, v => v.r).map(v => v.r), it.id);
}
function qWriting(pool, lv) {
  const ks = pool.filter(vKanjiTestable); if (!ks.length) return null; const it = rnd(ks);
  const all = vocabAt(lv).filter(vKanjiTestable).filter(v => v.w !== it.w); const near = all.filter(v => v.w.length === it.w.length);
  return mcq("文字・語彙", `<span class="muted small">Which is the kanji for:</span><div class="jp lg">${esc(it.r)}</div>`, it.w, distract(near.length > 6 ? near : all, it, 3, v => v.w).map(v => v.w), it.id);
}
function qMeaning(pool, lv) { if (!pool.length) return null; const it = rnd(pool); return mcq("文字・語彙", `<span class="muted small">Meaning?</span><div class="jp lg">${esc(vMain(it))}</div>`, it.e, distract(vocabAt(lv || it.lv), it, 3, v => v.e).map(v => v.e), it.id); }
function qKanji(pool) { if (!pool.length) return null; const it = rnd(pool); return mcq("文字・語彙", `<span class="muted small">Meaning of this kanji?</span><div class="jp xl">${it.k}</div>`, it.m, distract(ORDER.kanji[it.lv].map(id => ITEMS[id]), it, 3, k => k.m).map(k => k.m), it.id); }
function qGrammar(pool) { if (!pool.length) return null; const it = rnd(pool); const q = it.q[0]; return mcq("文法", `<div class="jp cloze">${clozeHTML(q[0])}</div><div class="muted small">${esc(q[3] || "")}</div>`, q[1], q[2], it.id); }
function qOrder(lv) {
  const o = orderQuestion(lv);
  const sent = `${esc(o.s.toks.slice(0, o.start).join(" "))} ${o.blank.map((_, i) => (i === o.star ? '<span class="blank">★</span>' : "＿＿")).join(" ")} ${esc(o.s.toks.slice(o.start + 4).join(" "))}${o.s.end}`;
  return mcq("文法", `<span class="muted small">Which word goes in ★?</span><div class="jp cloze">${sent}</div>`, o.blank[o.star], o.blank.filter((_, i) => i !== o.star), null);
}
function qListenWord(pool, lv) { if (!pool.length) return null; const it = rnd(pool); return mcq("聴解", `<span class="muted small">Listen. What does it mean?</span>`, it.e, distract(vocabAt(lv || it.lv), it, 3, v => v.e).map(v => v.e), it.id, it.r); }
function qListenSent(pool) { if (!pool.length) return null; const it = rnd(pool); const ex = rnd(it.ex); const others = pool.flatMap(g => g.ex).filter(e => e[1] !== ex[1]); return mcq("聴解", `<span class="muted small">Listen to the sentence. Which translation matches?</span>`, ex[1], pick(others, 3).map(e => e[1]), it.id, ex[0]); }
function qListenNum() { const q = numQuestion("listen"); const wrong = new Set(); let g = 0; while (wrong.size < 3 && g++ < 80) { const w = numQuestion("listen"); if (w.k === q.k && w.show !== q.show) wrong.add(w.show); } return mcq("聴解", `<span class="muted small">Listen. Which ${q.hint} did you hear?</span>`, q.show, [...wrong], null, q.ans[0]); }
function readingQs(lv, max) {
  const out = [];
  for (const r of shuffle(READINGS.filter(r => r.lv === lv))) { for (const q of r.q) { if (out.length >= max) break; out.push(mcq("読解", `<div class="jp passage sm">${esc(r.text)}</div><div class="jp"><b>${esc(q[0])}</b></div>`, q[1], q.slice(2), null)); } if (out.length >= max) break; }
  return out;
}
function qKana() { const pool = ORDER.kana[5].map(id => ITEMS[id]); const it = rnd(pool); return mcq("Kana", `<div class="jp huge">${it.ch}</div>`, it.r, distract(pool, it, 3, i => i.r).map(i => i.r), it.id); }
function build(n, gen) { const out = [], seen = new Set(); let tries = 0; while (out.length < n && tries++ < n * 25) { const q = gen(); if (q && q.opts.length >= 2 && !seen.has(q.prompt + q.opts[q.ans])) { seen.add(q.prompt + q.opts[q.ans]); out.push(q); } } return out; }
ACTS.test = d => {
  const kind = d.kind, lv = +(d.lv || L()); let qs = [], mins = 0;
  const learned = t => ALL(t).filter(id => S.cards[id]).map(id => ITEMS[id]);
  const lV = learned("vocab"), lK = learned("kanji"), lG = learned("grammar");
  if (kind === "kana") qs = build(40, qKana);
  else if (kind === "quick") {
    if (lV.length + lK.length + lG.length < 5) { alert("Learn a few vocab / kanji / grammar items first (Today → Learn), or try the Kana test."); return; }
    const gens = [];
    if (lV.length) gens.push(() => qMeaning(lV), () => qReading(lV, rnd(lV).lv));
    if (lK.length) gens.push(() => qKanji(lK));
    if (lG.length) gens.push(() => qGrammar(lG));
    if (canSpeak() && lV.length) gens.push(() => qListenWord(lV));
    qs = build(15, () => rnd(gens)());
  } else {
    mins = LV[lv].mock;
    const V = vocabAt(lv), G = ORDER.grammar[lv].map(id => ITEMS[id]), K = ORDER.kanji[lv].map(id => ITEMS[id]);
    qs = [...build(8, () => qReading(V, lv)), ...build(5, () => qWriting(V, lv)), ...build(5, () => qMeaning(V, lv)), ...build(3, () => qKanji(K)),
      ...build(12, () => qGrammar(G)), ...(lv >= 4 ? build(3, () => qOrder(lv)) : []), ...readingQs(lv, 4)];
    if (canSpeak()) qs.push(...build(4, () => qListenWord(V, lv)), ...build(3, () => qListenSent(G)), ...(lv >= 4 ? build(3, qListenNum) : []));
  }
  TEST = { kind, lv, qs, i: 0, picks: [], start: Date.now(), mins, feedback: kind !== "full" };
  go("#exam");
};
let timerH = null;
VIEWS.exam = () => {
  clearInterval(timerH);
  if (!TEST) return go("#test");
  if (TEST.i >= TEST.qs.length) return finishTest();
  const q = TEST.qs[TEST.i], answered = TEST.picks[TEST.i] !== undefined;
  app().innerHTML = `<section class="card session">
    <div class="spread small muted"><span>${TEST.kind === "full" ? `N${TEST.lv} mock · ` : ""}${q.sec} · Q${TEST.i + 1}/${TEST.qs.length}</span><span id="timer"></span></div>
    <div class="prog"><div style="width:${pct(TEST.i, TEST.qs.length)}%"></div></div>
    <div class="front">${q.prompt}${q.say ? `<div><button class="btn" data-say="${esc(q.say)}">&#9654; Play</button></div>` : ""}</div>
    <div class="opts">${q.opts.map((o, k) => { let cls = ""; if (answered) cls = k === q.ans ? "ok" : k === TEST.picks[TEST.i] ? "bad" : "";
      return `<button class="opt ${IS_JP.test(o) ? "jp" : ""} ${cls}" data-act="tpick" data-k="${k}" ${answered ? "disabled" : ""}><span class="k">${k + 1}</span>${esc(o)}</button>`; }).join("")}</div>
    ${answered ? `<button class="btn big wide" data-act="tnext">Next <span class="k">Enter</span></button>` : ""}
    <div class="bar"><a class="small muted" href="#test" data-act="tquit">Quit test</a>${TEST.kind === "full" ? ` <a class="small muted" href="#" data-act="tfinish">Submit now</a>` : ""}</div></section>`;
  if (q.say && !answered) setTimeout(() => speak(q.say), 250);
  if (TEST.mins) {
    const tick = () => { const left = TEST.mins * 60 - (Date.now() - TEST.start) / 1000; const el = $("#timer");
      if (left <= 0) { clearInterval(timerH); finishTest(); return; } if (el) el.textContent = `${Math.floor(left / 60)}:${z2(Math.floor(left % 60))}`; };
    tick(); timerH = setInterval(tick, 1000);
  }
};
ACTS.tpick = d => { TEST.picks[TEST.i] = +d.k; if (TEST.feedback) render(); else { TEST.i++; render(); } };
ACTS.tnext = () => { TEST.i++; render(); };
ACTS.tquit = () => { clearInterval(timerH); TEST = null; go("#test"); };
ACTS.tfinish = () => finishTest();
document.addEventListener("keydown", e => {
  if (location.hash !== "#exam" || !TEST || e.target.matches("input,textarea")) return;
  if (/^[1-4]$/.test(e.key) && TEST.picks[TEST.i] === undefined && +e.key <= TEST.qs[TEST.i].opts.length) ACTS.tpick({ k: +e.key - 1 });
  else if (e.key === "Enter" && TEST.picks[TEST.i] !== undefined) ACTS.tnext();
});
function finishTest() {
  clearInterval(timerH);
  const secs = {}, wrong = [];
  TEST.qs.forEach((q, i) => { const s = (secs[q.sec] = secs[q.sec] || [0, 0]); s[1]++; if (TEST.picks[i] === q.ans) s[0]++; else wrong.push(i); });
  const ok = Object.values(secs).reduce((a, s) => a + s[0], 0);
  const rec = { id: Date.now(), date: today(), kind: TEST.kind, lv: TEST.lv, sections: secs, pct: pct(ok, TEST.qs.length), mins: Math.round((Date.now() - TEST.start) / 60000) };
  S.tests.push(rec); save();
  const T = TEST; TEST = null;
  const wrongSrc = [...new Set(wrong.map(i => T.qs[i].src).filter(Boolean))];
  app().innerHTML = `<section class="card"><h2>Result: ${rec.pct}%</h2>
    <table class="vt">${Object.entries(secs).map(([k, s]) => `<tr><td>${k}</td><td>${s[0]}/${s[1]}</td><td>${pct(s[0], s[1])}%</td><td>${bar(pct(s[0], s[1]))}</td></tr>`).join("")}</table>
    <p class="muted small">Target: 70%+ in every section. Real N${T.lv} pass line: ${esc(LV[T.lv].pass)}.</p>
    ${wrong.length ? `<h3>Review your mistakes (${wrong.length})</h3><ol class="wrong">${wrong.map(i => { const q = T.qs[i];
      return `<li><div>${q.prompt}${q.say ? ` <span class="jp">${esc(q.say)}</span> ${sayBtn(q.say)}` : ""}</div><div class="small">Your answer: <span class="badtxt">${esc(q.opts[T.picks[i]] ?? "(none)")}</span> · Correct: <span class="oktxt">${esc(q.opts[q.ans])}</span></div></li>`; }).join("")}</ol>
      ${wrongSrc.length ? `<button class="btn" data-act="requeue" data-ids="${esc(wrongSrc.join(","))}">Add these ${wrongSrc.length} items to today's reviews</button>` : ""}` : "<p>Perfect score!</p>"}
    <div class="bar"><a class="btn ghost" href="#test">Back to tests</a></div></section>`;
}
ACTS.requeue = (d, el) => { d.ids.split(",").forEach(id => { if (!ITEMS[id]) return; introduce(id); S.cards[id].due = today(); }); save(); el.textContent = "Added ✓"; el.disabled = true; $("#dueBadge").textContent = dueIds().length || ""; };
const bar = p => `<span class="mbar"><span style="width:${p}%" class="${p >= 70 ? "good" : p >= 50 ? "mid" : "low"}"></span></span>`;
const OFFICIAL = [["Vocabulary (文字・語彙)", F.V], ["Grammar (文法)", F.G], ["Reading (読解)", F.R], ["Listening (聴解) questions", F.L], ["Answer sheet (正答表)", F.ans], ["Problem booklet (N5-mondai; may overlap with the files above)", F.mondai]];
VIEWS.test = () => {
  const hist = S.tests.slice().reverse().slice(0, 25), lv = L();
  app().innerHTML = `<section class="card"><h2>Practice tests</h2>
    <div class="tests">
      ${lv === 5 ? `<button class="tbtn" data-act="test" data-kind="kana"><b>Kana test</b><span>40 random kana · untimed · weeks 1–2 checkpoint</span></button>` : ""}
      <button class="tbtn" data-act="test" data-kind="quick"><b>Quick test</b><span>15 questions from everything you've learned · instant feedback</span></button>
      ${LEVELS.map(l => `<button class="tbtn ${l === lv ? "cur" : ""}" data-act="test" data-kind="full" data-lv="${l}"><b>N${l} full mock${l === lv ? " (your level)" : ""}</b><span>~${l >= 4 ? 45 : 37}${canSpeak() ? "+" : ""} questions: vocab, kanji, grammar${l >= 4 ? ", sentence order" : ""}, reading${canSpeak() ? ", listening" : ""} · ${LV[l].mock} min · results at the end</span></button>`).join("")}
    </div>${canSpeak() ? "" : `<p class="small muted">Listening sections need a Japanese voice (see Settings).</p>`}</section>
  <section class="card"><h2>Official JLPT N5 sample test</h2>
    <p class="muted small">Take it in N5 weeks 12, 22 and 29. Timing: vocab 20 min, grammar + reading 40 min, listening 30 min. For N4–N1, use the free official sample questions on jlpt.jp and the 公式問題集 workbooks, and log scores below.</p>
    <ul class="files">${OFFICIAL.map(o => `<li><a href="${href(o[1])}" target="_blank" rel="noopener">${esc(o[0])}</a></li>`).join("")}</ul>
    <div class="audios">${[1, 2, 3, 4].map(n => `<div><span class="small">Listening part ${n}</span><audio controls preload="none" src="${href(F.q(n))}"></audio></div>`).join("")}
      <div><span class="small">Sample audio (full)</span><audio controls preload="none" src="${href(F.sample)}"></audio></div></div>
    <form id="offForm" class="offform">
      <label>Level <select name="lv">${LEVELS.map(l => `<option value="${l}" ${l === lv ? "selected" : ""}>N${l}</option>`).join("")}</select></label>
      <label>Vocab / language knowledge <input name="v1" type="number" min="0" placeholder="right"> / <input name="v2" type="number" min="1" placeholder="total"></label>
      <label>Grammar + reading <input name="g1" type="number" min="0" placeholder="right"> / <input name="g2" type="number" min="1" placeholder="total"></label>
      <label>Listening <input name="l1" type="number" min="0" placeholder="right"> / <input name="l2" type="number" min="1" placeholder="total"></label>
      <button class="btn">Log official / workbook score</button></form></section>
  <section class="card"><h2>History</h2>${hist.length ? `<table class="vt"><tr><th>Date</th><th>Test</th><th>Score</th><th></th></tr>${hist.map(t => `<tr><td>${fmtDate(t.date)}</td><td>${t.kind}${t.lv ? ` N${t.lv}` : ""}</td><td>${t.pct}%</td><td>${bar(t.pct)}</td></tr>`).join("")}</table>` : `<p class="muted">No tests yet.</p>`}</section>`;
  $("#offForm").addEventListener("submit", e => {
    e.preventDefault(); const f = new FormData(e.target); const n = k => +f.get(k) || 0;
    const secs = {}; [["文字・語彙", "v"], ["文法・読解", "g"], ["聴解", "l"]].forEach(([s, k]) => { if (n(k + "2")) secs[s] = [Math.min(n(k + "1"), n(k + "2")), n(k + "2")]; });
    if (!Object.keys(secs).length) return alert("Enter at least one section.");
    const ok = Object.values(secs).reduce((a, s) => a + s[0], 0), tot = Object.values(secs).reduce((a, s) => a + s[1], 0);
    S.tests.push({ id: Date.now(), date: today(), kind: "official", lv: +f.get("lv"), sections: secs, pct: pct(ok, tot) }); save(); render();
  });
};

// ---- Plan + roadmap ----
function levelStats(l) {
  const ids = TYPES.flatMap(t => ORDER[t][l]); const intro = introducedIn(ids).length, mat = matureIn(ids).length;
  const mocks = S.tests.filter(t => (t.kind === "full" || t.kind === "official") && (t.lv || 5) === l);
  return { n: ids.length, intro, mat, best: mocks.length ? Math.max(...mocks.map(t => t.pct)) : null };
}
VIEWS.plan = () => {
  const cw = weekNo(), tw = totalWeeks(), lv = L();
  const road = LEVELS.map(l => { const s = levelStats(l); const cur = l === lv;
    const ready = s.n && s.intro / s.n >= 0.95 && s.mat / s.n >= 0.5 && (s.best || 0) >= 70;
    return `<div class="lvrow ${cur ? "cur" : ""}"><div class="lvname">N${l}</div><div class="lvbody">
      <div class="small">${ORDER.vocab[l].length} words · ${ORDER.kanji[l].length} kanji · ${ORDER.grammar[l].length} grammar · ~${LV[l].hours} h cumulative</div>
      <div class="mbar stack wide"><span class="good" style="width:${pct(s.mat, s.n)}%"></span><span class="mid" style="width:${pct(s.intro - s.mat, s.n)}%"></span></div>
      <div class="small muted">${pct(s.intro, s.n)}% started · ${pct(s.mat, s.n)}% mature · best mock ${s.best ?? "—"}%${ready ? ' · <span class="oktxt">foundation solid ✓</span>' : ""}</div>
      <details class="small"><summary>What N${l} means · exam format</summary><p>${esc(LV[l].can)}</p><p>Sections: ${LV[l].secs.map(x => `${x[0]} ${x[1]} min`).join(" · ")}<br>Pass: ${esc(LV[l].pass)}</p></details></div>
      <div>${cur ? '<span class="tag">current</span>' : `<button class="btn ghost sm" data-act="setLevel" data-lv="${l}">${l < lv ? "Start" : "Switch"}</button>`}</div></div>`; }).join("");
  const weeks = [], ph = phasesFor(lv);
  for (let w = 1; w <= tw; w++) {
    const start = addDays(S.settings.start, (w - 1) * 7), p = phaseOf(w);
    const tasks = weekTasks(w); const doneN = tasks.filter((t, i) => S.tasks[`n${lv}w${w}-${i}`] || (lv === 5 && S.tasks[`w${w}-${i}`])).length;
    weeks.push(`<details class="week ${w === cw ? "cur" : ""} ${w < cw ? "past" : ""}" ${w === cw ? "open" : ""}><summary><b>W${w}</b> <span class="muted small">${fmtDate(start)}</span> <span class="tag">${p.id}·${esc(p.name)}</span> <span class="sp"></span><span class="small muted">${doneN}/${tasks.length}</span></summary>${weekTasksHTML(w)}</details>`);
  }
  app().innerHTML = `<section class="card"><h2>Roadmap N5 → N1</h2>
    <p class="small muted">Every level's cards stay in your reviews, so earlier levels keep getting consolidated as you climb. Move up when a level shows <b>foundation solid</b> (95% started, 50% mature, a mock at 70%+). Hours are rough cumulative study estimates for learners without a kanji background.</p>${road}</section>
  <section class="card"><h2>N${lv} plan: ${tw} weeks</h2>
    <p class="muted small">Start ${fmtDate(S.settings.start)} · exam ${fmtDate(S.settings.exam)} (change in Settings). Every day: reviews, then new items, then a drill or weekly task.</p>
    <table class="vt phases">${ph.map(p => `<tr class="${phaseOf(cw).id === p.id ? "cur" : ""}"><td><b>${p.id}</b></td><td><b>${esc(p.name)}</b><br><span class="small muted">W${p.weeks[0]}–${p.weeks[1]}</span></td><td class="small">${esc(p.goal)}</td></tr>`).join("")}</table></section>
  <section class="card">${weeks.join("")}</section>`;
};
ACTS.setLevel = d => {
  const l = +d.lv; const start = nextMonday(today()); const exam = nextExam(start, l <= 2 ? 240 : 150);
  if (!confirm(`Switch your plan to N${l}?\nStart ${start}, target exam ${exam} (first Sunday of July/December; check the official date).\nAll learned cards stay in your reviews.`)) return;
  S.history.push({ date: today(), from: L(), to: l });
  Object.assign(S.settings, { level: l, start, exam }); save(); computeUnlocks(); go("#today");
};

// ---- Stats ----
VIEWS.stats = () => {
  const rows = LEVELS.map(l => TYPES.filter(t => ORDER[t][l].length).map(t => {
    const ids = ORDER[t][l], n = ids.length, i = introducedIn(ids).length, k = knownIn(ids).length, m = matureIn(ids).length;
    return `<tr><td>N${l}</td><td><span class="tag t-${t}">${TYPE_LABEL[t]}</span></td><td>${i}/${n}</td><td>${m}</td><td><span class="mbar stack"><span class="good" style="width:${pct(m, n)}%"></span><span class="mid" style="width:${pct(k - m, n)}%"></span><span class="low" style="width:${pct(i - k, n)}%"></span></span></td></tr>`;
  }).join("")).join("");
  const days = []; for (let k = 29; k >= 0; k--) days.push(addDays(today(), -k));
  const maxR = Math.max(10, ...days.map(d => (S.log[d] || {}).r || 0));
  const last30 = days.reduce((a, d) => { const Lg = S.log[d]; if (Lg) { a.r += Lg.r; a.ok += Lg.ok; a.sec += Lg.sec; } return a; }, { r: 0, ok: 0, sec: 0 });
  const leeches = Object.entries(S.cards).filter(([id, c]) => ITEMS[id] && c.lapses >= 4).map(([id]) => id);
  const upcoming = []; for (let k = 1; k <= 7; k++) { const d = addDays(today(), k); upcoming.push([d, Object.values(S.cards).filter(c => c.due === d).length]); }
  const Rs = Object.values(S.cards).map(retrievNow).filter(x => x !== null);
  const mocks = S.tests.filter(t => t.kind === "full" || t.kind === "official").slice(-10);
  const drills = Object.entries(S.drills).filter(([k]) => DRILLS[k]);
  app().innerHTML = `<section class="card"><h2>Memory</h2><div class="stats3"><div><b>${Object.keys(S.cards).length}</b><span>cards</span></div><div><b>${Rs.length ? Math.round((100 * Rs.reduce((a, b) => a + b, 0)) / Rs.length) + "%" : "—"}</b><span>est. recall now (FSRS)</span></div><div><b>${streak()}</b><span>day streak</span></div></div></section>
  <section class="card"><h2>Progress by level</h2><table class="vt"><tr><th></th><th></th><th>Started</th><th>Mature</th><th></th></tr>${rows}</table>
    <div class="legend small"><span class="s-mature">mature</span><span class="s-known">known</span><span class="s-learn">learning</span></div></section>
  <section class="card"><h2>Last 30 days</h2>
    <div class="stats3"><div><b>${last30.r}</b><span>reviews</span></div><div><b>${pct(last30.ok, last30.r)}%</b><span>accuracy</span></div><div><b>${Math.round(last30.sec / 60)}</b><span>minutes</span></div></div>
    <div class="chart">${days.map(d => { const r = (S.log[d] || {}).r || 0; return `<div title="${d}: ${r}"><span style="height:${pct(r, maxR)}%"></span></div>`; }).join("")}</div>
    <p class="small muted">Next 7 days due: ${upcoming.map(([d, n]) => `${fmtDate(d)} ${n}`).join(" · ")}</p></section>
  <section class="card"><h2>Drills</h2>${drills.length ? `<table class="vt">${drills.map(([k, s]) => `<tr><td>${DRILLS[k][0]}</td><td>${s.n}</td><td>${pct(s.ok, s.n)}%</td><td>${bar(pct(s.ok, s.n))}</td></tr>`).join("")}</table>` : `<p class="muted">No drills yet.</p>`}</section>
  <section class="card"><h2>Mock and official scores</h2>${mocks.length ? `<table class="vt">${mocks.map(t => `<tr><td>${fmtDate(t.date)}</td><td>${t.kind} N${t.lv || 5}</td><td class="small">${Object.entries(t.sections).map(([k, s]) => `${k} ${pct(s[0], s[1])}%`).join(" · ")}</td><td>${bar(t.pct)}</td></tr>`).join("")}</table>` : `<p class="muted">Take a full mock on the Test tab. Aim for 70%+ before the exam.</p>`}</section>
  <section class="card"><h2>Leeches (failed 4+ times)</h2>${leeches.length ? `<p class="jp">${leeches.map(id => esc(itemShort(ITEMS[id]))).join(" · ")}</p><button class="btn" data-act="reviewIds" data-ids="${esc(leeches.join(","))}">Drill leeches now</button><p class="small muted">Tip: write a mnemonic, look at the stroke order, or make your own sentence with it.</p>` : `<p class="muted">None. Good.</p>`}</section>`;
};

// ---- Settings ----
VIEWS.settings = () => {
  const s = S.settings;
  app().innerHTML = `<section class="card"><h2>Settings</h2>
    <form id="setForm" class="setform">
      <label>Current level <select name="level">${LEVELS.map(l => `<option value="${l}" ${l === s.level ? "selected" : ""}>N${l}</option>`).join("")}</select></label>
      <label>Plan start (Monday of week 1) <input type="date" name="start" value="${s.start}"></label>
      <label>Exam date <input type="date" name="exam" value="${s.exam}"></label>
      <label>Target recall (FSRS desired retention): <b id="retv">${Math.round(s.retention * 100)}%</b> <input type="range" name="retention" min="0.8" max="0.95" step="0.01" value="${s.retention}"><span class="small muted">Higher means more reviews but fewer forgotten cards. 90% is the usual sweet spot.</span></label>
      <label>Theme <select name="theme">${["auto", "light", "dark"].map(t => `<option ${t === s.theme ? "selected" : ""}>${t}</option>`).join("")}</select></label>
      <label class="chk"><input type="checkbox" name="tts" ${s.tts ? "checked" : ""}> Japanese text-to-speech ${JA_VOICE ? `<span class="oktxt small">(voice: ${esc(JA_VOICE.name)})</span>` : `<span class="badtxt small">(no Japanese voice found)</span>`}</label>
      <label>Speech rate <input type="range" name="rate" min="0.6" max="1.2" step="0.05" value="${s.rate}"> <button type="button" class="btn ghost" data-say="にほんごを べんきょうしています。">Test</button></label>
      <label class="chk"><input type="checkbox" name="production" ${s.production ? "checked" : ""}> Production mode: show English first on half of the mature vocab (turn on once basics are solid)</label>
      <button class="btn">Save settings</button>
    </form>
    ${JA_VOICE ? "" : `<p class="small muted">To get audio, install a Japanese voice. Android: Settings → System → Languages → Text-to-speech → Google → install Japanese voice data. Windows: Settings → Time & Language → Speech → Add voices → Japanese. Linux: Chrome usually has no offline Japanese voice; use your phone for listening drills.</p>`}</section>
  <section class="card"><h2>Backup and sync between devices</h2>
    <p class="small muted">Progress is stored in this browser only. Export a JSON file into the <code>n5-dojo/progress/</code> folder next to this file so git syncs it, then Import on the other device. Import <b>merges</b>: the newer review of each card wins.</p>
    <div class="bar"><button class="btn" data-act="export">Export progress file</button><button class="btn ghost" data-act="copy">Copy as text</button>
      <label class="btn ghost">Import file<input type="file" id="impFile" accept=".json,application/json" hidden></label></div>
    <textarea id="impText" placeholder="…or paste exported JSON here" rows="3"></textarea><button class="btn ghost" data-act="importText">Import pasted text</button>
    <p class="small muted">Last export: ${S.lastExport ? esc(S.lastExport.replace("T", " ").slice(0, 16)) : "never"}</p></section>
  <section class="card"><h2>About the data</h2><p class="small muted">Vocabulary: japanese/jlpt_vocab.csv (JLPT lists by level, after J. Waller / tanos.co.uk). Kanji N4–N1: KANJIDIC via davidluzgouveia/kanji-data (EDRDG licence, CC BY-SA 4.0). Stroke order: KanjiVG © Ulrich Apel (CC BY-SA 3.0). Scheduler: FSRS-6 default parameters (open-spaced-repetition). N5 kanji notes, grammar explanations, reading passages and drills were written for this app. JLPT publishes no official vocabulary or grammar lists, so level placement is approximate.</p></section>
  <section class="card"><h2>Danger zone</h2><button class="btn danger" data-act="reset">Reset all progress</button></section>`;
  const f = $("#setForm"); f.retention.addEventListener("input", () => ($("#retv").textContent = Math.round(f.retention.value * 100) + "%"));
  f.addEventListener("submit", e => {
    e.preventDefault(); const fd = new FormData(f);
    if (!fd.get("start") || !fd.get("exam")) return alert("Both dates are required.");
    Object.assign(S.settings, { level: +fd.get("level"), start: fd.get("start"), exam: fd.get("exam"), tts: !!fd.get("tts"), production: !!fd.get("production"), rate: +fd.get("rate"), retention: +fd.get("retention"), theme: fd.get("theme") });
    save(); computeUnlocks(); applyTheme(); alert("Saved."); render();
  });
  $("#impFile").addEventListener("change", e => { const file = e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => doImport(r.result); r.readAsText(file); });
};
const exportJSON = () => { S.lastExport = new Date().toISOString(); save(); return JSON.stringify(S); };
ACTS.export = () => {
  const blob = new Blob([exportJSON()], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `n5-dojo-progress-${today()}.json`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); render();
};
ACTS.copy = async () => { const t = exportJSON(); try { await navigator.clipboard.writeText(t); alert("Copied. Paste it into a file in the n5-dojo/progress/ folder"); } catch { $("#impText").value = t; $("#impText").select(); alert("Clipboard is blocked. The text is in the box below, so copy it manually."); } };
ACTS.importText = () => doImport($("#impText").value);
function doImport(txt) {
  let b; try { b = JSON.parse(txt); } catch { return alert("That isn't valid JSON."); }
  if (!b || typeof b.cards !== "object") return alert("That doesn't look like an N5 Dojo progress file.");
  b = migrate(b); let n = 0;
  for (const [id, c] of Object.entries(b.cards)) { const a = S.cards[id]; if (!a || (c.last || 0) > (a.last || 0)) { S.cards[id] = c; n++; } }
  for (const [d, Lg] of Object.entries(b.log || {})) { const a = S.log[d] || { r: 0, ok: 0, n: 0, sec: 0 }; S.log[d] = { r: Math.max(a.r, Lg.r || 0), ok: Math.max(a.ok, Lg.ok || 0), n: Math.max(a.n, Lg.n || 0), sec: Math.max(a.sec, Lg.sec || 0), dr: Math.max(a.dr || 0, Lg.dr || 0) }; }
  const ids = new Set(S.tests.map(t => t.id)); (b.tests || []).forEach(t => { if (!ids.has(t.id)) S.tests.push(t); }); S.tests.sort((x, y) => x.id - y.id);
  for (const [k, v] of Object.entries(b.tasks || {})) if (v) S.tasks[k] = true;
  for (const [k, v] of Object.entries(b.drills || {})) { if (k === "conjOpt") continue; const a = S.drills[k]; if (!a || (v.n || 0) > a.n) S.drills[k] = v; }
  for (const [k, v] of Object.entries(b.read || {})) { const a = S.read[k]; if (!a || v.best > a.best) S.read[k] = v; }
  if (!Object.keys(S.cards).length || confirm("Also use the settings (level, start/exam dates) from the imported file?")) Object.assign(S.settings, b.settings || {});
  save(); computeUnlocks(); applyTheme(); alert(`Imported. ${n} cards updated.`); render();
}
ACTS.reset = () => { if (prompt('Type "reset" to delete all progress in this browser.') === "reset") { localStorage.removeItem(KEY); S = DEFAULTS(); save(); computeUnlocks(); go("#today"); } };

// ---------- boot ----------
render();
