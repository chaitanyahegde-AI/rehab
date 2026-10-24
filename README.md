# Renew – Recovery Companion

Streak tracking, daily habits, mood check-ins, a craving toolkit (breathing + focus game),
rewards, emergency helplines (India) and an AI support chat.

## Run it

```bash
npm install
cp .env.example .env      # then put your GROQ_API_KEY in .env
npm start                 # → http://localhost:5000
```

The Node server serves the app **and** the `/chat` API, so there is nothing else to start.
Without an API key everything works except the AI chat (it shows a setup message).
Opening the pages with VS Code Live Server (port 5501) also works; chat calls `http://localhost:5000`.

To use Groq, create an API key at [Groq Console](https://console.groq.com/keys), then replace
`your-groq-api-key-here` in the root `.env` file with your key. Keep the key private; `.env`
is excluded from Git. If `.env` already exists, make sure it has a
`GROQ_API_KEY=your-key-here` entry. Restart the server after changing the key.

## Notes
- Data (accounts, streaks, habits, moods) is stored in the browser's `localStorage`, per device.
  Passwords are salted + hashed, but this is still **client-side demo auth**, not real account security.
  For multi-device accounts you would add a database and server-side auth.
- Crisis language in chat gets a fixed safety reply with 112 / Tele-MANAS 14416 (no model call).
- To rename the app, change `BRAND` in `js/main.js` and the page titles.
