# Feature: Login User (Session Token)

Dokumen ini adalah perencanaan implementasi fitur **login user**. Tujuannya supaya
bisa dikerjakan langkah demi langkah tanpa perlu menebak-nebak keputusan desain.

## Konteks Project

- Runtime: **Bun**, framework: **ElysiaJS**, ORM: **Drizzle**, database: **MySQL**
- Struktur folder di dalam `src`:
  - `routes/` — routing ElysiaJS, format nama file: `users-route.ts`
  - `services/` — logic bisnis aplikasi, format nama file: `users-service.ts`
  - `db/schema/` — definisi tabel Drizzle
  - `config/` — koneksi DB (`db.ts`) dan environment (`env.ts`)
- Sudah ada fitur registrasi user (`POST /api/users`) yang menyimpan password
  sebagai hash **bcrypt** lewat `Bun.password.hash`.
- Error handler terpusat ada di `src/index.ts` dan memakai class `HttpError`
  dari `src/services/users-service.ts`. Setiap error dikembalikan dengan bentuk
  `{ "error": "pesan" }`.

Ikuti pola yang sudah ada. Jangan bikin struktur atau konvensi baru.

## Yang Harus Dibuat

### 1. Tabel `sessions`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer | primary key, auto increment |
| `token` | varchar(255) | not null, berisi UUID milik user yang login |
| `user_id` | integer | foreign key ke `users.id` |
| `created_at` | timestamp | default `CURRENT_TIMESTAMP` |

### 2. Endpoint Login

`POST /api/users/login`

Request body:

```json
{
    "email": "aditya@localhost",
    "password": "rahasia"
}
```

Response sukses:

```json
{
    "data": "token"
}
```

Response error:

```json
{
    "error": "Email atau password salah"
}
```

## Tahapan Implementasi

### Tahap 1 — Buat schema tabel `sessions`

1. Buat file baru `src/db/schema/sessions.ts`.
2. Definisikan tabel `sessions` memakai helper Drizzle MySQL (`mysqlTable`, `int`,
   `varchar`, `timestamp`) — contohnya bisa dilihat di `src/db/schema/users.ts`.
3. Kolom `userId` diberi relasi foreign key ke `users.id` (`.references(() => users.id)`).
4. Export juga tipe `Session` dan `NewSession` seperti pola di `users.ts`.
5. Tambahkan `export * from "./sessions";` di `src/db/schema/index.ts`.

### Tahap 2 — Generate & jalankan migrasi

1. Jalankan `bun run db:generate` untuk membuat file SQL migrasi baru di folder `drizzle/`.
2. Baca file SQL hasil generate, pastikan isinya membuat tabel `sessions` dengan
   kolom dan foreign key yang benar. **Jangan mengedit file migrasi lama** yang
   sudah ada.
3. Jalankan `bun run db:migrate` untuk menerapkan ke database.

### Tahap 3 — Tambah logic login di service

Semua di `src/services/users-service.ts`:

1. Tambahkan class error baru `UnauthorizedError` dengan `status = 401`,
   mengikuti pola `NotFoundError` / `ConflictError` yang sudah ada.
2. Tambahkan method `login(data)` pada object `usersService` dengan alur:
   - Cari user berdasarkan `email`.
   - Kalau user tidak ada → lempar `UnauthorizedError("Email atau password salah")`.
   - Kalau user ada, verifikasi password dengan `Bun.password.verify(password, user.password)`.
   - Kalau password tidak cocok → lempar error yang **sama persis**
     `UnauthorizedError("Email atau password salah")`.
     Pesan error harus sama untuk kedua kasus supaya tidak membocorkan
     informasi email mana yang terdaftar.
   - Kalau cocok: buat token UUID dengan `crypto.randomUUID()`, simpan baris baru
     ke tabel `sessions` berisi `token` dan `userId`.
   - Return `{ data: token }`.
3. Jangan pernah mengembalikan field `password` atau data user lain di response login.

### Tahap 4 — Tambah route login

Di `src/routes/users-route.ts`:

1. Buat skema validasi body dengan `t.Object`, isinya `email` (format email) dan
   `password` (string), mengikuti pola `registerBody` yang sudah ada.
2. Tambahkan route `.post("/login", ({ body }) => usersService.login(body), { body: loginBody })`.
3. **Penting soal urutan route:** route `/login` harus didaftarkan sebelum
   route dinamis `/:id` supaya tidak tertangkap sebagai parameter id.
   Kalau ragu, cukup taruh definisi `/login` di bagian atas.
4. Karena prefix router-nya sudah `/api/users`, path yang ditulis cukup `"/login"`.

### Tahap 5 — Error handling

Tidak perlu menulis try/catch di route. Error handler terpusat di `src/index.ts`
sudah menangkap semua turunan `HttpError` dan mengubahnya jadi
`{ "error": "..." }` dengan status yang sesuai. Cukup pastikan `UnauthorizedError`
merupakan turunan `HttpError`.

### Tahap 6 — Testing manual

Jalankan server dengan `bun run dev`, lalu uji dengan `curl`:

1. **Login berhasil** — pakai email & password user yang sudah diregistrasi.
   Harus balik status `200` dan `{ "data": "<uuid>" }`.
2. **Password salah** — harus balik status `401` dan
   `{ "error": "Email atau password salah" }`.
3. **Email tidak terdaftar** — harus balik status `401` dengan pesan yang sama persis.
4. **Body tidak lengkap / email tidak valid** — harus balik status `400` dari
   validasi Elysia.
5. Cek tabel `sessions` di database (bisa lewat `bun run db:studio`) dan pastikan
   baris baru tersimpan dengan `user_id` yang benar setiap kali login sukses.

Contoh request:

```bash
curl -i -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aditya@localhost","password":"rahasia"}'
```

### Tahap 7 — Update dokumentasi

Di `README.md`:

1. Tambahkan baris `POST /api/users/login` ke tabel endpoint Users.
2. Tambahkan sub-bagian "Login User" berisi contoh request dan response
   (sukses & error), mengikuti gaya penulisan bagian "Registrasi User".
3. Tambahkan `sessions` pada penjelasan schema jika relevan.

## Definition of Done

- [ ] Tabel `sessions` ada di database lewat migrasi Drizzle (bukan SQL manual).
- [ ] `POST /api/users/login` mengembalikan `{ "data": "<uuid>" }` saat kredensial benar.
- [ ] Kredensial salah mengembalikan status `401` dengan
      `{ "error": "Email atau password salah" }`, pesan sama untuk email tidak
      ditemukan maupun password salah.
- [ ] Setiap login sukses membuat satu baris baru di tabel `sessions`.
- [ ] Password tidak pernah muncul di response mana pun.
- [ ] Struktur file mengikuti konvensi: routing di `routes/`, logic bisnis di `services/`.
- [ ] `README.md` sudah diperbarui.

## Di Luar Scope

Hal-hal berikut **tidak** dikerjakan di issue ini, biar perubahannya tetap kecil
dan mudah direview:

- Logout / penghapusan session
- Middleware autentikasi untuk memproteksi endpoint lain
- Masa berlaku (expiry) token dan pembersihan session lama
- Refresh token, rate limiting, dan automated test
