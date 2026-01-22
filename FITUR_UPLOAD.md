# Fitur Upload Media - WhatsApp Blast

## Deskripsi
Fitur upload media memungkinkan Anda untuk mengirim gambar, video, audio, PDF, atau dokumen lainnya bersama dengan pesan broadcast ke semua kontak dalam daftar.

## Jenis File yang Didukung

### 1. Gambar (Image)
- **Format**: JPG, JPEG, PNG, GIF, WebP, BMP
- **Pengiriman**: Dikirim sebagai gambar dengan caption
- **Caption**: Pesan template akan menjadi caption gambar
- **Contoh**: Gambar produk, flyer, poster, screenshot

### 2. Video
- **Format**: MP4, AVI, MKV, MOV, WMV, FLV
- **Pengiriman**: Dikirim sebagai video dengan caption
- **Caption**: Pesan template akan menjadi caption video
- **Contoh**: Video promosi, tutorial, demo produk

### 3. Audio
- **Format**: MP3, WAV, OGG, M4A, AAC
- **Pengiriman**: Dikirim sebagai file audio
- **Catatan**: Audio tidak mendukung caption, pesan akan dikirim sebagai teks terpisah (jika ada)
- **Contoh**: Voice note, musik, podcast

### 4. Dokumen
- **Format**: 
  - PDF (Portable Document Format)
  - DOC, DOCX (Microsoft Word)
  - XLS, XLSX (Microsoft Excel)
  - PPT, PPTX (Microsoft PowerPoint)
  - ZIP, RAR (Archive files)
  - TXT, CSV (Text files)
- **Pengiriman**: Dikirim sebagai dokumen dengan caption
- **Caption**: Pesan template akan menjadi caption dokumen
- **Contoh**: Katalog, brosur, price list, formulir

## Batasan & Ketentuan

### Ukuran File
- **Maksimal**: 50 MB per file
- **Validasi**: Sistem akan menolak file yang lebih besar dari 50 MB
- **Rekomendasi**: Gunakan file dengan ukuran wajar untuk menghindari error

### Jumlah File
- **Per Broadcast**: 1 file
- **Distribusi**: File yang sama akan dikirim ke SEMUA kontak dalam daftar
- **Personalisasi**: Caption dapat dipersonalisasi dengan variable `{nama}` dan `{nomorhp}`

## Cara Penggunaan

### Langkah 1: Pilih File
1. Klik pada input file "Lampiran Media (Opsional)"
2. Pilih file dari komputer Anda
3. File akan ditampilkan dalam preview dengan:
   - Nama file
   - Ukuran file
   - Tombol hapus (X)

### Langkah 2: Pilih Mode Pengiriman
Setelah file dipilih, akan muncul opsi checkbox:

**✓ Kirim teks dan file dalam 1 balloon chat (Default)**
- File dikirim dengan teks sebagai caption
- Muncul dalam 1 bubble chat WhatsApp
- Lebih ringkas dan profesional
- **Cocok untuk**: Promosi, katalog, pengumuman

**✗ Kirim file dan teks terpisah**
- File dan teks dikirim sebagai 2 pesan terpisah
- Muncul dalam 2 bubble chat WhatsApp
- Teks lebih terbaca dan menonjol
- **Cocok untuk**: Dokumen penting, file besar, pesan panjang

### Langkah 3: Tulis Pesan (Caption)
1. Tulis pesan di field "Template Pesan"
2. Gunakan variable untuk personalisasi:
   - `{nama}` - Nama kontak
   - `{nomorhp}` - Nomor HP kontak
3. Contoh:
   ```
   Halo {nama}! 👋
   
   Berikut kami kirimkan katalog produk terbaru untuk Anda.
   Silakan cek dan hubungi kami di {nomorhp} untuk order.
   
   Terima kasih! 🙏
   ```

### Langkah 4: Masukkan Daftar Kontak
Format: `nama,nomorhp`
```
John Doe,081234567890
Jane Smith,081234567891
Ahmad,081234567892
```

### Langkah 5: Kirim Broadcast
1. Klik tombol "Mulai Broadcasting"
2. File akan di-upload ke server
3. Pesan dengan file akan dikirim ke setiap kontak
4. Monitor progress di panel kanan

## Contoh Penggunaan

### Contoh 1: Kirim Gambar Promosi (1 Balloon)
```
File: promosi-ramadhan.jpg (2.5 MB)
Mode: ✓ Dalam 1 balloon chat
Pesan:
Assalamualaikum {nama}! 🌙

Menyambut bulan Ramadhan, kami punya promo spesial untuk Anda!
Cek gambar di atas dan langsung order sekarang.

Info & Order: {nomorhp}

Hasil: Gambar dengan caption dalam 1 bubble WhatsApp
```

### Contoh 2: Kirim PDF Katalog (Terpisah)
```
File: katalog-produk-2024.pdf (5 MB)
Mode: ✗ Terpisah
Pesan:
Halo {nama}! 📋

Berikut katalog produk terbaru 2024.
Silakan download dan cek produk-produk menarik kami.

Hubungi kami untuk order atau pertanyaan:
WhatsApp: {nomorhp}

Hasil: 2 bubble - bubble pertama berisi teks, bubble kedua berisi PDF
```

### Contoh 3: Kirim Video Tutorial (1 Balloon)
```
File: tutorial-instalasi.mp4 (15 MB)
Mode: ✓ Dalam 1 balloon chat
Pesan:
Hai {nama}! 🎥

Video tutorial cara instalasi produk sudah kami kirimkan.
Silakan tonton dan ikuti langkah-langkahnya.

Ada pertanyaan? Chat kami di {nomorhp}

Hasil: Video dengan caption dalam 1 bubble WhatsApp
```

### Contoh 4: Kirim Dokumen Penting (Terpisah)
```
File: surat-penawaran.pdf (3 MB)
Mode: ✗ Terpisah
Pesan:
Kepada Yth. {nama}

Bersama ini kami lampirkan Surat Penawaran Kerjasama untuk perusahaan Anda.
Mohon untuk ditinjau dan segera memberikan feedback.

Contact Person: {nomorhp}

Hasil: Pesan teks terpisah dari file untuk kesan lebih formal
```

## Tips & Best Practices

### 1. Pilih Mode Pengiriman yang Tepat

**Gunakan Mode 1 Balloon (dengan caption) untuk:**
- Gambar promosi/marketing
- Video pendek (< 1 menit)
- Pesan singkat dan casual
- Konten social media style
- Katalog produk visual

**Gunakan Mode Terpisah (2 balloons) untuk:**
- Dokumen formal/resmi
- File besar (> 10 MB)
- Pesan panjang dan detail
- Kontrak atau surat penting
- Ketika pesan perlu dibaca terpisah dari file

### 2. Kompresi File
- Kompres gambar sebelum upload untuk mempercepat pengiriman
- Gunakan tool seperti TinyPNG, ImageOptim, atau Squoosh
- Untuk video, gunakan format MP4 dengan codec H.264

### 3. Naming File
- Gunakan nama file yang deskriptif
- Contoh: `promo-ramadhan-2024.jpg` lebih baik dari `IMG_1234.jpg`
- Hindari karakter khusus dalam nama file

### 4. Ukuran File
- Gambar: 500KB - 2MB (optimal untuk WhatsApp)
- Video: 5MB - 15MB (maksimal 16 MB untuk WhatsApp)
- PDF: 1MB - 5MB (agar cepat di-download)
- Dokumen: < 5MB

### 5. Format File
- Gambar: Gunakan JPG untuk foto, PNG untuk gambar dengan transparansi
- Video: MP4 format (paling universal)
- Dokumen: PDF (paling aman dan universal)

### 6. Testing
- Test terlebih dahulu dengan 1-2 kontak
- Coba kedua mode (caption dan terpisah) untuk melihat hasil
- Pastikan file terkirim dengan baik
- Cek apakah caption terbaca dengan jelas
- Verifikasi file dapat dibuka di WhatsApp

### 7. Timing
- Kirim broadcast di jam yang tepat (09:00 - 17:00)
- Hindari kirim terlalu larut malam
- Pertimbangkan delay 3-5 detik antar pesan

### 8. Konten
- Pastikan file yang dikirim relevan untuk semua kontak
- Periksa kualitas dan kejelasan konten
- Hindari file yang bisa menyinggung penerima

## Troubleshooting

### File Terlalu Besar
**Masalah**: File ditolak karena lebih dari 50 MB
**Solusi**:
- Kompres file menggunakan tool online/offline
- Untuk video: turunkan resolusi atau bitrate
- Untuk PDF: gunakan PDF compressor
- Split file menjadi beberapa bagian

### File Gagal Terkirim
**Masalah**: File tidak terkirim ke beberapa kontak
**Solusi**:
- Periksa koneksi internet
- Cek format nomor HP (harus valid)
- Verifikasi file tidak corrupt
- Coba dengan delay lebih lama

### Preview File Tidak Muncul
**Masalah**: Setelah pilih file, preview tidak tampil
**Solusi**:
- Refresh halaman browser
- Clear cache browser
- Pastikan JavaScript aktif
- Coba browser lain

### File Hilang Setelah Upload
**Masalah**: File otomatis terhapus dari server
**Solusi**:
- Ini normal, file otomatis dihapus setelah broadcast selesai
- File bersifat temporary untuk keamanan
- File tidak disimpan permanen di server

## Keamanan & Privacy

### Penyimpanan File
- File di-upload ke folder `uploads/` di server
- File otomatis dihapus setelah broadcast selesai
- Tidak ada file yang tersimpan permanen
- Folder `uploads/` sudah masuk `.gitignore`

### Enkripsi
- File dikirim melalui WhatsApp dengan enkripsi end-to-end
- Server hanya sebagai temporary storage
- File tidak dapat diakses pihak ketiga

### Best Practice Keamanan
- Jangan upload file sensitif atau rahasia
- Pastikan file bebas virus sebelum upload
- Scan file dengan antivirus jika perlu
- Hindari upload file dengan informasi pribadi

## FAQ

**Q: Apa perbedaan mode 1 balloon vs terpisah?**
A: Mode 1 balloon mengirim file dengan teks sebagai caption (1 chat bubble), mode terpisah mengirim teks dan file sebagai 2 chat bubble terpisah.

**Q: Kapan sebaiknya menggunakan mode terpisah?**
A: Gunakan mode terpisah untuk dokumen formal, file besar, atau ketika pesan perlu dibaca terpisah dari file.

**Q: Apakah audio mendukung caption?**
A: Tidak, WhatsApp tidak mendukung caption untuk audio. Jika ada teks, akan dikirim sebagai pesan terpisah secara otomatis.

**Q: Apakah bisa kirim file berbeda untuk setiap kontak?**
A: Tidak, saat ini satu file akan dikirim ke semua kontak dalam daftar.

**Q: Apakah file tersimpan di server?**
A: Tidak, file otomatis dihapus setelah broadcast selesai.

**Q: Bisa kirim multiple file sekaligus?**
A: Tidak, hanya satu file per broadcast. Untuk multiple file, lakukan broadcast terpisah.

**Q: Kenapa file video saya gagal terkirim?**
A: Pastikan ukuran video tidak melebihi 16 MB (batasan WhatsApp) dan format MP4.

**Q: Apakah ada biaya untuk kirim file?**
A: Tidak, aplikasi ini gratis. Hanya perlu koneksi internet.

**Q: Bisa kirim GIF animasi?**
A: Ya, GIF akan dikirim sebagai file dokumen, bukan animasi.

## Update Log

### Version 1.1.0 (Current)
- ✅ Fitur upload media (gambar, video, audio, dokumen)
- ✅ Support multiple format file
- ✅ Validasi ukuran file (max 50 MB)
- ✅ Preview file sebelum kirim
- ✅ Auto-cleanup file setelah broadcast
- ✅ Caption personalisasi dengan variable

### Rencana Fitur Selanjutnya
- 🔄 Multiple file per broadcast
- 🔄 Different file per contact
- 🔄 Image compression on upload
- 🔄 Video thumbnail preview
- 🔄 File history/library

## Dukungan

Jika ada masalah atau pertanyaan:
1. Cek dokumentasi ini terlebih dahulu
2. Lihat log error di console browser (F12)
3. Restart aplikasi
4. Buka issue di GitHub repository

---

**Catatan**: Fitur ini masih dalam pengembangan aktif. Feedback dan saran sangat diterima!
