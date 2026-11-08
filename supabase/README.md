# Supabase setup — Nissa Homeopathic Clinic

This folder contains the database migrations for Milestones 2 and 10. The app
code is ready; these steps connect it to a real Supabase project.

> Never commit `.env.local`, the service-role key, or any real patient data.
>
> The migrations have **not** been run against a live project in the QA pass.
> Verify each step in the SQL Editor before inviting real users.

## 1. Create the project

1. Sign in at <https://supabase.com> and create a project (for example
   `nissa-clinic`).
2. Choose the region closest to the clinic.
3. Wait for the database to finish provisioning.
4. Open the **Connect** dialog (top of the project dashboard) or **Project
   Settings → API Keys**, then copy:
   - **Project URL**
   - **publishable key** (`sb_publishable_…`) — safe in the browser
   - **secret key** (`sb_secret_…`) — server-only, bypasses RLS

If your project still shows the legacy keys, the **anon** key replaces the
publishable key and the **service_role** key replaces the secret key. Supabase is
deprecating the legacy keys by the end of 2026, so prefer the new ones.

## 2. Configure the app

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
SUPABASE_SECRET_KEY=sb_secret_YOUR_KEY
```

Legacy alternative (still supported):

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Restart the dev server after changing environment variables:

```powershell
npm.cmd run dev
```

If the keys are missing, the dashboard and `/login` show a setup notice. No
sample data is displayed.

## 2.1 Disable public sign-up

Open **Authentication → Sign In / Providers → Email** and turn **off** “Allow new
users to sign up”. Accounts must be created only from **Authentication → Users**.

The database also marks every new profile as **inactive**. Both controls matter:
public sign-up is unnecessary attack surface, and an accidentally created account
must not receive clinic data automatically.

## 3. Apply the migrations

The files are ordered by filename. Apply **all thirteen** in order:

| File | Purpose |
| --- | --- |
| `20261105000000_initial_schema.sql` | Enums, 19 tables, indexes, triggers, auth profile trigger |
| `20261105000100_rls_policies.sql` | Row Level Security and role helpers |
| `20261105000200_functions.sql` | Capacity-safe `create_appointment`, audit helper |
| `20261105000300_storage.sql` | Private `patient-attachments` bucket and policies |
| `20261105000400_seed.sql` | Confirmed clinic settings, services and hours |
| `20261105000500_security_hardening.sql` | Inactive-by-default accounts, overlap protection, server-only booking writes |
| `20261105000600_clinic_settings_services_constraints.sql` | Milestone 3 integrity constraints for settings and services |
| `20261105000700_public_booking.sql` | Milestone 4 public booking functions, patient-reference sequence and overlap-aware create_appointment |
| `20261105000800_appointment_status_actions.sql` | Milestone 5 transactional appointment status changes with events and audit rows |
| `20261105000900_follow_up_status_actions.sql` | Milestone 6 follow-up status changes with before/after audit rows |
| `20261105001000_ai_conversation_logging.sql` | Milestone 7 AI conversation and message logging |
| `20261105001100_ai_handover_actions.sql` | Milestone 8 tool-call logging, human handover and status actions |
| `20261105001200_patient_consultation_creation.sql` | Milestone 6 patient and consultation creation transactions |

### Option A — Supabase CLI (recommended)

```bash
npm install --global supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The project ref is in **Project Settings → General**.

### Option B — SQL Editor

Open **SQL Editor**, paste one file at a time, and run them in the order above.
Do not skip the RLS migration.

## 4. Create the doctor account

1. Open **Authentication → Users → Add user**.
2. Enter the doctor's email and a strong password.
3. Confirm the email (or use “Auto Confirm User”).
4. Copy the new user's UUID.
5. Promote and activate the profile in the SQL Editor:

```sql
update public.profiles
set role = 'doctor',
    is_active = true,
    full_name = 'Doctor name to be supplied'
where id = 'THE_AUTH_USER_UUID';
```

**Sign-in fails closed until `is_active = true`.** The trigger creates every new
auth user as an inactive `staff` profile, so public sign-up can never grant
doctor access even if it is accidentally left enabled.

### Activate invited staff

```sql
update public.profiles
set is_active = true
where id = 'THE_STAFF_AUTH_USER_UUID';
```

Deactivate an account without deleting its audit history:

```sql
update public.profiles
set is_active = false
where id = 'THE_AUTH_USER_UUID';
```

## 5. Verify

1. Visit `/login` and sign in as the activated doctor.
2. `/dashboard` should load with empty states (no appointments or patients yet).
3. The overview should show zeros, not sample records.
4. Sign out and confirm `/dashboard` redirects to `/login`.
5. Create a test auth user **without** activating its profile and confirm it is
   signed out with “This account does not have clinic access.”
6. If you see “Database tables are not ready”, one of the migrations did not
   run. Check the SQL Editor history.
7. If you see “Clinic timezone not configured”, that is expected. The timezone
   is intentionally `NULL` until the owner supplies it. The dashboard uses UTC
   and says so.
8. Set the clinic timezone in `/dashboard/settings` before testing online booking.
   Online booking cannot know a clinic day without it.
9. On `/book`, choose an active service and a date; confirm genuine slots appear.
   Book one and verify it appears in `/dashboard` with the correct status and in
   `audit_logs` as `appointment.created`.
10. Try booking a closed day and an overlapping slot; both must be rejected.
11. If pre-existing `follow_ups` rows are seeded manually, mark one completed and
    one cancelled; confirm both audit entries appear and completed rows cannot be
    transitioned again.
12. If OpenAI is configured, send one assistant message as a visitor and confirm
    `/dashboard/ai-receptionist` shows the exchange and its safety flag when one
    was triggered.
13. Add one approved knowledge entry, send a relevant question, then deactivate
    it and confirm the answer no longer relies on it.
14. Send an AI availability request and complete one AI booking; confirm it appears
    in `/dashboard/appointments`.
15. Send a medical or emergency message, confirm the conversation becomes
    `needs_human`, then assign, return to AI and close it from the inbox.

### RLS smoke test

Run these in the SQL Editor as the `postgres` role to inspect policies:

```sql
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Then sign in as the doctor and confirm the dashboard reads data. A separate
anonymous request must not be able to read `patients`, `appointments`,
`consultations`, `prescriptions`, `feedback`, `ai_*`, `notifications` or
`audit_logs`.

Booking writes are intentionally **not** available to browser sessions. The
hardening migration removes the `appointments` insert/update policies and the
appointment-event insert policy. `public.create_appointment` is executable only
by `service_role`, so the public `/book` Server Action and the Milestone 5
dashboard action call it from server code, never from the browser.

## 6. Storage

The migration creates a **private** bucket named `patient-attachments` with a
10 MB limit and PDF/JPEG/PNG/WebP MIME types. Files are served through
short-lived signed URLs. Upload UI arrives in Milestone 6.

## 7. Deploying to Vercel

See [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for the full beginner-friendly
guide. In short, add the same environment variables in **Vercel → Project →
Settings → Environment Variables** for Production, Preview and Development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`)

The secret key is server-only. Never prefix it with `NEXT_PUBLIC_`.

## 8. Regenerating TypeScript types (optional)

Once the project is linked and the schema is applied, generate exact database
types:

```bash
supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts
```

The Milestone 2 dashboard uses explicit view-model types in
`src/lib/dashboard/types.ts`, so this is an enhancement rather than a
requirement.

## 9. Security reminders

- RLS is enabled on all 19 tables. Do not disable it to “fix” a query.
- Disable public sign-up in Supabase Auth. New profiles are inactive until a
  doctor activates them.
- The secret key (`sb_secret_…`) and the legacy service-role key bypass RLS. Use
  them only in server code, never in a browser or a `NEXT_PUBLIC_` variable.
- Clinical writes are doctor-only.
- Appointment writes must go through `public.create_appointment`; direct browser
  inserts and updates are blocked.
- The AI receptionist never receives clinical records.
- Rotate keys immediately if a secret or service-role key is ever exposed.
- Before entering real patient data, agree a retention/backup policy with the
  clinic and enable point-in-time recovery.
