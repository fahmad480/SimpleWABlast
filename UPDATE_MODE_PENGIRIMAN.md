# Update Fitur: Mode Pengiriman File

## 📋 Ringkasan Update

Telah ditambahkan **checkbox opsi mode pengiriman** untuk memberikan kontrol lebih kepada pengguna dalam mengirim file dan teks saat broadcasting.

## ✨ Fitur Baru

### Checkbox Mode Pengiriman
Setelah memilih file, akan muncul opsi checkbox dengan 2 mode:

#### ✅ Mode 1: Kirim dalam 1 Balloon Chat (Default - Dicentang)
- File dan teks dikirim sebagai **1 bubble chat** WhatsApp
- Teks menjadi **caption** dari file
- Lebih **ringkas dan profesional**
- Cocok untuk:
  - Gambar promosi/marketing
  - Video pendek
  - Pesan casual
  - Katalog produk visual
  - Konten social media style

**Contoh Hasil:**
```
[Bubble 1]
━━━━━━━━━━━━━━━━━
│  🖼️ GAMBAR       │
│                  │
│ Halo {nama}!     │
│ Ini promo kami   │
━━━━━━━━━━━━━━━━━
```

#### ❌ Mode 2: Kirim Terpisah (Tidak Dicentang)
- File dan teks dikirim sebagai **2 bubble chat** terpisah
- Teks dikirim terlebih dahulu
- File dikirim 500ms kemudian
- Teks lebih **terbaca dan menonjol**
- Cocok untuk:
  - Dokumen formal/resmi
  - File besar (> 10 MB)
  - Pesan panjang dan detail
  - Kontrak atau surat penting
  - Ketika pesan perlu dibaca terpisah

**Contoh Hasil:**
```
[Bubble 1]
━━━━━━━━━━━━━━━━━
│ Halo {nama}!     │
│ Berikut dokumen  │
│ penting untuk    │
│ Anda...          │
━━━━━━━━━━━━━━━━━

[Bubble 2]
━━━━━━━━━━━━━━━━━
│  📄 DOKUMEN.PDF  │
━━━━━━━━━━━━━━━━━
```

## 🎨 Tampilan UI

### Checkbox Section
Ketika file dipilih, akan muncul section dengan:
- ✅ Checkbox "Kirim teks dan file dalam 1 balloon chat"
- 🎨 Background amber/orange untuk menarik perhatian
- 💬 Icon chat bubble
- 📝 Penjelasan detail kedua opsi
- 🔄 Auto show/hide sesuai status file

### Visual Design
```
┌─────────────────────────────────────────────┐
│ 🟡 [ ✓ ] Kirim teks dan file dalam 1 balloon│
│                                              │
│ ✓ Dicentang: File + teks (1 bubble)        │
│ ✗ Tidak dicentang: Terpisah (2 bubble)     │
└─────────────────────────────────────────────┘
```

## 🔧 Implementasi Teknis

### Frontend (app.js)
```javascript
// Ambil status checkbox
const sendWithCaption = document.getElementById('sendWithCaption').checked;

// Kirim via FormData
formData.append('sendWithCaption', sendWithCaption);
```

### Backend (server.js)
```javascript
// Parse opsi dari request
const useCaptionMode = sendWithCaption === 'true';

if (useCaptionMode) {
    // Mode 1: Send with caption
    await sock.sendMessage(jid, {
        image: buffer,
        caption: message
    });
} else {
    // Mode 2: Send separately
    await sock.sendMessage(jid, { text: message });
    await new Promise(r => setTimeout(r, 500));
    await sock.sendMessage(jid, { image: buffer });
}
```

## 📊 Perbandingan Mode

| Aspek | Mode Caption | Mode Terpisah |
|-------|-------------|---------------|
| **Jumlah Bubble** | 1 | 2 |
| **Teks** | Sebagai caption | Bubble terpisah |
| **Delay** | Langsung | 500ms antara teks & file |
| **Use Case** | Casual, Marketing | Formal, Dokumen |
| **Kesan** | Ringkas, Modern | Detail, Profesional |
| **File Type** | Gambar, Video, Dokumen | Semua jenis file |

## ⚠️ Catatan Khusus

### Audio Files
- Audio **TIDAK mendukung caption** di WhatsApp
- Jika pilih mode caption dengan audio file, sistem otomatis:
  1. Kirim teks terlebih dahulu
  2. Kirim audio file terpisah
- Ini adalah limitasi WhatsApp API

### Delay Antar Pesan
- Mode caption: Tidak ada delay (1 pesan)
- Mode terpisah: 500ms delay antara teks dan file
- Delay ini untuk memastikan urutan pengiriman yang benar

## 🎯 Kapan Menggunakan?

### Gunakan Mode Caption Jika:
- ✅ Konten marketing/promosi
- ✅ Gambar atau video pendek
- ✅ Pesan singkat (< 200 karakter)
- ✅ Target audience casual
- ✅ Ingin tampil ringkas

### Gunakan Mode Terpisah Jika:
- ✅ Dokumen formal/resmi
- ✅ File besar atau penting
- ✅ Pesan panjang (> 200 karakter)
- ✅ Target audience formal
- ✅ Pesan perlu dibaca dengan seksama
- ✅ Ingin penekanan pada teks

## 🚀 Cara Menggunakan

1. **Upload File**
   - Klik input file dan pilih file dari komputer

2. **Checkbox Muncul**
   - Otomatis muncul section opsi pengiriman
   - Default: Checkbox tercentang (mode caption)

3. **Pilih Mode**
   - Biarkan tercentang → Mode caption (1 balloon)
   - Uncheck checkbox → Mode terpisah (2 balloon)

4. **Kirim Broadcast**
   - Klik "Mulai Broadcasting"
   - File akan dikirim sesuai mode yang dipilih

## 📈 Statistik

### Performance
- Mode caption: **1 API call** per kontak
- Mode terpisah: **2 API calls** per kontak
- Delay mode terpisah: **+500ms** per kontak

### Bandwidth
- Mode caption: Lebih efisien (1 pesan)
- Mode terpisah: 2x bandwidth (2 pesan)

## 🐛 Troubleshooting

**Q: Checkbox tidak muncul?**
- Pastikan file sudah dipilih
- Refresh halaman browser
- Check console untuk error

**Q: Mode caption tidak bekerja untuk audio?**
- Normal, WhatsApp tidak support caption untuk audio
- Sistem otomatis kirim terpisah

**Q: File terkirim tapi teks tidak?**
- Check koneksi internet
- Pastikan pesan tidak kosong
- Coba mode caption untuk memastikan

## 📝 Changelog

### Version 1.1.1
- ✅ Added: Checkbox opsi mode pengiriman
- ✅ Added: Mode caption (1 balloon)
- ✅ Added: Mode terpisah (2 balloon)
- ✅ UI: Auto show/hide checkbox section
- ✅ Backend: Logic pengiriman 2 mode
- ✅ Docs: Update dokumentasi

## 🔮 Rencana Selanjutnya

- [ ] Preview mode sebelum kirim
- [ ] Statistik per mode
- [ ] Preset mode per jenis file
- [ ] Template mode untuk campaign
- [ ] A/B testing mode

---

**Update Date**: January 22, 2026  
**Version**: 1.1.1  
**Feature**: Mode Pengiriman File (Caption vs Terpisah)
