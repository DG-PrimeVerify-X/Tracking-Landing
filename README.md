# DG BHAI 9X — Vercel Version

## Deploy
1. Upload this folder to GitHub.
2. Import the repository into Vercel.
3. Deploy with the default settings.
4. Your landing page will be `/`.
5. Analytics page will be `/admin.html`.

## API
- POST `/api/visit`
- POST `/api/click`
- GET `/api/stats`

## Important
Vercel serverless functions do not provide persistent local file storage. This version therefore does not use `data.json`.

The API functions currently log events and return normalized tracking data. For persistent Real/Suspicious counts, source reports, unique visitors and history, connect the API routes to a persistent database such as Vercel Postgres/Neon/Supabase.

The “likely_real” classification is heuristic, not proof that a Telegram user actually joined a group.
