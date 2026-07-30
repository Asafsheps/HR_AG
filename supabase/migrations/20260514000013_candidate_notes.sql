-- ==================================================
-- Migration 000013 — Candidate Notes
-- Phase 10: CRM System
-- ==================================================

-- Recruiter notes per candidate
CREATE TABLE IF NOT EXISTS candidate_notes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  recruiter_id  uuid NOT NULL REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
  content       text NOT NULL CHECK (char_length(content) > 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidate_notes_candidate ON candidate_notes(candidate_id);
CREATE INDEX idx_candidate_notes_recruiter ON candidate_notes(recruiter_id);

-- Auto-update updated_at
CREATE TRIGGER set_candidate_notes_updated_at
  BEFORE UPDATE ON candidate_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_manage_notes"
  ON candidate_notes
  FOR ALL
  USING (
    recruiter_id IN (
      SELECT id FROM recruiter_profiles
      WHERE organization_id = get_current_org_id()
    )
  )
  WITH CHECK (
    recruiter_id IN (
      SELECT id FROM recruiter_profiles
      WHERE organization_id = get_current_org_id()
    )
  );
