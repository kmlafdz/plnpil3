# PROMPT ANTIGRAVITY — PENGEMBANGAN MODUL MANAJEMEN USER
## Evaluasi Level 3 — PLN Impact Lab (PIL)

### 1. Tujuan Pengembangan

Kembangkan dan sesuaikan modul Manajemen User pada aplikasi Evaluasi Level 3 — PLN Impact Lab (PIL) agar mendukung pengelolaan user berdasarkan struktur UPDL, unit, program pelatihan, dan periode evaluasi.

Sistem harus memudahkan Admin Pusat untuk mengelola banyak user, mengimpor data dari Excel, menentukan peserta evaluasi, menghubungkan atasan dan koordinator, serta mengatur formulir evaluasi tanpa pengulangan input yang tidak diperlukan.

**Instruksi utama:**
- Lakukan audit terhadap aplikasi yang sudah ada sebelum mengubah kode.
- Pertahankan framework, bahasa pemrograman, database, autentikasi, routing, komponen UI, dan desain yang sudah digunakan.
- Gunakan kembali fitur dan komponen yang telah tersedia.
- Jangan membuat ulang aplikasi dari awal.
- Jangan menghapus atau merusak data, formulir, maupun hasil evaluasi yang sudah ada.
- Fokus pada Manajemen User dan integrasi langsung yang diperlukan dengan program, periode, penugasan, serta formulir evaluasi.

---

### 2. Audit Sistem Sebelum Implementasi

Periksa terlebih dahulu:

1. Struktur database user, UPDL, unit, program, periode evaluasi, Bank Butir, dan formulir.
2. Halaman dashboard dan mekanisme filter data yang sudah ada.
3. Format file Excel, terutama sheet `DAFTAR RESPONDEN`.
4. Kolom identitas user dan cara sistem mengidentifikasi user yang sudah terdaftar.
5. Hubungan peserta dengan atasan dan koordinator dalam struktur data saat ini.
6. Mekanisme autentikasi dan pengaturan hak akses.
7. Hubungan program dengan Bank Butir per program.
8. Hubungan periode evaluasi dengan formulir dan hasil evaluasi.
9. Fitur impor Excel atau pengelolaan user yang sudah tersedia.

Jangan membuat asumsi mengenai kolom Excel yang belum diperiksa. Pertahankan header, struktur, dan aturan data dari file sumber sejauh masih relevan. Jika ditemukan ketidaksesuaian, jelaskan terlebih dahulu dalam laporan audit dan lakukan penyesuaian yang aman.

Setelah audit, implementasikan perubahan secara bertahap dan uji setiap integrasi yang terdampak.

---

### 3. Struktur Organisasi dan Data User

Sistem menggunakan pengelolaan terpusat.

#### A. Admin Pusat
Admin Pusat memiliki kewenangan sesuai kebijakan sistem untuk:
- Mengelola seluruh UPDL dan unit.
- Mengelola master user.
- Mengelola program dan periode evaluasi.
- Menetapkan peserta evaluasi.
- Mengatur penugasan atasan dan koordinator.
- Mengelola konfigurasi formulir dan memantau proses evaluasi.

#### B. Struktur UPDL dan Unit
Terapkan relasi berikut:

- Satu UPDL dapat memiliki banyak unit.
- Satu unit berada di bawah satu UPDL.
- Setiap user internal terhubung dengan tepat satu UPDL dan satu unit.
- Unit yang dipilih harus merupakan unit dari UPDL yang dipilih.
- Setiap user hanya dibuat satu kali dalam master user meskipun mengikuti beberapa program atau periode evaluasi.

Koordinator eksternal menjadi pengecualian karena tidak wajib terhubung dengan UPDL dan unit internal.

#### C. Master User
Pisahkan data identitas user dari data keikutsertaan dalam evaluasi.

Master user menyimpan informasi identitas dan organisasi yang memang tersedia pada sistem, misalnya:
- Nama lengkap.
- NIP atau ID pegawai, jika tersedia.
- Email.
- Username, jika digunakan.
- Jabatan, jika tersedia.
- UPDL.
- Unit.
- Status akun.
- Informasi lain yang memang terdapat pada format Excel atau dibutuhkan sistem.

Jangan mengarang kolom wajib yang tidak terdapat dalam sumber data. Tentukan kolom wajib berdasarkan struktur Excel asli dan kebutuhan aplikasi.

---

### 4. Role Akun dan Peran Evaluasi

Sistem harus membedakan role akun dengan peran seseorang dalam suatu penugasan evaluasi.

#### Role akun yang didukung
1. Admin Pusat.
2. Peserta.
3. Atasan Langsung.
4. Koordinator Internal.
5. Koordinator Eksternal.

Role tersebut harus disesuaikan dengan mekanisme otorisasi yang telah digunakan. Jangan mengganti sistem autentikasi yang sudah berjalan tanpa alasan teknis yang kuat.

#### Ketentuan akses

**Admin Pusat**
- Mengelola user dan konfigurasi sesuai kewenangannya.
- Melihat data berdasarkan filter UPDL, program, dan periode.
- Mengelola penugasan evaluasi.

**Peserta**
- Mengakses formulir yang ditugaskan kepadanya.
- Tidak dapat mengakses formulir atau hasil evaluasi milik peserta lain tanpa kewenangan.

**Atasan Langsung**
- Mengisi evaluasi untuk peserta yang ditugaskan kepadanya.
- Tidak otomatis memperoleh akses ke seluruh peserta dalam satu UPDL.

**Koordinator Internal**
- Berasal dari master user internal.
- Dapat ditetapkan sebagai koordinator program.
- Hanya dapat mengakses data evaluasi sesuai penugasannya.

**Koordinator Eksternal**
- Dapat ditambahkan tanpa UPDL dan unit internal.
- Memiliki identitas serta informasi kontak yang diperlukan.
- Hanya dapat mengakses formulir dan penugasan yang diberikan kepadanya.
- Tidak memperoleh akses ke dashboard Admin Pusat atau seluruh data organisasi.

Jika seseorang dapat menjalankan peran yang berbeda pada program yang berbeda, jangan memaksakan seluruh peran tersebut menjadi satu role global yang membatasi fleksibilitas. Pisahkan role akun dari peran evaluasi jika diperlukan oleh struktur sistem.

---

### 5. Dashboard dengan Filter Konteks Data

Sesuaikan dashboard agar Admin Pusat dapat menentukan cakupan data yang ingin ditampilkan melalui filter:

1. UPDL.
2. Program.
3. Periode evaluasi berdasarkan tanggal.
4. Unit, apabila relevan dengan cakupan UPDL yang dipilih.

Filter harus diterapkan pada data dashboard, daftar user, peserta, penugasan, serta ringkasan evaluasi yang relevan.

#### A. Filter UPDL

**Jika satu UPDL dipilih:**
- Dashboard menampilkan data UPDL tersebut.
- Daftar user dan peserta mengikuti UPDL yang dipilih.
- Form tambah user otomatis menggunakan UPDL tersebut.
- Admin tidak perlu memilih UPDL kembali ketika menambahkan user.
- Pilihan unit dibatasi pada unit milik UPDL tersebut.

**Jika Semua UPDL dipilih:**
- Dashboard menampilkan data dari seluruh UPDL yang berada dalam kewenangan Admin Pusat.
- Form tambah user wajib menyediakan pemilihan UPDL.
- Setelah UPDL dipilih, sistem hanya menampilkan unit milik UPDL tersebut.
- Filter unit dapat digunakan untuk mempersempit data lintas UPDL sesuai kebutuhan.

Jangan mengunci dashboard pada satu UPDL tertentu. Nilai default harus mengikuti aturan aplikasi yang sudah ada; apabila tidak ada aturan, gunakan cakupan Semua UPDL untuk Admin Pusat dengan filter yang jelas.

#### B. Filter Program

- Admin dapat memilih satu program atau semua program.
- Program yang tersedia berasal dari data master program.
- Filter program harus memengaruhi daftar peserta dan penugasan yang ditampilkan.
- Data program yang tidak sesuai dengan cakupan atau kewenangan pengguna tidak boleh ditampilkan.

#### C. Filter Periode Evaluasi

- Periode ditampilkan berdasarkan tanggal mulai dan tanggal selesai, bukan hanya nomor periode.
- Ketika satu program dipilih, daftar periode hanya menampilkan periode milik program tersebut.
- Jika semua program dipilih, tampilkan periode yang relevan terhadap cakupan data atau minta admin mempersempit pilihan bila diperlukan.
- Perubahan program harus memperbarui pilihan periode dan membersihkan periode lama jika tidak lagi sesuai.

Filter UPDL, program, dan periode merupakan konteks tampilan data, bukan pengganti validasi hak akses pada backend.

---

### 6. Manajemen User dengan Input Manual dan Excel

Sediakan dua metode pengelolaan user.

#### A. Input Manual
Admin dapat menambahkan user melalui form yang menampilkan field sesuai kebutuhan dan role.

Perilaku form:
- Jika konteks dashboard hanya satu UPDL, UPDL otomatis terisi.
- Jika konteks dashboard Semua UPDL, Admin harus memilih UPDL.
- Unit mengikuti UPDL yang dipilih.
- Jika UPDL berubah, pilihan unit sebelumnya harus dikosongkan dan admin memilih unit yang sesuai.
- Koordinator eksternal tidak diwajibkan mengisi UPDL dan unit.
- Sistem memvalidasi data sebelum disimpan.

Gunakan mekanisme password, undangan, aktivasi, dan pemulihan akun yang sudah tersedia. Jangan menyimpan password dalam bentuk teks biasa atau membuat autentikasi baru yang bertentangan dengan sistem lama.

#### B. Impor Excel
Sediakan fitur impor Excel yang kompatibel dengan format sumber, terutama sheet `DAFTAR RESPONDEN`.

Alur impor:
1. Admin menentukan cakupan UPDL atau memilih Semua UPDL.
2. Admin mengunduh template Excel yang sesuai dengan format sistem.
3. Admin mengunggah file.
4. Sistem membaca header dan memvalidasi struktur sheet.
5. Sistem menampilkan pratinjau data sebelum disimpan.
6. Sistem memeriksa data wajib, format identitas, duplikasi, UPDL, unit, dan referensi lain yang relevan.
7. Sistem memisahkan data valid dari data yang bermasalah.
8. Admin mengonfirmasi proses impor.
9. Sistem menampilkan laporan hasil impor.

Sediakan dua mode:
- **Tambah user baru:** membuat user yang belum terdaftar.
- **Perbarui user:** memperbarui data user yang sudah ada berdasarkan identitas unik.

Gunakan NIP/ID pegawai atau identifier unik yang benar-benar tersedia. Jika tidak ada, gunakan mekanisme identifikasi alternatif yang aman dan laporkan kemungkinan duplikasi. Jangan menggunakan nama sebagai satu-satunya kunci identitas.

Ketentuan impor:
- Jangan langsung menyimpan data sebelum pratinjau dan validasi selesai.
- Jangan menghapus user yang tidak ada dalam file impor.
- Jangan membuat akun ganda karena user mengikuti program berbeda.
- Jika suatu baris gagal, tampilkan nomor baris dan alasan kegagalannya.
- Sediakan ringkasan jumlah data berhasil, dilewati, diperbarui, dan gagal.
- Jika file mengandung data dari banyak UPDL, pastikan setiap baris divalidasi berdasarkan UPDL dan unitnya sendiri.

Jika Excel asli sudah memuat hubungan peserta dengan atasan atau koordinator, manfaatkan informasi tersebut. Jika tidak, jangan mengarang relasi; gunakan modul penugasan evaluasi yang dijelaskan di bawah.

---

### 7. Memisahkan Master User dan Penugasan Evaluasi

Jangan menyimpan seluruh informasi program dan periode hanya pada profil master user.

Satu user dapat:
- Terdaftar sebagai master user satu kali.
- Menjadi peserta di beberapa program.
- Mengikuti beberapa periode evaluasi.
- Menjadi atasan atau koordinator dalam penugasan lain sesuai kewenangannya.

Karena itu, buat atau sesuaikan entitas penugasan evaluasi yang menghubungkan:
- User peserta.
- Program.
- Periode evaluasi.
- Atasan yang ditugaskan.
- Koordinator program.
- Status penugasan.
- Referensi formulir atau versi instrumen yang digunakan.

Sesuaikan nama entitas dengan konvensi proyek yang sudah ada. Jangan membuat tabel atau koleksi duplikat apabila fungsi setara sudah tersedia.

Pastikan setiap penugasan terikat dengan program dan periode yang valid. Jangan membiarkan penugasan menggunakan Bank Butir milik program lain.

---

### 8. Pengelolaan Peserta dan Atasan Tanpa Input Berulang

Admin harus dapat mengelola peserta dan penilai secara massal.

#### A. Pemilihan Peserta

Sediakan halaman peserta atau penugasan yang menampilkan user berdasarkan:
- UPDL.
- Unit.
- Program.
- Periode evaluasi.

Admin dapat memilih banyak peserta sekaligus dari master user atau memasukkan peserta melalui Excel.

User yang sudah ada tidak perlu dibuat ulang. Sistem cukup membuat penugasan baru apabila user mengikuti program atau periode yang berbeda.

#### B. Penetapan Atasan

Sediakan tiga metode:

1. **Massal:** satu atasan diterapkan kepada banyak peserta yang dipilih.
2. **Per kelompok:** atasan ditetapkan berdasarkan kelompok peserta, misalnya unit atau kelompok kerja.
3. **Individual:** admin menentukan atasan secara terpisah untuk peserta tertentu.

Jangan mengasumsikan semua peserta dalam satu unit pasti memiliki atasan yang sama. Gunakan pilihan massal sebagai kemudahan, bukan aturan yang tidak dapat diubah.

Sediakan pratinjau sebelum penyimpanan yang memperlihatkan pasangan peserta dan atasannya.

Jika hubungan atasan sudah tersedia pada Excel atau master data, gunakan hubungan tersebut sebagai nilai awal setelah validasi. Admin tetap harus dapat memeriksa dan memperbaikinya.

#### C. Pengubahan Penugasan

Jika atasan peserta berubah:
- Admin dapat memperbarui penugasan yang relevan.
- Perubahan tidak boleh otomatis mengubah jawaban atau hasil evaluasi yang sudah tersimpan.
- Riwayat perubahan perlu dipertahankan apabila sistem sudah mendukung audit log.

---

### 9. Pengelolaan Koordinator pada Tingkat Program

Koordinator ditetapkan untuk setiap program, bukan dipilih ulang satu per satu untuk setiap peserta.

Sediakan konfigurasi koordinator pada halaman detail atau pengaturan program.

Ketentuan:
- Satu program dapat memiliki satu atau beberapa koordinator jika kebutuhan operasional mengharuskannya.
- Admin dapat memilih koordinator internal dari master user.
- Admin dapat menambahkan atau memilih koordinator eksternal.
- Koordinator yang ditetapkan pada program otomatis tersedia untuk penugasan evaluasi pada periode program tersebut.
- Admin tidak perlu memilih koordinator berulang kali untuk setiap peserta.
- Sistem tetap harus mencatat koordinator yang relevan pada penugasan evaluasi agar riwayat tidak berubah jika konfigurasi program diperbarui.

Jika ada lebih dari satu koordinator, sediakan cara untuk menentukan cakupan tugas mereka, misalnya kelompok peserta, unit, atau penugasan tertentu.

Jangan mengasumsikan satu koordinator selalu dapat menilai semua peserta jika pembagian tugas berbeda-beda.

#### Pengecualian Koordinator Per Periode

Secara default, periode menggunakan koordinator program.

Namun, jika dibutuhkan koordinator yang berbeda pada periode tertentu, sediakan override atau pengecualian pada periode tersebut.

Perubahan koordinator program tidak boleh secara otomatis menimpa penugasan periode yang telah dipublikasikan atau memiliki hasil evaluasi.

#### Akses Koordinator

Koordinator hanya dapat mengakses data evaluasi sesuai program, periode, dan penugasan yang diberikan. Keberadaan seseorang sebagai koordinator suatu program tidak boleh otomatis memberinya akses ke seluruh data PIL.

---

### 10. Periode Evaluasi Menggunakan Rentang Tanggal

Periode evaluasi menggunakan tanggal mulai dan tanggal selesai, bukan hanya nama atau nomor periode.

Setiap periode setidaknya memiliki:
- Program pemilik.
- Tanggal mulai.
- Tanggal selesai.
- Status.
- Konfigurasi atau referensi instrumen yang digunakan.

Nama periode boleh tersedia sebagai label tambahan, tetapi tidak menggantikan rentang tanggal.

Contoh:

| Program | Tanggal Mulai | Tanggal Selesai |
|---|---|---|
| Pelatihan A | 01/10/2026 | 15/10/2026 |
| Pelatihan A | 01/12/2026 | 15/12/2026 |
| Pelatihan B | 05/10/2026 | 20/10/2026 |

Satu program dapat memiliki beberapa periode evaluasi dengan rentang tanggal berbeda.

Ketentuan:
- Tanggal selesai tidak boleh lebih awal daripada tanggal mulai.
- Setiap periode harus terhubung dengan satu program.
- Pilihan periode pada dashboard mengikuti program yang dipilih.
- Status periode harus mempertimbangkan tanggal dan status publikasi atau pembukaan evaluasi.
- Sediakan mekanisme pembukaan atau penutupan manual jika dibutuhkan.
- Jangan menghapus periode yang sudah memiliki penugasan atau hasil evaluasi tanpa proses yang aman.
- Penugasan peserta, atasan, koordinator, dan formulir harus mengacu pada periode yang benar.

Jika terdapat rentang tanggal yang saling bertumpang tindih, tampilkan peringatan kepada admin. Jangan melarangnya secara mutlak apabila tumpang tindih tersebut memang diperbolehkan oleh kebutuhan program.

---

### 11. Konfigurasi Bagian Evaluasi Berdasarkan Peserta

Konfigurasi bagian evaluasi harus dikelola pada tingkat program dan periode atau pada konfigurasi instrumen yang digunakan oleh periode tersebut, sesuai arsitektur yang paling tepat.

Karena Bank Butir dimiliki oleh program, Form Builder hanya boleh menampilkan Bank Butir dari program yang dipilih.

Alur yang diharapkan:
1. Admin memilih program.
2. Admin memilih periode evaluasi.
3. Admin memilih Bank Butir milik program tersebut jika program memiliki beberapa Bank Butir.
4. Admin menentukan bagian evaluasi yang digunakan.
5. Sistem menggunakan pilihan bagian tersebut sebagai konfigurasi dasar formulir peserta, atasan, dan koordinator.
6. Admin dapat mengatur pernyataan khusus berdasarkan peran tanpa harus memilih bagian yang sama berkali-kali.

#### Aturan bagian

Peserta menjadi acuan bagian evaluasi.

Contoh:

| Bagian | Peserta | Atasan | Koordinator |
|---|---|---|---|
| A | Diisi | Diisi | Diisi |
| B | Diisi | Diisi | Diisi |
| C | Tidak diisi | Tidak diisi | Tidak diisi |

Jika admin memilih Bagian A dan B untuk peserta, sistem secara default menerapkan Bagian A dan B pada formulir atasan serta koordinator.

Bagian C tidak ditampilkan pada ketiga formulir apabila tidak dipilih pada konfigurasi dasar.

Jika ada kebutuhan khusus, admin boleh membuat pengecualian bagian untuk peran tertentu. Namun, perilaku default harus mengikuti bagian peserta agar konfigurasi konsisten.

#### Pernyataan per peran

Bagian yang digunakan dapat sama, tetapi pernyataannya tidak harus identik.

- **Peserta:** menilai penerapan hasil pelatihan oleh dirinya.
- **Atasan:** menilai perubahan perilaku peserta yang dapat diamati.
- **Koordinator:** menilai penerapan atau bukti pelaksanaan berdasarkan tanggung jawab dan perspektifnya.

Setiap pernyataan harus tetap terhubung dengan bagian dan indikator Bank Butir yang relevan.

Pertahankan skala penilaian, bobot, metadata, dan struktur instrumen yang sudah digunakan. Jangan mengubah bobot atau metode agregasi secara sepihak.

Jika formulir sudah dipublikasikan atau evaluasi sudah berjalan, perubahan konfigurasi harus menghasilkan versi baru atau menggunakan mekanisme snapshot. Jangan mengubah formulir dan hasil evaluasi historis secara otomatis.

---

### 12. Integrasi dengan Bank Butir Per Program

Bank Butir dimiliki secara terpisah oleh setiap program.

Ketentuan:
- Setiap Bank Butir wajib memiliki program pemilik.
- Satu program dapat memiliki beberapa Bank Butir.
- Satu Bank Butir tidak boleh dipakai secara langsung sebagai Bank Butir bersama oleh program lain.
- Form Builder hanya menampilkan Bank Butir milik program yang dipilih.
- Setiap periode harus menggunakan instrumen yang valid untuk program tersebut.
- Jika diperlukan, admin dapat menduplikasi Bank Butir dari program lain menjadi salinan independen.

Validasi relasi harus dilakukan pada backend atau service yang berwenang. Jangan hanya menyaring daftar pilihan di frontend.

Pastikan modul Manajemen User tidak membuat penugasan yang menghubungkan peserta dengan formulir dari program atau periode yang salah.

---

### 13. Alur Kerja Admin yang Diharapkan

Optimalkan proses agar Admin Pusat dapat menyelesaikan pekerjaan tanpa pengulangan.

**Tahap 1 — Tentukan konteks**
- Pilih UPDL atau Semua UPDL.
- Pilih program.
- Pilih periode berdasarkan tanggal.

**Tahap 2 — Siapkan master user**
- Tambah user secara manual atau impor Excel.
- Validasi data identitas dan organisasi.
- Gunakan kembali user yang sudah terdaftar.

**Tahap 3 — Siapkan peserta evaluasi**
- Pilih peserta dari master user.
- Atau impor daftar peserta.
- Hubungkan peserta dengan program dan periode yang benar.

**Tahap 4 — Tetapkan penilai**
- Tetapkan atasan secara massal, per kelompok, atau individual.
- Gunakan koordinator yang sudah dikonfigurasi pada program.
- Izinkan pengecualian koordinator pada periode tertentu jika diperlukan.

**Tahap 5 — Konfigurasikan formulir**
- Pilih Bank Butir program.
- Pilih bagian evaluasi satu kali sebagai konfigurasi dasar.
- Gunakan bagian yang sama untuk peserta, atasan, dan koordinator.
- Atur pernyataan khusus untuk setiap peran jika diperlukan.

**Tahap 6 — Pratinjau dan publikasikan**
- Periksa daftar peserta.
- Periksa pasangan peserta dan atasan.
- Periksa koordinator program dan pengecualian periode.
- Periksa formulir dan bagian evaluasi.
- Periksa rentang tanggal.
- Tampilkan peringatan jika ada peserta tanpa penilai, periode tidak valid, atau konfigurasi yang belum lengkap.
- Publikasikan setelah admin mengonfirmasi.

---

### 14. Desain UI/UX

Pertahankan gaya visual aplikasi PIL yang sudah ada.

Optimalkan navigasi menjadi beberapa halaman atau tab yang saling terhubung:
- Master User.
- Impor Excel.
- Peserta dan Penugasan.
- Pengaturan Koordinator Program.
- Periode Evaluasi.
- Konfigurasi Formulir.

Jangan mencampurkan semua proses ke dalam satu form yang panjang.

Sediakan:
- Pencarian dan filter yang relevan.
- Pagination untuk daftar besar.
- Pemilihan banyak user.
- Aksi massal.
- Pratinjau sebelum penyimpanan.
- Konfirmasi untuk tindakan penting.
- Pesan validasi yang jelas.
- Status proses impor.
- Ringkasan penugasan yang belum lengkap.

Pada form tambah user, tampilkan UPDL dan unit secara kontekstual agar admin tidak perlu memilih ulang ketika cakupannya sudah jelas.

Hindari meminta admin mengisi informasi yang dapat diwariskan secara aman dari konfigurasi program, periode, atau penugasan sebelumnya.

---

### 15. Keamanan dan Integritas Data

- Validasi hak akses pada backend atau lapisan service.
- Jangan mempercayai nilai UPDL, unit, program, periode, atau role yang dikirim frontend tanpa validasi.
- Cegah akses lintas program dan lintas penugasan.
- Terapkan aturan keamanan database yang sesuai dengan teknologi yang digunakan.
- Jika menggunakan Firebase, tinjau Firestore Security Rules dan validasi query serta service.
- Gunakan transaksi atau mekanisme konsistensi yang sesuai ketika menyimpan impor dan penugasan massal.
- Hindari akun duplikat.
- Gunakan penonaktifan atau soft delete jika user masih terhubung dengan data evaluasi.
- Simpan referensi versi instrumen pada formulir atau periode yang relevan.
- Jangan menghapus jawaban, nilai, atau riwayat ketika user atau koordinator dinonaktifkan.
- Catat aktivitas penting melalui audit log jika fitur tersebut tersedia.

---

### 16. Pengujian dan Kriteria Penerimaan

Uji setidaknya skenario berikut:

1. Admin dapat mengelola user berdasarkan satu UPDL.
2. Admin dapat menampilkan seluruh UPDL melalui dashboard.
3. Pada konteks satu UPDL, UPDL otomatis terisi ketika menambahkan user.
4. Pada konteks Semua UPDL, admin dapat memilih UPDL dan unit yang sesuai.
5. Sistem menolak unit yang tidak termasuk dalam UPDL terpilih.
6. Impor Excel sesuai dengan format sumber dan menampilkan pratinjau.
7. Data duplikat ditangani dengan aman.
8. User yang sama dapat mengikuti beberapa program tanpa dibuat ulang.
9. Peserta dapat ditugaskan secara massal.
10. Atasan dapat ditetapkan secara massal, per kelompok, dan individual.
11. Koordinator program otomatis tersedia pada periode terkait.
12. Koordinator eksternal dapat ditambahkan tanpa UPDL dan unit internal.
13. Pengecualian koordinator pada periode tertentu tidak mengubah penugasan historis secara tidak sengaja.
14. Periode menggunakan rentang tanggal dan terhubung dengan program yang benar.
15. Bagian evaluasi yang dipilih untuk peserta otomatis menjadi konfigurasi dasar bagi atasan dan koordinator.
16. Pernyataan per peran dapat berbeda tanpa kehilangan hubungan dengan bagian dan indikator.
17. Bank Butir tidak tercampur antarprogram.
18. Peserta, atasan, dan koordinator hanya dapat mengakses penugasan yang sesuai.
19. Perubahan user atau konfigurasi tidak mengubah hasil evaluasi historis.
20. Modul lama tetap berjalan setelah perubahan diterapkan.

---

### 17. Instruksi Pelaksanaan

Implementasikan secara bertahap:

**Tahap A — Audit**
Laporkan struktur data, fitur yang sudah ada, ketidaksesuaian dengan kebutuhan, serta risiko perubahan.

**Tahap B — Perancangan**
Tentukan perubahan minimal pada struktur database, relasi, halaman, dan aturan akses. Pastikan rancangan mempertahankan data lama.

**Tahap C — Implementasi**
Kerjakan Manajemen User, impor Excel, filter dashboard, penugasan atasan, konfigurasi koordinator program, periode tanggal, dan integrasi bagian formulir.

**Tahap D — Pengujian**
Jalankan pengujian alur utama, validasi, keamanan, migrasi, dan regresi modul yang berkaitan.

**Tahap E — Laporan**
Berikan ringkasan:
- File dan modul yang diubah.
- Perubahan database dan migrasi.
- Cara kerja impor Excel.
- Alur penugasan peserta, atasan, dan koordinator.
- Mekanisme filter UPDL, program, dan periode.
- Aturan konfigurasi bagian evaluasi.
- Hasil pengujian.
- Masalah yang ditemukan dan hal yang belum selesai.

Jangan menyatakan implementasi selesai jika pengujian belum dilakukan atau terdapat kegagalan penting yang belum diselesaikan.

**Batasan akhir:** Fokus pada Manajemen User dan integrasi yang dibutuhkan. Jangan mengganti teknologi, menghapus data lama, membangun ulang aplikasi, atau melakukan perubahan besar pada modul lain yang tidak berkaitan langsung.