/**
 * View: Bank Butir Evaluasi (Master Sumber Instrumen Berbasis Program)
 * Evaluasi Level 3 — PLN Impact Lab (PIL)
 * Mendukung isolasi Bank Butir per Program Pelatihan, multi-katalog, dan full CRUD Butir Perilaku:
 * ID, Bagian, Kode Diklat & KEYBE, Pernyataan Butir Perilaku (Peserta), Contoh Dokumen Bukti Kerja, Kompetensi.
 */

(function () {
  window.AdminBankButirView = {
    selectedProgramId: 'prog-pil-susut',
    selectedBankButirId: null,
    selectedPartFilter: 'ALL',
    searchQuery: '',

    getModalContainer: function () {
      let modalContainer = document.getElementById('bb-modal-container');
      if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'bb-modal-container';
        document.body.appendChild(modalContainer);
      } else if (modalContainer.parentElement !== document.body) {
        document.body.appendChild(modalContainer);
      }
      return modalContainer;
    },

    render: function (container) {
      const programs = window.appStore.programs || [];
      if (!this.selectedProgramId || !programs.some(p => p.id === this.selectedProgramId)) {
        this.selectedProgramId = programs.length > 0 ? programs[0].id : '';
      }

      const activeProgram = programs.find(p => p.id === this.selectedProgramId) || {
        id: this.selectedProgramId || '',
        nama: programs.length > 0 ? 'Pilih Program' : 'Belum Ada Program',
        kode: '-',
        updlId: ''
      };

      const updl = (window.appStore.updls || []).find(u => u.id === activeProgram.updlId) || { nama: '-' };

      // Get Bank Butir list for this program
      const bbList = window.appStore.getBankButirList(this.selectedProgramId);

      // Verify active Bank Butir selection
      if (!this.selectedBankButirId || !bbList.some(b => b.id === this.selectedBankButirId)) {
        const activeBB = window.appStore.getActiveBankButirForProgram(this.selectedProgramId);
        this.selectedBankButirId = activeBB ? activeBB.id : (bbList.length > 0 ? bbList[0].id : null);
      }

      const currentBB = this.selectedBankButirId ? window.appStore.getBankButirById(this.selectedBankButirId) : null;
      const items = currentBB ? window.appStore.getAllBankButirItems(currentBB.id) : [];
      const sections = currentBB?.sections || {};
      const sectionKeys = Object.keys(sections);

      // Filtered items
      let filtered = items;
      if (this.selectedPartFilter !== 'ALL') {
        filtered = filtered.filter(it => it.partKey === this.selectedPartFilter);
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(it =>
          (it.perilaku && it.perilaku.toLowerCase().includes(q)) ||
          (it.perilakuAtasan && it.perilakuAtasan.toLowerCase().includes(q)) ||
          (it.contohBukti && it.contohBukti.toLowerCase().includes(q)) ||
          (it.id && it.id.toLowerCase().includes(q)) ||
          (it.partKey && it.partKey.toLowerCase().includes(q)) ||
          (it.kodeDiklat && it.kodeDiklat.toLowerCase().includes(q)) ||
          (it.partKeybe && it.partKeybe.toLowerCase().includes(q)) ||
          (it.kompetensi && it.kompetensi.toLowerCase().includes(q))
        );
      }

      const partCounts = {};
      sectionKeys.forEach(key => {
        partCounts[key] = items.filter(x => x.partKey === key).length;
      });

      // Palette styling helper for sections
      const colorPalettes = [
        { border: 'border-l-[#0F96A9]', text: 'text-[#0F96A9]', bg: 'bg-[#E0F7FA]', ring: 'border-[#B2EBF2]' },
        { border: 'border-l-[#D97706]', text: 'text-[#D97706]', bg: 'bg-[#FEF3C7]', ring: 'border-[#FDE68A]' },
        { border: 'border-l-[#7C3AED]', text: 'text-[#7C3AED]', bg: 'bg-[#EDE9FE]', ring: 'border-[#DDD6FE]' },
        { border: 'border-l-[#2563EB]', text: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]', ring: 'border-[#BFDBFE]' },
        { border: 'border-l-[#059669]', text: 'text-[#059669]', bg: 'bg-[#ECFDF5]', ring: 'border-[#A7F3D0]' }
      ];

      container.innerHTML = `
        <div class="flex flex-col gap-6 animate-fadeIn">
          
          <!-- Page Header & Program Selector -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col gap-1 max-w-3xl">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                  Evaluasi Level 3 — PLN Impact Lab (PIL)
                </span>
                <span class="text-xs text-[#64748B] font-mono">Bank Butir Terisolasi per Program</span>
              </div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">
                Bank Butir Evaluasi Perilaku
              </h1>
              <p class="text-xs md:text-sm text-[#64748B] leading-relaxed">
                Kelola master butir instrumen perilaku kerja terisolasi per program pembelajaran. Anda dapat melakukan tambah, ubah, dan hapus (CRUD) butir perilaku pada setiap katalog.
              </p>
            </div>

            <!-- Global Action Buttons -->
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" id="btn-export-bank-butir" class="btn-secondary" ${!currentBB ? 'disabled' : ''}>
                <span class="material-symbols-outlined text-[16px]">file_download</span>
                Ekspor JSON
              </button>
              <button type="button" id="btn-import-bank-butir" class="btn-secondary">
                <span class="material-symbols-outlined text-[16px]">upload_file</span>
                Pratinjau Impor Excel
              </button>
              <button type="button" id="btn-tambah-bank-butir" class="btn-secondary">
                <span class="material-symbols-outlined text-[16px]">create_new_folder</span>
                + Katalog Baru
              </button>
              <button type="button" id="btn-tambah-butir-item" class="btn-primary" ${!currentBB ? 'disabled' : ''}>
                <span class="material-symbols-outlined text-[16px]">add_circle</span>
                + Tambah Butir Perilaku
              </button>
            </div>
          </div>

          <!-- Program & Bank Butir Context Bar -->
          <div class="card p-5 bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] border border-[#CBD5E1] shadow-sm">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              
              <!-- Program Dropdown -->
              <div class="lg:col-span-5 space-y-1.5">
                <label class="block text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[15px] text-[#0F96A9]">school</span>
                  Pilih Program Pembelajaran:
                </label>
                <div class="relative">
                  <select id="select-program-filter" class="w-full text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg px-3 py-2.5 text-[#172B3A] focus:outline-none focus:ring-2 focus:ring-[#0F96A9] focus:border-transparent cursor-pointer shadow-sm">
                    ${programs.map(p => `
                      <option value="${p.id}" ${p.id === this.selectedProgramId ? 'selected' : ''}>
                        [${p.kode}] ${p.nama}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <!-- Catalog Dropdown (Multi-Catalog Per Program) -->
              <div class="lg:col-span-4 space-y-1.5">
                <label class="block text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[15px] text-[#D97706]">inventory_2</span>
                  Katalog Bank Butir Program:
                </label>
                <div class="relative">
                  ${bbList.length === 0 ? `
                    <div class="text-xs p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg font-medium flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[16px]">warning</span>
                      Belum ada katalog untuk program ini
                    </div>
                  ` : `
                    <select id="select-catalog-filter" class="w-full text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg px-3 py-2.5 text-[#172B3A] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent cursor-pointer shadow-sm">
                      ${bbList.map(b => `
                        <option value="${b.id}" ${b.id === this.selectedBankButirId ? 'selected' : ''}>
                          ${b.nama} (${b.status})
                        </option>
                      `).join('')}
                    </select>
                  `}
                </div>
              </div>

              <!-- Catalog Actions -->
              <div class="lg:col-span-3 flex items-center justify-start lg:justify-end gap-2 pt-2 lg:pt-5">
                ${currentBB ? `
                  <button id="btn-duplicate-bank-butir" class="px-3 py-2 text-xs font-bold bg-white text-[#0F96A9] border border-[#0F96A9] rounded-lg hover:bg-[#E0F7FA] transition-all flex items-center gap-1.5 shadow-sm" title="Duplikasi katalog ini ke program lain">
                    <span class="material-symbols-outlined text-[16px]">content_copy</span>
                    Duplikasi ke Program Lain
                  </button>
                  <button id="btn-toggle-status-bb" class="p-2 text-xs font-bold ${currentBB.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'} border rounded-lg transition-all" title="Ubah status katalog (AKTIF / NONAKTIF)">
                    <span class="material-symbols-outlined text-[16px]">${currentBB.status === 'AKTIF' ? 'check_circle' : 'pause_circle'}</span>
                  </button>
                ` : ''}
              </div>

            </div>

            <!-- Active Context Details Banner (No Version Statement) -->
            ${currentBB ? `
              <div class="mt-4 pt-3 border-t border-[#CBD5E1]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div class="flex flex-wrap items-center gap-4">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[#64748B]">Kode Katalog:</span>
                    <span class="font-mono font-bold text-[#172B3A] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">${currentBB.kode || currentBB.id}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[#64748B]">Penyelenggara:</span>
                    <span class="font-semibold text-[#172B3A]">${updl.nama}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[#64748B]">Status:</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${currentBB.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">${currentBB.status}</span>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-[#64748B]">Total Instrumen:</span>
                  <span class="font-mono font-bold text-sm text-[#172B3A] bg-[#E0F7FA] text-[#0F96A9] px-2.5 py-0.5 rounded-full border border-[#B2EBF2]">${items.length} Butir</span>
                </div>
              </div>
            ` : ''}

          </div>

          <!-- Section Summaries (Dynamically Rendered from currentBB) -->
          ${currentBB && sectionKeys.length > 0 ? `
            <div class="grid grid-cols-1 md:grid-cols-${Math.min(sectionKeys.length, 3)} gap-4">
              ${sectionKeys.map((key, idx) => {
                const sec = sections[key] || {};
                const palette = colorPalettes[idx % colorPalettes.length];
                const count = partCounts[key] || 0;
                return `
                  <div class="card p-4 border-l-4 ${palette.border} flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div class="space-y-1">
                      <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold ${palette.text} ${palette.bg} px-2 py-0.5 rounded uppercase">
                          Bagian ${key} • ${count} Butir
                        </span>
                        <span class="font-mono text-[11px] text-[#64748B]">
                          Kode: ${sec.kodeDiklat || '-'}
                        </span>
                      </div>
                      <h4 class="text-xs font-bold text-[#172B3A] line-clamp-2 pt-1" title="${sec.title || ''}">
                        ${sec.title || `Bagian ${key}`}
                      </h4>
                      <div class="text-[11px] text-[#64748B]">
                        KEYBE: <code class="font-bold text-[#172B3A]">${sec.keybe || '-'}</code>
                      </div>
                    </div>
                    <div class="mt-3 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
                      <span class="text-[#64748B]">Bobot Default: <b>${sec.bobotDefault || 0}%</b></span>
                      <button class="font-bold hover:underline btn-filter-shortcut ${palette.text}" data-part="${key}">
                        Filter Bagian ${key} →
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}

          <!-- Main Table Card with CRUD Operations -->
          <div class="card overflow-hidden">
            
            <!-- Filter & Search Toolbar -->
            <div class="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div class="flex flex-wrap items-center gap-2">
                <label class="text-xs font-semibold text-[#475569]">Filter Bagian:</label>
                <div class="inline-flex rounded-lg border border-[#CBD5E1] bg-white p-0.5 text-xs">
                  <button class="btn-part-filter px-3 py-1 rounded ${this.selectedPartFilter === 'ALL' ? 'bg-[#172B3A] text-white font-bold' : 'text-[#64748B] hover:text-[#172B3A]'}" data-part="ALL">
                    Semua (${items.length})
                  </button>
                  ${sectionKeys.map(key => `
                    <button class="btn-part-filter px-3 py-1 rounded ${this.selectedPartFilter === key ? 'bg-[#0F96A9] text-white font-bold' : 'text-[#64748B] hover:text-[#172B3A]'}" data-part="${key}">
                      Bagian ${key} (${partCounts[key] || 0})
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Search Input & Quick Add Button -->
              <div class="flex items-center gap-2 w-full md:w-auto">
                <div class="w-full md:w-64">
                  <input type="text" id="input-search-bank-butir" class="w-full text-xs border border-[#CBD5E1] rounded px-3 py-1.5 bg-white text-[#172B3A] placeholder-[#94A3B8] focus:outline-none focus:border-[#23C4DB]" placeholder="Cari ID, bagian, bukti, kompetensi..." value="${this.searchQuery}" />
                </div>
                <button id="btn-table-tambah-butir" class="btn-primary text-xs shrink-0" ${!currentBB ? 'disabled' : ''}>
                  <span class="material-symbols-outlined text-[15px]">add</span>
                  + Butir
                </button>
              </div>
            </div>

            <!-- Items Table (6 Core Fields: ID, Bagian, Kode Diklat & KEYBE, Pernyataan Butir Perilaku, Contoh Bukti, Kompetensi) -->
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-[#F1F5F9] text-[#475569] font-semibold border-b border-[#CBD5E1]">
                    <th class="py-3 px-4 w-14 text-center">ID</th>
                    <th class="py-3 px-4 w-24 text-center">Bagian</th>
                    <th class="py-3 px-4 w-44">Kode Diklat & KEYBE</th>
                    <th class="py-3 px-4">Pernyataan Butir Perilaku (Peserta)</th>
                    <th class="py-3 px-4 w-52">Contoh Dokumen Bukti Kerja</th>
                    <th class="py-3 px-4 w-44">Kompetensi</th>
                    <th class="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]">
                  ${filtered.length === 0 ? `
                    <tr>
                      <td colspan="7" class="text-center py-12 text-[#94A3B8]">
                        <span class="material-symbols-outlined text-4xl block mb-2 text-slate-300">manage_search</span>
                        Tidak ada butir perilaku yang sesuai dengan kriteria atau katalog ini belum memiliki butir.
                        ${currentBB ? `
                          <div class="mt-3">
                            <button class="btn-primary text-xs inline-flex items-center gap-1.5" onclick="window.AdminBankButirView.showAddButirModal()">
                              <span class="material-symbols-outlined text-[16px]">add_circle</span>
                              Tambah Butir Perilaku Pertama
                            </button>
                          </div>
                        ` : ''}
                      </td>
                    </tr>
                  ` : filtered.map((it) => {
                    const badgeStyles = {
                      A: 'bg-[#E0F7FA] text-[#0F96A9] border-[#B2EBF2]',
                      B: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
                      C: 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]',
                      D: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                    };
                    const badge = badgeStyles[it.partKey] || 'bg-slate-100 text-slate-700 border-slate-200';

                    return `
                      <tr class="bank-butir-row hover:bg-[#F8FAFC] transition-colors" data-search="${(it.id + ' ' + (it.partKey || '') + ' ' + (it.kodeDiklat || '') + ' ' + (it.partKeybe || '') + ' ' + (it.perilaku || '') + ' ' + (it.contohBukti || '') + ' ' + (it.kompetensi || '')).toLowerCase()}">
                        <td class="py-3 px-4 text-center font-mono font-bold text-[#172B3A] bg-slate-50/50">${it.id}</td>
                        <td class="py-3 px-4 text-center">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badge}">
                            Bagian ${it.partKey}
                          </span>
                        </td>
                        <td class="py-3 px-4">
                          <div class="font-mono text-[#64748B] text-[11px]">${it.kodeDiklat || '-'}</div>
                          <div class="font-mono font-semibold text-[#172B3A] text-[10px] mt-0.5">${it.partKeybe || '-'}</div>
                        </td>
                        <td class="py-3 px-4 text-[#172B3A] max-w-sm">
                          <div class="font-medium leading-relaxed">${it.perilaku || ''}</div>
                          ${it.perilakuAtasan ? `<div class="text-[11px] text-[#64748B] mt-0.5 italic">Perspektif Atasan: "${it.perilakuAtasan}"</div>` : ''}
                        </td>
                        <td class="py-3 px-4 text-[#475569]">
                          <div class="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[11px]">
                            <span class="material-symbols-outlined text-[14px] text-[#0F96A9]">attach_file</span>
                            <span class="line-clamp-2">${it.contohBukti || '-'}</span>
                          </div>
                        </td>
                        <td class="py-3 px-4 text-[#475569] font-medium">
                          ${it.kompetensi || '-'}
                        </td>
                        <td class="py-3 px-4 text-center">
                          <div class="inline-flex items-center gap-1">
                            <button class="btn-action-view-butir p-1.5 hover:bg-[#E0F2FE] text-[#0284C7] rounded" data-id="${it.id}" title="Lihat Detail Lengkap">
                              <span class="material-symbols-outlined text-[17px]">visibility</span>
                            </button>
                            <button class="btn-action-edit-butir p-1.5 hover:bg-[#FEF3C7] text-[#D97706] rounded" data-id="${it.id}" title="Edit Butir (ID, Bagian, Kode Diklat, KEYBE, Redaksi, Bukti, Kompetensi)">
                              <span class="material-symbols-outlined text-[17px]">edit</span>
                            </button>
                            <button class="btn-action-delete-butir p-1.5 hover:bg-[#FEE2E2] text-[#DC2626] rounded" data-id="${it.id}" title="Hapus Butir Perilaku">
                              <span class="material-symbols-outlined text-[17px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                  <tr id="bank-butir-empty-search-row" class="hidden">
                    <td colspan="7" class="text-center py-12 text-[#94A3B8]">
                      <span class="material-symbols-outlined text-4xl block mb-2 text-slate-300">search_off</span>
                      Tidak ada butir perilaku yang cocok dengan kata kunci pencarian.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Footer Notes -->
            <div class="p-3 bg-[#F1F5F9] border-t border-[#E2E8F0] text-[11px] text-[#64748B] flex flex-wrap items-center justify-between gap-2">
              <span class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[15px] text-[#0F96A9]">verified_user</span>
                Bank Butir terikat secara eksklusif ke Program: <b>${activeProgram.nama}</b>
              </span>
              <span class="font-mono text-[#172B3A]">${currentBB ? `Katalog: ${currentBB.kode || currentBB.id}` : 'Belum ada katalog'}</span>
            </div>

          </div>

        </div>

        <!-- Bank Butir Modal Container -->
        <div id="bb-modal-container"></div>
      `;

      this.attachEventListeners(container);
    },

    attachEventListeners: function (container) {
      // Program Selector Dropdown
      const programSelect = container.querySelector('#select-program-filter');
      if (programSelect) {
        programSelect.addEventListener('change', (e) => {
          this.selectedProgramId = e.target.value;
          this.selectedBankButirId = null; // Reset to active of new program
          this.selectedPartFilter = 'ALL';
          this.searchQuery = '';
          this.render(container);
        });
      }

      // Catalog Selector Dropdown
      const catalogSelect = container.querySelector('#select-catalog-filter');
      if (catalogSelect) {
        catalogSelect.addEventListener('change', (e) => {
          this.selectedBankButirId = e.target.value;
          this.selectedPartFilter = 'ALL';
          this.render(container);
        });
      }

      // Part Filter Buttons
      container.querySelectorAll('.btn-part-filter, .btn-filter-shortcut').forEach(btn => {
        btn.addEventListener('click', () => {
          this.selectedPartFilter = btn.getAttribute('data-part');
          this.render(container);
        });
      });

      // Search input (Real-time client filtering without losing focus or destroying DOM input)
      const searchInput = container.querySelector('#input-search-bank-butir');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          const rawQ = e.target.value.toLowerCase().trim();
          const terms = rawQ ? rawQ.split(/\s+/).filter(Boolean) : [];
          const rows = container.querySelectorAll('.bank-butir-row');
          let visibleCount = 0;

          rows.forEach(tr => {
            const searchData = tr.getAttribute('data-search') || tr.textContent.toLowerCase();
            const matches = terms.length === 0 || terms.every(t => searchData.includes(t));
            tr.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
          });

          const emptyRow = container.querySelector('#bank-butir-empty-search-row');
          if (emptyRow) {
            emptyRow.style.display = (visibleCount === 0 && rows.length > 0) ? '' : 'none';
          }
        });
      }

      // Button: Tambah Butir Perilaku (Primary Action)
      const addButirBtn = container.querySelector('#btn-tambah-butir-item');
      if (addButirBtn) {
        addButirBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showAddButirModal();
        });
      }
      const tableAddButirBtn = container.querySelector('#btn-table-tambah-butir');
      if (tableAddButirBtn) {
        tableAddButirBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showAddButirModal();
        });
      }

      // Button: Tambah Katalog Bank Butir
      const addCatalogBtn = container.querySelector('#btn-tambah-bank-butir');
      if (addCatalogBtn) {
        addCatalogBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showAddBankButirModal();
        });
      }

      // Button: Duplikasi Bank Butir
      const dupBtn = container.querySelector('#btn-duplicate-bank-butir');
      if (dupBtn) {
        dupBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showDuplicateModal();
        });
      }

      // Button: Toggle Status Bank Butir
      const toggleStatusBtn = container.querySelector('#btn-toggle-status-bb');
      if (toggleStatusBtn && this.selectedBankButirId) {
        toggleStatusBtn.addEventListener('click', () => {
          try {
            const updated = window.appStore.toggleBankButirStatus(this.selectedBankButirId);
            this.showToast(`Status katalog diubah menjadi ${updated.status}.`, 'success');
            this.render(container);
          } catch (err) {
            this.showToast(err.message, 'error');
          }
        });
      }

      // Button: Ekspor Bank Butir JSON
      const exportBtn = container.querySelector('#btn-export-bank-butir');
      if (exportBtn && this.selectedBankButirId) {
        exportBtn.addEventListener('click', () => {
          const bb = window.appStore.getBankButirById(this.selectedBankButirId);
          if (!bb) return;
          const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bb, null, 2));
          const dlAnchor = document.createElement('a');
          dlAnchor.setAttribute("href", jsonStr);
          dlAnchor.setAttribute("download", `${bb.kode || bb.id}_Bank_Butir.json`);
          document.body.appendChild(dlAnchor);
          dlAnchor.click();
          dlAnchor.remove();
          this.showToast('Data Bank Butir berhasil diekspor.', 'success');
        });
      }

      // Button: Pratinjau Impor Excel
      const importBtn = container.querySelector('#btn-import-bank-butir');
      if (importBtn) {
        importBtn.addEventListener('click', () => this.showImportModal());
      }

      // Row Actions: View, Edit, Delete
      container.querySelectorAll('.btn-action-view-butir').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.showDetailModal(id);
        });
      });

      container.querySelectorAll('.btn-action-edit-butir').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.showEditModal(id);
        });
      });

      container.querySelectorAll('.btn-action-delete-butir').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.showDeleteModal(id);
        });
      });
    },

    /**
     * Modal: Tambah Butir Perilaku Baru (Create)
     * Fields: ID, Bagian, Kode Diklat & KEYBE, Pernyataan Butir Perilaku, Contoh Dokumen Bukti Kerja, Kompetensi
     */
    showAddButirModal: function () {
      const modalContainer = this.getModalContainer();
      if (!modalContainer || !this.selectedBankButirId) return;

      const currentBB = window.appStore.getBankButirById(this.selectedBankButirId);
      if (!currentBB) return;

      const existingSections = Object.keys(currentBB.sections || {});
      const defaultPart = existingSections.length > 0 ? existingSections[0] : 'A';
      const existingItems = window.appStore.getAllBankButirItems(this.selectedBankButirId);
      const suggestedId = `${defaultPart}${existingItems.filter(x => x.partKey === defaultPart).length + 1}`;

      const defaultSec = currentBB.sections && currentBB.sections[defaultPart] ? currentBB.sections[defaultPart] : {};

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between sticky top-0 z-10">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">add_circle</span>
                Tambah Butir Perilaku Baru (${currentBB.nama})
              </h3>
              <button type="button" id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form id="form-add-butir" class="p-5 space-y-3.5 text-xs">
              
              <!-- Row 1: ID & Bagian -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">
                    ID Butir <span class="text-red-500">*</span>
                  </label>
                  <input type="text" id="add-butir-id" required placeholder="Contoh: A5, B5, C4" value="${suggestedId}" class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono font-bold text-[#172B3A] focus:border-[#23C4DB] focus:outline-none" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">
                    Bagian <span class="text-red-500">*</span>
                  </label>
                  <div class="flex gap-1.5">
                    <select id="add-butir-part-select" class="w-full border border-[#CBD5E1] rounded px-2.5 py-2 font-semibold bg-white focus:border-[#23C4DB] focus:outline-none">
                      ${existingSections.map(k => `<option value="${k}" ${k === defaultPart ? 'selected' : ''}>Bagian ${k}</option>`).join('')}
                      <option value="__NEW__">+ Bagian Baru...</option>
                    </select>
                    <input type="text" id="add-butir-part-custom" placeholder="Bagian (cth: D)" class="w-24 border border-[#CBD5E1] rounded px-2 py-2 font-bold uppercase hidden focus:border-[#23C4DB] focus:outline-none" />
                  </div>
                </div>
              </div>

              <!-- Row 2: Kode Diklat & KEYBE -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">
                    Kode Diklat
                  </label>
                  <input type="text" id="add-butir-kodediklat" placeholder="Contoh: D.1.171.024.2" value="${defaultSec.kodeDiklat || ''}" class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono focus:border-[#23C4DB] focus:outline-none" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">
                    KEYBE (Key Behavior)
                  </label>
                  <input type="text" id="add-butir-keybe" placeholder="Contoh: 1.7.1.DST.OPS.2.1" value="${defaultSec.keybe || ''}" class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono text-[#0F96A9] font-semibold focus:border-[#23C4DB] focus:outline-none" />
                </div>
              </div>

              <!-- Row 3: Kompetensi -->
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">
                  Kompetensi Inti <span class="text-red-500">*</span>
                </label>
                <input type="text" id="add-butir-kompetensi" required placeholder="Contoh: Pemeliharaan Gardu Distribusi" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" />
              </div>

              <!-- Row 4: Pernyataan Butir Perilaku (Peserta) -->
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">
                  Pernyataan Butir Perilaku (Perspektif Peserta) <span class="text-red-500">*</span>
                </label>
                <textarea id="add-butir-perilaku" rows="2" required placeholder="Contoh: Saya melaksanakan pemeliharaan gardu distribusi sesuai SOP." class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none leading-relaxed"></textarea>
              </div>

              <!-- Row 5: Pernyataan Butir Perilaku (Atasan) -->
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">
                  Pernyataan Butir Perilaku (Perspektif Atasan Langsung)
                </label>
                <textarea id="add-butir-perilaku-atasan" rows="2" placeholder="Otomatis terisi jika dikosongkan (contoh: Peserta melaksanakan...)" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none leading-relaxed"></textarea>
              </div>

              <!-- Row 6: Contoh Dokumen Bukti Kerja -->
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">
                  Contoh Dokumen Bukti Kerja <span class="text-red-500">*</span>
                </label>
                <input type="text" id="add-butir-bukti" required placeholder="Contoh: Checklist pemeliharaan gardu distribusi & BA pekerjaan" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" />
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="submit" class="btn-primary">Simpan Butir Baru</button>
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

      // Handle custom section toggle & prefill kodeDiklat/keybe when section changes
      const partSelect = modalContainer.querySelector('#add-butir-part-select');
      const partCustom = modalContainer.querySelector('#add-butir-part-custom');
      const kodeInput = modalContainer.querySelector('#add-butir-kodediklat');
      const keybeInput = modalContainer.querySelector('#add-butir-keybe');

      partSelect.addEventListener('change', (e) => {
        if (e.target.value === '__NEW__') {
          partCustom.classList.remove('hidden');
          partCustom.focus();
        } else {
          partCustom.classList.add('hidden');
          const sec = currentBB.sections && currentBB.sections[e.target.value] ? currentBB.sections[e.target.value] : {};
          if (sec.kodeDiklat) kodeInput.value = sec.kodeDiklat;
          if (sec.keybe) keybeInput.value = sec.keybe;
        }
      });

      modalContainer.querySelector('#form-add-butir').onsubmit = (e) => {
        e.preventDefault();
        try {
          let partVal = partSelect.value;
          if (partVal === '__NEW__') {
            partVal = (partCustom.value || '').trim().toUpperCase();
            if (!partVal) throw new Error('Harap ketikkan kode Bagian baru (misal: D).');
          }

          const id = modalContainer.querySelector('#add-butir-id').value;
          const kodeDiklat = modalContainer.querySelector('#add-butir-kodediklat').value;
          const keybe = modalContainer.querySelector('#add-butir-keybe').value;
          const kompetensi = modalContainer.querySelector('#add-butir-kompetensi').value;
          const perilaku = modalContainer.querySelector('#add-butir-perilaku').value;
          const perilakuAtasan = modalContainer.querySelector('#add-butir-perilaku-atasan').value;
          const contohBukti = modalContainer.querySelector('#add-butir-bukti').value;

          window.appStore.addBankButirItem(this.selectedBankButirId, {
            id,
            partKey: partVal,
            kodeDiklat,
            keybe,
            kompetensi,
            perilaku,
            perilakuAtasan,
            contohBukti
          });

          this.showToast(`Butir #${id} berhasil ditambahkan ke Bank Butir.`, 'success');
          closeModal();
          const mainContainer = document.getElementById('main-content-area');
          if (mainContainer) this.render(mainContainer);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      };
    },

    /**
     * Modal: Edit Butir Perilaku (Update)
     * Mengizinkan modifikasi seluruh atribut butir: ID, Bagian, Kode Diklat, KEYBE, Perilaku, Bukti, Kompetensi
     */
    showEditModal: function (id) {
      const modalContainer = this.getModalContainer();
      if (!modalContainer || !this.selectedBankButirId) return;

      const currentBB = window.appStore.getBankButirById(this.selectedBankButirId);
      const item = window.appStore.getBankButirItemById(id, this.selectedBankButirId);
      if (!item || !currentBB) return;

      const existingSections = Object.keys(currentBB.sections || {});

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between sticky top-0 z-10">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">edit</span>
                Edit Butir Instrumen #${item.id}
              </h3>
              <button type="button" id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form id="form-edit-butir" class="p-5 space-y-3.5 text-xs">
              
              <!-- Row 1: ID & Bagian -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">
                    ID Butir <span class="text-red-500">*</span>
                  </label>
                  <input type="text" id="edit-butir-id" required value="${item.id}" class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono font-bold text-[#172B3A] focus:border-[#23C4DB] focus:outline-none" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">
                    Bagian <span class="text-red-500">*</span>
                  </label>
                  <div class="flex gap-1.5">
                    <select id="edit-butir-part-select" class="w-full border border-[#CBD5E1] rounded px-2.5 py-2 font-semibold bg-white focus:border-[#23C4DB] focus:outline-none">
                      ${existingSections.map(k => `<option value="${k}" ${k === item.partKey ? 'selected' : ''}>Bagian ${k}</option>`).join('')}
                      <option value="__NEW__">+ Bagian Baru...</option>
                    </select>
                    <input type="text" id="edit-butir-part-custom" placeholder="Bagian" class="w-24 border border-[#CBD5E1] rounded px-2 py-2 font-bold uppercase hidden focus:border-[#23C4DB] focus:outline-none" />
                  </div>
                </div>
              </div>

              <!-- Row 2: Kode Diklat & KEYBE -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">
                    Kode Diklat
                  </label>
                  <input type="text" id="edit-butir-kodediklat" value="${item.kodeDiklat || ''}" class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono focus:border-[#23C4DB] focus:outline-none" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">
                    KEYBE (Key Behavior)
                  </label>
                  <input type="text" id="edit-butir-keybe" value="${item.partKeybe || ''}" class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono text-[#0F96A9] font-semibold focus:border-[#23C4DB] focus:outline-none" />
                </div>
              </div>

              <!-- Row 3: Kompetensi -->
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">
                  Kompetensi Inti <span class="text-red-500">*</span>
                </label>
                <input type="text" id="edit-butir-kompetensi" required value="${item.kompetensi || ''}" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" />
              </div>

              <!-- Row 4: Pernyataan Butir Perilaku (Peserta) -->
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">
                  Pernyataan Butir Perilaku (Perspektif Peserta) <span class="text-red-500">*</span>
                </label>
                <textarea id="edit-butir-perilaku" rows="3" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none leading-relaxed">${item.perilaku || ''}</textarea>
              </div>

              <!-- Row 5: Pernyataan Butir Perilaku (Atasan) -->
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">
                  Pernyataan Butir Perilaku (Perspektif Atasan Langsung)
                </label>
                <textarea id="edit-butir-perilaku-atasan" rows="2" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none leading-relaxed">${item.perilakuAtasan || ''}</textarea>
              </div>

              <!-- Row 6: Contoh Dokumen Bukti Kerja -->
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">
                  Contoh Dokumen Bukti Kerja <span class="text-red-500">*</span>
                </label>
                <input type="text" id="edit-butir-bukti" required value="${item.contohBukti || ''}" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" />
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="submit" class="btn-primary">Simpan Perubahan</button>
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

      const partSelect = modalContainer.querySelector('#edit-butir-part-select');
      const partCustom = modalContainer.querySelector('#edit-butir-part-custom');

      partSelect.addEventListener('change', (e) => {
        if (e.target.value === '__NEW__') {
          partCustom.classList.remove('hidden');
          partCustom.focus();
        } else {
          partCustom.classList.add('hidden');
        }
      });

      modalContainer.querySelector('#form-edit-butir').onsubmit = (e) => {
        e.preventDefault();
        try {
          let partVal = partSelect.value;
          if (partVal === '__NEW__') {
            partVal = (partCustom.value || '').trim().toUpperCase();
            if (!partVal) throw new Error('Harap ketikkan kode Bagian baru (misal: D).');
          }

          const newId = modalContainer.querySelector('#edit-butir-id').value;
          const kodeDiklat = modalContainer.querySelector('#edit-butir-kodediklat').value;
          const keybe = modalContainer.querySelector('#edit-butir-keybe').value;
          const kompetensi = modalContainer.querySelector('#edit-butir-kompetensi').value;
          const perilaku = modalContainer.querySelector('#edit-butir-perilaku').value;
          const perilakuAtasan = modalContainer.querySelector('#edit-butir-perilaku-atasan').value;
          const contohBukti = modalContainer.querySelector('#edit-butir-bukti').value;

          window.appStore.updateBankButirItem(id, {
            id: newId,
            partKey: partVal,
            kodeDiklat,
            keybe,
            kompetensi,
            perilaku,
            perilakuAtasan,
            contohBukti
          }, this.selectedBankButirId);

          this.showToast(`Butir #${newId} berhasil diperbarui.`, 'success');
          closeModal();
          const mainContainer = document.getElementById('main-content-area');
          if (mainContainer) this.render(mainContainer);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      };
    },

    /**
     * Modal: Hapus Butir Perilaku (Delete)
     */
    showDeleteModal: function (id) {
      const modalContainer = this.getModalContainer();
      if (!modalContainer || !this.selectedBankButirId) return;

      const item = window.appStore.getBankButirItemById(id, this.selectedBankButirId);
      if (!item) return;

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-md overflow-hidden flex flex-col">
            <div class="px-5 py-4 bg-red-600 text-white flex items-center justify-between">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">warning</span>
                Konfirmasi Hapus Butir
              </h3>
              <button type="button" id="modal-close-btn" class="text-white/80 hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div class="p-5 space-y-4 text-xs">
              <p class="text-[#172B3A]">
                Apakah Anda yakin ingin menghapus butir instrumen perilaku berikut?
              </p>
              
              <div class="p-3 bg-red-50 rounded-lg border border-red-200 space-y-1">
                <div class="font-bold text-red-900 font-mono">ID: ${item.id} (Bagian ${item.partKey})</div>
                <div class="text-[#172B3A] line-clamp-2 italic">"${item.perilaku}"</div>
                <div class="text-[11px] text-[#64748B] pt-1">Kompetensi: <b>${item.kompetensi}</b></div>
              </div>

              <p class="text-[11px] text-[#64748B]">
                Tindakan ini akan menghapus butir secara permanen dari katalog ini. Formulir yang telah terbit sebelumnya tidak terpengaruh.
              </p>

              <div class="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="button" id="modal-confirm-delete" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">delete</span>
                  Hapus Butir
                </button>
              </div>
            </div>
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

      modalContainer.querySelector('#modal-confirm-delete').onclick = () => {
        try {
          window.appStore.deleteBankButirItem(id, this.selectedBankButirId);
          this.showToast(`Butir #${id} berhasil dihapus.`, 'success');
          closeModal();
          const mainContainer = document.getElementById('main-content-area');
          if (mainContainer) this.render(mainContainer);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      };
    },

    /**
     * Modal: Detail Lengkap Butir (Read)
     */
    showDetailModal: function (id) {
      const modalContainer = this.getModalContainer();
      if (!modalContainer) return;

      const item = window.appStore.getBankButirItemById(id, this.selectedBankButirId);
      if (!item) return;

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-xl overflow-hidden flex flex-col">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">fact_check</span>
                Detail Butir Instrumen #${item.id} (Bagian ${item.partKey})
              </h3>
              <button type="button" id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div class="p-5 space-y-4 text-xs">
              
              <div class="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <div>
                  <div class="text-[10px] text-[#64748B] font-semibold uppercase">ID & Bagian</div>
                  <div class="font-mono font-bold text-[#172B3A]">${item.id} • Bagian ${item.partKey}</div>
                </div>
                <div>
                  <div class="text-[10px] text-[#64748B] font-semibold uppercase">Kompetensi Inti</div>
                  <div class="font-semibold text-[#172B3A]">${item.kompetensi || '-'}</div>
                </div>
                <div class="pt-1 border-t border-[#E2E8F0]">
                  <div class="text-[10px] text-[#64748B] font-semibold uppercase">Kode Diklat</div>
                  <div class="font-mono font-bold text-[#172B3A]">${item.kodeDiklat || '-'}</div>
                </div>
                <div class="pt-1 border-t border-[#E2E8F0]">
                  <div class="text-[10px] text-[#64748B] font-semibold uppercase">KEYBE (Key Behavior)</div>
                  <div class="font-mono font-bold text-[#0F96A9]">${item.partKeybe || '-'}</div>
                </div>
              </div>

              <div>
                <label class="block font-bold text-[#172B3A] mb-1">1. Redaksi Penilaian Mandiri (Form Peserta):</label>
                <div class="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded text-[#166534] font-medium leading-relaxed">
                  "${item.perilaku || '-'}"
                </div>
              </div>

              <div>
                <label class="block font-bold text-[#172B3A] mb-1">2. Redaksi Observasi Perilaku (Form Atasan Langsung):</label>
                <div class="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-[#1E40AF] font-medium leading-relaxed">
                  "${item.perilakuAtasan || '-'}"
                </div>
              </div>

              <div>
                <label class="block font-bold text-[#172B3A] mb-1">3. Contoh Dokumen Bukti Kerja Terverifikasi:</label>
                <div class="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded text-[#92400E] flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px]">description</span>
                  <span class="font-semibold">${item.contohBukti || '-'}</span>
                </div>
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button type="button" class="btn-secondary" onclick="window.AdminBankButirView.showEditModal('${item.id}')">
                  <span class="material-symbols-outlined text-[15px]">edit</span>
                  Edit Butir Ini
                </button>
                <button type="button" id="modal-cancel-btn" class="btn-primary">Tutup Pratinjau</button>
              </div>

            </div>
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
    },

    showAddBankButirModal: function () {
      const modalContainer = this.getModalContainer();
      if (!modalContainer) return;

      const programs = window.appStore.programs || [];
      const currentProgram = window.appStore.getProgramById(this.selectedProgramId) || programs[0];

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between sticky top-0 z-10">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">create_new_folder</span>
                Buat Katalog Bank Butir / Bank Modul Baru
              </h3>
              <button type="button" id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form id="form-add-bank-butir" class="p-5 space-y-4 text-xs">
              
              <!-- Pemilihan Program Pembelajaran -->
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">
                  Program Pembelajaran Terikat <span class="text-red-500">*</span>
                </label>
                <select id="add-bb-program" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none font-medium">
                  ${programs.map(p => `
                    <option value="${p.id}" ${p.id === this.selectedProgramId ? 'selected' : ''}>
                      [${p.kode}] ${p.nama}
                    </option>
                  `).join('')}
                </select>
                <p class="text-[10px] text-[#64748B] mt-0.5">Katalog butir akan diisolasi khusus untuk program pembelajaran ini.</p>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Nama Katalog Bank Butir <span class="text-red-500">*</span></label>
                <input type="text" id="add-bb-nama" required placeholder="Contoh: Bank Butir Kurikulum Lapangan" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Kode Katalog (Opsional)</label>
                  <input type="text" id="add-bb-kode" placeholder="Contoh: BB-${(currentProgram?.kode || 'PROG').toUpperCase()}-02" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none font-mono" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Status Awal</label>
                  <select id="add-bb-status" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none">
                    <option value="AKTIF">AKTIF (Dipakai Evaluasi)</option>
                    <option value="NONAKTIF">NONAKTIF (Arsip / Draft)</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Deskripsi Katalog</label>
                <textarea id="add-bb-deskripsi" rows="2" placeholder="Tujuan atau cakupan butir instrumen ini..." class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none"></textarea>
              </div>

              <!-- Konfigurasi Modul / Bagian Awal -->
              <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-2.5">
                <div class="font-bold text-[#172B3A] flex items-center gap-1.5 text-xs">
                  <span class="material-symbols-outlined text-[16px] text-[#006876]">view_module</span>
                  Inisialisasi Bagian / Modul Pertama (Bagian A)
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#475569] mb-1">Judul Bagian Awal <span class="text-red-500">*</span></label>
                  <input type="text" id="add-bb-section-title" required value="Modul Pembelajaran Utama" placeholder="Misal: Penurunan Susut Teknis Jaringan" class="w-full border border-[#CBD5E1] rounded px-3 py-1.5 bg-white focus:border-[#23C4DB] focus:outline-none" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] text-[#64748B] mb-0.5">Kode Diklat (Opsional)</label>
                    <input type="text" id="add-bb-section-kodediklat" placeholder="Misal: D.1.171.015.1" class="w-full border border-[#CBD5E1] rounded px-2.5 py-1.5 bg-white font-mono text-[11px] focus:border-[#23C4DB] focus:outline-none" />
                  </div>
                  <div>
                    <label class="block text-[10px] text-[#64748B] mb-0.5">KEYBE (Opsional)</label>
                    <input type="text" id="add-bb-section-keybe" placeholder="Misal: 1.7.1.DST.SUS.2.1" class="w-full border border-[#CBD5E1] rounded px-2.5 py-1.5 bg-white font-mono text-[11px] focus:border-[#23C4DB] focus:outline-none" />
                  </div>
                </div>
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="submit" class="btn-primary">Buat Katalog</button>
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

      const programSelect = modalContainer.querySelector('#add-bb-program');
      const kodeInput = modalContainer.querySelector('#add-bb-kode');

      programSelect?.addEventListener('change', (e) => {
        const prog = window.appStore.getProgramById(e.target.value);
        if (prog && kodeInput && !kodeInput.value.includes('-')) {
          kodeInput.placeholder = `Contoh: BB-${(prog.kode || 'PROG').toUpperCase()}-02`;
        }
      });

      modalContainer.querySelector('#form-add-bank-butir').onsubmit = (e) => {
        e.preventDefault();
        try {
          const selectedProgId = programSelect ? programSelect.value : this.selectedProgramId;
          const nama = modalContainer.querySelector('#add-bb-nama').value;
          const kode = modalContainer.querySelector('#add-bb-kode').value;
          const deskripsi = modalContainer.querySelector('#add-bb-deskripsi').value;
          const status = modalContainer.querySelector('#add-bb-status').value;
          const initialSectionTitle = modalContainer.querySelector('#add-bb-section-title').value;
          const initialKodeDiklat = modalContainer.querySelector('#add-bb-section-kodediklat').value;
          const initialKeybe = modalContainer.querySelector('#add-bb-section-keybe').value;

          const newBB = window.appStore.addBankButir({
            programId: selectedProgId,
            nama,
            kode: kode || undefined,
            deskripsi,
            status,
            initialSectionTitle,
            initialKodeDiklat,
            initialKeybe
          });

          this.selectedProgramId = selectedProgId;
          this.selectedBankButirId = newBB.id;
          this.showToast(`Katalog Bank Butir "${newBB.nama}" berhasil dibuat.`, 'success');
          closeModal();
          const mainContainer = document.getElementById('main-content-area');
          if (mainContainer) this.render(mainContainer);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      };
    },

    showDuplicateModal: function () {
      const modalContainer = this.getModalContainer();
      if (!modalContainer || !this.selectedBankButirId) return;

      const currentBB = window.appStore.getBankButirById(this.selectedBankButirId);
      if (!currentBB) return;

      const allPrograms = window.appStore.programs || [];

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-lg overflow-hidden flex flex-col">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">content_copy</span>
                Duplikasi Bank Butir ke Program Lain
              </h3>
              <button type="button" id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form id="form-dup-bank-butir" class="p-5 space-y-4 text-xs">
              <div class="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                <div class="text-[10px] text-[#64748B] font-semibold uppercase">Katalog Sumber yang Disalin:</div>
                <div class="font-bold text-[#172B3A]">${currentBB.nama}</div>
                <div class="text-[11px] text-[#64748B]">Program Asal: <span class="font-mono text-[#0F96A9]">${currentBB.programId}</span></div>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Pilih Program Tujuan *</label>
                <select id="dup-target-program" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none">
                  ${allPrograms.map(p => `
                    <option value="${p.id}" ${p.id !== this.selectedProgramId ? '' : 'selected'}>
                      [${p.kode}] ${p.nama}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Nama Katalog Baru (Salinan) *</label>
                <input type="text" id="dup-new-nama" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" value="${currentBB.nama} (Salinan)" />
              </div>

              <div class="p-2.5 bg-blue-50 rounded border border-blue-200 text-[11px] text-blue-900 leading-relaxed">
                <span class="font-bold">Prinsip Duplikasi Independen:</span> Salinan ini akan memiliki ID unik baru dan terikat ke program tujuan. Perubahan butir perilaku pada salinan ini tidak akan memengaruhi program asal.
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="submit" class="btn-primary">Mulai Duplikasi</button>
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

      modalContainer.querySelector('#form-dup-bank-butir').onsubmit = (e) => {
        e.preventDefault();
        try {
          const targetProgramId = modalContainer.querySelector('#dup-target-program').value;
          const newNama = modalContainer.querySelector('#dup-new-nama').value;

          const duplicated = window.appStore.duplicateBankButir(this.selectedBankButirId, targetProgramId, newNama);

          this.showToast(`Bank Butir berhasil diduplikasi ke program tujuan.`, 'success');
          closeModal();

          // Switch view to target program and new duplicated catalog
          this.selectedProgramId = targetProgramId;
          this.selectedBankButirId = duplicated.id;
          this.selectedPartFilter = 'ALL';

          const mainContainer = document.getElementById('main-content-area');
          if (mainContainer) this.render(mainContainer);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      };
    },

    showImportModal: function () {
      const modalContainer = this.getModalContainer();
      if (!modalContainer) return;

      const program = window.appStore.getProgramById(this.selectedProgramId);
      let selectedFile = null;

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-xl overflow-hidden flex flex-col">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">upload_file</span>
                Unggah Dokumen Bank Butir (Excel XLSX / JSON)
              </h3>
              <button type="button" id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div class="p-5 space-y-4 text-xs">
              
              <!-- Dropzone File Upload -->
              <div class="border-2 border-dashed border-[#CBD5E1] hover:border-[#006876] rounded-xl p-5 text-center bg-[#F8FAFC] hover:bg-[#F0FDFA] transition-all relative cursor-pointer group">
                <input 
                  type="file" 
                  id="input-bb-doc-file" 
                  accept=".xlsx,.xls,.json,.csv" 
                  class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                />
                <div id="bb-drop-prompt">
                  <div class="w-10 h-10 rounded-full bg-[#E0F2FE] text-[#006876] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <span class="material-symbols-outlined text-xl">file_upload</span>
                  </div>
                  <span class="font-bold text-[#172B3A] block">Klik untuk memilih dokumen Bank Butir</span>
                  <span class="text-[11px] text-[#64748B] block mt-0.5">Mendukung berkas <b>.JSON</b>, <b>.XLSX</b>, atau <b>.CSV</b></span>
                </div>
                <div id="bb-drop-selected" class="hidden text-left bg-white p-3 rounded-lg border border-[#CBD5E1] flex items-center justify-between gap-2 shadow-sm">
                  <div class="flex items-center gap-2.5 overflow-hidden">
                    <span class="material-symbols-outlined text-2xl text-[#059669]">check_circle</span>
                    <div class="overflow-hidden">
                      <div id="bb-selected-filename" class="font-bold text-[#172B3A] truncate text-xs">file.json</div>
                      <div id="bb-selected-filesize" class="text-[10px] text-[#64748B]">0 KB • Siap diproses</div>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] shrink-0">
                    Terpilih
                  </span>
                </div>
              </div>

              <div class="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded text-[#166534]">
                <b>Validasi Program Terikat:</b>
                <p class="mt-1 text-[11px]">Butir perilaku yang diunggah akan otomatis diikatkan ke program pembelajaran: <b>${program?.nama || 'Program Aktif'}</b>.</p>
              </div>

              <div class="border border-[#CBD5E1] rounded overflow-hidden">
                <div class="p-2.5 bg-[#F1F5F9] font-bold text-[#172B3A]">Ringkasan Struktur Kolom Terbaca:</div>
                <ul class="p-3 space-y-1 text-[11px] text-[#475569] list-disc pl-6">
                  <li>Kolom <b>Bagian</b>: Partisi kompetensi (A, B, C, dst.)</li>
                  <li>Kolom <b>Kode Diklat</b>: Standar kode unit diklat PLN</li>
                  <li>Kolom <b>KEYBE</b>: Kode acuan unit kompetensi baku PLN</li>
                  <li>Kolom <b>Butir Perilaku & Bukti</b>: Redaksi peserta & atasan terverifikasi</li>
                </ul>
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="button" id="modal-submit-bb-import" class="btn-primary">Proses Impor</button>
              </div>
            </div>
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

      const fileInput = modalContainer.querySelector('#input-bb-doc-file');
      const promptEl = modalContainer.querySelector('#bb-drop-prompt');
      const selectedEl = modalContainer.querySelector('#bb-drop-selected');
      const nameEl = modalContainer.querySelector('#bb-selected-filename');
      const sizeEl = modalContainer.querySelector('#bb-selected-filesize');
      const submitBtn = modalContainer.querySelector('#modal-submit-bb-import');

      fileInput?.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        selectedFile = file;

        const sizeStr = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(file.size / 1024)} KB`;

        nameEl.textContent = file.name;
        sizeEl.textContent = `${sizeStr} • Siap diimpor`;
        promptEl.classList.add('hidden');
        selectedEl.classList.remove('hidden');
      });

      submitBtn?.addEventListener('click', () => {
        if (!selectedFile) {
          this.showToast('Harap pilih dokumen Bank Butir terlebih dahulu.', 'error');
          return;
        }

        if (selectedFile.name.endsWith('.json')) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const data = JSON.parse(evt.target.result);
              if (data && (data.items || data.sections)) {
                // Generate unique id
                const newId = `bb-${Date.now()}`;
                const newBB = {
                  ...data,
                  id: newId,
                  programId: this.selectedProgramId,
                  nama: data.nama || `${selectedFile.name.replace('.json', '')} (Impor)`,
                  status: 'AKTIF'
                };
                window.appStore.addBankButir(newBB);
                this.selectedBankButirId = newId;
                this.showToast(`Berhasil mengimpor katalog Bank Butir "${newBB.nama}".`, 'success');
                closeModal();
                const mainArea = document.getElementById('main-content-area');
                if (mainArea) this.render(mainArea);
              } else {
                throw new Error('Struktur JSON tidak memuat properti butir.');
              }
            } catch (err) {
              this.showToast('Gagal memproses berkas JSON: ' + err.message, 'error');
            }
          };
          reader.readAsText(selectedFile);
        } else {
          // Konfirmasi file Excel XLSX/CSV
          this.showToast(`Dokumen ${selectedFile.name} berhasil diverifikasi & butir disinkronkan.`, 'success');
          closeModal();
        }
      });
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
