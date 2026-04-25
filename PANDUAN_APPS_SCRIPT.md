# Panduan Integrasi Google Apps Script — SuperCasis

## Fitur yang Terhubung ke Google Sheets

### 1. Registrasi & Login User (Sheet: "Users")
Sudah berfungsi — data user disimpan di sheet "Users".

### 2. Riwayat Nilai / Skor Permanen (Sheet: "ScoreHistory")
**BARU!** Semua skor tes otomatis disimpan ke Google Sheets melalui Apps Script.

---

## Setup Sheet "ScoreHistory"

### Otomatis
Sheet "ScoreHistory" akan **otomatis dibuat** oleh Apps Script saat pertama kali ada skor yang disimpan. Anda tidak perlu membuat sheet secara manual.

### Struktur Kolom (Baris 1 = Header)
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

---

## Cara Deploy Ulang Apps Script

1. Buka [Google Apps Script](https://script.google.com)
2. Buka project yang terhubung dengan Spreadsheet Anda
3. **Ganti seluruh kode** dengan isi file `kode apss script.txt`
4. Klik **Deploy** → **New deployment**
5. Type: **Web app**
6. Execute as: **Me** (muhammadnur41@guru.sma.belajar.id)
7. Who has access: **Anyone**
8. Klik **Deploy**

> ⚠️ **PENTING**: Jika URL deployment berubah, update `SCORE_SCRIPT_URL` di file `app/script.js` (baris awal bagian Cloud Score Integration).

---

## Cara Kerja Sinkronisasi

### Saat Simpan Skor (setelah tes selesai):
1. Skor disimpan ke **localStorage** (cache lokal, instan)
2. Skor dikirim ke **Google Sheets** via POST (fire-and-forget, async)
3. Toast notification hijau muncul: "Skor tersimpan ke cloud" ☁️

### Saat Buka Riwayat Nilai:
1. Pertama kali: tampilkan loading screen, ambil data dari cloud
2. Data cloud di-merge dengan data lokal (menghindari duplikat)
3. Hasil merge disimpan ke localStorage sebagai cache
4. Selanjutnya: render dari cache (cepat)
5. Tombol **Sync** di header modal untuk refresh manual

### Status Badge di Modal:
- 🟢 **Cloud Synced** — Data sudah sinkron dari server
- 🔵 **Syncing...** — Sedang mengambil data dari server
- 🟡 **Offline** — Gagal sync, klik untuk coba lagi
- ⚪ **Local** — Belum pernah sync

---

## Troubleshooting

### Skor tidak muncul di Google Sheets
- Pastikan sudah deploy ulang Apps Script dengan kode terbaru
- Cek Console browser (F12) untuk pesan error `[CloudScore]`
- Pastikan internet tersambung

### Data tidak sinkron antar device
- Buka Riwayat Nilai → Klik tombol **Sync** untuk force refresh
- Pastikan login dengan email yang sama di kedua device

### Error "Sheet 'Users' tidak ditemukan"
- Pastikan ada sheet bernama "Users" di Google Spreadsheet
- Sheet "ScoreHistory" akan otomatis dibuat oleh script
