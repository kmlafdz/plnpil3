/**
 * Master Data: Sistem Evaluasi Level 3 UP3 Metro
 * Berdasarkan Form Evaluasi Level 3.xlsx dan PRD
 */

window.MASTER_DATA = {
  config: {
    unit: '',
    induk: '',
    updl: '',
    program: '',
    sessionCode: '',
    sessionPeriod: '',
    manajemenTarget: {
      baseline: '',
      target: '',
      deadline: ''
    },
    koordinatorEksternal: {
      nama: '',
      nip: '',
      unit: ''
    },
    koordinatorInternal: {
      nama: '',
      nip: '',
      unit: ''
    }
  },

  validationQuestions: [
    {
      id: 'q1',
      no: 1,
      text: 'Apakah jabatan Anda masih sesuai dengan saat penetapan program BIL?'
    },
    {
      id: 'q2',
      no: 2,
      text: 'Apakah unit Anda masih sesuai dengan saat penetapan program BIL?'
    },
    {
      id: 'q3',
      no: 3,
      text: 'Apakah fasilitas pendukung untuk menerapkan perilaku ini tersedia di unit Anda (misalnya alat ukur beban, perlengkapan P2TL, PSS SINCAL)?'
    }
  ],

  likertScale: [
    { value: 1, label: 'Tidak Memperbaiki', range: '0–25%', color: 'error', desc: 'Tidak ada perubahan perilaku pasca pembelajaran' },
    { value: 2, label: 'Kurang Memperbaiki', range: '26–50%', color: 'secondary', desc: 'Penerapan perilaku masih jarang dan belum konsisten' },
    { value: 3, label: 'Cukup Memperbaiki', range: '51–75%', color: 'primary', desc: 'Menerapkan perilaku pada sebagian besar aktivitas rutin' },
    { value: 4, label: 'Memperbaiki Konsisten', range: '76–100%', color: 'emerald', desc: 'Menerapkan perilaku secara teratur, konsisten dan menjadi teladan' }
  ],

  // Master Katalog Bank Butir Terisolasi per Program Pembelajaran
  bankButirList: [
    {
      id: 'bb-susut-standar',
      programId: 'prog-pil-susut',
      kode: 'BB-SUSUT-01',
      nama: 'Bank Butir Penurunan Susut Distribusi',
      deskripsi: '11 Butir Perilaku Kirkpatrick Level 3 (Susut Teknis, P2TL, PSS SINCAL) sesuai Form Evaluasi Level 3.xlsx',
      versi: '1.0',
      status: 'AKTIF',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-05T08:00:00Z',
      sections: {
    A: {
      code: 'A',
      title: 'Workshop Penurunan Susut Teknis (Penyeimbangan Beban Metode Dua Titik Waktu)',
      kodeDiklat: 'D.1.171.024.2',
      keybe: '1.7.1.DST.PGD.2.2',
      items: [
        {
          id: 'A1',
          no: 1,
          perilaku: 'Saya mengukur beban gardu distribusi pada dua titik waktu sesuai prosedur.',
          perilakuAtasan: 'Peserta mengukur beban gardu distribusi pada dua titik waktu sesuai prosedur.',
          contohBukti: 'Data pengukuran beban gardu distribusi',
          kompetensi: 'Pengukuran Beban Gardu'
        },
        {
          id: 'A2',
          no: 2,
          perilaku: 'Saya menyeimbangkan beban antarfasa berdasarkan hasil pengukuran.',
          perilakuAtasan: 'Peserta menyeimbangkan beban antarfasa berdasarkan hasil pengukuran.',
          contohBukti: 'Berita Acara (BA) penyeimbangan beban antarfasa',
          kompetensi: 'Penyeimbangan Beban Fasa'
        },
        {
          id: 'A3',
          no: 3,
          perilaku: 'Saya melaksanakan pemeliharaan gardu distribusi sesuai SOP.',
          perilakuAtasan: 'Peserta melaksanakan pemeliharaan gardu distribusi sesuai SOP.',
          contohBukti: 'Checklist pemeliharaan gardu distribusi',
          kompetensi: 'Pemeliharaan Gardu Distribusi'
        },
        {
          id: 'A4',
          no: 4,
          perilaku: 'Saya mencatat dan melaporkan hasil pengukuran sebelum dan sesudah penyeimbangan beban.',
          perilakuAtasan: 'Peserta mencatat dan melaporkan hasil pengukuran sebelum dan sesudah penyeimbangan beban.',
          contohBukti: 'Laporan komparasi beban sebelum-sesudah',
          kompetensi: 'Pelaporan & Monitoring Beban'
        }
      ]
    },
    B: {
      code: 'B',
      title: 'Refreshment P2TL untuk Tim P2TL Tingkat Pelaksana Operasi dan Administrasi',
      kodeDiklat: 'D.1.171.016.2',
      keybe: '1.7.1.DST.P2T.2.3',
      items: [
        {
          id: 'B1',
          no: 1,
          perilaku: 'Saya melaksanakan P2TL sesuai prosedur, mulai dari target operasi sampai berita acara.',
          perilakuAtasan: 'Peserta melaksanakan P2TL sesuai prosedur, mulai dari target operasi sampai berita acara.',
          contohBukti: 'Target Operasi (TO) dan Berita Acara (BA) P2TL',
          kompetensi: 'Kepatuhan Prosedur P2TL'
        },
        {
          id: 'B2',
          no: 2,
          perilaku: 'Saya mengidentifikasi pelanggaran atau kelainan APP di lapangan.',
          perilakuAtasan: 'Peserta mengidentifikasi pelanggaran atau kelainan APP di lapangan.',
          contohBukti: 'BA temuan kelainan/pelanggaran APP di lapangan',
          kompetensi: 'Identifikasi Anomali APP'
        },
        {
          id: 'B3',
          no: 3,
          perilaku: 'Saya menyelesaikan masalah rutin saat P2TL sesuai panduan operasional.',
          perilakuAtasan: 'Peserta menyelesaikan masalah rutin saat P2TL sesuai panduan operasional.',
          contohBukti: 'Catatan & logbook penanganan kendala P2TL',
          kompetensi: 'Penyelesaian Kendala Lapangan'
        },
        {
          id: 'B4',
          no: 4,
          perilaku: 'Saya menindaklanjuti hasil P2TL hingga tuntas.',
          perilakuAtasan: 'Peserta menindaklanjuti hasil P2TL hingga tuntas.',
          contohBukti: 'Data penetapan tagihan susulan (TS) & perbaikan APP',
          kompetensi: 'Tindak Lanjut & Rekonsiliasi'
        }
      ]
    },
    C: {
      code: 'C',
      title: 'Perhitungan Susut Teknis Jaringan Distribusi Menggunakan PSS SINCAL',
      kodeDiklat: 'D.1.171.035.2',
      keybe: '1.7.1.DST.MSD.2.2',
      items: [
        {
          id: 'C1',
          no: 1,
          perilaku: 'Saya memodelkan jaringan penyulang di SINCAL sesuai kondisi lapangan.',
          perilakuAtasan: 'Peserta memodelkan jaringan penyulang di SINCAL sesuai kondisi lapangan.',
          contohBukti: 'File model jaringan penyulang SINCAL (.sincal)',
          kompetensi: 'Pemodelan Jaringan SINCAL'
        },
        {
          id: 'C2',
          no: 2,
          perilaku: 'Saya menghitung susut teknis penyulang dengan SINCAL.',
          perilakuAtasan: 'Peserta menghitung susut teknis penyulang dengan SINCAL.',
          contohBukti: 'Laporan hasil komputasi susut teknis penyulang',
          kompetensi: 'Kalkulasi Susut Teknis'
        },
        {
          id: 'C3',
          no: 3,
          perilaku: 'Saya menggunakan hasil perhitungan SINCAL sebagai dasar usulan program penurunan susut.',
          perilakuAtasan: 'Peserta menggunakan hasil perhitungan SINCAL sebagai dasar usulan program penurunan susut.',
          contohBukti: 'Dokumen usulan program penurunan susut berbasis simulasi',
          kompetensi: 'Penyusunan Rekomendasi Solutif'
        }
      ]
    }

      }
    },
    {
      id: 'bb-k3-standar',
      programId: 'prog-k3-distribusi',
      kode: 'BB-K3-01',
      nama: 'Bank Butir Budaya K3L & Zero Accident Distribusi',
      deskripsi: 'Instrumen evaluasi perilaku kepatuhan SOP K3, penggunaan APD lengkap, dan manuver gardu aman.',
      versi: '1.0',
      status: 'AKTIF',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-05T08:00:00Z',
      sections: {
        A: {
          code: 'A',
          title: 'Kepatuhan Prosedur Keselamatan Kerja (SOP & JSA)',
          kodeDiklat: 'D.1.172.010.1',
          keybe: '1.7.2.K3L.SOP.1.1',
          bobotDefault: 50,
          items: [
            {
              id: 'K1',
              no: 1,
              perilaku: 'Saya memeriksa kelayakan APD dan rambu K3 sebelum memulai pekerjaan jaringan.',
              perilakuAtasan: 'Peserta memeriksa kelayakan APD dan rambu K3 sebelum memulai pekerjaan jaringan.',
              contohBukti: 'Checklist inspeksi harian APD & JSA',
              kompetensi: 'Inspeksi & Kepatuhan APD'
            },
            {
              id: 'K2',
              no: 2,
              perilaku: 'Saya melaksanakan briefing keselamatan (Safety Talk) bersama tim sebelum bekerja bertegangan.',
              perilakuAtasan: 'Peserta melaksanakan briefing keselamatan (Safety Talk) bersama tim sebelum bekerja bertegangan.',
              contohBukti: 'Daftar hadir dan dokumentasi Safety Talk harian',
              kompetensi: 'Komunikasi & Briefing K3'
            }
          ]
        },
        B: {
          code: 'B',
          title: 'Mitigasi Risiko & Tanggap Darurat Manuver Gardu',
          kodeDiklat: 'D.1.172.012.2',
          keybe: '1.7.2.K3L.EMG.1.2',
          bobotDefault: 50,
          items: [
            {
              id: 'K3',
              no: 3,
              perilaku: 'Saya menerapkan prosedur penguncian dan penandaan (LOTO) saat pekerjaan pemeliharaan kubikel.',
              perilakuAtasan: 'Peserta menerapkan prosedur penguncian dan penandaan (LOTO) saat pekerjaan pemeliharaan kubikel.',
              contohBukti: 'Lembar kerja kepatuhan LOTO & tagging kubikel',
              kompetensi: 'Penerapan Lockout-Tagout (LOTO)'
            },
            {
              id: 'K4',
              no: 4,
              perilaku: 'Saya melaporkan potensi bahaya (Near Miss / Unsafe Action) ke aplikasi K3 korporat.',
              perilakuAtasan: 'Peserta melaporkan potensi bahaya (Near Miss / Unsafe Action) ke aplikasi K3 korporat.',
              contohBukti: 'Bukti submit laporan Near Miss di portal K3',
              kompetensi: 'Pelaporan Insiden & Near Miss'
            }
          ]
        }
      }
    }
  ],

  // Kompatibilitas mundur: referensi langsung ke Bank Butir default
  get bankButir() {
    return (this.bankButirList && this.bankButirList[0]) ? this.bankButirList[0].sections : {};
  },

  // Data Peserta & Evaluasi - Murni dari Database
  respondents: [],
  initialEvaluations: {},

  // Master UPDL (Unit Pelaksana Pendidikan dan Pelatihan) - Murni dari Database
  updls: [],

  // Master Unit di bawah UPDL - Murni dari Database
  units: [],

  // Master Program Pembelajaran Terpusat - Murni dari Database
  programs: [],

  // Master Periode Evaluasi - Murni dari Database
  periods: [],

  // Form Builder Templates - Murni dari Database
  formTemplates: [],

  // Audit Logs (Pencatatan Riwayat Aktivitas Administrator) - Murni dari Database
  auditLogs: []
};

