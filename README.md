# WhatsApp Blast - Broadcasting Tool

Aplikasi Node.js sederhana untuk WhatsApp broadcasting menggunakan Baileys WhatsApp Web API.

## Fitur

- **QR Code Login**: Login otomatis menggunakan QR Code WhatsApp Web
- **Session Management**: Penyimpanan session lokal untuk login otomatis
- **Disconnect Feature**: Tombol disconnect untuk memutus koneksi WhatsApp
- **Local Storage**: Daftar kontak dan template pesan otomatis tersimpan di browser
- **Broadcasting**: Kirim pesan ke multiple kontak sekaligus
- **Template Variables**: Support variable `{nama}` dan `{nomorhp}` dalam pesan
- **Delay Control**: Pengaturan delay antar pesan
- **Real-time Progress**: Monitor progress broadcasting secara real-time
- **Auto-save**: Data form otomatis tersimpan saat mengetik
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

#### Quick Start dengan Docker Compose
```bash
# Clone repository
git clone <repository-url>
cd WABlast

# Deploy dengan docker-compose
docker-compose up -d

# Atau gunakan script deployment
# Windows:
deploy.bat compose

# Linux/Mac:
chmod +x deploy.sh
./deploy.sh compose
```

#### Manual Docker Build
```bash
# Build image
docker build -t whatsapp-blast .

# Run container
docker run -d \
  --name wa-blast \
  -p 3000:3000 \
  -v ./auth_info_baileys:/app/auth_info_baileys \
  whatsapp-blast
```

#### Docker Commands
```bash
# Menggunakan npm scripts
npm run docker:build     # Build Docker image
npm run docker:compose   # Start with docker-compose
npm run docker:down      # Stop docker-compose
npm run docker:logs      # View logs

# Manual commands
docker-compose up -d      # Start in background
docker-compose down       # Stop and remove containers
docker-compose logs -f    # Follow logs
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

### 5. Device Management
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
├── Dockerfile            # Docker image configuration
├── docker-compose.yml    # Docker Compose configuration
├── .dockerignore         # Docker ignore rules
├── deploy.sh             # Linux/Mac deployment script
├── deploy.bat            # Windows deployment script
├── public/
│   ├── index.html        # Interface utama
│   └── app.js           # Client-side JavaScript
└── auth_info_baileys/   # Folder session WhatsApp (auto-generated)
```

## Dependencies

- **@whiskeysockets/baileys**: WhatsApp Web API
- **express**: Web server framework
- **socket.io**: Real-time communication
- **qrcode**: QR Code generator
- **bootstrap**: UI framework

## Catatan Penting

- Pastikan nomor WhatsApp yang digunakan untuk login aktif
- Format nomor HP bisa dengan atau tanpa kode negara (akan otomatis ditambahkan +62)
- Gunakan delay yang wajar untuk menghindari spam detection
- Session tersimpan di folder `auth_info_baileys/`

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
2. **Permission denied**: Pastikan Docker service berjalan dan user memiliki akses ke Docker
3. **Build gagal**: Cek koneksi internet untuk download dependencies
4. **Container tidak start**: Periksa logs dengan `docker-compose logs`

### Session Issues
1. **Login berulang**: Hapus folder `auth_info_baileys` dan login ulang
2. **QR Code expired**: Refresh halaman untuk generate QR baru
3. **Disconnect tidak berfungsi**: Restart container/aplikasi

## License

MIT License
