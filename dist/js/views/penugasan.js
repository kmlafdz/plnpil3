/**
 * View: Penugasan Penilai
 * Berbasis preferensi/penugasan_penilai/code.html
 * Mengelola pemetaan matriks relasi penilai untuk seluruh 40 responden
 */

(function () {
  window.PenugasanView = {
    selectedIds: [],

    render: function (container) {
      const activeDashboardUpdl = window.appStore.state.activeDashboardUpdl || 'ALL';
      const updlObj = activeDashboardUpdl !== 'ALL' ? window.appStore.getUpdlById(activeDashboardUpdl) : null;
      const availableUnits = window.appStore.getUnits(null, true);
      const unitsList = ['ALL', ...new Set(availableUnits.map(u => u.nama))];

      const allRespondents = window.appStore.getRespondents();
      let respondents = [...allRespondents];
      const search = window.appStore.state.searchQuery || '';
      const activeUnit = window.appStore.state.activeUnitFilter || 'ALL';
      const activeModule = window.appStore.state.activeModuleFilter || 'ALL';

      if (activeUnit && activeUnit !== 'ALL') {
        respondents = respondents.filter(r => r.unit === activeUnit);
      }
      if (activeModule && activeModule !== 'ALL') {
        respondents = respondents.filter(r => r.modules && r.modules.includes(activeModule));
      }

      // Hitung metrik penugasan
      let validCount = 0;
      let pendingCount = 0;
      allRespondents.forEach(r => {
        if (r.atasan && r.atasan.nama && r.koordinatorEksternal && r.koordinatorEksternal.nama) {
          validCount++;
        } else {
          pendingCount++;
        }
      });

      const uniqueSupervisors = new Set(allRespondents.map(r => r.atasan?.nip || r.atasan?.nama).filter(Boolean));
      const uniqueCoords = new Set(allRespondents.map(r => r.koordinatorEksternal?.nip || r.koordinatorEksternal?.nama).filter(Boolean));

      container.innerHTML = `
        <div class="flex flex-col gap-6">
          
          <!-- Header Penugasan -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col gap-1 max-w-3xl">
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                  PLN Impact Lab (PIL)
                </span>
                <span class="text-xs text-[#64748B] font-mono">#EV3-MTR-2024.1</span>
                <span class="text-xs text-[#94A3B8]">•</span>
                <span class="text-xs text-[#64748B]">Pemetaan Matriks Multi-Perspektif</span>
              </div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">
                Penugasan Penilai Evaluasi Level 3
              </h1>
              <p class="text-xs md:text-sm text-[#64748B] leading-relaxed">
                Matriks pemetaan evaluator multi-perspektif (Peserta, Atasan Langsung, dan Koordinator Eksternal/Internal) untuk memastikan objektivitas evaluasi efektivitas pembelajaran di lapangan.
              </p>
            </div>

            <!-- Toolbar Aksi Utama -->
            <div class="flex flex-wrap items-center gap-2">
              <button id="btn-download-template-matrix" class="btn-secondary" title="Unduh template Excel resmi untuk impor matriks penugasan">
                <span class="material-symbols-outlined text-[16px] text-[#006876]">download</span>
                Unduh Template Excel
              </button>
              <button id="btn-import-matrix" class="btn-secondary">
                <span class="material-symbols-outlined text-[16px]">file_upload</span>
                Impor Matriks Excel
              </button>
              <button id="btn-add-penugasan" class="btn-primary">
                <span class="material-symbols-outlined text-[16px]">person_add</span>
                + Tambah Penugasan
              </button>
            </div>
          </div>

          <!-- Filter Data Scope Bar -->
          ${window.FilterScopeBar.render()}

          <!-- Summary Metric Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm flex items-center justify-between">
              <div>
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Peserta Terdaftar</span>
                <div class="text-2xl font-bold text-[#172B3A] mt-1 font-tabular">${allRespondents.length}</div>
                <div class="text-[11px] text-[#059669] font-medium mt-0.5">100% Terpetakan Modul</div>
              </div>
              <div class="w-10 h-10 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">group</span>
              </div>
            </div>

            <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm flex items-center justify-between">
              <div>
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Relasi Siap & Valid</span>
                <div class="text-2xl font-bold text-[#059669] mt-1 font-tabular">${validCount}</div>
                <div class="text-[11px] text-[#64748B] mt-0.5">Atasan & Koordinator Terpasang</div>
              </div>
              <div class="w-10 h-10 rounded bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">verified</span>
              </div>
            </div>

            <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm flex items-center justify-between">
              <div>
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Perlu Penyesuaian</span>
                <div class="text-2xl font-bold text-[#D97706] mt-1 font-tabular">${pendingCount}</div>
                <div class="text-[11px] text-[#64748B] mt-0.5">Menunggu konfirmasi atasan</div>
              </div>
              <div class="w-10 h-10 rounded bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">pending_actions</span>
              </div>
            </div>

            <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm flex items-center justify-between">
              <div>
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Penilai Terlibat</span>
                <div class="text-2xl font-bold text-[#006876] mt-1 font-tabular">${uniqueSupervisors.size + uniqueCoords.size}</div>
                <div class="text-[11px] text-[#64748B] mt-0.5">${uniqueSupervisors.size} Atasan + ${uniqueCoords.size} Koord</div>
              </div>
              <div class="w-10 h-10 rounded bg-[#E0F7FA] text-[#006876] flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">badge</span>
              </div>
            </div>

          </div>

          <!-- Table Container -->
          <div class="bg-white rounded-lg border border-[#CBD5E1] shadow-sm overflow-hidden flex flex-col">
            
            <!-- Toolbar Filter -->
            <div class="p-4 border-b border-[#CBD5E1] bg-[#F8FAFC] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-2.5">
                
                <!-- Filter Unit -->
                <select id="penugasan-unit-select" class="text-xs bg-white border border-[#CBD5E1] rounded px-3 py-1.5 focus:outline-none focus:border-[#006876] text-[#172B3A]">
                  ${unitsList.map(u => `
                    <option value="${u}" ${activeUnit === u ? 'selected' : ''}>
                      ${u === 'ALL' ? (updlObj ? `Semua Unit di ${updlObj.nama} (${availableUnits.length})` : `Semua Unit (${availableUnits.length})`) : u}
                    </option>
                  `).join('')}
                </select>

                <!-- Filter Modul -->
                <select id="penugasan-mod-select" class="text-xs bg-white border border-[#CBD5E1] rounded px-3 py-1.5 focus:outline-none focus:border-[#006876] text-[#172B3A]">
                  <option value="ALL" ${activeModule === 'ALL' ? 'selected' : ''}>Semua Modul (A, B, C)</option>
                  <option value="A" ${activeModule === 'A' ? 'selected' : ''}>Bagian A (Penyeimbangan Beban)</option>
                  <option value="B" ${activeModule === 'B' ? 'selected' : ''}>Bagian B (Refreshment P2TL)</option>
                  <option value="C" ${activeModule === 'C' ? 'selected' : ''}>Bagian C (PSS SINCAL)</option>
                </select>

                <!-- Filter Status -->
                <select id="penugasan-status-select" class="text-xs bg-white border border-[#CBD5E1] rounded px-3 py-1.5 focus:outline-none focus:border-[#006876] text-[#172B3A]">
                  <option value="ALL">Status Relasi: Semua</option>
                  <option value="VALID">Lengkap & Valid</option>
                  <option value="PENDING">Perlu Aksi</option>
                </select>

              </div>

              <!-- Search Box -->
              <div class="relative w-full lg:w-72">
                <span class="material-symbols-outlined absolute left-2.5 top-2 text-[#94A3B8] text-[18px]">search</span>
                <input
                  id="penugasan-search-input"
                  type="text"
                  value="${search}"
                  placeholder="Cari NIP, nama peserta, atau jabatan..."
                  class="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#006876] text-[#172B3A]"
                />
              </div>
            </div>

            <!-- Batch Action Ribbon (Muncul saat baris dicentang) -->
            <div id="batch-ribbon" class="${this.selectedIds.length > 0 ? '' : 'hidden'} bg-[#EFF6FF] px-4 py-2 border-b border-[#BFDBFE] flex items-center justify-between">
              <div class="flex items-center gap-3 text-xs">
                <span class="font-bold text-[#1E40AF]" id="batch-selected-count">
                  ${this.selectedIds.length} Peserta Dipilih
                </span>
                <span class="h-4 w-[1px] bg-[#93C5FD]"></span>
                <button id="btn-batch-assign-sup" class="text-[#1D4ED8] hover:underline font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">supervisor_account</span>
                  Tetapkan Atasan Kolektif
                </button>
                <button id="btn-batch-assign-coord" class="text-[#1D4ED8] hover:underline font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">assignment_turned_in</span>
                  Tetapkan Koordinator Kolektif
                </button>
                <button id="btn-batch-send-notif" class="text-[#1D4ED8] hover:underline font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">send</span>
                  Kirim Notifikasi Akses
                </button>
                <span class="h-4 w-[1px] bg-[#93C5FD]"></span>
                <button id="btn-batch-delete-resp" class="text-[#DC2626] hover:underline font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">delete_sweep</span>
                  Hapus Peserta Terpilih
                </button>
              </div>
              <button id="btn-cancel-selection" class="text-xs text-[#64748B] hover:text-[#172B3A] font-medium">
                Batal Pilihan
              </button>
            </div>

            <!-- Responsive Matriks Table -->
            <div class="overflow-x-auto w-full">
              <table class="w-full text-left border-collapse text-xs min-w-[1050px]">
                <thead>
                  <tr class="bg-[#F8FAFC] text-[#475569] uppercase font-bold text-[11px] border-b border-[#CBD5E1]">
                    <th class="py-3 px-3 w-10 text-center">
                      <input type="checkbox" id="check-all-rows" class="rounded border-[#CBD5E1] text-[#006876] cursor-pointer" />
                    </th>
                    <th class="py-3 px-4 min-w-[220px]">Peserta Pelatihan</th>
                    <th class="py-3 px-4 min-w-[140px]">Modul Pembelajaran</th>
                    <th class="py-3 px-4 min-w-[240px]">Atasan Langsung (Direct Supervisor)</th>
                    <th class="py-3 px-4 min-w-[220px]">Koordinator Eksternal</th>
                    <th class="py-3 px-3 text-center min-w-[120px]">Validasi Relasi</th>
                    <th class="py-3 px-4 text-right min-w-[130px]">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]">
                  ${respondents.length === 0 ? `
                    <tr>
                      <td colspan="7" class="py-8 text-center text-[#64748B]">
                        <span class="material-symbols-outlined text-3xl text-[#94A3B8] mb-1 block">search_off</span>
                        Tidak ada data peserta penugasan yang sesuai filter.
                      </td>
                    </tr>
                  ` : respondents.map(r => {
                    const isChecked = this.selectedIds.includes(r.id);
                    const hasSupervisor = r.atasan && r.atasan.nama;
                    const hasCoord = r.koordinatorEksternal && r.koordinatorEksternal.nama;
                    const isValid = hasSupervisor && hasCoord;

                    return `
                      <tr class="penugasan-row hover:bg-[#F0FDFA] transition-colors ${isChecked ? 'bg-[#F0FDFA]' : ''}" data-id="${r.id}" data-search="${(r.nama + ' ' + (r.nip || '') + ' ' + (r.jabatan || '') + ' ' + (r.unit || '')).toLowerCase()}">
                        <td class="py-3 px-3 text-center">
                          <input type="checkbox" class="row-checkbox rounded border-[#CBD5E1] text-[#006876] cursor-pointer" data-id="${r.id}" ${isChecked ? 'checked' : ''} />
                        </td>

                        <!-- Peserta Info -->
                        <td class="py-3 px-4">
                          <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-full bg-[#172B3A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              ${r.nama.charAt(0)}
                            </div>
                            <div>
                              <div class="font-bold text-[#172B3A]">${r.nama}</div>
                              <div class="text-[11px] text-[#64748B] font-mono">NIP: ${r.nip}</div>
                              <div class="text-[10px] text-[#64748B] truncate max-w-[210px]">${r.unit} — ${r.jabatan}</div>
                            </div>
                          </div>
                        </td>

                        <!-- Modul Badges -->
                        <td class="py-3 px-4">
                          <div class="flex flex-wrap gap-1">
                            ${r.modules.map(m => `
                              <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-[#E2E8F0] text-[#172B3A]">
                                Bag. ${m}
                              </span>
                            `).join('')}
                          </div>
                          <span class="text-[10px] text-[#64748B] block mt-0.5">${r.itemCount} Butir Instrumen</span>
                        </td>

                        <!-- Atasan Langsung -->
                        <td class="py-3 px-4">
                          ${hasSupervisor ? `
                            <div class="flex items-center justify-between gap-1">
                              <div>
                                <div class="font-semibold text-[#172B3A]">${r.atasan.nama}</div>
                                <div class="text-[11px] text-[#64748B] font-mono">NIP ${r.atasan.nip}</div>
                                <div class="text-[10px] text-[#64748B]">${r.atasan.jabatan}</div>
                              </div>
                              <button class="btn-change-sup text-[#006876] hover:underline text-[11px] font-semibold shrink-0" data-id="${r.id}">
                                Ubah
                              </button>
                            </div>
                          ` : `
                            <button class="btn-assign-sup text-[#DC2626] hover:underline font-semibold text-xs flex items-center gap-1" data-id="${r.id}">
                              <span class="material-symbols-outlined text-[15px]">person_add</span> + Tetapkan Atasan
                            </button>
                          `}
                        </td>

                        <!-- Koordinator Eksternal -->
                        <td class="py-3 px-4">
                          ${hasCoord ? `
                            <div class="flex items-center justify-between gap-1">
                              <div>
                                <div class="font-semibold text-[#172B3A]">${r.koordinatorEksternal.nama}</div>
                                <div class="text-[11px] text-[#64748B] font-mono">NIP ${r.koordinatorEksternal.nip}</div>
                                <div class="text-[10px] text-[#006876] font-medium">UPDL Palembang</div>
                              </div>
                              <button class="btn-change-coord text-[#006876] hover:underline text-[11px] font-semibold shrink-0" data-id="${r.id}">
                                Ubah
                              </button>
                            </div>
                          ` : `
                            <button class="btn-assign-coord text-[#DC2626] hover:underline font-semibold text-xs flex items-center gap-1" data-id="${r.id}">
                              <span class="material-symbols-outlined text-[15px]">add_link</span> + Tetapkan Koordinator
                            </button>
                          `}
                        </td>

                        <!-- Validasi Relasi -->
                        <td class="py-3 px-3 text-center">
                          ${isValid ? `
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                              <span class="material-symbols-outlined text-[12px]">check_circle</span> Valid
                            </span>
                          ` : `
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                              <span class="material-symbols-outlined text-[12px]">cancel</span> Belum Lengkap
                            </span>
                          `}
                        </td>

                        <!-- Aksi Single -->
                        <td class="py-3 px-4 text-right">
                          <div class="inline-flex items-center gap-1">
                            <button class="btn-edit-relation p-1 text-[#64748B] hover:text-[#006876] hover:bg-[#E0F7FA] rounded" data-id="${r.id}" title="Edit Relasi Penilai">
                              <span class="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button class="btn-send-single-access p-1 text-[#64748B] hover:text-[#006876] hover:bg-[#E0F7FA] rounded" data-id="${r.id}" title="Kirim Notifikasi Akses">
                              <span class="material-symbols-outlined text-[16px]">send</span>
                            </button>
                            <button class="btn-delete-respondent p-1 text-[#EF4444] hover:text-white hover:bg-[#EF4444] rounded transition-colors" data-id="${r.id}" data-nama="${r.nama}" data-nip="${r.nip || ''}" title="Hapus Peserta dari Penugasan">
                              <span class="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                  <tr id="penugasan-empty-search-row" class="hidden">
                    <td colspan="7" class="py-8 text-center text-[#64748B]">
                      <span class="material-symbols-outlined text-3xl text-[#94A3B8] mb-1 block">search_off</span>
                      Tidak ada peserta yang cocok dengan kata kunci pencarian.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Footer Pagination -->
            <div class="p-3 bg-[#F8FAFC] border-t border-[#CBD5E1] flex items-center justify-between text-xs text-[#64748B]">
              <div id="penugasan-footer-count">
                Total <b>${respondents.length}</b> matriks penugasan terdaftar
              </div>
              <div class="flex items-center gap-2">
                <span>Halaman 1 dari 1</span>
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
        this.selectedIds = [];
        this.render(container);
      });

      // Filter Unit
      container.querySelector('#penugasan-unit-select')?.addEventListener('change', (e) => {
        window.appStore.setFilters(e.target.value, undefined, undefined);
      });

      // Filter Modul
      container.querySelector('#penugasan-mod-select')?.addEventListener('change', (e) => {
        window.appStore.setFilters(undefined, e.target.value, undefined);
      });

      // Search Box (Real-time client filtering without losing focus or destroying DOM input)
      const searchInput = container.querySelector('#penugasan-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const val = e.target.value;
          // Simpan ke state tanpa notifikasi re-render agar input tidak hancur / kehilangan fokus
          window.appStore.setSearchQuery(val, true);

          const rawQ = val.toLowerCase().trim();
          const terms = rawQ ? rawQ.split(/\s+/).filter(Boolean) : [];
          const rows = container.querySelectorAll('.penugasan-row');
          let visibleCount = 0;

          rows.forEach(tr => {
            const searchData = tr.getAttribute('data-search') || tr.textContent.toLowerCase();
            const matches = terms.length === 0 || terms.every(t => searchData.includes(t));
            tr.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
          });

          const emptyRow = container.querySelector('#penugasan-empty-search-row');
          if (emptyRow) {
            emptyRow.style.display = (visibleCount === 0 && rows.length > 0) ? '' : 'none';
          }

          const footerCount = container.querySelector('#penugasan-footer-count');
          if (footerCount) {
            if (terms.length > 0) {
              footerCount.innerHTML = `Menampilkan <b>${visibleCount}</b> dari ${rows.length} matriks penugasan terdaftar`;
            } else {
              footerCount.innerHTML = `Total <b>${rows.length}</b> matriks penugasan terdaftar`;
            }
          }
        });
      }

      // Check all rows
      const checkAll = container.querySelector('#check-all-rows');
      if (checkAll) {
        checkAll.addEventListener('change', (e) => {
          const checked = e.target.checked;
          const rows = container.querySelectorAll('.row-checkbox');
          if (checked) {
            this.selectedIds = Array.from(rows).map(cb => Number(cb.getAttribute('data-id')));
          } else {
            this.selectedIds = [];
          }
          this.render(container);
        });
      }

      // Check individual row
      container.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const id = Number(e.target.getAttribute('data-id'));
          if (e.target.checked) {
            if (!this.selectedIds.includes(id)) this.selectedIds.push(id);
          } else {
            this.selectedIds = this.selectedIds.filter(x => x !== id);
          }
          this.render(container);
        });
      });

      // Cancel selection
      container.querySelector('#btn-cancel-selection')?.addEventListener('click', () => {
        this.selectedIds = [];
        this.render(container);
      });

      // Batch Assign Supervisor
      container.querySelector('#btn-batch-assign-sup')?.addEventListener('click', () => {
        if (this.selectedIds.length === 0) return;

        const activeUpdl = window.appStore.state.activeDashboardUpdl || 'ALL';
        const managers = window.appStore.getSupervisors(activeUpdl);

        window.App.showModal({
          title: `Tetapkan Atasan Langsung Kolektif (${this.selectedIds.length} Peserta)`,
          content: `
            <div class="space-y-4 text-xs text-[#172B3A]">
              <p>Pilih metode penetapan atasan langsung untuk <b>${this.selectedIds.length} peserta terpilih</b>:</p>
              
              <div class="space-y-2">
                <label class="flex items-center gap-2 p-2.5 border border-[#CBD5E1] rounded bg-[#F8FAFC] cursor-pointer hover:bg-white">
                  <input type="radio" name="batch-sup-mode" value="auto_unit" checked class="text-[#006876]" />
                  <div>
                    <div class="font-bold text-[#172B3A]">Otomatis Sesuai Unit Kerja Masing-Masing (Rekomendasi)</div>
                    <div class="text-[11px] text-[#64748B]">Setiap peserta dipetakan ke Manager/Atasan unit kerjanya secara presisi sesuai master data unit.</div>
                  </div>
                </label>

                <label class="flex items-center gap-2 p-2.5 border border-[#CBD5E1] rounded bg-[#F8FAFC] cursor-pointer hover:bg-white">
                  <input type="radio" name="batch-sup-mode" value="single" class="text-[#006876]" />
                  <div>
                    <div class="font-bold text-[#172B3A]">Satu Atasan Bersama untuk Seluruh Peserta Terpilih</div>
                    <div class="text-[11px] text-[#64748B]">Menetapkan satu figur atasan yang sama bagi seluruh baris yang dicentang.</div>
                  </div>
                </label>
              </div>

              <div id="box-single-sup-select" class="hidden p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded space-y-1.5">
                <label class="block font-semibold text-[#1E40AF]">Pilih Atasan Bersama:</label>
                <select id="modal-select-batch-sup" class="w-full p-2 border border-[#CBD5E1] rounded text-xs bg-white">
                  ${managers.map(m => `
                    <option value="${m.nama}|${m.nip}|${m.jabatan}">${m.nama} — ${m.jabatan} (${m.unitName || ''})</option>
                  `).join('')}
                </select>
              </div>
            </div>
          `,
          confirmText: 'Tetapkan Atasan Sekarang',
          onConfirm: () => {
            const mode = document.querySelector('input[name="batch-sup-mode"]:checked')?.value || 'auto_unit';
            if (mode === 'auto_unit') {
              let updatedCount = 0;
              this.selectedIds.forEach(id => {
                const r = window.appStore.respondents.find(x => x.id === Number(id));
                if (r) {
                  const autoSup = window.appStore.getSupervisorByUnit(r.unit);
                  if (autoSup) {
                    r.atasan = { nama: autoSup.nama, nip: autoSup.nip, jabatan: autoSup.jabatan };
                    window.appStore.syncRespondentToFirestore(r);
                    updatedCount++;
                  }
                }
              });
              window.appStore.save();
              window.App.showToast(`Atasan langsung berhasil ditetapkan otomatis berdasarkan unit kerja untuk ${updatedCount} peserta.`, 'success');
            } else {
              const supVal = document.getElementById('modal-select-batch-sup')?.value.split('|');
              const supData = {
                nama: supVal[0] || 'Ir. Bambang Triyono, M.T.',
                nip: supVal[1] || '8508111A',
                jabatan: supVal[2] || 'Manager UP3 Metro'
              };
              window.appStore.bulkAssignSupervisor(this.selectedIds, supData);
              window.App.showToast(`Atasan langsung ${supData.nama} berhasil ditetapkan untuk ${this.selectedIds.length} peserta.`, 'success');
            }

            this.selectedIds = [];
            this.render(container);
          }
        });

        setTimeout(() => {
          document.querySelectorAll('input[name="batch-sup-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
              const box = document.getElementById('box-single-sup-select');
              if (box) {
                if (e.target.value === 'single') box.classList.remove('hidden');
                else box.classList.add('hidden');
              }
            });
          });
        }, 50);
      });

      // Batch Assign Coordinator
      container.querySelector('#btn-batch-assign-coord')?.addEventListener('click', () => {
        if (this.selectedIds.length === 0) return;
        window.App.showModal({
          title: `Tetapkan Koordinator Kolektif (${this.selectedIds.length} Peserta)`,
          content: `
            <div class="space-y-3 text-xs">
              <p>Pilih koordinator yang akan mengampu verifikasi mutu silabus untuk <b>${this.selectedIds.length} peserta terpilih</b>:</p>
              <select id="modal-select-coord" class="w-full p-2 border border-[#CBD5E1] rounded text-xs bg-white text-[#172B3A]">
                ${window.appStore.getUsers().filter(u => u.role.includes("koordinator") || u.role === "admin").map(u => `<option value="${u.nip}">${u.nama} (NIP ${u.nip}) — ${u.jabatan || u.role}</option>`).join("") || `<option value="">Belum ada master koordinator terdaftar</option>`}
              </select>
            </div>
          `,
          confirmText: 'Tetapkan Sekarang',
          onConfirm: () => {
            const coordSelect = document.getElementById('modal-select-coord');
            const nip = coordSelect ? coordSelect.value : '8810743Z';
            const coordData = nip === '8810743Z' ? {
              nama: 'Azam Zulmi Agusti Nuro',
              nip: '8810743Z',
              jabatan: 'Koordinator Eksternal / UPDL Palembang'
            } : {
              nama: 'Akkhita Nurrul Febriyanti',
              nip: '8909014M',
              jabatan: 'Koordinator Internal UP3 Metro'
            };

            window.appStore.bulkAssignCoordinator(this.selectedIds, coordData);
            this.selectedIds = [];
            window.App.showToast('Koordinator berhasil ditetapkan secara massal!', 'success');
            this.render(container);
          }
        });
      });

      // Batch Send Notification
      container.querySelector('#btn-batch-send-notif')?.addEventListener('click', () => {
        window.App.showToast(`Notifikasi tautan evaluasi berhasil dikirim ke ${this.selectedIds.length} peserta & atasan terkait!`, 'success');
        this.selectedIds = [];
        this.render(container);
      });

      // Batch Delete Peserta
      container.querySelector('#btn-batch-delete-resp')?.addEventListener('click', () => {
        if (this.selectedIds.length === 0) return;
        const count = this.selectedIds.length;

        window.App.showModal({
          title: `Hapus ${count} Peserta Terpilih?`,
          content: `
            <div class="space-y-3 text-xs text-[#172B3A]">
              <p>Anda akan menghapus <b>${count} peserta</b> dari daftar penugasan evaluasi secara kolektif.</p>
              <div class="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded text-[#991B1B]">
                <div class="font-bold flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[18px]">warning</span>
                  Perhatian: Penghapusan Permanen!
                </div>
                <p class="text-[11px] mt-1 text-[#7F1D1D]">Seluruh relasi penugasan evaluator (atasan & koordinator) serta lembar evaluasi milik peserta terpilih akan dibersihkan dari sistem.</p>
              </div>
            </div>
          `,
          confirmText: `Hapus ${count} Peserta Sekarang`,
          cancelText: 'Batal',
          onConfirm: () => {
            const deleted = window.appStore.bulkDeleteRespondents(this.selectedIds);
            this.selectedIds = [];
            window.App.showToast(`Berhasil menghapus ${deleted} peserta secara massal.`, 'success');
            this.render(container);
          }
        });
      });

      // Hapus Peserta Single
      container.querySelectorAll('.btn-delete-respondent').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = Number(btn.getAttribute('data-id'));
          const nama = btn.getAttribute('data-nama') || 'Peserta';
          const nip = btn.getAttribute('data-nip') || '';

          window.App.showModal({
            title: 'Hapus Peserta dari Penugasan?',
            content: `
              <div class="space-y-3 text-xs text-[#172B3A]">
                <p>Apakah Anda yakin ingin menghapus peserta berikut dari daftar penugasan evaluasi?</p>
                <div class="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded">
                  <div class="font-bold text-[#991B1B] text-sm">${nama}</div>
                  <div class="text-[#7F1D1D] font-mono mt-0.5">NIP: ${nip}</div>
                </div>
                <p class="text-[#64748B]">Tindakan ini akan menghapus matriks relasi penilai dan seluruh data lembar evaluasi terkait.</p>
              </div>
            `,
            confirmText: 'Ya, Hapus Peserta',
            cancelText: 'Batal',
            onConfirm: () => {
              const success = window.appStore.deleteRespondent(id);
              if (success) {
                this.selectedIds = this.selectedIds.filter(x => x !== id);
                window.App.showToast(`Peserta ${nama} berhasil dihapus dari sistem penugasan.`, 'success');
                this.render(container);
              } else {
                window.App.showToast('Gagal menghapus peserta.', 'error');
              }
            }
          });
        });
      });

      // Edit Relation Single Modal
      container.querySelectorAll('.btn-edit-relation, .btn-change-sup, .btn-change-coord').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.currentTarget.getAttribute('data-id'));
          const r = window.appStore.respondents.find(x => x.id === id);
          if (!r) return;

          const availableSups = window.appStore.getSupervisors();
          const currentNip = r.atasan ? r.atasan.nip : '';
          const hasCurrentInList = availableSups.some(s => s.nip === currentNip);

          window.App.showModal({
            title: `Edit Penugasan Penilai: ${r.nama}`,
            content: `
              <div class="space-y-3 text-xs text-[#172B3A]">
                <div>
                  <label class="block font-semibold mb-1">Peserta:</label>
                  <div class="p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded font-medium">${r.nama} (NIP: ${r.nip} • ${r.unit})</div>
                </div>
                <div>
                  <label class="block font-semibold mb-1">Atasan Langsung (Direct Supervisor):</label>
                  <select id="modal-edit-sup" class="w-full p-2 border border-[#CBD5E1] rounded text-xs bg-white">
                    ${!hasCurrentInList && r.atasan && r.atasan.nama ? `
                      <option value="${r.atasan.nama}|${r.atasan.nip}|${r.atasan.jabatan}" selected>${r.atasan.nama} (${r.atasan.jabatan}) [Saat Ini]</option>
                    ` : ''}
                    ${availableSups.map(s => `
                      <option value="${s.nama}|${s.nip}|${s.jabatan}" ${s.nip === currentNip ? 'selected' : ''}>${s.nama} (${s.jabatan} - ${s.unitName || ''})</option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <label class="block font-semibold mb-1">Koordinator Program:</label>
                  <select id="modal-edit-coord" class="w-full p-2 border border-[#CBD5E1] rounded text-xs bg-white">
                    ${window.appStore.getUsers().filter(u => u.role.includes("koordinator") || u.role === "admin").map(u => `<option value="${u.nama}|${u.nip}|${u.jabatan || u.role}">${u.nama} (${u.jabatan || u.role})</option>`).join("") || `<option value="">Belum ada master koordinator terdaftar</option>`}
                  </select>
                </div>
              </div>
            `,
            confirmText: 'Simpan Perubahan',
            onConfirm: () => {
              const supVal = document.getElementById('modal-edit-sup').value.split('|');
              const coordVal = document.getElementById('modal-edit-coord').value.split('|');

              window.appStore.assignSupervisor(id, {
                nama: supVal[0],
                nip: supVal[1],
                jabatan: supVal[2]
              });

              window.appStore.assignCoordinator(id, {
                nama: coordVal[0],
                nip: coordVal[1],
                jabatan: coordVal[2]
              });

              window.App.showToast(`Penugasan evaluator untuk ${r.nama} berhasil diperbarui.`, 'success');
            }
          });
        });
      });

      // Single send access
      container.querySelectorAll('.btn-send-single-access').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.currentTarget.getAttribute('data-id'));
          const r = window.appStore.respondents.find(x => x.id === id);
          window.App.showToast(`Tautan akses penilai dikirimkan ke atasan & koordinator untuk ${r ? r.nama : 'peserta'}.`, 'info');
        });
      });

      // Tombol Unduh Template Excel dari Toolbar Utama
      container.querySelector('#btn-download-template-matrix')?.addEventListener('click', () => {
        this.downloadExcelTemplateMatrix();
      });

      // Impor Matrix Modal (Non-destructive, Duplicate Handling & Real XLSX/CSV Parser)
      container.querySelector('#btn-import-matrix')?.addEventListener('click', () => {
        let selectedFile = null;
        let parsedResult = { newRows: [], duplicateRows: [], allRows: [] };
        let duplicateHandling = 'skip'; // 'skip' | 'overwrite'

        const currentRespondents = window.appStore.getRespondents();
        const activeUpdl = window.appStore.state.activeDashboardUpdl || 'ALL';
        const defaultUpdl = activeUpdl !== 'ALL' ? activeUpdl : ((window.appStore.getUpdls()[0] || {}).id || '');
        const defaultProg = window.appStore.state.activeDashboardProgram !== 'ALL' ? window.appStore.state.activeDashboardProgram : ((window.appStore.getPrograms()[0] || {}).id || 'prog-pil-susut');
        const defaultPeriod = window.appStore.state.activeDashboardPeriod !== 'ALL' ? window.appStore.state.activeDashboardPeriod : ((window.appStore.getPeriods()[0] || {}).id || 'period-2026-1');

        const modalEl = window.App.showModal({
          title: 'Impor Matriks Penugasan (Excel XLSX / CSV)',
          content: `
            <div class="space-y-4 text-xs text-[#172B3A]">
              <div class="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[11px] text-[#1E40AF] flex items-start gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#2563EB] shrink-0 mt-0.5">verified_user</span>
                <div>
                  <div class="font-bold">Keamanan Data Terjamin (Non-Destructive Import)</div>
                  <p class="text-[#1E3A8A] leading-relaxed">
                    Sistem <b>tidak akan pernah menghapus data penugasan yang sudah ada</b>. Data baru akan ditambahkan, dan jika terdeteksi peserta duplikat Anda dapat memilih untuk memperbarui atau melewatinya.
                  </p>
                </div>
              </div>

              <!-- Banner & Tombol Unduh Template -->
              <div class="p-3 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div class="flex items-start gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                    <span class="material-symbols-outlined text-[18px]">table_chart</span>
                  </div>
                  <div>
                    <div class="font-bold text-[#0F766E] text-xs">Belum Memiliki Format Template Data yang Sesuai?</div>
                    <p class="text-[11px] text-[#115E59] mt-0.5 leading-relaxed">
                      Unduh template resmi <b>.xlsx</b> lengkap dengan lembar <b>DAFTAR RESPONDEN</b> dan <b>PETUNJUK PENGISIAN</b> untuk memudahkan pengisian data peserta dan modul.
                    </p>
                  </div>
                </div>
                <button type="button" id="btn-download-template-modal" class="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#006876] hover:bg-[#00515C] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0">
                  <span class="material-symbols-outlined text-[16px]">download</span>
                  Unduh Template (.XLSX)
                </button>
              </div>

              <!-- File Upload Dropzone -->
              <div id="dropzone-matrix" class="border-2 border-dashed border-[#CBD5E1] hover:border-[#006876] rounded-xl p-5 text-center bg-[#F8FAFC] hover:bg-[#F0FDFA] transition-all cursor-pointer relative group">
                <input 
                  type="file" 
                  id="input-matrix-excel-file" 
                  accept=".xlsx,.xls,.csv" 
                  class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                />
                
                <div id="dropzone-matrix-prompt">
                  <div class="w-11 h-11 rounded-full bg-[#E0F2FE] text-[#006876] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <span class="material-symbols-outlined text-2xl">table_chart</span>
                  </div>
                  <span class="font-bold text-[#172B3A] text-sm block">Pilih Dokumen Excel (.XLSX) atau .CSV</span>
                  <span class="text-[11px] text-[#64748B] block mt-0.5">Mendukung format template <b>Form Evaluasi Level 3.xlsx</b></span>
                </div>

                <div id="dropzone-matrix-selected" class="hidden text-left bg-white p-3 rounded-lg border border-[#CBD5E1] flex items-center justify-between gap-3 shadow-sm">
                  <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-9 h-9 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0 border border-[#A7F3D0]">
                      <span class="material-symbols-outlined text-xl">description</span>
                    </div>
                    <div class="overflow-hidden">
                      <div id="matrix-file-name" class="font-bold text-[#172B3A] truncate text-xs">File.xlsx</div>
                      <div id="matrix-file-info" class="text-[10px] text-[#64748B]">Sedang memproses dokumen...</div>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] shrink-0">
                    Dokumen Terpilih
                  </span>
                </div>
              </div>

              <!-- Hasil Analisis Dokumen & Pilihan Konfirmasi Duplikat (Dinamis) -->
              <div id="matrix-analysis-container" class="hidden space-y-3 pt-1 border-t border-[#E2E8F0] animate-fadeIn">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-[#172B3A] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[16px] text-[#006876]">analytics</span>
                    Hasil Analisis Data Dokumen
                  </span>
                  <span id="badge-total-parsed" class="font-mono text-[11px] font-bold bg-[#F1F5F9] text-[#172B3A] px-2 py-0.5 rounded">0 Peserta</span>
                </div>

                <!-- Stat Cards -->
                <div class="grid grid-cols-2 gap-2.5">
                  <div class="p-2.5 bg-[#F0FDF4] border border-[#86EFAC] rounded-lg">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold uppercase text-[#166534]">Data Peserta Baru</span>
                      <span id="count-new-data" class="font-bold text-sm text-[#166534] font-tabular">0</span>
                    </div>
                    <p class="text-[10px] text-[#15803D] mt-0.5">Belum terdaftar di sistem (Siap ditambahkan)</p>
                  </div>

                  <div class="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold uppercase text-[#92400E]">Data Duplikat Terdeteksi</span>
                      <span id="count-dup-data" class="font-bold text-sm text-[#92400E] font-tabular">0</span>
                    </div>
                    <p class="text-[10px] text-[#B45309] mt-0.5">Sudah terdaftar berdasarkan NIP / Nama</p>
                  </div>
                </div>

                <!-- Duplicate Handling Radio Box (Jika ada duplikat) -->
                <div id="box-dup-handling" class="hidden p-3 bg-white border border-[#FDE68A] rounded-lg space-y-2 shadow-xs">
                  <div class="font-bold text-[#92400E] text-[11px] flex items-center gap-1">
                    <span class="material-symbols-outlined text-[15px]">help</span>
                    Pilih Tindakan untuk Data Duplikat yang Sudah Ada:
                  </div>
                  <div class="space-y-1.5 pl-1">
                    <label class="flex items-start gap-2 cursor-pointer text-[11px] text-[#172B3A]">
                      <input type="radio" name="radio-dup-action" value="skip" checked class="mt-0.5 text-[#006876]" />
                      <div>
                        <b>Lewati Duplikat (Skip)</b> <span class="text-[#059669] font-medium">(Rekomendasi Aman)</span>
                        <div class="text-[10px] text-[#64748B]">Data peserta yang sudah ada di sistem tidak akan diubah sama sekali. Hanya data baru yang akan dimasukkan.</div>
                      </div>
                    </label>
                    <label class="flex items-start gap-2 cursor-pointer text-[11px] text-[#172B3A] pt-1 border-t border-[#F1F5F9]">
                      <input type="radio" name="radio-dup-action" value="overwrite" class="mt-0.5 text-[#006876]" />
                      <div>
                        <b>Timpa Data yang Sudah Ada (Update / Overwrite)</b>
                        <div class="text-[10px] text-[#64748B]">Perbarui unit kerja, jabatan, pilihan modul, dan atasan peserta yang sudah ada dengan data terbaru dari dokumen.</div>
                      </div>
                    </label>
                  </div>
                  <div id="preview-dup-list" class="text-[10px] text-[#B45309] bg-[#FEF3C7] p-2 rounded max-h-20 overflow-y-auto"></div>
                </div>

                <!-- Preview New Records -->
                <div id="box-new-records" class="hidden p-2.5 bg-[#F0FDF4] border border-[#86EFAC] rounded-lg text-[11px] text-[#166534]">
                  <div class="font-bold mb-1 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">person_add</span>
                    Konfirmasi Penambahan Data Baru:
                  </div>
                  <div id="preview-new-list" class="text-[10px] max-h-24 overflow-y-auto space-y-0.5 font-mono"></div>
                </div>

              </div>
            </div>
          `,
          confirmText: 'Proses Impor Matriks',
          onConfirm: () => {
            if (!selectedFile) {
              window.App.showToast('Harap pilih dokumen Excel / CSV terlebih dahulu.', 'error');
              return false;
            }

            const { newRows, duplicateRows } = parsedResult;
            if (newRows.length === 0 && duplicateRows.length === 0) {
              window.App.showToast('Tidak ada data responden yang valid untuk diimpor.', 'error');
              return false;
            }

            // Ambil pilihan penanganan duplikat
            const selectedDupRadio = modalEl.querySelector('input[name="radio-dup-action"]:checked');
            duplicateHandling = selectedDupRadio ? selectedDupRadio.value : 'skip';

            let addedCount = 0;
            let updatedCount = 0;
            let skippedCount = 0;

            // 1. Proses Data Baru (TIDAK MENGHAPUS DATA EKSISTING)
            newRows.forEach(row => {
              const newResp = window.appStore.addRespondent({
                nip: row.nip,
                nama: row.nama,
                jabatan: row.jabatan || 'Pelaksana Operasi Distribusi',
                unit: row.unit || 'PLN UP3 Metro',
                updlId: row.updlId || defaultUpdl,
                programId: row.programId || defaultProg,
                periodId: row.periodId || defaultPeriod,
                modules: row.modules && row.modules.length > 0 ? row.modules : ['A'],
                atasan: row.atasan || {
                  nama: 'Atasan Langsung Unit',
                  nip: '-',
                  jabatan: `Manager ${row.unit || 'Unit'}`
                }
              });

              // Pastikan akun peserta terdaftar di users jika belum ada
              try {
                window.appStore.addUser({
                  nip: row.nip,
                  nama: row.nama,
                  jabatan: row.jabatan || 'Pelaksana Operasi Distribusi',
                  unitName: row.unit || 'PLN UP3 Metro',
                  updlId: row.updlId || defaultUpdl,
                  role: 'peserta'
                });
              } catch (_) {}

              addedCount++;
            });

            // 2. Proses Data Duplikat Sesuai Pilihan Konfirmasi
            if (duplicateHandling === 'overwrite') {
              duplicateRows.forEach(row => {
                if (row.existingId) {
                  window.appStore.updateRespondent(row.existingId, {
                    jabatan: row.jabatan,
                    unit: row.unit,
                    modules: row.modules && row.modules.length > 0 ? row.modules : undefined,
                    atasan: row.atasan
                  });
                  updatedCount++;
                }
              });
            } else {
              skippedCount = duplicateRows.length;
            }

            const summaryMsg = `Impor selesai: ${addedCount} peserta baru ditambahkan` + 
              (updatedCount > 0 ? `, ${updatedCount} data lama diperbarui` : '') + 
              (skippedCount > 0 ? `, ${skippedCount} duplikat dilewati` : '') + 
              '. Data yang ada tetap aman.';

            window.App.showToast(summaryMsg, 'success');
            this.render(container);
            return true;
          }
        });

        // Event listener & parser file upload di dalam modal
        if (modalEl) {
          // Listener Tombol Unduh Template di dalam Modal
          modalEl.querySelector('#btn-download-template-modal')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            this.downloadExcelTemplateMatrix();
          });

          const fileInput = modalEl.querySelector('#input-matrix-excel-file');
          const promptEl = modalEl.querySelector('#dropzone-matrix-prompt');
          const selectedEl = modalEl.querySelector('#dropzone-matrix-selected');
          const nameEl = modalEl.querySelector('#matrix-file-name');
          const infoEl = modalEl.querySelector('#matrix-file-info');

          const analysisContainer = modalEl.querySelector('#matrix-analysis-container');
          const badgeTotal = modalEl.querySelector('#badge-total-parsed');
          const countNewEl = modalEl.querySelector('#count-new-data');
          const countDupEl = modalEl.querySelector('#count-dup-data');
          const boxDupHandling = modalEl.querySelector('#box-dup-handling');
          const previewDupList = modalEl.querySelector('#preview-dup-list');
          const boxNewRecords = modalEl.querySelector('#box-new-records');
          const previewNewList = modalEl.querySelector('#preview-new-list');

          const processParsedRows = (rawRows, sizeStr) => {
            const existingResps = window.appStore.getRespondents();
            const existingNipMap = new Map();
            const existingNamaMap = new Map();

            existingResps.forEach(r => {
              if (r.nip) existingNipMap.set((r.nip || '').trim().toLowerCase(), r);
              if (r.nama) existingNamaMap.set((r.nama || '').trim().toLowerCase(), r);
            });

            const newRows = [];
            const duplicateRows = [];

            rawRows.forEach(row => {
              const cleanNip = (row.nip || '').trim().toLowerCase();
              const cleanNama = (row.nama || '').trim().toLowerCase();

              const matchByNip = cleanNip ? existingNipMap.get(cleanNip) : null;
              const matchByNama = cleanNama ? existingNamaMap.get(cleanNama) : null;
              const existingMatch = matchByNip || matchByNama;

              if (existingMatch) {
                duplicateRows.push({
                  ...row,
                  existingId: existingMatch.id,
                  existingNama: existingMatch.nama,
                  existingNip: existingMatch.nip
                });
              } else {
                newRows.push(row);
              }
            });

            parsedResult = { newRows, duplicateRows, allRows: rawRows };

            infoEl.textContent = `Ukuran: ${sizeStr} • ${rawRows.length} baris data terbaca`;
            badgeTotal.textContent = `${rawRows.length} Peserta`;
            countNewEl.textContent = newRows.length;
            countDupEl.textContent = duplicateRows.length;

            analysisContainer.classList.remove('hidden');

            // Render duplicate handling box jika ada duplikat
            if (duplicateRows.length > 0) {
              boxDupHandling.classList.remove('hidden');
              previewDupList.innerHTML = `<b>Peserta terdeteksi sudah ada:</b><br/>` + 
                duplicateRows.map((d, i) => `${i + 1}. ${d.nama} (${d.nip || '-'})`).join('<br/>');
            } else {
              boxDupHandling.classList.add('hidden');
            }

            // Render new records preview jika ada data baru
            if (newRows.length > 0) {
              boxNewRecords.classList.remove('hidden');
              previewNewList.innerHTML = newRows.map((n, i) => 
                `<div>${i + 1}. <b>${n.nama}</b> (NIP: ${n.nip}) • ${n.unit} [Modul: ${(n.modules || ['A']).join(', ')}]</div>`
              ).join('');
            } else {
              boxNewRecords.classList.add('hidden');
            }
          };

          fileInput?.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const allowedExts = /\.(xlsx|xls|csv)$/i;
            if (!file.name.match(allowedExts)) {
              window.App.showToast('Format dokumen tidak valid. Harap pilih berkas .XLSX, .XLS, atau .CSV.', 'error');
              fileInput.value = '';
              return;
            }

            selectedFile = file;
            const sizeStr = file.size > 1024 * 1024 
              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
              : `${Math.round(file.size / 1024)} KB`;

            nameEl.textContent = file.name;
            promptEl.classList.add('hidden');
            selectedEl.classList.remove('hidden');

            // 1. Jika berkas Excel (.xlsx / .xls) dan library XLSX tersedia di window
            if ((file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) && window.XLSX) {
              const reader = new FileReader();
              reader.onload = (loadEvt) => {
                try {
                  const data = new Uint8Array(loadEvt.target.result);
                  const workbook = window.XLSX.read(data, { type: 'array' });
                  
                  // Cari sheet DAFTAR RESPONDEN atau sheet pertama
                  const targetSheetName = workbook.SheetNames.find(n => n.toUpperCase().includes('RESPONDEN')) || workbook.SheetNames[0];
                  const worksheet = workbook.Sheets[targetSheetName];
                  const jsonMatrix = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                  const extractedRows = [];
                  let headerIndex = -1;

                  // Temukan baris header yang memuat 'NIP' atau 'Nama'
                  for (let i = 0; i < Math.min(jsonMatrix.length, 15); i++) {
                    const rowArr = jsonMatrix[i] || [];
                    const rowStr = rowArr.map(c => String(c || '').toLowerCase()).join(' ');
                    if (rowStr.includes('nip') && (rowStr.includes('nama') || rowStr.includes('peserta'))) {
                      headerIndex = i;
                      break;
                    }
                  }

                  const startRow = headerIndex !== -1 ? headerIndex + 1 : 1;

                  for (let i = startRow; i < jsonMatrix.length; i++) {
                    const row = jsonMatrix[i] || [];
                    if (row.length < 2) continue;

                    // Header umum: No (0), NIP (1), Nama (2), Jabatan (3), Unit (4), Bag A (5), Bag B (6), Bag C (7)
                    let nip = String(row[1] || '').trim();
                    let nama = String(row[2] || '').trim();

                    // Jika NIP di kolom 0 dan Nama di kolom 1
                    if (!nama && row[0] && row[1]) {
                      nip = String(row[0] || '').trim();
                      nama = String(row[1] || '').trim();
                    }

                    if (!nama || nama.toLowerCase().includes('total') || nama.toLowerCase().includes('koordinator')) continue;

                    const jabatan = String(row[3] || 'Pelaksana Operasi Distribusi').trim();
                    const unit = String(row[4] || 'PLN UP3 Metro').trim();

                    const modA = !!(row[5] && String(row[5]).trim() !== '' && String(row[5]).trim() !== '0');
                    const modB = !!(row[6] && String(row[6]).trim() !== '' && String(row[6]).trim() !== '0');
                    const modC = !!(row[7] && String(row[7]).trim() !== '' && String(row[7]).trim() !== '0');

                    const modules = [];
                    if (modA || (!modB && !modC)) modules.push('A');
                    if (modB) modules.push('B');
                    if (modC) modules.push('C');

                    extractedRows.push({
                      nip: nip || `NIP-${Date.now().toString().slice(-6)}-${i}`,
                      nama: nama,
                      jabatan: jabatan,
                      unit: unit,
                      modules: modules.length > 0 ? modules : ['A', 'B', 'C'],
                      atasan: {
                        nama: 'Atasan Langsung Unit',
                        nip: '-',
                        jabatan: `Manager ${unit}`
                      }
                    });
                  }

                  processParsedRows(extractedRows, sizeStr);
                } catch (err) {
                  console.error('Gagal baca XLSX:', err);
                  window.App.showToast('Gagal memproses file Excel: ' + err.message, 'error');
                }
              };
              reader.readAsArrayBuffer(file);
            } 
            // 2. Jika berkas CSV atau teks
            else {
              const reader = new FileReader();
              reader.onload = (loadEvt) => {
                try {
                  const text = loadEvt.target.result;
                  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
                  const extractedRows = [];
                  if (lines.length > 1) {
                    const delimiter = lines[0].includes(';') ? ';' : ',';
                    for (let i = 1; i < lines.length; i++) {
                      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
                      if (cols.length >= 2) {
                        const nip = cols[0];
                        const nama = cols[1];
                        if (nama && !nama.toLowerCase().includes('nama')) {
                          extractedRows.push({
                            nip: nip,
                            nama: nama,
                            jabatan: cols[2] || 'Pelaksana Operasi Distribusi',
                            unit: cols[3] || 'PLN UP3 Metro',
                            modules: ['A', 'B', 'C'],
                            atasan: {
                              nama: cols[4] || 'Atasan Langsung Unit',
                              nip: cols[5] || '-',
                              jabatan: `Manager ${cols[3] || 'Unit'}`
                            }
                          });
                        }
                      }
                    }
                  }
                  processParsedRows(extractedRows, sizeStr);
                } catch (err) {
                  window.App.showToast('Gagal memproses CSV: ' + err.message, 'error');
                }
              };
              reader.readAsText(file);
            }
          });
        }
      });

      // Tambah Penugasan Baru Modal (Prioritas MANUAL Dulu, UPDL/Program/Periode & Bank Butir Dinamis)
      container.querySelector('#btn-add-penugasan')?.addEventListener('click', () => {
        const dashboardUpdl = window.appStore.state.activeDashboardUpdl || 'ALL';
        const dashboardProg = window.appStore.state.activeDashboardProgram || 'ALL';
        const dashboardPeriod = window.appStore.state.activeDashboardPeriod || 'ALL';

        const allUpdls = window.appStore.getUpdls(true);
        const allPrograms = window.appStore.getPrograms(true);

        // 1. Nilai awal fleksibel: otomatis sesuai yang ditampilkan di dashboard/filter atau pilihan pertama
        const initialUpdlId = dashboardUpdl !== 'ALL' ? dashboardUpdl : (allUpdls[0] ? allUpdls[0].id : '');
        const initialProgId = dashboardProg !== 'ALL' ? dashboardProg : (allPrograms[0] ? allPrograms[0].id : 'prog-pil-susut');

        // 2. Periode evaluasi sesuai program (utamakan yang AKTIF)
        const initialProgPeriods = window.appStore.getPeriods(initialProgId);
        const initialActivePeriod = window.appStore.getActivePeriod(initialProgId);
        let initialPeriodId = (dashboardPeriod !== 'ALL' && initialProgPeriods.some(p => p.id === dashboardPeriod))
          ? dashboardPeriod
          : (initialActivePeriod ? initialActivePeriod.id : (initialProgPeriods[0] ? initialProgPeriods[0].id : ''));

        // 3. Bank Butir / Bank Modul untuk program terpilih
        const initialBankButirs = window.appStore.getBankButirList(initialProgId);
        const initialActiveBB = window.appStore.getActiveBankButirForProgram(initialProgId) || (initialBankButirs[0] || null);
        const initialBankButirId = initialActiveBB ? initialActiveBB.id : '';

        let currentSelectedUpdlId = initialUpdlId;
        let currentSelectedProgId = initialProgId;
        let currentSelectedBB = initialActiveBB;

        let modalUnits = window.appStore.getUnits(null, true);

        // Master participants
        const masterParticipants = window.appStore.getUsers({ role: 'peserta' });
        const assignedRespondents = window.appStore.getRespondents();
        const assignedNipSet = new Set(assignedRespondents.map(r => (r.nip || '').toLowerCase()));

        // PRIORITAS DEFAULT: MANUAL DULU!
        let activeAddTab = 'manual';
        let isManualSupervisorOverride = false;

        // Helper render checkbox modul dari sections bank butir
        const generateModuleCheckboxesHtml = (sections, inputName = 'add-modules') => {
          const secEntries = Object.entries(sections || {});
          if (secEntries.length === 0) {
            return `
              <div class="col-span-full p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">info</span>
                Katalog Bank Butir ini belum memiliki modul butir. Default menggunakan Modul Bagian A.
                <input type="hidden" name="${inputName}" value="A" />
              </div>
            `;
          }

          return secEntries.map(([k, sec]) => `
            <label class="flex items-start gap-2.5 p-2.5 bg-white hover:bg-[#F0FDFA] border border-[#CBD5E1] rounded-lg cursor-pointer transition-all shadow-2xs">
              <input type="checkbox" name="${inputName}" value="${k}" checked class="mt-0.5 rounded border-[#CBD5E1] text-[#006876] focus:ring-0" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-bold text-xs text-[#172B3A]">Bagian ${k}</span>
                  ${sec.kodeDiklat ? `<span class="text-[9px] font-mono px-1 py-0.2 bg-[#E0F2FE] text-[#0369A1] rounded">${sec.kodeDiklat}</span>` : ''}
                </div>
                <div class="text-[11px] text-[#475569] font-medium truncate mt-0.5" title="${sec.title || `Modul Bagian ${k}`}">
                  ${sec.title || `Modul Bagian ${k}`}
                </div>
                <div class="text-[10px] text-[#64748B] mt-0.5 flex items-center gap-2">
                  <span>${(sec.items || []).length} Butir Perilaku</span>
                  ${sec.keybe ? `<span class="truncate">KEYBE: ${sec.keybe}</span>` : ''}
                </div>
              </div>
            </label>
          `).join('');
        };

        const formModal = window.App.showModal({
          title: `Tambah Penugasan Peserta Baru (Input Manual & Master User)`,
          content: `
            <div class="space-y-4 text-xs text-[#172B3A]">
              
              <!-- Tab Switcher (Prioritas: Input Manual Dulu!) -->
              <div class="flex border-b border-[#CBD5E1] gap-2">
                <button type="button" id="tab-btn-manual" class="tab-btn-pen px-3.5 py-2 font-bold border-b-2 border-[#23C4DB] text-[#0F96A9] flex items-center gap-1.5 focus:outline-none">
                  <span class="material-symbols-outlined text-[17px]">person_add</span>
                  Input Peserta Baru (Manual)
                </button>
                <button type="button" id="tab-btn-master" class="tab-btn-pen px-3.5 py-2 font-medium border-b-2 border-transparent text-[#64748B] hover:text-[#172B3A] flex items-center gap-1.5 focus:outline-none">
                  <span class="material-symbols-outlined text-[17px]">how_to_reg</span>
                  Pilih dari Master User (${masterParticipants.length})
                </button>
              </div>

              <!-- Content Tab 1: Input Manual (Prioritas Utama) -->
              <div id="content-tab-manual" class="space-y-3.5">
                
                <!-- Lingkup Penugasan: UPDL Fleksibel, Program, Periode Aktif & Bank Modul Terpilih -->
                <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-3">
                  <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <span class="font-bold text-[#172B3A] text-xs flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[16px] text-[#006876]">tune</span>
                      Lingkup Evaluasi & Modul Instrumen
                    </span>
                    <span class="text-[10px] bg-[#E0F2FE] text-[#0369A1] px-2 py-0.5 rounded font-semibold">Fleksibel & Terintegrasi</span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <!-- Dropdown UPDL (Otomatis sesuai dashboard, tetap fleksibel bisa diganti) -->
                    <div>
                      <label class="block text-[11px] font-bold text-[#475569] mb-1">
                        UPDL Penyelenggara <span class="text-red-500">*</span>:
                      </label>
                      <select id="add-updl-select" class="w-full p-2 bg-white border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#006876] font-medium text-[#172B3A]">
                        ${allUpdls.map(u => `
                          <option value="${u.id}" ${u.id === initialUpdlId ? 'selected' : ''}>${u.nama} (${u.kode})</option>
                        `).join('')}
                      </select>
                      <span class="text-[10px] text-[#64748B] block mt-0.5">Otomatis / Ubah UPDL</span>
                    </div>

                    <!-- Dropdown Program Pembelajaran -->
                    <div>
                      <label class="block text-[11px] font-bold text-[#475569] mb-1">
                        Program Pembelajaran <span class="text-red-500">*</span>:
                      </label>
                      <select id="add-program-select" class="w-full p-2 bg-white border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#006876] font-medium text-[#172B3A]">
                        ${allPrograms.map(p => `
                          <option value="${p.id}" ${p.id === initialProgId ? 'selected' : ''}>[${p.kode}] ${p.nama}</option>
                        `).join('')}
                      </select>
                      <span class="text-[10px] text-[#64748B] block mt-0.5">Program diklat</span>
                    </div>

                    <!-- Dropdown Periode Evaluasi Aktif Sesuai Program -->
                    <div>
                      <label class="block text-[11px] font-bold text-[#475569] mb-1">
                        Periode Evaluasi Aktif <span class="text-red-500">*</span>:
                      </label>
                      <select id="add-period-select" class="w-full p-2 bg-white border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#006876] font-medium text-[#172B3A]">
                        ${initialProgPeriods.length === 0 ? `
                          <option value="">(Belum ada periode evaluasi)</option>
                        ` : initialProgPeriods.map(pr => `
                          <option value="${pr.id}" ${pr.id === initialPeriodId ? 'selected' : ''}>
                            ${pr.nama || pr.kode} (${pr.tahun || '2026'}) [${pr.status || 'AKTIF'}]
                          </option>
                        `).join('')}
                      </select>
                      <span class="text-[10px] text-[#64748B] block mt-0.5">Siklus aktif sesuai program</span>
                    </div>

                    <!-- Dropdown Bank Modul / Bank Butir untuk Program Terpilih -->
                    <div>
                      <label class="block text-[11px] font-bold text-[#475569] mb-1">
                        Bank Modul / Bank Butir <span class="text-red-500">*</span>:
                      </label>
                      <select id="add-bank-butir-select" class="w-full p-2 bg-white border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#006876] font-medium text-[#172B3A]">
                        ${initialBankButirs.length === 0 ? `
                          <option value="">(Gunakan Bank Butir Default)</option>
                        ` : initialBankButirs.map(bb => `
                          <option value="${bb.id}" ${bb.id === initialBankButirId ? 'selected' : ''}>
                            [${bb.kode || 'BB'}] ${bb.nama} (${Object.keys(bb.sections || {}).length} Bagian)
                          </option>
                        `).join('')}
                      </select>
                      <span class="text-[10px] text-[#64748B] block mt-0.5">Katalog instrumen</span>
                    </div>
                  </div>
                </div>

                <!-- Bagian Modul yang Diikuti Peserta (Dinamis Sesuai Bank Butir yang Dipilih) -->
                <div class="p-3 bg-white border border-[#CBD5E1] rounded-lg space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="block font-bold text-[#172B3A] text-xs flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[16px] text-[#006876]">check_box</span>
                      Pilihan Bagian Modul Evaluasi (Sesuai Bank Butir Terpilih) <span class="text-red-500">*</span>
                    </label>
                    <span class="text-[10px] text-[#64748B]">Centang bagian modul yang diikuti peserta</span>
                  </div>

                  <div id="container-add-modules" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                    ${generateModuleCheckboxesHtml(initialActiveBB ? initialActiveBB.sections : window.MASTER_DATA.bankButir, 'add-modules')}
                  </div>
                </div>

                <!-- Data Identitas Peserta Baru -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block font-semibold mb-1 text-[#172B3A]">Nama Lengkap Peserta <span class="text-red-500">*</span></label>
                    <input type="text" id="add-nama" placeholder="Contoh: Budi Prasetyo, S.T." class="w-full p-2 bg-white border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#006876]" />
                  </div>
                  <div>
                    <label class="block font-semibold mb-1 text-[#172B3A]">NIP Peserta <span class="text-red-500">*</span></label>
                    <input type="text" id="add-nip" placeholder="Contoh: 9518002ZY" class="w-full p-2 bg-white border border-[#CBD5E1] rounded font-mono text-xs focus:outline-none focus:border-[#006876]" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block font-semibold mb-1 text-[#172B3A]">Jabatan Peserta <span class="text-red-500">*</span></label>
                    <input type="text" id="add-jabatan" placeholder="Contoh: Junior Engineer Distribusi" class="w-full p-2 bg-white border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#006876]" />
                  </div>
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="block font-semibold text-[#172B3A]">Unit Kerja Peserta <span class="text-red-500">*</span></label>
                      <button type="button" id="btn-toggle-add-unit" class="text-[11px] text-[#006876] hover:underline font-semibold flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-[14px]">add_circle</span> + Tambah Unit
                      </button>
                    </div>
                    <select id="add-unit" class="w-full p-2 bg-white border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#006876]">
                      ${modalUnits.map(u => `
                        <option value="${u.nama}" data-id="${u.id}" data-updl="${u.updlId}">${u.nama} (${u.kode})</option>
                      `).join('')}
                    </select>
                  </div>
                </div>

                <!-- Inline Box Tambah Unit Baru (Bila Perlu) -->
                <div id="box-add-unit-inline" class="hidden p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-lg space-y-2.5 animate-fadeIn">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[#166534] flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[16px]">domain_add</span>
                      Tambah Unit Kerja Baru
                    </span>
                    <button type="button" id="btn-cancel-add-unit" class="text-[11px] text-[#64748B] hover:text-[#172B3A]">Batal</button>
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <div>
                      <label class="block text-[10px] font-bold text-[#374151] mb-0.5">Kode Unit *</label>
                      <input type="text" id="inline-unit-kode" placeholder="Misal: ULP-BRU" class="w-full p-1.5 text-xs bg-white border border-[#CBD5E1] rounded font-mono uppercase focus:outline-none focus:border-[#059669]" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-[10px] font-bold text-[#374151] mb-0.5">Nama Unit Kerja *</label>
                      <input type="text" id="inline-unit-nama" placeholder="Misal: PLN ULP Metro Baru" class="w-full p-1.5 text-xs bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#059669]" />
                    </div>
                  </div>
                  <div class="flex items-center justify-between pt-1">
                    <span class="text-[10px] text-[#64748B]">Unit otomatis tersimpan ke Master Data dan langsung terpilih.</span>
                    <button type="button" id="btn-save-inline-unit" class="px-3 py-1 bg-[#059669] hover:bg-[#047857] text-white rounded text-xs font-semibold flex items-center gap-1 transition-all">
                      <span class="material-symbols-outlined text-[14px]">check</span> Simpan & Pilih Unit
                    </button>
                  </div>
                </div>

                <!-- Dynamic Supervisor Container (Otomatis Sesuai Unit / Tambah Manual) -->
                <div id="container-atasan-dynamic" class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-2">
                  <!-- Diisi secara reaktif oleh fungsi updateSupervisorCard() -->
                </div>

                <div class="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-[11px] text-[#1E40AF] flex items-center justify-between">
                  <span>Akun login peserta akan otomatis terbuat di database Master User.</span>
                  <span class="text-[10px] bg-[#DBEAFE] text-[#1E40AF] px-2 py-0.5 rounded font-bold font-mono">Password: pln123</span>
                </div>

              </div>

              <!-- Content Tab 2: Pilih dari Master User (Sekunder) -->
              <div id="content-tab-master" class="space-y-3 hidden">
                <div class="p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded text-[11px] text-[#065F46] flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px] text-[#059669] shrink-0">check_circle</span>
                  <span>Centang peserta yang ingin ditugaskan dari database Master User terdaftar.</span>
                </div>

                <!-- Search Input for Master User -->
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-2.5 top-2 text-[#94A3B8] text-[16px]">search</span>
                  <input type="text" id="search-master-participant" placeholder="Cari NIP, nama peserta, atau unit..." class="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#006876]" />
                </div>

                <!-- Table Master Participants -->
                <div class="border border-[#CBD5E1] rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  <table class="w-full text-left text-[11px] border-collapse">
                    <thead class="bg-[#F8FAFC] text-[#475569] font-bold sticky top-0 border-b border-[#CBD5E1]">
                      <tr>
                        <th class="py-2 px-3 w-8 text-center">Pilih</th>
                        <th class="py-2 px-3">NIP & Nama</th>
                        <th class="py-2 px-3">Jabatan & Unit</th>
                        <th class="py-2 px-3 text-center">Status Sesi</th>
                      </tr>
                    </thead>
                    <tbody id="tbody-master-participants" class="divide-y divide-[#E2E8F0]">
                      ${masterParticipants.map(mp => {
                        const isAssigned = assignedNipSet.has((mp.nip || '').toLowerCase());
                        return `
                          <tr class="hover:bg-[#F0FDFA] ${isAssigned ? 'opacity-60 bg-[#F8FAFC]' : ''}">
                            <td class="py-2 px-3 text-center">
                              <input type="checkbox" class="cb-pick-master" value="${mp.id}" data-nip="${mp.nip}" data-nama="${mp.nama}" data-jabatan="${mp.jabatan}" data-unit="${mp.unitName || ''}" data-updl="${mp.updlId || ''}" ${isAssigned ? 'disabled' : ''} />
                            </td>
                            <td class="py-2 px-3">
                              <div class="font-bold text-[#172B3A]">${mp.nama}</div>
                              <div class="font-mono text-[10px] text-[#64748B]">NIP: ${mp.nip}</div>
                            </td>
                            <td class="py-2 px-3 text-[#64748B]">
                              <div>${mp.jabatan}</div>
                              <div class="text-[10px] text-[#006876] font-medium">${mp.unitName || 'PLN Unit'}</div>
                            </td>
                            <td class="py-2 px-3 text-center">
                              ${isAssigned ? `
                                <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E2E8F0] text-[#475569]">Sudah Terdaftar</span>
                              ` : `
                                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#059669]">Siap Ditugaskan</span>
                              `}
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>

                <!-- Bagian Modul untuk Master User (Dinamis Sesuai Bank Butir Terpilih) -->
                <div>
                  <label class="block font-semibold mb-1 text-[#172B3A]">Bagian Modul Evaluasi (Sesuai Bank Butir Terpilih) <span class="text-red-500">*</span></label>
                  <div id="container-master-modules" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded">
                    ${generateModuleCheckboxesHtml(initialActiveBB ? initialActiveBB.sections : window.MASTER_DATA.bankButir, 'master-modules')}
                  </div>
                </div>

              </div>

            </div>
          `,
          confirmText: 'Simpan Penugasan',
          onConfirm: () => {
            const updlIdVal = document.getElementById('add-updl-select')?.value || initialUpdlId;
            const progIdVal = document.getElementById('add-program-select')?.value || initialProgId;
            const periodIdVal = document.getElementById('add-period-select')?.value || initialPeriodId;
            const bankButirIdVal = document.getElementById('add-bank-butir-select')?.value || '';

            // Prioritas Manual
            if (activeAddTab === 'manual') {
              const nama = document.getElementById('add-nama')?.value.trim();
              const nip = document.getElementById('add-nip')?.value.trim();
              const jabatan = document.getElementById('add-jabatan')?.value.trim();
              const unit = document.getElementById('add-unit')?.value;

              const atasanNama = document.getElementById('add-atasan-nama')?.value.trim();
              const atasanNip = document.getElementById('add-atasan-nip')?.value.trim();
              const atasanJabatan = document.getElementById('add-atasan-jabatan')?.value.trim();

              const selectedModules = [];
              document.querySelectorAll('input[name="add-modules"]:checked').forEach(cb => {
                selectedModules.push(cb.value);
              });

              if (!nama || !nip || !jabatan) {
                window.App.showToast('Nama, NIP, dan Jabatan peserta wajib diisi.', 'error');
                return false;
              }
              if (!unit) {
                window.App.showToast('Pilih unit kerja untuk peserta.', 'error');
                return false;
              }
              if (!atasanNama || !atasanNip) {
                window.App.showToast('Data Atasan Langsung (Nama & NIP) wajib dilengkapi.', 'error');
                return false;
              }
              if (selectedModules.length === 0) {
                window.App.showToast('Pilih minimal satu bagian modul evaluasi.', 'error');
                return false;
              }

              const atasanObj = {
                nama: atasanNama,
                nip: atasanNip,
                jabatan: atasanJabatan || `Manager ${unit}`
              };

              // Tampilkan Pop Up Konfirmasi Simpan Penugasan
              window.App.showModal({
                title: 'Konfirmasi Simpan Penugasan Baru',
                content: `
                  <div class="space-y-4 text-xs text-[#172B3A]">
                    <div class="p-3 bg-[#F0FDFA] border border-[#99F6E4] rounded-lg space-y-2">
                      <div class="font-bold text-[#0F766E] text-xs flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[17px]">verified</span>
                        Ringkasan Pemetaan Penugasan
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                        <div class="p-2.5 bg-white rounded border border-[#CCFBF1] space-y-0.5">
                          <span class="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">Peserta (Evaluator Diri)</span>
                          <div class="font-bold text-[#172B3A] text-xs">${nama}</div>
                          <div class="font-mono text-[#475569]">NIP: ${nip}</div>
                          <div class="text-[#0284C7] font-medium">${jabatan}</div>
                        </div>
                        <div class="p-2.5 bg-white rounded border border-[#CCFBF1] space-y-0.5">
                          <span class="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">Atasan Langsung (Evaluator Atasan)</span>
                          <div class="font-bold text-[#172B3A] text-xs">${atasanObj.nama}</div>
                          <div class="font-mono text-[#475569]">NIP: ${atasanObj.nip}</div>
                          <div class="text-[#0284C7] font-medium">${atasanObj.jabatan}</div>
                        </div>
                      </div>
                      <div class="pt-2 border-t border-[#CCFBF1] grid grid-cols-2 gap-2 text-[11px]">
                        <div><span class="text-[#64748B]">Unit Kerja:</span> <span class="font-semibold text-[#172B3A]">${unit}</span></div>
                        <div><span class="text-[#64748B]">Modul:</span> <span class="font-semibold text-[#006876]">Bagian ${selectedModules.join(', ')}</span></div>
                      </div>
                    </div>

                    <div class="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[11px] text-[#1E40AF] space-y-1.5">
                      <div class="font-bold flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">key</span>
                        Pembuatan Akun Login Otomatis:
                      </div>
                      <ul class="list-disc list-inside space-y-0.5 text-[#1E3A8A]">
                        <li>Akun <strong>Peserta</strong> (NIP: ${nip}) otomatis dibuat aktif dengan kata sandi: <code class="font-mono font-bold bg-white px-1 py-0.5 rounded border border-[#BFDBFE]">pln123</code></li>
                        <li>Akun <strong>Atasan</strong> (NIP: ${atasanObj.nip}) otomatis dibuat aktif dengan kata sandi: <code class="font-mono font-bold bg-white px-1 py-0.5 rounded border border-[#BFDBFE]">pln123</code></li>
                        <li>Kedua evaluator langsung dapat login ke sistem untuk pengisian evaluasi.</li>
                      </ul>
                    </div>

                    <p class="text-[#475569]">Apakah data penugasan sudah sesuai dan ingin disimpan sekarang?</p>
                  </div>
                `,
                confirmText: 'Ya, Simpan Penugasan',
                cancelText: 'Periksa Kembali',
                onConfirm: () => {
                  try {
                    // Tambahkan Peserta ke Penugasan Responden (otomatis membuat/sinkronisasi akun peserta & atasan)
                    const newResp = window.appStore.addRespondent({
                      nama: nama,
                      nip: nip,
                      jabatan: jabatan,
                      unit: unit,
                      updlId: updlIdVal,
                      programId: progIdVal,
                      periodId: periodIdVal,
                      bankButirId: bankButirIdVal,
                      modules: selectedModules,
                      password: 'pln123',
                      atasan: atasanObj
                    });

                    // Pastikan supervisor & peserta tersinkron ke master users
                    window.appStore.ensureSupervisorExists({
                      nama: atasanObj.nama,
                      nip: atasanObj.nip,
                      jabatan: atasanObj.jabatan,
                      unitName: unit,
                      updlId: updlIdVal
                    });
                    window.appStore.ensureUserForRespondent(newResp);

                    formModal?.remove();
                    window.ModalHelper.unlockScroll();
                    window.App.showToast(`Penugasan peserta ${newResp.nama} & atasan berhasil disimpan! Akun login telah otomatis aktif.`, 'success');
                    this.render(container);
                  } catch (err) {
                    window.App.showToast(err.message || 'Gagal menyimpan penugasan.', 'error');
                  }
                }
              });

              return false; // Tahan modal form penugasan sampai user konfirmasi di dialog
            } else {
              // Master User Mode
              const selectedCbs = Array.from(document.querySelectorAll('.cb-pick-master:checked'));
              if (selectedCbs.length === 0) {
                window.App.showToast('Pilih minimal satu peserta dari daftar master.', 'error');
                return false;
              }

              const selectedModules = [];
              document.querySelectorAll('input[name="master-modules"]:checked').forEach(cb => {
                selectedModules.push(cb.value);
              });
              if (selectedModules.length === 0) {
                window.App.showToast('Pilih minimal satu bagian modul evaluasi.', 'error');
                return false;
              }

              // Tampilkan Pop Up Konfirmasi untuk Master User
              window.App.showModal({
                title: 'Konfirmasi Penugasan Peserta Master',
                content: `
                  <div class="space-y-4 text-xs text-[#172B3A]">
                    <div class="p-3 bg-[#F0FDFA] border border-[#99F6E4] rounded-lg space-y-2">
                      <div class="font-bold text-[#0F766E] text-xs flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[17px]">how_to_reg</span>
                        Konfirmasi Penugasan (${selectedCbs.length} Peserta)
                      </div>
                      <p class="text-[11px] text-[#475569]">
                        Sebanyak <strong>${selectedCbs.length} peserta</strong> dari master data pengguna akan ditugaskan pada program evaluasi ini untuk <strong>Modul Bagian ${selectedModules.join(', ')}</strong>.
                      </p>
                    </div>

                    <div class="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[11px] text-[#1E40AF]">
                      <div class="font-bold mb-1">Catatan Akun & Evaluator:</div>
                      <div>Setiap peserta dan atasan masing-masing unit akan otomatis dipetakan ke matriks evaluasi level 3 dan dapat langsung login menggunakan NIP terdaftar.</div>
                    </div>

                    <p class="text-[#475569]">Lanjutkan proses penugasan peserta terpilih?</p>
                  </div>
                `,
                confirmText: 'Ya, Simpan Penugasan',
                cancelText: 'Periksa Kembali',
                onConfirm: () => {
                  try {
                    let countAssigned = 0;
                    selectedCbs.forEach(cb => {
                      const nip = cb.getAttribute('data-nip');
                      const nama = cb.getAttribute('data-nama');
                      const jabatan = cb.getAttribute('data-jabatan');
                      const unit = cb.getAttribute('data-unit') || '';
                      const cbUpdl = cb.getAttribute('data-updl') || updlIdVal;

                      const autoSup = window.appStore.getSupervisorByUnit(unit);
                      const atasanObj = autoSup 
                        ? { nama: autoSup.nama, nip: autoSup.nip, jabatan: autoSup.jabatan }
                        : { nama: 'Atasan Langsung Unit', nip: '-', jabatan: `Manager ${unit || 'Unit'}` };

                      const newResp = window.appStore.addRespondent({
                        nama: nama,
                        nip: nip,
                        jabatan: jabatan,
                        unit: unit,
                        updlId: cbUpdl,
                        programId: progIdVal,
                        periodId: periodIdVal,
                        bankButirId: bankButirIdVal,
                        modules: selectedModules,
                        password: 'pln123',
                        atasan: atasanObj
                      });

                      if (autoSup && autoSup.nip && autoSup.nip !== '-') {
                        window.appStore.ensureSupervisorExists({
                          nama: autoSup.nama,
                          nip: autoSup.nip,
                          jabatan: autoSup.jabatan,
                          unitName: unit,
                          updlId: cbUpdl
                        });
                      }
                      window.appStore.ensureUserForRespondent(newResp);
                      countAssigned++;
                    });

                    formModal?.remove();
                    window.ModalHelper.unlockScroll();
                    window.App.showToast(`Berhasil menugaskan ${countAssigned} peserta dari Master User!`, 'success');
                    this.render(container);
                  } catch (err) {
                    window.App.showToast(err.message || 'Gagal menugaskan peserta.', 'error');
                  }
                }
              });

              return false; // Tahan modal form penugasan sampai user konfirmasi di dialog
            }
          }
        });

        // Setup reactive event handling inside modal
        setTimeout(() => {
          const tabMaster = document.getElementById('tab-btn-master');
          const tabManual = document.getElementById('tab-btn-manual');
          const contentMaster = document.getElementById('content-tab-master');
          const contentManual = document.getElementById('content-tab-manual');

          const selectUpdl = document.getElementById('add-updl-select');
          const selectProgram = document.getElementById('add-program-select');
          const selectPeriod = document.getElementById('add-period-select');
          const selectBankButir = document.getElementById('add-bank-butir-select');
          const selectUnit = document.getElementById('add-unit');

          const containerModules = document.getElementById('container-add-modules');
          const containerMasterModules = document.getElementById('container-master-modules');

          // Fungsi reaktif update tampilan checkbox modul dari Bank Butir
          const updateModulesUI = (bb) => {
            currentSelectedBB = bb;
            const sections = bb ? bb.sections : (window.MASTER_DATA && window.MASTER_DATA.bankButir);
            if (containerModules) {
              containerModules.innerHTML = generateModuleCheckboxesHtml(sections, 'add-modules');
            }
            if (containerMasterModules) {
              containerMasterModules.innerHTML = generateModuleCheckboxesHtml(sections, 'master-modules');
            }
          };

          // 1. Fungsi reaktif update penyelenggara UPDL terpilih
          const refreshUnitsByUpdl = (updlId) => {
            currentSelectedUpdlId = updlId;
            isManualSupervisorOverride = false;
            updateSupervisorCard();
          };

          selectUpdl?.addEventListener('change', (e) => {
            refreshUnitsByUpdl(e.target.value);
          });

          // 2. Fungsi reaktif update Periode Evaluasi & Bank Butir saat Program diganti
          selectProgram?.addEventListener('change', (e) => {
            currentSelectedProgId = e.target.value;

            // Update Dropdown Periode Evaluasi (Prioritaskan yang AKTIF)
            const progPeriods = window.appStore.getPeriods(currentSelectedProgId);
            const activeProgPeriod = window.appStore.getActivePeriod(currentSelectedProgId);
            if (selectPeriod) {
              if (progPeriods.length === 0) {
                selectPeriod.innerHTML = `<option value="">(Belum ada periode evaluasi)</option>`;
              } else {
                selectPeriod.innerHTML = progPeriods.map(pr => `
                  <option value="${pr.id}" ${activeProgPeriod && pr.id === activeProgPeriod.id ? 'selected' : ''}>
                    ${pr.nama || pr.kode} (${pr.tahun || '2026'}) [${pr.status || 'AKTIF'}]
                  </option>
                `).join('');
              }
            }

            // Update Dropdown Bank Modul / Bank Butir
            const progBBs = window.appStore.getBankButirList(currentSelectedProgId);
            const activeBB = window.appStore.getActiveBankButirForProgram(currentSelectedProgId) || (progBBs[0] || null);

            if (selectBankButir) {
              if (progBBs.length === 0) {
                selectBankButir.innerHTML = `<option value="">(Gunakan Bank Butir Default)</option>`;
              } else {
                selectBankButir.innerHTML = progBBs.map(b => `
                  <option value="${b.id}" ${activeBB && b.id === activeBB.id ? 'selected' : ''}>
                    [${b.kode || 'BB'}] ${b.nama} (${Object.keys(b.sections || {}).length} Bagian)
                  </option>
                `).join('');
              }
            }

            // Update Pilihan Bagian Modul secara dinamis
            updateModulesUI(activeBB);
          });

          // 3. Fungsi reaktif saat Bank Butir diganti
          selectBankButir?.addEventListener('change', (e) => {
            const bbId = e.target.value;
            const chosenBB = bbId ? window.appStore.getBankButirById(bbId) : null;
            updateModulesUI(chosenBB);
          });

          const updateSupervisorCard = () => {
            const containerSup = document.getElementById('container-atasan-dynamic');
            if (!containerSup) return;
            const selectedUnit = selectUnit ? selectUnit.value : '';

            const sup = window.appStore.getSupervisorByUnit(selectedUnit);

            if (sup && !isManualSupervisorOverride) {
              containerSup.className = 'p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg space-y-2';
              containerSup.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-[#A7F3D0]">
                  <div class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[17px] text-[#059669]">verified_user</span>
                    <span class="font-bold text-[#065F46] text-xs">Atasan Terpilih Otomatis (Sesuai Unit)</span>
                  </div>
                  <span class="text-[10px] bg-[#D1FAE5] text-[#047857] px-2 py-0.5 rounded font-semibold">Tersinkron Unit</span>
                </div>
                <div class="pt-1 flex items-start justify-between gap-3">
                  <div>
                    <div class="font-bold text-[#172B3A] text-xs" id="display-sup-nama">${sup.nama}</div>
                    <div class="text-[11px] text-[#64748B] font-mono mt-0.5" id="display-sup-nip">NIP: ${sup.nip}</div>
                    <div class="text-[11px] text-[#006876] font-medium" id="display-sup-jabatan">${sup.jabatan}</div>
                  </div>
                  <button type="button" id="btn-toggle-manual-override" class="text-[11px] text-[#006876] hover:underline font-semibold flex items-center gap-1 shrink-0 bg-white px-2 py-1 border border-[#CBD5E1] rounded shadow-xs">
                    <span class="material-symbols-outlined text-[14px]">edit</span> Ubah Manual
                  </button>
                </div>
                <input type="hidden" id="add-atasan-nama" value="${sup.nama}" />
                <input type="hidden" id="add-atasan-nip" value="${sup.nip}" />
                <input type="hidden" id="add-atasan-jabatan" value="${sup.jabatan}" />
              `;

              document.getElementById('btn-toggle-manual-override')?.addEventListener('click', () => {
                isManualSupervisorOverride = true;
                updateSupervisorCard();
              });
            } else {
              const defaultJabatan = `Manager ${selectedUnit || 'Unit'}`;
              const initialNama = sup ? sup.nama : '';
              const initialNip = sup ? sup.nip : '';
              const initialJab = sup ? sup.jabatan : defaultJabatan;

              containerSup.className = 'p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg space-y-2';
              containerSup.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-[#FDE68A]">
                  <div class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[17px] text-[#D97706]">${sup ? 'edit_note' : 'person_alert'}</span>
                    <span class="font-bold text-[#92400E] text-xs">${sup ? 'Ubah Atasan Langsung (Manual)' : 'Atasan Belum Ada — Masukkan Manual'}</span>
                  </div>
                  ${sup ? `
                    <button type="button" id="btn-reset-auto-sup" class="text-[10px] text-[#059669] hover:underline font-bold flex items-center gap-0.5">
                      <span class="material-symbols-outlined text-[13px]">replay</span> Kembali ke Otomatis
                    </button>
                  ` : `
                    <span class="text-[10px] bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded font-semibold">Wajib Diisi</span>
                  `}
                </div>
                <div class="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label class="block text-[11px] font-semibold text-[#172B3A] mb-0.5">Nama Atasan <span class="text-red-500">*</span></label>
                    <input type="text" id="add-atasan-nama" required value="${initialNama}" placeholder="Contoh: Ir. Hendra Saputra, M.T." class="w-full p-2 bg-white border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#006876]" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-[#172B3A] mb-0.5">NIP Atasan <span class="text-red-500">*</span></label>
                    <input type="text" id="add-atasan-nip" required value="${initialNip}" placeholder="Contoh: 8509123A" class="w-full p-2 bg-white border border-[#CBD5E1] rounded font-mono text-xs focus:outline-none focus:border-[#006876]" />
                  </div>
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#172B3A] mb-0.5">Jabatan Atasan <span class="text-red-500">*</span></label>
                  <input type="text" id="add-atasan-jabatan" required value="${initialJab}" placeholder="Contoh: Manager ${selectedUnit}" class="w-full p-2 bg-white border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#006876]" />
                </div>
              `;

              document.getElementById('btn-reset-auto-sup')?.addEventListener('click', () => {
                isManualSupervisorOverride = false;
                updateSupervisorCard();
              });
            }
          };

          updateSupervisorCard();

          selectUnit?.addEventListener('change', () => {
            isManualSupervisorOverride = false;
            updateSupervisorCard();
          });

          // Toggle Add Unit Inline
          const btnToggleAddUnit = document.getElementById('btn-toggle-add-unit');
          const boxAddUnitInline = document.getElementById('box-add-unit-inline');
          const btnCancelAddUnit = document.getElementById('btn-cancel-add-unit');
          const btnSaveInlineUnit = document.getElementById('btn-save-inline-unit');

          btnToggleAddUnit?.addEventListener('click', () => {
            boxAddUnitInline?.classList.toggle('hidden');
          });

          btnCancelAddUnit?.addEventListener('click', () => {
            boxAddUnitInline?.classList.add('hidden');
          });

          btnSaveInlineUnit?.addEventListener('click', () => {
            const kode = document.getElementById('inline-unit-kode')?.value.trim();
            const nama = document.getElementById('inline-unit-nama')?.value.trim();
            if (!kode || !nama) {
              window.App.showToast('Kode Unit dan Nama Unit Kerja wajib diisi.', 'error');
              return;
            }

            try {
              const newUnit = window.appStore.addUnit({
                updlId: currentSelectedUpdlId || 'updl-plb',
                kode: kode,
                nama: nama,
                kota: ''
              });

              if (selectUnit) {
                const opt = document.createElement('option');
                opt.value = newUnit.nama;
                opt.text = `${newUnit.nama} (${newUnit.kode})`;
                opt.selected = true;
                selectUnit.appendChild(opt);
              }

              boxAddUnitInline?.classList.add('hidden');
              document.getElementById('inline-unit-kode').value = '';
              document.getElementById('inline-unit-nama').value = '';

              isManualSupervisorOverride = false;
              updateSupervisorCard();

              window.App.showToast(`Unit baru ${newUnit.nama} berhasil ditambahkan dan dipilih!`, 'success');
            } catch (err) {
              window.App.showToast(err.message, 'error');
            }
          });

          // Tab click switcher: Prioritas Manual vs Master
          tabManual?.addEventListener('click', () => {
            activeAddTab = 'manual';
            tabManual.className = 'tab-btn-pen px-3.5 py-2 font-bold border-b-2 border-[#23C4DB] text-[#0F96A9] flex items-center gap-1.5 focus:outline-none';
            tabMaster.className = 'tab-btn-pen px-3.5 py-2 font-medium border-b-2 border-transparent text-[#64748B] hover:text-[#172B3A] flex items-center gap-1.5 focus:outline-none';
            contentManual?.classList.remove('hidden');
            contentMaster?.classList.add('hidden');
            updateSupervisorCard();
          });

          tabMaster?.addEventListener('click', () => {
            activeAddTab = 'master';
            tabMaster.className = 'tab-btn-pen px-3.5 py-2 font-bold border-b-2 border-[#23C4DB] text-[#0F96A9] flex items-center gap-1.5 focus:outline-none';
            tabManual.className = 'tab-btn-pen px-3.5 py-2 font-medium border-b-2 border-transparent text-[#64748B] hover:text-[#172B3A] flex items-center gap-1.5 focus:outline-none';
            contentMaster?.classList.remove('hidden');
            contentManual?.classList.add('hidden');
          });

          // Search Master Participants Filter
          const searchInp = document.getElementById('search-master-participant');
          searchInp?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const rows = document.querySelectorAll('#tbody-master-participants tr');
            rows.forEach(tr => {
              const text = tr.textContent.toLowerCase();
              tr.style.display = text.includes(q) ? '' : 'none';
            });
          });
        }, 50);
      });
    },

    /**
     * Unduh Template Excel (.XLSX) Matriks Penugasan & Responden
     * Memiliki 2 sheet: DAFTAR RESPONDEN dan PETUNJUK PENGISIAN
     */
    downloadExcelTemplateMatrix: function () {
      try {
        if (typeof window.XLSX !== 'undefined') {
          const wb = window.XLSX.utils.book_new();

          // 1. Sheet DAFTAR RESPONDEN
          const headers = [
            'No',
            'NIP',
            'Nama Peserta',
            'Jabatan',
            'Unit Kerja',
            'Bagian A',
            'Bagian B',
            'Bagian C'
          ];

          const sampleData = [
            [1, '9820011ZY', 'Ahmad Santoso, S.T.', 'Junior Engineer Jaringan & Gardu', 'PLN UP3 Metro', 'V', 'V', 'V'],
            [2, '9719012ZY', 'Gita Permatasari', 'Pelaksana Analis Efisiensi', 'PLN ULP Bandarjaya', 'V', 'V', ''],
            [3, '9518003ZY', 'Budi Prasetyo, A.Md.', 'Pelaksana Operasi Distribusi', 'PLN ULP Metro Kota', 'V', '', ''],
            [4, '9617004ZY', 'Dedi Kurniawan', 'Pelaksana Pemeliharaan Gardu', 'PLN ULP Sukadana', '', 'V', ''],
            [5, '9416005ZY', 'Rina Wulandari, S.T.', 'Junior Officer Perencanaan Sistem', 'PLN UP3 Metro', 'V', '', 'V']
          ];

          const wsData = [headers, ...sampleData];
          const ws = window.XLSX.utils.aoa_to_sheet(wsData);

          // Format lebar kolom optimal
          ws['!cols'] = [
            { wch: 6 },  // No
            { wch: 16 }, // NIP
            { wch: 30 }, // Nama Peserta
            { wch: 35 }, // Jabatan
            { wch: 25 }, // Unit Kerja
            { wch: 12 }, // Bagian A
            { wch: 12 }, // Bagian B
            { wch: 12 }  // Bagian C
          ];

          window.XLSX.utils.book_append_sheet(wb, ws, 'DAFTAR RESPONDEN');

          // 2. Sheet PETUNJUK PENGISIAN
          const guideData = [
            ['PETUNJUK PENGISIAN TEMPLATE MATRIKS PENUGASAN EVALUASI LEVEL 3 PLN CORPU'],
            [''],
            ['NO', 'KOLOM', 'STATUS', 'KETENTUAN PENGISIAN'],
            [1, 'No', 'Opsional', 'Nomor urut peserta (1, 2, 3, dst.)'],
            [2, 'NIP', 'Wajib', 'Nomor Induk Pegawai resmi PLN. NIP ini otomatis menjadi USERNAME akun login peserta ke sistem.'],
            [3, 'Nama Peserta', 'Wajib', 'Nama lengkap peserta pembelajaran beserta gelar bila ada.'],
            [4, 'Jabatan', 'Wajib', 'Jabatan kedinasan peserta di unit kerja (contoh: Junior Engineer Jaringan).'],
            [5, 'Unit Kerja', 'Wajib', 'Unit penempatan kerja peserta (contoh: PLN UP3 Metro, PLN ULP Bandarjaya).'],
            [6, 'Bagian A', 'Pilihan', 'Beri tanda "V" atau angka "1" jika peserta wajib dinilai untuk Modul A (Penurunan Susut Teknis & Penyeimbangan Beban). Kosongkan jika tidak.'],
            [7, 'Bagian B', 'Pilihan', 'Beri tanda "V" atau angka "1" jika peserta wajib dinilai untuk Modul B (Refreshment P2TL). Kosongkan jika tidak.'],
            [8, 'Bagian C', 'Pilihan', 'Beri tanda "V" atau angka "1" jika peserta wajib dinilai untuk Modul C (Perhitungan Susut Jaringan Menggunakan PSS SINCAL). Kosongkan jika tidak.'],
            [''],
            ['INFORMASI SISTEM & KETENTUAN AKUN:'],
            ['1. Otomasi Akun: Sistem akan otomatis membuat akun pengguna untuk NIP yang belum terdaftar di sistem.'],
            ['2. Password Awal (Default): Seluruh akun peserta baru otomatis memiliki password awal: pln123'],
            ['3. Keamanan Data: Sistem bersifat non-destructive (tidak menghapus data yang sudah ada).'],
            ['4. Konfirmasi Duplikat: Jika ada peserta yang sudah terdaftar, Anda dapat memilih "Lewati (Skip)" atau "Timpa Data (Overwrite)" saat proses impor.'],
            ['5. Nama Sheet: Mohon JANGAN mengubah nama sheet "DAFTAR RESPONDEN" agar sistem dapat membaca data secara otomatis.']
          ];

          const wsGuide = window.XLSX.utils.aoa_to_sheet(guideData);
          wsGuide['!cols'] = [
            { wch: 6 },
            { wch: 18 },
            { wch: 12 },
            { wch: 95 }
          ];

          window.XLSX.utils.book_append_sheet(wb, wsGuide, 'PETUNJUK PENGISIAN');

          // Download file XLSX
          window.XLSX.writeFile(wb, 'Template_Matriks_Penugasan_Evaluasi_Level_3.xlsx');
          if (window.App && window.App.showToast) {
            window.App.showToast('Template Excel (.XLSX) berhasil diunduh. Silakan isi data sesuai petunjuk.', 'success');
          }
        } else {
          this.downloadCsvFallbackTemplate();
        }
      } catch (err) {
        console.error('Gagal unduh template Excel:', err);
        this.downloadCsvFallbackTemplate();
      }
    },

    /**
     * Fallback download CSV jika library XLSX tidak tersedia
     */
    downloadCsvFallbackTemplate: function () {
      const csvContent = 
        '\uFEFF' +
        'No,NIP,Nama Peserta,Jabatan,Unit Kerja,Bagian A,Bagian B,Bagian C\n' +
        '1,9820011ZY,Ahmad Santoso, S.T.,Junior Engineer Jaringan & Gardu,PLN UP3 Metro,V,V,V\n' +
        '2,9719012ZY,Gita Permatasari,Pelaksana Analis Efisiensi,PLN ULP Bandarjaya,V,V,\n' +
        '3,9518003ZY,Budi Prasetyo, A.Md.,Pelaksana Operasi Distribusi,PLN ULP Metro Kota,V,,\n' +
        '4,9617004ZY,Dedi Kurniawan,Pelaksana Pemeliharaan Gardu,PLN ULP Sukadana,,V,\n' +
        '5,9416005ZY,Rina Wulandari, S.T.,Junior Officer Perencanaan Sistem,PLN UP3 Metro,V,,V\n';

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template_Matriks_Penugasan_Evaluasi_Level_3.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (window.App && window.App.showToast) {
        window.App.showToast('Template CSV berhasil diunduh.', 'success');
      }
    }
  };
})();
