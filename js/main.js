/* main.js – shared core for every page.
   Handles storage, session, streak/points logic, navigation shell, modals and toasts. */
(function () {
  'use strict';

  const DAY = 86400000;
  const SESSION_KEY = 'sessionUser';
  const BRAND = 'Renew';
  const TAGLINE = 'Recovery companion';

  const App = (window.App = {});

  // How many uses per day each frequency roughly represents (used for the "money saved" estimate).
  App.FREQUENCIES = {
    'multiple-daily': { label: 'Several times a day', perDay: 3 },
    daily: { label: 'Daily', perDay: 1 },
    'few-weekly': { label: 'A few times a week', perDay: 0.5 },
    weekly: { label: 'About once a week', perDay: 0.15 },
    occasionally: { label: 'Occasionally', perDay: 0.05 }
  };

  /* ---------- Small utilities ---------- */
  App.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Local calendar day (the old code used UTC which shifted days for users in India).
  App.dateKey = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  App.lastDays = (n) => Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
  App.uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  App.fmtDate = (iso, opts) =>
    new Date(iso).toLocaleString(undefined, opts || { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  App.icon = (name) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    habits: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    mood: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>',
    rewards: '<circle cx="12" cy="8" r="7"/><polyline points="8.2 13.9 7 23 12 20 17 23 15.8 13.9"/>',
    emergency: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    sprout: '<path d="M12 22V12"/><path d="M12 12C12 7 8 4 3 4c0 5 3 8 9 8z"/><path d="M12 14c0-4 3-7 9-7 0 5-3 8-9 8z"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    wind: '<path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    star: '<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'
  };

  /* ---------- Storage ---------- */
  App.read = (key) => {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  };
  App.write = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  };

  // Fills in defaults and migrates records created by the earlier version of the app.
  App.normalize = (raw) => {
    const u = Object.assign({}, raw);
    u.username = u.username || u.name || 'friend';
    u.createdAt = u.createdAt || new Date().toISOString();
    u.streakStart = u.streakStart || u.createdAt;
    u.bestStreak = u.bestStreak || 0;
    u.points = Number.isFinite(u.points) ? u.points : Number(u.rewards) || 0;
    u.costPerUse = Number.isFinite(u.costPerUse) ? u.costPerUse : Number(u.payPerUse) || 0;
    u.frequency = App.FREQUENCIES[u.frequency] ? u.frequency : 'daily';
    u.addiction = u.addiction || 'Other';
    u.ledger = Array.isArray(u.ledger) ? u.ledger : [];
    u.events = Array.isArray(u.events) ? u.events : [];
    u.habits = Array.isArray(u.habits) ? u.habits.filter((h) => h && h.id && h.name) : [];
    u.moods = Array.isArray(u.moods) ? u.moods : (Array.isArray(u.moodLog) ? u.moodLog : []);
    u.contacts = Array.isArray(u.contacts) ? u.contacts : [];
    u.reasons = u.reasons || '';
    return u;
  };

  App.findUser = (name) => {
    if (!name) return null;
    const raw = App.read('user_' + name.toLowerCase()) || App.read('user_' + name);
    return raw ? App.normalize(raw) : null;
  };
  App.sessionName = () => localStorage.getItem(SESSION_KEY);
  App.user = () => App.findUser(App.sessionName());
  App.save = (u) => {
    const clean = Object.assign({}, u);
    delete clean.rewards; delete clean.payPerUse; delete clean.moodLog; delete clean.habitsLog; delete clean.password;
    return App.write('user_' + u.username.toLowerCase(), clean);
  };
  App.setSession = (name) => localStorage.setItem(SESSION_KEY, name);
  App.logout = () => { localStorage.removeItem(SESSION_KEY); location.href = 'index.html'; };

  /* ---------- Password hashing (client-side demo auth) ---------- */
  App.hash = async (pass, salt, forceFallback) => {
    const data = new TextEncoder().encode(salt + ':' + pass);
    if (!forceFallback && window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57; // cyrb53 fallback for non-secure contexts
    for (const ch of data) { h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 'f' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  };
  App.verifyPassword = async (u, pass) => {
    if (u.passHash) return (await App.hash(pass, u.salt, u.passHash.startsWith('f'))) === u.passHash;
    return u.password === pass; // legacy plain-text record; upgraded by the caller on success
  };

  /* ---------- Streak, money, points ---------- */
  App.streak = (u) => {
    const ms = Math.max(0, Date.now() - new Date(u.streakStart).getTime());
    const days = Math.floor(ms / DAY);
    return { days, hours: Math.floor((ms % DAY) / 3600000), best: Math.max(u.bestStreak || 0, days) };
  };
  App.moneySaved = (u) => {
    const perDay = (App.FREQUENCIES[u.frequency] || App.FREQUENCIES.daily).perDay;
    const { days } = App.streak(u);
    return Math.round(days * perDay * (u.costPerUse || 0));
  };
  App.formatMoney = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  App.award = (u, pts, reason, key) => {
    if (key && u.ledger.some((e) => e.key === key)) return false;
    u.points = Math.max(0, (u.points || 0) + pts);
    u.ledger = [{ ts: new Date().toISOString(), pts, reason, key: key || null }].concat(u.ledger).slice(0, 300);
    return true;
  };
  App.revoke = (u, key) => {
    const i = u.ledger.findIndex((e) => e.key === key);
    if (i === -1) return;
    u.points = Math.max(0, u.points - u.ledger[i].pts);
    u.ledger.splice(i, 1);
  };

  const LEVELS = [
    { name: 'Starter', at: 0 }, { name: 'Committed', at: 25 }, { name: 'Steady', at: 75 },
    { name: 'Resilient', at: 150 }, { name: 'Strong', at: 300 }, { name: 'Champion', at: 600 }, { name: 'Master', at: 1000 }
  ];
  App.level = (points) => {
    let i = 0;
    LEVELS.forEach((l, idx) => { if (points >= l.at) i = idx; });
    const cur = LEVELS[i], next = LEVELS[i + 1];
    return {
      name: cur.name, index: i + 1, next: next ? next.name : null,
      toNext: next ? next.at - points : 0,
      pct: next ? Math.round(((points - cur.at) / (next.at - cur.at)) * 100) : 100
    };
  };

  App.MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365];
  App.nextMilestone = (days) => App.MILESTONES.find((m) => m > days) || null;

  App.countEvents = (u, type) => u.events.filter((e) => e.type === type).length;
  App.habitChecks = (u) => u.habits.reduce((n, h) => n + Object.keys(h.done || {}).length, 0);

  App.badges = (u) => {
    const best = App.streak(u).best;
    const resisted = App.countEvents(u, 'resisted');
    const checks = App.habitChecks(u);
    const list = App.MILESTONES.map((d) => ({
      id: 'streak' + d, icon: 'flame', name: d === 1 ? 'First day' : d + '-day streak',
      desc: d === 1 ? 'Completed your first full day' : `${d} days in a row`, earned: best >= d
    }));
    return list.concat([
      { id: 'resist5', icon: 'target', name: 'Craving crusher', desc: 'Resist 5 cravings', earned: resisted >= 5 },
      { id: 'habit10', icon: 'habits', name: 'Habit builder', desc: 'Complete 10 habit check-ins', earned: checks >= 10 },
      { id: 'mood7', icon: 'mood', name: 'Self-aware', desc: 'Log 7 moods', earned: u.moods.length >= 7 }
    ]);
  };

  /* ---------- Toasts ---------- */
  App.toast = (msg, type) => {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' error' : '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 3600);
  };

  /* ---------- Modal ---------- */
  App.modal = ({ title, content }) => {
    const prev = document.activeElement;
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-label="${App.esc(title)}">
      <button class="modal-x" type="button" aria-label="Close">&times;</button>
      <h2>${App.esc(title)}</h2><div class="modal-body"></div></div>`;
    const body = back.querySelector('.modal-body');
    if (typeof content === 'string') body.innerHTML = content; else if (content) body.appendChild(content);
    const api = { el: body, onClose: null };
    const onKey = (e) => { if (e.key === 'Escape') api.close(); };
    api.close = () => {
      if (!back.isConnected) return;
      document.removeEventListener('keydown', onKey);
      back.remove();
      if (api.onClose) api.onClose();
      if (prev && prev.focus) prev.focus();
    };
    back.addEventListener('mousedown', (e) => { if (e.target === back) api.close(); });
    back.querySelector('.modal-x').addEventListener('click', api.close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(back);
    const first = back.querySelector('button.btn, a.option, button.option, input, textarea');
    (first || back.querySelector('.modal-x')).focus();
    return api;
  };

  App.confirm = ({ title, message, confirmText = 'Confirm', danger = false }) =>
    new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `<p class="muted">${App.esc(message)}</p>
        <div class="modal-actions"><button class="btn btn-secondary" data-r="0" type="button">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : ''}" data-r="1" type="button">${App.esc(confirmText)}</button></div>`;
      let result = false;
      const m = App.modal({ title, content: wrap });
      m.onClose = () => resolve(result);
      wrap.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { result = b.dataset.r === '1'; m.close(); }));
    });

  /* ---------- Shell (sidebar + mobile bar) ---------- */
  const NAV = [
    ['dashboard', 'Dashboard', 'dashboard.html'],
    ['habits', 'Habits', 'habits.html'],
    ['mood', 'Mood', 'mood.html'],
    ['chat', 'AI Companion', 'chat.html'],
    ['rewards', 'Rewards', 'rewards.html'],
    ['emergency', 'Emergency', 'emergency.html']
  ];

  App.mountShell = (page, u) => {
    const side = document.getElementById('sidebar');
    if (!side) return;
    const links = NAV.map(([id, label, href]) =>
      `<a href="${href}" class="${id === 'emergency' ? 'nav-danger' : ''}" ${id === page ? 'aria-current="page"' : ''}>${App.icon(id)}<span>${label}</span></a>`
    ).join('');
    const brandHtml = `<a class="brand" href="dashboard.html"><span class="brand-mark">${App.icon('sprout')}</span>
      <span class="brand-name">${BRAND}<small>${TAGLINE}</small></span></a>`;
    const lvl = App.level(u.points);
    side.innerHTML = `${brandHtml}<nav class="nav" aria-label="Main">${links}</nav>
      <div class="user-chip"><div class="avatar">${App.esc(u.username.charAt(0).toUpperCase())}</div>
      <div class="who"><b>${App.esc(u.username)}</b><span>Level ${lvl.index} · ${lvl.name}</span></div>
      <button class="icon-btn" id="logoutBtn" type="button" aria-label="Log out" title="Log out">${App.icon('logout')}</button></div>`;
    const app = side.parentElement;
    const top = document.createElement('header');
    top.className = 'mobile-top';
    top.innerHTML = `${brandHtml}<button class="icon-btn" id="logoutBtnMobile" type="button" aria-label="Log out">${App.icon('logout')}</button>`;
    app.insertBefore(top, side);
    ['logoutBtn', 'logoutBtnMobile'].forEach((id) => document.getElementById(id).addEventListener('click', App.logout));
  };

  App.greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  // Every page calls App.boot(fn). Pages marked data-auth="public" skip the login guard.
  App.boot = (fn) => {
    const run = () => {
      const page = document.body.dataset.page;
      const u = App.user();
      if (document.body.dataset.auth === 'public') { if (fn) fn(u); return; }
      if (!u) { location.replace('index.html'); return; }
      App.mountShell(page, u);
      if (fn) fn(u);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  };
})();
