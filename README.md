# ideters starter v3

Starter Kit v3 untuk **ideters** dengan pendekatan **docker-compose first**.

## Fitur v3

- Next.js 14 App Router + TypeScript + TailwindCSS
- Docker Compose:
  - web
  - postgres
  - minio
  - mailpit
  - adminer
  - redis
- Auth lokal sederhana:
  - register
  - login
  - logout
  - session cookie
- Dashboard:
  - halaman user
  - halaman instructor
- CRUD dasar:
  - course
  - module
  - activity
- Markdown + LaTeX + KaTeX render
- Upload file ke MinIO (route API siap)
- SQL schema + seed data

## Cara menjalankan

```bash
cp .env.example .env
docker compose up --build
```

Akses:
- app: http://localhost:3000
- adminer: http://localhost:8080
- mailpit: http://localhost:8025
- minio api: http://localhost:9000
- minio console: http://localhost:9001

## Demo account

- instructor@ideters.local / password123
- student@ideters.local / password123

## Catatan penting

- Auth pada v3 ini **belum Supabase Auth**, tetapi struktur folder dan env sudah disiapkan agar mudah di-upgrade.
- Database access memakai `pg`, bukan ORM, supaya starter tetap ringan.
- Session cookie dibuat sederhana untuk bootstrap development.

## Langkah upgrade yang disarankan

1. Ganti auth lokal ke Supabase Auth
2. Pindahkan upload ke Supabase Storage adapter
3. Tambahkan RLS khusus self-hosted Supabase
4. Tambahkan quiz builder UI
5. Tambahkan editor authoring yang lebih kaya
