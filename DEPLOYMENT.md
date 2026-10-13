# Deployment guide

Production stack: `docker-compose.yaml` builds `db`, `backend`, `frontend`
(static build served by nginx) and a public `nginx` reverse proxy. Only nginx is
published to the host (port 80; 443 prepared but commented).

```
browser ──▶ nginx :80 ──┬── /api/, /uploads/, /health ──▶ backend:3500
                        └── everything else            ──▶ frontend:80 (built SPA)
```

## 1. One-time setup

```bash
cp .env.example .env
# generate secrets
openssl rand -hex 48   # use for each AUTH_*/RESET_*/EMAIL_VERIFY_* secret
openssl rand -hex 32   # use for TWO_FACTOR_ENCRYPTION_KEY
```

Fill in `.env`:

| Variable | Notes |
|---|---|
| `POSTGRES_PASSWORD` | strong; must match the password inside `DATABASE_URL` |
| `DATABASE_URL` | host must be `db` (compose service name) |
| `AUTH_SECRET`, `AUTH_REFRESH_SECRET`, `RESET_SECRET`, `EMAIL_VERIFY_SECRET` | **all required** – backend refuses to start without them |
| `RESET_PASSWORD_SECRET` | separate secret used by the password-reset module |
| `TWO_FACTOR_ENCRYPTION_KEY` | 32-byte hex; required for 2FA |
| `ALLOWED_ORIGINS` | public site URL(s), comma-separated |
| `FRONTEND_URL` | public site URL – used in verification / reset emails |
| `SMTP_*` | mail credentials |
| `VITE_API_URL` | leave `/api` for the single-server setup |
| `VITE_FIREBASE_*` | optional; falls back to the bundled project values |

## 2. Build & run

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f backend
```

The backend entrypoint waits for Postgres, runs `prisma migrate deploy`, then
upserts the system roles (`npm run seed:roles`) before starting. **Do not run
`npm run seed`** in production – `prisma/seed.ts` wipes every table.

Health check: `curl http://<host>/health` → `{"status":"ok"}`.

## 3. TLS (do before going public)

1. Point your domain's A record at the server.
2. Issue certificates (e.g. certbot) into `nginx/certs/` as `fullchain.pem` /
   `privkey.pem`.
3. In `nginx/default.conf` uncomment the `443` server block + the `80→443`
   redirect and set `server_name`.
4. In `docker-compose.yaml` uncomment the nginx `443:443` port and the
   `./nginx/certs` volume.
5. `docker compose up -d nginx`.

## 4. Security follow-ups

- **Rotate the leaked credentials.** The previous `docker-compose.yaml` committed
  a real Gmail app password, JWT secret and DB password – they remain in git
  history. Revoke the Gmail app password in the Google account and generate fresh
  values for `.env`.
- Consider scrubbing history (`git filter-repo`) or treating the repo as
  compromised for those secrets.
- Uploaded avatars are stored on the `uploads` Docker volume. For multi-instance
  scaling, move uploads to object storage (S3 / Firebase Storage) – the code
  already imports the Firebase Storage SDK.

## 5. Updating a running deployment

```bash
git pull
docker compose build
docker compose up -d
```

Migrations run automatically on backend start.

## Render (static site + web service)

The frontend (static site) and the API (web service) get two different
`onrender.com` hostnames, which browsers treat as two separate sites. The
refresh-token cookie is `SameSite=Lax`, so the frontend must call the API
through **its own origin**. Add these rewrite rules to the static site
(Dashboard > the static site > Redirects/Rewrites), above the SPA fallback:

| Source | Destination | Action |
|---|---|---|
| `/api/*` | `https://<backend>.onrender.com/api/*` | Rewrite |
| `/uploads/*` | `https://<backend>.onrender.com/uploads/*` | Rewrite |
| `/*` | `/index.html` | Rewrite |

Render reads these rules from the dashboard (or `routes:` in a Blueprint), not
from a `_redirects` file, and uses `*` in the destination rather than `:splat`.

Static site environment:

- `VITE_API_URL` unset or `/api` (a production build defaults to `/api`)
- `VITE_SOCKET_URL=https://<backend>.onrender.com` - Socket.IO connects to the
  web service directly: it authenticates with the access token, not the cookie,
  and WebSocket upgrades through a static-site rewrite are not documented

Web service environment: `NODE_ENV=production`, and `ALLOWED_ORIGINS` set to the
static site's URL (needed by the Socket.IO connection and by the origin check
on write requests).

## Local development (unchanged)

Run services directly without Docker:

```bash
cd back_end && cp .env.example .env && npm install && npm run dev
cd front_end && npm install && npm run dev
```
