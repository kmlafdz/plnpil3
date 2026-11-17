/**
 * View: Pengaturan Sistem (PLN Corporate University)
 * Desain modern, bersih, dan relevan:
 * 1. Akun & Keamanan (Profil login aktif & Ubah Kata Sandi)
 * 2. Parameter Evaluasi (Bobot 3 perspektif & Target efektivitas pasca-diklat)
 * 3. Kop & Penandatangan (Identitas dokumen resmi & 3 pejabat pengesah)
 * 4. Cadangan & Cloud (Status koneksi Firestore, backup & restore JSON)
 */

(function () {
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  window.PengaturanView = {
    activeTab: 'akun', // 'akun' | 'evaluasi' | 'laporan' | 'database'
    securityCapabilities: null,
    securityStatus: null,
    _loadingSecurity: false,
    _securityProbed: false,

    render: function (container) {
      const s = window.appStore.getSettings() || {};
      const currentAuthUser = window.authManager ? window.authManager.getUser() : null;
      const target = s.target || { baseline: '70%', target: '85%', deadline: '90 Hari Pasca Diklat' };
      const bobot = s.bobot || { peserta: 30, atasan: 50, koordinator: 20 };
      const p = s.penandatangan || {
        internal: { jabatan: 'Koordinator Evaluasi Internal', nama: '', nip: '' },
        eksternal: { jabatan: 'Koordinator Evaluasi Eksternal (UPDL)', nama: '', nip: '' },
        mengetahui: { jabatan: 'Manager UPDL / Unit Terkait', nama: '', nip: '' }
      };

      const userRoleLabel = (currentAuthUser && currentAuthUser.role === 'developer')
        ? 'Developer Superadmin'
        : (currentAuthUser && currentAuthUser.isAdminPusat)
          ? 'Administrator Pusat'
          : (currentAuthUser ? currentAuthUser.role : 'Administrator');

      const userAvatar = (currentAuthUser && currentAuthUser.nama ? currentAuthUser.nama.charAt(0) : 'U').toUpperCase();

      container.innerHTML = `
        <div class="flex flex-col gap-6 max-w-5xl animate-fadeIn pb-12">

          <!-- Page Header -->
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                  PLN Corporate University
                </span>
                <span class="text-xs text-[#64748B] font-mono">Modul Konfigurasi Sistem</span>
              </div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">Pengaturan Sistem</h1>
              <p class="text-xs text-[#64748B]">
                Kelola profil akun, parameter penilaian Level 3, format pengesahan laporan, dan cadangan database cloud.
              </p>
            </div>
            
            <div class="flex items-center gap-2 self-start sm:self-auto">
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                <span class="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                Cloud Database Terhubung
              </span>
            </div>
          </div>

          <!-- Modern Tab Navigation -->
          <div class="flex border-b border-[#CBD5E1] gap-2 overflow-x-auto pb-px">
            <button type="button" class="setting-tab-btn px-4 py-2.5 font-medium text-xs md:text-sm transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${this.activeTab === 'akun' ? 'border-[#006876] text-[#006876] font-bold bg-[#F0FDFA]/50 rounded-t-lg' : 'border-transparent text-[#64748B] hover:text-[#172B3A]'}" data-tab="akun">
              <span class="material-symbols-outlined text-[18px] pointer-events-none">manage_accounts</span>
              <span class="pointer-events-none">Akun &amp; Keamanan</span>
            </button>

            <button type="button" class="setting-tab-btn px-4 py-2.5 font-medium text-xs md:text-sm transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${this.activeTab === 'evaluasi' ? 'border-[#006876] text-[#006876] font-bold bg-[#F0FDFA]/50 rounded-t-lg' : 'border-transparent text-[#64748B] hover:text-[#172B3A]'}" data-tab="evaluasi">
              <span class="material-symbols-outlined text-[18px] pointer-events-none">tune</span>
              <span class="pointer-events-none">Parameter Evaluasi</span>
            </button>

            <button type="button" class="setting-tab-btn px-4 py-2.5 font-medium text-xs md:text-sm transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${this.activeTab === 'laporan' ? 'border-[#006876] text-[#006876] font-bold bg-[#F0FDFA]/50 rounded-t-lg' : 'border-transparent text-[#64748B] hover:text-[#172B3A]'}" data-tab="laporan">
              <span class="material-symbols-outlined text-[18px] pointer-events-none">assignment</span>
              <span class="pointer-events-none">Kop &amp; Penandatangan</span>
            </button>

            <button type="button" class="setting-tab-btn px-4 py-2.5 font-medium text-xs md:text-sm transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${this.activeTab === 'database' ? 'border-[#006876] text-[#006876] font-bold bg-[#F0FDFA]/50 rounded-t-lg' : 'border-transparent text-[#64748B] hover:text-[#172B3A]'}" data-tab="database">
              <span class="material-symbols-outlined text-[18px] pointer-events-none">database</span>
              <span class="pointer-events-none">Cadangan &amp; Cloud</span>
            </button>
          </div>

          <!-- Dynamic Tab Content -->
          <div id="setting-tab-content">
            ${this.renderActiveTabContent(s, currentAuthUser, userRoleLabel, userAvatar, target, bobot, p)}
          </div>

        </div>
      `;

      this.attachEvents(container);
    },

    renderActiveTabContent: function (s, currentAuthUser, userRoleLabel, userAvatar, target, bobot, p) {
      if (this.activeTab === 'akun') {
        return this.renderTabAkun(currentAuthUser, userRoleLabel, userAvatar);
      } else if (this.activeTab === 'evaluasi') {
        return this.renderTabEvaluasi(target, bobot);
      } else if (this.activeTab === 'laporan') {
        return this.renderTabLaporan(s, p);
      } else {
        return this.renderTabDatabase();
      }
    },

    // ===== TAB 1: AKUN & KEAMANAN =====
    renderTabAkun: function (user, roleLabel, avatar) {
      const u = user || {};
      const isDev = u.role === 'developer';

      return `
        <div class="space-y-6">
          
          <!-- Card Info Profil -->
          <div class="card p-6 border border-[#CBD5E1] bg-white rounded-xl shadow-sm">
            <div class="flex items-center gap-2 pb-4 border-b border-[#F1F5F9] mb-4">
              <span class="material-symbols-outlined text-[#006876] text-[20px]">badge</span>
              <h2 class="text-sm font-bold text-[#172B3A]">Informasi Akun Masuk</h2>
            </div>

            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <!-- Avatar Box with Camera Badge & Hover Effect -->
              <div class="relative group cursor-pointer shrink-0" id="btn-change-avatar-profile" role="button" tabindex="0" title="Klik untuk mengubah foto profil / avatar">
                <div class="w-16 h-16 rounded-2xl ${isDev ? 'bg-[#7C3AED] text-white' : 'bg-[#006876] text-white'} flex items-center justify-center text-2xl font-bold shadow-md overflow-hidden ring-2 ring-transparent group-hover:ring-[#006876] transition-all">
                  ${u.avatar
                    ? `<img src="${u.avatar}" alt="${esc(u.nama)}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.textContent='${avatar}';" />`
                    : avatar}
                </div>
                <!-- Camera Badge Overlay -->
                <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#006876] text-white flex items-center justify-center shadow-md ring-2 ring-white group-hover:bg-[#004d57] transition-all">
                  <span class="material-symbols-outlined text-[13px]">photo_camera</span>
                </div>
              </div>

              <div class="flex-1 space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-base font-bold text-[#172B3A]">${esc(u.nama || 'Pengguna Sistem')}</h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isDev ? 'bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]' : 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'}">
                    ${roleLabel}
                  </span>
                </div>
                <div class="text-xs text-[#64748B] flex flex-wrap gap-x-4 gap-y-1 pt-1">
                  <span>NIP/Username: <b class="font-mono text-[#172B3A]">${esc(u.nip || u.username || '-')}</b></span>
                  <span>Unit: <b class="text-[#172B3A]">${esc(u.unit || u.unitName || 'PLN Corporate University')}</b></span>
                  <span>Email: <b class="text-[#172B3A]">${esc(u.email || (u.nip ? `${u.nip.toLowerCase()}@pln.co.id` : '-'))}</b></span>
                </div>
                <div class="pt-2">
                  <button type="button" id="btn-trigger-avatar-modal" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#172B3A] text-xs font-semibold rounded-lg border border-[#CBD5E1] transition-colors">
                    <span class="material-symbols-outlined text-[16px] text-[#006876]">account_circle</span>
                    <span>Ubah Avatar / Foto Profil</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Ubah Kata Sandi -->
          <div class="card p-6 border border-[#CBD5E1] bg-white rounded-xl shadow-sm">
            <div class="flex items-center justify-between pb-4 border-b border-[#F1F5F9] mb-4">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#006876] text-[20px]">lock_reset</span>
                <h2 class="text-sm font-bold text-[#172B3A]">Ubah Kata Sandi (Password)</h2>
              </div>
              <span class="text-[11px] text-[#64748B]">Amankan akun Anda dengan kata sandi terstandar</span>
            </div>

            <form id="form-change-password" class="max-w-xl space-y-4 text-xs">
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Kata Sandi Baru <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input type="password" id="input-new-password" required minlength="4" class="w-full border border-[#CBD5E1] rounded-lg px-3 py-2.5 pr-10 focus:border-[#006876] focus:ring-1 focus:ring-[#006876]/20 focus:outline-none" placeholder="Masukkan kata sandi baru (minimal 4 karakter)" />
                  <button type="button" class="btn-toggle-eye absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#172B3A]" data-target="input-new-password">
                    <span class="material-symbols-outlined text-[18px]">visibility</span>
                  </button>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Konfirmasi Kata Sandi Baru <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input type="password" id="input-confirm-password" required minlength="4" class="w-full border border-[#CBD5E1] rounded-lg px-3 py-2.5 pr-10 focus:border-[#006876] focus:ring-1 focus:ring-[#006876]/20 focus:outline-none" placeholder="Ketik ulang kata sandi baru" />
                  <button type="button" class="btn-toggle-eye absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#172B3A]" data-target="input-confirm-password">
                    <span class="material-symbols-outlined text-[18px]">visibility</span>
                  </button>
                </div>
              </div>

              <div class="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[11px] text-[#64748B] flex items-start gap-2">
                <span class="material-symbols-outlined text-[16px] text-[#006876] shrink-0 mt-0.5">info</span>
                <span>Kata sandi baru akan otomatis diperbarui di database lokal dan disinkronkan ke Cloud Firestore untuk akses masuk selanjutnya.</span>
              </div>

              <div class="pt-2 flex justify-start">
                <button type="submit" class="btn-primary flex items-center gap-2 py-2 px-4 shadow-sm">
                  <span class="material-symbols-outlined text-[16px]">save</span>
                  Perbarui Kata Sandi
                </button>
              </div>
            </form>
          </div>

          ${(u.role === 'developer' || u.role === 'admin' || u.isAdminPusat) ? (() => {
            const bioRecord = (window.FaceAuthManager && typeof window.FaceAuthManager.getBiometricForUser === 'function')
              ? window.FaceAuthManager.getBiometricForUser(u.id)
              : null;
            const secStatus = this.securityStatus;
            const caps = this.securityCapabilities;
            const isFaceEnrolled = Boolean((secStatus && secStatus.hasWebcamFace) || (bioRecord && bioRecord.status === 'AKTIF'));
            const passkeys = (secStatus && Array.isArray(secStatus.credentialsSummary)) ? secStatus.credentialsSummary : [];
            const platformSupported = caps ? caps.platformAuthenticatorAvailable : null;
            const webAuthnSupported = caps ? caps.webAuthnSupported : Boolean(window.PublicKeyCredential);
            const pdpConsentAt = (secStatus && secStatus.pdpConsentAt) || (bioRecord && bioRecord.pdpConsentAt) || null;

            return `
              <!-- Card Keamanan Biometrik Enterprise (Hybrid Adaptive Auth) -->
              <div id="admin-hybrid-security-card" class="card p-6 border border-[#CBD5E1] bg-white rounded-xl shadow-sm space-y-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F1F5F9] gap-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-[#006876] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <span class="material-symbols-outlined text-[24px]">shield_lock</span>
                    </div>
                    <div>
                      <h2 class="text-sm font-bold text-[#172B3A]">Autentikasi Biometrik Enterprise (Hybrid Adaptive Auth)</h2>
                      <p class="text-[11px] text-[#64748B]">Konfigurasi WebAuthn / Passkey (Windows Hello &amp; QR HP) serta Fallback Face Recognition Webcam Terenkripsi AES-256</p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    ${passkeys.length > 0 ? `
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                        <span class="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                        ${passkeys.length} Passkey Aktif
                      </span>
                    ` : ''}
                    ${isFaceEnrolled ? `
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                        <span class="w-1.5 h-1.5 rounded-full bg-[#0284C7]"></span>
                        Webcam Face Aktif
                      </span>
                    ` : ''}
                  </div>
                </div>

                <!-- 1. OPSI UTAMA: WEBAUTHN / PASSKEYS (WINDOWS HELLO & PASSKEY VIA HP QR) -->
                <div class="p-4 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-[#006876] text-[20px]">passkey</span>
                      <div>
                        <h3 class="text-xs font-bold text-[#172B3A]">Opsi Utama: WebAuthn / Passkeys (FIDO2)</h3>
                        <p class="text-[11px] text-[#64748B]">Autentikasi perangkat keras bebas spoofing dengan tanda tangan kriptografi asimetris</p>
                      </div>
                    </div>
                    <div id="webauthn-capability-badge">
                      ${platformSupported === null ? `
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#475569]">
                          Mendeteksi perangkat...
                        </span>
                      ` : platformSupported ? `
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                          <span class="material-symbols-outlined text-[14px]">check_circle</span>
                          Windows Hello / Touch ID Didukung
                        </span>
                      ` : `
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                          <span class="material-symbols-outlined text-[14px]">block</span>
                          Windows Hello Tidak Didukung di Perangkat Ini
                        </span>
                      `}
                    </div>
                  </div>

                  ${platformSupported === false ? `
                    <div class="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-[11px] text-[#92400E] flex items-start gap-2">
                      <span class="material-symbols-outlined text-[18px] text-[#D97706] shrink-0 mt-0.5">warning</span>
                      <div>
                        <b>Perangkat Kantor / Laptop Lama Terdeteksi:</b> Autentikator biometrik platform (Windows Hello / Touch ID) tidak tersedia pada perangkat ini.
                        Silakan gunakan opsi <b>"Passkey via HP (QR Code)"</b> atau aktifkan opsi cadangan <b>"Face Recognition via Webcam"</b> di bawah ini.
                      </div>
                    </div>
                  ` : ''}

                  <div class="flex flex-wrap items-center gap-2.5">
                    ${platformSupported ? `
                      <button type="button" id="btn-enroll-webauthn-platform" class="btn-primary flex items-center gap-1.5 py-2 px-4 shadow-sm text-xs">
                        <span class="material-symbols-outlined text-[16px]">fingerprint</span>
                        Aktifkan Windows Hello / Passkey Perangkat
                      </button>
                    ` : `
                      <button type="button" disabled title="Perangkat ini tidak mendukung Windows Hello / Platform Authenticator" class="btn-secondary opacity-60 cursor-not-allowed flex items-center gap-1.5 py-2 px-4 text-xs">
                        <span class="material-symbols-outlined text-[16px]">desktop_access_disabled</span>
                        Windows Hello Tidak Didukung
                      </button>
                    `}

                    ${webAuthnSupported ? `
                      <button type="button" id="btn-enroll-webauthn-hybrid" class="btn-secondary flex items-center gap-1.5 py-2 px-4 text-xs border-[#006876]/40 text-[#006876] hover:bg-[#F0FDFA]">
                        <span class="material-symbols-outlined text-[16px]">qr_code_2</span>
                        Gunakan Passkey via HP (QR Code)
                      </button>
                    ` : ''}
                  </div>

                  ${passkeys.length > 0 ? `
                    <div class="pt-3 border-t border-[#E2E8F0] space-y-2">
                      <div class="text-[11px] font-bold text-[#475569] uppercase tracking-wider">Passkey Terdaftar di Akun Ini</div>
                      <div class="divide-y divide-[#E2E8F0] bg-white rounded-lg border border-[#E2E8F0]">
                        ${passkeys.map(pk => `
                          <div class="p-3 flex items-center justify-between gap-3 text-xs">
                            <div class="flex items-center gap-2.5">
                              <span class="material-symbols-outlined text-[#006876] text-[18px]">${pk.attachmentType === 'cross-platform' ? 'smartphone' : 'laptop_windows'}</span>
                              <div>
                                <div class="font-bold text-[#172B3A]">${esc(pk.friendlyName || 'Passkey Perangkat')}</div>
                                <div class="text-[10px] text-[#64748B]">
                                  Tipe: <b>${pk.attachmentType === 'cross-platform' ? 'HP / Lintas Perangkat (QR)' : 'Perangkat Lokal (Platform)'}</b>
                                  • Didaftarkan: ${pk.createdAt ? new Date(pk.createdAt).toLocaleDateString('id-ID') : '-'}
                                  ${pk.lastUsedAt ? ` • Terakhir dipakai: ${new Date(pk.lastUsedAt).toLocaleDateString('id-ID')}` : ''}
                                </div>
                              </div>
                            </div>
                            <button type="button" class="btn-delete-passkey text-xs text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg border border-transparent hover:border-red-200 font-semibold transition-colors" data-cred-id="${esc(pk.id)}">
                              Cabut
                            </button>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>

                <!-- 2. OPSI CADANGAN: FACE RECOGNITION VIA WEBCAM (FALLBACK LAPTOP LAMA) -->
                <div class="p-4 rounded-xl border ${platformSupported === false ? 'border-[#006876] bg-[#F0FDFA]/40' : 'border-[#CBD5E1] bg-white'} space-y-3.5">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-[#0284C7] text-[20px]">face_retouching_natural</span>
                      <div>
                        <h3 class="text-xs font-bold text-[#172B3A]">Opsi Cadangan: Face Recognition via Webcam</h3>
                        <p class="text-[11px] text-[#64748B]">Fallback untuk perangkat tanpa Windows Hello. Verifikasi backend AES-256-GCM + Active Liveness 15 detik + Anti-OBS</p>
                      </div>
                    </div>
                    <div>
                      ${isFaceEnrolled ? `
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                          <span class="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                          Status: Wajah Terdaftar (AES-256)
                        </span>
                      ` : `
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                          <span class="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                          Status: Belum Didaftarkan
                        </span>
                      `}
                    </div>
                  </div>

                  <div class="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[11px] text-[#475569] space-y-1.5">
                    <div class="flex items-start gap-2">
                      <span class="material-symbols-outlined text-[#059669] text-[16px] shrink-0 mt-0.5">verified_user</span>
                      <span>
                        <b>Keamanan &amp; Kepatuhan UU PDP:</b> Foto wajah mentah tidak disimpan. Server hanya menyimpan vektor <i>face embedding</i> terenkripsi <b>AES-256-GCM</b> dengan pembatasan percobaan (maksimal 3x gagal -> lockout 15 menit -> alih ke Password + OTP).
                      </span>
                    </div>
                    ${isFaceEnrolled ? `
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E2E8F0]">
                        <div><span class="text-[#64748B]">Enkripsi:</span> <b class="font-mono text-[#172B3A]">${esc(bioRecord?.algorithm || 'AES-256-GCM-L3-v3')}</b></div>
                        <div><span class="text-[#64748B]">Persetujuan UU PDP:</span> <b class="text-[#059669]">${pdpConsentAt ? new Date(pdpConsentAt).toLocaleString('id-ID') : 'Tercatat'}</b></div>
                        <div><span class="text-[#64748B]">Waktu Pendaftaran:</span> <b class="text-[#172B3A]">${bioRecord?.enrolledAt ? new Date(bioRecord.enrolledAt).toLocaleDateString('id-ID') : '-'}</b></div>
                      </div>
                    ` : ''}
                  </div>

                  <div class="flex flex-wrap items-center gap-2.5">
                    ${isFaceEnrolled ? `
                      <button type="button" id="btn-re-enroll-face" class="btn-primary flex items-center gap-1.5 py-2 px-4 shadow-sm text-xs">
                        <span class="material-symbols-outlined text-[16px]">sync_saved_locally</span>
                        Ulangi Pendaftaran Wajah
                      </button>
                      <button type="button" id="btn-test-face-verification" class="btn-secondary flex items-center gap-1.5 py-2 px-4 text-xs">
                        <span class="material-symbols-outlined text-[16px]">videocam</span>
                        Uji Verifikasi &amp; Active Liveness
                      </button>
                      <button type="button" id="btn-delete-face" class="btn-secondary flex items-center gap-1.5 py-2 px-4 text-xs text-red-600 hover:bg-red-50 hover:border-red-200">
                        <span class="material-symbols-outlined text-[16px]">delete_forever</span>
                        Hapus Data Biometrik
                      </button>
                    ` : `
                      <button type="button" id="btn-enroll-face" class="btn-primary flex items-center gap-1.5 py-2 px-5 shadow-sm text-xs">
                        <span class="material-symbols-outlined text-[16px]">add_a_photo</span>
                        Aktifkan Face Recognition via Webcam
                      </button>
                    `}
                  </div>

                  ${isFaceEnrolled ? `
                    <div class="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[11px] flex items-center justify-between gap-2">
                      <span class="text-[#1E40AF]"><b>Cadangan Emergency Recovery Key:</b> Tersimpan dalam format hash SHA-256 salted.</span>
                      <button type="button" id="btn-view-recovery-info" class="text-[#1D4ED8] hover:underline font-semibold shrink-0">Info Recovery</button>
                    </div>
                  ` : ''}
                </div>

              </div>
            `;
          })() : ''}

        </div>
      `;
    },

    // ===== TAB 2: PARAMETER EVALUASI LEVEL 3 =====
    renderTabEvaluasi: function (target, bobot) {
      const bPeserta = Number(bobot.peserta) || 30;
      const bAtasan = Number(bobot.atasan) || 50;
      const bKoord = Number(bobot.koordinator) || 20;
      const totalBobot = bPeserta + bAtasan + bKoord;

      return `
        <form id="form-evaluasi-settings" class="space-y-6">
          
          <!-- Card Sasaran Efektivitas Pasca-Diklat -->
          <div class="card p-6 border border-[#CBD5E1] bg-white rounded-xl shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#006876] text-[20px]">flag</span>
                <h2 class="text-sm font-bold text-[#172B3A]">Sasaran Kinerja Efektivitas Pasca-Diklat</h2>
              </div>
              <span class="text-[11px] text-[#64748B]">Indikator Kirkpatrick Level 3 pada ringkasan laporan</span>
            </div>

            <p class="text-xs text-[#64748B]">
              Tentukan target capaian efektivitas perilaku kerja peserta setelah mengikuti program pelatihan. Data ini akan ditampilkan pada bagian ringkasan eksekutif laporan.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Baseline Kinerja Awal</label>
                <input type="text" id="set-target-baseline" class="w-full border border-[#CBD5E1] rounded-lg p-2.5 focus:border-[#006876] focus:outline-none" value="${esc(target.baseline)}" placeholder="Contoh: 70%" />
                <span class="text-[10px] text-[#94A3B8]">Capaian sebelum program diklat</span>
              </div>
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Target Efektivitas Akhir</label>
                <input type="text" id="set-target-target" class="w-full border border-[#CBD5E1] rounded-lg p-2.5 focus:border-[#006876] focus:outline-none" value="${esc(target.target)}" placeholder="Contoh: 85%" />
                <span class="text-[10px] text-[#94A3B8]">Target kelulusan / efektivitas</span>
              </div>
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Batas Waktu Evaluasi Siklus</label>
                <input type="text" id="set-target-deadline" class="w-full border border-[#CBD5E1] rounded-lg p-2.5 focus:border-[#006876] focus:outline-none" value="${esc(target.deadline)}" placeholder="Contoh: 90 Hari Pasca Diklat" />
                <span class="text-[10px] text-[#94A3B8]">Jangka waktu observasi perilaku</span>
              </div>
            </div>
          </div>

          <!-- Card Bobot Multi-Perspektif -->
          <div class="card p-6 border border-[#CBD5E1] bg-white rounded-xl shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#006876] text-[20px]">donut_large</span>
                <h2 class="text-sm font-bold text-[#172B3A]">Bobot Penilaian Multi-Perspektif (360°)</h2>
              </div>
              <span id="badge-total-bobot" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${totalBobot === 100 ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'}">
                Total: ${totalBobot}% ${totalBobot === 100 ? '✓ Seimbang' : '(! Harap 100%)'}
              </span>
            </div>

            <p class="text-xs text-[#64748B]">
              Perhitungan nilai akhir evaluasi Level 3 dihitung dari kombinasi berbobot tiga sumber penilaian:
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div class="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-[#0369A1]">1. Evaluasi Diri Peserta</span>
                  <span class="text-[11px] font-mono text-[#64748B]">Self-Assessment</span>
                </div>
                <div class="flex items-center gap-2">
                  <input type="number" id="input-bobot-peserta" min="0" max="100" class="input-bobot w-20 text-center font-bold font-mono text-sm border border-[#CBD5E1] rounded-lg p-2 focus:border-[#006876] focus:outline-none bg-white" value="${bPeserta}" />
                  <span class="font-bold text-[#172B3A]">%</span>
                </div>
                <p class="text-[11px] text-[#64748B]">Refleksi mandiri penerapan materi pasca-pelatihan.</p>
              </div>

              <div class="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-[#B45309]">2. Atasan Langsung</span>
                  <span class="text-[11px] font-mono text-[#64748B]">Direct Supervisor</span>
                </div>
                <div class="flex items-center gap-2">
                  <input type="number" id="input-bobot-atasan" min="0" max="100" class="input-bobot w-20 text-center font-bold font-mono text-sm border border-[#CBD5E1] rounded-lg p-2 focus:border-[#006876] focus:outline-none bg-white" value="${bAtasan}" />
                  <span class="font-bold text-[#172B3A]">%</span>
                </div>
                <p class="text-[11px] text-[#64748B]">Observasi perilaku dan perubahan kinerja riil di lapangan.</p>
              </div>

              <div class="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-[#7E22CE]">3. Koordinator Diklat</span>
                  <span class="text-[11px] font-mono text-[#64748B]">Program Coordinator</span>
                </div>
                <div class="flex items-center gap-2">
                  <input type="number" id="input-bobot-koord" min="0" max="100" class="input-bobot w-20 text-center font-bold font-mono text-sm border border-[#CBD5E1] rounded-lg p-2 focus:border-[#006876] focus:outline-none bg-white" value="${bKoord}" />
                  <span class="font-bold text-[#172B3A]">%</span>
                </div>
                <p class="text-[11px] text-[#64748B]">Validasi bukti portofolio dan kelengkapan butir evaluasi.</p>
              </div>
            </div>

            <!-- Progress Bar Preview -->
            <div class="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden flex mt-2">
              <div id="bar-peserta" class="bg-[#0284C7] h-full transition-all" style="width: ${bPeserta}%;"></div>
              <div id="bar-atasan" class="bg-[#F59E0B] h-full transition-all" style="width: ${bAtasan}%;"></div>
              <div id="bar-koord" class="bg-[#9333EA] h-full transition-all" style="width: ${bKoord}%;"></div>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button type="submit" class="btn-primary flex items-center gap-2 py-2 px-5 shadow-sm">
              <span class="material-symbols-outlined text-[16px]">save</span>
              Simpan Parameter Evaluasi
            </button>
          </div>

        </form>
      `;
    },

    // ===== TAB 3: KOP & PENANDATANGAN =====
    renderTabLaporan: function (s, p) {
      return `
        <form id="form-laporan-settings" class="space-y-6">
          
          <!-- Card Kop Laporan -->
          <div class="card p-6 border border-[#CBD5E1] bg-white rounded-xl shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#006876] text-[20px]">corporate_fare</span>
                <h2 class="text-sm font-bold text-[#172B3A]">Identitas Kop Dokumen Laporan</h2>
              </div>
              <span class="text-[11px] text-[#64748B]">Ditampilkan pada kop lembar cetak laporan & PDF</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Nama Instansi Induk</label>
                <input type="text" id="set-instansi" class="w-full border border-[#CBD5E1] rounded-lg p-2.5 focus:border-[#006876] focus:outline-none" value="${esc(s.instansi || 'PT PLN (Persero) Corporate University')}" placeholder="Contoh: PT PLN (Persero) Corporate University" />
              </div>
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Unit Penyelenggara Pendidikan</label>
                <input type="text" id="set-unit" class="w-full border border-[#CBD5E1] rounded-lg p-2.5 focus:border-[#006876] focus:outline-none" value="${esc(s.unitPelaksana || 'Pusat Pendidikan dan Pelatihan')}" placeholder="Contoh: Unit Pelaksana Pendidikan dan Pelatihan (UPDL)" />
              </div>
            </div>
          </div>

          <!-- Card Penandatangan Resmi -->
          <div class="card p-6 border border-[#CBD5E1] bg-white rounded-xl shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#006876] text-[20px]">draw</span>
                <h2 class="text-sm font-bold text-[#172B3A]">Pejabat Penandatangan Laporan Evaluasi</h2>
              </div>
              <span class="text-[11px] text-[#64748B]">Kolom tanda tangan dan pengesahan resmi laporan</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              <!-- Penandatangan 1: Internal -->
              <div class="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl space-y-3">
                <div class="flex items-center gap-2 text-[#006876] font-bold text-xs uppercase tracking-wide pb-2 border-b border-[#E2E8F0]">
                  <span class="w-2 h-2 rounded-full bg-[#006876]"></span>
                  Koordinator Internal
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#475569] mb-1">Jabatan Penandatangan</label>
                  <input type="text" id="set-internal-jabatan" class="w-full border border-[#CBD5E1] rounded p-2 bg-white focus:border-[#006876] focus:outline-none" value="${esc(p.internal?.jabatan || 'Koordinator Evaluasi Internal')}" />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#475569] mb-1">Nama Lengkap &amp; Gelar</label>
                  <input type="text" id="set-internal-nama" class="w-full border border-[#CBD5E1] rounded p-2 bg-white focus:border-[#006876] focus:outline-none" value="${esc(p.internal?.nama || '')}" placeholder="Nama pejabat internal..." />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#475569] mb-1">NIP Pegawai</label>
                  <input type="text" id="set-internal-nip" class="w-full border border-[#CBD5E1] rounded p-2 bg-white font-mono focus:border-[#006876] focus:outline-none" value="${esc(p.internal?.nip || '')}" placeholder="Contoh: 8909014M" />
                </div>
              </div>

              <!-- Penandatangan 2: Eksternal UPDL -->
              <div class="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl space-y-3">
                <div class="flex items-center gap-2 text-[#006876] font-bold text-xs uppercase tracking-wide pb-2 border-b border-[#E2E8F0]">
                  <span class="w-2 h-2 rounded-full bg-[#006876]"></span>
                  Koordinator Eksternal (UPDL)
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#475569] mb-1">Jabatan Penandatangan</label>
                  <input type="text" id="set-eksternal-jabatan" class="w-full border border-[#CBD5E1] rounded p-2 bg-white focus:border-[#006876] focus:outline-none" value="${esc(p.eksternal?.jabatan || 'Koordinator Evaluasi Eksternal')}" />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#475569] mb-1">Nama Lengkap &amp; Gelar</label>
                  <input type="text" id="set-eksternal-nama" class="w-full border border-[#CBD5E1] rounded p-2 bg-white focus:border-[#006876] focus:outline-none" value="${esc(p.eksternal?.nama || '')}" placeholder="Nama koordinator UPDL..." />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#475569] mb-1">NIP Pegawai</label>
                  <input type="text" id="set-eksternal-nip" class="w-full border border-[#CBD5E1] rounded p-2 bg-white font-mono focus:border-[#006876] focus:outline-none" value="${esc(p.eksternal?.nip || '')}" placeholder="Contoh: 8810743Z" />
                </div>
              </div>

              <!-- Penandatangan 3: Mengetahui (Pimpinan) -->
              <div class="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl space-y-3">
                <div class="flex items-center gap-2 text-[#006876] font-bold text-xs uppercase tracking-wide pb-2 border-b border-[#E2E8F0]">
                  <span class="w-2 h-2 rounded-full bg-[#006876]"></span>
                  Mengetahui (Pimpinan Unit)
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#475569] mb-1">Jabatan Pimpinan</label>
                  <input type="text" id="set-mengetahui-jabatan" class="w-full border border-[#CBD5E1] rounded p-2 bg-white focus:border-[#006876] focus:outline-none" value="${esc(p.mengetahui?.jabatan || 'Manager UPDL / Unit Terkait')}" />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#475569] mb-1">Nama Lengkap &amp; Gelar</label>
                  <input type="text" id="set-mengetahui-nama" class="w-full border border-[#CBD5E1] rounded p-2 bg-white focus:border-[#006876] focus:outline-none" value="${esc(p.mengetahui?.nama || '')}" placeholder="Nama pimpinan unit..." />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#475569] mb-1">NIP Pegawai</label>
                  <input type="text" id="set-mengetahui-nip" class="w-full border border-[#CBD5E1] rounded p-2 bg-white font-mono focus:border-[#006876] focus:outline-none" value="${esc(p.mengetahui?.nip || '')}" placeholder="Contoh: 8508111A" />
                </div>
              </div>

            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button type="submit" class="btn-primary flex items-center gap-2 py-2 px-5 shadow-sm">
              <span class="material-symbols-outlined text-[16px]">save</span>
              Simpan Identitas Laporan
            </button>
          </div>

        </form>
      `;
    },

    // ===== TAB 4: DATABASE & CADANGAN DATA =====
    renderTabDatabase: function () {
      const usersCount = (window.appStore.getUsers() || []).length;
      const updlsCount = (window.appStore.getUpdls() || []).length;
      const unitsCount = (window.appStore.getUnits() || []).length;
      const butirCount = (window.appStore.getBankButirList() || []).length;
      const respCount = (window.appStore.respondents || []).length;

      return `
        <div class="space-y-6">
          
          <!-- Card Status Cloud Database -->
          <div class="card p-6 border border-[#CBD5E1] bg-white rounded-xl shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#006876] text-[20px]">cloud_sync</span>
                <h2 class="text-sm font-bold text-[#172B3A]">Konektivitas Cloud Database Firestore</h2>
              </div>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                <span class="w-2 h-2 rounded-full bg-[#10B981]"></span>
                Status: Aktif &amp; Terhubung
              </span>
            </div>

            <p class="text-xs text-[#64748B]">
              Sistem menggunakan <b>Google Cloud Firestore</b> sebagai basis data terpusat, dengan penyimpanan offline lokal cadangan di peramban (LocalStorage).
            </p>

            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs pt-1">
              <div class="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                <div class="text-[10px] uppercase font-bold text-[#64748B]">Data Pengguna</div>
                <div class="text-xl font-bold font-mono text-[#006876] mt-1">${usersCount}</div>
              </div>
              <div class="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                <div class="text-[10px] uppercase font-bold text-[#64748B]">Master UPDL</div>
                <div class="text-xl font-bold font-mono text-[#006876] mt-1">${updlsCount}</div>
              </div>
              <div class="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                <div class="text-[10px] uppercase font-bold text-[#64748B]">Master Unit</div>
                <div class="text-xl font-bold font-mono text-[#006876] mt-1">${unitsCount}</div>
              </div>
              <div class="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                <div class="text-[10px] uppercase font-bold text-[#64748B]">Bank Butir</div>
                <div class="text-xl font-bold font-mono text-[#006876] mt-1">${butirCount}</div>
              </div>
              <div class="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                <div class="text-[10px] uppercase font-bold text-[#64748B]">Peserta Diklat</div>
                <div class="text-xl font-bold font-mono text-[#006876] mt-1">${respCount}</div>
              </div>
            </div>
          </div>

          <!-- Card Ekspor & Pemulihan -->
          <div class="card p-6 border border-[#CBD5E1] bg-white rounded-xl shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#006876] text-[20px]">inventory_2</span>
                <h2 class="text-sm font-bold text-[#172B3A]">Cadangan &amp; Pemulihan Data (Backup &amp; Restore)</h2>
              </div>
              <span class="text-[11px] text-[#64748B]">Format arsip aman JSON</span>
            </div>

            <p class="text-xs text-[#64748B]">
              Simpan seluruh konfigurasi sistem, akun pengguna, penilaian evaluasi, dan master organisasi ke file JSON terkompresi untuk arsip cadangan berkala atau migrasi.
            </p>

            <div class="flex flex-wrap items-center gap-3 pt-2">
              <button type="button" id="btn-backup-data" class="btn-primary flex items-center gap-1.5 py-2 px-4 shadow-sm">
                <span class="material-symbols-outlined text-[16px]">download</span>
                Unduh Cadangan Lengkap (.JSON)
              </button>

              <button type="button" id="btn-restore-data" class="btn-secondary flex items-center gap-1.5 py-2 px-4">
                <span class="material-symbols-outlined text-[16px]">upload_file</span>
                Pulihkan dari File Cadangan
              </button>
              <input id="input-restore-file" type="file" accept="application/json,.json" class="hidden" />

              <button type="button" id="btn-sync-refresh" class="btn-secondary flex items-center gap-1.5 py-2 px-4 sm:ml-auto text-[#0284C7] hover:bg-[#E0F2FE]">
                <span class="material-symbols-outlined text-[16px]">sync</span>
                Segarkan Sinkronisasi Cloud
              </button>
            </div>
          </div>

        </div>
      `;
    },

    // ===== EVENT LISTENERS =====
    attachEvents: function (container) {
      // 1. Tab Switching
      container.querySelectorAll('.setting-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const targetTab = btn.getAttribute('data-tab');
          if (targetTab && this.activeTab !== targetTab) {
            this.activeTab = targetTab;
            this.render(container);
          }
        });
      });

      // 2. Toggle Eye for Password Inputs
      container.querySelectorAll('.btn-toggle-eye').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-target');
          const input = container.querySelector(`#${targetId}`);
          if (input) {
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            btn.querySelector('.material-symbols-outlined').textContent = isPass ? 'visibility_off' : 'visibility';
          }
        });
      });

      // 3A. Tab Akun: Trigger Modal Ubah Avatar
      const triggerAvatarModal = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (window.AvatarManager && typeof window.AvatarManager.openAvatarModal === 'function') {
          window.AvatarManager.openAvatarModal({
            onSave: () => this.render(container)
          });
        }
      };
      const btnAvatarProfile = container.querySelector('#btn-change-avatar-profile');
      if (btnAvatarProfile) {
        btnAvatarProfile.addEventListener('click', triggerAvatarModal);
        btnAvatarProfile.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            triggerAvatarModal(e);
          }
        });
      }
      container.querySelector('#btn-trigger-avatar-modal')?.addEventListener('click', triggerAvatarModal);

      // 3B. Tab Akun: Form Ubah Password
      const formPass = container.querySelector('#form-change-password');
      if (formPass) {
        formPass.addEventListener('submit', (e) => {
          e.preventDefault();
          const newPass = (container.querySelector('#input-new-password')?.value || '').trim();
          const confirmPass = (container.querySelector('#input-confirm-password')?.value || '').trim();

          if (!newPass || !confirmPass) {
            window.App.showToast('Silakan isi kata sandi baru dan konfirmasi.', 'error');
            return;
          }

          if (newPass !== confirmPass) {
            window.App.showToast('Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.', 'error');
            return;
          }

          if (newPass.length < 4) {
            window.App.showToast('Kata sandi minimal harus 4 karakter.', 'error');
            return;
          }

          const currentAuthUser = window.authManager ? window.authManager.getUser() : null;
          if (!currentAuthUser) {
            window.App.showToast('Sesi masuk tidak valid.', 'error');
            return;
          }

          try {
            // Update password user di store
            window.appStore.updateUser(currentAuthUser.id, { password: newPass });
            // Update password di session auth
            currentAuthUser.password = newPass;
            window.authManager.saveSession(currentAuthUser);

            formPass.reset();
            window.App.showToast('Kata sandi akun Anda berhasil diperbarui!', 'success');
          } catch (err) {
            window.App.showToast(`Gagal memperbarui kata sandi: ${err.message}`, 'error');
          }
        });
      }

      // 3B. Tab Akun: Event Listener Keamanan Biometrik Enterprise (WebAuthn + Webcam AES-256)
      const currentAuthUser = window.authManager ? window.authManager.getUser() : null;
      const isAdminOrDev = currentAuthUser && (currentAuthUser.role === 'developer' || currentAuthUser.role === 'admin' || currentAuthUser.isAdminPusat);

      if (this.activeTab === 'akun' && isAdminOrDev && window.FaceAuthManager && !this._securityProbed && !this._loadingSecurity) {
        this._securityProbed = true;
        this._loadingSecurity = true;
        Promise.all([
          window.FaceAuthManager.getDeviceBiometricCapabilities().catch(() => ({ webAuthnSupported: false, platformAuthenticatorAvailable: false })),
          window.FaceAuthManager.fetchSecurityStatus().catch(() => null)
        ]).then(([caps, status]) => {
          this.securityCapabilities = caps || { webAuthnSupported: false, platformAuthenticatorAvailable: false };
          this.securityStatus = status || { fallback: true, hasWebcamFace: false, credentialsSummary: [] };
        }).catch(() => {
          this.securityCapabilities = { webAuthnSupported: false, platformAuthenticatorAvailable: false };
          this.securityStatus = { fallback: true, hasWebcamFace: false, credentialsSummary: [] };
        }).finally(() => {
          this._loadingSecurity = false;
          if (this.activeTab === 'akun' && container.querySelector('#admin-hybrid-security-card')) {
            this.render(container);
          }
        });
      }

      const refreshSecurityView = async () => {
        if (window.FaceAuthManager) {
          try {
            const status = await window.FaceAuthManager.fetchSecurityStatus();
            this.securityStatus = status || { fallback: true, hasWebcamFace: false, credentialsSummary: [] };
          } catch (e) {
            this.securityStatus = { fallback: true, hasWebcamFace: false, credentialsSummary: [] };
          }
        }
        this._securityProbed = true;
        this.render(container);
      };

      const btnEnrollWebAuthnPlatform = container.querySelector('#btn-enroll-webauthn-platform');
      if (btnEnrollWebAuthnPlatform) {
        btnEnrollWebAuthnPlatform.addEventListener('click', async () => {
          btnEnrollWebAuthnPlatform.disabled = true;
          try {
            const res = await window.FaceAuthManager.registerPasskey('platform', 'Windows Hello / Passkey Perangkat');
            window.App.showToast(`Passkey "${res.friendlyName}" berhasil diaktifkan!`, 'success');
            await refreshSecurityView();
          } catch (err) {
            window.App.showToast(err.message, 'error');
            btnEnrollWebAuthnPlatform.disabled = false;
          }
        });
      }

      const btnEnrollWebAuthnHybrid = container.querySelector('#btn-enroll-webauthn-hybrid');
      if (btnEnrollWebAuthnHybrid) {
        btnEnrollWebAuthnHybrid.addEventListener('click', async () => {
          btnEnrollWebAuthnHybrid.disabled = true;
          try {
            const res = await window.FaceAuthManager.registerPasskey('cross-platform', 'Passkey HP (QR Code)');
            window.App.showToast(`Passkey Lintas Perangkat "${res.friendlyName}" berhasil didaftarkan!`, 'success');
            await refreshSecurityView();
          } catch (err) {
            window.App.showToast(err.message, 'error');
            btnEnrollWebAuthnHybrid.disabled = false;
          }
        });
      }

      container.querySelectorAll('.btn-delete-passkey').forEach(btn => {
        btn.addEventListener('click', async () => {
          const credId = btn.getAttribute('data-cred-id');
          if (!credId) return;
          window.App.showModal({
            title: 'Cabut Kredensial Passkey',
            content: '<p class="text-xs text-[#172B3A]">Passkey yang dicabut tidak lagi bisa digunakan untuk login ke Konsol Admin.</p>',
            confirmText: 'Ya, Cabut Passkey',
            cancelText: 'Batal',
            onConfirm: async () => {
              try {
                await window.FaceAuthManager.deletePasskey(credId);
                window.App.showToast('Passkey berhasil dicabut.', 'success');
                await refreshSecurityView();
                return true;
              } catch (err) {
                window.App.showToast(err.message, 'error');
                return false;
              }
            }
          });
        });
      });

      const btnEnroll = container.querySelector('#btn-enroll-face');
      const btnReEnroll = container.querySelector('#btn-re-enroll-face');
      const triggerEnroll = () => {
        if (!currentAuthUser) return;
        window.FaceAuthManager.startEnrollmentFlow(currentAuthUser, async (enrollResult) => {
          await refreshSecurityView();
          if (enrollResult && enrollResult.recoveryCode) {
            window.App.showModal({
              title: 'Kode Pemulihan Darurat & Bukti UU PDP',
              content: `
                <div class="space-y-3 text-xs text-[#172B3A]">
                  <div class="p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg text-[#065F46]">
                    <b>Persetujuan UU PDP Tercatat:</b> ${enrollResult.pdpConsentAt ? new Date(enrollResult.pdpConsentAt).toLocaleString('id-ID') : 'Tercatat'}
                  </div>
                  <p>Template wajah berhasil dienkripsi (<b>AES-256-GCM</b>) dan disimpan di server. Simpan <b>Kode Pemulihan Darurat (16-Karakter)</b> ini:</p>
                  <div class="p-3 bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-center font-mono font-bold text-sm tracking-widest text-[#006876]">
                    ${enrollResult.recoveryCode}
                  </div>
                </div>
              `,
              confirmText: 'Saya Telah Menyimpan Kode Ini',
              onConfirm: () => true
            });
          }
        });
      };
      if (btnEnroll) btnEnroll.addEventListener('click', triggerEnroll);
      if (btnReEnroll) btnReEnroll.addEventListener('click', triggerEnroll);

      const btnDeleteFace = container.querySelector('#btn-delete-face');
      if (btnDeleteFace) {
        btnDeleteFace.addEventListener('click', () => {
          if (!currentAuthUser) return;
          window.App.showModal({
            title: 'Hapus Data Biometrik Wajah',
            content: `
              <div class="space-y-3 text-xs text-[#172B3A]">
                <p>Apakah Anda yakin ingin menghapus data biometrik wajah terenkripsi akun <b>${esc(currentAuthUser.nama || currentAuthUser.username)}</b>?</p>
                <div class="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-[#991B1B] text-[11px] leading-relaxed">
                  <b>Peringatan:</b> Vektor wajah AES-256 akan dihapus permanen dari database backend sesuai hak penghapusan data UU PDP.
                </div>
              </div>
            `,
            confirmText: 'Ya, Hapus Data Biometrik',
            cancelText: 'Batalkan',
            onConfirm: async () => {
              await window.FaceAuthManager.deleteBiometricData(currentAuthUser);
              window.App.showToast('Data biometrik wajah berhasil dihapus permanen.', 'success');
              await refreshSecurityView();
              return true;
            }
          });
        });
      }

      const btnTestFace = container.querySelector('#btn-test-face-verification');
      if (btnTestFace) {
        btnTestFace.addEventListener('click', () => {
          if (!currentAuthUser) return;
          window.FaceAuthManager.openFaceVerificationModal({
            title: 'Uji Verifikasi Wajah & Active Liveness (15s)',
            user: currentAuthUser,
            mode: 'stepup',
            onSuccess: () => {
              window.App.showToast('Verifikasi wajah & active liveness tervalidasi oleh backend!', 'success');
            }
          });
        });
      }

      const btnRecoveryInfo = container.querySelector('#btn-view-recovery-info');
      if (btnRecoveryInfo) {
        btnRecoveryInfo.addEventListener('click', () => {
          window.App.showModal({
            title: 'Informasi Pemulihan Darurat Biometrik',
            content: `
              <div class="space-y-3 text-xs text-[#172B3A]">
                <p>Kode Pemulihan Darurat (Emergency Recovery Key) dibuat kriptografis saat pendaftaran wajah dan hanya disimpan hash SHA-256 salted-nya di server.</p>
                <div class="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-[#1E40AF]">
                  Jika terjadi lockout 15 menit setelah 3x gagal wajah, Anda juga dapat masuk menggunakan jalur fallback <b>Password + OTP</b>.
                </div>
              </div>
            `,
            confirmText: 'Mengerti',
            onConfirm: () => true
          });
        });
      }

      // 4. Tab Evaluasi: Real-Time Dynamic Total Bobot
      const inputPeserta = container.querySelector('#input-bobot-peserta');
      const inputAtasan = container.querySelector('#input-bobot-atasan');
      const inputKoord = container.querySelector('#input-bobot-koord');

      const updateBobotUI = () => {
        const bp = Number(inputPeserta?.value) || 0;
        const ba = Number(inputAtasan?.value) || 0;
        const bk = Number(inputKoord?.value) || 0;
        const tot = bp + ba + bk;

        const badge = container.querySelector('#badge-total-bobot');
        if (badge) {
          badge.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${tot === 100 ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'}`;
          badge.textContent = `Total: ${tot}% ${tot === 100 ? '✓ Seimbang' : '(! Harap 100%)'}`;
        }

        const barP = container.querySelector('#bar-peserta');
        const barA = container.querySelector('#bar-atasan');
        const barK = container.querySelector('#bar-koord');
        if (barP) barP.style.width = `${Math.min(100, Math.max(0, bp))}%`;
        if (barA) barA.style.width = `${Math.min(100, Math.max(0, ba))}%`;
        if (barK) barK.style.width = `${Math.min(100, Math.max(0, bk))}%`;
      };

      if (inputPeserta) inputPeserta.addEventListener('input', updateBobotUI);
      if (inputAtasan) inputAtasan.addEventListener('input', updateBobotUI);
      if (inputKoord) inputKoord.addEventListener('input', updateBobotUI);

      // 5. Tab Evaluasi: Submit Form
      const formEvaluasi = container.querySelector('#form-evaluasi-settings');
      if (formEvaluasi) {
        formEvaluasi.addEventListener('submit', (e) => {
          e.preventDefault();
          const bp = Number(inputPeserta?.value) || 0;
          const ba = Number(inputAtasan?.value) || 0;
          const bk = Number(inputKoord?.value) || 0;
          const tot = bp + ba + bk;

          if (tot !== 100) {
            window.App.showToast(`Total bobot harus bernilai tepat 100% (saat ini ${tot}%).`, 'error');
            return;
          }

          const patch = {
            target: {
              baseline: (container.querySelector('#set-target-baseline')?.value || '').trim(),
              target: (container.querySelector('#set-target-target')?.value || '').trim(),
              deadline: (container.querySelector('#set-target-deadline')?.value || '').trim()
            },
            bobot: {
              peserta: bp,
              atasan: ba,
              koordinator: bk
            }
          };

          window.appStore.updateSettings(patch);
          window.App.showToast('Parameter evaluasi berhasil disimpan!', 'success');
        });
      }

      // 6. Tab Laporan: Submit Form
      const formLaporan = container.querySelector('#form-laporan-settings');
      if (formLaporan) {
        formLaporan.addEventListener('submit', (e) => {
          e.preventDefault();
          const patch = {
            instansi: (container.querySelector('#set-instansi')?.value || '').trim(),
            unitPelaksana: (container.querySelector('#set-unit')?.value || '').trim(),
            penandatangan: {
              internal: {
                jabatan: (container.querySelector('#set-internal-jabatan')?.value || '').trim(),
                nama: (container.querySelector('#set-internal-nama')?.value || '').trim(),
                nip: (container.querySelector('#set-internal-nip')?.value || '').trim()
              },
              eksternal: {
                jabatan: (container.querySelector('#set-eksternal-jabatan')?.value || '').trim(),
                nama: (container.querySelector('#set-eksternal-nama')?.value || '').trim(),
                nip: (container.querySelector('#set-eksternal-nip')?.value || '').trim()
              },
              mengetahui: {
                jabatan: (container.querySelector('#set-mengetahui-jabatan')?.value || '').trim(),
                nama: (container.querySelector('#set-mengetahui-nama')?.value || '').trim(),
                nip: (container.querySelector('#set-mengetahui-nip')?.value || '').trim()
              }
            }
          };

          window.appStore.updateSettings(patch);
          window.App.showToast('Identitas dan penandatangan laporan berhasil disimpan!', 'success');
        });
      }

      // 7. Tab Database: Backup Data (JSON)
      const btnBackup = container.querySelector('#btn-backup-data');
      if (btnBackup) {
        btnBackup.addEventListener('click', () => {
          try {
            const backupPayload = window.appStore.exportBackup();
            const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_pln_corpu_eval3_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            window.App.showToast('File cadangan database berhasil diunduh.', 'success');
          } catch (err) {
            window.App.showToast(`Gagal mengunduh cadangan: ${err.message}`, 'error');
          }
        });
      }

      // 8. Tab Database: Restore Data (JSON)
      const btnRestore = container.querySelector('#btn-restore-data');
      const fileInput = container.querySelector('#input-restore-file');
      if (btnRestore && fileInput) {
        btnRestore.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = () => {
            let payload;
            try {
              payload = JSON.parse(reader.result);
            } catch (err) {
              window.App.showToast('Format file JSON tidak dapat dibaca.', 'error');
              return;
            }

            window.App.showModal({
              title: 'Konfirmasi Pemulihan Data Cadangan',
              content: `
                <div class="space-y-3 text-xs text-[#172B3A]">
                  <p>Apakah Anda yakin ingin memulihkan data sistem dari file <b>${esc(file.name)}</b>?</p>
                  <div class="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded text-[#92400E]">
                    <b>Perhatian:</b> Data pengguna, master organisasi, dan penugasan yang ada saat ini akan digantikan oleh isi file cadangan.
                  </div>
                </div>
              `,
              confirmText: 'Ya, Pulihkan Database',
              cancelText: 'Batal',
              onConfirm: () => {
                const executeRestore = () => {
                  try {
                    window.appStore.importBackup(payload);
                    window.App.showToast('Data database berhasil dipulihkan dari cadangan!', 'success');
                    this.render(container);
                  } catch (err) {
                    window.App.showToast(err.message, 'error');
                  }
                };

                if (window.FaceAuthManager) {
                  window.FaceAuthManager.requireSensitiveActionAuth('Pemulihan Database dari Cadangan', executeRestore);
                } else {
                  executeRestore();
                }
                return true;
              }
            });
          };
          reader.readAsText(file);
          e.target.value = '';
        });
      }

      // 9. Tab Database: Segarkan Sinkronisasi Cloud
      const btnSyncRefresh = container.querySelector('#btn-sync-refresh');
      if (btnSyncRefresh) {
        btnSyncRefresh.addEventListener('click', () => {
          if (window.appStore.initFirestoreSync) {
            window.appStore.initFirestoreSync();
          }
          if (window.appStore.initMariaDBSync) {
            window.appStore.initMariaDBSync();
          }
          window.App.showToast('Sinkronisasi cloud Firestore diperbarui.', 'success');
          this.render(container);
        });
      }
    }
  };
})();
