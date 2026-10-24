/* dashboard.js – overview: streak, stats, 7-day chart, check-ins and today's habits. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const MOODS = { happy: '😊', calm: '😌', stressed: '😣', sad: '😔', angry: '😠', anxious: '😰' };

  function drawChart(u) {
    const days = App.lastDays(7);
    const keys = days.map((d) => App.dateKey(d));
    const count = (type, k) => u.events.filter((e) => e.type === type && App.dateKey(new Date(e.ts)) === k).length;
    const a = keys.map((k) => count('resisted', k));
    const b = keys.map((k) => count('slip', k));
    const max = Math.max(3, ...a, ...b);
    const W = 560, H = 220, pl = 28, pb = 28, pt = 10, plotH = H - pb - pt, slot = (W - pl) / 7, bw = Math.min(18, slot / 3);
    let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cravings resisted and slips over the last 7 days">`;
    for (let i = 0; i <= max; i++) {
      if (max > 6 && i % 2) continue;
      const y = pt + plotH - (i / max) * plotH;
      svg += `<line class="grid-line" x1="${pl}" x2="${W}" y1="${y}" y2="${y}"/><text x="${pl - 8}" y="${y + 4}" text-anchor="end">${i}</text>`;
    }
    keys.forEach((k, i) => {
      const cx = pl + slot * i + slot / 2;
      const ha = (a[i] / max) * plotH, hb = (b[i] / max) * plotH;
      if (a[i]) svg += `<rect class="bar-a" x="${cx - bw - 2}" y="${pt + plotH - ha}" width="${bw}" height="${ha}" rx="4"><title>${a[i]} resisted</title></rect>`;
      if (b[i]) svg += `<rect class="bar-b" x="${cx + 2}" y="${pt + plotH - hb}" width="${bw}" height="${hb}" rx="4"><title>${b[i]} slips</title></rect>`;
      svg += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${days[i].toLocaleDateString(undefined, { weekday: 'short' })}</text>`;
    });
    $('chartBox').innerHTML = svg + '</svg>';
  }

  function render() {
    const u = App.user();
    if (!u) return;
    const s = App.streak(u);
    const lvl = App.level(u.points);

    $('greeting').textContent = `${App.greeting()}, ${u.username}`;
    $('todayLine').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

    $('streakDays').textContent = s.days;
    $('streakUnit').textContent = s.days === 1 ? 'day' : 'days';
    $('streakHours').textContent = s.days === 0 ? `${s.hours} hour${s.hours === 1 ? '' : 's'} so far. Every hour counts.` : `+ ${s.hours} hour${s.hours === 1 ? '' : 's'}`;
    const next = App.nextMilestone(s.days);
    if (next) {
      const prev = [0].concat(App.MILESTONES).filter((m) => m <= s.days).pop();
      const pct = Math.round(((s.days - prev) / (next - prev)) * 100);
      $('milestoneText').textContent = `${next - s.days} day${next - s.days === 1 ? '' : 's'} to your ${next}-day milestone`;
      $('milestoneFill').style.width = pct + '%';
      $('milestoneBar').setAttribute('aria-valuenow', pct);
    } else {
      $('milestoneText').textContent = 'You’ve passed every milestone. Incredible.';
      $('milestoneFill').style.width = '100%';
    }
    $('bestStreak').textContent = s.best;
    $('moneySaved').textContent = u.costPerUse ? App.formatMoney(App.moneySaved(u)) : '–';
    $('resistedCount').textContent = App.countEvents(u, 'resisted');

    $('pointsVal').textContent = u.points;
    $('levelVal').textContent = `Level ${lvl.index} · ${lvl.name}`;

    const today = App.dateKey();
    const done = u.habits.filter((h) => h.done && h.done[today]).length;
    $('habitsVal').textContent = `${done}/${u.habits.length}`;
    $('habitsSub').textContent = u.habits.length ? (done === u.habits.length ? 'All done. Great work!' : `${u.habits.length - done} left today`) : 'No habits yet';

    const todayMood = u.moods.filter((m) => App.dateKey(new Date(m.ts)) === today).pop();
    $('moodVal').textContent = todayMood ? MOODS[todayMood.mood] || '🙂' : '–';
    $('moodSub').textContent = todayMood ? todayMood.mood.charAt(0).toUpperCase() + todayMood.mood.slice(1) : 'Not logged yet';

    $('focusVal').textContent = u.addiction;
    $('focusSub').textContent = (App.FREQUENCIES[u.frequency] || {}).label || '';

    drawChart(u);
    renderHabits(u, today);
  }

  function renderHabits(u, today) {
    const ul = $('habitList');
    if (!u.habits.length) {
      ul.innerHTML = `<li class="empty"><b>No habits yet</b>Small daily habits make recovery stick. <a href="habits.html">Add your first</a>.</li>`;
      return;
    }
    ul.innerHTML = '';
    u.habits.forEach((h) => {
      const on = !!(h.done && h.done[today]);
      const li = document.createElement('li');
      li.className = 'list-item' + (on ? ' done' : '');
      li.innerHTML = `<button class="check" type="button" aria-pressed="${on}" aria-label="Mark ${App.esc(h.name)} as done">${App.icon('check')}</button>
        <div class="grow"><div class="title">${App.esc(h.name)}</div></div>`;
      li.querySelector('.check').addEventListener('click', () => {
        const fresh = App.user();
        const hh = fresh.habits.find((x) => x.id === h.id);
        if (!hh) return;
        hh.done = hh.done || {};
        const key = `habit:${hh.id}:${today}`;
        if (hh.done[today]) { delete hh.done[today]; App.revoke(fresh, key); }
        else { hh.done[today] = true; App.award(fresh, 1, `Completed “${hh.name}”`, key); }
        App.save(fresh); render();
      });
      ul.appendChild(li);
    });
  }

  function resisted() {
    const u = App.user();
    u.events.push({ type: 'resisted', ts: new Date().toISOString() });
    App.award(u, 5, 'Resisted a craving');
    App.save(u); render();
    App.toast('That took real strength. +5 points');
  }

  async function slip() {
    const u0 = App.user();
    const s = App.streak(u0);
    const ok = await App.confirm({
      title: 'Log a slip?',
      message: `This restarts your streak counter${s.days ? ` (currently ${s.days} day${s.days === 1 ? '' : 's'})` : ''}. Your best streak, points and badges are kept. Being honest with yourself is part of recovery.`,
      confirmText: 'Log slip'
    });
    if (!ok) return;
    const u = App.user();
    u.bestStreak = Math.max(u.bestStreak, App.streak(u).days);
    u.events.push({ type: 'slip', ts: new Date().toISOString() });
    u.streakStart = new Date().toISOString();
    App.save(u); render();
    App.toast('Logged. Today is a fresh start. You’re still here, and that matters.');
  }

  App.boot(() => {
    render();
    $('cravingBtn').addEventListener('click', Ex.openCraving);
    $('resistedBtn').addEventListener('click', resisted);
    $('slipBtn').addEventListener('click', slip);
    document.addEventListener('rehab:changed', render);
    setInterval(render, 60000); // keep hours/streak fresh
  });
})();
