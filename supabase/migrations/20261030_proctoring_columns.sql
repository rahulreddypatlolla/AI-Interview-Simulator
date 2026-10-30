-- ────────────────────────────────────────────────────────────────────
-- MIGRATION: Add Proctoring & Proctoring Audit Columns to interview_sessions
-- Created: 2026-10-30
-- Description: Supports fullscreen exit violations, screen sharing status,
--              detailed submission reason, and proctored interview status.
-- ────────────────────────────────────────────────────────────────────

alter table public.interview_sessions
  add column if not exists fullscreen_exits integer default 0 not null,
  add column if not exists screen_sharing_status text default 'active' not null,
  add column if not exists submission_reason text default 'Normal submission' not null,
  add column if not exists interview_status text default 'Completed' not null;

create index if not exists idx_interview_sessions_interview_status
  on public.interview_sessions(interview_status);

