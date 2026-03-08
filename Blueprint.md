# IDETERS LMS --- Development Blueprint

## 1. Project Overview

**Project Name:** ideters

Ideters adalah Learning Management System (LMS) modular yang berfokus
pada: - struktur course yang jelas - modul pembelajaran berbasis
aktivitas - dukungan matematika menggunakan Markdown + LaTeX - template
*learning syntax* (model pembelajaran) - quiz engine

Tujuan utama project ini adalah membangun LMS modern dengan arsitektur
sederhana namun scalable.

------------------------------------------------------------------------

# 2. Tech Stack

## Frontend

-   Next.js (App Router)
-   React Server Components
-   TailwindCSS
-   Markdown Editor
-   KaTeX Renderer

## Backend

-   Supabase
    -   Auth
    -   Postgres Database
    -   Storage

## Object Storage

-   MinIO (S3 compatible)
-   digunakan sebagai backend storage jika Supabase di self-host

## Content Format

-   Markdown
-   LaTeX

## Math Rendering

-   KaTeX
-   Pre-render saat publish

------------------------------------------------------------------------

# 3. Core Domain Model

Ideters terdiri dari 4 domain utama:

1.  Authentication & Roles
2.  Course & Module
3.  Learning Syntax Templates
4.  Quiz System

------------------------------------------------------------------------

# 4. Roles

Tiga role utama:

## Student

-   melihat course
-   mengikuti activity
-   mengerjakan quiz
-   melihat progress

## Instructor

-   membuat course
-   membuat modul
-   membuat activity
-   membuat quiz

## Admin

-   mengelola sistem
-   mengelola user
-   mengelola template learning syntax

------------------------------------------------------------------------

# 5. Course Structure

Hierarki struktur course:

Course └── Module └── Activity

Activity dapat berupa:

-   reading
-   video
-   assignment
-   discussion
-   quiz
-   syntax_activity

------------------------------------------------------------------------

# 6. Learning Syntax Concept

Learning syntax adalah template pedagogis yang membantu instructor
menyusun aktivitas pembelajaran.

Contoh:

-   Pemantik → Materi → Latihan → Refleksi
-   Observasi → Hipotesis → Eksperimen → Diskusi
-   Problem Based Learning
-   Project Based Learning

Instructor dapat memilih template ini saat membuat activity.

------------------------------------------------------------------------

# 7. Learning Syntax Template Example

Contoh schema JSON:

``` json
{
  "steps": [
    {
      "key": "intro",
      "label": "Pemantik",
      "type": "markdown",
      "required": true
    },
    {
      "key": "exploration",
      "label": "Eksplorasi",
      "type": "markdown",
      "required": true
    },
    {
      "key": "exercise",
      "label": "Latihan",
      "type": "quiz"
    },
    {
      "key": "reflection",
      "label": "Refleksi",
      "type": "markdown"
    }
  ]
}
```

------------------------------------------------------------------------

# 8. Database Design

## profiles

  field       type
  ----------- ------
  id          uuid
  full_name   text
  role        text

------------------------------------------------------------------------

## courses

  field            type
  ---------------- -----------
  id               uuid
  title            text
  slug             text
  description      text
  thumbnail_path   text
  status           text
  owner_id         uuid
  created_at       timestamp

------------------------------------------------------------------------

## course_members

  field       type
  ----------- ------
  id          uuid
  course_id   uuid
  user_id     uuid
  role        text

------------------------------------------------------------------------

## modules

  field       type
  ----------- ---------
  id          uuid
  course_id   uuid
  title       text
  position    integer

------------------------------------------------------------------------

## activities

  field              type
  ------------------ ---------
  id                 uuid
  module_id          uuid
  type               text
  title              text
  content_markdown   text
  content_html       text
  syntax_id          uuid
  position           integer
  is_published       boolean

------------------------------------------------------------------------

## learning_syntaxes

  field         type
  ------------- -------
  id            uuid
  name          text
  slug          text
  description   text
  schema_json   jsonb

------------------------------------------------------------------------

# 9. Quiz System

## quizzes

  field                type
  -------------------- ---------
  id                   uuid
  activity_id          uuid
  title                text
  shuffle_questions    boolean
  time_limit_minutes   integer
  max_attempts         integer
  passing_score        integer

------------------------------------------------------------------------

## quiz_questions

  field               type
  ------------------- ---------
  id                  uuid
  quiz_id             uuid
  type                text
  question_markdown   text
  question_html       text
  points              integer
  position            integer

------------------------------------------------------------------------

## quiz_choices

  field         type
  ------------- ---------
  id            uuid
  question_id   uuid
  choice_text   text
  is_correct    boolean

------------------------------------------------------------------------

## quiz_attempts

  field          type
  -------------- -----------
  id             uuid
  quiz_id        uuid
  user_id        uuid
  started_at     timestamp
  submitted_at   timestamp
  score          numeric
  status         text

------------------------------------------------------------------------

## quiz_attempt_answers

  field         type
  ------------- ---------
  id            uuid
  attempt_id    uuid
  question_id   uuid
  answer_data   jsonb
  is_correct    boolean

------------------------------------------------------------------------

# 10. File Storage

Binary file disimpan di Supabase Storage / MinIO.

Database hanya menyimpan metadata.

Contoh:

files

id path size mime_type owner_id created_at

------------------------------------------------------------------------

# 11. Markdown + LaTeX Rendering

Flow rendering:

Instructor menulis markdown

Server: 1. parse markdown 2. render latex menggunakan KaTeX 3. simpan
HTML hasil render

Database menyimpan:

-   raw_markdown
-   rendered_html

Tujuan: - performa tinggi - tampilan konsisten

------------------------------------------------------------------------

# 12. Project Structure (Next.js)

    app/
      (marketing)/
      (auth)/
        login
        register

      dashboard/
        courses/
        author/

      api/

    components/
    lib/
    supabase/
    editor/
    quiz/

------------------------------------------------------------------------

# 13. API Layer

Gunakan:

-   Next.js Route Handlers
-   Supabase client

Mutasi utama:

create course update module create activity submit quiz

------------------------------------------------------------------------

# 14. Security (RLS)

Supabase Row Level Security:

Student - hanya melihat course yang diikuti

Instructor - hanya mengedit course miliknya

Admin - akses penuh

------------------------------------------------------------------------

# 15. Development Phases

## Phase 1 --- Foundation

-   Auth
-   Course
-   Module
-   Activity
-   Markdown + KaTeX

## Phase 2 --- Learning Syntax

-   template syntax
-   syntax builder
-   activity flow

## Phase 3 --- Assessment

-   quiz engine
-   grading
-   progress tracking

------------------------------------------------------------------------

# 16. MVP Scope

MVP harus mencakup:

-   login
-   course dashboard
-   module viewer
-   activity viewer
-   markdown + latex
-   simple quiz
-   progress tracking

------------------------------------------------------------------------

# 17. Future Roadmap

-   discussion forum
-   gradebook
-   analytics
-   assignment submission
-   rubric grading
-   AI tutor

------------------------------------------------------------------------

# 18. Guiding Principles

1.  Modular
2.  Schema-driven
3.  Markdown-first
4.  Server-rendered content
5.  Pedagogy-aware learning structure

------------------------------------------------------------------------

# END OF BLUEPRINT
