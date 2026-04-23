# Kode Google Apps Script untuk Admin Dashboard

## Petunjuk
Tambahkan kode berikut ke Google Apps Script Anda agar Admin Dashboard dapat mengambil data user terdaftar dan riwayat akses dari Google Sheets.

## Cara Menambahkan
1. Buka Google Apps Script di: https://script.google.com
2. Buka project yang terhubung dengan URL endpoint Anda
3. Tambahkan kode berikut di dalam fungsi `doPost(e)` Anda, di bagian switch case atau if-else action:

```javascript
// ====================================
// TAMBAHKAN DI DALAM FUNGSI doPost(e)
// ====================================

// Ambil daftar semua user terdaftar
if (action === 'get_users') {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1'); // Ganti nama sheet sesuai kebutuhan
  var data = sheet.getDataRange().getValues();
  var headers = data[0]; // Baris pertama = header
  var users = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j].toString().toLowerCase()] = data[i][j];
    }
    users.push(row);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', data: users }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Ambil riwayat akses/login user
if (action === 'get_access_log') {
  // Jika ada sheet khusus untuk access log
  var logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AccessLog');
  
  if (logSheet) {
    var logData = logSheet.getDataRange().getValues();
    var logHeaders = logData[0];
    var logs = [];
    
    for (var i = 1; i < logData.length; i++) {
      var row = {};
      for (var j = 0; j < logHeaders.length; j++) {
        row[logHeaders[j].toString().toLowerCase()] = logData[i][j];
      }
      logs.push(row);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', data: logs }))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    // Jika belum ada sheet AccessLog, kembalikan data kosong
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Catatan
- Pastikan nama sheet (`Sheet1`, `AccessLog`) sesuai dengan yang ada di Google Sheets Anda
- Setelah menambahkan kode, **deploy ulang** Apps Script sebagai Web App
- Pilih "New deployment" dan pastikan execute as "Me" dan access "Anyone"
- Admin dashboard akan otomatis fallback ke localStorage jika endpoint tidak tersedia
