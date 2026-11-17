/**
 * View: Data Peserta Pelatihan (PLN Corporate University)
 * Halaman direktori data peserta evaluasi Level 3 lengkap dengan avatar profil,
 * filter multi-kriteria (pencarian NIP/Nama, UPDL, Unit Kerja, Program, Status Evaluasi),
 * serta matriks status evaluasi Tri-Perspektif.
 */

(function () {
  window.PesertaListView = {
    // State Filter & Tampilan
    searchQuery: '',
    selectedUnit: 'ALL',
    selectedStatus: 'ALL', // 'ALL' | 'COMPLETED' | 'PROGRESS' | 'NOT_STARTED'
    selectedProgram: 'ALL',
    selectedUpdl: 'ALL',
    viewMode: 'table', // 'table' | 'grid'
    sortBy: 'name-asc', // 'name-asc' | 'name-desc' | 'nip' | 'unit' | 'progress'
    currentPage: 1,
    perPage: 12,
    activeDetailRespondent: null,

    render: function (container) {
      if (!container) return;

      const esc = window.escapeHtml || (s => s);
      const allRespondents = window.appStore ? window.appStore.getRespondents() : [];
      const updls = window.appStore ? window.appStore.getUpdls() : [];
      const programs = window.appStore ? window.appStore.getPrograms() : [];
      const periods = window.appStore ? window.appStore.getPeriods() : [];

      // Dapatkan seluruh master unit kerja mandiri
      const availableUnits = window.appStore ? window.appStore.getUnits(null, true) : [];
      const unitNames = ['ALL', ...new Set(availableUnits.map(u => u.nama).filter(Boolean))];

      // Proses kalkulasi status evaluasi untuk setiap peserta
      const evaluatedList = allRespondents.map(r => {
        const ev = window.appStore ? window.appStore.getEvaluation(r.id) : {};
        const pStatus = ev.peserta?.status || 'BELUM';
        const aStatus = ev.atasan?.status || 'BELUM';
        const kStatus = ev.koordinator?.status || 'BELUM';

        let completedCount = 0;
        if (pStatus === 'SELESAI') completedCount++;
        if (aStatus === 'SELESAI') completedCount++;
        if (kStatus === 'SELESAI') completedCount++;

        const percent = Math.round((completedCount / 3) * 100);
        let overallStatus = 'NOT_STARTED';
        if (completedCount === 3) {
          overallStatus = 'COMPLETED';
        } else if (completedCount > 0) {
          overallStatus = 'PROGRESS';
        }

        // Cari user terkait untuk sinkronisasi avatar & email
        const userObj = (window.appStore?.users || []).find(u => 
          (u.nip && r.nip && u.nip.toLowerCase().trim() === r.nip.toLowerCase().trim()) ||
          (u.id && r.id && String(u.id) === String(r.id))
        );

        return {
          ...r,
          userObj,
          avatar: r.avatar || userObj?.avatar || '',
          email: r.email || userObj?.email || `${(r.nip || 'user').toLowerCase()}@pln.co.id`,
          pStatus,
          aStatus,
          kStatus,
          completedCount,
          percent,
          overallStatus
        };
      });

      // Hitung KPI
      const totalAll = evaluatedList.length;
      const countCompleted = evaluatedList.filter(x => x.overallStatus === 'COMPLETED').length;
      const countProgress = evaluatedList.filter(x => x.overallStatus === 'PROGRESS').length;
      const countNotStarted = evaluatedList.filter(x => x.overallStatus === 'NOT_STARTED').length;

      // Filter Data Berdasarkan Filter Aktif
      let filtered = evaluatedList.filter(r => {
        // Filter Status Tab
        if (this.selectedStatus !== 'ALL' && r.overallStatus !== this.selectedStatus) {
          return false;
        }

        // Filter Unit
        if (this.selectedUnit !== 'ALL') {
          const uClean = this.selectedUnit.toLowerCase().trim();
          const rUnitClean = (r.unit || '').toLowerCase().trim();
          if (r.unit !== this.selectedUnit && !rUnitClean.includes(uClean) && !uClean.includes(rUnitClean)) {
            return false;
          }
        }

        // Filter Search Text (NIP, Nama, Jabatan, Unit)
        if (this.searchQuery) {
          const q = this.searchQuery.toLowerCase().trim();
          const haystack = `${r.nama || ''} ${r.nip || ''} ${r.jabatan || ''} ${r.unit || ''} ${r.email || ''}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        return true;
      });

      // Sorting
      filtered.sort((a, b) => {
        if (this.sortBy === 'name-asc') return (a.nama || '').localeCompare(b.nama || '');
        if (this.sortBy === 'name-desc') return (b.nama || '').localeCompare(a.nama || '');
        if (this.sortBy === 'nip') return (a.nip || '').localeCompare(b.nip || '');
        if (this.sortBy === 'unit') return (a.unit || '').localeCompare(b.unit || '');
        if (this.sortBy === 'progress') return b.percent - a.percent;
        return (b.id || 0) - (a.id || 0);
      });

      // Pagination
      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / this.perPage) || 1;
      if (this.currentPage > totalPages) this.currentPage = totalPages;
      if (this.currentPage < 1) this.currentPage = 1;

      const startIndex = (this.currentPage - 1) * this.perPage;
      const endIndex = Math.min(startIndex + this.perPage, totalItems);
      const paginatedList = filtered.slice(startIndex, endIndex);

      // Render View HTML
      container.innerHTML = `
        <div class="flex flex-col gap-6">
          
          <!-- Header Banner & Action Bar -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col gap-1 max-w-3xl">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                  PLN Corporate University
                </span>
                <span class="text-xs text-[#64748B] font-mono">#EV3-MTR-2024.1</span>
                <span class="text-xs text-[#94A3B8]">•</span>
                <span class="text-xs text-[#006876] font-semibold">Direktori Peserta & Evaluasi Level 3</span>
              </div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[#006876] text-[28px]">group</span>
                Data Peserta Pelatihan
              </h1>
              <p class="text-xs md:text-sm text-[#64748B] leading-relaxed">
                Manajemen data peserta diklat, profil avatar pengguna, penugasan evaluator Tri-Perspektif, dan monitoring progres kelengkapan evaluasi Level 3 pasca pembelajaran.
              </p>
            </div>

            <!-- Toolbar Aksi -->
            <div class="flex flex-wrap items-center gap-2.5">
              <button id="btn-export-peserta-xlsx" class="btn-secondary flex items-center gap-1.5" title="Unduh data peserta ke format Excel">
                <span class="material-symbols-outlined text-[16px] text-[#006876]">download</span>
                Ekspor XLSX
              </button>
              <button id="btn-open-tambah-peserta" class="btn-primary flex items-center gap-1.5 shadow-sm" title="Tambah peserta diklat baru">
                <span class="material-symbols-outlined text-[18px]">person_add</span>
                Tambah Peserta
              </button>
            </div>
          </div>

          <!-- Cakupan Global Filter Bar (UPDL, Program, Periode) -->
          ${window.FilterScopeBar ? window.FilterScopeBar.render() : ''}

          <!-- Metric KPI Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Total Peserta -->
            <div class="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center justify-between hover:border-[#006876] transition-all">
              <div>
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Peserta</span>
                <div class="text-2xl font-bold text-[#172B3A] mt-1 font-tabular">${totalAll}</div>
                <div class="text-[11px] text-[#006876] font-medium mt-0.5">Pegawai Terdaftar</div>
              </div>
              <div class="w-11 h-11 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[22px]">badge</span>
              </div>
            </div>

            <!-- Selesai Lengkap (3/3) -->
            <div class="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center justify-between hover:border-[#059669] transition-all">
              <div>
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Selesai Lengkap (360°)</span>
                <div class="text-2xl font-bold text-[#059669] mt-1 font-tabular">${countCompleted}</div>
                <div class="text-[11px] text-[#64748B] mt-0.5">${totalAll > 0 ? Math.round((countCompleted / totalAll) * 100) : 0}% Kelengkapan Asesmen</div>
              </div>
              <div class="w-11 h-11 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[22px]">verified</span>
              </div>
            </div>

            <!-- Dalam Proses (1-2) -->
            <div class="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center justify-between hover:border-[#D97706] transition-all">
              <div>
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Sedang Berjalan</span>
                <div class="text-2xl font-bold text-[#D97706] mt-1 font-tabular">${countProgress}</div>
                <div class="text-[11px] text-[#64748B] mt-0.5">Menunggu Evaluator Lain</div>
              </div>
              <div class="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[22px]">pending</span>
              </div>
            </div>

            <!-- Belum Mengisi -->
            <div class="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center justify-between hover:border-[#DC2626] transition-all">
              <div>
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Belum Mengisi</span>
                <div class="text-2xl font-bold text-[#DC2626] mt-1 font-tabular">${countNotStarted}</div>
                <div class="text-[11px] text-[#64748B] mt-0.5">Perlu Pengingat / Notifikasi</div>
              </div>
              <div class="w-11 h-11 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[22px]">error_outline</span>
              </div>
            </div>

          </div>

          <!-- Section Filter & Pengendali Tabel -->
          <div class="bg-white rounded-xl border border-[#CBD5E1] shadow-sm overflow-hidden flex flex-col">
            
            <!-- Baris Filter Interaktif -->
            <div class="p-4 bg-[#F8FAFC] border-b border-[#CBD5E1] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              
              <!-- Sisi Kiri: Search & Select Filter -->
              <div class="flex flex-wrap items-center gap-2.5 flex-1">
                
                <!-- Kotak Pencarian -->
                <div class="relative min-w-[240px] max-w-sm flex-1">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[18px]">search</span>
                  <input
                    type="text"
                    id="input-search-peserta"
                    class="w-full pl-9 pr-8 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:border-[#006876] text-[#172B3A] placeholder-[#94A3B8]"
                    placeholder="Cari NIP, nama peserta, jabatan..."
                    value="${esc(this.searchQuery)}"
                  />
                  ${this.searchQuery ? `
                    <button id="btn-clear-search" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#172B3A]">
                      <span class="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  ` : ''}
                </div>

                <!-- Filter Unit Kerja -->
                <div class="relative min-w-[180px]">
                  <select id="select-filter-unit" class="w-full text-xs bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 focus:outline-none focus:border-[#006876] text-[#172B3A]">
                    <option value="ALL" ${this.selectedUnit === 'ALL' ? 'selected' : ''}>Semua Unit Kerja (${unitNames.length - 1})</option>
                    ${unitNames.filter(u => u !== 'ALL').map(u => `
                      <option value="${esc(u)}" ${this.selectedUnit === u ? 'selected' : ''}>${esc(u)}</option>
                    `).join('')}
                  </select>
                </div>

                <!-- Urutkan / Sort By -->
                <div class="relative min-w-[150px]">
                  <select id="select-sort-peserta" class="w-full text-xs bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 focus:outline-none focus:border-[#006876] text-[#172B3A]">
                    <option value="name-asc" ${this.sortBy === 'name-asc' ? 'selected' : ''}>Nama (A → Z)</option>
                    <option value="name-desc" ${this.sortBy === 'name-desc' ? 'selected' : ''}>Nama (Z → A)</option>
                    <option value="nip" ${this.sortBy === 'nip' ? 'selected' : ''}>Nomor Induk Pegawai (NIP)</option>
                    <option value="unit" ${this.sortBy === 'unit' ? 'selected' : ''}>Unit Kerja</option>
                    <option value="progress" ${this.sortBy === 'progress' ? 'selected' : ''}>Progres Evaluasi Tertinggi</option>
                  </select>
                </div>

                ${(this.searchQuery || this.selectedUnit !== 'ALL' || this.selectedStatus !== 'ALL') ? `
                  <button id="btn-reset-all-filter" class="text-xs text-[#DC2626] hover:underline font-semibold flex items-center gap-1 px-2 py-1">
                    <span class="material-symbols-outlined text-[15px]">filter_alt_off</span>
                    Reset Filter
                  </button>
                ` : ''}

              </div>

              <!-- Sisi Kanan: Switcher Tampilan Grid / Tabel -->
              <div class="flex items-center gap-1.5 shrink-0 border border-[#CBD5E1] rounded-lg p-1 bg-white">
                <button
                  type="button"
                  id="btn-view-table"
                  class="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${this.viewMode === 'table' ? 'bg-[#006876] text-white shadow-sm' : 'text-[#64748B] hover:text-[#172B3A]'}"
                  title="Tampilan Tabel"
                >
                  <span class="material-symbols-outlined text-[16px]">table_rows</span>
                  <span class="hidden sm:inline">Tabel</span>
                </button>
                <button
                  type="button"
                  id="btn-view-grid"
                  class="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${this.viewMode === 'grid' ? 'bg-[#006876] text-white shadow-sm' : 'text-[#64748B] hover:text-[#172B3A]'}"
                  title="Tampilan Grid Kartu"
                >
                  <span class="material-symbols-outlined text-[16px]">grid_view</span>
                  <span class="hidden sm:inline">Kartu</span>
                </button>
              </div>

            </div>

            <!-- Tab Filter Status Evaluasi -->
            <div class="px-4 py-2 bg-white border-b border-[#CBD5E1] flex items-center gap-2 overflow-x-auto text-xs">
              <button
                type="button"
                data-status="ALL"
                class="tab-filter-status px-3 py-1.5 rounded-full font-medium transition-all ${this.selectedStatus === 'ALL' ? 'bg-[#172B3A] text-white shadow-sm' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'}"
              >
                Semua Status (${totalAll})
              </button>
              <button
                type="button"
                data-status="COMPLETED"
                class="tab-filter-status px-3 py-1.5 rounded-full font-medium transition-all ${this.selectedStatus === 'COMPLETED' ? 'bg-[#059669] text-white shadow-sm' : 'bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5]'}"
              >
                Selesai Lengkap 360° (${countCompleted})
              </button>
              <button
                type="button"
                data-status="PROGRESS"
                class="tab-filter-status px-3 py-1.5 rounded-full font-medium transition-all ${this.selectedStatus === 'PROGRESS' ? 'bg-[#D97706] text-white shadow-sm' : 'bg-[#FEF3C7] text-[#D97706] hover:bg-[#FDE68A]'}"
              >
                Sedang Berjalan (${countProgress})
              </button>
              <button
                type="button"
                data-status="NOT_STARTED"
                class="tab-filter-status px-3 py-1.5 rounded-full font-medium transition-all ${this.selectedStatus === 'NOT_STARTED' ? 'bg-[#DC2626] text-white shadow-sm' : 'bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FECACA]'}"
              >
                Belum Mengisi (${countNotStarted})
              </button>
            </div>

            <!-- Area Data: Mode Tabel atau Mode Grid -->
            ${this.viewMode === 'table' ? this.renderTable(paginatedList, startIndex) : this.renderGrid(paginatedList)}

            <!-- Pagination Footer -->
            <div class="p-4 border-t border-[#CBD5E1] bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div class="text-[#64748B]">
                Menampilkan <span class="font-semibold text-[#172B3A]">${totalItems > 0 ? startIndex + 1 : 0}</span> – <span class="font-semibold text-[#172B3A]">${endIndex}</span> dari <span class="font-semibold text-[#172B3A]">${totalItems}</span> peserta
              </div>
              
              <div class="flex items-center gap-1.5">
                <button
                  id="btn-page-prev"
                  class="p-1.5 rounded border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#172B3A] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed"
                  ${this.currentPage <= 1 ? 'disabled' : ''}
                  title="Halaman Sebelumnya"
                >
                  <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                <div class="flex items-center gap-1">
                  ${this.renderPaginationButtons(totalPages)}
                </div>

                <button
                  id="btn-page-next"
                  class="p-1.5 rounded border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#172B3A] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed"
                  ${this.currentPage >= totalPages ? 'disabled' : ''}
                  title="Halaman Selanjutnya"
                >
                  <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        <!-- Detail Peserta Modal Container -->
        <div id="modal-detail-peserta-host"></div>

        <!-- Tambah Peserta Modal Container -->
        <div id="modal-tambah-peserta-host"></div>
      `;

      // Hubungkan Event Listener Interaktif
      this.attachEvents(container);
    },

    // Render Mode Tabel
    renderTable: function (list, startIndex) {
      const esc = window.escapeHtml || (s => s);

      if (list.length === 0) {
        return `
          <div class="p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-2">
            <span class="material-symbols-outlined text-4xl text-[#94A3B8]">person_search</span>
            <div class="font-bold text-[#172B3A] text-sm">Tidak Ada Data Peserta yang Sesuai</div>
            <p class="text-xs text-[#64748B] max-w-md">Silakan ubah kata kunci pencarian atau sesuaikan opsi filter unit dan status evaluasi di atas.</p>
          </div>
        `;
      }

      return `
        <div class="overflow-x-auto w-full">
          <table class="w-full text-left border-collapse text-xs min-w-[950px]">
            <thead>
              <tr class="bg-[#F8FAFC] text-[#475569] uppercase font-bold text-[10px] tracking-wider border-b border-[#CBD5E1]">
                <th class="py-3 px-3 w-12 text-center">No</th>
                <th class="py-3 px-4 min-w-[240px]">Peserta Diklat & Avatar</th>
                <th class="py-3 px-4 min-w-[190px]">Jabatan & Unit Kerja</th>
                <th class="py-3 px-4 min-w-[190px]">Tim Evaluator (360°)</th>
                <th class="py-3 px-4 min-w-[180px]">Status 3 Perspektif</th>
                <th class="py-3 px-3 text-center min-w-[100px]">Progres</th>
                <th class="py-3 px-4 text-center min-w-[130px]">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              ${list.map((r, idx) => {
                const initial = (r.nama || 'P').charAt(0).toUpperCase();
                const supName = r.atasan?.nama || 'Belum Ditetapkan';
                const coordName = r.koordinatorEksternal?.nama || 'Koordinator UPDL';

                return `
                  <tr class="hover:bg-[#F8FAFC] transition-colors group">
                    <!-- No -->
                    <td class="py-3.5 px-3 text-center font-tabular text-[#64748B]">
                      ${startIndex + idx + 1}
                    </td>

                    <!-- Peserta & Avatar -->
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-3">
                        
                        <!-- Avatar Peserta (Display Only) -->
                        <div class="w-10 h-10 rounded-full bg-[#172B3A] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden ring-2 ring-[#CBD5E1] shadow-sm">
                          ${r.avatar
                            ? `<img src="${r.avatar}" alt="${esc(r.nama)}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.textContent='${initial}';" />`
                            : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#006876] to-[#172B3A] text-white font-bold">${initial}</div>`
                          }
                        </div>

                        <!-- Data Teks Peserta -->
                        <div class="overflow-hidden min-w-0">
                          <div class="font-bold text-[#172B3A] text-xs leading-tight hover:text-[#006876] cursor-pointer truncate btn-open-detail" data-id="${r.id}">
                            ${esc(r.nama)}
                          </div>
                          <div class="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#64748B]">
                            <span class="font-mono text-[#006876] font-semibold">${esc(r.nip)}</span>
                            <span class="text-[#CBD5E1]">•</span>
                            <span class="truncate">${esc(r.email)}</span>
                          </div>
                        </div>

                      </div>
                    </td>

                    <!-- Jabatan & Unit Kerja -->
                    <td class="py-3.5 px-4">
                      <div class="text-xs text-[#172B3A] font-medium leading-tight truncate">
                        ${esc(r.jabatan || 'Peserta Diklat')}
                      </div>
                      <div class="text-[11px] text-[#006876] font-semibold truncate mt-0.5 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px] text-[#64748B]">apartment</span>
                        ${esc(r.unit || 'PLN Unit')}
                      </div>
                    </td>

                    <!-- Tim Evaluator -->
                    <td class="py-3.5 px-4">
                      <div class="text-[11px] leading-tight">
                        <div class="text-[#172B3A] font-medium truncate flex items-center gap-1" title="Atasan Langsung">
                          <span class="material-symbols-outlined text-[13px] text-[#006876]">supervisor_account</span>
                          <span>${esc(supName)}</span>
                        </div>
                        <div class="text-[#64748B] text-[10px] truncate mt-0.5 flex items-center gap-1" title="Koordinator UPDL">
                          <span class="material-symbols-outlined text-[13px] text-[#64748B]">school</span>
                          <span>${esc(coordName)}</span>
                        </div>
                      </div>
                    </td>

                    <!-- Status 3 Perspektif -->
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-1.5">
                        <!-- Peserta -->
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${this.getStatusChipClass(r.pStatus)}" title="Evaluasi Diri Peserta: ${r.pStatus}">
                          Diri: ${r.pStatus === 'SELESAI' ? '✓' : '...'}
                        </span>
                        <!-- Atasan -->
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${this.getStatusChipClass(r.aStatus)}" title="Penilaian Atasan Langsung: ${r.aStatus}">
                          Atasan: ${r.aStatus === 'SELESAI' ? '✓' : '...'}
                        </span>
                        <!-- Koordinator -->
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${this.getStatusChipClass(r.kStatus)}" title="Penilaian Koordinator: ${r.kStatus}">
                          Koor: ${r.kStatus === 'SELESAI' ? '✓' : '...'}
                        </span>
                      </div>
                    </td>

                    <!-- Progres Bar -->
                    <td class="py-3.5 px-3 text-center">
                      <div class="flex flex-col items-center justify-center gap-1">
                        <span class="font-tabular font-bold text-xs ${r.percent === 100 ? 'text-[#059669]' : (r.percent > 0 ? 'text-[#D97706]' : 'text-[#94A3B8]')}">
                          ${r.percent}%
                        </span>
                        <div class="w-16 bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                          <div class="h-full rounded-full ${r.percent === 100 ? 'bg-[#059669]' : (r.percent > 0 ? 'bg-[#23C4DB]' : 'bg-[#CBD5E1]')}" style="width: ${r.percent}%"></div>
                        </div>
                      </div>
                    </td>

                    <!-- Aksi -->
                    <td class="py-3.5 px-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          class="btn-open-detail p-1.5 rounded-lg text-[#006876] hover:bg-[#E0F7FA] transition-colors"
                          data-id="${r.id}"
                          title="Lihat Detail Peserta"
                        >
                          <span class="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          type="button"
                          class="btn-open-form p-1.5 rounded-lg text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                          data-id="${r.id}"
                          title="Lihat Progress Formulir (Hanya Lihat)"
                        >
                          <span class="material-symbols-outlined text-[18px]">description</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    },

    // Render Mode Grid Kartu
    renderGrid: function (list) {
      const esc = window.escapeHtml || (s => s);

      if (list.length === 0) {
        return `
          <div class="p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-2">
            <span class="material-symbols-outlined text-4xl text-[#94A3B8]">person_search</span>
            <div class="font-bold text-[#172B3A] text-sm">Tidak Ada Data Peserta yang Sesuai</div>
            <p class="text-xs text-[#64748B] max-w-md">Silakan ubah kata kunci pencarian atau sesuaikan opsi filter unit dan status evaluasi di atas.</p>
          </div>
        `;
      }

      return `
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          ${list.map(r => {
            const initial = (r.nama || 'P').charAt(0).toUpperCase();
            const supName = r.atasan?.nama || 'Belum Ditetapkan';

            return `
              <div class="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col justify-between hover:shadow-md hover:border-[#006876] transition-all">
                
                <!-- Atas: Avatar + Status Badge -->
                <div>
                  <div class="flex items-start justify-between gap-2 mb-3">
                    
                    <!-- Avatar (Display Only) -->
                    <div class="w-12 h-12 rounded-full bg-[#172B3A] text-white flex items-center justify-center font-bold text-base shrink-0 overflow-hidden ring-2 ring-[#CBD5E1] shadow-sm">
                      ${r.avatar
                        ? `<img src="${r.avatar}" alt="${esc(r.nama)}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.textContent='${initial}';" />`
                        : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#006876] to-[#172B3A] text-white font-bold">${initial}</div>`
                      }
                    </div>

                    <!-- Chip Status Utama -->
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${this.getOverallBadgeClass(r.overallStatus)}">
                      ${this.getOverallBadgeLabel(r.overallStatus)}
                    </span>

                  </div>

                  <!-- Identitas Peserta -->
                  <h3 class="font-bold text-[#172B3A] text-sm leading-snug line-clamp-1 hover:text-[#006876] cursor-pointer btn-open-detail" data-id="${r.id}">
                    ${esc(r.nama)}
                  </h3>
                  <div class="text-xs text-[#006876] font-mono font-semibold mt-0.5">
                    ${esc(r.nip)}
                  </div>
                  <div class="text-[11px] text-[#64748B] mt-1 line-clamp-1">
                    ${esc(r.jabatan || 'Peserta Diklat')}
                  </div>
                  <div class="text-[11px] font-semibold text-[#172B3A] flex items-center gap-1 mt-1 truncate">
                    <span class="material-symbols-outlined text-[14px] text-[#64748B]">apartment</span>
                    ${esc(r.unit || 'PLN Unit')}
                  </div>

                  <!-- Evaluator Info -->
                  <div class="mt-3 pt-2.5 border-t border-[#F1F5F9] text-[11px] text-[#64748B] space-y-1">
                    <div class="truncate flex items-center gap-1" title="Atasan Langsung">
                      <span class="material-symbols-outlined text-[13px] text-[#006876]">supervisor_account</span>
                      <span class="truncate">Atasan: <b>${esc(supName)}</b></span>
                    </div>
                  </div>

                  <!-- Progres Pengisian Level 3 -->
                  <div class="mt-3">
                    <div class="flex items-center justify-between text-[10px] font-semibold text-[#64748B] mb-1">
                      <span>Progres Asesmen Tri-Perspektif</span>
                      <span class="font-tabular text-[#172B3A]">${r.percent}%</span>
                    </div>
                    <div class="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                      <div class="h-full rounded-full ${r.percent === 100 ? 'bg-[#059669]' : (r.percent > 0 ? 'bg-[#23C4DB]' : 'bg-[#CBD5E1]')}" style="width: ${r.percent}%"></div>
                    </div>
                  </div>

                </div>

                <!-- Tombol Aksi Bawah -->
                <div class="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    class="btn-open-detail flex-1 py-1.5 px-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#172B3A] text-xs font-semibold rounded-lg border border-[#CBD5E1] transition-colors flex items-center justify-center gap-1"
                    data-id="${r.id}"
                    title="Lihat Detail Peserta"
                  >
                    <span class="material-symbols-outlined text-[15px]">visibility</span>
                    Detail
                  </button>
                  <button
                    type="button"
                    class="btn-open-form flex-1 py-1.5 px-2 bg-[#006876] hover:bg-[#004D57] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                    data-id="${r.id}"
                    title="Lihat Progress Formulir (Hanya Lihat)"
                  >
                    <span class="material-symbols-outlined text-[15px]">description</span>
                    Progress
                  </button>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      `;
    },

    // Pagination Buttons Helper
    renderPaginationButtons: function (totalPages) {
      let html = '';
      for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || (p >= this.currentPage - 1 && p <= this.currentPage + 1)) {
          html += `
            <button
              class="btn-page-number w-7 h-7 rounded text-xs font-semibold flex items-center justify-center transition-colors ${this.currentPage === p ? 'bg-[#006876] text-white' : 'bg-white border border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9]'}"
              data-page="${p}"
            >
              ${p}
            </button>
          `;
        } else if (p === this.currentPage - 2 || p === this.currentPage + 2) {
          html += `<span class="px-1 text-[#94A3B8] text-xs">...</span>`;
        }
      }
      return html;
    },

    // Style Helpers
    getStatusChipClass: function (status) {
      if (status === 'SELESAI') return 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]';
      if (status === 'DRAFT') return 'bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]';
      return 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]';
    },

    getOverallBadgeClass: function (status) {
      if (status === 'COMPLETED') return 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]';
      if (status === 'PROGRESS') return 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]';
      return 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]';
    },

    getOverallBadgeLabel: function (status) {
      if (status === 'COMPLETED') return 'Selesai 100%';
      if (status === 'PROGRESS') return 'Dalam Proses';
      return 'Belum Mulai';
    },

    // Detail Peserta Modal
    openDetailModal: function (respondentId) {
      const esc = window.escapeHtml || (s => s);
      const r = (window.appStore?.respondents || []).find(x => String(x.id) === String(respondentId));
      if (!r) return;

      const userObj = (window.appStore?.users || []).find(u => 
        (u.nip && r.nip && u.nip.toLowerCase().trim() === r.nip.toLowerCase().trim()) ||
        (u.id && r.id && String(u.id) === String(r.id))
      );
      const avatar = r.avatar || userObj?.avatar || '';
      const initial = (r.nama || 'P').charAt(0).toUpperCase();

      const ev = window.appStore?.getEvaluation(r.id) || {};
      const host = document.getElementById('modal-detail-peserta-host');
      if (!host) return;

      host.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1C30]/70 backdrop-blur-sm animate-fade-in" id="backdrop-detail-peserta">
          <div class="bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] w-full max-w-2xl overflow-hidden animate-scale-up" role="dialog" aria-modal="true">
            
            <!-- Modal Header -->
            <div class="px-6 py-4 bg-[#102331] text-white flex items-center justify-between border-b border-[#1E384D]">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#23C4DB] text-[22px]">badge</span>
                <span class="text-sm font-bold tracking-wide">Profil Lengkap Peserta Pelatihan</span>
              </div>
              <button id="btn-close-detail-modal" class="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              <!-- Profil Banner -->
              <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
                <div class="w-16 h-16 rounded-full bg-[#172B3A] text-white flex items-center justify-center font-bold text-2xl shrink-0 overflow-hidden ring-4 ring-white shadow">
                  ${avatar
                    ? `<img src="${avatar}" alt="${esc(r.nama)}" class="w-full h-full object-cover" />`
                    : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#006876] to-[#172B3A] text-white font-bold">${initial}</div>`
                  }
                </div>
                <div class="text-center sm:text-left flex-1 min-w-0">
                  <h2 class="text-lg font-bold text-[#172B3A] leading-tight">${esc(r.nama)}</h2>
                  <div class="flex items-center justify-center sm:justify-start gap-2 mt-1 text-xs">
                    <span class="font-mono text-[#006876] font-bold bg-[#E0F7FA] px-2 py-0.5 rounded">${esc(r.nip)}</span>
                    <span class="text-[#64748B]">${esc(r.jabatan || 'Peserta Diklat')}</span>
                  </div>
                  <div class="text-xs text-[#64748B] mt-1.5 flex items-center justify-center sm:justify-start gap-1">
                    <span class="material-symbols-outlined text-[15px] text-[#006876]">apartment</span>
                    <span>${esc(r.unit || 'PLN Unit')}</span>
                    <span class="text-[#CBD5E1]">•</span>
                    <span>UPDL Terdaftar: <b>${esc(r.updlId || 'UPDL Palembang')}</b></span>
                  </div>
                </div>
              </div>

              <!-- Matriks Tim Evaluator -->
              <div>
                <h3 class="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px] text-[#006876]">people</span>
                  Tim Evaluator Tri-Perspektif
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Atasan Langsung -->
                  <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl">
                    <div class="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Atasan Langsung (Direct Supervisor)</div>
                    <div class="text-xs font-bold text-[#172B3A] mt-1">${esc(r.atasan?.nama || 'Belum Ditetapkan')}</div>
                    <div class="text-[11px] text-[#006876] font-mono">${esc(r.atasan?.nip || '-')}</div>
                    <div class="text-[10px] text-[#64748B] mt-0.5">${esc(r.atasan?.jabatan || 'Pejabat Struktural')}</div>
                  </div>
                  <!-- Koordinator UPDL -->
                  <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl">
                    <div class="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Koordinator Pembelajaran (UPDL)</div>
                    <div class="text-xs font-bold text-[#172B3A] mt-1">${esc(r.koordinatorEksternal?.nama || 'Koordinator UPDL Terkait')}</div>
                    <div class="text-[11px] text-[#006876] font-mono">${esc(r.koordinatorEksternal?.nip || '-')}</div>
                    <div class="text-[10px] text-[#64748B] mt-0.5">Pengawas Pembelajaran Pasca Diklat</div>
                  </div>
                </div>
              </div>

              <!-- Ringkasan Status Evaluasi 3 Perspektif -->
              <div>
                <h3 class="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px] text-[#006876]">analytics</span>
                  Status Kelengkapan Evaluasi Level 3
                </h3>
                <div class="grid grid-cols-3 gap-3 text-center">
                  
                  <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl">
                    <div class="text-[10px] font-bold text-[#64748B] uppercase">Diri Sendiri</div>
                    <div class="mt-1">
                      <span class="inline-flex px-2 py-0.5 rounded text-xs font-bold ${this.getStatusChipClass(ev.peserta?.status || 'BELUM')}">
                        ${ev.peserta?.status === 'SELESAI' ? 'SELESAI (✓)' : (ev.peserta?.status || 'BELUM')}
                      </span>
                    </div>
                  </div>

                  <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl">
                    <div class="text-[10px] font-bold text-[#64748B] uppercase">Atasan Langsung</div>
                    <div class="mt-1">
                      <span class="inline-flex px-2 py-0.5 rounded text-xs font-bold ${this.getStatusChipClass(ev.atasan?.status || 'BELUM')}">
                        ${ev.atasan?.status === 'SELESAI' ? 'SELESAI (✓)' : (ev.atasan?.status || 'BELUM')}
                      </span>
                    </div>
                  </div>

                  <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl">
                    <div class="text-[10px] font-bold text-[#64748B] uppercase">Koordinator</div>
                    <div class="mt-1">
                      <span class="inline-flex px-2 py-0.5 rounded text-xs font-bold ${this.getStatusChipClass(ev.koordinator?.status || 'BELUM')}">
                        ${ev.koordinator?.status === 'SELESAI' ? 'SELESAI (✓)' : (ev.koordinator?.status || 'BELUM')}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#CBD5E1] flex items-center justify-end gap-2.5">
              <button type="button" id="btn-close-detail-modal-2" class="btn-secondary text-xs">
                Tutup
              </button>
              <button
                type="button"
                id="btn-goto-formulir"
                class="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
                data-id="${r.id}"
                title="Lihat Progress Formulir (Hanya Lihat)"
              >
                <span class="material-symbols-outlined text-[16px]">description</span>
                Lihat Progress Formulir
              </button>
            </div>

          </div>
        </div>
      `;

      // Event listener modal detail
      const closeModal = () => { host.innerHTML = ''; };
      host.querySelector('#btn-close-detail-modal')?.addEventListener('click', closeModal);
      host.querySelector('#btn-close-detail-modal-2')?.addEventListener('click', closeModal);
      host.querySelector('#backdrop-detail-peserta')?.addEventListener('click', (e) => {
        if (e.target.id === 'backdrop-detail-peserta') closeModal();
      });

      host.querySelector('#btn-goto-formulir')?.addEventListener('click', () => {
        closeModal();
        if (window.appStore) {
          if (window.FormulirView) {
            window.FormulirView.isReadOnly = true;
          }
          window.appStore.setActiveRespondentId(Number(r.id));
          window.appStore.setView('formulir');
        }
      });
    },

    // Modal Tambah Peserta Baru
    openTambahPesertaModal: function () {
      const esc = window.escapeHtml || (s => s);
      const host = document.getElementById('modal-tambah-peserta-host');
      if (!host) return;

      const updls = window.appStore ? window.appStore.getUpdls() : [];
      const units = window.appStore ? window.appStore.getUnits() : [];

      host.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1C30]/70 backdrop-blur-sm animate-fade-in" id="backdrop-tambah-peserta">
          <div class="bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] w-full max-w-lg overflow-hidden animate-scale-up" role="dialog" aria-modal="true">
            
            <!-- Header -->
            <div class="px-6 py-4 bg-[#102331] text-white flex items-center justify-between border-b border-[#1E384D]">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#23C4DB] text-[22px]">person_add</span>
                <span class="text-sm font-bold tracking-wide">Pendaftaran Peserta Diklat Baru</span>
              </div>
              <button id="btn-close-tambah-modal" class="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <!-- Form -->
            <form id="form-tambah-peserta" class="p-6 space-y-4">
              
              <!-- NIP -->
              <div>
                <label class="block text-xs font-bold text-[#172B3A] mb-1">Nomor Induk Pegawai (NIP) *</label>
                <input
                  type="text"
                  name="nip"
                  required
                  placeholder="Contoh: 987654321"
                  class="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#006876]"
                />
              </div>

              <!-- Nama Lengkap -->
              <div>
                <label class="block text-xs font-bold text-[#172B3A] mb-1">Nama Lengkap Peserta *</label>
                <input
                  type="text"
                  name="nama"
                  required
                  placeholder="Contoh: Ahmad Fauzan"
                  class="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#006876]"
                />
              </div>

              <!-- Jabatan -->
              <div>
                <label class="block text-xs font-bold text-[#172B3A] mb-1">Jabatan Fungsional / Struktural *</label>
                <input
                  type="text"
                  name="jabatan"
                  required
                  placeholder="Contoh: Junior Engineer Pengendalian Susut"
                  class="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#006876]"
                />
              </div>

              <!-- UPDL & Unit -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-[#172B3A] mb-1">Cakupan UPDL *</label>
                  <select name="updlId" required class="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#006876]">
                    ${updls.map(u => `<option value="${u.id}">${esc(u.nama)} (${u.kode})</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#172B3A] mb-1">Unit Kerja *</label>
                  <select name="unit" required class="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#006876]">
                    ${units.map(u => `<option value="${esc(u.nama)}">${esc(u.nama)}</option>`).join('')}
                  </select>
                </div>
              </div>

              <!-- Atasan Langsung -->
              <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl space-y-3">
                <div class="text-[11px] font-bold text-[#006876] uppercase tracking-wider">Atasan Langsung (Penilai Perspektif 2)</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="atasanNama"
                    placeholder="Nama Atasan Langsung"
                    class="w-full text-xs px-2.5 py-1.5 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#006876]"
                  />
                  <input
                    type="text"
                    name="atasanNip"
                    placeholder="NIP Atasan"
                    class="w-full text-xs px-2.5 py-1.5 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#006876]"
                  />
                </div>
              </div>

              <div id="tambah-peserta-alert" class="hidden p-3 rounded-lg text-xs"></div>

              <!-- Footer Buttons -->
              <div class="pt-2 flex items-center justify-end gap-2">
                <button type="button" id="btn-cancel-tambah" class="btn-secondary text-xs">Batal</button>
                <button type="submit" class="btn-primary text-xs flex items-center gap-1.5 shadow-sm">
                  <span class="material-symbols-outlined text-[16px]">save</span>
                  Simpan Peserta
                </button>
              </div>

            </form>

          </div>
        </div>
      `;

      const closeModal = () => { host.innerHTML = ''; };
      host.querySelector('#btn-close-tambah-modal')?.addEventListener('click', closeModal);
      host.querySelector('#btn-cancel-tambah')?.addEventListener('click', closeModal);
      host.querySelector('#backdrop-tambah-peserta')?.addEventListener('click', (e) => {
        if (e.target.id === 'backdrop-tambah-peserta') closeModal();
      });

      const form = host.querySelector('#form-tambah-peserta');
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const nip = fd.get('nip').trim();
        const nama = fd.get('nama').trim();
        const jabatan = fd.get('jabatan').trim();
        const updlId = fd.get('updlId');
        const unit = fd.get('unit');
        const atasanNama = fd.get('atasanNama').trim();
        const atasanNip = fd.get('atasanNip').trim();
        const alertBox = host.querySelector('#tambah-peserta-alert');

        if (!nip || !nama) {
          alertBox.className = 'p-3 rounded-lg text-xs bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]';
          alertBox.textContent = 'NIP dan Nama Lengkap wajib diisi.';
          alertBox.classList.remove('hidden');
          return;
        }

        try {
          if (window.appStore) {
            window.appStore.addRespondent({
              nip,
              nama,
              jabatan,
              unit,
              updlId,
              programId: window.appStore.state.activeDashboardProgram || 'prog-pil-susut',
              periodId: window.appStore.state.activeDashboardPeriod || 'period-2026-1',
              modules: ['A', 'B', 'C'],
              atasan: {
                nama: atasanNama,
                nip: atasanNip,
                jabatan: 'Atasan Langsung'
              }
            });

            closeModal();
            if (window.App) {
              window.App.showToast(`Peserta ${nama} (${nip}) berhasil ditambahkan ke sistem!`, 'success');
              window.App.render();
            }
          }
        } catch (err) {
          alertBox.className = 'p-3 rounded-lg text-xs bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]';
          alertBox.textContent = err.message || 'Gagal menyimpan peserta.';
          alertBox.classList.remove('hidden');
        }
      });
    },

    // Ekspor Data Peserta ke Format Excel XLSX
    exportXlsx: function () {
      const respondents = window.appStore ? window.appStore.getRespondents() : [];
      if (!respondents || respondents.length === 0) {
        if (window.App) window.App.showToast('Tidak ada data peserta untuk diekspor.', 'warning');
        return;
      }

      const rows = respondents.map((r, i) => {
        const ev = window.appStore ? window.appStore.getEvaluation(r.id) : {};
        return {
          'No': i + 1,
          'NIP': r.nip || '',
          'Nama Peserta': r.nama || '',
          'Jabatan': r.jabatan || '',
          'Unit Kerja': r.unit || '',
          'UPDL': r.updlId || '',
          'Atasan Langsung': r.atasan?.nama || '-',
          'NIP Atasan': r.atasan?.nip || '-',
          'Evaluasi Diri': ev.peserta?.status || 'BELUM',
          'Evaluasi Atasan': ev.atasan?.status || 'BELUM',
          'Evaluasi Koordinator': ev.koordinator?.status || 'BELUM'
        };
      });

      if (window.XLSX) {
        const ws = window.XLSX.utils.json_to_sheet(rows);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, 'Daftar Peserta Diklat');
        window.XLSX.writeFile(wb, `Data_Peserta_PLN_Corpu_${new Date().toISOString().slice(0, 10)}.xlsx`);
        if (window.App) window.App.showToast('Data peserta berhasil diekspor ke Excel (XLSX).', 'success');
      } else {
        // Fallback CSV
        let csv = 'No,NIP,Nama Peserta,Jabatan,Unit Kerja,UPDL,Atasan,Status Peserta,Status Atasan,Status Koordinator\n';
        rows.forEach(r => {
          csv += `"${r['No']}","${r['NIP']}","${r['Nama Peserta']}","${r['Jabatan']}","${r['Unit Kerja']}","${r['UPDL']}","${r['Atasan Langsung']}","${r['Evaluasi Diri']}","${r['Evaluasi Atasan']}","${r['Evaluasi Koordinator']}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Data_Peserta_PLN_Corpu_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (window.App) window.App.showToast('Data peserta diekspor ke format CSV.', 'success');
      }
    },

    // Hubungkan Seluruh Event Interaktif
    attachEvents: function (container) {
      if (!container) return;

      // Filter Scope Bar Event (UPDL, Program, Periode)
      if (window.FilterScopeBar && typeof window.FilterScopeBar.attachEvents === 'function') {
        window.FilterScopeBar.attachEvents(container, () => {
          this.currentPage = 1;
          this.render(container);
        });
      }

      // Search Handler
      const searchInput = container.querySelector('#input-search-peserta');
      if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            this.searchQuery = e.target.value;
            this.currentPage = 1;
            this.render(container);
          }, 300);
        });
      }

      // Clear Search
      container.querySelector('#btn-clear-search')?.addEventListener('click', () => {
        this.searchQuery = '';
        this.currentPage = 1;
        this.render(container);
      });

      // Filter Unit
      const unitSelect = container.querySelector('#select-filter-unit');
      if (unitSelect) {
        unitSelect.addEventListener('change', (e) => {
          this.selectedUnit = e.target.value;
          this.currentPage = 1;
          this.render(container);
        });
      }

      // Sort Select
      const sortSelect = container.querySelector('#select-sort-peserta');
      if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
          this.sortBy = e.target.value;
          this.render(container);
        });
      }

      // Reset All Filter
      container.querySelector('#btn-reset-all-filter')?.addEventListener('click', () => {
        this.searchQuery = '';
        this.selectedUnit = 'ALL';
        this.selectedStatus = 'ALL';
        this.currentPage = 1;
        this.render(container);
      });

      // Status Tabs
      container.querySelectorAll('.tab-filter-status').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const st = e.currentTarget.getAttribute('data-status');
          this.selectedStatus = st;
          this.currentPage = 1;
          this.render(container);
        });
      });

      // View Mode Toggle
      container.querySelector('#btn-view-table')?.addEventListener('click', () => {
        this.viewMode = 'table';
        this.render(container);
      });
      container.querySelector('#btn-view-grid')?.addEventListener('click', () => {
        this.viewMode = 'grid';
        this.render(container);
      });

      // Pagination
      container.querySelector('#btn-page-prev')?.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.render(container);
        }
      });
      container.querySelector('#btn-page-next')?.addEventListener('click', () => {
        this.currentPage++;
        this.render(container);
      });
      container.querySelectorAll('.btn-page-number').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.currentPage = parseInt(e.currentTarget.getAttribute('data-page'), 10);
          this.render(container);
        });
      });

      // Modal Detail Peserta
      container.querySelectorAll('.btn-open-detail').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          this.openDetailModal(id);
        });
      });

      // Buka Formulir Peserta (Read-Only Mode)
      container.querySelectorAll('.btn-open-form').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (window.appStore) {
            if (window.FormulirView) {
              window.FormulirView.isReadOnly = true;
            }
            window.appStore.setActiveRespondentId(Number(id));
            window.appStore.setView('formulir');
          }
        });
      });

      // Trigger Tambah Peserta
      container.querySelector('#btn-open-tambah-peserta')?.addEventListener('click', () => {
        this.openTambahPesertaModal();
      });

      // Trigger Ekspor Excel
      container.querySelector('#btn-export-peserta-xlsx')?.addEventListener('click', () => {
        this.exportXlsx();
      });
    }
  };
})();

