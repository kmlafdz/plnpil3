# PROMPT ANTIGRAVITY — PENGEMBANGAN ADMINISTRATOR
## Evaluasi Level 3 — PLN Impact Lab (PIL)

### 1. Peran dan Tujuan

Bertindaklah sebagai Senior Full-Stack Developer, System Analyst, Database Architect, dan UI/UX Engineer.

Saya sudah memiliki aplikasi web Evaluasi Level 3 yang sedang dikembangkan. Tugas Anda adalah melakukan audit terhadap proyek yang sudah ada, memahami arsitektur dan fitur yang berjalan, kemudian mengembangkan modul Administrator sesuai spesifikasi di bawah ini.

**Jangan membangun ulang aplikasi dari nol. Jangan mengganti stack teknologi, database, sistem autentikasi, routing, atau komponen UI yang sudah berjalan tanpa alasan teknis yang kuat dan persetujuan saya.**

Nama resmi aplikasi:

**Evaluasi Level 3 — PLN Impact Lab (PIL)**

Gunakan nama tersebut secara konsisten pada halaman login, sidebar, header, dashboard, judul halaman, metadata browser, dan dokumen aplikasi. Pertahankan logo dan identitas visual yang sudah tersedia apabila sesuai.

### 2. Tahap Pertama: Audit Proyek yang Sudah Ada

Sebelum menulis atau mengubah kode:

1. Periksa struktur direktori dan teknologi frontend serta backend yang digunakan.
2. Identifikasi framework, database, sistem autentikasi, routing, komponen UI, dan pola manajemen state.
3. Periksa skema database, tabel yang sudah tersedia, relasi, serta migration yang telah diterapkan.
4. Identifikasi semua role dan hak akses yang sudah berjalan.
5. Periksa halaman Administrator dan fitur yang telah tersedia.
6. Identifikasi komponen, layanan, dan API yang dapat digunakan kembali.
7. Periksa mekanisme upload file, penyimpanan dokumen, notifikasi, dan audit log jika tersedia.
8. Catat fitur yang berpotensi terdampak oleh pengembangan ini.

Buat ringkasan hasil audit sebelum implementasi. Setelah audit, lanjutkan implementasi secara bertahap menggunakan struktur proyek yang ditemukan. Jangan berhenti hanya untuk memberikan laporan audit jika tidak ada hambatan yang membutuhkan keputusan saya.

### 3. Identitas dan Tujuan Sistem

Aplikasi digunakan untuk mengelola Evaluasi Level 3 terhadap penerapan hasil pembelajaran di tempat kerja.

Tiga perspektif penilaian utama:

- Peserta: penilaian mandiri.
- Atasan Langsung: penilaian terhadap penerapan perilaku peserta.
- Koordinator: penilaian berdasarkan penugasan yang diberikan.

Sistem harus mendukung Koordinator Internal dan Koordinator Eksternal. Keduanya dapat menggunakan template formulir yang sama atau template berbeda.

### 4. Modul Administrator yang Harus Dikembangkan

#### A. Master UPDL dan Unit

Buat halaman manajemen UPDL dengan operasi CRUD:

- Tambah UPDL.
- Lihat detail UPDL.
- Edit data UPDL.
- Nonaktifkan atau hapus UPDL sesuai aturan integritas data.

Setiap UPDL memiliki satu atau beberapa unit di bawahnya.

Buat pengelolaan unit dengan operasi CRUD:

- Tambah unit pada UPDL tertentu.
- Tampilkan daftar unit berdasarkan UPDL.
- Edit nama, kode, dan atribut unit yang diperlukan.
- Pindahkan unit ke UPDL lain hanya jika diizinkan dan tidak merusak relasi data.
- Nonaktifkan unit yang tidak lagi digunakan.

Validasi agar kode UPDL dan kode unit tidak duplikat sesuai cakupan yang ditetapkan.

Gunakan soft delete atau mekanisme penonaktifan untuk data organisasi yang sudah memiliki relasi dengan user atau riwayat evaluasi. Jangan menghapus data historis secara permanen hanya karena data master tidak aktif.

Admin pusat memiliki akses untuk mengelola seluruh UPDL dan unit.

#### B. Manajemen User Berdasarkan UPDL

Buat halaman Data User dengan pengelompokan dan filter organisasi.

Fitur:

- Menampilkan user berdasarkan UPDL.
- Filter berdasarkan unit di dalam UPDL yang dipilih.
- Pencarian berdasarkan nama, email, nomor identitas internal, atau atribut yang tersedia.
- Filter berdasarkan role dan status akun.
- Tambah, lihat, edit, aktifkan, dan nonaktifkan akun.
- Atur role user sesuai hak akses.
- Impor user dari Excel apabila mekanisme impor belum tersedia.
- Validasi duplikasi data saat impor.
- Tampilkan jumlah user per UPDL dan unit.

Setiap user hanya terdaftar pada satu UPDL dan satu unit pada satu waktu.

Simpan relasi organisasi melalui foreign key atau mekanisme relasional yang setara. Jangan hanya menyimpan nama UPDL dan unit sebagai teks bebas.

Jangan menampilkan kredensial, password, atau informasi sensitif yang tidak diperlukan.

#### C. Manajemen Program Pembelajaran

Buat modul Program Pembelajaran.

Admin dapat:

- Membuat program baru.
- Melihat detail program.
- Mengedit metadata program.
- Mengaktifkan atau menonaktifkan program.
- Melihat periode evaluasi yang terkait.
- Melihat UPDL yang menggunakan program.
- Melihat bank butir dan template formulir yang digunakan.

Program bersifat terpusat dan dapat digunakan oleh beberapa UPDL.

Rancang atribut program berdasarkan kebutuhan sistem yang sudah ada. Atribut awal yang dapat digunakan meliputi:

- Kode program.
- Nama program.
- Deskripsi.
- Status program.
- Informasi penyelenggara jika diperlukan.
- Tanggal atau informasi pelaksanaan jika tersedia.

Jangan menjadikan UPDL sebagai pemilik eksklusif program. Program yang sama dapat digunakan oleh beberapa UPDL melalui relasi yang tepat.

Hindari membuat atribut wajib yang tidak memiliki dasar kebutuhan bisnis.

#### D. Manajemen Periode Evaluasi

Satu program dapat memiliki beberapa periode evaluasi.

Admin dapat:

- Membuat periode evaluasi.
- Memilih program yang terkait.
- Menentukan nama dan deskripsi periode.
- Menentukan tanggal mulai dan tenggat pengisian.
- Menentukan UPDL yang mengikuti periode tersebut.
- Mengatur status periode.
- Melihat progres pengisian.
- Menutup periode dan mengarsipkan hasilnya.
- Membuka riwayat periode terdahulu.

Gunakan status periode seperti Draft, Terjadwal, Aktif, dan Ditutup.

Jangan mengasumsikan bahwa periode evaluasi harus mengikuti semester atau tahun akademik. Periode ditentukan oleh administrator sesuai jadwal pelaksanaan yang sebenarnya.

Validasi tanggal dan status agar formulir tidak dapat diisi sebelum periode aktif atau setelah ditutup, kecuali ada pembukaan kembali yang sah dan tercatat.

Pisahkan status periode dari status tugas setiap responden.

#### E. Bank Butir Evaluasi

Buat modul Bank Butir yang berfungsi sebagai master sumber instrumen evaluasi.

Gunakan file Excel `Form Evaluasi Level 3.xlsx` sebagai acuan utama isi instrumen. Pertahankan struktur dan redaksi sumber.

Sheet utama yang relevan adalah `BANK BUTIR`. Berdasarkan struktur workbook yang telah diperiksa, kolomnya mencakup:

- Bagian.
- Judul pembelajaran (10%).
- Kode diklat.
- KEYBE.
- Nomor.
- Butir perilaku.
- Contoh bukti.

Data tersebut harus dipertahankan dan dimodelkan secara terstruktur. Jangan mengubah KEYBE, kode diklat, redaksi butir perilaku, contoh bukti, atau bobot yang tercantum tanpa dasar yang jelas.

Instrumen sumber terdiri atas tiga bagian:

- Bagian A: pengurangan susut teknis melalui metode dua titik waktu/load balancing.
- Bagian B: penyegaran P2TL.
- Bagian C: perhitungan susut teknis distribusi menggunakan PSS SINCAL.

Pertahankan total 11 butir perilaku sesuai Excel.

Fitur Bank Butir:

1. Menampilkan daftar bank butir.
2. Membuat, melihat, mengedit, dan mengarsipkan bank butir.
3. Mengelola metadata diklat.
4. Mengelola bagian A/B/C.
5. Mengelola butir perilaku dan contoh bukti.
6. Mempertahankan nomor urut dan kode referensi.
7. Mencari dan memfilter berdasarkan bagian, kode diklat, KEYBE, dan atribut yang tersedia.
8. Menampilkan detail butir dalam tampilan terstruktur.
9. Menyediakan mekanisme impor data Excel dengan preview, validasi, dan laporan kesalahan.
10. Mencegah duplikasi saat impor.

Jangan membuat data dummy seolah-olah merupakan data resmi. Jika memerlukan data pengujian, tandai secara jelas sebagai data dummy.

Jangan mengasumsikan bahwa seluruh kolom Excel merupakan pertanyaan yang harus dijawab responden. Metadata bank butir dan elemen formulir harus dibedakan.

#### F. Builder Form Evaluasi

Buat Form Builder yang mengambil data dari Bank Butir.

**Konsep utama: Bank Butir adalah sumber referensi, sedangkan Form Evaluasi adalah konfigurasi instrumen yang digunakan untuk pengisian.**

Admin dapat membuat satu atau beberapa konfigurasi formulir dari bank butir yang dipilih.

Fitur Form Builder:

1. Memilih bank butir sebagai sumber.
2. Memilih program dan periode penggunaan formulir.
3. Memilih bagian A, B, dan/atau C.
4. Memilih indikator atau butir perilaku yang digunakan.
5. Menambahkan pernyataan evaluasi berdasarkan sumber bank butir.
6. Mengatur redaksi pernyataan sesuai perspektif penilai.
7. Mengatur urutan pernyataan.
8. Mengatur petunjuk pengisian.
9. Mengatur skala jawaban.
10. Mengatur bobot bagian atau indikator dalam perhitungan.
11. Menentukan peran yang boleh menggunakan formulir.
12. Melihat preview formulir.
13. Memvalidasi konfigurasi sebelum diterbitkan.
14. Menerbitkan formulir ke periode evaluasi yang sesuai.
15. Membuat versi baru jika ada perubahan setelah penerbitan.

Jangan mengubah redaksi instrumen sumber secara otomatis. Jika pernyataan baru dibuat atau redaksi disesuaikan, tampilkan bahwa pernyataan tersebut merupakan konfigurasi formulir dan simpan relasinya ke butir sumber apabila relevan.

#### G. Formulir untuk Tiga Perspektif

Setiap bank butir yang digunakan harus dapat memiliki formulir untuk:

**1. Form Peserta**

- Untuk penilaian mandiri.
- Pernyataan dapat memiliki redaksi khusus perspektif peserta.
- Menampilkan hanya bagian dan indikator yang ditetapkan Admin.
- Mendukung pertanyaan validasi yang memang terdapat dalam instrumen sumber.

**2. Form Atasan Langsung**

- Untuk penilaian penerapan perilaku peserta oleh atasan.
- Menggunakan bank butir yang sama sebagai sumber.
- Pernyataan dapat berbeda dari Form Peserta.
- Hanya dapat diisi oleh atasan yang mendapatkan penugasan.

**3. Form Koordinator**

- Mendukung Koordinator Internal dan Koordinator Eksternal.
- Admin dapat memilih template bersama atau membuat template terpisah.
- Jika menggunakan template bersama, kedua kategori tetap harus dibedakan pada data penugasan.
- Jika template terpisah, masing-masing dapat memiliki konfigurasi pernyataan tersendiri.

Jangan memaksa ketiga perspektif menggunakan redaksi identik. Sebaliknya, jangan pula membuat pernyataan baru secara otomatis tanpa keputusan Admin.

Sediakan pengaturan agar setiap form dapat menggunakan bagian dan indikator yang berbeda sesuai kebutuhan evaluasi.

#### H. Skala dan Bobot Penilaian

Pertahankan skala sumber:

- Nilai 1: Tidak memperbaiki, rentang 0–25%.
- Nilai 2: Kurang memperbaiki, rentang 26–50%.
- Nilai 3: Cukup memperbaiki, rentang 51–75%.
- Nilai 4: Memperbaiki secara konsisten, rentang 76–100%.

Jangan menyamakan persentase rentang penerapan di atas dengan bobot indikator.

Bobot yang dapat dikonfigurasi Admin adalah bobot bagian atau indikator dalam perhitungan hasil evaluasi.

Buat validasi bobot dan dokumentasikan rumus agregasi yang benar-benar digunakan. Jika bobot bersifat persentase dari total, validasi total bobot sebesar 100% untuk kelompok yang memang harus berjumlah 100%.

Jangan menetapkan rumus akhir secara sepihak apabila aturan agregasi belum disepakati. Buat perhitungan transparan dan dapat ditelusuri.

Jawaban kosong tidak boleh dianggap sebagai nilai 1. Pertanyaan validasi “Ya/Tidak” harus mengikuti aturan instrumen sumber, bukan otomatis diubah menjadi skor.

#### I. Penugasan dan Monitoring

Sediakan kemampuan Admin untuk:

- Memilih periode dan UPDL yang berpartisipasi.
- Memilih peserta yang akan dievaluasi.
- Menetapkan atasan langsung.
- Menetapkan Koordinator Internal atau Eksternal.
- Menentukan formulir yang wajib diisi setiap peran.
- Memantau progres setiap responden.
- Memantau status setiap formulir.
- Mengetahui formulir yang belum dimulai, sedang dikerjakan, sudah dikirim, perlu diperbaiki, atau selesai.
- Mengubah penugasan dengan alasan dan pencatatan audit.
- Membuka kembali formulir sesuai kewenangan dan aturan yang ditetapkan.

Jangan memberikan akses penilaian kepada user hanya berdasarkan role umum. Penilai harus memiliki penugasan yang sah terhadap peserta dan periode yang bersangkutan.

#### J. Hasil, Laporan, dan Audit Log

Sediakan dashboard Administrator yang menampilkan:

- Total UPDL dan unit aktif.
- Total user.
- Total program.
- Total periode aktif.
- Total peserta pada periode terpilih.
- Progres pengisian per peran.
- Kelengkapan formulir.
- Status dokumen bukti jika fitur dokumen sudah tersedia.

Sediakan laporan yang dapat difilter berdasarkan program, periode, UPDL, unit, dan peserta.

Sediakan ekspor Excel/PDF apabila sesuai dengan teknologi yang digunakan.

Audit log minimal mencatat perubahan pada data UPDL, unit, user, program, periode, bank butir, konfigurasi formulir, bobot, penugasan, dan status pengisian.

### 5. Aturan Versi dan Integritas Data

Implementasikan aturan berikut:

- Perubahan Bank Butir tidak boleh otomatis mengubah formulir yang sudah diterbitkan.
- Formulir yang telah digunakan harus mempertahankan versi instrumen yang berlaku saat penerbitan.
- Hasil evaluasi historis tidak boleh berubah akibat pengeditan data master.
- Penghapusan data yang masih memiliki relasi harus ditolak atau diganti dengan penonaktifan.
- Semua perubahan penting harus tercatat dalam audit log.
- Gunakan validasi frontend dan backend.
- Terapkan otorisasi di sisi backend, bukan hanya menyembunyikan menu di frontend.
- Pastikan setiap user hanya melihat data dan tugas yang sesuai dengan kewenangannya.

### 6. Desain UI/UX

Gunakan desain profesional, formal, bersih, dan konsisten dengan aplikasi yang sudah ada.

Jika aplikasi saat ini menggunakan identitas visual putih dan cyan, pertahankan palet tersebut. Jangan membuat redesign besar tanpa kebutuhan.

Ketentuan:

- Sidebar Administrator dengan navigasi yang jelas.
- Header menampilkan nama aplikasi Evaluasi Level 3 — PLN Impact Lab (PIL).
- Tabel data memiliki pencarian, filter, pagination, dan aksi yang jelas.
- Form tambah/edit menggunakan validasi yang informatif.
- Dialog konfirmasi untuk tindakan yang berdampak pada data.
- Status menggunakan label yang konsisten.
- Form Builder menyediakan langkah yang mudah dipahami dan preview sebelum publikasi.
- Responsif pada desktop dan tablet.
- Loading, empty state, success state, dan error state harus ditangani.
- Gunakan komponen yang sudah tersedia sebelum membuat komponen baru.

### 7. Keamanan dan Penggunaan Data

- Jangan menggunakan data karyawan atau dokumen internal asli untuk pengujian tanpa otorisasi.
- Jangan mengekspos dokumen bukti melalui URL publik.
- Jangan menampilkan password atau informasi sensitif.
- Validasi akses terhadap setiap API dan objek data.
- Terapkan batas ukuran dan tipe file untuk unggahan.
- Gunakan transaksi database pada operasi yang saling bergantung.
- Jangan mengubah atau menghapus data produksi selama proses audit atau pengembangan.
- Jangan mengklaim aplikasi siap produksi sebelum pengujian keamanan dan persetujuan pihak TI yang berwenang.

### 8. Strategi Implementasi

Kerjakan dalam urutan berikut:

**Tahap 1 — Audit**
- Periksa proyek.
- Identifikasi arsitektur, database, autentikasi, routing, dan modul yang sudah tersedia.
- Catat risiko perubahan.

**Tahap 2 — Identitas dan Master Data**
- Ubah nama aplikasi menjadi Evaluasi Level 3 — PLN Impact Lab (PIL).
- Implementasikan UPDL dan unit.
- Implementasikan manajemen user berdasarkan UPDL.

**Tahap 3 — Program dan Periode**
- Implementasikan program terpusat.
- Implementasikan periode evaluasi yang terhubung ke program.
- Terapkan relasi dengan UPDL yang berpartisipasi.

**Tahap 4 — Bank Butir**
- Cocokkan struktur bank butir dengan Excel.
- Implementasikan CRUD, validasi, dan impor data jika diperlukan.
- Pastikan seluruh 11 butir dan metadata sumber dapat dipertahankan.

**Tahap 5 — Form Builder**
- Implementasikan konfigurasi form berdasarkan bank butir.
- Implementasikan Form Peserta, Form Atasan, dan Form Koordinator.
- Implementasikan bobot bagian/indikator.
- Implementasikan preview, validasi, publikasi, dan versi instrumen.

**Tahap 6 — Penugasan dan Monitoring**
- Implementasikan relasi peserta, atasan, koordinator, program, periode, dan formulir.
- Implementasikan monitoring penyelesaian.

**Tahap 7 — Audit dan Pengujian**
- Uji CRUD, impor, relasi, validasi, otorisasi, versi formulir, dan konsistensi data.
- Uji tampilan responsif.
- Pastikan fitur lama tetap berjalan.

### 9. Kriteria Penerimaan

Pengembangan dinyatakan berhasil apabila:

1. Nama aplikasi tampil konsisten sebagai Evaluasi Level 3 — PLN Impact Lab (PIL).
2. Admin pusat dapat mengelola UPDL dan unit.
3. User dapat difilter berdasarkan UPDL dan unit.
4. Program dapat digunakan oleh beberapa UPDL.
5. Satu program dapat memiliki beberapa periode evaluasi.
6. Bank butir mempertahankan metadata dan seluruh 11 butir perilaku sesuai Excel.
7. Admin dapat membuat formulir dari bank butir.
8. Form Peserta, Atasan, dan Koordinator dapat dikonfigurasi secara independen.
9. Koordinator Internal dan Eksternal dapat menggunakan template bersama atau terpisah.
10. Bobot bagian/indikator terpisah dari persentase rentang skala.
11. Formulir terbit memiliki versi yang tidak berubah secara retroaktif.
12. Hak akses dan penugasan divalidasi di backend.
13. Seluruh operasi utama memiliki validasi, feedback, dan audit yang sesuai.
14. Tidak ada fitur lama yang rusak akibat perubahan.

### 10. Instruksi Penutup

Mulailah dengan memeriksa proyek yang sedang terbuka. Gunakan hasil audit untuk menentukan implementasi yang paling kompatibel.

Jangan mengganti stack teknologi hanya karena preferensi pribadi. Jangan membangun ulang fitur yang sudah tersedia. Jangan mengisi kekosongan spesifikasi dengan asumsi yang memengaruhi validitas penilaian.

Jika ada keputusan bisnis yang belum ditentukan—terutama rumus agregasi skor, aturan bobot, atau perubahan redaksi instrumen—pertahankan konfigurasi yang eksplisit, dokumentasikan hal yang belum ditetapkan, dan jangan mengaktifkan perhitungan yang belum disepakati.

Setelah implementasi, berikan ringkasan:
- Perubahan yang berhasil dilakukan.
- File dan modul yang diubah.
- Perubahan database atau migration.
- Hasil pengujian.
- Fitur yang belum selesai.
- Keputusan yang masih memerlukan konfirmasi.

Fokus pada implementasi yang aman, terstruktur, dapat dipelihara, dan kompatibel dengan aplikasi yang sudah ada.