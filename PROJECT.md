# RentHub — Full Project Documentation

RentHub is a full-stack rental marketplace connecting **landlords** and **renters** in Addis Ababa (default city), with property discovery, inquiries, in-app chat, favorites, reviews, notifications, and a full **admin console** for platform oversight. It ships as a single Node/Express server that serves both the REST API and the Vite-built React frontend.

---

## 1. Tech Stack

### Frontend
- **React 19** + **React Router 7** (client-side routing, `BrowserRouter`)
- **TypeScript**
- **Vite 6** as the build tool / dev server
- **Tailwind CSS 4** (via `@tailwindcss/vite` plugin) for styling
- **motion** (Framer Motion successor) for animations
- **lucide-react** for icons

### Backend
- **Express 4** (Node.js) — single server handles API + serves the frontend
- **TypeScript**, run in dev via `tsx`
- **JWT** (`jsonwebtoken`) for authentication
- **bcryptjs** for password hashing
- **cors** for cross-origin handling
- **dotenv** for environment configuration

### Database
- **PostgreSQL** (`pg` driver) when `DATABASE_URL` is set — schema defined in [server/db/schema.sql](server/db/schema.sql)
- **Embedded JSON file database** (`server/data/db.json`) as an automatic fallback when no `DATABASE_URL` is provided — zero-setup local/demo mode
- Both modes are abstracted behind a single `db` object in [server/db/database.ts](server/db/database.ts)

### Build & Tooling
- `vite build` bundles the frontend into `dist/`
- `esbuild` bundles `server.ts` into a single CommonJS file `dist/server.cjs` for production
- `tsc --noEmit` used for type-checking (`npm run lint`)

---

## 2. Project Structure

```
rent-hub/
├── server.ts                      # App entrypoint: Express setup, CORS, static uploads, Vite middleware / prod static serving
├── server/
│   ├── db/
│   │   ├── database.ts            # DB abstraction layer (Postgres or JSON file), all data access methods
│   │   └── schema.sql             # PostgreSQL table definitions, indexes, constraints
│   ├── middleware/
│   │   └── auth.ts                # authenticate, optionalAuth, requireRole(roles) middlewares
│   ├── utils/
│   │   └── jwt.ts                 # signToken / verifyToken helpers
│   ├── routes/
│   │   ├── auth.ts                # register, login, me, profile, change-password, forgot-password
│   │   ├── properties.ts          # CRUD + search/filter + reviews for listings
│   │   ├── favorites.ts           # save/unsave/list favorite properties
│   │   ├── conversations.ts       # chat threads + messages
│   │   ├── inquiries.ts           # rental inquiries/applications
│   │   ├── reports.ts             # user-submitted listing reports + admin moderation
│   │   ├── admin.ts               # admin-only stats, user/property management, DB tools
│   │   ├── stats.ts               # landlord & renter dashboard statistics
│   │   ├── notifications.ts       # in-app notifications
│   │   └── media.ts               # image upload + curated preset images
│   └── data/
│       ├── db.json                # embedded JSON database file (fallback storage)
│       └── uploads/                # uploaded property images served at /uploads
├── src/
│   ├── main.tsx                   # React root render
│   ├── App.tsx                    # Router setup, route guards, layout shell
│   ├── index.css                  # Tailwind entry + global styles
│   ├── store/
│   │   └── authContext.tsx        # React Context for auth state (user, token, login/logout)
│   ├── services/
│   │   └── api.ts                 # Typed fetch client wrapping every backend endpoint
│   ├── types/
│   │   └── index.ts               # Shared TypeScript types/interfaces (User, Property, Inquiry, etc.)
│   ├── components/
│   │   ├── common/Toast.tsx       # Toast notification provider/UI
│   │   ├── layout/Navbar.tsx      # Top navigation bar (role-aware links, auth state)
│   │   ├── layout/Footer.tsx      # Site footer
│   │   ├── properties/PropertyCard.tsx    # Listing card used in grids
│   │   ├── properties/PropertyFilter.tsx  # Search/filter sidebar or bar
│   │   ├── inquiries/InquiryModal.tsx     # Modal to submit a rental inquiry/application
│   │   └── inquiries/ReportModal.tsx      # Modal to report a listing
│   └── pages/
│       ├── HomePage.tsx                   # Landing page / showcase
│       ├── BrowsePropertiesPage.tsx       # Property search & discovery grid
│       ├── PropertyDetailsPage.tsx        # Single listing detail view (images, amenities, reviews, inquiry)
│       ├── LoginPage.tsx                  # Login form
│       ├── RegisterPage.tsx               # Registration form (renter/landlord)
│       ├── ForgotPasswordPage.tsx         # Password recovery flow
│       ├── UserProfilePage.tsx            # View/edit profile, change password
│       ├── FavoritesPage.tsx              # Renter's saved properties
│       ├── MessagesPage.tsx               # Chat/conversations UI
│       ├── LandlordDashboard.tsx          # Landlord's listings, inquiries, stats
│       ├── AddEditPropertyPage.tsx        # Create/edit a property listing
│       ├── RenterDashboard.tsx            # Renter's inquiries, viewings, stats
│       └── AdminDashboard.tsx             # Admin console (users, properties, reports, DB tools)
├── index.html                     # Vite HTML entry
├── vite.config.ts                 # Vite config (React plugin, Tailwind plugin)
├── tsconfig.json
├── package.json
├── .env.example
├── scripts/
│   └── create-admin.ts            # CLI: create an admin account (npm run create-admin)
├── metadata.json
└── dist/                          # Production build output (frontend assets + bundled server)
```

---

## 3. How the Server Works ([server.ts](server.ts))

1. Creates an Express app.
2. Configures **CORS** to allow `http://localhost:3000`, `http://localhost:5173`, and `process.env.FRONTEND_URL`.
3. Parses JSON/urlencoded bodies with a **15MB limit** (to accommodate base64 image uploads).
4. Ensures `server/data/uploads/` exists and serves it statically at `/uploads`.
5. Exposes `GET /api/health` — returns server status plus live database diagnostics (engine type, connection status, record/table counts).
6. Mounts all REST routers under `/api/*` (see section 4).
7. Global error-handling middleware returns a generic 500 JSON error for unhandled exceptions.
8. **Dev mode** (`NODE_ENV !== 'production'`): attaches Vite's dev middleware in middleware mode for HMR.
9. **Prod mode**: serves the built `dist/` static assets and falls back to `dist/index.html` for any unmatched route (SPA fallback).
10. Listens on `PORT` (default `5000`) on `0.0.0.0`.

---

## 4. REST API Reference

All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <JWT>` header (set via `authenticate` middleware). `requireRole([...])` further restricts by role. `optionalAuth` attaches `req.user` if a valid token is present but doesn't block anonymous access.

### Auth — `/api/auth` ([server/routes/auth.ts](server/routes/auth.ts))
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | public | Create a new user account (renter or landlord), hashes password with bcrypt, returns JWT |
| POST | `/login` | public | Authenticate with email/password, returns JWT + user profile |
| GET | `/me` | required | Get the current authenticated user's profile |
| PUT | `/profile` | required | Update profile fields (name, phone, avatar, bio, etc.) |
| POST | `/change-password` | required | Change password (verifies current password) |
| POST | `/forgot-password` | public | Password recovery request flow |

### Properties — `/api/properties` ([server/routes/properties.ts](server/routes/properties.ts))
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | optional | List/search properties with filters (type, price range, city, neighborhood, bedrooms, etc.), pagination; marks favorites if logged in |
| GET | `/locations` | public | Distinct list of cities/neighborhoods for filter dropdowns |
| GET | `/my-listings` | landlord/admin | Get the current landlord's own listings |
| GET | `/:id` | optional | Get full property details (images, amenities, landlord info, reviews); increments view count |
| POST | `/` | landlord/admin | Create a new property listing |
| PUT | `/:id` | required (owner or admin) | Update a listing |
| PATCH | `/:id/status` | required (owner or admin) | Change listing status (active / rented / pending_approval / archived) |
| DELETE | `/:id` | required (owner or admin) | Delete a listing |
| GET | `/:id/reviews` | public | List reviews for a property |
| POST | `/:id/reviews` | required | Submit a review/rating for a property |

### Favorites — `/api/favorites` ([server/routes/favorites.ts](server/routes/favorites.ts))
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | required | List the current user's favorited properties |
| POST | `/:propertyId` | required | Add a property to favorites |
| DELETE | `/:propertyId` | required | Remove a property from favorites |

### Conversations / Chat — `/api/conversations` ([server/routes/conversations.ts](server/routes/conversations.ts))
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | required | List the user's conversation threads (with last message, unread count, other participant) |
| POST | `/start` | required | Start (or resolve existing) conversation between a renter and landlord, optionally tied to a property |
| GET | `/:id/messages` | required | Get message history for a conversation |
| POST | `/:id/messages` | required | Send a new message in a conversation |

### Inquiries — `/api/inquiries` ([server/routes/inquiries.ts](server/routes/inquiries.ts))
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | required | List inquiries relevant to the user (as renter or landlord) |
| POST | `/` | required | Submit a rental inquiry/application for a property (viewing request, application details, income, pets, etc.) |
| PUT | `/:id` | required (landlord/owner) | Update inquiry status (contacted, viewing_scheduled, approved, rejected, closed) and notes |

### Reports — `/api/reports` ([server/routes/reports.ts](server/routes/reports.ts))
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | required | Report a listing (reason + details) |
| GET | `/admin` | admin | List all reports for moderation |
| PUT | `/admin/:id` | admin | Update report status (reviewed / action_taken / dismissed) and admin notes |

### Admin — `/api/admin` ([server/routes/admin.ts](server/routes/admin.ts))
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/stats` | admin | Platform-wide statistics (users, properties, inquiries, reports) |
| GET | `/users` | admin | List/search all users |
| PATCH | `/users/:id/status` | admin | Suspend/reactivate a user account |
| GET | `/properties` | admin | List/search all properties across all landlords |
| PUT | `/properties/:id/status` | admin | Force-change a property's status |
| DELETE | `/properties/:id` | admin | Delete any property |
| GET | `/database/status` | admin | Live DB diagnostics (engine, connection, table/record counts, storage size) |
| GET | `/database/export` | admin | Export the full database (JSON dump) |
| POST | `/database/import` | admin | Import/restore a database dump |
| POST | `/database/seed` | admin | Reset to initial sample listings data (no login-capable demo accounts are created) |
| GET | `/database/schema` | admin | Return the database schema definition |

### Stats — `/api/stats` ([server/routes/stats.ts](server/routes/stats.ts))
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/landlord` | landlord/admin | Landlord dashboard stats: total/active/rented properties, inquiries, unread messages, views, recent inquiries |
| GET | `/renter` | required | Renter dashboard stats: favorites count, inquiries, scheduled viewings, approved inquiries, unread messages |

### Notifications — `/api/notifications` ([server/routes/notifications.ts](server/routes/notifications.ts))
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | required | List the user's notifications |
| PATCH | `/:id/read` | required | Mark one notification as read |
| POST | `/read-all` | required | Mark all notifications as read |

### Media — `/api/media` ([server/routes/media.ts](server/routes/media.ts))
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/preset-images` | public | Curated stock property photos (by category: Living Room, Bedroom, Kitchen, Bathroom, Exterior & Villa, Balcony & Views) for listings without user photos |
| POST | `/upload` | required | Upload a base64-encoded image (JPG/PNG/WEBP only, 10MB max); saves to `server/data/uploads/` and returns a public `/uploads/...` URL |

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | public | Server + database health/diagnostic check |

---

## 5. Authentication & Authorization

- Passwords hashed with **bcryptjs**.
- On login/register, a **JWT** is issued (see [server/utils/jwt.ts](server/utils/jwt.ts)) signed with `JWT_SECRET`, containing the user's ID (and likely role).
- Clients send `Authorization: Bearer <token>` on subsequent requests.
- Middleware ([server/middleware/auth.ts](server/middleware/auth.ts)):
  - `authenticate` — requires a valid token; rejects if missing/invalid/expired; also rejects **suspended** accounts (403).
  - `optionalAuth` — attaches `req.user` if a valid token exists, but never blocks the request (used for public endpoints that personalize results, e.g. marking favorites).
  - `requireRole(roles[])` — restricts an endpoint to specific roles (`renter`, `landlord`, `admin`); returns 403 otherwise.
- Suspended users are blocked at the middleware level even with a valid token.

### Roles
- **renter** — browses/searches listings, favorites, submits inquiries/applications, chats with landlords, leaves reviews.
- **landlord** — creates/manages property listings, receives and manages inquiries, chats with renters, views listing performance stats.
- **admin** — full oversight: manage users (suspend/reactivate), manage/delete any property, moderate reports, view platform-wide stats, and access database tools (export/import/seed/schema/status) via an admin console.

---

## 6. Data Model (PostgreSQL schema — [server/db/schema.sql](server/db/schema.sql))

| Table | Purpose | Key relationships |
|---|---|---|
| `users` | Accounts for renters, landlords, admins | — |
| `properties` | Rental listings | `landlord_id → users` |
| `property_images` | Multiple images per listing, with primary flag & sort order | `property_id → properties` |
| `amenities` | Master list of amenity types | — |
| `property_amenities` | Amenities attached to a specific listing | `property_id → properties` |
| `favorites` | Renter-saved listings (unique per user+property) | `user_id → users`, `property_id → properties` |
| `conversations` | Chat threads between a landlord and renter, optionally tied to a property | `landlord_id/renter_id → users`, `property_id → properties` |
| `messages` | Individual chat messages | `conversation_id → conversations`, `sender_id/receiver_id → users` |
| `inquiries` | Rental applications/inquiries with viewing preferences, status workflow | `property_id → properties`, `renter_id/landlord_id → users` |
| `property_views` | View-tracking log (viewer + IP) for analytics | `property_id → properties`, `viewer_id → users` |
| `reports` | User reports against listings, with moderation status | `property_id → properties`, `reporter_id → users` |
| `notifications` | In-app notifications per user | `user_id → users` |

Indexes exist on landlord/city/price/type/status for properties, favorites by user, inquiries by landlord/renter, messages by conversation, and notifications by user+read state.

Property `status` lifecycle: `pending_approval → active → rented / archived`.
Inquiry `status` lifecycle: `pending → contacted → viewing_scheduled → approved / rejected → closed`.
Report `status` lifecycle: `pending → reviewed → action_taken / dismissed`.

### Dual storage mode
[server/db/database.ts](server/db/database.ts) abstracts data access so the rest of the app is storage-agnostic:
- If `DATABASE_URL` is set → connects to **PostgreSQL** using the schema above.
- If not set → falls back to a **local JSON file** (`server/data/db.json`) that mirrors the same entities, enabling zero-config local development and demos without installing Postgres.
- `db.getDatabaseStatus()` reports which engine is active, connection health, table list, and total record counts (surfaced via `/api/health` and the admin database tools).

---

## 7. Frontend Application

### Routing ([src/App.tsx](src/App.tsx))
Uses `react-router-dom` v7 with a `ProtectedRoute` wrapper that:
- Shows a loading spinner while auth state resolves.
- Redirects unauthenticated users to `/login`.
- Redirects users lacking the required role to their own role's dashboard.

| Route | Page | Access |
|---|---|---|
| `/` | HomePage | public |
| `/properties` | BrowsePropertiesPage | public |
| `/properties/:id` | PropertyDetailsPage | public |
| `/login` | LoginPage | public |
| `/register` | RegisterPage | public |
| `/forgot-password` | ForgotPasswordPage | public |
| `/favorites` | FavoritesPage | any authenticated user |
| `/messages` | MessagesPage | any authenticated user |
| `/profile` | UserProfilePage | any authenticated user |
| `/dashboard/landlord` | LandlordDashboard | landlord, admin |
| `/properties/new` | AddEditPropertyPage | landlord, admin |
| `/properties/:id/edit` | AddEditPropertyPage | landlord, admin |
| `/dashboard/renter` | RenterDashboard | renter, admin |
| `/dashboard/admin` | AdminDashboard | admin only |
| `*` | redirect to `/` | — |

### Layout & shared UI
- **Navbar** — role-aware top navigation (shows different links/actions depending on auth state and role).
- **Footer** — site footer.
- **ToastProvider** ([src/components/common/Toast.tsx](src/components/common/Toast.tsx)) — global toast notification system wrapping the app.

### Feature components
- **PropertyCard** — reusable listing card for grids (browse, favorites, dashboards).
- **PropertyFilter** — search/filter controls (type, price, bedrooms, location, etc.) for the browse page.
- **InquiryModal** — form modal for submitting a rental inquiry/application (viewing date, contact time, lease details, income, pets, etc.).
- **ReportModal** — form modal for reporting a listing to admins.

### Pages
- **HomePage** — marketing/landing showcase with featured listings.
- **BrowsePropertiesPage** — searchable/filterable property discovery grid.
- **PropertyDetailsPage** — full listing detail: image gallery, amenities, landlord info, reviews, inquiry/report actions.
- **LoginPage / RegisterPage / ForgotPasswordPage** — auth flows.
- **UserProfilePage** — view/edit profile info and change password.
- **FavoritesPage** — renter's saved listings.
- **MessagesPage** — chat interface listing conversations and message threads.
- **LandlordDashboard** — landlord's own listings, incoming inquiries, and performance stats.
- **AddEditPropertyPage** — create or edit a property listing, including image upload/preset selection and amenities.
- **RenterDashboard** — renter's own inquiries, scheduled viewings, and stats.
- **AdminDashboard** — admin console: user management (suspend/reactivate), property moderation, report review, platform stats, and database tools (status/export/import/seed/schema viewer).

### State & data access
- **authContext.tsx** ([src/store/authContext.tsx](src/store/authContext.tsx)) — React Context providing `user`, `isAuthenticated`, `isLoading`, and auth actions (login/register/logout/profile update); persists JWT (e.g. localStorage) across reloads.
- **api.ts** ([src/services/api.ts](src/services/api.ts)) — centralized typed fetch client that wraps every backend endpoint described in section 4, attaching the JWT automatically and handling error responses.
- **types/index.ts** ([src/types/index.ts](src/types/index.ts)) — shared TypeScript types: `User`, `Property`, `PropertyImage`, `Review`, `Inquiry`, `Message`, `Conversation`, `NotificationItem`, `ReportItem`, `AdminStats`, `LandlordStats`, `RenterStats`, `DatabaseStatusInfo`, etc.

---

## 8. Environment Variables ([.env.example](.env.example))

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | no | `5000` | Port the Express server listens on |
| `JWT_SECRET` | **yes** | — | Secret used to sign/verify JWTs |
| `FRONTEND_URL` | no | `http://localhost:5173` | Allowed CORS origin for the deployed frontend |
| `DATABASE_URL` | no | — | PostgreSQL connection string; if omitted, falls back to the embedded JSON file DB |
| `ADMIN_EMAIL` | no | — | If set together with `ADMIN_PASSWORD`, an admin account is created automatically on startup (idempotent) |
| `ADMIN_PASSWORD` | no | — | Password for the env-bootstrapped admin account (hashed with bcryptjs) |
| `ADMIN_NAME` | no | `Admin` | Display name for the env-bootstrapped admin account |

---

## 9. Scripts ([package.json](package.json))

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `tsx server.ts` | Start the dev server (Express + Vite middleware, HMR) |
| `npm run build` | `vite build && esbuild server.ts --bundle ...` | Build frontend assets to `dist/` and bundle the server into `dist/server.cjs` |
| `npm start` | `node dist/server.cjs` | Run the production build |
| `npm run clean` | `rm -rf dist server.js` | Remove build artifacts |
| `npm run lint` | `tsc --noEmit` | Type-check the entire project without emitting output |
| `npm run create-admin` | `tsx scripts/create-admin.ts` | Interactively (or via `--email=`/`--password=`/`--name=` flags) create an admin account against whichever storage backend is active |

Dev server runs the app at `http://localhost:5173` (or wherever Vite serves it) with the API on the configured `PORT`.

---

## 10. Accounts

There are no pre-seeded demo accounts. Renters and landlords are created exclusively through self-registration (`POST /api/auth/register`, picking `renter` or `landlord` as their role).

Admin accounts are never created implicitly. Use one of:

1. **`ADMIN_EMAIL` / `ADMIN_PASSWORD` env bootstrap** — [server/db/database.ts](server/db/database.ts) (`Database.bootstrapAdminFromEnv`) runs on every startup and creates an admin with these credentials if no user with that email exists yet. Idempotent — safe to leave the vars set permanently.
2. **`npm run create-admin`** — runs [scripts/create-admin.ts](scripts/create-admin.ts), which prompts for email/name/password (or accepts them as CLI flags) and calls the same `Database.createAdminUser` helper.

Both paths hash the password with `bcryptjs` and work against either storage backend (PostgreSQL when `DATABASE_URL` is set, or the embedded JSON file otherwise). Neither path will silently promote or overwrite an existing account with that email — if one exists, it's left untouched and reported back.

The embedded JSON seed data ([getInitialSeedData](server/db/database.ts)) still ships with three placeholder landlord accounts (`abebe.tadesse@example.com`, `sara.worku@example.com`, `dawit.m@example.com`) solely so the bundled sample property listings have a valid owner; their passwords are randomly generated per-seed and are not published anywhere, so they are not usable as login credentials. `POST /api/admin/database/seed` resets to this sample data and re-inserts the calling admin's own account (since the reset clears the users table too) — it does not create any other login-capable accounts.

---

## 11. Key Business Flows

1. **Registration/Login** → user picks role (renter/landlord) at signup → JWT issued → stored client-side → attached to all API calls.
2. **Listing lifecycle** → landlord creates property (pending_approval or active depending on rules) → appears in browse/search → renters view details, favorite, and submit inquiries → landlord manages inquiry status through to approval → property can be marked rented/archived.
3. **Inquiry → Conversation** → a renter's inquiry can lead to (or originate from) a chat conversation between renter and landlord, scoped to a property.
4. **Reviews** → renters can leave ratings/reviews tied to a property (visible on the property details page and aggregated as `averageRating`/`reviewsCount`).
5. **Reporting & moderation** → any user can report a listing; admins review reports and can take action (edit/delete the property, dismiss, etc.) from the Admin Dashboard.
6. **Notifications** → key events (new inquiry, message, status change) generate notifications surfaced in the UI navbar/dashboard.
7. **Admin oversight** → admins can suspend/reactivate users, force-change or delete any property, inspect live DB status, and export/import/seed the database directly from the console — useful for demos and support.
8. **Media handling** → landlords either pick from curated preset stock photos (by room category) or upload their own images (validated MIME type + 10MB size cap), stored under `server/data/uploads/` and served statically at `/uploads/<file>`.

---

## 12. Notable Implementation Details

- The server intentionally supports **two database backends** (Postgres or embedded JSON file) behind one interface, so the app runs with zero external dependencies out of the box, but scales to Postgres in production via `DATABASE_URL`.
- CORS is locked to an explicit allow-list (`localhost:3000`, `localhost:5173`, `FRONTEND_URL`) rather than a wildcard.
- Image uploads are base64-encoded in the JSON request body (not multipart/form-data), validated by regex against the `data:<mime>;base64,<data>` format, restricted to JPG/PNG/WEBP, and capped at 10MB.
- Suspended users are rejected at the authentication middleware layer, not just hidden in the UI.
- `optionalAuth` is used on public endpoints (property list/detail) so anonymous users can browse while logged-in users additionally see personalized data like `isFavorite`.
- In production, the same Express process serves the compiled API and the static SPA build with a catch-all route for client-side routing (`app.get('*', ...)`).
