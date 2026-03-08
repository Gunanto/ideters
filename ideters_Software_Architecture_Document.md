# IDETERS LMS

## Software Architecture Document (SAD)

Version: 1.0\
Project: ideters\
Type: Learning Management System\
Architecture Style: Modular + Service‑oriented

------------------------------------------------------------------------

# 1. Introduction

## 1.1 Purpose

Dokumen ini menjelaskan arsitektur teknis lengkap untuk sistem
**ideters**, sebuah Learning Management System (LMS) modern berbasis web
yang mendukung struktur pembelajaran modular dan template pedagogi yang
disebut **learning syntax**.

Dokumen ini digunakan sebagai panduan utama untuk:

-   perancangan sistem
-   pengembangan software
-   evaluasi arsitektur
-   onboarding developer baru
-   referensi implementasi

Dokumen ini mengikuti prinsip **Software Architecture Document (SAD)**
yang umum digunakan dalam proyek perangkat lunak berskala menengah
hingga besar.

------------------------------------------------------------------------

## 1.2 Scope

Ideters adalah LMS yang menyediakan fitur inti berikut:

-   Manajemen course
-   Struktur pembelajaran modular
-   Pembelajaran berbasis aktivitas
-   Template learning syntax
-   Quiz engine
-   Konten pembelajaran berbasis Markdown + LaTeX
-   Rendering matematika dengan KaTeX
-   Pelacakan progres belajar
-   Akses berbasis peran (role-based access)

Selain fitur inti, sistem dapat dikembangkan dengan fitur lanjutan berikut:

-   Manajemen Konten dan Kursus (Content Management): Pembuatan, penyimpanan, dan pengunggahan materi pembelajaran dalam berbagai format (teks, PDF, video, dan tautan YouTube) secara terpusat.
-   Penilaian dan Ujian Online (Assessment Tools): Pembuatan kuis, tugas, dan ujian dengan berbagai jenis pertanyaan (pilihan ganda, esai) yang dapat dikoreksi otomatis.
-   Laporan dan Analitik (Reporting & Analytics): Pemantauan kemajuan, waktu penyelesaian, dan nilai peserta didik secara real-time.
-   Interaksi dan Kolaborasi (Forum & Chat): Ruang diskusi, pesan, dan forum untuk interaksi antara pengajar dan peserta didik.
-   Manajemen Pengguna dan Pendaftaran (User Management): Pendaftaran otomatis, manajemen pengguna, serta Single Sign-On (SSO) untuk keamanan.
-   Aksesibilitas Mobile (Mobile Learning): Akses materi dan pelatihan melalui smartphone atau tablet kapan saja.
-   Gamifikasi dan Sertifikasi: Fitur badge atau poin untuk meningkatkan keterlibatan, serta sertifikat otomatis setelah kursus selesai.
-   Integrasi Sistem: Integrasi dengan kalender, sistem akademik, atau alat konferensi video seperti Zoom dan Google Meet.

------------------------------------------------------------------------

## 1.3 Definitions

  Term              Description
  ----------------- -----------------------------
  Course            kumpulan modul pembelajaran
  Module            bagian dari course
  Activity          unit pembelajaran
  Learning Syntax   template struktur pedagogi
  Quiz              sistem evaluasi
  Attempt           percobaan mengerjakan quiz
  Markdown          format teks konten
  LaTeX             format matematika

# 2. System Goals

Tujuan utama ideters:

1.  menyediakan LMS modular
2.  mendukung konten matematika
3.  menyediakan template pembelajaran
4.  scalable untuk banyak course
5.  maintainable architecture

------------------------------------------------------------------------

# 3. High Level Architecture

Arsitektur sistem terdiri dari beberapa layer:

Client Layer\
Application Layer\
Backend Services\
Storage Layer

Diagram konsep:

User → Browser → Next.js App → API Layer → Supabase → Storage (MinIO)

------------------------------------------------------------------------

# 4. Architectural Principles

Beberapa prinsip arsitektur utama:

## Modular Architecture

Setiap domain dipisah menjadi modul.

## Schema Driven Design

Learning syntax menggunakan JSON schema.

## Markdown First

Konten pembelajaran disimpan dalam markdown.

## Server Rendering

Rendering dilakukan di server untuk performa.

## Stateless Frontend

Frontend tidak menyimpan state kompleks.

------------------------------------------------------------------------

# 5. Technology Stack

## Frontend

Next.js (App Router)\
React Server Components\
TailwindCSS

## Backend

Supabase

-   Postgres
-   Auth
-   Storage

## Storage

MinIO (S3 compatible)

## Content Rendering

Markdown parser\
KaTeX renderer

------------------------------------------------------------------------

# 6. System Context

Sistem berinteraksi dengan:

User Browser\
Admin Dashboard\
Object Storage\
Database\
Auth Service

------------------------------------------------------------------------

# 7. User Roles

Student\
Instructor\
Admin

### Student Capabilities

-   view course
-   complete activities
-   submit quiz
-   view progress

### Instructor Capabilities

-   create course
-   manage module
-   create activity
-   build quiz

### Admin Capabilities

-   manage users
-   manage templates
-   manage system

# 8. Domain Model

Core domain terdiri dari:

Course Domain\
Content Domain\
Assessment Domain\
Progress Domain

------------------------------------------------------------------------

# 9. Course Domain

Course adalah entitas utama.

Course → Modules → Activities

Course metadata:

title\
slug\
description\
status

------------------------------------------------------------------------

# 10. Module Domain

Module mengelompokkan activity.

Module attributes:

title\
position\
course_id

------------------------------------------------------------------------

# 11. Activity Domain

Activity adalah unit pembelajaran.

Types:

reading\
video\
quiz\
assignment\
discussion\
syntax_activity

------------------------------------------------------------------------

# 12. Learning Syntax Domain

Learning syntax adalah template pedagogi.

Contoh template:

Exploration → Discussion → Reflection\
Observation → Hypothesis → Experiment

Learning syntax menggunakan schema JSON.

------------------------------------------------------------------------

# 13. Quiz Domain

Quiz digunakan untuk evaluasi pembelajaran.

Komponen:

Quiz\
Questions\
Choices\
Attempts

------------------------------------------------------------------------

# 14. Progress Tracking

Progress disimpan untuk:

course progress\
activity progress\
quiz results

------------------------------------------------------------------------

# 15. Content Rendering Pipeline

Pipeline:

Markdown Input\
Parse Markdown\
Render LaTeX\
Generate HTML\
Store Rendered HTML

------------------------------------------------------------------------

# 16. Markdown Processing

Markdown parser:

remark rehype

Support:

-   headings
-   lists
-   tables
-   code blocks
-   math expressions

# 17. LaTeX Rendering

KaTeX digunakan untuk rendering matematika.

Format:

Inline:

\$ a\^2 + b\^2 = c\^2 \$

Block:

$$
\int_0^1 x^2 dx
$$

Rendering dilakukan server side.

------------------------------------------------------------------------

# 18. Storage Architecture

Binary files disimpan di object storage.

Database hanya menyimpan metadata.

Contoh:

videos\
pdf files\
images

------------------------------------------------------------------------

# 19. Database Design Overview

Database menggunakan PostgreSQL.

Domain tables:

auth\
courses\
content\
assessment\
progress

------------------------------------------------------------------------

# 20. Core Tables

profiles\
courses\
modules\
activities\
learning_syntaxes\
quizzes\
questions

------------------------------------------------------------------------

# 21. ERD Overview

Relationship utama:

course → modules\
module → activities\
activity → quiz

quiz → questions\
questions → choices

------------------------------------------------------------------------

# 22. Security Model

Menggunakan Row Level Security.

Policies:

Student policy\
Instructor policy\
Admin policy

------------------------------------------------------------------------

# 23. Authentication

Supabase Auth digunakan.

Support:

email login\
OAuth login

------------------------------------------------------------------------

# 24. Authorization

Authorization berbasis role.

Role mapping disimpan di database.

------------------------------------------------------------------------

# 25. API Architecture

Next.js Route Handlers digunakan sebagai API.

Contoh endpoint:

POST /courses\
POST /modules\
POST /activities\
POST /quiz/submit

------------------------------------------------------------------------

# 26. Server Components

Digunakan untuk:

course pages\
module pages\
activity viewer

------------------------------------------------------------------------

# 27. Client Components

Digunakan untuk:

quiz interaction\
editor UI\
drag drop builder

------------------------------------------------------------------------

# 28. Course Builder

Instructor dapat membuat course menggunakan builder.

Fitur:

create module\
add activity\
reorder content

------------------------------------------------------------------------

# 29. Syntax Activity Builder

Ketika memilih syntax template:

system membuat step otomatis.

Instructor hanya mengisi konten.

------------------------------------------------------------------------

# 30. Quiz Engine

Quiz engine mendukung:

MCQ\
multiple select\
short answer\
essay

------------------------------------------------------------------------

# 31. Quiz Workflow

Flow:

Start Attempt\
Answer Questions\
Submit Attempt\
Calculate Score

------------------------------------------------------------------------

# 32. Grading System

Grading dilakukan otomatis untuk MCQ.

Essay memerlukan manual grading.

------------------------------------------------------------------------

# 33. Progress Engine

Progress dihitung dari activity completion.

Course progress = completed activities / total.

------------------------------------------------------------------------

# 34. Analytics

Basic analytics:

completion rate\
average score\
activity engagement

------------------------------------------------------------------------

# 35. Scaling Strategy

Scaling dilakukan melalui:

database indexing\
CDN\
object storage

------------------------------------------------------------------------

# 36. Deployment Architecture

Deployment menggunakan container.

Components:

Next.js container\
Supabase services\
MinIO storage

------------------------------------------------------------------------

# 37. CI/CD

Pipeline:

commit → build → test → deploy

Tools:

GitHub Actions\
Docker

------------------------------------------------------------------------

# 38. Monitoring

Monitoring tools:

logs\
metrics\
alerts

------------------------------------------------------------------------

# 39. Backup Strategy

Database backup\
Storage replication

------------------------------------------------------------------------

# 40. Testing Strategy

Testing types:

unit tests\
integration tests\
e2e tests

------------------------------------------------------------------------

# 41. Future Extensions

Possible extensions:

AI tutor\
discussion forums\
rubric grading

------------------------------------------------------------------------

# 42. Plugin System

Activity types dapat diperluas melalui plugin.

Plugin dapat menambahkan:

activity type\
grading logic\
UI components

------------------------------------------------------------------------

# 43. Multi Tenant Support

Future architecture dapat mendukung multi tenant.

Setiap tenant memiliki:

course set\
user set

------------------------------------------------------------------------

# 44. Localization

Support multi language.

------------------------------------------------------------------------

# 45. Accessibility

WCAG compliance.

------------------------------------------------------------------------

# 46. Performance Targets

Page load \< 2s\
Quiz interaction \< 100ms

------------------------------------------------------------------------

# 47. Security Considerations

XSS protection\
CSRF protection\
Secure cookies

------------------------------------------------------------------------

# 48. Data Privacy

User data protection.

------------------------------------------------------------------------

# 49. Development Guidelines

Use modular code\
Follow naming conventions\
Write tests

------------------------------------------------------------------------

# 50. Conclusion

Dokumen ini menjadi blueprint utama pengembangan **ideters LMS**.

------------------------------------------------------------------------

# 51. Developer

Tim pengembang **ideters LMS** adalah Pak Ferilee (ferilee@smkpasirian-lmj.sch.id), Pak Aan (aantriono82@gmail.com), dan PakGun (gunanto75@gmail.com).
