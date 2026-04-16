-- S0.3 + S0.4 — Add missing foreign key constraints
-- videos.reviewed_by references auth.users
-- admin_audit_log.admin_user_id references auth.users

ALTER TABLE videos
  ADD CONSTRAINT videos_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE admin_audit_log
  ADD CONSTRAINT admin_audit_log_admin_user_id_fkey
    FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
