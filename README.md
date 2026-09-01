# DG BHAI 9X — Traceable Landing Page

## Files
- `index.html` — mobile-first landing page
- `server.js` — Express tracking API
- `admin.html` — analytics dashboard
- `data.json` — created automatically on first event

## Run locally
1. Install Node.js.
2. In this folder run:
   `npm install express`
3. Set an admin key:
   Linux/macOS: `ADMIN_KEY="your-secret-key" node server.js`
   Windows PowerShell: `$env:ADMIN_KEY="your-secret-key"; node server.js`
4. Open `http://localhost:3000`
5. Dashboard: `http://localhost:3000/admin`

## Tracking
Examples:
- `/?ref=instagram`
- `/?ref=telegram`
- `/?ref=youtube&utm_campaign=summer`

The server records visits and Telegram-button clicks, plus source/UTM values and a privacy-preserving fingerprint hash. It labels clicks as `likely_real` or `suspicious` using simple heuristic signals such as bot-like user agents and unusually high click frequency.

This is not proof that a person actually joined Telegram. It is an analytics heuristic, not a guaranteed fraud detector.

## Production
Use HTTPS and a strong `ADMIN_KEY`. For real multi-user analytics, replace `data.json` with a database and put the API behind HTTPS.
