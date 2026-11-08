-- ============================================================================
-- Nissa Homeopathic Clinic — AI conversation logging
-- Milestone 7
--
-- The public assistant stores a short transcript for review. It never writes
-- clinical records and never grants the browser direct write access.
-- ============================================================================

create or replace function public.log_ai_conversation_exchange(
  p_conversation_id uuid,
  p_user_content text,
  p_assistant_content text,
  p_safety_flag text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created boolean := false;
begin
  if p_conversation_id is null then
    raise exception 'INVALID_CONVERSATION_ID';
  end if;

  if p_user_content is null or btrim(p_user_content) = '' then
    raise exception 'INVALID_USER_MESSAGE';
  end if;

  if p_assistant_content is null or btrim(p_assistant_content) = '' then
    raise exception 'INVALID_ASSISTANT_MESSAGE';
  end if;

  if char_length(p_user_content) > 2000 or char_length(p_assistant_content) > 2000 then
    raise exception 'MESSAGE_TOO_LONG';
  end if;

  if p_safety_flag is not null and char_length(p_safety_flag) > 80 then
    raise exception 'INVALID_SAFETY_FLAG';
  end if;

  -- Create the conversation once. Later turns update the same row so the inbox
  -- can sort by recency.
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
  on conflict (id) do nothing
  returning true into v_created;

  if not v_created then
    update public.ai_conversations
    set last_message_at = now()
    where id = p_conversation_id;
  else
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
      'ai.conversation_created',
      'ai_conversations',
      p_conversation_id,
      jsonb_build_object(
        'id', p_conversation_id,
        'channel', 'website',
        'status', 'active'
      )
    );
  end if;

  insert into public.ai_messages (
    conversation_id,
    role,
    content,
    safety_flag
  )
  values (
    p_conversation_id,
    'visitor',
    p_user_content,
    p_safety_flag
  );

  insert into public.ai_messages (
    conversation_id,
    role,
    content,
    safety_flag
  )
  values (
    p_conversation_id,
    'assistant',
    p_assistant_content,
    p_safety_flag
  );

  return p_conversation_id;
end;
$$;

revoke all on function public.log_ai_conversation_exchange(
  uuid, text, text, text
) from public;

grant execute on function public.log_ai_conversation_exchange(
  uuid, text, text, text
) to service_role;
