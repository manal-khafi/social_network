# Social Network

An Instagram-style social network: a web app where people sign up, follow each
other, publish posts and 24-hour stories, chat in direct messages, make audio
and video calls, and gather in communities. It is a full-stack TypeScript
project (Express API + React single-page app), and it ships with a Docker
Compose stack that runs the whole thing behind nginx.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js 24, Express 4, TypeScript, Prisma 6, PostgreSQL 17, Socket.IO 4, JWT auth, Firebase Admin (social login), Nodemailer, pino |
| Frontend | React 19, Vite 6, Redux Toolkit, React Router 7, Tailwind CSS 4, Radix UI, Socket.IO client, Firebase (auth + Storage), i18next (en, fr, es, ar, de) |
| Infra | Docker Compose, nginx reverse proxy, GitHub Actions |
| Tests / quality | Vitest + supertest (backend), ESLint 9 (both), `tsc` typecheck (backend) |

## Features

- **Authentication**: email + password with email verification, Google and
  Facebook sign-in (Firebase), password reset by email, optional TOTP
  two-factor authentication, rate-limited auth endpoints
- **Profiles**: avatar, cover image, bio, private accounts, onboarding flow
- **Posts**: text and media, public / friends / private visibility, like, save,
  repost, archive, edit, delete, threaded comments with replies
- **Social graph**: follow, follow requests for private accounts, close
  friends, blocking, account search
- **Stories**: 24-hour stories with stickers, polls, questions, music, GIFs,
  reactions, replies, sharing, and permanent highlights
- **Direct messages**: one-to-one conversations in real time, read state,
  archiving
- **Calls**: audio and video calls over WebRTC, signalled through Socket.IO
- **Communities**: create and manage communities, join requests, member roles,
  rules
- **Notifications**: likes, comments, replies, mentions, follows, reposts and
  story activity, pushed live over Socket.IO, with per-type preferences
- **Reports**: users can report posts, comments and accounts (admin-only review
  API)
- **Settings**: account, privacy, notifications, appearance, accessibility,
  language

## Getting started

### Prerequisites

- **Docker** with the Compose plugin, for the full stack
- **Node.js 24** and npm, for running the services directly (Node 24 is what
  CI and the Docker images use; Node 20 also works locally)
- `openssl`, to generate secrets

### Option 1: full stack with Docker

```bash
git clone https://github.com/IMANEMHARACH/social_network.git
cd social_network
git checkout dev

cp .env.example .env
```

Edit `.env`. At minimum:

- set `POSTGRES_PASSWORD`, and use the same password inside `DATABASE_URL`
  (keep the host as `db`)
- generate the secrets:

  ```bash
  openssl rand -hex 48   # one each for AUTH_SECRET, AUTH_REFRESH_SECRET,
                         # RESET_SECRET, EMAIL_VERIFY_SECRET, RESET_PASSWORD_SECRET
  openssl rand -hex 32   # TWO_FACTOR_ENCRYPTION_KEY
  ```

- for a local run, set `ALLOWED_ORIGINS=http://localhost` and
  `FRONTEND_URL=http://localhost`
- either fill in the `SMTP_*` values, or set `AUTH_AUTO_VERIFY=true` so new
  accounts do not need a verification email (development only)

Then:

```bash
docker compose up -d --build
docker compose logs -f backend
```

| What | URL |
|---|---|
| App (frontend) | http://localhost |
| API | http://localhost/api |
| Health check | http://localhost/health |
| Realtime (Socket.IO) | http://localhost/socket.io |

Only nginx is published to the host (port 80). Postgres and the backend are
reachable only inside the Compose network.

**Migrations** run automatically: on every start the backend container waits
for Postgres, runs `prisma migrate deploy`, and seeds the system roles. To run
them by hand:

```bash
docker compose exec backend npx prisma migrate deploy
```

> Do not run `npm run seed` against data you care about. `prisma/seed.ts`
> wipes every table before inserting demo data.

### Option 2: run the services directly

You need a PostgreSQL instance on `localhost:5432` (the Compose `db` service is
not published to the host), for example:

```bash
docker run -d --name social-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=socielle_network postgres:17
```

Backend:

```bash
cd back_end
cp .env.example .env        # fill in DATABASE_URL and the secrets
npm install
npx prisma migrate dev      # applies migrations to your local database
npm run seed:roles          # system roles
npm run dev                 # http://localhost:3500
```

Frontend:

```bash
cd front_end
cp .env.example .env
# for local dev point the client at the backend directly:
#   VITE_API_URL=http://localhost:3500
#   VITE_SOCKET_URL=http://localhost:3500
npm install
npm run dev                 # http://localhost:5173
```

`back_end/.env.example` already allows `http://localhost:5173` as a CORS origin.

### Useful scripts

| Where | Command | What it does |
|---|---|---|
| `back_end` | `npm run dev` | API with reload (nodemon + ts-node) |
| `back_end` | `npm run build` / `npm start` | compile to `dist/` and run it |
| `back_end` | `npm run typecheck` | `tsc --noEmit` |
| `back_end` | `npm run lint` | ESLint |
| `back_end` | `npm test` | unit and auth integration tests (no database needed) |
| `front_end` | `npm run dev` | Vite dev server |
| `front_end` | `npm run build` | production bundle |
| `front_end` | `npm run lint` | ESLint |

## Environment variables

The root `.env` is used by Docker Compose and passed to the backend container.
`back_end/.env.example` holds the same backend variables for running without
Docker, and `front_end/.env.example` the `VITE_*` ones.

### Database

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_USER` | no (default `postgres`) | Postgres user created by the `db` container |
| `POSTGRES_PASSWORD` | **yes** | Postgres password; Compose refuses to start without it |
| `POSTGRES_DB` | no (default `socielle_network`) | Database name |
| `DATABASE_URL` | **yes** | Prisma connection string. Host is `db` in Docker, `localhost` otherwise; must match the values above |

### Backend runtime

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | no | `development` locally; Compose sets `production` |
| `PORT` | no (default `3500`) | Port the API listens on |
| `BODY_LIMIT` | no (default `1mb`) | Max size of JSON / urlencoded request bodies (not file uploads) |
| `ALLOWED_ORIGINS` | **yes** | Comma-separated browser origins allowed by CORS and Socket.IO |
| `FRONTEND_URL` | **yes** | Public URL of the frontend, used in verification and reset emails |
| `APP_NAME` | no | Name shown in email footers |
| `GLOBAL_RATE_LIMIT` | no (default `1000`) | Requests per IP per 15 minutes across the whole API |
| `LOG_LEVEL` | no | pino level (`info` in production, `debug` otherwise) |

### Auth and security

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | **yes** | Signs access tokens; the backend will not start without it |
| `AUTH_SECRET_EXPIRES_IN` | no (default `15m`) | Access token lifetime |
| `AUTH_REFRESH_SECRET` | **yes** | Signs refresh tokens |
| `AUTH_REFRESH_SECRET_EXPIRES_IN` | no (default `24h`) | Refresh token lifetime |
| `RESET_SECRET` | **yes** | Required at startup by the JWT module |
| `RESET_EXPIRES_IN` | no (default `15m`) | Lifetime for tokens signed with `RESET_SECRET` |
| `EMAIL_VERIFY_SECRET` | **yes** | Signs email verification links |
| `EMAIL_VERIFY_EXPIRES_IN` | no (default `24h`) | Verification link lifetime |
| `RESET_PASSWORD_SECRET` | **yes** | Signs password reset links; the backend will not start without it |
| `RESET_PASSWORD_EXPIRES_IN` | no (default `15m`) | Reset link lifetime |
| `TWO_FACTOR_ENCRYPTION_KEY` | for 2FA | Encrypts stored TOTP secrets; 2FA setup fails without it |
| `AUTH_AUTO_VERIFY` | no (default `false`) | `true` marks new accounts verified without sending an email. Development only |

### Email (SMTP)

| Variable | Required | Description |
|---|---|---|
| `SMTP_HOST` | for email | SMTP server (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | for email | SMTP port (e.g. `587`) |
| `SMTP_USER` | for email | SMTP username |
| `SMTP_PASS` | for email | SMTP password or app password |

Email is needed for sign-up verification (unless `AUTH_AUTO_VERIFY=true`) and
for password reset.

### Firebase Admin (social login)

| Variable | Required | Description |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_PATH` | for social login | Path to the service-account JSON file (inside the container when using Docker) |
| `FIREBASE_SERVICE_ACCOUNT` | for social login | Alternative to the path: the whole service-account JSON on one line |
| `FIREBASE_STORAGE_BUCKET` | no | Only for server-side Firebase Storage access |

Provide one of the first two. With neither, the API still starts and social
login answers 503.

### Optional integrations

| Variable | Required | Description |
|---|---|---|
| `GIPHY_API_KEY` | no | Enables GIF stickers in stories; empty disables them |
| `TURN_URL` | no | WebRTC TURN relay URL(s), comma-separated. Empty means STUN only |
| `TURN_USER` | no | TURN username |
| `TURN_PASS` | no | TURN credential |

### Frontend (baked into the bundle at build time)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | no (default `/api` in Docker) | API base URL. `/api` goes through nginx on the same origin; use `http://localhost:3500` for local dev without Docker |
| `VITE_SOCKET_URL` | no | Socket.IO endpoint. Empty means same origin |
| `VITE_FIREBASE_API_KEY` | no | Firebase web config. All six `VITE_FIREBASE_*` values fall back to the project bundled in `front_end/src/config/firebaseConfig.ts` |
| `VITE_FIREBASE_AUTH_DOMAIN` | no | Firebase web config |
| `VITE_FIREBASE_PROJECT_ID` | no | Firebase web config |
| `VITE_FIREBASE_STORAGE_BUCKET` | no | Firebase web config (media uploads) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | no | Firebase web config |
| `VITE_FIREBASE_APP_ID` | no | Firebase web config |

## Project structure

```
social_network/
├── back_end/
│   ├── prisma/
│   │   ├── schema.prisma        # data model (users, posts, stories, messages, ...)
│   │   ├── migrations/          # SQL migrations, applied on container start
│   │   ├── seedRoles.ts         # idempotent system-role seed (safe on every deploy)
│   │   └── seed.ts              # demo data; WIPES every table first
│   ├── src/
│   │   ├── app.ts               # Express app: middleware and route mounting
│   │   ├── index.ts             # HTTP server, Socket.IO and email start-up
│   │   ├── Routes/              # one router per feature
│   │   ├── Controllers/         # request handlers, grouped by feature
│   │   ├── services/            # business logic (stories, notifications, messaging, ...)
│   │   ├── Middleware/          # auth, rate limiting, block guard, validation
│   │   ├── realtime/            # Socket.IO server and call signalling
│   │   ├── config/              # Prisma client, Firebase Admin, email
│   │   ├── util/                # JWT, encryption, logger, errors
│   │   └── __tests__/           # Vitest unit and integration tests
│   ├── Dockerfile
│   └── docker-entrypoint.sh     # waits for the DB, migrates, seeds roles, starts
├── front_end/
│   ├── src/
│   │   ├── App.tsx              # route table
│   │   ├── Views/               # pages (feed, profile, inbox, stories, settings, ...)
│   │   ├── Components/          # shared UI, including Components/ui primitives
│   │   ├── features/            # Redux slices
│   │   ├── api/                 # axios instance and API helpers
│   │   ├── realtime/            # Socket.IO client and event routing
│   │   ├── guards/, layouts/    # route guards and page shells
│   │   └── i18n/                # translations (en, fr, es, ar, de)
│   ├── Dockerfile               # builds the bundle, serves it with nginx
│   └── nginx.conf
├── nginx/default.conf           # public reverse proxy (TLS block prepared, commented)
├── docker-compose.yaml          # db, backend, frontend, nginx
├── .github/workflows/ci.yml
├── DEPLOYMENT.md                # production deployment guide
└── .env.example
```

### API overview

All routes are under `/api`. Most require a bearer access token; sign-up,
login, password reset, the public feed and account search do not.

| Prefix | Area |
|---|---|
| `/api/authentication` | register, login, logout, session, email verification, password reset, social login |
| `/api/auth/2fa` | two-factor setup, enable, disable, login verification |
| `/api/profile`, `/api/account`, `/api/privacy`, `/api/Compte` | profile, password and account, privacy settings, onboarding |
| `/api/posts`, `/api/comments`, `/api/saves` | posts, comments, likes, saves, reposts, archive |
| `/api/follow`, `/api/blocks`, `/api/search` | follows, close friends, blocking, account search |
| `/api/stories` | stories, highlights, reactions, polls, questions, music, GIFs |
| `/api/conversations`, `/api/rtc/ice-servers` | direct messages, WebRTC ICE servers |
| `/api/communities` | communities, members, join requests, rules |
| `/api/notifications` | list, unread count, read, delete, preferences |
| `/api/reports` | create a report; admin-only review |
| `/health` | liveness probe |

## CI/CD

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`
and `dev`. It has three jobs:

| Job | Steps |
|---|---|
| `backend` | `npm ci`, `prisma generate`, typecheck, lint, tests |
| `frontend` | `npm ci`, lint, production build |
| `docker` | `docker compose build` with a throwaway `.env` |

No job needs a database: the backend tests mock Prisma.

There is no automated deployment. To deploy, follow
[DEPLOYMENT.md](DEPLOYMENT.md): on the server, pull, then

```bash
docker compose build
docker compose up -d
```

Migrations are applied when the backend container starts. Set up TLS (section
3 of the deployment guide) before exposing the site publicly.

## Known limitations / in progress

- **Frontend typecheck fails.** `tsc` reports about 90 TypeScript errors in
  `front_end`. The Vite build passes because it does not typecheck, and the
  frontend typecheck is not part of CI.
- **Social login needs a Firebase service account.** Without
  `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT`, Google and
  Facebook sign-in return 503.
- **No admin UI.** Reviewing reports requires the platform role `ADMIN`, and
  nothing in the app assigns it. Set it directly in the database:

  ```sql
  UPDATE "User"
  SET role_id = (SELECT id FROM "Role" WHERE name = 'ADMIN')
  WHERE email = 'you@example.com';
  ```

- **Email verification needs SMTP.** Sign-up fails with 503 if the verification
  email cannot be sent. Configure `SMTP_*`, or set `AUTH_AUTO_VERIFY=true` in
  development.
- **Secrets in git history.** Earlier commits contain a Firebase service-account
  key and, per `DEPLOYMENT.md`, a Gmail app password, a JWT secret and a
  database password. Treat them as compromised and rotate them.
- **Lint debt.** ESLint reports explicit `any` (both projects) and unused
  variables (frontend) as warnings rather than errors.
- **Dependency advisories.** `npm audit` still reports issues that need
  major-version upgrades (27 in the backend, 4 in the frontend at the time of
  writing).
- **HTTPS is not enabled by default.** nginx serves plain HTTP on port 80 until
  certificates are configured.
- **Uploads on local disk.** Onboarding avatars are stored on the `uploads`
  Docker volume, which does not suit multi-instance deployments.

## Contributing

- **Target branch: `dev`**. It is the active trunk;
  `main` is far behind and should not be used as a base or PR target.
- **Branch names**: existing branches use `feature/<short-name>`, e.g.
  `feature/instagram-stories`. Keep that for features and use
  `fix/<short-name>` for bug fixes.
- **Commits**: conventional style with a scope, e.g.
  `fix(stories): emoji sticker panel rendered empty in the story composer`.
- Before opening a pull request, run what CI runs:

  ```bash
  cd back_end  && npm run typecheck && npm run lint && npm test
  cd front_end && npm run lint && npm run build
  ```

- Schema changes go through a Prisma migration
  (`npx prisma migrate dev --name <change>`); commit the generated folder under
  `back_end/prisma/migrations/`.
- Never commit `.env` files or service-account keys.
