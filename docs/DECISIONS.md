# Decisions — Nissa Homeopathic Clinic

Last updated: Milestones 1–9 code complete; live verification and deployment still pending.

Short records of the choices that shape the project. Each entry explains the
decision, why it was made, and what it costs. New decisions are appended as the
milestones progress.

---

## D-001 — Build on Next.js App Router with TypeScript

**Status:** Accepted (Milestone 1)

**Decision:** Use Next.js 16 App Router, React 19 and TypeScript for the whole
application.

**Why:** One codebase serves the public site, the doctor dashboard and the
server-side API used by the AI receptionist. Server Components keep data access
on the server, and typed routes catch broken links at build time.

**Cost:** Next.js 16 has breaking changes compared with older tutorials. The
project reads the bundled docs in `node_modules/next/dist/docs/` before using an
API, and avoids unstable values during prerender.

---

## D-002 — Scaffold a fresh app instead of patching the placeholder

**Status:** Accepted (Milestone 1)

**Decision:** The repository contained only an empty `index.html`. It was
replaced with a fresh `create-next-app` project, then the files were moved to
the repository root.

**Why:** Starting clean gives a supported configuration for Next.js, Tailwind,
ESLint and TypeScript. Patching a placeholder would have produced a fragile
setup.

**Cost:** The scaffold was created in a temporary folder because the workspace
name (`AI Receptionist`) is not a valid npm package name. Dependencies were
reinstalled after moving.

---

## D-003 — Tailwind CSS v4 + shadcn/ui + Lucide

**Status:** Accepted (Milestone 1)

**Decision:** Style with Tailwind CSS v4 and locally owned shadcn/ui primitives.
Use Lucide for all icons.

**Why:** Fast, consistent UI work with accessible Radix primitives. Components
live in `src/components/ui/`, so they can be adjusted without fighting a library.

**Cost:** Component upgrades are manual. Only the primitives actually used are
installed.

---

## D-004 — Evergreen, sage and cream design system

**Status:** Accepted (Milestone 1)

**Decision:** White/soft-neutral surfaces, deep evergreen primary, sage accents,
warm sand highlights, Fraunces display headings and Geist body text.

**Why:** A calm, trustworthy clinic feel that avoids generic medical-stock
imagery and loud gradients. Rounded surfaces and soft shadows keep it modern.

**Cost:** Dark-mode tokens exist but no toggle is exposed until the palette is
reviewed in a later milestone.

---

## D-005 — Centralise clinic values in `src/config/clinic.ts`

**Status:** Accepted (Milestone 1)

**Decision:** All confirmed clinic defaults live in one typed object. Unsupplied
values are `null`.

**Why:** Prevents clinic details from being duplicated or invented across pages.
Gives one place to change when the owner supplies more information.

**Cost:** The file is no longer a source of truth. In Milestone 3 the database
`clinic_settings` table became authoritative and the config is a typed
fallback/seed.

---

## D-006 — Never invent missing clinic information

**Status:** Accepted (Milestone 1)

**Decision:** Address, phone, email, doctor name and timezone remain `null`
until the owner supplies them. The UI shows "Not configured yet" instead of
placeholder contact details.

**Why:** Fake contact details or a fabricated doctor name are misleading and
could send patients to the wrong place. Trust matters more than a filled layout.

**Cost:** Some public pages are intentionally less complete until Milestone 3.
The owner supplies the values through the dashboard once the database is live.

---

## D-007 — Preview mode instead of fake data

**Status:** Superseded by D-020 (Milestone 2)

**Decision (Milestone 1):** `appConfig.previewMode` was `true`. Sample records
lived in `src/lib/preview-data.ts` and were shown behind a visible "Preview data"
badge and banner.

**Why:** The dashboard layout could be reviewed without pretending a backend
existed. Labelling protected against demo data being mistaken for real patients.

**Cost:** The sample data had to be removed when Supabase was connected. That
happened in Milestone 2.

---

## D-008 — Honest "not connected" states

**Status:** Accepted (Milestone 1)

**Decision:** Booking, feedback, AI chat, email, WhatsApp and video calling are
presented as unavailable or illustrative until they are actually implemented and
tested. No button claims to send or confirm something it cannot.

**Why:** A fake success message is worse than an honest "not open yet" message.
It also protects the clinic from losing real bookings.

**Cost:** The public site looks less "finished" during early milestones. This is
deliberate.

---

## D-009 — Server-side and database-side validation

**Status:** Accepted (planning rule, Milestone 1)

**Decision:** All booking validation and capacity enforcement will happen in the
server/database, never only in the browser.

**Why:** Client checks can be bypassed. Double bookings and over-capacity days
are the most damaging failure modes for a clinic.

**Cost:** Requires Postgres functions or transactions and concurrency tests in
Milestone 4.

---

## D-010 — Supabase for database, auth and storage

**Status:** Accepted and implemented (Milestone 2)

**Decision:** Use Supabase PostgreSQL, Supabase Auth and private Supabase
Storage. Enable Row Level Security on every table.

**Why:** One managed service covers the MVP's data, doctor login and patient
attachments. RLS keeps patient data away from public visitors.

**Cost:** Policies and migrations must be maintained carefully and tested against
a live project before launch.

---

## D-011 — One doctor role, no public sign-up

**Status:** Accepted and implemented (Milestone 2)

**Decision:** The dashboard is for the doctor (plus optional staff). Accounts
are created by invitation in the Supabase dashboard, not by self-service. Every
new auth user is created as `staff` by a database trigger; the doctor role is
promoted manually with SQL.

**Why:** This is a single-clinic MVP. Public sign-up would create an unnecessary
attack surface, and self-assigned doctor roles would be dangerous.

**Cost:** Account recovery and invitations are a documented manual process in
`supabase/README.md`.

---

## D-012 — AI receptionist with restricted tools

**Status:** Accepted (planned, Milestones 7–8)

**Decision:** The AI runs server-side with a restricted system prompt and an
allow-list of tools (check availability, book, reschedule, cancel, escalate). It
cannot diagnose, prescribe, interpret reports or read unrestricted clinical
records.

**Why:** Safety and trust. The assistant should handle reception work, not
medicine.

**Cost:** More engineering than a free-form chatbot, but far safer and easier to
audit.

---

## D-013 — Escalate to a human instead of guessing

**Status:** Accepted (planned, Milestone 8)

**Decision:** When the AI is unsure, the visitor asks for a person, or a safety
rule triggers, the conversation moves to the dashboard inbox.

**Why:** A wrong answer about a booking or a health concern is worse than a
handover.

**Cost:** The doctor needs a reliable notification and inbox workflow.

---

## D-014 — No fake integrations in the UI

**Status:** Accepted (Milestone 1)

**Decision:** Email, WhatsApp, AI, video calling and online booking show "not
connected" until configured and tested end to end.

**Why:** A green "sent" badge for a message that never left the server is a lie.

**Cost:** Some dashboard cards are visibly incomplete until Milestone 9.

---

## D-015 — Route group for the public site

**Status:** Accepted (Milestone 1)

**Decision:** Put public pages in `src/app/(public)/` with a shared layout, and
keep `/dashboard` in its own layout.

**Why:** Shared header/footer without polluting URLs, and a clean separation from
the authenticated app.

**Cost:** New public pages must be created inside the route group.

---

## D-016 — Avoid unstable values during prerender

**Status:** Accepted (Milestone 1)

**Decision:** Do not call `new Date()` or similar during static prerender. The
footer uses a fixed project label instead of a dynamic year.

**Why:** `cacheComponents: true` in Next.js 16 blocks unstable values during
prerender. The build must stay deterministic.

**Cost:** The footer year is not automatic. It can be revisited when the layout
becomes dynamic.

---

## D-017 — Deploy on Vercel

**Status:** Accepted (planned, Milestone 10)

**Decision:** Host the Next.js app on Vercel, with Supabase as the managed
backend.

**Why:** First-class Next.js support, preview deployments and simple environment
management.

**Cost:** Production environment variables and database migrations must be
managed deliberately.

---

## D-018 — Supabase SSR cookie authentication

**Status:** Accepted (Milestone 2)

**Decision:** Use `@supabase/ssr` with a cookie-based server client for Server
Components, Server Actions and Route Handlers, and a browser client that only
holds the public URL and publishable key (or the legacy anon key).

**Why:** Cookies keep the session on the server, so the dashboard never needs to
expose tokens to client JavaScript. The same client respects RLS, which means a
bug in the UI cannot bypass row policies.

**Cost:** Cookie wiring is repeated in the proxy and the server client, and
Server Components cannot write cookies (the proxy refreshes the session instead).

---

## D-019 — Proxy plus a server-side data access layer

**Status:** Accepted (Milestone 2)

**Decision:** Next.js 16 `src/proxy.ts` refreshes the session and redirects
unauthenticated visitors away from `/dashboard`. The dashboard layout additionally
calls `requireClinicUser()`, and every data function re-checks the user.

**Why:** `middleware` was renamed to `proxy` in Next.js 16, and a proxy matcher
can silently stop covering a route. Defence in depth means a missed matcher is a
performance bug, not a data leak.

**Cost:** A session lookup happens more than once per request. That is acceptable
for a single-clinic dashboard and can be optimised later.

---

## D-020 — Remove preview data instead of migrating it

**Status:** Accepted (Milestone 2)

**Decision:** Delete `src/lib/preview-data.ts` and the preview banner. The
dashboard reads Supabase and renders explicit unconfigured, needs-migration,
error and empty states. No sample patient appears anywhere.

**Why:** Sample rows in a codebase that is about to hold real patients are a
foot-gun. Deleting them is safer than gating them behind a flag.

**Cost:** The dashboard looks empty until real records exist. That is honest and
is exactly what a new clinic sees.

---

## D-021 — Booking enforcement lives in a service-role-only function

**Status:** Accepted (Milestone 2, used from Milestone 4)

**Decision:** `public.create_appointment(...)` validates working days, closures,
clinic hours, slot collisions and daily capacity in one transaction, and is
executable only by `service_role`. The browser cannot call it directly.

**Why:** Client-side checks can be bypassed, and two simultaneous requests could
otherwise take the same slot or exceed capacity. The advisory lock plus unique
partial index makes overbooking impossible at the database level.

**Cost:** All booking code must run on the server. Public booking needs a Server
Action or Route Handler in Milestone 4; it cannot be a direct browser insert.

---

## D-022 — UTC fallback until the clinic timezone is supplied

**Status:** Accepted (Milestone 2)

**Decision:** The clinic timezone was not supplied, so `clinic_settings.timezone`
stays `NULL`. The dashboard formats dates with UTC and shows a visible warning
that the timezone is not configured.

**Why:** Guessing a timezone could show appointments at the wrong time, which is a
real-world scheduling error. An explicit warning is safer than a silent guess.

**Cost:** Dates may look wrong for a clinic outside UTC until Milestone 3 makes
the setting editable. This is temporary and clearly labelled.

---

## D-023 — Explicit view models instead of generated database types

**Status:** Accepted (Milestone 2)

**Decision:** The dashboard maps Supabase rows into narrow types in
`src/lib/dashboard/types.ts` rather than importing generated schema types.

**Why:** UI components then depend only on what they render, not on database
column names. It also lets the app build and typecheck before a live project
exists.

**Cost:** A column rename in the database will not fail the typecheck. Generated
types (`supabase gen types …`) can be added once the project is linked; the
README documents the command.

---

## D-024 — New accounts are inactive until a doctor activates them

**Status:** Accepted and implemented (Milestone 10 hardening)

**Decision:** The auth trigger creates every new profile as an inactive `staff`
member. A doctor must set `is_active = true` before the account can enter the
dashboard. Public sign-up is also disabled in Supabase Auth.

**Why:** Authentication is not authorisation. If sign-up is ever left enabled or
an account is created by mistake, RLS would otherwise expose patient and
appointment data to a self-registered user.

**Cost:** Account setup has one extra manual step, documented in
`supabase/README.md` and `docs/DEPLOYMENT.md`.

---

## D-025 — The dashboard fails closed without an active profile

**Status:** Accepted and implemented (Milestone 10 hardening)

**Decision:** `getCurrentUser()` returns `null` unless the Supabase Auth user has
an active `profiles` row. The proxy checks the profile before redirecting away
from `/login`, and the sign-in action signs out unprovisioned accounts.

**Why:** Previously any authenticated Supabase account could reach the dashboard
shell, and a deactivated account could loop between `/login` and `/dashboard`.

**Cost:** A database error during the profile lookup denies access rather than
granting it. That is deliberate.

---

## D-026 — Booking writes go only through `create_appointment`

**Status:** Accepted and implemented (Milestone 10 hardening; used from Milestone 4)

**Decision:** Remove the `appointments` insert/update and appointment-event insert
RLS policies. The validated `create_appointment` function remains the single
write path and is executable only by `service_role`. Dashboard reads are
unchanged.

**Why:** Direct PostgREST writes could bypass clinic hours, closures, capacity and
audit logging, contradicting D-009 and D-021. Removing the policies makes the
documented architecture true at the database layer.

**Cost:** Milestone 5 server actions must use the admin client after checking the
caller's role. A future reschedule/cancel function should follow the same pattern.

---

## D-027 — Prevent overlapping appointments with an exclusion constraint

**Status:** Accepted and implemented (Milestone 10 hardening; tested in Milestone 4)

**Decision:** Add a partial GiST exclusion constraint on the time range of
`pending` and `confirmed` appointments. The existing unique start-time index and
advisory lock remain.

**Why:** A unique index on `(date, start_time)` allowed 11:00–11:45 and
11:15–12:00 to overlap. The constraint makes overlap impossible regardless of
which server code path inserts the row.

**Cost:** Requires the `btree_gist` extension. The migration must be verified
against a live project before launch.

---

## D-028 — Unit tests use Node's built-in runner

**Status:** Accepted and implemented (Milestone 10)

**Decision:** Use `node --test` with TypeScript type stripping for pure helper
tests instead of adding a test framework.

**Why:** No extra dependency, no bundler configuration, and the tests run in the
same Node version as the app. They cover date/time formatting and clinic
invariants.

**Cost:** Database, React and integration tests are not covered by this runner.
Those need a dedicated setup in Milestones 4–9.

---

## D-029 — `clinic_settings` is the source of truth at runtime

**Status:** Accepted and implemented (Milestone 3)

**Decision:** After the seed migration runs, `clinic_settings` is the runtime source of truth for the public website, document metadata and booking validation. `src/config/clinic.ts` remains a typed fallback for the unconfigured state and for tests.

**Why:** If the owner edits the clinic hours in the dashboard, the public pages must reflect it. Keeping two independent copies of the values would risk publishing stale information.

**Cost:** The database row must always exist and must pass integrity constraints; the dashboard reports a migration problem honestly when it is missing.

---

## D-030 — Public content is cached and tagged, not read per request

**Status:** Accepted and implemented (Milestone 3)

**Decision:** `getPublicClinicContent()` in `src/lib/clinic/data.ts` uses a cookie-less anon client, `cacheLife("hours")` and the shared `clinic-content` tag. Saving settings or services calls `updateTag(CLINIC_CONTENT_TAG)` and `revalidatePath()`.

**Why:** The public site is read-heavy. Caching avoids a Supabase round trip for every visitor while still letting a doctor's save refresh every public page.

**Cost:** A visitor may see the previous content for a short moment after a save; the dashboard does not claim a cache flush has been verified until the live project is available.

---

## D-031 — Audit logging is service-role only and never rolls back the edit

**Status:** Accepted and implemented (Milestone 3)

**Decision:** `src/lib/audit.ts` calls `log_audit_event` through the secret-key client. A missing or failing audit call is logged server-side only; the settings/service change remains valid because RLS and the integrity constraints still protect the row.

**Why:** `log_audit_event` is granted to `service_role` only. Making audit optional prevents a misconfigured secret key from blocking clinical administration while keeping the trail when it is configured.

**Cost:** The before/after record may be absent until `SUPABASE_SECRET_KEY` is configured; the warning is then visible in the server logs.

---

## D-032 — Staff can read but only the doctor can write

**Status:** Accepted and implemented (Milestone 3)

**Decision:** The settings and services screens show read-only cards to `staff`. The server actions also check `role === "doctor"`, and RLS (`clinic_settings_doctor_update`, `services_doctor_manage`) is the final authority. The two layers agree; they are not substitutes for each other.

**Why:** Staff need to see fees, hours and the catalogue to answer patients. Clinical administration must remain doctor-only.

**Cost:** Two permission paths must be kept in sync. The role check in the actions is repeated deliberately.

---

## D-033 — Public booking opens only with live configuration and a timezone

**Status:** Accepted and implemented (Milestone 4)

**Decision:** `/book` renders the booking form only when the server has a Supabase secret key, the database supplies settings and active services, and `clinic_settings.timezone` is configured. Otherwise it renders an honest unavailable state.

**Why:** Without migrations, keys and timezone the app cannot know a clinic day or time. Pretending to hold a slot would lose real patients.

**Cost:** The owner must configure the timezone before online booking opens. This is required, not optional.

---

## D-034 — Patient identity is matched by normalized phone number

**Status:** Accepted and implemented (Milestone 4)

**Decision:** `create_website_booking` reuses the oldest patient row whose phone normalizes to the same digits; otherwise it creates a new `NIS-` reference from `patient_reference_seq`.

**Why:** A staff member needs to recognise a returning patient without asking for an account. The match is administrative only; clinical records remain doctor-only.

**Cost:** Two people sharing a phone number may be matched together. This is acceptable for a small clinic where the number is the booking identifier; it can be reviewed in the dashboard.

---

## D-035 — Availability is a database function, not a browser calculation

**Status:** Accepted and implemented (Milestone 4)

**Decision:** `get_available_slots` evaluates all ordering constraints in Postgres and returns only start times. The hidden `.startTime` posted with the booking is checked again by `create_appointment`.

**Why:** Stale pages, two tabs and slow connections must not produce double bookings. Excluded dates and overlaps are invisible to the scheduler rather than merely disabled visually.

**Cost:** Every availability lookup requires a database round trip; for a single-clinic MVP this cost is negligible.

---

## D-036 — Booking success is shown without claiming a message was sent

**Status:** Accepted and implemented (Milestone 4)

**Decision:** The result screen shows the appointment status and reference. It states explicitly that email and WhatsApp are not connected; no notification is faked.

**Why:** An on-screen reference is honest and useful. Claiming a confirmation message was sent would mislead patients.

**Cost:** Patients must keep the browser result or call the clinic if they lose it. This is acceptable until Milestone 9 connects notifications.

---

## D-037 — Appointment status changes are transactional and audited

**Status:** Accepted and implemented (Milestone 5)

**Decision:** Confirm, complete and cancel operations go through `set_appointment_status`, a service-role-only Postgres function that locks the row, validates the transition, updates the appointment, writes an `appointment_events` record and appends before/after values to `audit_logs`.

**Why:** Appointment status drives capacity, patient communication and audit accountability. A half-written status update is worse than no update.

**Cost:** The action must use the secret key and cannot run when Supabase is missing; the UI then shows setup guidance.

---

## D-038 — Appointment filters use bookmarkable GET parameters

**Status:** Accepted and implemented (Milestone 5)

**Decision:** `/dashboard/appointments` encodes the selected date and status in the URL and submits with plain GET. Navigation links and browser history behave naturally.

**Why:** Appointment lists are long-lived workspace views; staff can bookmark a date or filter and return to exactly that view.

**Cost:** The page is revalidated on every navigation rather than being cached statically; correctness matters more than page-load speed.

---

## D-039 — Follow-ups are implemented before patient registration

**Status:** Accepted and implemented (Milestone 6, partial scope)

**Decision:** The owner first asked for a follow-ups dashboard only. The page lists live follow-ups and supports complete/cancel actions through `set_follow_up_status`; patient registration, attachments, consultation notes and prescriptions remain unbuilt.

**Why:** A usable follow-up screen can close the loop on visits the clinic already has, without widening the scope into clinical record-keeping before the owner is ready.

**Cost:** The screen is initially empty in a fresh database and provides no way to create follow-ups; creation comes from the consultation workflow when that scope is deliberately approved.

---

## D-040 — OpenAI stays disabled until both key and model are configured

**Status:** Accepted and implemented (Milestone 7, public-chat scope)

**Decision:** `getOpenAiConfig()` returns a configuration only when both `OPENAI_API_KEY` and `OPENAI_MODEL` are non-empty. The chat shows not connected and disables input otherwise.

**Why:** An API key without a model, or a model without a key, would produce confusing errors. The UI must never pretend the assistant is connected.

**Cost:** Operators must set both values; the default is intentionally not a guessed production model.

---

## D-041 — Safety refusal happens before the model call

**Status:** Accepted and implemented (Milestone 7, public-chat scope)

**Decision:** `classifyAiSafety()` recognises emergency language and medical-advice requests and returns a local safe response without contacting OpenAI.

**Why:** Even a well-written system prompt may not reliably stop a model from engaging with a dangerous request. Local refusal is deterministic and reviewable.

**Cost:** The classifier is heuristic and can refuse some legitimate administrative questions; users can then clarify or contact the clinic.

---

## D-042 — AI exchanges are stored atomically by the service role

**Status:** Accepted and implemented (Milestone 7)

**Decision:** `log_ai_conversation_exchange(...)` creates or updates an `ai_conversations` row and writes the visitor and assistant messages in one transaction. The public browser action calls it only after generating an answer or safe refusal; the AI key and Supabase secret remain server-side.

**Why:** A partial transcript is less useful for review and may misrepresent what the assistant told the visitor. Atomic storage keeps the audit/review trail consistent.

**Cost:** If Supabase is not configured or errors, the AI may still provide general clinic information, but the exchange is visibly marked not recorded; the dashboard inbox stays honestly empty.

---

## D-043 — The AI inbox is read-only until handover actions are implemented

**Status:** Accepted and implemented (Milestone 7)

**Decision:** `/dashboard/ai-receptionist` lists logged conversations and safety flags, but exposes no reply, assign, close or escalate controls.

**Why:** Human handover and AI booking are Milestone 8 scopes; pretending a button works before its server workflow and audit trail exists would be fake functionality.

**Cost:** Staff cannot act on a conversation from this screen yet; that is intentional and visible.

---

## D-044 — Only active approved knowledge entries enter the prompt

**Status:** Accepted and implemented (Milestone 7)

**Decision:** `getApprovedAiKnowledgeEntries()` returns at most 50 active entries. Inactive entries remain in the database for audit and review, not in the assistant context.

**Why:** Draft, outdated or retired clinic policies must not silently shape answers after a doctor deactivates them.

**Cost:** The assistant prompt can get long; the 50-entry cap keeps the model request bounded.

---

## D-045 — Knowledge management is doctor-only; staff can read but not write

**Status:** Accepted and implemented (Milestone 7)

**Decision:** `/dashboard/ai-receptionist/knowledge` uses doctor-only Server Actions with RLS and audit events; staff see a read-only catalogue.

**Why:** Approved answers become part of every administrative reply, so clinical and clinic-policy wording must stay under the doctor's control.

**Cost:** Staff cannot make or edit knowledge entries themselves; they can only ask the doctor to do so.

---

## D-046 — AI booking is only exposed through allow-listed backend tools

**Status:** Accepted and implemented (Milestone 8)

**Decision:** The OpenAI assistant can call only `search_available_slots`, `create_ai_booking` or `request_human_handover`, all executed server-side with the service role. Booking validation and capacity checks stay in Postgres.

**Why:** An LLM must not be able to invent availability or write arbitrary rows. A tool call is structured, auditable and can fail safely.

**Cost:** The assistant's booking UX is limited to what the tools allow; conversational freedom is intentionally constrained.

---

## D-047 — Tool traces are stored in the same ordered transcript

**Status:** Accepted and implemented (Milestone 8)

**Decision:** Tool messages are written immediately after each tool executes as ordered `ai_messages` rows with `role = 'tool'`, `tool_name`, arguments (`tool_payload`) and the result. Visitor and assistant messages surround them in call order.

**Why:** A reviewer needs a reliable timeline: what the visitor asked, what the tool did, and what the assistant then claimed.

**Cost:** The transcript may include the exact booking argument set (including patient phone number). That is intended for clinic review only; the inbox is authenticated and clinic-only.

---

## D-048 — Closed AI conversations are terminal

**Status:** Accepted and implemented (Milestone 8)

**Decision:** `closed` is a terminal state in the MVP. The inbox can mark a conversation assigned or closed, but it cannot reopen a closed record; a new visitor request starts a new conversation.

**Why:** Reopening risks reintroducing a stale conversation with a different context. A new conversation keeps the audit and review trail clean.

**Cost:** The clinic loses the ability to continue an old conversation in place; this is deliberate until a retention/reopen workflow is requested.

---

## D-049 — Patient and consultation writes are atomic database functions

**Status:** Accepted and implemented (Milestone 6 remainder)

**Decision:** Patient creation and consultation/prescription/follow-up creation use service-role-only Postgres functions (`create_patient_record`, `create_consultation_record`). The UI and Server Actions handle roles, RLS and audit logging around those functions.

**Why:** Patient and consultation records span multiple tables; a partial clinical record is worse than no record.

**Cost:** The service role must remain carefully scoped; these functions never run from the browser.

---

## D-050 — Feedback is never published and never identifies a patient name or email

**Status:** Accepted and implemented (Milestone 9)

**Decision:** `/feedback` collects only a rating and comment. No appointment reference, patient identifier, name or email is stored. The clinic UI shows private feedback for review and response drafts, not public testimonials.

**Why:** Public-display obligations, privacy and consent are outside this MVP. The safest default is no public display and no unnecessary identity data.

**Cost:** The clinic cannot automatically route feedback to the source appointment or ask a patient to edit an entry.

---

## D-051 — Reminder workers create queue rows, not fake delivery

**Status:** Accepted and implemented (Milestone 9)

**Decision:** `/api/cron/remind` requires a bearer `CRON_SECRET` and writes dashboard-channel reminder rows for due follow-ups. It does not call email/WhatsApp providers or mark anything delivered until real delivery succeeds later.

**Why:** Never say a reminder was sent when no channel delivered it. A queued in-app reminder is useful and honest; external providers can be connected deliberately later.

**Cost:** Patients do not receive off-app reminders until a provider is connected and tested.
