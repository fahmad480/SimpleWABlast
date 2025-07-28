# WhatsApp Blast - Broadcasting Tool

Aplikasi Node.js sederhana untuk WhatsApp broadcasting menggunakan Baileys WhatsApp Web API.

## Fitur

- **QR Code Login**: Login otomatis menggunakan QR Code WhatsApp Web
- **Multi-Session**: Setiap browser memiliki session WhatsApp terpisah
- **Browser-Based Session**: Session tersimpan di localStorage browser
- **Disconnect Feature**: Tombol disconnect untuk memutus koneksi WhatsApp
- **Local Storage**: Daftar kontak dan template pesan otomatis tersimpan di browser
- **Broadcasting**: Kirim pesan ke multiple kontak sekaligus
- **Template Variables**: Support variable `{nama}` dan `{nomorhp}` dalam pesan
- **Delay Control**: Pengaturan delay antar pesan
- **Real-time Progress**: Monitor progress broadcasting secara real-time
- **Auto-save**: Data form otomatis tersimpan saat mengetik
- **Session Management**: Reset session atau clear data tersimpan
- **Docker Support**: Containerization dengan Docker dan Docker Compose
- **Bootstrap UI**: Interface yang responsif dan user-friendly

## Instalasi

### Metode 1: Manual Installation
1. Clone atau download repository ini
2. Install dependencies:
```bash
npm install
```

3. Jalankan aplikasi:
```bash
npm start
```

4. Buka browser dan akses `http://localhost:3000`

### Metode 2: Docker (Recommended)

#### Prasyarat
- Docker dan Docker Compose terinstall
- Port 3000 tersedia

#### Quick Start
```bash
# Build dan jalankan
docker compose up -d

# Atau gunakan script
# Windows:
deploy.bat start

# Linux/Mac:
chmod +x deploy.sh
./deploy.sh start
```

#### Manual Commands
```bash
# Build image
docker compose build

# Start application
docker compose up -d

# Stop application
docker compose down

# View logs
docker compose logs -f whatsapp-blast
```

#### NPM Scripts
```bash
npm run docker:build    # Build image
npm run docker:start    # Start app
npm run docker:stop     # Stop app
npm run docker:logs     # View logs
```

## Penggunaan

### 1. Login WhatsApp
- Saat pertama kali dibuka, aplikasi akan menampilkan QR Code
- Scan QR Code menggunakan WhatsApp di ponsel Anda
- Session akan tersimpan secara lokal untuk login otomatis di masa mendatang

### 2. Broadcasting
- **Daftar Kontak**: Masukkan daftar kontak dengan format `nama,nomorhp` (satu kontak per baris)
  ```
  John Doe,081234567890
  Jane Smith,081234567891
  Ahmad,081234567892
  ```

- **Template Pesan**: Tulis pesan dengan variable yang tersedia:
  - `{nama}` - akan diganti dengan nama kontak
  - `{nomorhp}` - akan diganti dengan nomor HP kontak
  
  Contoh:
  ```
  Halo {nama}, ini adalah pesan broadcast untuk nomor {nomorhp}
  ```

- **Delay**: Atur jeda waktu antar pesan (1-60 detik)

- **Kirim**: Klik tombol "Mulai Broadcasting" untuk memulai

### 3. Monitoring
- Monitor progress real-time di panel kanan
- Lihat statistik pengiriman (berhasil/gagal)
- Log detail untuk setiap pengiriman
- Timestamp untuk setiap aktivitas

### 4. Data Management
- **Auto-save**: Daftar kontak dan template pesan otomatis tersimpan di browser
- **Visual Indicator**: Badge hijau menunjukkan data yang tersimpan
- **Clear Data**: Tombol untuk menghapus semua data tersimpan
- **Time Stamp**: Informasi kapan data terakhir disimpan

### 5. Session Management
- **Multi-Browser Support**: Setiap browser memiliki session WhatsApp terpisah
- **Browser-Based Storage**: Session ID disimpan di localStorage browser
- **Reset Session**: Tombol untuk reset session WhatsApp
- **Session Display**: Menampilkan ID session di navbar
- **Independent Sessions**: Session tidak tergantung pada project files

### 6. Device Management
- **Disconnect**: Tombol untuk memutus koneksi WhatsApp secara manual
- **Reconnect**: Otomatis reconnect jika terputus
- **Session Cleanup**: Menghapus session saat disconnect manual
- **Auto-save**: Daftar kontak dan template pesan otomatis tersimpan di browser
- **Visual Indicator**: Badge hijau menunjukkan data yang tersimpan
- **Clear Data**: Tombol untuk menghapus semua data tersimpan
- **Time Stamp**: Informasi kapan data terakhir disimpan

## Struktur File

```
WABlast/
├── package.json          # Dependencies dan scripts
├── server.js             # Server utama dan WhatsApp connection
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose configuration
├── .dockerignore         # Docker ignore rules
├── deploy.sh             # Linux/Mac deployment script
├── deploy.bat            # Windows deployment script
├── public/
│   ├── index.html        # Interface utama
│   └── app.js           # Client-side JavaScript
├── sessions/             # Browser sessions (auto-generated)
└── auth_info_baileys/   # Legacy session folder (auto-generated)
```

## Dependencies

- **@whiskeysockets/baileys**: WhatsApp Web API
- **express**: Web server framework
- **socket.io**: Real-time communication
- **qrcode**: QR Code generator
- **bootstrap**: UI framework

## Catatan Penting

- **Multi-Browser Support**: Setiap browser memiliki session WhatsApp terpisah
- **Session Storage**: Session disimpan berdasarkan browser, bukan project
- **Reset Session**: Gunakan tombol "Reset Session" untuk login dengan akun berbeda
- **Format Nomor**: Format nomor HP bisa dengan atau tanpa kode negara (akan otomatis ditambahkan +62)
- **Delay**: Gunakan delay yang wajar untuk menghindari spam detection
- **Privacy**: Session hanya tersimpan di browser masing-masing

## Development

Untuk development dengan auto-reload:
```bash
npm run dev
```

## Troubleshooting

### General Issues
1. **QR Code tidak muncul**: Restart aplikasi dan refresh browser
2. **Koneksi terputus**: Cek koneksi internet dan restart aplikasi
3. **Pesan tidak terkirim**: Pastikan format nomor HP benar dan nomor aktif

### Docker Issues
1. **Port sudah digunakan**: Ubah port di docker-compose.yml atau stop aplikasi yang menggunakan port 3000
2. **Build gagal**: Pastikan Docker berjalan dan koneksi internet stabil
3. **Container tidak start**: Periksa logs dengan `docker compose logs`
4. **Permission denied**: Pastikan Docker service berjalan

### Session Issues
1. **Login berulang**: Hapus folder `auth_info_baileys` dan login ulang
2. **QR Code expired**: Refresh halaman untuk generate QR baru
3. **Disconnect tidak berfungsi**: Restart container/aplikasi

## License

MIT License
