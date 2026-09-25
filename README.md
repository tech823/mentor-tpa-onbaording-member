# Mentor TPA — Member Onboarding Platform

A configurable, multi-tenant member onboarding platform for corporate health-coverage
programmes. It replaces rigid Google Forms with a secure, multilingual, fully-customizable
onboarding experience — administrators design forms per corporate client, members complete a
secure link (with family details and document uploads), and administrators review, verify and
export standardized data.

Built as the digital onboarding module for **Mentor TPA** (a subsidiary of Mentor Health).

---

## Key capabilities

### Administrator portal
- **Corporate clients** — manage the organizations you onboard members for (e.g. Karachi Union of Journalists).
- **Programmes** — one or more onboarding programmes per corporate client.
- **Dynamic form builder** — configure exactly which fields and documents each programme
  requires (10 field types, required flags, options, sections, drag-order, live preview) — no code.
  Fields and documents can be **shown or hidden (activate / deactivate)** at any time without
  deleting their data, and documents toggled required / optional inline.
- **Secure onboarding links** — a unique, non-guessable link per programme; activate / deactivate / regenerate.
- **Submissions** — searchable, status-filterable, paginated list of all members with family and document status.
- **Review workflow** — open any submission and **Accept** or **Reject** it. Statuses roll up into four
  clear buckets — **In Process → Under Review → Accepted / Rejected** (a member's submission moves to
  *Under Review* automatically on submit). Reviewing is limited to SUPER_ADMIN / ADMIN.
- **Document verification** — secure download and PENDING / VERIFIED / REJECTED workflow.
- **Excel export** — one click, English-standardized values with dynamic per-programme columns
  (the primary member appears once, with each family member on its own row).
- **User management** — create admin accounts and **edit their role & corporate access**; enable / disable
  accounts. A role change takes effect immediately (limited to SUPER_ADMIN / ADMIN).
- **Audit logs & dashboard** — action history and analytics charts.
- **Responsive admin UI** — collapsible, grouped sidebar with a mobile drawer.

### Member experience (public, no account)
- Opens a secure link and completes a mobile-first, step-based flow:
  **Personal → Family → Documents → Review → Submit**.
- **Multilingual** — English, Urdu, Sindhi, Pashto (RTL-aware); pick a language at any time.
- **Dynamic family members** — add unlimited spouse / children / dependents.
- **Document uploads** — CNIC, B-Form, FRC and any configured document (image / PDF, validated).
- **Draft & resume** — progress is saved; closing the browser does not lose data.

### Data standardization
Structured values (gender, relationship, etc.) are stored as canonical **English codes** regardless
of the language used for entry, so exported data is clean and portal-ready — while the member's
original input is always preserved.

---

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React, Vite, TypeScript, Tailwind CSS, shadcn-style UI, React Hook Form + Zod, TanStack Query, React Router, i18next, Recharts |
| Backend   | Node.js, Express, TypeScript, Zod — layered controller → service → repository |
| Database  | PostgreSQL (Neon) via Drizzle ORM |
| Auth      | JWT in HTTP-only cookies, bcrypt, role-based access control, tenant isolation |
| Storage   | Local disk behind a swappable S3-compatible interface |
| Email     | Resend (optional) |
| Export    | ExcelJS |

## Monorepo layout

```
apps/
  api/       Express API (modules: auth, corporates, programmes, forms, onboarding,
             submissions, documents, exports, notifications, dashboard, users, audit)
  web/       React application (admin portal + public member onboarding)
packages/
  shared/    Zod schemas, enums and DTO types shared across api, web and future mobile app
```

## Getting started

**Prerequisites:** Node.js 20+, pnpm 9+, and a PostgreSQL connection string (Neon recommended).

```bash
pnpm install

# Configure the API
cp apps/api/.env.example apps/api/.env
#   set DATABASE_URL (Neon), JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# Create tables and seed data
pnpm db:migrate
pnpm db:seed        # admin accounts + first corporate + document types
pnpm db:seed:kuj    # optional: full KUJ Health Coverage programme + onboarding link

# Run both apps
pnpm dev            # api → http://localhost:4000 · web → http://localhost:5173
```

Seeded administrator accounts (password `ChangeMe123!` — change after first login):

| Role            | Email |
|-----------------|-------|
| SUPER_ADMIN     | superadmin@mentortpa.com |
| ADMIN           | admin@mentortpa.com |
| CORPORATE_ADMIN | kuj.admin@mentortpa.com |

## Useful scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run API + web together |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:seed` / `pnpm db:seed:kuj` | Seed base / KUJ programme data |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check every package |

## Deployment

Serve the web build (`apps/web` → static) and the API (Node) on the same domain, with Nginx
proxying `/api` to the backend so authentication cookies work. Set production environment
variables (database, secrets, `COOKIE_SECURE=true`, CORS origin, persistent storage path).
The database runs on Neon; document storage should point to a persistent, backed-up directory
(or an S3-compatible bucket).

---

© Mentor TPA
