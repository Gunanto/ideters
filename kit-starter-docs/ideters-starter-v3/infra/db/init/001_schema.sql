create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  password_hash text not null,
  role text not null default 'student',
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  status text not null default 'draft',
  owner_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists course_members (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'student',
  status text not null default 'active',
  unique(course_id, user_id)
);

create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  position integer not null default 1
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  type text not null,
  title text not null,
  content_markdown text,
  content_html text,
  position integer not null default 1,
  is_published boolean not null default false
);

create table if not exists learning_syntaxes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  schema_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true
);

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null unique references activities(id) on delete cascade,
  title text not null,
  time_limit_minutes integer,
  max_attempts integer not null default 1,
  passing_score numeric(5,2)
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  type text not null,
  question_markdown text not null,
  question_html text,
  points numeric(8,2) not null default 1,
  position integer not null default 1
);

create table if not exists quiz_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  choice_text text not null,
  is_correct boolean not null default false,
  position integer not null default 1
);

create table if not exists activity_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  activity_id uuid not null references activities(id) on delete cascade,
  status text not null default 'not_started',
  progress_percent numeric(5,2) not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  unique(user_id, activity_id)
);

insert into users (id, email, full_name, password_hash, role)
values
  (
    '22222222-2222-2222-2222-222222222222',
    'instructor@ideters.local',
    'Ideters Instructor',
    '$2a$10$KqA6L8wM7W7W1bB6x1vQfeyzYhW2P6nD0qikLzeGWihcJXQDq6r1C',
    'instructor'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'student@ideters.local',
    'Ideters Student',
    '$2a$10$KqA6L8wM7W7W1bB6x1vQfeyzYhW2P6nD0qikLzeGWihcJXQDq6r1C',
    'student'
  )
on conflict do nothing;

insert into courses (id, slug, title, description, status, owner_id)
values
  (
    '44444444-4444-4444-4444-444444444444',
    'matematika-dasar',
    'Matematika Dasar',
    'Course demo untuk starter kit v3',
    'published',
    '22222222-2222-2222-2222-222222222222'
  )
on conflict do nothing;

insert into course_members (course_id, user_id, role, status)
values
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'instructor', 'active'),
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'student', 'active')
on conflict do nothing;

insert into modules (id, course_id, title, position)
values ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Modul 1 - Aljabar Dasar', 1)
on conflict do nothing;

insert into activities (id, module_id, type, title, content_markdown, content_html, position, is_published)
values
  (
    '66666666-6666-6666-6666-666666666666',
    '55555555-5555-5555-5555-555555555555',
    'reading',
    'Pengantar Persamaan Kuadrat',
    '## Konsep Awal\n\nPersamaan kuadrat berbentuk $ax^2 + bx + c = 0$.\n\nDiskriminan: $$D = b^2 - 4ac$$',
    '<h2>Konsep Awal</h2><p>Persamaan kuadrat berbentuk <span>ax^2 + bx + c = 0</span>.</p><p>Diskriminan: <span>D = b^2 - 4ac</span></p>',
    1,
    true
  )
on conflict do nothing;

insert into learning_syntaxes (name, slug, description, schema_json)
values
  (
    'Pemantik - Materi - Latihan - Refleksi',
    'pemantik-materi-latihan-refleksi',
    'Template dasar pembelajaran',
    '{
      "steps": [
        {"key": "pemantik", "label": "Pemantik", "type": "markdown", "required": true},
        {"key": "materi", "label": "Materi", "type": "markdown", "required": true},
        {"key": "latihan", "label": "Latihan", "type": "quiz", "required": false},
        {"key": "refleksi", "label": "Refleksi", "type": "markdown", "required": false}
      ]
    }'::jsonb
  )
on conflict do nothing;
