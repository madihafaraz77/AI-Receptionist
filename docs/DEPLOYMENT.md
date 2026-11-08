# Deployment guide — Nissa Homeopathic Clinic

This guide explains how to put the app online safely and how to configure the
services it will use. It is written for a beginner and assumes Windows
PowerShell unless stated otherwise.

> **Important:** a Vercel production deployment now exists for the code in this workspace, but it is **not production-accepted** yet. No Supabase or OpenAI environment variables have been configured in the host, and the app remains behind Vercel Deployment Protection.
> Do not describe it as live until every step has been completed and the live
> URLs have been checked.

### Current deployment

- Project: `nissa-ai-receptionist`
- Alias: `https://nissa-ai-receptionist.vercel.app`
- Protection: currently enabled by Vercel Deployment Protection
- Supabase environment: not configured in Vercel
- OpenAI environment: not configured in Vercel
- Cron: daily at 08:30 UTC because the Vercel Hobby plan does not allow more frequent crons

## 0. What can be deployed today

The current code contains **Milestones 1–9**:

- the public information website;
- the doctor sign-in page;
- the protected dashboard shell, overview, editable clinic settings and services catalogue;
- the database schema, RLS policies, storage bucket and seed data;
- the public booking flow (availability and transactional reservation; untested live);
- the dashboard appointments workspace with date/status filters and confirm, complete and cancellation actions;
- the follow-ups workspace with status filtering and complete/cancel actions;
- an OpenAI-gated public assistant experience with restricted administrative help;
- AI controlled booking tools, handover workflow and a dashboard review inbox with assignment/close actions;
- a doctor-managed approved knowledge base;
- the follow-up reminder cron, private patient attachments, private feedback and doctor feedback review.

Rescheduling and no-show handling are not implemented. Email and WhatsApp providers are not configured, and external delivery is not guaranteed. Deploying today is useful for a controlled private pilot; the app still has **not been verified against a live Supabase/OpenAI project** and should not be presented as a verified clinic management system.

## 1. Prerequisites

- Node.js 20 or newer. This project was verified with Node 26.
- npm.
- A [Supabase](https://supabase.com) account and project.
- A [GitHub](https://github.com) account.
- A [Vercel](https://vercel.com) account.
- Git installed locally. Git was **not available** in the environment used for
  this QA pass, so repository commands below have not been run here.

Check the tools:

```powershell
node --version
npm.cmd --version
git --version
```

On Windows, if PowerShell blocks `npm`, use `npm.cmd` for every command.

## 2. Environment variables

Copy `.env.example` to `.env.local` for local development. Never commit
`.env.local` — it is already ignored by `.gitignore`.

### Required today

| Variable | Where it is used | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server Supabase clients | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server Supabase clients | No (RLS protects data) |
| `SUPABASE_SECRET_KEY` | Server-only admin client | **Yes** |

Legacy names are also accepted: `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY`. Use one naming scheme, not both.

### Optional today

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public site URL for absolute links and metadata |
| `OPENAI_API_KEY` | Server-only OpenAI key for the public AI receptionist |
| `OPENAI_MODEL` | Required model name when `OPENAI_API_KEY` is set; missing either keeps the chat visibly not connected |
| `CRON_SECRET` | Bearer secret required for `/api/cron/remind` reminder runs |

### Planned, not used by the current code

These variables are documented now so deployment can be prepared, but the app
does **not** read them yet. Setting them will not enable the feature.

| Variable | Planned feature |
| --- | --- |
| GEMINI_API_KEY, GEMINI_MODEL | Alternative AI provider (not implemented) |
| RESEND_API_KEY, NOTIFICATION_FROM_EMAIL, NOTIFICATION_REPLY_TO | Email notifications (Milestone 9) |
| `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` | WhatsApp notifications (Milestone 9) |

Rules:

- Only `NEXT_PUBLIC_*` values reach the browser.
- `SUPABASE_SECRET_KEY`, AI keys, notification keys and `CRON_SECRET` must stay
  server-side.
- Never paste a secret into a chat, a screenshot, a commit or a `NEXT_PUBLIC_*`
  variable.
- Rotate any key that may have been exposed.

## 3. Supabase setup

### 3.1 Create the project

1. Sign in at <https://supabase.com> and create a project, for example
   `nissa-clinic`.
2. Choose the region closest to the clinic.
3. Wait for provisioning to finish.
4. Copy the **Project URL**, **publishable key** and **secret key** from the
   Connect dialog or **Project Settings → API Keys**.
5. Put them in `.env.local` (local) and in Vercel (production).

### 3.2 Disable public sign-up (critical)

Supabase projects can allow anyone to create an account. Even with this app's
inactive-by-default profiles, public sign-up is unnecessary attack surface.

1. Open **Authentication → Sign In / Providers → Email**.
2. Turn **off** “Allow new users to sign up”.
3. Keep email/password enabled.
4. Create clinic accounts only from **Authentication → Users → Add user**.

The database migration marks every new profile as **inactive**. The app fails
closed: an authenticated account without an active profile cannot enter the
dashboard. Both controls should stay in place.

### 3.3 Apply the migrations

Apply every file in `supabase/migrations/` in filename order:

| File | Purpose |
| --- | --- |
| `20261105000000_initial_schema.sql` | Enums, 19 tables, indexes, triggers, auth profile trigger |
| `20261105000100_rls_policies.sql` | Row Level Security and role helpers |
| `20261105000200_functions.sql` | Capacity-safe `create_appointment`, audit helper |
| `20261105000300_storage.sql` | Private `patient-attachments` bucket and policies |
| `20261105000400_seed.sql` | Confirmed clinic settings, services and hours |
| `20261105000500_security_hardening.sql` | Inactive-by-default accounts, overlap protection, server-only booking writes |
| `20261105000600_clinic_settings_services_constraints.sql` | Milestone 3 integrity constraints for settings and services |
| `20261105000700_public_booking.sql` | Milestone 4 booking functions, patient-reference sequence and overlap-aware create_appointment |
| `20261105000800_appointment_status_actions.sql` | Milestone 5 transactional appointment status changes with events and before/after audit |
| `20261105000900_follow_up_status_actions.sql` | Milestone 6 follow-up status changes with before/after audit rows |
| `20261105001000_ai_conversation_logging.sql` | Milestone 7 AI conversation and message logging |
| `20261105001100_ai_handover_actions.sql` | Milestone 8 tool-call logging, human handover and status actions |
| `20261105001200_patient_consultation_creation.sql` | Milestone 6 patient and consultation creation transactions |

**Option A — Supabase CLI (recommended):**

```powershell
npm.cmd install --global supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

**Option B — SQL Editor:**

Open **SQL Editor**, paste one file at a time, and run them in order. Do not skip
the RLS or hardening migrations.

The migrations have **not** been run against a live project in this QA pass.
Check the SQL Editor history for errors and verify the tables before continuing.

### 3.4 Create and activate the doctor

1. Open **Authentication → Users → Add user**.
2. Enter the doctor's email address and a strong password.
3. Confirm the email (or use “Auto Confirm User”).
4. Copy the new user's UUID.
5. Run this in the SQL Editor, replacing the placeholders:

```sql
update public.profiles
set role = 'doctor',
    is_active = true,
    full_name = 'Doctor name supplied by the clinic'
where id = 'THE_AUTH_USER_UUID';
```

The sign-in will fail closed until `is_active = true`.

### 3.5 Activate invited staff

Every new auth user is created as an inactive `staff` profile. Activate only the
people who should see clinic data:

```sql
update public.profiles
set is_active = true
where id = 'THE_STAFF_AUTH_USER_UUID';
```

Clinical records and prescriptions remain doctor-only through RLS.

### 3.6 Verify security

Run in the SQL Editor:

```sql
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Then check:

- An anonymous request cannot read `patients`, `appointments`,
  `consultations`, `prescriptions`, `feedback`, `ai_*`, `notifications` or
  `audit_logs`.
- An inactive account can sign in with Supabase Auth but cannot enter the
  dashboard and is signed out.
- An active staff account can read clinic data but cannot write clinical data.
- The doctor can read and write clinical data.
- The `patient-attachments` bucket is private and limited to 10 MB with
  PDF/JPEG/PNG/WebP files.

Record the results in the launch checklist. Do not disable RLS to make a query
work.

## 4. GitHub repository

Git is not installed in the environment used for this audit. Install
[Git for Windows](https://git-scm.com/download/win) first.

```powershell
cd "C:\Users\HM Traders\OneDrive\Desktop\AI Receptionist"
git init
git add .
git status
git commit -m "Nissa clinic MVP: foundation, auth and QA hardening"
git branch -M main
```

Before committing, confirm that `git status` does **not** list `.env.local`,
`.next/`, `node_modules/` or `tsconfig.tsbuildinfo`.

Create a **private** repository on GitHub, then:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/nissa-clinic.git
git push -u origin main
```

Never commit real patient data. Use fictional data for demos.

## 5. Vercel deployment

1. Sign in at <https://vercel.com>.
2. Choose **Add New → Project** and import the GitHub repository.
3. Framework preset: **Next.js**.
4. Build command: `npm run build`.
5. Install command: `npm install`.
6. Add environment variables for **Production**, **Preview** and **Development**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `NEXT_PUBLIC_APP_URL` (use the Vercel URL at first)
7. Deploy.
8. Open the deployment and check:
   - `/` and every public page return 200.
   - `/login` renders.
   - `/dashboard` redirects to `/login` when signed out.
   - The doctor can sign in and sign out.
   - `/dashboard` shows empty states, not sample data.
   - An inactive account is refused.
9. Update `NEXT_PUBLIC_APP_URL` to the final domain and redeploy.
10. Add a custom domain in **Settings → Domains** if required. Enable HTTPS.

Do not mark the deployment complete until these checks pass against the live
URL. This QA pass did **not** deploy the app.

## 6. Scheduled jobs

**Not configured. The current app has no scheduled routes or workers.**

When Milestone 9 adds notifications and reminders:

- Prefer **Vercel Cron** for a small MVP. Add a `vercel.json` cron entry and a
  Route Handler such as `/api/cron/notifications`.
- Protect the route with `Authorization: Bearer $CRON_SECRET`. Reject requests
  without it.
- Make the worker idempotent: claim each notification row once and store the
  provider message ID.
- Alternatively, use Supabase `pg_cron` with a secure database function.
- Never expose the worker without a secret; it can send real messages.

## 7. Notification provider configuration

**Status: not connected.** The dashboard and settings page say so. Do not change
that label until a real message has been sent and verified.

### Email (planned: Resend)

1. Create a Resend account.
2. Add and verify the clinic's sending domain (SPF/DKIM records).
3. Create an API key.
4. Set `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL` and
   `NOTIFICATION_REPLY_TO` in Vercel.
5. Send a test message to the clinic owner.
6. Record the provider message ID and delivery status in `notifications`.

### WhatsApp (provider not selected)

1. Choose a WhatsApp Business provider.
2. Complete business verification.
3. Register the clinic phone number and copy the phone number ID.
4. Create a permanent access token.
5. Submit message templates for approval.
6. Set the WhatsApp environment variables and webhook verify token.
7. Test with the clinic's own number before enabling patient messages.

WhatsApp messages sent outside an approved template window may be rejected.

## 8. AI provider configuration

**Status: not implemented.** The AI page is an honest preview. No model is
called and no key is used.

When Milestone 7–8 is built:

1. Choose one provider (OpenAI or Gemini) and set its key server-side only.
2. Store the model name in an environment variable.
3. Use a restricted system prompt: no diagnosis, no prescriptions, no report
   interpretation, no clinical record access, no invented clinic facts.
4. Load only active `ai_knowledge_entries` as the knowledge base.
5. Expose only allow-listed tools: check availability, create booking,
   reschedule, cancel, escalate.
6. Route every booking through the same validated server function as the
   website.
7. Escalate medical questions and uncertainty to a human.
8. Log conversations, tool calls and safety flags for review.
9. Add rate limiting and per-conversation limits before exposing the endpoint.
10. Test adversarial prompts, including attempts to extract records or change
    clinic facts.

## 9. Rollback and backups

- Enable Supabase point-in-time recovery or scheduled backups before real
  patient data is entered.
- Keep migrations in version control. To roll back a deployment, use Vercel's
  previous deployment; database rollbacks need a reviewed SQL plan.
- Rotate keys immediately if a secret is exposed.
- Agree a patient-data retention and deletion policy with the clinic.

## 10. Launch checklist

- [ ] Supabase project created and keys stored safely.
- [ ] Public sign-up disabled.
- [ ] All migrations (currently thirteen) applied without errors.
- [ ] Clinic timezone configured in `/dashboard/settings` (required for booking, reporting and reminders).
- [ ] Public booking smoke-tested (availability and booking round trip).
- [ ] Follow-up complete/cancel actions smoke-tested, including audit rows.
- [ ] AI receptionist configured and smoke-tested for factual answers and emergency/medical refusals; no fake booking claim.
- [ ] Approved knowledge entries are created, active, inactive and verified to influence or stop influencing answers.
- [ ] AI tool booking is tested end-to-end; assistant never claims a booking until the backend confirms it.
- [ ] `CRON_SECRET` set; `/api/cron/remind` called manually and reminder rows appear in the dashboard notifications. The current `vercel.json` schedule is daily at 08:30 UTC because the Vercel Hobby plan does not allow more frequent crons.
- [ ] Feedback submitted as an anonymous visitor, then reviewed/archived as the doctor; response stays private.
- [ ] Emergency/human-request handover flags appear in `/dashboard/ai-receptionist`; assignment and close actions are verified.
- [ ] AI conversations appear in `/dashboard/ai-receptionist`; inbox is read-only.
- [ ] Doctor account created, `role = 'doctor'`, `is_active = true`.
- [ ] Staff accounts activated deliberately.
- [ ] RLS verified as anonymous, inactive, staff and doctor.
- [ ] Private storage bucket verified.
- [ ] GitHub repository created (private) and `.env.local` not committed.
- [ ] Vercel environment variables set for all environments.
- [ ] Production deployment succeeds.
- [ ] Public routes return 200 and unknown routes return 404.
- [ ] Sign-in, sign-out and dashboard protection verified live.
- [ ] Security headers observed on the live response.
- [ ] No feature is described as working before it is connected and tested.
- [ ] Fictional data only in demonstrations.

Items that depend on live verification of Milestones 3–4 and on Milestones 5–9
(booking round trip, appointment actions, patients, clinical records, AI,
notifications) are intentionally unchecked.
