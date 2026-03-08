# 01 - Hidupkan Server dan Akses Browser

## Jalankan Server

```bash
docker compose up -d
```

## Akses Layanan

- App: http://localhost:3000
- Adminer: http://localhost:8080
- Mailpit: http://localhost:8025
- MinIO Console: http://localhost:9011

## Mapping Port Proyek Ini

Port host di proyek ini sudah disesuaikan agar tidak bentrok dengan proyek lain:

- Postgres host port: `5434`
- Redis host port: `6380`
- MinIO API host port: `9010`
- MinIO Console host port: `9011`

## Akun Login Yang Sudah Ada

Akun bawaan dari seed database:

- Instructor (`role: instructor`): `instructor@ideters.local` / `password123`
- Student (`role: student`): `student@ideters.local` / `password123`

## Checklist Cek Cepat

1. Buka `http://localhost:3000`.
2. Login sebagai **instructor**.
3. Buka `/author`.
4. Buat course baru.
5. Tambah module.
6. Tambah activity.

## Verifikasi Kondisi Container

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep ideters-
```

Pastikan minimal service berikut berstatus `Up`:

- `ideters-web` (healthy)
- `ideters-postgres` (healthy)
- `ideters-minio` (healthy)
- `ideters-redis`

## Troubleshooting

Jika login demo gagal:

- Kemungkinan hash password seed tidak cocok.
- Solusi cepat (reset password demo langsung di DB):

```bash
docker exec -i ideters-postgres psql -U ideters -d ideters -c "\
update users
set password_hash = crypt('password123', gen_salt('bf'))
where email in ('instructor@ideters.local', 'student@ideters.local');\
"
```

Jika app tidak bisa diakses:

1. Cek log web:

```bash
docker logs --tail 200 ideters-web
```

2. Restart service web:

```bash
docker compose up -d web
```
