-- ============================================================================
-- Nissa Homeopathic Clinic — function and sequence grant hardening
--
-- Supabase's default privileges grant EXECUTE on every new function in the
-- public schema to anon and authenticated. "revoke ... from public" alone does
-- not remove those grants, so application functions could be called directly
-- from the browser with the publishable key.
--
-- Every application function is service-role only because it is invoked from
-- server actions with the secret key. Only the RLS helper functions stay
-- callable by signed-in clinic users, because the policies call them.
-- ============================================================================

revoke all on function public.create_appointment(uuid, uuid, date, time, public.consultation_mode, public.booking_source, text, uuid) from public, anon, authenticated;
grant execute on function public.create_appointment(uuid, uuid, date, time, public.consultation_mode, public.booking_source, text, uuid) to service_role;

revoke all on function public.create_website_booking(text, text, text, uuid, date, time, public.consultation_mode, text) from public, anon, authenticated;
grant execute on function public.create_website_booking(text, text, text, uuid, date, time, public.consultation_mode, text) to service_role;

revoke all on function public.get_available_slots(date, public.consultation_mode) from public, anon, authenticated;
grant execute on function public.get_available_slots(date, public.consultation_mode) to service_role;

revoke all on function public.create_patient_record(text, text, text, date, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.create_patient_record(text, text, text, date, text, text, text, uuid) to service_role;

revoke all on function public.create_consultation_record(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text, text, integer, text, date) from public, anon, authenticated;
grant execute on function public.create_consultation_record(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text, text, integer, text, date) to service_role;

revoke all on function public.set_appointment_status(uuid, public.appointment_status, uuid, text, text) from public, anon, authenticated;
grant execute on function public.set_appointment_status(uuid, public.appointment_status, uuid, text, text) to service_role;

revoke all on function public.set_follow_up_status(uuid, public.follow_up_status, uuid, text, text) from public, anon, authenticated;
grant execute on function public.set_follow_up_status(uuid, public.follow_up_status, uuid, text, text) to service_role;

revoke all on function public.set_ai_conversation_status(uuid, public.ai_conversation_status, uuid, text) from public, anon, authenticated;
grant execute on function public.set_ai_conversation_status(uuid, public.ai_conversation_status, uuid, text) to service_role;

revoke all on function public.log_ai_conversation_exchange(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.log_ai_conversation_exchange(uuid, text, text, text) to service_role;

revoke all on function public.log_ai_message(uuid, public.ai_message_role, text, text) from public, anon, authenticated;
grant execute on function public.log_ai_message(uuid, public.ai_message_role, text, text) to service_role;

revoke all on function public.log_ai_tool_message(uuid, public.ai_message_role, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.log_ai_tool_message(uuid, public.ai_message_role, text, text, jsonb) to service_role;

revoke all on function public.mark_ai_conversation_needs_human(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_ai_conversation_needs_human(uuid, text) to service_role;

revoke all on function public.ensure_ai_conversation(uuid) from public, anon, authenticated;
grant execute on function public.ensure_ai_conversation(uuid) to service_role;

revoke all on function public.log_audit_event(text, uuid, text, text, uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.log_audit_event(text, uuid, text, text, uuid, jsonb, jsonb) to service_role;

revoke all on function public.normalize_phone(text) from public, anon, authenticated;
grant execute on function public.normalize_phone(text) to service_role;

-- Trigger/internal helpers are never called directly by clients.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- RLS helpers are used inside policies evaluated as the signed-in user.
revoke all on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

revoke all on function public.is_clinic_user() from public, anon;
grant execute on function public.is_clinic_user() to authenticated;

revoke all on function public.is_doctor() from public, anon;
grant execute on function public.is_doctor() to authenticated;

-- Patient references are generated inside a service-role function only.
revoke all on sequence public.patient_reference_seq from public, anon, authenticated;
