/**
 * View: Manajemen Program Pembelajaran & Periode Evaluasi
 * Evaluasi Level 3 — PLN Impact Lab (PIL)
 * Mencakup Program Terpusat dan Siklus Periode Evaluasi
 */

(function () {
  window.AdminProgramView = {
    activeTab: 'periode', // 'periode' | 'program'
    periodSearchQuery: '',
    programSearchQuery: '',
    selectedStatusFilter: 'ALL',
    selectedProgStatusFilter: 'ALL',

    getModalContainer: function () {
      let modalContainer = document.getElementById('prog-modal-container');
      if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'prog-modal-container';
        document.body.appendChild(modalContainer);
      } else if (modalContainer.parentElement !== document.body) {
        document.body.appendChild(modalContainer);
      }
      return modalContainer;
    },

    render: function (container) {
      const programs = window.appStore.getPrograms();
      const periods = window.appStore.getPeriods();
      const activePeriod = window.appStore.getActivePeriod();
      const allRespondents = window.appStore.getRespondents ? window.appStore.getRespondents() : (window.appStore.respondents || []);

      // Hitung metrik realtime untuk activePeriod
      let activeRespCount = 0;
      let activeCompletionRate = 0;
      if (activePeriod) {
        const activePeriodResp = allRespondents.filter(r => r.periodId === activePeriod.id);
        activeRespCount = activePeriodResp.length;
        let completed = 0;
        activePeriodResp.forEach(r => {
          const ev = window.appStore.getEvaluation ? window.appStore.getEvaluation(r.id) : null;
          if (r.status === 'LENGKAP' || (ev && ev.peserta?.status === 'SELESAI' && ev.atasan?.status === 'SELESAI' && ev.koordinator?.status === 'SELESAI')) {
            completed++;
          }
        });
        activeCompletionRate = activeRespCount > 0 ? Math.round((completed / activeRespCount) * 100) : 0;
      }

      // Hitung metrik
      const allUpdls = window.appStore.getUpdls ? window.appStore.getUpdls() : [];
      let activeUpdlNames = 'Belum diatur';
      if (activePeriod && Array.isArray(activePeriod.updlIds) && activePeriod.updlIds.length > 0) {
        const matched = allUpdls.filter(u => activePeriod.updlIds.includes(u.id));
        activeUpdlNames = matched.length > 0 ? matched.map(u => u.nama).join(', ') : `${activePeriod.updlIds.length} UPDL`;
      }
      const activePeriodsCount = periods.filter(p => p.status === 'AKTIF').length;
      const closedPeriodsCount = periods.filter(p => p.status === 'DITUTUP').length;
      const activeProgramsCount = programs.filter(p => p.status === 'AKTIF').length;

      container.innerHTML = `
        <div class="flex flex-col gap-6 animate-fadeIn">
          
          <!-- Page Header -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col gap-1 max-w-3xl">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                  Evaluasi Level 3 — PLN Impact Lab (PIL)
                </span>
                <span class="text-xs text-[#64748B] font-mono">Modul Penjadwalan & Siklus</span>
              </div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">
                Program Pembelajaran & Periode Evaluasi
              </h1>
              <p class="text-xs md:text-sm text-[#64748B] leading-relaxed">
                Kelola master program pembelajaran terpusat yang diampu oleh berbagai UPDL, serta buat dan pantau siklus periode pengisian evaluasi pasca pembelajaran di lapangan.
              </p>
            </div>

            <!-- Toolbar Actions -->
            <div class="flex flex-wrap items-center gap-2">
              <button id="btn-add-program-action" class="btn-secondary">
                <span class="material-symbols-outlined text-[16px]">school</span>
                + Buat Program
              </button>
              <button id="btn-add-period-action" class="btn-primary">
                <span class="material-symbols-outlined text-[16px]">date_range</span>
                + Buat Periode Evaluasi
              </button>
            </div>
          </div>

          <!-- Highlight Periode Aktif Banner -->
          ${activePeriod ? `
            <div class="p-4 rounded-xl bg-gradient-to-r from-[#172B3A] to-[#1E3A52] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md border border-[#23C4DB]/30">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#23C4DB] text-[#172B3A] uppercase tracking-wider">
                    Periode Aktif Saat Ini
                  </span>
                  <span class="font-mono text-xs text-[#94A3B8]">${activePeriod.kode}</span>
                </div>
                <h3 class="text-lg font-bold">${activePeriod.nama}</h3>
                <p class="text-xs text-[#CBD5E1]">${activePeriod.deskripsi || 'Siklus evaluasi penerapan perilaku kerja sedang berjalan.'}</p>
                <div class="flex items-center gap-4 text-xs text-[#94A3B8] pt-1">
                  <span>Mulai: <b class="text-white">${activePeriod.tanggalMulai}</b></span>
                  <span>Tenggat: <b class="text-white">${activePeriod.tenggatPengisian || 'Belum diatur'}</b></span>
                  <span>Partisipasi: <b class="text-white">${activeUpdlNames}</b></span>
                </div>
              </div>

              <div class="flex items-center gap-4 bg-white/10 p-3 rounded-lg border border-white/10 shrink-0">
                <div class="text-center">
                  <div class="text-2xl font-black text-[#23C4DB]">${activeRespCount}</div>
                  <div class="text-[10px] uppercase tracking-wider text-[#CBD5E1]">Responden</div>
                </div>
                <div class="h-8 w-px bg-white/20"></div>
                <div class="text-center">
                  <div class="text-2xl font-black text-[#10B981]">${activeCompletionRate}%</div>
                  <div class="text-[10px] uppercase tracking-wider text-[#CBD5E1]">Progres</div>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Metric Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Program</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#172B3A]">${programs.length}</span>
                <span class="text-[11px] font-medium text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">${activeProgramsCount} Aktif</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Periode</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#172B3A]">${periods.length}</span>
                <span class="text-[11px] font-medium text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full">${activePeriodsCount} Berjalan</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Periode Selesai / Ditutup</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#172B3A]">${closedPeriodsCount}</span>
                <span class="text-[11px] font-medium text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded-full">Diarsipkan</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Cakupan Evaluasi</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#172B3A]">3</span>
                <span class="text-[11px] font-medium text-[#6B21A8] bg-[#F3E8FF] px-2 py-0.5 rounded-full">Perspektif Penilai</span>
              </div>
            </div>
          </div>

          <!-- Tab Navigation -->
          <div class="flex border-b border-[#E2E8F0] gap-2">
            <button class="tab-btn px-4 py-2.5 font-medium text-xs md:text-sm transition-all border-b-2 flex items-center gap-1.5 ${this.activeTab === 'periode' ? 'border-[#23C4DB] text-[#0F96A9] font-bold' : 'border-transparent text-[#64748B] hover:text-[#172B3A]'}" data-tab="periode">
              <span class="material-symbols-outlined text-[18px]">date_range</span>
              Periode Evaluasi (${periods.length})
            </button>
            <button class="tab-btn px-4 py-2.5 font-medium text-xs md:text-sm transition-all border-b-2 flex items-center gap-1.5 ${this.activeTab === 'program' ? 'border-[#23C4DB] text-[#0F96A9] font-bold' : 'border-transparent text-[#64748B] hover:text-[#172B3A]'}" data-tab="program">
              <span class="material-symbols-outlined text-[18px]">school</span>
              Program Pembelajaran Terpusat (${programs.length})
            </button>
          </div>

          <!-- Tab Content Area -->
          <div id="prog-tab-content">
            ${this.activeTab === 'periode' ? this.renderPeriodsTable() : this.renderProgramsTable()}
          </div>

        </div>

        <!-- Program & Period Modals -->
        <div id="prog-modal-container"></div>
      `;

      this.attachEventListeners(container);
    },

    // === Render Periods Table ===
    renderPeriodsTable: function () {
      const allPeriods = window.appStore.getPeriods();
      const programs = window.appStore.getPrograms();
      const updls = window.appStore.getUpdls();
      const allRespondents = window.appStore.getRespondents ? window.appStore.getRespondents() : (window.appStore.respondents || []);

      // Filter periode berdasarkan pencarian dan status
      const q = (this.periodSearchQuery || '').toLowerCase().trim();
      const statusF = this.selectedStatusFilter || 'ALL';
      const periods = allPeriods.filter(p => {
        const matchSearch = !q || (p.nama && p.nama.toLowerCase().includes(q)) || (p.kode && p.kode.toLowerCase().includes(q));
        const matchStatus = statusF === 'ALL' || p.status === statusF;
        return matchSearch && matchStatus;
      });

      return `
        <div class="card overflow-hidden">
          <div class="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F8FAFC]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] text-[#0F96A9]">date_range</span>
              <span class="text-xs font-bold text-[#172B3A] uppercase tracking-wide">
                Daftar Siklus Periode Evaluasi Level 3
              </span>
            </div>
            <div class="text-xs text-[#64748B]">
              Menampilkan <b>${periods.length}</b> dari <b>${allPeriods.length}</b> siklus evaluasi
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="p-3 bg-white border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div class="relative w-full sm:w-72">
                <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-[#94A3B8] text-[18px]">search</span>
                <input type="text" id="filter-search-periods" class="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#23C4DB]" placeholder="Cari kode atau nama periode..." value="${this.periodSearchQuery || ''}" />
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs text-[#64748B] font-medium">Status:</span>
                <select id="filter-status-periods" class="text-xs border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#23C4DB]">
                  <option value="ALL" ${statusF === 'ALL' ? 'selected' : ''}>Semua Status</option>
                  <option value="AKTIF" ${statusF === 'AKTIF' ? 'selected' : ''}>AKTIF (Bisa Diisi)</option>
                  <option value="TERJADWAL" ${statusF === 'TERJADWAL' ? 'selected' : ''}>TERJADWAL</option>
                  <option value="DRAFT" ${statusF === 'DRAFT' ? 'selected' : ''}>DRAFT</option>
                  <option value="DITUTUP" ${statusF === 'DITUTUP' ? 'selected' : ''}>DITUTUP (Arsip)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-[#F1F5F9] text-[#475569] font-semibold border-b border-[#CBD5E1]">
                  <th class="py-3 px-4 w-12 text-center">No</th>
                  <th class="py-3 px-4">Kode & Nama Periode</th>
                  <th class="py-3 px-4">Program Terkait</th>
                  <th class="py-3 px-4">Rentang Waktu</th>
                  <th class="py-3 px-4">UPDL Partisipan</th>
                  <th class="py-3 px-4 text-center">Progres Pengisian</th>
                  <th class="py-3 px-4 text-center">Status</th>
                  <th class="py-3 px-4 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                ${periods.length === 0 ? `
                  <tr>
                    <td colspan="8" class="text-center py-8 text-[#94A3B8]">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[32px] text-[#CBD5E1]">calendar_month</span>
                        <span>Tidak ada siklus periode evaluasi yang sesuai kriteria pencarian.</span>
                      </div>
                    </td>
                  </tr>
                ` : periods.map((p, idx) => {
                  const pProgramIds = Array.isArray(p.programIds) && p.programIds.length > 0
                    ? p.programIds
                    : (p.programId ? [p.programId] : []);
                  const linkedProgs = programs.filter(x => pProgramIds.includes(x.id));
                  const linkedUpdls = updls.filter(u => (p.updlIds || []).includes(u.id));
                  const statusColors = {
                    AKTIF: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
                    TERJADWAL: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
                    DRAFT: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]',
                    DITUTUP: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                  };
                  const badgeClass = statusColors[p.status] || 'bg-slate-100 text-slate-700';

                  // Hitung responden dan progres realtime
                  const pResp = allRespondents.filter(r => r.periodId === p.id);
                  const pRespCount = pResp.length;
                  let pCompleted = 0;
                  pResp.forEach(r => {
                    const ev = window.appStore.getEvaluation ? window.appStore.getEvaluation(r.id) : null;
                    if (r.status === 'LENGKAP' || (ev && ev.peserta?.status === 'SELESAI' && ev.atasan?.status === 'SELESAI' && ev.koordinator?.status === 'SELESAI')) {
                      pCompleted++;
                    }
                  });
                  const pCompletionRate = pRespCount > 0 ? Math.round((pCompleted / pRespCount) * 100) : 0;

                  return `
                    <tr class="hover:bg-[#F8FAFC] transition-colors">
                      <td class="py-3 px-4 text-center font-mono text-[#64748B]">${idx + 1}</td>
                      <td class="py-3 px-4">
                        <div class="font-mono font-bold text-[#0F96A9]">${p.kode}</div>
                        <div class="font-semibold text-[#172B3A]">${p.nama}</div>
                      </td>
                      <td class="py-3 px-4">
                        ${linkedProgs.length === 0 ? `
                          <span class="text-[#94A3B8] italic text-xs">(Belum ada program)</span>
                        ` : linkedProgs.length === 1 ? `
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                            <span class="material-symbols-outlined text-[14px]">school</span>
                            [${linkedProgs[0].kode || 'PROG'}] ${linkedProgs[0].nama}
                          </span>
                        ` : `
                          <div class="flex flex-col gap-1">
                            <div class="flex flex-wrap items-center gap-1 max-w-sm">
                              ${linkedProgs.map(prog => `
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]" title="${prog.nama}">
                                  ${prog.kode || prog.nama}
                                </span>
                              `).join('')}
                            </div>
                            <span class="text-[10px] text-[#0F96A9] font-bold flex items-center gap-1">
                              <span class="material-symbols-outlined text-[13px]">layers</span>
                              ${linkedProgs.length} Program Pembelajaran Terikat
                            </span>
                          </div>
                        `}
                      </td>
                      <td class="py-3 px-4 text-[#475569]">
                        <div>Mulai: <b>${p.tanggalMulai}</b></div>
                        <div>Tenggat: <b>${p.tenggatPengisian || '-'}</b></div>
                      </td>
                      <td class="py-3 px-4 text-[#475569]">
                        ${linkedUpdls.length === 0 ? `
                          <span class="text-[#94A3B8] italic text-xs">(Semua UPDL)</span>
                        ` : `
                          <div class="flex flex-wrap gap-1">
                            ${linkedUpdls.map(u => `
                              <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1]">
                                ${u.nama}
                              </span>
                            `).join('')}
                          </div>
                        `}
                      </td>
                      <td class="py-3 px-4 text-center">
                        <div class="w-full max-w-[120px] mx-auto space-y-1">
                          <div class="flex justify-between text-[10px] text-[#64748B]">
                            <span>${pRespCount} user</span>
                            <span class="font-bold text-[#172B3A]">${pCompletionRate}%</span>
                          </div>
                          <div class="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                            <div class="bg-[#23C4DB] h-1.5 rounded-full" style="width: ${pCompletionRate}%"></div>
                          </div>
                        </div>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}">
                          ${p.status}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <div class="inline-flex items-center gap-1">
                          <button class="btn-action-edit-period p-1 hover:bg-[#E0F2FE] text-[#0284C7] rounded" data-id="${p.id}" title="Edit Konfigurasi Periode">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          ${p.status === 'AKTIF' ? `
                            <button class="btn-action-close-period p-1 hover:bg-[#FEF3C7] text-[#D97706] rounded" data-id="${p.id}" title="Tutup & Arsipkan Periode">
                              <span class="material-symbols-outlined text-[18px]">lock</span>
                            </button>
                          ` : `
                            <button class="btn-action-activate-period p-1 hover:bg-[#ECFDF5] text-[#059669] rounded" data-id="${p.id}" title="Aktifkan Periode Evaluasi">
                              <span class="material-symbols-outlined text-[18px]">play_circle</span>
                            </button>
                          `}
                          <button class="btn-action-delete-period p-1 hover:bg-[#FEE2E2] text-[#DC2626] rounded transition-colors" data-id="${p.id}" title="Hapus Periode">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // === Render Programs Table ===
    renderProgramsTable: function () {
      const allPrograms = window.appStore.getPrograms();
      const periods = window.appStore.getPeriods();
      const updls = window.appStore.getUpdls();

      // Filter program berdasarkan pencarian dan status
      const q = (this.programSearchQuery || '').toLowerCase().trim();
      const statusF = this.selectedProgStatusFilter || 'ALL';
      const programs = allPrograms.filter(prog => {
        const matchSearch = !q || (prog.nama && prog.nama.toLowerCase().includes(q)) || (prog.kode && prog.kode.toLowerCase().includes(q));
        const matchStatus = statusF === 'ALL' || prog.status === statusF;
        return matchSearch && matchStatus;
      });

      return `
        <div class="card overflow-hidden">
          <div class="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F8FAFC]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] text-[#0F96A9]">school</span>
              <span class="text-xs font-bold text-[#172B3A] uppercase tracking-wide">
                Katalog Master Program Pembelajaran Terpusat
              </span>
            </div>
            <div class="text-xs text-[#64748B]">
              Menampilkan <b>${programs.length}</b> dari <b>${allPrograms.length}</b> program terdaftar
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="p-3 bg-white border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div class="relative w-full sm:w-72">
                <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-[#94A3B8] text-[18px]">search</span>
                <input type="text" id="filter-search-programs" class="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#23C4DB]" placeholder="Cari kode atau nama program..." value="${this.programSearchQuery || ''}" />
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs text-[#64748B] font-medium">Status:</span>
                <select id="filter-status-programs" class="text-xs border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#23C4DB]">
                  <option value="ALL" ${statusF === 'ALL' ? 'selected' : ''}>Semua Status</option>
                  <option value="AKTIF" ${statusF === 'AKTIF' ? 'selected' : ''}>AKTIF</option>
                  <option value="NONAKTIF" ${statusF === 'NONAKTIF' ? 'selected' : ''}>NONAKTIF</option>
                </select>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-[#F1F5F9] text-[#475569] font-semibold border-b border-[#CBD5E1]">
                  <th class="py-3 px-4 w-12 text-center">No</th>
                  <th class="py-3 px-4">Kode Program</th>
                  <th class="py-3 px-4">Nama Program & Penyelenggara</th>
                  <th class="py-3 px-4">Deskripsi Sasaran</th>
                  <th class="py-3 px-4">UPDL Pengampu</th>
                  <th class="py-3 px-4 text-center">Periode Terkait</th>
                  <th class="py-3 px-4 text-center">Status</th>
                  <th class="py-3 px-4 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                ${programs.length === 0 ? `
                  <tr>
                    <td colspan="8" class="text-center py-8 text-[#94A3B8]">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[32px] text-[#CBD5E1]">school</span>
                        <span>Tidak ada katalog program pembelajaran yang sesuai kriteria pencarian.</span>
                      </div>
                    </td>
                  </tr>
                ` : programs.map((prog, idx) => {
                  const linkedPeriodsCount = periods.filter(p => (Array.isArray(p.programIds) && p.programIds.length > 0 ? p.programIds.includes(prog.id) : p.programId === prog.id)).length;
                  const progUpdls = updls.filter(u => (prog.updlIds || []).includes(u.id));
                  const isAktif = prog.status === 'AKTIF';
                  return `
                    <tr class="hover:bg-[#F8FAFC] transition-colors">
                      <td class="py-3 px-4 text-center font-mono text-[#64748B]">${idx + 1}</td>
                      <td class="py-3 px-4 font-mono font-bold text-[#0F96A9]">${prog.kode}</td>
                      <td class="py-3 px-4">
                        <div class="font-semibold text-[#172B3A]">${prog.nama}</div>
                        <div class="text-[11px] text-[#64748B]">${prog.penyelenggara || 'PLN Corporate University'}</div>
                      </td>
                      <td class="py-3 px-4 text-[#475569] max-w-xs">
                        <div class="truncate">${prog.deskripsi || '-'}</div>
                      </td>
                      <td class="py-3 px-4 text-[#475569]">
                        ${progUpdls.length === 0 ? `
                          <span class="text-[#94A3B8] italic text-xs">(Semua UPDL)</span>
                        ` : `
                          <div class="flex flex-wrap gap-1">
                            ${progUpdls.map(u => `
                              <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1]">
                                ${u.nama}
                              </span>
                            `).join('')}
                          </div>
                        `}
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                          ${linkedPeriodsCount} Siklus
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isAktif ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'}">
                          ${prog.status}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <div class="inline-flex items-center gap-1">
                          <button class="btn-action-edit-program p-1 hover:bg-[#E0F2FE] text-[#0284C7] rounded" data-id="${prog.id}" title="Edit Data Program">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button class="btn-action-toggle-program p-1 hover:bg-[#FEE2E2] ${isAktif ? 'text-[#DC2626]' : 'text-[#059669]'} rounded" data-id="${prog.id}" title="${isAktif ? 'Nonaktifkan Program' : 'Aktifkan Program'}">
                            <span class="material-symbols-outlined text-[18px]">${isAktif ? 'toggle_on' : 'toggle_off'}</span>
                          </button>
                          <button class="btn-action-delete-program p-1 hover:bg-[#FEE2E2] text-[#DC2626] rounded transition-colors" data-id="${prog.id}" title="Hapus Program">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // === Event Listeners ===
    attachEventListeners: function (container) {
      container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activeTab = btn.getAttribute('data-tab');
          this.render(container);
        });
      });

      const addProgramBtn = container.querySelector('#btn-add-program-action');
      if (addProgramBtn) {
        addProgramBtn.addEventListener('click', () => this.showProgramModal());
      }

      const addPeriodBtn = container.querySelector('#btn-add-period-action');
      if (addPeriodBtn) {
        addPeriodBtn.addEventListener('click', () => this.showPeriodModal());
      }

      this.attachRowActionListeners(container);
    },

    attachRowActionListeners: function (container) {
      // Search and Filter Periode
      const periodSearchInput = container.querySelector('#filter-search-periods');
      if (periodSearchInput) {
        periodSearchInput.addEventListener('input', (e) => {
          this.periodSearchQuery = e.target.value;
          const contentArea = container.querySelector('#prog-tab-content');
          if (contentArea) {
            contentArea.innerHTML = this.renderPeriodsTable();
            this.attachRowActionListeners(container);
          }
        });
      }

      const periodStatusSelect = container.querySelector('#filter-status-periods');
      if (periodStatusSelect) {
        periodStatusSelect.addEventListener('change', (e) => {
          this.selectedStatusFilter = e.target.value;
          const contentArea = container.querySelector('#prog-tab-content');
          if (contentArea) {
            contentArea.innerHTML = this.renderPeriodsTable();
            this.attachRowActionListeners(container);
          }
        });
      }

      // Search and Filter Program
      const progSearchInput = container.querySelector('#filter-search-programs');
      if (progSearchInput) {
        progSearchInput.addEventListener('input', (e) => {
          this.programSearchQuery = e.target.value;
          const contentArea = container.querySelector('#prog-tab-content');
          if (contentArea) {
            contentArea.innerHTML = this.renderProgramsTable();
            this.attachRowActionListeners(container);
          }
        });
      }

      const progStatusSelect = container.querySelector('#filter-status-programs');
      if (progStatusSelect) {
        progStatusSelect.addEventListener('change', (e) => {
          this.selectedProgStatusFilter = e.target.value;
          const contentArea = container.querySelector('#prog-tab-content');
          if (contentArea) {
            contentArea.innerHTML = this.renderProgramsTable();
            this.attachRowActionListeners(container);
          }
        });
      }

      // Edit Period
      container.querySelectorAll('.btn-action-edit-period').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.showPeriodModal(id);
        });
      });

      // Close Period
      container.querySelectorAll('.btn-action-close-period').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          if (confirm('Tutup dan arsipkan periode evaluasi ini? Responden tidak dapat mengisi lagi setelah ditutup.')) {
            try {
              window.appStore.setPeriodStatus(id, 'DITUTUP');
              this.showToast('Periode berhasil ditutup dan diarsipkan.', 'success');
              this.render(container);
            } catch (err) {
              this.showToast(err.message, 'error');
            }
          }
        });
      });

      // Activate Period
      container.querySelectorAll('.btn-action-activate-period').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          try {
            window.appStore.setPeriodStatus(id, 'AKTIF');
            this.showToast('Periode evaluasi berhasil diaktifkan.', 'success');
            this.render(container);
          } catch (err) {
            this.showToast(err.message, 'error');
          }
        });
      });

      // Delete Period
      container.querySelectorAll('.btn-action-delete-period').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const p = window.appStore.getPeriodById(id);
          const name = p ? p.nama : 'periode ini';
          if (confirm(`Apakah Anda yakin ingin menghapus siklus evaluasi "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
            try {
              window.appStore.deletePeriod(id);
              this.showToast('Periode evaluasi berhasil dihapus.', 'success');
              this.render(container);
            } catch (err) {
              this.showToast(err.message, 'error');
            }
          }
        });
      });

      // Edit Program
      container.querySelectorAll('.btn-action-edit-program').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.showProgramModal(id);
        });
      });

      // Toggle Program Status
      container.querySelectorAll('.btn-action-toggle-program').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          try {
            window.appStore.toggleProgramStatus(id);
            this.showToast('Status program berhasil diperbarui.', 'success');
            this.render(container);
          } catch (err) {
            this.showToast(err.message, 'error');
          }
        });
      });

      // Delete Program
      container.querySelectorAll('.btn-action-delete-program').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const prog = window.appStore.getProgramById(id);
          const name = prog ? prog.nama : 'program ini';
          if (confirm(`Apakah Anda yakin ingin menghapus master program "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
            try {
              window.appStore.deleteProgram(id);
              this.showToast('Master program pembelajaran berhasil dihapus.', 'success');
              this.render(container);
            } catch (err) {
              this.showToast(err.message, 'error');
            }
          }
        });
      });
    },

    // === Modal Program ===
    showProgramModal: function (progId = null) {
      const modalContainer = this.getModalContainer();
      if (!modalContainer) return;

      const updls = window.appStore.getUpdls();
      const isEdit = !!progId;
      const prog = isEdit ? window.appStore.getProgramById(progId) : {
        kode: '',
        nama: '',
        deskripsi: '',
        penyelenggara: 'PLN Corporate University',
        updlIds: updls.map(u => u.id),
        status: 'AKTIF',
        koordinatorEksternal: {
          nama: '',
          nip: '',
          jabatan: 'Koordinator Eksternal / UPDL'
        },
        koordinatorInternal: {
          nama: '',
          nip: '',
          jabatan: 'Koordinator Internal Unit'
        }
      };

      const extCoord = prog.koordinatorEksternal || { nama: '', nip: '', jabatan: 'Koordinator Eksternal / UPDL' };
      const intCoord = prog.koordinatorInternal || { nama: '', nip: '', jabatan: 'Koordinator Internal Unit' };
      const progUpdlIds = Array.isArray(prog.updlIds) && prog.updlIds.length > 0 ? prog.updlIds : updls.map(u => u.id);

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between shrink-0">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">school</span>
                ${isEdit ? 'Edit Program Pembelajaran' : 'Buat Program Pembelajaran Baru'}
              </h3>
              <button id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form id="form-modal-program" class="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Kode Program (Unik) <span class="text-red-500">*</span></label>
                  <input type="text" id="prog-input-kode" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono uppercase focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: PIL-MAINTENANCE" value="${prog.kode || ''}" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Status</label>
                  <select id="prog-input-status" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none">
                    <option value="AKTIF" ${prog.status === 'AKTIF' ? 'selected' : ''}>AKTIF</option>
                    <option value="NONAKTIF" ${prog.status === 'NONAKTIF' ? 'selected' : ''}>NONAKTIF</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Nama Program Pembelajaran <span class="text-red-500">*</span></label>
                <input type="text" id="prog-input-nama" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: Pemeliharaan Gardu Listrik Optimasi Distribusi" value="${prog.nama || ''}" />
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Penyelenggara / Corporate University</label>
                <input type="text" id="prog-input-penyelenggara" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="PLN Corporate University" value="${prog.penyelenggara || ''}" />
              </div>

              <!-- UPDL Penyelenggara / Pengampu -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block font-semibold text-[#172B3A]">
                    UPDL Pengampu / Penyelenggara <span class="text-red-500">*</span>
                  </label>
                  <div class="flex items-center gap-2">
                    <button type="button" id="btn-prog-select-all-updls" class="text-[10px] font-bold text-[#0F96A9] hover:underline cursor-pointer">
                      Pilih Semua
                    </button>
                    <span class="text-[#CBD5E1]">|</span>
                    <button type="button" id="btn-prog-clear-all-updls" class="text-[10px] font-bold text-[#64748B] hover:underline cursor-pointer">
                      Reset
                    </button>
                  </div>
                </div>

                <div class="border border-[#CBD5E1] rounded-lg p-2 bg-[#F8FAFC] space-y-1.5 max-h-32 overflow-y-auto">
                  ${updls.length === 0 ? `
                    <div class="text-[11px] text-[#94A3B8] p-2 text-center italic">Belum ada master UPDL terdaftar.</div>
                  ` : updls.map(u => {
                    const isChecked = progUpdlIds.includes(u.id);
                    return `
                      <label class="flex items-center gap-2 p-1.5 rounded bg-white border border-[#E2E8F0] hover:border-[#23C4DB] cursor-pointer">
                        <input type="checkbox" name="prog-updls" value="${u.id}" ${isChecked ? 'checked' : ''} class="prog-updl-checkbox rounded text-[#0F96A9] focus:ring-[#23C4DB] h-4 w-4 border-[#CBD5E1]" />
                        <span class="font-medium text-[#172B3A] text-xs">${u.nama}</span>
                        <span class="font-mono text-[10px] text-[#64748B] ml-1">(${u.kode || u.id})</span>
                      </label>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Koordinator Eksternal Program -->
              <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-2">
                <div class="font-bold text-[#172B3A] text-xs flex items-center justify-between">
                  <span>Koordinator Eksternal (Perwakilan UPDL)</span>
                  <span class="text-[10px] text-[#64748B]">Penjamin mutu evaluasi</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[11px] text-[#64748B] mb-0.5">Nama Koordinator</label>
                    <input type="text" id="prog-input-ext-nama" class="w-full p-2 bg-white border border-[#CBD5E1] rounded text-xs" value="${extCoord.nama || ''}" placeholder="Nama & Gelar Lengkap" />
                  </div>
                  <div>
                    <label class="block text-[11px] text-[#64748B] mb-0.5">NIP Koordinator</label>
                    <input type="text" id="prog-input-ext-nip" class="w-full p-2 bg-white border border-[#CBD5E1] rounded font-mono text-xs" value="${extCoord.nip || ''}" placeholder="Contoh: 8810743Z" />
                  </div>
                </div>
              </div>

              <!-- Koordinator Internal Program -->
              <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-2">
                <div class="font-bold text-[#172B3A] text-xs flex items-center justify-between">
                  <span>Koordinator Internal (Perwakilan Unit Kerja)</span>
                  <span class="text-[10px] text-[#64748B]">Pengampu kurikulum lapangan</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[11px] text-[#64748B] mb-0.5">Nama Koordinator</label>
                    <input type="text" id="prog-input-int-nama" class="w-full p-2 bg-white border border-[#CBD5E1] rounded text-xs" value="${intCoord.nama || ''}" placeholder="Nama & Gelar Lengkap" />
                  </div>
                  <div>
                    <label class="block text-[11px] text-[#64748B] mb-0.5">NIP Koordinator</label>
                    <input type="text" id="prog-input-int-nip" class="w-full p-2 bg-white border border-[#CBD5E1] rounded font-mono text-xs" value="${intCoord.nip || ''}" placeholder="Contoh: 8909014M" />
                  </div>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Deskripsi & Sasaran Pembelajaran</label>
                <textarea id="prog-input-deskripsi" rows="2" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Tuliskan tujuan dan target perilaku kerja...">${prog.deskripsi || ''}</textarea>
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2 shrink-0">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="submit" class="btn-primary">Simpan Program</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const closeModal = () => modalContainer.innerHTML = '';
      modalContainer.querySelector('#modal-close-btn').onclick = closeModal;
      modalContainer.querySelector('#modal-cancel-btn').onclick = closeModal;

      modalContainer.querySelector('#btn-prog-select-all-updls')?.addEventListener('click', () => {
        modalContainer.querySelectorAll('.prog-updl-checkbox').forEach(cb => cb.checked = true);
      });

      modalContainer.querySelector('#btn-prog-clear-all-updls')?.addEventListener('click', () => {
        modalContainer.querySelectorAll('.prog-updl-checkbox').forEach(cb => cb.checked = false);
      });

      modalContainer.querySelector('#form-modal-program').onsubmit = (e) => {
        e.preventDefault();
        try {
          const selectedUpdls = Array.from(modalContainer.querySelectorAll('input[name="prog-updls"]:checked')).map(cb => cb.value);
          const payload = {
            kode: modalContainer.querySelector('#prog-input-kode').value,
            nama: modalContainer.querySelector('#prog-input-nama').value,
            penyelenggara: modalContainer.querySelector('#prog-input-penyelenggara').value,
            deskripsi: modalContainer.querySelector('#prog-input-deskripsi').value,
            status: modalContainer.querySelector('#prog-input-status').value,
            updlIds: selectedUpdls.length > 0 ? selectedUpdls : updls.map(u => u.id),
            koordinatorEksternal: {
              nama: modalContainer.querySelector('#prog-input-ext-nama').value.trim() || 'Koordinator UPDL',
              nip: modalContainer.querySelector('#prog-input-ext-nip').value.trim() || '-',
              jabatan: 'Koordinator Eksternal / UPDL'
            },
            koordinatorInternal: {
              nama: modalContainer.querySelector('#prog-input-int-nama').value.trim() || 'Koordinator Unit',
              nip: modalContainer.querySelector('#prog-input-int-nip').value.trim() || '-',
              jabatan: 'Koordinator Internal Unit'
            }
          };
          if (isEdit) {
            window.appStore.updateProgram(progId, payload);
            this.showToast('Data Program berhasil diperbarui.', 'success');
          } else {
            window.appStore.addProgram(payload);
            this.showToast('Program pembelajaran baru berhasil dibuat.', 'success');
          }
          closeModal();
          const mainContainer = document.getElementById('main-content-area');
          if (mainContainer) this.render(mainContainer);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      };
    },

    // === Modal Period ===
    showPeriodModal: function (periodId = null) {
      const modalContainer = this.getModalContainer();
      if (!modalContainer) return;

      const programs = window.appStore.getPrograms(true);
      const updls = window.appStore.getUpdls();
      const isEdit = !!periodId;
      const period = isEdit ? window.appStore.getPeriodById(periodId) : {
        programIds: programs.length > 0 ? [programs[0].id] : [],
        programId: programs[0] ? programs[0].id : '',
        kode: `#EV3-${new Date().getFullYear()}.${Math.floor(Math.random() * 9 + 1)}`,
        nama: `Siklus Semester I - ${new Date().getFullYear()}`,
        deskripsi: '',
        tanggalMulai: new Date().toISOString().split('T')[0],
        tenggatPengisian: '',
        updlIds: updls.map(u => u.id),
        status: 'AKTIF'
      };

      const initialProgramIds = isEdit && period
        ? (Array.isArray(period.programIds) && period.programIds.length > 0
            ? [...period.programIds]
            : (period.programId ? [period.programId] : []))
        : (programs.length > 0 ? [programs[0].id] : []);

      const initialUpdlIds = isEdit && period
        ? (Array.isArray(period.updlIds) && period.updlIds.length > 0
            ? [...period.updlIds]
            : updls.map(u => u.id))
        : updls.map(u => u.id);

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between shrink-0">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">date_range</span>
                ${isEdit ? 'Edit Periode Evaluasi' : 'Buat Periode Evaluasi Baru'}
              </h3>
              <button type="button" id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form id="form-modal-period" class="p-5 space-y-3.5 text-xs overflow-y-auto">
              
              <!-- Pemilihan Multi-Program Pembelajaran -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block font-semibold text-[#172B3A] text-xs">
                    Program Pembelajaran Terkait <span class="text-red-500">*</span>
                    <span class="text-[10px] font-normal text-[#64748B] ml-1">(Pilih 1 atau lebih)</span>
                  </label>
                  <div class="flex items-center gap-2">
                    <button type="button" id="btn-period-select-all-progs" class="text-[10px] font-bold text-[#0F96A9] hover:underline cursor-pointer">
                      Pilih Semua
                    </button>
                    <span class="text-[#CBD5E1]">|</span>
                    <button type="button" id="btn-period-clear-all-progs" class="text-[10px] font-bold text-[#64748B] hover:underline cursor-pointer">
                      Reset
                    </button>
                  </div>
                </div>

                <div class="border border-[#CBD5E1] rounded-lg p-2 bg-[#F8FAFC] space-y-1.5 max-h-40 overflow-y-auto">
                  ${programs.length === 0 ? `
                    <div class="text-[11px] text-[#94A3B8] p-3 text-center italic">Belum ada master program aktif terdaftar.</div>
                  ` : programs.map(p => {
                    const isChecked = initialProgramIds.includes(p.id);
                    return `
                      <label class="flex items-start gap-2.5 p-2 rounded-md bg-white border border-[#E2E8F0] hover:border-[#23C4DB] cursor-pointer transition-colors select-none">
                        <input type="checkbox" name="period-programs" value="${p.id}" ${isChecked ? 'checked' : ''} class="period-prog-checkbox mt-0.5 rounded text-[#0F96A9] focus:ring-[#23C4DB] h-4 w-4 border-[#CBD5E1] cursor-pointer" />
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between gap-1.5">
                            <span class="font-bold text-[#172B3A] text-xs truncate">${p.nama}</span>
                            <span class="font-mono text-[10px] px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] font-bold rounded border border-[#CBD5E1] shrink-0">${p.kode}</span>
                          </div>
                          <div class="text-[10px] text-[#64748B] truncate mt-0.5">${p.penyelenggara || 'PLN Corporate University'}</div>
                        </div>
                      </label>
                    `;
                  }).join('')}
                </div>

                <div class="flex items-center justify-between text-[11px] mt-1.5 px-0.5">
                  <span class="text-[#64748B]">Terpilih: <b id="period-prog-count" class="text-[#0F96A9] font-bold font-mono">${initialProgramIds.length}</b> Program</span>
                  <span id="period-prog-error" class="text-red-500 font-semibold hidden">⚠️ Pilih minimal 1 program pembelajaran!</span>
                </div>
              </div>

              <!-- Pemilihan Multi-UPDL Partisipan -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block font-semibold text-[#172B3A] text-xs">
                    UPDL Partisipan <span class="text-red-500">*</span>
                    <span class="text-[10px] font-normal text-[#64748B] ml-1">(Pilih unit pelaksana pendidikan)</span>
                  </label>
                  <div class="flex items-center gap-2">
                    <button type="button" id="btn-period-select-all-updls" class="text-[10px] font-bold text-[#0F96A9] hover:underline cursor-pointer">
                      Pilih Semua
                    </button>
                    <span class="text-[#CBD5E1]">|</span>
                    <button type="button" id="btn-period-clear-all-updls" class="text-[10px] font-bold text-[#64748B] hover:underline cursor-pointer">
                      Reset
                    </button>
                  </div>
                </div>

                <div class="border border-[#CBD5E1] rounded-lg p-2 bg-[#F8FAFC] space-y-1.5 max-h-36 overflow-y-auto">
                  ${updls.length === 0 ? `
                    <div class="text-[11px] text-[#94A3B8] p-2 text-center italic">Belum ada master UPDL terdaftar.</div>
                  ` : updls.map(u => {
                    const isChecked = initialUpdlIds.includes(u.id);
                    return `
                      <label class="flex items-center gap-2 p-1.5 rounded bg-white border border-[#E2E8F0] hover:border-[#23C4DB] cursor-pointer select-none">
                        <input type="checkbox" name="period-updls" value="${u.id}" ${isChecked ? 'checked' : ''} class="period-updl-checkbox rounded text-[#0F96A9] focus:ring-[#23C4DB] h-4 w-4 border-[#CBD5E1] cursor-pointer" />
                        <span class="font-medium text-[#172B3A] text-xs">${u.nama}</span>
                        <span class="font-mono text-[10px] text-[#64748B] ml-1">(${u.kode || u.id})</span>
                      </label>
                    `;
                  }).join('')}
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Kode Sesi Evaluasi <span class="text-red-500">*</span></label>
                  <input type="text" id="period-input-kode" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono focus:border-[#23C4DB] focus:outline-none" placeholder="#EV3-MTR-2026.1" value="${period.kode || ''}" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Status Periode <span class="text-red-500">*</span></label>
                  <select id="period-input-status" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none">
                    <option value="DRAFT" ${period.status === 'DRAFT' ? 'selected' : ''}>DRAFT (Persiapan)</option>
                    <option value="TERJADWAL" ${period.status === 'TERJADWAL' ? 'selected' : ''}>TERJADWAL</option>
                    <option value="AKTIF" ${period.status === 'AKTIF' ? 'selected' : ''}>AKTIF (Bisa Diisi)</option>
                    <option value="DITUTUP" ${period.status === 'DITUTUP' ? 'selected' : ''}>DITUTUP (Arsip)</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Nama Periode Evaluasi <span class="text-red-500">*</span></label>
                <input type="text" id="period-input-nama" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Siklus Semester I - 2026" value="${period.nama || ''}" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Tanggal Mulai Pengisian</label>
                  <input type="date" id="period-input-mulai" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" value="${period.tanggalMulai || ''}" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Tenggat Pengisian (Deadline)</label>
                  <input type="date" id="period-input-deadline" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" value="${period.tenggatPengisian || ''}" />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Deskripsi Periode & Petunjuk Umum</label>
                <textarea id="period-input-deskripsi" rows="2" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Catatan atau batasan siklus evaluasi ini...">${period.deskripsi || ''}</textarea>
              </div>

              <div class="pt-4 border-t border-[#E2E8F0] flex justify-end gap-2 shrink-0">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="submit" class="btn-primary">Simpan Periode</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const closeModal = () => {
        modalContainer.innerHTML = '';
        window.ModalHelper?.unlockScroll();
      };
      const closeBtn = modalContainer.querySelector('#modal-close-btn');
      if (closeBtn) closeBtn.onclick = closeModal;
      const cancelBtn = modalContainer.querySelector('#modal-cancel-btn');
      if (cancelBtn) cancelBtn.onclick = closeModal;

      const backdrop = modalContainer.querySelector('.fixed.inset-0');
      if (backdrop) {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) closeModal();
        });
      }

      // Handler interaktif multi-select Program
      const updateProgCount = () => {
        const checkedCount = modalContainer.querySelectorAll('input[name="period-programs"]:checked').length;
        const countEl = modalContainer.querySelector('#period-prog-count');
        const errEl = modalContainer.querySelector('#period-prog-error');
        if (countEl) countEl.textContent = checkedCount;
        if (errEl && checkedCount > 0) errEl.classList.add('hidden');
      };

      modalContainer.querySelectorAll('.period-prog-checkbox').forEach(cb => {
        cb.addEventListener('change', updateProgCount);
      });

      modalContainer.querySelector('#btn-period-select-all-progs')?.addEventListener('click', () => {
        modalContainer.querySelectorAll('.period-prog-checkbox').forEach(cb => cb.checked = true);
        updateProgCount();
      });

      modalContainer.querySelector('#btn-period-clear-all-progs')?.addEventListener('click', () => {
        modalContainer.querySelectorAll('.period-prog-checkbox').forEach(cb => cb.checked = false);
        updateProgCount();
      });

      // Handler interaktif multi-select UPDL
      modalContainer.querySelector('#btn-period-select-all-updls')?.addEventListener('click', () => {
        modalContainer.querySelectorAll('.period-updl-checkbox').forEach(cb => cb.checked = true);
      });

      modalContainer.querySelector('#btn-period-clear-all-updls')?.addEventListener('click', () => {
        modalContainer.querySelectorAll('.period-updl-checkbox').forEach(cb => cb.checked = false);
      });

      modalContainer.querySelector('#form-modal-period').onsubmit = (e) => {
        e.preventDefault();
        try {
          const checkedCheckboxes = Array.from(modalContainer.querySelectorAll('input[name="period-programs"]:checked'));
          const selectedProgIds = checkedCheckboxes.map(cb => cb.value);

          if (selectedProgIds.length === 0) {
            const errEl = modalContainer.querySelector('#period-prog-error');
            if (errEl) errEl.classList.remove('hidden');
            this.showToast('Pilih minimal 1 program pembelajaran untuk periode evaluasi ini.', 'error');
            return;
          }

          const checkedUpdls = Array.from(modalContainer.querySelectorAll('input[name="period-updls"]:checked')).map(cb => cb.value);
          const tMulai = modalContainer.querySelector('#period-input-mulai').value;
          const tDeadline = modalContainer.querySelector('#period-input-deadline').value;

          if (tMulai && tDeadline && tDeadline < tMulai) {
            throw new Error('Tenggat pengisian tidak boleh lebih awal dari tanggal mulai evaluasi.');
          }

          const payload = {
            programIds: selectedProgIds,
            programId: selectedProgIds[0],
            kode: modalContainer.querySelector('#period-input-kode').value,
            nama: modalContainer.querySelector('#period-input-nama').value,
            status: modalContainer.querySelector('#period-input-status').value,
            tanggalMulai: tMulai,
            tenggatPengisian: tDeadline,
            updlIds: checkedUpdls.length > 0 ? checkedUpdls : updls.map(u => u.id),
            deskripsi: modalContainer.querySelector('#period-input-deskripsi').value
          };
          if (isEdit) {
            window.appStore.updatePeriod(periodId, payload);
            this.showToast('Konfigurasi Periode multi-program berhasil diperbarui.', 'success');
          } else {
            window.appStore.addPeriod(payload);
            this.showToast('Periode evaluasi multi-program baru berhasil dibuat.', 'success');
          }
          closeModal();
          const mainContainer = document.getElementById('main-content-area');
          if (mainContainer) this.render(mainContainer);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      };
    },

    showToast: function (msg, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      const bg = type === 'success' ? 'bg-[#059669]' : type === 'error' ? 'bg-[#DC2626]' : 'bg-[#172B3A]';
      const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
      toast.className = `${bg} text-white px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-fadeIn mb-2`;
      toast.innerHTML = `<span class="material-symbols-outlined text-[16px]">${icon}</span><span>${msg}</span>`;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
  };
})();
