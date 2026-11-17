# Product Requirements Document (PRD)
## Sistem Informasi Evaluasi Pembelajaran Level 3 (Tingkat Perilaku)
### Program PLN Impact Lab (PIL) UP3 Metro – Penurunan Susut Distribusi

---

## 1. Ringkasan Eksekutif (Executive Summary)
Program **PLN Impact Lab (PIL) UP3 Metro** berfokus pada sasaran strategis penurunan susut jaringan distribusi tenaga listrik, dengan target penurunan susut dari **11,39% (realisasi 2025)** menjadi **11,00% pada Desember 2026**.

Untuk memastikan pembelajaran berkontribusi nyata pada performa operasional di lapangan, diperlukan instrumen **Evaluasi Pembelajaran Level 3 (Evaluasi Perilaku / Behavior Evaluation Model Kirkpatrick)** dengan pendekatan **Tri-Perspektif (360° Assessment)**:
1. **Peserta (Self-Assessment L3B)**: Evaluasi diri mengenai implementasi pasca-diklat dan bukti kerja.
2. **Atasan Langsung (L3B Atasan)**: Observasi atasan terhadap konsistensi perubahan perilaku kerja bawahan.
3. **Koordinator Eksternal (L3C Koordinator)**: Verifikasi independen oleh koordinator program/UPDL.

Aplikasi ini mendigitalkan dan mengotomasi seluruh alur pengisian, penugasan, pemantauan kelengkapan, hingga analitik hasil evaluasi berbasis data riil dari unit kerja PLN UP3 Metro dan ULP binaannya.

---

## 2. Pemangku Kepentingan & Target Pengguna (Stakeholders & Roles)

| Peran (Role) | Pengguna Utama | Tanggung Jawab Utama |
| :--- | :--- | :--- |
| **Administrator Penyelenggara** | Tim Penyelenggara UPDL Palembang & SDM/Kinerja UP3 Metro | Menetapkan periode evaluasi, mengelola data responden (40 pegawai), mengatur matriks penugasan penilai, memonitor progres, dan mengekspor laporan akhir. |
| **Peserta Pelatihan** | 40 Pegawai lintas 6 Unit (UP3 Metro & 5 ULP) | Mengisi pertanyaan validasi kualifikasi, menilai efektivitas diri (skala 1–4) pada modul yang diikutinya (Bagian A, B, dan/atau C), serta melampirkan tautan/deskripsi bukti dokumen. |
| **Atasan Langsung** | Asman / Team Leader / Manager ULP | Memberikan penilaian objektif atas perubahan perilaku anggota tim kerja di lapangan sesuai butir perilaku terkait. |
| **Koordinator Eksternal & Internal** | Azam Zulmi Agusti Nuro (Eksternal) & Akkhita Nurrul Febriyanti (Internal) | Memberikan tinjauan dan evaluasi independen efektivitas implementasi materi diklat pada unit operasional. |

---

## 3. Struktur Instrumen Evaluasi & Bank Butir

### 3.1. Validasi Kualifikasi Responden (Screening Awal)
Sebelum masuk ke butir evaluasi teknis, Peserta wajib lolos 3 pertanyaan validasi:
1. *Apakah jabatan Anda masih sesuai dengan saat penetapan program BIL?* (Ya / Tidak)
2. *Apakah unit Anda masih sesuai dengan saat penetapan program BIL?* (Ya / Tidak)
3. *Apakah fasilitas pendukung untuk menerapkan perilaku ini tersedia di unit Anda (misalnya alat ukur beban, perlengkapan P2TL, PSS SINCAL)?* (Ya / Tidak)
> *Catatan: Jika terdapat jawaban "Tidak", pengisian evaluasi mandiri dihentikan dan ditandai untuk review administrator.*

### 3.2. Skala Penilaian (Likert Scale 1–4) & Konversi Skor
- **1 = Tidak Memperbaiki (0% – 25%)**
- **2 = Kurang Memperbaiki (26% – 50%)**
- **3 = Cukup Memperbaiki (51% – 75%)**
- **4 = Memperbaiki Secara Konsisten (76% – 100%)**
- Formula Konversi: `Skor Indeks = ((Nilai Rata-rata / 4) * 100)` (Rentang 25 – 100).

### 3.3. Bank Butir Perilaku (11 Indikator Perilaku)

#### Bagian A: Workshop Penurunan Susut Teknis (Penyeimbangan Beban Metode Dua Titik Waktu)
- **Kode Diklat**: `D.1.171.024.2` | **KEYBE**: `1.7.1.DST.PGD.2.2`
- **A1**: Mengukur beban gardu distribusi pada dua titik waktu sesuai prosedur *(Bukti: Data pengukuran beban)*.
- **A2**: Menyeimbangkan beban antarfasa berdasarkan hasil pengukuran *(Bukti: Berita Acara penyeimbangan beban)*.
- **A3**: Melaksanakan pemeliharaan gardu distribusi sesuai SOP *(Bukti: Checklist pemeliharaan gardu)*.
- **A4**: Mencatat dan melaporkan hasil pengukuran sebelum dan sesudah penyeimbangan beban *(Bukti: Laporan sebelum-sesudah)*.

#### Bagian B: Refreshment P2TL untuk Tim P2TL Tingkat Pelaksana Operasi dan Administrasi
- **Kode Diklat**: `D.1.171.016.2` | **KEYBE**: `1.7.1.DST.P2T.2.3`
- **B1**: Melaksanakan P2TL sesuai prosedur, mulai target operasi sampai berita acara *(Bukti: TO dan BA P2TL)*.
- **B2**: Mengidentifikasi pelanggaran atau kelainan APP di lapangan *(Bukti: BA temuan P2TL)*.
- **B3**: Menyelesaikan masalah rutin saat P2TL sesuai panduan operasional *(Bukti: Catatan penanganan kendala P2TL)*.
- **B4**: Menindaklanjuti hasil P2TL hingga tuntas *(Bukti: Data tagihan susulan, perbaikan APP)*.

#### Bagian C: Perhitungan Susut Teknis Jaringan Distribusi Menggunakan PSS SINCAL
- **Kode Diklat**: `D.1.171.035.2` | **KEYBE**: `1.7.1.DST.MSD.2.2`
- **C1**: Memodelkan jaringan penyulang di SINCAL sesuai kondisi lapangan *(Bukti: File model SINCAL)*.
- **C2**: Menghitung susut teknis penyulang dengan SINCAL *(Bukti: Hasil perhitungan susut)*.
- **C3**: Menggunakan hasil perhitungan SINCAL sebagai dasar usulan program penurunan susut *(Bukti: Usulan program penurunan susut)*.

---

## 4. Ruang Lingkup Fitur & Modul Aplikasi (Berdasarkan Stitch UI)

### Modul 1: Dashboard Administrator (`dashboard_administrator`)
- **Header Ringkasan & Filter**: Pilihan Periode/Siklus Evaluasi, unit UP3 Metro & filter tanggal.
- **KPI Widget Cards**:
  - Total Target Responden (40 Peserta terdaftar).
  - Persentase Pengisian Peserta, Atasan, dan Koordinator.
  - Rata-rata Skor Capaian Perilaku Gabungan (Skala 25–100).
  - Status Verifikasi Kelayakan Responden.
- **Tabel Ringkasan Responden Cepat**: Menampilkan status tri-perspektif (badge warna per pihak) dan aksi cepat (Ingatkan, Lihat Detail).

### Modul 2: Penugasan Penilai (`penugasan_penilai`)
- **Tabel Pemetaan Matriks**: Menghubungkan Peserta dengan Atasan Langsung dan Koordinator Eksternal/Internal.
- **Filter & Multi-Select**: Pencarian berdasarkan NIP/Nama, filter ULP, dan seleksi massal.
- **Aksi Kolektif**: Penetapan Koordinator Massal, Pengiriman Notifikasi Akses, dan Impor Matriks Excel.
- **Validasi Status Relasi**: Badge verifikasi relasi penilai valid/belum lengkap.

### Modul 3: Monitoring Progres Pengisian (`progres_pengisian`)
- **Visualisasi Kelengkapan per ULP**: Progress bar capaian pengisian untuk UP3 Metro, ULP Bandarjaya, ULP Kota Metro, ULP Rumbia, ULP Sribhawono, dan ULP Sukadana.
- **Jadwal Pengingat Terjadwal (Nudge Scheduler)**: Konfigurasi pengingat berkala via WhatsApp/Email bagi penilai/peserta yang belum mengisi.
- **Audit Progres Tabular**: Filter status (Semua, Perlu Tindak Lanjut, Selesai Penuh, Belum Dimulai).

### Modul 4: Formulir Evaluasi Interaktif (`formulir_evaluasi_peserta`)
- **Header Responden & Penilai**: Informasi identitas peserta, NIP, unit, jabatan, atasan, dan modul aktif (A/B/C).
- **Stepping Wizard / Accordion**:
  1. *Langkah 1*: Pertanyaan Validasi Kualifikasi (3 butir screening).
  2. *Langkah 2*: Penilaian Sasaran Perilaku (Likert 1–4 segmented buttons).
  3. *Langkah 3*: Dokumentasi Bukti Penerapan (Upload / Catatan Dokumen Bukti).
  4. *Langkah 4*: Konfirmasi & Submit dengan simpan draf otomatis.
- **Kompatibilitas Form Role**: Adaptasi antarmuka untuk perspektif Peserta, Atasan Langsung, maupun Koordinator.

### Modul 5: Hasil & Analitik Evaluasi (`hasil_evaluasi`)
- **Komparasi Tri-Perspektif per Bagian Modul**: Perbandingan skor Peserta vs Atasan vs Koordinator per modul (A, B, C) dalam visualisasi grafik batang komparatif.
- **Analitik 11 Indikator Perilaku**: Tabel mendalam memuat skor gabungan, status efektivitas (Efektif, Sangat Efektif, Perlu Penguatan), serta ketersediaan bukti dukung.
- **Segmentasi Capaian per ULP**: Peringkat skor rata-rata per unit layanan dengan kategori kepatuhan.
- **Penerbitan & Ekspor Laporan**: Fitur Kunci Hasil Evaluasi, Ekspor ke Excel (XLSX) dan Cetak/PDF Ringkasan Eksekutif.

---

## 5. Kebutuhan Non-Fungsional & Kriteria Kualitas
- **Desain & UI/UX**: Mengikuti standar token warna, tipografi Inter tabular-nums, dan layout pada [design.md](file:///c:/Users/ThinkPad/.gemini/antigravity/scratch/pln-corpu/design.md).
- **Integritas Data**: Nilai skor tidak boleh hilang saat berganti halaman (dukungan state management atau LocalStorage/IndexedDB).
- **Aksesibilitas & Responsivitas**: Tampilan prima di desktop widescreen (>= 1280px), laptop (1024px), dan penyesuaian sidebar collapsible pada layar sentuh/tablet.
- **Keamanan & Peran**: Pemisahan hak akses antara Administrator (pengelola matriks & laporan) dan Responden (pengisi formulir).
 