/**
 * View: Manajemen Data Pengguna / User
 * Evaluasi Level 3 — PLN Impact Lab (PIL)
 * Khusus pengelolaan akun pengguna, hak akses multi-peran, penugasan unit, dan impor data
 */

(function () {
  window.AdminUsersView = {
    selectedUpdlFilter: 'ALL',
    selectedUnitFilter: 'ALL',
    selectedRoleFilter: 'ALL',
    selectedStatusFilter: 'ALL',
    searchQuery: '',

    render: function (container) {
      const updls = window.appStore.getUpdls();
      const units = window.appStore.getUnits();
      const allUsers = window.appStore.getUsers();

      // Filtered users calculation
      const users = window.appStore.getUsers({
        updlId: this.selectedUpdlFilter,
        unitId: this.selectedUnitFilter,
        role: this.selectedRoleFilter,
        status: this.selectedStatusFilter,
        search: this.searchQuery
      });

      // Metrics calculation
      const totalUsersCount = allUsers.length;
      const activeUsersCount = allUsers.filter(u => u.status === 'AKTIF').length;
      const pesertaCount = allUsers.filter(u => u.role === 'peserta').length;
      const evaluatorCount = allUsers.filter(u => u.role === 'atasan' || u.role.includes('koordinator')).length;

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
                Data Pengguna / Akun User
              </h1>
              <p class="text-xs md:text-sm text-[#64748B] leading-relaxed">
                Kelola seluruh akun pengguna multi-peran (Administrator, Atasan Penilai, Koordinator UPDL, dan Peserta Diklat), integritas penugasan unit kerja, serta impor data akun massal.
              </p>
            </div>

            <!-- Toolbar Actions -->
            <div class="flex flex-wrap items-center gap-2">
              <button id="btn-user-import" class="btn-secondary">
                <span class="material-symbols-outlined text-[16px]">upload_file</span>
                Impor Data User
              </button>
              <button id="btn-user-add" class="btn-primary">
                <span class="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                <span>+ Tambah Administrator</span>
              </button>
            </div>
          </div>

          <!-- Top Metric Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Pengguna</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#172B3A]">${totalUsersCount}</span>
                <span class="text-[11px] font-medium text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full">${activeUsersCount} Aktif</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Pengguna Aktif</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#059669]">${activeUsersCount}</span>
                <span class="text-[11px] font-medium text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">Bisa Login</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Peserta Terdaftar</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#172B3A]">${pesertaCount}</span>
                <span class="text-[11px] font-medium text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded-full">Responden Diklat</span>
              </div>
            </div>
            <div class="card p-4 flex flex-col justify-between">
              <span class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Tim Penilai & Admin</span>
              <div class="flex items-baseline justify-between mt-2">
                <span class="text-2xl font-bold text-[#172B3A]">${evaluatorCount}</span>
                <span class="text-[11px] font-medium text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-full">Evaluator & Admin</span>
              </div>
            </div>
          </div>

          <!-- Users Table Card -->
          <div class="card overflow-hidden">
            
            <!-- Filters & Search Toolbar -->
            <div class="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 flex-grow max-w-4xl">
                
                <!-- Filter UPDL -->
                <div>
                  <label class="block text-[11px] font-medium text-[#64748B] mb-1">UPDL:</label>
                  <select id="filter-user-updl" class="w-full text-xs border border-[#CBD5E1] rounded px-2.5 py-1.5 bg-white text-[#172B3A] focus:outline-none focus:border-[#23C4DB]">
                    <option value="ALL">Semua UPDL</option>
                    ${updls.map(u => `
                      <option value="${u.id}" ${this.selectedUpdlFilter === u.id ? 'selected' : ''}>${u.kode} - ${u.nama}</option>
                    `).join('')}
                  </select>
                </div>

                <!-- Filter Unit -->
                <div>
                  <label class="block text-[11px] font-medium text-[#64748B] mb-1">Unit Kerja:</label>
                  <select id="filter-user-unit" class="w-full text-xs border border-[#CBD5E1] rounded px-2.5 py-1.5 bg-white text-[#172B3A] focus:outline-none focus:border-[#23C4DB]">
                    <option value="ALL">Semua Unit</option>
                    ${units.map(un => `
                      <option value="${un.id}" ${this.selectedUnitFilter === un.id ? 'selected' : ''}>${un.nama}</option>
                    `).join('')}
                  </select>
                </div>

                <!-- Filter Role -->
                <div>
                  <label class="block text-[11px] font-medium text-[#64748B] mb-1">Peran / Role:</label>
                  <select id="filter-user-role" class="w-full text-xs border border-[#CBD5E1] rounded px-2.5 py-1.5 bg-white text-[#172B3A] focus:outline-none focus:border-[#23C4DB]">
                    <option value="ALL" ${this.selectedRoleFilter === 'ALL' ? 'selected' : ''}>Semua Role</option>
                    <option value="peserta" ${this.selectedRoleFilter === 'peserta' ? 'selected' : ''}>Peserta</option>
                    <option value="atasan" ${this.selectedRoleFilter === 'atasan' ? 'selected' : ''}>Atasan Langsung</option>
                    <option value="koordinator_internal" ${this.selectedRoleFilter === 'koordinator_internal' ? 'selected' : ''}>Koordinator Internal</option>
                    <option value="koordinator_eksternal" ${this.selectedRoleFilter === 'koordinator_eksternal' ? 'selected' : ''}>Koordinator Eksternal</option>
                    <option value="admin" ${this.selectedRoleFilter === 'admin' ? 'selected' : ''}>Administrator</option>
                  </select>
                </div>

                <!-- Search -->
                <div>
                  <label class="block text-[11px] font-medium text-[#64748B] mb-1">Cari NIP / Nama:</label>
                  <input type="text" id="input-search-user" class="w-full text-xs border border-[#CBD5E1] rounded px-2.5 py-1.5 bg-white text-[#172B3A] placeholder-[#94A3B8] focus:outline-none focus:border-[#23C4DB]" placeholder="Ketik nama atau NIP..." value="${this.searchQuery}" />
                </div>

              </div>

              <div class="flex items-center gap-3 shrink-0 self-end md:self-center">
                <span class="text-xs text-[#64748B]">Total Ditemukan: <b>${users.length}</b> akun</span>
              </div>
            </div>

            <!-- Users Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-[#F1F5F9] text-[#475569] font-semibold border-b border-[#CBD5E1]">
                    <th class="py-3 px-4 w-12 text-center">No</th>
                    <th class="py-3 px-4">NIP & Akun</th>
                    <th class="py-3 px-4">Nama Lengkap</th>
                    <th class="py-3 px-4">Jabatan</th>
                    <th class="py-3 px-4">Unit Kerja & UPDL</th>
                    <th class="py-3 px-4 text-center">Role / Hak Akses</th>
                    <th class="py-3 px-4 text-center">Status</th>
                    <th class="py-3 px-4 text-center w-32">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]">
                  ${users.length === 0 ? `
                    <tr>
                      <td colspan="8" class="text-center py-8 text-[#94A3B8]">
                        Tidak ada user yang cocok dengan kriteria pencarian / filter.
                      </td>
                    </tr>
                  ` : users.map((u, idx) => {
                    const roleBadgeMap = {
                      developer: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]',
                      peserta: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
                      atasan: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
                      koordinator_internal: 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]',
                      koordinator_eksternal: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]',
                      admin: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
                    };
                    const roleLabelMap = {
                      developer: 'Developer Superadmin',
                      peserta: 'Peserta',
                      atasan: 'Atasan Langsung',
                      koordinator_internal: 'Kord. Internal',
                      koordinator_eksternal: 'Kord. Eksternal',
                      admin: 'Administrator'
                    };
                    const badgeClass = roleBadgeMap[u.role] || 'bg-slate-100 text-slate-700 border-slate-200';
                    const roleLabel = roleLabelMap[u.role] || u.role;
                    const isAktif = u.status === 'AKTIF';

                    const currentAuthUser = window.authManager ? window.authManager.getUser() : null;
                    const isCurrentDev = currentAuthUser && currentAuthUser.role === 'developer';
                    const isTargetDev = u.role === 'developer';

                    return `
                      <tr class="hover:bg-[#F8FAFC] transition-colors">
                        <td class="py-3 px-4 text-center font-mono text-[#64748B]">${idx + 1}</td>
                        <td class="py-3 px-4">
                          <div class="font-mono font-bold text-[#172B3A]">${u.nip}</div>
                          <div class="text-[11px] text-[#64748B]">${u.email || '-'}</div>
                        </td>
                        <td class="py-3 px-4 font-semibold text-[#172B3A]">${u.nama}</td>
                        <td class="py-3 px-4 text-[#475569]">${u.jabatan || '-'}</td>
                        <td class="py-3 px-4 text-[#475569]">
                          <div>${u.unitName || u.unitId || '-'}</div>
                          <div class="text-[10px] text-[#94A3B8] uppercase">UPDL: ${u.updlId || '-'}</div>
                        </td>
                        <td class="py-3 px-4 text-center">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}">
                            ${roleLabel}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-center">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isAktif ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'}">
                            ${u.status}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-center">
                          <div class="inline-flex items-center gap-1">
                            ${(!isTargetDev || isCurrentDev) ? `
                              <button class="btn-action-edit-user p-1 hover:bg-[#E0F2FE] text-[#0284C7] rounded" data-id="${u.id}" title="Edit Data User">
                                <span class="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button class="btn-action-toggle-user p-1 hover:bg-[#FEE2E2] ${isAktif ? 'text-[#DC2626]' : 'text-[#059669]'} rounded" data-id="${u.id}" title="${isAktif ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}">
                                <span class="material-symbols-outlined text-[18px]">${isAktif ? 'toggle_on' : 'toggle_off'}</span>
                              </button>
                              <button class="btn-action-delete-user p-1 hover:bg-[#FEE2E2] text-[#DC2626] rounded transition-colors" data-id="${u.id}" data-nama="${u.nama}" data-nip="${u.nip || ''}" title="Hapus User">
                                <span class="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            ` : `
                              <span class="inline-flex items-center gap-1 text-[11px] text-[#7C3AED] font-semibold bg-[#F5F3FF] px-2 py-0.5 rounded border border-[#DDD6FE]" title="Akun Developer dilindungi">
                                <span class="material-symbols-outlined text-[14px]">lock</span>
                                Terproteksi
                              </span>
                            `}
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

        <!-- Generic Modal Container -->
        <div id="user-modal-container"></div>
      `;

      this.attachEventListeners(container);
    },

    attachEventListeners: function (container) {
      // Add User Button
      container.querySelector('#btn-user-add')?.addEventListener('click', () => this.showUserModal());

      // Import User Button
      container.querySelector('#btn-user-import')?.addEventListener('click', () => this.showImportUserModal());

      // Filter UPDL
      const filterUserUpdl = container.querySelector('#filter-user-updl');
      if (filterUserUpdl) {
        filterUserUpdl.addEventListener('change', (e) => {
          this.selectedUpdlFilter = e.target.value;
          this.render(container);
        });
      }

      // Filter Unit
      const filterUserUnit = container.querySelector('#filter-user-unit');
      if (filterUserUnit) {
        filterUserUnit.addEventListener('change', (e) => {
          this.selectedUnitFilter = e.target.value;
          this.render(container);
        });
      }

      // Filter Role
      const filterUserRole = container.querySelector('#filter-user-role');
      if (filterUserRole) {
        filterUserRole.addEventListener('change', (e) => {
          this.selectedRoleFilter = e.target.value;
          this.render(container);
        });
      }

      // Search Handler
      const inputSearchUser = container.querySelector('#input-search-user');
      if (inputSearchUser) {
        let debounceTimer;
        inputSearchUser.addEventListener('input', (e) => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            this.searchQuery = e.target.value;
            this.render(container);
          }, 300);
        });
      }

      // Row Actions (Edit, Toggle, Delete)
      container.querySelectorAll('.btn-action-edit-user').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.showUserModal(id);
        });
      });

      container.querySelectorAll('.btn-action-toggle-user').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          try {
            window.appStore.toggleUserStatus(id);
            this.showToast('Status User berhasil diperbarui.', 'success');
            this.render(container);
          } catch (err) {
            this.showToast(err.message, 'error');
          }
        });
      });

      container.querySelectorAll('.btn-action-delete-user').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.showDeleteUserModal(id);
        });
      });
    },

    showUserModal: function (userId = null) {
      const modalContainer = document.getElementById('user-modal-container');
      if (!modalContainer) return;

      const updls = window.appStore.getUpdls(true);
      const allUnits = window.appStore.getUnits();
      const isEdit = !!userId;

      const defaultUpdl = (this.selectedUpdlFilter && this.selectedUpdlFilter !== 'ALL')
        ? this.selectedUpdlFilter
        : ((window.appStore.state && window.appStore.state.activeDashboardUpdl && window.appStore.state.activeDashboardUpdl !== 'ALL')
            ? window.appStore.state.activeDashboardUpdl
            : (updls[0] ? updls[0].id : ''));

      const user = isEdit ? window.appStore.getUserById(userId) : {
        nip: '',
        nama: '',
        email: '',
        jabatan: '',
        updlId: defaultUpdl,
        unitId: '',
        role: 'peserta',
        status: 'AKTIF',
        password: ''
      };

      const userUnits = allUnits;

      const currentAuthUser = window.authManager ? window.authManager.getUser() : null;
      const isCurrentUserDev = currentAuthUser && currentAuthUser.role === 'developer';

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-lg overflow-hidden flex flex-col">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">
                  ${isEdit ? 'person' : 'admin_panel_settings'}
                </span>
                ${isEdit ? 'Edit Akun Pengguna' : 'Tambah Administrator Baru'}
              </h3>
              <button id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form id="form-modal-user" class="p-5 space-y-3.5 text-xs">
              ${!isEdit ? `
                <div class="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-[11px] text-[#1E40AF] flex items-start gap-2">
                  <span class="material-symbols-outlined text-[16px] text-[#2563EB] mt-0.5 flex-shrink-0">info</span>
                  <div>
                    <strong>Khusus Penambahan Akun Administrator</strong>
                    <p class="mt-0.5 text-[#3B82F6]">Halaman ini khusus mendaftarkan akun Administrator. Penambahan data <strong>Atasan</strong> dikelola melalui menu <em>Atasan</em>, <strong>Koordinator</strong> melalui menu <em>Koordinator</em>, dan <strong>Peserta</strong> melalui menu <em>Penugasan</em>.</p>
                  </div>
                </div>
              ` : ''}
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">NIP (Nomor Induk Pegawai) <span class="text-red-500">*</span></label>
                  <input type="text" id="user-input-nip" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: 9518001ZY" value="${user.nip || ''}" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Peran / Hak Akses <span class="text-red-500">*</span></label>
                  <select id="user-input-role" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none">
                    ${!isEdit ? `
                      <option value="admin" selected>Administrator Pusat</option>
                      ${isCurrentUserDev ? `<option value="developer">Developer & Super Admin</option>` : ''}
                    ` : (isCurrentUserDev ? `
                      <option value="developer" ${user.role === 'developer' ? 'selected' : ''}>Developer & Super Admin</option>
                      <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator Pusat</option>
                      <option value="koordinator_internal" ${user.role === 'koordinator_internal' ? 'selected' : ''}>Koordinator Internal UP3</option>
                      <option value="koordinator_eksternal" ${user.role === 'koordinator_eksternal' ? 'selected' : ''}>Koordinator Eksternal UPDL</option>
                      <option value="atasan" ${user.role === 'atasan' ? 'selected' : ''}>Atasan Langsung (Evaluator)</option>
                      <option value="peserta" ${user.role === 'peserta' ? 'selected' : ''}>Peserta (Self-Assessment)</option>
                    ` : `
                      <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator Pusat</option>
                      <option value="koordinator_internal" ${user.role === 'koordinator_internal' ? 'selected' : ''}>Koordinator Internal UP3</option>
                      <option value="koordinator_eksternal" ${user.role === 'koordinator_eksternal' ? 'selected' : ''}>Koordinator Eksternal UPDL</option>
                      <option value="atasan" ${user.role === 'atasan' ? 'selected' : ''}>Atasan Langsung (Evaluator)</option>
                      <option value="peserta" ${user.role === 'peserta' ? 'selected' : ''}>Peserta (Self-Assessment)</option>
                    `)}
                  </select>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Nama Lengkap & Gelar <span class="text-red-500">*</span></label>
                <input type="text" id="user-input-nama" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: Ahmad Fauzi, S.T." value="${user.nama || ''}" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Email PLN</label>
                  <input type="email" id="user-input-email" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="nama@pln.co.id" value="${user.email || ''}" />
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Jabatan Struktural/Fungsional</label>
                  <input type="text" id="user-input-jabatan" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: Assistant Engineer" value="${user.jabatan || ''}" />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Kata Sandi (Password)</label>
                <input type="text" id="user-input-password" class="w-full border border-[#CBD5E1] rounded px-3 py-2 font-mono focus:border-[#23C4DB] focus:outline-none" placeholder="${isEdit ? 'Kosongkan jika tidak diubah' : 'Default: pln123'}" value="${user.password || ''}" />
                <span class="text-[10px] text-[#64748B]">${isEdit ? 'Kosongkan jika tidak ingin mengubah kata sandi akun ini.' : 'Kata sandi akun pengguna untuk login.'}</span>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">UPDL Induk</label>
                  <select id="user-input-updl" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none">
                    <option value="">-- Kantor Pusat / Tanpa UPDL --</option>
                    ${updls.map(u => `
                      <option value="${u.id}" ${user.updlId === u.id ? 'selected' : ''}>${u.nama}</option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1" id="lbl-unit-title">Unit Kerja</label>
                  <select id="user-input-unit" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none">
                    <option value="">-- Kantor Pusat / Tanpa Unit --</option>
                    ${userUnits.map(un => `
                      <option value="${un.id}" ${user.unitId === un.id ? 'selected' : ''}>${un.nama}</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div id="box-external-coord-note" class="${user.role === 'koordinator_eksternal' ? '' : 'hidden'} p-2.5 bg-[#FEF3C7] border border-[#FDE68A] rounded text-[11px] text-[#92400E]">
                <div class="font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[15px]">info</span>
                  Pengecualian Koordinator Eksternal / Pusat:
                </div>
                <span>Koordinator eksternal mewakili institusi pelatihan UPDL dan tidak terikat unit kerja operasional tertentu.</span>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Status Akun</label>
                <select id="user-input-status" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none">
                  <option value="AKTIF" ${user.status === 'AKTIF' ? 'selected' : ''}>AKTIF (Dapat Login)</option>
                  <option value="NONAKTIF" ${user.status === 'NONAKTIF' ? 'selected' : ''}>NONAKTIF (Akses Ditutup)</option>
                </select>
              </div>

              <div class="p-2.5 bg-[#F1F5F9] rounded border border-[#E2E8F0] text-[11px] text-[#475569]">
                <span class="font-semibold text-[#172B3A]">Catatan Kredensial:</span> Pengguna login menggunakan NIP terdaftar dan kata sandi yang telah ditetapkan.
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="submit" class="btn-primary">${isEdit ? 'Simpan Data User' : 'Daftarkan Administrator'}</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const closeModal = () => modalContainer.innerHTML = '';
      modalContainer.querySelector('#modal-close-btn').onclick = closeModal;
      modalContainer.querySelector('#modal-cancel-btn').onclick = closeModal;

      const updlSelect = modalContainer.querySelector('#user-input-updl');
      const unitSelect = modalContainer.querySelector('#user-input-unit');
      const roleSelect = modalContainer.querySelector('#user-input-role');
      const extNote = modalContainer.querySelector('#box-external-coord-note');

      roleSelect.onchange = () => {
        const isExternal = roleSelect.value === 'koordinator_eksternal' || roleSelect.value === 'developer' || roleSelect.value === 'admin';
        if (isExternal) {
          extNote.classList.remove('hidden');
        } else {
          extNote.classList.add('hidden');
        }
      };

      modalContainer.querySelector('#form-modal-user').onsubmit = (e) => {
        e.preventDefault();
        try {
          const payload = {
            nip: modalContainer.querySelector('#user-input-nip').value.trim(),
            nama: modalContainer.querySelector('#user-input-nama').value.trim(),
            email: modalContainer.querySelector('#user-input-email').value.trim(),
            jabatan: modalContainer.querySelector('#user-input-jabatan').value.trim(),
            updlId: modalContainer.querySelector('#user-input-updl').value || '',
            unitId: modalContainer.querySelector('#user-input-unit').value || '',
            role: modalContainer.querySelector('#user-input-role').value,
            status: modalContainer.querySelector('#user-input-status').value,
            password: modalContainer.querySelector('#user-input-password').value.trim() || user.password || 'pln123'
          };
          const isPrivilegedAction = payload.role === 'admin' || payload.role === 'developer' || user.role === 'admin' || user.role === 'developer';
          const executeSave = () => {
            try {
              if (isEdit) {
                window.appStore.updateUser(userId, payload);
                this.showToast('Data akun user berhasil diperbarui.', 'success');
              } else {
                window.appStore.addUser(payload);
                this.showToast('User baru berhasil ditambahkan.', 'success');
              }
              closeModal();
              const mainContainer = document.getElementById('main-content-area');
              if (mainContainer) this.render(mainContainer);
            } catch (err) {
              this.showToast(err.message, 'error');
            }
          };

          if (isPrivilegedAction && window.FaceAuthManager) {
            window.FaceAuthManager.requireSensitiveActionAuth(isEdit ? `Modifikasi Akun Berwenang: ${payload.nama}` : `Pembuatan Akun Berwenang: ${payload.nama}`, executeSave);
          } else {
            executeSave();
          }
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      };
    },

    showDeleteUserModal: function (userId) {
      const modalContainer = document.getElementById('user-modal-container');
      if (!modalContainer) return;
      const user = window.appStore.getUserById(userId);
      if (!user) return;

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-md overflow-hidden flex flex-col">
            <div class="px-5 py-4 bg-[#DC2626] text-white flex items-center justify-between">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">warning</span>
                Hapus Pengguna
              </h3>
              <button id="modal-close-btn" class="text-white/80 hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div class="p-5 space-y-4 text-xs text-[#172B3A]">
              <p>Apakah Anda yakin ingin menghapus data pengguna berikut dari sistem?</p>
              <div class="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded space-y-1">
                <div class="font-bold text-[#991B1B] text-sm">${user.nama}</div>
                <div class="text-[#7F1D1D] font-mono">NIP: ${user.nip}</div>
                <div class="text-[#64748B] text-[11px]">Role: <span class="font-semibold uppercase">${user.role}</span></div>
              </div>
              <p class="text-[#64748B]">Tindakan ini tidak dapat dibatalkan. Akun dan data terkait akan dihapus dari sistem.</p>
              <div class="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="button" id="modal-confirm-delete-btn" class="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded font-bold transition-colors">Ya, Hapus Pengguna</button>
              </div>
            </div>
          </div>
        </div>
      `;

      const closeModal = () => modalContainer.innerHTML = '';
      modalContainer.querySelector('#modal-close-btn').onclick = closeModal;
      modalContainer.querySelector('#modal-cancel-btn').onclick = closeModal;

      modalContainer.querySelector('#modal-confirm-delete-btn').onclick = () => {
        const executeDelete = () => {
          try {
            window.appStore.deleteUser(userId);
            this.showToast(`Pengguna ${user.nama} berhasil dihapus.`, 'success');
            closeModal();
            const mainContainer = document.getElementById('main-content-area');
            if (mainContainer) this.render(mainContainer);
          } catch (err) {
            this.showToast(err.message, 'error');
          }
        };

        const isPrivileged = user.role === 'admin' || user.role === 'developer';
        if (isPrivileged && window.FaceAuthManager) {
          window.FaceAuthManager.requireSensitiveActionAuth(`Hapus Akun ${user.role.toUpperCase()}: ${user.nama}`, executeDelete);
        } else {
          executeDelete();
        }
      };
    },

    showImportUserModal: function () {
      const modalContainer = document.getElementById('user-modal-container');
      if (!modalContainer) return;

      let parsedData = [];

      const renderModalContent = () => {
        const existingUsers = window.appStore.getUsers();
        const existingNipMap = new Set(existingUsers.map(u => u.nip.toLowerCase()));

        modalContainer.innerHTML = `
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <!-- Modal Header -->
              <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between shrink-0">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[20px] text-[#23C4DB]">upload_file</span>
                  <h3 class="text-sm font-bold">Impor Pengguna & DAFTAR RESPONDEN (Excel / CSV)</h3>
                </div>
                <button id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                  <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <!-- Modal Body -->
              <div class="p-5 overflow-y-auto space-y-4 text-xs">
                
                <!-- Action Controls Banner -->
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg">
                  <div class="flex flex-wrap items-center gap-2">
                    <button id="btn-download-user-template-xlsx" class="btn-secondary text-[11px] py-1.5 px-3" title="Unduh Template Excel (.XLSX)">
                      <span class="material-symbols-outlined text-[16px] text-[#006876]">download</span>
                      Unduh Template (.XLSX)
                    </button>
                    <button id="btn-download-user-template" class="btn-secondary text-[11px] py-1.5 px-3" title="Unduh Template CSV">
                      <span class="material-symbols-outlined text-[16px]">download</span>
                      Unduh Template (.CSV)
                    </button>
                    <label for="file-user-input" class="btn-primary text-[11px] py-1.5 px-3 cursor-pointer inline-flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[16px]">file_upload</span>
                      Pilih File CSV / Excel
                    </label>
                    <input type="file" id="file-user-input" accept=".csv, .txt, .xlsx, .xls" class="hidden" />
                  </div>

                  <!-- Import Mode Selection -->
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] font-bold text-[#475569]">Mode:</span>
                    <select id="select-import-mode" class="text-xs bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 focus:border-[#23C4DB] focus:outline-none font-medium">
                      <option value="create_only">Tambah Baru Saja (Abaikan Duplikat NIP)</option>
                      <option value="update_existing">Perbarui Jika NIP Sudah Ada (Upsert)</option>
                    </select>
                  </div>
                </div>

                <!-- Info Box -->
                <div class="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-[11px] text-[#1E40AF] flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px] text-[#2563EB]">info</span>
                    <span>Format kolom didukung: <b>NIP, Nama, Email, Jabatan, UPDL, Unit, Role</b>. Password default <code>pln123</code>.</span>
                  </div>
                  <span class="font-bold text-[#1E40AF]">${parsedData.length} Baris Terbaca</span>
                </div>

                <!-- Live Preview Table -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="font-semibold text-[#172B3A]">Pratinjau & Validasi Data Sebelum Disimpan:</label>
                    <span class="text-[11px] text-[#64748B]">Verifikasi baris dengan kode warna status</span>
                  </div>

                  <div class="border border-[#CBD5E1] rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
                    <table class="w-full text-left border-collapse text-[11px]">
                      <thead class="bg-[#F1F5F9] text-[#475569] font-bold sticky top-0 border-b border-[#CBD5E1]">
                        <tr>
                          <th class="py-2 px-3 w-8 text-center">No</th>
                          <th class="py-2 px-3">NIP</th>
                          <th class="py-2 px-3">Nama Pegawai</th>
                          <th class="py-2 px-3">Jabatan & Unit</th>
                          <th class="py-2 px-3 text-center">Role</th>
                          <th class="py-2 px-3 text-center">Status Validasi</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-[#E2E8F0]">
                        ${parsedData.length === 0 ? `
                          <tr>
                            <td colspan="6" class="text-center py-6 text-[#94A3B8]">
                              Belum ada data. Silakan pilih file CSV/Excel atau unduh template terlebih dahulu.
                            </td>
                          </tr>
                        ` : parsedData.map((d, idx) => {
                          const nip = (d.nip || '').trim();
                          const nama = (d.nama || '').trim();
                          const isDuplicate = existingNipMap.has(nip.toLowerCase());
                          const isInvalid = !nip || !nama;

                          return `
                            <tr class="hover:bg-[#F8FAFC]">
                              <td class="py-2 px-3 text-center font-mono text-[#94A3B8]">${idx + 1}</td>
                              <td class="py-2 px-3 font-mono font-bold text-[#0F96A9]">${nip || '<span class="text-red-500">Kosong</span>'}</td>
                              <td class="py-2 px-3 font-semibold text-[#172B3A]">${nama || '<span class="text-red-500">Kosong</span>'}</td>
                              <td class="py-2 px-3 text-[#64748B]">${d.jabatan || '-'} (${d.unit || 'Unit Default'})</td>
                              <td class="py-2 px-3 text-center">
                                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E0F2FE] text-[#0369A1]">
                                  ${d.role || 'peserta'}
                                </span>
                              </td>
                              <td class="py-2 px-3 text-center">
                                ${isInvalid ? `
                                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                                    NIP/Nama Kosong
                                  </span>
                                ` : isDuplicate ? `
                                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                                    Duplikat NIP
                                  </span>
                                ` : `
                                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                                    Siap Ditambah
                                  </span>
                                `}
                              </td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Textarea Quick Edit / JSON Alternative -->
                <div>
                  <details class="text-[11px] text-[#64748B]">
                    <summary class="cursor-pointer font-semibold text-[#172B3A] hover:underline mb-1">
                      Lihat / Edit Data Mentah (JSON):
                    </summary>
                    <textarea id="import-json-data" rows="3" class="w-full border border-[#CBD5E1] rounded p-2 font-mono text-[11px] bg-[#F8FAFC] focus:outline-none focus:border-[#23C4DB]">${JSON.stringify(parsedData, null, 2)}</textarea>
                  </details>
                </div>

              </div>

              <!-- Modal Footer -->
              <div class="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#CBD5E1] flex justify-between items-center shrink-0">
                <span class="text-[11px] text-[#64748B]">
                  Siap dieksekusi: <b>${parsedData.length}</b> akun
                </span>
                <div class="flex gap-2">
                  <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                  <button type="button" id="btn-execute-import" class="btn-primary" ${parsedData.length === 0 ? 'disabled' : ''}>
                    <span class="material-symbols-outlined text-[16px]">file_download_done</span>
                    Eksekusi Impor Pengguna
                  </button>
                </div>
              </div>

            </div>
          </div>
        `;

        const closeModal = () => modalContainer.innerHTML = '';
        modalContainer.querySelector('#modal-close-btn').onclick = closeModal;
        modalContainer.querySelector('#modal-cancel-btn').onclick = closeModal;

        // Download Excel XLSX Template Pengguna
        modalContainer.querySelector('#btn-download-user-template-xlsx').onclick = () => {
          try {
            if (typeof window.XLSX !== 'undefined') {
              const wb = window.XLSX.utils.book_new();

              // Sheet 1: DATA PENGGUNA
              const userHeaders = ['NIP', 'Nama', 'Email', 'Jabatan', 'UPDL', 'Unit', 'Role'];
              const sampleUsers = [
                ['9820011ZY', 'Farhan Maulana', 'farhan.m@pln.co.id', 'Junior Engineer Jaringan', 'UPDL Palembang', 'PLN UP3 Metro', 'peserta'],
                ['9719012ZY', 'Gita Permatasari', 'gita.p@pln.co.id', 'Pelaksana Analis Efisiensi', 'UPDL Palembang', 'PLN ULP Bandarjaya', 'peserta'],
                ['8708155K', 'Ir. Kurniawan Santoso', 'kurniawan.s@pln.co.id', 'Manager Bagian Jaringan', 'UPDL Palembang', 'PLN UP3 Metro', 'atasan'],
                ['8001001K', 'Dra. Maya Indriyanti', 'maya.i@pln.co.id', 'Koordinator Evaluasi Pembelajaran', 'UPDL Palembang', 'PLN UPDL Palembang', 'koordinator'],
                ['admin_updl', 'Admin Operasional UPDL', 'admin.updl@pln.co.id', 'Staf Administrasi Diklat', 'UPDL Palembang', 'PLN UPDL Palembang', 'admin_updl']
              ];

              const wsData = [userHeaders, ...sampleUsers];
              const ws = window.XLSX.utils.aoa_to_sheet(wsData);
              ws['!cols'] = [
                { wch: 16 }, { wch: 28 }, { wch: 30 }, { wch: 32 }, { wch: 20 }, { wch: 24 }, { wch: 14 }
              ];
              window.XLSX.utils.book_append_sheet(wb, ws, 'DATA PENGGUNA');

              // Sheet 2: PETUNJUK
              const guideRows = [
                ['PETUNJUK PENGISIAN TEMPLATE PENGGUNA SISTEM EVALUASI LEVEL 3 PLN CORPU'],
                [''],
                ['KOLOM', 'KETENTUAN PENGISIAN'],
                ['NIP', 'Wajib. Digunakan sebagai Username unik untuk login ke sistem.'],
                ['Nama', 'Wajib. Nama lengkap pegawai beserta gelar bila ada.'],
                ['Email', 'Wajib / Rekomendasi. Alamat email dinas/perusahaan untuk korespondensi.'],
                ['Jabatan', 'Wajib. Nama jabatan kedinasan pegawai.'],
                ['UPDL', 'Wajib. Nama UPDL pengampu diklat (misal: UPDL Palembang, UPDL Semarang, dll).'],
                ['Unit', 'Wajib. Unit kerja asal pegawai (misal: PLN UP3 Metro, PLN ULP Bandarjaya).'],
                ['Role', 'Wajib. Hak akses sistem. Pilihan: peserta, atasan, koordinator, admin_updl, superadmin.'],
                [''],
                ['CATATAN KEAMANAN:'],
                ['Password awal (default) untuk semua akun baru yang dibuat adalah: pln123']
              ];
              const wsGuide = window.XLSX.utils.aoa_to_sheet(guideRows);
              wsGuide['!cols'] = [{ wch: 18 }, { wch: 80 }];
              window.XLSX.utils.book_append_sheet(wb, wsGuide, 'PETUNJUK');

              window.XLSX.writeFile(wb, 'Template_Pengguna_PLN_Corpu.xlsx');
              this.showToast('Template Excel (.xlsx) berhasil diunduh.', 'success');
            } else {
              modalContainer.querySelector('#btn-download-user-template').click();
            }
          } catch (err) {
            console.error('Gagal unduh template Excel:', err);
            modalContainer.querySelector('#btn-download-user-template').click();
          }
        };

        // Download CSV Template
        modalContainer.querySelector('#btn-download-user-template').onclick = () => {
          const csvHeader = 'NIP,Nama,Email,Jabatan,UPDL,Unit,Role\n';
          const sampleRows = [
            '9820011ZY,Farhan Maulana,farhan.m@pln.co.id,Junior Engineer Jaringan,UPDL Palembang,PLN UP3 Metro,peserta',
            '9719012ZY,Gita Permatasari,gita.p@pln.co.id,Pelaksana Analis Efisiensi,UPDL Palembang,PLN ULP Bandarjaya,peserta',
            '8708155K,Ir. Kurniawan Santoso,kurniawan.s@pln.co.id,Manager Bagian Jaringan,UPDL Palembang,PLN UP3 Metro,atasan'
          ].join('\n');
          const blob = new Blob(['\uFEFF' + csvHeader + sampleRows], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'DAFTAR_RESPONDEN_TEMPLATE.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.showToast('Template DAFTAR_RESPONDEN_TEMPLATE.csv berhasil diunduh.', 'success');
        };

        // File Upload Reader (Excel / CSV parser)
        const fileInput = modalContainer.querySelector('#file-user-input');
        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

          if (isExcel && typeof window.XLSX !== 'undefined') {
            const reader = new FileReader();
            reader.onload = (evt) => {
              try {
                const data = new Uint8Array(evt.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonRows = window.XLSX.utils.sheet_to_json(worksheet);

                const rows = jsonRows.map(r => ({
                  nip: String(r.NIP || r.nip || '').trim(),
                  nama: String(r.Nama || r.nama || r['Nama Pegawai'] || '').trim(),
                  email: String(r.Email || r.email || '').trim(),
                  jabatan: String(r.Jabatan || r.jabatan || 'Pegawai').trim(),
                  updl: String(r.UPDL || r.updl || 'UPDL Palembang').trim(),
                  unit: String(r.Unit || r.unit || 'PLN UP3 Metro').trim(),
                  role: String(r.Role || r.role || 'peserta').trim().toLowerCase()
                }));

                parsedData = rows;
                renderModalContent();
                this.showToast(`Berhasil membaca ${rows.length} data dari file Excel ${file.name}.`, 'success');
              } catch (err) {
                this.showToast('Gagal membaca file Excel: ' + err.message, 'error');
              }
            };
            reader.readAsArrayBuffer(file);
          } else {
            const reader = new FileReader();
            reader.onload = (evt) => {
              try {
                const text = evt.target.result;
                const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
                if (lines.length < 2) throw new Error('File CSV kosong atau tidak memiliki baris data.');

                const delimiter = lines[0].includes(';') ? ';' : ',';
                const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));

                const rows = [];
                for (let i = 1; i < lines.length; i++) {
                  const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
                  if (cols.length < 2) continue;
                  const rowObj = {};
                  headers.forEach((h, idx) => {
                    rowObj[h] = cols[idx] || '';
                  });
                  rows.push({
                    nip: rowObj.nip || cols[0] || '',
                    nama: rowObj.nama || cols[1] || '',
                    email: rowObj.email || cols[2] || '',
                    jabatan: rowObj.jabatan || cols[3] || 'Pegawai',
                    updl: rowObj.updl || rowObj.kode_updl || cols[4] || 'UPDL Palembang',
                    unit: rowObj.unit || rowObj.nama_unit || cols[5] || 'PLN UP3 Metro',
                    role: rowObj.role || cols[6] || 'peserta'
                  });
                }

                parsedData = rows;
                renderModalContent();
                this.showToast(`Berhasil membaca ${rows.length} data dari file ${file.name}.`, 'success');
              } catch (err) {
                this.showToast('Gagal memproses file: ' + err.message, 'error');
              }
            };
            reader.readAsText(file);
          }
        };

        // Textarea Sync
        const jsonArea = modalContainer.querySelector('#import-json-data');
        if (jsonArea) {
          jsonArea.onchange = () => {
            try {
              const val = JSON.parse(jsonArea.value);
              if (Array.isArray(val)) {
                parsedData = val;
                renderModalContent();
              }
            } catch (err) {
              this.showToast('Format JSON tidak valid.', 'error');
            }
          };
        }

        // Execute Import
        modalContainer.querySelector('#btn-execute-import').onclick = () => {
          try {
            const mode = modalContainer.querySelector('#select-import-mode').value;
            const res = window.appStore.importUsers(parsedData, mode);
            closeModal();
            this.showToast(`Impor Selesai: ${res.added} baru, ${res.updated || 0} diperbarui, ${res.duplicates} duplikat dilewati.`, 'success');
            const mainContainer = document.getElementById('main-content-area');
            if (mainContainer) this.render(mainContainer);
          } catch (err) {
            this.showToast('Gagal eksekusi impor: ' + err.message, 'error');
          }
        };
      };

      renderModalContent();
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

