# belajar-vibe-coding

Backend API sederhana dibangun dengan [Bun](https://bun.sh), [ElysiaJS](https://elysiajs.com), [Drizzle ORM](https://orm.drizzle.team), dan MySQL.

## Prasyarat

- [Bun](https://bun.sh) versi terbaru
- MySQL server yang bisa diakses (lokal, Docker/Podman, atau remote)

## Instalasi

```bash
bun install
```

## Konfigurasi Environment

Salin `.env.example` menjadi `.env`, lalu sesuaikan nilainya:

```bash
cp .env.example .env
```

| Variable | Keterangan | Default |
|---|---|---|
| `NODE_ENV` | Mode aplikasi | `development` |
| `PORT` | Port HTTP server | `3000` |
| `DB_HOST` | Host MySQL | `localhost` |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_USER` | Username MySQL | *(wajib diisi)* |
| `DB_PASSWORD` | Password MySQL | *(wajib diisi)* |
| `DB_NAME` | Nama database | *(wajib diisi)* |

`.env` tidak ikut ter-commit (lihat `.gitignore`). Pastikan database dengan nama `DB_NAME` sudah dibuat di MySQL sebelum menjalankan migrasi.

## Migrasi Database

Generate file migrasi dari schema Drizzle (`src/db/schema`):

```bash
bun run db:generate
```

Jalankan migrasi ke database:

```bash
bun run db:migrate
```

Buka Drizzle Studio untuk melihat isi database secara visual (opsional):

```bash
bun run db:studio
```

## Menjalankan Server

Mode development (auto-restart saat ada perubahan file):

```bash
bun run dev
```

Mode biasa:

```bash
bun run start
```

Server berjalan di `http://localhost:<PORT>` (default `3000`).

## Endpoint

### Health Check

| Method | Path | Keterangan |
|---|---|---|
| GET | `/health` | Memastikan server hidup |

### Users

| Method | Path | Body | Keterangan |
|---|---|---|---|
| GET | `/api/users` | - | List semua user |
| GET | `/api/users/:id` | - | Detail user berdasarkan id |
| POST | `/api/users` | `{ "name": string, "email": string, "password": string }` | Registrasi user baru |
| POST | `/api/users/login` | `{ "email": string, "password": string }` | Login user, mengembalikan session token |
| GET | `/api/users/current` | - | Detail user yang sedang login (butuh header `Authorization: Bearer <token>`) |
| PUT | `/api/users/:id` | `{ "name"?: string, "email"?: string }` | Update user |
| DELETE | `/api/users/:id` | - | Hapus user |

#### Registrasi User

Request:

```bash
curl -i -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Aditya","email":"aditya@localhost","password":"rahasia"}'
```

Response sukses — status `200`:

```json
{
  "data": "OK"
}
```

Password disimpan sebagai hash bcrypt (`Bun.password`, cost `10`) dan tidak pernah dikembalikan di response mana pun.

Semua response error mengikuti format konsisten, dengan `error` berupa string:

```json
{
  "error": "Email sudah terdaftar"
}
```

#### Login User

Request:

```bash
curl -i -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aditya@localhost","password":"rahasia"}'
```

Response sukses — status `200`:

```json
{
  "data": "b3b3c6a0-... (UUID token)"
}
```

Token disimpan di tabel `sessions` bersama `user_id` pemiliknya.

Response error — status `401`, untuk email tidak terdaftar maupun password salah:

```json
{
  "error": "Email atau password salah"
}
```

#### Get Current User

Request:

```bash
curl -i http://localhost:3000/api/users/current \
  -H "Authorization: Bearer <token-dari-login>"
```

Response sukses — status `200`:

```json
{
  "data": {
    "id": 1,
    "name": "Aditya",
    "email": "aditya@localhost",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

Response error — status `401`, untuk header yang tidak ada, format salah, atau token tidak valid:

```json
{
  "error": "Unauthorized"
}
```

## Struktur Folder

```
src/
  config/
    env.ts       # baca & validasi environment variable
    db.ts        # koneksi database (drizzle + mysql2) yang di-share
  db/
    schema/      # definisi schema Drizzle
  routes/        # definisi route per resource (contoh: users-route.ts)
  services/      # business logic per resource (contoh: users-service.ts)
  index.ts       # entry point: setup Elysia, health check, error handler terpusat
drizzle.config.ts # konfigurasi Drizzle Kit
drizzle/          # hasil generate migrasi (SQL + snapshot)
```
