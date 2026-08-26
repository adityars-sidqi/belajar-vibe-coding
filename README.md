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
| GET | `/users` | - | List semua user |
| GET | `/users/:id` | - | Detail user berdasarkan id |
| POST | `/users` | `{ "name": string, "email": string }` | Buat user baru |
| PUT | `/users/:id` | `{ "name"?: string, "email"?: string }` | Update user |
| DELETE | `/users/:id` | - | Hapus user |

Semua response error mengikuti format konsisten:

```json
{
  "error": {
    "message": "...",
    "status": 400
  }
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
  modules/
    users/       # route + service per resource (contoh pola untuk resource lain)
  index.ts       # entry point: setup Elysia, health check, error handler terpusat
drizzle.config.ts # konfigurasi Drizzle Kit
drizzle/          # hasil generate migrasi (SQL + snapshot)
```
