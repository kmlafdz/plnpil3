/**
 * View: Builder Form Evaluasi (3 Perspektif Berbasis Program & Bank Butir Terisolasi)
 * Evaluasi Level 3 — PLN Impact Lab (PIL)
 * Mengonfigurasi Instrumen Evaluasi untuk Peserta, Atasan Langsung, dan Koordinator (Internal & Eksternal)
 * Terikat ketat pada Program dan Bank Butir yang relevan.
 */

(function () {
  window.AdminFormBuilderView = {
    selectedTemplateId: 'form-tpl-peserta',
    activePreviewPerspective: 'peserta', // 'peserta' | 'atasan' | 'koordinator_internal' | 'koordinator_eksternal'
    builderStep: 1, // 1: Metadata & Perspektif, 2: Pemilihan Butir, 3: Bobot & Petunjuk, 4: Preview & Publish

    render: function (container) {
      const templates = window.appStore.getFormTemplates();
      let currentTpl = window.appStore.getFormTemplateById(this.selectedTemplateId) || templates[0];
      if (!currentTpl && templates.length > 0) currentTpl = templates[0];

      const programs = window.appStore.getPrograms ? window.appStore.getPrograms() : (window.appStore.programs || []);
      const periods = window.appStore.getPeriods ? window.appStore.getPeriods() : (window.appStore.periods || []);

      // Ensure template has valid programId
      if (currentTpl && !currentTpl.programId) {
        currentTpl.programId = programs.length > 0 ? programs[0].id : 'prog-pil-susut';
      }

      // Filter Bank Butir strictly by template's programId
      const programBankButirs = currentTpl ? window.appStore.getBankButirList(currentTpl.programId) : [];

      // Ensure template has valid bankButirId for its program
      if (currentTpl) {
        if (!currentTpl.bankButirId || !programBankButirs.some(b => b.id === currentTpl.bankButirId)) {
          const activeBB = window.appStore.getActiveBankButirForProgram(currentTpl.programId);
          currentTpl.bankButirId = activeBB ? activeBB.id : (programBankButirs.length > 0 ? programBankButirs[0].id : null);
        }
      }

      const targetBB = currentTpl?.bankButirId ? window.appStore.getBankButirById(currentTpl.bankButirId) : null;
      const allItems = targetBB ? window.appStore.getAllBankButirItems(targetBB.id) : [];
      const bbSections = targetBB?.sections || {};

      container.innerHTML = `
        <div class="flex flex-col gap-6 animate-fadeIn">
          
          <!-- Page Header -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col gap-1 max-w-3xl">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                  Evaluasi Level 3 — PLN Impact Lab (PIL)
                </span>
                <span class="text-xs text-[#64748B] font-mono">Modul Form Builder Multi-Perspektif</span>
              </div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">
                Builder Formulir Evaluasi Level 3
              </h1>
              <p class="text-xs md:text-sm text-[#64748B] leading-relaxed">
                Rancang dan terbitkan instrumen penilaian untuk 3 perspektif (Peserta, Atasan Langsung, dan Koordinator Internal/Eksternal) berbasis Bank Butir program terisolasi dengan kontrol bobot dan versioning instrumen.
              </p>
            </div>

            <!-- Toolbar Actions -->
            <div class="flex flex-wrap items-center gap-2">
              <button id="btn-create-new-template" class="btn-secondary">
                <span class="material-symbols-outlined text-[16px]">add</span>
                Buat Formulir Baru
              </button>
              <button id="btn-publish-current-template" class="btn-primary" ${!targetBB ? 'disabled' : ''}>
                <span class="material-symbols-outlined text-[16px]">publish</span>
                Terbitkan Formulir Resmi
              </button>
            </div>
          </div>

          <!-- Template Selector Pills -->
          <div class="card p-3 bg-[#F8FAFC] border border-[#CBD5E1] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span class="text-xs font-bold text-[#172B3A] shrink-0 mr-1">Pilih Formulir:</span>
              ${templates.map(tpl => {
                const isSelected = currentTpl && currentTpl.id === tpl.id;
                const roleBadge = {
                  peserta: 'Peserta',
                  atasan: 'Atasan',
                  koordinator_internal: 'Kord. Internal',
                  koordinator_eksternal: 'Kord. Eksternal'
                }[tpl.targetRole] || tpl.targetRole;

                return `
                  <button class="btn-select-template px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all shrink-0 ${isSelected ? 'bg-[#172B3A] text-white border-[#172B3A] shadow-sm' : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'}" data-id="${tpl.id}">
                    <span>${roleBadge}</span>
                    <span class="w-2 h-2 rounded-full ${tpl.status === 'PUBLISHED' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}"></span>
                  </button>
                `;
              }).join('')}
            </div>

            <div class="text-xs text-[#64748B] shrink-0">
              Status: <b class="${currentTpl && currentTpl.status === 'PUBLISHED' ? 'text-[#059669]' : 'text-[#D97706]'}">${currentTpl ? currentTpl.status : 'DRAFT'}</b>
            </div>
          </div>

          <!-- 4-Step Builder Navigation -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-[#CBD5E1] pb-2 text-xs">
            <button class="step-nav-btn py-2 px-3 text-left rounded border flex items-center gap-2 ${this.builderStep === 1 ? 'bg-[#E0F7FA] text-[#006064] border-[#23C4DB] font-bold' : 'bg-white text-[#64748B] border-[#E2E8F0]'}" data-step="1">
              <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${this.builderStep === 1 ? 'bg-[#006064] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}">1</span>
              <span>1. Metadata & Bank Butir</span>
            </button>
            <button class="step-nav-btn py-2 px-3 text-left rounded border flex items-center gap-2 ${this.builderStep === 2 ? 'bg-[#E0F7FA] text-[#006064] border-[#23C4DB] font-bold' : 'bg-white text-[#64748B] border-[#E2E8F0]'}" data-step="2">
              <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${this.builderStep === 2 ? 'bg-[#006064] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}">2</span>
              <span>2. Butir Perilaku</span>
            </button>
            <button class="step-nav-btn py-2 px-3 text-left rounded border flex items-center gap-2 ${this.builderStep === 3 ? 'bg-[#E0F7FA] text-[#006064] border-[#23C4DB] font-bold' : 'bg-white text-[#64748B] border-[#E2E8F0]'}" data-step="3">
              <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${this.builderStep === 3 ? 'bg-[#006064] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}">3</span>
              <span>3. Bobot & Petunjuk</span>
            </button>
            <button class="step-nav-btn py-2 px-3 text-left rounded border flex items-center gap-2 ${this.builderStep === 4 ? 'bg-[#E0F7FA] text-[#006064] border-[#23C4DB] font-bold' : 'bg-white text-[#64748B] border-[#E2E8F0]'}" data-step="4">
              <span class="material-symbols-outlined text-[16px] ${this.builderStep === 4 ? 'text-[#006064]' : 'text-[#64748B]'}">visibility</span>
              <span>4. Live Preview</span>
            </button>
          </div>

          <!-- Builder Step Content Area -->
          <div id="builder-step-content" class="card p-6">
            ${this.renderStepContent(currentTpl, programs, periods, programBankButirs, targetBB, allItems, bbSections)}
          </div>

        </div>

        <div id="fb-modal-container"></div>
      `;

      this.attachEventListeners(container, currentTpl, programBankButirs, targetBB);
    },

    renderStepContent: function (tpl, programs, periods, programBankButirs, targetBB, allItems, bbSections) {
      if (!tpl) return '<div class="text-center py-8 text-[#94A3B8]">Tidak ada template form yang dipilih.</div>';

      const sectionKeys = Object.keys(bbSections);

      if (this.builderStep === 1) {
        return `
          <div class="space-y-4 max-w-2xl text-xs">
            <h3 class="text-sm font-bold text-[#172B3A] border-b pb-2">Langkah 1: Konfigurasi Metadata, Program & Sumber Bank Butir</h3>
            
            <div>
              <label class="block font-semibold text-[#172B3A] mb-1">Judul Formulir Evaluasi <span class="text-red-500">*</span></label>
              <input type="text" id="fb-input-judul" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" value="${tpl.judul || ''}" />
            </div>

            <!-- Program & Bank Butir Strict Binding -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg">
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[15px] text-[#0F96A9]">school</span>
                  Program Pembelajaran Terkait <span class="text-red-500">*</span>
                </label>
                <select id="fb-input-program" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none font-medium">
                  ${programs.map(p => `
                    <option value="${p.id}" ${tpl.programId === p.id ? 'selected' : ''}>[${p.kode}] ${p.nama}</option>
                  `).join('')}
                </select>
                <span class="text-[10px] text-[#64748B] mt-1 block">Mengubah program akan memfilter pilihan Bank Butir secara eksklusif.</span>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[15px] text-[#D97706]">inventory_2</span>
                  Bank Butir Instrumen Program <span class="text-red-500">*</span>
                </label>
                <select id="fb-input-bank-butir" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none font-semibold ${programBankButirs.length === 0 ? 'border-amber-400 bg-amber-50' : ''}">
                  ${programBankButirs.length === 0 ? `
                    <option value="">(Belum ada Bank Butir untuk program ini)</option>
                  ` : programBankButirs.map(bb => `
                    <option value="${bb.id}" ${tpl.bankButirId === bb.id ? 'selected' : ''}>
                      ${bb.nama} [${bb.kode || bb.id}] (${bb.status})
                    </option>
                  `).join('')}
                </select>
                ${programBankButirs.length === 0 ? `
                  <span class="text-[10px] text-amber-700 mt-1 block font-semibold">
                    Silakan buka menu <b>Bank Butir</b> untuk membuat atau menduplikasi katalog instrumen bagi program ini.
                  </span>
                ` : `
                  <span class="text-[10px] text-[#64748B] mt-1 block">Hanya katalog milik program ini yang diizinkan (Anti-Polusi Data).</span>
                `}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Periode Evaluasi</label>
                <select id="fb-input-periode" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none">
                  ${periods.map(p => `
                    <option value="${p.id}" ${tpl.periodId === p.id ? 'selected' : ''}>${p.nama} (${p.kode})</option>
                  `).join('')}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Target Perspektif Evaluator <span class="text-red-500">*</span></label>
                <select id="fb-input-role" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none font-semibold">
                  <option value="peserta" ${tpl.targetRole === 'peserta' ? 'selected' : ''}>Form Peserta (Penilaian Mandiri)</option>
                  <option value="atasan" ${tpl.targetRole === 'atasan' ? 'selected' : ''}>Form Atasan Langsung (Observasi Lapangan)</option>
                  <option value="koordinator_internal" ${tpl.targetRole === 'koordinator_internal' ? 'selected' : ''}>Form Koordinator Internal (Validasi UP3)</option>
                  <option value="koordinator_eksternal" ${tpl.targetRole === 'koordinator_eksternal' ? 'selected' : ''}>Form Koordinator Eksternal (Validasi UPDL)</option>
                </select>
              </div>
            </div>

            <div class="pt-4 flex justify-end">
              <button class="btn-primary btn-next-step" data-next="2">Lanjut ke Pemilihan Butir →</button>
            </div>
          </div>
        `;
      }

      if (this.builderStep === 2) {
        const selectedItemIds = tpl.itemIds || [];

        return `
          <div class="space-y-4 text-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
              <div>
                <h3 class="text-sm font-bold text-[#172B3A]">Langkah 2: Pemilihan Butir Perilaku dari Bank Butir Terkait</h3>
                <p class="text-[11px] text-[#64748B]">
                  Sumber: <b class="text-[#0F96A9]">${targetBB ? targetBB.nama : 'Belum memilih Bank Butir'}</b> (${allItems.length} butir master tersedia).
                </p>
              </div>
              <div class="text-[11px] font-bold text-[#0F96A9] bg-[#E0F7FA] px-3 py-1 rounded-full border border-[#B2EBF2] shrink-0 self-start sm:self-center">
                ${selectedItemIds.length} dari ${allItems.length} Butir Terpilih
              </div>
            </div>

            ${sectionKeys.length === 0 ? `
              <div class="p-8 text-center text-[#94A3B8] bg-[#F8FAFC] rounded-lg border border-dashed border-[#CBD5E1]">
                <span class="material-symbols-outlined text-4xl block mb-2 text-slate-300">inventory_2</span>
                Tidak ada butir perilaku pada Bank Butir yang dipilih. Silakan kembali ke Langkah 1 atau lengkapi butir di modul Bank Butir.
              </div>
            ` : `
              <div class="space-y-3">
                ${sectionKeys.map(partKey => {
                  const part = bbSections[partKey];
                  const partItems = (part && part.items) ? part.items : [];
                  return `
                    <div class="border border-[#CBD5E1] rounded-lg overflow-hidden">
                      <div class="p-3 bg-[#F1F5F9] border-b border-[#CBD5E1] flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-[#172B3A]">Bagian ${partKey}:</span>
                          <span class="text-[#475569] font-medium">${part ? part.title : ''}</span>
                          <span class="font-mono text-[10px] text-[#64748B]">(${part ? (part.kodeDiklat || '-') : ''})</span>
                        </div>
                        <span class="text-[10px] font-semibold text-[#64748B]">${partItems.length} butir</span>
                      </div>

                      <div class="p-3 space-y-2 bg-white">
                        ${partItems.map(it => {
                          const isChecked = selectedItemIds.includes(it.id);
                          return `
                            <label class="flex items-start gap-2.5 p-2 rounded hover:bg-[#F8FAFC] cursor-pointer border border-transparent hover:border-[#E2E8F0]">
                              <input type="checkbox" class="cb-item-select mt-0.5" value="${it.id}" ${isChecked ? 'checked' : ''} />
                              <div class="flex-grow">
                                <div class="flex items-center gap-2">
                                  <span class="font-mono font-bold text-[#0F96A9]">${it.id}</span>
                                  <span class="font-medium text-[#172B3A]">${tpl.targetRole === 'atasan' ? (it.perilakuAtasan || it.perilaku) : it.perilaku}</span>
                                </div>
                                <div class="text-[11px] text-[#64748B] mt-0.5">Bukti: <i>${it.contohBukti || '-'}</i> • Kompetensi: <b>${it.kompetensi || '-'}</b></div>
                              </div>
                            </label>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}

            <div class="pt-4 flex justify-between items-center border-t border-[#E2E8F0]">
              <button class="btn-secondary btn-next-step" data-next="1">← Kembali ke Metadata</button>
              <button class="btn-primary btn-next-step" data-next="3">Lanjut ke Bobot & Petunjuk →</button>
            </div>
          </div>
        `;
      }

      if (this.builderStep === 3) {
        // Build dynamic weights based on active sections
        const bobot = tpl.bobotBagian || {};
        let totalBobot = 0;
        sectionKeys.forEach(key => {
          totalBobot += Number(bobot[key] || 0);
        });

        const isBobotValid = totalBobot === 100 || sectionKeys.length === 0;

        return `
          <div class="space-y-4 max-w-2xl text-xs">
            <h3 class="text-sm font-bold text-[#172B3A] border-b pb-2">Langkah 3: Konfigurasi Bobot Bagian & Petunjuk Pengisian</h3>

            <!-- Petunjuk Pengisian -->
            <div>
              <label class="block font-semibold text-[#172B3A] mb-1">Petunjuk Pengisian bagi Evaluator</label>
              <textarea id="fb-input-petunjuk" rows="3" class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Tuliskan petunjuk teknis pengisian formulir...">${tpl.petunjuk || ''}</textarea>
            </div>

            <!-- Konfigurasi Bobot Bagian Dinamis -->
            <div class="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-bold text-[#172B3A]">Bobot Perhitungan Hasil Evaluasi:</div>
                  <div class="text-[11px] text-[#64748B]">Sesuai spesifikasi, total persentase bobot bagian wajib berjumlah tepat 100%.</div>
                </div>
                <div class="px-3 py-1 rounded-full text-xs font-mono font-bold ${isBobotValid ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'}">
                  Total: ${totalBobot}% ${isBobotValid ? '✓ Valid' : '⚠️ Harus 100%'}
                </div>
              </div>

              <div class="grid grid-cols-${Math.min(sectionKeys.length || 1, 3)} gap-3 pt-2">
                ${sectionKeys.map(key => {
                  const sec = bbSections[key] || {};
                  const currentW = bobot[key] !== undefined ? bobot[key] : (sec.bobotDefault || (sectionKeys.length > 0 ? Math.round(100 / sectionKeys.length) : 100));
                  return `
                    <div>
                      <label class="block font-semibold text-[#172B3A] mb-1">Bagian ${key} (${sec.title ? sec.title.split(' ')[0] : 'Bagian'}):</label>
                      <div class="relative">
                        <input type="number" id="fb-bobot-${key.toLowerCase()}" data-part="${key}" min="0" max="100" class="input-dynamic-bobot w-full border border-[#CBD5E1] rounded px-3 py-1.5 font-mono text-center font-bold" value="${currentW}" />
                        <span class="absolute right-3 top-2 text-[#64748B]">%</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Definisi Skala Likert 1-4 Baku -->
            <div class="border border-[#CBD5E1] rounded-lg p-3 bg-white space-y-2">
              <div class="font-bold text-[#172B3A]">Skala Jawaban Terkunci (Instrumen Sumber):</div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                <div class="p-2 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]">
                  <b>1: Tidak Memperbaiki</b><br/>Rentang 0–25%
                </div>
                <div class="p-2 rounded bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E]">
                  <b>2: Kurang Memperbaiki</b><br/>Rentang 26–50%
                </div>
                <div class="p-2 rounded bg-[#E0F7FA] border border-[#B2EBF2] text-[#006064]">
                  <b>3: Cukup Memperbaiki</b><br/>Rentang 51–75%
                </div>
                <div class="p-2 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]">
                  <b>4: Memperbaiki Konsisten</b><br/>Rentang 76–100%
                </div>
              </div>
              <div class="text-[10px] text-[#64748B] italic">Catatan teknis: Rentang persentase di atas adalah tingkat frekuensi penerapan perilaku di lapangan, terpisah dari bobot agregasi bagian.</div>
            </div>

            <div class="pt-4 flex justify-between items-center border-t border-[#E2E8F0]">
              <button class="btn-secondary btn-next-step" data-next="2">← Kembali ke Butir</button>
              <button class="btn-primary btn-next-step" data-next="4">Lanjut ke Live Preview →</button>
            </div>
          </div>
        `;
      }

      // Step 4: Live Preview
      const selectedItemIds = tpl.itemIds || [];
      const previewItems = allItems.filter(it => selectedItemIds.includes(it.id));

      return `
        <div class="space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 class="text-sm font-bold text-[#172B3A] flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">visibility</span>
                Live Interactive Preview: ${tpl.judul}
              </h3>
              <p class="text-xs text-[#64748B]">Simulasi instrumen aktif yang akan dilihat oleh responden berstatus <b>${tpl.targetRole}</b>.</p>
            </div>
            
            <!-- Perspective Toggle for Preview -->
            <div class="inline-flex rounded-lg border border-[#CBD5E1] bg-[#F1F5F9] p-0.5 text-xs">
              <span class="px-2 py-1 text-[#64748B] font-semibold text-[11px] self-center">Simulasi:</span>
              <button class="px-2.5 py-1 rounded ${this.activePreviewPerspective === 'peserta' ? 'bg-[#172B3A] text-white font-bold' : 'text-[#64748B]'}" id="prev-btn-peserta">Peserta</button>
              <button class="px-2.5 py-1 rounded ${this.activePreviewPerspective === 'atasan' ? 'bg-[#172B3A] text-white font-bold' : 'text-[#64748B]'}" id="prev-btn-atasan">Atasan</button>
              <button class="px-2.5 py-1 rounded ${this.activePreviewPerspective === 'koordinator' ? 'bg-[#172B3A] text-white font-bold' : 'text-[#64748B]'}" id="prev-btn-koordinator">Koordinator</button>
            </div>
          </div>

          <!-- Preview Body (Mimics Actual Form) -->
          <div class="p-5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] space-y-5">
            
            <!-- Instructions Box -->
            <div class="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-xs text-[#1E40AF]">
              <div class="font-bold flex items-center gap-1.5 mb-1">
                <span class="material-symbols-outlined text-[16px]">info</span>
                Petunjuk Pengisian Formulir:
              </div>
              <p class="leading-relaxed">${tpl.petunjuk || 'Pilihlah skala 1-4 yang paling mencerminkan konsistensi penerapan perilaku Anda di tempat kerja, serta unggah dokumen bukti pendukung.'}</p>
            </div>

            <!-- Items List Simulation -->
            <div class="space-y-4">
              ${previewItems.length === 0 ? `
                <div class="p-8 text-center text-[#94A3B8] bg-white rounded-lg border border-dashed">
                  Belum ada butir perilaku yang dipilih untuk formulir ini.
                </div>
              ` : previewItems.map((it, idx) => {
                const wording = this.activePreviewPerspective === 'atasan' ? (it.perilakuAtasan || it.perilaku) : it.perilaku;
                return `
                  <div class="p-4 rounded-lg bg-white border border-[#E2E8F0] shadow-sm space-y-3">
                    <div class="flex items-start justify-between gap-3">
                      <div class="space-y-1">
                        <div class="flex items-center gap-2">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E0F7FA] text-[#0F96A9] border border-[#B2EBF2]">Butir #${idx + 1} (${it.id})</span>
                          <span class="text-[11px] font-semibold text-[#64748B]">${it.kompetensi || ''}</span>
                        </div>
                        <div class="text-xs font-medium text-[#172B3A] leading-relaxed pt-1">
                          "${wording}"
                        </div>
                      </div>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] uppercase">Bagian ${it.partKey}</span>
                    </div>

                    <!-- Likert Radio Simulation -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                      ${[
                        { val: 1, label: 'Tidak Memperbaiki (0–25%)' },
                        { val: 2, label: 'Kurang Memperbaiki (26–50%)' },
                        { val: 3, label: 'Cukup Memperbaiki (51–75%)' },
                        { val: 4, label: 'Memperbaiki Konsisten (76–100%)' }
                      ].map(sc => `
                        <label class="p-2 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer flex items-center gap-2 text-[11px]">
                          <input type="radio" name="preview-score-${it.id}" value="${sc.val}" class="text-[#0F96A9]" />
                          <span><b>${sc.val}</b> - ${sc.label}</span>
                        </label>
                      `).join('')}
                    </div>

                    <!-- Upload Proof Placeholder -->
                    <div class="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
                      <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px] text-[#0F96A9]">attach_file</span>
                        Bukti Wajib: <i>${it.contohBukti || '-'}</i>
                      </span>
                      <button class="px-2 py-1 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#172B3A] font-semibold text-[10px] flex items-center gap-1 cursor-default">
                        <span class="material-symbols-outlined text-[12px]">upload</span> Unggah Bukti
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

          </div>

          <!-- Bottom Actions -->
          <div class="pt-4 flex justify-between items-center border-t border-[#E2E8F0]">
            <button class="btn-secondary btn-next-step" data-next="3">← Kembali ke Bobot</button>
            <button id="btn-publish-bottom" class="btn-primary" ${!targetBB ? 'disabled' : ''}>
              <span class="material-symbols-outlined text-[16px]">publish</span>
              Terbitkan Formulir Resmi (Publish)
            </button>
          </div>
        </div>
      `;
    },

    attachEventListeners: function (container, currentTpl, programBankButirs, targetBB) {
      // Template Selector Pills
      container.querySelectorAll('.btn-select-template').forEach(btn => {
        btn.addEventListener('click', () => {
          this.selectedTemplateId = btn.getAttribute('data-id');
          this.render(container);
        });
      });

      // Step Navigation Buttons
      container.querySelectorAll('.step-nav-btn, .btn-next-step').forEach(btn => {
        btn.addEventListener('click', () => {
          const nextStep = Number(btn.getAttribute('data-step') || btn.getAttribute('data-next'));
          if (nextStep >= 1 && nextStep <= 4) {
            this.builderStep = nextStep;
            this.render(container);
          }
        });
      });

      // Button: Create New Template
      const createBtn = container.querySelector('#btn-create-new-template');
      if (createBtn) {
        createBtn.addEventListener('click', () => this.showCreateTemplateModal());
      }

      // Button: Publish Template
      const publishBtn = container.querySelector('#btn-publish-current-template');
      const publishBottomBtn = container.querySelector('#btn-publish-bottom');

      const handlePublish = () => {
        if (!currentTpl) return;
        try {
          const published = window.appStore.publishFormTemplate(currentTpl.id);
          this.showToast(`Formulir "${published.judul}" resmi diterbitkan!`, 'success');
          this.render(container);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      };

      if (publishBtn) publishBtn.addEventListener('click', handlePublish);
      if (publishBottomBtn) publishBottomBtn.addEventListener('click', handlePublish);

      // Simulation perspective toggle
      const prevPeserta = container.querySelector('#prev-btn-peserta');
      const prevAtasan = container.querySelector('#prev-btn-atasan');
      const prevKoordinator = container.querySelector('#prev-btn-koordinator');

      if (prevPeserta) prevPeserta.addEventListener('click', () => { this.activePreviewPerspective = 'peserta'; this.render(container); });
      if (prevAtasan) prevAtasan.addEventListener('click', () => { this.activePreviewPerspective = 'atasan'; this.render(container); });
      if (prevKoordinator) prevKoordinator.addEventListener('click', () => { this.activePreviewPerspective = 'koordinator'; this.render(container); });

      // Step 1: Input Judul
      const judulInput = container.querySelector('#fb-input-judul');
      if (judulInput && currentTpl) {
        judulInput.addEventListener('change', (e) => {
          currentTpl.judul = e.target.value.trim();
          window.appStore.saveFormTemplate(currentTpl);
        });
      }

      // Step 1: Program Selector Change (Strict Filtering of Bank Butir)
      const progSelect = container.querySelector('#fb-input-program');
      if (progSelect && currentTpl) {
        progSelect.addEventListener('change', (e) => {
          const newProgId = e.target.value;
          currentTpl.programId = newProgId;

          // Automatically select active Bank Butir for this new program
          const activeBB = window.appStore.getActiveBankButirForProgram(newProgId) || window.appStore.getBankButirList(newProgId)[0];
          currentTpl.bankButirId = activeBB ? activeBB.id : null;

          // Auto-sync items from the new bank butir
          if (activeBB) {
            const newItems = window.appStore.getAllBankButirItems(activeBB.id);
            currentTpl.itemIds = newItems.map(it => it.id);
          } else {
            currentTpl.itemIds = [];
          }

          try {
            window.appStore.saveFormTemplate(currentTpl);
            this.showToast(`Program diubah ke ${newProgId}. Bank Butir disesuaikan secara otomatis.`, 'info');
            this.render(container);
          } catch (err) {
            this.showToast(err.message, 'error');
          }
        });
      }

      // Step 1: Bank Butir Selector Change
      const bbSelect = container.querySelector('#fb-input-bank-butir');
      if (bbSelect && currentTpl) {
        bbSelect.addEventListener('change', (e) => {
          const newBBId = e.target.value;
          currentTpl.bankButirId = newBBId;

          const chosenBB = window.appStore.getBankButirById(newBBId);
          if (chosenBB) {
            const newItems = window.appStore.getAllBankButirItems(chosenBB.id);
            currentTpl.itemIds = newItems.map(it => it.id);
          }

          try {
            window.appStore.saveFormTemplate(currentTpl);
            this.showToast(`Bank Butir berhasil diubah ke ${chosenBB?.nama || newBBId}.`, 'success');
            this.render(container);
          } catch (err) {
            this.showToast(err.message, 'error');
          }
        });
      }

      // Step 1: Periode & Role Selectors
      const periodeSelect = container.querySelector('#fb-input-periode');
      if (periodeSelect && currentTpl) {
        periodeSelect.addEventListener('change', (e) => {
          currentTpl.periodId = e.target.value;
          window.appStore.saveFormTemplate(currentTpl);
        });
      }

      const roleSelect = container.querySelector('#fb-input-role');
      if (roleSelect && currentTpl) {
        roleSelect.addEventListener('change', (e) => {
          currentTpl.targetRole = e.target.value;
          window.appStore.saveFormTemplate(currentTpl);
        });
      }

      // Step 3: Input Petunjuk
      const petunjukInput = container.querySelector('#fb-input-petunjuk');
      if (petunjukInput && currentTpl) {
        petunjukInput.addEventListener('change', (e) => {
          currentTpl.petunjuk = e.target.value.trim();
          window.appStore.saveFormTemplate(currentTpl);
        });
      }

      // Step 2: Checkbox Items Selection
      container.querySelectorAll('.cb-item-select').forEach(cb => {
        cb.addEventListener('change', () => {
          const selected = [];
          container.querySelectorAll('.cb-item-select:checked').forEach(c => selected.push(c.value));
          if (currentTpl) {
            currentTpl.itemIds = selected;
            window.appStore.saveFormTemplate(currentTpl);
          }
        });
      });

      // Step 3: Dynamic Weight inputs
      const weightInputs = container.querySelectorAll('.input-dynamic-bobot');
      if (weightInputs.length > 0 && currentTpl) {
        weightInputs.forEach(inp => {
          inp.addEventListener('change', () => {
            const newWeights = {};
            weightInputs.forEach(i => {
              const part = i.getAttribute('data-part');
              newWeights[part] = Number(i.value) || 0;
            });

            try {
              currentTpl.bobotBagian = newWeights;
              window.appStore.saveFormTemplate(currentTpl);
              this.render(container);
            } catch (err) {
              this.showToast(err.message, 'error');
            }
          });
        });
      }
    },

    showCreateTemplateModal: function () {
      const modalContainer = document.getElementById('fb-modal-container');
      if (!modalContainer) return;

      const programs = window.appStore.getPrograms ? window.appStore.getPrograms(true) : (window.appStore.programs || []);
      const periods = window.appStore.getPeriods ? window.appStore.getPeriods() : (window.appStore.periods || []);
      const initialProgId = programs.length > 0 ? programs[0].id : 'prog-pil-susut';
      const initialBBs = window.appStore.getBankButirList(initialProgId);

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] w-full max-w-lg overflow-hidden flex flex-col">
            <div class="px-5 py-4 bg-[#172B3A] text-white flex items-center justify-between">
              <h3 class="text-sm font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#23C4DB]">add_circle</span>
                Buat Konfigurasi Formulir Baru
              </h3>
              <button id="modal-close-btn" class="text-[#94A3B8] hover:text-white transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form id="form-create-tpl" class="p-5 space-y-3.5 text-xs">
              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Judul Formulir <span class="text-red-500">*</span></label>
                <input type="text" id="tpl-input-judul" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 focus:border-[#23C4DB] focus:outline-none" placeholder="Contoh: Formulir Evaluasi Level 3 - Khusus Koordinator" />
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Target Perspektif Evaluator <span class="text-red-500">*</span></label>
                <select id="tpl-input-role" required class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none font-semibold">
                  <option value="peserta">Peserta Pelatihan (Penilaian Mandiri)</option>
                  <option value="atasan">Atasan Langsung (Observasi Bawahan)</option>
                  <option value="koordinator_internal">Koordinator Internal (UP3)</option>
                  <option value="koordinator_eksternal">Koordinator Eksternal (UPDL)</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Program Pembelajaran *</label>
                  <select id="tpl-input-prog" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none">
                    ${programs.map(p => `<option value="${p.id}">[${p.kode}] ${p.nama}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-[#172B3A] mb-1">Periode Evaluasi *</label>
                  <select id="tpl-input-period" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none">
                    ${periods.map(p => `<option value="${p.id}">${p.nama}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-[#172B3A] mb-1">Bank Butir Instrumen Program *</label>
                <select id="tpl-input-bb" class="w-full border border-[#CBD5E1] rounded px-3 py-2 bg-white focus:border-[#23C4DB] focus:outline-none font-semibold">
                  ${initialBBs.map(bb => `<option value="${bb.id}">${bb.nama}</option>`).join('')}
                </select>
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button type="button" id="modal-cancel-btn" class="btn-secondary">Batal</button>
                <button type="submit" class="btn-primary">Buat Konfigurasi Form</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const closeModal = () => modalContainer.innerHTML = '';
      modalContainer.querySelector('#modal-close-btn').onclick = closeModal;
      modalContainer.querySelector('#modal-cancel-btn').onclick = closeModal;

      // When modal program changes, update Bank Butir options dynamically
      const modalProgSelect = modalContainer.querySelector('#tpl-input-prog');
      const modalBBSelect = modalContainer.querySelector('#tpl-input-bb');
      if (modalProgSelect && modalBBSelect) {
        modalProgSelect.addEventListener('change', (e) => {
          const selProg = e.target.value;
          const matchingBBs = window.appStore.getBankButirList(selProg);
          modalBBSelect.innerHTML = matchingBBs.length === 0
            ? '<option value="">(Belum ada Bank Butir untuk program ini)</option>'
            : matchingBBs.map(bb => `<option value="${bb.id}">${bb.nama}</option>`).join('');
        });
      }

      modalContainer.querySelector('#form-create-tpl').onsubmit = (e) => {
        e.preventDefault();
        try {
          const progId = modalContainer.querySelector('#tpl-input-prog').value;
          const bbId = modalContainer.querySelector('#tpl-input-bb').value;
          const bb = window.appStore.getBankButirById(bbId);
          const initialItems = bb ? window.appStore.getAllBankButirItems(bb.id).map(it => it.id) : [];

          const newTpl = window.appStore.saveFormTemplate({
            judul: modalContainer.querySelector('#tpl-input-judul').value,
            targetRole: modalContainer.querySelector('#tpl-input-role').value,
            programId: progId,
            bankButirId: bbId || undefined,
            periodId: modalContainer.querySelector('#tpl-input-period').value,
            status: 'DRAFT',
            versi: '1.0',
            bobotBagian: bb?.sections ? Object.keys(bb.sections).reduce((acc, k) => {
              acc[k] = bb.sections[k].bobotDefault || Math.round(100 / Object.keys(bb.sections).length);
              return acc;
            }, {}) : { A: 40, B: 35, C: 25 },
            itemIds: initialItems
          });

          this.selectedTemplateId = newTpl.id;
          this.showToast('Template formulir baru berhasil dibuat.', 'success');
          closeModal();
          const mainContainer = document.getElementById('main-content-area');
          if (mainContainer) this.render(mainContainer);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      };
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
