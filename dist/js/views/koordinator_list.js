/**
 * View: Data Koordinator (Internal Unit & Eksternal UPDL)
 * Menampilkan daftar seluruh Koordinator Pembelajaran dengan kapabilitas CRUD lengkap
 */

(function () {
  window.KoordinatorListView = {
    searchTerm: '',
    selectedTypeFilter: 'ALL',
    selectedStatusFilter: 'ALL',
    selectedOrgFilter: 'ALL',

    render: function (container) {
      if (!container) return;

      const allUsers = window.appStore.getUsers() || [];
      const koordinators = allUsers.filter(u => 
        u.role === 'koordinator' || 
        u.role === 'koordinator_internal' || 
        u.role === 'koordinator_eksternal'
      );
      const units = window.appStore.getUnits ? window.appStore.getUnits(null, true) : [];
      const updls = window.appStore.getUpdls ? window.appStore.getUpdls() : [];

      // Filter
      let filtered = koordinators;
      if (this.selectedTypeFilter !== 'ALL') {
        if (this.selectedTypeFilter === 'koordinator_internal') {
          filtered = filtered.filter(k => k.role === 'koordinator_internal' || (k.role === 'koordinator' && !k.updlId));
        } else if (this.selectedTypeFilter === 'koordinator_eksternal') {
          filtered = filtered.filter(k => k.role === 'koordinator_eksternal' || (k.role === 'koordinator' && k.updlId));
        }
      }
      if (this.selectedStatusFilter !== 'ALL') {
        filtered = filtered.filter(k => k.status === this.selectedStatusFilter);
      }
      if (this.selectedOrgFilter !== 'ALL') {
        filtered = filtered.filter(k => {
          return k.unitId === this.selectedOrgFilter || 
                 k.unitName === this.selectedOrgFilter || 
                 k.updlId === this.selectedOrgFilter ||
                 k.updlName === this.selectedOrgFilter;
        });
      }
      if (this.searchTerm) {
        const q = this.searchTerm.toLowerCase().trim();
        filtered = filtered.filter(k => {
          const hay = `${k.nama || ''} ${k.nip || ''} ${k.jabatan || ''} ${k.unitName || ''} ${k.updlName || ''} ${k.email || ''}`.toLowerCase();
          return hay.includes(q);
        });
      }

      // Metrik
      const activeCount = koordinators.filter(k => k.status === 'AKTIF').length;
      const internalCount = koordinators.filter(k => k.role === 'koordinator_internal' || (k.role === 'koordinator' && !k.updlId)).length;
      const eksternalCount = koordinators.filter(k => k.role === 'koordinator_eksternal' || (k.role === 'koordinator' && k.updlId)).length;

      container.innerHTML = `
        <div class="flex flex-col gap-6 animate-fadeIn">
          
          <!-- Header -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col gap-1 max-w-3xl">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                  PLN Corporate University
                </span>
                <span class="text-xs text-[#64748B] font-mono">Modul Manajemen Koordinator</span>
              </div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">
                Data Koordinator
              </h1>
              <p class="text-xs md:text-sm text-[#64748B] leading-relaxed">
                Kelola akun Koordinator Pembelajaran Internal (Unit Kerja PLN) dan Koordinator Eksternal (Penyelenggara UPDL), pemantauan evaluasi, serta pengelolaan hak akses sistem.
              </p>
            </div>

            <!-- Toolbar Action -->
            <div class="flex flex-wrap items-center gap-2">
              <button id="btn-add-koordinator" class="btn-primary">
                <span class="material-symbols-outlined text-[16px]">person_add</span>
                <span>+ Tambah Koordinator</span>
              </button>
            </div>
          </div>

          <!-- Metrik Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Koordinator</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#172B3A]">${koordinators.length}</span>
                <span class="text-[11px] font-medium text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">${activeCount} Aktif</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Koord. Internal (Unit)</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#4338CA]">${internalCount}</span>
                <span class="text-[11px] font-medium text-[#4338CA] bg-[#EEF2FF] px-2 py-0.5 rounded-full">Unit Kerja</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Koord. Eksternal (UPDL)</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#0D9488]">${eksternalCount}</span>
                <span class="text-[11px] font-medium text-[#0D9488] bg-[#F0FDFA] px-2 py-0.5 rounded-full">Penyelenggara</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Tingkat Keaktifan</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#172B3A]">${koordinators.length ? Math.round((activeCount / koordinators.length) * 100) : 0}%</span>
                <span class="text-[11px] font-medium text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">${koordinators.length - activeCount} Nonaktif</span>
              </div>
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="card p-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <!-- Search -->
              <div>
                <label class="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Pencarian</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[18px]">search</span>
                  <input type="text" id="koordinator-search-input" value="${this.escapeHtml(this.searchTerm)}"
                    placeholder="Cari NIP, nama, email..."
                    class="input-field pl-9 w-full text-xs" />
                </div>
              </div>

              <!-- Tipe Filter -->
              <div>
                <label class="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Tipe Koordinator</label>
                <select id="koordinator-type-filter" class="input-field w-full text-xs">
                  <option value="ALL" ${this.selectedTypeFilter === 'ALL' ? 'selected' : ''}>Semua Tipe (${koordinators.length})</option>
                  <option value="koordinator_internal" ${this.selectedTypeFilter === 'koordinator_internal' ? 'selected' : ''}>Internal (Unit Kerja) (${internalCount})</option>
                  <option value="koordinator_eksternal" ${this.selectedTypeFilter === 'koordinator_eksternal' ? 'selected' : ''}>Eksternal (UPDL) (${eksternalCount})</option>
                </select>
              </div>

              <!-- Status Filter -->
              <div>
                <label class="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Status Akun</label>
                <select id="koordinator-status-filter" class="input-field w-full text-xs">
                  <option value="ALL" ${this.selectedStatusFilter === 'ALL' ? 'selected' : ''}>Semua Status</option>
                  <option value="AKTIF" ${this.selectedStatusFilter === 'AKTIF' ? 'selected' : ''}>AKTIF</option>
                  <option value="NONAKTIF" ${this.selectedStatusFilter === 'NONAKTIF' ? 'selected' : ''}>NONAKTIF</option>
                </select>
              </div>

              <!-- Reset / Clear -->
              <div class="flex items-end">
                <button id="koordinator-btn-reset-filter" class="btn-secondary w-full text-xs h-[38px] justify-center">
                  <span class="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>Reset Filter</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Table Card -->
          <div class="card overflow-hidden">
            <div class="p-4 border-b border-[#CBD5E1] flex items-center justify-between bg-[#F8FAFC]">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-[#172B3A]">Daftar Koordinator Pembelajaran</span>
                <span class="text-xs bg-[#E2E8F0] text-[#475569] font-medium px-2 py-0.5 rounded-full">
                  ${filtered.length} dari ${koordinators.length}
                </span>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-[#E2E8F0] bg-[#F1F5F9]/50 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th class="py-3 px-4 w-12 text-center">No</th>
                    <th class="py-3 px-4">Koordinator</th>
                    <th class="py-3 px-4">Tipe Koordinator</th>
                    <th class="py-3 px-4">Instansi / Naungan</th>
                    <th class="py-3 px-4">Jabatan</th>
                    <th class="py-3 px-4">Kontak & Akun</th>
                    <th class="py-3 px-4 text-center">Status</th>
                    <th class="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0] text-xs">
                  ${filtered.length === 0 ? `
                    <tr>
                      <td colspan="8" class="text-center py-12 text-[#94A3B8]">
                        <span class="material-symbols-outlined text-4xl mb-2 text-[#CBD5E1] block">manage_accounts</span>
                        <p class="font-medium">Tidak ada data Koordinator yang cocok dengan kriteria filter.</p>
                      </td>
                    </tr>
                  ` : filtered.map((k, idx) => {
                    const isInternal = k.role === 'koordinator_internal' || (k.role === 'koordinator' && !k.updlId);
                    const instansiName = isInternal ? (k.unitName || '-') : (k.updlName || 'UPDL Terkait');
                    return `
                      <tr class="hover:bg-[#F8FAFC] transition-colors">
                        <td class="py-3 px-4 text-center text-[#64748B] font-mono">${idx + 1}</td>
                        <td class="py-3 px-4">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0369A1] font-bold flex items-center justify-center text-xs flex-shrink-0">
                              ${(k.nama || 'K').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div class="font-bold text-[#172B3A]">${this.escapeHtml(k.nama || '-')}</div>
                              <div class="text-[11px] text-[#64748B] font-mono">NIP: ${this.escapeHtml(k.nip || '-')}</div>
                            </div>
                          </div>
                        </td>
                        <td class="py-3 px-4">
                          ${isInternal ? `
                            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                              <span class="material-symbols-outlined text-[13px]">domain</span>
                              Internal Unit
                            </span>
                          ` : `
                            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4]">
                              <span class="material-symbols-outlined text-[13px]">school</span>
                              Eksternal UPDL
                            </span>
                          `}
                        </td>
                        <td class="py-3 px-4">
                          <div class="font-medium text-[#172B3A]">${this.escapeHtml(instansiName)}</div>
                          <div class="text-[10px] text-[#94A3B8]">${isInternal ? 'Unit Kerja Mandiri' : 'Penyelenggara Pembelajaran'}</div>
                        </td>
                        <td class="py-3 px-4 text-[#334155]">
                          ${this.escapeHtml(k.jabatan || 'Koordinator Pembelajaran')}
                        </td>
                        <td class="py-3 px-4">
                          <div class="text-[#334155] font-medium">${this.escapeHtml(k.email || '-')}</div>
                          <div class="text-[11px] text-[#94A3B8]">Username: ${this.escapeHtml(k.username || k.nip || '-')}</div>
                        </td>
                        <td class="py-3 px-4 text-center">
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            k.status === 'AKTIF' 
                              ? 'bg-[#ECFDF5] text-[#059669]' 
                              : 'bg-[#FEF2F2] text-[#DC2626]'
                          }">
                            ${k.status || 'AKTIF'}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-center">
                          <div class="flex items-center justify-center gap-1">
                            <button class="p-1 text-[#64748B] hover:text-[#006876] hover:bg-[#F1F5F9] rounded transition-colors btn-edit-koordinator" 
                              data-id="${k.id}" title="Edit Data Koordinator">
                              <span class="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button class="p-1 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded transition-colors btn-delete-koordinator" 
                              data-id="${k.id}" data-name="${this.escapeHtml(k.nama)}" title="Hapus Koordinator">
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

        </div>

        <!-- Modal Container -->
        <div id="koordinator-modal-container"></div>
      `;

      this.bindEvents(container);
    },

    bindEvents: function (container) {
      const self = this;

      // Search
      const searchInput = container.querySelector('#koordinator-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', function (e) {
          self.searchTerm = e.target.value;
          self.render(container);
        });
      }

      // Type Filter
      const typeFilter = container.querySelector('#koordinator-type-filter');
      if (typeFilter) {
        typeFilter.addEventListener('change', function (e) {
          self.selectedTypeFilter = e.target.value;
          self.render(container);
        });
      }

      // Status Filter
      const statusFilter = container.querySelector('#koordinator-status-filter');
      if (statusFilter) {
        statusFilter.addEventListener('change', function (e) {
          self.selectedStatusFilter = e.target.value;
          self.render(container);
        });
      }

      // Reset Filter
      const btnReset = container.querySelector('#koordinator-btn-reset-filter');
      if (btnReset) {
        btnReset.addEventListener('click', function () {
          self.searchTerm = '';
          self.selectedTypeFilter = 'ALL';
          self.selectedStatusFilter = 'ALL';
          self.render(container);
        });
      }

      // Add Button
      const btnAdd = container.querySelector('#btn-add-koordinator');
      if (btnAdd) {
        btnAdd.addEventListener('click', function () {
          self.showFormModal(container, null);
        });
      }

      // Edit Button
      container.querySelectorAll('.btn-edit-koordinator').forEach(btn => {
        btn.addEventListener('click', function () {
          const id = this.getAttribute('data-id');
          const user = window.appStore.getUserById(id);
          if (user) {
            self.showFormModal(container, user);
          }
        });
      });

      // Delete Button
      container.querySelectorAll('.btn-delete-koordinator').forEach(btn => {
        btn.addEventListener('click', function () {
          const id = this.getAttribute('data-id');
          const name = this.getAttribute('data-name');
          self.confirmDelete(container, id, name);
        });
      });
    },

    showFormModal: function (container, koordinatorData) {
      const self = this;
      const isEdit = !!koordinatorData;
      const modalContainer = container.querySelector('#koordinator-modal-container');
      if (!modalContainer) return;

      const units = window.appStore.getUnits ? window.appStore.getUnits(null, true) : [];
      const updls = window.appStore.getUpdls ? window.appStore.getUpdls() : [];

      const currentRole = isEdit ? koordinatorData.role : 'koordinator_internal';
      const isInternal = currentRole === 'koordinator_internal' || (currentRole === 'koordinator' && !koordinatorData.updlId);

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#CBD5E1] animate-scaleUp">
            
            <div class="px-6 py-4 bg-[#F8FAFC] border-b border-[#CBD5E1] flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#006876] text-xl">
                  ${isEdit ? 'edit_note' : 'person_add'}
                </span>
                <h3 class="font-bold text-[#172B3A] text-base">
                  ${isEdit ? 'Edit Data Koordinator' : 'Tambah Koordinator Baru'}
                </h3>
              </div>
              <button id="modal-koordinator-close" class="text-[#64748B] hover:text-[#172B3A] rounded-lg p-1 hover:bg-[#E2E8F0] transition-colors">
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form id="form-koordinator" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <!-- NIP & Nama -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-[#172B3A] mb-1">NIP Koordinator *</label>
                  <input type="text" id="k-nip" required value="${this.escapeHtml(isEdit ? koordinatorData.nip : '')}"
                    placeholder="Contoh: 8812345Z"
                    class="input-field w-full text-xs font-mono" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#172B3A] mb-1">Nama Lengkap *</label>
                  <input type="text" id="k-nama" required value="${this.escapeHtml(isEdit ? koordinatorData.nama : '')}"
                    placeholder="Nama beserta gelar"
                    class="input-field w-full text-xs" />
                </div>
              </div>

              <!-- Tipe Koordinator -->
              <div>
                <label class="block text-xs font-semibold text-[#172B3A] mb-1">Tipe Koordinator *</label>
                <div class="grid grid-cols-2 gap-3">
                  <label class="flex items-center gap-2 p-2.5 rounded-lg border border-[#CBD5E1] cursor-pointer hover:bg-[#F8FAFC]">
                    <input type="radio" name="k-role-type" value="koordinator_internal" ${isInternal ? 'checked' : ''} class="text-[#006876]" />
                    <div>
                      <div class="text-xs font-bold text-[#172B3A]">Internal Unit</div>
                      <div class="text-[10px] text-[#64748B]">Unit Kerja PLN</div>
                    </div>
                  </label>
                  <label class="flex items-center gap-2 p-2.5 rounded-lg border border-[#CBD5E1] cursor-pointer hover:bg-[#F8FAFC]">
                    <input type="radio" name="k-role-type" value="koordinator_eksternal" ${!isInternal ? 'checked' : ''} class="text-[#006876]" />
                    <div>
                      <div class="text-xs font-bold text-[#172B3A]">Eksternal UPDL</div>
                      <div class="text-[10px] text-[#64748B]">Penyelenggara Pembelajaran</div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Instansi Selection: Unit or UPDL -->
              <div id="group-unit-select" class="${isInternal ? '' : 'hidden'}">
                <label class="block text-xs font-semibold text-[#172B3A] mb-1">Unit Kerja Mandiri *</label>
                <select id="k-unit" class="input-field w-full text-xs">
                  <option value="">-- Pilih Unit Kerja --</option>
                  ${units.map(u => `
                    <option value="${u.id}" data-name="${this.escapeHtml(u.nama)}" 
                      ${isEdit && (koordinatorData.unitId === u.id || koordinatorData.unitName === u.nama) ? 'selected' : ''}>
                      ${this.escapeHtml(u.nama)} (${this.escapeHtml(u.kode || '')})
                    </option>
                  `).join('')}
                </select>
                <p class="text-[10px] text-[#64748B] mt-1">Data unit kerja independen yang dikelola terpisah dari UPDL.</p>
              </div>

              <div id="group-updl-select" class="${!isInternal ? '' : 'hidden'}">
                <label class="block text-xs font-semibold text-[#172B3A] mb-1">UPDL Penyelenggara *</label>
                <select id="k-updl" class="input-field w-full text-xs">
                  <option value="">-- Pilih UPDL Penyelenggara --</option>
                  ${updls.map(up => `
                    <option value="${up.id}" data-name="${this.escapeHtml(up.nama)}" 
                      ${isEdit && (koordinatorData.updlId === up.id || koordinatorData.updlName === up.nama) ? 'selected' : ''}>
                      ${this.escapeHtml(up.nama)} (${this.escapeHtml(up.singkatan || '')})
                    </option>
                  `).join('')}
                </select>
                <p class="text-[10px] text-[#64748B] mt-1">Koordinator penyelenggara di bawah naungan UPDL Corpu.</p>
              </div>

              <!-- Jabatan -->
              <div>
                <label class="block text-xs font-semibold text-[#172B3A] mb-1">Jabatan *</label>
                <input type="text" id="k-jabatan" required value="${this.escapeHtml(isEdit ? (koordinatorData.jabatan || '') : '')}"
                  placeholder="Contoh: Assistant Analyst Pembelajaran / Koordinator Penyelenggara"
                  class="input-field w-full text-xs" />
              </div>

              <!-- Email & Password -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-[#172B3A] mb-1">Email PLN *</label>
                  <input type="email" id="k-email" required value="${this.escapeHtml(isEdit ? (koordinatorData.email || '') : '')}"
                    placeholder="nama@pln.co.id"
                    class="input-field w-full text-xs" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#172B3A] mb-1">
                    ${isEdit ? 'Ubah Password (Kosongkan jika tetap)' : 'Password Awal *'}
                  </label>
                  <input type="password" id="k-password" ${isEdit ? '' : 'required'}
                    placeholder="Minimal 6 karakter"
                    class="input-field w-full text-xs" />
                </div>
              </div>

              <!-- Status -->
              <div>
                <label class="block text-xs font-semibold text-[#172B3A] mb-1">Status Akun *</label>
                <select id="k-status" class="input-field w-full text-xs">
                  <option value="AKTIF" ${isEdit && koordinatorData.status === 'AKTIF' ? 'selected' : ''}>AKTIF</option>
                  <option value="NONAKTIF" ${isEdit && koordinatorData.status === 'NONAKTIF' ? 'selected' : ''}>NONAKTIF</option>
                </select>
              </div>

              <!-- Action Buttons -->
              <div class="pt-4 border-t border-[#CBD5E1] flex items-center justify-end gap-2">
                <button type="button" id="modal-koordinator-cancel" class="btn-secondary">
                  Batal
                </button>
                <button type="submit" class="btn-primary" id="btn-save-koordinator">
                  <span class="material-symbols-outlined text-[16px]">save</span>
                  <span>${isEdit ? 'Simpan Perubahan' : 'Tambah Koordinator'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      `;

      // Event radio toggle unit vs updl
      const radioTypes = modalContainer.querySelectorAll('input[name="k-role-type"]');
      const groupUnit = modalContainer.querySelector('#group-unit-select');
      const groupUpdl = modalContainer.querySelector('#group-updl-select');

      radioTypes.forEach(r => {
        r.addEventListener('change', function () {
          if (this.value === 'koordinator_internal') {
            groupUnit.classList.remove('hidden');
            groupUpdl.classList.add('hidden');
          } else {
            groupUnit.classList.add('hidden');
            groupUpdl.classList.remove('hidden');
          }
        });
      });

      // Close modal
      const closeModal = () => {
        modalContainer.innerHTML = '';
      };

      const btnClose = modalContainer.querySelector('#modal-koordinator-close');
      const btnCancel = modalContainer.querySelector('#modal-koordinator-cancel');
      if (btnClose) btnClose.addEventListener('click', closeModal);
      if (btnCancel) btnCancel.addEventListener('click', closeModal);

      // Submit
      const form = modalContainer.querySelector('#form-koordinator');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();

          const nip = modalContainer.querySelector('#k-nip').value.trim();
          const nama = modalContainer.querySelector('#k-nama').value.trim();
          const selectedType = modalContainer.querySelector('input[name="k-role-type"]:checked').value;
          const jabatan = modalContainer.querySelector('#k-jabatan').value.trim();
          const email = modalContainer.querySelector('#k-email').value.trim();
          const password = modalContainer.querySelector('#k-password').value;
          const status = modalContainer.querySelector('#k-status').value;

          let unitId = null;
          let unitName = '';
          let updlId = null;
          let updlName = '';

          if (selectedType === 'koordinator_internal') {
            const unitSelect = modalContainer.querySelector('#k-unit');
            unitId = unitSelect.value || null;
            const opt = unitSelect.options[unitSelect.selectedIndex];
            unitName = opt ? (opt.getAttribute('data-name') || opt.text) : '';
          } else {
            const updlSelect = modalContainer.querySelector('#k-updl');
            updlId = updlSelect.value || null;
            const opt = updlSelect.options[updlSelect.selectedIndex];
            updlName = opt ? (opt.getAttribute('data-name') || opt.text) : '';
          }

          if (isEdit) {
            const payload = {
              nip,
              nama,
              role: selectedType,
              jabatan,
              email,
              status,
              unitId,
              unitName,
              updlId,
              updlName
            };
            if (password) {
              payload.password = password;
            }
            window.appStore.updateUser(koordinatorData.id, payload);
          } else {
            const payload = {
              nip,
              nama,
              username: nip,
              role: selectedType,
              jabatan,
              email,
              password: password || '123456',
              status,
              unitId,
              unitName,
              updlId,
              updlName
            };
            window.appStore.addUser(payload);
          }

          closeModal();
          self.render(container);
        });
      }
    },

    confirmDelete: function (container, id, name) {
      const self = this;
      const modalContainer = container.querySelector('#koordinator-modal-container');
      if (!modalContainer) return;

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-[#CBD5E1] p-6 text-center animate-scaleUp">
            <div class="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
              <span class="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 class="font-bold text-[#172B3A] text-base mb-1">Hapus Akun Koordinator?</h3>
            <p class="text-xs text-[#64748B] mb-5">
              Apakah Anda yakin ingin menghapus akun Koordinator <strong>"${this.escapeHtml(name)}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div class="flex items-center justify-center gap-2">
              <button id="modal-delete-cancel" class="btn-secondary w-full justify-center">Batal</button>
              <button id="modal-delete-confirm" class="btn-primary w-full justify-center bg-[#DC2626] hover:bg-[#B91C1C] border-[#DC2626]">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      `;

      const closeModal = () => { modalContainer.innerHTML = ''; };
      modalContainer.querySelector('#modal-delete-cancel').addEventListener('click', closeModal);
      modalContainer.querySelector('#modal-delete-confirm').addEventListener('click', () => {
        window.appStore.deleteUser(id);
        closeModal();
        self.render(container);
      });
    },

    escapeHtml: function (str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };
})();
