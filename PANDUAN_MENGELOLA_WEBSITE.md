# 📘 PANDUAN LENGKAP MENGELOLA WEBSITE TRAVEL & TOUR OPERATOR
**Platform Tripbone SaaS — Solusi Manajemen & Sistem Booking Agen Travel Modern**

---

Selamat datang di Panduan Pengelolaan Website Travel & Tour Operator. Dokumen ini dirancang sebagai panduan operasional langkah demi langkah untuk membantu Anda mengkonfigurasi, mengelola konten tour, dan menangani pemesanan (booking) secara efektif.

---

## 📑 DAFTAR ISI
1. [BAGIAN I: INSTALASI & KONFIGURASI AWAL](#bagian-i-instalasi--konfigurasi-awal)
   - [1.1 Pendaftaran, Pemilihan Paket, dan Pembayaran](#11-pendaftaran-pemilihan-paket-dan-pembayaran)
   - [1.2 Pengisian Informasi Dasar & Profil Usaha](#12-pengisian-informasi-dasar--profil-usaha)
   - [1.3 Pengaturan Custom Domain](#13-pengaturan-custom-domain)
     - [Dimana & Bagaimana Membeli Domain](#dimana--bagaimana-membeli-domain)
     - [Langkah Setting DNS di Cloudflare (A Record & CNAME)](#langkah-setting-dns-di-cloudflare)
   - [1.4 Branding: Judul Website, Meta SEO, Logo, & Favicon](#14-branding-judul-website-meta-seo-logo--favicon)
   - [1.5 Setup Kontak, WhatsApp, Email, & Payment Gateway](#15-setup-kontak-whatsapp-email--payment-gateway)
2. [BAGIAN II: MENGELOLA KATALOG TOUR & KONTEN](#bagian-ii-mengelola-katalog-tour--konten)
   - [2.1 Menambahkan Paket Tour Baru Menggunakan AI Generator](#21-menambahkan-paket-tour-baru-menggunakan-ai-generator)
   - [2.2 Membuat Tour Baru dengan Cara Cloning / Duplikasi](#22-membuat-tour-baru-dengan-cara-cloning--duplikasi)
   - [2.3 Struktur Komponen Tour yang Berkualitas](#23-struktur-komponen-tour-yang-berkualitas)
3. [BAGIAN III: MENGELOLA BOOKING & PESANAN](#bagian-iii-mengelola-booking--pesanan)
   - [3.1 Alur Pemesanan (Booking Flow)](#31-alur-pemesanan-booking-flow)
   - [3.2 Langkah-Langkah Memproses & Mengubah Status Booking](#32-langkah-langkah-memproses--mengubah-status-booking)
   - [3.3 Penerbitan Invoice & E-Voucher Pelanggan](#33-penerbitan-invoice--e-voucher-pelanggan)
   - [3.4 Mengatur Kalender Ketersediaan & Kuota Tanggal](#34-mengatur-kalender-ketersediaan--kuota-tanggal)

---

<a name="bagian-i-instalasi--konfigurasi-awal"></a>
## 🚀 BAGIAN I: INSTALASI & KONFIGURASI AWAL

---

### 1.1 Pendaftaran, Pemilihan Paket, dan Pembayaran

Untuk memulai pembuatan website tour operator Anda:

1. **Akses Portal Tripbone SaaS**:
   - Buka alamat portal utama di `https://tripbone.com` (atau domain SaaS resmi).
2. **Klik Tombol "Mulai Sekarang" / "Buat Website Tour"**:
   - Anda akan diarahkan ke form pendaftaran workspace/tenant baru.
3. **Isi Formulir Pendaftaran**:
   - **Nama Usaha / Brand**: Masukkan nama agen travel Anda (contoh: *Smart Bali Tours*).
   - **URL Subdomain (Slug)**: Pilih kata kunci URL website Anda (contoh: `smartbalitours`). Website Anda awal akan aktif di `smartbalitours.tripbone.com`.
   - **Email Admin & Password**: Masukkan alamat email aktif yang akan digunakan untuk login Dashboard Admin.
4. **Pilih Paket Berlangganan**:
   - **Starter**: Cocok untuk agen travel skala kecil/pemula (hingga 10 paket tour).
   - **Pro / Business**: Disarankan untuk tour operator profesional (unlimited tour, custom domain, AI Content Generator, Payment Gateway, & analisis performa).
5. **Proses Pembayaran**:
   - Pilih metode pembayaran (Transfer Bank / QRIS / Kartu Kredit / E-Wallet).
   - Setelah pembayaran terkonfirmasi, sistem secara otomatis akan mengaktifkan website dan membuka akses penuh ke **Dashboard Admin** (`/admin`).

---

### 1.2 Pengisian Informasi Dasar & Profil Usaha

Setelah masuk ke Dashboard Admin untuk pertama kali:

1. Navigasi ke menu **Pengaturan** (Settings) -> **Informasi Umum** (General Settings).
2. Lengkapi formulir profil usaha:
   - **Nama Perusahaan / Company Name**: Nama legal atau nama komersial travel Anda.
   - **Alamat Kantor / Lokasi**: Alamat fisik kantor operasional (ditampilkan di footer website).
   - **Nomor Telepon & Hotline**: Nomor kantor untuk layanan pelanggan.
   - **Mata Uang Utama (Currency)**: Pilih `IDR (Rp)` atau `USD ($)`.
   - **Bahasa Website**: Pilih Bahasa Indonesia, English, atau Multi-bahasa.

---

### 1.3 Pengaturan Custom Domain

Agar website Anda dapat diakses menggunakan domain pribadi (contoh: `www.smartbalitours.com`), ikuti panduan berikut:

#### Dimana & Bagaimana Membeli Domain
Anda bisa membeli nama domain di berbagai penyedia jasa domain (Registrar) populer:
* **Registrar Lokal Indonesia**:
  - [Niagahoster](https://www.niagahoster.co.id)
  - [Rumahweb](https://www.rumahweb.com)
  - [Dewaweb](https://www.dewaweb.com)
* **Registrar Internasional**:
  - [Namecheap](https://www.namecheap.com)
  - [GoDaddy](https://www.godaddy.com)
  - [Cloudflare Registrar](https://www.cloudflare.com)

**Tips Memilih Domain:**
- Gunakan ekstensi `.com` untuk jangkauan luas/wisatawan mancanegara.
- Gunakan ekstensi `.co.id` atau `.id` untuk target wisatawan domestik Indonesia.
- Usahakan nama domain pendek, mudah dieja, dan mencerminkan lokasi atau keunggulan layanan Anda.

---

#### Langkah Setting DNS di Cloudflare

Menggunakan **Cloudflare** sangat direkomendasikan untuk keamanan HTTPS/SSL gratis, kecepatan CDN, dan kemudahan manajemen DNS.

##### Langkah 1: Hubungkan Domain ke Cloudflare
1. Buat akun gratis di [Cloudflare.com](https://www.cloudflare.com).
2. Klik **Add a Site** dan masukkan nama domain Anda (contoh: `smartbalitours.com`).
3. Pilih paket **Free Plan**.
4. Cloudflare akan memberikan 2 alamat **Nameserver** (contoh: `ns1.cloudflare.com` & `ns2.cloudflare.com`).
5. Buka panel kontrol tempat Anda membeli domain (misal: Niagahoster / Rumahweb), masuk ke menu **Name Server / NS Settings**, dan ganti Nameserver default dengan Nameserver dari Cloudflare tersebut.
6. Tunggu proses propagasi DNS (biasanya 15 menit - 2 jam).

##### Langkah 2: Tambahkan Record DNS untuk Tripbone
Setelah domain aktif di Cloudflare, masuk ke menu **DNS** -> **Records** pada dashboard Cloudflare Anda dan tambahkan 2 record berikut:

| Type | Name / Host | Target / Value / IP | TTL | Proxy Status |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` *(atau IP Server Tripbone)* | Auto | **Proxied** (Awan Oranye) |
| **CNAME** | `www` | `cname.tripbone.com` *(atau `@`)* | Auto | **Proxied** (Awan Oranye) |

##### Langkah 3: Masukkan Domain di Dashboard Admin
1. Buka Dashboard Admin Tripbone -> Menu **Settings** -> **General / Domain**.
2. Di kolom **Custom Domain**, ketik nama domain Anda: `smartbalitours.com` (atau `www.smartbalitours.com`).
3. Klik tombol **Simpan & Verifikasi Domain**.
4. Sistem akan otomatis memverifikasi dan menerbitkan Sertifikat SSL (HTTPS) dalam beberapa menit.

---

### 1.4 Branding: Judul Website, Meta SEO, Logo, & Favicon

Optimasi tampilan merek dan mesin pencari (SEO) sangat penting agar website mudah ditemukan di Google.

1. **Mengubah Judul Website (Site Title)**:
   - Masuk ke **Settings** -> **General Settings** -> **SEO & Branding**.
   - **Judul Utama (Site Title)**: Contoh: `Smart Bali Tours - Paket Wisata Bali Terpercaya & Sewa Mobil`.
2. **Pengaturan Meta SEO**:
   - **Meta Description**: Ringkasan singkat website Anda (150-160 karakter).
     *Contoh*: *"Penyedia paket wisata Bali terlengkap, sewa mobil murah, tour Nusa Penida, dan petualangan ATV / Ayunan Bali dengan pelayanan profesional."*
   - **Keywords**: Kata kunci pencarian (dipisahkan koma).
     *Contoh*: `paket tour bali, sewa mobil bali, wisata nusa penida, tour bali murah, paket liburan keluarga`
   - **OG Image (Gambar Share Media Sosial)**: Upload gambar berukuran `1200 x 630 px` yang muncul saat link website Anda dibagikan ke WhatsApp, Facebook, atau Instagram.
3. **Mengunggah Logo & Favicon**:
   - **Logo Utama (Header Light)**: Format PNG transparan (Resolusi disarankan: `300 x 80 px`).
   - **Logo Dark Mode / Footer**: Logo versi terang jika latar belakang footer berwarna gelap.
   - **Favicon**: Ikon kecil yang muncul di tab browser pengguna. Upload gambar persegi format PNG/ICO (Resolusi: `512 x 512 px`).

---

### 1.5 Setup Kontak, WhatsApp, Email, & Payment Gateway

#### 1. Setup WhatsApp Notifikasi & Direct Booking
Hampir 90% wisatawan di Indonesia dan Asia Tenggara lebih menyukai konfirmasi cepat via WhatsApp.

1. Buka **Settings** -> **Integrasi & WhatsApp**.
2. **Nomor WhatsApp Operasional**: Masukkan dengan format internasional tanpa tanda `+` atau angka `0` di depan.
   - *Contoh Benar*: `6281234567890`
   - *Contoh Salah*: `081234567890` atau `+62-812-3456-7890`
3. **Pesan Otomatis WhatsApp (Default Greeting)**:
   - Format contoh:
     ```text
     Halo Smart Bali Tours! Saya ingin bertanya mengenai paket tour {TOUR_NAME} untuk tanggal {DATE}. Mohon informasi ketersediaannya. Terima kasih!
     ```

#### 2. Setup Email Notifikasi
1. Masukkan alamat email admin tempat penerimaan notifikasi booking masuk (misal: `booking@smartbalitours.com`).
2. Tentukan nama pengirim email konfirmasi ke tamu (misal: `Smart Bali Tours Reservations`).

#### 3. Setup Payment Gateway (Pembayaran Otomatis & Manual)
Tripbone mendukung berbagai mode pembayaran fleksibel:

- **Transfer Bank Manual**:
  - Masukkan Nama Bank, Nomor Rekening, dan Atas Nama Pemilik Rekening.
  - Sediakan instruksi upload bukti transfer bagi tamu.
- **Midtrans Payment Gateway (Otomatis IDR - QRIS, GoPay, BCA/Mandiri Virtual Account)**:
  - Buat akun di [Midtrans.com](https://midtrans.com).
  - Dapatkan **Server Key** dan **Client Key** dari Dashboard Midtrans.
  - Tempelkan (*paste*) kedua key tersebut pada menu **Settings** -> **Payment Gateway** -> **Midtrans**.
  - Aktifkan status **Environment: Production**.
- **Stripe / PayPal (Untuk Tamu Internasional / Kartu Kredit / USD)**:
  - Masukkan *Publishable Key* & *Secret Key* dari akun Stripe/PayPal Anda.

---

<a name="bagian-ii-mengelola-katalog-tour--konten"></a>
## 🏞️ BAGIAN II: MENGELOLA KATALOG TOUR & KONTEN

---

### 2.1 Menambahkan Paket Tour Baru Menggunakan AI Generator

Tripbone dilengkapi dengan kecerdasan buatan (AI Content Generator) yang mampu membuat deskripsi tour, itinerary harian, poin fasilitas, hingga estimasi waktu secara otomatis hanya dari satu kalimat instruksi singkat.

#### Langkah Demi Langkah Membuat Tour dengan AI:

1. Buka Dashboard Admin -> Pilih menu **Tours** -> Klik tombol **+ Tambah Tour Baru**.
2. Pilih opsi **"Generate dengan AI"** (Buat Konten Otomatis).
3. Isi kolom **AI Prompt / Instruksi Tour** secara spesifik:
   - Tentukan nama tempat, durasi, target wisatawan, serta aktivitas utama.

#### Contoh Prompt AI yang Sangat Efektif:

> **Contoh Prompt 1 (Paket Tour Harian / Day Tour):**
> *"Buatkan paket tour harian 1 hari di Bali dengan nama 'Nusa Penida West & Snorkeling Adventure'. Durasi 10 jam. Aktivitas meliputi kintamani, Kelingking Beach, Broken Beach, Angel's Billabong, dan Snorkeling di Wall Bay. Sudah termasuk makan siang, tiket fastboat PP, dan mobil ber-AC. Bahasa gaya penulisan menarik, profesional, dan ramah wisatawan asing maupun domestik."*

> **Contoh Prompt 2 (Paket Multi-Hari / 3D2N):**
> *"Buatkan paket wisata 3 Hari 2 Malam di Lombok dengan nama 'Lombok Exotic Gili Trawangan & Sasak Heritage'. Hari 1: Penjemputan airport + Desa Sukarara & Desa Sade. Hari 2: Full day island hopping Gili Trawangan & Snorkeling. Hari 3: Pusat oleh-oleh & transfer airport. Sertakan saran harga untuk paket privat 2-4 orang."*

4. Klik tombol **"Generate Tour Konten"**:
   - Sistem AI akan menyusun:
     - Judul SEO & Ringkasan Menarik (Highlight).
     - Deskripsi Lengkap Tour.
     - Rincian Itinerary Jam demi Jam / Hari demi Hari.
     - Daftar Fasilitas yang Termasuk (*Inclusions*) & Tidak Termasuk (*Exclusions*).
     - Rekomendasi Barang yang Harus Dibawa Tamu.
     - FAQ (Pertanyaan yang Sering Diajukan).
5. Review & Edit:
   - Sesuaikan harga (*Price per Pax / Group Rate*), upload foto galeri utama, lalu klik **Publikasikan Tour**.

---

### 2.2 Membuat Tour Baru dengan Cara Cloning / Duplikasi

Jika Anda ingin membuat paket tour baru yang memiliki kemiripan rute, fasilitas, atau harga dengan paket yang sudah ada (contoh: membedakan antara paket *Standard* dan *VIP Premium*), gunakan fitur **Cloning**.

#### Langkah Demi Langkah Duplikasi Tour:

1. Buka menu **Tours** di Dashboard Admin.
2. Cari tour yang ingin Anda jadikan acuan/template.
3. Pada kolom Aksi (tombol titik tiga `...`), klik opsi **"Clone / Duplikat Tour"**.
4. Sistem akan menduplikasi seluruh data tour tersebut menjadi draft baru bernama *"Copy of [Nama Tour Original]"*.
5. Edit bagian yang diperlukan:
   - Ubah Nama Tour (misal: ubah dari *Kintamani Day Tour* menjadi *Kintamani & ATV Ride Combo Tour*).
   - Tambahkan foto aktivasi baru.
   - Sesuaikan harga (*Pricing*).
   - Tambahkan item aktivitas baru pada Itinerary.
6. Klik **Simpan & Publikasikan**.

---

### 2.3 Struktur Komponen Tour yang Berkualitas

Untuk meningkatkan konversi penjualan (Conversion Rate), pastikan setiap paket tour yang dipublikasikan memenuhi kriteria informasi berikut:

| Komponen Tour | Deskripsi & Praktik Terbaik |
| :--- | :--- |
| **Gambar Utama (Hero Cover)** | Gunakan foto beresolusi tinggi (min `1200 x 800 px`), cerah, tanpa watermark mengganggu. |
| **Harga Transparan** | Tentukan harga per orang (misal: Rp 450.000/pax) atau harga bertingkat berdasarkan kuota (misal: 2 pax @ Rp 600.000, 4 pax @ Rp 450.000). |
| **Itinerary Rinci** | Cantumkan estimasi jam dan lokasi penjemputan/kunjungan secara jelas agar tamu memiliki ekspektasi yang pas. |
| **Inclusions (Sudah Termasuk)** | Sebutkan dengan tegas: Driver Berpengalaman, BBM, Mobil Ber-AC, Tiket Masuk Objek Wisata, Makan Siang, Air Mineral. |
| **Exclusions (Belum Termasuk)** | Sebutkan batas transparan: Pengeluaran Pribadi, Tipping Driver/Guide, Tiket Pesawat. |
| **Titik Penjemputan (Meeting Point)** | Cantumkan area penjemputan gratis (misal: Kuta, Seminyak, Sanur, Ubud Center). |

---

<a name="bagian-iii-mengelola-booking--pesanan"></a>
## 🛒 BAGIAN III: MENGELOLA BOOKING & PESANAN

---

### 3.1 Alur Pemesanan (Booking Flow)

1. **Tamu Memilih Tour**:
   - Pelanggan membuka halaman tour, memilih tanggal perjalanan pada kalender interaktif, memasukkan jumlah peserta (*pax*), dan menambah opsi tambahan (*add-ons* jika ada).
2. **Formulir Data Pemesan**:
   - Tamu mengisikan Nama Lengkap, Email, Nomor WhatsApp, Alamat Hotel/Titik Penjemputan, dan Catatan Khusus.
3. **Pembayaran / Checkout**:
   - Pelanggan memilih metode pembayaran (Transfer Bank / Payment Gateway / Bayar di Tempat / WhatsApp Direct).
4. **Notifikasi Masuk**:
   - Sistem mengirimkan email & notifikasi WhatsApp otomatis ke Admin dan Pelanggan.
   - Data booking tercatat secara otomatis di menu **Dashboard** -> **Bookings**.

---

### 3.2 Langkah-Langkah Memproses & Mengubah Status Booking

Sebagai manajer tour, Anda dapat memantau dan mengubah status pesanan pada tabel **Bookings**:

1. Masuk ke Dashboard Admin -> **Bookings**.
2. Cari pesanan berdasarkan Kode Booking (misal: `BK-8942`), Nama Pelanggan, atau Tanggal Tour.
3. Klik pada baris booking untuk melihat **Detail Pesanan Lengkap**.
4. **Pembaruan Status Booking (Booking Status)**:
   - 🟡 **Pending**: Pemesanan baru masuk, menunggu pembayaran/konfirmasi deposit.
   - 🔵 **Confirmed**: Pembayaran DP / Lunas telah diverifikasi. Jadwal tour telah diamankan.
   - 🟢 **Completed**: Kegiatan tour telah selesai dilaksanakan dengan sukses.
   - 🔴 **Cancelled**: Pemesanan dibatalkan (karena pembatalan tamu atau kendala cuaca).
5. **Pembaruan Status Pembayaran (Payment Status)**:
   - `Unpaid` (Belum Dibayar) -> Ubah ke `Deposit Paid` (DP Diterima) atau `Paid` (Lunas).

---

### 3.3 Penerbitan Invoice & E-Voucher Pelanggan

Setelah status booking diubah menjadi `Confirmed` atau `Paid`:

1. Buka Detail Booking pengguna.
2. Klik tombol **"Cetak Invoice"** atau **"Kirim E-Voucher via WhatsApp/Email"**.
3. Sistem akan menghasilkan dokumen resmi berformat PDF/Web Voucher yang memuat:
   - Logo & Nama Agen Travel Anda.
   - Kode Booking Unik & QR Code Verifikasi.
   - Detail Tanggal Tour, Rincian Peserta, & Lokasi Penjemputan.
   - Status Pembayaran (Lunas / Sisa Pelunasan di Lokasi).
   - Kontak Driver / Customer Service yang bertugas.

---

### 3.4 Mengatur Kalender Ketersediaan & Kuota Tanggal

Untuk menghindari *overbooking* (kelebihan kuota pemesanan pada hari libur puncak):

1. Masuk ke menu **Calendar / Availability** di Dashboard Admin.
2. **Block Dates (Tutup Tanggal)**:
   - Pilih paket tour tertentu dan beri tanda merah pada tanggal di mana operasional tutup (misal: Hari Raya Nyepi / Maintenance Kendaraan).
3. **Atur Max Slot / Seat Limit**:
   - Tentukan batas maksimum peserta per hari (misal: Maksimal 15 orang per hari untuk tour boat). Jika kuota terpenuhi, sistem secara otomatis menonaktifkan pemesanan pada tanggal tersebut di formulir frontend pelanggan.

---

### 💡 RINGKASAN REKOMENDASI OPERASIONAL
1. **Respon Cepat WhatsApp**: Usahakan menjawab pertanyaan tamu kurang dari 15 menit untuk meningkatkan angka konfirmasi booking.
2. **Perbarui Galeri Foto Secara Berkala**: Foto nyata dari tamu yang senang (*happy customers*) meningkatkan kepercayaan calon pembeli hingga 3x lipat.
3. **Pantau Performa SEO**: Periksa posisi kata kunci website Anda secara berkala dan pastikan deskripsi tour diperbarui dengan promo terkini.

---
*Panduan Mengelola Website Tripbone SaaS v2.5 — Hak Cipta & Dokumen Resmi Operasional.*
