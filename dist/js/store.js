/**
 * Reactive State Store: Sistem Evaluasi Level 3 UP3 Metro
 * Menyediakan sinkronisasi data antar modul, persistensi LocalStorage, dan fungsi kalkulasi analitik
 */

(function () {
  const STORAGE_KEY_EVALS = 'pln_eval3_evaluations_v1';
  const STORAGE_KEY_RESP = 'pln_eval3_respondents_v1';
  const STORAGE_KEY_STATE = 'pln_eval3_ui_state_v1';
  const STORAGE_KEY_UPDLS = 'pln_eval3_updls_v1';
  const STORAGE_KEY_UNITS = 'pln_eval3_units_v1';
  const STORAGE_KEY_PROGRAMS = 'pln_eval3_programs_v1';
  const STORAGE_KEY_PERIODS = 'pln_eval3_periods_v1';
  const STORAGE_KEY_TEMPLATES = 'pln_eval3_templates_v1';
  const STORAGE_KEY_AUDIT = 'pln_eval3_audit_v1';
  const STORAGE_KEY_USERS = 'pln_eval3_users_v1';
  const STORAGE_KEY_BANK_BUTIR = 'pln_eval3_bank_butir_list_v1';
  const STORAGE_KEY_SETTINGS = 'pln_eval3_settings_v1';

  // Pengaturan default laporan (PLN Corporate University Impact Lab)
  const buildDefaultSettings = () => {
    const cfg = (window.MASTER_DATA && window.MASTER_DATA.config) || {};
    const mt = cfg.manajemenTarget || {};
    return {
      instansi: 'PT PLN (Persero) Corporate University',
      unitPelaksana: 'Pusat Pendidikan dan Pelatihan (PLN CorpU)',
      target: {
        baseline: mt.baseline || '70%',
        target: mt.target || '85%',
        deadline: mt.deadline || '90 Hari Pasca Diklat'
      },
      bobot: {
        peserta: 30,
        atasan: 50,
        koordinator: 20
      },
      penandatangan: {
        internal: { jabatan: 'Koordinator Evaluasi Internal', nama: cfg.koordinatorInternal?.nama || 'Akkhita Nurrul Febriyanti', nip: cfg.koordinatorInternal?.nip || '8909014M' },
        eksternal: { jabatan: 'Koordinator Evaluasi Eksternal (UPDL)', nama: cfg.koordinatorEksternal?.nama || 'Azam Zulmi Agusti Nuro', nip: cfg.koordinatorEksternal?.nip || '8810743Z' },
        mengetahui: { jabatan: 'Manager UPDL / Unit Terkait', nama: 'Ir. Bambang Triyono, M.T.', nip: '8508111A' }
      }
    };
  };

  const DUMMY_UPDL_IDS = new Set(['updl-plb', 'updl-bgr', 'updl-smg', 'updl-mks', 'updl-pdg', 'updl-bpp']);
  const DUMMY_PROG_IDS = new Set(['prog-pil-susut', 'prog-k3']);
  const DUMMY_PERIOD_IDS = new Set(['period-2026-s1', 'period-2026-s2']);
  const DUMMY_NIPS = new Set(['8909014m', '8810743z']);

  class Store {
    constructor() {
      this.listeners = [];
      this.init();
      this.initFirestoreSync();
      this.initMariaDBSync();
    }

    init() {
      // 1. Load or init respondents (bersihkan dummy data lama dari local storage)
      const savedResp = localStorage.getItem(STORAGE_KEY_RESP);
      let loadedResp = [];
      if (savedResp) {
        try {
          const parsed = JSON.parse(savedResp);
          loadedResp = (parsed || []).filter(r => {
            if (!r || !r.nip) return false;
            const nipStr = String(r.nip).toLowerCase();
            if (String(r.id).match(/^[1-9]$|^10$|^11$|^12$/)) return false;
            if (DUMMY_NIPS.has(nipStr)) return false;
            if (DUMMY_UPDL_IDS.has(r.updlId) && String(r.id).match(/^[1-9]$|^10$|^11$|^12$/)) return false;
            return true;
          });
        } catch (e) {
          loadedResp = [];
        }
      }
      this.respondents = loadedResp;

      // 2. Load or init evaluations (bersihkan dummy evaluations)
      const savedEvals = localStorage.getItem(STORAGE_KEY_EVALS);
      let loadedEvals = {};
      if (savedEvals) {
        try {
          loadedEvals = JSON.parse(savedEvals) || {};
          for (let i = 1; i <= 10; i++) {
            delete loadedEvals[String(i)];
          }
        } catch (e) {
          loadedEvals = {};
        }
      }
      this.evaluations = loadedEvals;

      // 3. Load or init Master UPDL (bersihkan dummy UPDL)
      const savedUpdls = localStorage.getItem(STORAGE_KEY_UPDLS);
      let loadedUpdls = [];
      if (savedUpdls) {
        try {
          loadedUpdls = (JSON.parse(savedUpdls) || []).filter(u => u && !DUMMY_UPDL_IDS.has(u.id));
        } catch (e) {
          loadedUpdls = [];
        }
      }
      this.updls = loadedUpdls;

      // 4. Load or init Master Unit (bersihkan dummy unit)
      const savedUnits = localStorage.getItem(STORAGE_KEY_UNITS);
      let loadedUnits = [];
      if (savedUnits) {
        try {
          loadedUnits = (JSON.parse(savedUnits) || []).filter(u => {
            if (!u || !u.id) return false;
            if (u.id.startsWith('unit-mtr') || u.id.startsWith('unit-bjm') || u.id.startsWith('unit-klt')) return false;
            if (DUMMY_UPDL_IDS.has(u.updlId)) return false;
            return true;
          });
        } catch (e) {
          loadedUnits = [];
        }
      }
      this.units = loadedUnits;

      // 5. Load or init Master Programs (bersihkan dummy programs)
      const savedProgs = localStorage.getItem(STORAGE_KEY_PROGRAMS);
      let loadedProgs = [];
      if (savedProgs) {
        try {
          loadedProgs = (JSON.parse(savedProgs) || []).filter(p => p && !DUMMY_PROG_IDS.has(p.id));
        } catch (e) {
          loadedProgs = [];
        }
      }
      this.programs = loadedProgs;

      // 6. Load or init Master Periods (bersihkan dummy periods)
      const savedPeriods = localStorage.getItem(STORAGE_KEY_PERIODS);
      let loadedPeriods = [];
      if (savedPeriods) {
        try {
          loadedPeriods = (JSON.parse(savedPeriods) || []).filter(p => p && !DUMMY_PERIOD_IDS.has(p.id));
        } catch (e) {
          loadedPeriods = [];
        }
      }
      this.periods = loadedPeriods;

      // 7. Load or init Form Templates (bersihkan dummy templates)
      const savedTpls = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      let loadedTpls = [];
      if (savedTpls) {
        try {
          loadedTpls = (JSON.parse(savedTpls) || []).filter(t => t && !DUMMY_PROG_IDS.has(t.programId) && !DUMMY_PERIOD_IDS.has(t.periodId));
        } catch (e) {
          loadedTpls = [];
        }
      }
      this.formTemplates = loadedTpls;

      // 8. Load or init Audit Logs (bersihkan log dummy)
      const savedAudit = localStorage.getItem(STORAGE_KEY_AUDIT);
      let loadedAudit = [];
      if (savedAudit) {
        try {
          loadedAudit = (JSON.parse(savedAudit) || []).filter(a => a && a.user !== 'usr-admin-1' && a.action !== 'SEED');
        } catch (e) {
          loadedAudit = [];
        }
      }
      this.auditLogs = loadedAudit;

      // 9. Load or init User Management Data (HANYA Developer & Admin Pusat, serta user riil dari database)
      const savedUsers = localStorage.getItem(STORAGE_KEY_USERS);
      let loadedUsers = [];
      if (savedUsers) {
        try {
          loadedUsers = (JSON.parse(savedUsers) || []).filter(u => {
            if (!u || !u.nip) return false;
            const nipLow = (u.nip || '').toLowerCase().trim();
            if (nipLow === 'kmlafdz' || nipLow === 'adminpusat') return true;
            if (u.id === 'usr-admin-1' || u.id === 'usr-kord-eks') return false;
            if (DUMMY_NIPS && DUMMY_NIPS.has(nipLow)) return false;
            return true;
          });
        } catch (e) {
          loadedUsers = this.generateInitialUsers();
        }
      } else {
        loadedUsers = this.generateInitialUsers();
      }

      // Pastikan akun Developer kmlafdz dan Admin Pusat adminpusat selalu ada dan valid
      let devUser = loadedUsers.find(u => (u.nip || '').toLowerCase() === 'kmlafdz');
      if (!devUser) {
        devUser = {
          id: 'usr-dev-kmlafdz',
          nip: 'kmlafdz',
          nama: 'Developer Utama (kmlafdz)',
          email: 'kmlafdz@pln.co.id',
          jabatan: 'System Developer & Super Admin',
          updlId: '',
          unitId: '',
          unitName: 'PLN Pusat / Developer',
          role: 'developer',
          status: 'AKTIF',
          password: '1234'
        };
        loadedUsers.unshift(devUser);
      } else {
        devUser.role = 'developer';
        devUser.password = '1234';
      }

      let adminPusatUser = loadedUsers.find(u => (u.nip || '').toLowerCase() === 'adminpusat');
      if (!adminPusatUser) {
        adminPusatUser = {
          id: 'usr-admin-pusat',
          nip: 'adminpusat',
          nama: 'Administrator Pusat PLN Corpu',
          email: 'adminpusat@pln.co.id',
          jabatan: 'Super Admin Pengendali Evaluasi Nasional',
          updlId: '',
          unitId: '',
          unitName: 'PLN Pusat',
          role: 'admin',
          isAdminPusat: true,
          status: 'AKTIF',
          password: 'adminpusat123'
        };
        loadedUsers.push(adminPusatUser);
      } else {
        adminPusatUser.role = 'admin';
        adminPusatUser.isAdminPusat = true;
        adminPusatUser.password = 'adminpusat123';
      }

      this.users = loadedUsers;

      // 10. Load or init Bank Butir List
      const savedBankButir = localStorage.getItem(STORAGE_KEY_BANK_BUTIR);
      if (savedBankButir) {
        try {
          this.bankButirList = JSON.parse(savedBankButir);
          if (!Array.isArray(this.bankButirList) || this.bankButirList.length === 0) {
            this.bankButirList = JSON.parse(JSON.stringify((window.MASTER_DATA && window.MASTER_DATA.bankButirList) || []));
          }
        } catch (e) {
          this.bankButirList = JSON.parse(JSON.stringify((window.MASTER_DATA && window.MASTER_DATA.bankButirList) || []));
        }
      } else {
        this.bankButirList = JSON.parse(JSON.stringify((window.MASTER_DATA && window.MASTER_DATA.bankButirList) || []));
      }

      // 11. Load Pengaturan Laporan
      const defSettings = buildDefaultSettings();
      let loadedSettings = {};
      try {
        loadedSettings = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}') || {};
      } catch (e) {
        loadedSettings = {};
      }
      this.settings = {
        ...defSettings,
        ...loadedSettings,
        target: { ...defSettings.target, ...(loadedSettings.target || {}) },
        penandatangan: {
          internal: { ...defSettings.penandatangan.internal, ...(loadedSettings.penandatangan?.internal || {}) },
          eksternal: { ...defSettings.penandatangan.eksternal, ...(loadedSettings.penandatangan?.eksternal || {}) },
          mengetahui: { ...defSettings.penandatangan.mengetahui, ...(loadedSettings.penandatangan?.mengetahui || {}) }
        }
      };

      // 12. Load UI state
      const savedState = localStorage.getItem(STORAGE_KEY_STATE);
      const defaultState = {
        role: 'admin',
        view: 'dashboard',
        activeRespondentId: 1,
        activeModuleFilter: 'ALL',
        activeUnitFilter: 'ALL',
        activeDashboardUpdl: 'ALL',
        activeDashboardProgram: 'ALL',
        activeDashboardPeriod: 'ALL',
        searchQuery: '',
        statusFilter: 'ALL'
      };

      if (savedState) {
        try {
          this.state = { ...defaultState, ...JSON.parse(savedState) };
        } catch (e) {
          this.state = defaultState;
        }
      } else {
        this.state = defaultState;
      }

      // Sinkronkan seluruh master user role peserta ke penugasan responden
      this.syncParticipantsToRespondents();

      // Persist pembersihan ke local storage segera
      this.save(true);
    }

    generateInitialUsers() {
      return [
        {
          id: 'usr-dev-kmlafdz',
          nip: 'kmlafdz',
          nama: 'Developer Utama (kmlafdz)',
          email: 'kmlafdz@pln.co.id',
          jabatan: 'System Developer & Super Admin',
          updlId: '',
          unitId: '',
          unitName: 'PLN Pusat / Developer',
          role: 'developer',
          status: 'AKTIF',
          password: '1234'
        },
        {
          id: 'usr-admin-pusat',
          nip: 'adminpusat',
          nama: 'Administrator Pusat PLN Corpu',
          email: 'adminpusat@pln.co.id',
          jabatan: 'Super Admin Pengendali Evaluasi Nasional',
          updlId: '',
          unitId: '',
          unitName: 'PLN Pusat',
          role: 'admin',
          isAdminPusat: true,
          status: 'AKTIF',
          password: 'adminpusat123'
        }
      ];
    }

    save(skipNotify = false) {
      localStorage.setItem(STORAGE_KEY_RESP, JSON.stringify(this.respondents));
      localStorage.setItem(STORAGE_KEY_EVALS, JSON.stringify(this.evaluations));
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(this.state));
      localStorage.setItem(STORAGE_KEY_UPDLS, JSON.stringify(this.updls));
      localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(this.units));
      localStorage.setItem(STORAGE_KEY_PROGRAMS, JSON.stringify(this.programs));
      localStorage.setItem(STORAGE_KEY_PERIODS, JSON.stringify(this.periods));
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(this.formTemplates));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEY_BANK_BUTIR, JSON.stringify(this.bankButirList));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
      if (!skipNotify) {
        this.notify();
      }
    }

    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify() {
      this.listeners.forEach(fn => fn(this));
      window.dispatchEvent(new CustomEvent('app:store-updated', { detail: this }));
    }

    // State getters & setters
    getRole() {
      return this.state.role;
    }

    setRole(role) {
      this.state.role = role;
      this.save();
    }

    getView() {
      return this.state.view;
    }

    setView(view, params = {}) {
      this.state.view = view;
      if (params.respondentId !== undefined) {
        this.state.activeRespondentId = Number(params.respondentId);
      }
      if (params.unitFilter !== undefined) {
        this.state.activeUnitFilter = params.unitFilter;
      }
      this.save();
    }

    getActiveRespondent() {
      return this.respondents.find(r => r.id === this.state.activeRespondentId) || this.respondents[0];
    }

    setActiveRespondentId(id) {
      this.state.activeRespondentId = Number(id);
      this.save();
    }

    setSearchQuery(q, skipNotify = false) {
      this.state.searchQuery = q !== undefined ? q : '';
      if (!skipNotify) {
        this.save();
      } else {
        localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(this.state));
      }
    }

    setFilters(unit, module, status) {
      if (unit !== undefined) this.state.activeUnitFilter = unit;
      if (module !== undefined) this.state.activeModuleFilter = module;
      if (status !== undefined) this.state.statusFilter = status;
      this.save();
    }

    setDashboardFilters(updl, program, period) {
      if (updl !== undefined) {
        this.state.activeDashboardUpdl = updl;
        this.state.activeUnitFilter = 'ALL'; // Reset unit filter ketika UPDL berganti
      }
      if (program !== undefined) this.state.activeDashboardProgram = program;
      if (period !== undefined) this.state.activeDashboardPeriod = period;
      this.save();
    }

    getUnitsByUpdl(updlId) {
      // Unit kerja bersifat mandiri / terpisah dari UPDL.
      // Mengembalikan seluruh unit kerja yang aktif.
      return this.getUnits(null, true);
    }

    // Data Queries
    getRespondents(filters = null) {
      let list = [...this.respondents];
      const activeUpdl = (filters && filters.updl !== undefined) ? filters.updl : (this.state.activeDashboardUpdl || 'ALL');
      const activeProgram = (filters && filters.program !== undefined) ? filters.program : (this.state.activeDashboardProgram || 'ALL');
      const activePeriod = (filters && filters.period !== undefined) ? filters.period : (this.state.activeDashboardPeriod || 'ALL');

      if (activeUpdl && activeUpdl !== 'ALL') {
        list = list.filter(r => {
          const u = this.getUnitByName(r.unit);
          const rUpdl = r.updlId || (u && u.updlId) || (r.updl && r.updl.id);
          return rUpdl === activeUpdl;
        });
      }
      if (activeProgram && activeProgram !== 'ALL') {
        list = list.filter(r => (r.programId || (r.program && r.program.id)) === activeProgram);
      }
      if (activePeriod && activePeriod !== 'ALL') {
        list = list.filter(r => (r.periodId || (r.period && r.period.id)) === activePeriod);
      }

      const rawQ = (this.state.searchQuery || '').toLowerCase().trim();
      if (rawQ) {
        const terms = rawQ.split(/\s+/).filter(Boolean);
        list = list.filter(r => {
          const haystack = `${r.nama || ''} ${r.nip || ''} ${r.jabatan || ''} ${r.unit || ''}`.toLowerCase();
          return terms.every(term => haystack.includes(term));
        });
      }
      if (this.state.activeUnitFilter && this.state.activeUnitFilter !== 'ALL') {
        const uFilterClean = this.state.activeUnitFilter.toLowerCase().replace(/^(pln\s+)/i, '').trim();
        list = list.filter(r => {
          const rUnitClean = (r.unit || '').toLowerCase().replace(/^(pln\s+)/i, '').trim();
          return r.unit === this.state.activeUnitFilter || rUnitClean === uFilterClean || rUnitClean.includes(uFilterClean) || uFilterClean.includes(rUnitClean);
        });
      }
      if (this.state.activeModuleFilter && this.state.activeModuleFilter !== 'ALL') {
        list = list.filter(r => r.modules && r.modules.includes(this.state.activeModuleFilter));
      }

      // Selalu tempatkan responden terbaru di urutan atas (ID tertinggi / baru ditambahkan)
      list.sort((a, b) => (b.id || 0) - (a.id || 0));

      return list;
    }

    getEvaluation(respondentId) {
      const rid = String(respondentId);
      if (!this.evaluations[rid]) {
        this.evaluations[rid] = {
          respondentId: Number(respondentId),
          validation: { q1: true, q2: true, q3: true },
          peserta: { status: 'BELUM', scores: {}, notes: {}, submittedAt: null },
          atasan: { status: 'BELUM', scores: {}, notes: {}, submittedAt: null },
          koordinator: { status: 'BELUM', scores: {}, notes: {}, submittedAt: null }
        };
      }
      return this.evaluations[rid];
    }

    // Analytics & Stats Computation
    getAnalytics(filters = null) {
      let respondentsList = [...this.respondents];
      const activeUpdl = (filters && filters.updl !== undefined) ? filters.updl : (this.state.activeDashboardUpdl || 'ALL');
      const activeProgram = (filters && filters.program !== undefined) ? filters.program : (this.state.activeDashboardProgram || 'ALL');
      const activePeriod = (filters && filters.period !== undefined) ? filters.period : (this.state.activeDashboardPeriod || 'ALL');

      if (activeUpdl && activeUpdl !== 'ALL') {
        respondentsList = respondentsList.filter(r => {
          const u = this.getUnitByName(r.unit);
          const rUpdl = r.updlId || (u && u.updlId) || (r.updl && r.updl.id);
          return rUpdl === activeUpdl;
        });
      }
      if (activeProgram && activeProgram !== 'ALL') {
        respondentsList = respondentsList.filter(r => (r.programId || (r.program && r.program.id)) === activeProgram);
      }
      if (activePeriod && activePeriod !== 'ALL') {
        respondentsList = respondentsList.filter(r => (r.periodId || (r.period && r.period.id)) === activePeriod);
      }

      // Dapatkan Bank Butir yang relevan secara realtime
      let activeBB = null;
      if (activeProgram && activeProgram !== 'ALL') {
        activeBB = this.getActiveBankButirForProgram(activeProgram);
      }
      if (!activeBB && this.bankButirList && this.bankButirList.length > 0) {
        activeBB = this.bankButirList[0];
      }

      const moduleMap = {};
      const indicatorMap = {};

      if (activeBB && activeBB.sections && Object.keys(activeBB.sections).length > 0) {
        Object.entries(activeBB.sections).forEach(([key, sec]) => {
          moduleMap[key] = {
            title: sec.title || `Bagian ${key}`,
            deskripsi: sec.deskripsi || sec.title || '',
            pTotal: 0, pCnt: 0, aTotal: 0, aCnt: 0, kTotal: 0, kCnt: 0
          };
        });
        (activeBB.items || []).forEach(it => {
          const modKey = it.partKey || (it.id && it.id[0]) || 'A';
          indicatorMap[it.id] = {
            id: it.id,
            mod: modKey,
            text: it.perilaku,
            kompetensi: it.kompetensi,
            pScores: [],
            aScores: [],
            kScores: []
          };
        });
      }

      const total = respondentsList.length;
      if (total === 0) {
        const emptyModules = Object.keys(moduleMap).map(mKey => ({
          code: mKey,
          title: moduleMap[mKey].title,
          deskripsi: moduleMap[mKey].deskripsi,
          peserta: 0,
          atasan: 0,
          koordinator: 0,
          combined: 0
        }));

        const emptyIndicators = Object.values(indicatorMap).map(ind => ({
          id: ind.id,
          mod: ind.mod,
          text: ind.text,
          kompetensi: ind.kompetensi,
          peserta: 0,
          atasan: 0,
          koordinator: 0,
          combined: 0,
          status: 'Belum Ada Data'
        }));

        // Ambil unit yang relevan dengan filter aktif langsung dari database/store
        const activeUnitsList = (activeUpdl === 'ALL'
          ? this.getUnits()
          : this.getUnitsByUpdl(activeUpdl)) || [];

        const emptyUnits = activeUnitsList.map(u => ({
          unit: u.nama,
          total: 0,
          completed: 0,
          percentage: 0
        }));

        return {
          totalRespondents: 0,
          completedPeserta: 0,
          completedAtasan: 0,
          completedKoordinator: 0,
          fullCompleted: 0,
          pesertaRate: 0,
          atasanRate: 0,
          koordinatorRate: 0,
          fullRate: 0,
          scores: { peserta: 0, atasan: 0, koordinator: 0, combined: 0 },
          modules: emptyModules,
          indicators: emptyIndicators,
          units: emptyUnits
        };
      }

      let pCount = 0;
      let aCount = 0;
      let kCount = 0;
      let fullCount = 0;

      let pScoreTotal = 0, pItemCount = 0;
      let aScoreTotal = 0, aItemCount = 0;
      let kScoreTotal = 0, kItemCount = 0;

      const unitMap = {};

      respondentsList.forEach(r => {
        const u = r.unit;
        if (!unitMap[u]) {
          unitMap[u] = { unit: u, total: 0, completed: 0, pDone: 0, aDone: 0, kDone: 0, totalScoreSum: 0, scoredCount: 0 };
        }
        unitMap[u].total++;

        const ev = this.getEvaluation(r.id);
        const pDone = ev.peserta && ev.peserta.status === 'SELESAI';
        const aDone = ev.atasan && ev.atasan.status === 'SELESAI';
        const kDone = ev.koordinator && ev.koordinator.status === 'SELESAI';

        if (pDone) {
          pCount++;
          unitMap[u].pDone++;
          Object.entries(ev.peserta.scores || {}).forEach(([itemId, sc]) => {
            pScoreTotal += sc;
            pItemCount++;
            const mod = itemId[0];
            if (moduleMap[mod]) {
              moduleMap[mod].pTotal += sc;
              moduleMap[mod].pCnt++;
            }
            if (indicatorMap[itemId]) indicatorMap[itemId].pScores.push(sc);
          });
        }

        if (aDone) {
          aCount++;
          unitMap[u].aDone++;
          Object.entries(ev.atasan.scores || {}).forEach(([itemId, sc]) => {
            aScoreTotal += sc;
            aItemCount++;
            const mod = itemId[0];
            if (moduleMap[mod]) {
              moduleMap[mod].aTotal += sc;
              moduleMap[mod].aCnt++;
            }
            if (indicatorMap[itemId]) indicatorMap[itemId].aScores.push(sc);
          });
        }

        if (kDone) {
          kCount++;
          unitMap[u].kDone++;
          Object.entries(ev.koordinator.scores || {}).forEach(([itemId, sc]) => {
            kScoreTotal += sc;
            kItemCount++;
            const mod = itemId[0];
            if (moduleMap[mod]) {
              moduleMap[mod].kTotal += sc;
              moduleMap[mod].kCnt++;
            }
            if (indicatorMap[itemId]) indicatorMap[itemId].kScores.push(sc);
          });
        }

        if (pDone && aDone && kDone) {
          fullCount++;
          unitMap[u].completed++;
        }
      });

      // Scale to 25–100 index: ((avg / 4) * 100)
      const toIndex = (totalSum, count) => count > 0 ? Number(((totalSum / count) / 4 * 100).toFixed(1)) : 0;

      const pAvg = toIndex(pScoreTotal, pItemCount);
      const aAvg = toIndex(aScoreTotal, aItemCount);
      const kAvg = toIndex(kScoreTotal, kItemCount);
      const combinedAvg = Number((((pAvg || 0) + (aAvg || 0) + (kAvg || 0)) / [pAvg, aAvg, kAvg].filter(Boolean).length || 0).toFixed(1));

      // Process modules
      const processedModules = Object.keys(moduleMap).map(mKey => {
        const m = moduleMap[mKey];
        const pScore = toIndex(m.pTotal, m.pCnt);
        const aScore = toIndex(m.aTotal, m.aCnt);
        const kScore = toIndex(m.kTotal, m.kCnt);
        const cScore = Number((([pScore, aScore, kScore].filter(Boolean).reduce((a, b) => a + b, 0) / ([pScore, aScore, kScore].filter(Boolean).length || 1))).toFixed(1));
        return {
          code: mKey,
          title: m.title,
          deskripsi: m.deskripsi || '',
          peserta: pScore,
          atasan: aScore,
          koordinator: kScore,
          combined: cScore
        };
      });

      // Process indicators
      const processedIndicators = Object.values(indicatorMap).map(ind => {
        const pAvgInd = toIndex(ind.pScores.reduce((a, b) => a + b, 0), ind.pScores.length);
        const aAvgInd = toIndex(ind.aScores.reduce((a, b) => a + b, 0), ind.aScores.length);
        const kAvgInd = toIndex(ind.kScores.reduce((a, b) => a + b, 0), ind.kScores.length);
        const comb = Number((([pAvgInd, aAvgInd, kAvgInd].filter(Boolean).reduce((a, b) => a + b, 0) / ([pAvgInd, aAvgInd, kAvgInd].filter(Boolean).length || 1))).toFixed(1));
        let status = 'Sangat Efektif';
        if (comb === 0) status = 'Belum Ada Nilai';
        else if (comb < 70) status = 'Perlu Penguatan';
        else if (comb < 80) status = 'Efektif';

        return {
          id: ind.id,
          mod: ind.mod,
          text: ind.text,
          kompetensi: ind.kompetensi,
          peserta: pAvgInd,
          atasan: aAvgInd,
          koordinator: kAvgInd,
          combined: comb,
          status: status
        };
      });

      // Process units
      const processedUnits = Object.values(unitMap).map(u => {
        const pct = Math.round((u.completed / u.total) * 100);
        return {
          ...u,
          percentage: pct
        };
      });

      return {
        totalRespondents: total,
        completedPeserta: pCount,
        completedAtasan: aCount,
        completedKoordinator: kCount,
        fullCompleted: fullCount,
        pesertaRate: Math.round((pCount / total) * 100),
        atasanRate: Math.round((aCount / total) * 100),
        koordinatorRate: Math.round((kCount / total) * 100),
        fullRate: Math.round((fullCount / total) * 100),
        scores: {
          peserta: pAvg,
          atasan: aAvg,
          koordinator: kAvg,
          combined: combinedAvg
        },
        modules: processedModules,
        indicators: processedIndicators,
        units: processedUnits
      };
    }

    // Mutation Methods
    saveEvaluationRecord(respondentId, roleKey, scores, notes, isFinal = true) {
      const ev = this.getEvaluation(respondentId);
      if (!ev[roleKey]) {
        ev[roleKey] = { status: 'BELUM', scores: {}, notes: {}, submittedAt: null };
      }
      ev[roleKey].scores = { ...ev[roleKey].scores, ...scores };
      ev[roleKey].notes = { ...ev[roleKey].notes, ...notes };
      ev[roleKey].status = isFinal ? 'SELESAI' : 'DRAF';
      if (isFinal) {
        ev[roleKey].submittedAt = new Date().toISOString();
      }
      this.evaluations[String(respondentId)] = ev;
      this.save();
      this.syncEvaluationToFirestore(respondentId);
    }

    updateValidation(respondentId, validationObj, skipNotify = true) {
      const ev = this.getEvaluation(respondentId);
      ev.validation = { ...ev.validation, ...validationObj };
      this.evaluations[String(respondentId)] = ev;
      this.save(skipNotify);
      this.syncEvaluationToFirestore(respondentId);
    }

    assignSupervisor(respondentId, supervisor) {
      const r = this.respondents.find(x => x.id === Number(respondentId));
      if (r) {
        r.atasan = { ...supervisor };
        this.save();
        this.syncRespondentToFirestore(r);
      }
    }

    assignCoordinator(respondentId, coordinator, isInternal = false) {
      const r = this.respondents.find(x => x.id === Number(respondentId));
      if (r) {
        if (isInternal) {
          r.koordinatorInternal = { ...coordinator };
        } else {
          r.koordinatorEksternal = { ...coordinator };
        }
        this.save();
        this.syncRespondentToFirestore(r);
      }
    }

    bulkAssignCoordinator(respondentIds, coordinator) {
      respondentIds.forEach(id => {
        const r = this.respondents.find(x => x.id === Number(id));
        if (r) {
          r.koordinatorEksternal = { ...coordinator };
          this.syncRespondentToFirestore(r);
        }
      });
      this.save();
    }

    bulkAssignSupervisor(respondentIds, supervisor) {
      respondentIds.forEach(id => {
        const r = this.respondents.find(x => x.id === Number(id));
        if (r) {
          r.atasan = { ...supervisor };
          this.syncRespondentToFirestore(r);
        }
      });
      this.save();
    }

    bulkAssignSupervisorByUnit(respondentIds, unitSupervisorMap) {
      respondentIds.forEach(id => {
        const r = this.respondents.find(x => x.id === Number(id));
        if (r && unitSupervisorMap[r.unit]) {
          r.atasan = { ...unitSupervisorMap[r.unit] };
          this.syncRespondentToFirestore(r);
        }
      });
      this.save();
    }

    addRespondent(data) {
      const cleanNip = data.nip ? data.nip.trim() : '';
      if (cleanNip) {
        const existing = this.respondents.find(r => r.nip && r.nip.toLowerCase() === cleanNip.toLowerCase());
        if (existing) {
          if (data.nama) existing.nama = data.nama.trim();
          if (data.jabatan) existing.jabatan = data.jabatan.trim();
          if (data.unit) existing.unit = data.unit;
          if (data.modules && data.modules.length > 0) existing.modules = data.modules;
          if (data.atasan) existing.atasan = data.atasan;
          if (data.updlId) existing.updlId = data.updlId;
          this.save();
          this.syncRespondentToFirestore(existing);
          if (existing.atasan && existing.atasan.nama && existing.atasan.nip && existing.atasan.nip !== '-') {
            this.ensureSupervisorExists({
              nama: existing.atasan.nama,
              nip: existing.atasan.nip,
              jabatan: existing.atasan.jabatan,
              unitName: existing.unit,
              updlId: existing.updlId
            });
          }
          this.ensureUserForRespondent(existing);
          return existing;
        }
      }

      const nextId = this.respondents.length > 0 ? Math.max(...this.respondents.map(r => Number(r.id) || 0)) + 1 : 101;
      const modules = data.modules && data.modules.length > 0 ? data.modules : ['A'];

      const progId = data.programId || (this.state.activeDashboardProgram !== 'ALL' ? this.state.activeDashboardProgram : (this.getPrograms()[0] ? this.getPrograms()[0].id : ''));
      const prog = this.getProgramById(progId);

      const bankButirIdVal = data.bankButirId || null;
      let targetBB = bankButirIdVal ? this.getBankButirById(bankButirIdVal) : (progId ? this.getActiveBankButirForProgram(progId) : null);
      let bbSections = targetBB ? targetBB.sections : (window.MASTER_DATA && window.MASTER_DATA.bankButir);

      let totalItems = 0;
      modules.forEach(m => {
        if (bbSections && bbSections[m] && Array.isArray(bbSections[m].items)) {
          totalItems += bbSections[m].items.length;
        } else if (window.MASTER_DATA && window.MASTER_DATA.bankButir && window.MASTER_DATA.bankButir[m]) {
          totalItems += window.MASTER_DATA.bankButir[m].items.length;
        }
      });

      const unitVal = data.unit || 'Kantor Unit';
      let atasanObj = data.atasan;
      if (!atasanObj || !atasanObj.nama) {
        const autoSup = this.getSupervisorByUnit(unitVal);
        if (autoSup) {
          atasanObj = { nama: autoSup.nama, nip: autoSup.nip, jabatan: autoSup.jabatan };
        } else {
          atasanObj = {
            nama: 'Atasan Langsung Unit',
            nip: '-',
            jabatan: `Manager ${unitVal}`
          };
        }
      }

      // Resolusi UPDL yang tepat dari unit
      let updlIdVal = data.updlId;
      const matchedUnit = this.getUnitByName(unitVal);
      if (matchedUnit && matchedUnit.updlId) {
        updlIdVal = matchedUnit.updlId;
      } else if (!updlIdVal || updlIdVal === 'ALL') {
        updlIdVal = (this.state.activeDashboardUpdl !== 'ALL' ? this.state.activeDashboardUpdl : (this.getUpdls()[0] ? this.getUpdls()[0].id : ''));
      }

      // Pastikan atasan juga terdaftar di Master Pengguna dan Unit
      if (atasanObj && atasanObj.nama && atasanObj.nip && atasanObj.nip !== '-') {
        this.ensureSupervisorExists({
          nama: atasanObj.nama,
          nip: atasanObj.nip,
          jabatan: atasanObj.jabatan,
          unitName: unitVal,
          updlId: updlIdVal
        });
      }

      const newResp = {
        id: nextId,
        nama: data.nama.trim(),
        nip: cleanNip,
        jabatan: data.jabatan ? data.jabatan.trim() : 'Pelaksana Operasi Distribusi',
        unit: unitVal,
        updlId: updlIdVal,
        programId: progId,
        periodId: data.periodId || (this.state.activeDashboardPeriod !== 'ALL' ? this.state.activeDashboardPeriod : (this.getPeriods()[0] ? this.getPeriods()[0].id : '')),
        bankButirId: targetBB ? targetBB.id : (bankButirIdVal || ''),
        modules: modules,
        itemCount: totalItems,
        password: data.password || 'pln123',
        atasan: atasanObj,
        koordinatorEksternal: data.koordinatorEksternal || (prog && prog.koordinatorEksternal ? prog.koordinatorEksternal : {
          nama: 'Koordinator Eksternal',
          nip: '-',
          jabatan: 'Koordinator Eksternal UPDL'
        }),
        koordinatorInternal: data.koordinatorInternal || (prog && prog.koordinatorInternal ? prog.koordinatorInternal : {
          nama: 'Koordinator Internal',
          nip: '-',
          jabatan: 'Koordinator Internal Unit'
        }),
        createdAt: new Date().toISOString()
      };

      // Simpan di posisi awal (unshift) agar langsung muncul di urutan atas
      this.respondents.unshift(newResp);

      // Inisialisasi evaluasi kosong
      const newEval = {
        respondentId: nextId,
        validation: { q1: true, q2: true, q3: true },
        peserta: { status: 'BELUM', scores: {}, notes: {}, files: {}, submittedAt: null },
        atasan: { status: 'BELUM', scores: {}, notes: {}, submittedAt: null },
        koordinator: { status: 'BELUM', scores: {}, notes: {}, submittedAt: null }
      };
      this.evaluations[String(nextId)] = newEval;

      this.save();

      // SIMPAN OTOMATIS KE CLOUD FIRESTORE
      this.syncRespondentToFirestore(newResp);
      this.syncEvaluationToFirestore(newResp.id);

      // OTOMATIS BUAT/SINKRONKAN AKUN USER DI MASTER USERS (UNTUK LOGIN & MANAJEMEN USER)
      this.ensureUserForRespondent(newResp);

      return newResp;
    }

    // === Update Peserta (Perbarui Penugasan Responden) ===
    updateRespondent(id, data) {
      const numId = Number(id);
      const idx = this.respondents.findIndex(x => x.id === numId);
      if (idx === -1) return null;

      const existing = this.respondents[idx];
      const updated = {
        ...existing,
        ...data,
        id: numId,
        updatedAt: new Date().toISOString()
      };

      if (data.atasan) {
        updated.atasan = { ...(existing.atasan || {}), ...data.atasan };
      }
      if (data.modules && Array.isArray(data.modules)) {
        updated.modules = data.modules;
        updated.bagianA = data.modules.includes('A');
        updated.bagianB = data.modules.includes('B');
        updated.bagianC = data.modules.includes('C');
      }

      this.respondents[idx] = updated;

      // Update akun pengguna jika nama atau unit berubah
      const user = (this.users || []).find(u =>
        (u.respondentId && Number(u.respondentId) === numId) ||
        (u.nip && updated.nip && String(u.nip).toLowerCase().trim() === String(updated.nip).toLowerCase().trim())
      );
      if (user) {
        if (updated.nama) user.nama = String(updated.nama).trim();
        if (updated.jabatan) user.jabatan = String(updated.jabatan).trim();
        if (updated.unit) user.unitName = String(updated.unit).trim();
        if (updated.updlId) user.updlId = updated.updlId;
        user.respondentId = numId;
      }

      this.addAuditLog('UPDATE_PESERTA', `Peserta ${updated.nama}`, `Pembaruan data penugasan peserta NIP ${updated.nip} (${updated.unit})`);
      this.ensureUserForRespondent(updated);
      this.save();
      this.syncRespondentToFirestore(updated);
      return updated;
    }

    // === Hapus Peserta (Single & Massal) ===
    deleteRespondent(id) {
      const numId = Number(id);
      const r = this.respondents.find(x => x.id === numId);
      if (!r) return false;

      // 1. Hapus dari daftar responden
      this.respondents = this.respondents.filter(x => x.id !== numId);

      // 2. Hapus catatan evaluasi terkait
      if (this.evaluations[String(numId)]) {
        delete this.evaluations[String(numId)];
      }

      // 3. Hapus akun pengguna jika ada di master users (role: peserta)
      const userIdx = (this.users || []).findIndex(u =>
        (u.respondentId && (Number(u.respondentId) === numId || String(u.respondentId) === String(numId))) ||
        (u.role === 'peserta' && u.nip && r.nip && String(u.nip).trim().toLowerCase() === String(r.nip).trim().toLowerCase())
      );
      if (userIdx !== -1) {
        const deletedUser = this.users[userIdx];
        this.users.splice(userIdx, 1);
        this.syncUserDeletionFromFirestore(deletedUser.id, deletedUser.nip);
      }

      this.addAuditLog('HAPUS_PESERTA', `Peserta ${r.nama}`, `Penghapusan penugasan peserta NIP ${r.nip} (${r.unit}) dari siklus evaluasi`);
      this.save();
      this.syncRespondentDeletionFromFirestore(numId);
      return true;
    }

    bulkDeleteRespondents(ids) {
      if (!Array.isArray(ids) || ids.length === 0) return 0;
      let count = 0;
      ids.forEach(id => {
        const numId = Number(id);
        const r = this.respondents.find(x => x.id === numId);
        if (r) {
          this.respondents = this.respondents.filter(x => x.id !== numId);
          if (this.evaluations[String(numId)]) {
            delete this.evaluations[String(numId)];
          }
          const userIdx = (this.users || []).findIndex(u =>
            (u.respondentId && (Number(u.respondentId) === numId || String(u.respondentId) === String(numId))) ||
            (u.role === 'peserta' && u.nip && r.nip && String(u.nip).trim().toLowerCase() === String(r.nip).trim().toLowerCase())
          );
          if (userIdx !== -1) {
            const deletedUser = this.users[userIdx];
            this.users.splice(userIdx, 1);
            this.syncUserDeletionFromFirestore(deletedUser.id, deletedUser.nip);
          }
          this.syncRespondentDeletionFromFirestore(numId);
          count++;
        }
      });

      if (count > 0) {
        this.addAuditLog('HAPUS_PESERTA_MASSAL', `${count} Peserta`, `Penghapusan kolektif ${count} peserta dari sistem penugasan`);
        this.save();
      }
      return count;
    }

    syncRespondentDeletionFromMariaDB(respondentId) {
      if (respondentId) {
        fetch(`/api/respondents/${encodeURIComponent(respondentId)}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(false)
        }).then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal hapus responden:', err));
      }
    }

    // Auto-save Peserta Item Answer & File
    savePesertaItemAnswer(respondentId, itemId, payload, skipNotify = true) {
      const ev = this.getEvaluation(respondentId);
      if (!ev.peserta) {
        ev.peserta = { status: 'BELUM', scores: {}, notes: {}, files: {}, submittedAt: null };
      }
      if (!ev.peserta.scores) ev.peserta.scores = {};
      if (!ev.peserta.notes) ev.peserta.notes = {};
      if (!ev.peserta.files) ev.peserta.files = {};

      if (payload.score !== undefined) {
        ev.peserta.scores[itemId] = Number(payload.score);
      }
      if (payload.note !== undefined) {
        ev.peserta.notes[itemId] = payload.note;
      }
      if (payload.file !== undefined) {
        ev.peserta.files[itemId] = payload.file;
      }

      if (ev.peserta.status !== 'SELESAI') {
        ev.peserta.status = 'DRAF';
      }

      this.evaluations[String(respondentId)] = ev;
      this.save(skipNotify);
      this.syncEvaluationToFirestore(respondentId);
    }

    deletePesertaFile(respondentId, itemId, skipNotify = true) {
      const ev = this.getEvaluation(respondentId);
      if (ev.peserta && ev.peserta.files && ev.peserta.files[itemId]) {
        delete ev.peserta.files[itemId];
        this.evaluations[String(respondentId)] = ev;
        this.save(skipNotify);
        this.syncEvaluationToFirestore(respondentId);
      }
    }

    submitPesertaEvaluation(respondentId) {
      const ev = this.getEvaluation(respondentId);
      if (!ev.peserta) {
        ev.peserta = { status: 'BELUM', scores: {}, notes: {}, files: {}, submittedAt: null };
      }
      ev.peserta.status = 'SELESAI';
      ev.peserta.submittedAt = new Date().toISOString();
      this.evaluations[String(respondentId)] = ev;
      this.save();
      this.syncEvaluationToFirestore(respondentId);
    }

    // Auto-save Evaluator (Atasan / Koordinator) Item Answer
    saveEvaluatorItemAnswer(respondentId, roleKey, itemId, payload, skipNotify = true) {
      const validRoleKey = roleKey === 'atasan' ? 'atasan' : 'koordinator';
      const ev = this.getEvaluation(respondentId);
      if (!ev[validRoleKey]) {
        ev[validRoleKey] = { status: 'BELUM', scores: {}, notes: {}, submittedAt: null };
      }
      if (!ev[validRoleKey].scores) ev[validRoleKey].scores = {};
      if (!ev[validRoleKey].notes) ev[validRoleKey].notes = {};

      if (payload.score !== undefined) {
        ev[validRoleKey].scores[itemId] = Number(payload.score);
      }
      if (payload.note !== undefined) {
        ev[validRoleKey].notes[itemId] = payload.note;
      }

      if (ev[validRoleKey].status !== 'SELESAI') {
        ev[validRoleKey].status = 'DRAF';
      }

      this.evaluations[String(respondentId)] = ev;
      this.save(skipNotify);
      this.syncEvaluationToFirestore(respondentId);
    }

    submitEvaluatorEvaluation(respondentId, roleKey) {
      const validRoleKey = roleKey === 'atasan' ? 'atasan' : 'koordinator';
      const ev = this.getEvaluation(respondentId);
      if (!ev[validRoleKey]) {
        ev[validRoleKey] = { status: 'BELUM', scores: {}, notes: {}, submittedAt: null };
      }
      ev[validRoleKey].status = 'SELESAI';
      ev[validRoleKey].submittedAt = new Date().toISOString();
      this.evaluations[String(respondentId)] = ev;
      this.save();
      this.syncEvaluationToFirestore(respondentId);
      return { success: true, respondentId, roleKey: validRoleKey };
    }

    getEvaluationProgressForRole(respondentId, roleKey = 'peserta') {
      const r = this.respondents.find(x => x.id === Number(respondentId));
      if (!r) return { total: 0, filled: 0, percentage: 0, isComplete: false, status: 'BELUM' };

      const validRoleKey = (roleKey === 'atasan' || roleKey === 'koordinator') ? roleKey : 'peserta';
      const ev = this.getEvaluation(respondentId);
      const evalObj = ev[validRoleKey] || {};
      const scores = evalObj.scores || {};

      let totalItems = 0;
      let filledItems = 0;

      r.modules.forEach(modCode => {
        const mod = window.MASTER_DATA.bankButir[modCode];
        if (mod) {
          mod.items.forEach(it => {
            totalItems++;
            if (scores[it.id] !== undefined && scores[it.id] !== null) {
              filledItems++;
            }
          });
        }
      });

      const pct = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;
      const isComplete = totalItems > 0 && filledItems === totalItems;

      return {
        total: totalItems,
        filled: filledItems,
        percentage: pct,
        isComplete: isComplete,
        status: evalObj.status || 'BELUM'
      };
    }

    getAssignedRespondentsForUser(user) {
      if (!user) return [];
      const role = user.role || '';
      const cleanNip = String(user.nip || '').trim().toLowerCase();
      const cleanNama = String(user.nama || '').trim().toLowerCase();
      const cleanUnit = String(user.unitName || user.unit || '').trim().toLowerCase();

      if (role === 'admin' || role === 'developer') {
        return this.respondents || [];
      }

      if (role === 'atasan') {
        return (this.respondents || []).filter(r => {
          if (!r.atasan) return false;
          const supNip = String(r.atasan.nip || '').trim().toLowerCase();
          const supNama = String(r.atasan.nama || '').trim().toLowerCase();
          if (cleanNip && supNip && (cleanNip === supNip)) return true;
          if (cleanNama && supNama && (cleanNama === supNama)) return true;
          // Fallback bila unit sama dan atasan unit
          if (cleanUnit && r.unit && String(r.unit).trim().toLowerCase() === cleanUnit && supNip === cleanNip) return true;
          return false;
        });
      }

      if (role.includes('koordinator')) {
        return (this.respondents || []).filter(r => {
          const kEks = r.koordinatorEksternal;
          const kInt = r.koordinatorInternal;

          const checkCoord = (c) => {
            if (!c) return false;
            const cNip = String(c.nip || '').trim().toLowerCase();
            const cNama = String(c.nama || '').trim().toLowerCase();
            if (cleanNip && cNip && cleanNip === cNip) return true;
            if (cleanNama && cNama && cleanNama === cNama) return true;
            return false;
          };

          if (checkCoord(kEks) || checkCoord(kInt)) return true;

          // Jika belum ditugaskan spesifik, periksa kecocokan UPDL atau unit untuk koordinator
          if (role === 'koordinator_eksternal' || role === 'koordinator') {
            if (user.updlId && r.updlId === user.updlId) return true;
          }
          if (role === 'koordinator_internal') {
            if (cleanUnit && r.unit && String(r.unit).trim().toLowerCase() === cleanUnit) return true;
          }

          return false;
        });
      }

      return [];
    }

    // === Master UPDL Methods ===
    getUpdls(activeOnly = false) {
      if (!this.updls) this.updls = [...(window.MASTER_DATA.updls || [])];
      return activeOnly ? this.updls.filter(u => u.status === 'AKTIF') : this.updls;
    }

    getUpdlById(id) {
      return this.getUpdls().find(u => u.id === id) || null;
    }

    addUpdl(data) {
      const existing = this.getUpdls().find(u => u.kode.toLowerCase() === data.kode.toLowerCase().trim());
      if (existing) throw new Error(`Kode UPDL "${data.kode}" sudah terdaftar.`);

      const newUpdl = {
        id: `updl-${Date.now()}`,
        kode: data.kode.trim().toUpperCase(),
        nama: data.nama.trim(),
        wilayah: data.wilayah || 'Indonesia',
        alamat: data.alamat || '',
        telepon: data.telepon || '',
        status: data.status || 'AKTIF',
        createdAt: new Date().toISOString()
      };

      this.updls.push(newUpdl);
      this.addAuditLog('TAMBAH_UPDL', `UPDL ${newUpdl.nama}`, `Penambahan Master UPDL baru kode ${newUpdl.kode}`);
      this.save();
      this.syncUpdlToFirestore(newUpdl);
      return newUpdl;
    }

    updateUpdl(id, data) {
      const updl = this.getUpdlById(id);
      if (!updl) throw new Error('UPDL tidak ditemukan.');

      if (data.kode && data.kode.toLowerCase().trim() !== updl.kode.toLowerCase()) {
        const dup = this.getUpdls().find(u => u.id !== id && u.kode.toLowerCase() === data.kode.toLowerCase().trim());
        if (dup) throw new Error(`Kode UPDL "${data.kode}" sudah dipakai.`);
        updl.kode = data.kode.trim().toUpperCase();
      }

      if (data.nama !== undefined) updl.nama = data.nama.trim();
      if (data.wilayah !== undefined) updl.wilayah = data.wilayah.trim();
      if (data.alamat !== undefined) updl.alamat = data.alamat.trim();
      if (data.telepon !== undefined) updl.telepon = data.telepon.trim();
      if (data.status !== undefined) updl.status = data.status;
      updl.updatedAt = new Date().toISOString();

      this.addAuditLog('EDIT_UPDL', `UPDL ${updl.nama}`, `Perubahan atribut master UPDL ${updl.kode}`);
      this.save();
      this.syncUpdlToFirestore(updl);
      return updl;
    }

    toggleUpdlStatus(id) {
      const updl = this.getUpdlById(id);
      if (!updl) throw new Error('UPDL tidak ditemukan.');
      const newStatus = updl.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
      updl.status = newStatus;
      updl.updatedAt = new Date().toISOString();

      this.addAuditLog('STATUS_UPDL', `UPDL ${updl.nama}`, `Pengubahan status menjadi ${newStatus}`);
      this.save();
      this.syncUpdlToFirestore(updl);
      return updl;
    }

    deleteUpdl(id) {
      // Soft-deactivation rule from admin.md section 4.A & 5
      const linkedUnits = this.getUnits(id);
      if (linkedUnits.length > 0) {
        throw new Error(`Tidak dapat menghapus permanen: terdapat ${linkedUnits.length} unit di bawah UPDL ini. Gunakan opsi Nonaktifkan.`);
      }
      return this.toggleUpdlStatus(id);
    }

    // === Master Unit Methods (Unit Kerja Independen) ===
    getUnits(updlId = null, activeOnly = false) {
      if (!this.units) this.units = [...((window.MASTER_DATA && window.MASTER_DATA.units) || [])];
      let list = [...this.units];
      const isOnlyActive = activeOnly === true || updlId === true;
      if (isOnlyActive) {
        list = list.filter(u => u.status === 'AKTIF');
      }
      return list;
    }

    getUnitById(id) {
      return (this.units || []).find(u => u.id === id) || null;
    }

    getUnitByName(unitIdentifier) {
      if (!unitIdentifier) return null;
      const clean = String(unitIdentifier).trim().toLowerCase();
      const cleanNoPln = clean.replace(/^(pln\s+)/i, '').trim();
      const list = this.getUnits ? this.getUnits() : (this.units || []);
      return list.find(u => {
        const uNama = String(u.nama).toLowerCase();
        const uNamaNoPln = uNama.replace(/^(pln\s+)/i, '').trim();
        const uId = String(u.id).toLowerCase();
        const uKode = u.kode ? String(u.kode).toLowerCase() : '';
        return uNama === clean ||
          uNamaNoPln === cleanNoPln ||
          uId === clean ||
          uKode === clean ||
          uNama.includes(cleanNoPln) ||
          clean.includes(uNamaNoPln);
      }) || null;
    }

    addUnit(data) {
      const existing = (this.units || []).find(u => u.kode && u.kode.toLowerCase() === (data.kode || '').toLowerCase().trim());
      if (existing) throw new Error(`Kode Unit "${data.kode}" sudah terdaftar.`);

      const newUnit = {
        id: `unit-${Date.now()}`,
        kode: (data.kode || '').trim().toUpperCase(),
        nama: (data.nama || '').trim(),
        induk: data.induk ? data.induk.trim() : '',
        alamat: data.alamat ? data.alamat.trim() : '',
        kota: data.kota ? data.kota.trim() : '',
        status: data.status || 'AKTIF',
        createdAt: new Date().toISOString()
      };

      if (data.atasan && data.atasan.nama) {
        newUnit.atasan = {
          nama: data.atasan.nama.trim(),
          nip: data.atasan.nip ? data.atasan.nip.trim() : '',
          jabatan: data.atasan.jabatan ? data.atasan.jabatan.trim() : `Manager ${newUnit.nama}`
        };
      }

      this.units.push(newUnit);

      // Jika ada atasan saat menambah unit, daftarkan juga ke master users
      if (newUnit.atasan && newUnit.atasan.nama && newUnit.atasan.nip) {
        this.ensureSupervisorExists({
          ...newUnit.atasan,
          unitId: newUnit.id,
          unitName: newUnit.nama
        });
      }

      this.addAuditLog('TAMBAH_UNIT', `Unit ${newUnit.nama}`, `Penambahan Master Unit Kerja kode ${newUnit.kode}`);
      this.save();
      this.syncUnitToFirestore(newUnit);
      return newUnit;
    }

    // === Supervisor (Atasan Langsung) Methods ===
    getSupervisors(updlId = null) {
      if (!this.users) this.users = this.generateInitialUsers();
      let list = this.users.filter(u => u.role === 'atasan' && u.status === 'AKTIF');
      if (updlId && updlId !== 'ALL') {
        list = list.filter(u => u.updlId === updlId);
      }
      return list;
    }

    getSupervisorByUnit(unitIdentifier) {
      if (!unitIdentifier) return null;
      const clean = String(unitIdentifier).trim().toLowerCase();

      // 1. Cari unit object untuk mencocokkan ID, Nama, atau Kode
      const unitObj = (this.units || []).find(u =>
        String(u.id).toLowerCase() === clean ||
        String(u.nama).toLowerCase() === clean ||
        String(u.kode).toLowerCase() === clean
      );
      const unitId = unitObj ? unitObj.id : null;
      const unitName = unitObj ? unitObj.nama : unitIdentifier;

      // 2. Cari di master users dengan role: 'atasan' yang AKTIF
      const foundUser = (this.users || []).find(u =>
        u.role === 'atasan' && u.status === 'AKTIF' && (
          (unitId && u.unitId === unitId) ||
          (u.unitName && u.unitName.toLowerCase() === unitName.toLowerCase()) ||
          (u.jabatan && u.jabatan.toLowerCase().includes(unitName.toLowerCase()))
        )
      );
      if (foundUser) {
        return {
          nama: foundUser.nama,
          nip: foundUser.nip,
          jabatan: foundUser.jabatan,
          unitId: foundUser.unitId || unitId,
          unitName: foundUser.unitName || unitName,
          source: 'user',
          userId: foundUser.id
        };
      }

      // 3. Cek properti atasan langsung di data unit HANYA jika supervisor masih terdaftar aktif di master users
      if (unitObj && unitObj.atasan && unitObj.atasan.nama && unitObj.atasan.nip) {
        const atasanNipClean = String(unitObj.atasan.nip).trim().toLowerCase();
        const activeUserSup = (this.users || []).find(u =>
          u.role === 'atasan' && u.status === 'AKTIF' && String(u.nip).trim().toLowerCase() === atasanNipClean
        );
        if (activeUserSup) {
          return {
            nama: activeUserSup.nama,
            nip: activeUserSup.nip,
            jabatan: activeUserSup.jabatan || unitObj.atasan.jabatan,
            unitId: unitObj.id,
            unitName: unitObj.nama,
            source: 'unit',
            userId: activeUserSup.id
          };
        } else {
          // Atasan di data unit ini sudah dihapus atau tidak aktif lagi dari master users -> bersihkan data stale
          delete unitObj.atasan;
          this.save(true);
        }
      }

      // 4. Cek fallback dari responden yang sudah ada dengan unit yang sama HANYA jika atasan masih ada & aktif di master users!
      const existingResp = (this.respondents || []).find(r =>
        r.unit && r.unit.toLowerCase() === unitName.toLowerCase() && r.atasan && r.atasan.nama && r.atasan.nip && r.atasan.nip !== '-'
      );
      if (existingResp && existingResp.atasan) {
        const atasanNipClean = String(existingResp.atasan.nip).trim().toLowerCase();
        const activeUserSup = (this.users || []).find(u =>
          u.role === 'atasan' && u.status === 'AKTIF' && String(u.nip).trim().toLowerCase() === atasanNipClean
        );
        if (activeUserSup) {
          return {
            nama: activeUserSup.nama,
            nip: activeUserSup.nip,
            jabatan: activeUserSup.jabatan || existingResp.atasan.jabatan,
            unitId: unitId,
            unitName: unitName,
            source: 'respondent',
            userId: activeUserSup.id
          };
        }
      }

      return null;
    }

    ensureSupervisorExists(atasanData) {
      if (!atasanData || !atasanData.nama || !atasanData.nip) return null;
      const cleanNip = String(atasanData.nip).trim();
      if (!cleanNip || cleanNip === '-') return null;
      const cleanNama = String(atasanData.nama).trim();
      const cleanJabatan = atasanData.jabatan ? String(atasanData.jabatan).trim() : `Manager ${atasanData.unitName || ''}`.trim();

      // Resolusi unit & updl yang valid
      const cleanUnit = atasanData.unitName ? String(atasanData.unitName).trim() : '';
      const unitObj = (this.units || []).find(u =>
        (atasanData.unitId && u.id === atasanData.unitId) ||
        (cleanUnit && u.nama.toLowerCase() === cleanUnit.toLowerCase())
      );
      const resolvedUnitId = unitObj ? unitObj.id : (atasanData.unitId || '');
      const resolvedUnitName = unitObj ? unitObj.nama : cleanUnit;
      const resolvedUpdlId = atasanData.updlId || (this.state && this.state.activeDashboardUpdl !== 'ALL' ? this.state.activeDashboardUpdl : (this.getUpdls()[0] ? this.getUpdls()[0].id : ''));

      // Pastikan ada di master users
      if (!this.users) this.users = [];
      let user = this.users.find(u => String(u.nip).toLowerCase() === cleanNip.toLowerCase());
      if (!user) {
        user = {
          id: `usr-sup-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          nip: cleanNip,
          nama: cleanNama,
          email: atasanData.email ? atasanData.email.trim() : `${cleanNip.toLowerCase()}@pln.co.id`,
          jabatan: cleanJabatan,
          updlId: resolvedUpdlId,
          unitId: resolvedUnitId,
          unitName: resolvedUnitName,
          role: 'atasan',
          status: 'AKTIF',
          password: atasanData.password || 'pln123',
          createdAt: new Date().toISOString()
        };
        this.users.push(user);
        this.syncUserToFirestore(user);
      } else {
        user.role = 'atasan';
        user.status = user.status || 'AKTIF';
        if (!user.password) user.password = atasanData.password || 'pln123';
        if (cleanNama) user.nama = cleanNama;
        if (cleanJabatan) user.jabatan = cleanJabatan;
        if (resolvedUnitId) user.unitId = resolvedUnitId;
        if (resolvedUnitName) user.unitName = resolvedUnitName;
        if (resolvedUpdlId) user.updlId = resolvedUpdlId;
        this.syncUserToFirestore(user);
      }

      // Tautkan ke data Unit di this.units bila unit ditemukan
      if (unitObj) {
        unitObj.atasan = {
          nama: cleanNama,
          nip: cleanNip,
          jabatan: cleanJabatan
        };
        this.syncUnitToFirestore(unitObj);
      }

      this.save();
      return {
        nama: cleanNama,
        nip: cleanNip,
        jabatan: cleanJabatan,
        user: user
      };
    }

    // === Otomatis Buat & Sinkronkan Akun Pengguna Peserta (Berasal dari Impor Excel / Input Manual / Penugasan) ===
    ensureUserForRespondent(resp) {
      if (!resp || !resp.nip) return null;
      const cleanNip = String(resp.nip).trim();
      const cleanNama = resp.nama ? String(resp.nama).trim() : cleanNip;
      const cleanJabatan = resp.jabatan ? String(resp.jabatan).trim() : 'Peserta Evaluasi';
      const cleanUnit = resp.unit ? String(resp.unit).trim() : '';

      const unitObj = (this.units || []).find(u =>
        (resp.unitId && u.id === resp.unitId) ||
        (cleanUnit && u.nama.toLowerCase() === cleanUnit.toLowerCase())
      );
      const resolvedUnitId = unitObj ? unitObj.id : (resp.unitId || '');
      const resolvedUnitName = unitObj ? unitObj.nama : cleanUnit;
      const resolvedUpdlId = resp.updlId || (this.state && this.state.activeDashboardUpdl !== 'ALL' ? this.state.activeDashboardUpdl : (this.getUpdls()[0] ? this.getUpdls()[0].id : ''));

      if (!this.users) this.users = [];
      let user = this.users.find(u => (u.nip || '').toLowerCase() === cleanNip.toLowerCase());

      if (!user) {
        user = {
          id: `usr-p-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          nip: cleanNip,
          nama: cleanNama,
          email: `${cleanNip.toLowerCase()}@pln.co.id`,
          jabatan: cleanJabatan,
          updlId: resolvedUpdlId,
          unitId: resolvedUnitId,
          unitName: resolvedUnitName,
          role: 'peserta',
          status: 'AKTIF',
          password: resp.password || 'pln123',
          respondentId: resp.id,
          createdAt: new Date().toISOString()
        };
        this.users.push(user);
        this.save();
        this.syncUserToFirestore(user);
      } else {
        // Jika user sudah ada (misal akun peserta), jaga status & update relasi
        user.role = 'peserta';
        user.status = user.status || 'AKTIF';
        if (!user.password) user.password = resp.password || 'pln123';
        let changed = false;
        if (!user.respondentId || user.respondentId !== resp.id) {
          user.respondentId = resp.id;
          changed = true;
        }
        if (cleanNama && user.nama !== cleanNama) {
          user.nama = cleanNama;
          changed = true;
        }
        if (cleanJabatan && user.jabatan !== cleanJabatan) {
          user.jabatan = cleanJabatan;
          changed = true;
        }
        if (resolvedUnitName && user.unitName !== resolvedUnitName) {
          user.unitName = resolvedUnitName;
          changed = true;
        }
        if (resolvedUnitId && user.unitId !== resolvedUnitId) {
          user.unitId = resolvedUnitId;
          changed = true;
        }
        if (resolvedUpdlId && user.updlId !== resolvedUpdlId) {
          user.updlId = resolvedUpdlId;
          changed = true;
        }
        if (changed) {
          this.save();
          this.syncUserToFirestore(user);
        }
      }
      return user;
    }

    // === Sinkronkan Semua Master User Ber-role 'peserta' ke Matriks Penugasan Responden ===
    syncParticipantsToRespondents() {
      if (!this.users || !this.respondents) return;
      const participantUsers = this.users.filter(u => u.role === 'peserta' && u.nip);
      let countAdded = 0;
      participantUsers.forEach(u => {
        const cleanNip = String(u.nip).toLowerCase().trim();
        const existing = this.respondents.find(r => (r.nip || '').toLowerCase().trim() === cleanNip);
        if (!existing) {
          const defaultUpdl = u.updlId || (this.state && this.state.activeDashboardUpdl !== 'ALL' ? this.state.activeDashboardUpdl : 'updl-plb');
          const defaultProg = (this.state && this.state.activeDashboardProgram !== 'ALL') ? this.state.activeDashboardProgram : 'prog-pil-susut';
          const defaultPeriod = (this.state && this.state.activeDashboardPeriod !== 'ALL') ? this.state.activeDashboardPeriod : 'period-2026-1';

          const autoResp = this.addRespondent({
            nama: u.nama,
            nip: u.nip,
            jabatan: u.jabatan || 'Peserta Evaluasi',
            unit: u.unitName || '',
            updlId: defaultUpdl,
            programId: defaultProg,
            periodId: defaultPeriod,
            modules: ['A', 'B', 'C'],
            password: u.password || 'pln123'
          });
          u.respondentId = autoResp.id;
          countAdded++;
        } else {
          u.respondentId = existing.id;
        }
      });
      if (countAdded > 0) {
        this.save();
      }
    }

    updateUnit(id, data) {
      const unit = this.getUnitById(id);
      if (!unit) throw new Error('Unit tidak ditemukan.');

      if (data.kode && data.kode.toLowerCase().trim() !== unit.kode.toLowerCase()) {
        const dup = (this.units || []).find(u => u.id !== id && u.kode.toLowerCase() === data.kode.toLowerCase().trim());
        if (dup) throw new Error(`Kode Unit "${data.kode}" sudah dipakai.`);
        unit.kode = data.kode.trim().toUpperCase();
      }

      if (data.nama !== undefined) unit.nama = data.nama.trim();
      if (data.induk !== undefined) unit.induk = data.induk.trim();
      if (data.alamat !== undefined) unit.alamat = data.alamat.trim();
      if (data.kota !== undefined) unit.kota = data.kota.trim();
      if (data.status !== undefined) unit.status = data.status;
      unit.updatedAt = new Date().toISOString();

      this.addAuditLog('EDIT_UNIT', `Unit ${unit.nama}`, `Perubahan atribut unit kerja ${unit.kode}`);
      this.save();
      this.syncUnitToFirestore(unit);
      return unit;
    }

    deleteUnit(id) {
      if (!this.units) return false;
      const idx = this.units.findIndex(u => u.id === id);
      if (idx === -1) return false;
      const removed = this.units.splice(idx, 1)[0];
      this.addAuditLog('HAPUS_UNIT', `Unit ${removed.nama}`, `Penghapusan Master Unit Kerja ${removed.kode}`);
      this.save();
      this.syncUnitDeletionFromFirestore(id);
      return true;
    }

    toggleUnitStatus(id) {
      const unit = this.getUnitById(id);
      if (!unit) throw new Error('Unit tidak ditemukan.');
      const newStatus = unit.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
      unit.status = newStatus;
      unit.updatedAt = new Date().toISOString();

      this.addAuditLog('STATUS_UNIT', `Unit ${unit.nama}`, `Pengubahan status menjadi ${newStatus}`);
      this.save();
      this.syncUnitToFirestore(unit);
      return unit;
    }

    // === User Management Methods ===
    getUsers(filters = {}) {
      if (!this.users) this.users = this.generateInitialUsers();
      let list = [...this.users];

      if (filters.updlId && filters.updlId !== 'ALL') {
        list = list.filter(u => u.updlId === filters.updlId);
      }
      if (filters.unitId && filters.unitId !== 'ALL') {
        list = list.filter(u => u.unitId === filters.unitId);
      }
      if (filters.role && filters.role !== 'ALL') {
        list = list.filter(u => u.role === filters.role);
      }
      if (filters.status && filters.status !== 'ALL') {
        list = list.filter(u => u.status === filters.status);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const terms = q.split(/\s+/).filter(Boolean);
        list = list.filter(u => {
          const haystack = `${u.nama || ''} ${u.nip || ''} ${u.email || ''} ${u.jabatan || ''} ${u.unitName || ''}`.toLowerCase();
          return terms.every(term => haystack.includes(term));
        });
      }
      return list;
    }

    getUserById(id) {
      return (this.users || []).find(u => u.id === id) || null;
    }

    addUser(data) {
      const currentUser = window.authManager ? window.authManager.getUser() : null;
      const isDev = (currentUser && currentUser.role === 'developer') || (currentUser && (currentUser.nip || '').toLowerCase() === 'kmlafdz');

      // Developer dapat membuat akun admin pusat & user lain; Admin Pusat dilarang membuat akun developer
      if (data.role === 'developer' && !isDev) {
        throw new Error('Hanya Developer yang memiliki wewenang untuk membuat akun Developer.');
      }

      const cleanNip = data.nip ? data.nip.trim() : '';
      if (!cleanNip) throw new Error('NIP wajib diisi.');
      const existing = (this.users || []).find(u => u.nip.toLowerCase() === cleanNip.toLowerCase());
      if (existing) throw new Error(`User dengan NIP "${data.nip}" sudah terdaftar.`);

      const unitObj = this.getUnitById(data.unitId) || this.getUnitByName(data.unitName);
      const unitNameVal = unitObj ? unitObj.nama : (data.unitName || (data.unitId ? data.unitId : 'Kantor Pusat'));
      const updlIdVal = unitObj ? unitObj.updlId : (data.updlId || '');

      const newUser = {
        id: data.id || `usr-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        nip: cleanNip,
        nama: data.nama ? data.nama.trim() : cleanNip,
        email: data.email ? data.email.trim() : `${cleanNip.toLowerCase()}@pln.co.id`,
        jabatan: data.jabatan ? data.jabatan.trim() : 'Pegawai',
        updlId: updlIdVal,
        unitId: unitObj ? unitObj.id : (data.unitId || ''),
        unitName: unitNameVal,
        role: data.role || 'peserta',
        status: data.status || 'AKTIF',
        avatar: data.avatar || '',
        password: data.password ? data.password.trim() : 'pln123',
        isAdminPusat: data.role === 'admin' ? true : false,
        createdAt: new Date().toISOString()
      };

      this.users.push(newUser);

      // Jika role adalah peserta, pastikan otomatis tercatat di respondents agar muncul di matriks evaluasi & dashboard
      if (newUser.role === 'peserta') {
        const existingResp = this.respondents.find(r => r.nip && r.nip.toLowerCase() === cleanNip.toLowerCase());
        if (!existingResp) {
          const autoResp = this.addRespondent({
            nama: newUser.nama,
            nip: newUser.nip,
            jabatan: newUser.jabatan,
            unit: newUser.unitName,
            updlId: newUser.updlId,
            password: newUser.password || 'pln123'
          });
          newUser.respondentId = autoResp.id;
        } else {
          newUser.respondentId = existingResp.id;
        }
      }

      this.addAuditLog('TAMBAH_USER', `User ${newUser.nama}`, `Registrasi pengguna baru NIP ${newUser.nip} role ${newUser.role}`);
      this.save();
      this.syncUserToFirestore(newUser);
      return newUser;
    }

    updateUser(id, data) {
      const user = this.getUserById(id);
      if (!user) throw new Error('User tidak ditemukan.');

      const currentUser = window.authManager ? window.authManager.getUser() : null;
      const isDev = (currentUser && currentUser.role === 'developer') || (currentUser && (currentUser.nip || '').toLowerCase() === 'kmlafdz');

      // Proteksi akun Developer
      if ((data.role === 'developer' || user.role === 'developer') && !isDev) {
        throw new Error('Hanya Developer yang memiliki wewenang untuk menetapkan atau mengelola akun Developer.');
      }

      if (data.nip && data.nip.toLowerCase().trim() !== user.nip.toLowerCase()) {
        const dup = (this.users || []).find(u => u.id !== id && u.nip.toLowerCase() === data.nip.toLowerCase().trim());
        if (dup) throw new Error(`NIP "${data.nip}" sudah dipakai user lain.`);
        user.nip = data.nip.trim();
      }

      if (data.nama !== undefined) user.nama = data.nama.trim();
      if (data.email !== undefined) user.email = data.email.trim();
      if (data.jabatan !== undefined) user.jabatan = data.jabatan.trim();
      if (data.updlId !== undefined) user.updlId = data.updlId;
      if (data.unitId !== undefined) {
        user.unitId = data.unitId;
        const uObj = this.getUnitById(data.unitId);
        user.unitName = uObj ? uObj.nama : (data.unitId ? data.unitId : 'Kantor Pusat');
      }
      if (data.role !== undefined) {
        user.role = data.role;
        if (user.role === 'admin') user.isAdminPusat = true;
      }
      if (data.status !== undefined) user.status = data.status;
      if (data.avatar !== undefined) user.avatar = data.avatar;
      if (data.password !== undefined && data.password.trim() !== '') {
        user.password = data.password.trim();
      }
      user.updatedAt = new Date().toISOString();

      // Sinkronkan perubahan ke responden jika role peserta
      if (user.role === 'peserta' || user.respondentId) {
        const resp = this.respondents.find(r =>
          r.id === user.respondentId ||
          (r.nip && user.nip && r.nip.toLowerCase() === user.nip.toLowerCase())
        );
        if (resp) {
          if (data.nama) resp.nama = user.nama;
          if (data.nip) resp.nip = user.nip;
          if (data.jabatan) resp.jabatan = user.jabatan;
          if (user.unitName) resp.unit = user.unitName;
          if (user.updlId) resp.updlId = user.updlId;
          if (data.avatar !== undefined) resp.avatar = data.avatar;
          this.syncRespondentToFirestore(resp);
        }
      }

      this.addAuditLog('EDIT_USER', `User ${user.nama}`, `Perubahan data profil user NIP ${user.nip}`);
      this.save();
      this.syncUserToFirestore(user);
      return user;
    }

    toggleUserStatus(id) {
      const user = this.getUserById(id);
      if (!user) throw new Error('User tidak ditemukan.');

      const currentUser = window.authManager ? window.authManager.getUser() : null;
      const isDev = (currentUser && currentUser.role === 'developer') || (currentUser && (currentUser.nip || '').toLowerCase() === 'kmlafdz');
      if (user.role === 'developer' && !isDev) {
        throw new Error('Status akun Developer hanya dapat diubah oleh Developer.');
      }

      user.status = user.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
      user.updatedAt = new Date().toISOString();

      this.addAuditLog('STATUS_USER', `User ${user.nama}`, `Pengubahan status akun menjadi ${user.status}`);
      this.save();
      this.syncUserToFirestore(user);
      return user;
    }

    deleteUser(id) {
      const idx = (this.users || []).findIndex(u => u.id === id);
      if (idx === -1) throw new Error('User tidak ditemukan.');
      const user = this.users[idx];

      const currentUser = window.authManager ? window.authManager.getUser() : null;
      const isDev = (currentUser && currentUser.role === 'developer') || (currentUser && (currentUser.nip || '').toLowerCase() === 'kmlafdz');

      if ((user.nip || '').toLowerCase() === 'kmlafdz') {
        throw new Error('Akun Developer Utama (kmlafdz) dilindungi dan tidak dapat dihapus.');
      }
      if (user.role === 'developer' && !isDev) {
        throw new Error('Akun Developer dilindungi dan tidak dapat dihapus oleh Administrator.');
      }
      this.users.splice(idx, 1);

      // Bersihkan SEMUA responden yang terkait dengan user ini (berdasarkan respondentId atau NIP)
      const cleanUserNip = (user.nip || '').trim().toLowerCase();
      const matchedResps = (this.respondents || []).filter(r =>
        (user.respondentId && (Number(r.id) === Number(user.respondentId) || String(r.id) === String(user.respondentId))) ||
        (r.nip && cleanUserNip && String(r.nip).trim().toLowerCase() === cleanUserNip)
      );

      matchedResps.forEach(resp => {
        this.respondents = this.respondents.filter(x => x.id !== resp.id);
        if (this.evaluations[String(resp.id)]) {
          delete this.evaluations[String(resp.id)];
        }
        this.syncRespondentDeletionFromFirestore(resp.id);
      });

      // Bersihkan atasan dari unit kerja jika user yang dihapus ini ditugaskan sebagai atasan unit
      if (cleanUserNip) {
        (this.units || []).forEach(unit => {
          if (unit.atasan && unit.atasan.nip && String(unit.atasan.nip).trim().toLowerCase() === cleanUserNip) {
            delete unit.atasan;
            this.syncUnitToFirestore(unit);
          }
        });

        // Bersihkan referensi atasan dari seluruh responden yang diawasi oleh atasan ini
        (this.respondents || []).forEach(r => {
          if (r.atasan && r.atasan.nip && String(r.atasan.nip).trim().toLowerCase() === cleanUserNip) {
            r.atasan = null;
            this.syncRespondentToFirestore(r);
          }
        });
      }

      this.addAuditLog('HAPUS_USER', `User ${user.nama}`, `Penghapusan akun user NIP ${user.nip} (${user.role})`);
      this.save();
      this.syncUserDeletionFromFirestore(id, user.nip);

      // Jika user yang dihapus memiliki sesi aktif di browser ini, putus sesi login segera
      if (window.authManager) {
        const activeSess = window.authManager.getUser();
        if (activeSess && (activeSess.id === id || (activeSess.nip && cleanUserNip && String(activeSess.nip).trim().toLowerCase() === cleanUserNip))) {
          window.authManager.logout();
        }
      }

      return user;
    }

    importUsers(userList, mode = 'create_only') {
      let added = 0;
      let updated = 0;
      let duplicates = 0;
      const errors = [];
      const updls = this.getUpdls();
      const units = this.getUnits();

      userList.forEach((row, idx) => {
        try {
          const rawNip = row.nip ? String(row.nip).trim() : '';
          const rawNama = row.nama ? String(row.nama).trim() : '';
          if (!rawNip || !rawNama) {
            errors.push(`Baris ${idx + 1}: NIP dan Nama wajib diisi.`);
            return;
          }

          // Resolve UPDL
          let targetUpdlId = 'updl-plb';
          if (row.updlId && updls.some(u => u.id === row.updlId)) {
            targetUpdlId = row.updlId;
          } else if (row.updl || row.kodeUpdl) {
            const updlQuery = String(row.updl || row.kodeUpdl).toLowerCase().trim();
            const matchedUpdl = updls.find(u =>
              u.id.toLowerCase() === updlQuery ||
              u.kode.toLowerCase() === updlQuery ||
              u.nama.toLowerCase().includes(updlQuery)
            );
            if (matchedUpdl) targetUpdlId = matchedUpdl.id;
          }

          // Resolve Unit
          let targetUnitId = 'unit-up3-mtr';
          if (row.unitId && units.some(un => un.id === row.unitId)) {
            targetUnitId = row.unitId;
          } else if (row.unit || row.namaUnit || row.kodeUnit) {
            const unitQuery = String(row.unit || row.namaUnit || row.kodeUnit).toLowerCase().trim();
            const matchedUnit = units.find(un =>
              un.id.toLowerCase() === unitQuery ||
              un.kode.toLowerCase() === unitQuery ||
              un.nama.toLowerCase().includes(unitQuery)
            );
            if (matchedUnit) {
              targetUnitId = matchedUnit.id;
              if (matchedUnit.updlId) targetUpdlId = matchedUnit.updlId;
            }
          }

          // Normalize role
          let role = 'peserta';
          const rRaw = String(row.role || 'peserta').toLowerCase().trim();
          if (rRaw.includes('atasan') || rRaw.includes('supervisor') || rRaw.includes('evaluator')) role = 'atasan';
          else if (rRaw.includes('eksternal')) role = 'koordinator_eksternal';
          else if (rRaw.includes('koordinator')) role = 'koordinator_internal';
          else if (rRaw.includes('admin')) role = 'admin';

          const existingUser = (this.users || []).find(u => u.nip.toLowerCase() === rawNip.toLowerCase());

          if (existingUser) {
            if (mode === 'update_existing') {
              this.updateUser(existingUser.id, {
                nama: rawNama,
                email: row.email ? String(row.email).trim() : existingUser.email,
                jabatan: row.jabatan ? String(row.jabatan).trim() : existingUser.jabatan,
                updlId: targetUpdlId,
                unitId: targetUnitId,
                role: role,
                status: 'AKTIF',
                password: row.password ? String(row.password).trim() : undefined
              });
              updated++;
            } else {
              duplicates++;
            }
          } else {
            this.addUser({
              nip: rawNip,
              nama: rawNama,
              email: row.email ? String(row.email).trim() : `${rawNip.toLowerCase()}@pln.co.id`,
              jabatan: row.jabatan ? String(row.jabatan).trim() : 'Pegawai',
              updlId: targetUpdlId,
              unitId: targetUnitId,
              role: role,
              status: 'AKTIF',
              password: row.password ? String(row.password).trim() : 'pln123'
            });
            added++;
          }
        } catch (err) {
          errors.push(`Baris ${idx + 1}: ${err.message}`);
        }
      });

      this.addAuditLog('IMPORT_USER', `Impor User Massal (${mode})`, `Selesai: ${added} baru, ${updated} diperbarui, ${duplicates} duplikat dilewati`);
      return { added, updated, duplicates, errors, total: userList.length };
    }

    // === Program Pembelajaran Methods ===
    getPrograms(activeOnly = false) {
      if (!this.programs) this.programs = [...(window.MASTER_DATA.programs || [])];
      return activeOnly ? this.programs.filter(p => p.status === 'AKTIF') : this.programs;
    }

    getProgramById(id) {
      return (this.programs || []).find(p => p.id === id) || null;
    }

    addProgram(data) {
      const existing = (this.programs || []).find(p => p.kode.toLowerCase() === data.kode.toLowerCase().trim());
      if (existing) throw new Error(`Kode Program "${data.kode}" sudah terdaftar.`);

      const newProg = {
        id: `prog-${Date.now()}`,
        kode: data.kode.trim().toUpperCase(),
        nama: data.nama.trim(),
        deskripsi: data.deskripsi || '',
        penyelenggara: data.penyelenggara || 'PLN Corporate University',
        updlIds: Array.isArray(data.updlIds) ? data.updlIds : ['updl-plb'],
        status: data.status || 'AKTIF',
        koordinatorEksternal: data.koordinatorEksternal || {
          nama: 'Azam Zulmi Agusti Nuro',
          nip: '8810743Z',
          jabatan: 'Koordinator Eksternal / UPDL Palembang'
        },
        koordinatorInternal: data.koordinatorInternal || {
          nama: 'Akkhita Nurrul Febriyanti',
          nip: '8909014M',
          jabatan: 'Koordinator Internal UP3 Metro'
        },
        createdAt: new Date().toISOString()
      };

      this.programs.push(newProg);
      this.addAuditLog('TAMBAH_PROGRAM', `Program ${newProg.nama}`, `Pembuatan program pembelajaran terpusat kode ${newProg.kode}`);
      this.save();
      this.syncProgramToFirestore(newProg);
      return newProg;
    }

    updateProgram(id, data) {
      const prog = this.getProgramById(id);
      if (!prog) throw new Error('Program tidak ditemukan.');

      if (data.kode && data.kode.toLowerCase().trim() !== prog.kode.toLowerCase()) {
        const dup = (this.programs || []).find(p => p.id !== id && p.kode.toLowerCase() === data.kode.toLowerCase().trim());
        if (dup) throw new Error(`Kode Program "${data.kode}" sudah terpakai.`);
        prog.kode = data.kode.trim().toUpperCase();
      }

      if (data.nama !== undefined) prog.nama = data.nama.trim();
      if (data.deskripsi !== undefined) prog.deskripsi = data.deskripsi.trim();
      if (data.penyelenggara !== undefined) prog.penyelenggara = data.penyelenggara.trim();
      if (data.updlIds !== undefined) prog.updlIds = data.updlIds;
      if (data.status !== undefined) prog.status = data.status;
      if (data.koordinatorEksternal !== undefined) prog.koordinatorEksternal = data.koordinatorEksternal;
      if (data.koordinatorInternal !== undefined) prog.koordinatorInternal = data.koordinatorInternal;
      prog.updatedAt = new Date().toISOString();

      this.addAuditLog('EDIT_PROGRAM', `Program ${prog.nama}`, `Perubahan atribut program pembelajaran ${prog.kode}`);
      this.save();
      this.syncProgramToFirestore(prog);
      return prog;
    }

    toggleProgramStatus(id) {
      const prog = this.getProgramById(id);
      if (!prog) throw new Error('Program tidak ditemukan.');
      prog.status = prog.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
      prog.updatedAt = new Date().toISOString();

      this.addAuditLog('STATUS_PROGRAM', `Program ${prog.nama}`, `Pengubahan status menjadi ${prog.status}`);
      this.save();
      this.syncProgramToFirestore(prog);
      return prog;
    }

    deleteProgram(id) {
      const idx = (this.programs || []).findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Program tidak ditemukan.');
      const prog = this.programs[idx];

      const linkedPeriods = (this.periods || []).filter(p => {
        if (Array.isArray(p.programIds) && p.programIds.includes(id)) return true;
        return p.programId === id;
      });
      if (linkedPeriods.length > 0) {
        throw new Error(`Tidak dapat menghapus: Program ini masih terikat dengan ${linkedPeriods.length} siklus periode evaluasi.`);
      }

      this.programs.splice(idx, 1);
      this.addAuditLog('HAPUS_PROGRAM', `Program ${prog.nama}`, `Penghapusan program ${prog.kode}`);
      this.save();
      this.syncProgramDeletionFromFirestore(id);
      return true;
    }

    // === Periode Evaluasi Methods ===
    getPeriods(programId = null, activeOnly = false) {
      if (!this.periods) this.periods = [...(window.MASTER_DATA.periods || [])];
      let res = this.periods;
      if (programId && typeof programId === 'string' && programId !== 'ALL') {
        const filtered = res.filter(p => {
          if (Array.isArray(p.programIds) && p.programIds.length > 0) {
            return p.programIds.includes(programId);
          }
          return !p.programId || p.programId === programId;
        });
        if (filtered.length > 0) res = filtered;
      }
      if (activeOnly) {
        const actives = res.filter(p => p.status === 'AKTIF');
        if (actives.length > 0) res = actives;
      }
      return res;
    }

    getPeriodById(id) {
      return (this.periods || []).find(p => p.id === id) || null;
    }

    getActivePeriod(programId = null) {
      const periods = this.getPeriods(programId);
      return (periods || []).find(p => p.status === 'AKTIF') || (periods || [])[0] || null;
    }

    addPeriod(data) {
      if (data.tanggalMulai && data.tenggatPengisian && data.tenggatPengisian < data.tanggalMulai) {
        throw new Error('Tenggat pengisian tidak boleh lebih awal dari tanggal mulai evaluasi.');
      }

      const programIds = Array.isArray(data.programIds) && data.programIds.length > 0
        ? data.programIds
        : (data.programId ? [data.programId] : []);

      const newPeriod = {
        id: `period-${Date.now()}`,
        programIds: programIds,
        programId: programIds[0] || data.programId || '',
        kode: data.kode ? data.kode.trim() : `#EV3-${Date.now().toString().slice(-4)}`,
        nama: data.nama.trim(),
        deskripsi: data.deskripsi || '',
        tanggalMulai: data.tanggalMulai || new Date().toISOString().split('T')[0],
        tenggatPengisian: data.tenggatPengisian || '',
        updlIds: Array.isArray(data.updlIds) ? data.updlIds : ['updl-plb'],
        status: data.status || 'DRAFT', // DRAFT | TERJADWAL | AKTIF | DITUTUP
        respondenCount: 0,
        completionRate: 0,
        createdAt: new Date().toISOString()
      };

      this.periods.push(newPeriod);
      this.addAuditLog('TAMBAH_PERIODE', `Periode ${newPeriod.nama}`, `Penambahan siklus evaluasi kode ${newPeriod.kode} status ${newPeriod.status}`);
      this.save();
      this.syncPeriodToFirestore(newPeriod);
      return newPeriod;
    }

    updatePeriod(id, data) {
      const p = this.getPeriodById(id);
      if (!p) throw new Error('Periode evaluasi tidak ditemukan.');

      const newMulai = data.tanggalMulai !== undefined ? data.tanggalMulai : p.tanggalMulai;
      const newDeadline = data.tenggatPengisian !== undefined ? data.tenggatPengisian : p.tenggatPengisian;
      if (newMulai && newDeadline && newDeadline < newMulai) {
        throw new Error('Tenggat pengisian tidak boleh lebih awal dari tanggal mulai evaluasi.');
      }

      if (data.kode !== undefined) p.kode = data.kode.trim();
      if (data.nama !== undefined) p.nama = data.nama.trim();
      if (data.deskripsi !== undefined) p.deskripsi = data.deskripsi.trim();
      if (data.programIds !== undefined) {
        p.programIds = Array.isArray(data.programIds) ? data.programIds : [data.programIds];
        p.programId = p.programIds[0] || '';
      } else if (data.programId !== undefined) {
        p.programId = data.programId;
        p.programIds = [data.programId];
      }
      if (data.tanggalMulai !== undefined) p.tanggalMulai = data.tanggalMulai;
      if (data.tenggatPengisian !== undefined) p.tenggatPengisian = data.tenggatPengisian;
      if (data.updlIds !== undefined) p.updlIds = data.updlIds;
      if (data.status !== undefined) p.status = data.status;
      p.updatedAt = new Date().toISOString();

      this.addAuditLog('EDIT_PERIODE', `Periode ${p.nama}`, `Perubahan konfigurasi periode ${p.kode}`);
      this.save();
      this.syncPeriodToFirestore(p);
      return p;
    }

    setPeriodStatus(id, newStatus) {
      const p = this.getPeriodById(id);
      if (!p) throw new Error('Periode tidak ditemukan.');
      const oldStatus = p.status;
      p.status = newStatus;
      p.updatedAt = new Date().toISOString();

      this.addAuditLog('STATUS_PERIODE', `Periode ${p.nama}`, `Perubahan status periode dari ${oldStatus} menjadi ${newStatus}`);
      this.save();
      this.syncPeriodToFirestore(p);
      return p;
    }

    deletePeriod(id) {
      const idx = (this.periods || []).findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Periode tidak ditemukan.');
      const p = this.periods[idx];

      const linkedResp = (this.respondents || []).filter(r => r.periodId === id);
      if (linkedResp.length > 0) {
        throw new Error(`Tidak dapat menghapus: Periode ini masih memiliki ${linkedResp.length} penugasan responden.`);
      }

      this.periods.splice(idx, 1);
      this.addAuditLog('HAPUS_PERIODE', `Periode ${p.nama}`, `Penghapusan siklus evaluasi ${p.kode}`);
      this.save();
      this.syncPeriodDeletionFromFirestore(id);
      return true;
    }

    // === Bank Butir Evaluasi Methods (Program-Scoped) ===
    getBankButirList(programId = null, activeOnly = false) {
      if (!this.bankButirList) {
        this.bankButirList = JSON.parse(JSON.stringify(window.MASTER_DATA.bankButirList || []));
      }
      let list = [...this.bankButirList];
      if (programId && programId !== 'ALL') {
        list = list.filter(b => b.programId === programId);
      }
      if (activeOnly) {
        list = list.filter(b => b.status === 'AKTIF');
      }
      return list;
    }

    getBankButirById(id) {
      if (!this.bankButirList) {
        this.bankButirList = JSON.parse(JSON.stringify(window.MASTER_DATA.bankButirList || []));
      }
      return this.bankButirList.find(b => b.id === id) || null;
    }

    getBankButirByProgram(programId) {
      return this.getBankButirList(programId);
    }

    getActiveBankButirForProgram(programId) {
      const list = this.getBankButirList(programId, true);
      return list.length > 0 ? list[0] : null;
    }

    getBankButir(bankButirId = null) {
      if (bankButirId) {
        const found = this.getBankButirById(bankButirId);
        if (found && found.sections) return found.sections;
      }
      // Backward compatibility fallback: return first active Bank Butir sections or MASTER_DATA
      if (this.bankButirList && this.bankButirList.length > 0) {
        return this.bankButirList[0].sections || window.MASTER_DATA.bankButir;
      }
      return window.MASTER_DATA.bankButir;
    }

    getAllBankButirItems(bankButirId = null, programId = null) {
      let targetBB = null;
      if (bankButirId) {
        targetBB = this.getBankButirById(bankButirId);
      } else if (programId) {
        targetBB = this.getActiveBankButirForProgram(programId) || this.getBankButirList(programId)[0];
      }
      if (!targetBB && this.bankButirList && this.bankButirList.length > 0) {
        targetBB = this.bankButirList[0];
      }

      const items = [];
      const sections = targetBB ? targetBB.sections : window.MASTER_DATA.bankButir;
      if (!sections) return items;

      Object.keys(sections).forEach(key => {
        const part = sections[key];
        if (part && Array.isArray(part.items)) {
          part.items.forEach(it => {
            items.push({
              bankButirId: targetBB ? targetBB.id : 'bb-susut-standar',
              programId: targetBB ? targetBB.programId : 'prog-pil-susut',
              partKey: key,
              partTitle: part.title || `Bagian ${key}`,
              kodeDiklat: part.kodeDiklat || '',
              partKeybe: part.keybe || '',
              ...it
            });
          });
        }
      });
      return items;
    }

    getBankButirItemById(id, bankButirId = null) {
      if (bankButirId) {
        return this.getAllBankButirItems(bankButirId).find(it => it.id === id) || null;
      }
      // Search across all catalogs
      const allCatalogs = this.getBankButirList();
      for (const cat of allCatalogs) {
        const items = this.getAllBankButirItems(cat.id);
        const found = items.find(it => it.id === id);
        if (found) return found;
      }
      return null;
    }

    addBankButir(data) {
      if (!data.programId) {
        throw new Error('Program ID wajib ditentukan untuk Bank Butir.');
      }
      const prog = this.getProgramById(data.programId);
      if (!prog) {
        throw new Error(`Program dengan ID "${data.programId}" tidak ditemukan.`);
      }
      if (!data.nama || !data.nama.trim()) {
        throw new Error('Nama Bank Butir wajib diisi.');
      }

      const id = data.id || `bb-${Date.now()}`;
      const newBB = {
        id,
        programId: data.programId,
        kode: data.kode || `BB-${(prog.kode || 'PROG').toUpperCase()}-${Date.now().toString().slice(-4)}`,
        nama: data.nama.trim(),
        deskripsi: data.deskripsi || `Bank butir instrumen untuk program ${prog.nama}`,
        versi: data.versi || '1.0',
        status: data.status || 'AKTIF',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: data.sections || {
          A: {
            code: 'A',
            title: data.initialSectionTitle ? data.initialSectionTitle.trim() : 'Modul Pembelajaran Utama',
            kodeDiklat: data.initialKodeDiklat ? data.initialKodeDiklat.trim() : '',
            keybe: data.initialKeybe ? data.initialKeybe.trim() : '',
            bobotDefault: 100,
            items: []
          }
        }
      };

      if (!this.bankButirList) this.bankButirList = [];
      this.bankButirList.push(newBB);
      this.addAuditLog('TAMBAH_BANK_BUTIR', `Bank Butir "${newBB.nama}"`, `Menambahkan katalog instrumen baru untuk program ${prog.nama}`);
      this.save();
      this.syncBankButirToFirestore(newBB);
      return newBB;
    }

    updateBankButir(id, data) {
      const bb = this.getBankButirById(id);
      if (!bb) throw new Error(`Bank Butir dengan ID "${id}" tidak ditemukan.`);

      if (data.programId && data.programId !== bb.programId) {
        const prog = this.getProgramById(data.programId);
        if (!prog) throw new Error(`Target Program ID "${data.programId}" tidak valid.`);
        bb.programId = data.programId;
      }

      if (data.nama !== undefined) bb.nama = data.nama.trim();
      if (data.kode !== undefined) bb.kode = data.kode.trim();
      if (data.deskripsi !== undefined) bb.deskripsi = data.deskripsi.trim();
      if (data.versi !== undefined) bb.versi = data.versi;
      if (data.status !== undefined) bb.status = data.status;
      if (data.sections !== undefined) bb.sections = data.sections;
      bb.updatedAt = new Date().toISOString();

      this.addAuditLog('EDIT_BANK_BUTIR', `Bank Butir "${bb.nama}"`, `Pembaruan metadata/struktur katalog instrumen`);
      this.save();
      this.syncBankButirToFirestore(bb);
      return bb;
    }

    duplicateBankButir(sourceId, targetProgramId, customName = null) {
      const source = this.getBankButirById(sourceId);
      if (!source) throw new Error(`Bank Butir sumber dengan ID "${sourceId}" tidak ditemukan.`);

      const targetProg = this.getProgramById(targetProgramId);
      if (!targetProg) throw new Error(`Program tujuan dengan ID "${targetProgramId}" tidak ditemukan.`);

      const newId = `bb-dup-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newKode = `BB-${(targetProg.kode || 'PROG').toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const newNama = customName ? customName.trim() : `${source.nama} (Salinan ${targetProg.nama})`;

      // Deep clone sections
      const clonedSections = JSON.parse(JSON.stringify(source.sections || {}));

      const newBB = {
        id: newId,
        programId: targetProgramId,
        kode: newKode,
        nama: newNama,
        deskripsi: `Hasil duplikasi dari "${source.nama}" untuk program ${targetProg.nama}`,
        versi: '1.0',
        status: 'AKTIF',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: clonedSections
      };

      if (!this.bankButirList) this.bankButirList = [];
      this.bankButirList.push(newBB);
      this.addAuditLog('DUPLIKASI_BANK_BUTIR', `Duplikasi ke "${newNama}"`, `Menduplikasi katalog dari program ${source.programId} ke program ${targetProg.nama}`);
      this.save();
      this.syncBankButirToFirestore(newBB);
      return newBB;
    }

    toggleBankButirStatus(id) {
      const bb = this.getBankButirById(id);
      if (!bb) throw new Error(`Bank Butir dengan ID "${id}" tidak ditemukan.`);
      const oldStatus = bb.status;
      bb.status = (oldStatus === 'AKTIF') ? 'NONAKTIF' : 'AKTIF';
      bb.updatedAt = new Date().toISOString();
      this.addAuditLog('STATUS_BANK_BUTIR', `Bank Butir "${bb.nama}"`, `Perubahan status dari ${oldStatus} menjadi ${bb.status}`);
      this.save();
      this.syncBankButirToFirestore(bb);
      return bb;
    }

    deleteBankButir(id) {
      const bb = this.getBankButirById(id);
      if (!bb) throw new Error(`Bank Butir dengan ID "${id}" tidak ditemukan.`);

      // Check if used in any templates
      const usedInTemplate = (this.formTemplates || []).some(t => t.bankButirId === id);
      if (usedInTemplate) {
        throw new Error(`Bank Butir "${bb.nama}" sedang digunakan oleh Formulir Evaluasi. Silakan ubah status menjadi NONAKTIF atau arsipkan.`);
      }

      const idx = this.bankButirList.findIndex(b => b.id === id);
      if (idx !== -1) {
        this.bankButirList.splice(idx, 1);
        this.addAuditLog('HAPUS_BANK_BUTIR', `Bank Butir "${bb.nama}"`, `Penghapusan katalog instrumen`);
        this.save();
        this.syncBankButirDeletionFromFirestore(id);
      }
      return true;
    }

    addBankButirItem(bankButirId, itemData) {
      const bb = this.getBankButirById(bankButirId);
      if (!bb) throw new Error(`Bank Butir dengan ID "${bankButirId}" tidak ditemukan.`);

      const id = (itemData.id || '').trim();
      if (!id) throw new Error('ID Butir wajib diisi.');

      const partKey = (itemData.partKey || 'A').trim().toUpperCase();
      if (!partKey) throw new Error('Bagian instrumen wajib diisi (misal: A, B, C).');

      // Check duplicate ID in this Bank Butir
      const allItems = this.getAllBankButirItems(bb.id);
      if (allItems.some(it => it.id.toLowerCase() === id.toLowerCase())) {
        throw new Error(`ID Butir "${id}" sudah digunakan pada katalog ini.`);
      }

      if (!bb.sections) bb.sections = {};
      if (!bb.sections[partKey]) {
        bb.sections[partKey] = {
          code: partKey,
          title: itemData.partTitle || `Bagian ${partKey}`,
          kodeDiklat: itemData.kodeDiklat || '',
          keybe: itemData.keybe || '',
          bobotDefault: 0,
          items: []
        };
      }

      const perilaku = (itemData.perilaku || '').trim();
      if (!perilaku) throw new Error('Pernyataan Butir Perilaku (Peserta) wajib diisi.');

      const cleanPerilakuAtasan = itemData.perilakuAtasan && itemData.perilakuAtasan.trim()
        ? itemData.perilakuAtasan.trim()
        : `Peserta ${perilaku.replace(/^(Saya|peserta)\s+/i, '')}`;

      const newItem = {
        id: id,
        partKey: partKey,
        no: (bb.sections[partKey].items ? bb.sections[partKey].items.length + 1 : 1),
        kodeDiklat: itemData.kodeDiklat ? itemData.kodeDiklat.trim() : (bb.sections[partKey].kodeDiklat || ''),
        keybe: itemData.keybe ? itemData.keybe.trim() : (bb.sections[partKey].keybe || ''),
        perilaku: perilaku,
        perilakuAtasan: cleanPerilakuAtasan,
        contohBukti: (itemData.contohBukti || '').trim(),
        kompetensi: (itemData.kompetensi || '').trim()
      };

      if (!Array.isArray(bb.sections[partKey].items)) {
        bb.sections[partKey].items = [];
      }
      bb.sections[partKey].items.push(newItem);
      bb.updatedAt = new Date().toISOString();

      this.addAuditLog('TAMBAH_BUTIR_PERILAKU', `Butir #${newItem.id}`, `Menambahkan butir perilaku baru pada ${bb.nama}`);
      this.save();
      this.syncBankButirToFirestore(bb);
      return newItem;
    }

    updateBankButirItem(originalId, data, bankButirId = null) {
      let targetBB = null;
      let targetItem = null;
      let currentPartKey = null;

      const catalogs = bankButirId ? [this.getBankButirById(bankButirId)].filter(Boolean) : (this.bankButirList || []);

      for (const bb of catalogs) {
        if (!bb || !bb.sections) continue;
        for (const key of Object.keys(bb.sections)) {
          const part = bb.sections[key];
          if (part && Array.isArray(part.items)) {
            const idx = part.items.findIndex(x => x.id === originalId);
            if (idx !== -1) {
              targetBB = bb;
              targetItem = part.items[idx];
              currentPartKey = key;
              break;
            }
          }
        }
        if (targetItem) break;
      }

      if (!targetItem || !targetBB) {
        throw new Error(`Butir dengan ID "${originalId}" tidak ditemukan.`);
      }

      // 1. If ID is changed, check for duplicate
      const newId = (data.id || '').trim();
      if (newId && newId !== originalId) {
        const allItems = this.getAllBankButirItems(targetBB.id);
        if (allItems.some(it => it.id !== originalId && it.id.toLowerCase() === newId.toLowerCase())) {
          throw new Error(`ID Butir "${newId}" sudah digunakan oleh butir lain.`);
        }
        targetItem.id = newId;
      }

      // 2. If Bagian (partKey) is changed
      const targetPartKey = (data.partKey || currentPartKey).trim().toUpperCase();
      if (targetPartKey && targetPartKey !== currentPartKey) {
        // Remove from current section
        const currItems = targetBB.sections[currentPartKey].items;
        const oldIdx = currItems.findIndex(x => x === targetItem);
        if (oldIdx !== -1) currItems.splice(oldIdx, 1);

        // Ensure new section exists
        if (!targetBB.sections[targetPartKey]) {
          targetBB.sections[targetPartKey] = {
            code: targetPartKey,
            title: data.partTitle || `Bagian ${targetPartKey}`,
            kodeDiklat: data.kodeDiklat || '',
            keybe: data.keybe || '',
            bobotDefault: 0,
            items: []
          };
        }
        if (!Array.isArray(targetBB.sections[targetPartKey].items)) {
          targetBB.sections[targetPartKey].items = [];
        }
        targetBB.sections[targetPartKey].items.push(targetItem);
      }

      // 3. Update attributes
      if (data.kodeDiklat !== undefined) targetItem.kodeDiklat = data.kodeDiklat.trim();
      if (data.keybe !== undefined) targetItem.keybe = data.keybe.trim();
      if (data.perilaku !== undefined) targetItem.perilaku = data.perilaku.trim();
      if (data.perilakuAtasan !== undefined) targetItem.perilakuAtasan = data.perilakuAtasan.trim();
      if (data.contohBukti !== undefined) targetItem.contohBukti = data.contohBukti.trim();
      if (data.kompetensi !== undefined) targetItem.kompetensi = data.kompetensi.trim();

      targetBB.updatedAt = new Date().toISOString();
      this.addAuditLog('EDIT_BUTIR_PERILAKU', `Butir #${targetItem.id}`, `Pembaruan butir perilaku pada ${targetBB.nama}`);
      this.save();
      this.syncBankButirToFirestore(targetBB);
      return targetItem;
    }

    deleteBankButirItem(id, bankButirId = null) {
      let targetBB = null;
      let removed = false;

      const catalogs = bankButirId ? [this.getBankButirById(bankButirId)].filter(Boolean) : (this.bankButirList || []);

      for (const bb of catalogs) {
        if (!bb || !bb.sections) continue;
        for (const key of Object.keys(bb.sections)) {
          const part = bb.sections[key];
          if (part && Array.isArray(part.items)) {
            const idx = part.items.findIndex(x => x.id === id);
            if (idx !== -1) {
              part.items.splice(idx, 1);
              targetBB = bb;
              removed = true;
              break;
            }
          }
        }
        if (removed) break;
      }

      if (!removed || !targetBB) {
        throw new Error(`Butir dengan ID "${id}" tidak ditemukan.`);
      }

      targetBB.updatedAt = new Date().toISOString();
      this.addAuditLog('HAPUS_BUTIR_PERILAKU', `Butir #${id}`, `Menghapus butir perilaku dari ${targetBB.nama}`);
      this.save();
      this.syncBankButirToFirestore(targetBB);
      return true;
    }

    // === Form Builder Templates Methods ===
    getFormTemplates(periodId = null, role = null) {
      if (!this.formTemplates) this.formTemplates = [...(window.MASTER_DATA.formTemplates || [])];
      let list = this.formTemplates;
      if (periodId) list = list.filter(t => t.periodId === periodId);
      if (role) list = list.filter(t => t.targetRole === role);
      return list;
    }

    getFormTemplateById(id) {
      return (this.formTemplates || []).find(t => t.id === id) || null;
    }

    saveFormTemplate(tplData) {
      // Validate Bobot Total 100%
      if (tplData.bobotBagian) {
        const sum = (Number(tplData.bobotBagian.A) || 0) + (Number(tplData.bobotBagian.B) || 0) + (Number(tplData.bobotBagian.C) || 0);
        if (sum !== 100) {
          throw new Error(`Total bobot bagian harus tepat 100%. Saat ini: ${sum}%.`);
        }
      }

      // Validasi isolasi Bank Butir dan Program
      if (tplData.bankButirId) {
        const bb = this.getBankButirById(tplData.bankButirId);
        if (bb && bb.programId !== tplData.programId) {
          throw new Error(`Bank Butir "${bb.nama}" tidak sesuai dengan Program Pelatihan yang dipilih. Bank Butir harus berasal dari program yang sama.`);
        }
      } else if (tplData.programId) {
        const activeBB = this.getActiveBankButirForProgram(tplData.programId);
        if (activeBB) {
          tplData.bankButirId = activeBB.id;
        }
      }

      let tpl = this.getFormTemplateById(tplData.id);
      if (tpl) {
        // Version bump if already published
        if (tpl.status === 'PUBLISHED') {
          const currVer = parseFloat(tpl.versi || '1.0');
          tpl.versi = (currVer + 0.1).toFixed(1);
        }
        Object.assign(tpl, tplData, { updatedAt: new Date().toISOString() });
        this.addAuditLog('EDIT_FORM_TEMPLATE', `Template ${tpl.judul}`, `Pembaruan instrumen form versi ${tpl.versi}`);
      } else {
        tpl = {
          id: tplData.id || `form-tpl-${Date.now()}`,
          programId: tplData.programId || 'prog-pil-susut',
          bankButirId: tplData.bankButirId || 'bb-susut-standar',
          periodId: tplData.periodId || 'period-2026-s1',
          targetRole: tplData.targetRole || 'peserta',
          judul: tplData.judul || 'Formulir Evaluasi Level 3',
          versi: '1.0',
          status: tplData.status || 'DRAFT',
          petunjuk: tplData.petunjuk || '',
          bobotBagian: tplData.bobotBagian || { A: 40, B: 35, C: 25 },
          itemIds: tplData.itemIds || ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3'],
          createdAt: new Date().toISOString()
        };
        this.formTemplates.push(tpl);
        this.addAuditLog('TAMBAH_FORM_TEMPLATE', `Template ${tpl.judul}`, `Pembuatan formulir instrumen baru role ${tpl.targetRole}`);
      }

      this.save();
      this.syncTemplateToFirestore(tpl);
      return tpl;
    }

    publishFormTemplate(id) {
      const tpl = this.getFormTemplateById(id);
      if (!tpl) throw new Error('Template form tidak ditemukan.');
      tpl.status = 'PUBLISHED';
      tpl.publishedAt = new Date().toISOString();
      tpl.updatedAt = new Date().toISOString();

      this.addAuditLog('PUBLISH_FORM', `Template ${tpl.judul}`, `Penerbitan resmi formulir instrumen versi ${tpl.versi} untuk evaluasi`);
      this.save();
      this.syncTemplateToFirestore(tpl);
      return tpl;
    }

    // === Audit Logs Methods ===
    getAuditLogs() {
      if (!this.auditLogs) this.auditLogs = [...(window.MASTER_DATA.auditLogs || [])];
      return [...this.auditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    addAuditLog(action, target, details, user = null) {
      const activeUser = window.authManager && window.authManager.getUser() ? window.authManager.getUser().nama : 'Administrator';
      const logEntry = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        user: user || activeUser,
        action,
        target,
        details
      };

      if (!this.auditLogs) this.auditLogs = [];
      this.auditLogs.unshift(logEntry);
      if (this.auditLogs.length > 200) this.auditLogs.pop(); // Keep last 200 logs

      this.syncAuditLogToFirestore(logEntry);
      return logEntry;
    }

    getDb() {
      if (window.firebaseDb) return window.firebaseDb;
      if (window.firebase && typeof window.firebase.firestore === 'function') {
        try {
          window.firebaseDb = window.firebase.firestore();
          return window.firebaseDb;
        } catch (_) { }
      }
      return window.db || null;
    }

    broadcastSyncStatus(status, label = null) {
      try {
        window.dispatchEvent(new CustomEvent('firestore:sync-status', { detail: { status, label } }));
        window.dispatchEvent(new CustomEvent('mariadb:sync-status', { detail: { status, label } }));
      } catch (_) { }
    }

    // === Cloud Firestore Synchronizer ===
    initFirestoreSync() {
      const checkAndListen = () => {
        const db = this.getDb();
        if (!db) {
          setTimeout(checkAndListen, 400);
          return;
        }

        // 1. Sinkronisasi real-time koleksi respondents
        db.collection('respondents').onSnapshot(snapshot => {
          const list = [];
          if (snapshot && !snapshot.empty) {
            snapshot.forEach(doc => {
              const d = doc.data();
              // Filter keluar data dummy responden ID 1..12 jika tersisa
              if (d && !String(d.id).match(/^[1-9]$|^10$|^11$|^12$/) && !DUMMY_NIPS.has(String(d.nip || '').toLowerCase())) {
                list.push(d);
              }
            });
            list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
          }
          this.respondents = list;
          localStorage.setItem(STORAGE_KEY_RESP, JSON.stringify(this.respondents));
          this.notify();
          this.broadcastSyncStatus('synced');
        }, err => {
          console.warn('[Firestore] Realtime error respondents:', err.message);
        });

        // 2. Sinkronisasi real-time koleksi evaluations
        db.collection('evaluations').onSnapshot(snapshot => {
          const evals = {};
          if (snapshot && !snapshot.empty) {
            snapshot.forEach(doc => {
              if (!String(doc.id).match(/^[1-9]$|^10$/)) {
                evals[doc.id] = doc.data();
              }
            });
          }
          this.evaluations = evals;
          localStorage.setItem(STORAGE_KEY_EVALS, JSON.stringify(this.evaluations));
          this.notify();
          this.broadcastSyncStatus('synced');
        }, err => {
          console.warn('[Firestore] Realtime error evaluations:', err.message);
        });

        // 3. Sinkronisasi real-time koleksi updls
        db.collection('updls').onSnapshot(snapshot => {
          const list = [];
          if (snapshot && !snapshot.empty) {
            snapshot.forEach(doc => list.push(doc.data()));
          }
          this.updls = list;
          localStorage.setItem(STORAGE_KEY_UPDLS, JSON.stringify(this.updls));
          this.notify();
        }, err => console.warn('[Firestore] Realtime error updls:', err.message));

        // 4. Sinkronisasi real-time koleksi units
        db.collection('units').onSnapshot(snapshot => {
          const list = [];
          if (snapshot && !snapshot.empty) {
            snapshot.forEach(doc => list.push(doc.data()));
          }
          this.units = list;
          localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(this.units));
          this.notify();
        }, err => console.warn('[Firestore] Realtime error units:', err.message));

        // 5. Sinkronisasi real-time koleksi programs
        db.collection('programs').onSnapshot(snapshot => {
          const list = [];
          if (snapshot && !snapshot.empty) {
            snapshot.forEach(doc => list.push(doc.data()));
          }
          this.programs = list;
          localStorage.setItem(STORAGE_KEY_PROGRAMS, JSON.stringify(this.programs));
          this.notify();
        }, err => console.warn('[Firestore] Realtime error programs:', err.message));

        // 6. Sinkronisasi real-time koleksi periods
        db.collection('periods').onSnapshot(snapshot => {
          const list = [];
          if (snapshot && !snapshot.empty) {
            snapshot.forEach(doc => list.push(doc.data()));
          }
          this.periods = list;
          localStorage.setItem(STORAGE_KEY_PERIODS, JSON.stringify(this.periods));
          this.notify();
        }, err => console.warn('[Firestore] Realtime error periods:', err.message));

        // 7. Sinkronisasi real-time koleksi form_templates
        db.collection('form_templates').onSnapshot(snapshot => {
          const list = [];
          if (snapshot && !snapshot.empty) {
            snapshot.forEach(doc => list.push(doc.data()));
          }
          this.formTemplates = list;
          localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(this.formTemplates));
          this.notify();
        }, err => console.warn('[Firestore] Realtime error form_templates:', err.message));

        // 8. Sinkronisasi real-time koleksi users
        db.collection('users').onSnapshot(snapshot => {
          let list = [];
          if (snapshot && !snapshot.empty) {
            snapshot.forEach(doc => {
              const u = doc.data();
              if (u && u.nip && u.id !== 'usr-admin-1' && u.id !== 'usr-kord-eks') {
                list.push(u);
              }
            });
          }
          // Pastikan akun Developer kmlafdz dan Admin Pusat adminpusat selalu ada
          let devUser = list.find(u => (u.nip || '').toLowerCase() === 'kmlafdz');
          if (!devUser) {
            devUser = {
              id: 'usr-dev-kmlafdz',
              nip: 'kmlafdz',
              nama: 'Developer Utama (kmlafdz)',
              email: 'kmlafdz@pln.co.id',
              jabatan: 'System Developer & Super Admin',
              updlId: '',
              unitId: '',
              unitName: 'PLN Pusat / Developer',
              role: 'developer',
              status: 'AKTIF',
              password: '1234'
            };
            list.unshift(devUser);
          } else {
            devUser.role = 'developer';
            devUser.password = '1234';
          }
          let adminPusatUser = list.find(u => (u.nip || '').toLowerCase() === 'adminpusat');
          if (!adminPusatUser) {
            adminPusatUser = {
              id: 'usr-admin-pusat',
              nip: 'adminpusat',
              nama: 'Administrator Pusat PLN Corpu',
              email: 'adminpusat@pln.co.id',
              jabatan: 'Super Admin Pengendali Evaluasi Nasional',
              updlId: '',
              unitId: '',
              unitName: 'PLN Pusat',
              role: 'admin',
              isAdminPusat: true,
              status: 'AKTIF',
              password: 'adminpusat123'
            };
            list.push(adminPusatUser);
          } else {
            adminPusatUser.role = 'admin';
            adminPusatUser.isAdminPusat = true;
            adminPusatUser.password = 'adminpusat123';
          }
          this.users = list;
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
          this.syncParticipantsToRespondents();
          this.notify();
        }, err => console.warn('[Firestore] Realtime error users:', err.message));

        // 9. Sinkronisasi real-time koleksi bank_butir
        db.collection('bank_butir').onSnapshot(snapshot => {
          if (!snapshot.empty) {
            const list = [];
            snapshot.forEach(doc => list.push(doc.data()));
            this.bankButirList = list;
            localStorage.setItem(STORAGE_KEY_BANK_BUTIR, JSON.stringify(this.bankButirList));
            this.notify();
          }
        }, err => console.warn('[Firestore] Realtime error bank_butir:', err.message));

        // 10. Sinkronisasi real-time koleksi settings
        db.collection('settings').doc('system_config').onSnapshot(doc => {
          if (doc.exists) {
            const data = doc.data();
            this.settings = { ...this.settings, ...data };
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
            this.notify();
          }
        }, err => console.warn('[Firestore] Realtime error settings:', err.message));

        // Auto-seed awal jika Firestore masih kosong
        this.seedInitialDataIfEmpty(db);
        this.broadcastSyncStatus('synced');
      };

      checkAndListen();
    }

    seedInitialDataIfEmpty(db) {
      if (!db || typeof db.collection !== 'function') return;
      // Jangan pernah melakukan seeding data dummy ke database!
      // Hanya pastikan akun Developer (kmlafdz) dan Admin Pusat (adminpusat) tersedia di Firestore
      const devUser = (this.users || []).find(u => (u.nip || '').toLowerCase() === 'kmlafdz');
      if (devUser) {
        this.syncUserToFirestore(devUser);
      }
      const adminPusatUser = (this.users || []).find(u => (u.nip || '').toLowerCase() === 'adminpusat');
      if (adminPusatUser) {
        this.syncUserToFirestore(adminPusatUser);
      }
    }

    cleanFirestorePayload(data) {
      if (!data) return {};
      try {
        return JSON.parse(JSON.stringify(data, (key, value) => {
          return value === undefined ? null : value;
        }));
      } catch (e) {
        return data;
      }
    }

    
    syncRespondentDeletionFromFirestore(respondentId) {
      if (respondentId) {
        fetch(`/api/respondents/${encodeURIComponent(respondentId)}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(false)
        }).then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal hapus responden:', err));
      }
      const db = this.getDb();
      if (db && respondentId) {
        db.collection('respondents').doc(String(respondentId)).delete()
          .then(() => {
            this.broadcastSyncStatus('synced');
          })
          .catch(err => console.warn(`[Firestore Cloud] Gagal hapus Responden ${respondentId}:`, err));
        db.collection('evaluations').doc(String(respondentId)).delete().catch(() => {});
      }
    }

    syncRespondentToFirestore(resp) {
      if (resp && resp.id) {
        fetch('/api/respondents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cleanFirestorePayload(resp))
        }).then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal simpan peserta:', err));
      }

      const db = this.getDb();
      if (db && resp && resp.id) {
        const payload = this.cleanFirestorePayload(resp);
        db.collection('respondents').doc(String(resp.id)).set(payload, { merge: true })
          .then(() => {
            console.log(`[Firestore Cloud] Data peserta #${resp.id} (${resp.nama}) tersimpan di database.`);
            this.broadcastSyncStatus('synced');
          })
          .catch(err => {
            console.error(`[Firestore Cloud] Gagal menyimpan peserta #${resp.id}:`, err);
            this.broadcastSyncStatus('error');
          });
      }
    }

    syncEvaluationToFirestore(respondentId) {
      if (respondentId) {
        const ev = this.evaluations[String(respondentId)];
        if (ev) {
          fetch('/api/evaluations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ respondentId: String(respondentId), ...this.cleanFirestorePayload(ev) })
          }).then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
            .catch(err => console.warn('[MariaDB Sync] Gagal simpan evaluasi:', err));
        }
      }

      const db = this.getDb();
      if (db && respondentId) {
        const ev = this.evaluations[String(respondentId)];
        if (ev) {
          const payload = this.cleanFirestorePayload(ev);
          db.collection('evaluations').doc(String(respondentId)).set(payload, { merge: true })
            .then(() => {
              console.log(`[Firestore Cloud] Evaluasi peserta #${respondentId} tersimpan di database.`);
              this.broadcastSyncStatus('synced');
            })
            .catch(err => {
              console.error(`[Firestore Cloud] Gagal menyimpan evaluasi #${respondentId}:`, err);
              this.broadcastSyncStatus('error');
            });
        }
      }
    }

    syncUpdlToFirestore(updl) {
      if (updl && updl.id) {
        fetch('/api/updls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cleanFirestorePayload(updl))
        }).then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal simpan UPDL:', err));
      }

      const db = this.getDb();
      if (db && updl && updl.id) {
        const payload = this.cleanFirestorePayload(updl);
        db.collection('updls').doc(String(updl.id)).set(payload, { merge: true })
          .then(() => this.broadcastSyncStatus('synced'))
          .catch(err => console.error(`[Firestore Cloud] Gagal menyimpan UPDL ${updl.id}:`, err));
      }
    }

    syncUpdlDeletionFromFirestore(updlId) {
      if (updlId) {
        fetch(`/api/updls/${encodeURIComponent(updlId)}`, { method: 'DELETE' })
          .then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal hapus UPDL:', err));
      }

      const db = this.getDb();
      if (db && updlId) {
        db.collection('updls').doc(String(updlId)).delete()
          .then(() => this.broadcastSyncStatus('synced'))
          .catch(err => console.warn(`[Firestore Cloud] Gagal hapus UPDL ${updlId}:`, err));
      }
    }

    syncUnitToFirestore(unit) {
      if (unit && unit.id) {
        fetch('/api/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cleanFirestorePayload(unit))
        }).then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal simpan Unit:', err));
      }

      const db = this.getDb();
      if (db && unit && unit.id) {
        const payload = this.cleanFirestorePayload(unit);
        db.collection('units').doc(String(unit.id)).set(payload, { merge: true })
          .then(() => this.broadcastSyncStatus('synced'))
          .catch(err => console.error(`[Firestore Cloud] Gagal menyimpan Unit ${unit.id}:`, err));
      }
    }

    syncUnitDeletionFromFirestore(unitId) {
      if (unitId) {
        try {
          fetch(`/api/units/${encodeURIComponent(unitId)}`, { method: 'DELETE' })
            .then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
            .catch(err => console.warn('[MariaDB Sync] Gagal hapus Unit:', err));
        } catch (_) { }
      }

      const db = this.getDb();
      if (db && unitId) {
        db.collection('units').doc(String(unitId)).delete()
          .then(() => this.broadcastSyncStatus('synced'))
          .catch(err => console.warn(`[Firestore Cloud] Gagal hapus Unit ${unitId}:`, err));
      }
    }

    syncProgramToFirestore(prog) {
      if (prog && prog.id) {
        fetch('/api/programs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cleanFirestorePayload(prog))
        }).then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal simpan Program:', err));
      }

      const db = this.getDb();
      if (db && prog && prog.id) {
        const payload = this.cleanFirestorePayload(prog);
        db.collection('programs').doc(String(prog.id)).set(payload, { merge: true })
          .then(() => this.broadcastSyncStatus('synced'))
          .catch(err => console.error(`[Firestore Cloud] Gagal menyimpan Program ${prog.id}:`, err));
      }
    }

    syncProgramDeletionFromFirestore(progId) {
      if (progId) {
        fetch(`/api/programs/${encodeURIComponent(progId)}`, { method: 'DELETE' })
          .then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal hapus Program:', err));
      }

      const db = this.getDb();
      if (db && progId) {
        db.collection('programs').doc(String(progId)).delete()
          .then(() => this.broadcastSyncStatus('synced'))
          .catch(err => console.warn(`[Firestore Cloud] Gagal hapus Program ${progId}:`, err));
      }
    }

    syncPeriodToFirestore(period) {
      if (period && period.id) {
        fetch('/api/periods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cleanFirestorePayload(period))
        }).then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal simpan Periode:', err));
      }

      const db = this.getDb();
      if (db && period && period.id) {
        const payload = this.cleanFirestorePayload(period);
        db.collection('periods').doc(String(period.id)).set(payload, { merge: true })
          .then(() => this.broadcastSyncStatus('synced'))
          .catch(err => console.error(`[Firestore Cloud] Gagal menyimpan Periode ${period.id}:`, err));
      }
    }

    syncPeriodDeletionFromFirestore(periodId) {
      if (periodId) {
        fetch(`/api/periods/${encodeURIComponent(periodId)}`, { method: 'DELETE' })
          .then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal hapus Periode:', err));
      }

      const db = this.getDb();
      if (db && periodId) {
        db.collection('periods').doc(String(periodId)).delete()
          .then(() => this.broadcastSyncStatus('synced'))
          .catch(err => console.warn(`[Firestore Cloud] Gagal hapus Periode ${periodId}:`, err));
      }
    }

    syncTemplateToFirestore(tpl) {
      if (tpl && tpl.id) {
        fetch('/api/form_templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cleanFirestorePayload(tpl))
        }).then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal simpan Template:', err));
      }

      const db = this.getDb();
      if (db && tpl && tpl.id) {
        const payload = this.cleanFirestorePayload(tpl);
        db.collection('form_templates').doc(String(tpl.id)).set(payload, { merge: true })
          .then(() => this.broadcastSyncStatus('synced'))
          .catch(err => console.error(`[Firestore Cloud] Gagal menyimpan Template ${tpl.id}:`, err));
      }
    }

    syncTemplateDeletionFromFirestore(tplId) {
      if (tplId) {
        fetch(`/api/form_templates/${encodeURIComponent(tplId)}`, { method: 'DELETE' })
          .then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal hapus Template:', err));
      }

      const db = this.getDb();
      if (db && tplId) {
        db.collection('form_templates').doc(String(tplId)).delete()
          .then(() => this.broadcastSyncStatus('synced'))
          .catch(err => console.warn(`[Firestore Cloud] Gagal hapus Template ${tplId}:`, err));
      }
    }

    syncUserToFirestore(usr) {
      if (usr && usr.id) {
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cleanFirestorePayload(usr))
        }).then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal simpan User:', err));
      }

      const db = this.getDb();
      if (db && usr && usr.id) {
        const payload = this.cleanFirestorePayload(usr);
        db.collection('users').doc(String(usr.id)).set(payload, { merge: true })
          .then(() => this.broadcastSyncStatus('synced'))
          .catch(err => console.error(`[Firestore Cloud] Gagal menyimpan User ${usr.id}:`, err));
      }
    }

    syncUserDeletionFromFirestore(userId, userNip = null) {
      if (userId) {
        fetch(`/api/users/${encodeURIComponent(userId)}`, { method: 'DELETE' })
          .then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal hapus User:', err));
      }

      const db = this.getDb();
      if (db && userId) {
        db.collection('users').doc(String(userId)).delete()
          .then(() => {
            console.log(`[Firestore Cloud] Dokumen user #${userId} berhasil dihapus dari cloud database.`);
            this.broadcastSyncStatus('synced');
          })
          .catch(err => console.warn(`[Firestore Cloud] Gagal hapus User ${userId}:`, err));

        if (userNip && typeof db.collection === 'function') {
          try {
            const colRef = db.collection('users');
            if (colRef && typeof colRef.where === 'function') {
              colRef.where('nip', '==', String(userNip).trim()).get()
                .then(snap => {
                  if (snap && !snap.empty) {
                    snap.forEach(d => {
                      if (d && d.id !== String(userId) && d.ref && typeof d.ref.delete === 'function') {
                        d.ref.delete();
                      }
                    });
                  }
                })
                .catch(() => {});
            }
          } catch (_) {}
        }
      }
    }

    syncAuditLogToFirestore(log) {
      if (log && log.id) {
        fetch('/api/audit_logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cleanFirestorePayload(log))
        }).catch(err => console.warn('[MariaDB Sync] Gagal simpan Audit Log:', err));
      }

      const db = this.getDb();
      if (db && log && log.id) {
        const payload = this.cleanFirestorePayload(log);
        db.collection('audit_logs').doc(String(log.id)).set(payload, { merge: true })
          .catch(err => console.error(`[Firestore Cloud] Gagal menyimpan Audit Log ${log.id}:`, err));
      }
    }

    syncBankButirToFirestore(bb) {
      if (bb && bb.id) {
        fetch('/api/bank_butir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cleanFirestorePayload(bb))
        }).then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal simpan Bank Butir:', err));
      }

      const db = this.getDb();
      if (db && bb && bb.id) {
        const payload = this.cleanFirestorePayload(bb);
        db.collection('bank_butir').doc(String(bb.id)).set(payload, { merge: true })
          .then(() => this.broadcastSyncStatus('synced'))
          .catch(err => console.error(`[Firestore Cloud] Gagal menyimpan Bank Butir ${bb.id}:`, err));
      }
    }

    syncBankButirDeletionFromFirestore(bbId) {
      if (bbId) {
        fetch(`/api/bank_butir/${encodeURIComponent(bbId)}`, { method: 'DELETE' })
          .then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal hapus Bank Butir:', err));
      }

      const db = this.getDb();
      if (db && bbId) {
        db.collection('bank_butir').doc(String(bbId)).delete()
          .then(() => {
            console.log(`[Firestore Cloud] Bank Butir #${bbId} berhasil dihapus dari cloud database.`);
            this.broadcastSyncStatus('synced');
          })
          .catch(err => console.warn(`[Firestore Cloud] Gagal hapus Bank Butir ${bbId}:`, err));
      }
    }

    syncSettingsToFirestore(settings) {
      if (settings) {
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cleanFirestorePayload(settings))
        }).then(() => this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3'))
          .catch(err => console.warn('[MariaDB Sync] Gagal simpan Pengaturan:', err));
      }

      const db = this.getDb();
      if (db && settings) {
        const payload = this.cleanFirestorePayload(settings);
        db.collection('settings').doc('system_config').set(payload, { merge: true })
          .then(() => {
            console.log('[Firestore Cloud] Pengaturan sistem tersimpan di cloud database.');
            this.broadcastSyncStatus('synced');
          })
          .catch(err => console.error('[Firestore Cloud] Gagal menyimpan pengaturan:', err));
      }
    }


    // Backward-compatible aliases for MariaDB calls
    syncRespondentToMariaDB(r) { return this.syncRespondentToFirestore(r); }
    syncRespondentDeletionFromMariaDB(id) { return this.syncRespondentDeletionFromFirestore(id); }
    syncEvaluationToMariaDB(id) { return this.syncEvaluationToFirestore(id); }
    syncUpdlToMariaDB(u) { return this.syncUpdlToFirestore(u); }
    syncUpdlDeletionFromMariaDB(id) { return this.syncUpdlDeletionFromFirestore(id); }
    syncUnitToMariaDB(u) { return this.syncUnitToFirestore(u); }
    syncUnitDeletionFromMariaDB(id) { return this.syncUnitDeletionFromFirestore(id); }
    syncProgramToMariaDB(p) { return this.syncProgramToFirestore(p); }
    syncProgramDeletionFromMariaDB(id) { return this.syncProgramDeletionFromFirestore(id); }
    syncPeriodToMariaDB(p) { return this.syncPeriodToFirestore(p); }
    syncPeriodDeletionFromMariaDB(id) { return this.syncPeriodDeletionFromFirestore(id); }
    syncTemplateToMariaDB(t) { return this.syncTemplateToFirestore(t); }
    syncTemplateDeletionFromMariaDB(id) { return this.syncTemplateDeletionFromFirestore(id); }
    syncUserToMariaDB(u) { return this.syncUserToFirestore(u); }
    syncUserDeletionFromMariaDB(id, nip) { return this.syncUserDeletionFromFirestore(id, nip); }
    syncAuditLogToMariaDB(l) { return this.syncAuditLogToFirestore(l); }
    syncBankButirToMariaDB(b) { return this.syncBankButirToFirestore(b); }
    syncBankButirDeletionFromMariaDB(id) { return this.syncBankButirDeletionFromFirestore(id); }
    syncSettingsToMariaDB(s) { return this.syncSettingsToFirestore(s); }


    // === MariaDB Synchronizer (Server KemzKun Server - Database: pln_pil_3) ===
    async initMariaDBSync() {
      const fetchAllFromMariaDB = async () => {
        try {
          const authHeaders = this.getAuthHeaders(false);
          // Hanya sync jika pengguna telah login memiliki token JWT
          if (!authHeaders['Authorization']) {
            return;
          }
          const res = await fetch('/api/sync/all', { headers: authHeaders });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              const d = json.data;
              const payloadStr = JSON.stringify(d);
              if (this._lastSyncPayloadStr === payloadStr) {
                this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3');
                return true;
              }
              this._lastSyncPayloadStr = payloadStr;

              if (Array.isArray(d.respondents)) {
                this.respondents = d.respondents;
                localStorage.setItem(STORAGE_KEY_RESP, JSON.stringify(this.respondents));
              }
              if (d.evaluations && typeof d.evaluations === 'object') {
                this.evaluations = d.evaluations;
                localStorage.setItem(STORAGE_KEY_EVALS, JSON.stringify(this.evaluations));
              }
              if (Array.isArray(d.updls)) {
                this.updls = d.updls;
                localStorage.setItem(STORAGE_KEY_UPDLS, JSON.stringify(this.updls));
              }
              if (Array.isArray(d.units)) {
                this.units = d.units;
                localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(this.units));
              }
              if (Array.isArray(d.programs)) {
                this.programs = d.programs;
                localStorage.setItem(STORAGE_KEY_PROGRAMS, JSON.stringify(this.programs));
              }
              if (Array.isArray(d.periods)) {
                this.periods = d.periods;
                localStorage.setItem(STORAGE_KEY_PERIODS, JSON.stringify(this.periods));
              }
              if (Array.isArray(d.form_templates)) {
                this.formTemplates = d.form_templates;
                localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(this.formTemplates));
              }
              if (Array.isArray(d.users)) {
                this.users = d.users;
                localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
                this.syncParticipantsToRespondents();
              }
              if (d.settings && typeof d.settings === 'object') {
                this.settings = { ...this.settings, ...d.settings };
                localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
              }
              if (Array.isArray(d.bank_butir)) {
                this.bankButirList = d.bank_butir;
                localStorage.setItem(STORAGE_KEY_BANK_BUTIR, JSON.stringify(this.bankButirList));
              }
              this.notify();
              this.broadcastSyncStatus('synced', 'MariaDB: pln_pil_3');
              return true;
            }
          }
        } catch (err) {
          console.warn('[MariaDB Sync] Sync all error:', err.message);
        }
        return false;
      };

      // Inisialisasi data awal
      await fetchAllFromMariaDB();

      // Polling periodik (setiap 10 detik) untuk sinkronisasi data antar client tanpa reload
      setInterval(() => {
        fetchAllFromMariaDB();
      }, 10000);
    }

    cleanPayload(data) {
      if (!data) return {};
      try {
        return JSON.parse(JSON.stringify(data, (key, value) => {
          return value === undefined ? null : value;
        }));
      } catch (e) {
        return data;
      }
    }

    getAuthHeaders(includeContentType = true) {
      const headers = {};
      if (includeContentType) {
        headers['Content-Type'] = 'application/json';
      }
      const token = localStorage.getItem('pln_eval3_jwt_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return headers;
    }
    getPesertaProgress(respondentId) {
      const r = this.respondents.find(x => x.id === Number(respondentId));
      if (!r) return { total: 0, filled: 0, percentage: 0, filesCount: 0, isComplete: false };

      const ev = this.getEvaluation(respondentId);
      const scores = ev.peserta?.scores || {};
      const files = ev.peserta?.files || {};

      let totalItems = 0;
      let filledItems = 0;
      let filesCount = 0;

      r.modules.forEach(modCode => {
        const mod = window.MASTER_DATA.bankButir[modCode];
        if (mod) {
          mod.items.forEach(it => {
            totalItems++;
            if (scores[it.id] !== undefined && scores[it.id] !== null) {
              filledItems++;
            }
            if (files[it.id]) {
              filesCount++;
            }
          });
        }
      });

      const pct = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;
      const isComplete = totalItems > 0 && filledItems === totalItems;

      return {
        total: totalItems,
        filled: filledItems,
        percentage: pct,
        filesCount: filesCount,
        isComplete: isComplete,
        status: ev.peserta?.status || 'BELUM'
      };
    }

    resetToDefault() {
      localStorage.removeItem(STORAGE_KEY_RESP);
      localStorage.removeItem(STORAGE_KEY_EVALS);
      localStorage.removeItem(STORAGE_KEY_STATE);
      localStorage.removeItem(STORAGE_KEY_UPDLS);
      localStorage.removeItem(STORAGE_KEY_UNITS);
      localStorage.removeItem(STORAGE_KEY_PROGRAMS);
      localStorage.removeItem(STORAGE_KEY_PERIODS);
      localStorage.removeItem(STORAGE_KEY_TEMPLATES);
      localStorage.removeItem(STORAGE_KEY_AUDIT);
      localStorage.removeItem(STORAGE_KEY_USERS);
      localStorage.removeItem(STORAGE_KEY_BANK_BUTIR);
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
      this.init();
      this.notify();
    }

    // ===== Pengaturan Laporan =====
    getSettings() {
      return this.settings;
    }

    updateSettings(patch) {
      const p = patch || {};
      this.settings = {
        ...this.settings,
        ...p,
        target: { ...(this.settings.target || {}), ...(p.target || {}) },
        bobot: { ...(this.settings.bobot || { peserta: 30, atasan: 50, koordinator: 20 }), ...(p.bobot || {}) },
        penandatangan: {
          internal: { ...(this.settings.penandatangan?.internal || {}), ...(p.penandatangan?.internal || {}) },
          eksternal: { ...(this.settings.penandatangan?.eksternal || {}), ...(p.penandatangan?.eksternal || {}) },
          mengetahui: { ...(this.settings.penandatangan?.mengetahui || {}), ...(p.penandatangan?.mengetahui || {}) }
        }
      };
      this.save();
      this.syncSettingsToFirestore(this.settings);
    }

    // ===== Cadangan & Pemulihan Data =====
    exportBackup() {
      return {
        app: 'pln-eval3',
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          respondents: this.respondents,
          evaluations: this.evaluations,
          updls: this.updls,
          units: this.units,
          programs: this.programs,
          periods: this.periods,
          formTemplates: this.formTemplates,
          auditLogs: this.auditLogs,
          users: this.users,
          bankButirList: this.bankButirList,
          settings: this.settings
        }
      };
    }

    importBackup(payload) {
      const d = payload && (payload.data || payload);
      if (!d || !Array.isArray(d.respondents) || typeof d.evaluations !== 'object') {
        throw new Error('Format file cadangan tidak valid.');
      }
      const keys = ['respondents', 'evaluations', 'updls', 'units', 'programs', 'periods', 'formTemplates', 'auditLogs', 'users', 'bankButirList'];
      keys.forEach(k => {
        if (d[k] !== undefined) this[k] = d[k];
      });
      if (d.settings) this.updateSettings(d.settings);
      this.save();
    }
  }

  window.appStore = new Store();

  // Komponen Reusable Filter Bar Menu Utama (Cakupan UPDL, Program, Periode)
  window.FilterScopeBar = {
    render: function () {
      const activeUpdl = window.appStore.state.activeDashboardUpdl || 'ALL';
      const activeProgram = window.appStore.state.activeDashboardProgram || 'ALL';
      const activePeriod = window.appStore.state.activeDashboardPeriod || 'ALL';

      const updls = window.appStore.getUpdls();
      const programs = window.appStore.getPrograms();
      const periods = window.appStore.getPeriods();

      const updlObj = activeUpdl !== 'ALL' ? updls.find(u => u.id === activeUpdl) : null;
      const progObj = activeProgram !== 'ALL' ? programs.find(p => p.id === activeProgram) : null;
      const periodObj = activePeriod !== 'ALL' ? periods.find(p => p.id === activePeriod) : null;

      const selectedUpdlText = updlObj ? `${updlObj.nama} (${updlObj.kode})` : 'Semua UPDL (Seluruh Indonesia)';
      const selectedProgText = progObj ? progObj.nama : 'Semua Program Diklat';
      const selectedPeriodText = periodObj ? `${periodObj.nama} (${periodObj.status})` : 'Semua Periode';

      const filterScopeLabel = [
        updlObj ? updlObj.nama : 'Semua UPDL',
        progObj ? progObj.nama : 'Semua Program',
        periodObj ? periodObj.nama : 'Semua Periode'
      ].join(' • ');

      return `
        <div class="p-3.5 bg-white rounded-xl border border-[#CBD5E1] shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <!-- 3 Interactive Selectors: UPDL, Program, Periode Evaluasi -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 flex-1">
            
            <!-- Opsi 1: Pilihan UPDL (Seluruh Area Tombol Dapat Diklik) -->
            <div class="relative group flex items-center justify-between gap-2.5 px-3 py-2 bg-[#F8FAFC] hover:bg-[#F0FDFA] border border-[#CBD5E1] hover:border-[#006876] rounded-xl text-xs transition-all shadow-sm focus-within:border-[#006876] focus-within:ring-2 focus-within:ring-[#006876]/20 cursor-pointer min-h-[46px]">
              <div class="flex items-center gap-2.5 min-w-0 flex-1 pointer-events-none select-none">
                <span class="material-symbols-outlined text-[#006876] text-[20px] shrink-0">account_balance</span>
                <div class="flex flex-col min-w-0 flex-1">
                  <span class="text-[10px] text-[#64748B] font-bold uppercase tracking-wider leading-tight truncate">CAKUPAN UPDL</span>
                  <span id="label-dash-updl" class="text-xs text-[#172B3A] font-semibold truncate leading-tight mt-0.5">
                    ${selectedUpdlText}
                  </span>
                </div>
              </div>
              <span class="material-symbols-outlined text-[#64748B] group-hover:text-[#006876] text-[20px] shrink-0 pointer-events-none transition-colors">
                expand_more
              </span>
              <select id="select-dash-updl" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" aria-label="Cakupan UPDL" title="Pilih Cakupan UPDL">
                <option value="ALL" ${activeUpdl === 'ALL' ? 'selected' : ''}>Semua UPDL (Seluruh Indonesia)</option>
                ${updls.map(u => `
                  <option value="${u.id}" ${activeUpdl === u.id ? 'selected' : ''}>
                    ${u.nama} (${u.kode})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Opsi 2: Pilihan Program Pembelajaran (Seluruh Area Tombol Dapat Diklik) -->
            <div class="relative group flex items-center justify-between gap-2.5 px-3 py-2 bg-[#F8FAFC] hover:bg-[#F0FDFA] border border-[#CBD5E1] hover:border-[#006876] rounded-xl text-xs transition-all shadow-sm focus-within:border-[#006876] focus-within:ring-2 focus-within:ring-[#006876]/20 cursor-pointer min-h-[46px]">
              <div class="flex items-center gap-2.5 min-w-0 flex-1 pointer-events-none select-none">
                <span class="material-symbols-outlined text-[#006876] text-[20px] shrink-0">school</span>
                <div class="flex flex-col min-w-0 flex-1">
                  <span class="text-[10px] text-[#64748B] font-bold uppercase tracking-wider leading-tight truncate">PROGRAM PEMBELAJARAN</span>
                  <span id="label-dash-program" class="text-xs text-[#172B3A] font-semibold truncate leading-tight mt-0.5">
                    ${selectedProgText}
                  </span>
                </div>
              </div>
              <span class="material-symbols-outlined text-[#64748B] group-hover:text-[#006876] text-[20px] shrink-0 pointer-events-none transition-colors">
                expand_more
              </span>
              <select id="select-dash-program" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" aria-label="Program Pembelajaran" title="Pilih Program Pembelajaran">
                <option value="ALL" ${activeProgram === 'ALL' ? 'selected' : ''}>Semua Program Diklat</option>
                ${programs.map(p => `
                  <option value="${p.id}" ${activeProgram === p.id ? 'selected' : ''}>
                    ${p.nama}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Opsi 3: Pilihan Periode Evaluasi (Seluruh Area Tombol Dapat Diklik) -->
            <div class="relative group flex items-center justify-between gap-2.5 px-3 py-2 bg-[#F8FAFC] hover:bg-[#F0FDFA] border border-[#CBD5E1] hover:border-[#006876] rounded-xl text-xs transition-all shadow-sm focus-within:border-[#006876] focus-within:ring-2 focus-within:ring-[#006876]/20 cursor-pointer min-h-[46px]">
              <div class="flex items-center gap-2.5 min-w-0 flex-1 pointer-events-none select-none">
                <span class="material-symbols-outlined text-[#006876] text-[20px] shrink-0">calendar_month</span>
                <div class="flex flex-col min-w-0 flex-1">
                  <span class="text-[10px] text-[#64748B] font-bold uppercase tracking-wider leading-tight truncate">PERIODE EVALUASI</span>
                  <span id="label-dash-period" class="text-xs text-[#172B3A] font-semibold truncate leading-tight mt-0.5">
                    ${selectedPeriodText}
                  </span>
                </div>
              </div>
              <span class="material-symbols-outlined text-[#64748B] group-hover:text-[#006876] text-[20px] shrink-0 pointer-events-none transition-colors">
                expand_more
              </span>
              <select id="select-dash-period" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" aria-label="Periode Evaluasi" title="Pilih Periode Evaluasi">
                <option value="ALL" ${activePeriod === 'ALL' ? 'selected' : ''}>Semua Periode</option>
                ${periods.map(p => `
                  <option value="${p.id}" ${activePeriod === p.id ? 'selected' : ''}>
                    ${p.nama} (${p.status})
                  </option>
                `).join('')}
              </select>
            </div>

          </div>

          <!-- Scope Info di Sisi Kanan (Tanpa Tombol Reset) -->
          <div class="flex items-center gap-1.5 text-xs text-[#64748B] shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-[#E2E8F0] px-1">
            <span>Cakupan:</span>
            <b class="text-[#006876] font-bold">${filterScopeLabel}</b>
          </div>
        </div>
      `;
    },

    attachEvents: function (container, onFilterChange) {
      if (!container) return;

      const updlSelect = container.querySelector('#select-dash-updl');
      if (updlSelect) {
        updlSelect.addEventListener('change', (e) => {
          if (typeof onFilterChange === 'function') onFilterChange('updl', e.target.value);
          window.appStore.setDashboardFilters(e.target.value, undefined, undefined);
        });
      }

      const progSelect = container.querySelector('#select-dash-program');
      if (progSelect) {
        progSelect.addEventListener('change', (e) => {
          if (typeof onFilterChange === 'function') onFilterChange('program', e.target.value);
          window.appStore.setDashboardFilters(undefined, e.target.value, undefined);
        });
      }

      const periodSelect = container.querySelector('#select-dash-period');
      if (periodSelect) {
        periodSelect.addEventListener('change', (e) => {
          if (typeof onFilterChange === 'function') onFilterChange('period', e.target.value);
          window.appStore.setDashboardFilters(undefined, undefined, e.target.value);
        });
      }

      // Pastikan klik di seluruh area kartu selalu memicu pemilih opsi dropdown
      ['#select-dash-updl', '#select-dash-program', '#select-dash-period'].forEach(selId => {
        const selEl = container.querySelector(selId);
        if (!selEl) return;
        const parentCard = selEl.closest('.relative');
        if (parentCard) {
          parentCard.addEventListener('click', (e) => {
            if (e.target !== selEl && typeof selEl.showPicker === 'function') {
              try {
                selEl.showPicker();
              } catch (err) { }
            }
          });
        }
      });
    }
  };
})();
