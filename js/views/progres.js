/**
 * View: Monitoring Progres Pengisian
 * Berbasis preferensi/progres_pengisian/code.html
 * Memantau progres kelengkapan evaluasi 360° secara real-time
 */

(function () {
  window.ProgresView = {
    activeStatusTab: 'all', // 'all' | 'followup' | 'completed' | 'unstarted'

    render: function (container) {
      const stats = window.appStore.getAnalytics();
      let respondents = window.appStore.getRespondents();
      const search = window.appStore.state.searchQuery || '';
      const activeUnit = window.appStore.state.activeUnitFilter || 'ALL';

      // Hitung kategori tab status
      const totalAll = respondents.length;
      const completedList = respondents.filter(r => {
        const ev = window.appStore.getEvaluation(r.id);
        return ev.peserta?.status === 'SELESAI' && ev.atasan?.status === 'SELESAI' && ev.koordinator?.status === 'SELESAI';
      });
      const unstartedList = respondents.filter(r => {
        const ev = window.appStore.getEvaluation(r.id);
        return (!ev.peserta || ev.peserta.status === 'BELUM') && (!ev.atasan || ev.atasan.status === 'BELUM') && (!ev.koordinator || ev.koordinator.status === 'BELUM');
      });
      const followupList = respondents.filter(r => !completedList.includes(r) && !unstartedList.includes(r));

      // Filter berdasarkan Tab Aktif
      if (this.activeStatusTab === 'completed') {
        respondents = completedList;
      } else if (this.activeStatusTab === 'followup') {
        respondents = followupList;
      } else if (this.activeStatusTab === 'unstarted') {
        respondents = unstartedList;
      }

      const availableUnits = window.appStore.getUnits(null, true);
      const unitsList = ['ALL', ...new Set(availableUnits.map(u => u.nama))];

      container.innerHTML = `
        <div class="flex flex-col gap-6">
          
          <!-- Header Monitoring Progres -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col gap-1 max-w-3xl">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                  PLN Impact Lab (PIL)
                </span>
                <span class="text-xs text-[#64748B] font-mono">#EV3-MTR-2024.1</span>
                <span class="text-xs text-[#94A3B8]">•</span>
                <span class="text-xs text-[#64748B]">Monitoring Progres Pengisian Real-Time</span>
              </div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">
                Monitoring Progres Pengisian Evaluasi
              </h1>
              <p class="text-xs md:text-sm text-[#64748B] leading-relaxed">
                Pelacakan kelengkapan asesmen Tri-Perspektif (Peserta, Atasan Langsung, Koordinator) lintas 6 unit layanan UP3 Metro dengan sistem pengingat otomatis.
              </p>
            </div>

            <!-- Toolbar Aksi -->
            <div class="flex flex-wrap items-center gap-2">
              <button id="btn-export-progres-excel" class="btn-secondary">
                <span class="material-symbols-outlined text-[16px]">download</span>
                Ekspor XLSX
              </button>
              <button id="btn-broadcast-reminder" class="btn-primary">
                <span class="material-symbols-outlined text-[16px]">forward_to_inbox</span>
                Kirim Pengingat (Email/WA)
              </button>
            </div>
          </div>

          <!-- Filter Data Scope Bar -->
          ${window.FilterScopeBar.render()}

          <!-- KPI Progress Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Respon Peserta -->
            <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Respon Peserta</span>
                <span class="text-xs font-bold text-[#006876] font-tabular">${stats.pesertaRate}%</span>
              </div>
              <div class="text-2xl font-bold text-[#172B3A] mt-2 font-tabular">
                ${stats.completedPeserta} <span class="text-xs text-[#64748B] font-normal">/ ${stats.totalRespondents} Pegawai</span>
              </div>
              <div class="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-3">
                <div class="bg-[#23C4DB] h-full progress-bar-animated" style="width: ${stats.pesertaRate}%"></div>
              </div>
            </div>

            <!-- Respon Atasan -->
            <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Respon Atasan</span>
                <span class="text-xs font-bold text-[#D97706] font-tabular">${stats.atasanRate}%</span>
              </div>
              <div class="text-2xl font-bold text-[#172B3A] mt-2 font-tabular">
                ${stats.completedAtasan} <span class="text-xs text-[#64748B] font-normal">/ ${stats.totalRespondents} Pegawai</span>
              </div>
              <div class="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-3">
                <div class="bg-[#D97706] h-full progress-bar-animated" style="width: ${stats.atasanRate}%"></div>
              </div>
            </div>

            <!-- Respon Koordinator -->
            <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Respon Koordinator</span>
                <span class="text-xs font-bold text-[#006876] font-tabular">${stats.koordinatorRate}%</span>
              </div>
              <div class="text-2xl font-bold text-[#172B3A] mt-2 font-tabular">
                ${stats.completedKoordinator} <span class="text-xs text-[#64748B] font-normal">/ ${stats.totalRespondents} Pegawai</span>
              </div>
              <div class="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-3">
                <div class="bg-[#006876] h-full progress-bar-animated" style="width: ${stats.koordinatorRate}%"></div>
              </div>
            </div>

            <!-- Selesai Penuh Tri-Perspektif -->
            <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Lengkap 360°</span>
                <span class="text-xs font-bold text-[#059669] font-tabular">${stats.fullRate}%</span>
              </div>
              <div class="text-2xl font-bold text-[#059669] mt-2 font-tabular">
                ${stats.fullCompleted} <span class="text-xs text-[#64748B] font-normal">/ ${stats.totalRespondents} Penuh</span>
              </div>
              <div class="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-3">
                <div class="bg-[#059669] h-full progress-bar-animated" style="width: ${stats.fullRate}%"></div>
              </div>
            </div>

          </div>

          <!-- Insight Callout & Action Bar -->
          <div class="p-4 bg-white rounded-lg border border-[#CBD5E1] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[22px]">notifications_active</span>
              </div>
              <div>
                <h3 class="text-xs font-bold text-[#172B3A]">
                  Terdapat ${totalAll - stats.fullCompleted} Asesmen yang Memerlukan Tindak Lanjut
                </h3>
                <p class="text-[11px] text-[#64748B]">
                  Gunakan pengingat otomatis untuk mempercepat tingkat pengisian sebelum batas waktu penutupan siklus.
                </p>
              </div>
            </div>

            <button id="btn-quick-dispatch-nudge" class="btn-primary shrink-0">
              <span class="material-symbols-outlined text-[16px]">send</span>
              Kirim Nudge Cepat (${totalAll - stats.fullCompleted})
            </button>
          </div>

          <!-- Progres Kelengkapan per Unit Layanan (ULP) -->
          <div class="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm">
            <div class="flex items-center justify-between mb-4 pb-2 border-b border-[#F1F5F9]">
              <div>
                <h2 class="text-sm font-bold text-[#172B3A] uppercase tracking-wider">Progres Kelengkapan per Unit Layanan (ULP)</h2>
                <p class="text-xs text-[#64748B]">Tingkat penyelesaian evaluasi 360° lengkap pada 6 unit kerja binaan</p>
              </div>
              <span class="text-xs text-[#64748B] font-mono">Batas Waktu: 30 November 2026</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${stats.units.map(u => `
                <div class="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-xs text-[#172B3A]">${u.unit}</span>
                    <span class="text-xs font-bold text-[#006876] font-tabular">${u.percentage}%</span>
                  </div>
                  <div class="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                    <div class="bg-[#006876] h-full rounded-full progress-bar-animated" style="width: ${u.percentage}%"></div>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
                    <span>Selesai: <b>${u.completed}/${u.total}</b></span>
                    <span>Peserta: ${u.pDone} • Atasan: ${u.aDone}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Tabel Monitoring Responden & Filter Tabs -->
          <div class="bg-white rounded-lg border border-[#CBD5E1] shadow-sm overflow-hidden flex flex-col">
            
            <!-- Category Tabs Strip -->
            <div class="p-4 border-b border-[#CBD5E1] bg-[#F8FAFC] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-1.5 p-1 bg-[#E2E8F0] rounded border border-[#CBD5E1] text-xs">
                
                <button type="button" class="progres-tab-btn py-1 px-3 rounded font-semibold transition-colors ${this.activeStatusTab === 'all' ? 'bg-[#172B3A] text-white shadow-sm' : 'text-[#475569] hover:bg-white'}" data-tab="all">
                  Semua Status (${totalAll})
                </button>

                <button type="button" class="progres-tab-btn py-1 px-3 rounded font-semibold transition-colors ${this.activeStatusTab === 'followup' ? 'bg-[#172B3A] text-white shadow-sm' : 'text-[#475569] hover:bg-white'}" data-tab="followup">
                  Perlu Tindak Lanjut (${followupList.length})
                </button>

                <button type="button" class="progres-tab-btn py-1 px-3 rounded font-semibold transition-colors ${this.activeStatusTab === 'completed' ? 'bg-[#172B3A] text-white shadow-sm' : 'text-[#475569] hover:bg-white'}" data-tab="completed">
                  Selesai Penuh (${completedList.length})
                </button>

                <button type="button" class="progres-tab-btn py-1 px-3 rounded font-semibold transition-colors ${this.activeStatusTab === 'unstarted' ? 'bg-[#172B3A] text-white shadow-sm' : 'text-[#475569] hover:bg-white'}" data-tab="unstarted">
                  Belum Dimulai (${unstartedList.length})
                </button>

              </div>

              <!-- Unit Filter & Search Box -->
              <div class="flex items-center gap-2">
                <select id="progres-unit-filter" class="text-xs bg-white border border-[#CBD5E1] rounded px-3 py-1.5 text-[#172B3A] focus:outline-none focus:border-[#006876]">
                  ${unitsList.map(u => `
                    <option value="${u}" ${activeUnit === u ? 'selected' : ''}>
                      ${u === 'ALL' ? 'Semua Unit (6)' : u}
                    </option>
                  `).join('')}
                </select>

                <div class="relative w-64">
                  <span class="material-symbols-outlined absolute left-2.5 top-2 text-[#94A3B8] text-[18px]">search</span>
                  <input
                    id="progres-search-input"
                    type="text"
                    value="${search}"
                    placeholder="Cari NIP atau nama..."
                    class="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#006876] text-[#172B3A]"
                  />
                </div>
              </div>
            </div>

            <!-- Responsive Table -->
            <div class="overflow-x-auto w-full">
              <table class="w-full text-left border-collapse text-xs min-w-[1000px]">
                <thead>
                  <tr class="bg-[#F8FAFC] text-[#475569] uppercase font-bold text-[11px] border-b border-[#CBD5E1]">
                    <th class="py-3 px-4 w-12 text-center">No</th>
                    <th class="py-3 px-4 min-w-[200px]">NIP & Nama Peserta</th>
                    <th class="py-3 px-4 min-w-[180px]">Unit & Jabatan</th>
                    <th class="py-3 px-4 min-w-[120px]">Modul</th>
                    <th class="py-3 px-3 text-center">Status Peserta</th>
                    <th class="py-3 px-3 text-center">Status Atasan</th>
                    <th class="py-3 px-3 text-center">Status Koordinator</th>
                    <th class="py-3 px-3 text-center">Kelengkapan 360°</th>
                    <th class="py-3 px-4 text-right min-w-[130px]">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]">
                  ${respondents.length === 0 ? `
                    <tr>
                      <td colspan="9" class="py-8 text-center text-[#64748B]">
                        <span class="material-symbols-outlined text-3xl text-[#94A3B8] mb-1 block">filter_alt_off</span>
                        Tidak ada data responden yang sesuai pada filter ini.
                      </td>
                    </tr>
                  ` : respondents.map(r => {
                    const ev = window.appStore.getEvaluation(r.id);
                    const pStatus = ev.peserta?.status || 'BELUM';
                    const aStatus = ev.atasan?.status || 'BELUM';
                    const kStatus = ev.koordinator?.status || 'BELUM';
                    const isFull = pStatus === 'SELESAI' && aStatus === 'SELESAI' && kStatus === 'SELESAI';

                    return `
                      <tr class="progres-respondent-row hover:bg-[#F0FDFA] transition-colors" data-search="${(r.nama + ' ' + (r.nip || '') + ' ' + (r.jabatan || '') + ' ' + (r.unit || '')).toLowerCase()}">
                        <td class="py-3 px-4 text-center font-mono text-[#64748B]">${r.id}</td>
                        <td class="py-3 px-4">
                          <div class="font-bold text-[#172B3A]">${r.nama}</div>
                          <div class="text-[11px] text-[#64748B] font-mono">NIP: ${r.nip}</div>
                        </td>
                        <td class="py-3 px-4">
                          <div class="font-medium text-[#172B3A]">${r.unit}</div>
                          <div class="text-[10px] text-[#64748B] truncate max-w-[200px]">${r.jabatan}</div>
                        </td>
                        <td class="py-3 px-4">
                          <div class="flex items-center gap-1">
                            ${r.modules.map(m => `
                              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-[#E2E8F0] text-[#172B3A]">
                                ${m}
                              </span>
                            `).join('')}
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

                        <!-- Status 360 -->
                        <td class="py-3 px-3 text-center">
                          ${isFull ? `
                            <span class="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669]">
                              <span class="material-symbols-outlined text-[13px]">check_circle</span> Selesai
                            </span>
                          ` : `
                            <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D97706]">
                              <span class="material-symbols-outlined text-[13px]">schedule</span> Belum Penuh
                            </span>
                          `}
                        </td>

                        <!-- Aksi Terpadu -->
                        <td class="py-3 px-4 text-right">
                          <div class="inline-flex items-center gap-1">
                            <button class="btn-nudge-progres btn-secondary text-[11px] py-1 px-2" data-id="${r.id}" title="Kirim Pengingat Nudge">
                              <span class="material-symbols-outlined text-[13px]">send</span> Nudge
                            </button>
                            <button class="btn-detail-progres p-1 text-[#64748B] hover:text-[#006876] hover:bg-[#E0F7FA] rounded" data-id="${r.id}" title="Detail Evaluasi">
                              <span class="material-symbols-outlined text-[16px]">visibility</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                  <tr id="progres-empty-search-row" class="hidden">
                    <td colspan="9" class="py-8 text-center text-[#64748B]">
                      <span class="material-symbols-outlined text-3xl text-[#94A3B8] mb-1 block">search_off</span>
                      Tidak ada data responden yang sesuai dengan kata kunci pencarian.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Table Footer -->
            <div class="p-3 bg-[#F8FAFC] border-t border-[#CBD5E1] flex items-center justify-between text-xs text-[#64748B]">
              <div id="progres-footer-count">
                Menampilkan <b>${respondents.length}</b> responden pada tab ini
              </div>
              <div>
                Halaman 1 dari 1
              </div>
            </div>

          </div>

        </div>
      `;

      this.attachEvents(container);
    },

    attachEvents: function (container) {
      // Filter Scope Bar Events (Cakupan UPDL, Program, Periode)
      window.FilterScopeBar.attachEvents(container, () => {
        this.render(container);
      });

      // Tab switcher
      container.querySelectorAll('.progres-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.activeStatusTab = e.currentTarget.getAttribute('data-tab');
          this.render(container);
        });
      });

      // Unit filter
      container.querySelector('#progres-unit-filter')?.addEventListener('change', (e) => {
        window.appStore.setFilters(e.target.value, undefined, undefined);
      });

      // Search input (Real-time client filtering without losing focus or destroying DOM input)
      const searchInput = container.querySelector('#progres-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const val = e.target.value;
          window.appStore.setSearchQuery(val, true);

          const rawQ = val.toLowerCase().trim();
          const terms = rawQ ? rawQ.split(/\s+/).filter(Boolean) : [];
          const rows = container.querySelectorAll('.progres-respondent-row');
          let visibleCount = 0;

          rows.forEach(tr => {
            const searchData = tr.getAttribute('data-search') || tr.textContent.toLowerCase();
            const matches = terms.length === 0 || terms.every(t => searchData.includes(t));
            tr.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
          });

          const emptyRow = container.querySelector('#progres-empty-search-row');
          if (emptyRow) {
            emptyRow.style.display = (visibleCount === 0 && rows.length > 0) ? '' : 'none';
          }

          const footerCount = container.querySelector('#progres-footer-count');
          if (footerCount) {
            if (terms.length > 0) {
              footerCount.innerHTML = `Menampilkan <b>${visibleCount}</b> dari ${rows.length} responden terfilter`;
            } else {
              footerCount.innerHTML = `Menampilkan <b>${rows.length}</b> responden pada tab ini`;
            }
          }
        });
      }

      // Nudge Single
      container.querySelectorAll('.btn-nudge-progres').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.currentTarget.getAttribute('data-id'));
          const r = window.appStore.respondents.find(x => x.id === id);
          window.App.showToast(`Notifikasi pengingat WhatsApp & Email berhasil dikirimkan ke ${r ? r.nama : 'responden'}.`, 'success');
        });
      });

      // Detail Progres Modal
      container.querySelectorAll('.btn-detail-progres').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.currentTarget.getAttribute('data-id'));
          const r = window.appStore.respondents.find(x => x.id === id);
          const ev = window.appStore.getEvaluation(id);
          if (!r) return;

          window.App.showModal({
            title: `Detail Status Evaluasi: ${r.nama}`,
            content: `
              <div class="space-y-3 text-xs text-[#172B3A]">
                <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded">
                  <div class="font-bold">${r.nama} (NIP: ${r.nip})</div>
                  <div class="text-[#64748B]">${r.unit} • ${r.jabatan}</div>
                  <div class="text-[#64748B] mt-1">Modul Diikuti: <b>${r.modules.join(', ')}</b> (${r.itemCount} butir)</div>
                </div>

                <div class="space-y-2">
                  <div class="flex items-center justify-between p-2 rounded border border-[#E2E8F0]">
                    <span class="font-semibold">1. Evaluasi Diri Peserta:</span>
                    <span class="badge-pill ${ev.peserta?.status === 'SELESAI' ? 'badge-peserta-selesai' : 'badge-peserta-belum'}">
                      ${ev.peserta?.status === 'SELESAI' ? 'Selesai (Sudah Dinilai)' : 'Belum Selesai'}
                    </span>
                  </div>

                  <div class="flex items-center justify-between p-2 rounded border border-[#E2E8F0]">
                    <span class="font-semibold">2. Atasan (${r.atasan.nama}):</span>
                    <span class="badge-pill ${ev.atasan?.status === 'SELESAI' ? 'badge-atasan-selesai' : 'badge-atasan-belum'}">
                      ${ev.atasan?.status === 'SELESAI' ? 'Disetujui' : 'Menunggu Observasi'}
                    </span>
                  </div>

                  <div class="flex items-center justify-between p-2 rounded border border-[#E2E8F0]">
                    <span class="font-semibold">3. Koordinator (${r.koordinatorEksternal.nama}):</span>
                    <span class="badge-pill ${ev.koordinator?.status === 'SELESAI' ? 'badge-koordinator-selesai' : 'badge-koordinator-belum'}">
                      ${ev.koordinator?.status === 'SELESAI' ? 'Valid Terverifikasi' : 'Belum Diverifikasi'}
                    </span>
                  </div>
                </div>
              </div>
            `,
            confirmText: 'Tutup',
            onConfirm: () => {}
          });
        });
      });

      // Quick Dispatch Nudge & Broadcast
      const handleBroadcast = () => {
        window.App.showModal({
          title: 'Broadcast Pengingat Siklus Evaluasi',
          content: `
            <div class="space-y-3 text-xs text-[#172B3A]">
              <p>Sistem akan memicu automasi pengiriman notifikasi pengingat melalui WhatsApp Enterprise dan Email Gateway PLN.</p>
              <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[11px] font-mono text-[#475569]">
                [PLN UP3 Metro] Yth. Pegawai/Atasan, dimohon untuk segera melengkapi Formulir Evaluasi Pembelajaran Level 3 PIL Penurunan Susut Distribusi pada tautan berikut...
              </div>
            </div>
          `,
          confirmText: 'Kirim Pengingat Sekarang',
          onConfirm: () => {
            window.App.showToast('Pengingat berhasil dikirim secara massal ke seluruh responden tertunda.', 'success');
          }
        });
      };

      container.querySelector('#btn-broadcast-reminder')?.addEventListener('click', handleBroadcast);
      container.querySelector('#btn-quick-dispatch-nudge')?.addEventListener('click', handleBroadcast);

      // Export XLSX
      container.querySelector('#btn-export-progres-excel')?.addEventListener('click', () => {
        window.App.showToast('File laporan progres evaluasi (XLSX) berhasil diekspor.', 'success');
      });
    }
  };
})();
