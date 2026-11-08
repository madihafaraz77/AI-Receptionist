-- ============================================================================
-- Nissa Homeopathic Clinic — initial schema
-- Milestone 2
--
-- Apply this file before the RLS, function and seed migrations.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('doctor', 'staff');
create type public.consultation_mode as enum ('in_person', 'online');
create type public.booking_approval as enum ('automatic', 'manual');
create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled'
);
create type public.booking_source as enum ('website', 'ai_receptionist', 'staff');
create type public.follow_up_status as enum ('scheduled', 'sent', 'completed', 'cancelled');
create type public.feedback_status as enum ('new', 'reviewed', 'responded', 'archived');
create type public.ai_conversation_status as enum (
  'active',
  'needs_human',
  'handed_over',
  'closed'
);
create type public.ai_message_role as enum ('visitor', 'assistant', 'system', 'tool');
create type public.notification_channel as enum ('dashboard', 'email', 'whatsapp');
create type public.notification_status as enum (
  'queued',
  'sent',
  'delivered',
  'failed',
  'not_connected'
);

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'staff',
  full_name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Every auth user gets a staff profile. Promote the doctor manually after the
-- account is created (see supabase/README.md). Never let sign-up self-assign
-- the doctor role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'staff',
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'clinic-user'), '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. clinic_settings (singleton)
-- ---------------------------------------------------------------------------
create table public.clinic_settings (
  id boolean primary key default true check (id),
  name text not null,
  address text,
  phone text,
  email text,
  timezone text,
  doctor_name text,
  opening_time time not null default '11:00',
  closing_time time not null default '17:00',
  appointment_duration_minutes integer not null default 45 check (appointment_duration_minutes > 0),
  daily_capacity integer not null default 8 check (daily_capacity > 0),
  working_weekdays smallint[] not null default '{1,2,3,4,5,6}'
    check (working_weekdays <@ '{1,2,3,4,5,6,7}'::smallint[]),
  booking_approval public.booking_approval not null default 'automatic',
  walk_ins_enabled boolean not null default false,
  consultation_fee_pkr integer not null default 500 check (consultation_fee_pkr >= 0),
  online_consultation_enabled boolean not null default true,
  follow_up_reminder_hours integer not null default 24 check (follow_up_reminder_hours > 0),
  ai_escalation_channels public.notification_channel[] not null
    default '{dashboard,email,whatsapp}'::public.notification_channel[],
  notification_channels public.notification_channel[] not null
    default '{dashboard,email,whatsapp}'::public.notification_channel[],
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create trigger clinic_settings_set_updated_at
before update on public.clinic_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. services
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  fee_pkr integer not null check (fee_pkr >= 0),
  mode public.consultation_mode not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. clinic_hours
-- ---------------------------------------------------------------------------
create table public.clinic_hours (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null unique check (weekday between 1 and 7),
  is_open boolean not null default true,
  opening_time time not null,
  closing_time time not null check (closing_time > opening_time),
  break_start time,
  break_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (break_start is null and break_end is null)
    or (break_start is not null and break_end is not null and break_end > break_start)
  )
);

create trigger clinic_hours_set_updated_at
before update on public.clinic_hours
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. clinic_closures
-- ---------------------------------------------------------------------------
create table public.clinic_closures (
  id uuid primary key default gen_random_uuid(),
  closure_date date not null unique,
  reason text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. patients
-- ---------------------------------------------------------------------------
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  full_name text not null,
  phone text not null,
  email text,
  date_of_birth date,
  gender text,
  address text,
  admin_notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patients_phone_idx on public.patients (phone);
create index patients_name_idx on public.patients (full_name);

create trigger patients_set_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. patient_attachments
-- ---------------------------------------------------------------------------
create table public.patient_attachments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index patient_attachments_patient_idx on public.patient_attachments (patient_id);

-- ---------------------------------------------------------------------------
-- 8. appointments
-- ---------------------------------------------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  patient_id uuid not null references public.patients (id),
  service_id uuid not null references public.services (id),
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  mode public.consultation_mode not null,
  status public.appointment_status not null default 'confirmed',
  source public.booking_source not null default 'website',
  fee_pkr integer not null default 500 check (fee_pkr >= 0),
  patient_notes text,
  internal_notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancellation_reason text,
  check (end_time > start_time)
);

create unique index appointments_unique_slot
  on public.appointments (appointment_date, start_time)
  where status in ('pending', 'confirmed');

create index appointments_by_date_idx on public.appointments (appointment_date, start_time);
create index appointments_by_patient_idx on public.appointments (patient_id, appointment_date desc);
create index appointments_by_status_idx on public.appointments (status, appointment_date);

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 9. appointment_events (append-only)
-- ---------------------------------------------------------------------------
create table public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  event_type text not null,
  from_status public.appointment_status,
  to_status public.appointment_status,
  actor_type text not null default 'system'
    check (actor_type in ('patient', 'doctor', 'staff', 'ai', 'system')),
  actor_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index appointment_events_appointment_idx
  on public.appointment_events (appointment_id, created_at);

-- ---------------------------------------------------------------------------
-- 10. consultations (doctor-only clinical record)
-- ---------------------------------------------------------------------------
create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid unique references public.appointments (id) on delete set null,
  patient_id uuid not null references public.patients (id),
  doctor_id uuid not null references public.profiles (id),
  consulted_at timestamptz not null,
  chief_complaint text,
  history text,
  examination text,
  assessment text,
  plan text,
  private_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index consultations_patient_idx
  on public.consultations (patient_id, consulted_at desc);

create trigger consultations_set_updated_at
before update on public.consultations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 11. prescriptions (doctor-only)
-- ---------------------------------------------------------------------------
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations (id) on delete cascade,
  patient_id uuid not null references public.patients (id),
  doctor_id uuid not null references public.profiles (id),
  issued_at timestamptz not null default now(),
  instructions text,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prescriptions_patient_idx on public.prescriptions (patient_id, issued_at desc);

create trigger prescriptions_set_updated_at
before update on public.prescriptions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 12. prescription_items
-- ---------------------------------------------------------------------------
create table public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions (id) on delete cascade,
  remedy_name text not null,
  potency text,
  dosage text,
  frequency text,
  duration_days integer check (duration_days is null or duration_days > 0),
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index prescription_items_prescription_idx
  on public.prescription_items (prescription_id, sort_order);

-- ---------------------------------------------------------------------------
-- 13. follow_ups
-- ---------------------------------------------------------------------------
create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id),
  consultation_id uuid references public.consultations (id) on delete set null,
  due_at timestamptz not null,
  reminder_hours integer not null default 24 check (reminder_hours > 0),
  status public.follow_up_status not null default 'scheduled',
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index follow_ups_due_idx on public.follow_ups (status, due_at);

create trigger follow_ups_set_updated_at
before update on public.follow_ups
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 14. feedback
-- ---------------------------------------------------------------------------
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments (id) on delete set null,
  patient_id uuid references public.patients (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  status public.feedback_status not null default 'new',
  response text,
  responded_by uuid references public.profiles (id),
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index feedback_one_per_appointment
  on public.feedback (appointment_id)
  where appointment_id is not null;

create index feedback_status_idx on public.feedback (status, created_at desc);

-- ---------------------------------------------------------------------------
-- 15. ai_conversations
-- ---------------------------------------------------------------------------
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'website' check (channel in ('website')),
  visitor_name text,
  visitor_phone text,
  status public.ai_conversation_status not null default 'active',
  escalation_reason text,
  assigned_to uuid references public.profiles (id),
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  closed_at timestamptz
);

create index ai_conversations_status_idx
  on public.ai_conversations (status, last_message_at desc);

-- ---------------------------------------------------------------------------
-- 16. ai_messages
-- ---------------------------------------------------------------------------
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role public.ai_message_role not null,
  content text not null,
  tool_name text,
  tool_payload jsonb,
  safety_flag text check (
    safety_flag is null
    or safety_flag in ('medical_request', 'prompt_injection', 'uncertain')
  ),
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_idx
  on public.ai_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- 17. ai_knowledge_entries
-- ---------------------------------------------------------------------------
create table public.ai_knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('hours', 'services', 'fees', 'policies', 'faq')),
  content text not null,
  is_active boolean not null default true,
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_knowledge_entries_active_idx
  on public.ai_knowledge_entries (is_active, category);

create trigger ai_knowledge_entries_set_updated_at
before update on public.ai_knowledge_entries
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 18. notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  channel public.notification_channel not null,
  recipient text not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'queued',
  related_table text,
  related_id uuid,
  provider_message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_status_idx on public.notifications (status, created_at);
create index notifications_related_idx on public.notifications (related_table, related_id);

-- ---------------------------------------------------------------------------
-- 19. audit_logs (append-only)
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  actor_type text not null default 'system'
    check (actor_type in ('doctor', 'staff', 'system', 'ai')),
  action text not null,
  table_name text,
  record_id uuid,
  before jsonb,
  after jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_record_idx on public.audit_logs (table_name, record_id);
