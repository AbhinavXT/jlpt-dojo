// End-to-end test with Playwright (Chromium). Run: node n5-dojo/tests/e2e.js [screenshotDir]
// Uses a fake Japanese voice so listening features are exercised headlessly.
"use strict";
const { chromium } = require("playwright");
const path = require("path"), fs = require("fs");
const URL = "file://" + path.resolve(__dirname, "..", "..", "n5-dojo.html");
const SHOTS = process.argv[2]; if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const fakeVoice = () => {
  const v = { lang: "ja-JP", name: "Fake JA", voiceURI: "fake", default: true, localService: true };
  window.__spoken = [];
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  Object.defineProperty(window, "speechSynthesis", { value: { getVoices: () => [v], speak: u => window.__spoken.push(u.text), cancel() {}, onvoiceschanged: null }, configurable: true });
};
let step = 0; const log = m => console.log(`${++step}. ${m}`);
const errs = [];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
  await ctx.addInitScript(fakeVoice);
  const p = await ctx.newPage();
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  p.on("dialog", d => d.accept(d.type() === "prompt" ? "reset" : undefined));
  const go = async h => { await p.goto(URL + h); await p.waitForTimeout(80); };
  const shot = async n => SHOTS && p.screenshot({ path: path.join(SHOTS, n + ".png"), fullPage: true });
  const ev = (f, a) => p.evaluate(f, a);
  // handwrite a character on the pad by tracing KanjiVG's own stroke samples with the mouse
  const write = async (ch, { reverseFirst = false } = {}) => {
    await p.waitForSelector("#wpad canvas");
    const S = await ev(c => strokeSamples(c).map(s => s.pts), ch);
    const r = await p.$eval("#wpad canvas", c => { const b = c.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width }; });
    const P = q => [r.x + (q[0] / 109) * r.w, r.y + (q[1] / 109) * r.w];
    for (let i = 0; i < S.length; i++) {
      const tries = reverseFirst && i === 0 ? [S[0].slice().reverse(), S[0]] : [S[i]];
      for (const pts of tries) { await p.mouse.move(...P(pts[0])); await p.mouse.down(); for (const q of pts.slice(1)) await p.mouse.move(...P(q)); await p.mouse.up(); }
    }
  };

  // 1. migration from v1 state
  await p.goto(URL);
  await ev(() => localStorage.setItem("n5dojo.v1", JSON.stringify({ v: 1, settings: { start: "2026-11-30", exam: "2027-07-04" }, cards: { "kh:あ": { due: "2026-11-01", ivl: 3, ef: 2.3, reps: 2, lapses: 0, last: Date.now() - 864e5 * 4, added: "2026-11-01" } }, log: {}, tests: [], tasks: { "w1-0": true } })));
  await p.reload(); await go("#today");
  const mig = await ev(() => S.cards["kh:あ"]);
  if (!(mig.s > 0 && mig.d >= 1 && !("ef" in mig))) throw new Error("migration failed " + JSON.stringify(mig));
  if (!(await p.$eval('[data-task="n5w1-0"]', e => e.checked))) throw new Error("old task ticks not carried over");
  log("v1 → v2 migration OK"); await shot("01-today");

  // 2. kana lesson + typed review
  await p.click('[data-act=learn][data-type=kana]'); await p.waitForSelector("#app svg.strk"); await shot("02-kana-lesson");
  if ((await p.$$("#app svg.strk")).length < 5) throw new Error("stroke SVGs missing in kana lesson");
  await p.click('[data-act=pad]'); await p.waitForSelector(".overlay canvas");
  const box = await p.$eval(".overlay canvas", c => { const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; });
  await p.mouse.move(box.x + 20, box.y + 20); await p.mouse.down(); await p.mouse.move(box.x + box.w - 20, box.y + box.w / 2, { steps: 8 }); await p.mouse.up();
  await shot("03-writing-pad"); await p.click('[data-p=close]');
  await p.click("[data-act=lessonDone]");
  let sawWrite = false;
  for (let i = 0; i < 40; i++) {
    await p.waitForFunction(() => !SES || (location.hash === "#session" && document.querySelector(".session")));
    const it = await ev(() => SES && SES.q.length ? ITEMS[SES.q[0]] : null); if (!it) break;
    if (it.type === "kana") { await p.waitForSelector("#kin"); await p.fill("#kin", i === 2 ? "xx" : it.r); await p.press("#kin", "Enter"); await p.keyboard.press("Enter"); }
    else if (it.type === "write") {
      await write(it.ch, { reverseFirst: i % 4 === 1 }); await p.waitForSelector("[data-act=next]");
      const wr = await ev(() => SES.wres); if (!wr || wr.grade < 2) throw new Error("writing card graded wrong: " + JSON.stringify(wr));
      if (!sawWrite) { await shot("02b-write-card"); sawWrite = true; } await p.click("[data-act=next]");
    } else { await p.click("[data-act=flip]"); await p.click('[data-act=grade][data-g="3"]'); }
  }
  if (!(await p.textContent("#app h2")).includes("Session done")) throw new Error("kana session did not finish");
  log("kana lesson, stroke animation, writing pad, typed review OK");

  // 3. learn vocab / kanji / grammar
  for (const t of ["vocab", "kanji", "grammar"]) {
    await go("#today"); await p.click(`[data-act=learn][data-type=${t}]`); await p.waitForSelector("[data-act=lessonDone]"); await p.click("[data-act=lessonDone]");
    for (let i = 0; i < 20; i++) {
      await p.waitForFunction(() => !SES || (location.hash === "#session" && document.querySelector(".session") && (ITEMS[SES.q[0]].type !== "grammar" || SES.qa)));
      const it = await ev(() => SES && SES.q.length ? ITEMS[SES.q[0]] : null); if (!it) break;
      if (it.type === "write") { await write(it.ch); await p.waitForSelector("[data-act=next]"); await p.click("[data-act=next]"); continue; }
      if (it.type === "grammar") { const a = await ev(() => SES.qa[1]); await p.click(`.opt[data-o="${a}"]`); if (i === 0) await shot("04-grammar-card"); await p.click("[data-act=next]"); }
      else { await p.click("[data-act=flip]"); if (i === 0) await shot(`04-${t}-back`); await p.click('[data-act=grade][data-g="3"]'); }
    }
  }
  log("vocab / kanji / grammar lessons + FSRS grading OK");
  const st = await ev(() => Object.values(S.cards).filter(c => c.reps > 0 && c.s > 0 && c.due > today()).length);
  if (st < 10) throw new Error("FSRS scheduled too few cards: " + st);

  // 4. browse
  for (const h of ["#browse/kana", "#browse/vocab/5", "#browse/vocab/1", "#browse/kanji/5", "#browse/kanji/1", "#browse/grammar/4", "#browse/grammar/1", "#kanji/%E6%9B%B8", "#kana/%E3%81%82"]) {
    await go(h); if (!(await p.$("#app .card"))) throw new Error("browse view empty " + h);
  }
  await go("#browse/vocab/5"); await p.fill("#vq", "mizu"); const rows = await p.$$eval("#vlist tr", r => r.length); if (rows < 1) throw new Error("romaji search found nothing");
  await p.check("#vall"); await p.fill("#vq", "economy");
  if ((await p.$$eval("#vlist tr", r => r.length)) < 1) throw new Error("all-level search failed");
  await go("#browse/kanji/1"); const n1 = await p.$$eval(".kcell", c => c.length); if (n1 < 1000) throw new Error("N1 kanji grid " + n1);
  await go("#kanji/%E6%9B%B8"); await shot("05-kanji-detail");
  log(`browse OK (N1 kanji grid ${n1})`);

  if (!sawWrite) throw new Error("no writing cards appeared in the kana lesson session");
  log("writing cards: traced + graded inside review sessions OK");
  // 4b. guide + new drills
  await go("#guide"); if ((await p.$$("#app .tbtn")).length < 15) throw new Error("guide list too short");
  await go("#guide/particles"); const gq = await ev(() => GUIDE.find(g => g.id === "particles").check.map(c => c[1]));
  for (let k = 0; k < gq.length; k++) await p.click(`.opt[data-q="${k}"][data-o="${gq[k]}"]`);
  if (!(await ev(() => S.guide.particles && S.guide.particles.best === 3))) throw new Error("guide check not recorded");
  await shot("05b-guide");
  // stage gating: with only a few kana learned, sentence drills are locked and word drills use known kana only
  await go("#drills/sent/read"); if (!(await p.textContent("#app")).includes("unlocks as you learn")) throw new Error("sentence drill should be locked for a beginner");
  const words1 = await ev(() => readableWords().map(i => i.r)); const kana1 = await ev(() => [...knownSets().h]);
  if (!words1.length || !words1.every(w => [...w].every(c => kana1.includes(c) || "ゃゅょっ".includes(c)))) throw new Error("readable words use unknown kana: " + words1.slice(0, 5));
  await go("#drills/listen/sounds"); await p.waitForFunction(() => DR && DR.name === "listen");
  const lopts = await ev(() => DR.opts); if (!lopts.every(o => kana1.includes(o))) throw new Error("listening options use unlearned kana " + lopts);
  await p.click(`.opt[data-o="${await ev(() => DR.ans)}"]`); if (!(await ev(() => DR.ok))) throw new Error("listen sounds");
  await go("#drills/kread/words"); await p.waitForFunction(() => DR && DR.name === "kread");
  const kw = await ev(() => DR.it.r); await p.fill("#din", await ev(w => [...w].map(c => KANA_R[c] || c).join(""), kw)); await p.press("#din", "Enter");
  if (!(await ev(() => DR.ok))) throw new Error("kana word reading judged wrong for " + kw);
  await go("#drills/kread/speed"); await p.click("[data-act=sprint]");
  for (let i = 0; i < 5; i++) { const a = await ev(() => DR.cur.ans[0]); await p.fill("#din", a); await p.waitForTimeout(30); }
  const sprintN = await ev(() => DR.n); if (sprintN < 5) throw new Error("sprint counted " + sprintN);
  await ev(() => { DR.end = Date.now() - 1; }); await p.waitForTimeout(400); if (!(await ev(() => S.drills.sprint && S.drills.sprint.best >= 5))) throw new Error("sprint best not saved");
  await go("#drills/phrases/quiz"); await p.waitForFunction(() => DR && DR.name === "phrases"); await p.click(`.opt[data-o="${(await ev(() => DR.ans)).replace(/"/g, '\\"')}"]`);
  await go("#drills/phrases/list"); await shot("05e-phrases");
  log(`beginner stage OK: sentences locked, ${words1.length} readable words, listening ladder, kana words, sprint (${sprintN}), phrases`);
  // learn all kana + 40 words, then sentence drills unlock
  await ev(() => { [...ORDER.kana[5], ...ORDER.vocab[5].slice(0, 40)].forEach(id => { introduce(id); Object.assign(S.cards[id], { reps: 1, ivl: 2, s: 2, d: 5, lastDay: today(), due: addDays(today(), 2) }); }); save(); KS_KEY = ""; });
  await go("#drills/sent/read"); await p.waitForFunction(() => DR && DR.name === "sent");
  const furi = await ev(() => [...document.querySelectorAll(".sentence ruby")].map(r => ({ cls: r.className, vis: getComputedStyle(r.querySelector("rt")).visibility, k: [...r.childNodes][0].textContent })));
  for (const f of furi) { const known = await ev(c => [...c].every(x => knownSets().kanji.has(x)), f.k); if ((f.cls === "k") !== known || (f.cls === "u" && f.vis !== "visible") || (f.cls === "k" && f.vis !== "hidden")) throw new Error("adaptive furigana wrong: " + JSON.stringify(f)); }
  const rbk = await p.$(".sentence ruby.k"); if (rbk) { await rbk.click(); if (!(await ev(() => !!document.querySelector(".sentence ruby.k.show")))) throw new Error("tap-to-reveal furigana"); }
  await p.keyboard.press(" "); await p.click('[data-act=sgrade][data-g="2"]'); await shot("05c-sentence");
  await go("#drills/write/words"); await p.waitForFunction(() => DR && DR.name === "write");
  const wchars = await ev(() => DR.chars);
  for (const c of wchars) { await write(c); await p.waitForTimeout(500); }
  if (!(await ev(() => DR.done && DR.ok))) throw new Error("word writing drill failed for " + wchars.join(""));
  await shot("05d-write-word");
  const exN = await ev(() => ORDER.vocab[5].filter(id => EXAMPLES[ITEMS[id].w + "|" + ITEMS[id].r]).length);
  if (exN < 400) throw new Error("too few N5 example sentences: " + exN);
  log(`guide, sentence reading (furigana tap), word writing (${wchars.join("")}) OK; N5 words with examples: ${exN}`);

  // 5. drills
  await go("#drills"); await shot("06-drills");
  const next = async () => { await p.click("[data-act=dnext]"); await p.waitForFunction(() => DR && !DR.done); };
  await go("#drills/conj");
  for (let i = 0; i < 6; i++) { const a = await ev(() => DR.ans[0]); await p.fill("#din", i % 3 === 2 ? "zzz" : a); await p.press("#din", "Enter");
    if ((await ev(() => DR.ok)) !== (i % 3 !== 2)) throw new Error("conjugation judged wrongly"); if (i === 0) await shot("07-conj"); await next(); }
  await go("#drills/num/read");
  for (let i = 0; i < 8; i++) { const a = await ev(() => DR.ans[0]); await p.fill("#din", a); await p.press("#din", "Enter"); if (!(await ev(() => DR.ok))) throw new Error("num read"); await next(); }
  await go("#drills/num/listen");
  for (let i = 0; i < 8; i++) { const q = await ev(() => ({ show: DR.show, k: DR.k })); await p.fill("#din", q.k === "date" ? q.show.replace("月", "/").replace("日", "") : q.show); await p.press("#din", "Enter");
    if (!(await ev(() => DR.ok))) throw new Error("listen answer judged wrong: " + JSON.stringify(q)); if (i === 0) await shot("08-num-listen"); await next(); }
  await go("#drills/dict"); await p.waitForFunction(() => DR && DR.name === "dict");
  for (let i = 0; i < 3; i++) { const r = await ev(() => DR.it.r); await p.fill("#din", r); await p.press("#din", "Enter"); if (!(await ev(() => DR.ok))) throw new Error("dictation"); await next(); }
  await go("#drills/order"); await p.waitForFunction(() => DR && DR.name === "order");
  for (let i = 0; i < 4; i++) { const blank = await ev(() => DR.blank); for (const tok of blank) { const k = await ev(t => DR.pool.indexOf(t), tok); if (k < 0) throw new Error("order state " + JSON.stringify(await ev(() => ({ hash: location.hash, name: DR && DR.name, blank: DR && DR.blank, pool: DR && DR.pool, picked: DR && DR.picked })))); await p.click(`[data-act=opick][data-k="${k}"]`); }
    if (!(await ev(() => DR.ok))) throw new Error("order drill correct answer judged wrong"); if (i === 0) await shot("09-order"); await next(); }
  await go("#drills/kana");
  for (let i = 0; i < 8; i++) { const m = await ev(() => DR.mode); if (m === "mc") { const a = await ev(() => DR.ans); await p.click(`.opt[data-o="${a}"]`); if (!(await ev(() => DR.ok))) throw new Error("kana mc"); }
    else { const w = await ev(() => DR.it.w); await p.fill("#din", "xx"); await p.press("#din", "Enter"); } await next(); }
  await go("#drills/read"); await go("#drills/read/0");
  const qs = await ev(() => DR.qs.map(q => q.a)); for (let k = 0; k < qs.length; k++) await p.click(`.opt[data-q="${k}"][data-o="${qs[k]}"]`);
  await p.click("[data-act=ren]"); await shot("10-reading");
  const dr = await ev(() => S.drills); for (const k of ["conj", "num", "dict", "order", "kana", "read", "write", "sent", "listen", "kread", "phrases"]) if (!dr[k] || !dr[k].n) throw new Error("drill not logged " + k);
  log("all 6 drills OK " + JSON.stringify(Object.fromEntries(Object.entries(dr).filter(([k]) => k !== "conjOpt").map(([k, v]) => [k, `${v.ok}/${v.n}`]))));

  // 6. tests
  await go("#test"); await p.click('[data-kind=quick]'); for (let i = 0; i < 15; i++) { await p.click(".opt"); await p.click("[data-act=tnext]"); }
  for (const lv of [5, 4, 3, 2, 1]) {
    await go("#test"); await p.click(`[data-kind=full][data-lv="${lv}"]`);
    const info = await ev(() => ({ n: TEST.qs.length, secs: [...new Set(TEST.qs.map(q => q.sec))], bad: TEST.qs.filter(q => q.ans < 0 || new Set(q.opts).size !== q.opts.length).length }));
    if (info.n < 25 || info.bad) throw new Error(`mock N${lv} malformed ${JSON.stringify(info)}`);
    if (lv === 5) await shot("11-mock-q");
    for (let i = 0; i < info.n; i++) await p.keyboard.press("1");
    if (lv === 5) { await shot("12-mock-result"); const btn = await p.$("[data-act=requeue]"); if (btn) await btn.click(); }
    log(`N${lv} mock: ${info.n} questions, sections ${info.secs.join(" ")}`);
  }
  await go("#test"); await p.click('[data-kind=kana]'); if ((await ev(() => TEST.qs.length)) !== 40) throw new Error("kana test size");
  await go("#test"); await p.fill("[name=v1]", "20"); await p.fill("[name=v2]", "33"); await p.click("#offForm button");

  // 7. stats, plan, level switch, gaps
  await go("#stats"); await shot("13-stats");
  await go("#plan"); await shot("14-plan");
  await p.click('[data-act=setLevel][data-lv="4"]'); await p.waitForTimeout(100);
  const lvNow = await ev(() => ({ lv: S.settings.level, start: S.settings.start, exam: S.settings.exam }));
  if (lvNow.lv !== 4) throw new Error("level switch failed");
  await go("#today"); await shot("15-today-n4");
  const gapRow = await p.$('a[href="#gaps"]'); if (!gapRow) throw new Error("foundation gaps row missing");
  await go("#gaps"); await p.click('[data-act=learn][data-type=vocab][data-gap="1"]'); const lessonLv = await ev(() => ITEMS[LESSON[0]].lv); if (lessonLv !== 5) throw new Error("gap lesson should be N5");
  await go("#today"); await p.click('[data-act=learn][data-type=grammar]').catch(() => p.click('[data-act=learn][data-type=grammar][data-ahead="1"]'));
  const gl = await ev(() => LESSON.length && ITEMS[LESSON[0]].lv); if (gl !== 4) throw new Error("N4 grammar lesson expected, got " + gl);
  await go("#plan"); await shot("16-plan-n4");
  log(`level switch → N4 OK (start ${lvNow.start}, exam ${lvNow.exam}); gaps + N4 lessons OK`);

  // 8. settings, export/import merge
  await go("#settings"); await p.selectOption("[name=theme]", "dark"); await p.click("#setForm button.btn:not(.ghost)");
  if ((await ev(() => document.documentElement.getAttribute("data-theme"))) !== "dark") throw new Error("theme");
  await shot("17-settings-dark");
  const [dl] = await Promise.all([p.waitForEvent("download"), p.click("[data-act=export]")]);
  const exp = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
  const p2 = await ctx.newPage(); p2.on("dialog", d => d.accept()); p2.on("pageerror", e => errs.push("p2: " + e.message));
  await p2.goto(URL + "#settings"); await p2.evaluate(() => { localStorage.clear(); });
  const n = await p.evaluate(() => Object.keys(S.cards).length);
  log(`export OK (${Object.keys(exp.cards).length} cards, ${exp.tests.length} tests); in-page cards ${n}`);

  // 9. desktop screenshots
  const d = await b.newPage({ viewport: { width: 1200, height: 900 } }); await d.addInitScript(fakeVoice);
  d.on("pageerror", e => errs.push("desk: " + e.message));
  await d.goto(URL + "#today"); if (SHOTS) await d.screenshot({ path: path.join(SHOTS, "18-desktop.png"), fullPage: true });

  if (errs.length) { console.log("ERRORS:\n" + errs.join("\n")); process.exit(1); }
  console.log("\nE2E: all checks passed, no page errors");
  await b.close();
})().catch(e => { console.log("E2E FAILED:", e.message, errs.length ? "\n" + errs.join("\n") : ""); process.exit(1); });
