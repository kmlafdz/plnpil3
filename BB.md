# Spesifikasi Modul Bank Butir Berbasis Program
## Evaluasi Level 3 — PLN Impact Lab (PIL)

### 1. Konsep dan Relasi Data
1. **Relasi Program dan Bank Butir:**
   - 1 Program Pembelajaran dapat memiliki satu atau lebih katalog Bank Butir (versi revisi, instrumen khusus, dsb).
   - 1 Bank Butir terikat secara eksklusif ke tepat 1 `programId`.
   - Tidak ada lagi Bank Butir global tanpa kepemilikan program (`programId` bersifat wajib).

2. **Skema Data Bank Butir:**
   - `id`: ID unik katalog Bank Butir (contoh: `bb-susut-standar`, `bb-k3-standar`, `bb-dup-...`).
   - `programId`: ID program pemilik instrumen (contoh: `prog-pil-susut`, `prog-k3-distribusi`).
   - `kode`: Kode katalog (contoh: `BB-SUSUT-01`, `BB-K3-01`).
   - `nama`: Nama instrumen (contoh: `Bank Butir Penurunan Susut Distribusi`).
   - `deskripsi`: Penjelasan tujuan atau kurikulum instrumen.
   - `versi`: Versi instrumen (default `1.0`).
   - `status`: `AKTIF` | `NONAKTIF` | `ARSIP`.
   - `sections`: Objek berisi bagian (A, B, C...) dengan `title`, `kodeDiklat`, `keybe`, `bobotDefault`, dan daftar `items` butir perilaku.

3. **Migrasi Data Aman:**
   - Katalog 11 butir eksisting dari sheet `BANK BUTIR` (`Form Evaluasi Level 3.xlsx`) diikat ke program **PLN Impact Lab Penurunan Susut Distribusi** (`prog-pil-susut`).
   - Butir K3 Distribusi diikat ke program **K3 Distribusi & Pekerjaan Bertegangan** (`prog-k3-distribusi`).

### 2. Fitur Antarmuka Admin Bank Butir (`admin_bank_butir.js`)
1. **Program Selector & Context Banner:**
   - Dropdown seleksi Program di bagian atas halaman Bank Butir.
   - Banner konteks program yang aktif (Kode, Nama, Penyelenggara UPDL, Jumlah Butir, Status).
2. **Katalog Bank Butir Selector:**
   - Dropdown / tab untuk memilih katalog Bank Butir milik program yang sedang dipilih.
   - Tombol **+ Tambah Bank Butir** (otomatis terikat pada program yang aktif).
3. **Fitur Duplikasi Lintas Program:**
   - Tombol **Duplikasi Bank Butir** untuk menduplikasi seluruh butir perilaku ke program lain sebagai salinan independen (ID baru, relasi baru, redaksi dapat diedit mandiri).
4. **Tabel & Filter Butir:**
   - Filter Bagian (A, B, C atau dinamis sesuai katalog terpilih).
   - Pencarian butir perilaku, perspektif atasan, contoh bukti, kode diklat, dan kompetensi.
   - Modal detail butir (Penilaian Mandiri, Observasi Atasan Langsung, Contoh Dokumen Bukti Kerja).
   - Modal edit redaksi butir dan bukti kerja.
   - Ekspor Bank Butir JSON dan Pratinjau Impor Excel.

### 3. Integrasi Form Builder (`admin_form_builder.js`)
1. **Filter Berbasis Program:**
   - Dropdown pemilihan Bank Butir di Step 1 hanya menampilkan katalog Bank Butir yang memiliki `programId` sama dengan template form.
   - Validasi ketat di Store dan UI: Menolak penyimpanan jika `bankButir.programId !== template.programId`.
2. **Integritas Evaluasi:**
   - Formulir dan 10 data evaluasi peserta yang sudah berjalan tidak terganggu dan tetap mengacu pada instrumen valid.
