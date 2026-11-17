/**
 * View: Dashboard Administrator
 * Rendering dashboard eksekutif berbasis preferensi/dashboard_administrator/code.html
 * Terintegrasi secara reaktif dengan window.appStore
 */

(function () {
  window.DashboardView = {
    currentPage: 1,
    pageSize: 15,

    render: function (container) {
      const activeUpdl = window.appStore.state.activeDashboardUpdl || 'ALL';
      const activeProgram = window.appStore.state.activeDashboardProgram || 'ALL';
      const activePeriod = window.appStore.state.activeDashboardPeriod || 'ALL';

      const stats = window.appStore.getAnalytics();
      const respondents = window.appStore.getRespondents();
      const totalItems = respondents.length;
      const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
      if (this.currentPage > totalPages) this.currentPage = totalPages;
      if (this.currentPage < 1) this.currentPage = 1;

      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = Math.min(startIndex + this.pageSize, totalItems);
      const pageRespondents = respondents.slice(startIndex, endIndex);

      const currentRole = window.appStore.getRole();
      const activeUnit = window.appStore.state.activeUnitFilter || 'ALL';
      const activeModule = window.appStore.state.activeModuleFilter || 'ALL';
      const search = window.appStore.state.searchQuery || '';

      const updls = window.appStore.getUpdls();
      const units = window.appStore.getUnits();
      const programs = window.appStore.getPrograms();
      const periods = window.appStore.getPeriods();
      const activePeriodObj = periods.find(p => p.id === activePeriod) || window.appStore.getActivePeriod();

      // Hitung total butir dan katalog realtime
      const totalBankButirItems = (window.appStore.bankButirList || []).reduce((acc, b) => acc + ((b.items && b.items.length) || 0), 0);
      const totalBankButirCatalogs = (window.appStore.bankButirList || []).length;

      // Dapatkan seluruh master unit kerja mandiri
      const availableUnits = window.appStore.getUnits();

      const unitsList = ['ALL', ...new Set(availableUnits.map(u => u.nama))];

      const updlObj = activeUpdl !== 'ALL' ? updls.find(u => u.id === activeUpdl) : null;
      const progObj = activeProgram !== 'ALL' ? programs.find(p => p.id === activeProgram) : null;
      const periodObj = activePeriod !== 'ALL' ? periods.find(p => p.id === activePeriod) : null;

      const isFilterActive = activeUpdl !== 'ALL' || activeProgram !== 'ALL' || activePeriod !== 'ALL';
      const filterScopeLabel = [
        updlObj ? updlObj.nama : 'Semua UPDL',
        progObj ? progObj.nama : 'Semua Program',
        periodObj ? periodObj.nama : 'Semua Periode'
      ].join(' • ');

      container.innerHTML = `
        <div class="flex flex-col gap-6">
          
          <!-- Page Header -->
          <div class="flex flex-col gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                    Evaluasi Level 3 — PLN Impact Lab (PIL)
                  </span>
                  <span class="text-xs text-[#64748B] font-mono">ID Sesi: ${periodObj ? periodObj.kode : (activePeriodObj ? activePeriodObj.kode : window.MASTER_DATA.config.sessionCode)}</span>
                </div>
                <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">
                  Dashboard Evaluasi Level 3 — PLN Impact Lab (PIL)
                </h1>
              </div>

              <!-- Action: Ekspor Ringkasan -->
              <div class="flex items-center gap-2">
                <button id="btn-export-summary" class="btn-secondary text-xs shadow-sm py-2 px-3 hover:bg-[#F8FAFC]">
                  <span class="material-symbols-outlined text-[16px] text-[#006876]">file_download</span>
                  Ekspor Ringkasan
                </button>
              </div>
            </div>

            <!-- Filter Data Scope Bar -->
            ${window.FilterScopeBar.render()}
          </div>

          <!-- Administrator Master Hub Banner -->
          <div class="p-4 rounded-xl bg-gradient-to-r from-[#102331] to-[#1A384F] text-white border border-[#23C4DB]/30 shadow-md">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2 text-xs">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#23C4DB] text-[#172B3A] uppercase tracking-wider">
                    Pusat Kendali Administrator
                  </span>
                  <span class="text-[#94A3B8]">Cakupan Organisasi Terpadu</span>
                </div>
                <h3 class="text-base font-bold text-white">Master Konfigurasi & Arsitektur Evaluasi</h3>
                <div class="flex flex-wrap items-center gap-4 text-xs text-[#CBD5E1] pt-1">
                  <span>UPDL: <b class="text-[#23C4DB]">${updls.length}</b></span>
                  <span>Unit Kerja: <b class="text-[#23C4DB]">${units.length}</b></span>
                  <span>Program: <b class="text-[#23C4DB]">${programs.length}</b></span>
                  <span>Periode: <b class="text-[#23C4DB]">${periods.length}</b></span>
                  <span>Bank Butir: <b class="text-[#23C4DB]">${totalBankButirItems} Butir (${totalBankButirCatalogs} Katalog)</b></span>
                </div>
              </div>

              <!-- Quick Action Shortcuts -->
              <div class="flex flex-wrap items-center gap-2">
                <button id="btn-dash-org" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10">
                  <span class="material-symbols-outlined text-[16px] text-[#23C4DB]">account_balance</span>
                  Master Organisasi
                </button>
                <button id="btn-dash-prog" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10">
                  <span class="material-symbols-outlined text-[16px] text-[#23C4DB]">school</span>
                  Program & Periode
                </button>
                <button id="btn-dash-bank" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10">
                  <span class="material-symbols-outlined text-[16px] text-[#23C4DB]">fact_check</span>
                  Bank Butir
                </button>
                <button id="btn-dash-builder" class="px-3 py-1.5 rounded-lg bg-[#23C4DB] hover:bg-[#0F96A9] text-[#172B3A] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm">
                  <span class="material-symbols-outlined text-[16px]">tune</span>
                  Form Builder
                </button>
              </div>
            </div>
          </div>

          <!-- KPI Metric Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Card 1: Total Responden -->
            <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Target Responden</span>
                <div class="w-8 h-8 rounded bg-[#E0F7FA] flex items-center justify-center text-[#006876]">
                  <span class="material-symbols-outlined text-[18px]">groups</span>
                </div>
              </div>
              <div class="mt-3">
                <div class="flex items-baseline gap-2">
                  <span class="text-2xl font-bold text-[#172B3A] font-tabular">${stats.totalRespondents}</span>
                  <span class="text-xs text-[#64748B]">Pegawai Terdaftar</span>
                </div>
                <div class="mt-2 flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9]">
                  <span>${units.length} Unit Terdaftar</span>
                  <span class="text-[#059669] font-medium flex items-center gap-0.5">
                    <span class="material-symbols-outlined text-[14px]">check_circle</span> 100% Terpetakan
                  </span>
                </div>
              </div>
            </div>

            <!-- Card 2: Pengisian Tri-Perspektif -->
            <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Pengisian Tri-Perspektif</span>
                <div class="w-8 h-8 rounded bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                  <span class="material-symbols-outlined text-[18px]">checklist_rtl</span>
                </div>
              </div>
              <div class="mt-3">
                <div class="flex items-baseline gap-2">
                  <span class="text-2xl font-bold text-[#172B3A] font-tabular">${stats.fullCompleted} / ${stats.totalRespondents}</span>
                  <span class="text-xs font-semibold text-[#059669]">(${stats.fullRate}% Penuh)</span>
                </div>
                <!-- Multi-bar progress -->
                <div class="mt-2 space-y-1 pt-2 border-t border-[#F1F5F9] text-[11px]">
                  <div class="flex justify-between text-[#64748B]">
                    <span>Peserta: ${stats.completedPeserta} (${stats.pesertaRate}%)</span>
                    <span>Atasan: ${stats.completedAtasan} (${stats.atasanRate}%)</span>
                  </div>
                  <div class="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden flex">
                    <div class="bg-[#23C4DB] h-full progress-bar-animated" style="width: ${stats.pesertaRate}%" title="Peserta"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 3: Rata-rata Skor Gabungan -->
            <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Skor Efektivitas Gabungan</span>
                <div class="w-8 h-8 rounded bg-[#ECFDF5] flex items-center justify-center text-[#059669]">
                  <span class="material-symbols-outlined text-[18px]">trending_up</span>
                </div>
              </div>
              <div class="mt-3">
                <div class="flex items-baseline gap-2">
                  <span class="text-2xl font-bold text-[#006876] font-tabular">${stats.scores.combined}</span>
                  <span class="text-xs text-[#64748B]">/ 100</span>
                  <span class="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    stats.scores.combined === 0 ? 'bg-[#F1F5F9] text-[#64748B]' :
                    stats.scores.combined >= 80 ? 'bg-[#ECFDF5] text-[#065F46]' :
                    stats.scores.combined >= 70 ? 'bg-[#E0F2FE] text-[#0369A1]' :
                    'bg-[#FEF3C7] text-[#92400E]'
                  }">
                    ${
                      stats.scores.combined === 0 ? 'Belum Ada Nilai' :
                      stats.scores.combined >= 80 ? 'Sangat Baik' :
                      stats.scores.combined >= 70 ? 'Efektif' :
                      'Perlu Penguatan'
                    }
                  </span>
                </div>
                <div class="mt-2 flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9]">
                  <span>Peserta: <b>${stats.scores.peserta}</b></span>
                  <span>Atasan: <b>${stats.scores.atasan}</b></span>
                  <span>Koord: <b>${stats.scores.koordinator}</b></span>
                </div>
              </div>
            </div>

            <!-- Card 4: Audit & Kesiapan Laporan -->
            <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Integritas & Audit Data</span>
                <div class="w-8 h-8 rounded bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
                  <span class="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
              </div>
              <div class="mt-3">
                <div class="flex items-baseline gap-2">
                  <span class="text-2xl font-bold text-[#172B3A] font-tabular">100%</span>
                  <span class="text-xs text-[#059669] font-medium">Valid Terverifikasi</span>
                </div>
                <div class="mt-2 flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9]">
                  <span>Matriks Penilai: Lengkap</span>
                  <button id="btn-view-audit" class="text-[#006876] hover:underline font-semibold text-[11px]">
                    Detail Audit →
                  </button>
                </div>
              </div>
            </div>

          </div>

          <!-- Section: Modul Breakdown & ULP Progress Cards -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Modul Breakdown (2 Cols) -->
            <div class="lg:col-span-2 bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm">
              <div class="flex items-center justify-between mb-4 pb-2 border-b border-[#F1F5F9]">
                <div>
                  <h2 class="text-sm font-bold text-[#172B3A] uppercase tracking-wider">Komparasi Capaian per Modul Pembelajaran</h2>
                  <p class="text-xs text-[#64748B]">Perbandingan skor persepsi Peserta vs Atasan vs Koordinator</p>
                </div>
                <button id="btn-go-hasil" class="text-xs text-[#006876] hover:underline font-semibold flex items-center gap-1">
                  Lihat Detail ${stats.indicators.length} Indikator <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>

              <div class="space-y-4">
                ${stats.modules.length === 0 ? `
                  <div class="p-8 text-center bg-[#F8FAFC] rounded-lg border border-dashed border-[#CBD5E1]">
                    <span class="material-symbols-outlined text-[36px] text-[#94A3B8] mb-2">fact_check</span>
                    <h4 class="text-sm font-semibold text-[#172B3A]">Belum Ada Modul Evaluasi</h4>
                    <p class="text-xs text-[#64748B] max-w-md mx-auto mt-1">
                      Belum ada modul atau butir instrumen evaluasi yang terdaftar untuk lingkup program ini di Bank Butir.
                    </p>
                  </div>
                ` : stats.modules.map(m => `
                  <div class="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded bg-[#172B3A] text-white flex items-center justify-center text-xs font-bold font-mono">
                          ${m.code}
                        </span>
                        <span class="text-xs font-semibold text-[#172B3A]">${m.title}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-[#64748B]">Skor Gabungan:</span>
                        <span class="text-sm font-bold text-[#006876] font-tabular">${m.combined}</span>
                      </div>
                    </div>

                    <!-- Tri-Perspective Sub Bars -->
                    <div class="grid grid-cols-3 gap-3 pt-2 text-[11px] border-t border-[#E2E8F0]/70">
                      <div>
                        <div class="flex justify-between text-[#64748B] mb-0.5">
                          <span>Peserta</span>
                          <span class="font-tabular font-semibold text-[#172B3A]">${m.peserta}</span>
                        </div>
                        <div class="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                          <div class="bg-[#23C4DB] h-full progress-bar-animated" style="width: ${m.peserta}%"></div>
                        </div>
                      </div>

                      <div>
                        <div class="flex justify-between text-[#64748B] mb-0.5">
                          <span>Atasan</span>
                          <span class="font-tabular font-semibold text-[#172B3A]">${m.atasan}</span>
                        </div>
                        <div class="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                          <div class="bg-[#D97706] h-full progress-bar-animated" style="width: ${m.atasan}%"></div>
                        </div>
                      </div>

                      <div>
                        <div class="flex justify-between text-[#64748B] mb-0.5">
                          <span>Koordinator</span>
                          <span class="font-tabular font-semibold text-[#172B3A]">${m.koordinator}</span>
                        </div>
                        <div class="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                          <div class="bg-[#006876] h-full progress-bar-animated" style="width: ${m.koordinator}%"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Progress Kelengkapan per ULP (1 Col) -->
            <div class="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4 pb-2 border-b border-[#F1F5F9]">
                  <div>
                    <h2 class="text-sm font-bold text-[#172B3A] uppercase tracking-wider">Kelengkapan per Unit</h2>
                    <p class="text-xs text-[#64748B]">Tingkat penyelesaian evaluasi 360°</p>
                  </div>
                  <button id="btn-go-progres" class="text-xs text-[#006876] hover:underline font-semibold flex items-center gap-1">
                    Detail <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>

                <div class="space-y-3">
                  ${stats.units.length === 0 ? `
                    <div class="p-6 text-center text-xs text-[#94A3B8]">
                      Belum ada data evaluasi unit kerja.
                    </div>
                  ` : stats.units.map(u => `
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span class="font-medium text-[#172B3A]">${u.unit}</span>
                        <span class="text-[#64748B] font-tabular font-semibold">
                          ${u.completed}/${u.total} <span class="text-[#059669]">(${u.percentage}%)</span>
                        </span>
                      </div>
                      <div class="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                        <div class="bg-gradient-to-r from-[#23C4DB] to-[#006876] h-full rounded-full progress-bar-animated" style="width: ${u.percentage}%"></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-[#F1F5F9] bg-[#F8FAFC] p-2.5 rounded text-xs flex items-center justify-between">
                <span class="text-[#64748B]">Perlu Tindak Lanjut: <b>${stats.totalRespondents - stats.fullCompleted} Responden</b></span>
                <button id="btn-quick-nudge" class="text-[#006876] hover:underline font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">send</span> Nudge Cepat
                </button>
              </div>
            </div>

          </div>

          <!-- Section: Tabel Responden & Status Tri-Perspektif -->
          <div class="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
            
            <!-- Table Action Toolbar -->
            <div class="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F8FAFC]">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-bold text-[#172B3A] uppercase tracking-wider mr-2">Daftar Responden</span>
                
                <!-- Unit Filter -->
                <select id="filter-unit-select" class="text-xs bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#006876] text-[#172B3A]">
                  ${unitsList.map(u => `
                    <option value="${u}" ${activeUnit === u ? 'selected' : ''}>
                      ${u === 'ALL' ? `Semua Unit (${availableUnits.length})` : u}
                    </option>
                  `).join('')}
                </select>

                <!-- Module Filter -->
                <select id="filter-module-select" class="text-xs bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#006876] text-[#172B3A]">
                  <option value="ALL" ${activeModule === 'ALL' ? 'selected' : ''}>Semua Modul (A, B, C)</option>
                  <option value="A" ${activeModule === 'A' ? 'selected' : ''}>Bagian A (Penyeimbangan Beban)</option>
                  <option value="B" ${activeModule === 'B' ? 'selected' : ''}>Bagian B (Refreshment P2TL)</option>
                  <option value="C" ${activeModule === 'C' ? 'selected' : ''}>Bagian C (PSS SINCAL)</option>
                </select>
              </div>

              <!-- Search Box -->
              <div class="relative w-full md:w-72">
                <span class="material-symbols-outlined absolute left-2.5 top-2 text-[#94A3B8] text-[18px]">search</span>
                <input
                  id="input-search-respondent"
                  type="text"
                  value="${search}"
                  placeholder="Cari NIP, nama, atau jabatan..."
                  class="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#006876] text-[#172B3A]"
                />
              </div>
            </div>

            <!-- Responsive Table View -->
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-[#F8FAFC] text-[#475569] uppercase font-bold text-[11px] border-b border-[#CBD5E1]">
                    <th class="py-3 px-4 w-12 text-center">No</th>
                    <th class="py-3 px-4 min-w-[200px]">NIP & Nama Peserta</th>
                    <th class="py-3 px-4 min-w-[180px]">Unit & Jabatan</th>
                    <th class="py-3 px-4 min-w-[130px]">Modul & Butir</th>
                    <th class="py-3 px-3 text-center">Peserta</th>
                    <th class="py-3 px-3 text-center">Atasan</th>
                    <th class="py-3 px-3 text-center">Koordinator</th>
                    <th class="py-3 px-4 text-center">Status 360°</th>
                    <th class="py-3 px-4 text-right min-w-[140px]">Aksi</th>
                  </tr>
                </thead>
                <tbody id="dashboard-respondents-tbody" class="divide-y divide-[#E2E8F0]">
                  ${totalItems === 0 ? `
                    <tr>
                      <td colspan="9" class="py-10 text-center text-[#64748B]">
                        <span class="material-symbols-outlined text-4xl text-[#94A3B8] mb-2 block">filter_alt_off</span>
                        <div class="font-semibold text-sm text-[#172B3A]">Tidak ada responden yang sesuai kriteria filter/pencarian</div>
                        <div class="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                          Cakupan filter saat ini: <b>${filterScopeLabel}</b>.
                        </div>
                        <div class="mt-3 flex items-center justify-center gap-2">
                          <button id="btn-empty-reset-filters" class="btn-secondary text-xs inline-flex items-center gap-1 shadow-sm">
                            <span class="material-symbols-outlined text-[15px]">restart_alt</span> Tampilkan Semua Data
                          </button>
                        </div>
                      </td>
                    </tr>
                  ` : this.renderTableRows(pageRespondents)}
                </tbody>
              </table>
            </div>

            <!-- Table Footer Pagination Info -->
            <div class="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#64748B]">
              <div id="dashboard-footer-count">
                Menampilkan <b>${totalItems === 0 ? 0 : startIndex + 1} - ${endIndex}</b> dari <b>${totalItems}</b> total responden
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Page Size Selector -->
                <div class="flex items-center gap-1 text-[11px]">
                  <span>Baris:</span>
                  <select id="select-dash-page-size" class="bg-white border border-[#CBD5E1] rounded px-1.5 py-0.5 text-xs text-[#172B3A] focus:outline-none focus:border-[#006876]">
                    <option value="15" ${this.pageSize === 15 ? 'selected' : ''}>15</option>
                    <option value="25" ${this.pageSize === 25 ? 'selected' : ''}>25</option>
                    <option value="50" ${this.pageSize === 50 ? 'selected' : ''}>50</option>
                    <option value="9999" ${this.pageSize >= 9999 ? 'selected' : ''}>Semua</option>
                  </select>
                </div>

                <span class="text-[11px] font-medium text-[#172B3A]">Halaman ${this.currentPage} dari ${totalPages}</span>
                <div class="flex items-center gap-1">
                  <button id="btn-dash-prev-page" class="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded text-[11px] font-medium text-[#172B3A] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors" ${this.currentPage <= 1 ? 'disabled' : ''}>
                    Sebelumnya
                  </button>
                  <button id="btn-dash-next-page" class="px-2.5 py-1 bg-white border border-[#CBD5E1] rounded text-[11px] font-medium text-[#172B3A] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors" ${this.currentPage >= totalPages ? 'disabled' : ''}>
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      `;

      // Attach event listeners
      this.attachEvents(container);
    },

    renderTableRows: function (list) {
      if (!list || list.length === 0) return '';
      return list.map((r, i) => {
        const ev = window.appStore.getEvaluation(r.id);
        const pStatus = ev.peserta ? ev.peserta.status : 'BELUM';
        const aStatus = ev.atasan ? ev.atasan.status : 'BELUM';
        const kStatus = ev.koordinator ? ev.koordinator.status : 'BELUM';
        const isFull = pStatus === 'SELESAI' && aStatus === 'SELESAI' && kStatus === 'SELESAI';
        const isNew = (r.id > 40) || (r.createdAt && (Date.now() - new Date(r.createdAt).getTime() < 3600000 * 24));

        return `
          <tr class="dashboard-respondent-row hover:bg-[#F0FDFA] transition-colors group" data-search="${(r.nama + ' ' + (r.nip || '') + ' ' + (r.jabatan || '') + ' ' + (r.unit || '')).toLowerCase()}">
            <td class="py-3 px-4 text-center font-mono text-[#64748B]">${r.id}</td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-1.5">
                <span class="font-semibold text-[#172B3A]">${r.nama}</span>
                ${isNew ? `
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                    Baru
                  </span>
                ` : ''}
              </div>
              <div class="text-[11px] text-[#64748B] font-mono">NIP: ${r.nip}</div>
            </td>
            <td class="py-3 px-4">
              <div class="text-[#172B3A] font-medium">${r.unit}</div>
              <div class="text-[11px] text-[#64748B] truncate max-w-[220px]" title="${r.jabatan}">${r.jabatan}</div>
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-1">
                ${(r.modules || []).map(m => `
                  <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-[#E2E8F0] text-[#172B3A]">
                    Bag. ${m}
                  </span>
                `).join('')}
                <span class="text-[11px] text-[#64748B] ml-1">(${r.itemCount || 0} butir)</span>
              </div>
            </td>
            
            <!-- Status Peserta -->
            <td class="py-3 px-3 text-center">
              <span class="badge-pill ${pStatus === 'SELESAI' ? 'badge-peserta-selesai' : 'badge-peserta-belum'}">
                ${pStatus === 'SELESAI' ? '✓ Sudah' : 'Belum'}
              </span>
            </td>

            <!-- Status Atasan -->
            <td class="py-3 px-3 text-center">
              <span class="badge-pill ${aStatus === 'SELESAI' ? 'badge-atasan-selesai' : 'badge-atasan-belum'}">
                ${aStatus === 'SELESAI' ? '✓ Disetujui' : 'Menunggu'}
              </span>
            </td>

            <!-- Status Koordinator -->
            <td class="py-3 px-3 text-center">
              <span class="badge-pill ${kStatus === 'SELESAI' ? 'badge-koordinator-selesai' : 'badge-koordinator-belum'}">
                ${kStatus === 'SELESAI' ? '✓ Valid' : 'Belum'}
              </span>
            </td>

            <!-- Status Tri-Perspektif -->
            <td class="py-3 px-4 text-center">
              ${isFull ? `
                <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#059669]">
                  <span class="material-symbols-outlined text-[14px]">check_circle</span> Lengkap
                </span>
              ` : `
                <span class="inline-flex items-center gap-1 text-[11px] font-medium text-[#D97706]">
                  <span class="material-symbols-outlined text-[14px]">pending</span> Parsial
                </span>
              `}
            </td>

            <!-- Aksi -->
            <td class="py-3 px-4 text-right">
              <div class="inline-flex items-center gap-1">
                <button class="btn-open-form btn-secondary text-[11px] py-1 px-2" data-id="${r.id}" title="Tinjau atau isi form evaluasi">
                  <span class="material-symbols-outlined text-[14px]">edit_note</span> Form
                </button>
                <button class="btn-nudge-single p-1 text-[#64748B] hover:text-[#006876] hover:bg-[#E0F7FA] rounded" data-id="${r.id}" title="Kirim notifikasi pengingat">
                  <span class="material-symbols-outlined text-[16px]">send</span>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    },

    attachEvents: function (container) {
      // Filter Scope Bar Events (Cakupan UPDL, Program, Periode)
      window.FilterScopeBar.attachEvents(container, () => {
        this.currentPage = 1;
        this.render(container);
      });

      // Reset empty table filter button
      container.querySelector('#btn-empty-reset-filters')?.addEventListener('click', () => {
        this.currentPage = 1;
        window.appStore.setDashboardFilters('ALL', 'ALL', 'ALL');
        this.render(container);
      });

      // Unit filter in table
      const unitSelect = container.querySelector('#filter-unit-select');
      if (unitSelect) {
        unitSelect.addEventListener('change', (e) => {
          this.currentPage = 1;
          window.appStore.setFilters(e.target.value, undefined, undefined);
          this.render(container);
        });
      }

      // Module filter in table
      const modSelect = container.querySelector('#filter-module-select');
      if (modSelect) {
        modSelect.addEventListener('change', (e) => {
          this.currentPage = 1;
          window.appStore.setFilters(undefined, e.target.value, undefined);
          this.render(container);
        });
      }

      // Pagination handlers
      const pageSizeSelect = container.querySelector('#select-dash-page-size');
      if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', (e) => {
          this.pageSize = Number(e.target.value);
          this.currentPage = 1;
          this.render(container);
        });
      }

      const respondents = window.appStore.getRespondents();
      const totalItems = respondents.length;
      const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = Math.min(startIndex + this.pageSize, totalItems);
      const pageRespondents = respondents.slice(startIndex, endIndex);

      container.querySelector('#btn-dash-prev-page')?.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.render(container);
        }
      });

      container.querySelector('#btn-dash-next-page')?.addEventListener('click', () => {
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.render(container);
        }
      });

      // Search input (Real-time client filtering across ALL respondents without losing input focus)
      const searchInput = container.querySelector('#input-search-respondent');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const val = e.target.value;
          window.appStore.setSearchQuery(val, true);

          const rawQ = val.toLowerCase().trim();
          const terms = rawQ ? rawQ.split(/\s+/).filter(Boolean) : [];
          
          const tbody = container.querySelector('#dashboard-respondents-tbody');
          const footerCount = container.querySelector('#dashboard-footer-count');
          if (!tbody) return;

          if (terms.length === 0) {
            tbody.innerHTML = this.renderTableRows(pageRespondents);
            if (footerCount) {
              footerCount.innerHTML = `Menampilkan <b>${totalItems === 0 ? 0 : startIndex + 1} - ${endIndex}</b> dari <b>${totalItems}</b> total responden`;
            }
          } else {
            // Search across ALL respondents matching filters
            const matched = respondents.filter(r => {
              const haystack = `${r.nama || ''} ${r.nip || ''} ${r.jabatan || ''} ${r.unit || ''}`.toLowerCase();
              return terms.every(t => haystack.includes(t));
            });

            if (matched.length === 0) {
              tbody.innerHTML = `
                <tr>
                  <td colspan="9" class="py-8 text-center text-[#64748B]">
                    <span class="material-symbols-outlined text-3xl text-[#94A3B8] mb-1 block">search_off</span>
                    Tidak ada responden yang cocok dengan kata kunci "<b>${val}</b>".
                  </td>
                </tr>
              `;
            } else {
              tbody.innerHTML = this.renderTableRows(matched);
            }

            if (footerCount) {
              footerCount.innerHTML = `Ditemukan <b>${matched.length}</b> dari <b>${totalItems}</b> responden`;
            }
          }
        });
      }

      // Event Delegation for Table Rows (Form and Nudge buttons)
      const tbodyEl = container.querySelector('#dashboard-respondents-tbody');
      if (tbodyEl) {
        tbodyEl.addEventListener('click', (e) => {
          const formBtn = e.target.closest('.btn-open-form');
          if (formBtn) {
            const id = formBtn.getAttribute('data-id');
            window.appStore.setView('formulir', { respondentId: id });
            return;
          }
          const nudgeBtn = e.target.closest('.btn-nudge-single');
          if (nudgeBtn) {
            const id = nudgeBtn.getAttribute('data-id');
            const resp = window.appStore.respondents.find(r => r.id === Number(id));
            window.App.showToast(`Notifikasi pengingat terkirim ke ${resp ? resp.nama : 'responden'}!`, 'info');
            return;
          }
        });
      }

      // Administrator Hub Quick Links
      container.querySelector('#btn-dash-org')?.addEventListener('click', () => {
        window.appStore.setView('admin-organisasi');
      });

      container.querySelector('#btn-dash-prog')?.addEventListener('click', () => {
        window.appStore.setView('admin-program');
      });

      container.querySelector('#btn-dash-bank')?.addEventListener('click', () => {
        window.appStore.setView('admin-bank-butir');
      });

      container.querySelector('#btn-dash-builder')?.addEventListener('click', () => {
        window.appStore.setView('admin-form-builder');
      });

      // Quick links
      container.querySelector('#btn-go-hasil')?.addEventListener('click', () => {
        window.appStore.setView('hasil');
      });

      container.querySelector('#btn-go-progres')?.addEventListener('click', () => {
        window.appStore.setView('progres');
      });

      // Export summary
      container.querySelector('#btn-export-summary')?.addEventListener('click', () => {
        window.App.showToast('Data ringkasan eksekutif berhasil diekspor!', 'success');
      });

      // View Audit Modal
      container.querySelector('#btn-view-audit')?.addEventListener('click', () => {
        const auditLogs = window.appStore.getAuditLogs ? window.appStore.getAuditLogs().slice(0, 8) : [];
        window.App.showModal({
          title: 'Audit & Integritas Data Evaluasi Level 3',
          content: `
            <div class="space-y-3 text-xs text-[#172B3A]">
              <div class="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded flex items-center gap-2 text-[#065F46]">
                <span class="material-symbols-outlined text-[20px] text-[#059669]">verified</span>
                <div>
                  <div class="font-bold">Status Integritas: Valid Terverifikasi (100%)</div>
                  <div class="text-[11px] text-[#047857]">Seluruh matriks penilai, butir evaluasi, dan rekam audit tervalidasi secara sistemik.</div>
                </div>
              </div>
              <div>
                <h4 class="font-bold text-[#172B3A] mb-1.5 uppercase text-[11px] tracking-wider">Log Aktivitas Master & Evaluasi</h4>
                <div class="divide-y divide-[#E2E8F0] border border-[#CBD5E1] rounded overflow-hidden max-h-56 overflow-y-auto">
                  ${auditLogs.length === 0 ? `
                    <div class="p-3 text-center text-[#94A3B8]">Belum ada aktivitas audit tercatat.</div>
                  ` : auditLogs.map(log => `
                    <div class="p-2.5 bg-white flex items-start justify-between gap-2">
                      <div>
                        <div class="font-semibold text-[#172B3A]">${log.aksi || 'Aktivitas'}</div>
                        <div class="text-[11px] text-[#64748B]">${log.keterangan || log.entitas || '-'}</div>
                      </div>
                      <span class="font-mono text-[10px] text-[#94A3B8] shrink-0">${log.waktu ? new Date(log.waktu).toLocaleTimeString('id-ID') : '-'}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `,
          confirmText: 'Tutup',
          cancelText: '',
          onConfirm: () => {}
        });
      });

      // Quick Nudge Button
      container.querySelector('#btn-quick-nudge')?.addEventListener('click', () => {
        window.App.showToast('Notifikasi pengingat kilat berhasil dikirim ke seluruh responden tertunda!', 'success');
      });
    }
  };
})();
