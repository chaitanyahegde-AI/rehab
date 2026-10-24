/* auth.js – login & signup (accounts live in this browser's localStorage). */
(function () {
  'use strict';

  function setMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text || '';
    el.className = 'form-msg' + (type ? ' ' + type : '');
  }

  function wirePasswordToggles() {
    document.querySelectorAll('.toggle-pass').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.toggle);
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.textContent = show ? 'Hide' : 'Show';
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      });
    });
  }

  async function signup(e) {
    e.preventDefault();
    const username = document.getElementById('suUser').value.trim();
    const pass = document.getElementById('suPass').value;
    const addiction = document.getElementById('addictionSelect').value;
    const frequency = document.getElementById('freq').value;
    const cost = parseFloat(document.getElementById('pay').value);

    if (!/^[A-Za-z0-9._-]{3,24}$/.test(username)) return setMsg('signupMsg', 'Username must be 3–24 characters (letters, numbers, . _ -).', 'error');
    if (pass.length < 6) return setMsg('signupMsg', 'Password must be at least 6 characters.', 'error');
    if (!addiction) return setMsg('signupMsg', 'Please choose what you are working on.', 'error');
    if (App.findUser(username)) return setMsg('signupMsg', 'That username is already taken.', 'error');

    const salt = App.uid();
    const now = new Date().toISOString();
    const u = App.normalize({
      username, salt, passHash: await App.hash(pass, salt), addiction, frequency,
      costPerUse: Number.isFinite(cost) && cost > 0 ? cost : 0,
      createdAt: now, streakStart: now
    });
    if (!App.save(u)) return setMsg('signupMsg', 'Could not save your account. Is browser storage disabled?', 'error');
    App.setSession(username);
    setMsg('signupMsg', 'Account created. Taking you to your dashboard…', 'ok');
    setTimeout(() => (location.href = 'dashboard.html'), 600);
  }

  async function login(e) {
    e.preventDefault();
    const username = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    if (!username || !pass) return setMsg('loginMsg', 'Enter your username and password.', 'error');
    const u = App.findUser(username);
    // Same message for both failures so usernames cannot be probed.
    if (!u || !(await App.verifyPassword(u, pass))) return setMsg('loginMsg', 'Incorrect username or password.', 'error');
    if (!u.passHash) { // upgrade an old plain-text account to a salted hash
      u.salt = App.uid();
      u.passHash = await App.hash(pass, u.salt);
      App.save(u);
    }
    App.setSession(u.username);
    location.href = 'dashboard.html';
  }

  App.boot(() => {
    if (App.user()) { location.replace('dashboard.html'); return; }
    wirePasswordToggles();
    const lf = document.getElementById('loginForm');
    const sf = document.getElementById('signupForm');
    if (lf) lf.addEventListener('submit', login);
    if (sf) sf.addEventListener('submit', signup);
  });
})();
