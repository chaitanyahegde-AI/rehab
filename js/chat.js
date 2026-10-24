/* chat.js – AI companion UI. Talks to the Node server (POST /chat). */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  // Served by the Node server itself → same origin. Opened from file:// or another dev server → localhost:5000.
  const API = location.port === '5000' ? '' : 'http://localhost:5000';
  const GREETING = 'Hi, I’m here to listen. How are you feeling right now? If you’re having a craving, tell me about it and we’ll get through it together.';
  const CRISIS = /\b(suicid\w*|kill myself|end my life|want to die|self[- ]?harm|hurt myself|no reason to live)\b/i;
  let history = [];
  let busy = false;
  let storeKey = '';

  function add(role, text) {
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    div.textContent = text; // textContent → safe against injected HTML
    $('messages').appendChild(div);
    $('messages').scrollTop = $('messages').scrollHeight;
    return div;
  }

  function persist() { App.write(storeKey, history.slice(-30)); }

  async function send(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true; $('sendBtn').disabled = true;
    add('user', text);
    const prior = history.slice(-10);
    history.push({ role: 'user', content: text });
    const pending = add('ai', '');
    pending.innerHTML = '<span class="typing" aria-label="Thinking"><i></i><i></i><i></i></span>';

    try {
      const u = App.user();
      const res = await fetch(API + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: prior, context: { focus: u.addiction, streakDays: App.streak(u).days } })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.reply) throw new Error(data.error || 'Request failed');
      pending.textContent = data.reply;
      history.push({ role: 'assistant', content: data.reply });
    } catch (err) {
      pending.className = 'msg error';
      pending.textContent = err.message && err.message !== 'Failed to fetch' && err.message !== 'Request failed'
        ? err.message
        : 'I can’t reach the AI server right now. Start it with “npm start” and try again.';
      if (CRISIS.test(text)) pending.textContent += '\n\nIf you’re in danger or thinking of harming yourself, please call 112 or Tele-MANAS 14416 right now.';
      history.pop(); // don't keep the failed turn
    } finally {
      busy = false; $('sendBtn').disabled = false;
      persist();
      $('messages').scrollTop = $('messages').scrollHeight;
      $('userInput').focus();
    }
  }

  function restore() {
    $('messages').innerHTML = '';
    add('ai', GREETING);
    history.forEach((m) => add(m.role === 'user' ? 'user' : 'ai', m.content));
  }

  App.boot((u) => {
    storeKey = 'chat_' + u.username.toLowerCase();
    history = (App.read(storeKey) || []).filter((m) => m && typeof m.content === 'string');
    restore();

    const input = $('userInput');
    const grow = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; };
    input.addEventListener('input', grow);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('chatForm').requestSubmit(); }
    });
    $('chatForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const t = input.value; input.value = ''; grow(); send(t);
    });
    $('quick').addEventListener('click', (e) => { if (e.target.classList.contains('chip')) send(e.target.textContent); });
    $('clearChat').addEventListener('click', async () => {
      if (!(await App.confirm({ title: 'Clear conversation?', message: 'This removes the chat history saved on this device.', confirmText: 'Clear', danger: true }))) return;
      history = []; persist(); restore();
    });
    input.focus();
  });
})();
