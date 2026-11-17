/**
 * View: Formulir Evaluasi Interaktif Peserta
 * Berbasis preferensi/formulir_evaluasi_peserta/code.html dan Form Evaluasi Level 3.xlsx
 * Mendukung pemilihan skala 1-4, upload bukti (JPG/PNG/PDF) per butir, dan auto-save otomatis
 */

(function () {
  window.FormulirView = {
    activeModTab: 'ALL',
    isReadOnly: false,
    viewPerspective: 'peserta', // 'peserta' | 'atasan' | 'koordinator'

    render: function (container) {
      const user = window.authManager.getUser();
      const currentRole = window.appStore.getRole();
      if (currentRole === 'peserta') {
        this.isReadOnly = false;
      }
      const isReadOnly = (this.isReadOnly === true);

      // Dapatkan data responden yang sedang dinilai
      let respondent = null;
      let assignedRespondents = [];

      if (currentRole === 'peserta') {
        if (user && user.respondentId) {
          respondent = window.appStore.respondents.find(r => r.id === Number(user.respondentId));
        } else if (user && user.nip) {
          respondent = window.appStore.respondents.find(r => r.nip === user.nip);
        }
      } else if (currentRole === 'atasan' || currentRole.includes('koordinator')) {
        assignedRespondents = window.appStore.getAssignedRespondentsForUser(user);
        const activeRespId = window.appStore.state.activeRespondentId;
        if (activeRespId) {
          respondent = assignedRespondents.find(r => r.id === Number(activeRespId));
        }
        if (!respondent && assignedRespondents.length > 0) {
          respondent = assignedRespondents[0];
          window.appStore.state.activeRespondentId = respondent.id;
        }
      } else {
        // Admin melihat responden yang aktif di store
        respondent = window.appStore.getActiveRespondent();
      }

      if (!respondent) {
        respondent = window.appStore.respondents[0];
      }

      // Tentukan perspective role key ('peserta', 'atasan', 'koordinator')
      const evalRoleKey = isReadOnly
        ? (this.viewPerspective || 'peserta')
        : ((currentRole === 'atasan' || currentRole.includes('koordinator')) ? (currentRole === 'atasan' ? 'atasan' : 'koordinator') : 'peserta');
      const isEvaluator = evalRoleKey === 'atasan' || evalRoleKey.includes('koordinator');

      const ev = window.appStore.getEvaluation(respondent.id);
      const progress = isEvaluator 
        ? window.appStore.getEvaluationProgressForRole(respondent.id, evalRoleKey)
        : window.appStore.getPesertaProgress(respondent.id);
      const pesertaProgress = window.appStore.getPesertaProgress(respondent.id);
      const validation = ev.validation || { q1: true, q2: true, q3: true };

      // Role header info
      const roleTitle = isReadOnly
        ? (evalRoleKey === 'atasan' 
            ? 'Pratinjau Penilaian Atasan Langsung' 
            : evalRoleKey.includes('koordinator')
            ? 'Pratinjau Penilaian Koordinator Program'
            : 'Pratinjau Evaluasi Diri Peserta (Self-Assessment)')
        : (currentRole === 'atasan' 
            ? 'Formulir Penilaian Atasan Langsung (Direct Supervisor)' 
            : currentRole.includes('koordinator')
            ? 'Formulir Verifikasi Mutu Koordinator Program'
            : 'Formulir Evaluasi Diri Peserta (Self-Assessment)');
      
      const roleDesc = isReadOnly
        ? `Meninjau progres evaluasi Level 3 untuk peserta <b>${respondent.nama}</b> (NIP: ${respondent.nip}). Mode pratinjau ini hanya menampilkan data dan tidak dapat diedit.`
        : (currentRole === 'atasan'
            ? `Observasi dan penilaian penerapan perilaku lapangan untuk bawahan Anda: <b>${respondent.nama}</b>.`
            : currentRole.includes('koordinator')
            ? `Validasi dan verifikasi kepatuhan silabus serta implementasi tugas peserta: <b>${respondent.nama}</b>.`
            : 'Pengukuran frekuensi & konsistensi penerapan perilaku di unit kerja operasional setelah mengikuti program pembelajaran.');

      // Kumpulkan modul yang relevan untuk responden ini
      const userModules = respondent.modules || ['A'];

      container.innerHTML = `
        <div class="flex flex-col gap-6 max-w-5xl mx-auto">
          
          ${isReadOnly ? `
            <!-- Banner Mode Pratinjau (Hanya Lihat) -->
            <div class="bg-[#EFF6FF] border border-[#BFDBFE] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#1E40AF] shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[22px]">visibility</span>
                </div>
                <div>
                  <div class="font-bold text-sm text-[#1E40AF] flex items-center gap-2">
                    <span>Mode Pemantauan Progress Formulir</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">Hanya Lihat / Read-Only</span>
                  </div>
                  <div class="text-[11px] text-[#3B82F6] mt-0.5">
                    Anda sedang meninjau isian evaluasi peserta <b>${respondent.nama}</b>. Formulir ini diproteksi dan tidak dapat diubah oleh administrator.
                  </div>
                </div>
              </div>
              <button type="button" id="btn-back-to-peserta-list" class="self-start sm:self-center px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#1E40AF] font-bold rounded-lg border border-[#BFDBFE] transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer">
                <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                Kembali ke Data Peserta
              </button>
            </div>
          ` : ''}

          <!-- Sticky Progress & Context Bar -->
          <div class="bg-white p-3 sm:p-4 rounded-lg border border-[#CBD5E1] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 sticky top-14 sm:top-16 z-30">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-[#172B3A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                ${respondent.nama.charAt(0)}
              </div>
              <div class="overflow-hidden">
                <div class="flex items-center gap-2 truncate">
                  <h2 class="text-xs font-bold text-[#172B3A] truncate">${respondent.nama}</h2>
                  <span class="text-[10px] text-[#64748B] font-mono shrink-0">NIP: ${respondent.nip}</span>
                  <span class="text-[10px] text-[#006876] font-semibold hidden sm:inline truncate">${respondent.unit}</span>
                  ${(isEvaluator || isReadOnly) ? `
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${evalRoleKey === 'atasan' ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]' : (evalRoleKey === 'peserta' ? 'bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]' : 'bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4]')}">
                      Perspektif ${evalRoleKey === 'peserta' ? 'Diri Peserta' : (evalRoleKey === 'atasan' ? 'Atasan Langsung' : 'Koordinator')}
                    </span>
                  ` : ''}
                </div>
                <div class="text-[11px] text-[#64748B] truncate">
                  Modul: <b>Bagian ${userModules.join(', ')}</b> • <span id="form-progress-text">${progress.filled} dari ${progress.total} Butir Terisi (${progress.percentage}%)</span>
                </div>
              </div>
            </div>

            <!-- Auto-save status & Progress Indicator -->
            <div class="flex items-center gap-3 self-end sm:self-center">
              <div class="w-36 hidden md:block">
                <div class="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                  <div id="form-progress-bar" class="bg-gradient-to-r from-[#23C4DB] to-[#006876] h-full rounded-full progress-bar-animated" style="width: ${progress.percentage}%"></div>
                </div>
              </div>

              ${isReadOnly ? `
                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1E40AF] text-[11px] font-semibold border border-[#BFDBFE]">
                  <span class="material-symbols-outlined text-[14px] text-[#2563EB]">lock</span>
                  <span>Hanya Lihat (Read-Only)</span>
                </div>
              ` : `
                <div id="autosave-status-badge" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] text-[11px] font-semibold border border-[#A7F3D0]">
                  <span class="material-symbols-outlined text-[14px] text-[#059669]">cloud_done</span>
                  <span>Tersimpan Otomatis</span>
                </div>
              `}
            </div>
          </div>

          <!-- Header Formulir Evaluasi -->
          <div class="bg-white p-6 rounded-lg border border-[#CBD5E1] shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                    Kirkpatrick Level 3 (Behavior)
                  </span>
                  <span class="text-xs text-[#64748B] font-mono">ID Sesi: ${window.MASTER_DATA.config.sessionCode}</span>
                </div>
                <h1 class="text-xl font-bold text-[#172B3A] tracking-tight">
                  ${roleTitle}
                </h1>
                <p class="text-xs text-[#64748B] mt-0.5">
                  ${roleDesc}
                </p>
              </div>

              ${isReadOnly ? `
                <div class="flex flex-col sm:flex-row items-end sm:items-center gap-2.5">
                  <!-- Tab Pilihan Perspektif -->
                  <div class="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-[#CBD5E1]">
                    <button type="button" class="btn-persp-tab px-2.5 py-1 rounded text-xs font-semibold transition-all ${evalRoleKey === 'peserta' ? 'bg-[#006876] text-white shadow-sm' : 'text-[#64748B] hover:text-[#172B3A]'}" data-persp="peserta" title="Lihat Evaluasi Diri Peserta">
                      1. Diri Peserta
                    </button>
                    <button type="button" class="btn-persp-tab px-2.5 py-1 rounded text-xs font-semibold transition-all ${evalRoleKey === 'atasan' ? 'bg-[#006876] text-white shadow-sm' : 'text-[#64748B] hover:text-[#172B3A]'}" data-persp="atasan" title="Lihat Penilaian Atasan Langsung">
                      2. Atasan
                    </button>
                    <button type="button" class="btn-persp-tab px-2.5 py-1 rounded text-xs font-semibold transition-all ${evalRoleKey === 'koordinator' ? 'bg-[#006876] text-white shadow-sm' : 'text-[#64748B] hover:text-[#172B3A]'}" data-persp="koordinator" title="Lihat Penilaian Koordinator UPDL">
                      3. Koordinator
                    </button>
                  </div>

                  <!-- Dropdown Pilih Responden Lain -->
                  <select id="select-admin-respondent" class="text-xs p-1.5 bg-white border border-[#CBD5E1] rounded text-[#172B3A] font-medium">
                    ${window.appStore.respondents.map(r => `
                      <option value="${r.id}" ${r.id === respondent.id ? 'selected' : ''}>
                        ${r.nama} (NIP: ${r.nip})
                      </option>
                    `).join('')}
                  </select>
                </div>
              ` : (isEvaluator && assignedRespondents.length > 1) ? `
                <div class="flex items-center gap-2 bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
                  <label class="text-xs font-semibold text-[#172B3A] whitespace-nowrap flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-[#006876]">group</span>
                    Pilih Peserta:
                  </label>
                  <select id="select-evaluator-respondent" class="text-xs p-1.5 bg-white border border-[#CBD5E1] rounded text-[#172B3A] font-medium focus:outline-none focus:border-[#006876]">
                    ${assignedRespondents.map(r => {
                      const rProg = window.appStore.getEvaluationProgressForRole(r.id, evalRoleKey);
                      return `
                        <option value="${r.id}" ${r.id === respondent.id ? 'selected' : ''}>
                          ${r.nama} — ${rProg.status === 'SELESAI' ? '✓ Selesai' : `${rProg.percentage}%`}
                        </option>
                      `;
                    }).join('')}
                  </select>
                </div>
              ` : ''}
            </div>

            <!-- Identitas Lengkap Peserta Context -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-4">
              <div class="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                <span class="text-[10px] text-[#64748B] uppercase tracking-wider block">Peserta</span>
                <span class="font-bold text-[#172B3A]">${respondent.nama}</span>
              </div>
              <div class="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                <span class="text-[10px] text-[#64748B] uppercase tracking-wider block">NIP & Unit</span>
                <span class="font-mono text-[#172B3A]">${respondent.nip}</span> • <span>${respondent.unit}</span>
              </div>
              <div class="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                <span class="text-[10px] text-[#64748B] uppercase tracking-wider block">Atasan Langsung</span>
                <span class="font-bold text-[#172B3A] truncate block">${respondent.atasan.nama}</span>
              </div>
              <div class="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                <span class="text-[10px] text-[#64748B] uppercase tracking-wider block">Koordinator Program</span>
                <span class="font-bold text-[#172B3A] truncate block">${respondent.koordinatorEksternal.nama}</span>
              </div>
            </div>
          </div>

          <!-- Tahap 1: Validasi Kualifikasi Responden (Screening Awal Sesuai Excel) -->
          <div class="bg-white p-5 rounded-lg border border-[#CBD5E1] shadow-sm space-y-4">
            <div class="flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
              <span class="material-symbols-outlined text-[#006876] text-[20px]">fact_check</span>
              <h2 class="text-xs font-bold text-[#172B3A] uppercase tracking-wider">
                Tahap 1: Pertanyaan Validasi Kualifikasi Responden
              </h2>
            </div>
            
            <p class="text-xs text-[#64748B]">
              Sebelum mengisi butir efektivitas perilaku, konfirmasikan kesesuaian profil dan ketersediaan fasilitas di unit Anda:
            </p>

            <div class="space-y-3">
              ${window.MASTER_DATA.validationQuestions.map((q, idx) => {
                const isYes = validation[q.id] !== false;
                return `
                  <div class="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs" data-qid="${q.id}">
                    <div class="flex items-start gap-2 max-w-2xl">
                      <span class="font-bold text-[#006876]">${idx + 1}.</span>
                      <span class="text-[#172B3A] font-medium leading-relaxed">${q.text}</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0" data-group-qid="${q.id}">
                      <label class="label-valid-yes flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all select-none ${isReadOnly ? 'cursor-default pointer-events-none opacity-90' : 'cursor-pointer hover:shadow-sm'} ${
                        isYes 
                          ? 'bg-[#006876] text-white font-bold border-[#006876] shadow-sm' 
                          : 'bg-white border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]'
                      }">
                        <input type="radio" name="valid_${q.id}" value="yes" ${isYes ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''} class="sr-only radio-validation" data-qid="${q.id}" />
                        <span class="material-symbols-outlined text-[16px]">${isYes ? 'check_circle' : 'radio_button_unchecked'}</span>
                        <span>Ya, Sesuai</span>
                      </label>
                      <label class="label-valid-no flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all select-none ${isReadOnly ? 'cursor-default pointer-events-none opacity-90' : 'cursor-pointer hover:shadow-sm'} ${
                        !isYes 
                          ? 'bg-[#DC2626] text-white font-bold border-[#DC2626] shadow-sm' 
                          : 'bg-white border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]'
                      }">
                        <input type="radio" name="valid_${q.id}" value="no" ${!isYes ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''} class="sr-only radio-validation" data-qid="${q.id}" />
                        <span class="material-symbols-outlined text-[16px]">${!isYes ? 'cancel' : 'radio_button_unchecked'}</span>
                        <span>Tidak</span>
                      </label>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Tahap 2: Butir Evaluasi Perilaku (Sesuai Modul Excel) -->
          <div class="space-y-6">
            
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-bold text-[#172B3A] uppercase tracking-wider">
                  Tahap 2: Penilaian Butir Perilaku & Unggah Bukti
                </h2>
                <p class="text-xs text-[#64748B]">
                  Pilih skala penerapan 1 - 4 dan unggah bukti fisik (file JPG, PNG, atau PDF) untuk setiap butir
                </p>
              </div>

              <!-- Module Tabs (Jika lebih dari 1 modul) -->
              ${userModules.length > 1 ? `
                <div class="flex items-center gap-1 bg-[#E2E8F0] p-1 rounded text-xs">
                  <button type="button" class="tab-form-mod py-1 px-3 rounded font-semibold transition-colors ${this.activeModTab === 'ALL' ? 'bg-[#172B3A] text-white shadow-sm' : 'text-[#475569] hover:bg-white'}" data-mod="ALL">
                    Semua Bagian
                  </button>
                  ${userModules.map(m => `
                    <button type="button" class="tab-form-mod py-1 px-3 rounded font-semibold transition-colors ${this.activeModTab === m ? 'bg-[#172B3A] text-white shadow-sm' : 'text-[#475569] hover:bg-white'}" data-mod="${m}">
                      Bagian ${m}
                    </button>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <!-- Loop per Modul -->
            ${userModules.map(modCode => {
              const modData = window.MASTER_DATA.bankButir[modCode];
              if (!modData) return '';
              const isHidden = this.activeModTab !== 'ALL' && this.activeModTab !== modCode;

              return `
                <div class="module-card-section bg-white rounded-lg border border-[#CBD5E1] shadow-sm overflow-hidden space-y-4 ${isHidden ? 'hidden' : ''}" data-mod-key="${modCode}">
                  
                  <!-- Header Bagian Modul -->
                  <div class="p-4 bg-[#F8FAFC] border-b border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                      <span class="w-7 h-7 rounded bg-[#172B3A] text-white font-mono font-bold text-xs flex items-center justify-center">
                        ${modData.code}
                      </span>
                      <div>
                        <h3 class="text-xs font-bold text-[#172B3A] uppercase tracking-wide">
                          Bagian ${modData.code}: ${modData.title}
                        </h3>
                        <div class="text-[10px] text-[#64748B] font-mono">
                          Kode Diklat: ${modData.kodeDiklat} • Key Behavior: ${modData.keybe}
                        </div>
                      </div>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E2E8F0] text-[#172B3A]">
                      ${modData.items.length} Indikator
                    </span>
                  </div>

                  <!-- List Butir Pertanyaan -->
                  <div class="p-5 space-y-6">
                    ${modData.items.map((item, itemIdx) => {
                      // Text butir disesuaikan dengan perspektif
                      const itemWording = evalRoleKey === 'atasan' ? (item.perilakuAtasan || item.perilaku) : item.perilaku;
                      const activeScore = isEvaluator ? (ev[evalRoleKey]?.scores?.[item.id]) : (ev.peserta?.scores?.[item.id]);
                      const activeNote = isEvaluator ? (ev[evalRoleKey]?.notes?.[item.id] || '') : (ev.peserta?.notes?.[item.id] || '');
                      
                      // Bukti dan nilai dari peserta (bisa diobservasi oleh atasan dan koordinator)
                      const pesertaScore = ev.peserta?.scores?.[item.id];
                      const pesertaNote = ev.peserta?.notes?.[item.id];
                      const userFile = ev.peserta?.files?.[item.id] || null;

                      return `
                        <article class="p-4 rounded-lg border border-[#CBD5E1] bg-white space-y-4 relative" id="card-item-${item.id}">
                          
                          <!-- Title & Kompetensi -->
                          <div class="flex items-start justify-between gap-3">
                            <div class="flex items-start gap-2.5">
                              <span class="px-2 py-1 rounded bg-[#E2E8F0] font-mono font-bold text-xs text-[#006876] shrink-0">
                                ${item.id}
                              </span>
                              <div>
                                <span class="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                                  ${item.kompetensi}
                                </span>
                                <h4 class="text-xs md:text-sm font-semibold text-[#172B3A] mt-0.5 leading-snug">
                                  ${itemWording}
                                </h4>
                                ${isEvaluator && item.perilakuAtasan && evalRoleKey === 'atasan' ? `
                                  <div class="text-[11px] text-[#64748B] mt-0.5 italic">
                                    Pernyataan Peserta: "${item.perilaku}"
                                  </div>
                                ` : ''}
                              </div>
                            </div>

                            <div id="badge-status-${item.id}">
                              ${activeScore ? `
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] shrink-0">
                                  <span class="material-symbols-outlined text-[12px]">check</span> Dinilai (Skala ${activeScore})
                                </span>
                              ` : `
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shrink-0">
                                  Wajib Diisi
                                </span>
                              `}
                            </div>
                          </div>

                          <!-- Keterangan & Bukti Peserta (Observasi Penilai) -->
                          <div class="p-3 bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg space-y-2">
                            <div class="flex items-center gap-2 text-[11px] text-[#0F766E]">
                              <span class="material-symbols-outlined text-[16px] text-[#006876] shrink-0">info</span>
                              <span>Keterangan Bukti: <b>${item.contohBukti}</b></span>
                            </div>

                            ${isEvaluator ? `
                              <div class="pt-2 border-t border-[#CCFBF1]/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div class="bg-white p-2 rounded border border-[#99F6E4] flex items-center justify-between">
                                  <span class="text-[11px] text-[#64748B]">Penilaian Diri Peserta:</span>
                                  <span class="font-bold text-xs ${pesertaScore ? 'text-[#006876]' : 'text-[#94A3B8]'} font-tabular">
                                    ${pesertaScore ? `Skala ${pesertaScore}` : 'Belum dinilai'}
                                  </span>
                                </div>
                                <div class="bg-white p-2 rounded border border-[#99F6E4] flex items-center justify-between">
                                  <span class="text-[11px] text-[#64748B]">Dokumen Bukti Peserta:</span>
                                  ${userFile ? `
                                    <span class="font-semibold text-xs text-[#1D4ED8] truncate max-w-[150px] inline-flex items-center gap-1" title="${userFile.name}">
                                      <span class="material-symbols-outlined text-[14px]">attachment</span>
                                      ${userFile.name}
                                    </span>
                                  ` : '<span class="text-[11px] text-[#94A3B8] italic">Belum ada file</span>'}
                                </div>
                                ${pesertaNote ? `
                                  <div class="col-span-1 sm:col-span-2 bg-white p-2 rounded border border-[#99F6E4] text-[11px] text-[#172B3A]">
                                    <span class="text-[#64748B] font-medium">Catatan Peserta:</span> "${pesertaNote}"
                                  </div>
                                ` : ''}
                              </div>
                            ` : ''}
                          </div>

                          <!-- Pilihan Skala 1 - 4 (Radio Cards) -->
                          <div class="space-y-1.5">
                            <label class="block text-[11px] font-bold text-[#172B3A]">
                              ${isEvaluator ? 'Beri Penilaian Objektif Anda (Skala 1 - 4):' : 'Pilih Frekuensi & Konsistensi Penerapan (Skala 1 - 4):'}
                            </label>

                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                              ${window.MASTER_DATA.likertScale.map(scale => {
                                const isChecked = activeScore === scale.value;
                                return `
                                  <label class="item-scale-card p-3 rounded-lg border ${isReadOnly ? 'cursor-default pointer-events-none' : 'cursor-pointer'} transition-all flex flex-col justify-between ${
                                    isChecked 
                                      ? 'bg-[#E0F7FA] border-[#006876] text-[#004D57] shadow-sm ring-1 ring-[#006876]' 
                                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172B3A] ' + (isReadOnly ? 'opacity-60' : 'hover:bg-white hover:border-[#CBD5E1]')
                                  }">
                                    <div class="flex items-center justify-between mb-1.5">
                                      <span class="font-bold text-xs font-mono">[${scale.value}]</span>
                                      <input 
                                        type="radio" 
                                        name="score_${item.id}" 
                                        value="${scale.value}" 
                                        ${isChecked ? 'checked' : ''} 
                                        ${isReadOnly ? 'disabled' : ''}
                                        class="radio-item-score accent-[#006876]" 
                                        data-item="${item.id}" 
                                        data-resp="${respondent.id}" 
                                      />
                                    </div>
                                    <div>
                                      <div class="font-semibold text-xs">${scale.label}</div>
                                      <div class="text-[10px] text-[#64748B] mt-0.5 leading-tight">${scale.desc}</div>
                                    </div>
                                  </label>
                                `;
                              }).join('')}
                            </div>
                          </div>

                          <!-- Upload Bukti Dokumen (Khusus Peserta atau Peninjau Bukti) -->
                          ${(!isEvaluator || isReadOnly) ? `
                            <div class="space-y-2 pt-2 border-t border-[#F1F5F9]">
                              <label class="block text-[11px] font-bold text-[#172B3A] flex items-center justify-between">
                                <span class="flex items-center gap-1.5">
                                  <span class="material-symbols-outlined text-[15px] text-[#006876]">attachment</span>
                                  Dokumen Bukti Penerapan di Lapangan:
                                </span>
                                ${isReadOnly ? '' : '<span class="text-[10px] font-normal text-[#64748B]">PDF, Word, Excel, PPT, Gambar, ZIP (Maks. 25MB)</span>'}
                              </label>

                              <div id="file-slot-${item.id}">
                                ${userFile ? (() => {
                                  const b = this.getFileBadge(userFile.name, userFile.type);
                                  return `
                                    <!-- File Terunggah Card -->
                                    <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg flex items-center justify-between gap-3 text-xs">
                                      <div class="flex items-center gap-2.5 overflow-hidden">
                                        <div class="w-8 h-8 rounded ${b.bg} ${b.color} flex items-center justify-center shrink-0 border border-current/10">
                                          <span class="material-symbols-outlined text-[18px]">
                                            ${b.icon}
                                          </span>
                                        </div>
                                        <div class="overflow-hidden">
                                          <div class="font-bold text-[#172B3A] truncate text-xs flex items-center gap-1.5" title="${userFile.name}">
                                            <span class="truncate">${userFile.name}</span>
                                            <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${b.bg} ${b.color}">${b.label}</span>
                                          </div>
                                          <div class="text-[10px] text-[#64748B]">
                                            Ukuran: ${userFile.size || '1.2 MB'} • Diunggah: ${userFile.uploadedAt || 'Hari ini'}
                                          </div>
                                        </div>
                                      </div>

                                      <div class="flex items-center gap-1 shrink-0">
                                        ${userFile.dataUrl ? `
                                          <a href="${userFile.dataUrl}" download="${userFile.name}" class="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1" target="_blank" title="Unduh Berkas Dokumen">
                                            <span class="material-symbols-outlined text-[15px]">download</span>
                                            Unduh
                                          </a>
                                        ` : ''}
                                        ${isReadOnly ? '' : `
                                          <button type="button" class="btn-delete-file p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" data-item="${item.id}" data-resp="${respondent.id}" title="Hapus Berkas Dokumen">
                                            <span class="material-symbols-outlined text-[18px]">delete</span>
                                          </button>
                                        `}
                                      </div>
                                    </div>
                                  `;
                                })() : `
                                  ${isReadOnly ? `
                                    <div class="p-2.5 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-lg text-center text-xs text-[#94A3B8] italic">
                                      Belum ada dokumen bukti yang diunggah untuk butir ini.
                                    </div>
                                  ` : `
                                    <!-- Input File Dropzone Dokumen -->
                                    <div class="border-2 border-dashed border-[#CBD5E1] hover:border-[#006876] rounded-lg p-3 text-center bg-[#F8FAFC] hover:bg-[#F0FDFA] transition-colors relative cursor-pointer group">
                                      <input 
                                        type="file" 
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt,.csv,.zip,.rar" 
                                        class="input-file-upload absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                                        data-item="${item.id}" 
                                        data-resp="${respondent.id}" 
                                      />
                                      <div class="flex items-center justify-center gap-2 text-xs text-[#64748B] group-hover:text-[#172B3A]">
                                        <span class="material-symbols-outlined text-[20px] text-[#006876]">upload_file</span>
                                        <span class="font-medium text-[#172B3A]">Pilih Dokumen Bukti (PDF, DOCX, XLSX, PPTX, JPG, ZIP)</span>
                                        <span class="text-[10px] text-[#94A3B8]">(atau seret file ke sini)</span>
                                      </div>
                                    </div>
                                  `}
                                `}
                              </div>
                            </div>
                          ` : userFile ? `
                            <!-- Preview Bukti Peserta untuk Evaluator -->
                            <div class="pt-2 border-t border-[#F1F5F9] text-xs">
                              <span class="text-[11px] font-bold text-[#172B3A] block mb-1.5">Berkas Bukti Terlampir dari Peserta:</span>
                              ${(() => {
                                const b = this.getFileBadge(userFile.name, userFile.type);
                                return `
                                  <div class="p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded flex items-center justify-between gap-2">
                                    <div class="flex items-center gap-2 overflow-hidden">
                                      <span class="material-symbols-outlined text-[18px] ${b.color}">${b.icon}</span>
                                      <span class="font-medium text-xs text-[#172B3A] truncate">${userFile.name}</span>
                                      <span class="text-[10px] text-[#64748B]">(${userFile.size || ''})</span>
                                    </div>
                                    ${userFile.dataUrl ? `
                                      <a href="${userFile.dataUrl}" download="${userFile.name}" class="btn-secondary text-[11px] py-1 px-2.5 shrink-0 flex items-center gap-1" target="_blank">
                                        <span class="material-symbols-outlined text-[14px]">download</span>
                                        Unduh Bukti
                                      </a>
                                    ` : ''}
                                  </div>
                                `;
                              })()}
                            </div>
                          ` : ''}

                          <!-- Catatan Deskriptif / Uraian Singkat Lapangan -->
                          <div class="pt-2">
                            <label class="block text-[11px] font-semibold text-[#64748B] mb-1">
                              ${isEvaluator ? 'Catatan Observasi / Umpan Balik untuk Peserta (Opsional):' : 'Catatan Tambahan Penerapan di Lapangan (Opsional):'}
                            </label>
                            <input 
                              type="text" 
                              value="${activeNote}" 
                              placeholder="${isReadOnly ? (activeNote ? '' : 'Tidak ada catatan.') : (isEvaluator ? 'Tuliskan catatan observasi kerja atau evaluasi peserta...' : 'Tuliskan keterangan singkat terkait lokasi gardu/temuan/kegiatan...')}" 
                              class="input-item-note w-full p-2 ${isReadOnly ? 'bg-[#F8FAFC] cursor-not-allowed text-[#475569]' : 'bg-white text-[#172B3A]'} border border-[#CBD5E1] rounded text-xs focus:outline-none focus:border-[#006876]" 
                              data-item="${item.id}" 
                              data-resp="${respondent.id}" 
                              ${isReadOnly ? 'disabled readonly' : ''}
                            />
                          </div>

                        </article>
                      `;
                    }).join('')}
                  </div>

                </div>
              `;
            }).join('')}

          </div>

          <!-- Bottom Action Buttons Toolbar -->
          <div class="p-4 bg-white rounded-lg border border-[#CBD5E1] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="text-xs text-[#64748B]">
              Status Formulir (${evalRoleKey === 'peserta' ? 'Diri Peserta' : (evalRoleKey === 'atasan' ? 'Atasan Langsung' : 'Koordinator')}): <b id="form-bottom-status-text" class="${progress.isComplete ? 'text-[#059669]' : 'text-[#D97706]'}">
                ${progress.status === 'SELESAI' ? 'Selesai Terverifikasi' : progress.isComplete ? 'Lengkap (Siap Dikirim)' : 'Belum Lengkap'}
              </b>
            </div>

            <div class="flex items-center gap-2">
              ${isReadOnly ? `
                <button type="button" id="btn-footer-back-peserta" class="btn-primary text-xs flex items-center gap-1.5 shadow-sm">
                  <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                  Kembali ke Data Peserta
                </button>
              ` : `
                <button type="button" id="btn-save-draft" class="btn-secondary text-xs">
                  <span class="material-symbols-outlined text-[16px]">save</span>
                  Simpan Draf
                </button>
                <button type="button" id="btn-submit-final" class="btn-primary text-xs flex items-center gap-1.5 ${progress.status === 'SELESAI' ? 'opacity-50 cursor-not-allowed' : ''}">
                  <span class="material-symbols-outlined text-[16px]">send</span>
                  ${progress.status === 'SELESAI' ? 'Sudah Terkirim' : (isEvaluator ? 'Kirim Penilaian Selesai' : 'Kirim Evaluasi Final')}
                </button>
              `}
            </div>
          </div>

        </div>
      `;

      this.attachEvents(container, respondent);
    },

    showAutoSaveBadge: function () {
      const badge = document.getElementById('autosave-status-badge');
      if (badge) {
        badge.innerHTML = `
          <span class="material-symbols-outlined text-[14px] text-[#059669]">check_circle</span>
          <span>Tersimpan Otomatis</span>
        `;
        badge.classList.remove('opacity-70');
        badge.classList.add('bg-[#ECFDF5]', 'text-[#065F46]');
      }
    },

    updateProgressUI: function (respId) {
      const currentRole = window.appStore.getRole();
      const evalRoleKey = (currentRole === 'atasan' || currentRole.includes('koordinator')) ? (currentRole === 'atasan' ? 'atasan' : 'koordinator') : 'peserta';
      const isEvaluator = currentRole === 'atasan' || currentRole.includes('koordinator');

      const progress = isEvaluator 
        ? window.appStore.getEvaluationProgressForRole(respId, evalRoleKey)
        : window.appStore.getPesertaProgress(respId);

      const progressBar = document.getElementById('form-progress-bar');
      if (progressBar) progressBar.style.width = `${progress.percentage}%`;

      const progressText = document.getElementById('form-progress-text');
      if (progressText) {
        progressText.textContent = `${progress.filled} dari ${progress.total} Butir Terisi (${progress.percentage}%)`;
      }

      const bottomStatus = document.getElementById('form-bottom-status-text');
      if (bottomStatus) {
        bottomStatus.className = progress.isComplete ? 'text-[#059669]' : 'text-[#D97706]';
        bottomStatus.textContent = progress.status === 'SELESAI' 
          ? 'Selesai Terverifikasi' 
          : progress.isComplete 
            ? 'Lengkap (Siap Dikirim)' 
            : 'Belum Lengkap';
      }

      const submitBtn = document.getElementById('btn-submit-final');
      if (submitBtn) {
        if (progress.status === 'SELESAI') {
          submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
          submitBtn.textContent = 'Sudah Terkirim';
        } else {
          submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          submitBtn.innerHTML = `
            <span class="material-symbols-outlined text-[16px]">send</span>
            ${isEvaluator ? 'Kirim Penilaian Selesai' : 'Kirim Evaluasi Final'}
          `;
        }
      }
    },

    getFileBadge: function (name = '', type = '') {
      const ext = (name.split('.').pop() || '').toLowerCase();
      if (['pdf'].includes(ext) || (type && type.includes('pdf'))) {
        return { icon: 'picture_as_pdf', color: 'text-[#DC2626]', bg: 'bg-[#FEF2F2]', label: 'PDF' };
      }
      if (['doc', 'docx'].includes(ext) || (type && type.includes('word'))) {
        return { icon: 'description', color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]', label: 'DOC' };
      }
      if (['xls', 'xlsx', 'csv'].includes(ext) || (type && (type.includes('excel') || type.includes('spreadsheet')))) {
        return { icon: 'table_chart', color: 'text-[#059669]', bg: 'bg-[#ECFDF5]', label: 'XLS' };
      }
      if (['ppt', 'pptx'].includes(ext) || (type && type.includes('presentation'))) {
        return { icon: 'slideshow', color: 'text-[#D97706]', bg: 'bg-[#FFFBEB]', label: 'PPT' };
      }
      if (['zip', 'rar', '7z'].includes(ext)) {
        return { icon: 'folder_zip', color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]', label: 'ZIP' };
      }
      if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || (type && type.includes('image'))) {
        return { icon: 'image', color: 'text-[#0284C7]', bg: 'bg-[#F0F9FF]', label: 'IMG' };
      }
      return { icon: 'article', color: 'text-[#475569]', bg: 'bg-[#F8FAFC]', label: 'DOC' };
    },

    renderFileSlot: function (container, respId, itemId, fileData) {
      const slot = document.getElementById(`file-slot-${itemId}`);
      if (!slot) return;

      if (fileData) {
        const b = this.getFileBadge(fileData.name, fileData.type);
        slot.innerHTML = `
          <!-- File Terunggah Card -->
          <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg flex items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2.5 overflow-hidden">
              <div class="w-8 h-8 rounded ${b.bg} ${b.color} flex items-center justify-center shrink-0 border border-current/10">
                <span class="material-symbols-outlined text-[18px]">
                  ${b.icon}
                </span>
              </div>
              <div class="overflow-hidden">
                <div class="font-bold text-[#172B3A] truncate text-xs flex items-center gap-1.5" title="${fileData.name}">
                  <span class="truncate">${fileData.name}</span>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${b.bg} ${b.color}">${b.label}</span>
                </div>
                <div class="text-[10px] text-[#64748B]">
                  Ukuran: ${fileData.size || '1.2 MB'} • Diunggah: ${fileData.uploadedAt || 'Hari ini'}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              ${fileData.dataUrl ? `
                <a href="${fileData.dataUrl}" download="${fileData.name}" class="p-1.5 text-[#006876] hover:bg-[#E0F2FE] rounded transition-colors" title="Unduh Dokumen">
                  <span class="material-symbols-outlined text-[18px]">download</span>
                </a>
              ` : ''}
              <button type="button" class="btn-delete-file p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" data-item="${itemId}" data-resp="${respId}" title="Hapus Berkas">
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        `;
        slot.querySelector('.btn-delete-file')?.addEventListener('click', () => {
          window.appStore.deletePesertaFile(respId, itemId, true);
          this.renderFileSlot(container, respId, itemId, null);
          this.updateProgressUI(respId);
          window.App.showToast(`Berkas bukti butir ${itemId} dihapus.`, 'info');
        });
      } else {
        slot.innerHTML = `
          <!-- Input File Dropzone Dokumen -->
          <div class="border-2 border-dashed border-[#CBD5E1] hover:border-[#006876] rounded-lg p-3 text-center bg-[#F8FAFC] hover:bg-[#F0FDFA] transition-colors relative cursor-pointer group">
            <input 
              type="file" 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt,.csv,.zip,.rar" 
              class="input-file-upload absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
              data-item="${itemId}" 
              data-resp="${respId}" 
            />
            <div class="flex items-center justify-center gap-2 text-xs text-[#64748B] group-hover:text-[#172B3A]">
              <span class="material-symbols-outlined text-[20px] text-[#006876]">upload_file</span>
              <span class="font-medium text-[#172B3A]">Pilih Dokumen Bukti (PDF, DOCX, XLSX, PPTX, JPG, ZIP)</span>
              <span class="text-[10px] text-[#94A3B8]">(atau seret file ke sini)</span>
            </div>
          </div>
        `;
        slot.querySelector('.input-file-upload')?.addEventListener('change', (e) => {
          this.handleFileUpload(e, container, respId, itemId);
        });
      }
    },

    handleFileUpload: function (e, container, respId, itemId) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const allowedExts = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|webp|txt|csv|zip|rar)$/i;
      if (!file.name.match(allowedExts)) {
        window.App.showToast('Format dokumen tidak didukung. Harap pilih PDF, Word, Excel, PPT, Gambar, atau ZIP.', 'error');
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        window.App.showToast('Ukuran dokumen melebihi batas maksimal 25MB.', 'error');
        return;
      }

      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      const saveAndRender = (dataUrl = null) => {
        const fileData = {
          name: file.name,
          size: sizeStr,
          type: file.type || 'application/octet-stream',
          dataUrl: dataUrl,
          uploadedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        };

        window.appStore.savePesertaItemAnswer(respId, itemId, { file: fileData }, true);
        this.showAutoSaveBadge();
        this.renderFileSlot(container, respId, itemId, fileData);
        this.updateProgressUI(respId);
        window.App.showToast(`Dokumen bukti "${file.name}" berhasil diunggah untuk butir ${itemId}.`, 'success');
      };

      if (file.size <= 5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          saveAndRender(loadEvt.target.result);
        };
        reader.onerror = () => {
          saveAndRender(null);
        };
        reader.readAsDataURL(file);
      } else {
        saveAndRender(null);
      }
    },

    attachEvents: function (container, respondent) {
      const respId = respondent.id;
      const currentRole = window.appStore.getRole();
      if (currentRole === 'peserta') {
        this.isReadOnly = false;
      }
      const isReadOnly = (this.isReadOnly === true);
      const evalRoleKey = (isReadOnly && this.viewPerspective)
        ? this.viewPerspective
        : ((currentRole === 'atasan' || currentRole.includes('koordinator')) ? (currentRole === 'atasan' ? 'atasan' : 'koordinator') : 'peserta');
      const isEvaluator = currentRole === 'atasan' || currentRole.includes('koordinator');

      // Filter Modul Tab (Smooth filter in-place without page jump)
      container.querySelectorAll('.tab-form-mod').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const modKey = e.currentTarget.getAttribute('data-mod');
          this.activeModTab = modKey;

          container.querySelectorAll('.tab-form-mod').forEach(b => {
            const isTarget = b.getAttribute('data-mod') === modKey;
            b.className = `tab-form-mod py-1 px-3 rounded font-semibold transition-colors ${
              isTarget ? 'bg-[#172B3A] text-white shadow-sm' : 'text-[#475569] hover:bg-white'
            }`;
          });

          container.querySelectorAll('.module-card-section').forEach(sec => {
            const secMod = sec.getAttribute('data-mod-key');
            if (modKey === 'ALL' || secMod === modKey) {
              sec.classList.remove('hidden');
            } else {
              sec.classList.add('hidden');
            }
          });
        });
      });

      // Tombol Kembali ke Data Peserta (Read-Only Mode)
      const handleBackToPeserta = () => {
        this.isReadOnly = false;
        window.appStore.setView('peserta-list');
      };
      container.querySelector('#btn-back-to-peserta-list')?.addEventListener('click', handleBackToPeserta);
      container.querySelector('#btn-footer-back-peserta')?.addEventListener('click', handleBackToPeserta);

      // Tab Ganti Perspektif Evaluasi (Khusus Read-Only / Admin Inspection)
      container.querySelectorAll('.btn-persp-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const persp = e.currentTarget.getAttribute('data-persp');
          if (persp) {
            this.viewPerspective = persp;
            this.render(container);
          }
        });
      });

      // Switch Responden untuk Admin (Pindah subjek evaluasi)
      container.querySelector('#select-admin-respondent')?.addEventListener('change', (e) => {
        const newId = Number(e.target.value);
        window.appStore.setActiveRespondentId(newId);
        if (window.App && window.App.router) {
          window.App.router.syncBrowserUrl('formulir', window.appStore.getRole(), { respondentId: newId });
        }
        this.render(container);
      });

      // Switch Responden untuk Evaluator (Atasan / Koordinator)
      container.querySelector('#select-evaluator-respondent')?.addEventListener('change', (e) => {
        const newId = Number(e.target.value);
        window.appStore.setActiveRespondentId(newId);
        if (window.App && window.App.router) {
          window.App.router.syncBrowserUrl('formulir', window.appStore.getRole(), { respondentId: newId });
        }
        this.render(container);
      });

      // Jika dalam mode Read-Only / Admin Inspection, proteksi penuh: JANGAN bind event pengubahan formulir!
      if (isReadOnly) {
        return;
      }

      // Validasi Screening Radio (In-place auto-save & visual update responsif)
      const updateValidationVisual = (group, isYes) => {
        if (!group) return;
        const yesLabel = group.querySelector('.label-valid-yes');
        const noLabel = group.querySelector('.label-valid-no');
        if (yesLabel && noLabel) {
          if (isYes) {
            yesLabel.className = 'label-valid-yes flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all select-none cursor-pointer hover:shadow-sm bg-[#006876] text-white font-bold border-[#006876] shadow-sm';
            const yesIcon = yesLabel.querySelector('.material-symbols-outlined');
            if (yesIcon) yesIcon.textContent = 'check_circle';

            noLabel.className = 'label-valid-no flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all select-none cursor-pointer hover:shadow-sm bg-white border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]';
            const noIcon = noLabel.querySelector('.material-symbols-outlined');
            if (noIcon) noIcon.textContent = 'radio_button_unchecked';
          } else {
            yesLabel.className = 'label-valid-yes flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all select-none cursor-pointer hover:shadow-sm bg-white border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]';
            const yesIcon = yesLabel.querySelector('.material-symbols-outlined');
            if (yesIcon) yesIcon.textContent = 'radio_button_unchecked';

            noLabel.className = 'label-valid-no flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all select-none cursor-pointer hover:shadow-sm bg-[#DC2626] text-white font-bold border-[#DC2626] shadow-sm';
            const noIcon = noLabel.querySelector('.material-symbols-outlined');
            if (noIcon) noIcon.textContent = 'cancel';
          }
        }
      };

      container.querySelectorAll('.radio-validation').forEach(radio => {
        radio.addEventListener('change', (e) => {
          const qid = e.target.getAttribute('data-qid');
          const isYes = e.target.value === 'yes';
          const update = {};
          update[qid] = isYes;
          window.appStore.updateValidation(respId, update, true);
          this.showAutoSaveBadge();

          const group = e.target.closest('[data-group-qid]');
          updateValidationVisual(group, isYes);
          window.App.showToast(`Validasi kualifikasi butir ${qid.toUpperCase()} tersimpan: ${isYes ? 'Ya, Sesuai' : 'Tidak'}.`, 'info');
        });
      });

      // Click handler eksplisit pada label untuk memastikan respons instan
      container.querySelectorAll('.label-valid-yes, .label-valid-no').forEach(lbl => {
        lbl.addEventListener('click', (e) => {
          if (isReadOnly) return;
          const radio = lbl.querySelector('.radio-validation');
          if (radio && !radio.checked) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });

      // Pemilihan Skala 1 - 4 (Auto-save in-place tanpa jumping / force up back)
      container.querySelectorAll('.radio-item-score').forEach(radio => {
        radio.addEventListener('change', (e) => {
          const itemId = e.target.getAttribute('data-item');
          const score = Number(e.target.value);
          
          if (isEvaluator) {
            window.appStore.saveEvaluatorItemAnswer(respId, evalRoleKey, itemId, { score: score }, true);
          } else {
            window.appStore.savePesertaItemAnswer(respId, itemId, { score: score }, true);
          }
          this.showAutoSaveBadge();

          // 1. Update visual cards in this item group
          const card = document.getElementById(`card-item-${itemId}`);
          if (card) {
            card.querySelectorAll('.item-scale-card').forEach(c => {
              c.classList.remove('bg-[#E0F7FA]', 'border-[#006876]', 'text-[#004D57]', 'shadow-sm');
              c.classList.add('bg-[#F8FAFC]', 'border-[#E2E8F0]', 'text-[#172B3A]');
            });
            const selectedCard = e.target.closest('.item-scale-card');
            if (selectedCard) {
              selectedCard.classList.remove('bg-[#F8FAFC]', 'border-[#E2E8F0]', 'text-[#172B3A]');
              selectedCard.classList.add('bg-[#E0F7FA]', 'border-[#006876]', 'text-[#004D57]', 'shadow-sm');
            }
          }

          // 2. Update status badge on item header
          const badgeEl = document.getElementById(`badge-status-${itemId}`);
          if (badgeEl) {
            badgeEl.innerHTML = `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] shrink-0">
                <span class="material-symbols-outlined text-[12px]">check</span> ${isEvaluator ? 'Dinilai' : 'Terisi'} (Skala ${score})
              </span>
            `;
          }

          // 3. Update sticky progress bar & footer status
          this.updateProgressUI(respId);
          window.App.showToast(`Skala ${score} untuk butir ${itemId} tersimpan otomatis.`, 'info');
        });
      });

      // Input Catatan (Auto-save saat berhenti mengetik / blur tanpa re-render)
      container.querySelectorAll('.input-item-note').forEach(input => {
        input.addEventListener('change', (e) => {
          const itemId = e.target.getAttribute('data-item');
          const note = e.target.value.trim();

          if (isEvaluator) {
            window.appStore.saveEvaluatorItemAnswer(respId, evalRoleKey, itemId, { note: note }, true);
          } else {
            window.appStore.savePesertaItemAnswer(respId, itemId, { note: note }, true);
          }
          this.showAutoSaveBadge();
        });
      });

      // Upload File Bukti (In-place slot update)
      container.querySelectorAll('.input-file-upload').forEach(input => {
        input.addEventListener('change', (e) => {
          const itemId = e.target.getAttribute('data-item');
          this.handleFileUpload(e, container, respId, itemId);
        });
      });

      // Hapus File Bukti (In-place slot update)
      container.querySelectorAll('.btn-delete-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const itemId = e.currentTarget.getAttribute('data-item');
          window.appStore.deletePesertaFile(respId, itemId, true);
          this.renderFileSlot(container, respId, itemId, null);
          this.updateProgressUI(respId);
          window.App.showToast(`Berkas bukti butir ${itemId} dihapus.`, 'info');
        });
      });

      // Simpan Draf Button
      container.querySelector('#btn-save-draft')?.addEventListener('click', () => {
        window.App.showToast('Semua progres draf formulir telah tersimpan dengan aman.', 'success');
      });

      // Kirim Evaluasi Final Button
      container.querySelector('#btn-submit-final')?.addEventListener('click', () => {
        const progress = isEvaluator 
          ? window.appStore.getEvaluationProgressForRole(respId, evalRoleKey)
          : window.appStore.getPesertaProgress(respId);

        if (!progress.isComplete) {
          window.App.showModal({
            title: 'Formulir Belum Lengkap',
            content: `
              <div class="space-y-3 text-xs text-[#172B3A]">
                <p>Anda baru menilai <b>${progress.filled} dari ${progress.total} butir</b> indikator untuk peserta ini.</p>
                <div class="p-3 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] rounded">
                  Mohon lengkapi seluruh butir indikator sebelum mengirimkan hasil akhir penilaian.
                </div>
              </div>
            `,
            confirmText: 'Lanjutkan Penilaian',
            onConfirm: () => {}
          });
          return;
        }

        window.App.showModal({
          title: isEvaluator ? `Konfirmasi Pengiriman Penilaian ${currentRole === 'atasan' ? 'Atasan Langsung' : 'Koordinator'}` : 'Konfirmasi Pengiriman Evaluasi Level 3',
          content: `
            <div class="space-y-3 text-xs text-[#172B3A]">
              <p>Apakah Anda yakin ingin menyelesaikan dan mengirimkan hasil penilaian ini?</p>
              <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-1">
                <div>Peserta Dinilai: <b>${respondent.nama}</b> (NIP: ${respondent.nip})</div>
                <div>Jumlah Butir Terisi: <b>${progress.filled} dari ${progress.total} Butir (100%)</b></div>
                <div>Perspektif Penilai: <b>${currentRole === 'atasan' ? 'Atasan Langsung' : currentRole.includes('koordinator') ? 'Koordinator Program' : 'Mandiri'}</b></div>
              </div>
              <p class="text-[#64748B]">
                Setelah dikirim, status evaluasi peserta ini akan diperbarui menjadi SELESAI untuk perspektif ${evalRoleKey}.
              </p>
            </div>
          `,
          confirmText: 'Kirim Sekarang',
          onConfirm: () => {
            if (isEvaluator) {
              window.appStore.submitEvaluatorEvaluation(respId, evalRoleKey);
              window.App.showToast(`Penilaian untuk ${respondent.nama} berhasil disimpan dan disahkan!`, 'success');
            } else {
              window.appStore.submitPesertaEvaluation(respId);
              window.App.showToast('Evaluasi diri Level 3 berhasil dikirimkan ke Atasan Langsung & Koordinator.', 'success');
            }
            this.render(container);
          }
        });
      });
    }
  };
})();
