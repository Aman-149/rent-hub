# RentHub

RentHub is a full-stack rental marketplace that connects landlords and renters. Landlords list and manage properties, renters browse and filter available listings, and both sides communicate directly through in-app inquiries and real-time chat. An admin console provides oversight of users, listings, and reported content across the platform.

## Features

- **Property listings** — landlords create, edit, and manage rental listings with photos and details
- **Browse & discover** — renters search and filter properties, and save favorites
- **Inquiries & chat** — renters contact landlords about a listing and continue the conversation through built-in messaging
- **Notifications** — in-app alerts for new inquiries, messages, and account activity
- **Role-based dashboards** — separate dashboards for renters, landlords, and admins
- **Admin console** — user, listing, and report management, plus platform stats
- **AI chat assistant** — a built-in widget to help users navigate the app

## Tech Stack

- **Frontend:** React 19, React Router, Vite, Tailwind CSS, Motion
- **Backend:** Express (TypeScript), running under Bun/Node
- **Auth:** JWT-based authentication with bcrypt password hashing
- **Database:** PostgreSQL, with an embedded JSON file database fallback for local development
- **Deployment:** configured for Render (API) and Vercel (frontend)

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
