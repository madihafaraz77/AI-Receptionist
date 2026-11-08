-- ============================================================================
-- Nissa Homeopathic Clinic — appointment status actions
-- Milestone 5
--
-- The dashboard calls this function through the service role after checking the
-- caller is an active clinic user. Browser sessions never update appointment
-- rows directly.
-- ============================================================================

create or replace function public.set_appointment_status(
  p_appointment_id uuid,
  p_to_status public.appointment_status,
  p_actor_id uuid,
  p_actor_type text,
  p_cancellation_reason text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments%rowtype;
  v_old_status public.appointment_status;
  v_event_type text;
  v_action text;
  v_reason text;
  v_before jsonb;
begin
  if p_appointment_id is null
     or p_to_status is null
     or p_actor_id is null
     or p_actor_type is null then
    raise exception 'INVALID_APPOINTMENT_ACTION';
  end if;

  if p_actor_type not in ('doctor', 'staff') then
    raise exception 'ACTOR_NOT_ALLOWED';
  end if;

  if p_to_status not in ('confirmed', 'completed', 'cancelled') then
    raise exception 'UNSUPPORTED_STATUS_TRANSITION';
  end if;

  if p_cancellation_reason is not null
     and char_length(p_cancellation_reason) > 500 then
    raise exception 'INVALID_CANCELLATION_REASON';
  end if;

  v_reason := nullif(btrim(p_cancellation_reason), '');

  if p_to_status = 'cancelled' and v_reason is null then
    raise exception 'CANCELLATION_REASON_REQUIRED';
  end if;

  select * into v_appointment
  from public.appointments
  where id = p_appointment_id
  for update;

  if not found then
    raise exception 'APPOINTMENT_NOT_FOUND';
  end if;

  v_old_status := v_appointment.status;

  if p_to_status = 'confirmed' and v_old_status = 'pending' then
    v_event_type := 'confirmed';
    v_action := 'appointment.confirmed';
  elsif p_to_status = 'completed' and v_old_status in ('pending', 'confirmed') then
    v_event_type := 'completed';
    v_action := 'appointment.completed';
  elsif p_to_status = 'cancelled' and v_old_status in ('pending', 'confirmed') then
    v_event_type := 'cancelled';
    v_action := 'appointment.cancelled';
  else
    raise exception 'INVALID_APPOINTMENT_TRANSITION';
  end if;

  v_before := to_jsonb(v_appointment);

  update public.appointments
  set status = p_to_status,
      cancelled_at = case
        when p_to_status = 'cancelled' then now()
        else cancelled_at
      end,
      cancellation_reason = case
        when p_to_status = 'cancelled' then v_reason
        else cancellation_reason
      end
  where id = p_appointment_id
  returning * into v_appointment;

  insert into public.appointment_events (
    appointment_id,
    event_type,
    from_status,
    to_status,
    actor_type,
    actor_id,
    metadata
  )
  values (
    v_appointment.id,
    v_event_type,
    v_old_status,
    p_to_status,
    p_actor_type,
    p_actor_id,
    case
      when p_to_status = 'cancelled'
        then jsonb_build_object('reason', v_reason)
      else '{}'::jsonb
    end
  );

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
    v_action,
    'appointments',
    v_appointment.id,
    v_before,
    to_jsonb(v_appointment)
  );

  return v_appointment;
end;
$$;

revoke all on function public.set_appointment_status(
  uuid, public.appointment_status, uuid, text, text
) from public;

grant execute on function public.set_appointment_status(
  uuid, public.appointment_status, uuid, text, text
) to service_role;
