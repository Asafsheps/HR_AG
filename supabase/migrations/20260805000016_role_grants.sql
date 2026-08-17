-- ==================================================
-- Migration 016: Role grants
-- ==================================================
-- None of the tables had SELECT, INSERT, UPDATE or DELETE granted to
-- anon or authenticated -- only REFERENCES/TRIGGER/TRUNCATE, which arrive
-- from default privileges and are useless to an application. Every query
-- failed with "permission denied for table ...".
--
-- Hosted Supabase applies these grants during project bootstrap, so the
-- gap was invisible until the stack was built from migrations alone. It
-- means the app had never actually run against a real database.
--
-- Postgres needs BOTH layers to allow a query:
--   GRANT          — may this role touch the table at all?
--   RLS policy     — which rows, specifically?
-- The 35 policies from earlier migrations are the row-level gate. These
-- grants are the table-level one. Neither is sufficient alone.
-- ==================================================

grant usage on schema public to anon, authenticated, service_role;

-- ── anon ────────────────────────────────────────────────────────────────
-- Read-only, and only the rows an explicit anon policy exposes. A table
-- with no anon policy returns zero rows, which is the desired default:
-- adding a table does not accidentally publish it.
grant select on all tables in schema public to anon;

-- The candidate-facing paths that must write without a session. Granted
-- per table rather than wholesale, so a future table is never writable by
-- the public just because it exists.
grant insert on candidates            to anon;   -- application form
grant insert, update on conversation_contexts to anon;   -- interview session
grant insert on whatsapp_messages     to anon;   -- inbound messages

-- ── authenticated ───────────────────────────────────────────────────────
-- Full DML, still filtered by RLS to the caller's own organization.
grant select, insert, update, delete on all tables in schema public to authenticated;

-- ── service_role ────────────────────────────────────────────────────────
-- Bypasses RLS by design. Used only in trusted server contexts.
grant all on all tables in schema public to service_role;

-- Sequences are a separate object class; without these, an INSERT that
-- relies on a sequence default fails even with table INSERT granted.
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- Functions default to EXECUTE for PUBLIC, but be explicit so a future
-- REVOKE from PUBLIC does not silently break the app.
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Tables added by later migrations inherit these automatically, so this
-- class of failure cannot recur.
alter default privileges in schema public
  grant select on tables to anon;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant all on tables to service_role;

alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
