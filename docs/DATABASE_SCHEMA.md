# Database schema — Nissa Homeopathic Clinic

Last updated: Milestone 8 AI booking/handover code delivered. Migrations are not yet applied to a live project.

> **Status: migrations written, not yet applied to a live project.** The SQL in
> `supabase/migrations/` implements everything described here. Applying it and
> verifying RLS requires the owner's Supabase project (see `supabase/README.md`).
> No preview or sample records exist in the codebase.

## Principles

- **PostgreSQL via Supabase.** UUID primary keys, `timestamptz` timestamps,
  foreign keys, check constraints and indexes on every query path.
- **Row Level Security on every table.** Public visitors get read-only access to
  published services and public clinic information. Patient and clinical data is
  doctor/staff only.
- **Clinical writes are doctor-only.** The AI receptionist never writes clinical
  records.
- **Capacity is enforced in the database.** A booking is only confirmed after a
  transactional check succeeds.
- **Soft state, hard history.** Status changes are recorded in event tables
  instead of overwriting history.
- **No invented data.** Missing clinic values stay `NULL` until the owner
  supplies them.

## Enumerated types

```sql
create type user_role as enum ('doctor', 'staff');
create type consultation_mode as enum ('in_person', 'online');
create type booking_approval as enum ('automatic', 'manual');
create type appointment_status as enum (
  'pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled'
);
create type booking_source as enum ('website', 'ai_receptionist', 'staff');
create type follow_up_status as enum ('scheduled', 'sent', 'completed', 'cancelled');
create type feedback_status as enum ('new', 'reviewed', 'responded', 'archived');
create type ai_conversation_status as enum (
  'active', 'needs_human', 'handed_over', 'closed'
);
create type ai_message_role as enum ('visitor', 'assistant', 'system', 'tool');
create type notification_channel as enum ('dashboard', 'email', 'whatsapp');
create type notification_status as enum (
  'queued', 'sent', 'delivered', 'failed', 'not_connected'
);
```

## Tables (19)

### 1. `profiles`

Doctor and staff accounts linked to Supabase Auth.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | References `auth.users(id)` on delete cascade |
| `role` | `user_role` | Not null, default `'staff'` |
| `full_name` | `text` | Not null |
| `phone` | `text` | Nullable |
| `is_active` | `boolean` | Not null, default `false` (Milestone 10 hardening) |
| `created_at` | `timestamptz` | Not null, default `now()` |
| `updated_at` | `timestamptz` | Not null, default `now()` |

Rules: no public sign-up; accounts are created by invitation. New profiles are
inactive until a doctor sets `is_active = true`. Only one active `doctor` is
expected for the MVP.

### 2. `clinic_settings`

Singleton row holding the confirmed clinic configuration.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `boolean` PK | `check (id)` — exactly one row |
| `name` | `text` | Not null |
| `address` | `text` | Nullable until supplied |
| `phone` | `text` | Nullable until supplied |
| `email` | `text` | Nullable until supplied |
| `timezone` | `text` | Nullable until supplied (IANA name) |
| `doctor_name` | `text` | Nullable until supplied |
| `opening_time` | `time` | Not null, default `'11:00'` |
| `closing_time` | `time` | Not null, default `'17:00'` |
| `appointment_duration_minutes` | `integer` | Not null, default `45`, `check between 5 and 240` |
| `daily_capacity` | `integer` | Not null, default `8`, `check between 1 and 100` |
| `working_weekdays` | `smallint[]` | Not null, default `{1,2,3,4,5,6}` (ISO 1–7), `check (cardinality > 0)` |
| `booking_approval` | `booking_approval` | Not null, default `'automatic'` |
| `walk_ins_enabled` | `boolean` | Not null, default `false` |
| `consultation_fee_pkr` | `integer` | Not null, default `500`, `check between 0 and 1,000,000` |
| `online_consultation_enabled` | `boolean` | Not null, default `true` |
| `follow_up_reminder_hours` | `integer` | Not null, default `24`, `check between 1 and 720` |
| `ai_escalation_channels` | `notification_channel[]` | Not null |
| `notification_channels` | `notification_channel[]` | Not null |
| `updated_by` | `uuid` | References `profiles(id)` |
| `updated_at` | `timestamptz` | Not null, default `now()` |

Rules: seeded from `src/config/clinic.ts` in Milestone 3. Once seeded, the
database is the source of truth and is editable from the dashboard by the doctor.
Milestone 3 also adds matching constraints: `name` 2–120 characters,
`closing_time > opening_time`, and length checks on the optional contact fields.

### 3. `services`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `slug` | `text` | Unique, not null, `check` `^[a-z0-9]+(-[a-z0-9]+)*$`, 2–80 characters |
| `name` | `text` | Not null, `check` 2–120 characters |
| `description` | `text` | Not null, `check` 10–600 characters, factual, no medical claims |
| `duration_minutes` | `integer` | Not null, `check` 5–240 |
| `fee_pkr` | `integer` | Not null, `check` 0–1,000,000 |
| `mode` | `consultation_mode` | Not null |
| `is_active` | `boolean` | Not null, default `true`; archiving keeps appointment records |
| `sort_order` | `integer` | Not null, default `0`, `check` 0–999 |
| `created_at` / `updated_at` | `timestamptz` | Not null |

Seed: homeopathic consultation, online consultation, follow-up consultation.
Milestone 3 adds the matching integrity constraints in
`20261105000600_clinic_settings_services_constraints.sql` so the same rules hold
outside the application.

### 4. `clinic_hours`

Per-weekday opening hours. Supports a midday break without changing the global
opening/closing defaults.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `weekday` | `smallint` | Unique, `check between 1 and 7` |
| `is_open` | `boolean` | Not null, default `true` |
| `opening_time` | `time` | Not null |
| `closing_time` | `time` | Not null, `check (closing_time > opening_time)` |
| `break_start` | `time` | Nullable |
| `break_end` | `time` | Nullable |
| `created_at` / `updated_at` | `timestamptz` | Not null |

Seed: Monday–Saturday 11:00–17:00, Sunday closed.

### 5. `clinic_closures`

Holidays and one-off closures.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `closure_date` | `date` | Not null, unique |
| `reason` | `text` | Nullable |
| `created_by` | `uuid` | References `profiles(id)` |
| `created_at` | `timestamptz` | Not null |

### 6. `patients`

Administrative patient record. Clinical details live in `consultations`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `reference` | `text` | Unique, not null (for example `NIS-1001`; issued by `patient_reference_seq`) |
| `full_name` | `text` | Not null |
| `phone` | `text` | Not null (used for reminders) |
| `email` | `text` | Nullable |
| `date_of_birth` | `date` | Nullable |
| `gender` | `text` | Nullable, free text |
| `address` | `text` | Nullable |
| `admin_notes` | `text` | Nullable, non-clinical only |
| `created_by` | `uuid` | References `profiles(id)` |
| `created_at` / `updated_at` | `timestamptz` | Not null |

Indexes: unique `reference`, index on `phone`, index on `full_name`.

### 7. `patient_attachments`

Private files stored in Supabase Storage.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `patient_id` | `uuid` | References `patients(id)` on delete cascade |
| `storage_path` | `text` | Not null, unique, private bucket path |
| `file_name` | `text` | Not null |
| `mime_type` | `text` | Not null |
| `size_bytes` | `bigint` | Not null, `check > 0` |
| `uploaded_by` | `uuid` | References `profiles(id)` |
| `created_at` | `timestamptz` | Not null |

Rules: private bucket, signed URLs only, size and MIME limits enforced server-side.

### 8. `appointments`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `reference` | `text` | Unique, not null |
| `patient_id` | `uuid` | References `patients(id)` |
| `service_id` | `uuid` | References `services(id)` |
| `appointment_date` | `date` | Not null |
| `start_time` | `time` | Not null |
| `end_time` | `time` | Not null, `check (end_time > start_time)` |
| `mode` | `consultation_mode` | Not null |
| `status` | `appointment_status` | Not null, default `'confirmed'` |
| `source` | `booking_source` | Not null |
| `fee_pkr` | `integer` | Not null, `check >= 0` |
| `patient_notes` | `text` | Nullable, visitor-supplied |
| `internal_notes` | `text` | Nullable, doctor/staff only |
| `created_by` | `uuid` | Nullable for public/AI bookings |
| `created_at` / `updated_at` | `timestamptz` | Not null |
| `cancelled_at` | `timestamptz` | Nullable |
| `cancellation_reason` | `text` | Nullable |

Constraints and indexes:

```sql
-- No two active appointments may share a start time.
create unique index appointments_unique_slot
  on appointments (appointment_date, start_time)
  where status in ('pending', 'confirmed');

-- No two active appointments may overlap in time. Added in Milestone 10.
alter table appointments
  add constraint appointments_no_overlap
  exclude using gist (
    appointment_date with =,
    tsrange(
      appointment_date + start_time,
      appointment_date + end_time,
      '[)'
    ) with &&
  )
  where (status in ('pending', 'confirmed'));

create index appointments_by_date on appointments (appointment_date, start_time);
create index appointments_by_patient on appointments (patient_id, appointment_date desc);
create index appointments_by_status on appointments (status, appointment_date);
```

### 9. `appointment_events`

Append-only history of appointment changes.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `appointment_id` | `uuid` | References `appointments(id)` on delete cascade |
| `event_type` | `text` | Not null (`created`, `confirmed`, `rescheduled`, `cancelled`, `completed`, `no_show`) |
| `from_status` | `appointment_status` | Nullable |
| `to_status` | `appointment_status` | Nullable |
| `actor_type` | `text` | Not null (`patient`, `doctor`, `staff`, `ai`, `system`) |
| `actor_id` | `uuid` | Nullable |
| `metadata` | `jsonb` | Not null, default `'{}'` |
| `created_at` | `timestamptz` | Not null |

Index: `(appointment_id, created_at)`.

### 10. `consultations`

Clinical record. **Doctor-only writes.**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `appointment_id` | `uuid` | Unique, nullable, references `appointments(id)` |
| `patient_id` | `uuid` | Not null, references `patients(id)` |
| `doctor_id` | `uuid` | Not null, references `profiles(id)` |
| `consulted_at` | `timestamptz` | Not null |
| `chief_complaint` | `text` | Nullable |
| `history` | `text` | Nullable |
| `examination` | `text` | Nullable |
| `assessment` | `text` | Nullable |
| `plan` | `text` | Nullable |
| `private_notes` | `text` | Nullable, doctor-only |
| `created_at` / `updated_at` | `timestamptz` | Not null |

Index: `(patient_id, consulted_at desc)`.

### 11. `prescriptions`

**Doctor-only writes.**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `consultation_id` | `uuid` | Not null, references `consultations(id)` on delete cascade |
| `patient_id` | `uuid` | Not null, references `patients(id)` |
| `doctor_id` | `uuid` | Not null, references `profiles(id)` |
| `issued_at` | `timestamptz` | Not null |
| `instructions` | `text` | Nullable |
| `follow_up_date` | `date` | Nullable |
| `created_at` / `updated_at` | `timestamptz` | Not null |

### 12. `prescription_items`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `prescription_id` | `uuid` | References `prescriptions(id)` on delete cascade |
| `remedy_name` | `text` | Not null |
| `potency` | `text` | Nullable |
| `dosage` | `text` | Nullable |
| `frequency` | `text` | Nullable |
| `duration_days` | `integer` | Nullable, `check > 0` |
| `notes` | `text` | Nullable |
| `sort_order` | `integer` | Not null, default `0` |
| `created_at` | `timestamptz` | Not null |

### 13. `follow_ups`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `patient_id` | `uuid` | References `patients(id)` |
| `consultation_id` | `uuid` | Nullable, references `consultations(id)` |
| `due_at` | `timestamptz` | Not null |
| `reminder_hours` | `integer` | Not null, default `24`, `check > 0` |
| `status` | `follow_up_status` | Not null, default `'scheduled'` |
| `completed_at` | `timestamptz` | Nullable |
| `notes` | `text` | Nullable |
| `created_at` / `updated_at` | `timestamptz` | Not null |

Index: `(status, due_at)`.

### 14. `feedback`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `appointment_id` | `uuid` | Nullable, references `appointments(id)` |
| `patient_id` | `uuid` | Nullable, references `patients(id)` |
| `rating` | `smallint` | Not null, `check between 1 and 5` |
| `comment` | `text` | Nullable |
| `status` | `feedback_status` | Not null, default `'new'` |
| `response` | `text` | Nullable |
| `responded_by` | `uuid` | Nullable, references `profiles(id)` |
| `responded_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | Not null |

Rules: feedback may be submitted anonymously in Milestone 9 through a validated
server action using the service role. There is no anonymous insert policy, so the
browser cannot write directly. Only clinic users can read and respond.

### 15. `ai_conversations`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `channel` | `text` | Not null (`website` for the MVP) |
| `visitor_name` | `text` | Nullable |
| `visitor_phone` | `text` | Nullable |
| `status` | `ai_conversation_status` | Not null, default `'active'` |
| `escalation_reason` | `text` | Nullable |
| `assigned_to` | `uuid` | Nullable, references `profiles(id)` |
| `started_at` | `timestamptz` | Not null |
| `last_message_at` | `timestamptz` | Not null |
| `closed_at` | `timestamptz` | Nullable |

Index: `(status, last_message_at desc)`.

### 16. `ai_messages`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `conversation_id` | `uuid` | References `ai_conversations(id)` on delete cascade |
| `role` | `ai_message_role` | Not null |
| `content` | `text` | Not null |
| `tool_name` | `text` | Nullable |
| `tool_payload` | `jsonb` | Nullable |
| `safety_flag` | `text` | Nullable (`medical_request`, `prompt_injection`, `uncertain`) |
| `created_at` | `timestamptz` | Not null |

Index: `(conversation_id, created_at)`.

### 17. `ai_knowledge_entries`

Doctor-approved content the assistant may use.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `title` | `text` | Not null |
| `category` | `text` | Not null (`hours`, `services`, `fees`, `policies`, `faq`) |
| `content` | `text` | Not null |
| `is_active` | `boolean` | Not null, default `true` |
| `updated_by` | `uuid` | References `profiles(id)` |
| `created_at` / `updated_at` | `timestamptz` | Not null |

Rules: no diagnoses, no promises of cures, no unapproved medical advice.

### 18. `notifications`

One row per outbound message attempt.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `channel` | `notification_channel` | Not null |
| `recipient` | `text` | Not null |
| `template` | `text` | Not null |
| `payload` | `jsonb` | Not null, default `'{}'` |
| `status` | `notification_status` | Not null, default `'queued'` |
| `related_table` | `text` | Nullable |
| `related_id` | `uuid` | Nullable |
| `provider_message_id` | `text` | Nullable |
| `error` | `text` | Nullable |
| `sent_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | Not null |

Index: `(status, created_at)`, `(related_table, related_id)`.

Rules: `not_connected` is used while email/WhatsApp is not configured. Never
mark a message `sent` before the provider accepts it.

### 19. `audit_logs`

Append-only trail for sensitive actions.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `actor_id` | `uuid` | Nullable, references `profiles(id)` |
| `actor_type` | `text` | Not null (`doctor`, `staff`, `system`, `ai`) |
| `action` | `text` | Not null (`settings.updated`, `appointment.cancelled`, `consultation.created`, `ai.escalated`, …) |
| `table_name` | `text` | Nullable |
| `record_id` | `uuid` | Nullable |
| `before` | `jsonb` | Nullable |
| `after` | `jsonb` | Nullable |
| `ip_address` | `inet` | Nullable |
| `created_at` | `timestamptz` | Not null |

Index: `(created_at desc)`, `(table_name, record_id)`.

## Booking capacity enforcement

Capacity is checked **inside a transaction**, not in the browser.

```sql
-- Conceptual flow for create_appointment(...)
begin;

-- Serialise bookings for the same date.
select pg_advisory_xact_lock(hashtext(p_date::text));

-- Reject closed days and closures.
-- Reject slots outside clinic hours or during a break.
-- Reject a slot that already has a pending/confirmed appointment.
-- Reject past dates when clinic_settings.timezone is configured.

select count(*) into v_count
from appointments
where appointment_date = p_date
  and status in ('pending', 'confirmed', 'completed');

if v_count >= (select daily_capacity from clinic_settings where id) then
  raise exception 'DAILY_CAPACITY_REACHED';
end if;

insert into appointments (...) values (...) returning id;
insert into appointment_events (...) values (...);

commit;
```

The unique partial index on `(appointment_date, start_time)` and the Milestone 10
exclusion constraint on the active time range are the final guards against two
simultaneous or overlapping bookings.

Milestone 4 adds:

- `public.create_website_booking(...)` — validates guest details, reuses or creates an administrative patient by normalized phone, creates audit entries, then delegates to `create_appointment` with `source = 'website'`.
- `public.create_patient_record(...)` — creates an administrative patient with a server-generated `NIS-####` reference and audit log.
- `public.create_consultation_record(...)` — doctor-only atomic consultation, optional prescription and follow-up creation.
- `public.get_available_slots(date, mode)` — returns only genuine openings after the working days, closures, hours, same-day time, 90-day window, capacity and overlap checks.
- `public.patient_reference_seq` — issues stable `NIS-1001`-style patient references.
- `public.normalize_phone(text)` — compares phone numbers by digits for patient matching.

Both booking functions are executable only by `service_role`, so the browser cannot call them directly. The public form goes through Server Actions.

## Row Level Security (implemented)

Every table has RLS enabled. `anon` can read only published clinic information;
`authenticated` clinic users get operational access; clinical tables are
doctor-only.

| Table | Public (`anon`) | Authenticated clinic user | Doctor only |
| --- | --- | --- | --- |
| `profiles` | No access | Read own profile | Read all, manage all |
| `clinic_settings` | Read (no secrets) | Read | Update |
| `services` | Read `is_active = true` | Read active | Full access |
| `clinic_hours`, `clinic_closures` | Read | Read | Manage |
| `patients` | No access | Read, insert, update | Delete |
| `patient_attachments` | No access | Read, insert, update | Delete |
| `appointments` | No direct access — writes go through `create_appointment` with the service role | Read only (write policies removed in Milestone 10) | Delete |
| `appointment_events` | No access | Read only (append-only; written by server) | — |
| `consultations`, `prescriptions`, `prescription_items` | No access | No access | Full access |
| `follow_ups` | No access | Read, insert, update | Delete |
| `feedback` | No access — public submission will use a server action | Read, update | Delete |
| `ai_conversations` | No access | Read, update | — |
| `ai_messages` | No access | Read | — |
| `ai_knowledge_entries` | No access | Read | Full access |
| `notifications` | No access | Read | — |
| `audit_logs` | No access | No access | Read (append-only, written by server) |

`auth.uid()` is compared with `profiles.id`, and the role is checked through the
`security definer` helpers `current_user_role()`, `is_clinic_user()` and
`is_doctor()` to avoid recursive policy lookups. Storage policies on
`storage.objects` use the same helpers for the private `patient-attachments`
bucket.

`public.create_patient_record(...)`, `public.create_consultation_record(...)`,
`public.create_appointment(...)`, `public.create_website_booking(...)`,
`public.get_available_slots(...)`, `public.set_appointment_status(...)`,
`public.set_follow_up_status(...)`, `public.ensure_ai_conversation(...)`,
`public.mark_ai_conversation_needs_human(...)`, `public.set_ai_conversation_status(...)`,
`public.log_ai_message(...)`, `public.log_ai_tool_message(...)`,
`public.log_ai_conversation_exchange(...)` and `public.log_audit_event(...)`
are executable only by `service_role`, so a browser session cannot book,
check availability in a way that bypasses the rules, update appointment/follow-up/AI
status, or write audit/AI transcript rows directly.

## Migration files (Milestone 2–8)

| File | Purpose |
| --- | --- |
| `20261105000000_initial_schema.sql` | Extensions, enums, shared `updated_at` trigger, 19 tables, indexes, auth profile trigger |
| `20261105000100_rls_policies.sql` | RLS on every table, role helpers, public and clinical policies |
| `20261105000200_functions.sql` | `create_appointment` (capacity-safe) and `log_audit_event`, service-role only |
| `20261105000300_storage.sql` | Private `patient-attachments` bucket (10 MB, PDF/JPEG/PNG/WebP) and policies |
| `20261105000400_seed.sql` | Confirmed clinic settings, three services, clinic hours |
| `20261105000500_security_hardening.sql` | Inactive-by-default profiles, overlap protection, server-only booking writes, past-date check |
| `20261105000600_clinic_settings_services_constraints.sql` | Milestone 3 integrity constraints for settings and services |
| `20261105000700_public_booking.sql` | Milestone 4 public booking functions, patient-reference sequence and overlap-aware `create_appointment` |
| `20261105000800_appointment_status_actions.sql` | Milestone 5 transactional appointment status changes with event and before/after audit rows |
| `20261105000900_follow_up_status_actions.sql` | Milestone 6 follow-up status changes with before/after audit rows |
| `20261105001000_ai_conversation_logging.sql` | Milestone 7 AI conversation and message logging |
| `20261105001100_ai_handover_actions.sql` | Milestone 8 tool-call logging, human handover and status actions |
| `20261105001200_patient_consultation_creation.sql` | Milestone 6 patient and consultation creation transactions |

Apply them in filename order. Full instructions are in `supabase/README.md`.

## Seed data

- One `clinic_settings` row with the confirmed defaults: 11:00–17:00, 45-minute
  appointments, capacity 8, Monday–Saturday, automatic approval, walk-ins off,
  PKR 500, online consultations on, 24-hour follow-up reminder.
- `NULL` for address, phone, email, doctor name and timezone until supplied.
- Three services matching `defaultServices` in `src/config/clinic.ts`.
- `clinic_hours` for Monday–Saturday, Sunday closed.
- No sample patients, appointments or clinical records. Preview data was deleted,
  not migrated.

## Data protection notes

- Patient and clinical tables are never exposed to public API keys.
- Attachments use a private bucket and short-lived signed URLs.
- Audit logs are append-only and retained for accountability.
- A retention/export policy will be agreed with the clinic before real patient
  data is entered.
- Backups and point-in-time recovery are configured on the Supabase project
  before launch.
