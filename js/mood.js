/* mood.js – mood check-ins with history and a weekly breakdown. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const MOODS = [
    { id: 'happy', emoji: '😊', label: 'Happy', msg: 'Lovely to hear. Notice what helped today and do more of it.' },
    { id: 'calm', emoji: '😌', label: 'Calm', msg: 'Calm is a strong place to be. Protect it with good sleep and routine.' },
    { id: 'stressed', emoji: '😣', label: 'Stressed', msg: 'Stress is a common trigger. Try a few minutes of slow breathing and take one task at a time.' },
    { id: 'sad', emoji: '😔', label: 'Sad', msg: 'It’s okay to feel low. Be gentle with yourself, and consider reaching out to someone you trust.' },
    { id: 'angry', emoji: '😠', label: 'Angry', msg: 'Anger passes. Step away, breathe slowly, and move your body if you can.' },
    { id: 'anxious', emoji: '😰', label: 'Anxious', msg: 'Anxiety is uncomfortable but not dangerous. Try grounding: name 5 things you can see right now.' }
  ];
  const HEAVY = ['sad', 'stressed', 'angry', 'anxious'];
  const byId = Object.fromEntries(MOODS.map((m) => [m.id, m]));
  let selected = null;

  function select(id) {
    selected = id;
    document.querySelectorAll('.mood-opt').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
    $('saveMoodBtn').disabled = !id;
  }

  function render() {
    const u = App.user();
    const recent = u.moods.slice(-10).reverse();
    const ul = $('moodHistory');
    ul.innerHTML = recent.length ? '' : '<li class="empty"><b>No entries yet</b>Your check-ins will appear here.</li>';
    recent.forEach((m) => {
      const info = byId[m.mood] || { emoji: '🙂', label: m.mood };
      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `<span style="font-size:26px">${info.emoji}</span><div class="grow"><div class="title">${App.esc(info.label)}</div>
        ${m.note ? `<div class="muted small">${App.esc(m.note)}</div>` : ''}</div><span class="muted small">${App.fmtDate(m.ts)}</span>`;
      ul.appendChild(li);
    });

    const keys = App.lastDays(7).map((d) => App.dateKey(d));
    const week = u.moods.filter((m) => keys.includes(App.dateKey(new Date(m.ts))));
    const max = Math.max(1, ...MOODS.map((m) => week.filter((w) => w.mood === m.id).length));
    $('moodBars').innerHTML = week.length ? MOODS.map((m) => {
      const n = week.filter((w) => w.mood === m.id).length;
      return `<div class="bar-row"><span>${m.emoji} ${m.label}</span><div class="progress"><i style="width:${(n / max) * 100}%"></i></div><b>${n}</b></div>`;
    }).join('') : '<div class="empty"><b>Nothing logged this week</b>Check in to see your pattern.</div>';

    const last3 = u.moods.slice(-3);
    $('supportCard').classList.toggle('hidden', !(last3.length === 3 && last3.every((m) => HEAVY.includes(m.mood))));
  }

  App.boot(() => {
    $('moodGrid').innerHTML = MOODS.map((m) => `<button class="mood-opt" type="button" data-id="${m.id}" aria-pressed="false"><span class="emoji" aria-hidden="true">${m.emoji}</span><span class="lbl">${m.label}</span></button>`).join('');
    $('moodGrid').addEventListener('click', (e) => { const b = e.target.closest('.mood-opt'); if (b) select(b.dataset.id); });
    $('saveMoodBtn').addEventListener('click', () => {
      if (!selected) return;
      const u = App.user();
      u.moods.push({ mood: selected, note: $('moodNote').value.trim(), ts: new Date().toISOString() });
      const gained = App.award(u, 2, 'Logged your mood', 'mood:' + App.dateKey());
      App.save(u);
      const box = $('moodMessage');
      box.textContent = byId[selected].msg + (gained ? ' (+2 points)' : '');
      box.classList.remove('hidden');
      $('moodNote').value = '';
      select(null);
      render();
    });
    render();
  });
})();
