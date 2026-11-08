-- ============================================================================
-- Nissa Homeopathic Clinic — launch seed data
-- Milestone 2
--
-- Only confirmed clinic defaults are seeded. Contact details, doctor name and
-- timezone remain NULL until the owner supplies them. No sample patients,
-- appointments or clinical records are created.
-- ============================================================================

insert into public.clinic_settings (
  id,
  name,
  address,
  phone,
  email,
  timezone,
  doctor_name,
  opening_time,
  closing_time,
  appointment_duration_minutes,
  daily_capacity,
  working_weekdays,
  booking_approval,
  walk_ins_enabled,
  consultation_fee_pkr,
  online_consultation_enabled,
  follow_up_reminder_hours,
  ai_escalation_channels,
  notification_channels
)
values (
  true,
  'Nissa Homeopathic Clinic',
  null,
  null,
  null,
  null,
  null,
  '11:00',
  '17:00',
  45,
  8,
  '{1,2,3,4,5,6}'::smallint[],
  'automatic',
  false,
  500,
  true,
  24,
  '{dashboard,email,whatsapp}'::public.notification_channel[],
  '{dashboard,email,whatsapp}'::public.notification_channel[]
)
on conflict (id) do nothing;

insert into public.services (
  slug,
  name,
  description,
  duration_minutes,
  fee_pkr,
  mode,
  is_active,
  sort_order
)
values
  (
    'homeopathic-consultation',
    'Homeopathic Consultation',
    'A 45-minute in-person visit with the doctor to discuss your concerns, history and a personalised plan for your care.',
    45,
    500,
    'in_person',
    true,
    1
  ),
  (
    'online-consultation',
    'Online Consultation',
    'A 45-minute consultation for patients who prefer to speak with the doctor from home. Availability is confirmed when you book.',
    45,
    500,
    'online',
    true,
    2
  ),
  (
    'follow-up-consultation',
    'Follow-up Consultation',
    'A 45-minute review for existing patients to discuss progress, ongoing concerns and next steps with the doctor.',
    45,
    500,
    'in_person',
    true,
    3
  )
on conflict (slug) do nothing;

-- Monday–Saturday open 11:00–17:00; Sunday closed.
insert into public.clinic_hours (
  weekday,
  is_open,
  opening_time,
  closing_time
)
select
  day,
  day <> 7,
  '11:00'::time,
  '17:00'::time
from generate_series(1, 7) as day
on conflict (weekday) do nothing;
