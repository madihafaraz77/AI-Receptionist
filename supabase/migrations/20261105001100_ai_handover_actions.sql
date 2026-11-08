-- ============================================================================
-- Nissa Homeopathic Clinic — AI handover and tool-message logging
-- Milestone 8
--
-- The public assistant remains administrative. These functions:
--   * flag a conversation for the clinic team;
--   * let clinic users move a conversation between needs-human/handed-over/closed;
--   * record tool-call output alongside visitor and assistant messages.
-- ============================================================================

create or replace function public.mark_ai_conversation_needs_human(
  p_conversation_id uuid,
  p_reason text default null
)
returns public.ai_conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation public.ai_conversations%rowtype;
  v_reason text;
begin
  if p_conversation_id is null then
    raise exception 'INVALID_CONVERSATION_ID';
  end if;

  if p_reason is not null and char_length(p_reason) > 200 then
    raise exception 'INVALID_HANDOVER_REASON';
  end if;

  v_reason := nullif(btrim(p_reason), '');

  update public.ai_conversations
  set status = 'needs_human',
      escalation_reason = coalesce(v_reason, escalation_reason),
      last_message_at = greatest(last_message_at, now())
  where id = p_conversation_id
    and status in ('active', 'handed_over')
  returning * into v_conversation;

  if not found then
    raise exception 'AI_CONVERSATION_NOT_OPEN';
  end if;

  insert into public.audit_logs (
    actor_id,
    actor_type,
    action,
    table_name,
    record_id,
    after
  )
  values (
    null,
    'system',
    'ai.needs_human',
    'ai_conversations',
    v_conversation.id,
    to_jsonb(v_conversation)
  );

  return v_conversation;
end;
$$;

create or replace function public.ensure_ai_conversation(
  p_conversation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_conversation_id is null then
    raise exception 'INVALID_CONVERSATION_ID';
  end if;

  insert into public.ai_conversations (
    id,
    channel,
    status,
    started_at,
    last_message_at
  )
  values (
    p_conversation_id,
    'website',
    'active',
    now(),
    now()
  )
  on conflict (id) do nothing;

  return p_conversation_id;
end;
$$;

revoke all on function public.ensure_ai_conversation(uuid) from public;

grant execute on function public.ensure_ai_conversation(uuid)
to service_role;

revoke all on function public.mark_ai_conversation_needs_human(uuid, text)
from public;

grant execute on function public.mark_ai_conversation_needs_human(uuid, text)
to service_role;

create or replace function public.set_ai_conversation_status(
  p_conversation_id uuid,
  p_to_status public.ai_conversation_status,
  p_actor_id uuid,
  p_actor_type text
)
returns public.ai_conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation public.ai_conversations%rowtype;
  v_before jsonb;
  v_old_status public.ai_conversation_status;
  v_action text;
begin
  if p_conversation_id is null
     or p_to_status is null
     or p_actor_id is null
     or p_actor_type is null then
    raise exception 'INVALID_AI_ACTION';
  end if;

  if p_actor_type not in ('doctor', 'staff') then
    raise exception 'ACTOR_NOT_ALLOWED';
  end if;

  select * into v_conversation
  from public.ai_conversations
  where id = p_conversation_id
  for update;

  if not found then
    raise exception 'AI_CONVERSATION_NOT_FOUND';
  end if;

  v_old_status := v_conversation.status;
  v_before := to_jsonb(v_conversation);

  -- Closed is terminal for the MVP; a new request creates a new conversation.
  if v_old_status = 'closed' then
    raise exception 'AI_CONVERSATION_CLOSED';
  end if;

  if p_to_status = 'needs_human'
     and v_old_status in ('active', 'handed_over') then
    update public.ai_conversations
    set status = p_to_status
    where id = p_conversation_id
    returning * into v_conversation;
    v_action := 'ai.needs_human';
  elsif p_to_status = 'handed_over'
     and v_old_status in ('active', 'needs_human', 'handed_over') then
    -- Moving an already assigned conversation to handed_over reassigns it.
    update public.ai_conversations
    set status = p_to_status,
        assigned_to = p_actor_id
    where id = p_conversation_id
    returning * into v_conversation;
    v_action := 'ai.handed_over';
  elsif p_to_status = 'closed'
     and v_old_status in ('active', 'needs_human', 'handed_over') then
    update public.ai_conversations
    set status = p_to_status,
        assigned_to = p_actor_id,
        closed_at = now()
    where id = p_conversation_id
    returning * into v_conversation;
    v_action := 'ai.closed';
  elsif p_to_status = 'active'
     and v_old_status in ('needs_human', 'handed_over') then
    update public.ai_conversations
    set status = p_to_status,
        assigned_to = null
    where id = p_conversation_id
    returning * into v_conversation;
    v_action := 'ai.resumed';
  else
    raise exception 'INVALID_AI_TRANSITION';
  end if;

  if v_action is null then
    raise exception 'UNSUPPORTED_STATUS_TRANSITION';
  end if;

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
    'ai_conversations',
    v_conversation.id,
    v_before,
    to_jsonb(v_conversation)
  );

  return v_conversation;
end;
$$;

revoke all on function public.set_ai_conversation_status(
  uuid, public.ai_conversation_status, uuid, text
) from public;

grant execute on function public.set_ai_conversation_status(
  uuid, public.ai_conversation_status, uuid, text
) to service_role;

create or replace function public.log_ai_message(
  p_conversation_id uuid,
  p_role public.ai_message_role,
  p_content text,
  p_safety_flag text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message_id uuid;
begin
  if p_conversation_id is null
     or p_role is null
     or p_content is null
     or btrim(p_content) = '' then
    raise exception 'INVALID_AI_MESSAGE';
  end if;

  if char_length(p_content) > 4000 then
    raise exception 'MESSAGE_TOO_LONG';
  end if;

  if p_safety_flag is not null and char_length(p_safety_flag) > 80 then
    raise exception 'INVALID_SAFETY_FLAG';
  end if;

  insert into public.ai_messages (
    conversation_id,
    role,
    content,
    safety_flag
  )
  values (
    p_conversation_id,
    p_role,
    p_content,
    p_safety_flag
  )
  returning id into v_message_id;

  update public.ai_conversations
  set last_message_at = now()
  where id = p_conversation_id;

  return v_message_id;
end;
$$;

revoke all on function public.log_ai_message(
  uuid, public.ai_message_role, text, text
) from public;

grant execute on function public.log_ai_message(
  uuid, public.ai_message_role, text, text
) to service_role;

create or replace function public.log_ai_tool_message(
  p_conversation_id uuid,
  p_role public.ai_message_role,
  p_content text,
  p_tool_name text,
  p_tool_payload jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message_id uuid;
begin
  if p_tool_name is null or p_tool_name = '' then
    raise exception 'INVALID_TOOL_NAME';
  end if;

  if p_content is null or btrim(p_content) = ''
     or char_length(p_content) > 4000 then
    raise exception 'INVALID_TOOL_CONTENT';
  end if;

  insert into public.ai_messages (
    conversation_id,
    role,
    content,
    tool_name,
    tool_payload
  )
  values (
    p_conversation_id,
    p_role,
    p_content,
    p_tool_name,
    p_tool_payload
  )
  returning id into v_message_id;

  update public.ai_conversations
  set last_message_at = now()
  where id = p_conversation_id;

  return v_message_id;
end;
$$;

revoke all on function public.log_ai_tool_message(
  uuid, public.ai_message_role, text, text, jsonb
) from public;

grant execute on function public.log_ai_tool_message(
  uuid, public.ai_message_role, text, text, jsonb
) to service_role;
