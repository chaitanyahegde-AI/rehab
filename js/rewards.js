/* rewards.js – points, level progress, badges and activity log. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  App.boot((u) => {
    const lvl = App.level(u.points);
    $('pts').textContent = u.points;
    $('lvlName').textContent = `Level ${lvl.index} · ${lvl.name}`;
    $('lvlText').textContent = lvl.next ? `${lvl.toNext} points to ${lvl.next}` : 'Top level reached. You’re a Master.';
    $('lvlFill').style.width = lvl.pct + '%';
    $('lvlBar').setAttribute('aria-valuenow', lvl.pct);

    const badges = App.badges(u);
    $('badgeCount').textContent = `${badges.filter((b) => b.earned).length} / ${badges.length} earned`;
    $('badgeGrid').innerHTML = badges.map((b) => `<div class="medal ${b.earned ? 'earned' : ''}">
      <div class="disc">${App.icon(b.icon)}</div><b>${App.esc(b.name)}</b><span>${App.esc(b.desc)}</span></div>`).join('');

    $('ledger').innerHTML = u.ledger.length
      ? u.ledger.slice(0, 12).map((e) => `<div class="ledger-row"><span>${App.esc(e.reason)}<br><span class="muted small">${App.fmtDate(e.ts)}</span></span>
          <span class="pts ${e.pts < 0 ? 'neg' : ''}">${e.pts > 0 ? '+' : ''}${e.pts}</span></div>`).join('')
      : '<div class="empty"><b>No activity yet</b>Resist a craving or complete a habit to earn your first points.</div>';
  });
})();
