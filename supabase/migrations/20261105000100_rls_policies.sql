-- ============================================================================
-- Nissa Homeopathic Clinic — Row Level Security
-- Milestone 2
--
-- Public visitors can read published clinic information only. Patient and
-- clinical data requires an active clinic profile. Clinical writes are
-- doctor-only. Booking inserts are performed by trusted server functions, not
-- directly by the browser.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Role helpers (security definer avoids recursive RLS on profiles)
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true;
$$;

create or replace function public.is_clinic_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  );
$$;

create or replace function public.is_doctor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'doctor';
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.is_clinic_user() from public;
revoke all on function public.is_doctor() from public;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_clinic_user() to authenticated;
grant execute on function public.is_doctor() to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.clinic_settings enable row level security;
alter table public.services enable row level security;
alter table public.clinic_hours enable row level security;
alter table public.clinic_closures enable row level security;
alter table public.patients enable row level security;
alter table public.patient_attachments enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_events enable row level security;
alter table public.consultations enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.follow_ups enable row level security;
alter table public.feedback enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_knowledge_entries enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_doctor());

create policy "profiles_doctor_manage"
on public.profiles for all
to authenticated
using (public.is_doctor())
with check (public.is_doctor());

-- ---------------------------------------------------------------------------
-- clinic_settings
-- ---------------------------------------------------------------------------
create policy "clinic_settings_public_read"
on public.clinic_settings for select
to anon, authenticated
using (true);

create policy "clinic_settings_doctor_update"
on public.clinic_settings for update
to authenticated
using (public.is_doctor())
with check (public.is_doctor());

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
create policy "services_public_read_active"
on public.services for select
to anon, authenticated
using (is_active = true);

create policy "services_doctor_manage"
on public.services for all
to authenticated
using (public.is_doctor())
with check (public.is_doctor());

-- ---------------------------------------------------------------------------
-- clinic_hours & clinic_closures
-- ---------------------------------------------------------------------------
create policy "clinic_hours_public_read"
on public.clinic_hours for select
to anon, authenticated
using (true);

create policy "clinic_hours_doctor_manage"
on public.clinic_hours for all
to authenticated
using (public.is_doctor())
with check (public.is_doctor());

create policy "clinic_closures_public_read"
on public.clinic_closures for select
to anon, authenticated
using (true);

create policy "clinic_closures_doctor_manage"
on public.clinic_closures for all
to authenticated
using (public.is_doctor())
with check (public.is_doctor());

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------
create policy "patients_clinic_read"
on public.patients for select
to authenticated
using (public.is_clinic_user());

create policy "patients_clinic_insert"
on public.patients for insert
to authenticated
with check (public.is_clinic_user());

create policy "patients_clinic_update"
on public.patients for update
to authenticated
using (public.is_clinic_user())
with check (public.is_clinic_user());

create policy "patients_doctor_delete"
on public.patients for delete
to authenticated
using (public.is_doctor());

-- ---------------------------------------------------------------------------
-- patient_attachments
-- ---------------------------------------------------------------------------
create policy "patient_attachments_clinic_read"
on public.patient_attachments for select
to authenticated
using (public.is_clinic_user());

create policy "patient_attachments_clinic_insert"
on public.patient_attachments for insert
to authenticated
with check (public.is_clinic_user());

create policy "patient_attachments_clinic_update"
on public.patient_attachments for update
to authenticated
using (public.is_clinic_user())
with check (public.is_clinic_user());

create policy "patient_attachments_doctor_delete"
on public.patient_attachments for delete
to authenticated
using (public.is_doctor());

-- ---------------------------------------------------------------------------
-- appointments & events
-- ---------------------------------------------------------------------------
create policy "appointments_clinic_read"
on public.appointments for select
to authenticated
using (public.is_clinic_user());

create policy "appointments_clinic_insert"
on public.appointments for insert
to authenticated
with check (public.is_clinic_user());

create policy "appointments_clinic_update"
on public.appointments for update
to authenticated
using (public.is_clinic_user())
with check (public.is_clinic_user());

create policy "appointments_doctor_delete"
on public.appointments for delete
to authenticated
using (public.is_doctor());

create policy "appointment_events_clinic_read"
on public.appointment_events for select
to authenticated
using (public.is_clinic_user());

create policy "appointment_events_clinic_insert"
on public.appointment_events for insert
to authenticated
with check (public.is_clinic_user());

-- Append-only: no update or delete policies.

-- ---------------------------------------------------------------------------
-- consultations, prescriptions, prescription_items — doctor only
-- ---------------------------------------------------------------------------
create policy "consultations_doctor_manage"
on public.consultations for all
to authenticated
using (public.is_doctor())
with check (public.is_doctor());

create policy "prescriptions_doctor_manage"
on public.prescriptions for all
to authenticated
using (public.is_doctor())
with check (public.is_doctor());

create policy "prescription_items_doctor_manage"
on public.prescription_items for all
to authenticated
using (public.is_doctor())
with check (public.is_doctor());

-- ---------------------------------------------------------------------------
-- follow_ups
-- ---------------------------------------------------------------------------
create policy "follow_ups_clinic_read"
on public.follow_ups for select
to authenticated
using (public.is_clinic_user());

create policy "follow_ups_clinic_insert"
on public.follow_ups for insert
to authenticated
with check (public.is_clinic_user());

create policy "follow_ups_clinic_update"
on public.follow_ups for update
to authenticated
using (public.is_clinic_user())
with check (public.is_clinic_user());

create policy "follow_ups_doctor_delete"
on public.follow_ups for delete
to authenticated
using (public.is_doctor());

-- ---------------------------------------------------------------------------
-- feedback
-- ---------------------------------------------------------------------------
create policy "feedback_clinic_read"
on public.feedback for select
to authenticated
using (public.is_clinic_user());

create policy "feedback_clinic_update"
on public.feedback for update
to authenticated
using (public.is_clinic_user())
with check (public.is_clinic_user());

create policy "feedback_doctor_delete"
on public.feedback for delete
to authenticated
using (public.is_doctor());

-- Public feedback submission is handled by a validated server action using the
-- service role in Milestone 9. No anonymous insert policy exists here.

-- ---------------------------------------------------------------------------
-- AI conversations, messages and knowledge base
-- ---------------------------------------------------------------------------
create policy "ai_conversations_clinic_read"
on public.ai_conversations for select
to authenticated
using (public.is_clinic_user());

create policy "ai_conversations_clinic_update"
on public.ai_conversations for update
to authenticated
using (public.is_clinic_user())
with check (public.is_clinic_user());

create policy "ai_messages_clinic_read"
on public.ai_messages for select
to authenticated
using (public.is_clinic_user());

create policy "ai_knowledge_entries_clinic_read"
on public.ai_knowledge_entries for select
to authenticated
using (public.is_clinic_user());

create policy "ai_knowledge_entries_doctor_manage"
on public.ai_knowledge_entries for all
to authenticated
using (public.is_doctor())
with check (public.is_doctor());

-- AI writes are performed by the server with the service role in Milestones
-- 7–8. The browser never inserts messages or conversations directly.

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create policy "notifications_clinic_read"
on public.notifications for select
to authenticated
using (public.is_clinic_user());

-- Notification rows are created by trusted server code only.

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create policy "audit_logs_doctor_read"
on public.audit_logs for select
to authenticated
using (public.is_doctor());

-- Audit rows are written by trusted server code only and are append-only.
