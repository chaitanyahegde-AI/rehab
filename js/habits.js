/* habits.js – daily habit tracker with a 7-day view and per-habit streaks. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const SUGGESTIONS = ['Drink 8 glasses of water', 'Walk for 20 minutes', 'Meditate for 10 minutes', 'Write in a journal', 'Call a friend or family member', 'Sleep before 11 pm', 'Eat a healthy breakfast'];

  function habitStreak(h) {
    let n = 0;
    const d = new Date();
    if (!(h.done && h.done[App.dateKey(d)])) d.setDate(d.getDate() - 1); // today not done yet doesn't break the streak
    while (h.done && h.done[App.dateKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function render() {
    const u = App.user();
    const today = App.dateKey();
    const days = App.lastDays(7);
    const done = u.habits.filter((h) => h.done && h.done[today]).length;
    $('streakBadge').textContent = `Today: ${done}/${u.habits.length}`;
    const ul = $('habitList');
    if (!u.habits.length) {
      ul.innerHTML = `<li class="empty"><b>No habits yet</b>Add one from the panel to get started.</li>`;
      return;
    }
    ul.innerHTML = '';
    u.habits.forEach((h) => {
      const on = !!(h.done && h.done[today]);
      const st = habitStreak(h);
      const li = document.createElement('li');
      li.className = 'list-item' + (on ? ' done' : '');
      li.innerHTML = `<button class="check" type="button" aria-pressed="${on}" aria-label="Mark ${App.esc(h.name)} as done today">${App.icon('check')}</button>
        <div class="grow"><div class="title">${App.esc(h.name)}</div>
          <div class="week" aria-label="Last 7 days">${days.map((d) => `<span class="${h.done && h.done[App.dateKey(d)] ? 'on' : ''}" title="${d.toLocaleDateString()}">${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>`).join('')}</div></div>
        ${st ? `<span class="badge">${App.icon('flame').replace('class="i"', 'class="i" style="width:14px;height:14px"')}${st}d</span>` : ''}
        <button class="icon-btn" type="button" aria-label="Delete ${App.esc(h.name)}">${App.icon('trash')}</button>`;
      li.querySelector('.check').addEventListener('click', () => toggle(h.id));
      li.querySelector('.icon-btn').addEventListener('click', () => remove(h));
      ul.appendChild(li);
    });
  }

  function toggle(id) {
    const u = App.user();
    const h = u.habits.find((x) => x.id === id);
    const today = App.dateKey();
    h.done = h.done || {};
    const key = `habit:${id}:${today}`;
    if (h.done[today]) { delete h.done[today]; App.revoke(u, key); }
    else {
      h.done[today] = true;
      if (App.award(u, 1, `Completed “${h.name}”`, key)) App.toast('+1 point. Nice work');
    }
    App.save(u); render();
  }

  async function remove(h) {
    if (!(await App.confirm({ title: 'Delete habit?', message: `“${h.name}” and its history will be removed.`, confirmText: 'Delete', danger: true }))) return;
    const u = App.user();
    u.habits = u.habits.filter((x) => x.id !== h.id);
    App.save(u); render();
  }

  function add(name) {
    name = name.trim();
    if (!name) return App.toast('Enter a habit name first', 'error');
    const u = App.user();
    if (u.habits.some((h) => h.name.toLowerCase() === name.toLowerCase())) return App.toast('You already track that habit', 'error');
    u.habits.push({ id: App.uid(), name, createdAt: new Date().toISOString(), done: {} });
    App.save(u); render();
    $('habitInput').value = '';
    App.toast('Habit added');
  }

  App.boot(() => {
    render();
    $('habitForm').addEventListener('submit', (e) => { e.preventDefault(); add($('habitInput').value); });
    $('suggestions').innerHTML = SUGGESTIONS.map((s) => `<button class="chip" type="button">${App.esc(s)}</button>`).join('');
    $('suggestions').addEventListener('click', (e) => { if (e.target.classList.contains('chip')) add(e.target.textContent); });
  });
})();
