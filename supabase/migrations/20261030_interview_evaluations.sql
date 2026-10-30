-- ==========================================
-- INTERVIEW EVALUATIONS TABLE
-- ==========================================
-- Stores AI and fallback evaluations for candidate answers.

create table if not exists public.interview_evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  question_id text not null,
  question_category text not null,
  question_prompt text not null,
  user_answer text not null,
  score integer not null check (score >= 0 and score <= 100),
  technical_score integer not null check (technical_score >= 0 and technical_score <= 100),
  technical_feedback text not null,
  communication_score integer not null check (communication_score >= 0 and communication_score <= 100),
  communication_feedback text not null,
  problem_solving_score integer not null check (problem_solving_score >= 0 and problem_solving_score <= 100),
  problem_solving_feedback text not null,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  ideal_answer_outline jsonb not null default '[]'::jsonb,
  evaluated_by text not null default 'ai', -- 'ai' or 'fallback'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for speedy lookups by session_id
create index if not exists idx_interview_evaluations_session_id
  on public.interview_evaluations(session_id);

-- Enable Row Level Security (RLS)
alter table public.interview_evaluations enable row level security;

-- Allow public / anon users to insert evaluations during practice sessions
create policy "Allow inserts for practice evaluations"
  on public.interview_evaluations
  for insert
  with check (true);

-- Allow users to read evaluations for their sessions
create policy "Allow read for practice evaluations"
  on public.interview_evaluations
  for select
  using (true);

