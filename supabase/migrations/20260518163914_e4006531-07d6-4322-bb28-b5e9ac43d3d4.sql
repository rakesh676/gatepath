
-- Enums
create type public.goal_status as enum ('pending', 'completed');
create type public.priority_level as enum ('low', 'medium', 'high');
create type public.confidence_level as enum ('low', 'medium', 'high');
create type public.difficulty_level as enum ('easy', 'medium', 'hard');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generic updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- Goals
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status public.goal_status not null default 'pending',
  priority public.priority_level not null default 'medium',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy "goals own all" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index goals_user_idx on public.goals(user_id, due_date);
create trigger goals_updated before update on public.goals for each row execute function public.set_updated_at();

-- Subjects
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  confidence public.confidence_level not null default 'medium',
  revision_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subjects enable row level security;
create policy "subjects own all" on public.subjects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index subjects_user_idx on public.subjects(user_id);
create trigger subjects_updated before update on public.subjects for each row execute function public.set_updated_at();

-- Topics
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  topic_name text not null,
  completed boolean not null default false,
  confidence public.confidence_level not null default 'medium',
  revision_count int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.topics enable row level security;
create policy "topics own all" on public.topics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index topics_subject_idx on public.topics(subject_id);
create trigger topics_updated before update on public.topics for each row execute function public.set_updated_at();

-- Questions (per user bank)
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null check (correct_answer in ('a','b','c','d')),
  difficulty public.difficulty_level not null default 'medium',
  explanation text,
  created_at timestamptz not null default now()
);
alter table public.questions enable row level security;
create policy "questions own all" on public.questions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index questions_user_subj on public.questions(user_id, subject_id);

-- Test attempts
create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  total_questions int not null,
  correct_count int not null,
  score numeric(5,2) not null,
  duration_seconds int,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.test_attempts enable row level security;
create policy "attempts own all" on public.test_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index attempts_user_date on public.test_attempts(user_id, created_at desc);
