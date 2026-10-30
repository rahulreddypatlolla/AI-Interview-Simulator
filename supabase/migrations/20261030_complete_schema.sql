-- ====================================================================
-- CAREERVERSE / AI INTERVIEW SIMULATOR - COMPLETE DATABASE SCHEMA
-- ====================================================================
-- Tables:
--   1. public.profiles              (User profile data)
--   2. public.interview_sessions    (Practice interview sessions)
--   3. public.session_questions     (Questions asked & candidate answers)
--   4. public.interview_evaluations (AI & fallback evaluations per question)
--   5. public.user_progress         (Skill progress & category metrics)
-- ====================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  target_role text default 'Full Stack Developer',
  experience_level text default 'Intermediate',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for profile lookups
create index if not exists idx_profiles_email on public.profiles(email);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles RLS Policies: Users can only view, insert, and update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Function & Trigger: Automatically create profile record after user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ────────────────────────────────────────────────────────────────────
-- 2. INTERVIEW SESSIONS TABLE
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.interview_sessions (
  id text primary key, -- Session identifier (e.g. 'INT-1730304912')
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null,
  type text not null check (type in ('Technical', 'Behavioral', 'HR', 'Mixed')),
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard', 'Beginner', 'Intermediate', 'Advanced')),
  voice text default 'female',
  source text default 'profile',
  focus_areas jsonb default '[]'::jsonb not null,
  total_questions integer default 0 not null,
  answered_questions integer default 0 not null,
  reviewed_questions integer default 0 not null,
  average_score integer default 0 not null check (average_score >= 0 and average_score <= 100),
  completed boolean default false not null,
  completed_at timestamp with time zone,
  fullscreen_exits integer default 0 not null,
  screen_sharing_status text default 'active' not null,
  submission_reason text default 'Normal submission' not null,
  interview_status text default 'Completed' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for interview sessions
create index if not exists idx_interview_sessions_user_id
  on public.interview_sessions(user_id);
create index if not exists idx_interview_sessions_completed_at
  on public.interview_sessions(completed_at desc);

-- Enable RLS on interview sessions
alter table public.interview_sessions enable row level security;

-- Sessions RLS Policies: Users can only access their own sessions
create policy "Users can view own interview sessions"
  on public.interview_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own interview sessions"
  on public.interview_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own interview sessions"
  on public.interview_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own interview sessions"
  on public.interview_sessions for delete
  using (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────
-- 3. SESSION QUESTIONS AND ANSWERS TABLE
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id text references public.interview_sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id text not null,
  question_order integer not null,
  category text not null,
  prompt text not null,
  hint text,
  expected_concepts jsonb default '[]'::jsonb not null,
  user_answer text default '' not null,
  reviewed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for session questions
create index if not exists idx_session_questions_session_id
  on public.session_questions(session_id);
create index if not exists idx_session_questions_user_id
  on public.session_questions(user_id);

-- Enable RLS on session questions
alter table public.session_questions enable row level security;

-- Session Questions RLS Policies
create policy "Users can view own session questions"
  on public.session_questions for select
  using (auth.uid() = user_id);

create policy "Users can insert own session questions"
  on public.session_questions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own session questions"
  on public.session_questions for update
  using (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────
-- 4. INTERVIEW EVALUATIONS TABLE
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.interview_evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id text references public.interview_sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
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
  strengths jsonb default '[]'::jsonb not null,
  weaknesses jsonb default '[]'::jsonb not null,
  improvements jsonb default '[]'::jsonb not null,
  ideal_answer_outline jsonb default '[]'::jsonb not null,
  evaluated_by text not null default 'ai', -- 'ai' or 'fallback'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for evaluations
create index if not exists idx_interview_evaluations_session_id
  on public.interview_evaluations(session_id);
create index if not exists idx_interview_evaluations_user_id
  on public.interview_evaluations(user_id);

-- Enable RLS on evaluations
alter table public.interview_evaluations enable row level security;

-- Evaluation RLS Policies: Users can only access their own evaluations
create policy "Users can view own evaluations"
  on public.interview_evaluations for select
  using (auth.uid() = user_id);

create policy "Users can insert own evaluations"
  on public.interview_evaluations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own evaluations"
  on public.interview_evaluations for update
  using (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────
-- 5. USER PROGRESS TABLE
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null, -- Skill category (e.g. 'Data structures', 'SQL', etc.)
  score integer not null check (score >= 0 and score <= 100),
  sessions_count integer default 1 not null,
  last_practiced_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_category unique (user_id, category)
);

-- Indexes for user progress
create index if not exists idx_user_progress_user_id
  on public.user_progress(user_id);
create index if not exists idx_user_progress_category
  on public.user_progress(category);

-- Enable RLS on user progress
alter table public.user_progress enable row level security;

-- User Progress RLS Policies: Users can only access their own progress records
create policy "Users can view own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete own progress"
  on public.user_progress for delete
  using (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────
-- 6. MENTOR MESSAGES TABLE
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.mentor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for mentor conversation lookups
create index if not exists idx_mentor_messages_user_id
  on public.mentor_messages(user_id);
create index if not exists idx_mentor_messages_created_at
  on public.mentor_messages(created_at asc);

-- Enable Row Level Security (RLS)
alter table public.mentor_messages enable row level security;

-- Policies: Users can view, insert, and delete only their own mentor messages
create policy "Users can view own mentor messages"
  on public.mentor_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own mentor messages"
  on public.mentor_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own mentor messages"
  on public.mentor_messages for delete
  using (auth.uid() = user_id);


