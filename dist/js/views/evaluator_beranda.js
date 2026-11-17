/**
 * View: Beranda Evaluator (Khusus Atasan Langsung & Koordinator)
 * Menampilkan daftar peserta binaan/bawahan, status kelengkapan 360°, dan akses langsung ke formulir per peserta.
 */

(function () {
  window.EvaluatorBerandaView = {
    render: function (container) {
      const user = window.authManager.getUser();
      const currentRole = window.appStore.getRole();
      const isAtasan = currentRole === 'atasan';
      const evalRoleKey = isAtasan ? 'atasan' : 'koordinator';

      const assignedRespondents = window.appStore.getAssignedRespondentsForUser(user);
      const totalAssigned = assignedRespondents.length;

      let completedCount = 0;
      let inProgressCount = 0;
      let unstartedCount = 0;

      assignedRespondents.forEach(r => {
        const prog = window.appStore.getEvaluationProgressForRole(r.id, evalRoleKey);
        if (prog.status === 'SELESAI') completedCount++;
        else if (prog.filled > 0) inProgressCount++;
        else unstartedCount++;
      });

      const overallPct = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

      container.innerHTML = `
        <div class="flex flex-col gap-6">
          
          <!-- Header Portal Evaluator -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col gap-1 max-w-3xl">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                  PLN Impact Lab (PIL)
                </span>
                <span class="text-xs text-[#64748B] font-mono">#EV3-MTR-2024.1</span>
                <span class="text-xs text-[#94A3B8]">•</span>
                <span class="text-xs text-[#64748B]">
                  ${isAtasan ? 'Portal Evaluasi Atasan Langsung' : 'Portal Evaluasi Koordinator Program'}
                </span>
              </div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">
                ${isAtasan ? 'Daftar Bawahan & Penilaian Lapangan' : 'Daftar Peserta & Verifikasi Mutu'}
              </h1>
              <p class="text-xs md:text-sm text-[#64748B] leading-relaxed">
                ${isAtasan 
                  ? `Evaluasi observasi implementasi perilaku peserta bawahan Anda di unit kerja <b>${user.unitName || user.unit || 'PLN Unit'}</b>.`
                  : `Verifikasi mutu kesesuaian silabus dan pembuktian kinerja peserta binaan program pembelajaran.`}
              </p>
            </div>

            <!-- Profile Summary Ribbon -->
            <div class="flex items-center gap-3 bg-white p-3 rounded-lg border border-[#CBD5E1] shadow-sm">
              <div class="w-10 h-10 rounded-full bg-[#172B3A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                ${(user.nama || 'A').charAt(0).toUpperCase()}
              </div>
              <div class="text-xs">
                <div class="font-bold text-[#172B3A]">${user.nama}</div>
                <div class="text-[11px] text-[#64748B]">NIP: <span class="font-mono">${user.nip}</span> • ${user.jabatan || 'Evaluator'}</div>
              </div>
            </div>
          </div>

          <!-- Section: Kartu Statistik Ringkas Evaluator -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="bg-white p-4 rounded-lg border border-[#CBD5E1] shadow-sm flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[24px]">group</span>
              </div>
              <div>
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Total Peserta Binaan</span>
                <span class="text-2xl font-bold text-[#172B3A] font-tabular">${totalAssigned}</span>
                <span class="text-[10px] text-[#64748B] block mt-0.5">Pegawai Terdaftar</span>
              </div>
            </div>

            <div class="bg-white p-4 rounded-lg border border-[#CBD5E1] shadow-sm flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-[#ECFDF5] text-[#065F46] flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div>
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Telah Anda Nilai</span>
                <span class="text-2xl font-bold text-[#059669] font-tabular">${completedCount}</span>
                <span class="text-[10px] text-[#64748B] block mt-0.5">Status SELESAI (${overallPct}%)</span>
              </div>
            </div>

            <div class="bg-white p-4 rounded-lg border border-[#CBD5E1] shadow-sm flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-[#FFFBEB] text-[#B45309] flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[24px]">pending_actions</span>
              </div>
              <div>
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Sedang Draf</span>
                <span class="text-2xl font-bold text-[#D97706] font-tabular">${inProgressCount}</span>
                <span class="text-[10px] text-[#64748B] block mt-0.5">Sebagian Butir Terisi</span>
              </div>
            </div>

            <div class="bg-white p-4 rounded-lg border border-[#CBD5E1] shadow-sm flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-[#FEF2F2] text-[#B91C1C] flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[24px]">schedule</span>
              </div>
              <div>
                <span class="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Belum Dinilai</span>
                <span class="text-2xl font-bold text-[#DC2626] font-tabular">${unstartedCount}</span>
                <span class="text-[10px] text-[#64748B] block mt-0.5">Perlu Tindak Lanjut</span>
              </div>
            </div>

          </div>

          <!-- Section: Tabel Daftar Peserta Binaan & Progres Form Evaluasi -->
          <div class="bg-white rounded-lg border border-[#CBD5E1] shadow-sm overflow-hidden flex flex-col">
            
            <div class="p-4 border-b border-[#CBD5E1] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-bold text-[#172B3A] uppercase tracking-wider">
                  ${isAtasan ? 'Daftar Bawahan / Peserta yang Diawasi' : 'Daftar Peserta Terverifikasi'}
                </h2>
                <p class="text-xs text-[#64748B]">
                  Pilih peserta untuk melihat dokumen bukti dan mengisi lembar evaluasi secara mandiri per pegawai
                </p>
              </div>

              <!-- Search filter box -->
              <div class="relative w-full sm:w-64">
                <span class="material-symbols-outlined absolute left-2.5 top-2 text-[#94A3B8] text-[18px]">search</span>
                <input
                  id="evaluator-search-input"
                  type="text"
                  placeholder="Cari NIP atau nama peserta..."
                  class="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#006876] text-[#172B3A]"
                />
              </div>
            </div>

            <!-- Tabel Responsif Daftar Peserta -->
            <div class="overflow-x-auto w-full">
              <table class="w-full text-left border-collapse text-xs min-w-[850px]">
                <thead>
                  <tr class="bg-[#F8FAFC] text-[#475569] uppercase font-bold text-[11px] border-b border-[#CBD5E1]">
                    <th class="py-3 px-4 w-12 text-center">No</th>
                    <th class="py-3 px-4 min-w-[200px]">Data Peserta</th>
                    <th class="py-3 px-4 min-w-[140px]">Unit Kerja</th>
                    <th class="py-3 px-4 min-w-[100px]">Modul</th>
                    <th class="py-3 px-3 text-center">Form Peserta</th>
                    <th class="py-3 px-3 text-center">Penilaian Anda</th>
                    <th class="py-3 px-4 text-center min-w-[160px]">Progres Anda</th>
                    <th class="py-3 px-4 text-right min-w-[140px]">Aksi Evaluasi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]" id="evaluator-table-body">
                  ${assignedRespondents.length === 0 ? `
                    <tr>
                      <td colspan="8" class="py-10 text-center text-[#64748B]">
                        <span class="material-symbols-outlined text-4xl text-[#94A3B8] mb-2 block">person_off</span>
                        <div class="font-bold text-sm text-[#172B3A]">Belum Ada Peserta yang Ditetapkan</div>
                        <div class="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
                          Belum ada peserta pelatihan yang ditugaskan kepada Anda sebagai evaluator. Hubungi Administrator Penyelenggara untuk penetapan penugasan.
                        </div>
                      </td>
                    </tr>
                  ` : assignedRespondents.map((r, idx) => {
                    const ev = window.appStore.getEvaluation(r.id);
                    const pStatus = ev.peserta?.status || 'BELUM';
                    const evalProg = window.appStore.getEvaluationProgressForRole(r.id, evalRoleKey);
                    const isDone = evalProg.status === 'SELESAI';

                    return `
                      <tr class="evaluator-row hover:bg-[#F0FDFA] transition-colors" data-search="${(r.nama + ' ' + (r.nip || '') + ' ' + (r.jabatan || '') + ' ' + (r.unit || '')).toLowerCase()}">
                        <td class="py-3.5 px-4 text-center font-mono text-[#64748B]">${idx + 1}</td>
                        <td class="py-3.5 px-4">
                          <div class="font-bold text-[#172B3A] text-xs">${r.nama}</div>
                          <div class="text-[11px] text-[#64748B] font-mono">NIP: ${r.nip}</div>
                          <div class="text-[10px] text-[#94A3B8] truncate max-w-[200px]">${r.jabatan}</div>
                        </td>
                        <td class="py-3.5 px-4">
                          <div class="font-medium text-[#172B3A]">${r.unit}</div>
                        </td>
                        <td class="py-3.5 px-4">
                          <div class="flex items-center gap-1">
                            ${(r.modules || ['A']).map(m => `
                              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-[#E2E8F0] text-[#172B3A]">
                                ${m}
                              </span>
                            `).join('')}
                          </div>
                        </td>

                        <!-- Status Peserta (Self-assessment) -->
                        <td class="py-3.5 px-3 text-center">
                          <span class="badge-pill ${pStatus === 'SELESAI' ? 'badge-peserta-selesai' : 'badge-peserta-belum'}">
                            ${pStatus === 'SELESAI' ? '✓ Sudah Kirim' : 'Belum Selesai'}
                          </span>
                        </td>

                        <!-- Status Evaluator Anda -->
                        <td class="py-3.5 px-3 text-center">
                          <span class="badge-pill ${isDone ? 'badge-atasan-selesai' : evalProg.filled > 0 ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]' : 'badge-atasan-belum'}">
                            ${isDone ? '✓ Selesai' : evalProg.filled > 0 ? 'Sedang Draf' : 'Belum Diisi'}
                          </span>
                        </td>

                        <!-- Progres Bar Anda -->
                        <td class="py-3.5 px-4">
                          <div class="flex items-center justify-between text-[10px] text-[#64748B] mb-1 font-tabular">
                            <span>${evalProg.filled}/${evalProg.total} Butir</span>
                            <span class="font-bold text-[#172B3A]">${evalProg.percentage}%</span>
                          </div>
                          <div class="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                            <div class="bg-[#006876] h-full rounded-full" style="width: ${evalProg.percentage}%"></div>
                          </div>
                        </td>

                        <!-- Aksi Pengisian Formulir Per Peserta -->
                        <td class="py-3.5 px-4 text-right">
                          <button class="btn-fill-evaluator btn-primary text-[11px] py-1.5 px-3 shadow-xs inline-flex items-center gap-1.5" data-id="${r.id}">
                            <span class="material-symbols-outlined text-[15px]">${isDone ? 'edit_note' : 'edit_document'}</span>
                            <span>${isDone ? 'Lihat / Ubah' : 'Isi Form'}</span>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                  <tr id="evaluator-empty-search-row" class="hidden">
                    <td colspan="8" class="py-8 text-center text-[#64748B]">
                      <span class="material-symbols-outlined text-3xl text-[#94A3B8] mb-1 block">search_off</span>
                      Tidak ada peserta yang cocok dengan kata kunci pencarian.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

        </div>
      `;

      this.attachEvents(container);
    },

    attachEvents: function (container) {
      // Tombol Isi Form per Peserta
      container.querySelectorAll('.btn-fill-evaluator').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.currentTarget.getAttribute('data-id'));
          window.appStore.setActiveRespondentId(id);
          window.appStore.setView('formulir', { respondentId: id });
        });
      });

      // Search Box Filter
      const searchInput = container.querySelector('#evaluator-search-input');
      const emptyRow = container.querySelector('#evaluator-empty-search-row');
      const rows = container.querySelectorAll('.evaluator-row');

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.toLowerCase().trim();
          let visibleCount = 0;

          rows.forEach(row => {
            const searchData = row.getAttribute('data-search') || '';
            if (!query || searchData.includes(query)) {
              row.classList.remove('hidden');
              visibleCount++;
            } else {
              row.classList.add('hidden');
            }
          });

          if (emptyRow) {
            if (visibleCount === 0 && rows.length > 0) {
              emptyRow.classList.remove('hidden');
            } else {
              emptyRow.classList.add('hidden');
            }
          }
        });
      }
    }
  };
})();
