-- ============================================================================
-- Nissa Homeopathic Clinic — patient and consultation creation
-- Milestone 6 remainder
--
-- Patient creation and consultation creation perform multiple writes (records,
-- optional prescription/follow-up and audit logs). They are enforced in one
-- transaction and callable only by the service role from server actions.
-- ============================================================================

create or replace function public.create_patient_record(
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_date_of_birth date default null,
  p_gender text default null,
  p_address text default null,
  p_admin_notes text default null,
  p_created_by uuid default null
)
returns public.patients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient public.patients%rowtype;
  v_name text;
  v_phone_raw text;
  v_phone_digits text;
  v_email text;
  v_reference text;
  v_actor_type text;
begin
  if p_created_by is null then
    raise exception 'ACTOR_NOT_ALLOWED';
  end if;

  select role::text into v_actor_type
  from public.profiles
  where id = p_created_by;

  if v_actor_type not in ('doctor', 'staff') then
    raise exception 'ACTOR_NOT_ALLOWED';
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

  if p_date_of_birth is not null and p_date_of_birth >= current_date then
    raise exception 'INVALID_DATE_OF_BIRTH';
  end if;

  if p_address is not null and char_length(p_address) > 300 then
    raise exception 'INVALID_ADDRESS';
  end if;

  if p_admin_notes is not null and char_length(p_admin_notes) > 500 then
    raise exception 'INVALID_ADMIN_NOTES';
  end if;

  v_reference := 'NIS-' || lpad(nextval('public.patient_reference_seq')::text, 4, '0');

  insert into public.patients (
    reference,
    full_name,
    phone,
    email,
    date_of_birth,
    gender,
    address,
    admin_notes,
    created_by
  )
  values (
    v_reference,
    v_name,
    v_phone_raw,
    lower(v_email),
    p_date_of_birth,
    nullif(btrim(p_gender), ''),
    nullif(btrim(p_address), ''),
    nullif(btrim(p_admin_notes), ''),
    p_created_by
  )
  returning * into v_patient;

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
    'patient.created',
    'patients',
    v_patient.id,
    to_jsonb(v_patient)
  );

  return v_patient;
end;
$$;

revoke all on function public.create_patient_record(
  text, text, text, date, text, text, text, uuid
) from public;

grant execute on function public.create_patient_record(
  text, text, text, date, text, text, text, uuid
) to service_role;

create or replace function public.create_consultation_record(
  p_patient_id uuid,
  p_appointment_id uuid,
  p_doctor_id uuid,
  p_chief_complaint text default null,
  p_history text default null,
  p_examination text default null,
  p_assessment text default null,
  p_plan text default null,
  p_private_notes text default null,
  p_remedy_name text default null,
  p_potency text default null,
  p_dosage_text text default null,
  p_frequency_text text default null,
  p_duration_days integer default null,
  p_prescription_instructions text default null,
  p_follow_up_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consultation public.consultations%rowtype;
  v_prescription public.prescriptions%rowtype;
  v_item public.prescription_items%rowtype;
  v_follow_up public.follow_ups%rowtype;
  v_doctor_role public.user_role;
  v_reminder_hours integer;
begin
  select role into v_doctor_role
  from public.profiles
  where id = p_doctor_id;

  if v_doctor_role is distinct from 'doctor'::public.user_role then
    raise exception 'CLINICAL_WRITE_DOCTOR_ONLY';
  end if;

  if p_patient_id is null or p_doctor_id is null then
    raise exception 'INVALID_CONSULTATION_DETAILS';
  end if;

  if p_appointment_id is not null
     and not exists (
       select 1
       from public.appointments
       where id = p_appointment_id
         and patient_id = p_patient_id
     ) then
    raise exception 'APPOINTMENT_PATIENT_MISMATCH';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'PATIENT_NOT_FOUND';
  end if;

  if p_duration_days is not null and p_duration_days <= 0 then
    raise exception 'INVALID_DURATION_DAYS';
  end if;

  select follow_up_reminder_hours into v_reminder_hours
  from public.clinic_settings
  where id = true;

  insert into public.consultations (
    appointment_id,
    patient_id,
    doctor_id,
    consulted_at,
    chief_complaint,
    history,
    examination,
    assessment,
    plan,
    private_notes
  )
  values (
    p_appointment_id,
    p_patient_id,
    p_doctor_id,
    now(),
    nullif(btrim(p_chief_complaint), ''),
    nullif(btrim(p_history), ''),
    nullif(btrim(p_examination), ''),
    nullif(btrim(p_assessment), ''),
    nullif(btrim(p_plan), ''),
    nullif(btrim(p_private_notes), '')
  )
  returning * into v_consultation;

  insert into public.audit_logs (
    actor_id,
    actor_type,
    action,
    table_name,
    record_id,
    after
  )
  values (
    p_doctor_id,
    'doctor',
    'consultation.created',
    'consultations',
    v_consultation.id,
    to_jsonb(v_consultation)
  );

  -- Prescription is optional; remedy_name indicates a complete prescription.
  if p_remedy_name is not null and btrim(p_remedy_name) <> '' then
    if p_prescription_instructions is not null
       and char_length(p_prescription_instructions) > 1000 then
      raise exception 'INVALID_PRESCRIPTION_INSTRUCTIONS';
    end if;

    insert into public.prescriptions (
      consultation_id,
      patient_id,
      doctor_id,
      issued_at,
      instructions,
      follow_up_date
    )
    values (
      v_consultation.id,
      p_patient_id,
      p_doctor_id,
      now(),
      nullif(btrim(p_prescription_instructions), ''),
      p_follow_up_date
    )
    returning * into v_prescription;

    insert into public.prescription_items (
      prescription_id,
      remedy_name,
      potency,
      dosage,
      frequency,
      duration_days,
      sort_order
    )
    values (
      v_prescription.id,
      btrim(p_remedy_name),
      nullif(btrim(p_potency), ''),
      nullif(btrim(p_dosage_text), ''),
      nullif(btrim(p_frequency_text), ''),
      p_duration_days,
      0
    )
    returning * into v_item;

    insert into public.audit_logs (
      actor_id,
      actor_type,
      action,
      table_name,
      record_id,
      after
    )
    values (
      p_doctor_id,
      'doctor',
      'prescription.created',
      'prescriptions',
      v_prescription.id,
      jsonb_build_object('prescription', to_jsonb(v_prescription), 'item', to_jsonb(v_item))
    );
  end if;

  if p_follow_up_date is not null then
    if p_follow_up_date < (now() at time zone coalesce((select timezone from public.clinic_settings where id = true), 'UTC'))::date then
      raise exception 'FOLLOW_UP_DATE_IN_PAST';
    end if;

    insert into public.follow_ups (
      patient_id,
      consultation_id,
      due_at,
      reminder_hours,
      status
    )
    values (
      p_patient_id,
      v_consultation.id,
      p_follow_up_date::timestamptz,
      coalesce(v_reminder_hours, 24),
      'scheduled'
    )
    returning * into v_follow_up;

    insert into public.audit_logs (
      actor_id,
      actor_type,
      action,
      table_name,
      record_id,
      after
    )
    values (
      p_doctor_id,
      'doctor',
      'follow_up.scheduled',
      'follow_ups',
      v_follow_up.id,
      to_jsonb(v_follow_up)
    );
  end if;

  return jsonb_build_object(
    'consultation_id', v_consultation.id,
    'prescription_id', case when v_prescription.id is null then null else v_prescription.id end,
    'follow_up_id', case when v_follow_up.id is null then null else v_follow_up.id end
  );
end;
$$;

revoke all on function public.create_consultation_record(
  uuid, uuid, uuid, text, text, text, text, text, text, text, text, text, text, integer, text, date
) from public;

grant execute on function public.create_consultation_record(
  uuid, uuid, uuid, text, text, text, text, text, text, text, text, text, text, integer, text, date
) to service_role;
