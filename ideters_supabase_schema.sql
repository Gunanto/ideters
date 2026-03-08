
-- IDETERS LMS
-- Supabase-ready PostgreSQL schema
-- Version: 1.0
-- Notes:
-- 1) Run in Supabase SQL editor.
-- 2) Assumes auth.users exists.
-- 3) RLS policies are included as a starter baseline and should be reviewed for production.

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- =========================================================
-- Types
-- =========================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'global_role_t') then
    create type public.global_role_t as enum ('student', 'instructor', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'course_status_t') then
    create type public.course_status_t as enum ('draft', 'published', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'member_role_t') then
    create type public.member_role_t as enum ('student', 'instructor', 'ta');
  end if;
  if not exists (select 1 from pg_type where typname = 'member_status_t') then
    create type public.member_status_t as enum ('active', 'invited', 'suspended');
  end if;
  if not exists (select 1 from pg_type where typname = 'activity_type_t') then
    create type public.activity_type_t as enum ('reading', 'video', 'assignment', 'discussion', 'quiz', 'syntax_activity');
  end if;
  if not exists (select 1 from pg_type where typname = 'quiz_question_type_t') then
    create type public.quiz_question_type_t as enum ('mcq', 'multiple_select', 'short_answer', 'essay', 'numeric');
  end if;
  if not exists (select 1 from pg_type where typname = 'attempt_status_t') then
    create type public.attempt_status_t as enum ('in_progress', 'submitted', 'graded', 'expired');
  end if;
  if not exists (select 1 from pg_type where typname = 'progress_status_t') then
    create type public.progress_status_t as enum ('not_started', 'in_progress', 'completed');
  end if;
end $$;

-- =========================================================
-- Utility functions
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.global_role = 'admin'
  );
$$;

create or replace function public.is_course_instructor(p_course_id uuid)
returns boolean
language sql
stable
as $$
  select
    public.is_admin()
    or exists (
      select 1 from public.courses c
      where c.id = p_course_id and c.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.course_members cm
      where cm.course_id = p_course_id
        and cm.user_id = auth.uid()
        and cm.role in ('instructor', 'ta')
        and cm.status = 'active'
    );
$$;

create or replace function public.is_course_student(p_course_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.course_members cm
    where cm.course_id = p_course_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
  );
$$;

create or replace function public.activity_course_id(p_activity_id uuid)
returns uuid
language sql
stable
as $$
  select m.course_id
  from public.activities a
  join public.modules m on m.id = a.module_id
  where a.id = p_activity_id;
$$;

create or replace function public.quiz_course_id(p_quiz_id uuid)
returns uuid
language sql
stable
as $$
  select m.course_id
  from public.quizzes q
  join public.activities a on a.id = q.activity_id
  join public.modules m on m.id = a.module_id
  where q.id = p_quiz_id;
$$;

-- =========================================================
-- Core tables
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text not null,
  global_role public.global_role_t not null default 'student',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  thumbnail_path text,
  status public.course_status_t not null default 'draft',
  owner_id uuid not null references public.profiles(id) on delete restrict,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_members (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role_t not null default 'student',
  status public.member_status_t not null default 'active',
  enrolled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(course_id, user_id)
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 1,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, position)
);

create table if not exists public.learning_syntaxes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  schema_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  syntax_id uuid references public.learning_syntaxes(id) on delete set null,
  type public.activity_type_t not null,
  title text not null,
  summary text,
  content_markdown text,
  content_html text,
  content_render_version integer not null default 1,
  estimated_minutes integer,
  position integer not null default 1,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_id, position)
);

create table if not exists public.activity_syntax_steps (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  step_key text not null,
  label text not null,
  step_type text not null,
  step_config jsonb not null default '{}'::jsonb,
  content_markdown text,
  content_html text,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(activity_id, step_key),
  unique(activity_id, position)
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null unique references public.activities(id) on delete cascade,
  title text not null,
  instructions_markdown text,
  instructions_html text,
  shuffle_questions boolean not null default false,
  time_limit_minutes integer,
  max_attempts integer not null default 1,
  passing_score numeric(5,2),
  show_feedback_immediately boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  type public.quiz_question_type_t not null,
  question_markdown text not null,
  question_html text,
  explanation_markdown text,
  explanation_html text,
  points numeric(8,2) not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(quiz_id, position)
);

create table if not exists public.quiz_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  choice_text text not null,
  choice_html text,
  is_correct boolean not null default false,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  unique(question_id, position)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempt_no integer not null default 1,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric(8,2),
  max_score numeric(8,2),
  status public.attempt_status_t not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(quiz_id, user_id, attempt_no)
);

create table if not exists public.quiz_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  answer_data jsonb not null default '{}'::jsonb,
  score_awarded numeric(8,2),
  is_correct boolean,
  graded_at timestamptz,
  graded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(attempt_id, question_id)
);

create table if not exists public.activity_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  status public.progress_status_t not null default 'not_started',
  progress_percent numeric(5,2) not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, activity_id)
);

create table if not exists public.course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  progress_percent numeric(5,2) not null default 0,
  completed_activities integer not null default 0,
  total_activities integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, course_id)
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete cascade,
  bucket_name text not null,
  object_path text not null,
  original_filename text not null,
  mime_type text,
  size_bytes bigint,
  visibility text not null default 'private',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(bucket_name, object_path)
);

-- =========================================================
-- Indexes
-- =========================================================
create index if not exists idx_courses_owner_id on public.courses(owner_id);
create index if not exists idx_course_members_user_course on public.course_members(user_id, course_id);
create index if not exists idx_modules_course_id on public.modules(course_id);
create index if not exists idx_activities_module_id on public.activities(module_id);
create index if not exists idx_activities_syntax_id on public.activities(syntax_id);
create index if not exists idx_quiz_questions_quiz_id on public.quiz_questions(quiz_id);
create index if not exists idx_quiz_choices_question_id on public.quiz_choices(question_id);
create index if not exists idx_quiz_attempts_quiz_user on public.quiz_attempts(quiz_id, user_id);
create index if not exists idx_quiz_attempt_answers_attempt_id on public.quiz_attempt_answers(attempt_id);
create index if not exists idx_activity_progress_user on public.activity_progress(user_id);
create index if not exists idx_course_progress_user on public.course_progress(user_id);
create index if not exists idx_files_course_id on public.files(course_id);
create index if not exists idx_files_activity_id on public.files(activity_id);

-- =========================================================
-- Triggers
-- =========================================================
drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_courses_set_updated_at on public.courses;
create trigger trg_courses_set_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

drop trigger if exists trg_modules_set_updated_at on public.modules;
create trigger trg_modules_set_updated_at
before update on public.modules
for each row execute function public.set_updated_at();

drop trigger if exists trg_learning_syntaxes_set_updated_at on public.learning_syntaxes;
create trigger trg_learning_syntaxes_set_updated_at
before update on public.learning_syntaxes
for each row execute function public.set_updated_at();

drop trigger if exists trg_activities_set_updated_at on public.activities;
create trigger trg_activities_set_updated_at
before update on public.activities
for each row execute function public.set_updated_at();

drop trigger if exists trg_activity_syntax_steps_set_updated_at on public.activity_syntax_steps;
create trigger trg_activity_syntax_steps_set_updated_at
before update on public.activity_syntax_steps
for each row execute function public.set_updated_at();

drop trigger if exists trg_quizzes_set_updated_at on public.quizzes;
create trigger trg_quizzes_set_updated_at
before update on public.quizzes
for each row execute function public.set_updated_at();

drop trigger if exists trg_quiz_questions_set_updated_at on public.quiz_questions;
create trigger trg_quiz_questions_set_updated_at
before update on public.quiz_questions
for each row execute function public.set_updated_at();

drop trigger if exists trg_quiz_attempts_set_updated_at on public.quiz_attempts;
create trigger trg_quiz_attempts_set_updated_at
before update on public.quiz_attempts
for each row execute function public.set_updated_at();

drop trigger if exists trg_quiz_attempt_answers_set_updated_at on public.quiz_attempt_answers;
create trigger trg_quiz_attempt_answers_set_updated_at
before update on public.quiz_attempt_answers
for each row execute function public.set_updated_at();

drop trigger if exists trg_activity_progress_set_updated_at on public.activity_progress;
create trigger trg_activity_progress_set_updated_at
before update on public.activity_progress
for each row execute function public.set_updated_at();

-- =========================================================
-- Derived progress refresh helper
-- =========================================================
create or replace function public.refresh_course_progress(p_user_id uuid, p_course_id uuid)
returns void
language plpgsql
as $$
declare
  v_total integer;
  v_completed integer;
  v_percent numeric(5,2);
begin
  select count(*)
    into v_total
  from public.activities a
  join public.modules m on m.id = a.module_id
  where m.course_id = p_course_id
    and a.is_published = true;

  select count(*)
    into v_completed
  from public.activity_progress ap
  join public.activities a on a.id = ap.activity_id
  join public.modules m on m.id = a.module_id
  where ap.user_id = p_user_id
    and m.course_id = p_course_id
    and ap.status = 'completed';

  v_percent := case when coalesce(v_total, 0) = 0 then 0 else round((v_completed::numeric / v_total::numeric) * 100, 2) end;

  insert into public.course_progress (user_id, course_id, progress_percent, completed_activities, total_activities, updated_at)
  values (p_user_id, p_course_id, v_percent, coalesce(v_completed, 0), coalesce(v_total, 0), now())
  on conflict (user_id, course_id)
  do update set
    progress_percent = excluded.progress_percent,
    completed_activities = excluded.completed_activities,
    total_activities = excluded.total_activities,
    updated_at = now(),
    completed_at = case when excluded.progress_percent >= 100 then now() else null end;
end;
$$;

-- =========================================================
-- Enable RLS
-- =========================================================
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_members enable row level security;
alter table public.modules enable row level security;
alter table public.learning_syntaxes enable row level security;
alter table public.activities enable row level security;
alter table public.activity_syntax_steps enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_choices enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;
alter table public.activity_progress enable row level security;
alter table public.course_progress enable row level security;
alter table public.files enable row level security;

-- =========================================================
-- RLS Policies: profiles
-- =========================================================
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
create policy "profiles_insert_self_or_admin"
on public.profiles
for insert
with check (id = auth.uid() or public.is_admin());

-- =========================================================
-- RLS Policies: courses
-- =========================================================
drop policy if exists "courses_select_member_or_published" on public.courses;
create policy "courses_select_member_or_published"
on public.courses
for select
using (
  status = 'published'
  or owner_id = auth.uid()
  or public.is_admin()
  or public.is_course_student(id)
);

drop policy if exists "courses_insert_instructor_or_admin" on public.courses;
create policy "courses_insert_instructor_or_admin"
on public.courses
for insert
with check (
  auth.uid() = owner_id
  or public.is_admin()
);

drop policy if exists "courses_update_instructor_or_admin" on public.courses;
create policy "courses_update_instructor_or_admin"
on public.courses
for update
using (public.is_course_instructor(id))
with check (public.is_course_instructor(id));

drop policy if exists "courses_delete_owner_or_admin" on public.courses;
create policy "courses_delete_owner_or_admin"
on public.courses
for delete
using (owner_id = auth.uid() or public.is_admin());

-- =========================================================
-- RLS Policies: course_members
-- =========================================================
drop policy if exists "course_members_select_member_or_instructor" on public.course_members;
create policy "course_members_select_member_or_instructor"
on public.course_members
for select
using (
  user_id = auth.uid()
  or public.is_course_instructor(course_id)
  or public.is_admin()
);

drop policy if exists "course_members_insert_instructor_or_admin" on public.course_members;
create policy "course_members_insert_instructor_or_admin"
on public.course_members
for insert
with check (
  public.is_course_instructor(course_id)
  or public.is_admin()
);

drop policy if exists "course_members_update_instructor_or_admin" on public.course_members;
create policy "course_members_update_instructor_or_admin"
on public.course_members
for update
using (
  public.is_course_instructor(course_id)
  or public.is_admin()
)
with check (
  public.is_course_instructor(course_id)
  or public.is_admin()
);

drop policy if exists "course_members_delete_instructor_or_admin" on public.course_members;
create policy "course_members_delete_instructor_or_admin"
on public.course_members
for delete
using (
  public.is_course_instructor(course_id)
  or public.is_admin()
);

-- =========================================================
-- RLS Policies: modules / activities / steps / quizzes / questions / choices
-- =========================================================
drop policy if exists "modules_select_member_or_published" on public.modules;
create policy "modules_select_member_or_published"
on public.modules
for select
using (
  public.is_course_student(course_id)
  or public.is_course_instructor(course_id)
  or public.is_admin()
  or exists (
    select 1 from public.courses c
    where c.id = course_id and c.status = 'published'
  )
);

drop policy if exists "modules_write_instructor_or_admin" on public.modules;
create policy "modules_write_instructor_or_admin"
on public.modules
for all
using (public.is_course_instructor(course_id) or public.is_admin())
with check (public.is_course_instructor(course_id) or public.is_admin());

drop policy if exists "activities_select_member_or_published" on public.activities;
create policy "activities_select_member_or_published"
on public.activities
for select
using (
  public.is_course_student(public.activity_course_id(id))
  or public.is_course_instructor(public.activity_course_id(id))
  or public.is_admin()
  or (
    is_published = true and exists (
      select 1
      from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id and c.status = 'published'
    )
  )
);

drop policy if exists "activities_write_instructor_or_admin" on public.activities;
create policy "activities_write_instructor_or_admin"
on public.activities
for all
using (public.is_course_instructor(public.activity_course_id(id)) or public.is_admin())
with check (public.is_course_instructor(public.activity_course_id(id)) or public.is_admin());

drop policy if exists "activity_syntax_steps_select_member_or_published" on public.activity_syntax_steps;
create policy "activity_syntax_steps_select_member_or_published"
on public.activity_syntax_steps
for select
using (
  public.is_course_student(public.activity_course_id(activity_id))
  or public.is_course_instructor(public.activity_course_id(activity_id))
  or public.is_admin()
);

drop policy if exists "activity_syntax_steps_write_instructor_or_admin" on public.activity_syntax_steps;
create policy "activity_syntax_steps_write_instructor_or_admin"
on public.activity_syntax_steps
for all
using (
  public.is_course_instructor(public.activity_course_id(activity_id))
  or public.is_admin()
)
with check (
  public.is_course_instructor(public.activity_course_id(activity_id))
  or public.is_admin()
);

drop policy if exists "learning_syntaxes_select_all_authenticated" on public.learning_syntaxes;
create policy "learning_syntaxes_select_all_authenticated"
on public.learning_syntaxes
for select
using (auth.uid() is not null);

drop policy if exists "learning_syntaxes_write_admin_only" on public.learning_syntaxes;
create policy "learning_syntaxes_write_admin_only"
on public.learning_syntaxes
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "quizzes_select_member_or_instructor" on public.quizzes;
create policy "quizzes_select_member_or_instructor"
on public.quizzes
for select
using (
  public.is_course_student(public.quiz_course_id(id))
  or public.is_course_instructor(public.quiz_course_id(id))
  or public.is_admin()
);

drop policy if exists "quizzes_write_instructor_or_admin" on public.quizzes;
create policy "quizzes_write_instructor_or_admin"
on public.quizzes
for all
using (public.is_course_instructor(public.quiz_course_id(id)) or public.is_admin())
with check (public.is_course_instructor(public.quiz_course_id(id)) or public.is_admin());

drop policy if exists "quiz_questions_select_member_or_instructor" on public.quiz_questions;
create policy "quiz_questions_select_member_or_instructor"
on public.quiz_questions
for select
using (
  public.is_course_student(public.quiz_course_id(quiz_id))
  or public.is_course_instructor(public.quiz_course_id(quiz_id))
  or public.is_admin()
);

drop policy if exists "quiz_questions_write_instructor_or_admin" on public.quiz_questions;
create policy "quiz_questions_write_instructor_or_admin"
on public.quiz_questions
for all
using (
  public.is_course_instructor(public.quiz_course_id(quiz_id))
  or public.is_admin()
)
with check (
  public.is_course_instructor(public.quiz_course_id(quiz_id))
  or public.is_admin()
);

drop policy if exists "quiz_choices_select_member_or_instructor" on public.quiz_choices;
create policy "quiz_choices_select_member_or_instructor"
on public.quiz_choices
for select
using (
  exists (
    select 1
    from public.quiz_questions qq
    where qq.id = question_id
      and (
        public.is_course_student(public.quiz_course_id(qq.quiz_id))
        or public.is_course_instructor(public.quiz_course_id(qq.quiz_id))
        or public.is_admin()
      )
  )
);

drop policy if exists "quiz_choices_write_instructor_or_admin" on public.quiz_choices;
create policy "quiz_choices_write_instructor_or_admin"
on public.quiz_choices
for all
using (
  exists (
    select 1
    from public.quiz_questions qq
    where qq.id = question_id
      and (
        public.is_course_instructor(public.quiz_course_id(qq.quiz_id))
        or public.is_admin()
      )
  )
)
with check (
  exists (
    select 1
    from public.quiz_questions qq
    where qq.id = question_id
      and (
        public.is_course_instructor(public.quiz_course_id(qq.quiz_id))
        or public.is_admin()
      )
  )
);

-- =========================================================
-- RLS Policies: attempts, answers, progress, files
-- =========================================================
drop policy if exists "quiz_attempts_select_own_or_instructor" on public.quiz_attempts;
create policy "quiz_attempts_select_own_or_instructor"
on public.quiz_attempts
for select
using (
  user_id = auth.uid()
  or public.is_course_instructor(public.quiz_course_id(quiz_id))
  or public.is_admin()
);

drop policy if exists "quiz_attempts_insert_student" on public.quiz_attempts;
create policy "quiz_attempts_insert_student"
on public.quiz_attempts
for insert
with check (
  user_id = auth.uid()
  and public.is_course_student(public.quiz_course_id(quiz_id))
);

drop policy if exists "quiz_attempts_update_own_or_instructor" on public.quiz_attempts;
create policy "quiz_attempts_update_own_or_instructor"
on public.quiz_attempts
for update
using (
  user_id = auth.uid()
  or public.is_course_instructor(public.quiz_course_id(quiz_id))
  or public.is_admin()
)
with check (
  user_id = auth.uid()
  or public.is_course_instructor(public.quiz_course_id(quiz_id))
  or public.is_admin()
);

drop policy if exists "quiz_attempt_answers_select_own_or_instructor" on public.quiz_attempt_answers;
create policy "quiz_attempt_answers_select_own_or_instructor"
on public.quiz_attempt_answers
for select
using (
  exists (
    select 1
    from public.quiz_attempts qa
    where qa.id = attempt_id
      and (
        qa.user_id = auth.uid()
        or public.is_course_instructor(public.quiz_course_id(qa.quiz_id))
        or public.is_admin()
      )
  )
);

drop policy if exists "quiz_attempt_answers_insert_own" on public.quiz_attempt_answers;
create policy "quiz_attempt_answers_insert_own"
on public.quiz_attempt_answers
for insert
with check (
  exists (
    select 1
    from public.quiz_attempts qa
    where qa.id = attempt_id
      and qa.user_id = auth.uid()
  )
);

drop policy if exists "quiz_attempt_answers_update_own_or_instructor" on public.quiz_attempt_answers;
create policy "quiz_attempt_answers_update_own_or_instructor"
on public.quiz_attempt_answers
for update
using (
  exists (
    select 1
    from public.quiz_attempts qa
    where qa.id = attempt_id
      and (
        qa.user_id = auth.uid()
        or public.is_course_instructor(public.quiz_course_id(qa.quiz_id))
        or public.is_admin()
      )
  )
)
with check (
  exists (
    select 1
    from public.quiz_attempts qa
    where qa.id = attempt_id
      and (
        qa.user_id = auth.uid()
        or public.is_course_instructor(public.quiz_course_id(qa.quiz_id))
        or public.is_admin()
      )
  )
);

drop policy if exists "activity_progress_select_own_or_instructor" on public.activity_progress;
create policy "activity_progress_select_own_or_instructor"
on public.activity_progress
for select
using (
  user_id = auth.uid()
  or public.is_course_instructor(public.activity_course_id(activity_id))
  or public.is_admin()
);

drop policy if exists "activity_progress_insert_own" on public.activity_progress;
create policy "activity_progress_insert_own"
on public.activity_progress
for insert
with check (
  user_id = auth.uid()
  and public.is_course_student(public.activity_course_id(activity_id))
);

drop policy if exists "activity_progress_update_own_or_instructor" on public.activity_progress;
create policy "activity_progress_update_own_or_instructor"
on public.activity_progress
for update
using (
  user_id = auth.uid()
  or public.is_course_instructor(public.activity_course_id(activity_id))
  or public.is_admin()
)
with check (
  user_id = auth.uid()
  or public.is_course_instructor(public.activity_course_id(activity_id))
  or public.is_admin()
);

drop policy if exists "course_progress_select_own_or_instructor" on public.course_progress;
create policy "course_progress_select_own_or_instructor"
on public.course_progress
for select
using (
  user_id = auth.uid()
  or public.is_course_instructor(course_id)
  or public.is_admin()
);

drop policy if exists "course_progress_insert_own_or_system" on public.course_progress;
create policy "course_progress_insert_own_or_system"
on public.course_progress
for insert
with check (
  user_id = auth.uid()
  or public.is_course_instructor(course_id)
  or public.is_admin()
);

drop policy if exists "course_progress_update_own_or_instructor" on public.course_progress;
create policy "course_progress_update_own_or_instructor"
on public.course_progress
for update
using (
  user_id = auth.uid()
  or public.is_course_instructor(course_id)
  or public.is_admin()
)
with check (
  user_id = auth.uid()
  or public.is_course_instructor(course_id)
  or public.is_admin()
);

drop policy if exists "files_select_member_or_instructor" on public.files;
create policy "files_select_member_or_instructor"
on public.files
for select
using (
  (course_id is not null and (public.is_course_student(course_id) or public.is_course_instructor(course_id) or public.is_admin()))
  or
  (activity_id is not null and (public.is_course_student(public.activity_course_id(activity_id)) or public.is_course_instructor(public.activity_course_id(activity_id)) or public.is_admin()))
);

drop policy if exists "files_write_instructor_or_admin" on public.files;
create policy "files_write_instructor_or_admin"
on public.files
for all
using (
  (course_id is not null and (public.is_course_instructor(course_id) or public.is_admin()))
  or
  (activity_id is not null and (public.is_course_instructor(public.activity_course_id(activity_id)) or public.is_admin()))
)
with check (
  (course_id is not null and (public.is_course_instructor(course_id) or public.is_admin()))
  or
  (activity_id is not null and (public.is_course_instructor(public.activity_course_id(activity_id)) or public.is_admin()))
);

-- =========================================================
-- Storage bucket suggestions (run separately in Storage UI/SQL if needed)
-- =========================================================
-- Suggested buckets:
-- 1) course-assets       private
-- 2) course-thumbnails   public or private with signed URLs
-- 3) exports             private

-- =========================================================
-- Seed suggestions (optional)
-- =========================================================
-- insert into public.learning_syntaxes (name, slug, description, schema_json)
-- values
-- ('Pemantik - Materi - Latihan - Refleksi', 'pm-lat-ref', 'Template pembelajaran dasar', '{"steps":[{"key":"pemantik","label":"Pemantik","type":"markdown","required":true},{"key":"materi","label":"Materi","type":"markdown","required":true},{"key":"latihan","label":"Latihan","type":"quiz","required":false},{"key":"refleksi","label":"Refleksi","type":"markdown","required":false}]}'::jsonb),
-- ('Observasi - Hipotesis - Eksperimen - Diskusi', 'obs-hip-eks-disk', 'Template scientific method', '{"steps":[{"key":"observasi","label":"Observasi","type":"markdown","required":true},{"key":"hipotesis","label":"Hipotesis","type":"markdown","required":true},{"key":"eksperimen","label":"Eksperimen","type":"assignment","required":false},{"key":"diskusi","label":"Diskusi","type":"discussion","required":false}]}'::jsonb);
