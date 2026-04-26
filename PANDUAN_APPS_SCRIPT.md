# Panduan Integrasi Google Apps Script — SuperCasis

## Fitur yang Terhubung ke Google Sheets

### 1. Registrasi & Login User (Sheet: "Users")
Sudah berfungsi — data user disimpan di sheet "Users".

### 2. Riwayat Nilai / Skor Permanen (Sheet: "ScoreHistory")
Semua skor tes otomatis disimpan ke Google Sheets melalui Apps Script.

### 3. Admin Dashboard (Sheet: "AccessLog") — BARU!
Semua data admin sekarang terintegrasi penuh dengan Google Sheets:
- **Daftar Akun** → Diambil langsung dari sheet "Users" via `get_users`
- **Riwayat Akses** → Diambil dari sheet "AccessLog" via `get_access_log`
- **Log Otomatis** → Setiap login/register otomatis tercatat di "AccessLog" (server-side)

---

## Daftar Sheet yang Digunakan

| Sheet | Fungsi | Dibuat Otomatis? |
|-------|--------|:---:|
| **Users** | Data akun pengguna | ❌ Buat manual |
| **ScoreHistory** | Riwayat skor tes | ✅ Ya |
| **AccessLog** | Log login & registrasi | ✅ Ya |

---

## Setup Awal

### Sheet "Users" (Buat Manual)
Buat sheet bernama **"Users"** dengan header di baris 1:

| Kolom | A | B | C | D | E | F | G | H |
|-------|---|---|---|---|---|---|---|---|
| Header | Nama | Nomor | Email | Password | BuktiURL | Status | TanggalDaftar | TerakhirLogin |

### Sheet "ScoreHistory" (Otomatis)
Sheet ini akan **otomatis dibuat** saat pertama kali ada skor yang disimpan.

| Kolom | Isi |
|-------|-----|
| A | Email |
| B | TestName |
| C | Category |
| D | ParentCategory |
| E | Score |
| F | Correct |
| G | Total |
| H | PaketNumber |
| I | SessionId |
| J | Date |
| K | PackageResults (JSON) |

### Sheet "AccessLog" (Otomatis)
Sheet ini akan **otomatis dibuat** saat pertama kali ada login/register.

| Kolom | Isi |
|-------|-----|
| A | Email |
| B | Nama |
| C | Action (login/register) |
| D | Timestamp |

---

## Daftar API Endpoint (Actions)

### Via doPost (POST Request)

| Action | Fungsi | Digunakan Oleh |
|--------|--------|----------------|
| `register` | Daftar user baru | register.html |
| `login` | Login user + catat log | login.html |
| `change_password` | Ganti password | login.html |
| `forgot_password` | Minta reset password | login.html |
| `save_score` | Simpan skor tes | app/script.js |
| `get_scores` | Ambil skor user | app/script.js |
| `get_users` | Ambil daftar user | admin-dashboard.html |
| `get_access_log` | Ambil riwayat akses | admin-dashboard.html |
| `log_access` | Catat log akses manual | login.html |
| `update_status` | Update status user | admin-dashboard.html |
| `admin_reset_password` | Reset password user | admin-dashboard.html |
| `delete_user` | Hapus user | admin-dashboard.html |

### Via doGet (GET Request)

| Action | Fungsi |
|--------|--------|
| `get_scores` | Ambil skor user (sync cloud) |
| `get_users` | Ambil daftar user |
| `get_access_log` | Ambil riwayat akses |

---

## Cara Deploy / Deploy Ulang Apps Script

### Langkah 1: Buka Apps Script
1. Buka [Google Apps Script](https://script.google.com)
2. Buka project yang terhubung dengan Spreadsheet Anda

### Langkah 2: Ganti Kode
3. **Hapus seluruh kode lama**
4. **Paste seluruh isi** dari file `kode apss script.txt`

### Langkah 3: Deploy
5. Klik **Deploy** → **New deployment**
6. Type: **Web app**
7. Execute as: **Me** (muhammadnur41@guru.sma.belajar.id)
8. Who has access: **Anyone**
9. Klik **Deploy**

> ⚠️ **PENTING**: Setiap kali Anda mengubah kode, Anda **HARUS** membuat **New deployment** baru.
> Hanya "Manage deployments" → edit versi **TIDAK** cukup untuk memperbarui kode!

### Langkah 4: Update URL (jika berubah)
10. Jika URL deployment berubah, update di **SEMUA** file berikut:
    - `login.html` — variabel `scriptURL`
    - `register.html` — variabel `scriptURL`
    - `app/script.js` — variabel `SCORE_SCRIPT_URL`
    - `admin-dashboard.html` — variabel `scriptURL`

---

## Cara Kerja Sinkronisasi

### Saat Login:
1. Client mengirim POST `action=login` ke Apps Script
2. Apps Script memverifikasi email + password dari sheet "Users"
3. Jika berhasil: update kolom "Terakhir Login" + catat ke sheet "AccessLog"
4. Response dikirim ke client → redirect ke dashboard

### Saat Register:
1. Client mengirim POST `action=register` ke Apps Script
2. Apps Script menyimpan data ke sheet "Users" dengan status "Pending"
3. Otomatis catat ke sheet "AccessLog" (server-side)

### Saat Simpan Skor (setelah tes selesai):
1. Skor disimpan ke **localStorage** (cache lokal, instan)
2. Skor dikirim ke **Google Sheets** via POST (fire-and-forget, async)
3. Toast notification hijau muncul: "Skor tersimpan ke cloud" ☁️

### Saat Buka Admin Dashboard:
1. Dashboard fetch `get_users` → tampilkan tabel akun terdaftar
2. Dashboard fetch `get_access_log` → tampilkan riwayat login/register
3. Semua data **langsung dari server** (bukan localStorage)

### Saat Buka Riwayat Nilai:
1. Pertama kali: tampilkan loading screen, ambil data dari cloud
2. Data cloud di-merge dengan data lokal (menghindari duplikat)
3. Hasil merge disimpan ke localStorage sebagai cache
4. Selanjutnya: render dari cache (cepat)
5. Tombol **Sync** di header modal untuk refresh manual

### Status Badge di Modal Riwayat Nilai:
- 🟢 **Cloud Synced** — Data sudah sinkron dari server
- 🔵 **Syncing...** — Sedang mengambil data dari server
- 🟡 **Offline** — Gagal sync, klik untuk coba lagi
- ⚪ **Local** — Belum pernah sync

---

## Fitur Admin Baru

### Verifikasi Status User
Admin dapat mengubah status user (Pending → Aktif) via `update_status`.
User dengan status "Pending" **tidak bisa login** sampai admin approve.

### Reset Password
Admin dapat reset password user yang lupa via `admin_reset_password`.
Jika user sebelumnya minta reset (status = "Minta Reset Password"), status otomatis berubah ke "Aktif".

### Hapus User
Admin dapat menghapus akun user via `delete_user`.

---

## Troubleshooting

### Skor tidak muncul di Google Sheets
- Pastikan sudah deploy ulang Apps Script dengan kode terbaru
- Cek Console browser (F12) untuk pesan error `[Cloud]`
- Pastikan internet tersambung

### Data tidak sinkron antar device
- Buka Riwayat Nilai → Klik tombol **Sync** untuk force refresh
- Pastikan login dengan email yang sama di kedua device

### Error "Sheet 'Users' tidak ditemukan"
- Pastikan ada sheet bernama "Users" di Google Spreadsheet
- Sheet "ScoreHistory" dan "AccessLog" akan otomatis dibuat oleh script

### Admin Dashboard kosong
- Pastikan sudah deploy ulang Apps Script dengan kode terbaru yang mengandung `get_users` dan `get_access_log`
- Pastikan URL di `admin-dashboard.html` sesuai dengan URL deployment terbaru
- Cek Console browser (F12) untuk melihat error

### Login ditolak "belum diverifikasi"
- Ini berarti status akun masih "Pending"
- Admin harus approve akun tersebut via Admin Dashboard (ubah status ke "Aktif")
