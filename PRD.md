# Product Requirement Document (PRD)
## LoveFun: Couple Activities Hub & Modern Super Admin Studio

- **Proyek**: LoveFun (`love-fun` / formerly `beauty-booth`)
- **Versi**: 2.1.0
- **Status**: Draft Requirements & Architecture Spec
- **Author**: Fauzan (`janfdev`)
- **Target Platform**: Next.js 15 (App Router), Prisma ORM, PostgreSQL, Tailwind CSS v4, Canvas 2D

---

## 1. Latar Belakang & Visi Produk

LoveFun adalah platform web interaktif untuk pasangan (*couple activities hub*) yang menggabungkan:
1. **Photo Strip Studio**: Photobooth digital 3/4 pose bergaya retro-korea dengan filter kecantikan, stiker, dan ekspor PNG/GIF.
2. **Synchronous Couple Games**: Permainan interaktif berdua secara real-time via *Room Code* (tanpa wajib login).
3. **Super Admin Telemetry & Management Studio**: Pusat kendali terintegrasi bagi pemilik platform (`fauzanrizqinoor@gmail.com`) untuk memantau metrik permainan, sesi foto, dan mengelola katalog bingkai secara dinamis.

---

## 2. Masalah yang Diselesaikan (Problem Statement)

1. **Masalah Autentikasi Super Admin Saat Ini**:
   - Super Admin yang telah login menggunakan Google OAuth (`fauzanrizqinoor@gmail.com`) masih diblokir oleh form *Admin Passphrase Key* di `/dashboard` (`adminKey === "lovefun2026"`).
   - **Solusi**: Menerapkan RBAC berbasis cookie sesi (`lovefun_session`). Ketika email terdeteksi sebagai `SUPER_ADMIN_EMAILS`, route `/dashboard` langsung terbuka otomatis tanpa meminta kunci rahasia apa pun.
2. **Kebutuhan Variasi Game Pasangan**:
   - Saat ini baru tersedia 1 game (`Sync or Sink`). Pasangan membutuhkan variasi game yang lebih santai, seru, dan memicu tawa, yaitu **"Who's Most Likely To" (Tunjuk Pasangan)**.
3. **Standar Desain Dashboard**:
   - Dashboard admin lama masih berupa form statis sederhana.
   - **Solusi**: Mengintegrasikan template `@bagui/dashboard-analytics` yang telah terbukti elegan, bebas elemen klise (*anti-slop*), dengan metrik real-time room, foto, dan manajemen frame.

---

## 3. Matriks Peran & Hak Akses (RBAC)

| Peran | Kriteria | Akses Fitur | Akses Dashboard Admin |
| :--- | :--- | :--- | :--- |
| **Guest (Tamu)** | Tidak memiliki akun | Photo Strip Studio, Join/Host Game via Room Code (TTL 5 Jam). | Ditolak (Redirect ke `/login`). |
| **User (Terdaftar)** | Login email / Google umum | Semua fitur Guest + Simpan riwayat foto strip ke cloud, koleksi lencana skor (*UserBadge*). | Ditolak (Redirect ke `/profile`). |
| **Super Admin** | Email terdaftar di `SUPER_ADMIN_EMAILS` (`fauzanrizqinoor@gmail.com`) | Seluruh fitur User + Monitoring analitik platform, live room inspection, manajemen frame dinamis. | **Akses Penuh Otomatis** (Zero Passphrase / Zero Purchase Key). |

---

## 4. Spesifikasi Game Baru: "Who’s Most Likely To?" (Tunjuk Pasangan)

### 4.1. Konsep & Nilai Hiburan
Permainan komparasi kebiasaan pasangan. Kedua pemain memilih siapa di antara mereka yang paling mencerminkan pernyataan yang muncul.

### 4.2. Alur Permainan (User Journey):
```
[Host Buka /games/likely] 
        │
        ├──> Generate Room Code 6-Karakter (TTL 5 Jam)
        │
[Partner Masukkan Room Code] 
        │
        ├──> Keduanya Terhubung (Lobi Siap)
        │
[Ronde 1 - 10: Pertanyaan Muncul Bersamaan]
        │
        ├──> Pilihan Rahasia: [ AKU ] atau [ DIA ] (Timer 12 Detik)
        │
[Momen Buka Kartu (Reveal Animation)]
        │
        ├──> Match: Konfeti + "Kalian Kompak Banget!" (+10 Chemistry)
        └──> Conflict: Animasi Goyang Lucu + "Wah Beda Nih! Siapa yang Bener?"
        │
[Rangkuman Skor & Lencana]
        │
        └──> Tombol CTA: "Cetak Lencana Hasil ke Photo Strip" (Auto-badge di /booth)
```

### 4.3. Kategori Pertanyaan
1. **Kebiasaan Harian**: *"Siapa yang bangun paling siang?"*, *"Siapa yang mandinya paling lama?"*
2. **Hubungan & Asmara**: *"Siapa yang naksir duluan?"*, *"Siapa yang kalau ngambek paling susah dibujuk?"*
3. **Gaya Hidup & Keuangan**: *"Siapa yang paling boros kalau lihat diskon?"*, *"Siapa yang paling sering bilang 'terserah mau makan apa'?"*

---

## 5. Spesifikasi Dashboard Admin (`@bagui/dashboard-analytics`)

### 5.1. Komponen & Tata Letak Dashboard
Menggunakan template `@bagui/dashboard-analytics` yang disesuaikan untuk konteks LoveFun:
1. **Header Bar**:
   - Status Super Admin aktif: `fauzanrizqinoor@gmail.com`.
   - Jam operasional sistem & penanda server Dahono Cloud aktif.
2. **KPI Telemetry Cards**:
   - **Total Sesi Foto**: Jumlah cetak photo strip (PNG & GIF) yang diekspor.
   - **Game Rooms Aktif**: Ruangan game yang sedang berjalan saat ini (berstatus `WAITING` atau `PLAYING`).
   - **Tingkat Keselarasan Rata-rata**: Rata-rata skor chemistry pasangan (%).
   - **Total Pengguna Terdaftar**: Jumlah user unik di database.
3. **Live Room Inspector (Tabel Pemantauan)**:
   - Menampilkan kode room aktif, jenis game (`SYNC_OR_SINK` / `WHOS_MOST_LIKELY`), sisa TTL, dan skor akhir.
4. **Frame & Border Manager**:
   - Tambah, sunting, dan nonaktifkan template bingkai photo strip langsung ke tabel `FrameCatalog`.

---

## 6. Arsitektur Data & Skema Database (Prisma ORM)

```prisma
// Enum jenis game
enum GameType {
  SYNC_OR_SINK
  WHOS_MOST_LIKELY
}

model User {
  id            String         @id @default(uuid())
  email         String?        @unique
  name          String?
  avatar_url    String?
  role          String         @default("USER") // USER, SUPER_ADMIN
  password_hash String?
  created_at    DateTime       @default(now())
  updated_at    DateTime       @updatedAt

  hosted_rooms  GameRoom[]     @relation("HostRooms")
  photos        PhotoHistory[]
  badges        UserBadge[]

  @@map("users")
}

model GameRoom {
  id              String         @id @default(uuid())
  room_code       String         @unique // Misal: LIKELY88
  host_user_id    String?
  host_name       String
  partner_name    String?
  game_type       String         @default("WHOS_MOST_LIKELY")
  status          String         @default("WAITING") // WAITING, PLAYING, COMPLETED, EXPIRED
  expires_at      DateTime       // Now + 5 hours
  final_score     Int?           // Skor kecocokan (0 - 100)
  answers_json    Json?          // { round_1: { host: "ME", partner: "ME" }, ... }
  created_at      DateTime       @default(now())
  updated_at      DateTime       @updatedAt

  host_user       User?          @relation("HostRooms", fields: [host_user_id], references: [id], onDelete: SetNull)

  @@index([room_code])
  @@index([expires_at])
  @@map("game_rooms")
}

model FrameCatalog {
  id            String         @id @default(uuid())
  frame_code    String         @unique
  frame_name    String
  bg_color      String
  border_color  String
  text_color    String
  is_active     Boolean        @default(true)
  created_at    DateTime       @default(now())
  updated_at    DateTime       @updatedAt

  @@map("frame_catalog")
}
```

---

## 7. Rencana Rute API Baru

1. **`POST /api/rooms/likely/create`**: Membuat sesi room baru untuk "Who's Most Likely To".
2. **`POST /api/rooms/likely/answer`**: Mengirim pilihan ronde (`ME` vs `PARTNER`) dan menyinkronkan status dengan pasangan.
3. **`GET /api/admin/metrics`**: Endpoint terproteksi khusus role `SUPER_ADMIN` untuk menyuplai data metrik ke `@bagui/dashboard-analytics`.
4. **`POST /api/admin/frames`**: Endpoint CRUD frame catalog bagi Super Admin.

---

## 8. Kriteria Penerimaan (Acceptance Criteria)

- [ ] **Auth Super Admin Murni**: Ketika `fauzanrizqinoor@gmail.com` login via Google atau Email, membuka `/dashboard` langsung menampilkan Dashboard Admin tanpa form kunci/passphrase apa pun.
- [ ] **Game Playable**: Game "Who's Most Likely To" dapat dimainkan lancar antara 2 browser berbeda dengan room code 6 karakter.
- [ ] **UI Anti-Slop BagUI**: Dashboard analytics mengadopsi estetika `@bagui` dengan tipografi jelas, kontras tinggi, dan responsif.
- [ ] **100% Client Test Passed**: Tidak ada regresi pada fungsionalitas Photo Strip Studio yang sudah berjalan stabil.
