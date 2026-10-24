/* emergency.js – helplines, personal contacts and "my reasons" (stored on this device only). */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  function renderContacts() {
    const u = App.user();
    const ul = $('contactList');
    if (!u.contacts.length) { ul.innerHTML = '<li class="empty"><b>No contacts yet</b>Add someone you can call when things get hard.</li>'; return; }
    ul.innerHTML = '';
    u.contacts.forEach((c, i) => {
      const li = document.createElement('li');
      li.className = 'list-item';
      const tel = String(c.phone).replace(/[^\d+]/g, '');
      li.innerHTML = `<div class="avatar">${App.esc(c.name.charAt(0).toUpperCase())}</div>
        <div class="grow"><div class="title">${App.esc(c.name)}</div><div class="muted small">${App.esc(c.phone)}</div></div>
        <a class="btn btn-sm" href="tel:${App.esc(tel)}">Call</a>
        <button class="icon-btn" type="button" aria-label="Remove ${App.esc(c.name)}">${App.icon('trash')}</button>`;
      li.querySelector('.icon-btn').addEventListener('click', () => {
        const fresh = App.user();
        fresh.contacts.splice(i, 1);
        App.save(fresh); renderContacts();
      });
      ul.appendChild(li);
    });
  }

  App.boot((u) => {
    $('reasons').value = u.reasons;
    renderContacts();
    $('contactForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('cName').value.trim(), phone = $('cPhone').value.trim();
      if (!name || !/^[+\d][\d\s()-]{5,}$/.test(phone)) return App.toast('Enter a name and a valid phone number', 'error');
      const fresh = App.user();
      fresh.contacts.push({ name, phone });
      App.save(fresh); renderContacts();
      e.target.reset();
      App.toast('Contact saved');
    });
    $('saveReasons').addEventListener('click', () => {
      const fresh = App.user();
      fresh.reasons = $('reasons').value.trim();
      App.save(fresh);
      App.toast('Saved');
    });
    $('breatheBtn').addEventListener('click', Ex.openBreathing);
  });
})();
