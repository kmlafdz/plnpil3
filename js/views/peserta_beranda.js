/**
 * View: Beranda Peserta Evaluasi Level 3
 * Menampilkan data profil peserta, penugasan penilai, bank butir sesuai modul, dan status progress form
 */

(function () {
  window.PesertaBerandaView = {
    activeModTab: null, // Modul yang dipilih pada bank butir

    render: function (container) {
      const user = window.authManager.getUser();
      // Cari data responden berdasarkan id atau nip peserta
      let respondent = null;
      const respList = window.appStore?.respondents || [];
      if (user && user.respondentId) {
        respondent = respList.find(r => 
          (r.id !== undefined && (Number(r.id) === Number(user.respondentId) || String(r.id) === String(user.respondentId))) ||
          (r.nip && user.nip && String(r.nip).trim().toLowerCase() === String(user.nip).trim().toLowerCase())
        );
      } else if (user && user.nip) {
        respondent = respList.find(r => 
          r.nip && String(r.nip).trim().toLowerCase() === String(user.nip).trim().toLowerCase()
        );
      }
      if (!respondent && respList.length > 0) {
        respondent = respList[0];
      }
      if (!respondent) {
        respondent = {
          id: user?.respondentId || 101,
          nama: user?.nama || 'Peserta',
          nip: user?.nip || '-',
          jabatan: user?.jabatan || 'Peserta Pelatihan',
          unit: user?.unit || user?.unitName || 'PLN Unit',
          modules: ['A'],
          atasan: { nama: 'Atasan Langsung', nip: '-', jabatan: 'Manager Unit' },
          koordinatorEksternal: { nama: 'Koordinator UPDL', nip: '-', jabatan: 'Koordinator' }
        };
      }

      respondent.modules = Array.isArray(respondent.modules) && respondent.modules.length > 0 ? respondent.modules : ['A'];

      const progress = window.appStore.getPesertaProgress(respondent.id);
      const ev = window.appStore.getEvaluation(respondent.id);

      // Default active tab to first module
      if (!this.activeModTab || !respondent.modules.includes(this.activeModTab)) {
        this.activeModTab = respondent.modules[0] || 'A';
      }

      container.innerHTML = `
        <div class="flex flex-col gap-6">
          
          <!-- Header Beranda Peserta -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col gap-1 max-w-3xl">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                  PLN Impact Lab (PIL)
                </span>
                <span class="text-xs text-[#64748B] font-mono">#EV3-MTR-2024.1</span>
                <span class="text-xs text-[#94A3B8]">•</span>
                <span class="text-xs text-[#64748B]">Portal Evaluasi Mandiri Pegawai</span>
              </div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">
                Beranda Peserta: ${respondent.nama}
              </h1>
              <p class="text-xs md:text-sm text-[#64748B] leading-relaxed">
                Asesmen Implementasi Perilaku Kerja (Kirkpatrick Level 3 Behavior) pasca pembelajaran Program Penurunan Susut Distribusi Tenaga Listrik UP3 Metro.
              </p>
            </div>

            <!-- Tombol CTA Utama -->
            <div class="flex items-center gap-2 shrink-0">
              <button id="btn-goto-formulir" class="btn-primary text-xs py-2 px-4 shadow-sm flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">edit_document</span>
                ${progress.isComplete ? 'Lihat / Perbarui Formulir' : 'Lanjutkan Pengisian Formulir'}
              </button>
            </div>
          </div>

          <!-- Section 1: Data Profil Peserta & Penilai -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            <!-- Kartu Identitas Peserta (2 Kolom) -->
            <div class="lg:col-span-2 bg-white p-5 rounded-lg border border-[#CBD5E1] shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-3">
                  <div class="flex items-center gap-2.5">
                    <div id="btn-peserta-avatar" class="relative group cursor-pointer w-10 h-10 rounded-full bg-[#172B3A] text-white flex items-center justify-center font-bold text-sm overflow-hidden ring-2 ring-transparent hover:ring-[#006876] transition-all" title="Klik untuk mengubah avatar">
                      ${(respondent.avatar || (user && user.avatar))
                        ? `<img src="${respondent.avatar || user.avatar}" alt="${respondent.nama}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.textContent='${respondent.nama.charAt(0)}';" />`
                        : respondent.nama.charAt(0)}
                      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span class="material-symbols-outlined text-[14px] text-white">photo_camera</span>
                      </div>
                    </div>
                    <div>
                      <h2 class="text-sm font-bold text-[#172B3A] leading-tight">${respondent.nama}</h2>
                      <span class="text-xs text-[#64748B] font-mono">NIP: ${respondent.nip}</span>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                    Peserta Terdaftar
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div class="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                    <span class="text-[11px] text-[#64748B] block">Unit Kerja Pelayanan</span>
                    <span class="font-bold text-[#172B3A] text-xs">${respondent.unit}</span>
                  </div>
                  <div class="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                    <span class="text-[11px] text-[#64748B] block">Jabatan / Posisi</span>
                    <span class="font-medium text-[#172B3A] text-xs truncate block" title="${respondent.jabatan}">${respondent.jabatan}</span>
                  </div>
                  <div class="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                    <span class="text-[11px] text-[#64748B] block">Atasan Langsung (Penilai 1)</span>
                    <span class="font-bold text-[#172B3A] text-xs">${respondent.atasan.nama}</span>
                    <span class="text-[10px] text-[#64748B] font-mono block">NIP: ${respondent.atasan.nip}</span>
                  </div>
                  <div class="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                    <span class="text-[11px] text-[#64748B] block">Koordinator Program (Penilai 2)</span>
                    <span class="font-bold text-[#172B3A] text-xs">${respondent.koordinatorEksternal.nama}</span>
                    <span class="text-[10px] text-[#64748B] font-mono block">NIP: ${respondent.koordinatorEksternal.nip}</span>
                  </div>
                </div>
              </div>

              <!-- Modul Pembelajaran Diikuti -->
              <div class="mt-4 pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span class="text-[#64748B] font-medium">Modul Pembelajaran yang Diikuti:</span>
                <div class="flex items-center gap-1.5">
                  ${respondent.modules.map(m => {
                    const modInfo = window.MASTER_DATA.bankButir[m];
                    return `
                      <span class="px-2 py-1 rounded bg-[#172B3A] text-white font-mono font-bold text-[11px]" title="${modInfo ? modInfo.title : ''}">
                        Bagian ${m}
                      </span>
                    `;
                  }).join('')}
                  <span class="text-[11px] text-[#64748B] ml-1">(${progress.total} Butir Indikator)</span>
                </div>
              </div>
            </div>

            <!-- Kartu Progress Form (1 Kolom) -->
            <div class="bg-white p-5 rounded-lg border border-[#CBD5E1] shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between pb-2 border-b border-[#F1F5F9] mb-3">
                  <span class="text-xs font-bold text-[#172B3A] uppercase tracking-wider">Status Pengisian Form</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    progress.status === 'SELESAI' 
                      ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]' 
                      : progress.filled > 0 
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]' 
                      : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                  }">
                    ${progress.status === 'SELESAI' ? '✓ Lengkap / Terkirim' : progress.filled > 0 ? 'Sedang Draf' : 'Belum Diisi'}
                  </span>
                </div>

                <div class="text-center py-2">
                  <div class="text-3xl font-bold font-tabular text-[#006876]">
                    ${progress.percentage}%
                  </div>
                  <div class="text-xs text-[#64748B] mt-0.5">
                    ${progress.filled} dari ${progress.total} Butir Telah Dinilai
                  </div>
                </div>

                <!-- Progress Bar Animasi -->
                <div class="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden mt-3 mb-4">
                  <div class="bg-gradient-to-r from-[#23C4DB] to-[#006876] h-full rounded-full progress-bar-animated" style="width: ${progress.percentage}%"></div>
                </div>

                <div class="space-y-2 text-xs">
                  <div class="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span class="text-[#64748B] flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[16px] text-[#006876]">task_alt</span>
                      Skala Butir Terisi
                    </span>
                    <span class="font-bold text-[#172B3A] font-tabular">${progress.filled} / ${progress.total}</span>
                  </div>

                  <div class="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span class="text-[#64748B] flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[16px] text-[#2563EB]">attach_file</span>
                      Bukti Terunggah (JPG/PNG/PDF)
                    </span>
                    <span class="font-bold text-[#172B3A] font-tabular">${progress.filesCount} File</span>
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-[#F1F5F9]">
                <button id="btn-quick-fill" class="w-full btn-primary justify-center text-xs py-2">
                  <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                  Buka Formulir Evaluasi
                </button>
              </div>
            </div>

          </div>

          <!-- Section 2: Bank Butir Instrumen Sesuai Modul Peserta -->
          <div class="bg-white rounded-lg border border-[#CBD5E1] shadow-sm overflow-hidden flex flex-col">
            
            <div class="p-4 border-b border-[#CBD5E1] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-bold text-[#172B3A] uppercase tracking-wider">
                  Bank Butir Instrumen Pembelajaran
                </h2>
                <p class="text-xs text-[#64748B]">
                  Daftar butir indikator perilaku dan bukti dokumen wajib sesuai modul yang Anda ikuti
                </p>
              </div>

              <!-- Module Filter Tabs for Participant -->
              <div class="flex items-center gap-1 bg-[#E2E8F0] p-1 rounded text-xs">
                ${respondent.modules.map(modCode => {
                  const isActive = this.activeModTab === modCode;
                  return `
                    <button type="button" class="tab-peserta-mod py-1 px-3 rounded font-semibold transition-colors ${
                      isActive ? 'bg-[#172B3A] text-white shadow-sm' : 'text-[#475569] hover:bg-white'
                    }" data-mod="${modCode}">
                      Bagian ${modCode}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Content Modul Aktif -->
            <div class="p-5">
              ${(() => {
                const curMod = window.MASTER_DATA.bankButir[this.activeModTab];
                if (!curMod) return '<p class="text-xs text-[#64748B]">Modul tidak ditemukan.</p>';

                return `
                  <div class="space-y-4">
                    
                    <!-- Info Silabus Modul -->
                    <div class="p-3.5 bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-[#006876] text-white">
                          Bagian ${curMod.code}
                        </span>
                        <span class="text-xs font-bold text-[#004D57]">
                          ${curMod.title}
                        </span>
                      </div>
                      <div class="flex flex-wrap items-center gap-3 text-[11px] text-[#0F766E] font-mono mt-1">
                        <span>Kode Diklat: ${curMod.kodeDiklat}</span>
                        <span>•</span>
                        <span>Key Behavior: ${curMod.keybe}</span>
                        <span>•</span>
                        <span>Jumlah Butir: ${curMod.items.length} Indikator</span>
                      </div>
                    </div>

                    <!-- List Butir Indikator -->
                    <div class="space-y-3">
                      ${curMod.items.map((item, idx) => {
                        const userScore = ev.peserta?.scores?.[item.id];
                        const userFile = ev.peserta?.files?.[item.id];
                        const isFilled = userScore !== undefined && userScore !== null;

                        return `
                          <div class="p-4 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#CBD5E1] transition-all space-y-2">
                            <div class="flex items-start justify-between gap-3">
                              <div class="flex items-start gap-2.5">
                                <span class="px-2 py-1 rounded bg-[#E2E8F0] font-mono font-bold text-xs text-[#172B3A] shrink-0">
                                  ${item.id}
                                </span>
                                <div>
                                  <div class="text-[11px] font-bold uppercase tracking-wider text-[#006876]">
                                    ${item.kompetensi}
                                  </div>
                                  <h3 class="text-xs font-semibold text-[#172B3A] mt-0.5 leading-relaxed">
                                    ${item.perilaku}
                                  </h3>
                                </div>
                              </div>

                              <!-- Status Pengisian Butir -->
                              <div class="shrink-0 text-right">
                                ${isFilled ? `
                                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                                    <span class="material-symbols-outlined text-[12px]">check</span> Skala ${userScore}
                                  </span>
                                ` : `
                                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                                    Belum Diisi
                                  </span>
                                `}
                              </div>
                            </div>

                            <!-- Keterangan & Bukti Dukung -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#F1F5F9] text-[11px]">
                              <div class="flex items-center gap-1.5 text-[#64748B]">
                                <span class="material-symbols-outlined text-[15px] text-[#D97706]">description</span>
                                <span>Contoh Bukti: <b>${item.contohBukti}</b></span>
                              </div>
                              <div class="flex items-center gap-1.5 text-[#64748B] sm:justify-end">
                                <span class="material-symbols-outlined text-[15px] text-[#2563EB]">attach_file</span>
                                <span>File Bukti: ${userFile ? `<b>${userFile.name}</b>` : '<span class="text-[#94A3B8]">Belum diunggah</span>'}</span>
                              </div>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>

                  </div>
                `;
              })()}
            </div>

          </div>

        </div>
      `;

      this.attachEvents(container);
    },

    attachEvents: function (container) {
      // Tab switcher Bank Butir
      container.querySelectorAll('.tab-peserta-mod').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.activeModTab = e.currentTarget.getAttribute('data-mod');
          this.render(container);
        });
      });

      // Navigasi ke Halaman Formulir
      const goToForm = () => {
        if (window.FormulirView) {
          window.FormulirView.isReadOnly = false;
        }
        window.appStore.setView('formulir');
      };

      container.querySelector('#btn-goto-formulir')?.addEventListener('click', goToForm);
      container.querySelector('#btn-quick-fill')?.addEventListener('click', goToForm);

      // Trigger Modal Ubah Avatar Peserta
      container.querySelector('#btn-peserta-avatar')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.AvatarManager && typeof window.AvatarManager.openAvatarModal === 'function') {
          window.AvatarManager.openAvatarModal({
            onSave: () => this.render(container)
          });
        }
      });
    }
  };
})();
