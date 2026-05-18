Render Deployment Guide

1) Build & Start commands
- Build Command: npm install
- Start Command: npm start

2) Connect GitHub repo to Render
- In Render (render.com) create a new "Web Service".
- Connect your GitHub account and select the repository.
- For Branch, choose `main` (or whichever branch you deploy).
- For the Root Directory, leave blank (root of repo) unless your app is nested.
- Set the Build command to `npm install` and the Start command to `npm start`.

3) Add environment variables in Render dashboard
- In the service settings, go to "Environment -> Environment Variables" and add:
  - `DB_HOST` — your MySQL host (e.g. from PlanetScale, Railway, Aiven)
  - `DB_USER` — DB username
  - `DB_PASSWORD` — DB password or auth token
  - `DB_NAME` — database name
  - `DB_CONNECTION_LIMIT` — optional, default `10`
  - `PORT` — Render sets this automatically; you can leave it unset
  - `CORS_ORIGIN` — optional, set to your frontend origin or `*` for permissive
  - `JWT_SECRET` — your JWT signing secret

4) Notes & Warnings
- Local MySQL will NOT work on Render's managed web service — use an external managed MySQL provider (PlanetScale, Railway, Aiven, Amazon RDS, etc.).
- If using a serverless-style MySQL provider (e.g., PlanetScale with branching), ensure connection pooling is compatible or use a secondary connection strategy recommended by the provider.
- Socket.io: Render supports WebSockets, but if you plan to horizontally scale across multiple instances you will need a pub/sub adapter (Redis) for Socket.io to propagate events across instances.
- Ensure you do NOT commit real secrets into the repo. Use Render's environment variables UI or Render's secret management.

5) Troubleshooting
- If your app fails to bind, verify your server reads `process.env.PORT` (this project does).
- Check Render service logs for startup errors and DB connection issues.

6) Quick checklist (summary)
- [ ] Set `main` to `server.js` and add `start` script in `package.json`.
- [ ] Ensure `server.js` uses `process.env.PORT || 3000` and `dotenv`.
- [ ] Configure DB connection using `DB_HOST/DB_USER/DB_PASSWORD/DB_NAME`.
- [ ] Add environment variables in Render dashboard.
- [ ] Use an external MySQL provider; do not rely on local DB.
- [ ] Review Socket.io scaling requirements if needed.

Good luck — ping me if you want help wiring a specific provider (e.g., PlanetScale) or adding Redis/adapter for Socket.io.
