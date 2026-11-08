-- ============================================================================
-- Nissa Homeopathic Clinic — follow-up status actions
-- Milestone 6
--
-- The browser never updates `follow_ups` directly. The function validates the
-- transition and appends the audit record in one transaction.
-- ============================================================================

create or replace function public.set_follow_up_status(
  p_follow_up_id uuid,
  p_to_status public.follow_up_status,
  p_actor_id uuid,
  p_actor_type text,
  p_cancellation_reason text default null
)
returns public.follow_ups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_follow_up public.follow_ups%rowtype;
  v_old_status public.follow_up_status;
  v_reason text;
  v_before jsonb;
  v_after jsonb;
  v_action text;
begin
  if p_follow_up_id is null
     or p_to_status is null
     or p_actor_id is null
     or p_actor_type is null then
    raise exception 'INVALID_FOLLOW_UP_ACTION';
  end if;

  if p_actor_type not in ('doctor', 'staff') then
    raise exception 'ACTOR_NOT_ALLOWED';
  end if;

  if p_to_status not in ('completed', 'cancelled') then
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

  select * into v_follow_up
  from public.follow_ups
  where id = p_follow_up_id
  for update;

  if not found then
    raise exception 'FOLLOW_UP_NOT_FOUND';
  end if;

  v_old_status := v_follow_up.status;

  if v_old_status not in ('scheduled', 'sent') then
    raise exception 'FOLLOW_UP_ALREADY_CLOSED';
  end if;

  v_before := to_jsonb(v_follow_up);

  update public.follow_ups
  set status = p_to_status,
      completed_at = case
        when p_to_status = 'completed' then now()
        else completed_at
      end
  where id = p_follow_up_id
  returning * into v_follow_up;

  v_action := case
    when p_to_status = 'completed' then 'follow_up.completed'
    else 'follow_up.cancelled'
  end;

  v_after := case
    when p_to_status = 'cancelled'
      then jsonb_build_object('follow_up', to_jsonb(v_follow_up), 'reason', v_reason)
    else to_jsonb(v_follow_up)
  end;

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
    'follow_ups',
    v_follow_up.id,
    v_before,
    v_after
  );

  return v_follow_up;
end;
$$;

revoke all on function public.set_follow_up_status(
  uuid, public.follow_up_status, uuid, text, text
) from public;

grant execute on function public.set_follow_up_status(
  uuid, public.follow_up_status, uuid, text, text
) to service_role;
