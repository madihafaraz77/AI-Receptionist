-- ============================================================================
-- Nissa Homeopathic Clinic — settings & service integrity constraints
-- Milestone 3: clinic settings and services management
--
-- The dashboard validates every value in server actions, but the database is
-- the final authority. These constraints make the same rules impossible to
-- bypass through PostgREST, a script or a future API route.
--
-- The seed data already satisfies every constraint. No rows are changed.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. clinic_settings
-- ---------------------------------------------------------------------------
alter table public.clinic_settings
  add constraint clinic_settings_name_length
    check (char_length(name) between 2 and 120),
  add constraint clinic_settings_closing_after_opening
    check (closing_time > opening_time),
  add constraint clinic_settings_duration_range
    check (appointment_duration_minutes between 5 and 240),
  add constraint clinic_settings_capacity_range
    check (daily_capacity between 1 and 100),
  add constraint clinic_settings_working_days_not_empty
    check (cardinality(working_weekdays) > 0),
  add constraint clinic_settings_fee_range
    check (consultation_fee_pkr between 0 and 1000000),
  add constraint clinic_settings_reminder_range
    check (follow_up_reminder_hours between 1 and 720),
  add constraint clinic_settings_doctor_name_length
    check (doctor_name is null or char_length(doctor_name) <= 120),
  add constraint clinic_settings_address_length
    check (address is null or char_length(address) <= 300),
  add constraint clinic_settings_phone_length
    check (phone is null or char_length(phone) between 5 and 40),
  add constraint clinic_settings_email_length
    check (email is null or char_length(email) <= 200),
  add constraint clinic_settings_timezone_length
    check (timezone is null or char_length(timezone) <= 64);

-- ---------------------------------------------------------------------------
-- 2. services
-- ---------------------------------------------------------------------------
alter table public.services
  add constraint services_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 80),
  add constraint services_name_length
    check (char_length(name) between 2 and 120),
  add constraint services_description_length
    check (char_length(description) between 10 and 600),
  add constraint services_duration_range
    check (duration_minutes between 5 and 240),
  add constraint services_fee_range
    check (fee_pkr between 0 and 1000000),
  add constraint services_sort_order_range
    check (sort_order between 0 and 999);
