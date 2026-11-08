# Milestone 10 — QA, security and deployment report

**Date:** 7 November 2026
**Build under test:** `nissa-clinic` 0.2.0
**Environment:** Windows, Node 26.13.0, npm 11.20.0, Next.js 16.4.5
**Database:** not connected (Supabase environment variables are empty)

## Executive summary

The repository has feature code through Milestone 9 and a production deployment, but it is **not production-accepted**. Baseline checks pass (`npm run lint`, `npm run typecheck`, `npm test` — 54/54, `npm run build`), and the live Supabase project has 14 migrations applied with hardened function grants and RLS in place. A 9 November 2026 full milestone audit found **no new code bugs**. The app still cannot be called fully tested/production-ready because several acceptance checks require owner-supplied configuration or live evidence (clinic timezone, OpenAI keys, production `CRON_SECRET` run, Email/WhatsApp delivery, staff-session RLS proof, booking concurrency and final deployment acceptance). Email and WhatsApp remain intentionally unconnected.

Because of that:

- Patient, consultation, prescription, follow-up, AI, human escalation and
  notification workflows **cannot be tested** — they do not exist yet.
- Booking can be reviewed in code, but it **cannot be exercised against a live
  database** in this environment.
- Settings, services and all dashboard data **cannot be verified against a live
  database** in this environment.
- The full Milestone 10 acceptance criteria **cannot be met**.
- The app **has not been deployed**.
- What can be verified has been verified: lint, typecheck, unit tests, production
  build, route smoke tests and a security review of the delivered scope.
- The QA pass found and fixed several real issues in the Milestone 1–2 code.
  They are listed below.

This report does not claim any missing feature works.

## Full milestone audit (9 November 2026)

Baseline (local, current tree): `npm run lint` pass, `npm run typecheck` pass, `npm test` 54/54 pass, `npm run build` pass (23 routes). Code audit found no new runtime bugs; prior production fixes (action-state separation, `isDateKey` year handling, `connection()` before auth session) remain in place.

Live Supabase project `jtczycwpozkeyjewhqba`: **14 migrations applied** (`20261105000000_initial_schema` through `20261105001300_function_grants_hardening`). Application RPCs are `EXECUTE` for `postgres`/`service_role` only (hardened). RLS policies show public read only for clinic settings/hours/closures/active services; clinic users read operational data; consultations/prescriptions are doctor-only (`is_doctor()`); no direct appointment insert/update policies. `clinic_settings` row exists but `timezone`, address, phone, email and doctor name are `NULL` (owner-supplied). 1 auth user/profile exists (doctor, active). Services/closures/patients/appointments/clinical rows are empty at audit time.

| Milestone | Code | Live evidence | Blockers / open checks |
| --- | --- | --- | --- |
| 1 Foundation | Complete | — | None |
| 2 Supabase & auth | Complete | 14 migrations, doctor sign-in verified | Staff-session RLS proof; any pgTAP/live DB tests owner requires |
| 3 Settings & services | Complete | Settings save verified in browser | Owner must set timezone/contact details; staff write refusal verified by RLS intent, full staff-session proof open |
| 4 Booking | Complete | Honest unavailable state when timezone missing | **Blocked:** set `clinic_settings.timezone`, then verify anonymous booking, capacity/overlap, status |
| 5 Appointments | Complete | Workspace loads; actions code reviewed | Needs live appointments to verify confirm/complete/cancel + audit rows |
| 6 Patients/consultations | Mostly complete | Patient create, attachment signed link, consultation+prescription verified; duplicate consultation refused (correct) | Create follow-up in UI and confirm it appears in follow-ups; staff cannot read clinical rows (RLS enforces doctor-only; real staff session still open) |
| 7 AI receptionist | Complete | UI states honest when unconfigured | **Blocked:** `OPENAI_API_KEY`/`OPENAI_MODEL` for live responses and knowledge use |
| 8 AI booking/handover | Complete | Tools/inbox actions implemented | **Blocked:** OpenAI + timezone/booking context for live tool-use booking and handover round trip |
| 9 Feedback/reminders | Complete | Anonymous feedback stored live (verified earlier) | `CRON_SECRET` in production + live cron run; Email/WhatsApp intentionally unconnected |
| 10 QA/security/deploy | Partial | Baseline checks pass, deployment exists, security hardening present | Owner-configured live acceptance, booking concurrency, deployment protection/production acceptance |

## Milestone 6 verification update (8 November 2026)

- The live Supabase project now has all 13 migrations, including
  `20261105001200_patient_consultation_creation` and
  `20261105001300_function_grants_hardening`.
- Supabase's default privileges had granted EXECUTE on every public function to
  `anon` and `authenticated`. The hardening migration revokes that and limits
  every application function to `service_role`; only the RLS helpers
  (`current_user_role`, `is_clinic_user`, `is_doctor`) remain callable by
  `authenticated`.
- `create_patient_record` and `create_consultation_record` were exercised in a
  rolled-back live transaction: a patient with a valid `NIS-####` reference, a
  consultation, a prescription and a follow-up were all created, then the
  transaction was rolled back. No test data remains in the database.
- The Vercel production deployment now has the Supabase URL, publishable key and
  encrypted secret key. A doctor account was created and activated, and a
  password sign-in was verified against Supabase Auth.
- Still outstanding: the clinic timezone must be set in `/dashboard/settings`
  before online booking can compute a real clinic date/time. Browser sign-out,
  attachment uploads and live booking round trips still need a manual pass.

## Live browser test and fixes (8 November 2026)

The first real-browser pass (Microsoft Edge, driven by `playwright-core`) on the
production site found three genuine defects that the build, lint and unit tests
did **not** catch:

1. **Every `useActionState` form returned HTTP 500.** Next.js forbids a
   `"use server"` module from exporting anything other than async functions, and
   each action file also exported its `initial…State` object. Submitting the
   patient form crashed with `A "use server" file can only export async
   functions, found object`, which surfaced to the user as
   "A server error occurred". This affected the forms in patients, consultations,
   services, settings, appointments, follow-ups, dashboard feedback, the AI
   inbox, knowledge and public booking.
   Fix: each folder now has an `action-state.ts` module that owns the state type
   and its initial value; `actions.ts` files import the type and export only
   async functions.
2. **Three date validators rejected every valid date.** `isDateKey` destructured
   `[, year, month, day]` from a three-element `value.split("-")`, so the year
   was dropped and every date failed. Only the validators that destructured a
   regex match were correct. Fix: `[year, month, day]` in `patients/actions.ts`,
   `consultations/actions.ts` and `(public)/ai-receptionist/actions.ts`.
3. **`Date.now()` was read while prerendering the dashboard.** Supabase Auth
   checks the clock while validating the session, which Cache Components flagged
   on every dashboard request. Fix: `requireClinicUser()` awaits
   `connection()` before reading the session.

Verified in a real browser against `https://nissa-ai-receptionist.vercel.app`:

| Flow | Result |
| --- | --- |
| Password sign-in, redirect to `/dashboard` | Pass |
| All ten dashboard pages render with a doctor session | Pass |
| Create patient, `NIS-####` reference issued, row listed | Pass |
| Upload PNG to the private `patient-attachments` bucket, signed link works | Pass |
| Create consultation against a confirmed appointment (with prescription) | Pass |
| Duplicate consultation for the same appointment is refused, not crashed | Pass |
| Save clinic settings | Pass |
| Anonymous public feedback submission | Pass |

All test patients, appointments, consultations, prescriptions, attachments,
feedback, audit rows and stored files were deleted afterwards; the live database
and storage bucket are empty again. The clinic timezone is still unset, so public
booking and consultation booking still cannot compute a clinic date/time.

## 1. Functional test matrix

Status meanings:

- **PASS** — exercised in this environment.
- **PASS (review)** — the code path was inspected; live behaviour needs Supabase.
- **PARTIAL** — a read-only or preview version exists, but the requested workflow
  is not implemented.
- **NOT IMPLEMENTED** — the feature does not exist.
- **BLOCKED** — implemented in code but needs the owner's Supabase project.
- **N/A** — nothing to test.

| Area requested | Status | Evidence / reason |
| --- | --- | --- |
| Public clinic website | **PASS** | Home, about, services, booking, online consultation, feedback, contact and AI pages return 200. Unknown route returns 404. |
| Doctor login | **BLOCKED** | `/login` renders. Sign-in code exists and was reviewed. No Supabase keys, so no live sign-in could be performed. |
| Dashboard appointments | **BLOCKED** | `/dashboard/appointments` lists appointments by date and status, shows capacity and allows confirm/complete/cancel through `set_appointment_status`. Unit tests cover action validation; live action verification needs keys. |
| Dashboard | **PASS (review)** | `/dashboard` renders the setup notice without Supabase. Live queries, empty states, error states and migration states are implemented. Live data is blocked. |
| Clinic settings | **BLOCKED** | Doctor-editable `/dashboard/settings` with server-side validation, role checks, audit wiring and cache invalidation exists. 12 new unit tests cover the rules. Live save, RLS and cache revalidation need the owner's Supabase keys. |
| Services | **BLOCKED** | `/dashboard/services` creates, edits and archives services (doctor-only role check, server validation, audit wiring). Live round trip needs the owner's keys. |
| Patient registration | **BLOCKED** | `/dashboard/patients` contains a real registration/list flow (adds raw patient details, generates `NIS-####`, signed URLs for private attachments). Live storage and RLS verification pending. |
| Appointment booking | **BLOCKED** | `/book` contains an availability check and booking submission; the AI receptionist can also call the same `create_website_booking` through allow-listed tools. Live anonymous/AI booking round trips need the owner's keys and a configured clinic timezone. |
| Appointment cancellation | **BLOCKED** | `/dashboard/appointments` cancels pending/confirmed appointments with a reason through `set_appointment_status`; the function writes an event row and before/after audit row in one transaction. Live cancellation and capacity release need the owner's keys. |
| Appointment rescheduling | **NOT IMPLEMENTED** | No UI, server action or database function. |
| Daily capacity enforcement | **BLOCKED** | `create_appointment` counts active/completed rows and takes an advisory lock; `get_available_slots` filters full dates. Never run against a live database from the new public flow. |
| Appointment overlap protection | **BLOCKED** | The overlap exclusion constraint exists and `create_appointment` now raises `SLOT_TAKEN` for overlapping active appointments. Not executed live. |
| Online consultation selection | **BLOCKED** | Online/in-person services are selectable at `/book`; video calling is not connected and is not claimed. |
| Patient records | **BLOCKED** | Patient list/add flow and private attachments exist in code; staff/doctor can access RLS-protected records, signed URLs for private files. Live RLS and bucket verification pending. |
| Consultations | **BLOCKED** | `/dashboard/consultations` contains doctor-only creation with notes, optional prescription and follow-up scheduling. Live clinical RLS and write verification pending. |
| Doctor-entered prescriptions | **BLOCKED** | Prescription creation is optional inside a transaction with the consultation; `prescription_items` and `prescriptions` are written together. Service-role creation and live verification pending. |
| Follow-up scheduling | **BLOCKED** | `/dashboard/follow-ups` lists live follow-ups and allows complete/cancel actions through `set_follow_up_status`, with audit rows and validation. Follow-ups can now be created from a doctor consultation and the reminder cron exists. Live round trips pending. |
| AI receptionist | **BLOCKED** | `/ai-receptionist` contains a real OpenAI-gated chat with a restricted prompt, safety classifier, approved knowledge base and conversation logging. It is restricted to administrative help and can use controlled availability/booking/handover tools. Unit tests cover safety and handover detection; live OpenAI and Supabase verification remains pending. |
| AI booking | **BLOCKED** | The assistant has allow-listed `search_available_slots` and `create_ai_booking` tools; they call live Postgres functions. Unit tests are validation-only; live tool-use booking has not been exercised. |
| Human escalation | **BLOCKED** | Logged conversations support `needs_human` → assigned → handed_over/closed transitions, audit rows, inbox assignment and safety-triggered handover. Live round trips and real browser/session verification are pending. |
| Notifications | **BLOCKED** | `/api/cron/remind` creates deduplicated dashboard-channel reminder rows for due follow-ups (`status: queued`); feedback and AI handovers can also become notifications when delivery is wired. Email/WhatsApp providers are not connected, and no message is marked sent without provider acceptance. |
| Feedback | **BLOCKED** | `/feedback` accepts a real anonymous rating and comment; `/dashboard/feedback` stores private responses/review states with audit rows. Live end-to-end submission and RLS verification pending; feedback is never published. |

## 2. Security review

### Findings fixed in this pass

| # | Severity | Finding | Fix |
| --- | --- | --- | --- |
| S1 | **High** | A Supabase Auth account (including a self-registered account if sign-up were enabled) was automatically given an **active** `staff` profile. RLS would then expose patient and appointment data. | New profiles are inactive by default; the app requires an active profile; setup docs disable public sign-up; the doctor activates accounts manually. |
| S2 | **High** | `getCurrentUser()` accepted an authenticated Supabase user with **no profile row**, so an unrelated auth account could reach the dashboard shell. | The session layer now fails closed unless an active profile exists. |
| S3 | **Medium** | A deactivated or unprovisioned account could bounce between `/login` and `/dashboard` forever, because the proxy redirected every authenticated user away from `/login`. | The proxy checks the profile before redirecting; the sign-in action signs the account out and shows the not-authorised state. |
| S4 | **Medium** | `appointments` insert/update RLS policies let a signed-in account write bookings directly through PostgREST, bypassing hours, closures, overlap and capacity checks. This contradicted the documented server-only booking design. | Removed the direct insert/update policies. Reads remain. `create_appointment` remains the only write path and is granted to `service_role` only. |
| S5 | **Medium** | Active appointments could overlap: a unique index on `(appointment_date, start_time)` did not stop 11:00–11:45 and 11:15–12:00. | Added a partial GiST exclusion constraint on the time range for `pending`/`confirmed` appointments. |
| S6 | **Low** | No HTTP security headers. | Added `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and HSTS in `next.config.ts`. |

### Findings reviewed and accepted

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| S7 | Low | No Content-Security-Policy. | Not added in this pass. A strict CSP needs careful nonce/hash work with Next.js and third-party providers. Recorded as a launch hardening item. |
| S8 | Low | `clinic_settings` is publicly readable, including `updated_by` and internal channel arrays. | Accepted for now: the table contains no patient data. Revisit if internal-only columns are added. |
| S9 | Info | No application-level rate limiting. | Public AI chat, booking availability/creation, feedback and reminder creation are now limited to short, best-effort per-instance budgets. This is not a replacement for a global edge limit. |
| S10 | Info | No database test suite and no live RLS verification. | Blocked by the missing Supabase project. The deployment guide contains the SQL checks. |

### Controls verified by inspection

- RLS is enabled on all 19 tables.
- Public read is limited to clinic settings, clinic hours, closures and active
  services.
- Patient, appointment, follow-up, feedback, AI and notification rows are
  restricted to active clinic users.
- Consultations, prescriptions and prescription items are doctor-only.
- `audit_logs` is doctor-read and append-only.
- The private `patient-attachments` bucket is not public and limits size and MIME
  types. Deletion is doctor-only.
- The secret key is imported only in `src/lib/supabase/admin.ts`, which imports
  `server-only`.
- Only `NEXT_PUBLIC_*` values reach the browser. No secret uses a `NEXT_PUBLIC_`
  name.
- `.env.local` is ignored by `.gitignore`.
- Sign-in redirects are restricted to `/dashboard` paths (no open redirect).
- Error messages at login do not reveal whether an email exists.
- No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `new Function` is used.
- Public route handlers exist only for `/api/cron/remind`, protected by a bearer `CRON_SECRET`; no unvalidated public write surface is exposed.
- Server Actions use Next.js's built-in origin checks.

## 3. AI safety tests

**Not testable.** There is no AI provider, endpoint, prompt or tool in the code.
The public AI page and dashboard page are explicitly labelled as previews.

The design constraints are documented and must be tested when Milestone 7–8 is
implemented:

- no diagnosis or report interpretation;
- no prescribing or medicine changes;
- no access to unrestricted patient records;
- no invented clinic information;
- no booking confirmed before the backend confirms it;
- escalation of medical questions and uncertainty;
- knowledge limited to active, approved entries.

## 4. Booking reliability review

The booking UI and Server Actions now exist, but none of the database-level
guarantees has been executed against a live database in this environment.
Unit tests cover request validation, not concurrent PostgreSQL transactions.

| Requirement | Status |
| --- | --- |
| Appointment duration is 45 minutes | Seeded settings and `src/config/clinic.ts` both use 45. The booking function derives `end_time` from the setting. |
| Maximum 8 active confirmed appointments per day | The function counts `pending`, `confirmed` and `completed` rows and rejects at `daily_capacity`. |
| No overlapping active appointments | Fixed by the exclusion constraint. `create_appointment` also raises `SLOT_TAKEN` for overlapping active rows. |
| Outside clinic hours rejected | The function checks opening/closing time and end time. |
| Closed days rejected | The function checks ISO weekday against `working_weekdays` and checks `clinic_closures`. |
| Duplicate requests do not create duplicates | The advisory lock plus unique start-time index plus exclusion constraint prevent a second row. A retry receives `SLOT_TAKEN`; it is not idempotent (no request key). |
| Concurrent requests cannot exceed capacity | The advisory lock serialises requests for the same date before the count and insert. This needs a real concurrency test. |
| Past dates rejected | Added, but only when `clinic_settings.timezone` is configured. Without a timezone, public booking returns no slots and the create function rejects the request. |

Known gap: there are unit tests for booking input validation, but no automated
database test exists. M4 requires a concurrency test before launch.

## 5. UI quality review

- **Responsive layout:** reviewed in code. The public site uses stacked grids and
  a mobile sheet navigation. The dashboard uses a fixed desktop sidebar, a mobile
  sheet and horizontally scrollable tables.
- **Navigation:** all public and dashboard links resolve to existing routes.
- **Loading states:** the sign-in button shows a pending state. The dashboard is
  server-rendered; there are no client data fetches with spinners.
- **Empty states:** implemented for appointments, follow-ups, notifications and
  AI attention cards.
- **Error/configuration states:** unconfigured Supabase, missing tables and query
  failures all have dedicated notices. Raw database errors are not shown.
- **Form validation:** the login form uses required email/password inputs, labels,
  autocomplete and an alert region. There are no other forms yet.
- **Accessibility:** skip link, semantic headings, labelled controls and focus
  styles are present. No automated axe or Lighthouse audit was run.
- **Content honesty:** booking, AI, email, WhatsApp and video calling are visibly
  marked as unavailable.
- **Bug found and fixed:** the working-days summary rendered
  “Mon – Tue – Wed – Thu – Fri – Sat”. It now renders “Mon – Sat”.

## 6. Build and test results

| Check | Result |
| --- | --- |
| `npm run lint` | **PASS** — no warnings or errors |
| `npm run typecheck` | **PASS** — no errors |
| `npm test` | **PASS** — 13 unit tests, 13 passed, 0 failed |
| `npm run build` | **PASS** — compiled, typechecked, 20 routes generated |
| Production route smoke test | **PASS** — 17 routes returned 200, unknown route returned 404 |
| Integration tests | **N/A** — no test framework or database fixtures exist |
| Database/RLS tests | **BLOCKED** — no Supabase project |
| Live deployment test | **PARTIAL** — deployment exists on Vercel behind Deployment Protection; application routes have not been verified through the host |
| Deployment | **BLOCKED** — Vercel production deployment exists (`https://nissa-ai-receptionist.vercel.app`), but Supabase and OpenAI are not configured and credentials are unavailable for live acceptance |

Unit tests cover date/time helpers and clinic invariants (45-minute duration,
8-patient capacity, Monday–Saturday weekdays, fee, online consultation, and the
rule that unsupplied details stay `null`).

## 7. Required environment variables

Required today:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

Optional today:

- `NEXT_PUBLIC_APP_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `CRON_SECRET`

Documented but not used/sent yet: Resend and WhatsApp variables. See
[`docs/DEPLOYMENT.md`](DEPLOYMENT.md) and `.env.example`.

## 8. Deployment status

**Deployment exists, but acceptance does not.** A Vercel project (`nissa-ai-receptionist`) was linked to the GitHub repository and a production deployment was created at `https://nissa-ai-receptionist.vercel.app`. The Hobby plan rejected the original hourly cron, so `vercel.json` now schedules `/api/cron/remind` daily at 08:30 UTC. No Supabase or OpenAI environment variables are configured in Vercel, and deployment protection remains enabled. The app should not be presented as a finished clinic system.

## 9. Required next steps

1. Supply the Supabase project keys and apply the migrations (currently thirteen).
2. Create and activate the doctor account; disable public sign-up.
3. Set the clinic timezone in `/dashboard/settings`.
4. Verify RLS with anonymous, inactive, staff and doctor sessions.
5. Verify Milestones 3–6 end to end:
   - settings and services round trip;
   - booking, capacity and overlap;
   - appointments and follow-ups actions;
   - patient creation, attachments, consultations, prescription/follow-up creation.
6. Verify Milestones 7–9:
   - OpenAI answers and safety boundaries;
   - AI availability/booking and human handover;
   - cron-created reminder rows;
   - anonymous feedback submission and doctor review.
7. Fix every failure found on the live project, then deploy behind a staging/preview URL.
8. Return to Milestone 10 for full functional, AI-safety, booking-concurrency and
   production deployment testing once live verification is complete.
