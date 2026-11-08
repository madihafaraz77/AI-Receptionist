-- ============================================================================
-- Nissa Homeopathic Clinic — public website booking
-- Milestone 4
--
-- These functions are called only by server actions through the service role.
-- The browser never inserts patients or appointments directly.
--
--   get_available_slots(date, mode)
--     Returns genuinely free start times. Capacity and collisions are checked
--     inside the same database, not guessed by the UI.
--
--   create_website_booking(...)
--     Creates (or reuses) an administrative patient record, then delegates to
--     create_appointment, which enforces working days, closures, hours,
--     capacity and overlap protection in one transaction.
-- ============================================================================

-- Patient references are stable and sequential. The format stays familiar to
-- the clinic (NIS-1001, NIS-1002, ...) without leaking creation timestamps.
create sequence if not exists public.patient_reference_seq
  as integer
  start 1001
  increment 1
  minvalue 1001
  maxvalue 999999
  cycle
  owned by none;

create or replace function public.normalize_phone(p_phone text)
returns text
language sql
immutable
parallel safe
set search_path = public
as $$
  select regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
$$;

revoke all on function public.normalize_phone(text) from public;

create or replace function public.get_available_slots(
  p_appointment_date date,
  p_mode public.consultation_mode default 'in_person'
)
returns setof time
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.clinic_settings%rowtype;
  v_duration interval;
  v_today date;
  v_now_time time;
  v_slot time;
  v_slot_end time;
  v_count integer;
begin
  select * into v_settings
  from public.clinic_settings
  where id = true;

  if not found then
    return;
  end if;

  -- Online public booking is not offered until the clinic chooses its timezone.
  if v_settings.timezone is null then
    return;
  end if;

  v_today := (now() at time zone v_settings.timezone)::date;
  v_now_time := (now() at time zone v_settings.timezone)::time;

  if p_appointment_date < v_today then
    return;
  end if;

  if p_appointment_date > v_today + 90 then
    return;
  end if;

  if not (
    extract(isodow from p_appointment_date)::smallint = any (v_settings.working_weekdays)
  ) then
    return;
  end if;

  if exists (
    select 1
    from public.clinic_closures
    where closure_date = p_appointment_date
  ) then
    return;
  end if;

  if p_mode = 'online' and not v_settings.online_consultation_enabled then
    return;
  end if;

  select count(*) into v_count
  from public.appointments
  where appointment_date = p_appointment_date
    and status in ('pending', 'confirmed', 'completed');

  if v_count >= v_settings.daily_capacity then
    return;
  end if;

  v_duration := make_interval(mins => v_settings.appointment_duration_minutes);
  v_slot := v_settings.opening_time;

  while (v_slot + v_duration)::time <= v_settings.closing_time loop
    v_slot_end := (v_slot + v_duration)::time;

    if p_appointment_date = v_today and v_slot <= v_now_time then
      v_slot := v_slot + v_duration;
      continue;
    end if;

    if not exists (
      select 1
      from public.appointments
      where appointment_date = p_appointment_date
        and status in ('pending', 'confirmed')
        and tsrange(
          p_appointment_date + start_time,
          p_appointment_date + end_time,
          '[)'
        ) && tsrange(
          p_appointment_date + v_slot,
          p_appointment_date + v_slot_end,
          '[)'
        )
    ) then
      return next v_slot;
    end if;

    v_slot := v_slot + v_duration;
  end loop;
end;
$$;

revoke all on function public.get_available_slots(date, public.consultation_mode)
from public;

grant execute on function public.get_available_slots(date, public.consultation_mode)
to service_role;

create or replace function public.create_website_booking(
  p_full_name text,
  p_phone text,
  p_email text,
  p_service_id uuid,
  p_appointment_date date,
  p_start_time time,
  p_mode public.consultation_mode,
  p_patient_notes text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.clinic_settings%rowtype;
  v_patient public.patients%rowtype;
  v_patient_id uuid;
  v_name text;
  v_phone_raw text;
  v_phone_digits text;
  v_email text;
  v_reference text;
  v_today date;
begin
  select * into v_settings
  from public.clinic_settings
  where id = true;

  if not found then
    raise exception 'CLINIC_SETTINGS_MISSING';
  end if;

  if v_settings.timezone is null then
    raise exception 'CLINIC_TIMEZONE_NOT_CONFIGURED';
  end if;

  v_today := (now() at time zone v_settings.timezone)::date;

  if p_appointment_date < v_today then
    raise exception 'APPOINTMENT_IN_PAST';
  end if;

  if p_appointment_date > v_today + 90 then
    raise exception 'APPOINTMENT_TOO_FAR_IN_ADVANCE';
  end if;

  v_name := nullif(btrim(p_full_name), '');
  v_phone_raw := nullif(btrim(p_phone), '');
  v_email := nullif(btrim(p_email), '');

  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'INVALID_FULL_NAME';
  end if;

  v_phone_digits := public.normalize_phone(v_phone_raw);

  if v_phone_digits !~ '^[0-9]{7,15}$' then
    raise exception 'INVALID_PHONE';
  end if;

  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'INVALID_EMAIL';
  end if;

  if p_patient_notes is not null and char_length(p_patient_notes) > 500 then
    raise exception 'INVALID_NOTES';
  end if;

  if not exists (
    select 1
    from public.services
    where id = p_service_id
      and is_active = true
  ) then
    raise exception 'SERVICE_NOT_AVAILABLE';
  end if;

  -- Reuse a patient by the normalized phone number. This is an administrative
  -- identity match only; clinical records are still doctor-only.
  select * into v_patient
  from public.patients
  where public.normalize_phone(phone) = v_phone_digits
  order by created_at asc
  limit 1;

  if v_patient.id is not null then
    v_patient_id := v_patient.id;
  else
    v_reference := 'NIS-' || lpad(nextval('public.patient_reference_seq')::text, 4, '0');

    insert into public.patients (
      reference,
      full_name,
      phone,
      email,
      admin_notes,
      created_by
    )
    values (
      v_reference,
      v_name,
      v_phone_raw,
      lower(v_email),
      null,
      null
    )
    returning id into v_patient_id;

    perform public.log_audit_event(
      'patient.created',
      null,
      'system',
      'patients',
      v_patient_id,
      null,
      jsonb_build_object(
        'id', v_patient_id,
        'reference', v_reference,
        'full_name', v_name,
        'phone', v_phone_raw,
        'email', lower(v_email)
      )
    );
  end if;

  return public.create_appointment(
    v_patient_id,
    p_service_id,
    p_appointment_date,
    p_start_time,
    p_mode,
    'website',
    nullif(btrim(p_patient_notes), ''),
    null
  );
end;
$$;

revoke all on function public.create_website_booking(
  text, text, text, uuid, date, time, public.consultation_mode, text
) from public;

grant execute on function public.create_website_booking(
  text, text, text, uuid, date, time, public.consultation_mode, text
) to service_role;

-- ---------------------------------------------------------------------------
-- create_appointment (Milestone 4 replacement)
--
-- The behaviour is unchanged except that an overlapping active appointment
-- now raises SLOT_TAKEN before the exclusion constraint has to catch it. The
-- constraint remains as the final guard against concurrent bookings.
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
      and status in ('pending', 'confirmed')
      and tsrange(
        p_appointment_date + start_time,
        p_appointment_date + end_time,
        '[)'
      ) && tsrange(
        p_appointment_date + p_start_time,
        p_appointment_date + v_end_time,
        '[)'
      )
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
