# LoveFun (Love is Fun)

Platform studio foto strip digital interaktif dan hub aktivitas pasangan (*couple activities hub*) yang menggabungkan studio photo booth bergaya retro modern dengan permainan sinkronisasi pasangan secara real-time.

Dijalankan menggunakan **Next.js 15 (App Router)**, **Tailwind CSS v4**, **Prisma ORM**, **Canvas 2D**, dan **Web Audio API**.

---

## Fitur Utama

### 1. Photo Strip Studio (`/booth`)
- **Live Camera & Multi-Pose Auto Capture**: Pengambilan 3 atau 4 pose foto otomatis dengan hitung mundur (*countdown*), layar *white flash*, dan efek suara *shutter* synthesizer Web Audio.
- **Beauty & Aesthetic Color Filters**: Filter real-time seperti *Beauty Glow*, *Soft Peach*, *B&W Classic*, *Vintage Warm*, dan *Cyber Pop*.
- **Cute Theme Frames & Layouts**: Pilihan bingkai pastel (Blush Pink, Cream Pearl, Midnight Noir, Lavender Haze, Matcha Mint) dengan footer teks kustom dan tanggal otomatis.
- **Sticker Placement**: Bebas menempelkan dan memposisikan stiker dekorasi (hati, glitter, pita, ceri, bunga) di atas strip foto.
- **Dual Export (PNG & GIF)**:
  - **PNG**: Cetak gambar resolusi tinggi dengan radius sudut foto dan bingkai estetis.
  - **GIF**: Menggabungkan setiap frame pose menjadi animasi gerak looping (.gif) berukuran optimal via `gifenc`.

### 2. Sync or Sink: Couple Challenge (`/games/sync`)
- **Real-Time Synchronous Game**: Permainan uji kecocokan dan chemistry pasangan antar 2 perangkat yang terhubung.
- **Room Code dengan TTL 5 Jam**: Host membuat kode ruangan unik (*Room Code*) yang aman dan otomatis kedaluwarsa setelah 5 jam untuk menjaga privasi. Pasangan dapat langsung bergabung tanpa wajib mendaftar akun.
- **Lencana Skor & Hasil Chemistry**: Penilaian tingkat kekompakan jawaban secara langsung di akhir sesi permainan.

### 3. Autentikasi & Dashboard Profil (`/login`, `/register`, `/profile`)
- **Akun & Google OAuth**: Mendukung autentikasi email/password terenkripsi (`bcryptjs` + `jose` JWT) serta integrasi Google OAuth.
- **Riwayat & Galeri**: Pengguna yang login dapat menyimpan riwayat sesi foto dan mengoleksi lencana hasil permainan.

---

## Arsitektur & Teknologi

- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Database & ORM**: PostgreSQL via Prisma ORM
- **Media Engine**: HTML5 MediaDevices API, Canvas 2D Rendering Context, `gifenc`
- **Audio**: Web Audio API Sound Synthesizer
- **Auth**: JWT Cookie Session (`jose`) & Password Hashing (`bcryptjs`)

---

## Menjalankan Secara Lokal

### 1. Prasyarat
- Node.js versi 18 atau lebih baru.
- PostgreSQL database (lokal atau cloud seperti Neon/Supabase).

### 2. Instalasi

```bash
# Masuk ke direktori proyek
cd /root/beauty-booth   # atau nama folder clone lokal Anda

# Pasang dependencies
npm install

# Setup environment variables
cp .env.example .env   # Sesuaikan DATABASE_URL dan JWT_SECRET
```

### 3. Sinkronisasi Database

```bash
# Generate Prisma Client & push skema
npx prisma db push
```

### 4. Menjalankan Server Pengembangan

```bash
# Menjalankan Next.js dev server
npm run dev
```

Buka peramban di `http://localhost:3000`:
- **Landing Page**: `http://localhost:3000/`
- **Photo Booth Studio**: `http://localhost:3000/booth`
- **Couple Sync Game**: `http://localhost:3000/games/sync`
- **Login / Register**: `http://localhost:3000/login`

---

## Pengujian

Proyek ini dilengkapi dengan unit test mandiri untuk kalkulasi tata letak canvas dan filter:

```bash
npm test
```

---

## Lisensi & Kontribusi

MIT License · Dibuat oleh [@janfdev](https://github.com/janfdev).
