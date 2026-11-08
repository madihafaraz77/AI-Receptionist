# Nissa Homeopathic Clinic — AI Receptionist & Clinic Management

A production-minded hackathon MVP for **Nissa Homeopathic Clinic**: a modern public clinic website and a doctor dashboard, with an AI receptionist and full clinic management implemented as a private pilot.

> **Current status: Vercel production deployment exists; it is not production-accepted yet.**
> The app has Milestones 1–9 in code and is deployed behind Vercel Deployment Protection. Neither Supabase nor OpenAI has been exercised in production/hosting configuration, so it is not clinic-ready. Read [`docs/QA_REPORT.md`](docs/QA_REPORT.md) for the honest test matrix and [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for setup.

### Verification summary (November 2026)

- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm test` — 54/54 unit tests pass
- `npm run build` — pass (23 routes)
- Production route smoke test — `/dashboard/patients`, `/dashboard/consultations`, `/dashboard/feedback` and `/dashboard/appointments` return 200.
- Vercel production deployment — exists at `https://nissa-ai-receptionist.vercel.app`, but is protected and not live-verified; no Supabase/OpenAI acceptance performed.
- Live Supabase, OpenAI, RLS, AI-safety and deployment tests — **not run** (blocked by missing project keys)

## What is included

- Premium, responsive public website: home, about, services, booking, online consultation, feedback, contact, AI receptionist.
- Responsive doctor dashboard: sidebar, topbar, overview, appointments, patients, consultations, follow-ups, AI receptionist, feedback, clinic settings.
- Doctor-editable Clinic Settings (identity, hours, capacity, fee, policy) and Services catalogue (create/edit/archive) with server-side validation, role checks, audit logging and cache revalidation.
- Public booking: genuine availability lookup, transactional reservation, patient reuse by phone and honest unconfigured states.
- Patient module: searchable registration list, non-clinical admin notes and private attachments with short-lived signed URLs.
- Consultation module: doctor-only notes, optional prescription and follow-up scheduling, atomic creation with audit logging.
- Appointments workspace: date and status filters, capacity display, confirm/complete/cancel actions, event history and audit wiring.
- Follow-ups workspace: live list with status filter, overdue indicator and complete/cancel actions guarded by Postgres and an audit log.
- Feedback: anonymous public submission, private doctor review and audit trail; reminder cron authenticated by `CRON_SECRET`.
- Restricted public AI assistant: OpenAI-gated chat, server-side key/model check, clinic-approved context, emergency/medical-advice refusals, visible not-connected state, AI conversation logging and read-only review inbox.
- Doctor-managed AI knowledge base: create/edit/deactivate approved facts that the assistant may use; staff can view but not edit them.
- AI booking tools: controlled availability lookup and booking through the website flow, plus human-handover escalation and inbox assignment/close controls.
- Supabase foundation: browser/server/admin clients, session refresh in the proxy, and a doctor sign-in page.
- Versioned database migrations: 19 tables, enums, indexes, triggers, RLS policies, a private storage bucket and confirmed seed data.
- Dashboard overview reads live data (with honest empty states) instead of sample records.
- Central clinic configuration with all confirmed operational defaults.
- Design system built with Tailwind CSS v4 and shadcn/ui (Radix primitives, Lucide icons).
- Project documentation, environment template and milestone plan.

## What is intentionally not built yet

| Area | Milestone |
| --- | --- |
| Patient registration, consultations, prescriptions and attachments | 6 (code complete; live verification pending) |
| Notifications, email, WhatsApp, reminders, feedback workflow | 9 (in-app/private feedback code complete; email/WhatsApp not connected) |
| Full testing and deployment | 10 (live testing blocked) |

The schema, RLS and the `create_*`, `set_*`, reminder, AI handover and AI logging functions now back the public booking flow, dashboard appointments, follow-ups, patient/clinical flows and the AI receptionist implemented in Milestones 4–9.

## Tech stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS v4, shadcn/ui, Lucide icons
- **Backend:** Supabase PostgreSQL, Supabase Auth, Supabase Storage
- **Planned AI:** OpenAI or Gemini, server-side orchestration, controlled tools
- **Planned notifications:** Resend (email), WhatsApp Business provider, in-app alerts
- **Planned deployment:** GitHub + Vercel

No separate backend server, Payload CMS or Redis is used.

## Getting started

### Prerequisites

- Node.js 20 or newer (this project was built with Node 26)
- npm
- A Supabase project for the dashboard and sign-in

### Install and run

```bash
npm install
npm run dev
```

Open:

- Public website: <http://localhost:3000>
- Doctor sign in: <http://localhost:3000/login>
- Doctor dashboard: <http://localhost:3000/dashboard>

Without Supabase keys the public site works, while `/login` and `/dashboard` show a clear setup notice. No data is simulated.

### Connect Supabase

1. Create a project at <https://supabase.com>.
2. Copy the Project URL and keys from the **Connect** dialog or **Project
   Settings → API Keys**:
   - publishable key (`sb_publishable_…`) — safe in the browser
   - secret key (`sb_secret_…`) — server-only, bypasses RLS
3. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
SUPABASE_SECRET_KEY=sb_secret_YOUR_KEY
```

4. Apply the migrations in `supabase/migrations/` in filename order.
5. Create the doctor account and promote the profile to `doctor`.
6. Restart `npm run dev`.

Full instructions, including the doctor promotion SQL and RLS checks, are in [`supabase/README.md`](supabase/README.md).

> The secret key bypasses RLS. Keep it server-side, never commit it, and never
> prefix it with `NEXT_PUBLIC_`. The legacy `anon` / `service_role` names are
> still accepted, but Supabase is deprecating them by the end of 2026.

### Windows note

If PowerShell blocks `npm` with a script execution policy error, use `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm test` | Run the Node unit tests in `tests/` |

## Project structure

```
src/
  app/
    (public)/              Public website routes and booking Server Actions
    (auth)/login/          Doctor sign-in page and server action
    dashboard/             Protected doctor dashboard (appointments actions included)
    layout.tsx             Root layout, fonts, metadata (name comes from DB when configured)
    globals.css            Design tokens and base styles
  components/
    auth/                  Login form
    brand/                 Logo
    public/                Header, footer, page intro, cards, chat preview, booking form
    dashboard/             Sidebar, topbar, overview cards, settings/services screens, empty/setup states
    setup/                 Supabase setup notice
    ui/                    shadcn/ui primitives
  config/
    clinic.ts              Confirmed clinic defaults (typed fallback)
    app.ts                 App flags and version
    navigation.ts          Public and dashboard navigation
  lib/
    auth/                  Session types and server-side data access layer
    booking/               Public booking validation helpers
    clinic/                Settings/services validation, mapping, cached public content
    dashboard/             Dashboard view models, date helpers, validation and Supabase queries
    supabase/              Browser, public, server, admin clients; env config; proxy helper
    audit.ts               Server-only audit helper (secret client)
    utils.ts               cn() and initials() helpers
  proxy.ts                 Next.js 16 proxy: session refresh + dashboard protection
supabase/
  migrations/              Schema, RLS, functions, storage, seed, hardening, integrity constraints
  README.md                Project setup and verification steps
tests/                     Node unit tests for pure helpers and clinic rules
docs/                      Plan, QA report, deployment, architecture, schema, decisions
```

## Authentication

- Supabase Auth email/password sign-in at `/login`.
- No public sign-up. Accounts are created by invitation in the Supabase dashboard.
- Every new auth user starts as an **inactive** `staff` profile and must be
  activated by the doctor. The doctor role is promoted manually.
- The proxy refreshes the session and redirects unauthenticated visitors away from `/dashboard`.
- The dashboard layout and every data query re-check the session server-side. An
  authenticated account without an active profile fails closed.
- Sign-out is a Server Action that clears the Supabase session.
- RLS protects all 19 tables; clinical writes are doctor-only; bookings must go
  through the validated server function.

## Clinic configuration

Confirmed launch values are seeded into `clinic_settings` and mirrored as a typed
fallback in `src/config/clinic.ts`. From Milestone 3 the database is authoritative:

- Clinic name: Nissa Homeopathic Clinic
- Hours: 11:00 AM – 5:00 PM
- Appointment length: 45 minutes
- Daily capacity: 8 patients
- Working days: Monday to Saturday
- Booking approval: automatic
- Walk-ins: disabled
- Consultation fee: PKR 500
- Online consultations: enabled
- Follow-up reminder: 24 hours before

The following were **not supplied** and remain `NULL` until the owner configures them
in the doctor dashboard: timezone, address, phone number, email address and doctor name.
They are never invented in the UI. Until a timezone is set, the dashboard uses UTC and
shows a visible warning, and public online booking cannot know the clinic day. The owner
must set `timezone` before online booking opens. `/dashboard/settings` is editable by the doctor; `/dashboard/services`
manages the public catalogue. Both invalidate the `clinic-content` cache tag, so the
public pages refresh after a save.

## Data behaviour

- No preview or sample patient data exists in the codebase.
- The dashboard shows real counts, today's schedule, follow-ups, notifications and
  AI escalations from Supabase.
- Empty states are shown when there are no records.
- If the database tables are missing, a setup notice explains how to apply the
  migrations.
- If a query fails, the dashboard shows a generic error and logs details on the
  server only.
- Public pages read the database through a cached loader; when the database is
  missing they render the confirmed launch defaults. A service list with no rows
  shows an honest empty state.
- `/book` does not pretend to reserve slots until live Supabase configuration
  exists. Availability is checked in Postgres; success is shown only after the
  database function accepts the booking.
- Email, WhatsApp, AI and video calling remain visibly "not connected".

## Milestone 7 public-chat acceptance checks

- [x] Public chat exists and is visibly connected only when `OPENAI_API_KEY` and `OPENAI_MODEL` are configured
- [x] System prompt restricts the assistant to administrative help and approved clinic facts
- [x] Emergency and medical-advice messages are rejected by a local classifier before any model call
- [x] AI conversations and messages are persisted atomically when Supabase is configured
- [x] `/dashboard/ai-receptionist` lists the logged conversations read-only and highlights safety flags
- [x] AI keys remain server-side; no key is sent to client components
- [x] Unconfigured runtime disables input instead of faking an answer
- [x] Doctor-managed approved knowledge entries with server-side validation, RLS and audit events
- [x] Active approved knowledge entries are included in the assistant prompt when Supabase is configured
- [x] `/dashboard/ai-receptionist/knowledge` exists with doctor edit and staff read-only views
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `npm test` passes (53/53)
- [x] `npm run build` passes (22 routes)
- [ ] Live OpenAI request, safety cases and clinic-specific accuracy verified
- [ ] Conversation rows and approved knowledge entries appear in the review inbox/assistant
- [ ] Milestone 8 (AI booking tools and human handover) live end-to-end verified

## Milestone 8 acceptance checks

- [x] AI booking is implemented only through allow-listed backend tools
- [x] Human-handover workflow flags conversations as needing a human
- [x] The inbox can mark needs-human, assign to the current user, return to AI and close
- [x] Emergency and medical-advice messages escalate to `needs_human`
- [x] Tool calls are logged to `ai_messages` with tool name, arguments and result
- [x] AI keys remain server-side; no key is sent to client components
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `npm test` passes (54/54)
- [x] `npm run build` passes (22 routes)
- [ ] Live OpenAI tool-use booking and human handover are verified

## Milestone 6 follow-ups acceptance checks

- [x] `/dashboard/follow-ups` lists live follow-ups and filters by status
- [x] Overdue open follow-ups are highlighted
- [x] Complete and cancellation actions are implemented
- [x] Cancellation reason is required and capped at 500 characters
- [x] Actions lock the follow-up and write before/after audit rows in one transaction
- [x] Unconfigured and missing-migration states fail honestly
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `npm test` passes (45/45)
- [x] `npm run build` passes (21 routes)
- [ ] Live follow-up action round-trip and audit evidence verified
- [ ] Remaining Milestone 6 scope (patients, consultations, prescriptions, attachments) implemented

## Milestone 5 acceptance checks

- [x] Doctor and staff can view live appointments for a selected date
- [x] Date and status filters are server-rendered, bookmarkable GET parameters
- [x] Confirm, complete and cancellation actions are implemented
- [x] Cancellation reason is required and capped at 500 characters
- [x] Every action locks the appointment, validates the transition, writes an appointment event and appends an audit log row
- [x] Unconfigured and missing-migration states fail honestly
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `npm test` passes (39/39)
- [x] `npm run build` passes (21 routes)
- [ ] Live action round-trip and audit evidence verified

## Milestone 4 acceptance checks

- [x] `/book` page checks genuine availability through a database function before showing times
- [x] Booking goes through a Server Action with server-side validation and the service role
- [x] Postgres enforces working days, closures, timezone, hours, capacity and overlap
- [x] Website bookings reuse or create patient records and write audit entries
- [x] The unconfigured runtime and missing-timezone state render an honest unavailable message
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `npm test` passes (32/32)
- [x] `npm run build` passes (21 routes)
- [ ] Live anonymous booking run and capacity concurrency test

## Milestone 3 acceptance checks

- [x] Settings are editable in `/dashboard/settings` by the doctor; staff see read-only values
- [x] Services are manageable in `/dashboard/services` by the doctor; staff see read-only values
- [x] All writes go through Server Actions with server-side validation and role checks
- [x] RLS and database integrity constraints protect the rows independently of the UI
- [x] `audit_logs` wiring exists for settings updates and service create/update
- [x] Public pages read the database through one cached, tagged loader
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `npm test` passes (25/25)
- [x] `npm run build` passes (21 routes)
- [ ] Migrations applied to a live project; save round-trip and cache revalidation verified

## Milestone 2 acceptance checks

- [x] Supabase browser, server and service-role clients
- [x] Environment configuration with honest unconfigured state
- [x] Versioned migrations for 19 tables with keys, checks and indexes
- [x] RLS enabled on every table with doctor/staff/public policies
- [x] Doctor sign-in page, sign-out action and session data access layer
- [x] `/dashboard` protected by proxy and server-side session check
- [x] Private `patient-attachments` storage bucket and policies
- [x] Seed data for confirmed clinic settings, services and hours
- [x] Dashboard preview data removed; live queries and empty states
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `npm run build` passes (with and without Supabase env values)
- [ ] Migrations applied to a live project
- [ ] Doctor can sign in and out against the live project
- [ ] RLS verified with real requests
- [ ] Database tests pass

The last four items need the owner's Supabase project keys.

## Documentation

- [Project plan](docs/PROJECT_PLAN.md)
- [QA and security report](docs/QA_REPORT.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [Decisions](docs/DECISIONS.md)
- [Supabase setup](supabase/README.md)
- [Agent instructions](AGENTS.md)

## Next step

Provide the Supabase project URL, publishable key and secret key, apply all migrations
(through `20261105001100_ai_handover_actions.sql`), create and activate the
doctor account, and verify sign-in, sign-out and RLS. Then verify the settings/services
round trip, the public booking round trip, the appointment actions round trip, the
follow-ups round trip and one AI exchange including tool-use availability/booking and
handover. After that, decide the remaining Milestone 6 scope, then review Milestone 9 — notifications, reminders and feedback — and stop for review.
