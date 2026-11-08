-- ============================================================================
-- Nissa Homeopathic Clinic — private storage
-- Milestone 2
--
-- Patient attachments live in a private bucket. Access is limited to active
-- clinic users; deletion is doctor-only. The app uses short-lived signed URLs.
-- ============================================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'patient-attachments',
  'patient-attachments',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "patient_attachments_storage_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'patient-attachments'
  and public.is_clinic_user()
);

create policy "patient_attachments_storage_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'patient-attachments'
  and public.is_clinic_user()
);

create policy "patient_attachments_storage_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'patient-attachments'
  and public.is_clinic_user()
)
with check (
  bucket_id = 'patient-attachments'
  and public.is_clinic_user()
);

create policy "patient_attachments_storage_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'patient-attachments'
  and public.is_doctor()
);
