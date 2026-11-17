## Aplikasi Evaluasi Level 3 — PIL UP3 Metro

Bertindaklah sebagai Senior Full-Stack Engineer, System Analyst, Database Architect, dan UI/UX Designer. Bangun aplikasi web bernama **Evaluasi Level 3 — PIL UP3 Metro**, yaitu sistem untuk mengelola evaluasi penerapan hasil pembelajaran di lingkungan kerja melalui tiga perspektif penilaian: Peserta, Atasan Langsung, dan Koordinator Eksternal.

Jangan hanya memberikan rancangan, mockup, atau contoh kode. Implementasikan aplikasi secara bertahap pada workspace yang tersedia, jalankan aplikasi, lakukan pengujian, dan perbaiki kesalahan yang ditemukan.

## 1. TUJUAN DAN PRINSIP UTAMA

Aplikasi harus menggantikan proses administrasi Excel dengan sistem digital yang menyediakan:

- Pengelolaan periode evaluasi dan responden.
- Penugasan penilaian oleh administrator.
- Form evaluasi digital berdasarkan workbook asli.
- Pengisian oleh tiga perspektif penilai secara independen.
- Penyimpanan draf dan pemantauan progres.
- Unggah dan pengelolaan dokumen bukti penerapan.
- Penghitungan skor dan analisis hasil.
- Ekspor laporan Excel dan PDF.
- Pengamanan akses berdasarkan peran pengguna.
- Audit log untuk aktivitas penting.

**Aturan mutlak:** jangan mengubah isi instrumen evaluasi yang sudah ada. Pertahankan struktur Excel, 11 indikator, skala penilaian 1–4, pertanyaan validasi, contoh bukti, dan tiga perspektif penilaian.

Aplikasi harus menggunakan data dummy selama pengembangan. Jangan memasukkan data pribadi pegawai sebenarnya atau dokumen internal PLN ke lingkungan pengujian.

## 2. ANALISIS WORKBOOK SEBELUM IMPLEMENTASI

Cari file `Form Evaluasi Level 3.xlsx` pada workspace atau file yang disediakan pengguna.

Sebelum menulis kode:

1. Periksa seluruh sheet, termasuk DAFTAR RESPONDEN, BANK BUTIR, L3 PESERTA, L3 ATASAN, dan L3 KOORDINATOR.
2. Ekstrak teks pertanyaan, indikator, pilihan jawaban, validasi, contoh bukti, petunjuk pengisian, serta struktur penilaian.
3. Identifikasi rumus Excel yang sudah tersedia dan aturan penghitungan skor yang benar-benar tertulis.
4. Catat bagian yang belum memiliki rumus atau aturan yang jelas.
5. Gunakan workbook sebagai sumber utama instrumen.

Jika file tidak tersedia, buat struktur aplikasi terlebih dahulu dan gunakan data placeholder yang diberi label jelas. Jangan mengarang redaksi 11 indikator. Sediakan mekanisme konfigurasi agar isi instrumen dapat dimasukkan setelah workbook tersedia.

Pertahankan tiga kelompok pembelajaran:

- Bagian A: Workshop penurunan susut teknis melalui penyeimbangan beban dengan metode dua titik waktu — 4 indikator.
- Bagian B: Refreshment Penertiban Pemakaian Tenaga Listrik (P2TL) — 4 indikator.
- Bagian C: Perhitungan susut teknis jaringan distribusi menggunakan PSS SINCAL — 3 indikator.

Total: 11 indikator.

Pisahkan data instrumen dari kode antarmuka agar pertanyaan dan contoh bukti dapat dikelola secara konsisten tanpa perlu mengubah komponen form.

## 3. TEKNOLOGI YANG DIGUNAKAN

Gunakan arsitektur full-stack dengan pemisahan frontend, backend, database, dan penyimpanan dokumen.

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Zod untuk validasi
- Library ikon Lucide
- Library grafik yang ringan untuk dashboard
- Library tabel yang mendukung pencarian, filter, dan pagination

### Backend
- Laravel dengan REST API
- PHP versi yang kompatibel dengan versi Laravel yang dipilih
- Laravel migrations, seeders, validation, policies, dan authentication
- API versioning dengan prefix `/api/v1`

### Database
- PostgreSQL
- Relasi foreign key
- Unique constraints dan index pada kolom yang sering dicari
- Transaksi database untuk proses penting
- Soft delete hanya untuk data yang memang membutuhkan pemulihan

### Penyimpanan dokumen
- Local private storage untuk pengembangan
- File tidak boleh disimpan di direktori publik.
- Buat abstraction layer agar penyimpanan dapat dipindahkan ke object storage privat yang disetujui organisasi.
- Jangan mengunci aplikasi pada layanan cloud publik tertentu.

### Pengujian dan pengembangan
- Vitest untuk unit test frontend
- Laravel automated tests untuk API dan aturan bisnis
- Gunakan environment variables untuk konfigurasi
- Sediakan `.env.example` tanpa kredensial asli
- Sediakan dokumentasi instalasi dan menjalankan aplikasi secara lokal

Jangan menggunakan Firebase atau Supabase sebagai backend utama pada rancangan ini. Gunakan Laravel dan PostgreSQL agar arsitektur backend, penyimpanan, dan aturan akses dapat dikendalikan secara eksplisit.

## 4. DESAIN UI/UX

Buat desain yang formal, profesional, minimalis, dan sesuai dengan aplikasi bisnis internal BUMN.

### Palet warna
- Primary cyan: `#23C4DB`
- Putih: `#FFFFFF`
- Teks utama: `#172B3A`
- Latar sekunder: `#F5F7F9`
- Border: `#E2E8F0`
- Success, warning, dan error menggunakan warna semantik yang tidak berlebihan.

### Prinsip desain
- Gunakan tipografi profesional seperti Inter.
- Gunakan sidebar tetap, topbar ringkas, breadcrumb, dan hierarki halaman yang jelas.
- Gunakan tabel untuk data operasional yang padat.
- Gunakan kartu KPI seperlunya.
- Gunakan radius moderat, border tipis, dan bayangan yang sangat ringan.
- Hindari gradien berlebihan, glassmorphism, animasi dekoratif, ilustrasi yang tidak relevan, dan tampilan dashboard generik.
- Gunakan ikon konsisten dan hindari emoji pada antarmuka.
- Pastikan tampilan responsif pada desktop, tablet, dan ponsel.
- Seluruh teks antarmuka menggunakan Bahasa Indonesia yang formal dan jelas.

Jangan membuat setiap bagian menjadi kartu terpisah. Prioritaskan keterbacaan, efisiensi kerja, dan konsistensi.

## 5. ROLE DAN HAK AKSES

Buat empat role sistem.

### A. Administrator
Memiliki akses untuk:
- Dashboard administrator.
- Manajemen periode evaluasi.
- Manajemen peserta dan unit kerja.
- Import Excel.
- Penugasan penilai.
- Pemantauan progres.
- Hasil evaluasi dan laporan.
- Pengaturan akun dan konfigurasi.
- Audit log.
- Mekanisme koreksi atau pembukaan kembali penilaian.

Administrator merupakan pengelola sistem, bukan penilai tambahan.

### B. Peserta
Dapat:
- Melihat evaluasi yang ditugaskan kepada dirinya.
- Mengisi L3 PESERTA.
- Menyimpan draf.
- Mengunggah bukti penerapan.
- Mengirimkan penilaian.
- Melihat status dan riwayat pengisian miliknya.

### C. Atasan Langsung
Dapat:
- Melihat peserta yang ditugaskan kepadanya.
- Mengisi L3 ATASAN.
- Memberikan skor berdasarkan pengamatan.
- Menambahkan keterangan dan bukti jika diizinkan oleh instrumen.
- Menyelesaikan penilaian yang menjadi tanggung jawabnya.

### D. Koordinator Eksternal
Dapat:
- Melihat peserta yang ditugaskan kepadanya.
- Mengisi L3 KOORDINATOR.
- Memberikan skor berdasarkan pengamatan dan bukti yang tersedia.
- Melihat progres penugasan miliknya.

Implementasikan role-based access control pada backend. Jangan hanya menyembunyikan menu di frontend. Setiap endpoint wajib memverifikasi autentikasi, role, dan kepemilikan atau penugasan data.

Gunakan autentikasi lokal untuk pengembangan. Rancang agar integrasi SSO/LDAP atau identity provider internal dapat ditambahkan setelah persetujuan TI. Jangan mengklaim telah terintegrasi dengan sistem autentikasi PLN.

## 6. MODUL DAN HALAMAN APLIKASI

### Modul 1 — Login

Buat halaman login formal dengan:
- Nama aplikasi.
- Input username/email.
- Input password.
- Tombol masuk.
- Validasi input.
- Pesan kesalahan yang jelas.
- Logout dan mekanisme sesi yang aman.

Untuk demo, sediakan akun dummy setiap role melalui seeder. Jangan membuat tombol role switcher sebagai pengganti autentikasi.

### Modul 2 — Dashboard Administrator

Tampilkan:
- Total peserta.
- Jumlah penilaian selesai.
- Jumlah penilaian sedang dikerjakan.
- Jumlah penilaian belum dimulai.
- Jumlah penilaian yang perlu ditindaklanjuti.
- Progres pengisian berdasarkan periode.
- Progres per bagian pembelajaran.
- Tabel peserta terbaru atau penugasan yang belum selesai.

Sediakan filter periode, unit kerja, bagian pembelajaran, dan status.

Semua angka dan grafik harus berasal dari data database, bukan angka statis yang ditulis langsung dalam komponen.

### Modul 3 — Periode Evaluasi

Fitur:
- Membuat periode evaluasi.
- Melihat detail periode.
- Mengubah jadwal sebelum periode berjalan sesuai aturan.
- Mengaktifkan dan menutup periode.
- Melihat jumlah peserta dan progres.
- Mencegah perubahan instrumen pada periode yang sudah berjalan tanpa prosedur revisi yang tercatat.

Status periode minimal: Draft, Aktif, dan Ditutup.

### Modul 4 — Data Responden

Buat tabel dengan kolom:
- Identitas peserta.
- Nama.
- Unit kerja.
- Jabatan.
- Bagian pembelajaran yang relevan.
- Atasan langsung.
- Koordinator eksternal.
- Status data.
- Aksi detail.

Sediakan pencarian, filter, pagination, tambah/edit data, serta impor Excel.

#### Proses import Excel
1. Pilih file.
2. Validasi format dan ukuran.
3. Baca dan petakan kolom.
4. Tampilkan preview.
5. Tandai baris yang valid dan bermasalah.
6. Tampilkan alasan kesalahan.
7. Minta konfirmasi sebelum menyimpan.
8. Tampilkan ringkasan hasil impor.

Gunakan library parsing Excel yang sesuai. Jangan langsung memasukkan semua baris tanpa validasi. Cegah duplikasi berdasarkan identitas unik yang telah ditetapkan.

Jangan menggunakan nomor identitas sensitif sebagai kunci utama tanpa alasan yang sah.

### Modul 5 — Penugasan Penilai

Administrator menetapkan penilaian untuk setiap peserta.

Setiap peserta memiliki tiga jenis tugas:
1. Penilaian peserta.
2. Penilaian atasan langsung.
3. Penilaian koordinator eksternal.

Satu penugasan harus terhubung dengan periode, peserta, penilai, dan ruang lingkup bagian pembelajaran yang relevan.

Fitur:
- Membuat dan mengubah penugasan.
- Memeriksa atasan dan koordinator yang belum ditentukan.
- Menampilkan status masing-masing penilai.
- Mencegah penugasan ganda yang tidak disengaja.
- Menampilkan konfirmasi sebelum menerbitkan penugasan.
- Menampilkan daftar penugasan yang belum selesai.

Penugasan hanya dibuat dan dikelola administrator. Peserta dan penilai tidak dapat memilih sendiri penugasan yang menjadi tanggung jawab mereka.

### Modul 6 — Form Evaluasi

Implementasikan tiga form:
- L3 PESERTA.
- L3 ATASAN.
- L3 KOORDINATOR.

Pertahankan struktur dan urutan workbook asli.

#### Tahap 1: Identitas
Tampilkan informasi periode, peserta, unit kerja, penilai, dan bagian pembelajaran yang ditugaskan. Identitas yang sudah ditentukan administrator ditampilkan otomatis.

#### Tahap 2: Validasi awal
Tampilkan pertanyaan validasi sesuai workbook asli, termasuk pertanyaan mengenai:
- Kesesuaian jabatan.
- Kesesuaian unit kerja.
- Ketersediaan fasilitas pendukung.

Ikuti instruksi asli ketika terdapat jawaban “Tidak”. Jangan otomatis memberikan skor 1. Catat hasil validasi dan status penanganannya secara terpisah.

#### Tahap 3: Bagian pembelajaran
Tampilkan hanya bagian yang relevan dengan penugasan:
- Bagian A: 4 indikator.
- Bagian B: 4 indikator.
- Bagian C: 3 indikator.

Pertahankan redaksi indikator dan contoh bukti dari workbook.

#### Tahap 4: Penilaian perilaku
Setiap indikator menampilkan:
- Pernyataan indikator.
- Skala 1, 2, 3, dan 4.
- Label skala persis sesuai workbook.
- Keterangan atau bukti penerapan jika disediakan instrumen.

Jangan mengubah skala menjadi 1–5 atau mengganti label tanpa persetujuan.

#### Tahap 5: Bukti penerapan
Sediakan unggah dokumen dengan:
- Nama file.
- Tipe file.
- Ukuran file.
- Status unggah.
- Tombol hapus sebelum pengiriman.
- Tombol lihat/unduh sesuai izin.
- Pesan kesalahan jika unggah gagal.

Batasi file berdasarkan tipe dan ukuran yang dikonfigurasi. Periksa MIME type aktual, gunakan nama file yang aman, dan simpan file di private storage. Jangan membuat URL publik permanen.

Jenis file yang diizinkan dan batas ukuran harus dikonfigurasi secara eksplisit. Gunakan daftar format dokumen yang disetujui administrator, misalnya PDF, XLSX, XLS, DOCX, PNG, dan JPG jika diizinkan.

Dokumen yang diunggah harus dikaitkan dengan penilaian atau indikator yang tepat.

#### Tahap 6: Penyimpanan dan pengiriman
Sediakan:
- Simpan Draf.
- Kembali.
- Selanjutnya.
- Tinjau Jawaban.
- Kirim Penilaian.

Implementasikan autosave dengan penanganan kegagalan jaringan dan indikator status penyimpanan.

Sebelum pengiriman, tampilkan ringkasan jawaban dan konfirmasi. Setelah pengiriman berhasil, kunci pengeditan biasa. Koreksi harus melalui mekanisme pembukaan kembali oleh administrator dengan alasan dan audit log.

Jangan mengirim jawaban otomatis hanya karena seluruh kolom sudah terisi.

### Modul 7 — Dashboard Penilai

Buat dashboard berbeda sesuai role.

Untuk peserta, tampilkan evaluasi miliknya.

Untuk atasan dan koordinator, tampilkan daftar peserta yang menjadi tanggung jawab masing-masing.

Setiap baris menampilkan:
- Nama peserta.
- Periode evaluasi.
- Bagian pembelajaran.
- Status penilaian.
- Tenggat jika ditetapkan.
- Tombol lanjutkan atau lihat hasil sesuai izin.

Penilai tidak boleh melihat skor penilai lain sebelum ada kebijakan eksplisit yang mengizinkannya.

### Modul 8 — Pemantauan Progres

Tampilkan progres pada tiga tingkat:
- Keseluruhan periode.
- Setiap peserta.
- Setiap jenis penilaian.

Status tugas:
- Belum Dimulai.
- Sedang Dikerjakan.
- Selesai.
- Perlu Tindak Lanjut.

Bedakan status tugas, status validasi, dan status pengiriman. Jangan menganggap jawaban “Tidak” pada validasi sebagai skor rendah.

Tampilkan filter, ringkasan, tabel, dan detail progres.

### Modul 9 — Hasil Evaluasi

Tampilkan:
- Rata-rata skor per bagian.
- Skor per peserta.
- Skor per unit kerja.
- Skor dari perspektif peserta.
- Skor dari perspektif atasan.
- Skor dari perspektif koordinator.
- Perbandingan skor antarperspektif.
- Jumlah respons valid dan tidak lengkap.
- Status bukti penerapan.

Rumus agregasi harus mengikuti workbook jika rumusnya tersedia dan dapat diverifikasi. Jika metode agregasi tidak ditentukan secara jelas, jangan mengarang bobot. Tandai konfigurasi sebagai belum ditetapkan dan dokumentasikan keputusan yang diperlukan.

Jangan memperlakukan:
- Data kosong sebagai nol.
- Bagian tidak relevan sebagai skor nol.
- Validasi yang tidak terpenuhi sebagai skor 1.
- Skor rata-rata sebagai bukti langsung penurunan susut distribusi.

Semua grafik harus bersumber dari data yang sudah tersimpan.

### Modul 10 — Laporan

Sediakan:
- Laporan progres.
- Laporan penilaian per peserta.
- Laporan per bagian pembelajaran.
- Laporan per unit.
- Laporan per perspektif penilai.
- Ringkasan bukti penerapan.
- Ekspor Excel.
- Ekspor PDF.

Laporan harus menyertakan periode, tanggal pembuatan, jumlah respons valid, jumlah data yang belum tersedia, serta keterangan metode penghitungan skor.

Pastikan hasil ekspor konsisten dengan data yang ditampilkan di aplikasi. Terapkan pemeriksaan hak akses sebelum pengguna mengekspor data.

### Modul 11 — Pengaturan dan Audit Log

Pengaturan meliputi:
- Pengguna dan role.
- Unit kerja.
- Periode.
- Konfigurasi batas unggah.
- Status akun.
- Pengaturan instrumen yang tidak mengubah konten secara diam-diam.

Audit log harus mencatat aktivitas penting, termasuk:
- Login dan logout yang relevan.
- Pembuatan atau perubahan penugasan.
- Pengunggahan dan penghapusan bukti.
- Pengiriman penilaian.
- Pembukaan kembali penilaian.
- Perubahan administrasi.
- Ekspor laporan yang relevan.

Catat pengguna, waktu, tindakan, objek terkait, dan alasan apabila diperlukan. Jangan menyimpan password, token, atau isi dokumen sensitif di dalam log.

## 7. RANCANGAN DATABASE

Buat migrations dan model dengan relasi yang benar.

Entitas minimal:
- users
- roles
- user_roles atau relasi role yang setara
- organizational_units
- evaluation_periods
- participants
- learning_modules
- indicators
- evaluation_assignments
- validation_responses
- evaluation_responses
- evidence_documents
- audit_logs

Tambahkan kolom standar seperti ID, created_at, updated_at, serta kolom status yang relevan.

### Aturan database
- Gunakan foreign key.
- Buat indeks untuk pencarian peserta, periode, penilai, dan status.
- Cegah duplikasi penugasan yang tidak disengaja.
- Pisahkan identitas peserta dari data jawaban.
- Simpan skor setiap penilai secara terpisah.
- Simpan metadata dokumen terpisah dari file fisiknya.
- Gunakan transaksi saat membuat penugasan atau mengirim penilaian.
- Gunakan kebijakan penghapusan yang konsisten.
- Jangan menyimpan file biner dalam kolom database.
- Gunakan enum atau constraint yang sesuai untuk status dan rentang skor.

Satu penugasan harus memiliki identitas penilai, peserta, periode, tipe penilaian, dan cakupan bagian yang jelas.

## 8. API BACKEND

Buat REST API yang konsisten, memiliki validasi, autentikasi, dan otorisasi.

Kelompok endpoint minimal:
- `/api/v1/auth`
- `/api/v1/dashboard`
- `/api/v1/evaluation-periods`
- `/api/v1/participants`
- `/api/v1/learning-modules`
- `/api/v1/indicators`
- `/api/v1/assignments`
- `/api/v1/evaluations`
- `/api/v1/evidence`
- `/api/v1/reports`
- `/api/v1/users`
- `/api/v1/audit-logs`

Gunakan pola respons yang konsisten, status HTTP yang benar, pagination, dan pesan validasi yang jelas.

Jangan mempercayai user ID, role, participant ID, atau assignment ID dari frontend tanpa memverifikasinya di backend.

Jangan membuat satu endpoint generik yang dapat mengakses seluruh data tanpa pemeriksaan izin.

## 9. STATUS DAN ATURAN BISNIS

Pisahkan status periode, penugasan, pengisian, dan validasi.

Contoh status periode:
- Draft
- Aktif
- Ditutup

Contoh status penugasan:
- Belum Dimulai
- Sedang Dikerjakan
- Selesai
- Perlu Tindak Lanjut

Status validasi disimpan terpisah dari status pengisian.

Aturan:
1. Hanya penugasan yang sah yang dapat diisi oleh pengguna.
2. Penilai hanya dapat mengubah penilaiannya sendiri.
3. Skor hanya menerima nilai 1–4.
4. Indikator yang tidak relevan tidak boleh dihitung sebagai nol.
5. Draf tidak dihitung sebagai penilaian selesai.
6. Pengiriman harus divalidasi di backend.
7. Penilaian terkirim tidak dapat diedit secara biasa.
8. Pembukaan kembali wajib memiliki alasan dan audit log.
9. Penghapusan bukti tidak boleh merusak riwayat yang sudah dikirim.
10. Administrator tidak boleh mengubah skor secara diam-diam.

Jika ditemukan kondisi yang belum diatur workbook, buat keputusan teknis seminimal mungkin, dokumentasikan, dan jangan mengubah instrumen.

## 10. KEAMANAN

Implementasikan:
- Autentikasi dengan hash password yang aman.
- Validasi dan otorisasi backend.
- Perlindungan terhadap akses data lintas pengguna.
- Validasi file dan batas ukuran unggah.
- Private storage.
- Proteksi CSRF atau mekanisme yang sesuai dengan strategi autentikasi.
- Rate limiting pada endpoint autentikasi.
- Sanitasi nama file dan input.
- Penanganan error tanpa membocorkan stack trace ke pengguna.
- Pengelolaan session/token yang aman.
- Environment variables.
- Audit log.
- Backup dan pemulihan yang dapat diuji.

Jangan menggunakan kredensial hardcoded, menonaktifkan autentikasi untuk mempermudah demo, atau menaruh secret pada frontend.

Aplikasi ini ditujukan untuk prototype yang dapat diuji secara lokal. Jangan melakukan deployment ke infrastruktur PLN atau menyimpan data PLN yang sebenarnya tanpa persetujuan dan pemeriksaan keamanan organisasi.

## 11. DATA DUMMY DAN SEEDER

Buat seeder untuk:
- Satu administrator.
- Beberapa peserta fiktif.
- Beberapa atasan langsung.
- Beberapa koordinator eksternal.
- Satu periode evaluasi contoh.
- Tiga kelompok pembelajaran.
- Sebelas indikator jika konten workbook tersedia.
- Penugasan dengan status yang beragam.
- Data evaluasi dummy.
- Metadata dokumen dummy tanpa file internal.

Sediakan kredensial demo melalui dokumentasi pengembangan. Gunakan password demo yang dibuat khusus untuk lingkungan lokal dan wajib diganti sebelum penggunaan nyata.

Jangan menggunakan identitas atau kredensial pegawai sungguhan.

## 12. PENGUJIAN WAJIB

Buat dan jalankan pengujian berikut.

### Fungsional
- Login dan logout.
- Navigasi setiap role.
- CRUD periode dan peserta.
- Import Excel dan penanganan data invalid.
- Penugasan tiga perspektif.
- Pengisian draf dan pengiriman.
- Validasi awal.
- Validasi skor 1–4.
- Unggah dan akses dokumen.
- Pemantauan progres.
- Penghitungan skor.
- Ekspor laporan.

### Keamanan
- Peserta tidak dapat melihat data peserta lain.
- Atasan hanya dapat mengakses penugasan yang menjadi tanggung jawabnya.
- Koordinator hanya dapat mengakses penugasan yang diberikan kepadanya.
- Pengguna tidak dapat mengubah role melalui request frontend.
- File tidak dapat diakses tanpa otorisasi.
- Penilaian terkirim tidak dapat diubah tanpa mekanisme pembukaan kembali.
- Endpoint sensitif menolak permintaan tanpa autentikasi.

### Konsistensi data
- Skor kosong tidak dihitung sebagai nol.
- Penugasan ganda ditangani dengan benar.
- Draf tidak dihitung sebagai selesai.
- Data pada dashboard sesuai dengan database.
- Ekspor sesuai dengan hasil di halaman.
- Penilaian dari ketiga perspektif tidak saling menimpa.

Perbaiki seluruh kegagalan pengujian yang dapat direproduksi sebelum menyatakan implementasi selesai.

## 13. TAHAPAN PENGERJAAN

Kerjakan secara berurutan dan jangan membangun seluruh sistem sebagai satu komponen besar.

### Tahap 1 — Analisis dan fondasi
- Periksa workspace.
- Analisis workbook.
- Tentukan struktur direktori.
- Siapkan frontend, backend, database, dan konfigurasi.
- Buat dokumentasi keputusan teknis.

### Tahap 2 — Database dan autentikasi
- Buat migrations.
- Buat model dan relasi.
- Implementasikan login dan otorisasi.
- Buat seeder akun demo.
- Uji akses setiap role.

### Tahap 3 — UI dan dashboard
- Implementasikan design system.
- Buat sidebar dan topbar.
- Buat dashboard sesuai role.
- Implementasikan halaman periode, responden, dan penugasan.

### Tahap 4 — Form evaluasi
- Implementasikan 11 indikator berdasarkan workbook.
- Buat validasi awal.
- Buat skala 1–4.
- Implementasikan draf, autosave, dan pengiriman.
- Uji ketiga perspektif secara independen.

### Tahap 5 — Dokumen dan progres
- Implementasikan unggah dokumen.
- Terapkan private storage.
- Buat status penugasan.
- Buat dashboard progres.

### Tahap 6 — Analitik dan laporan
- Implementasikan agregasi yang telah ditetapkan.
- Buat grafik dan tabel.
- Buat ekspor Excel/PDF.
- Uji konsistensi hasil.

### Tahap 7 — Verifikasi akhir
- Jalankan seluruh automated tests.
- Jalankan frontend dan backend.
- Periksa error build dan runtime.
- Uji navigasi dan responsivitas.
- Perbaiki masalah yang ditemukan.
- Dokumentasikan hal yang sudah berjalan dan yang masih memerlukan konfigurasi.

## 14. STRUKTUR PROYEK DAN DOKUMENTASI

Gunakan struktur monorepo yang jelas, misalnya:

- `frontend/` — aplikasi React.
- `backend/` — aplikasi Laravel.
- `docs/` — dokumentasi sistem dan keputusan teknis.
- `.gitignore`
- `README.md`

Buat dokumentasi:
- Prasyarat instalasi.
- Konfigurasi environment.
- Cara menjalankan PostgreSQL.
- Cara menjalankan backend.
- Cara menjalankan frontend.
- Cara menjalankan migrations dan seeders.
- Akun demo lokal.
- Cara menjalankan pengujian.
- Penjelasan arsitektur.
- Struktur database.
- Daftar endpoint API.
- Catatan keamanan.
- Daftar fitur yang sudah selesai dan belum selesai.

Jangan menaruh secret atau file `.env` asli di repositori.

## 15. KRITERIA PENYELESAIAN

Implementasi dinyatakan selesai apabila:

- Aplikasi dapat dijalankan secara lokal.
- Frontend terhubung ke backend.
- Database dan migrations berjalan.
- Login dan hak akses berfungsi.
- Seluruh halaman utama terhubung melalui navigasi.
- Administrator dapat mengelola peserta dan penugasan.
- Tiga perspektif penilaian dapat mengisi form secara independen.
- Bukti penerapan dapat diunggah ke private storage lokal.
- Progres dan laporan dihitung dari data aktual.
- Validasi dan aturan bisnis berfungsi.
- Pengujian penting berhasil.
- Dokumentasi instalasi tersedia.
- Tidak ada tombol utama yang hanya menjadi dekorasi.
- Tidak ada data sensitif atau kredensial produksi dalam kode.

## INSTRUKSI PENUTUP

Mulai dengan memeriksa workspace dan workbook, kemudian implementasikan sistem secara bertahap. Jangan berhenti setelah membuat UI. Pastikan frontend, backend, dan database terintegrasi.

Utamakan akurasi instrumen, keamanan akses, dan alur bisnis yang konsisten daripada dekorasi visual.

Jika ada informasi yang belum tersedia, jangan mengarang data. Gunakan placeholder yang jelas, dokumentasikan asumsi, dan lanjutkan bagian yang dapat dikerjakan secara aman.

Pada akhir pengerjaan, berikan ringkasan fitur yang selesai, struktur teknologi, cara menjalankan aplikasi, hasil pengujian, dan daftar konfigurasi yang masih diperlukan sebelum aplikasi dapat digunakan di lingkungan internal organisasi.