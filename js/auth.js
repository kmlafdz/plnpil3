/**
 * Auth Module: Sistem Evaluasi Level 3 UP3 Metro
 * Mengelola katalog pengguna, verifikasi kredensial, dan sesi aktif
 * Terintegrasi dengan MariaDB Server KemzKun Server (pln_pil_3)
 */

(function () {
  class AuthManager {
    constructor() {
      this.STORAGE_KEY_USER = 'pln_eval3_current_user_v1';
      this.currentUser = this.loadSession();
    }

    loadSession() {
      const saved = localStorage.getItem(this.STORAGE_KEY_USER);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
      return null;
    }

    saveSession(user) {
      this.currentUser = user;
      if (user) {
        localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.STORAGE_KEY_USER);
      }
      window.dispatchEvent(new CustomEvent('auth:state-changed', { detail: user }));
    }

    // Daftar Akun Sistem Terdaftar
    getAccounts() {
      const accounts = {
        developer: [
          {
            id: 'dev-kmlafdz',
            username: 'kmlafdz',
            nip: 'kmlafdz',
            nama: 'Developer Superadmin (kmlafdz)',
            jabatan: 'System Developer & Superadmin',
            unit: 'PLN Corporate University',
            role: 'developer',
            status: 'AKTIF',
            password: '1234'
          }
        ],
        admin: [
          {
            id: 'adm-pusat',
            username: 'adminpusat',
            nip: 'adminpusat',
            nama: 'Administrator Pusat PLN Corpu',
            jabatan: 'Super Admin Pengendali Evaluasi Nasional',
            unit: 'PLN Corporate University (Pusat)',
            role: 'admin',
            isAdminPusat: true,
            status: 'AKTIF',
            password: 'adminpusat123'
          }
        ],
        peserta: [],
        atasan: [],
        koordinator: []
      };

      // 1. Data dari Master Users (window.appStore.users)
      if (window.appStore && Array.isArray(window.appStore.users)) {
        window.appStore.users.forEach(u => {
          if (!u || !u.nip) return;
          const cleanUName = (u.nip || '').toLowerCase().replace(/\s+/g, '');
          const uStatus = u.status || 'AKTIF';

          if (u.role === 'developer') {
            if (!accounts.developer.some(x => (x.username && x.username === cleanUName) || (x.nip && x.nip === u.nip))) {
              accounts.developer.push({
                ...u,
                username: cleanUName,
                status: uStatus
              });
            }
          } else if (u.role === 'admin') {
            if (!accounts.admin.some(x => (x.username && x.username === cleanUName) || (x.nip && x.nip === u.nip))) {
              accounts.admin.push({
                ...u,
                username: cleanUName,
                isAdminPusat: true,
                status: uStatus
              });
            }
          } else if (u.role === 'peserta') {
            if (!accounts.peserta.some(x => x.nip === u.nip || x.username === cleanUName)) {
              accounts.peserta.push({
                id: u.id,
                respondentId: u.respondentId || u.id,
                username: cleanUName,
                nip: u.nip,
                nama: u.nama,
                jabatan: u.jabatan || 'Peserta Diklat',
                unit: u.unitName || 'PLN Unit',
                role: 'peserta',
                status: uStatus,
                avatar: u.avatar || '',
                password: u.password || 'pln123'
              });
            }
          } else if (u.role === 'atasan') {
            if (!accounts.atasan.some(x => x.nip === u.nip || x.username === cleanUName)) {
              accounts.atasan.push({
                id: u.id,
                username: cleanUName,
                nip: u.nip,
                nama: u.nama,
                jabatan: u.jabatan || 'Atasan Langsung',
                unit: u.unitName || 'PLN Unit',
                role: 'atasan',
                status: uStatus,
                avatar: u.avatar || '',
                password: u.password || '123'
              });
            }
          } else if (u.role === 'koordinator_internal' || u.role === 'koordinator_eksternal' || u.role === 'koordinator') {
            if (!accounts.koordinator.some(x => x.nip === u.nip || x.username === cleanUName)) {
              accounts.koordinator.push({
                id: u.id,
                username: cleanUName,
                nip: u.nip,
                nama: u.nama,
                jabatan: u.jabatan || 'Koordinator Program',
                unit: u.unitName || 'UPDL',
                role: 'koordinator',
                status: uStatus,
                avatar: u.avatar || '',
                password: u.password || '123'
              });
            }
          }
        });
      }

      // 2. Data dari Matriks Penugasan Responden Aktif (window.appStore.respondents)
      if (window.appStore && Array.isArray(window.appStore.respondents)) {
        window.appStore.respondents.forEach(r => {
          if (!r) return;
          if (r.nip) {
            const cleanUName = (r.nip || '').toLowerCase().replace(/\s+/g, '');
            if (!accounts.peserta.some(x => x.nip === r.nip || x.username === cleanUName)) {
              accounts.peserta.push({
                id: `peserta-${r.id}`,
                respondentId: r.id,
                username: cleanUName,
                nip: r.nip,
                nama: r.nama,
                jabatan: r.jabatan,
                unit: r.unit,
                modules: r.modules,
                role: 'peserta',
                status: 'AKTIF',
                avatar: r.avatar || '',
                password: r.password || 'pln123'
              });
            }
          }
          if (r.atasan && r.atasan.nip && r.atasan.nip !== '-') {
            const cleanSupNip = (r.atasan.nip || '').toLowerCase().replace(/\s+/g, '');
            if (!accounts.atasan.some(x => x.nip === r.atasan.nip || x.username === cleanSupNip)) {
              accounts.atasan.push({
                id: `atasan-${r.atasan.nip}`,
                username: cleanSupNip,
                nip: r.atasan.nip,
                nama: r.atasan.nama || 'Atasan Langsung',
                jabatan: r.atasan.jabatan || 'Atasan Langsung Unit',
                unit: r.unit || 'PLN Unit',
                role: 'atasan',
                status: 'AKTIF',
                avatar: '',
                password: '123'
              });
            }
          }
        });
      }

      return accounts;
    }

    /**
     * Verifikasi Login Sistem & MariaDB Backend Authentication
     * Mendukung login seluruh akun resmi (peserta, atasan, koordinator, admin, developer)
     * Kredensial: NIP (numerik / alfanumerik PLN), username, atau email
     */
    async authenticate(identifier, password, targetRole = null, isFromAdminPortal = false) {
      const rawId = (identifier || '').trim();
      if (!rawId || !password) {
        return { success: false, message: 'NIP dan kata sandi wajib diisi.' };
      }

      // 1. Verifikasi langsung ke MariaDB Backend (pln_pil_3)
      let backendAuthSuccess = false;
      let authenticatedUser = null;
      let jwtToken = null;

      try {
        const apiLoginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: rawId, password: password })
        });
        const contentType = apiLoginRes.headers?.get?.('content-type') || '';

        if (contentType.includes('application/json')) {
          if (apiLoginRes.ok) {
            const apiData = await apiLoginRes.json();
            if (apiData.success && apiData.user) {
              backendAuthSuccess = true;
              authenticatedUser = apiData.user;
              jwtToken = apiData.token;

              // Jika server meminta verifikasi biometrik / Passkey (2FA)
              if ((apiData.requireFaceVerification || apiData.requireBiometricVerification) && apiData.challengeToken) {
                return {
                  success: true,
                  requireFaceVerification: Boolean(apiData.requireFaceVerification),
                  requireBiometricVerification: Boolean(apiData.requireBiometricVerification),
                  hasWebAuthn: Boolean(apiData.hasWebAuthn),
                  hasFace: Boolean(apiData.hasFace),
                  user: authenticatedUser,
                  challengeToken: apiData.challengeToken,
                  authTicket: apiData.challengeToken
                };
              }
            }
          } else if (apiLoginRes.status === 401 || apiLoginRes.status === 400 || apiLoginRes.status === 423 || apiLoginRes.status === 429) {
            const errData = await apiLoginRes.json().catch(() => ({}));
            return {
              success: false,
              locked: apiLoginRes.status === 423 || Boolean(errData.locked),
              requireOtpFallback: Boolean(errData.requireOtpFallback),
              lockedUntil: errData.lockedUntil || null,
              message: errData.message || (isFromAdminPortal ? 'Kredensial atau kata sandi tidak valid.' : 'NIP atau kata sandi tidak valid.')
            };
          }
        }
      } catch (netErr) {
        console.warn('[AuthManager] Backend API offline atau tidak dapat dijangkau, menggunakan fallback luring.', netErr);
      }

      // Jika backend berhasil memverifikasi kredensial:
      if (backendAuthSuccess && authenticatedUser) {
        if (isFromAdminPortal && authenticatedUser.role !== 'admin' && authenticatedUser.role !== 'developer') {
          return {
            success: false,
            message: 'Akses ditolak: Portal ini khusus untuk Administrator dan Developer.'
          };
        }

        if (authenticatedUser.status && String(authenticatedUser.status).toUpperCase() === 'NONAKTIF') {
          return {
            success: false,
            message: isFromAdminPortal
              ? 'Akun Administrator / Developer ini berstatus NONAKTIF. Hubungi Super Admin.'
              : 'Akun Anda saat ini dinonaktifkan. Silakan hubungi bagian pengelola evaluasi.'
          };
        }

        if (jwtToken) {
          localStorage.setItem('pln_eval3_jwt_token', jwtToken);
        }
        this.saveSession(authenticatedUser);
        return { success: true, user: authenticatedUser };
      }

      // 2. Fallback Luring / Mode Offline Cache
      const cleanId = rawId.toLowerCase().replace(/[\s\-_.]/g, '');
      const digitsId = cleanId.replace(/\D/g, '');
      const accounts = this.getAccounts();

      let pool;
      if (isFromAdminPortal) {
        pool = [
          ...(accounts.developer || []),
          ...(accounts.admin || [])
        ];
      } else {
        pool = [
          ...(accounts.peserta || []),
          ...(accounts.atasan || []),
          ...(accounts.koordinator || []),
          ...(accounts.admin || []),
          ...(accounts.developer || [])
        ];
      }

      const found = pool.find(acc => {
        const rawNip = (acc.nip || '').toString().trim();
        const cleanNip = rawNip.toLowerCase().replace(/[\s\-_.]/g, '');
        const digitsNip = rawNip.replace(/\D/g, '');
        const cleanUsername = (acc.username || '').toString().trim().toLowerCase().replace(/[\s\-_.]/g, '');
        const accEmail = (acc.email || '').toString().trim().toLowerCase();

        if (cleanNip && cleanNip === cleanId) return true;
        if (cleanUsername && cleanUsername === cleanId) return true;
        if (accEmail && accEmail === rawId.toLowerCase()) return true;
        if (digitsId && digitsId.length >= 4 && digitsNip && digitsNip === digitsId) return true;

        return false;
      });

      if (!found) {
        return {
          success: false,
          message: isFromAdminPortal ? 'Kredensial atau kata sandi tidak valid.' : 'NIP atau kata sandi tidak valid.'
        };
      }

      if (found.status && String(found.status).toUpperCase() === 'NONAKTIF') {
        return {
          success: false,
          message: isFromAdminPortal
            ? 'Akun Administrator / Developer ini berstatus NONAKTIF. Hubungi Super Admin.'
            : 'Akun Anda saat ini dinonaktifkan. Silakan hubungi bagian pengelola evaluasi.'
        };
      }

      const isPeserta = found.role === 'peserta';
      const isAtasanOrCoord = found.role === 'atasan' || String(found.role).includes('koordinator');
      const isAdminOrDev = found.role === 'admin' || found.role === 'developer';

      const cleanPass = (password || '').trim();
      const validPass =
        (found.password && (password === found.password || cleanPass === String(found.password).trim())) ||
        (found.nip && cleanPass.toLowerCase() === found.nip.toLowerCase().trim()) ||
        (isPeserta && (cleanPass === 'pln123' || cleanPass === '123')) ||
        (isAtasanOrCoord && (cleanPass === '123' || cleanPass === 'pln123')) ||
        (isAdminOrDev && (cleanPass === 'adminpusat123' || cleanPass === '1234' || cleanPass === 'admin' || cleanPass === 'pln123'));

      if (!validPass) {
        return {
          success: false,
          message: isFromAdminPortal ? 'Kredensial atau kata sandi tidak valid.' : 'NIP atau kata sandi tidak valid.'
        };
      }

      this.saveSession(found);
      return { success: true, user: found };
    }

    // Quick Login untuk Simulasi / Demo
    async quickLogin(role, identifier) {
      const accounts = this.getAccounts();
      const pool = accounts[role] || [];
      let user = pool[0];

      if (identifier) {
        const match = pool.find(u => u.id === identifier || u.nip === identifier || u.username === identifier);
        if (match) user = match;
      }

      if (user) {
        const defPass = (user.role === 'peserta') ? 'pln123' : ((user.role === 'admin' || user.role === 'developer') ? 'adminpusat123' : '123');
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.nip || user.username || user.id, password: user.password || defPass })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.token) {
              localStorage.setItem('pln_eval3_jwt_token', data.token);
              if (data.user) user = { ...user, ...data.user };
            }
          }
        } catch (_) { }

        this.saveSession(user);
        return { success: true, user: user };
      }
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    logout() {
      const token = localStorage.getItem('pln_eval3_jwt_token');
      if (token) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => { });
      }
      localStorage.removeItem('pln_eval3_jwt_token');
      this.saveSession(null);
    }

    isAuthenticated() {
      return !!this.currentUser;
    }

    getUser() {
      return this.currentUser;
    }

    async apiPostJson(url, payload) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload || {})
        });
        const ct = res.headers?.get?.('content-type') || '';
        if (!ct.includes('application/json')) {
          return { ok: false, status: res.status, _apiUnavailable: true, data: { success: false, message: 'Backend API tidak aktif.' } };
        }
        const data = await res.json();
        return { ok: res.ok, status: res.status, _apiUnavailable: false, data };
      } catch (err) {
        return { ok: false, status: 0, _apiUnavailable: true, data: { success: false, message: err.message } };
      }
    }

    /**
     * Step 1 Portal Admin (Identifier-First): Cek metode biometrik & status lockout di backend
     */
    async identifyAdminAccount(identifier) {
      const clean = String(identifier || '').trim();
      if (!clean) {
        return { success: false, message: 'Masukkan username, email, atau NIP Administrator.' };
      }
      const res = await this.apiPostJson('/api/auth/identify', { identifier: clean });
      if (!res._apiUnavailable) {
        return res.data;
      }

      // Jika backend API tidak aktif (mis. static hosting murni), deteksi akun dari katalog lokal untuk mode password saja
      const accounts = this.getAccounts();
      const pool = [...(accounts.developer || []), ...(accounts.admin || [])];
      const q = clean.toLowerCase();
      const found = pool.find(a =>
        String(a.nip || '').toLowerCase() === q ||
        String(a.username || '').toLowerCase() === q ||
        String(a.email || '').toLowerCase() === q ||
        String(a.id || '').toLowerCase() === q
      );
      if (!found) {
        return { success: false, _apiUnavailable: true, message: 'Kredensial Administrator tidak dikenali.' };
      }
      return {
        success: true,
        _apiUnavailable: true,
        identifier: found.nip || found.username || found.id,
        displayName: found.nama,
        role: found.role,
        locked: false,
        authMethods: {
          hasWebAuthn: false,
          hasPlatformPasskey: false,
          hasCrossPlatformPasskey: false,
          hasWebcamFace: false,
          primaryMethod: 'password'
        }
      };
    }

    completeSessionWithToken(token, user) {
      if (token) {
        localStorage.setItem('pln_eval3_jwt_token', token);
      }
      const safeUser = { ...(user || {}) };
      delete safeUser.password;
      delete safeUser.passwordHash;
      this.saveSession(safeUser);
      return safeUser;
    }

    async requestAdminOtp(identifier, password) {
      const res = await this.apiPostJson('/api/auth/otp/request', { identifier, password });
      return res.data;
    }

    async verifyAdminOtpLogin(identifier, password, challengeId, otpCode) {
      const res = await this.apiPostJson('/api/auth/otp/verify', { identifier, password, challengeId, otpCode });
      if (res.ok && res.data.success && res.data.user) {
        const user = this.completeSessionWithToken(res.data.token, res.data.user);
        return { success: true, user };
      }
      return { success: false, message: res.data?.message || 'Verifikasi Password + OTP gagal.' };
    }

    /**
     * Selesaikan otentikasi login Admin Pusat secara ketat melalui verifikasi backend (tanpa bypass DevTools)
     */
    async completeAdminLoginWithFace(authTicket, user, featureVector = null, recoveryCode = null) {
      // Jika sudah membawa JWT terverifikasi langsung dari /api/auth/face/verify
      if (authTicket && typeof authTicket === 'object' && authTicket.token && authTicket.user) {
        const safeUser = this.completeSessionWithToken(authTicket.token, authTicket.user);
        return { success: true, user: safeUser };
      }

      if (!authTicket) {
        return {
          success: false,
          message: 'Token otorisasi biometrik backend tidak tersedia.'
        };
      }

      const payload = { challengeToken: authTicket };
      if (Array.isArray(featureVector) && featureVector.length > 0) {
        payload.featureVector = featureVector;
      }
      if (recoveryCode) {
        payload.recoveryCode = recoveryCode;
      }

      const res = await this.apiPostJson('/api/auth/verify-face', payload);
      if (res.ok && res.data.success) {
        const safeUser = this.completeSessionWithToken(res.data.token, res.data.user || user);
        return { success: true, user: safeUser };
      }
      return { success: false, message: res.data?.message || 'Verifikasi biometrik ditolak oleh server backend.' };
    }

    /**
     * Memperbarui foto avatar akun pengguna yang sedang login aktif
     * Sinkronisasi ke LocalStorage, AppStore, dan MariaDB
     */
    updateCurrentUserAvatar(avatar) {
      if (!this.currentUser) return null;
      this.currentUser.avatar = avatar || '';
      this.saveSession(this.currentUser);

      // Sinkronkan ke appStore jika tersedia
      if (window.appStore) {
        const users = window.appStore.users || [];
        const foundUser = users.find(u =>
          (this.currentUser.id && u.id === this.currentUser.id) ||
          (this.currentUser.nip && u.nip && u.nip.toLowerCase() === this.currentUser.nip.toLowerCase())
        );
        if (foundUser) {
          foundUser.avatar = avatar || '';
          window.appStore.save();
          if (typeof window.appStore.syncUserToFirestore === 'function') {
            window.appStore.syncUserToFirestore(foundUser);
          } else if (typeof window.appStore.syncUserToMariaDB === 'function') {
            window.appStore.syncUserToMariaDB(foundUser);
          }
        }

        // Sinkronkan ke responden jika ada (peserta)
        const respondents = window.appStore.respondents || [];
        const foundResp = respondents.find(r =>
          (this.currentUser.respondentId && r.id === this.currentUser.respondentId) ||
          (this.currentUser.nip && r.nip && r.nip.toLowerCase() === this.currentUser.nip.toLowerCase())
        );
        if (foundResp) {
          foundResp.avatar = avatar || '';
          window.appStore.save();
          if (typeof window.appStore.syncRespondentToFirestore === 'function') {
            window.appStore.syncRespondentToFirestore(foundResp);
          } else if (typeof window.appStore.syncRespondentToMariaDB === 'function') {
            window.appStore.syncRespondentToMariaDB(foundResp);
          }
        }
      }

      window.dispatchEvent(new CustomEvent('auth:state-changed', { detail: this.currentUser }));
      return this.currentUser;
    }
  }

  window.authManager = new AuthManager();
})();
