/**
 * View: Manajemen Master Organisasi
 * Evaluasi Level 3 — PLN Impact Lab (PIL)
 * Pengelolaan Master UPDL (Penyelenggara Diklat) dan Master Unit Kerja (Tempat Bertugas)
 * Catatan: Data Unit Kerja berdiri mandiri dan terpisah dari UPDL.
 */

(function () {
  window.AdminOrganisasiView = {
    activeTab: 'updl', // 'updl' | 'unit'
    unitSearchTerm: '',
    selectedUnitStatusFilter: 'ALL',

    render: function (container) {
      const updls = window.appStore.getUpdls();
      const units = window.appStore.getUnits();

      // Metrics calculation
      const activeUpdlCount = updls.filter(u => u.status === 'AKTIF').length;
      const activeUnitCount = units.filter(u => u.status === 'AKTIF').length;

      container.innerHTML = `
        <div class="flex flex-col gap-6 animate-fadeIn">
          
          <!-- Page Header -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col gap-1 max-w-3xl">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                  Evaluasi Level 3 — PLN Impact Lab (PIL)
                </span>
                <span class="text-xs text-[#64748B] font-mono">Modul Master Administrator</span>
              </div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">
                Master Organisasi (UPDL & Unit Kerja)
              </h1>
              <p class="text-xs md:text-sm text-[#64748B] leading-relaxed">
                Kelola data Master UPDL (Unit Pelaksana Pendidikan dan Pelatihan Penyelenggara Diklat) dan Master Unit Kerja (Unit Kerja Peserta) secara terpisah dan independen.
              </p>
            </div>

            <!-- Toolbar Actions -->
            <div class="flex flex-wrap items-center gap-2">
              <button id="btn-org-add-primary" class="btn-primary">
                <span class="material-symbols-outlined text-[16px]">add_circle</span>
                <span id="txt-org-add-btn">${this.activeTab === 'unit' ? '+ Tambah Unit' : '+ Tambah UPDL'}</span>
              </button>
            </div>
          </div>

          <!-- Top Metric Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total UPDL Terdaftar</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#172B3A]">${updls.length}</span>
                <span class="text-[11px] font-medium text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">${activeUpdlCount} Aktif</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Unit Kerja</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#172B3A]">${units.length}</span>
                <span class="text-[11px] font-medium text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">${activeUnitCount} Aktif</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Wilayah Cakupan</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#006876]">Nasional</span>
                <span class="text-[11px] font-medium text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full">Seluruh Indonesia</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Struktur Organisasi</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#059669]">Terpisah</span>
                <span class="text-[11px] font-medium text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">Mandiri</span>
              </div>
            </div>
          </div>

          <!-- Tab Navigation -->
          <div class="flex border-b border-[#E2E8F0] gap-2">
            <button class="tab-btn px-4 py-2.5 font-medium text-xs md:text-sm transition-all border-b-2 flex items-center gap-1.5 ${this.activeTab === 'updl' ? 'border-[#23C4DB] text-[#0F96A9] font-bold' : 'border-transparent text-[#64748B] hover:text-[#172B3A]'}" data-tab="updl">
              <span class="material-symbols-outlined text-[18px]">account_balance</span>
              Master UPDL (${updls.length})
            </button>
            <button class="tab-btn px-4 py-2.5 font-medium text-xs md:text-sm transition-all border-b-2 flex items-center gap-1.5 ${this.activeTab === 'unit' ? 'border-[#23C4DB] text-[#0F96A9] font-bold' : 'border-transparent text-[#64748B] hover:text-[#172B3A]'}" data-tab="unit">
              <span class="material-symbols-outlined text-[18px]">domain</span>
              Master Unit Kerja (${units.length})
            </button>
          </div>

          <!-- Dynamic Tab Content -->
          <div id="org-tab-content">
            ${this.renderActiveTabContent()}
          </div>

        </div>

        <!-- Generic Modal Container -->
        <div id="org-modal-container"></div>
      `;

      this.attachEventListeners(container);
    },

    renderActiveTabContent: function () {
      if (this.activeTab === 'unit') return this.renderUnitTable();
      return this.renderUpdlTable();
    },

    // === 1. Render UPDL Table ===
    renderUpdlTable: function () {
      const updls = window.appStore.getUpdls();

      return `
        <div class="card overflow-hidden">
          <div class="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F8FAFC]">
            <div class="text-xs font-semibold text-[#172B3A] uppercase tracking-wide">
              Daftar Master Unit Pelaksana Pendidikan dan Pelatihan (UPDL Penyelenggara)
            </div>
            <div class="text-xs text-[#64748B]">
              Menampilkan <b>${updls.length}</b> instansi UPDL terdaftar
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-[#F1F5F9] text-[#475569] font-semibold border-b border-[#CBD5E1]">
                  <th class="py-3 px-4 w-12 text-center">No</th>
                  <th class="py-3 px-4">Kode UPDL</th>
                  <th class="py-3 px-4">Nama UPDL</th>
                  <th class="py-3 px-4">Wilayah Operasional</th>
                  <th class="py-3 px-4">Alamat & Kontak</th>
                  <th class="py-3 px-4 text-center">Status</th>
                  <th class="py-3 px-4 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                ${updls.length === 0 ? `
                  <tr>
                    <td colspan="7" class="text-center py-8 text-[#94A3B8]">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[32px] text-[#CBD5E1]">account_balance</span>
                        <span>Belum ada master UPDL terdaftar di database. Klik <b>+ Tambah UPDL</b> untuk mendaftarkan.</span>
                      </div>
                    </td>
                  </tr>
                ` : updls.map((u, idx) => {
                  const isAktif = u.status === 'AKTIF';
                  return `
                    <tr class="hover:bg-[#F8FAFC] transition-colors">
                      <td class="py-3 px-4 text-center font-mono text-[#64748B]">${idx + 1}</td>
                      <td class="py-3 px-4 font-mono font-bold text-[#0F96A9]">${u.kode}</td>
                      <td class="py-3 px-4 font-semibold text-[#172B3A]">${u.nama}</td>
                      <td class="py-3 px-4 text-[#475569]">${u.wilayah || 'Indonesia'}</td>
                      <td class="py-3 px-4 text-[#64748B]">
                        <div>${u.alamat || '-'}</div>
                        <div class="text-[11px] text-[#94A3B8]">${u.telepon ? 'Telp: ' + u.telepon : ''}</div>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isAktif ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'}">
                          ${u.status}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <div class="inline-flex items-center gap-1">
                          <button class="btn-action-edit-updl p-1 hover:bg-[#E0F2FE] text-[#0284C7] rounded" data-id="${u.id}" title="Edit Data UPDL">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button class="btn-action-toggle-updl p-1 hover:bg-[#FEE2E2] ${isAktif ? 'text-[#DC2626]' : 'text-[#059669]'} rounded" data-id="${u.id}" title="${isAktif ? 'Nonaktifkan UPDL' : 'Aktifkan UPDL'}">
                            <span class="material-symbols-outlined text-[18px]">${isAktif ? 'toggle_on' : 'toggle_off'}</span>
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

    // === 2. Render Unit Table (Mandiri & Terpisah dari UPDL) ===
    renderUnitTable: function () {
      const units = window.appStore.getUnits();
      const searchTerm = (this.unitSearchTerm || '').toLowerCase().trim();
      const statusFilter = this.selectedUnitStatusFilter || 'ALL';

      let filteredUnits = units;
      if (statusFilter !== 'ALL') {
        filteredUnits = filteredUnits.filter(u => u.status === statusFilter);
      }
      if (searchTerm) {
        filteredUnits = filteredUnits.filter(u =>
          (u.nama && u.nama.toLowerCase().includes(searchTerm)) ||
          (u.kode && u.kode.toLowerCase().includes(searchTerm)) ||
          (u.kota && u.kota.toLowerCase().includes(searchTerm)) ||
          (u.induk && u.induk.toLowerCase().includes(searchTerm))
        );
      }

      return `
        <div class="card overflow-hidden">
          
          <!-- Toolbar Filter & Search Unit Kerja Mandiri -->
          <div class="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F8FAFC]">
            <div class="flex flex-wrap items-center gap-3">
              <div class="relative">
                <input type="text" id="search-unit-input" placeholder="Cari unit (nama/kode)..." value="${this.unitSearchTerm || ''}" class="text-xs border border-[#CBD5E1] rounded pl-8 pr-3 py-1.5 bg-white text-[#172B3A] focus:outline-none focus:border-[#23C4DB] w-48 sm:w-64" />
                <span class="material-symbols-outlined text-[16px] text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
              </div>
              <select id="filter-unit-status" class="text-xs border border-[#CBD5E1] rounded px-3 py-1.5 bg-white text-[#172B3A] focus:outline-none focus:border-[#23C4DB]">
                <option value="ALL" ${statusFilter === 'ALL' ? 'selected' : ''}>Semua Status (${units.length})</option>
                <option value="AKTIF" ${statusFilter === 'AKTIF' ? 'selected' : ''}>Status: AKTIF</option>
                <option value="NONAKTIF" ${statusFilter === 'NONAKTIF' ? 'selected' : ''}>Status: NONAKTIF</option>
              </select>
            </div>
            <div class="text-xs text-[#64748B]">
              Ditemukan <b>${filteredUnits.length}</b> Unit Kerja
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-[#F1F5F9] text-[#475569] font-semibold border-b border-[#CBD5E1]">
                  <th class="py-3 px-4 w-12 text-center">No</th>
                  <th class="py-3 px-4">Kode Unit</th>
                  <th class="py-3 px-4">Nama Unit Kerja</th>
                  <th class="py-3 px-4">Unit Induk / Wilayah</th>
                  <th class="py-3 px-4">Kota / Lokasi</th>
                  <th class="py-3 px-4 text-center">Status</th>
                  <th class="py-3 px-4 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                ${filteredUnits.length === 0 ? `
                  <tr>
                    <td colspan="7" class="text-center py-8 text-[#94A3B8]">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[32px] text-[#CBD5E1]">domain</span>
                        <span>Belum ada data unit kerja terdaftar. Klik <b>+ Tambah Unit</b> untuk menambahkan.</span>
                      </div>
                    </td>
                  </tr>
                ` : filteredUnits.map((un, idx) => {
                  const isAktif = un.status === 'AKTIF';
                  return `
                    <tr class="hover:bg-[#F8FAFC] transition-colors">
                      <td class="py-3 px-4 text-center font-mono text-[#64748B]">${idx + 1}</td>
                      <td class="py-3 px-4 font-mono font-bold text-[#0F96A9]">${un.kode}</td>
                      <td class="py-3 px-4 font-semibold text-[#172B3A]">${un.nama}</td>
                      <td class="py-3 px-4 text-[#475569]">${un.induk || '-'}</td>
                      <td class="py-3 px-4 text-[#64748B]">${un.kota || '-'}</td>
                      <td class="py-3 px-4 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isAktif ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'}">
                          ${un.status}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <div class="inline-flex items-center gap-1">
                          <button class="btn-action-edit-unit p-1 hover:bg-[#E0F2FE] text-[#0284C7] rounded" data-id="${un.id}" title="Edit Data Unit">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button class="btn-action-toggle-unit p-1 hover:bg-[#FEE2E2] ${isAktif ? 'text-[#DC2626]' : 'text-[#059669]'} rounded" data-id="${un.id}" title="${isAktif ? 'Nonaktifkan Unit' : 'Aktifkan Unit'}">
                            <span class="material-symbols-outlined text-[18px]">${isAktif ? 'toggle_on' : 'toggle_off'}</span>
                          </button>
                          <button class="btn-action-delete-unit p-1 hover:bg-[#FEE2E2] text-[#DC2626] rounded" data-id="${un.id}" data-nama="${un.nama}" title="Hapus Unit">
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
      // 1. Tab switching
      container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activeTab = btn.getAttribute('data-tab');
          this.render(container);
        });
      });

      // 2. Primary Add Button changes label based on active tab
      const primaryAddBtn = container.querySelector('#btn-org-add-primary');
      if (primaryAddBtn) {
        primaryAddBtn.addEventListener('click', () => {
          if (this.activeTab === 'unit') this.showUnitModal();
          else this.showUpdlModal();
        });
      }

      // 3. Search and status filter for Unit
      const searchUnitInput = container.querySelector('#search-unit-input');
      if (searchUnitInput) {
        searchUnitInput.addEventListener('input', (e) => {
          this.unitSearchTerm = e.target.value;
          const contentArea = container.querySelector('#org-tab-content');
          if (contentArea) {
            contentArea.innerHTML = this.renderUnitTable();
            this.attachRowActionListeners(container);
          }
        });
      }

      const filterUnitStatus = container.querySelector('#filter-unit-status');
      if (filterUnitStatus) {
        filterUnitStatus.addEventListener('change', (e) => {
          this.selectedUnitStatusFilter = e.target.value;
          const contentArea = container.querySelector('#org-tab-content');
          if (contentArea) {
            contentArea.innerHTML = this.renderUnitTable();
            this.attachRowActionListeners(container);
          }
        });
      }

      this.attachRowActionListeners(container);
    },

    attachRowActionListeners: function (container) {
      // Edit UPDL
      container.querySelectorAll('.btn-action-edit-updl').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.showUpdlModal(id);
        });
      });

      // Toggle UPDL
      container.querySelectorAll('.btn-action-toggle-updl').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          try {
            window.appStore.toggleUpdlStatus(id);
            this.showToast('Status UPDL berhasil diperbarui.', 'success');
            this.render(container);
          } catch (err) {
            this.showToast(err.message, 'error');
          }
        });
      });

      // Edit Unit
      container.querySelectorAll('.btn-action-edit-unit').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.showUnitModal(id);
        });
      });

      // Toggle Unit
      container.querySelectorAll('.btn-action-toggle-unit').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          try {
            window.appStore.toggleUnitStatus(id);
            this.showToast('Status Unit berhasil diperbarui.', 'success');
            this.render(container);
          } catch (err) {
            this.showToast(err.message, 'error');
          }
        });
      });

      // Delete Unit
      container.querySelectorAll('.btn-action-delete-unit').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const nama = btn.getAttribute('data-nama') || 'Unit Kerja';
          if (confirm(`Apakah Anda yakin ingin menghapus data "${nama}" dari master unit kerja?`)) {
            try {
              window.appStore.deleteUnit(id);
              this.showToast(`Unit Kerja "${nama}" berhasil dihapus.`, 'success');
              this.render(container);
            } catch (err) {
              this.showToast(err.message, 'error');
            }
          }
        });
      });
    },

    // === MODAL UPDL ===
    showUpdlModal: function (updlId = null) {
      const modalContainer = document.getElementById('org-modal-container');
      if (!modalContainer) return;

      const isEdit = Boolean(updlId);
      const updl = isEdit ? window.appStore.getUpdlById(updlId) : {
        kode: '',
        nama: '',
        wilayah: 'Indonesia',
        alamat: '',
        telepon: '',
        status: 'AKTIF'
      };

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-lg overflow-hidden flex flex-col">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">account_balance</span>
                ${isEdit ? 'Edit Master UPDL' : 'Tambah Master UPDL Baru'}
              </h3>
              <button id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form id="form-modal-updl" class="p-5 space-y-4 text-xs">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Kode UPDL (Unik) <span class="text-red-500">*</span></label>
                  <input type="text" id="updl-input-kode" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono uppercase focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: UPDL-PLB" value="${updl.kode || ''}" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Status</label>
                  <select id="updl-input-status" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none">
                    <option value="AKTIF" ${updl.status === 'AKTIF' ? 'selected' : ''}>AKTIF</option>
                    <option value="NONAKTIF" ${updl.status === 'NONAKTIF' ? 'selected' : ''}>NONAKTIF</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Nama UPDL <span class="text-red-500">*</span></label>
                <input type="text" id="updl-input-nama" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: UPDL Palembang" value="${updl.nama || ''}" />
              </div>
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Wilayah Operasional</label>
                <input type="text" id="updl-input-wilayah" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: Sumatera Bagian Selatan" value="${updl.wilayah || ''}" />
              </div>
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Alamat Kampus / Fasilitas</label>
                <textarea id="updl-input-alamat" rows="2" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Alamat lengkap kampus UPDL...">${updl.alamat || ''}</textarea>
              </div>
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">No. Telepon / Kontak</label>
                <input type="text" id="updl-input-telepon" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: (0711) 123456" value="${updl.telepon || ''}" />
              </div>

              <div class="pt-4 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="submit" class="btn-primary">Simpan Master UPDL</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const closeModal = () => modalContainer.innerHTML = '';
      modalContainer.querySelector('#modal-close-btn').onclick = closeModal;
      modalContainer.querySelector('#modal-cancel-btn').onclick = closeModal;

      modalContainer.querySelector('#form-modal-updl').onsubmit = (e) => {
        e.preventDefault();
        try {
          const payload = {
            kode: modalContainer.querySelector('#updl-input-kode').value,
            nama: modalContainer.querySelector('#updl-input-nama').value,
            wilayah: modalContainer.querySelector('#updl-input-wilayah').value,
            alamat: modalContainer.querySelector('#updl-input-alamat').value,
            telepon: modalContainer.querySelector('#updl-input-telepon').value,
            status: modalContainer.querySelector('#updl-input-status').value
          };
          if (isEdit) {
            window.appStore.updateUpdl(updlId, payload);
            this.showToast('Data UPDL berhasil diperbarui.', 'success');
          } else {
            window.appStore.addUpdl(payload);
            this.showToast('Master UPDL baru berhasil ditambahkan.', 'success');
          }
          closeModal();
          const mainContainer = document.getElementById('main-content-area');
          if (mainContainer) this.render(mainContainer);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      };
    },

    // === MODAL UNIT KERJA (MANDIRI - BUKAN DI BAWAH UPDL) ===
    showUnitModal: function (unitId = null) {
      const modalContainer = document.getElementById('org-modal-container');
      if (!modalContainer) return;

      const isEdit = Boolean(unitId);
      const unit = isEdit ? window.appStore.getUnitById(unitId) : {
        kode: '',
        nama: '',
        induk: '',
        alamat: '',
        kota: '',
        status: 'AKTIF'
      };

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-lg overflow-hidden flex flex-col">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">domain</span>
                ${isEdit ? 'Edit Master Unit Kerja' : 'Tambah Master Unit Kerja Baru'}
              </h3>
              <button id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form id="form-modal-unit" class="p-5 space-y-4 text-xs">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Kode Unit (Unik) <span class="text-red-500">*</span></label>
                  <input type="text" id="unit-input-kode" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono uppercase focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: UP3-MTR" value="${unit.kode || ''}" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Status</label>
                  <select id="unit-input-status" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none">
                    <option value="AKTIF" ${unit.status === 'AKTIF' ? 'selected' : ''}>AKTIF</option>
                    <option value="NONAKTIF" ${unit.status === 'NONAKTIF' ? 'selected' : ''}>NONAKTIF</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Nama Unit Kerja <span class="text-red-500">*</span></label>
                <input type="text" id="unit-input-nama" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: PLN UP3 Metro" value="${unit.nama || ''}" />
              </div>
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Unit Induk / Wilayah Operasional</label>
                <input type="text" id="unit-input-induk" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: PLN UID Lampung" value="${unit.induk || ''}" />
              </div>
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Kota / Lokasi Unit</label>
                <input type="text" id="unit-input-kota" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: Kota Metro, Lampung" value="${unit.kota || ''}" />
              </div>
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Alamat Kantor Unit</label>
                <input type="text" id="unit-input-alamat" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Alamat kantor unit operasional..." value="${unit.alamat || ''}" />
              </div>

              <div class="pt-4 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="submit" class="btn-primary">Simpan Master Unit</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const closeModal = () => modalContainer.innerHTML = '';
      modalContainer.querySelector('#modal-close-btn').onclick = closeModal;
      modalContainer.querySelector('#modal-cancel-btn').onclick = closeModal;

      modalContainer.querySelector('#form-modal-unit').onsubmit = (e) => {
        e.preventDefault();
        try {
          const payload = {
            kode: modalContainer.querySelector('#unit-input-kode').value,
            nama: modalContainer.querySelector('#unit-input-nama').value,
            induk: modalContainer.querySelector('#unit-input-induk').value,
            kota: modalContainer.querySelector('#unit-input-kota').value,
            alamat: modalContainer.querySelector('#unit-input-alamat').value,
            status: modalContainer.querySelector('#unit-input-status').value
          };
          if (isEdit) {
            window.appStore.updateUnit(unitId, payload);
            this.showToast('Data Unit Kerja berhasil diperbarui.', 'success');
          } else {
            window.appStore.addUnit(payload);
            this.showToast('Master Unit Kerja baru berhasil ditambahkan.', 'success');
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
      if (window.App && typeof window.App.showToast === 'function') {
        window.App.showToast(msg, type);
        return;
      }
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
