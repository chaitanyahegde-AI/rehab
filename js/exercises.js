/* exercises.js – craving toolkit: guided breathing, focus game and the "I'm having a craving" sheet.
   Self-contained: builds its own modals so any page can call Ex.openCraving(). */
(function () {
  'use strict';
  const Ex = (window.Ex = {});

  function award(pts, reason, key, msg) {
    const u = App.user();
    if (!u) return;
    if (App.award(u, pts, reason, key + ':' + App.dateKey())) {
      App.save(u);
      App.toast(msg || `+${pts} points`);
      document.dispatchEvent(new CustomEvent('rehab:changed'));
    }
  }

  /* ----- Craving sheet ----- */
  Ex.openCraving = () => {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <p class="muted">Cravings are intense but temporary. They usually peak and fade within 15–30 minutes. Pick something to do right now.</p>
      <div class="option-list">
        <button class="option" data-a="breathe" type="button"><span class="ico">${App.icon('wind')}</span><span><b>Guided breathing</b><span class="d">Slow your body down in two minutes</span></span></button>
        <button class="option" data-a="game" type="button"><span class="ico">${App.icon('target')}</span><span><b>Focus game</b><span class="d">Give your mind something else to hold</span></span></button>
        <a class="option" href="chat.html"><span class="ico">${App.icon('chat')}</span><span><b>Talk to the AI companion</b><span class="d">Get through it together</span></span></a>
        <a class="option" href="emergency.html"><span class="ico">${App.icon('emergency')}</span><span><b>Call someone</b><span class="d">Helplines and your trusted contacts</span></span></a>
      </div>`;
    const m = App.modal({ title: 'Having a craving? You’ve got this.', content: wrap });
    wrap.querySelector('[data-a="breathe"]').addEventListener('click', () => { m.close(); Ex.openBreathing(); });
    wrap.querySelector('[data-a="game"]').addEventListener('click', () => { m.close(); Ex.openGame(); });
  };

  /* ----- Breathing (4s in · 4s hold · 4s out) ----- */
  Ex.openBreathing = () => {
    const wrap = document.createElement('div');
    wrap.className = 'breath';
    wrap.innerHTML = `<p class="muted">Breathe with the circle. Inhale as it grows, hold, then exhale as it shrinks.</p>
      <div class="breath-stage"><div class="breath-circle" id="bCircle"></div></div>
      <div class="breath-text" id="bText">Get ready…</div>
      <p class="muted small" id="bCount">Cycles completed: 0</p>
      <div class="modal-actions" style="justify-content:center"><button class="btn btn-secondary" id="bStop" type="button">Finish</button></div>`;
    const m = App.modal({ title: 'Guided breathing', content: wrap });
    const circle = wrap.querySelector('#bCircle'), text = wrap.querySelector('#bText'), count = wrap.querySelector('#bCount');
    const phases = [['Breathe in', 1.25], ['Hold', 1.25], ['Breathe out', 0.7]];
    let step = 0, cycles = 0, timer = null;

    const tick = () => {
      const [label, scale] = phases[step % 3];
      text.textContent = label;
      circle.style.transform = `scale(${scale})`;
      step++;
      if (step % 3 === 0) { cycles++; count.textContent = 'Cycles completed: ' + cycles; }
    };
    const start = setTimeout(() => { tick(); timer = setInterval(tick, 4000); }, 600);
    const stop = () => {
      clearTimeout(start); clearInterval(timer);
      if (cycles >= 3) award(3, 'Completed a breathing exercise', 'breath', '+3 points for calming your body');
    };
    m.onClose = stop;
    wrap.querySelector('#bStop').addEventListener('click', m.close);
  };

  /* ----- Focus game: tap 1→10 in order within 30s ----- */
  Ex.openGame = () => {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<p class="muted">Tap the numbers from 1 to 10 in order before time runs out.</p>
      <div class="tap-hud"><span id="gNext">Next: 1</span><span id="gTime">30s</span></div>
      <div class="tap-grid" id="gGrid"></div>
      <p id="gResult" class="form-msg" aria-live="polite"></p>
      <div class="modal-actions"><button class="btn btn-secondary" id="gAgain" type="button">Restart</button><button class="btn" id="gClose" type="button">Done</button></div>`;
    const m = App.modal({ title: 'Focus game', content: wrap });
    const grid = wrap.querySelector('#gGrid'), res = wrap.querySelector('#gResult');
    const nextEl = wrap.querySelector('#gNext'), timeEl = wrap.querySelector('#gTime');
    let timer = null;

    function play() {
      clearInterval(timer);
      res.textContent = ''; res.className = 'form-msg';
      let next = 1, left = 30;
      const nums = Array.from({ length: 10 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
      grid.innerHTML = '';
      nextEl.textContent = 'Next: 1'; timeEl.textContent = left + 's';
      nums.forEach((n) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'tap'; b.textContent = n;
        b.addEventListener('click', () => {
          if (n !== next) { b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); return; }
          b.disabled = true; next++;
          nextEl.textContent = next > 10 ? 'Done!' : 'Next: ' + next;
          if (next > 10) {
            clearInterval(timer);
            res.textContent = 'Nicely done. That urge is already weaker.'; res.className = 'form-msg ok';
            award(5, 'Won the focus game', 'game', '+5 points for beating the urge');
          }
        });
        grid.appendChild(b);
      });
      timer = setInterval(() => {
        left--; timeEl.textContent = left + 's';
        if (left <= 0) {
          clearInterval(timer);
          grid.querySelectorAll('button').forEach((b) => (b.disabled = true));
          res.textContent = 'Time’s up. Try again, or switch to breathing.'; res.className = 'form-msg error';
        }
      }, 1000);
    }
    play();
    m.onClose = () => clearInterval(timer);
    wrap.querySelector('#gAgain').addEventListener('click', play);
    wrap.querySelector('#gClose').addEventListener('click', m.close);
  };
})();
