/* ==========================================================================
   TO-DO LIST LIFE DASHBOARD — vanilla JS, no dependencies
   Sections: storage keys, clock/greeting, theme toggle, to-do list,
             focus timer, quick links, init.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Storage keys ---------- */
  const KEYS = {
    THEME: "dashboard_theme",
    TASKS: "dashboard_tasks",
    LINKS: "dashboard_links",
    POMODORO_MIN: "dashboard_pomodoro_minutes",
    SORT: "dashboard_sort",
  };

  /* ---------- Small helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.error("Failed to read", key, err);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error("Failed to save", key, err);
    }
  }

  /* ==========================================================================
     CLOCK + GREETING
     ========================================================================== */
  function greetingFor(hour) {
    if (hour < 5) return "good_night";
    if (hour < 12) return "good_morning";
    if (hour < 17) return "good_afternoon";
    if (hour < 21) return "good_evening";
    return "good_night";
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function tickClock() {
    const now = new Date();
    const h = pad(now.getHours());
    const m = pad(now.getMinutes());
    const s = pad(now.getSeconds());
    $("clockOut").textContent = `${h}:${m}:${s}`;
    $("dateOut").textContent = now.toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
    $("greeting").textContent = greetingFor(now.getHours());
  }

  /* ==========================================================================
     THEME TOGGLE
     ========================================================================== */
  function initTheme() {
    const saved = localStorage.getItem(KEYS.THEME) || "dark";
    applyTheme(saved);

    $("themeToggle").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(KEYS.THEME, next);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = $("themeToggle");
    $("themeLabel").textContent = theme.toUpperCase();
    btn.setAttribute("aria-pressed", String(theme === "light"));
    btn.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
  }

  /* ==========================================================================
     TO-DO LIST
     ========================================================================== */
  const Todo = {
    tasks: [],
    sortMode: "created",

    init() {
      this.tasks = readJSON(KEYS.TASKS, []);
      this.sortMode = localStorage.getItem(KEYS.SORT) || "created";
      $("sortSelect").value = this.sortMode;

      $("todoForm").addEventListener("submit", (e) => {
        e.preventDefault();
        this.add($("todoInput").value);
      });

      $("sortSelect").addEventListener("change", (e) => {
        this.sortMode = e.target.value;
        localStorage.setItem(KEYS.SORT, this.sortMode);
        this.render();
      });

      $("clearDoneBtn").addEventListener("click", () => this.clearDone());

      this.render();
    },

    save() { writeJSON(KEYS.TASKS, this.tasks); },

    add(rawText) {
      const text = rawText.trim();
      if (!text) return;
      this.tasks.push({ id: uid(), text, done: false, createdAt: Date.now() });
      this.save();
      $("todoInput").value = "";
      this.render();
    },

    toggleDone(id) {
      const t = this.tasks.find((t) => t.id === id);
      if (!t) return;
      t.done = !t.done;
      this.save();
      this.render();
    },

    remove(id) {
      this.tasks = this.tasks.filter((t) => t.id !== id);
      this.save();
      this.render();
    },

    edit(id, newText) {
      const text = newText.trim();
      if (!text) { this.remove(id); return; }
      const t = this.tasks.find((t) => t.id === id);
      if (t) { t.text = text; this.save(); }
      this.render();
    },

    clearDone() {
      this.tasks = this.tasks.filter((t) => !t.done);
      this.save();
      this.render();
    },

    sorted() {
      const copy = this.tasks.slice();
      switch (this.sortMode) {
        case "alpha":
          return copy.sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()));
        case "status":
          return copy.sort((a, b) => (a.done === b.done ? b.createdAt - a.createdAt : a.done ? 1 : -1));
        case "created":
        default:
          return copy.sort((a, b) => b.createdAt - a.createdAt);
      }
    },

    render() {
      const list = $("todoList");
      list.innerHTML = "";
      const items = this.sorted();

      items.forEach((task) => list.appendChild(this.buildRow(task)));

      const done = this.tasks.filter((t) => t.done).length;
      $("todoCount").textContent = `${done}/${this.tasks.length} done`;
      $("todoEmpty").style.display = this.tasks.length === 0 ? "block" : "none";
    },

    buildRow(task) {
      const li = document.createElement("li");
      li.className = "todo-item" + (task.done ? " is-done" : "");
      li.dataset.id = task.id;

      const checkBtn = document.createElement("button");
      checkBtn.type = "button";
      checkBtn.className = "todo-check";
      checkBtn.setAttribute("aria-label", task.done ? "Mark task as not done" : "Mark task as done");
      checkBtn.textContent = task.done ? "[x]" : "[ ]";
      checkBtn.addEventListener("click", () => this.toggleDone(task.id));

      const textSpan = document.createElement("span");
      textSpan.className = "todo-text";
      textSpan.textContent = task.text;
      textSpan.title = "Double-click to edit";
      textSpan.addEventListener("dblclick", () => this.startEdit(li, task));

      const actions = document.createElement("span");
      actions.className = "todo-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "icon-btn";
      editBtn.setAttribute("aria-label", "Edit task");
      editBtn.textContent = "\u270E"; // pencil
      editBtn.addEventListener("click", () => this.startEdit(li, task));

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "icon-btn danger";
      delBtn.setAttribute("aria-label", "Delete task");
      delBtn.textContent = "\u00D7"; // times
      delBtn.addEventListener("click", () => this.remove(task.id));

      actions.append(editBtn, delBtn);
      li.append(checkBtn, textSpan, actions);
      return li;
    },

    startEdit(li, task) {
      const textSpan = li.querySelector(".todo-text");
      if (!textSpan) return;

      const input = document.createElement("input");
      input.type = "text";
      input.className = "todo-edit-input";
      input.value = task.text;
      input.maxLength = 140;
      textSpan.replaceWith(input);
      input.focus();
      input.select();

      let settled = false;
      const commit = () => {
        if (settled) return;
        settled = true;
        this.edit(task.id, input.value);
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); commit(); }
        if (e.key === "Escape") { e.preventDefault(); settled = true; this.render(); }
      });
      input.addEventListener("blur", commit);
    },
  };

  /* ==========================================================================
     FOCUS TIMER (pomodoro)
     ========================================================================== */
  const Timer = {
    minutes: 25,
    remaining: 25 * 60,
    intervalId: null,
    running: false,
    audioCtx: null,

    init() {
      this.minutes = Number(localStorage.getItem(KEYS.POMODORO_MIN)) || 25;
      this.remaining = this.minutes * 60;
      const isPreset = [15, 25, 45].includes(this.minutes);
      this.syncPresetButtons(!isPreset);
      this.updateDisplay();

      $("startBtn").addEventListener("click", () => this.start());
      $("stopBtn").addEventListener("click", () => this.stop());
      $("resetBtn").addEventListener("click", () => this.reset());

      document.querySelectorAll(".preset-btn").forEach((btn) => {
        btn.addEventListener("click", () => this.setMinutes(Number(btn.dataset.min)));
      });

      const customInput = $("customMin");
      const applyCustom = () => {
        const val = Math.round(Number(customInput.value));
        if (val >= 1 && val <= 180) this.setMinutes(val, true);
      };
      customInput.addEventListener("keydown", (e) => { if (e.key === "Enter") applyCustom(); });
      customInput.addEventListener("blur", applyCustom);
    },

    setMinutes(min, fromCustom) {
      this.stop();
      this.minutes = min;
      this.remaining = min * 60;
      localStorage.setItem(KEYS.POMODORO_MIN, String(min));
      this.syncPresetButtons(fromCustom);
      this.updateDisplay();
      $("timerState").textContent = "idle";
    },

    syncPresetButtons(fromCustom) {
      document.querySelectorAll(".preset-btn").forEach((btn) => {
        btn.classList.toggle("is-active", !fromCustom && Number(btn.dataset.min) === this.minutes);
      });
      $("customMin").value = fromCustom ? this.minutes : "";
    },

    start() {
      if (this.running) return;
      if (this.remaining <= 0) this.remaining = this.minutes * 60;
      this.running = true;
      $("startBtn").disabled = true;
      $("stopBtn").disabled = false;
      $("timerState").textContent = "running";
      $("timerDisplay").classList.remove("is-done");

      this.intervalId = setInterval(() => {
        this.remaining--;
        this.updateDisplay();
        if (this.remaining <= 0) this.complete();
      }, 1000);
    },

    stop() {
      clearInterval(this.intervalId);
      this.running = false;
      $("startBtn").disabled = false;
      $("stopBtn").disabled = true;
      if ($("timerState").textContent === "running") $("timerState").textContent = "paused";
    },

    reset() {
      this.stop();
      this.remaining = this.minutes * 60;
      $("timerDisplay").classList.remove("is-done", "is-warning");
      $("timerState").textContent = "idle";
      this.updateDisplay();
    },

    complete() {
      this.stop();
      this.remaining = 0;
      $("timerState").textContent = "done";
      $("timerDisplay").classList.add("is-done");
      this.updateDisplay();
      this.beep();
    },

    updateDisplay() {
      const safeRemaining = Math.max(this.remaining, 0);
      const m = Math.floor(safeRemaining / 60);
      const s = safeRemaining % 60;
      $("timerDisplay").textContent = `${pad(m)}:${pad(s)}`;
      $("timerDisplay").classList.toggle("is-warning", safeRemaining > 0 && safeRemaining <= 60);
    },

    beep() {
      try {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = this.audioCtx;
        [0, 0.28, 0.56].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.value = 880;
          gain.gain.value = 0.06;
          osc.connect(gain).connect(ctx.destination);
          const startAt = ctx.currentTime + delay;
          osc.start(startAt);
          osc.stop(startAt + 0.16);
        });
      } catch (err) {
        console.error("Beep unavailable:", err);
      }
    },
  };

  /* ==========================================================================
     QUICK LINKS
     ========================================================================== */
  const Links = {
    items: [],

    defaults() {
      return [
        { id: uid(), name: "GitHub", url: "https://github.com" },
        { id: uid(), name: "MDN Docs", url: "https://developer.mozilla.org" },
        { id: uid(), name: "YouTube", url: "https://youtube.com" },
        { id: uid(), name: "Gmail", url: "https://mail.google.com" },
      ];
    },

    init() {
      const stored = readJSON(KEYS.LINKS, null);
      this.items = stored && stored.length ? stored : this.defaults();
      this.save();

      $("linkForm").addEventListener("submit", (e) => {
        e.preventDefault();
        this.add($("linkName").value, $("linkUrl").value);
      });

      this.render();
    },

    save() { writeJSON(KEYS.LINKS, this.items); },

    normalizeUrl(raw) {
      const trimmed = raw.trim();
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
    },

    add(rawName, rawUrl) {
      const name = rawName.trim();
      if (!name || !rawUrl.trim()) return;
      const url = this.normalizeUrl(rawUrl);
      this.items.push({ id: uid(), name, url });
      this.save();
      $("linkName").value = "";
      $("linkUrl").value = "";
      this.render();
    },

    remove(id) {
      this.items = this.items.filter((l) => l.id !== id);
      this.save();
      this.render();
    },

    render() {
      const grid = $("linksGrid");
      grid.innerHTML = "";

      if (this.items.length === 0) {
        const empty = document.createElement("p");
        empty.className = "links-empty";
        empty.textContent = "// no links saved yet";
        grid.appendChild(empty);
      } else {
        this.items.forEach((link) => grid.appendChild(this.buildTile(link)));
      }

      $("linksCount").textContent = `${this.items.length} saved`;
    },

    buildTile(link) {
      let hostname = link.url;
      try { hostname = new URL(link.url).hostname; } catch (_) { /* keep raw */ }

      const tile = document.createElement("a");
      tile.className = "link-tile";
      tile.href = link.url;
      tile.target = "_blank";
      tile.rel = "noopener noreferrer";
      tile.title = link.url;

      const favicon = document.createElement("img");
      favicon.className = "link-favicon";
      favicon.src = `https://www.google.com/s2/favicons?sz=32&domain=${hostname}`;
      favicon.alt = "";
      favicon.loading = "lazy";
      favicon.onerror = () => { favicon.style.visibility = "hidden"; };

      const label = document.createElement("span");
      label.textContent = link.name;

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "icon-btn danger";
      delBtn.setAttribute("aria-label", `Remove ${link.name}`);
      delBtn.textContent = "\u00D7";
      delBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.remove(link.id);
      });

      tile.append(favicon, label, delBtn);
      return tile;
    },
  };

  /* ==========================================================================
     INIT
     ========================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    tickClock();
    setInterval(tickClock, 1000);

    Todo.init();
    Timer.init();
    Links.init();
  });
})();
