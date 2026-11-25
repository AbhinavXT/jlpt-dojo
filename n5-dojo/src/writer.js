"use strict";
/* Handwriting: stroke-by-stroke grader against KanjiVG strokes, plus furigana helpers.
   Writer(host, ch, {guide, onDone, onFeedback}) builds a pad inside `host`. Coordinates use KanjiVG's 109×109 box. */

// ---------- furigana ----------
const FURI_RE = /\[([^\]|]+)((?:\|[^\]|]*)+)\]|([^[]+)/g;
function ruby(fu) {
  return String(fu).replace(FURI_RE, (m, s, rs, plain) => {
    if (plain) return esc(plain);
    const r = rs.split("|").slice(1), cs = [...s];
    if (r.length === cs.length && r.every(Boolean)) return cs.map((c, i) => `<ruby>${esc(c)}<rt>${esc(r[i])}</rt></ruby>`).join("");
    const j = r.join(""); return j ? `<ruby>${esc(s)}<rt>${esc(j)}</rt></ruby>` : esc(s);
  });
}
const plainJa = fu => String(fu).replace(/\[([^\]|]+)(?:\|[^\]]*)?\]/g, "$1");
const readingOf = fu => String(fu).replace(/\[([^\]|]+)((?:\|[^\]|]*)+)\]/g, (m, s, rs) => rs.split("|").slice(1).join("") || s);

// ---------- geometry ----------
const WGEO = (() => {
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const length = pts => pts.reduce((s, p, i) => (i ? s + dist(pts[i - 1], p) : 0), 0);
  function resample(pts, n = 24) {
    if (pts.length < 2) return Array.from({ length: n }, () => pts[0] || [0, 0]);
    const L = length(pts), step = L / (n - 1), out = [pts[0]]; let acc = 0, prev = pts[0];
    for (let i = 1; i < pts.length && out.length < n; i++) {
      let cur = pts[i], d = dist(prev, cur);
      while (acc + d >= step && out.length < n) {
        const t = (step - acc) / d; const q = [prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])];
        out.push(q); prev = q; d = dist(prev, cur); acc = 0;
      }
      acc += d; prev = cur;
    }
    while (out.length < n) out.push(pts[pts.length - 1]);
    return out;
  }
  const avg = (a, b) => a.reduce((s, p, i) => s + dist(p, b[i]), 0) / a.length;
  /** Compare a user stroke with an expected stroke (both resampled). */
  function compare(user, exp, expLen) {
    const thr = Math.min(24, Math.max(13, 0.25 * expLen + 9));
    const fwd = avg(user, exp), rev = avg(user, exp.slice().reverse());
    const uLen = length(user), ratio = expLen > 8 ? uLen / expLen : 1;
    const okShape = fwd < thr && ratio > 0.4 && ratio < 2.2;
    const startOk = dist(user[0], exp[0]) < thr * 1.6, endOk = dist(user[user.length - 1], exp[exp.length - 1]) < thr * 1.6;
    if (okShape && startOk && endOk) return { ok: true, score: fwd / thr };
    if (rev < thr && ratio > 0.4 && ratio < 2.2) return { ok: false, why: "dir", score: rev / thr };
    return { ok: false, why: "shape", score: fwd / thr };
  }
  return { dist, length, resample, compare };
})();

// sampled expected strokes, cached per character
const STROKE_CACHE = {};
function strokeSamples(ch) {
  if (STROKE_CACHE[ch]) return STROKE_CACHE[ch];
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg"); svg.setAttribute("viewBox", "0 0 109 109");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden"; document.body.appendChild(svg);
  const out = (STROKES[ch] || []).map(d => {
    const p = document.createElementNS(ns, "path"); p.setAttribute("d", d); svg.appendChild(p);
    const L = p.getTotalLength(), pts = [];
    for (let i = 0; i < 24; i++) { const q = p.getPointAtLength((L * i) / 23); pts.push([q.x, q.y]); }
    return { pts, len: L, d };
  });
  svg.remove(); return (STROKE_CACHE[ch] = out);
}

class Writer {
  constructor(host, ch, opts = {}) {
    this.ch = ch; this.opts = opts; this.exp = strokeSamples(ch); this.i = 0; this.misses = 0; this.missI = 0; this.hinted = false; this.done = false;
    host.innerHTML = `<div class="wpad"><svg class="wl outline ${opts.guide ? "" : "hide"}" viewBox="0 0 109 109">${this.exp.map(s => `<path d="${s.d}"/>`).join("")}</svg>
      <svg class="wl ink" viewBox="0 0 109 109"></svg><svg class="wl hint" viewBox="0 0 109 109"></svg><canvas width="436" height="436"></canvas>
      <div class="wcross"></div></div><div class="wmsg small" aria-live="polite"></div>`;
    this.cv = host.querySelector("canvas"); this.ctx = this.cv.getContext("2d"); this.ink = host.querySelector(".ink"); this.hintL = host.querySelector(".hint");
    this.outline = host.querySelector(".outline"); this.msg = host.querySelector(".wmsg");
    const c = this.ctx; c.lineWidth = 14; c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = getComputedStyle(document.body).color;
    let pts = null;
    const pos = e => { const r = this.cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 109, ((e.clientY - r.top) / r.height) * 109]; };
    const toC = p => [(p[0] / 109) * this.cv.width, (p[1] / 109) * this.cv.height];
    this.cv.addEventListener("pointerdown", e => { if (this.done) return; e.preventDefault(); this.cv.setPointerCapture(e.pointerId); pts = [pos(e)]; c.beginPath(); c.moveTo(...toC(pts[0])); });
    this.cv.addEventListener("pointermove", e => { if (!pts) return; e.preventDefault(); const p = pos(e); if (WGEO.dist(p, pts[pts.length - 1]) < 0.6) return; pts.push(p); c.lineTo(...toC(p)); c.stroke(); });
    const end = () => { if (!pts) return; const p = pts; pts = null; this.stroke(p); };
    this.cv.addEventListener("pointerup", end); this.cv.addEventListener("pointercancel", end);
    this.say(opts.guide ? `Trace stroke 1 of ${this.exp.length}` : `Write it from memory: ${this.exp.length} strokes`);
  }
  say(t, cls = "") { this.msg.className = "wmsg small " + cls; this.msg.textContent = t; if (this.opts.onFeedback) this.opts.onFeedback(t, cls); }
  clearInk() { this.ctx.clearRect(0, 0, this.cv.width, this.cv.height); }
  stroke(raw) {
    this.clearInk();
    if (this.done || !this.exp.length) return;
    if (raw.length < 2) raw = [raw[0], [raw[0][0] + 1.5, raw[0][1] + 1.5]];
    const u = WGEO.resample(raw), e = this.exp[this.i];
    const r = WGEO.compare(u, e.pts, e.len);
    if (r.ok) {
      this.ink.insertAdjacentHTML("beforeend", `<path d="${e.d}"/>`); this.hintL.innerHTML = ""; this.i++; this.missI = 0;
      if (this.i >= this.exp.length) return this.finish();
      return this.say(`✓ Stroke ${this.i + 1} of ${this.exp.length}`, "okt");
    }
    this.misses++; this.missI++;
    let why = r.why === "dir" ? "Right shape, wrong direction. Strokes go top→bottom and left→right." : "Not quite. Check the start point and shape.";
    if (r.why !== "dir") for (let j = this.i + 1; j < this.exp.length; j++) {
      if (WGEO.compare(u, this.exp[j].pts, this.exp[j].len).ok) { why = `Stroke order: that's stroke ${j + 1}. Write stroke ${this.i + 1} first.`; break; }
    }
    this.say(`✗ ${why}`, "badt"); this.flash();
    if (this.missI >= 2) this.hint();
  }
  flash() { const el = this.cv.parentElement; el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
  hint() {
    this.hinted = true; const e = this.exp[this.i]; this.hintL.innerHTML = `<path d="${e.d}"/>`;
    const p = this.hintL.querySelector("path"), L = p.getTotalLength();
    p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.getBoundingClientRect();
    p.style.transition = `stroke-dashoffset ${Math.max(0.35, L / 90)}s linear`; p.style.strokeDashoffset = 0;
  }
  showAll() { this.outline.classList.remove("hide"); this.hinted = true; }
  finish() {
    this.done = true;
    const grade = this.hinted ? 1 : this.misses === 0 ? 3 : 2;
    this.say(this.misses === 0 ? "✓ Perfect: every stroke in order" : `✓ Done with ${this.misses} miss${this.misses > 1 ? "es" : ""}${this.hinted ? " (hint used)" : ""}`, this.misses ? "midt" : "okt");
    if (this.opts.onDone) this.opts.onDone({ grade, misses: this.misses, hinted: this.hinted });
  }
}
if (typeof module !== "undefined") module.exports = { WGEO, ruby, plainJa, readingOf };
