# Nissa Clinic — Project Plan

Last updated: Full milestone audit run (9 November 2026). Lint/typecheck/54 unit tests/production build pass; 14 Supabase migrations are applied to the live project with hardened function grants and RLS. Vercel production deployment exists. Remaining work is owner-configured/live verification (timezone, OpenAI, `CRON_SECRET` in production, Email/WhatsApp providers, staff-session RLS proof, booking concurrency/acceptance), not missing feature code.

## Status legend

- **Not started**
- **In progress**
- **Completed**
- **Blocked**

## Milestone tracker

| # | Milestone | Status | Notes |
| --- | --- | --- | --- |
| 1 | Project foundation | **Completed** | Next.js shell, design system, public site, dashboard shell, docs |
| 2 | Supabase & authentication | **In progress** | Code, migrations, RLS and auth complete; live verification needs project keys |
| 3 | Clinic settings & services | **In progress** | Code complete: doctor-managed settings and services, server validation, audit log, cached public content. Live save/RLS verification needs project keys |
| 4 | Appointment booking | **In progress** | Public booking code complete: genuine availability check, transactional reservation, patient creation reuse, website source bookings. Live end-to-end booking needs project keys |
| 5 | Doctor dashboard data | **In progress** | Appointments workspace code complete: live list, date/status filters, confirm/complete/cancel actions. Live action verification needs project keys |
| 6 | Patient & consultation management | **Mostly complete** | 14 migrations applied; grants hardened; patient/consultation/prescription/attachment browser flows verified on production. DB function verified for consultation+prescription+follow-up. Open: create a follow-up in UI and confirm it appears in `/dashboard/follow-ups`; verify staff cannot read clinical rows with a real staff session (RLS policies restrict consultations/prescriptions to `is_doctor()`) |
| 7 | AI receptionist | **In progress (code complete)** | Public chat, logging, review inbox and approved knowledge-base management complete. AI booking/handover remain Milestone 8; live provider/DB checks pending |
| 8 | AI booking & human handover | **In progress (code complete)** | Controlled booking tools, human handover workflow, needs-human/handover/close controls and transcript logging implemented. Live end-to-end verification pending |
| 9 | Notifications, reminders & feedback workflow | **In progress (code complete)** | In-app reminder worker, private feedback submission and doctor review implemented. Email/WhatsApp delivery remains not connected |
| 10 | Testing & deployment | **In progress (blocked)** | QA pass on delivered scope complete; full testing needs 3–9 and a live Supabase project |

> Audit (9 November 2026): Milestones 1–9 feature code is present; lint,
> typecheck, 54 tests and production build pass. The live Supabase project has
> 14 migrations, hardened grants and RLS; doctor sign-in and core browser flows
> were verified. No new code bugs were found. Remaining items are owner-supplied
> configuration/live evidence (timezone, OpenAI, production `CRON_SECRET`,
> Email/WhatsApp delivery, staff-session RLS proof, booking
> concurrency/acceptance), not missing feature code. Email and WhatsApp remain
> intentionally unconnected.

## Milestone 1 — Project Foundation

### Delivered

- Inspected the existing repository: only an empty placeholder `index.html` and a git repo. Scaffolded a fresh Next.js 16 app at the repository root.
- Configured TypeScript, Tailwind CSS v4, ESLint and shadcn/ui (Radix, Lucide).
- Established the design system: evergreen/sage/cream palette, Fraunces display font, Geist UI font, soft shadows, rounded surfaces, responsive spacing.
- Built the public website shell:
  - Home with hero, approach, how-it-works, services, AI receptionist preview and closing CTA.
  - About, Services, Appointment Booking, Online Consultation, Feedback, Contact and AI Receptionist pages.
- Built the doctor dashboard shell:
  - Desktop sidebar and mobile sheet navigation.
  - Sticky topbar with page title, preview badge, search placeholder, notification link and account menu.
  - Overview with stat cards, today's schedule, daily capacity, quick actions, follow-ups, AI attention and notification cards.
  - Module placeholder pages for appointments, patients, consultations, follow-ups, AI receptionist and feedback.
  - Read-only clinic settings preview showing all confirmed defaults and missing values.
- Centralised clinic configuration in `src/config/clinic.ts`.
- Added clearly-labelled preview data in `src/lib/preview-data.ts` (no fake integrations).
- Added a branded not-found page and favicon.
- Created `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, `docs/DECISIONS.md`, `.env.example`.

### Acceptance checks

- [x] App runs with `npm run dev`.
- [x] All public and dashboard routes compile and prerender.
- [x] Responsive layouts (mobile sidebar sheet, stacked grids, scrollable tables).
- [x] Design system is reused consistently.
- [x] Clinic information is centralised and no unsupplied details are invented.
- [x] No fake booking, AI, email, WhatsApp or video-calling behaviour.
- [x] `npm run lint` — passes with no warnings.
- [x] `npm run typecheck` — passes.
- [x] `npm run build` — passes; all 18 routes generated (including `/icon.svg`).
- [x] Documentation updated.

### Known limitations (as of Milestone 1 — several resolved in Milestone 2)

- No database, auth, booking engine, AI provider, email, WhatsApp or video integration. (Supabase and auth were added in Milestone 2.)
- Dashboard data was sample data behind a visible preview banner. (Removed in Milestone 2; the dashboard now uses live queries.)
- Booking, feedback and AI chat interfaces are disabled/illustrative.
- Clinic address, phone, email, doctor name and timezone are not supplied and remain `null`.
- No dark-mode toggle is exposed (dark tokens exist for future use).

## Milestone 2 — Supabase & Authentication

### Delivered (code complete)

- Added `@supabase/supabase-js`, `@supabase/ssr` and `server-only`.
- Environment configuration in `src/lib/supabase/config.ts` with an honest
  "not configured" state. The app never fakes a connection.
- Supabase clients:
  - `src/lib/supabase/client.ts` — browser client (public keys only).
  - `src/lib/supabase/server.ts` — cookie-based server client for RSC, actions
    and route handlers.
  - `src/lib/supabase/admin.ts` — server-only service-role client.
- Auth:
  - `/login` with a Server Action (`signInAction`), generic error messages and
    safe post-login redirects.
  - Sign-out Server Action in `src/app/dashboard/actions.ts`.
  - Session data access layer in `src/lib/auth/session.ts` (`getCurrentUser`,
    `requireClinicUser`).
  - Next.js 16 `src/proxy.ts` refreshes the session and protects `/dashboard`.
  - Dashboard layout re-checks the session server-side.
- Database migrations in `supabase/migrations/`:
  - 19 tables with UUID keys, foreign keys, checks, indexes and timestamps.
  - Enumerated types matching the planned schema.
  - Auth trigger that creates a `staff` profile for every new user.
  - RLS on every table, with public read limited to published clinic
    information, clinic-user access for operations, and doctor-only clinical
    writes.
  - Capacity-safe `create_appointment` and `log_audit_event` functions.
  - Private `patient-attachments` storage bucket with size/MIME limits and
    policies.
  - Seed data for confirmed clinic settings, three services and clinic hours.
    Contact details, doctor name and timezone stay `NULL`.
- Dashboard data:
  - Removed `src/lib/preview-data.ts` and the preview banner.
  - Added typed view models in `src/lib/dashboard/types.ts`.
  - Added live queries in `src/lib/dashboard/data.ts` with empty, setup,
    migration and error states.
  - Overview now shows real counts, today's schedule, capacity, follow-ups,
    notifications and AI escalations.
  - UTC fallback with a visible warning until a timezone is configured.
- Updated `README.md`, `.env.example`, architecture, schema and decision docs.
- Added `supabase/README.md` with project, migration, doctor-account and RLS
  verification steps.

### Checks run locally

- `npm run lint` — passes.
- `npm run typecheck` — passes.
- `npm run build` — passes without Supabase env (20 routes) and with dummy
  Supabase env (all `/dashboard` routes become dynamic).
- Production server on port 3100: `/`, `/about`, `/services`, `/book`,
  `/online-consultation`, `/feedback`, `/contact`, `/ai-receptionist`, `/login`,
  `/dashboard`, `/dashboard/appointments` and `/dashboard/settings` return 200;
  an unknown route returns 404.
- Unconfigured runtime: `/login` and `/dashboard` show "Connect Supabase to
  continue", the topbar shows "Setup required", and no sample data appears.

### Pending verification (requires the owner's Supabase project)

1. Create the Supabase project and add the three environment variables.
2. Disable public sign-up in Supabase Auth.
3. Apply all migrations (currently thirteen) to the live project.
4. Create the doctor auth account, promote the profile to `doctor` and set
   `is_active = true`.
5. Confirm sign-in, sign-out, inactive-account refusal and dashboard redirects.
6. Verify RLS as anonymous, inactive, staff and doctor.
7. Confirm the dashboard renders empty states, then real records.

### Exit criteria

- [x] Supabase clients and environment configuration exist.
- [x] Migrations, RLS, storage and seed data are versioned.
- [x] Doctor sign-in/out UI and server actions exist.
- [x] Dashboard routes are protected by proxy and server-side checks.
- [x] Preview data is removed; dashboard uses live queries and empty states.
- [x] `npm run lint`, `npm run typecheck` and `npm run build` pass.
- [ ] Migrations run cleanly on the live project.
- [ ] Doctor can sign in and out against the live project.
- [ ] RLS is verified with real requests.
- [ ] Database tests pass.

## Milestone 3 — Clinic settings & services

### Delivered (code complete)

- Clinic settings are now editable by the doctor and stored in
  `public.clinic_settings`, which is the source of truth for the public website
  and booking rules.
- New dashboard settings screen (`/dashboard/settings`):
  - Clinic identity (name, doctor name, phone, email, address, timezone).
  - Schedule and capacity (opening/closing time, appointment length, daily
    capacity, working weekdays, booking approval, walk-ins).
  - Consultation fee, online consultation toggle and follow-up reminder window.
  - Live `updated_at` display and a clear success/error state.
  - Staff see the same values read-only; RLS also blocks their writes.
- New services screen (`/dashboard/services`):
  - The doctor can create, edit and archive services (slug, description,
    duration, fee, mode, sort order, visibility).
  - Archived services disappear from the public site but keep their records.
  - Staff see the catalogue without edit controls.
- Server-side validation in `src/lib/clinic/validation.ts`:
  - Pure functions (`parseClinicSettingsForm`, `parseServiceForm`) used by the
    Server Actions. The browser never decides whether a value is acceptable.
  - 12 new unit tests cover ranges, times, weekdays, timezones, email, phone,
    slugs and descriptions.
- Database integrity: migration
  `20261105000600_clinic_settings_services_constraints.sql` adds matching check
  constraints for settings and services, so the rules also hold outside the app.
- Data access:
  - `src/lib/clinic/data.ts` provides `getDashboardClinicSettings`,
    `getDashboardServices` and a cached `getPublicClinicContent`.
  - `src/lib/clinic/map.ts` converts database rows to app models without
    leaking internal fields to public pages.
  - `src/lib/supabase/public.ts` is a cookie-less anon client so public content
    can be cached safely.
- Audit logging: every settings save, service create and service update calls
  `log_audit_event` with before/after values through the server-only secret
  client. A missing secret key logs a warning and does not undo the change.
- Public site now reads the database:
  - Header, footer, home, about, services, contact, book, online-consultation
    and AI receptionist pages use `getPublicClinicContent()`.
  - Content is cached with `cacheLife("hours")` and tagged `clinic-content`;
    saving in the dashboard invalidates the tag and refreshes the public pages.
  - When Supabase is not configured or the tables are missing, the confirmed
    `src/config/clinic.ts` defaults are used and nothing is invented.
  - Document metadata also follows the configured clinic name.
- Honest empty states: a service list with no rows shows a labelled empty state
  instead of sample data. Online-consultation wording follows the setting.
- No new environment variables and no secret key reaches the client.

### Checks run locally

- `npm run lint` — passes.
- `npm run typecheck` — passes.
- `npm test` — 25 tests pass (13 existing + 12 new).
- `npm run build` — passes; 21 routes generated (adds `/dashboard/services`),
  all public pages are cached for one hour.
- Production smoke test on `npm start`: `/`, `/about`, `/services`, `/contact`,
  `/book`, `/online-consultation`, `/ai-receptionist`, `/feedback`, `/login`,
  `/dashboard`, `/dashboard/settings` and `/dashboard/services` return 200.
- Unconfigured runtime: the dashboard still shows "Connect Supabase to continue";
  the public site renders the confirmed launch defaults with real values.

### Pending verification (requires the owner's Supabase project)

1. Apply all migrations (`20261105000000` through
   `20261105000600_clinic_settings_services_constraints.sql`) to the live
   project.
2. Sign in as the doctor, save settings, and confirm the public pages refresh
   after the tagged cache is revalidated.
3. Confirm a staff account can read settings and active services but cannot
   write them.
4. Confirm archived services disappear publicly and that duplicate slugs are
   rejected.
5. Confirm `audit_logs` receives `settings.updated`, `service.created` and
   `service.updated` rows (requires `SUPABASE_SECRET_KEY`).

### Exit criteria

- [x] Settings and services are editable in the dashboard.
- [x] The database is the source of truth for public content and booking rules.
- [x] Validation, authorization and integrity checks run server-side.
- [x] Public pages show database content with an honest fallback.
- [x] Loading, empty, success and error states exist.
- [x] Audit logging is wired without exposing secrets.
- [x] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.
- [ ] Live settings save, RLS and cache revalidation are verified.

## Milestone 4 — Appointment booking

### Delivered (code complete)

- `/book` is now a real booking experience, not an illustrative page.
  - It checks whether online booking can run at all before rendering the form.
  - It requires the Supabase secret key, live database content, a configured
    timezone and at least one active service. Otherwise it shows an honest
    unavailable state and does not pretend a slot was reserved.
- Availability is checked by the database, not inferred in the browser:
  - `get_available_slots(date, mode)` returns only genuine start times.
  - It enforces working days, closures, clinic hours, a 90-day booking window,
    same-day past times, daily capacity and overlapping active appointments.
  - It requires a configured `clinic_settings.timezone`; without one the
    function knows no safe clinic day/time and returns nothing.
- `/book` includes a validated form:
  - pick an active service and date to see real openings;
  - select one of the returned times;
  - provide full name, phone, optional email and optional non-clinical notes;
  - submit through a Server Action.
- The `create_website_booking` Postgres function:
  - validates name, phone, email, notes, service and date;
  - reuses or creates an administrative patient by normalized phone;
  - calls `create_appointment` with `source = 'website'`;
  - returns either a pending request or an automatic appointment confirmation.
- `create_appointment` now raises a friendly `SLOT_TAKEN` for overlapping
  active appointments instead of relying only on the exclusion constraint.
- Two audit events are written for a new booking:
  - `patient.created` when a patient record is created;
  - `appointment.created` when the booking succeeds.
- The booking form states that email/WhatsApp confirmations are not connected
  and that the on-screen reference is the authoritative result.
- Unit tests cover booking and availability validation.

### Checks run locally

- `npm run lint` — passes.
- `npm run typecheck` — passes.
- `npm test` — 32 tests pass.
- `npm run build` — passes; 21 routes generated.
- Production smoke test on `npm start`: `/book`, `/dashboard` and `/login`
  return 200; unconfigured `/book` honestly shows the setup state.

### Pending verification (requires the owner's Supabase project)

1. Apply all current migrations (through `20261105001200_patient_consultation_creation.sql`), including the Milestone 4 public-booking, Milestone 5 appointment-status, Milestone 6 follow-up-status, Milestone 7 AI-logging and AI-message functions.
2. Set `clinic_settings.timezone` (for example `Asia/Karachi`).
3. Connect the secret key and confirm `/book` shows genuine openings.
4. Verify availability excludes past times, closed days, an existing pending or
   confirmed appointment, an overlapping slot and a full date.
5. Book an appointment as an anonymous visitor and confirm the dashboard
   shows it with the correct status (`pending` for manual approval,
   `confirmed` for automatic approval).
6. Verify a non-doctor cannot write bookings through PostgREST.

### Exit criteria

- [x] Public visitors can request/confirm an appointment through a validated server flow.
- [x] Genuine availability is checked by the database.
- [x] Capacity, overlap, closed days, closures and timezone are enforced server-side.
- [x] Server actions validate inputs and never trust the browser.
- [x] Loading, success, unavailable and error states exist.
- [x] Audit wiring exists for appointment and patient creation.
- [x] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.
- [ ] Live anonymous booking and capacity concurrency are verified.

## Milestone 5 — Doctor dashboard data

### Delivered (code complete)

- `/dashboard/appointments` is now a live appointment workspace instead of a placeholder.
  - Defaults to the clinic’s “today” once a timezone is configured; otherwise uses UTC with a visible warning.
  - A GET form filters by appointment date and status: all, pending, confirmed, completed, cancelled, no-show and rescheduled.
  - Previous/Next navigation keeps the selected status filter.
  - Appointments show time range, patient name and reference, patient phone, service, fee, source, type, visitor notes and status.
  - Capacity used vs configured daily capacity is shown.
- Staff and doctor can change appointment status:
  - confirm a pending appointment;
  - mark a pending or confirmed appointment completed;
  - cancel a pending or confirmed appointment with a required reason.
- Status changes go through a Postgres function (`set_appointment_status`) called by the server with the service role after the session and role are checked.
  - It locks the appointment row, enforces valid transitions, updates the appointment,
    inserts an appointment event, and writes before/after audit rows in one transaction.
  - Cancellation reason is capped at 500 characters.
  - `completed` or `cancelled` appointments are not silently re-transitioned.
- A `GET` filter form is bookmarkable, and the dashboard layout still re-checks the session server-side.
- Unit tests cover appointment-action validation.

### Checks run locally

- `npm run lint` — passes.
- `npm run typecheck` — passes.
- `npm test` — 39 tests pass.
- `npm run build` — passes; 21 routes generated.
- Production smoke test on `npm start`: `/dashboard/appointments`, `/dashboard` and `/book`
  return 200; the unconfigured dashboard honestly shows setup guidance.
- The generated `.next` build cache was deleted with user approval because OneDrive exposed it as a read-only reparse placeholder.

### Pending verification (requires the owner's Supabase project)

1. Apply all current migrations (through `20261105001200_patient_consultation_creation.sql`), including `20261105000800_appointment_status_actions.sql`.
2. Set the clinic timezone in Clinic Settings.
3. Sign in as the doctor or an invited staff account and confirm the selected date and status filters query live rows.
4. Confirm a pending booking becomes confirmed; an event `confirmed` and `appointment.confirmed` audit row must appear.
5. Mark a booking completed; an event `completed` and `appointment.completed` audit row must appear.
6. Cancel with a reason; capacity must be released, an event `cancelled` and an `appointment.cancelled` audit row must appear, and the reason must be visible to the clinic.
7. Attempt to complete/cancel a completed appointment and confirm it is rejected with a clear message.

### Exit criteria

- [x] Doctor and staff can view appointments for a selected date.
- [x] Status, date and navigation filters work server-side.
- [x] Confirm, complete and cancellation actions exist with validation.
- [x] Status changes are transactional and audited.
- [x] Loading, empty, unconfigured and error states are handled.
- [x] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.
- [ ] Live action round-trip and audit evidence are verified.

## Milestone 6 — Patient & consultation management

### Scope chosen by the owner

> The requested Milestone 6 work after the follow-ups slice is the remaining clinical and administrative foundation: patient registration/list, consultation records, prescriptions, follow-up creation, and private attachments. It is code-complete and the database functions have been verified live.

### Delivered (code complete)

- `/dashboard/follow-ups` is no longer a placeholder.
- `/dashboard/patients` includes:
  - searchable patient list;
  - add-patient form;
  - administrative details, including email and non-clinical notes;
  - private attachment upload;
  - attachment listing with short-lived signed URLs;
  - patient references are generated atomically through `patient_reference_seq`.
- `/dashboard/consultations` includes:
  - doctor-only consultation creation;
  - optional prescription creation;
  - optional follow-up creation;
  - recent consultation history;
  - plan/prescription/follow-up badges.
- `create_patient_record(...)` and `create_consultation_record(...)` are service-role-only Postgres transactions.
- Follow-up creation from a consultation is linked through `consultation_id`.
- UTC fallback with a visible warning when the clinic timezone is configured.
- Query results are never faked; unconfigured/error/empty states remain honest.

### Checks run locally

- `npm run lint` — passes.
- `npm run typecheck` — passes.
- `npm test` — 54 tests pass.
- `npm run build` — passes; 23 routes generated.
- Production smoke test on `npm start`: `/dashboard/patients`, `/dashboard/consultations`, `/dashboard/follow-ups` and `/dashboard` return 200; unconfigured dashboard shows setup guidance.

### Pending verification

1. ~~Apply all current migrations (through `20261105001200_patient_consultation_creation.sql`), including the patient and consultation creation functions.~~ **Done** — migrations 10–13 applied to the live project; grants hardened so every application function is service-role only.
2. ~~Create a patient and verify the generated reference, date-of-birth validation, duplicate flow and audit row.~~ **Done** — verified live in a real browser: a patient was created through the form with a `NIS-####` reference, date of birth accepted, and the audit row written.
3. ~~Upload a PDF and image attachment through the browser; confirm only a clinic user can obtain a signed URL.~~ **Done** — an image upload through the patient form stored the file privately and produced a working signed link.
4. ~~As the doctor, record a consultation linked to a confirmed appointment; add a prescription and follow-up date.~~ **Done** — the doctor recorded a consultation with a prescription through the live UI; a second consultation for the same appointment was refused with a readable error.
5. Verify the linked follow-up appears in `/dashboard/follow-ups` — **still open** (no follow-up date was set in the test, so nothing was created).
6. Confirm staff booking users cannot insert or read clinical consultation rows — **still open**.

`create_consultation_record` was also verified live in the same rolled-back transaction (consultation + prescription + follow-up rows created).

### Live browser test fixes (8 November 2026)

The first real-browser pass on the production deployment found three defects that
lint, typecheck, unit tests and the build did not catch, all now fixed:

- Every `useActionState` form returned a 500 because `"use server"` modules
  exported their `initial…State` object. State types and initial values now live
  in per-feature `action-state.ts` modules.
- `isDateKey` dropped the year when destructuring `value.split("-")`, so every
  date of birth was rejected. Fixed in three action files.
- Supabase Auth read `Date.now()` while the dashboard was prerendering;
  `requireClinicUser()` now awaits `connection()` first.

See `docs/QA_REPORT.md` for the full live test table.

### Not implemented

- Live verification of patient attachments with real signed URLs (needs an authenticated doctor session).
- Follow-up reminders are implemented in Milestone 9 for the dashboard; email/WhatsApp delivery remains unavailable.
- Consultation rescheduling/no-show is not implemented.

### Exit criteria

- [x] Patient registration/list is implemented.
- [x] Consultation, prescription and follow-up scheduling are implemented.
- [x] Attachments are stored in a private bucket and never exposed without signed URLs.
- [x] Role checks, RLS and server-side validation exist.
- [x] Unit tests, lint, typecheck and build pass.
- [x] Live database functions create a patient, consultation, prescription and follow-up correctly.
- [x] Browser-level patient, attachment and consultation flow verified with a real doctor account on production.
- [ ] Linked follow-up appearing in `/dashboard/follow-ups` and staff-vs-doctor access still need a pass.

## Milestone 7 — AI receptionist (public chat pass)

### Scope completed in the Milestone 7 passes

> This pass completed: **public Chat, conversation logging, the read-only review
> inbox and approved knowledge-base management**. AI booking tools and human
> handover remain Milestone 8. This milestone is code-complete but not live-verified.

### Delivered (code complete)

- `/ai-receptionist` now renders a real assistant, not an illustrative preview, when OpenAI is configured.
- The chat client:
  - shows a visible "Connected" or "Not connected" badge;
  - keeps a short client-side history for this pass;
  - sends at most 500 characters per question and keeps only the last eight turns for context;
  - disables input entirely when `OPENAI_API_KEY` or `OPENAI_MODEL` is missing;
  - shows the assistant's real response or an honest error, never a fabricated success.
- The server action:
  - builds a restricted system prompt from the cached public clinic content (name, hours, working days, duration, fee, approval, walk-ins, online consultation, timezone, contact details and active services);
  - forbids diagnosis, report interpretation, prescriptions, invented clinic facts, and fake booking confirmation;
  - tells visitors to use `/book` for appointments;
  - calls the OpenAI Chat Completions endpoint server-side with the configured model;
  - returns concise factual answers or a safe refusal/clarification.
- Conversation persistence and review inbox:
  - the public client carries a browser-session conversation ID to the server;
  - `log_ai_conversation_exchange` creates the `ai_conversations` row once, updates `last_message_at`, and atomically writes one visitor message and one assistant message;
  - safety flags are stored beside the visitor/assistant messages when the local classifier triggered;
  - Supabase persistence failure never creates a fabricated success or crash for the visitor; the response says whether the assistant output was recorded or not;
  - a missing Supabase secret key is shown visibly as “not recording this conversation”, while the OpenAI key may still allow answers.
- `/dashboard/ai-receptionist` is now a live read-only review inbox:
  - lists logged website conversations, newest first;
  - filters by active/needs-human/handed-over/closed status with a GET form;
  - shows visitor content, assistant responses, timestamps and safety flags;
  - displays conversation totals and flagged-message count;
  - remains read-only; reply, assign and close actions are not implemented.
- `/dashboard/ai-receptionist/knowledge` manages doctor-approved knowledge entries:
  - list entries with title, category, active/inactive state and content preview;
  - create/edit with title, category (`hours`, `services`, `fees`, `policies`, `faq`), 20–2000 character factual content and active/inactive visibility;
  - inactive entries are excluded from the assistant prompt but remain available for audit/review;
  - doctor-only Server Actions with RLS, validation and audit events (`ai_knowledge.created`, `ai_knowledge.updated`);
  - staff can read approved entries but cannot write them.
- The OpenAI prompt now includes active approved knowledge entries when Supabase is configured, alongside confirmed clinic settings and services.
- Safety classifier in `src/lib/ai/safety.ts`:
  - emergency language returns a local emergency refusal before any model call;
  - medical-advice requests are refused before any model call;
  - unit tests cover representative examples.
- No secret or API key is exposed to the browser or client-side code.

### Checks run locally

- `npm run lint` — passes.
- `npm run typecheck` — passes.
- `npm test` — 53 tests pass.
- `npm run build` — passes; 22 routes generated.
- Production smoke test on `npm start`: `/ai-receptionist`, `/dashboard/ai-receptionist`,
  `/dashboard/ai-receptionist/knowledge` and `/dashboard` return 200; without keys,
  the public chat reports not connected and inputs are disabled.

### Pending verification

1. Configure `OPENAI_API_KEY` and `OPENAI_MODEL` on the server.
2. Verify answers about hours, services, fees, walk-ins, online consultations, booking approval and closures against live `clinic_settings` and `services`.
3. Verify the prompt does not diagnose, prescribe, interpret reports or claim a booking is confirmed.
4. Verify emergency and medical-advice messages receive local safe refusals.
5. Create an approved knowledge entry as the doctor; one assistant answer must use it in clinic content.
6. Deactivate it and confirm subsequent responses do not rely on it.
7. Verify `/dashboard/ai-receptionist` lists real logged exchanges.

### Not implemented in this pass

- Direct reply from the dashboard to the visitor (no delivery channel exists).
- Notifications for flagged conversations, Urdu/Roman Urdu support and AI-specific rate limiting.

### Exit criteria

- [x] Public chat is implemented with explicit connected/not-connected states.
- [x] The model prompt is restricted to administrative help and approved clinic facts.
- [x] Emergency and medical-advice messages are refused before a model call.
- [x] Conversation logging and a read-only inbox are implemented in code.
- [x] Approved knowledge-base management is implemented in code and included in the prompt.
- [x] Unit tests, lint, typecheck and build pass.
- [ ] Live OpenAI responses and logged conversations are exercised.
- [ ] Approved knowledge entries are verified in the live assistant.

## Milestone 8 — AI booking & human handover

### Scope completed by the owner

> This pass implements: public AI booking through controlled tools, an AI handover
> workflow, inbox action controls and additional safety hardening. This milestone
> is code-complete but not live-verified.

### Delivered (code complete)

- The OpenAI call now supports an agent loop with allow-listed tools.
  - It can search genuine availability through `get_available_slots(...)`.
  - It can create a booking through `create_website_booking(...)` using exactly
    the same service-role path as `/book`.
  - It can call `request_human_handover` when the visitor asks for a person or
    the answer requires a human.
  - No booking value, price or slot is invented in the browser.
- AI tool transcripts are stored in order:
  - visitor message first;
  - tool calls next, with name, arguments and result;
  - assistant message last;
  - each message is a separate `ai_messages` row and gets a stable `created_at`.
- Safety is hardened:
  - emergency language and medical-advice requests trigger a local refusal;
  - the conversation is marked `needs_human` before the refusal is returned;
  - visitor requests for a human also match `needs_human`.
- `/dashboard/ai-receptionist` now supports the handover workflow:
  - Mark needs human;
  - Assign to me;
  - Return to AI;
  - Close conversation.
  - Closed conversations are terminal in the MVP; a new human request starts a new conversation.
- All inbox mutations are server-checked; RLS and a service-role function remain the write path; every change records before/after values in `audit_logs`.
- `set_ai_conversation_status(...)`, `mark_ai_conversation_needs_human(...)`,
  `ensure_ai_conversation(...)`, `log_ai_message(...)` and `log_ai_tool_message(...)`
  are available to the service role only.

### Checks run locally

- `npm run lint` — passes.
- `npm run typecheck` — passes.
- `npm test` — 54 tests pass.
- `npm run build` — passes; 22 routes generated.
- Production smoke test on `npm start`: `/dashboard/ai-receptionist`, `/ai-receptionist` and `/dashboard` return 200; unconfigured runtime shows setup guidance.

### Pending verification

1. Apply all migrations (through `20261105001200_patient_consultation_creation.sql`), including `20261105001100_ai_handover_actions.sql`.
2. Open `/ai-receptionist`, request availability for one service, then book with a visitor-supplied name and phone.
3. Verify the appointment appears in `/dashboard/appointments` with the correct status.
4. Verify the assistant cannot claim a booking without a successful tool call.
5. Use a medical or emergency message and confirm the conversation is flagged `needs_human`.
6. In `/dashboard/ai-receptionist`, assign a flagged conversation to yourself, then return it to AI and finally close it; observe `audit_logs` entries.

### Not implemented

- Notifications to the clinic team when a conversation is flagged.
- Urdu/Roman Urdu responses.
- AI rate limiting.
- Reopening a closed conversation.
- Direct reply from the dashboard to the visitor (no delivery channel is connected).

### Exit criteria

- [x] AI booking is implemented through controlled tools only.
- [x] Human handover and inbox controls exist in code.
- [x] Safety refusals escalate to `needs_human`.
- [x] React/Next code passes lint, typecheck, tests and production build.
- [ ] Live OpenAI tool-use booking succeeds against a fresh Supabase project.
- [ ] Live human-handover round trip and audit evidence are verified.

## Milestone 9 — Notifications, reminders & feedback

### Delivered (code complete)

- Private feedback:
  - `/feedback` now accepts a real submission only through a Server Action;
  - server-side validation, best-effort rate limiting and service-role persistence;
  - no appointment reference or name/email is collected, so feedback remains private and anonymous to the clinic UI regardless of patient identity;
  - feedback is never shown publicly.
- Dashboard feedback inbox:
  - `/dashboard/feedback` shows rating, comment, status and optional private response;
  - staff and doctor can mark reviewed/archived/responded;
  - status transitions write audit rows.
- Reminders:
  - `/api/cron/remind` is protected by `CRON_SECRET`;
  - finds scheduled follow-ups due within 24 hours;
  - creates one dashboard notification per follow-up, skipping duplicates;
  - includes patient reference, due time and clinic timezone in the payload;
  - `status` remains `queued` until a delivery attempt exists; it is not marked sent.
- In-app overview lists reminder notifications when rows exist.
- External Email and WhatsApp providers are still not connected or configured; no claim is made that those channels are available.

### Checks run locally

- `npm run lint` — passes.
- `npm run typecheck` — passes.
- `npm test` — 54 tests pass.
- `npm run build` — passes; 23 routes generated.
- Production smoke test on `npm start`: `/feedback`, `/dashboard/feedback` and `/dashboard` return 200. Anonymous feedback submission with missing Supabase degrades no fake success.

### Pending verification

1. Set `CRON_SECRET`, call `/api/cron/remind` with `Authorization: Bearer …`, and confirm reminder rows appear in the overview.
2. Submit feedback as a visitor; confirm nine-x row exists and no name/email is collected.
3. Mark reviewed, responded and archived as clinic user; confirm RLS and audit rows.
4. When Resend/WhatsApp is genuinely connected, deliver one reminder and only then mark it sent.

### Exit criteria

- [x] Feedback submission and dashboard review workflow exists.
- [x] Reminder worker is authenticated and deduplicated.
- [x] Notifications stay visibly unconnected/not sent until provider delivery is proven.
- [x] Lint, typecheck, tests and build pass.
- [ ] Cron live run, feedback round trip and notification delivery are verified.

## Milestone 10 — QA, security and deployment (partial)

### Delivered in this pass

- Full inspection of the Milestone 1–2 code before changing anything.
- Ran lint, typecheck, 13 new unit tests and a production build; all pass.
- Route smoke test against the production server: 17 routes return 200 and an
  unknown route returns 404.
- Added beginner-friendly deployment and QA documentation:
  [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) and [`docs/QA_REPORT.md`](QA_REPORT.md).
- Security fixes:
  - new Supabase users are inactive until the doctor activates them;
  - the dashboard fails closed when an account has no active clinic profile;
  - fixed the inactive-account redirect loop;
  - removed direct appointment insert/update RLS policies so bookings must use
    the validated server function;
  - added an exclusion constraint preventing overlapping active appointments;
  - added standard HTTP security headers.
- Fixed the working-days summary, which rendered every weekday name instead of
  “Mon – Sat”.
- Added a Node-based unit test suite and `npm test`.

### Not delivered (requires live verification of Milestones 2–4 and Milestones 5–9)

- Functional tests for booking, cancellation, rescheduling, capacity, overlap,
  online consultation selection, patients, consultations, prescriptions,
  follow-ups, AI, human escalation and notifications.
- AI safety tests.
- Live RLS and database tests against a Supabase project.
- Integration tests and concurrent booking tests.
- Vercel deployment has been created, but it is not verified for production acceptance.

### Exit criteria (currently failing)

- [x] Lint, typecheck, unit tests and production build pass.
- [x] Security issues in the delivered code are fixed and documented.
- [x] Deployment and environment documentation exists.
- [x] A Vercel production deployment exists (`https://nissa-ai-receptionist.vercel.app`).
- [ ] Every requested feature exists and passes its functional test.
- [ ] RLS and migrations are verified on a live Supabase project.
- [ ] AI safety and booking concurrency tests pass.
- [ ] Vercel Deployment Protection is removed only after credentials and live acceptance pass.
- [ ] Deployment is verified live with Supabase and OpenAI configured.

## Working agreements

- One milestone at a time; stop for approval after each report.
- Never mark a milestone complete until its acceptance checks pass.
- Never invent clinic information or fake integrations.
- Server-side validation is mandatory for all sensitive operations.
- Update this document after every milestone.
