-- ==================================================
-- Migration 009: Row Level Security Policies
-- ==================================================
-- Every table is locked behind RLS.
-- Core rule: a recruiter can only see/modify data
-- that belongs to their own organization.
-- get_current_org_id() is defined in migration 003.
--
-- Policy naming convention:
--   "<table>_<role>_<operation>"
-- ==================================================


-- --------------------------------------------------
-- ORGANIZATIONS
-- --------------------------------------------------
-- Recruiters can read their own org only.
-- Only super_admin can update org settings.
create policy "organizations_recruiter_select"
  on organizations for select
  to authenticated
  using (id = get_current_org_id());

create policy "organizations_admin_update"
  on organizations for update
  to authenticated
  using (
    id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin')
  );


-- --------------------------------------------------
-- RECRUITER PROFILES
-- --------------------------------------------------
-- Recruiters can see all profiles in their org.
-- Recruiters can update only their own profile.
-- Admins can update any profile in their org.
create policy "recruiter_profiles_org_select"
  on recruiter_profiles for select
  to authenticated
  using (organization_id = get_current_org_id());

create policy "recruiter_profiles_self_update"
  on recruiter_profiles for update
  to authenticated
  using (id = auth.uid());

create policy "recruiter_profiles_admin_update"
  on recruiter_profiles for update
  to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin')
  );

-- Admins can insert new profiles (inviting team members)
create policy "recruiter_profiles_admin_insert"
  on recruiter_profiles for insert
  to authenticated
  with check (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin')
  );


-- --------------------------------------------------
-- JOBS
-- --------------------------------------------------
-- All authenticated org members can read jobs.
-- Recruiters and above can create/update.
-- Only admins can delete (archive).
create policy "jobs_org_select"
  on jobs for select
  to authenticated
  using (organization_id = get_current_org_id());

create policy "jobs_recruiter_insert"
  on jobs for insert
  to authenticated
  with check (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin', 'recruiter')
  );

create policy "jobs_recruiter_update"
  on jobs for update
  to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin', 'recruiter')
  );

create policy "jobs_admin_delete"
  on jobs for delete
  to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin')
  );

-- Public: anon users can read active jobs (for candidate application form)
create policy "jobs_public_select_active"
  on jobs for select
  to anon
  using (status = 'active');


-- --------------------------------------------------
-- CANDIDATES
-- --------------------------------------------------
-- Org members can read all candidates in their org.
-- Recruiters can update candidates.
-- Viewers are read-only.
create policy "candidates_org_select"
  on candidates for select
  to authenticated
  using (organization_id = get_current_org_id());

create policy "candidates_recruiter_update"
  on candidates for update
  to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin', 'recruiter')
  );

create policy "candidates_admin_delete"
  on candidates for delete
  to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin')
  );

-- Public: candidates can insert themselves (application form)
create policy "candidates_public_insert"
  on candidates for insert
  to anon
  with check (true);  -- further validation happens in the API route


-- --------------------------------------------------
-- WHATSAPP MESSAGES
-- --------------------------------------------------
create policy "whatsapp_messages_org_select"
  on whatsapp_messages for select
  to authenticated
  using (organization_id = get_current_org_id());

create policy "whatsapp_messages_recruiter_insert"
  on whatsapp_messages for insert
  to authenticated
  with check (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin', 'recruiter')
  );

-- Service role inserts messages from webhook handler (bypasses RLS automatically)


-- --------------------------------------------------
-- CONVERSATION CONTEXTS
-- --------------------------------------------------
create policy "conversation_contexts_org_select"
  on conversation_contexts for select
  to authenticated
  using (organization_id = get_current_org_id());

create policy "conversation_contexts_recruiter_update"
  on conversation_contexts for update
  to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin', 'recruiter')
  );


-- --------------------------------------------------
-- ASSIGNMENTS
-- --------------------------------------------------
create policy "assignments_org_select"
  on assignments for select
  to authenticated
  using (organization_id = get_current_org_id());

create policy "assignments_recruiter_insert"
  on assignments for insert
  to authenticated
  with check (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin', 'recruiter')
  );

create policy "assignments_recruiter_update"
  on assignments for update
  to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin', 'recruiter')
  );


-- --------------------------------------------------
-- AI USAGE LOGS
-- --------------------------------------------------
-- Admins can read cost data. Recruiters cannot.
-- Insert is done via service role only.
create policy "ai_usage_logs_admin_select"
  on ai_usage_logs for select
  to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin')
  );


-- --------------------------------------------------
-- AUDIT LOGS
-- --------------------------------------------------
-- All org members can read audit logs (transparency).
-- Insert is done via service role only.
create policy "audit_logs_org_select"
  on audit_logs for select
  to authenticated
  using (organization_id = get_current_org_id());
