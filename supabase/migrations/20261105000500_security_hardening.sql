-- ============================================================================
-- Nissa Homeopathic Clinic — security hardening
-- Milestone 10 QA pass over the Milestone 2 foundation
--
-- This migration fixes issues found during the final review. It does not add
-- new product features.
--
--   1. New auth users are inactive until a doctor activates them.
--   2. Active appointments cannot overlap, not just share a start time.
--   3. Booking writes must go through public.create_appointment.
--   4. create_appointment rejects past dates once a timezone is configured.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Provisioning: authentication is not authorisation
--
-- Supabase can be configured with public sign-up. Even if it is not, a
-- mistakenly invited account must not receive clinic data automatically.
-- New profiles are now inactive and must be activated deliberately.
-- ---------------------------------------------------------------------------
alter table public.profiles
  alter column is_active set default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, is_active)
  values (
    new.id,
    'staff',
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'clinic-user'), '@', 1)
    ),
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

-- Existing accounts are untouched. Activate the doctor explicitly during
-- setup (see supabase/README.md).

-- ---------------------------------------------------------------------------
-- 2. Overlap protection
--
-- The original unique index only blocked identical start times. Two 45-minute
-- appointments starting at 11:00 and 11:15 could still overlap. A partial
-- exclusion constraint makes overlap impossible for active appointments.
-- Cancelled, completed, rescheduled and no-show rows do not block a slot.
-- ---------------------------------------------------------------------------
create extension if not exists btree_gist;

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    appointment_date with =,
    tsrange(
      appointment_date + start_time,
      appointment_date + end_time,
      '[)'
    ) with &&
  )
  where (
    status in (
      'pending'::public.appointment_status,
      'confirmed'::public.appointment_status
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Booking writes are server-only
--
-- The RLS comments already stated that bookings are created by trusted server
-- functions. The insert/update policies contradicted that and allowed a signed
-- in account to bypass hours, closures and capacity through PostgREST. Remove
-- them. Reads remain available to clinic users, and create_appointment (granted
-- to service_role only) remains the single write path.
--
-- Milestone 5 server actions should use the admin client after checking the
-- caller's role and must re-use create_appointment for every new booking.
-- ---------------------------------------------------------------------------
drop policy if exists "appointments_clinic_insert" on public.appointments;
drop policy if exists "appointments_clinic_update" on public.appointments;
drop policy if exists "appointment_events_clinic_insert" on public.appointment_events;

-- ---------------------------------------------------------------------------
-- 4. create_appointment: reject past dates when a timezone is known
--
-- The clinic timezone is intentionally NULL until the owner supplies it. A
-- UTC-based past-date check would silently assume a timezone, so the check is
-- only applied when clinic_settings.timezone is configured. Inputs are also
-- checked for null before they reach comparisons.
-- ---------------------------------------------------------------------------
create or replace function public.create_appointment(
  p_patient_id uuid,
  p_service_id uuid,
  p_appointment_date date,
  p_start_time time,
  p_mode public.consultation_mode,
  p_source public.booking_source default 'staff',
  p_patient_notes text default null,
  p_created_by uuid default null
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.clinic_settings%rowtype;
  v_service public.services%rowtype;
  v_end_time time;
  v_count integer;
  v_status public.appointment_status;
  v_actor_type text;
  v_appointment public.appointments%rowtype;
begin
  select * into v_settings
  from public.clinic_settings
  where id = true;

  if not found then
    raise exception 'CLINIC_SETTINGS_MISSING';
  end if;

  if p_appointment_date is null or p_start_time is null or p_mode is null then
    raise exception 'INVALID_BOOKING_DETAILS';
  end if;

  if v_settings.timezone is not null
     and p_appointment_date < (now() at time zone v_settings.timezone)::date then
    raise exception 'APPOINTMENT_IN_PAST';
  end if;

  select * into v_service
  from public.services
  where id = p_service_id
    and is_active = true;

  if not found then
    raise exception 'SERVICE_NOT_AVAILABLE';
  end if;

  if not (extract(isodow from p_appointment_date)::smallint = any (v_settings.working_weekdays)) then
    raise exception 'CLINIC_CLOSED';
  end if;

  if exists (
    select 1
    from public.clinic_closures
    where closure_date = p_appointment_date
  ) then
    raise exception 'CLINIC_CLOSED';
  end if;

  if p_start_time < v_settings.opening_time
     or p_start_time >= v_settings.closing_time then
    raise exception 'OUTSIDE_CLINIC_HOURS';
  end if;

  v_end_time := p_start_time + make_interval(mins => v_settings.appointment_duration_minutes);

  if v_end_time > v_settings.closing_time then
    raise exception 'OUTSIDE_CLINIC_HOURS';
  end if;

  if p_mode = 'online' and not v_settings.online_consultation_enabled then
    raise exception 'ONLINE_CONSULTATION_DISABLED';
  end if;

  -- Serialise bookings for the same date so two requests cannot both take the
  -- last capacity slot.
  perform pg_advisory_xact_lock(hashtext(p_appointment_date::text)::bigint);

  if exists (
    select 1
    from public.appointments
    where appointment_date = p_appointment_date
      and start_time = p_start_time
      and status in ('pending', 'confirmed')
  ) then
    raise exception 'SLOT_TAKEN';
  end if;

  select count(*) into v_count
  from public.appointments
  where appointment_date = p_appointment_date
    and status in ('pending', 'confirmed', 'completed');

  if v_count >= v_settings.daily_capacity then
    raise exception 'DAILY_CAPACITY_REACHED';
  end if;

  v_status := case
    when v_settings.booking_approval = 'automatic'
      then 'confirmed'::public.appointment_status
    else 'pending'::public.appointment_status
  end;

  v_actor_type := case
    when p_source = 'ai_receptionist' then 'ai'
    when p_created_by is not null then 'staff'
    else 'system'
  end;

  insert into public.appointments (
    reference,
    patient_id,
    service_id,
    appointment_date,
    start_time,
    end_time,
    mode,
    status,
    source,
    fee_pkr,
    patient_notes,
    created_by
  )
  values (
    'NIS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    p_patient_id,
    p_service_id,
    p_appointment_date,
    p_start_time,
    v_end_time,
    p_mode,
    v_status,
    p_source,
    v_service.fee_pkr,
    p_patient_notes,
    p_created_by
  )
  returning * into v_appointment;

  insert into public.appointment_events (
    appointment_id,
    event_type,
    to_status,
    actor_type,
    actor_id
  )
  values (
    v_appointment.id,
    'created',
    v_appointment.status,
    v_actor_type,
    p_created_by
  );

  insert into public.audit_logs (
    actor_id,
    actor_type,
    action,
    table_name,
    record_id,
    after
  )
  values (
    p_created_by,
    v_actor_type,
    'appointment.created',
    'appointments',
    v_appointment.id,
    to_jsonb(v_appointment)
  );

  return v_appointment;
end;
$$;

revoke all on function public.create_appointment(
  uuid, uuid, date, time, public.consultation_mode, public.booking_source, text, uuid
) from public;

grant execute on function public.create_appointment(
  uuid, uuid, date, time, public.consultation_mode, public.booking_source, text, uuid
) to service_role;
