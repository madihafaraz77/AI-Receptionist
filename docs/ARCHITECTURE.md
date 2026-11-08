# Architecture — Nissa Homeopathic Clinic

Last updated: Milestone 8 code delivered; AI booking tools, human handover and inbox controls are included. Live OpenAI/Supabase verification remains pending.

This document describes how the system is put together, where each responsibility
lives, and what is intentionally **not** built yet. Milestone 2 adds Supabase,
authentication and the database layer. Milestone 3 makes `clinic_settings`
editable and the source of truth for public pages. Milestones 4 and 5 add public
and dashboard appointment flows. Milestones 7 and 8 add the AI receptionist
and human handover.

## 1. System context

```
                    ┌──────────────────────────────┐
  Public visitor ──▶│  Next.js public website       │
  (browser)         │  /, /about, /services,        │
                    │  /book, /feedback, /contact   │
                    └──────────────┬───────────────┘
                                   │ server actions / route handlers (later)
                    ┌──────────────▼───────────────┐
  Doctor ──────────▶│  Next.js doctor dashboard     │
  (authenticated)   │  /dashboard/**                │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┼─────────────────────┐
              │                    │                     │
     ┌────────▼────────┐  ┌────────▼────────┐  ┌─────────▼─────────┐
     │ Supabase        │  │ AI provider      │  │ Notification      │
     │ Postgres + Auth │  │ (OpenAI/Gemini)  │  │ providers         │
     │ + Storage       │  │ server-side only │  │ Resend / WhatsApp │
     └─────────────────┘  └─────────────────┘  └───────────────────┘
```

There is **one deployable application**: the Next.js app. Supabase, the AI
provider and the notification providers are managed services called from the
server. No separate backend server, CMS, queue or Redis instance is planned for
the MVP.

## 2. Boundaries

| Boundary | Rule |
| --- | --- |
| Browser ↔ Next.js | Public pages have read-only content except the booking form. Booking goes through Server Actions and the database. Dashboard pages require an authenticated clinic session (implemented in Milestone 2). |
| Next.js ↔ Supabase | All writes go through server code or Postgres functions. The browser only ever holds the public URL and publishable key, and RLS still applies. The secret (or legacy service-role) key never leaves the server. |
| Next.js ↔ AI provider | API keys stay server-side. The model only receives the minimum context needed and can only call explicitly allowed tools. |
| Next.js ↔ notification providers | Server-side only. A message is shown as "sent" only after the provider accepts it. |
| Doctor ↔ clinical data | Only the doctor can create or modify consultations, prescriptions and clinical notes. The AI receptionist never sees unrestricted clinical records. |

## 3. Rendering model

- **App Router** with React Server Components by default.
- Public pages read `getPublicClinicContent()` from
  `src/lib/clinic/data.ts` through the cookie-less `src/lib/supabase/public.ts`
  client. The content is cached with `cacheLife("hours")` and tagged
  `clinic-content`, so every public page shares one read. Saving settings or
  services calls `updateTag(CLINIC_CONTENT_TAG)`.
- The dashboard reads the Supabase session and live clinic data on every request.
  `src/app/dashboard/layout.tsx`, `src/app/dashboard/page.tsx` and `/login` export
  `instant = false`, which tells Next.js 16 to render them per request instead of
  trying to include them in the static shell.
- Interactive UI (mobile sidebar sheet, dropdowns, tabs, tooltips) uses small
  client components. Data fetching and authorization stay on the server.
- Session refresh happens in `src/proxy.ts` (Next.js 16 renamed `middleware` to
  `proxy`). The proxy is a first line of defence only; the dashboard layout and
  the data access layer re-check the user server-side.
- `cacheComponents: true` is enabled in `next.config.ts`. Anything unstable
  (for example `new Date()` during prerender) must be avoided or explicitly
  deferred. This is why the footer does not print a dynamic year.

## 4. Folder structure

```
src/
  app/
    layout.tsx                 Root layout: fonts, metadata, providers
    globals.css                Design tokens, base styles, utilities
    icon.svg                   Brand favicon
    not-found.tsx              Branded 404
    (public)/                  Public route group
      layout.tsx               Header + footer shell
      page.tsx                 Home
      about/page.tsx
      services/page.tsx
      book/page.tsx            Public booking experience
      book/actions.ts          Availability + booking Server Actions
      online-consultation/page.tsx
      feedback/page.tsx        Honest "not open yet" feedback state
      contact/page.tsx
      ai-receptionist/page.tsx  Public AI receptionist page
      ai-receptionist/knowledge/page.tsx Approved AI knowledge-base screen
      ai-receptionist/knowledge/actions.ts Doctor-only knowledge Server Actions
      ai-receptionist/knowledge/knowledge-form.tsx
      ai-receptionist/actions.ts OpenAI-gated assistant Server Action with booking/handover tools
    (auth)/
      layout.tsx               Centred sign-in shell
      login/page.tsx           Sign-in page (setup notice when unconfigured)
      login/actions.ts         signInAction Server Action
    dashboard/                 Protected doctor dashboard
      layout.tsx               Session check + sidebar/topbar shell
      actions.ts               signOutAction Server Action
      page.tsx                 Overview with live Supabase data
      appointments/page.tsx    Live appointments workspace
      appointments/actions.ts  Confirm/complete/cancel Server Action
      patients/page.tsx
      consultations/page.tsx
      follow-ups/page.tsx      Live follow-up workspace
      follow-ups/actions.ts    Maintain follow-up status Server Action
      ai-receptionist/page.tsx
      feedback/page.tsx
      settings/page.tsx        Doctor-editable settings; staff read-only
      settings/actions.ts      Settings save action (role check + audit + revalidate)
      settings/settings-form.tsx
      services/page.tsx        Service catalogue management
      services/actions.ts      Service create/update actions (role check + audit)
      services/service-form.tsx
  components/
    auth/                      Login form
    brand/                     Logo
    public/                    Header, footer, page intro, cards, chat, booking form
    dashboard/                 Shell, cards, lists, badges, state notices, appointment/follow-up/AI conversation actions
    setup/                     Supabase setup notice
    ui/                        shadcn/ui primitives (owned locally)
  config/
    clinic.ts                  Confirmed clinic defaults (typed fallback)
    app.ts                     App flags, version, milestone label
    navigation.ts              Public + dashboard navigation
  lib/
    auth/
      session.ts               getCurrentUser / requireClinicUser (server only)
      types.ts                 SessionUser type safe for client components
    dashboard/
      data.ts                  Live Supabase queries + error classification
      types.ts                 Narrow dashboard view models
      date.ts                  Timezone-aware date/time formatting helpers
      validation.ts            Appointment and follow-up action validation
      ai.ts                    Live AI conversation inbox loader
    ai/
      config.ts                Server-only OpenAI environment detection
      knowledge.ts             Approved AI knowledge-base data access
      knowledge-validation.ts  Framework-free knowledge-entry validation
      safety.ts                Framework-free emergency and medical-advice classifier
    clinic/
      data.ts                  Public cached content + dashboard queries
      map.ts                   Database rows to narrow app models
      types.ts                 ClinicSettings and ClinicServiceRecord
      validation.ts            Framework-free settings/service validation
    booking/
      validation.ts            Framework-free slot and guest-details validation
    supabase/
      config.ts                Environment detection (isSupabaseConfigured)
      client.ts                Browser client (public keys only)
      public.ts                Cookie-less client for cached public content
      server.ts                Cookie-based server client (RSC + actions)
      admin.ts                 Service-role client (server only)
      proxy.ts                 Session refresh + /dashboard protection
    audit.ts                   Server-only audit log helper (secret client)
    utils.ts                   cn() and initials() helpers
  proxy.ts                     Next.js 16 proxy entry point
supabase/
  migrations/                  Schema, RLS, functions, storage, seed
  README.md                    Project setup, doctor promotion, RLS checks
docs/                          Plan, architecture, schema, decisions
```

### Why a route group?

`src/app/(public)/` groups the marketing site under one layout without adding a
URL segment. `/about` stays `/about`, not `/public/about`. The dashboard has its
own layout and never renders the public header or footer. `(auth)` does the same
for the sign-in page.

### Why config files and a database?

Milestone 1 had no Supabase project, so `src/config/clinic.ts` was the single
source of confirmed values. Milestone 2 seeds the same values into
`clinic_settings` (see `supabase/migrations/20261105000400_seed.sql`). Milestone 3
makes that table editable; from that point it is the source of truth for the
public website and the booking validation rules. The config file remains a
typed fallback for missing Supabase configuration, for stale build-time values
and for unit tests; it is never a second source of truth at runtime.

## 5. Key flows (planned)

### 5.0 Clinic settings and services save (implemented)

1. Doctor submits the settings form (or creates/edits a service).
2. The Server Action calls `getCurrentUser()` and refuses non-doctors.
3. `src/lib/clinic/validation.ts` checks every field on the server.
4. The action writes through the cookie-based client; RLS also restricts writes
   to the doctor (`clinic_settings_doctor_update`, `services_doctor_manage`).
5. The action writes an `audit_logs` row via `src/lib/audit.ts` (server-only
   service role) with `before` and `after` values.
6. The action calls `updateTag("clinic-content")` and `revalidatePath()`, so the
   public website and dashboard pages pick up the new values.
7. The public pages read the database through the cached
   `getPublicClinicContent()` function; if the database is missing or errors,
   they fall back to the confirmed `src/config/clinic.ts` defaults.

### 5.1 Public booking (implemented in Milestone 4; live verification pending)

1. Visitor chooses a date and an active service.
2. A Server Action calls `get_available_slots(...)`, which checks the clinic’s day, hours, closures, timezone, daily capacity and overlapping active appointments.
3. The visitor sees only genuine start times; same-day past times are excluded when a timezone is configured.
4. The visitor submits details through a Server Action; `src/lib/booking/validation.ts` validates every field on the server.
5. `create_website_booking(...)` creates or reuses an administrative patient record, then calls `create_appointment(...)`.
6. Capacity, overlap and ordering are enforced in Postgres. The unique index, exclusion constraint and advisory lock are the final guards.
7. The result screen states the real appointment status — `confirmed` for automatic approval, `pending` for manual approval — and does not claim an email was sent.
8. Booking writes are committed only after the database function succeeds.

Frontend checks are convenience only. Capacity and validation are enforced in
the database.

### 5.1a Dashboard appointment status changes (implemented; live verification pending)

1. `/dashboard/appointments` reads live rows through the RLS-protected cookie client.
2. The doctor or an active staff member selects confirm, complete or cancel.
3. A Server Action re-checks the caller is an active clinic user.
4. `set_appointment_status` (service-role only) locks the row, enforces the allowed transition, updates status/cancellation fields, inserts an `appointment_events` row and writes before/after `audit_logs`.
5. The event history and audit log are therefore consistent with the appointment row; the browser never updates the table directly.
6. Cancellation requires a reason with a 500-character limit and removes the slot from capacity.

### 5.2 AI receptionist (code complete; live verification pending)

1. A visitor sends a message on `/ai-receptionist`.
2. Safety is classified locally. Emergency or medical-advice messages, or an explicit human request, trigger `needs_human` and a safe local response; no model call is made for those requests.
3. Otherwise, the server sends the visitor message to the OpenAI Chat Completions API with an administrative-only system prompt and allow-listed tools.
4. The model may call:
   - `search_available_slots` — reads genuine availability through `get_available_slots`;
   - `create_ai_booking` — creates an appointment through `create_website_booking`;
   - `request_human_handover` — flags the conversation `needs_human`.
5. Every tool call executes server-side with the service role and is logged to the transcript as a `tool` `ai_messages` row with its name, arguments and result.
6. The visitor message is stored before the model runs; assistant and tool outputs are stored in order.
7. `/dashboard/ai-receptionist` lets the doctor or staff mark `needs_human`, assign to themselves (`handed_over`), return to AI, or close the conversation; all changes write an audit log.
8. `/dashboard/ai-receptionist/knowledge` lets the doctor manage approved knowledge entries; staff can read but not write them.
9. The assistant is administrative only. It cannot diagnose, prescribe or claim an appointment is confirmed until the booking tool returns success.
10. The secret AI key stays server-side; it is never exposed to the browser.

Frontend checks are convenience only; server-side validation remains required for mutations.

### 5.3 Doctor dashboard and authentication (auth implemented; data screens Milestones 5–6)

1. Doctor signs in at `/login` with Supabase email/password. There is no public
   sign-up; accounts are created by invitation in the Supabase dashboard.
2. `signInAction` validates input, calls `signInWithPassword`, returns a generic
   error on failure, and only redirects to internal `/dashboard` paths.
3. `src/proxy.ts` refreshes the Supabase session on every matched request and
   redirects unauthenticated visitors from `/dashboard` to `/login?next=…`.
4. `src/app/dashboard/layout.tsx` calls `requireClinicUser()` before rendering.
   If Supabase is not configured it renders the setup notice instead of crashing.
5. RLS ensures a clinic user can only read clinic data; clinical tables are
   doctor-only. The dashboard never receives the secret key.
6. Appointments, patients, consultations and follow-ups are read on the server
   through `src/lib/dashboard/data.ts`, which maps rows into narrow view models.
7. Clinical writes require an authenticated doctor role and are recorded in the
   audit log.
8. Sign-out is a Server Action that clears the Supabase cookies and redirects to
   `/login`.

### 5.4 Dashboard data states

The overview is built to be honest in every state:

| State | What the user sees |
| --- | --- |
| Supabase env missing | `SupabaseSetupNotice` with the setup steps |
| Tables missing (`42P01` / `PGRST205`) | `DatabaseSetupNotice` explaining migrations |
| Query failure | `DataErrorNotice`; details logged server-side only |
| No records | Real zero counts and empty lists, never sample patients |
| Timezone unset | UTC dates plus a visible warning |

### 5.5 Notifications and feedback (Milestone 9)

1. Booking, cancellation and follow-up events create notification rows.
2. A server worker (scheduled route or Supabase cron) sends email/WhatsApp.
3. Delivery status is stored per channel.
4. Feedback requests are sent after a completed consultation.
5. The doctor can review and respond to feedback in the dashboard.

## 6. Security model

- **Authentication:** Supabase Auth, clinic-only dashboard. Public sign-up is
  disabled. New profiles start as **inactive** `staff` and are activated by the
  doctor; the doctor role is promoted manually. The dashboard fails closed when
  an authenticated account has no active profile.
- **Authorization:** Row Level Security on every table. Public read access is
  limited to active services and public clinic information (settings, hours,
  closures). Appointment writes are server-only: the insert/update policies are
  removed and `create_appointment` is granted to `service_role` only.
- **Roles:** `doctor` and `staff` in `profiles`. Clinical writes are doctor-only.
- **Secrets:** only server environment variables. `NEXT_PUBLIC_*` is limited to
  the Supabase URL and publishable key. Secret, service-role and AI keys are
  never prefixed with `NEXT_PUBLIC_`.
- **AI persistence:** conversation, message, tool and handover writes are
  service-role only, so the browser cannot forge transcript rows or status transitions.
- **Storage:** private buckets for patient attachments, with signed URLs and RLS
  policies.
- **Audit:** `audit_logs` records sensitive actions (booking changes, clinical
  writes, settings changes, AI escalations).
- **AI safety:** restricted prompt, local emergency/medical-advice classifier, no clinical record access, no diagnosis or prescribing, human handover path.
- **Validation:** server-side validation in `src/lib/clinic/validation.ts` and
  `src/lib/booking/validation.ts` (framework-free) plus database check constraints and
  Postgres functions. Never trust client input.

## 7. Environment and deployment

- Local development: `npm run dev` on Node 20+.
- Production: Vercel, with environment variables configured per environment.
- Database changes: versioned SQL migrations in `supabase/migrations/` (added in
  Milestone 2), applied consistently to local and production projects.
- Quality gates: `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`, plus database/RLS tests once Supabase exists.

## 8. What exists today (end of Milestone 8 code complete)

- Static public pages with a branded 404 and the full design system.
- Public AI receptionist chat gated by server-side `OPENAI_API_KEY`/`OPENAI_MODEL`,
  with a restricted prompt, local safety refusal, transactional conversation logging,
  controlled booking tools, human handover and a dashboard review inbox with assignment and close controls.
- Doctor-managed AI knowledge base for clinic-approved facts; entries feed the assistant prompt and remain auditable when inactive.
- Public pages read clinic settings and active services through a cached,
  tagged loader (`getPublicClinicContent`); the public header, footer, metadata
  and all eight content pages use the database when available and the confirmed
  config fallback otherwise.
- Doctor-editable clinic settings and service catalogue with server-side
  validation, role checks, RLS and audit logging.
- Public booking: `/book` can check genuine availability and submit a booking
  request. It requires live Supabase configuration, a timezone and at least
  one active service; otherwise it renders an honest unavailable state.
- Dashboard appointments workspace: live rows, date/status filters, capacity,
  and confirm/complete/cancel actions that are validated server-side.
- Dashboard follow-ups workspace: live rows, status filter, overdue indicator,
  complete/cancel actions with a required reason and an audit log row.
- Supabase browser, public, server and service-role clients plus environment detection.
- Supabase Auth sign-in, sign-out, `src/proxy.ts` session refresh and
  server-side route protection.
- Versioned migrations for 19 tables plus a patient-reference sequence: enums,
  keys, checks, indexes, triggers, RLS on every table, private storage bucket,
  seed data, the Milestone 3 integrity constraints, Milestone 4 booking functions,
  Milestone 5 appointment-status functions, Milestone 6 follow-up-status functions,
  Milestone 7 AI-conversation-logging and AI-message functions, and Milestone 8
  handover/tool-message functions.
- A capacity-safe `create_appointment` Postgres function reserved for the
  service role, now with overlap protection and a timezone-aware past-date check.
- Dashboard overview and appointment workspace reading live Supabase data with
  setup, migration, error and empty states. No sample patient data exists anywhere in the codebase.
- Milestone 10 hardening: inactive-by-default profiles, fail-closed dashboard
  access, server-only booking writes, overlap exclusion constraint and standard
  HTTP security headers.
- Still missing: patient registration, attachments, consultation notes,
  prescriptions, clinician follow-up creation, notifications, email, WhatsApp,
  feedback workflow and video calling.

## 9. What Milestone 8 does not verify yet

Live behaviour is blocked until the owner supplies OpenAI and Supabase credentials:

- OpenAI chat and the controlled tool-use loop have not been exercised against the provider.
- The AI booking tool has not created a real appointment.
- The human handover flow (`needs_human` → assigned → closed) has not been exercised with real browsers and sessions.
- Clinic-specific answers, conversation logging, tool traces and audit rows have not been observed against a live database.

Both Supabase and OpenAI remain unverified in this environment:

- The thirteen migrations have not been applied to a real project.
- The follow-ups screen has not been exercised against a live database.
- The complete and cancel functions for follow-ups have not been run against a live database.
- `follow_up.completed` and `follow_up.cancelled` audit rows have not been observed.
- The dashboard appointments workspace has not been exercised against a live database.
- The confirm, complete and cancel functions for appointments have not been run against a live database.
- Confirmation, completion and cancellation events and audit rows have not been observed.
- The public `/book` form has not been exercised end-to-end.
- Saving settings or services has not been exercised against the live database.
- Sign-in/sign-out has not been exercised against real Supabase Auth.
- RLS has not been tested with anonymous, inactive, staff and doctor requests.
- The `patient.created` and `appointment.created` audit rows have not been observed.
- The `get_available_slots` function has not been run against real data.
- The cache revalidation after a dashboard save has not been observed.
- The overlap exclusion constraint has not been executed against a live database.
- Cancellation is implemented for pending and confirmed appointments; rescheduling and no-shows are not implemented.
- Email/WhatsApp delivery and patient notifications are not connected; reminder cron writes only queued dashboard rows.

The app fails honestly in this state: `/login` and `/dashboard` show a setup
notice, and nothing is simulated.

## 10. Non-goals for the MVP

- Multi-clinic tenancy.
- Patient self-service accounts.
- Payments or online card processing.
- Insurance or claim processing.
- Native mobile apps.
- Video calling infrastructure (online consultations are coordinated, not hosted,
  unless a provider is explicitly added later).
- Diagnosing, prescribing or interpreting reports through AI.
