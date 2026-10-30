-- ====================================================================
-- CAREERVERSE / AI INTERVIEW SIMULATOR - MENTOR MESSAGES TABLE
-- ====================================================================
-- Table:
--   public.mentor_messages (Persists AI mentor chat conversation history)
-- ====================================================================

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

