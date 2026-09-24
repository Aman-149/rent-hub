# RentHub — Complete Project Summary

A full history and status snapshot of everything built in this repository, as of **2026-09-23**. This complements [PROJECT.md](PROJECT.md) (architecture reference) and [README.md](README.md) (quick start) with a chronological account of *what was done* — every feature, fix, and decision, in build order.

---

## 1. What RentHub Is

A full-stack rental marketplace connecting **landlords** and **renters** in Addis Ababa (default city). Supports property discovery, inquiries/applications, in-app chat, favorites, reviews, notifications, and a full admin console. Ships as a single Node/Express server that serves both the REST API and the built React frontend — one deployable unit, no separate frontend/backend hosting required (though it also supports split deployment; see §7).

---

## 2. Tech Stack

**Frontend:** React 19, React Router 7 (`BrowserRouter`), TypeScript, Vite 6, Tailwind CSS 4 (`@tailwindcss/vite`), `motion` (Framer Motion successor), `lucide-react` icons.

**Backend:** Express 4 (Node.js), TypeScript run via `tsx` in dev, JWT (`jsonwebtoken`), `bcryptjs` password hashing, `cors`, `dotenv`.

**Database:** Dual-mode — PostgreSQL (`pg` driver) when `DATABASE_URL` is set, or an embedded JSON file (`server/data/db.json`) as a zero-setup fallback. Both are abstracted behind one `db` interface.

**Build:** `vite build` → `dist/` (frontend); `esbuild` bundles `server.ts` → `dist/server.cjs` (single-file CJS server for production). `tsc --noEmit` for type-checking.

---

## 3. Full Build History (chronological, oldest → newest)

Every commit on `master`, in order, with what it actually delivered:

1. **`f886d12` — chore: initialize repository setup and environment configuration**
   Repo scaffolding, `.gitignore`, initial `.env` handling.

2. **`29e8868` — build: setup build pipeline, TypeScript configuration, and Vite tooling**
   `tsconfig.json`, `vite.config.ts`, base build pipeline.

3. **`1934f47` — feat(types): define comprehensive core domain models and data interfaces**
   `src/types/index.ts` — `User`, `Property`, `PropertyImage`, `Review`, `Inquiry`, `Message`, `Conversation`, `NotificationItem`, `ReportItem`, stats types, etc.

4. **`f5be644` — feat(styles): configure Tailwind CSS, custom design tokens, and base styles**
   Tailwind 4 setup, `src/index.css`, design tokens.

5. **`dfbe8db` — feat(security): implement JWT cryptographic utility and token generation**
   `server/utils/jwt.ts` — `signToken` / `verifyToken`.

6. **`e217186` — feat(middleware): create JWT authentication and role-based access middleware**
   `server/middleware/auth.ts` — `authenticate`, `optionalAuth`, `requireRole([...])`.

7. **`249dfa0` — feat(db): design normalized relational PostgreSQL database schema with indexes**
   `server/db/schema.sql` — full relational schema: `users`, `properties`, `property_images`, `amenities`, `property_amenities`, `favorites`, `conversations`, `messages`, `inquiries`, `property_views`, `reports`, `notifications`, with FKs and indexes.

8. **`d59f0e6` — feat(db): build resilient storage engine with atomic writes and seed generator**
   `server/db/database.ts` — dual-backend abstraction (Postgres or JSON file), atomic file writes, seed data generator.

9. **`82784ef` — feat(server): setup Express server infrastructure with Vite middleware mounting**
   `server.ts` — Express app, Vite dev middleware, static serving groundwork.

10. **`f4cf188` — feat(auth): implement user authentication, registration, and credential APIs**
    `server/routes/auth.ts` — register, login, `/me`, profile update, change-password, forgot-password.

11. **`223f0f2` — feat(properties): create property listing management and query filter routes**
    `server/routes/properties.ts` — CRUD, search/filter, pagination, reviews.

12. **`15e0daf` — feat(favorites): implement user saved listings and bookmarks controller**
    `server/routes/favorites.ts`.

13. **`bc00a08` — feat(inquiries): develop rental viewing booking and application submission APIs**
    `server/routes/inquiries.ts` — viewing requests, application details, status workflow.

14. **`6d7d75d` — feat(messaging): implement direct conversation threading and message dispatch**
    `server/routes/conversations.ts` — chat threads and messages.

15. **`87933ce` — feat(media): implement multipart image upload and curated photo gallery presets**
    `server/routes/media.ts` — base64 image upload, curated preset stock photos by room category.

16. **`a874609` — feat(reports): create listing compliance moderation and fraud reporting route**
    `server/routes/reports.ts` — listing reports + admin moderation workflow.

17. **`497db30` — feat(notifications): add system notifications and real-time alert endpoints**
    `server/routes/notifications.ts`.

18. **`7ddca2b` — feat(stats): aggregate platform performance metrics and KPI analytics**
    `server/routes/stats.ts` — landlord/renter dashboard stats.

19. **`63164f4` — feat(admin): build administrative control endpoints and database backup utilities**
    `server/routes/admin.ts` — user/property management, DB status/export/import/seed/schema tools.

20. **`caedd30` — feat(client): implement strongly-typed API client service and request wrapper**
    `src/services/api.ts` — typed fetch client covering every backend endpoint, auto-attaches JWT.

21. **`a2716f3` — feat(auth): create React authentication provider and persistent session store**
    `src/store/authContext.tsx` — auth Context, persisted session.

22. **`3569fc8` — feat(ui): design custom toast notification system and feedback banners**
    `src/components/common/Toast.tsx`.

23. **`b22d809` — feat(ui): implement responsive header navigation and footer layout**
    `src/components/layout/Navbar.tsx`, `Footer.tsx`.

24. **`4247a4f` — feat(ui): develop property card view and multi-criteria search filter bar**
    `src/components/properties/PropertyCard.tsx`, `PropertyFilter.tsx`.

25. **`85c80b6` — feat(ui): create rental inquiry and listing report modal dialogs**
    `src/components/inquiries/InquiryModal.tsx`, `ReportModal.tsx`.

26. **`98d36c9` — feat(pages): build landing showcase, property discovery, and detail view**
    `HomePage`, `BrowsePropertiesPage`, `PropertyDetailsPage`.

27. **`6c4f9a4` — feat(auth-pages): implement user login, registration, and password recovery pages**
    `LoginPage`, `RegisterPage`, `ForgotPasswordPage`.

28. **`2019f07` — feat(dashboards): develop landlord portal, renter dashboard, and chat messaging**
    `LandlordDashboard`, `RenterDashboard`, `MessagesPage`, plus `AddEditPropertyPage`, `FavoritesPage`, `UserProfilePage`.

29. **`ce83478` — feat(admin): construct admin DevOps console, application routing, and entrypoint**
    `AdminDashboard.tsx`, `src/App.tsx` route table with `ProtectedRoute` guards, `src/main.tsx`.

30. **`e860dab` — chore(env): rework environment config for real deployment**
    Environment variable handling overhaul for real (non-demo) deployment.

31. **`10bfb70` — chore(build): drop AI-Studio build quirks, add lockfile and create-admin script**
    Removed AI-Studio-specific build artifacts, added `package-lock.json`, introduced `scripts/create-admin.ts`.

32. **`bded095` — feat(admin): add CLI script for creating admin accounts**
    `npm run create-admin` — interactive or flag-based (`--email=`, `--password=`, `--name=`) admin account creation.

33. **`641e7df` — feat(db): remove seed data, add admin bootstrap and clearAllData**
    Removed login-capable demo/seed accounts; added `ADMIN_EMAIL`/`ADMIN_PASSWORD` env-bootstrap (`Database.bootstrapAdminFromEnv`, idempotent) and a `clearAllData` capability.

34. **`257c1d9` — feat(admin): replace database seed endpoint with clear endpoint**
    Admin console's "seed" action reworked into a "clear" action reflecting the no-demo-data direction.

35. **`e31cf2f` — feat(admin-ui): update dashboard copy for clear-database action**
    Admin UI copy updated to match the new clear-database semantics.

36. **`c717570` — feat(auth): remove demo quick-login and default-password hint**
    Removed any "quick login as demo user" UI affordance and default-password hints from the login page — forces real credential entry.

37. **`d2e9b7e` — feat(ui): replace stock Unsplash avatars with neutral icon placeholders**
    Swapped external Unsplash-hosted avatar images for local neutral icon placeholders (removes external image dependency / potential broken-link risk).

38. **`49ef007` — fix(security): harden CORS, JWT secret, and image upload validation**
    Security hardening pass (full detail in §5):
    - CORS restricted to an explicit allow-list instead of wildcard (`cors()` → allow-list with origin callback), scoped to `/api`.
    - `JWT_SECRET` is now **required** — server throws and refuses to start if unset (previously fell back to a hardcoded default secret, `'renthub-super-secret-jwt-key-2026'`, which was a real vulnerability).
    - Image upload MIME-type validation tightened to an explicit allow-list (`image/jpeg`, `image/png`, `image/webp`) checked against the actual `data:` URI prefix, rejecting anything else — previously any extension was trusted/defaulted.
    - `PORT` default changed from `3000` → `5000`.
    - Removed unused `fileURLToPath`/`__dirname` ESM interop code.

39. **`26c202a` — docs: add README and full project documentation**
    Added [README.md](README.md) and [PROJECT.md](PROJECT.md) (the full architecture reference).

40. **`9d3761d` — chore(deploy): configure for Render/Vercel production deployment** *(latest, current HEAD)*
    - Frontend API base URL now driven by `VITE_API_BASE_URL` env var, falling back to `http://localhost:5000/api` for local dev.
    - Server CORS now sends `credentials: true` alongside the `FRONTEND_URL` origin (needed for cross-origin cookie/auth flows between a Vercel-hosted frontend and a Render-hosted backend).
    - Added `vercel.json` with a SPA rewrite (`/(.*) → /index.html`) so client-side routes survive a hard refresh/direct link on Vercel.
    - Added `VITE_API_BASE_URL` to `.env.example` and a corresponding `ImportMetaEnv` type in `src/vite-env.d.ts`.

**Total: 40 commits**, all authored by Amanuel Fikadu (some with Claude Sonnet 5 co-authorship on later commits), on a single `master` branch, working tree currently clean.

---

## 4. Architecture Snapshot (current state)

### Server (`server.ts` + `server/`)
- Express app; CORS locked to `localhost:3000`, `localhost:5173`, `localhost:$PORT`, and `FRONTEND_URL`, with credentials enabled, scoped to `/api`.
- JSON/urlencoded body parsing capped at 15MB (for base64 image payloads).
- Serves `/uploads` statically from `server/data/uploads/`.
- `GET /api/health` — server + live DB diagnostics.
- Dev mode: Vite dev middleware (HMR). Prod mode: serves `dist/` static assets with SPA catch-all fallback.
- Listens on `PORT` (default `5000`) on `0.0.0.0`.

### Routers (all under `/api`)
`auth`, `properties`, `favorites`, `conversations`, `inquiries`, `reports`, `admin`, `stats`, `notifications`, `media` — full endpoint-by-endpoint reference lives in [PROJECT.md §4](PROJECT.md).

### Auth & Roles
JWT-based (bcryptjs hashing). Middleware: `authenticate` (required, also rejects suspended accounts), `optionalAuth` (attaches user if present, never blocks), `requireRole([...])`. Three roles: `renter`, `landlord`, `admin`.

### Data Model
11 relational tables (Postgres) mirrored by the JSON fallback — see [PROJECT.md §6](PROJECT.md) for the full table/relationship/index breakdown. Lifecycle state machines: property (`pending_approval → active → rented/archived`), inquiry (`pending → contacted → viewing_scheduled → approved/rejected → closed`), report (`pending → reviewed → action_taken/dismissed`).

### Frontend
12 pages, 4 shared components (Navbar, Footer, Toast provider, plus feature modals), React Router 7 with `ProtectedRoute` role guards, Context-based auth state, single typed API client. Full route table in [PROJECT.md §7](PROJECT.md).

---

## 5. Security Hardening Done

All landed in `49ef007` (2026-09-22) and reinforced by later commits:

| Issue found | Fix |
|---|---|
| CORS wildcard (`cors()` allowed any origin) | Explicit allow-list with origin-validation callback, scoped to `/api`, later extended with `credentials: true` |
| Hardcoded JWT secret fallback (`'renthub-super-secret-jwt-key-2026'`) | Server now throws on startup if `JWT_SECRET` is unset — no insecure default |
| Image upload trusted client-supplied file extension | Validated against actual `data:<mime>;base64,` prefix, allow-listed to `image/jpeg`, `image/png`, `image/webp` only, still capped at 10MB |
| Demo/seed accounts with guessable credentials | Removed entirely (`641e7df`); no login-capable seed accounts ship anymore |
| Quick-login / default-password UI hints | Removed from login page (`c717570`) |
| External Unsplash avatar URLs | Replaced with local neutral icon placeholders (`d2e9b7e`) |

Admin accounts are **never** created implicitly — only via `ADMIN_EMAIL`/`ADMIN_PASSWORD` env bootstrap (idempotent, runs on every startup) or `npm run create-admin` CLI. Neither path overwrites an existing account with that email.

---

## 6. Environment Variables (current, `.env.example`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | no | `5000` | Express listen port |
| `JWT_SECRET` | **yes** | — | JWT signing secret; server refuses to start without it |
| `FRONTEND_URL` | no | `http://localhost:5173` | Allowed CORS origin |
| `VITE_API_BASE_URL` | no | `http://localhost:5000/api` | Frontend's API base URL (build-time, Vite) |
| `DATABASE_URL` | no | — | Postgres connection string; omitted → JSON file fallback |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | no | — | Env-bootstrap an admin account on startup (idempotent) |
| `ADMIN_NAME` | no | `Admin` | Display name for the bootstrapped admin |

---

## 7. Deployment Configuration (latest work)

Configured for a **split deployment**: frontend on **Vercel**, backend on **Render** (or similar), communicating cross-origin.

- **`vercel.json`** — SPA rewrite so all paths serve `index.html` (client-side routing survives direct links/refresh).
- **Frontend** reads `VITE_API_BASE_URL` at build time to know where the API lives; falls back to `localhost:5000/api` for local dev.
- **Backend CORS** sends `Access-Control-Allow-Credentials: true` alongside the allow-listed `FRONTEND_URL` origin, required for the browser to accept cross-origin authenticated requests from the Vercel-hosted frontend.
- The app also still supports the original **single-process deployment** (Express serves both API and built SPA from one process/port) — nothing about that path was removed, the split-deploy option was added alongside it.

Production build: `npm run build` → `vite build` (frontend → `dist/`) + `esbuild` bundles `server.ts` → `dist/server.cjs`. Run with `npm start` (`node dist/server.cjs`). The `dist/` build output is currently committed in the working tree (from a prior local build).

---

## 8. Accounts & Data Policy

- **No pre-seeded demo accounts.** Renters/landlords self-register via `POST /api/auth/register`.
- **Admin accounts** only via env bootstrap or `npm run create-admin` CLI script.
- The embedded JSON seed data still ships **3 placeholder landlord accounts** (`abebe.tadesse@example.com`, `sara.worku@example.com`, `dawit.m@example.com`) solely to own the bundled sample listings — their passwords are randomly generated per-seed and never published, so they are **not usable as login credentials**.
- `POST /api/admin/database/seed` was replaced by a **clear** endpoint (`641e7df`, `257c1d9`) — admin console now clears rather than reseeds demo data, and the corresponding UI copy was updated (`e31cf2f`).

---

## 9. Notable Implementation Decisions

- Dual database backend (Postgres or embedded JSON file) behind one interface — zero external dependencies out of the box, scales to Postgres via `DATABASE_URL`.
- Image uploads use base64-in-JSON-body (not multipart/form-data), validated by MIME-type regex, allow-listed, and size-capped.
- `optionalAuth` used on public browse/detail endpoints so anonymous users can browse while logged-in users get personalized data (e.g. `isFavorite`).
- Suspended users are rejected at the middleware layer, not just hidden in the UI.
- Single Express process can serve both API and static SPA build with a catch-all route (`app.get('*', ...)`) for local/single-host deployment, while also supporting the newer split Vercel/Render deployment.

---

## 10. Current Repo State

- Branch: `master`, working tree clean, 40 commits total.
- No open branches other than `master`.
- Build output (`dist/`) and a sample upload (`server/data/uploads/1789670539643_58x817.jpg`) are present in the tree from local builds/testing.
- Full architecture/API reference: [PROJECT.md](PROJECT.md). Quick start: [README.md](README.md). This file: complete chronological build history and decision log.
