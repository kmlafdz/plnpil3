/**
 * View: Login Page (Full Screen Enterprise Layout)
 * Memisahkan Portal Login Pegawai (Otomatis deteksi role berdasarkan NIP)
 * dan Portal Konsol Administrator & Developer (/plncorpuadmin)
 * Didesain responsif penuh untuk Desktop dan Mobile
 */

(function () {
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  window.LoginView = {
    adminAuthState: {
      step: 'identify', // 'identify' | 'biometric' | 'password' | 'otp_fallback'
      identifier: '',
      identifyData: null,
      otpChallengeId: null,
      otpMaskedTarget: '',
      sandboxOtpPreview: null,
      lockInfo: null,
      autoTriggeredOnce: false
    },

    resetAdminAuthState: function () {
      this.adminAuthState = {
        step: 'identify',
        identifier: '',
        identifyData: null,
        otpChallengeId: null,
        otpMaskedTarget: '',
        sandboxOtpPreview: null,
        lockInfo: null,
        autoTriggeredOnce: false
      };
    },

    isAdminRoute: function () {
      const path = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();
      return path.includes('plncorpuadmin') || hash.includes('plncorpuadmin');
    },

    render: function (container) {
      if (this.isAdminRoute()) {
        this.renderAdminPortal(container);
      } else {
        this.renderUserPortal(container);
      }
      this.attachEvents(container);
    },

    // =========================================================================
    // 1. PORTAL LOGIN PEGAWAI (Login berbasis NIP otomatis deteksi Role)
    // =========================================================================
    renderUserPortal: function (container) {
      container.innerHTML = `
        <div class="w-full min-h-screen flex flex-col lg:flex-row bg-[#172B3A] lg:bg-[#F1F5F9]">
          
          <!-- Header Ringkas Khusus Mobile (< lg) dengan Latar Biru Korporat -->
          <div class="block lg:hidden text-center pt-8 pb-4 px-4 shrink-0 text-white">
            <div class="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white p-2.5 shadow-md border border-white/20 mb-2.5">
              <img src="logo.png" alt="Logo PLN" class="h-10 w-auto object-contain" onerror="this.onerror=null; this.src='https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png';" />
            </div>
            <div class="text-[11px] font-bold tracking-wider uppercase text-[#23C4DB]">
              PT PLN (Persero) • PLN Corporate University
            </div>
            <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
              Evaluasi Level 3 (Behavior)
            </h1>
            <p class="text-xs text-[#94A3B8] mt-0.5 font-medium">
              PLN Impact Lab
            </p>
          </div>

          <!-- Panel Kiri: Identitas Resmi Program (Hanya tampil di Desktop lg:) -->
          <div class="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-[#172B3A] text-white p-8 lg:p-14 flex-col justify-between border-r border-[#1E384D] shrink-0">
            
            <div>
              <!-- Header Korporat -->
              <div class="flex items-center gap-3 mb-8 lg:mb-10">
                <div class="h-12 w-12 rounded-xl bg-white p-1.5 shadow-sm flex items-center justify-center shrink-0">
                  <img src="logo.png" alt="Logo PLN" class="h-10 w-auto object-contain" onerror="this.onerror=null; this.src='https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png';" />
                </div>
                <div>
                  <div class="text-xs font-bold tracking-wider uppercase text-white leading-tight">
                    PT PLN (Persero)
                  </div>
                  <div class="text-xs text-[#23C4DB] font-semibold leading-tight">
                    PLN Corporate University
                  </div>
                </div>
              </div>

              <!-- Judul Program & Deskripsi -->
              <div class="space-y-3 mb-8">
                <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#23C4DB]/15 text-[#23C4DB] border border-[#23C4DB]/30">
                  Portal Pegawai Terpadu
                </span>
                <h1 class="text-2xl lg:text-3xl font-bold tracking-tight text-white leading-snug">
                  Evaluasi Level 3 (Behavior)<br />PLN Impact Lab
                </h1>
                <p class="text-xs sm:text-sm text-[#94A3B8] leading-relaxed max-w-lg">
                  Platform asesmen implementasi perilaku kerja pasca-pembelajaran untuk mengukur dampak kompetensi diklat pada unit operasional secara transparan, akuntabel, dan terukur.
                </p>
              </div>

              <!-- 3 Pilar Peran Penilaian -->
              <div class="grid grid-cols-1 gap-3 text-xs text-[#CBD5E1]">
                <div class="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#1E384D]/70 border border-[#2B4B63]/60">
                  <span class="material-symbols-outlined text-[18px] text-[#23C4DB] shrink-0 mt-0.5">person</span>
                  <div>
                    <b class="text-white block font-semibold">Peserta Pelatihan</b>
                    <span class="text-[11px] text-[#94A3B8] leading-tight block">Pengisian evaluasi mandiri &amp; unggah bukti penerapan kerja.</span>
                  </div>
                </div>

                <div class="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#1E384D]/70 border border-[#2B4B63]/60">
                  <span class="material-symbols-outlined text-[18px] text-[#F59E0B] shrink-0 mt-0.5">supervisor_account</span>
                  <div>
                    <b class="text-white block font-semibold">Atasan Langsung</b>
                    <span class="text-[11px] text-[#94A3B8] leading-tight block">Observasi dan verifikasi perubahan perilaku di lapangan.</span>
                  </div>
                </div>

                <div class="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#1E384D]/70 border border-[#2B4B63]/60">
                  <span class="material-symbols-outlined text-[18px] text-[#00E5FF] shrink-0 mt-0.5">verified_user</span>
                  <div>
                    <b class="text-white block font-semibold">Koordinator UPDL</b>
                    <span class="text-[11px] text-[#94A3B8] leading-tight block">Validasi standar silabus diklat &amp; kepatuhan asesmen unit.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Panel Kiri Desktop -->
            <div class="pt-6 mt-6 border-t border-[#1E384D] text-[11px] text-[#64748B] flex items-center justify-between">
              <span>Sistem Evaluasi Terpadu</span>
              <span>PLN Corpu &copy; 2026</span>
            </div>

          </div>

          <!-- Panel Form: Card Putih Bersih (Responsif Mobile & Desktop) -->
          <div class="w-full lg:w-1/2 xl:w-7/12 flex-1 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12 bg-[#172B3A] lg:bg-[#F8FAFC]">
            
            <!-- Card Putih Login -->
            <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-white/20 lg:border-[#CBD5E1] p-6 sm:p-8 space-y-5 text-[#172B3A]">
              
              <!-- Card Header -->
              <div class="border-b border-[#E2E8F0] pb-3 sm:pb-4">
                <div class="flex items-center gap-2 mb-1">
                  <span class="material-symbols-outlined text-[20px] text-[#006876]">login</span>
                  <span class="text-xs font-bold uppercase tracking-wider text-[#006876]">Autentikasi Pegawai</span>
                </div>
                <h2 class="text-lg sm:text-xl font-bold text-[#172B3A] tracking-tight">
                  Masuk ke Portal Pegawai
                </h2>
                <p class="text-xs text-[#64748B] mt-1">
                  Masukkan Nomor Induk Pegawai (NIP) dan kata sandi Anda.
                </p>
              </div>

              <!-- Kotak Peringatan / Pesan Kesalahan -->
              <div id="login-alert-box" class="hidden p-3 rounded-lg text-xs border"></div>

              <!-- Formulir Login Berbasis NIP -->
              <form id="form-login" class="space-y-4">
                
                <!-- NIP Input -->
                <div>
                  <label for="login-identifier" class="block text-xs font-semibold text-[#172B3A] mb-1.5">
                    Nomor Induk Pegawai (NIP) <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      id="login-identifier"
                      type="text"
                      maxlength="30"
                      required
                      autocomplete="username"
                      placeholder="Masukkan NIP Pegawai..."
                      class="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 sm:py-3 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#006876] focus:ring-1 focus:ring-[#006876]/20 text-[#172B3A] font-medium transition-all"
                    />
                    <span class="material-symbols-outlined absolute left-3 top-2.5 sm:top-3 text-[#64748B] text-[18px]">
                      badge
                    </span>
                  </div>
                  <span class="text-[11px] text-[#64748B] mt-1 block">
                    Gunakan NIP terdaftar Anda. Peran pengguna terdeteksi otomatis oleh sistem.
                  </span>
                </div>

                <!-- Password Input -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label for="login-password" class="text-xs font-semibold text-[#172B3A]">
                      Kata Sandi <span class="text-red-500">*</span>
                    </label>
                  </div>
                  <div class="relative">
                    <input
                      id="login-password"
                      type="password"
                      required
                      autocomplete="current-password"
                      placeholder="Masukkan kata sandi..."
                      class="w-full text-xs sm:text-sm pl-9 pr-10 py-2.5 sm:py-3 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#006876] focus:ring-1 focus:ring-[#006876]/20 text-[#172B3A] transition-all"
                    />
                    <span class="material-symbols-outlined absolute left-3 top-2.5 sm:top-3 text-[#64748B] text-[18px]">
                      lock
                    </span>
                    <button
                      type="button"
                      id="btn-toggle-password"
                      class="absolute right-3 top-2.5 sm:top-3 text-[#64748B] hover:text-[#172B3A] p-0.5"
                      title="Lihat kata sandi"
                      aria-label="Lihat kata sandi"
                    >
                      <span class="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                  </div>
                </div>

                <!-- Remember Me -->
                <div class="flex items-center text-xs text-[#475569]">
                  <label class="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" id="check-remember" checked class="rounded border-[#CBD5E1] text-[#006876] accent-[#006876] h-4 w-4" />
                    <span>Ingat saya di perangkat ini</span>
                  </label>
                </div>

                <!-- Tombol Submit -->
                <button type="submit" id="btn-submit-login" class="w-full btn-primary justify-center py-3 text-xs sm:text-sm font-semibold rounded-lg shadow-sm">
                  <span class="material-symbols-outlined text-[18px]">login</span>
                  Masuk ke Portal Pegawai
                </button>
              </form>

            </div>

            <!-- Footer Ringkas Mobile -->
            <div class="block lg:hidden mt-4 text-center text-[11px] text-[#94A3B8]">
              PLN Corporate University &copy; 2026
            </div>

          </div>

        </div>
      `;
    },

    // =========================================================================
    // 2. PORTAL LOGIN ADMINISTRATOR & DEVELOPER (/plncorpuadmin)
    // =========================================================================
    renderAdminPortal: function (container) {
      container.innerHTML = `
        <div class="w-full min-h-screen flex flex-col lg:flex-row bg-[#0E1E2A]">
          
          <!-- Header Ringkas Khusus Mobile (< lg) -->
          <div class="block lg:hidden text-center pt-8 pb-3 px-4 shrink-0 text-white">
            <div class="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white p-2.5 shadow-sm mb-2.5">
              <img src="logo.png" alt="Logo PLN" class="h-10 w-auto object-contain" onerror="this.onerror=null; this.src='https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png';" />
            </div>
            <div class="text-[11px] font-bold tracking-wider uppercase text-[#23C4DB]">
              PLN Corporate University
            </div>
            <h1 class="text-xl font-bold tracking-tight text-white mt-0.5">
              Konsol Administrator &amp; Dev
            </h1>
            <p class="text-xs text-[#94A3B8] mt-0.5">
              Portal Akses Terbatas /plncorpuadmin
            </p>
          </div>

          <!-- Panel Kiri: Identitas Resmi Administrator & Developer (Hanya Desktop lg:) -->
          <div class="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-gradient-to-br from-[#102331] to-[#172B3A] text-white p-8 lg:p-14 flex-col justify-between border-r border-[#1E384D] shrink-0">
            
            <div>
              <!-- Header Korporat -->
              <div class="flex items-center gap-3 mb-8 lg:mb-10">
                <div class="h-12 w-12 rounded-xl bg-white p-1.5 shadow-sm flex items-center justify-center shrink-0">
                  <img src="logo.png" alt="Logo PLN" class="h-10 w-auto object-contain" onerror="this.onerror=null; this.src='https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png';" />
                </div>
                <div>
                  <div class="text-xs font-bold tracking-wider uppercase text-white leading-tight">
                    PT PLN (Persero)
                  </div>
                  <div class="text-xs text-[#23C4DB] font-semibold leading-tight">
                    PLN Corporate University
                  </div>
                </div>
              </div>

              <!-- Judul Administrator & Developer -->
              <div class="space-y-3 mb-8">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#DC2626]/20 text-[#FCA5A5] border border-[#DC2626]/40">
                  <span class="material-symbols-outlined text-[14px]">security</span>
                  Konsol Hak Akses Tinggi (Restricted)
                </span>
                <h1 class="text-2xl lg:text-3xl font-bold tracking-tight text-white leading-snug">
                  Konsol Administrator<br />&amp; Developer
                </h1>
                <p class="text-xs sm:text-sm text-[#94A3B8] leading-relaxed max-w-lg">
                  Akses khusus manajemen konfigurasi sistem, arsitektur master organisasi se-Indonesia, hak akses pengguna, siklus pembelajaran, dan builder formulir evaluasi terintegrasi.
                </p>
              </div>

              <!-- Hak Akses & Kemampuan -->
              <div class="space-y-2.5 text-xs text-[#CBD5E1]">
                <div class="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#1A384F]/60 border border-[#23C4DB]/20">
                  <span class="material-symbols-outlined text-[18px] text-[#A78BFA] shrink-0">terminal</span>
                  <div>
                    <span class="font-bold text-white block">Developer Super Admin</span>
                    <span class="text-[11px] text-[#94A3B8]">Membuat akun Admin Pusat, mengelola seluruh pengguna dan konfigurasi inti.</span>
                  </div>
                </div>
                <div class="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#1A384F]/60 border border-[#23C4DB]/20">
                  <span class="material-symbols-outlined text-[18px] text-[#23C4DB] shrink-0">shield_person</span>
                  <div>
                    <span class="font-bold text-white block">Administrator Pusat PLN Corpu</span>
                    <span class="text-[11px] text-[#94A3B8]">Mengelola master organisasi, UPDL, unit kerja, serta akun pengguna operasional.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Panel Kiri Admin Desktop -->
            <div class="pt-6 mt-6 border-t border-[#1E384D] text-[11px] text-[#64748B] flex items-center justify-between">
              <span>Jalur Khusus: /plncorpuadmin</span>
              <span class="font-mono text-[#23C4DB]">PLN Impact Lab</span>
            </div>

          </div>

          <!-- Panel Form: Card Putih Bersih (Responsif Mobile & Desktop) -->
          <div class="w-full lg:w-1/2 xl:w-7/12 flex-1 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12 bg-[#0E1E2A] lg:bg-[#F8FAFC]">
            
            <!-- Card Putih Login Admin -->
            <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#CBD5E1] p-6 sm:p-8 space-y-5 text-[#172B3A]">
              
              <!-- Card Header -->
              <div class="border-b border-[#E2E8F0] pb-3 sm:pb-4">
                <div class="flex items-center gap-2 mb-1">
                  <span class="material-symbols-outlined text-[20px] text-[#006876]">admin_panel_settings</span>
                  <span class="text-xs font-bold uppercase tracking-wider text-[#006876]">Autentikasi Konsol Utama</span>
                </div>
                <h2 class="text-lg sm:text-xl font-bold text-[#172B3A] tracking-tight">
                  Konsol Administrator &amp; Dev
                </h2>
                <p class="text-xs text-[#64748B] mt-1">
                  Masukkan username / NIP Administrator Pusat atau Developer.
                </p>
              </div>

              <!-- Kotak Peringatan / Pesan Kesalahan -->
              <div id="login-alert-box" class="hidden p-3 rounded-lg text-xs border"></div>

              <!-- Adaptive Identifier-First Admin Flow Container -->
              <div id="admin-adaptive-flow">
                ${this.renderAdminStepHtml()}
              </div>

              <!-- Tautan Kembali ke Login Pegawai -->
              <div class="pt-4 border-t border-[#CBD5E1] text-center">
                <a href="/" id="link-goto-user" class="inline-flex items-center gap-1.5 text-xs text-[#006876] hover:underline font-semibold p-1">
                  <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Kembali ke Halaman Login Pegawai</span>
                </a>
              </div>

            </div>

            <!-- Footer Ringkas Mobile Admin -->
            <div class="block lg:hidden mt-4 text-center text-[11px] text-[#94A3B8]">
              PLN Corporate University &copy; 2026
            </div>

          </div>

        </div>
      `;
    },

    renderAdminStepHtml: function () {
      const st = this.adminAuthState;
      const methods = st.identifyData?.authMethods || {};

      if (st.step === 'identify') {
        return `
          <form id="form-admin-identify" class="space-y-4">
            <div class="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#475569] flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px] text-[#006876]">verified_user</span>
              <span>Autentikasi Adaptif Enterprise (WebAuthn Windows Hello / Passkey QR / Face Recognition AES-256).</span>
            </div>
            <div>
              <label for="login-admin-identifier" class="block text-xs font-semibold text-[#172B3A] mb-1.5">
                Username / Email / NIP Administrator <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  id="login-admin-identifier"
                  type="text"
                  required
                  autocomplete="username webauthn"
                  placeholder="Masukkan username, email, atau NIP..."
                  value="${esc(st.identifier)}"
                  class="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 sm:py-3 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#006876] focus:ring-1 focus:ring-[#006876]/20 text-[#172B3A] font-medium transition-all"
                />
                <span class="material-symbols-outlined absolute left-3 top-2.5 sm:top-3 text-[#64748B] text-[18px]">manage_accounts</span>
              </div>
            </div>
            <button type="submit" id="btn-admin-identify" class="w-full btn-primary justify-center py-3 text-xs sm:text-sm font-semibold rounded-lg shadow-sm">
              <span>Lanjutkan</span>
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>
        `;
      }

      const accountChip = `
        <div class="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs">
          <div class="flex items-center gap-2.5 overflow-hidden">
            <div class="w-8 h-8 rounded-full bg-[#006876] text-white font-bold flex items-center justify-center shrink-0">
              ${esc((st.identifyData?.displayName || st.identifier || 'A').charAt(0).toUpperCase())}
            </div>
            <div class="overflow-hidden">
              <div class="font-bold text-[#172B3A] truncate">${esc(st.identifyData?.displayName || st.identifier)}</div>
              <div class="text-[11px] text-[#64748B] font-mono truncate">${esc(st.identifier)}</div>
            </div>
          </div>
          <button type="button" id="btn-admin-change-id" class="text-[11px] font-semibold text-[#006876] hover:underline shrink-0 ml-2">
            Ganti Akun
          </button>
        </div>
      `;

      if (st.step === 'biometric') {
        const hasPasskey = Boolean(methods.hasPlatformPasskey || methods.hasWebAuthn);
        const hasWebcam = Boolean(methods.hasWebcamFace);

        return `
          <div class="space-y-4">
            ${accountChip}

            <div class="p-4 rounded-xl bg-[#F0FDFA] border border-[#99F6E4] text-center space-y-2.5">
              <div class="w-12 h-12 rounded-2xl bg-[#006876] text-white flex items-center justify-center mx-auto shadow-sm">
                <span class="material-symbols-outlined text-[26px]">${hasPasskey ? 'fingerprint' : 'face'}</span>
              </div>
              <div>
                <h3 class="text-sm font-bold text-[#172B3A]">
                  ${hasPasskey ? 'Verifikasi Windows Hello / Passkey Perangkat' : 'Verifikasi Face Recognition (Liveness 15 Detik)'}
                </h3>
                <p class="text-[11px] text-[#475569] mt-0.5">
                  ${hasPasskey
                    ? 'Ikuti prompt Windows Hello / Touch ID pada perangkat Anda untuk masuk secara aman.'
                    : 'Buka kamera untuk menyelesaikan tantangan active liveness acak dari server.'}
                </p>
              </div>

              <div class="flex flex-col gap-2 pt-1">
                ${hasPasskey ? `
                  <button type="button" id="btn-admin-retry-webauthn" class="w-full btn-primary justify-center py-2.5 text-xs font-semibold rounded-lg shadow-sm">
                    <span class="material-symbols-outlined text-[18px]">fingerprint</span>
                    Gunakan Windows Hello / Passkey Perangkat
                  </button>
                ` : ''}

                ${hasWebcam ? `
                  <button type="button" id="btn-admin-start-webcam" class="w-full ${hasPasskey ? 'btn-secondary' : 'btn-primary'} justify-center py-2.5 text-xs font-semibold rounded-lg">
                    <span class="material-symbols-outlined text-[18px]">videocam</span>
                    Verifikasi Face Recognition Webcam (15s)
                  </button>
                ` : ''}

                <button type="button" id="btn-admin-qr-passkey" class="w-full btn-secondary justify-center py-2.5 text-xs font-semibold rounded-lg border-[#006876]/30 text-[#006876] hover:bg-white">
                  <span class="material-symbols-outlined text-[18px]">qr_code_2</span>
                  Gunakan Passkey via HP (QR Code)
                </button>
              </div>
            </div>

            <div class="pt-2 border-t border-[#E2E8F0] flex flex-col gap-2 text-center">
              <button type="button" id="btn-admin-fallback-password" class="text-xs font-semibold text-[#006876] hover:underline inline-flex items-center justify-center gap-1 py-1">
                <span class="material-symbols-outlined text-[16px]">password</span>
                Masuk dengan Password / Metode Lain
              </button>
            </div>
          </div>
        `;
      }

      if (st.step === 'otp_fallback') {
        const lockRemainingMin = st.lockInfo?.remainingSeconds ? Math.ceil(st.lockInfo.remainingSeconds / 60) : 15;
        return `
          <div class="space-y-4">
            ${accountChip}

            ${st.lockInfo?.locked ? `
              <div class="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs space-y-1">
                <div class="font-bold flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">lock_clock</span>
                  Biometrik Dikunci Sementara (${lockRemainingMin} Menit)
                </div>
                <p class="text-[11px]">Batas 3x percobaan biometrik terlampaui. Silakan autentikasi menggunakan jalur <b>Password + OTP</b>.</p>
              </div>
            ` : `
              <div class="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] text-[11px]">
                <b>Verifikasi Ganda Fallback:</b> Masukkan kata sandi akun untuk menerima 6-digit kode OTP verifikasi.
              </div>
            `}

            <form id="form-admin-otp-request" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-[#172B3A] mb-1">Kata Sandi Akun <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input id="login-admin-otp-password" type="password" required placeholder="Masukkan kata sandi..."
                    class="w-full text-xs sm:text-sm pl-9 pr-10 py-2.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#006876]" />
                  <span class="material-symbols-outlined absolute left-3 top-2.5 text-[#64748B] text-[18px]">lock</span>
                </div>
              </div>

              ${!st.otpChallengeId ? `
                <button type="submit" id="btn-request-admin-otp" class="w-full btn-primary justify-center py-2.5 text-xs font-semibold rounded-lg">
                  <span class="material-symbols-outlined text-[18px]">mark_email_read</span>
                  Kirim Kode OTP Verifikasi
                </button>
              ` : `
                <div class="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[11px] space-y-1">
                  <div>Kode OTP 6-digit telah diterbitkan ke <b>${esc(st.otpMaskedTarget || 'email terdaftar')}</b> (berlaku 5 menit).</div>
                  ${st.sandboxOtpPreview ? `<div class="font-mono font-bold text-xs text-[#006876]">Kode OTP Simulasi Lokal: ${esc(st.sandboxOtpPreview)}</div>` : ''}
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#172B3A] mb-1">Kode OTP 6-Digit <span class="text-red-500">*</span></label>
                  <input id="login-admin-otp-code" type="text" maxlength="6" required placeholder="Contoh: 123456"
                    class="w-full text-center tracking-[0.4em] font-mono font-bold text-sm py-2.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#006876]" />
                </div>
                <button type="button" id="btn-verify-admin-otp" class="w-full btn-primary justify-center py-2.5 text-xs font-semibold rounded-lg">
                  <span class="material-symbols-outlined text-[18px]">verified_user</span>
                  Verifikasi Password + OTP &amp; Masuk
                </button>
              `}
            </form>

            ${!st.lockInfo?.locked && (methods.hasWebAuthn || methods.hasWebcamFace) ? `
              <div class="text-center pt-1">
                <button type="button" id="btn-back-to-bio" class="text-xs font-semibold text-[#006876] hover:underline">
                  ← Kembali ke Verifikasi Biometrik
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }

      // Default / Step 'password'
      const hasAnyBiometric = Boolean(methods.hasWebAuthn || methods.hasWebcamFace);
      return `
        <form id="form-login-admin" class="space-y-4">
          ${accountChip}

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="login-admin-password" class="text-xs font-semibold text-[#172B3A]">
                Kata Sandi <span class="text-red-500">*</span>
              </label>
            </div>
            <div class="relative">
              <input
                id="login-admin-password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="Masukkan kata sandi..."
                class="w-full text-xs sm:text-sm pl-9 pr-10 py-2.5 sm:py-3 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#006876] focus:ring-1 focus:ring-[#006876]/20 text-[#172B3A] transition-all"
              />
              <span class="material-symbols-outlined absolute left-3 top-2.5 sm:top-3 text-[#64748B] text-[18px]">lock</span>
              <button
                type="button"
                id="btn-admin-toggle-password"
                class="absolute right-3 top-2.5 sm:top-3 text-[#64748B] hover:text-[#172B3A] p-0.5"
                title="Lihat kata sandi"
                aria-label="Lihat kata sandi"
              >
                <span class="material-symbols-outlined text-[18px]">visibility</span>
              </button>
            </div>
          </div>

          <button type="submit" id="btn-submit-admin" class="w-full btn-primary justify-center py-3 text-xs sm:text-sm font-semibold rounded-lg shadow-sm">
            <span class="material-symbols-outlined text-[18px]">verified_user</span>
            Masuk ke Konsol
          </button>

          <div class="pt-2 border-t border-[#E2E8F0] flex flex-col gap-1.5 text-center">
            ${hasAnyBiometric ? `
              <button type="button" id="btn-back-to-bio" class="text-xs font-semibold text-[#006876] hover:underline py-1">
                ← Kembali ke Biometrik (${methods.hasWebAuthn ? 'Windows Hello / Passkey' : 'Webcam Wajah'})
              </button>
            ` : ''}
            <button type="button" id="btn-switch-to-otp" class="text-[11px] font-medium text-[#64748B] hover:text-[#006876] py-0.5">
              Masuk via Jalur Password + OTP Verifikasi
            </button>
          </div>
        </form>
      `;
    },

    // =========================================================================
    // ATTACH EVENTS
    // =========================================================================
    attachEvents: function (container) {
      const isAdmin = this.isAdminRoute();

      // Navigasi kembali dari Login Admin ke Login Pegawai
      container.querySelector('#link-goto-user')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState(null, '', '/');
        this.render(container);
      });

      if (isAdmin) {
        this.attachAdminEvents(container);
      } else {
        this.attachUserEvents(container);
      }
    },

    attachUserEvents: function (container) {
      // Toggle Password Visibility
      const passInput = container.querySelector('#login-password');
      const toggleBtn = container.querySelector('#btn-toggle-password');
      if (passInput && toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const isPass = passInput.type === 'password';
          passInput.type = isPass ? 'text' : 'password';
          toggleBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">${isPass ? 'visibility_off' : 'visibility'}</span>`;
        });
      }

      // Submit Form User Pegawai (Berdasarkan NIP / Akun Terdaftar)
      const form = container.querySelector('#form-login');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const identifier = (container.querySelector('#login-identifier')?.value || '').trim();
          const password = container.querySelector('#login-password')?.value || '';
          const submitBtn = container.querySelector('#btn-submit-login');
          const alertBox = container.querySelector('#login-alert-box');

          if (!identifier || !password) return;

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Memverifikasi Kredensial...';
          }

          try {
            // isFromAdminPortal = false -> Portal Terpadu (mencocokkan seluruh akun terdaftar)
            const result = await window.authManager.authenticate(identifier, password, null, false);

            if (!result.success) {
              alertBox.className = 'p-3 rounded-lg text-xs border bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]';
              alertBox.textContent = result.message || 'NIP atau kata sandi tidak valid.';
              alertBox.classList.remove('hidden');
            } else if (result.requireFaceVerification && window.FaceAuthManager) {
              // Wajib verifikasi biometrik wajah sebelum menerbitkan sesi untuk akun berwenang
              alertBox.classList.add('hidden');
              window.FaceAuthManager.openFaceVerificationModal({
                title: 'Verifikasi Wajah Administrator',
                description: `Halo ${result.user.nama || result.user.username}, silakan hadapkan wajah ke kamera untuk verifikasi biometrik sebelum memasuki sistem.`,
                user: result.user,
                mode: 'login',
                onSuccess: async (matchData) => {
                  const finalAuth = await window.authManager.completeAdminLoginWithFace(
                    result.authTicket,
                    result.user,
                    matchData?.descriptor,
                    matchData?.recoveryCode
                  );
                  if (finalAuth.success) {
                    this.handleSuccessfulLogin(finalAuth.user);
                  } else {
                    alertBox.className = 'p-3 rounded-lg text-xs border bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]';
                    alertBox.textContent = finalAuth.message;
                    alertBox.classList.remove('hidden');
                  }
                },
                onCancel: () => {
                  alertBox.className = 'p-3 rounded-lg text-xs border bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]';
                  alertBox.textContent = 'Verifikasi biometrik wajah dibatalkan. Sesi belum aktif.';
                  alertBox.classList.remove('hidden');
                }
              });
            } else {
              alertBox.classList.add('hidden');
              this.handleSuccessfulLogin(result.user);
            }
          } catch (err) {
            alertBox.className = 'p-3 rounded-lg text-xs border bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]';
            alertBox.textContent = 'Terjadi kesalahan komunikasi sistem. Silakan coba kembali.';
            alertBox.classList.remove('hidden');
          } finally {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">login</span> Masuk ke Portal Pegawai';
            }
          }
        });
      }
    },

    refreshAdminStep: function (container) {
      const flowBox = container.querySelector('#admin-adaptive-flow');
      if (flowBox) {
        flowBox.innerHTML = this.renderAdminStepHtml();
        this.attachAdminEvents(container);
      }
    },

    triggerAdminWebAuthn: async function (container, mode = 'platform') {
      const alertBox = container.querySelector('#login-alert-box');
      const identifier = this.adminAuthState.identifier;
      if (!identifier || !window.FaceAuthManager) return;

      const res = await window.FaceAuthManager.authenticateWithPasskey(identifier, mode);
      if (res.success && res.token && res.user) {
        const user = window.authManager.completeSessionWithToken(res.token, res.user);
        this.resetAdminAuthState();
        this.handleSuccessfulLogin(user);
        return;
      }

      if (res.locked) {
        this.adminAuthState.lockInfo = res;
        this.adminAuthState.step = 'otp_fallback';
        this.refreshAdminStep(container);
        return;
      }

      if (alertBox && res.message) {
        alertBox.className = 'p-3 rounded-lg text-xs border bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]';
        alertBox.textContent = res.message;
        alertBox.classList.remove('hidden');
      }
    },

    triggerAdminWebcamFace: function (container) {
      const alertBox = container.querySelector('#login-alert-box');
      const st = this.adminAuthState;
      const userObj = {
        id: st.identifier,
        nip: st.identifier,
        nama: st.identifyData?.displayName || st.identifier
      };

      window.FaceAuthManager.openFaceVerificationModal({
        title: 'Verifikasi Wajah & Active Liveness (15s)',
        user: userObj,
        mode: 'login',
        onSuccess: (verifyData) => {
          if (verifyData && verifyData.token && verifyData.user) {
            const safeUser = window.authManager.completeSessionWithToken(verifyData.token, verifyData.user);
            this.resetAdminAuthState();
            this.handleSuccessfulLogin(safeUser);
          } else {
            if (alertBox) {
              alertBox.className = 'p-3 rounded-lg text-xs border bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]';
              alertBox.textContent = 'Verifikasi backend gagal menerbitkan sesi.';
              alertBox.classList.remove('hidden');
            }
          }
        },
        onFallbackPassword: () => {
          this.adminAuthState.step = 'otp_fallback';
          this.refreshAdminStep(container);
        },
        onLocked: (lockInfo) => {
          this.adminAuthState.lockInfo = lockInfo;
          this.adminAuthState.step = 'otp_fallback';
          this.refreshAdminStep(container);
        },
        onCancel: () => {
          if (alertBox) {
            alertBox.className = 'p-3 rounded-lg text-xs border bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]';
            alertBox.textContent = 'Verifikasi wajah dibatalkan. Anda dapat mencoba lagi atau masuk dengan Password / Metode Lain.';
            alertBox.classList.remove('hidden');
          }
        }
      });
    },

    attachAdminEvents: function (container) {
      const alertBox = container.querySelector('#login-alert-box');
      const st = this.adminAuthState;

      // Ganti akun -> kembali ke Step 1 Identifier-First
      container.querySelector('#btn-admin-change-id')?.addEventListener('click', () => {
        if (alertBox) alertBox.classList.add('hidden');
        this.resetAdminAuthState();
        this.refreshAdminStep(container);
      });

      // Step 1: Identify Admin Account
      const formIdentify = container.querySelector('#form-admin-identify');
      if (formIdentify) {
        formIdentify.addEventListener('submit', async (e) => {
          e.preventDefault();
          const identifier = (container.querySelector('#login-admin-identifier')?.value || '').trim();
          const btn = container.querySelector('#btn-admin-identify');
          if (!identifier) return;

          if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Mengecek Metode Keamanan...';
          }
          if (alertBox) alertBox.classList.add('hidden');

          try {
            const res = await window.authManager.identifyAdminAccount(identifier);
            if (!res.success) {
              if (alertBox) {
                alertBox.className = 'p-3 rounded-lg text-xs border bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]';
                alertBox.textContent = res.message || 'Akun Administrator tidak dikenali.';
                alertBox.classList.remove('hidden');
              }
              return;
            }

            st.identifier = res.identifier || identifier;
            st.identifyData = res;
            st.autoTriggeredOnce = false;

            if (res.locked) {
              st.lockInfo = res;
              st.step = 'otp_fallback';
            } else if (res.authMethods?.hasPlatformPasskey || res.authMethods?.hasWebAuthn || res.authMethods?.hasWebcamFace) {
              st.step = 'biometric';
            } else {
              st.step = 'password';
            }
            this.refreshAdminStep(container);
          } finally {
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = '<span>Lanjutkan</span><span class="material-symbols-outlined text-[18px]">arrow_forward</span>';
            }
          }
        });
      }

      // Step 2: Adaptive Biometric Auto-Invoke & Controls
      if (st.step === 'biometric') {
        const methods = st.identifyData?.authMethods || {};
        if (!st.autoTriggeredOnce) {
          st.autoTriggeredOnce = true;
          setTimeout(() => {
            if (methods.hasPlatformPasskey || methods.hasWebAuthn) {
              this.triggerAdminWebAuthn(container, methods.hasPlatformPasskey ? 'platform' : 'any');
            } else if (methods.hasWebcamFace) {
              this.triggerAdminWebcamFace(container);
            }
          }, 150);
        }

        container.querySelector('#btn-admin-retry-webauthn')?.addEventListener('click', () => {
          this.triggerAdminWebAuthn(container, methods.hasPlatformPasskey ? 'platform' : 'any');
        });
        container.querySelector('#btn-admin-qr-passkey')?.addEventListener('click', () => {
          this.triggerAdminWebAuthn(container, 'hybrid');
        });
        container.querySelector('#btn-admin-start-webcam')?.addEventListener('click', () => {
          this.triggerAdminWebcamFace(container);
        });
        container.querySelector('#btn-admin-fallback-password')?.addEventListener('click', () => {
          if (alertBox) alertBox.classList.add('hidden');
          // Jika biometrik aktif, tawarkan halaman Password (atau OTP jika memilih OTP)
          st.step = 'password';
          this.refreshAdminStep(container);
        });
      }

      // Kembali ke biometrik / beralih ke OTP
      container.querySelector('#btn-back-to-bio')?.addEventListener('click', () => {
        if (alertBox) alertBox.classList.add('hidden');
        st.step = 'biometric';
        st.autoTriggeredOnce = false;
        this.refreshAdminStep(container);
      });
      container.querySelector('#btn-switch-to-otp')?.addEventListener('click', () => {
        if (alertBox) alertBox.classList.add('hidden');
        st.step = 'otp_fallback';
        st.otpChallengeId = null;
        this.refreshAdminStep(container);
      });

      // Step 3: Password Login Form
      const passInput = container.querySelector('#login-admin-password');
      const toggleBtn = container.querySelector('#btn-admin-toggle-password');
      if (passInput && toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const isPass = passInput.type === 'password';
          passInput.type = isPass ? 'text' : 'password';
          toggleBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">${isPass ? 'visibility_off' : 'visibility'}</span>`;
        });
      }

      const formPass = container.querySelector('#form-login-admin');
      if (formPass) {
        formPass.addEventListener('submit', async (e) => {
          e.preventDefault();
          const identifier = st.identifier;
          const password = container.querySelector('#login-admin-password')?.value || '';
          const submitBtn = container.querySelector('#btn-submit-admin');
          if (!identifier || !password) return;

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Memverifikasi Kredensial...';
          }

          try {
            const result = await window.authManager.authenticate(identifier, password, 'admin', true);
            if (!result.success) {
              if (result.locked) {
                st.lockInfo = result;
                st.step = 'otp_fallback';
                this.refreshAdminStep(container);
                return;
              }
              if (alertBox) {
                alertBox.className = 'p-3 rounded-lg text-xs border bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]';
                alertBox.textContent = result.message;
                alertBox.classList.remove('hidden');
              }
            } else if (result.requireBiometricVerification || result.requireFaceVerification) {
              if (result.hasWebAuthn) {
                st.step = 'biometric';
                st.autoTriggeredOnce = false;
                this.refreshAdminStep(container);
              } else {
                this.triggerAdminWebcamFace(container);
              }
            } else {
              if (alertBox) alertBox.classList.add('hidden');
              this.resetAdminAuthState();
              this.handleSuccessfulLogin(result.user);
            }
          } catch (_) {
            if (alertBox) {
              alertBox.className = 'p-3 rounded-lg text-xs border bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]';
              alertBox.textContent = 'Terjadi kesalahan sistem. Silakan coba kembali.';
              alertBox.classList.remove('hidden');
            }
          } finally {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">verified_user</span> Masuk ke Konsol';
            }
          }
        });
      }

      // Step 4: Password + OTP Lockout / Fallback Flow
      const formOtp = container.querySelector('#form-admin-otp-request');
      if (formOtp) {
        formOtp.addEventListener('submit', async (e) => {
          e.preventDefault();
          const pwd = container.querySelector('#login-admin-otp-password')?.value || '';
          const reqBtn = container.querySelector('#btn-request-admin-otp');
          if (!pwd) return;

          if (reqBtn) {
            reqBtn.disabled = true;
            reqBtn.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Mengirim OTP...';
          }

          const res = await window.authManager.requestAdminOtp(st.identifier, pwd);
          if (res && res.success) {
            st.otpChallengeId = res.challengeId;
            st.otpMaskedTarget = res.maskedTarget;
            st.sandboxOtpPreview = res.sandboxOtpPreview || null;
            st._tempOtpPwd = pwd;
            if (alertBox) alertBox.classList.add('hidden');
            this.refreshAdminStep(container);
            const pwdField = container.querySelector('#login-admin-otp-password');
            if (pwdField) pwdField.value = pwd;
          } else {
            if (alertBox) {
              alertBox.className = 'p-3 rounded-lg text-xs border bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]';
              alertBox.textContent = res?.message || 'Gagal meminta kode OTP.';
              alertBox.classList.remove('hidden');
            }
            if (reqBtn) {
              reqBtn.disabled = false;
              reqBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">mark_email_read</span> Kirim Kode OTP Verifikasi';
            }
          }
        });

        container.querySelector('#btn-verify-admin-otp')?.addEventListener('click', async () => {
          const pwd = container.querySelector('#login-admin-otp-password')?.value || st._tempOtpPwd || '';
          const otp = (container.querySelector('#login-admin-otp-code')?.value || '').trim();
          if (!pwd || !otp) return;

          const res = await window.authManager.verifyAdminOtpLogin(st.identifier, pwd, st.otpChallengeId, otp);
          if (res.success && res.user) {
            this.resetAdminAuthState();
            this.handleSuccessfulLogin(res.user);
          } else if (alertBox) {
            alertBox.className = 'p-3 rounded-lg text-xs border bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]';
            alertBox.textContent = res.message || 'Kode OTP tidak sesuai.';
            alertBox.classList.remove('hidden');
          }
        });
      }
    },

    handleSuccessfulLogin: function (user) {
      window.appStore.setRole(user.role);

      // Periksa apakah ada rute tujuan (deep link) yang tersimpan sebelum login
      const savedRedirect = sessionStorage.getItem('pln_eval3_redirect');
      if (savedRedirect && window.App && window.App.router) {
        sessionStorage.removeItem('pln_eval3_redirect');
        const parsed = window.App.router.parseUrl(savedRedirect, '', user.role);
        if (parsed && parsed.view) {
          if (parsed.tab && window.AdminOrganisasiView) {
            window.AdminOrganisasiView.activeTab = parsed.tab;
          }
          if (parsed.respondentId) {
            window.appStore.setActiveRespondentId(Number(parsed.respondentId));
          }
          window.appStore.setView(parsed.view, parsed);
          window.App.showToast(`Selamat datang, ${user.nama}.`, 'success');
          return;
        }
      }

      if (user.role === 'peserta') {
        window.appStore.setActiveRespondentId(user.respondentId || 1);
        window.appStore.setView('peserta-beranda', { respondentId: user.respondentId || 1 });
      } else if (user.role === 'atasan' || user.role === 'koordinator' || user.role === 'koordinator_internal' || user.role === 'koordinator_eksternal') {
        window.appStore.setView('evaluator-beranda');
      } else {
        // Admin Pusat atau Developer
        window.appStore.setView('dashboard');
      }

      window.App.showToast(`Selamat datang, ${user.nama}.`, 'success');
    }
  };
})();
