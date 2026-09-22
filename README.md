# RentHub

RentHub is a rental marketplace connecting landlords and renters, with listing discovery, inquiries, in-app chat, and an admin console for platform oversight.

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` with the API server on port 3000.

## Environment Variables

- `JWT_SECRET` — secret used to sign authentication tokens (required)
- `PORT` — port for the API server (default: 3000)
- `FRONTEND_URL` — deployed frontend origin, used for CORS
- `DATABASE_URL` — optional PostgreSQL connection string; falls back to an embedded JSON file database if unset
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — optional; if both are set, an admin account is created automatically on startup (see below)

## Accounts

Renters and landlords sign up themselves from the app's Register page (`POST /api/auth/register`). There are no pre-seeded demo accounts.

To get an admin account, use one of:

1. **Env bootstrap** — set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (and optionally `ADMIN_NAME`) in `.env`; an admin account is created automatically the first time the server starts. Safe to leave set across restarts — it's a no-op once the account exists.
2. **CLI script** — run `npm run create-admin` and follow the prompts (or pass `--email=`, `--password=`, `--name=` flags non-interactively).

Both paths work against either storage backend (PostgreSQL or the embedded JSON file database) and hash the password with `bcryptjs`.
