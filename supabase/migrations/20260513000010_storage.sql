-- ==================================================
-- Migration 010: Storage Buckets & Policies
-- ==================================================
-- Two private buckets:
--   cv-uploads          — candidate CVs
--   assignment-submissions — candidate assignment files
--
-- Path conventions:
--   cv-uploads/{organization_id}/{candidate_id}/cv.pdf
--   assignment-submissions/{organization_id}/{candidate_id}/{filename}
-- ==================================================

-- --------------------------------------------------
-- Buckets
-- --------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'cv-uploads',
    'cv-uploads',
    false,        -- private
    10485760,     -- 10 MB max per file
    array['application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  ),
  (
    'assignment-submissions',
    'assignment-submissions',
    false,        -- private
    52428800,     -- 50 MB max per file
    array['application/pdf', 'application/zip',
          'application/x-zip-compressed', 'text/plain',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/png', 'image/jpeg']
  )
on conflict (id) do nothing;


-- --------------------------------------------------
-- CV Uploads — Storage Policies
-- --------------------------------------------------

-- Candidates (anon) can upload their own CV
-- Path must start with org_id/candidate_id/
create policy "cv_uploads_anon_insert"
  on storage.objects for insert
  to anon
  with check (
    bucket_id = 'cv-uploads'
  );

-- Recruiters can read CVs from their org
create policy "cv_uploads_org_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'cv-uploads'
    and (storage.foldername(name))[1] = get_current_org_id()::text
  );

-- Admins can delete CVs
create policy "cv_uploads_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'cv-uploads'
    and (storage.foldername(name))[1] = get_current_org_id()::text
    and get_current_user_role() in ('super_admin', 'admin')
  );


-- --------------------------------------------------
-- Assignment Submissions — Storage Policies
-- --------------------------------------------------

-- Candidates (anon) can upload submission files
create policy "assignment_submissions_anon_insert"
  on storage.objects for insert
  to anon
  with check (
    bucket_id = 'assignment-submissions'
  );

-- Recruiters can read submissions from their org
create policy "assignment_submissions_org_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'assignment-submissions'
    and (storage.foldername(name))[1] = get_current_org_id()::text
  );
