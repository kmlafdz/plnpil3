/**
 * View: Data Atasan Langsung (Evaluator Binaan)
 * Menampilkan daftar seluruh Atasan Langsung dengan kapabilitas CRUD lengkap
 */

(function () {
  window.AtasanListView = {
    searchTerm: '',
    selectedUnitFilter: 'ALL',
    selectedStatusFilter: 'ALL',

    render: function (container) {
      if (!container) return;

      const allUsers = window.appStore.getUsers() || [];
      const atasans = allUsers.filter(u => u.role === 'atasan');
      const units = window.appStore.getUnits ? window.appStore.getUnits(null, true) : [];
      const respondents = window.appStore.getRespondents ? window.appStore.getRespondents() : [];

      // Mapping jumlah peserta binaan per atasan
      const binaanMap = {};
      respondents.forEach(r => {
        if (r.atasan && r.atasan.nip) {
          const nipKey = String(r.atasan.nip).trim().toLowerCase();
          if (!binaanMap[nipKey]) binaanMap[nipKey] = [];
          binaanMap[nipKey].push(r);
        }
      });

      // Filter
      let filteredAtasans = atasans;
      if (this.selectedStatusFilter !== 'ALL') {
        filteredAtasans = filteredAtasans.filter(a => a.status === this.selectedStatusFilter);
      }
      if (this.selectedUnitFilter !== 'ALL') {
        filteredAtasans = filteredAtasans.filter(a => {
          return a.unitId === this.selectedUnitFilter || a.unitName === this.selectedUnitFilter;
        });
      }
      if (this.searchTerm) {
        const q = this.searchTerm.toLowerCase().trim();
        filteredAtasans = filteredAtasans.filter(a => {
          const hay = `${a.nama || ''} ${a.nip || ''} ${a.jabatan || ''} ${a.unitName || ''} ${a.email || ''}`.toLowerCase();
          return hay.includes(q);
        });
      }

      // Metrik
      const activeCount = atasans.filter(a => a.status === 'AKTIF').length;
      const totalPesertaBinaan = Object.values(binaanMap).reduce((acc, list) => acc + list.length, 0);
      const unitCount = new Set(atasans.map(a => a.unitName || a.unitId).filter(Boolean)).size;

      container.innerHTML = `
        <div class="flex flex-col gap-6 animate-fadeIn">
          
          <!-- Header -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col gap-1 max-w-3xl">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                  Evaluasi Level 3 — PLN Impact Lab (PIL)
                </span>
                <span class="text-xs text-[#64748B] font-mono">Modul Manajemen Penilai</span>
              </div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">
                Data Atasan Langsung
              </h1>
              <p class="text-xs md:text-sm text-[#64748B] leading-relaxed">
                Kelola data akun Atasan Langsung (Evaluator Perilaku Kerja) di seluruh unit kerja PLN, termasuk hak akses, verifikasi penilaian binaan, dan monitoring peserta binaan.
              </p>
            </div>

            <!-- Toolbar Action -->
            <div class="flex flex-wrap items-center gap-2">
              <button id="btn-add-atasan" class="btn-primary">
                <span class="material-symbols-outlined text-[16px]">person_add</span>
                <span>+ Tambah Atasan</span>
              </button>
            </div>
          </div>

          <!-- Metrik Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Atasan</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#172B3A]">${atasans.length}</span>
                <span class="text-[11px] font-medium text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">${activeCount} Aktif</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Peserta Binaan</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#006876]">${totalPesertaBinaan}</span>
                <span class="text-[11px] font-medium text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full">Diawasi</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Unit Kerja Terdaftar</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#172B3A]">${unitCount}</span>
                <span class="text-[11px] text-[#64748B]">Unit Operasional</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Akses Portal</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#059669]">100%</span>
                <span class="text-[11px] font-medium text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">Siap Menilai</span>
              </div>
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="card overflow-hidden">
            <div class="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F8FAFC]">
              <div class="flex flex-wrap items-center gap-3">
                <div class="relative">
                  <input type="text" id="search-atasan-input" placeholder="Cari NIP, nama, jabatan..." value="${this.searchTerm || ''}" class="text-xs border border-[#CBD5E1] rounded pl-8 pr-3 py-1.5 bg-white text-[#172B3A] focus:outline-none focus:border-[#23C4DB] w-52 sm:w-64" />
                  <span class="material-symbols-outlined text-[16px] text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
                </div>
                
                <select id="filter-atasan-unit" class="text-xs border border-[#CBD5E1] rounded px-3 py-1.5 bg-white text-[#172B3A] focus:outline-none focus:border-[#23C4DB]">
                  <option value="ALL">Semua Unit Kerja</option>
                  ${units.map(u => `
                    <option value="${u.nama}" ${this.selectedUnitFilter === u.nama ? 'selected' : ''}>${u.nama}</option>
                  `).join('')}
                </select>

                <select id="filter-atasan-status" class="text-xs border border-[#CBD5E1] rounded px-3 py-1.5 bg-white text-[#172B3A] focus:outline-none focus:border-[#23C4DB]">
                  <option value="ALL" ${this.selectedStatusFilter === 'ALL' ? 'selected' : ''}>Semua Status (${atasans.length})</option>
                  <option value="AKTIF" ${this.selectedStatusFilter === 'AKTIF' ? 'selected' : ''}>Status: AKTIF</option>
                  <option value="NONAKTIF" ${this.selectedStatusFilter === 'NONAKTIF' ? 'selected' : ''}>Status: NONAKTIF</option>
                </select>
              </div>

              <div class="text-xs text-[#64748B]">
                Menampilkan <b>${filteredAtasans.length}</b> Atasan Langsung
              </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-[#F1F5F9] text-[#475569] font-semibold border-b border-[#CBD5E1]">
                    <th class="py-3 px-4 w-12 text-center">No</th>
                    <th class="py-3 px-4">Profil Atasan</th>
                    <th class="py-3 px-4">Jabatan</th>
                    <th class="py-3 px-4">Unit Kerja</th>
                    <th class="py-3 px-4 text-center">Peserta Binaan</th>
                    <th class="py-3 px-4">Email / Kontak</th>
                    <th class="py-3 px-4 text-center">Status</th>
                    <th class="py-3 px-4 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]">
                  ${filteredAtasans.length === 0 ? `
                    <tr>
                      <td colspan="8" class="text-center py-8 text-[#94A3B8]">
                        <div class="flex flex-col items-center justify-center gap-2">
                          <span class="material-symbols-outlined text-[32px] text-[#CBD5E1]">supervisor_account</span>
                          <span>Belum ada data Atasan Langsung yang sesuai. Klik <b>+ Tambah Atasan</b> untuk menambahkan.</span>
                        </div>
                      </td>
                    </tr>
                  ` : filteredAtasans.map((a, idx) => {
                    const isAktif = a.status === 'AKTIF';
                    const nipKey = String(a.nip || '').trim().toLowerCase();
                    const binaans = binaanMap[nipKey] || [];
                    const binaanCount = binaans.length;
                    const initial = (a.nama || 'A').charAt(0).toUpperCase();

                    return `
                      <tr class="hover:bg-[#F8FAFC] transition-colors">
                        <td class="py-3 px-4 text-center font-mono text-[#64748B]">${idx + 1}</td>
                        <td class="py-3 px-4">
                          <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-full bg-[#006876] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                              ${a.avatar ? `<img src="${a.avatar}" alt="${a.nama}" class="w-full h-full object-cover" onerror="this.parentElement.textContent='${initial}'" />` : initial}
                            </div>
                            <div>
                              <div class="font-bold text-[#172B3A]">${a.nama}</div>
                              <div class="font-mono text-[11px] text-[#64748B]">NIP: ${a.nip}</div>
                            </div>
                          </div>
                        </td>
                        <td class="py-3 px-4 font-medium text-[#334155]">${a.jabatan || 'Atasan Langsung'}</td>
                        <td class="py-3 px-4 text-[#475569]">${a.unitName || a.unitId || 'PLN Unit'}</td>
                        <td class="py-3 px-4 text-center">
                          <button class="btn-view-binaan inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${binaanCount > 0 ? 'bg-[#E0F2FE] text-[#0284C7] hover:bg-[#BAE6FD]' : 'bg-[#F1F5F9] text-[#64748B]'}" data-nip="${a.nip}" data-nama="${a.nama}">
                            <span class="material-symbols-outlined text-[14px]">groups</span>
                            <span>${binaanCount} Peserta</span>
                          </button>
                        </td>
                        <td class="py-3 px-4 text-[#64748B]">
                          <div>${a.email || `${a.nip}@pln.co.id`}</div>
                        </td>
                        <td class="py-3 px-4 text-center">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isAktif ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'}">
                            ${a.status}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-center">
                          <div class="inline-flex items-center gap-1">
                            <button class="btn-edit-atasan p-1 hover:bg-[#E0F2FE] text-[#0284C7] rounded transition-colors" data-id="${a.id}" title="Edit Data Atasan">
                              <span class="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button class="btn-toggle-atasan p-1 hover:bg-[#FEE2E2] ${isAktif ? 'text-[#DC2626]' : 'text-[#059669]'} rounded transition-colors" data-id="${a.id}" title="${isAktif ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}">
                              <span class="material-symbols-outlined text-[18px]">${isAktif ? 'toggle_on' : 'toggle_off'}</span>
                            </button>
                            <button class="btn-delete-atasan p-1 hover:bg-[#FEE2E2] text-[#DC2626] rounded transition-colors" data-id="${a.id}" data-nama="${a.nama}" title="Hapus Atasan">
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

        <!-- Modal Host -->
        <div id="atasan-modal-container"></div>
      `;

      this.attachEventListeners(container, binaanMap);
    },

    attachEventListeners: function (container, binaanMap) {
      // Tombol Tambah
      container.querySelector('#btn-add-atasan')?.addEventListener('click', () => {
        this.showAtasanModal();
      });

      // Filter Search
      const searchInput = container.querySelector('#search-atasan-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchTerm = e.target.value;
          this.render(container);
        });
      }

      // Filter Unit
      const unitSelect = container.querySelector('#filter-atasan-unit');
      if (unitSelect) {
        unitSelect.addEventListener('change', (e) => {
          this.selectedUnitFilter = e.target.value;
          this.render(container);
        });
      }

      // Filter Status
      const statusSelect = container.querySelector('#filter-atasan-status');
      if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
          this.selectedStatusFilter = e.target.value;
          this.render(container);
        });
      }

      // Tombol Edit
      container.querySelectorAll('.btn-edit-atasan').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.showAtasanModal(id);
        });
      });

      // Tombol Toggle Status
      container.querySelectorAll('.btn-toggle-atasan').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          try {
            window.appStore.toggleUserStatus(id);
            this.showToast('Status Atasan berhasil diperbarui.', 'success');
            this.render(container);
          } catch (err) {
            this.showToast(err.message, 'error');
          }
        });
      });

      // Tombol Hapus
      container.querySelectorAll('.btn-delete-atasan').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const nama = btn.getAttribute('data-nama') || 'Atasan';
          if (confirm(`Apakah Anda yakin ingin menghapus akun Atasan "${nama}"?`)) {
            try {
              window.appStore.deleteUser(id);
              this.showToast(`Akun Atasan "${nama}" berhasil dihapus.`, 'success');
              this.render(container);
            } catch (err) {
              this.showToast(err.message, 'error');
            }
          }
        });
      });

      // Tombol Lihat Peserta Binaan
      container.querySelectorAll('.btn-view-binaan').forEach(btn => {
        btn.addEventListener('click', () => {
          const nip = (btn.getAttribute('data-nip') || '').trim().toLowerCase();
          const nama = btn.getAttribute('data-nama') || 'Atasan';
          const binaans = binaanMap[nip] || [];
          this.showBinaanModal(nama, binaans);
        });
      });
    },

    // Modal Tambah / Edit Atasan
    showAtasanModal: function (atasanId = null) {
      const modalHost = document.getElementById('atasan-modal-container');
      if (!modalHost) return;

      const isEdit = Boolean(atasanId);
      const user = isEdit ? window.appStore.getUserById(atasanId) : {
        nip: '',
        nama: '',
        jabatan: '',
        unitName: '',
        unitId: '',
        email: '',
        status: 'AKTIF',
        password: ''
      };

      const units = window.appStore.getUnits ? window.appStore.getUnits(null, true) : [];

      modalHost.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-lg overflow-hidden flex flex-col">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">supervisor_account</span>
                ${isEdit ? 'Edit Data Atasan Langsung' : 'Tambah Atasan Langsung Baru'}
              </h3>
              <button id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form id="form-modal-atasan" class="p-5 space-y-3.5 text-xs">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">NIP (Nomor Induk Pegawai) <span class="text-red-500">*</span></label>
                  <input type="text" id="atasan-input-nip" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono uppercase focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: 8508111A" value="${user.nip || ''}" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Status Akun</label>
                  <select id="atasan-input-status" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none">
                    <option value="AKTIF" ${user.status === 'AKTIF' ? 'selected' : ''}>AKTIF (Dapat Login)</option>
                    <option value="NONAKTIF" ${user.status === 'NONAKTIF' ? 'selected' : ''}>NONAKTIF</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Nama Lengkap & Gelar <span class="text-red-500">*</span></label>
                <input type="text" id="atasan-input-nama" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: Ir. Bambang Triyono, M.T." value="${user.nama || ''}" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Jabatan Kedinasan <span class="text-red-500">*</span></label>
                  <input type="text" id="atasan-input-jabatan" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: Manager UP3 Metro" value="${user.jabatan || ''}" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Unit Kerja Mandiri <span class="text-red-500">*</span></label>
                  <select id="atasan-input-unit" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none">
                    <option value="">-- Pilih Unit Kerja --</option>
                    ${units.map(u => `
                      <option value="${u.nama}" data-id="${u.id}" ${(user.unitName === u.nama || user.unitId === u.id) ? 'selected' : ''}>${u.nama} (${u.kode})</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Email Kedinasan (Opsional)</label>
                <input type="email" id="atasan-input-email" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: bambang.triyono@pln.co.id" value="${user.email || ''}" />
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Kata Sandi Akun</label>
                <input type="text" id="atasan-input-password" class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono focus:border-[#23C4DB] focus:outline-none" placeholder="${isEdit ? 'Kosongkan jika tidak diubah' : 'Default: pln123'}" value="${user.password || ''}" />
                <span class="text-[10px] text-[#64748B]">${isEdit ? 'Kosongkan jika tidak ingin mengubah kata sandi atasan ini.' : 'Kata sandi akun atasan untuk login ke portal evaluator.'}</span>
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="submit" class="btn-primary">Simpan Data Atasan</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const closeModal = () => modalHost.innerHTML = '';
      modalHost.querySelector('#modal-close-btn').onclick = closeModal;
      modalHost.querySelector('#modal-cancel-btn').onclick = closeModal;

      modalHost.querySelector('#form-modal-atasan').onsubmit = (e) => {
        e.preventDefault();
        try {
          const unitSelect = modalHost.querySelector('#atasan-input-unit');
          const selectedOpt = unitSelect.options[unitSelect.selectedIndex];
          const unitIdVal = selectedOpt ? selectedOpt.getAttribute('data-id') : '';

          const payload = {
            nip: modalHost.querySelector('#atasan-input-nip').value.trim(),
            nama: modalHost.querySelector('#atasan-input-nama').value.trim(),
            jabatan: modalHost.querySelector('#atasan-input-jabatan').value.trim(),
            unitName: unitSelect.value,
            unitId: unitIdVal,
            email: modalHost.querySelector('#atasan-input-email').value.trim(),
            status: modalHost.querySelector('#atasan-input-status').value,
            password: modalHost.querySelector('#atasan-input-password').value.trim() || 'pln123',
            role: 'atasan'
          };

          if (isEdit) {
            window.appStore.updateUser(atasanId, payload);
            this.showToast('Data Atasan berhasil diperbarui.', 'success');
          } else {
            window.appStore.addUser(payload);
            this.showToast('Atasan baru berhasil ditambahkan.', 'success');
          }

          closeModal();
          const mainArea = document.getElementById('main-content-area');
          if (mainArea) this.render(mainArea);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      };
    },

    // Modal Detail Peserta Binaan
    showBinaanModal: function (namaAtasan, binaanList) {
      const modalHost = document.getElementById('atasan-modal-container');
      if (!modalHost) return;

      modalHost.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">groups</span>
                  <span>Peserta Binaan: ${namaAtasan}</span>
                </h3>
                <p class="text-[11px] text-[#94A3B8]">Daftar peserta diklat yang dinilai langsung oleh atasan ini</p>
              </div>
              <button id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div class="p-5 overflow-y-auto flex-1 text-xs">
              ${binaanList.length === 0 ? `
                <div class="text-center py-8 text-[#94A3B8]">
                  <span class="material-symbols-outlined text-[32px] text-[#CBD5E1] mb-1">person_off</span>
                  <p>Belum ada peserta yang ditugaskan di bawah naungan atasan ini.</p>
                  <p class="text-[11px] mt-1 text-[#64748B]">Gunakan menu <b>Penugasan Penilai</b> untuk menetapkan atasan pada peserta.</p>
                </div>
              ` : `
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-[#F1F5F9] text-[#475569] font-semibold border-b border-[#CBD5E1]">
                      <th class="py-2.5 px-3 w-10 text-center">No</th>
                      <th class="py-2.5 px-3">Nama Peserta</th>
                      <th class="py-2.5 px-3">NIP</th>
                      <th class="py-2.5 px-3">Unit Kerja</th>
                      <th class="py-2.5 px-3 text-center">Status Evaluasi Atasan</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#E2E8F0]">
                    ${binaanList.map((r, i) => {
                      const ev = window.appStore.getEvaluation ? window.appStore.getEvaluation(r.id) : null;
                      const aStatus = ev && ev.atasan ? ev.atasan.status : 'BELUM';
                      const isDone = aStatus === 'SELESAI';
                      return `
                        <tr class="hover:bg-[#F8FAFC]">
                          <td class="py-2.5 px-3 text-center text-[#64748B] font-mono">${i + 1}</td>
                          <td class="py-2.5 px-3 font-semibold text-[#172B3A]">${r.nama}</td>
                          <td class="py-2.5 px-3 font-mono text-[#64748B]">${r.nip}</td>
                          <td class="py-2.5 px-3 text-[#475569]">${r.unit || '-'}</td>
                          <td class="py-2.5 px-3 text-center">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isDone ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'}">
                              ${isDone ? 'SUDAH DINILAI' : 'BELUM DINILAI'}
                            </span>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              `}
            </div>

            <div class="px-5 py-3 border-t border-[#E2E8F0] flex justify-end bg-[#F8FAFC]">
              <button type="button" id="modal-close-footer-btn" class="btn-primary text-xs">Tutup</button>
            </div>
          </div>
        </div>
      `;

      const closeModal = () => modalHost.innerHTML = '';
      modalHost.querySelector('#modal-close-btn').onclick = closeModal;
      modalHost.querySelector('#modal-close-footer-btn').onclick = closeModal;
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
