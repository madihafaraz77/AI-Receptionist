-- ============================================================================
-- Nissa Homeopathic Clinic — trusted server functions
-- Milestone 2 foundation for booking and auditing.
--
-- These functions are executed with the service role by server code. They are
-- not exposed to the browser. Full public booking flows arrive in Milestone 4.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- create_appointment
--
-- Validates working days, clinic hours, closures, slot collisions and daily
-- capacity inside one transaction. Capacity is never enforced in the browser.
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

-- ---------------------------------------------------------------------------
-- log_audit_event
-- ---------------------------------------------------------------------------
create or replace function public.log_audit_event(
  p_action text,
  p_actor_id uuid default null,
  p_actor_type text default 'system',
  p_table_name text default null,
  p_record_id uuid default null,
  p_before jsonb default null,
  p_after jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (
    actor_id,
    actor_type,
    action,
    table_name,
    record_id,
    before,
    after
  )
  values (
    p_actor_id,
    p_actor_type,
    p_action,
    p_table_name,
    p_record_id,
    p_before,
    p_after
  );
end;
$$;

revoke all on function public.log_audit_event(
  text, uuid, text, text, uuid, jsonb, jsonb
) from public;

grant execute on function public.log_audit_event(
  text, uuid, text, text, uuid, jsonb, jsonb
) to service_role;
