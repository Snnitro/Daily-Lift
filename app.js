(() => {
  "use strict";

  // ---------- storage ----------
  const KEY = "dailylift.v1";
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === "object") return s;
    } catch (e) {}
    return {};
  }
  const state = Object.assign({ startDate: null, restSeconds: PLAN.defaultRest, log: {} }, load());
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ---------- dates ----------
  const pad = n => String(n).padStart(2, "0");
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromKey = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const daysBetween = (a, b) => Math.round((b - a) / 86400000);
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (!state.startDate) { state.startDate = keyOf(today()); save(); }

  const planFor = d => PLAN.days[d.getDay()] || { rest: true, title: "Rest & Recovery" };
  const isWorkDay = d => !planFor(d).rest;
  const isDone = k => !!(state.log[k] && state.log[k].done);

  function learningInfo(d = today()) {
    const n = daysBetween(fromKey(state.startDate), d);
    const total = PLAN.learningWeeks * 7;
    if (n < 0 || n >= total) return null;
    return { week: Math.floor(n / 7) + 1, of: PLAN.learningWeeks };
  }
  function setsFor(ex, d = today()) {
    if (ex.type === "cardio") return 1;
    if (ex.fixedSets) return ex.sets;
    return learningInfo(d) ? Math.min(ex.sets, PLAN.learningSets) : ex.sets;
  }

  function entry(k) {
    if (!state.log[k]) state.log[k] = { sets: {}, weights: {}, warmup: false, done: false };
    return state.log[k];
  }

  // ---------- streaks & stats ----------
  function currentStreak() {
    let n = 0;
    const start = fromKey(state.startDate);
    let d = today();
    for (let i = 0; i < 400; i++) {
      if (d < start) break;
      const k = keyOf(d);
      if (isWorkDay(d)) {
        if (isDone(k)) n++;
        else if (i !== 0) break; // today not done yet doesn't break it
      }
      d = addDays(d, -1);
    }
    return n;
  }
  function bestStreak() {
    let best = 0, run = 0;
    let d = fromKey(state.startDate);
    const end = today();
    while (d <= end) {
      if (isWorkDay(d)) {
        if (isDone(keyOf(d))) { run++; best = Math.max(best, run); }
        else if (keyOf(d) !== keyOf(end)) run = 0;
      }
      d = addDays(d, 1);
    }
    return best;
  }
  function weekStart(d = today()) { return addDays(d, -((d.getDay() + 6) % 7)); }
  function thisWeekCount() {
    const s = weekStart();
    let done = 0, planned = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(s, i);
      if (isWorkDay(d)) { planned++; if (isDone(keyOf(d))) done++; }
    }
    return { done, planned };
  }
  const totalDone = () => Object.values(state.log).filter(e => e.done).length;

  function weightHistory() {
    const out = {};
    Object.keys(state.log).sort().forEach(k => {
      const w = state.log[k].weights || {};
      Object.keys(w).forEach(name => {
        const v = parseFloat(w[name]);
        if (!isFinite(v) || v <= 0) return;
        const r = out[name] || (out[name] = { best: 0, last: 0, lastDate: "" });
        r.best = Math.max(r.best, v);
        r.last = v; r.lastDate = k;
      });
    });
    return out;
  }
  function lastWeightBefore(name, k) {
    const keys = Object.keys(state.log).filter(x => x < k).sort().reverse();
    for (const x of keys) {
      const v = parseFloat((state.log[x].weights || {})[name]);
      if (isFinite(v) && v > 0) return { v, k: x };
    }
    return null;
  }

  // ---------- helpers ----------
  const app = document.getElementById("app");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CHECK = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>`;
  const shortDate = d => `${DOW[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;

  let tab = "today";
  let calOffset = 0;

  // ---------- TODAY ----------
  function renderToday() {
    const d = today(), k = keyOf(d), p = planFor(d);
    const streak = currentStreak();
    const head = `
      <header class="top">
        <div>
          <div class="eyebrow">${DOW_LONG[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}</div>
          <h1 style="margin-top:6px">${esc(p.title)}</h1>
          ${p.subtitle ? `<div class="muted" style="margin-top:4px">${esc(p.subtitle)}</div>` : ""}
        </div>
        <div class="streak card" style="padding:10px 12px"><b>${streak}</b><span>day streak</span></div>
      </header>`;

    if (p.rest) {
      let next = addDays(d, 1);
      while (!isWorkDay(next)) next = addDays(next, 1);
      const wk = thisWeekCount();
      return head + `
        <div class="stack">
          <div class="card done-hero">
            <div class="big">🌙</div>
            <h2 style="margin-top:12px">Recovery day</h2>
            <p class="muted">Muscles grow while you rest. A walk or some light stretching is a bonus, not a requirement.</p>
            <span class="pill ${wk.done === wk.planned ? "good" : ""}">${wk.done} of ${wk.planned} workouts this week</span>
          </div>
          <div class="card row spread">
            <div><div class="eyebrow">Up next · ${DOW_LONG[next.getDay()]}</div><div style="font-weight:700;margin-top:4px">${esc(planFor(next).title)}</div></div>
          </div>
        </div>`;
    }

    const e = state.log[k] || { sets: {}, weights: {}, warmup: false, done: false };
    if (e.done) {
      return head + `
        <div class="stack">
          <div class="card done-hero">
            <div class="big">🔥</div>
            <h2 style="margin-top:12px">Workout complete</h2>
            <p class="muted">That's ${streak} in a row. Nice work showing up.</p>
            <span class="pill good">${thisWeekCount().done} of ${thisWeekCount().planned} this week</span>
          </div>
          <button class="btn ghost" data-act="undo">Reopen today's workout</button>
        </div>`;
    }

    const li = learningInfo(d);
    let html = head + `<div class="stack">`;
    if (li) html += `<div class="banner"><b>Learning phase · week ${li.week} of ${li.of}.</b> ${PLAN.learningSets} working sets per exercise — focus on form, leave 2–3 reps in reserve.</div>`;

    html += `
      <div class="card row">
        <button class="check ${e.warmup ? "on" : ""}" data-act="warmup" aria-label="Warm-up done">${e.warmup ? CHECK : ""}</button>
        <div><div class="ex-name">Warm-up</div><div class="ex-target">5–10 min, easy pace</div></div>
      </div>`;

    p.exercises.forEach((ex, i) => {
      const n = setsFor(ex, d);
      const doneSets = (e.sets[i] || []);
      const allDone = Array.from({ length: n }, (_, s) => !!doneSets[s]).every(Boolean);
      if (ex.type === "cardio") {
        html += `
          <div class="card ex row ${allDone ? "done" : ""}">
            <button class="check ${allDone ? "on" : ""}" data-act="set" data-ex="${i}" data-set="0" aria-label="Mark ${esc(ex.name)} done">${allDone ? CHECK : ""}</button>
            <div><div class="ex-name">${esc(ex.name)}</div><div class="ex-target">Cardio · ${esc(ex.duration)} · comfortable pace</div></div>
          </div>`;
        return;
      }
      let sets = "";
      for (let s = 0; s < n; s++) {
        const on = !!doneSets[s];
        sets += `<button class="set ${on ? "on" : ""}" data-act="set" data-ex="${i}" data-set="${s}" aria-label="Set ${s + 1}">${on ? CHECK : s + 1}</button>`;
      }
      let weight = "";
      if (ex.type === "lift") {
        const prev = lastWeightBefore(ex.name, k);
        const val = (e.weights || {})[ex.name] || "";
        weight = `
          <div class="weight">
            <span>Weight</span>
            <input type="number" inputmode="decimal" min="0" step="2.5" placeholder="${prev ? prev.v : "lbs"}" value="${esc(val)}" data-weight="${esc(ex.name)}">
            <span>lbs</span>
            ${prev ? `<span class="last">last: ${prev.v}</span>` : ""}
          </div>`;
      }
      html += `
        <div class="card ex ${allDone ? "done" : ""}">
          <div class="ex-head"><div class="ex-name">${esc(ex.name)}</div><div class="ex-target">${n} × ${esc(ex.reps)}</div></div>
          <div class="sets">${sets}</div>
          ${weight}
        </div>`;
    });

    const remaining = setsRemaining(d, e);
    html += `<button class="btn" data-act="finish" style="margin-top:20px">${remaining === 0 ? "Finish workout ✓" : "Finish workout"}</button>`;
    html += `</div>`;
    return html;
  }

  function setsRemaining(d, e) {
    let r = 0;
    planFor(d).exercises.forEach((ex, i) => {
      const n = setsFor(ex, d), got = e.sets[i] || [];
      for (let s = 0; s < n; s++) if (!got[s]) r++;
    });
    return r;
  }

  // ---------- WEEK ----------
  function renderWeek() {
    const s = weekStart(), t = keyOf(today());
    let html = `<header class="top"><div><div class="eyebrow">This week</div><h1 style="margin-top:6px">Weekly plan</h1></div></header><div class="stack">`;
    for (let i = 0; i < 7; i++) {
      const d = addDays(s, i), k = keyOf(d), p = planFor(d);
      const done = isDone(k);
      const status = p.rest ? `<span class="pill">Rest</span>`
        : done ? `<span class="pill good">Done</span>`
        : k < t ? `<span class="pill">Missed</span>`
        : k === t ? `<span class="pill accent">Today</span>` : "";
      const list = p.rest ? "" : `<ul class="ex-list">${p.exercises.map(ex =>
        `<li>${esc(ex.name)} — ${ex.type === "cardio" ? esc(ex.duration) : `${setsFor(ex, d)} × ${esc(ex.reps)}`}</li>`).join("")}</ul>`;
      html += `
        <details class="card ${k === t ? "day today" : ""}" ${k === t && !p.rest ? "open" : ""}>
          <summary class="day">
            <div class="dn">${DOW[d.getDay()]}<small>${d.getDate()}</small></div>
            <div style="flex:1"><div style="font-weight:700">${esc(p.title)}</div>${p.subtitle ? `<div class="muted" style="font-size:14px">${esc(p.subtitle)}</div>` : ""}</div>
            ${status}
          </summary>
          ${list}
        </details>`;
    }
    return html + `</div>`;
  }

  // ---------- PROGRESS ----------
  function renderProgress() {
    const wk = thisWeekCount();
    let html = `<header class="top"><div><div class="eyebrow">Consistency</div><h1 style="margin-top:6px">Progress</h1></div></header>
      <div class="stack">
      <div class="stats">
        <div class="card stat"><b style="color:var(--accent)">${currentStreak()}</b><span>Current streak</span></div>
        <div class="card stat"><b>${wk.done}/${wk.planned}</b><span>This week</span></div>
        <div class="card stat"><b>${totalDone()}</b><span>Total workouts</span></div>
      </div>
      <div class="muted" style="font-size:14px;text-align:center">Best streak: ${bestStreak()} workout${bestStreak() === 1 ? "" : "s"} · rest days never break a streak</div>`;

    // calendar
    const base = today();
    const m = new Date(base.getFullYear(), base.getMonth() + calOffset, 1);
    const first = (m.getDay() + 6) % 7;
    const daysIn = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const tk = keyOf(base), sk = state.startDate;
    let cells = ["M", "T", "W", "T", "F", "S", "S"].map(h => `<div class="h">${h}</div>`).join("");
    for (let i = 0; i < first; i++) cells += `<div class="c empty"></div>`;
    for (let day = 1; day <= daysIn; day++) {
      const d = new Date(m.getFullYear(), m.getMonth(), day), k = keyOf(d);
      let cls = "c";
      if (isDone(k)) cls += " done";
      else if (!isWorkDay(d)) cls += " rest";
      else if (k < tk && k >= sk) cls += " missed";
      if (k === tk) cls += " today";
      cells += `<div class="${cls}">${day}</div>`;
    }
    html += `
      <div class="card">
        <div class="row spread" style="margin-bottom:12px">
          <button class="btn ghost small" data-act="cal" data-d="-1" aria-label="Previous month">‹</button>
          <h2>${MONTHS[m.getMonth()]} ${m.getFullYear()}</h2>
          <button class="btn ghost small" data-act="cal" data-d="1" aria-label="Next month" ${calOffset >= 0 ? "disabled style='opacity:.3'" : ""}>›</button>
        </div>
        <div class="cal">${cells}</div>
      </div>`;

    const hist = weightHistory();
    const names = Object.keys(hist);
    html += `<div class="card"><h2 style="margin-bottom:6px">Lifts</h2>`;
    if (!names.length) html += `<p class="muted" style="margin:6px 0 0">Log a weight during a workout and it'll show up here.</p>`;
    else names.forEach(n => {
      const r = hist[n];
      html += `<div class="pr"><span>${esc(n)}</span><span><b>${r.last}</b> <span class="muted">lbs · best ${r.best}</span></span></div>`;
    });
    html += `</div></div>`;
    return html;
  }

  // ---------- GUIDE ----------
  function renderGuide() {
    const opts = [60, 75, 90, 105, 120].map(s =>
      `<option value="${s}" ${+state.restSeconds === s ? "selected" : ""}>${s} seconds</option>`).join("");
    return `<header class="top"><div><div class="eyebrow">How to train</div><h1 style="margin-top:6px">Guide</h1></div></header>
      <div class="stack">
        <div class="card"><ol class="guide">${PLAN.guidelines.map(g => `<li>${esc(g)}</li>`).join("")}</ol></div>
        <div class="card stack">
          <h2>Settings</h2>
          <label class="field">Rest timer
            <select data-setting="restSeconds">${opts}</select>
          </label>
          <label class="field">Program start date (sets the 2-week learning phase)
            <input type="date" value="${esc(state.startDate)}" data-setting="startDate">
          </label>
          <button class="btn ghost" data-act="reset">Reset all progress</button>
        </div>
        <p class="muted" style="font-size:13px;text-align:center">Progress is saved on this phone only.</p>
      </div>`;
  }

  // ---------- render ----------
  function render() {
    app.innerHTML = tab === "today" ? renderToday()
      : tab === "week" ? renderWeek()
      : tab === "progress" ? renderProgress()
      : renderGuide();
    document.querySelectorAll("nav.tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  }

  // ---------- rest timer ----------
  const timerEl = document.getElementById("timer"), timerT = document.getElementById("timerT");
  let endAt = 0, tick = null;
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; }
  function startTimer(sec) {
    endAt = Date.now() + sec * 1000;
    timerEl.classList.add("show"); document.body.classList.add("timer-on");
    clearInterval(tick);
    tick = setInterval(updateTimer, 250);
    updateTimer();
  }
  function updateTimer() {
    const left = (endAt - Date.now()) / 1000;
    timerT.textContent = fmt(left);
    if (left <= 0) {
      clearInterval(tick);
      timerT.textContent = "Go!";
      try { navigator.vibrate && navigator.vibrate([250, 120, 250]); } catch (e) {}
      setTimeout(stopTimer, 2500);
    }
  }
  function stopTimer() { clearInterval(tick); timerEl.classList.remove("show"); document.body.classList.remove("timer-on"); }
  document.getElementById("timerPlus").onclick = () => { endAt = Math.max(endAt, Date.now()) + 15000; clearInterval(tick); tick = setInterval(updateTimer, 250); updateTimer(); };
  document.getElementById("timerSkip").onclick = stopTimer;

  // ---------- events ----------
  document.querySelector("nav.tabs").addEventListener("click", ev => {
    const b = ev.target.closest("button[data-tab]");
    if (!b) return;
    tab = b.dataset.tab; calOffset = 0;
    render(); window.scrollTo(0, 0);
  });

  app.addEventListener("click", ev => {
    const b = ev.target.closest("[data-act]");
    if (!b) return;
    const d = today(), k = keyOf(d);
    const act = b.dataset.act;

    if (act === "warmup") { const e = entry(k); e.warmup = !e.warmup; save(); render(); }

    else if (act === "set") {
      const e = entry(k), i = +b.dataset.ex, s = +b.dataset.set;
      const arr = e.sets[i] || (e.sets[i] = []);
      arr[s] = !arr[s];
      save();
      const ex = planFor(d).exercises[i];
      if (arr[s] && ex.type !== "cardio" && setsRemaining(d, e) > 0) startTimer(+state.restSeconds || 90);
      if (!arr[s]) stopTimer();
      render();
    }

    else if (act === "finish") {
      const e = entry(k), left = setsRemaining(d, e);
      if (left > 0 && !confirm(`${left} set${left > 1 ? "s" : ""} left unchecked. Finish anyway?`)) return;
      e.done = true; e.title = planFor(d).title; save(); stopTimer();
      try { navigator.vibrate && navigator.vibrate(80); } catch (x) {}
      render(); window.scrollTo(0, 0);
    }

    else if (act === "undo") { entry(k).done = false; save(); render(); }

    else if (act === "cal") { calOffset = Math.min(0, calOffset + +b.dataset.d); render(); }

    else if (act === "reset") {
      if (confirm("Erase all workouts, streaks and weights on this phone?")) {
        state.log = {}; state.startDate = keyOf(today()); save(); render();
      }
    }
  });

  app.addEventListener("input", ev => {
    const t = ev.target;
    if (t.dataset.weight) {
      const e = entry(keyOf(today()));
      e.weights[t.dataset.weight] = t.value;
      save();
    }
  });
  app.addEventListener("change", ev => {
    const t = ev.target, name = t.dataset.setting;
    if (!name) return;
    if (name === "startDate" && !t.value) return;
    state[name] = name === "restSeconds" ? +t.value : t.value;
    save(); render();
  });

  // re-render when she comes back to the app on a new day
  let lastKey = keyOf(today());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && keyOf(today()) !== lastKey) { lastKey = keyOf(today()); render(); }
  });

  render();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
