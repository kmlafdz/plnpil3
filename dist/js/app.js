/**
 * App Controller: Sistem Evaluasi Level 3 UP3 Metro
 * Mengorkestrasi autentikasi, routing, layout shell, modal, dan notifikasi toast
 */

(function () {
  // Utilitas Sanitasi Global Anti-XSS (Cross-Site Scripting)
  window.escapeHtml = function (str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Sistem Penguncian Scroll Background Modal Terpadu
  window.ModalHelper = {
    lockScroll: function () {
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
      const mainArea = document.getElementById('main-content-area');
      if (mainArea) mainArea.style.overflow = 'hidden';
      const mainViewport = document.querySelector('.main-viewport');
      if (mainViewport) mainViewport.style.overflow = 'hidden';
    },
    unlockScroll: function () {
      const hasBackdrop = document.querySelector('.modal-backdrop');
      const hasFixedModal = Array.from(document.querySelectorAll('.fixed.inset-0.z-50')).some(el => el.innerHTML.trim() !== '');
      const hasModalContainers = Array.from(document.querySelectorAll('[id$="-modal-container"]')).some(el => el.innerHTML.trim() !== '');

      if (!hasBackdrop && !hasFixedModal && !hasModalContainers) {
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        const mainArea = document.getElementById('main-content-area');
        if (mainArea) mainArea.style.overflow = '';
        const mainViewport = document.querySelector('.main-viewport');
        if (mainViewport) mainViewport.style.overflow = '';
      }
    },
    setupAutoLock: function () {
      try {
        const observer = new MutationObserver(() => {
          const hasBackdrop = document.querySelector('.modal-backdrop');
          const hasFixedModal = Array.from(document.querySelectorAll('.fixed.inset-0.z-50')).some(el => el.innerHTML.trim() !== '');
          const hasModalContainers = Array.from(document.querySelectorAll('[id$="-modal-container"]')).some(el => el.innerHTML.trim() !== '');

          if (hasBackdrop || hasFixedModal || hasModalContainers) {
            window.ModalHelper.lockScroll();
          } else {
            window.ModalHelper.unlockScroll();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      } catch (e) {
        console.warn('MutationObserver modal lock fallback', e);
      }
    }
  };

  window.App = {
    isPopState: false,

    // =========================================================================
    // SPA ROUTER: Pemetaan URL Dinamis per Halaman & Peran Pengguna
    // Mendukung /plncorpuadmin/dashboard, /peserta/beranda, /atasan/beranda, dll.
    // =========================================================================
    router: {
      // 1. Konversi kombinasi view & role ke format URL path resmi
      viewToUrl: function (view, role, params = {}) {
        const isAdm = role === 'admin' || role === 'developer';
        const isPeserta = role === 'peserta';
        const isAtasan = role === 'atasan';
        const isKoor = role && role.startsWith('koordinator');

        let path = '/';
        let query = '';

        if (isAdm) {
          const adminMap = {
            'dashboard': '/plncorpuadmin/dashboard',
            'peserta-list': '/plncorpuadmin/peserta',
            'atasan-list': '/plncorpuadmin/atasan',
            'koordinator-list': '/plncorpuadmin/koordinator',
            'penugasan': '/plncorpuadmin/penugasan',
            'progres': '/plncorpuadmin/progres',
            'hasil': '/plncorpuadmin/hasil',
            'laporan': '/plncorpuadmin/laporan',
            'admin-organisasi': '/plncorpuadmin/organisasi',
            'admin-users': '/plncorpuadmin/users',
            'admin-program': '/plncorpuadmin/program',
            'admin-bank-butir': '/plncorpuadmin/bank-butir',
            'admin-form-builder': '/plncorpuadmin/form-builder',
            'pengaturan': '/plncorpuadmin/pengaturan',
            'formulir': '/plncorpuadmin/formulir',
            'peserta-beranda': '/plncorpuadmin/peserta-beranda'
          };
          path = adminMap[view] || '/plncorpuadmin/dashboard';
        } else if (isPeserta) {
          const pesertaMap = {
            'peserta-beranda': '/peserta/beranda',
            'dashboard': '/peserta/beranda',
            'formulir': '/peserta/formulir'
          };
          path = pesertaMap[view] || '/peserta/beranda';
        } else if (isAtasan) {
          const atasanMap = {
            'evaluator-beranda': '/atasan/beranda',
            'dashboard': '/atasan/beranda',
            'formulir': '/atasan/formulir'
          };
          path = atasanMap[view] || '/atasan/beranda';
        } else if (isKoor) {
          const koorMap = {
            'evaluator-beranda': '/koordinator/beranda',
            'dashboard': '/koordinator/beranda',
            'formulir': '/koordinator/formulir'
          };
          path = koorMap[view] || '/koordinator/beranda';
        } else {
          // Pengguna belum login
          const currentPath = (window.location.pathname || '').toLowerCase();
          path = currentPath.includes('plncorpuadmin') ? '/plncorpuadmin' : '/';
        }

        const respId = params.respondentId || (window.appStore ? window.appStore.state.activeRespondentId : null);
        if (view === 'formulir' && respId && role !== 'peserta') {
          query = `?respondentId=${encodeURIComponent(respId)}`;
        }

        return path + query;
      },

      // 2. Parsing URL path browser ke representasi view dan parameter aplikasi
      parseUrl: function (pathname, search, role) {
        const clean = (pathname || window.location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
        const params = new URLSearchParams(search || window.location.search || '');
        const respondentId = params.get('respondentId');

        // Rute Portal Administrator & Developer (/plncorpuadmin/...)
        if (clean.startsWith('/plncorpuadmin')) {
          if (clean === '/plncorpuadmin' || clean === '/plncorpuadmin/login') {
            return { view: 'dashboard' };
          }
          if (clean === '/plncorpuadmin/dashboard') return { view: 'dashboard' };
          if (clean === '/plncorpuadmin/peserta' || clean === '/plncorpuadmin/peserta-list') return { view: 'peserta-list' };
          if (clean === '/plncorpuadmin/atasan' || clean === '/plncorpuadmin/atasan-list') return { view: 'atasan-list' };
          if (clean === '/plncorpuadmin/koordinator' || clean === '/plncorpuadmin/koordinator-list') return { view: 'koordinator-list' };
          if (clean === '/plncorpuadmin/penugasan') return { view: 'penugasan' };
          if (clean === '/plncorpuadmin/progres') return { view: 'progres' };
          if (clean === '/plncorpuadmin/hasil') return { view: 'hasil' };
          if (clean === '/plncorpuadmin/laporan') return { view: 'laporan' };
          if (clean === '/plncorpuadmin/organisasi' || clean === '/plncorpuadmin/admin-organisasi') {
            return { view: 'admin-organisasi' };
          }
          if (clean === '/plncorpuadmin/users' || clean === '/plncorpuadmin/pengguna') {
            return { view: 'admin-users' };
          }
          if (clean === '/plncorpuadmin/program' || clean === '/plncorpuadmin/admin-program') {
            return { view: 'admin-program' };
          }
          if (clean === '/plncorpuadmin/bank-butir' || clean === '/plncorpuadmin/admin-bank-butir') {
            return { view: 'admin-bank-butir' };
          }
          if (clean === '/plncorpuadmin/form-builder' || clean === '/plncorpuadmin/admin-form-builder') {
            return { view: 'admin-form-builder' };
          }
          if (clean === '/plncorpuadmin/pengaturan') return { view: 'pengaturan' };
          if (clean === '/plncorpuadmin/formulir') return { view: 'formulir', respondentId };
          if (clean === '/plncorpuadmin/peserta-beranda') return { view: 'peserta-beranda' };
          return { view: 'dashboard' };
        }

        // Rute Portal Peserta (/peserta/...)
        if (clean.startsWith('/peserta')) {
          if (clean === '/peserta/formulir') return { view: 'formulir', respondentId };
          return { view: 'peserta-beranda' };
        }

        // Rute Portal Atasan Langsung (/atasan/...)
        if (clean.startsWith('/atasan')) {
          if (clean === '/atasan/formulir') return { view: 'formulir', respondentId };
          return { view: 'evaluator-beranda' };
        }

        // Rute Portal Koordinator Program (/koordinator/...)
        if (clean.startsWith('/koordinator')) {
          if (clean === '/koordinator/formulir') return { view: 'formulir', respondentId };
          return { view: 'evaluator-beranda' };
        }

        // Rute Generik Evaluator (/evaluator/...)
        if (clean.startsWith('/evaluator')) {
          if (clean === '/evaluator/formulir') return { view: 'formulir', respondentId };
          return { view: 'evaluator-beranda' };
        }

        // Rute Alternatif Langsung (Top-level shortcuts)
        if (clean === '/dashboard') {
          return { view: role === 'peserta' ? 'peserta-beranda' : (role === 'atasan' || role?.startsWith('koor') ? 'evaluator-beranda' : 'dashboard') };
        }
        if (clean === '/formulir') {
          return { view: 'formulir', respondentId };
        }
        if (clean === '/beranda') {
          return { view: role === 'peserta' ? 'peserta-beranda' : 'evaluator-beranda' };
        }

        return null;
      },

      // 3. Judul Halaman (Document Title) Otomatis
      getTitle: function (view, role) {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
          const isAdm = window.location.pathname.toLowerCase().includes('plncorpuadmin');
          return isAdm ? 'Masuk Portal Administrator — PLN Corpu' : 'Masuk Portal Evaluasi Level 3 — PLN Impact Lab';
        }

        if (role === 'peserta') {
          if (view === 'formulir') return 'Formulir Evaluasi Diri (Level 3) — PLN Corpu';
          return 'Beranda Peserta — Evaluasi Level 3 PLN Corpu';
        }
        if (role === 'atasan') {
          if (view === 'formulir') return 'Formulir Penilaian Peserta (Atasan) — PLN Corpu';
          return 'Portal Evaluasi Binaan (Atasan Langsung) — PLN Corpu';
        }
        if (role && role.startsWith('koordinator')) {
          if (view === 'formulir') return 'Formulir Penilaian Peserta (Koordinator) — PLN Corpu';
          return 'Portal Evaluasi Binaan (Koordinator Diklat) — PLN Corpu';
        }

        // Administrator & Developer
        const titles = {
          dashboard: 'Dashboard Administrator — PLN Corpu',
          'peserta-list': 'Data Peserta Diklat — Admin PLN Corpu',
          'atasan-list': 'Data Atasan Langsung — Admin PLN Corpu',
          'koordinator-list': 'Data Koordinator Pembelajaran — Admin PLN Corpu',
          penugasan: 'Penugasan Penilai — Admin PLN Corpu',
          progres: 'Monitoring Progres Pengisian — Admin PLN Corpu',
          hasil: 'Hasil & Analitik Evaluasi — Admin PLN Corpu',
          laporan: 'Laporan & Ekspor Data — Admin PLN Corpu',
          'admin-organisasi': 'Master Organisasi (UPDL & Unit) — Admin PLN Corpu',
          'admin-users': 'Data Pengguna / Akun User — Admin PLN Corpu',
          'admin-program': 'Program Pembelajaran & Periode — Admin PLN Corpu',
          'admin-bank-butir': 'Bank Butir Evaluasi (11 Butir) — Admin PLN Corpu',
          'admin-form-builder': 'Builder Formulir Evaluasi (3 Perspektif) — Admin PLN Corpu',
          pengaturan: 'Pengaturan Sistem — Admin PLN Corpu',
          formulir: 'Formulir Evaluasi Peserta — Admin PLN Corpu',
          'peserta-beranda': 'Simulasi Beranda Peserta — Admin PLN Corpu'
        };
        return titles[view] || 'Sistem Evaluasi Level 3 — PLN Corpu';
      },

      // 4. Sinkronisasi URL Address Bar & Document Title
      syncBrowserUrl: function (view, role, params = {}) {
        if (window.App.isPopState) {
          window.App.isPopState = false;
          document.title = this.getTitle(view, role);
          return;
        }

        const targetUrl = this.viewToUrl(view, role, params);
        const currentUrl = window.location.pathname + window.location.search;

        if (currentUrl !== targetUrl) {
          window.history.pushState({ view, role, params }, '', targetUrl);
        }
        document.title = this.getTitle(view, role);
      },

      // 5. Inisialisasi Router saat aplikasi pertama kali dimuat
      init: function () {
        const path = window.location.pathname;
        const search = window.location.search;
        const isAuth = window.authManager && window.authManager.isAuthenticated();
        const user = isAuth ? window.authManager.getUser() : null;
        const role = user ? user.role : null;

        if (isAuth && role) {
          const parsed = this.parseUrl(path, search, role);
          if (parsed && parsed.view) {
            if (parsed.tab && window.AdminOrganisasiView) {
              window.AdminOrganisasiView.activeTab = parsed.tab;
            }
            if (parsed.respondentId && window.appStore) {
              window.appStore.state.activeRespondentId = Number(parsed.respondentId);
            }
            if (window.appStore) {
              window.appStore.state.view = parsed.view;
              window.appStore.state.role = role;
            }
          } else {
            // Arahkan ke default view sesuai role pengguna
            const defaultView = (role === 'peserta') ? 'peserta-beranda' : ((role === 'atasan' || role.startsWith('koor')) ? 'evaluator-beranda' : 'dashboard');
            if (window.appStore) {
              window.appStore.state.view = defaultView;
              window.appStore.state.role = role;
            }
          }

          const currentView = window.appStore ? window.appStore.state.view : 'dashboard';
          const targetUrl = this.viewToUrl(currentView, role, { respondentId: window.appStore?.state?.activeRespondentId });
          if (path + search !== targetUrl) {
            window.history.replaceState({ view: currentView, role }, '', targetUrl);
          }
          document.title = this.getTitle(currentView, role);
        } else {
          // Pengguna belum login
          if (path.toLowerCase().startsWith('/plncorpuadmin')) {
            if (path !== '/plncorpuadmin' && path !== '/plncorpuadmin/login') {
              sessionStorage.setItem('pln_eval3_redirect', path + search);
              window.history.replaceState(null, '', '/plncorpuadmin');
            }
            document.title = 'Masuk Portal Administrator — PLN Corpu';
          } else {
            if (path !== '/' && path !== '/login') {
              sessionStorage.setItem('pln_eval3_redirect', path + search);
              window.history.replaceState(null, '', '/');
            }
            document.title = 'Masuk Portal Evaluasi Level 3 — PLN Impact Lab';
          }
        }

        // Listener navigasi tombol Back / Forward browser
        window.addEventListener('popstate', () => {
          this.handlePopState();
        });
      },

      // 6. Tangani event PopState (tombol Back / Forward)
      handlePopState: function () {
        window.App.isPopState = true;
        const isAuth = window.authManager && window.authManager.isAuthenticated();
        const user = isAuth ? window.authManager.getUser() : null;
        const role = user ? user.role : null;

        if (isAuth && role) {
          const parsed = this.parseUrl(window.location.pathname, window.location.search, role);
          if (parsed && parsed.view) {
            if (parsed.tab && window.AdminOrganisasiView) {
              window.AdminOrganisasiView.activeTab = parsed.tab;
            }
            if (parsed.respondentId && window.appStore) {
              window.appStore.setActiveRespondentId(Number(parsed.respondentId));
            }
            if (window.appStore) {
              window.appStore.setView(parsed.view, parsed);
            }
          } else {
            window.App.render();
          }
        } else {
          window.App.render();
        }
      }
    },

    init: function () {
      window.ModalHelper.setupAutoLock();
      this.initIntroAnimation();
      this.bindLayoutEvents();
      this.router.init();
      this.render();

      // Subscribe ke pembaruan store
      window.appStore.subscribe(() => {
        // Jangan re-render view utama jika ada modal yang sedang aktif di layar
        const hasOpenModal = document.querySelector('.modal-backdrop') ||
          document.querySelector('.fixed.inset-0.z-50') ||
          document.body.classList.contains('modal-open') ||
          document.documentElement.classList.contains('modal-open') ||
          Array.from(document.querySelectorAll('[id$="-modal-container"]')).some(el => el.children.length > 0 || (el.innerHTML && el.innerHTML.trim() !== ''));

        if (hasOpenModal) {
          return;
        }

        // Jangan re-render jika user sedang fokus berinteraksi di formulir/input
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
          return;
        }

        this.render();
      });

      // Subscribe ke perubahan status autentikasi
      window.addEventListener('auth:state-changed', () => {
        this.render();
      });

      // Indikator Sinkronisasi Database MariaDB Server KemzKun Server (pln_pil_3)
      const handleSyncStatus = (e) => {
        const badge = document.getElementById('live-sync-badge');
        const icon = document.getElementById('live-sync-icon');
        const text = document.getElementById('live-sync-text');
        if (!badge || !icon || !text) return;

        const status = (e.detail && e.detail.status) || 'synced';
        const customLabel = e.detail && e.detail.label;
        if (status === 'synced') {
          badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] text-[#065F46] font-medium transition-all';
          icon.textContent = 'cloud_done';
          icon.className = 'material-symbols-outlined text-[13px] text-[#059669]';
          text.textContent = customLabel || 'Cloud Firestore: plncorpu';
        } else if (status === 'syncing') {
          badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] text-[#1D4ED8] font-medium transition-all';
          icon.textContent = 'sync';
          icon.className = 'material-symbols-outlined text-[13px] text-[#2563EB] animate-spin';
          text.textContent = 'Menyimpan ke Cloud...';
        } else if (status === 'error') {
          badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[11px] text-[#92400E] font-medium transition-all';
          icon.textContent = 'cloud_off';
          icon.className = 'material-symbols-outlined text-[13px] text-[#D97706]';
          text.textContent = 'Mode Offline (Lokal)';
        }
      };
      window.addEventListener('firestore:sync-status', handleSyncStatus);
      window.addEventListener('mariadb:sync-status', handleSyncStatus);

      // Auto-close sidebar on resize to desktop
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
          this.closeMobileSidebar();
        }
      });
    },

    // Inisialisasi & Pengendalian Animasi Intro Brand PLN CorPu
    initIntroAnimation: function () {
      const splash = document.getElementById('pln-intro-splash');
      if (!splash) return;

      let isDismissed = false;

      const dismissIntro = () => {
        if (isDismissed) return;
        isDismissed = true;
        splash.classList.add('pln-intro-hidden');
        setTimeout(() => {
          if (splash.parentNode) {
            splash.parentNode.removeChild(splash);
          }
        }, 700);
      };

      // Klik layar atau tekan Escape untuk lewati cepat secara natural
      splash.addEventListener('click', () => {
        dismissIntro();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !isDismissed) {
          dismissIntro();
        }
      });

      // Otomatis transisi ke aplikasi utama setelah 2.4 detik
      setTimeout(() => {
        dismissIntro();
      }, 2400);
    },

    openMobileSidebar: function () {
      const sidebar = document.getElementById('sidebar-main') || document.querySelector('.sidebar-fixed');
      const backdrop = document.getElementById('sidebar-mobile-backdrop');
      if (sidebar) sidebar.classList.add('sidebar-open');
      if (backdrop) backdrop.classList.add('active');
    },

    closeMobileSidebar: function () {
      const sidebar = document.getElementById('sidebar-main') || document.querySelector('.sidebar-fixed');
      const backdrop = document.getElementById('sidebar-mobile-backdrop');
      if (sidebar) sidebar.classList.remove('sidebar-open');
      if (backdrop) backdrop.classList.remove('active');
    },

    toggleMobileSidebar: function () {
      const sidebar = document.getElementById('sidebar-main') || document.querySelector('.sidebar-fixed');
      if (sidebar && sidebar.classList.contains('sidebar-open')) {
        this.closeMobileSidebar();
      } else {
        this.openMobileSidebar();
      }
    },

    bindLayoutEvents: function () {
      // Mobile Drawer Toggle & Close Events
      const btnMobileToggle = document.getElementById('btn-mobile-sidebar-toggle');
      if (btnMobileToggle) {
        btnMobileToggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleMobileSidebar();
        });
      }

      const btnCloseMobile = document.getElementById('btn-close-sidebar-mobile');
      if (btnCloseMobile) {
        btnCloseMobile.addEventListener('click', (e) => {
          e.preventDefault();
          this.closeMobileSidebar();
        });
      }

      const backdropMobile = document.getElementById('sidebar-mobile-backdrop');
      if (backdropMobile) {
        backdropMobile.addEventListener('click', () => {
          this.closeMobileSidebar();
        });
      }

      // Sidebar Navigation links
      document.querySelectorAll('.nav-link-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const view = item.getAttribute('data-view');
          if (view) {
            window.appStore.setView(view);
            this.closeMobileSidebar();
          }
        });
      });

      // Mobile Bottom Navigation links
      document.querySelectorAll('#mobile-bottom-nav .mobile-nav-btn[data-view]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const view = btn.getAttribute('data-view');
          if (view) {
            window.appStore.setView(view);
          }
        });
      });

      // Logout buttons
      const handleLogout = () => {
        this.showModal({
          title: 'Konfirmasi Keluar Sesi',
          content: 'Apakah Anda yakin ingin keluar dari portal Evaluasi Level 3?',
          confirmText: 'Ya, Keluar',
          cancelText: 'Batal',
          onConfirm: () => {
            this.closeMobileSidebar();
            const isAdmin = window.location.pathname.toLowerCase().includes('plncorpuadmin');
            window.authManager.logout();
            const redirectUrl = isAdmin ? '/plncorpuadmin' : '/';
            window.history.pushState(null, '', redirectUrl);
            this.render();
            this.showToast('Anda telah berhasil keluar dari sesi.', 'info');
          }
        });
      };

      document.getElementById('btn-topbar-logout')?.addEventListener('click', () => {
        toggleDropdown(false);
        handleLogout();
      });
      document.getElementById('btn-sidebar-logout')?.addEventListener('click', handleLogout);
      document.getElementById('btn-mobile-bottom-logout')?.addEventListener('click', handleLogout);

      // Trigger Modal Ubah Avatar dari Profil Topbar & Sidebar
      const openAvatarTrigger = (e) => {
        if (e) e.preventDefault();
        if (window.AvatarManager && typeof window.AvatarManager.openAvatarModal === 'function') {
          window.AvatarManager.openAvatarModal({
            onSave: (updatedUser) => {
              this.updateUserProfileUI(updatedUser);
              this.render();
            }
          });
        }
      };

      // Topbar User Dropdown Pop-up
      const topbarUserBadge = document.getElementById('topbar-user-badge');
      const topbarUserDropdown = document.getElementById('topbar-user-dropdown');
      const topbarUserChevron = document.getElementById('topbar-user-chevron');

      const toggleDropdown = (show = null) => {
        if (!topbarUserDropdown) return;
        const isHidden = topbarUserDropdown.classList.contains('hidden');
        const shouldShow = show !== null ? show : isHidden;
        if (shouldShow) {
          topbarUserDropdown.classList.remove('hidden');
          topbarUserBadge?.setAttribute('aria-expanded', 'true');
          if (topbarUserChevron) topbarUserChevron.style.transform = 'rotate(180deg)';
        } else {
          topbarUserDropdown.classList.add('hidden');
          topbarUserBadge?.setAttribute('aria-expanded', 'false');
          if (topbarUserChevron) topbarUserChevron.style.transform = 'rotate(0deg)';
        }
      };

      topbarUserBadge?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
      });

      // Menutup pop-up saat klik di luar area
      document.addEventListener('click', (e) => {
        if (topbarUserDropdown && !topbarUserDropdown.contains(e.target) && !topbarUserBadge?.contains(e.target)) {
          toggleDropdown(false);
        }
      });

      // Menutup pop-up saat tekan tombol ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && topbarUserDropdown && !topbarUserDropdown.classList.contains('hidden')) {
          toggleDropdown(false);
        }
      });

      // Tombol navigasi ke Pengaturan dari pop up dropdown profil
      document.getElementById('btn-dropdown-settings')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleDropdown(false);
        if (window.appStore) {
          window.appStore.setView('pengaturan');
        }
      });

      // Tombol ubah avatar di dalam pop up dropdown
      document.getElementById('btn-dropdown-avatar')?.addEventListener('click', (e) => {
        toggleDropdown(false);
        openAvatarTrigger(e);
      });

      document.getElementById('sidebar-user-badge')?.addEventListener('click', openAvatarTrigger);
    },

    getRoleLabel: function (role) {
      switch (role) {
        case 'developer': return 'Developer & Super Admin';
        case 'admin': return 'Administrator Penyelenggara';
        case 'peserta': return 'Peserta Pelatihan (Self-Assessment)';
        case 'atasan': return 'Atasan Langsung (Direct Supervisor)';
        case 'koordinator': return 'Koordinator Program / UPDL';
        default: return role;
      }
    },

    render: function () {
      const loginContainer = document.getElementById('login-container');
      const appLayout = document.getElementById('app-layout');
      const mobileBottomNav = document.getElementById('mobile-bottom-nav');

      // Cek Status Autentikasi
      if (!window.authManager.isAuthenticated()) {
        const isAdminPortal = window.location.pathname.toLowerCase().includes('plncorpuadmin');
        const expectedAuthUrl = isAdminPortal ? '/plncorpuadmin' : '/';
        const currentPath = window.location.pathname;

        if (currentPath !== expectedAuthUrl && !sessionStorage.getItem('pln_eval3_redirect')) {
          sessionStorage.setItem('pln_eval3_redirect', currentPath + window.location.search);
          window.history.replaceState(null, '', expectedAuthUrl);
        }
        document.title = this.router.getTitle(null, null);

        if (loginContainer) {
          loginContainer.classList.remove('hidden');
          window.LoginView.render(loginContainer);
        }
        if (appLayout) {
          appLayout.classList.add('hidden');
        }
        if (mobileBottomNav) {
          mobileBottomNav.classList.add('hidden');
        }
        this.closeMobileSidebar();
        return;
      }

      // Pengguna Terotentikasi: Tampilkan Shell Aplikasi
      if (loginContainer) loginContainer.classList.add('hidden');
      if (appLayout) appLayout.classList.remove('hidden');

      const user = window.authManager.getUser();
      const currentView = window.appStore.getView();
      const currentRole = window.appStore.getRole();

      // Sinkronkan URL Address Bar & Document Title secara otomatis
      this.router.syncBrowserUrl(currentView, currentRole, { respondentId: window.appStore.state.activeRespondentId });

      // Reset Scroll Posisi HANYA saat benar-benar berpindah halaman/view atau role navigasi
      const isPageTransition = (this.lastActiveView !== currentView) || (this.lastActiveRole !== currentRole);
      if (isPageTransition) {
        this.resetScrollPosition();
        this.lastActiveView = currentView;
        this.lastActiveRole = currentRole;
      }

      // Update Mobile Bottom Nav (hanya untuk peserta)
      if (mobileBottomNav) {
        if (currentRole === 'peserta') {
          mobileBottomNav.classList.remove('hidden');
          mobileBottomNav.querySelectorAll('.mobile-nav-btn[data-view]').forEach(btn => {
            const targetView = btn.getAttribute('data-view');
            if (targetView === currentView || (targetView === 'peserta-beranda' && currentView === 'dashboard')) {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          });
        } else {
          mobileBottomNav.classList.add('hidden');
        }
      }

      // Sinkronkan Data Profil Pengguna di UI
      this.updateUserProfileUI(user);

      // Render Navigasi Sidebar Sesuai Role
      this.renderSidebarNav(currentRole, currentView);

      // Sinkronkan Breadcrumb Topbar
      const breadcrumbEl = document.getElementById('topbar-breadcrumb');
      if (breadcrumbEl) {
        breadcrumbEl.textContent = this.getViewBreadcrumb(currentView, currentRole);
      }

      // Render View Aktif
      const container = document.getElementById('main-content-area');
      if (!container) return;

      // Proteksi Pengisian Formulir: Jangan hancurkan DOM formulir jika pengguna sedang berada di halaman formulir yang sama
      if (currentView === 'formulir' && !isPageTransition && container.querySelector('#autosave-status-badge')) {
        return;
      }

      // Role Guard untuk Peserta
      if (currentRole === 'peserta') {
        if (currentView === 'peserta-beranda' || currentView === 'dashboard') {
          if (window.PesertaBerandaView) {
            window.PesertaBerandaView.render(container);
          }
          return;
        } else if (currentView === 'formulir') {
          if (window.FormulirView) {
            window.FormulirView.render(container);
          }
          return;
        } else {
          this.renderUnderDevelopmentNotice(container, user);
          return;
        }
      }

      // Role Guard untuk Atasan & Koordinator (Evaluator Binaan)
      const isEvaluator = currentRole === 'atasan' || currentRole === 'koordinator' || currentRole === 'koordinator_internal' || currentRole === 'koordinator_eksternal';
      if (isEvaluator) {
        if (currentView === 'evaluator-beranda' || currentView === 'dashboard' || !currentView) {
          if (window.EvaluatorBerandaView) {
            window.EvaluatorBerandaView.render(container);
          }
          return;
        } else if (currentView === 'formulir') {
          if (window.FormulirView) {
            window.FormulirView.render(container);
          }
          return;
        } else {
          if (window.EvaluatorBerandaView) {
            window.EvaluatorBerandaView.render(container);
          }
          return;
        }
      }

      // Role Guard selain Admin & Developer
      if (currentRole !== 'admin' && currentRole !== 'developer') {
        this.renderUnderDevelopmentNotice(container, user);
        return;
      }

      // Role: Administrator
      if (currentView === 'dashboard') {
        window.DashboardView.render(container);
      } else if (currentView === 'peserta-list') {
        window.PesertaListView.render(container);
      } else if (currentView === 'atasan-list') {
        window.AtasanListView.render(container);
      } else if (currentView === 'koordinator-list') {
        window.KoordinatorListView.render(container);
      } else if (currentView === 'admin-organisasi') {
        window.AdminOrganisasiView.render(container);
      } else if (currentView === 'admin-users') {
        window.AdminUsersView.render(container);
      } else if (currentView === 'admin-program') {
        window.AdminProgramView.render(container);
      } else if (currentView === 'admin-bank-butir') {
        window.AdminBankButirView.render(container);
      } else if (currentView === 'admin-form-builder') {
        window.AdminFormBuilderView.render(container);
      } else if (currentView === 'penugasan') {
        window.PenugasanView.render(container);
      } else if (currentView === 'progres') {
        window.ProgresView.render(container);
      } else if (currentView === 'hasil') {
        window.HasilView.render(container);
      } else if (currentView === 'formulir') {
        window.FormulirView.render(container);
      } else if (currentView === 'laporan') {
        window.LaporanView.render(container);
      } else if (currentView === 'pengaturan') {
        window.PengaturanView.render(container);
      } else if (currentView === 'peserta-beranda') {
        window.PesertaBerandaView.render(container);
      } else {
        window.DashboardView.render(container);
      }
    },

    updateUserProfileUI: function (user) {
      if (!user) return;

      const initial = (user.nama || 'U').charAt(0).toUpperCase();

      // Sidebar Profile
      const sideName = document.getElementById('sidebar-user-name');
      const sideRole = document.getElementById('sidebar-user-role');
      const sideAvatar = document.getElementById('sidebar-user-avatar');
      if (sideName) sideName.textContent = user.nama;
      if (sideRole) sideRole.textContent = this.getRoleLabel(user.role);
      if (sideAvatar) {
        if (user.avatar) {
          sideAvatar.innerHTML = `<img src="${user.avatar}" alt="${user.nama}" class="w-full h-full object-cover rounded-full" onerror="this.onerror=null; this.parentElement.textContent='${initial}';" />`;
        } else {
          sideAvatar.textContent = initial;
        }
      }

      // Topbar Profile
      const topName = document.getElementById('topbar-user-name');
      const topRole = document.getElementById('topbar-user-role');
      const topAvatar = document.getElementById('topbar-user-avatar');
      if (topName) topName.textContent = user.nama;
      if (topRole) topRole.textContent = `${user.unit || 'PLN UP3 Metro'} • ${this.getRoleLabel(user.role)}`;
      if (topAvatar) {
        if (user.avatar) {
          topAvatar.innerHTML = `<img src="${user.avatar}" alt="${user.nama}" class="w-full h-full object-cover rounded-full" onerror="this.onerror=null; this.parentElement.textContent='${initial}';" />`;
        } else {
          topAvatar.textContent = initial;
        }
      }

      // Topbar Dropdown Pop-up Profile
      const dropName = document.getElementById('dropdown-user-name');
      const dropRole = document.getElementById('dropdown-user-role');
      const dropUnit = document.getElementById('dropdown-user-unit');
      const dropAvatar = document.getElementById('dropdown-user-avatar');
      if (dropName) dropName.textContent = user.nama;
      if (dropRole) dropRole.textContent = this.getRoleLabel(user.role);
      if (dropUnit) dropUnit.textContent = `${user.unit || 'PLN UP3 Metro'} • ${user.email || user.username || ''}`;
      if (dropAvatar) {
        if (user.avatar) {
          dropAvatar.innerHTML = `<img src="${user.avatar}" alt="${user.nama}" class="w-full h-full object-cover rounded-full" onerror="this.onerror=null; this.parentElement.textContent='${initial}';" />`;
        } else {
          dropAvatar.textContent = initial;
        }
      }
    },

    getViewBreadcrumb: function (view, role) {
      if (role === 'peserta') {
        if (view === 'peserta-beranda' || view === 'dashboard') return 'Beranda Peserta';
        if (view === 'formulir') return 'Formulir Evaluasi Diri (Level 3)';
      }
      if (role === 'atasan' || role === 'koordinator' || role === 'koordinator_internal' || role === 'koordinator_eksternal') {
        const roleLabel = role === 'atasan' ? 'Atasan Langsung' : 'Koordinator';
        if (view === 'evaluator-beranda' || view === 'dashboard') return `Portal Evaluasi - ${roleLabel}`;
        if (view === 'formulir') return `Formulir Penilaian Peserta (${roleLabel})`;
      }
      const map = {
        dashboard: 'Dashboard Administrator',
        'peserta-list': 'Data Peserta Pelatihan',
        'atasan-list': 'Data Atasan Langsung (Evaluator)',
        'koordinator-list': 'Data Koordinator Pembelajaran',
        'evaluator-beranda': 'Portal Penilaian Evaluator',
        'admin-organisasi': 'Master Organisasi (UPDL & Unit)',
        'admin-users': 'Data Pengguna / Akun User',
        'admin-program': 'Program Pembelajaran & Periode Evaluasi',
        'admin-bank-butir': 'Bank Butir Evaluasi (11 Butir)',
        'admin-form-builder': 'Builder Formulir Evaluasi (3 Perspektif)',
        penugasan: 'Penugasan Penilai',
        progres: 'Monitoring Progres Pengisian',
        hasil: 'Hasil & Analitik Evaluasi Level 3',
        formulir: 'Formulir Evaluasi Diri (Level 3)',
        'peserta-beranda': 'Beranda Peserta',
        laporan: 'Laporan & Ekspor Data',
        pengaturan: 'Pengaturan Sistem'
      };
      return map[view] || 'Dashboard';
    },

    // Render Dinamis Navigasi Sidebar Sesuai Role Pengguna
    renderSidebarNav: function (role, currentView) {
      const navContainer = document.getElementById('sidebar-nav-container');
      if (!navContainer) return;

      if (role === 'peserta') {
        navContainer.innerHTML = `
          <div class="px-4 py-1.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
            Portal Peserta
          </div>
          
          <a href="/peserta/beranda" class="nav-link-item ${currentView === 'peserta-beranda' || currentView === 'dashboard' ? 'active' : ''}" data-view="peserta-beranda">
            <span class="material-symbols-outlined text-[18px]">home</span>
            <span>Beranda Peserta</span>
          </a>

          <a href="/peserta/formulir" class="nav-link-item ${currentView === 'formulir' ? 'active' : ''}" data-view="formulir">
            <span class="material-symbols-outlined text-[18px]">edit_document</span>
            <span>Formulir Evaluasi</span>
          </a>
        `;
      } else if (role === 'atasan') {
        navContainer.innerHTML = `
          <div class="px-4 py-1.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
            Portal Atasan Langsung
          </div>
          
          <a href="/atasan/beranda" class="nav-link-item ${currentView === 'evaluator-beranda' || currentView === 'dashboard' || !currentView ? 'active' : ''}" data-view="evaluator-beranda">
            <span class="material-symbols-outlined text-[18px]">group</span>
            <span>Daftar Peserta Binaan</span>
          </a>

          <a href="/atasan/formulir" class="nav-link-item ${currentView === 'formulir' ? 'active' : ''}" data-view="formulir">
            <span class="material-symbols-outlined text-[18px]">rate_review</span>
            <span>Formulir Penilaian</span>
          </a>
        `;
      } else if (role && role.startsWith('koordinator')) {
        navContainer.innerHTML = `
          <div class="px-4 py-1.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
            Portal Koordinator Program
          </div>
          
          <a href="/koordinator/beranda" class="nav-link-item ${currentView === 'evaluator-beranda' || currentView === 'dashboard' || !currentView ? 'active' : ''}" data-view="evaluator-beranda">
            <span class="material-symbols-outlined text-[18px]">group</span>
            <span>Daftar Peserta Binaan</span>
          </a>

          <a href="/koordinator/formulir" class="nav-link-item ${currentView === 'formulir' ? 'active' : ''}" data-view="formulir">
            <span class="material-symbols-outlined text-[18px]">rate_review</span>
            <span>Formulir Penilaian</span>
          </a>
        `;
      } else {
        // Admin & Developer Nav
        navContainer.innerHTML = `
          <div class="px-4 py-1.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
            Menu Utama
          </div>
          
          <a href="/plncorpuadmin/dashboard" class="nav-link-item ${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
            <span class="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Dashboard</span>
          </a>

          <a href="/plncorpuadmin/peserta" class="nav-link-item ${currentView === 'peserta-list' ? 'active' : ''}" data-view="peserta-list">
            <span class="material-symbols-outlined text-[18px]">group</span>
            <span>Peserta</span>
          </a>

          <a href="/plncorpuadmin/atasan" class="nav-link-item ${currentView === 'atasan-list' ? 'active' : ''}" data-view="atasan-list">
            <span class="material-symbols-outlined text-[18px]">supervisor_account</span>
            <span>Atasan</span>
          </a>

          <a href="/plncorpuadmin/koordinator" class="nav-link-item ${currentView === 'koordinator-list' ? 'active' : ''}" data-view="koordinator-list">
            <span class="material-symbols-outlined text-[18px]">manage_accounts</span>
            <span>Koordinator</span>
          </a>

          <a href="/plncorpuadmin/penugasan" class="nav-link-item ${currentView === 'penugasan' ? 'active' : ''}" data-view="penugasan">
            <span class="material-symbols-outlined text-[18px]">assignment_ind</span>
            <span>Penugasan Penilai</span>
          </a>

          <a href="/plncorpuadmin/progres" class="nav-link-item ${currentView === 'progres' ? 'active' : ''}" data-view="progres">
            <span class="material-symbols-outlined text-[18px]">donut_large</span>
            <span>Progres Pengisian</span>
          </a>

          <a href="/plncorpuadmin/hasil" class="nav-link-item ${currentView === 'hasil' ? 'active' : ''}" data-view="hasil">
            <span class="material-symbols-outlined text-[18px]">analytics</span>
            <span>Hasil Evaluasi</span>
          </a>

          <div class="px-4 pt-3 pb-1.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
            Master Administrator
          </div>

          <a href="/plncorpuadmin/organisasi" class="nav-link-item ${currentView === 'admin-organisasi' ? 'active' : ''}" data-view="admin-organisasi">
            <span class="material-symbols-outlined text-[18px]">account_balance</span>
            <span>Master Organisasi (UPDL & Unit)</span>
          </a>

          <a href="/plncorpuadmin/users" class="nav-link-item ${currentView === 'admin-users' ? 'active' : ''}" data-view="admin-users">
            <span class="material-symbols-outlined text-[18px]">group</span>
            <span>Data Pengguna / Akun User</span>
          </a>

          <a href="/plncorpuadmin/program" class="nav-link-item ${currentView === 'admin-program' ? 'active' : ''}" data-view="admin-program">
            <span class="material-symbols-outlined text-[18px]">school</span>
            <span>Program & Periode</span>
          </a>

          <a href="/plncorpuadmin/bank-butir" class="nav-link-item ${currentView === 'admin-bank-butir' ? 'active' : ''}" data-view="admin-bank-butir">
            <span class="material-symbols-outlined text-[18px]">fact_check</span>
            <span>Bank Butir Evaluasi</span>
          </a>

          <a href="/plncorpuadmin/form-builder" class="nav-link-item ${currentView === 'admin-form-builder' ? 'active' : ''}" data-view="admin-form-builder">
            <span class="material-symbols-outlined text-[18px]">tune</span>
            <span>Form Builder (3 Perspektif)</span>
          </a>

          <div class="px-4 pt-3 pb-1.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
            Laporan & Pengaturan
          </div>

          <a href="/plncorpuadmin/laporan" class="nav-link-item ${currentView === 'laporan' ? 'active' : ''}" data-view="laporan">
            <span class="material-symbols-outlined text-[18px]">bar_chart</span>
            <span>Laporan & Ekspor</span>
          </a>

          <a href="/plncorpuadmin/pengaturan" class="nav-link-item ${currentView === 'pengaturan' ? 'active' : ''}" data-view="pengaturan">
            <span class="material-symbols-outlined text-[18px]">settings</span>
            <span>Pengaturan</span>
          </a>
        `;
      }

      // Re-attach listener pada item nav yang baru di-render
      navContainer.querySelectorAll('.nav-link-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const view = item.getAttribute('data-view');
          const tab = item.getAttribute('data-tab');
          if (view === 'admin-organisasi' && tab && window.AdminOrganisasiView) {
            window.AdminOrganisasiView.activeTab = tab;
          }
          window.appStore.setView(view);
          this.closeMobileSidebar();
        });
      });
    },

    // Under Development Notice for Non-Admin Users
    renderUnderDevelopmentNotice: function (container, user) {
      const roleLabels = {
        peserta: 'Portal Peserta Pelatihan',
        atasan: 'Portal Atasan Langsung',
        koordinator: 'Portal Koordinator Program'
      };
      const portalName = roleLabels[user.role] || 'Portal Pengguna';

      container.innerHTML = `
        <div class="under-development-notice">
          <div class="notice-icon">
            <span class="material-symbols-outlined">engineering</span>
          </div>
          <h2>${portalName}</h2>
          <p>
            Modul ini sedang dalam tahap pengembangan aktif dan akan segera tersedia pada rilis berikutnya.
            Saat ini, hanya dashboard Administrator yang tersedia secara penuh.
          </p>
          <div class="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm w-full max-w-sm mb-6">
            <div class="text-xs text-[#64748B] mb-2 font-semibold uppercase tracking-wider">Informasi Sesi Anda</div>
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between">
                <span class="text-[#64748B]">Nama</span>
                <span class="font-semibold text-[#172B3A]">${user.nama}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#64748B]">NIP</span>
                <span class="font-mono text-[#172B3A]">${user.nip || user.nipeg || user.username}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#64748B]">Peran</span>
                <span class="font-semibold text-[#006876]">${this.getRoleLabel(user.role)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[#64748B]">Unit</span>
                <span class="text-[#172B3A]">${user.unit || 'PLN UP3 Metro'}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-secondary" onclick="window.authManager.logout(); window.App.showToast('Anda telah keluar dari sesi.', 'info');">
              <span class="material-symbols-outlined text-[16px]">logout</span>
              Kembali ke Halaman Masuk
            </button>
          </div>
          <div class="mt-6 text-[11px] text-[#94A3B8]">
            Evaluasi Level 3 — PLN UP3 Metro • Siklus 2026
          </div>
        </div>
      `;
    },

    renderPlaceholderView: function (container, viewName, user) {
      const activeResp = window.appStore.getActiveRespondent();

      container.innerHTML = `
        <div class="bg-white rounded-lg border border-[#CBD5E1] p-8 text-center max-w-3xl mx-auto my-8 shadow-sm">
          <div class="w-14 h-14 bg-[#E0F7FA] text-[#006876] rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="material-symbols-outlined text-3xl">build_circle</span>
          </div>
          <h2 class="text-xl font-bold text-[#172B3A] mb-2">
            ${this.getViewBreadcrumb(viewName)}
          </h2>
          <p class="text-xs text-[#64748B] mb-6 leading-relaxed">
            Modul ini siap dikembangkan pada tahapan implementasi berikutnya.<br />
            Akun Masuk: <b>${user.nama}</b> (${user.nip || user.username}) • Peran: <b>${this.getRoleLabel(user.role)}</b><br />
            Peserta Aktif di Sistem: <b>${activeResp.nama} (${activeResp.nipeg})</b>.
          </p>
          <div class="flex items-center justify-center gap-3">
            <button class="btn-primary" onclick="window.appStore.setView('dashboard')">
              <span class="material-symbols-outlined text-[16px]">arrow_back</span>
              Kembali ke Dashboard
            </button>
            <button class="btn-secondary" onclick="window.App.showToast('Data modul siap untuk tahap formulir dan analitik!', 'info')">
              Cek Kesiapan Data
            </button>
          </div>
        </div>
      `;
    },

    // Toast Notification System
    showToast: function (message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = 'toast-item';

      let icon = 'info';
      let borderCol = '#23C4DB';
      if (type === 'success') { icon = 'check_circle'; borderCol = '#059669'; }
      if (type === 'error') { icon = 'error'; borderCol = '#DC2626'; }
      if (type === 'warning') { icon = 'warning'; borderCol = '#D97706'; }

      toast.style.borderLeftColor = borderCol;
      toast.innerHTML = `
        <div class="flex items-center gap-2 text-xs font-medium text-[#172B3A]">
          <span class="material-symbols-outlined text-[18px]" style="color: ${borderCol}">${icon}</span>
          <span>${message}</span>
        </div>
        <button class="text-[#94A3B8] hover:text-[#172B3A] text-sm leading-none" onclick="this.parentElement.remove()">✕</button>
      `;

      container.appendChild(toast);
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 4000);
    },

    // Reset Scroll Position on Every Page Change
    resetScrollPosition: function () {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const mainContent = document.getElementById('main-content-area');
      if (mainContent) mainContent.scrollTop = 0;
      const mainViewport = document.querySelector('.main-viewport');
      if (mainViewport) mainViewport.scrollTop = 0;
      const appLayout = document.getElementById('app-layout');
      if (appLayout) appLayout.scrollTop = 0;
    },

    // Modal Dialog System (Scrollable inside modal-dialog-body with background scroll lock)
    showModal: function (options) {
      const { title, content, confirmText = 'Konfirmasi', cancelText = 'Batal', onConfirm } = options;

      // Kunci scroll background body saat popup terbuka
      window.ModalHelper.lockScroll();

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `
        <div class="modal-dialog">
          <div class="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC] shrink-0">
            <h3 class="text-sm font-bold text-[#172B3A]">${title}</h3>
            <button class="text-[#64748B] hover:text-[#172B3A] text-lg leading-none p-1" id="modal-close-btn">✕</button>
          </div>
          <div class="modal-dialog-body">
            ${content}
          </div>
          <div class="px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-end gap-2 shrink-0">
            ${cancelText ? `<button class="btn-secondary" id="modal-cancel-btn">${cancelText}</button>` : ''}
            <button class="btn-primary" id="modal-confirm-btn">${confirmText}</button>
          </div>
        </div>
      `;

      // Cegah chaining scroll mousewheel dan touch ke container latar belakang
      backdrop.addEventListener('wheel', (e) => {
        if (e.target === backdrop) {
          e.preventDefault();
        }
      }, { passive: false });
      backdrop.addEventListener('touchmove', (e) => {
        if (e.target === backdrop) {
          e.preventDefault();
        }
      }, { passive: false });

      document.body.appendChild(backdrop);

      const close = () => {
        backdrop.remove();
        window.ModalHelper.unlockScroll();
      };

      backdrop.querySelector('#modal-close-btn')?.addEventListener('click', close);
      backdrop.querySelector('#modal-cancel-btn')?.addEventListener('click', close);
      backdrop.querySelector('#modal-confirm-btn')?.addEventListener('click', () => {
        if (onConfirm) {
          const result = onConfirm();
          if (result === false) return; // Validasi gagal — tetap buka modal
        }
        close();
      });

      // Klik area luar modal untuk menutup
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          close();
        }
      });

      return backdrop;
    }
  };

  // Jalankan saat DOM siap
  document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
  });
})();
