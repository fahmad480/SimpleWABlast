# Changelog - WhatsApp Blast Application

## [1.1.1] - 2026-01-22

### ✨ Added - Fitur Baru
- **Opsi Mode Pengiriman File**: Checkbox untuk memilih cara pengiriman file dan teks
  - **Mode 1 Balloon (Default)**: File dikirim dengan teks sebagai caption dalam 1 bubble chat
  - **Mode Terpisah**: File dan teks dikirim sebagai 2 bubble chat terpisah
  - Checkbox otomatis muncul saat file dipilih
  - Visual indicator dengan icon dan penjelasan jelas
  - Default menggunakan mode caption (1 balloon)

### 🎨 UI Improvements
- Tambahan section opsi pengiriman dengan background amber
- Icon chat bubble untuk visual cue
- Penjelasan detail tentang perbedaan kedua mode
- Auto show/hide section sesuai status file

### 🔧 Technical Enhancements
- Backend logic untuk handle 2 mode pengiriman berbeda
- Delay 500ms antara teks dan file saat mode terpisah
- Support audio files (auto terpisah karena tidak support caption)
- FormData mengirim parameter `sendWithCaption`

### 📝 Documentation
- Update FITUR_UPLOAD.md dengan penjelasan 2 mode
- Contoh penggunaan untuk masing-masing mode
- Best practices kapan menggunakan mode tertentu

---

## [1.1.0] - 2026-01-22

### ✨ Added - Fitur Baru
- **Upload Media Feature**: Kemampuan untuk mengirim file/media saat broadcasting
  - Dukungan untuk gambar (JPG, PNG, GIF, WebP, dll)
  - Dukungan untuk video (MP4, AVI, MKV, dll)
  - Dukungan untuk audio (MP3, WAV, OGG, dll)
  - Dukungan untuk dokumen (PDF, DOC, DOCX, XLS, XLSX, ZIP, dll)
  - Validasi ukuran file maksimal 50 MB
  - Preview file sebelum mengirim (nama dan ukuran file)
  - Tombol hapus file jika ingin membatalkan
  - Auto-cleanup file setelah broadcast selesai
  
- **UI Improvements**:
  - Input file dengan styling yang menarik
  - Preview card untuk file yang dipilih
  - Icon yang sesuai dengan jenis file
  - Pesan informasi ukuran dan jenis file yang didukung

- **Backend Enhancements**:
  - Integrasi Multer untuk handling file upload
  - Automatic file type detection (MIME type)
  - Smart file sending berdasarkan tipe:
    - Gambar → dikirim sebagai image dengan caption
    - Video → dikirim sebagai video dengan caption
    - Audio → dikirim sebagai audio file
    - Dokumen → dikirim sebagai document dengan caption
  - Temporary storage dengan auto-cleanup
  - Error handling untuk file upload

### 📦 Dependencies
- Added `multer@^2.0.0-rc.4` untuk file upload handling

### 📝 Documentation
- Menambahkan dokumentasi fitur upload di README.md
- Membuat file FITUR_UPLOAD.md dengan dokumentasi lengkap
- Contoh penggunaan dan best practices
- Troubleshooting guide
- FAQ section

### 🔧 Configuration
- Menambahkan folder `uploads/` ke .gitignore
- Konfigurasi multer storage dengan timestamp filename
- Limit ukuran file 50 MB

### 🐛 Bug Fixes
- N/A (first release of media upload feature)

---

## [1.0.0] - 2025-01-XX

### ✨ Initial Release
- QR Code login dengan WhatsApp Web
- Multi-session support (browser-based)
- Broadcasting ke multiple kontak
- Template variables (`{nama}`, `{nomorhp}`)
- Delay control antar pesan
- Real-time progress monitoring
- Local storage untuk auto-save data
- Session management
- Docker support
- Responsive Bootstrap UI

### 🎯 Core Features
- WhatsApp connection menggunakan Baileys
- Socket.IO untuk real-time communication
- Express server dengan REST API
- QR Code generation
- Contact list management
- Message templating
- Broadcasting progress tracking
- Statistics dashboard

---

## Upcoming Features

### [1.2.0] - Planned
- [ ] Multiple file upload per broadcast
- [ ] Different media per contact
- [ ] Scheduled broadcasting
- [ ] Contact groups management
- [ ] Broadcast history
- [ ] Export/import contacts
- [ ] Media library/gallery

### [1.3.0] - Planned
- [ ] Template library
- [ ] WhatsApp status broadcast
- [ ] Auto-reply feature
- [ ] Contact tagging
- [ ] Analytics dashboard
- [ ] Webhook integration

### [2.0.0] - Future
- [ ] Multi-user support
- [ ] Database integration
- [ ] Admin panel
- [ ] API endpoints
- [ ] Rate limiting
- [ ] Queue system
- [ ] Cloud storage integration

---

## Breaking Changes

### [1.1.0]
- None (backward compatible)

---

## Migration Guide

### From 1.0.0 to 1.1.0

#### Dependencies
```bash
npm install
```

#### No Breaking Changes
- Aplikasi tetap berjalan seperti biasa
- Fitur upload bersifat opsional
- Tidak perlu migrasi data atau konfigurasi

#### New Features Available
- Input file upload di form broadcasting
- File akan dikirim bersama pesan jika di-upload
- Jika tidak upload file, akan mengirim pesan teks seperti biasa

---

## Notes

### Version Numbering
- **Major** (X.0.0): Breaking changes, major rewrite
- **Minor** (1.X.0): New features, backward compatible
- **Patch** (1.0.X): Bug fixes, minor improvements

### Reporting Issues
- Buka issue di GitHub repository
- Sertakan versi aplikasi
- Screenshot jika ada error
- Langkah-langkah untuk reproduce masalah

### Contributing
- Fork repository
- Create feature branch
- Commit changes
- Push to branch
- Create Pull Request

---

**Last Updated**: January 22, 2026
