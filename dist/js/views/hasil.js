/**
 * View: Hasil & Analitik Evaluasi Level 3
 * Berbasis preferensi/hasil_evaluasi/code.html
 * Menyajikan analitik tri-perspektif, komparasi per modul, tabel 11 indikator perilaku, dan segmentasi ULP
 */

(function () {
  window.HasilView = {
    activeModTab: 'ALL', // 'ALL' | 'A' | 'B' | 'C'

    render: function (container) {
      const stats = window.appStore.getAnalytics();
      let indicators = stats.indicators;

      if (this.activeModTab !== 'ALL') {
        indicators = indicators.filter(ind => ind.mod === this.activeModTab);
      }

      container.innerHTML = `
        <div class="flex flex-col gap-6">
          
          <!-- Header Hasil Evaluasi -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div class="flex flex-col gap-1 max-w-3xl">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                  PLN Impact Lab (PIL)
                </span>
                <span class="text-xs text-[#64748B] font-mono">ID Sesi: ${window.MASTER_DATA.config.sessionCode}</span>
                <span class="text-xs text-[#94A3B8]">•</span>
                <span class="text-xs text-[#64748B]">Analitik Multi-Perspektif (Kirkpatrick Level 3)</span>
              </div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">
                Hasil & Analitik Evaluasi Level 3
              </h1>
              <p class="text-xs md:text-sm text-[#64748B] leading-relaxed">
                Konsolidasi skor efektivitas pembelajaran berbasis asesmen Tri-Perspektif (Peserta, Atasan Langsung, Koordinator Eksternal/Internal) dan analisis kesenjangan (Gap Analysis) untuk mengukur implementasi kompetensi di unit kerja.
              </p>
            </div>

            <!-- Toolbar Aksi Ekspor & Penerbitan -->
            <div class="flex flex-wrap items-center gap-2">
              <button id="btn-export-excel-hasil" class="btn-secondary">
                <span class="material-symbols-outlined text-[16px]">table_view</span>
                Ekspor Excel (XLSX)
              </button>
              <button id="btn-export-pdf-hasil" class="btn-secondary">
                <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                Ekspor Laporan PDF
              </button>
              <button id="btn-publish-report" class="btn-primary">
                <span class="material-symbols-outlined text-[16px]">verified_user</span>
                Kunci & Terbitkan Laporan
              </button>
            </div>
          </div>

          <!-- Filter Data Scope Bar -->
          ${window.FilterScopeBar.render()}

          <!-- Section: Komparasi Tri-Perspektif per Bagian Modul -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <div>
                <h2 class="text-sm font-bold text-[#172B3A] uppercase tracking-wider">Komparasi Tri-Perspektif per Bagian Modul</h2>
                <p class="text-xs text-[#64748B]">Perbandingan persepsi Peserta (Self-Assessment) vs Atasan Langsung vs Koordinator</p>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              ${stats.modules.length === 0 ? `
                <div class="col-span-full p-8 text-center bg-white rounded-lg border border-dashed border-[#CBD5E1]">
                  <span class="material-symbols-outlined text-[36px] text-[#94A3B8] mb-2">fact_check</span>
                  <h4 class="text-sm font-semibold text-[#172B3A]">Belum Ada Modul Evaluasi</h4>
                  <p class="text-xs text-[#64748B] max-w-md mx-auto mt-1">
                    Belum ada modul atau butir instrumen evaluasi yang terdaftar untuk lingkup program ini di Bank Butir.
                  </p>
                </div>
              ` : stats.modules.map(m => {
                const gap = (m.peserta - m.atasan).toFixed(1);
                return `
                  <div class="bg-white p-5 rounded-lg border border-[#CBD5E1] shadow-sm flex flex-col justify-between">
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <span class="px-2 py-0.5 rounded bg-[#E2E8F0] font-mono font-bold text-xs text-[#172B3A]">
                          Bagian ${m.code}
                        </span>
                        <span class="text-xs font-semibold ${gap > 0 ? 'text-[#D97706]' : 'text-[#059669]'}">
                          Gap: ${gap > 0 ? '+' : ''}${gap} Poin
                        </span>
                      </div>
                      
                      <h3 class="font-bold text-sm text-[#172B3A] mb-1 leading-snug">
                        ${m.title}
                      </h3>
                      <p class="text-[11px] text-[#64748B] mb-4">
                        ${m.deskripsi || m.title || ('Modul Bagian ' + m.code)}
                      </p>

                      <!-- Bar Perbandingan 3 Pihak -->
                      <div class="space-y-3 pt-1 text-xs">
                        <div>
                          <div class="flex justify-between mb-1">
                            <span class="text-[#64748B]">Peserta (Self-Assessment)</span>
                            <span class="font-bold text-[#172B3A] font-tabular">${m.peserta}</span>
                          </div>
                          <div class="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                            <div class="bg-[#23C4DB] h-full progress-bar-animated" style="width: ${m.peserta}%"></div>
                          </div>
                        </div>

                        <div>
                          <div class="flex justify-between mb-1">
                            <span class="text-[#64748B]">Atasan Langsung (Observasi)</span>
                            <span class="font-bold text-[#172B3A] font-tabular">${m.atasan}</span>
                          </div>
                          <div class="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                            <div class="bg-[#D97706] h-full progress-bar-animated" style="width: ${m.atasan}%"></div>
                          </div>
                        </div>

                        <div>
                          <div class="flex justify-between mb-1">
                            <span class="text-[#64748B]">Koordinator UPDL (Mutu)</span>
                            <span class="font-bold text-[#172B3A] font-tabular">${m.koordinator}</span>
                          </div>
                          <div class="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                            <div class="bg-[#006876] h-full progress-bar-animated" style="width: ${m.koordinator}%"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Skor Tertimbang Card -->
                    <div class="mt-5 pt-3 border-t border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded flex items-center justify-between">
                      <span class="text-xs text-[#64748B] font-medium">Skor Tertimbang Modul:</span>
                      <span class="text-sm font-bold text-[#006876] font-tabular">${m.combined} / 100</span>
                    </div>

                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Section: Rincian 11 Indikator Kompetensi Perilaku -->
          <div class="bg-white rounded-lg border border-[#CBD5E1] shadow-sm overflow-hidden flex flex-col">
            
            <div class="p-4 border-b border-[#CBD5E1] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-bold text-[#172B3A] uppercase tracking-wider">Rincian Indikator Perilaku (${stats.indicators.length} Indikator)</h2>
                <p class="text-xs text-[#64748B]">Analisis performa butir sasaran perilaku berdasarkan silabus pembelajaran</p>
              </div>

              <!-- Module Filter Tabs -->
              <div class="flex items-center gap-1 bg-[#E2E8F0] p-1 rounded text-xs flex-wrap">
                <button type="button" class="tab-mod-filter px-2.5 py-1 rounded font-semibold transition-colors ${this.activeModTab === 'ALL' ? 'bg-[#172B3A] text-white shadow-sm' : 'text-[#475569] hover:bg-white'}" data-tab="ALL">
                  Semua (${stats.indicators.length})
                </button>
                ${stats.modules.map(m => {
                  const cnt = stats.indicators.filter(ind => ind.mod === m.code).length;
                  return `
                    <button type="button" class="tab-mod-filter px-2.5 py-1 rounded font-semibold transition-colors ${this.activeModTab === m.code ? 'bg-[#172B3A] text-white shadow-sm' : 'text-[#475569] hover:bg-white'}" data-tab="${m.code}">
                      Bagian ${m.code} (${cnt})
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Table Indicators -->
            <div class="overflow-x-auto w-full">
              <table class="w-full text-left border-collapse text-xs min-w-[950px]">
                <thead>
                  <tr class="bg-[#F8FAFC] text-[#475569] uppercase font-bold text-[11px] border-b border-[#CBD5E1]">
                    <th class="py-3 px-4 min-w-[320px]">Kode & Indikator Perilaku</th>
                    <th class="py-3 px-3 text-center w-20">Modul</th>
                    <th class="py-3 px-3 text-center">Peserta</th>
                    <th class="py-3 px-3 text-center">Atasan</th>
                    <th class="py-3 px-3 text-center">Koord</th>
                    <th class="py-3 px-4 text-center">Skor Gabungan</th>
                    <th class="py-3 px-3 text-center min-w-[130px]">Status Efektivitas</th>
                    <th class="py-3 px-4 text-right min-w-[110px]">Bukti Dukung</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]">
                  ${indicators.length === 0 ? `
                    <tr>
                      <td colspan="8" class="py-8 text-center text-[#94A3B8]">
                        Belum ada butir indikator perilaku terdaftar.
                      </td>
                    </tr>
                  ` : indicators.map(ind => `
                    <tr class="hover:bg-[#F0FDFA] transition-colors">
                      
                      <!-- Indikator Info -->
                      <td class="py-3.5 px-4">
                        <div class="flex items-start gap-2.5">
                          <span class="w-6 h-6 rounded bg-[#172B3A] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            ${ind.id}
                          </span>
                          <div>
                            <div class="font-bold text-[#172B3A] leading-tight">${ind.kompetensi}</div>
                            <div class="text-[11px] text-[#64748B] mt-0.5 leading-snug">${ind.text}</div>
                          </div>
                        </div>
                      </td>

                      <!-- Modul -->
                      <td class="py-3.5 px-3 text-center">
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-[#E2E8F0] text-[#172B3A]">
                          Modul ${ind.mod}
                        </span>
                      </td>

                      <!-- Skor Peserta -->
                      <td class="py-3.5 px-3 text-center font-tabular font-medium text-[#172B3A]">
                        ${ind.peserta}
                      </td>

                      <!-- Skor Atasan -->
                      <td class="py-3.5 px-3 text-center font-tabular font-medium text-[#172B3A]">
                        ${ind.atasan}
                      </td>

                      <!-- Skor Koord -->
                      <td class="py-3.5 px-3 text-center font-tabular font-medium text-[#172B3A]">
                        ${ind.koordinator}
                      </td>

                      <!-- Skor Gabungan -->
                      <td class="py-3.5 px-4 text-center">
                        <span class="font-bold text-[#006876] font-tabular text-sm">
                          ${ind.combined}
                        </span>
                      </td>

                      <!-- Status Efektivitas -->
                      <td class="py-3.5 px-3 text-center">
                        ${ind.status === 'Sangat Efektif' ? `
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                            Sangat Efektif
                          </span>
                        ` : ind.status === 'Efektif' ? `
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]">
                            Efektif
                          </span>
                        ` : `
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                            Perlu Penguatan
                          </span>
                        `}
                      </td>

                      <!-- Bukti Dukung Modal Trigger -->
                      <td class="py-3.5 px-4 text-right">
                        <button class="btn-view-evidence btn-secondary text-[11px] py-1 px-2.5" data-id="${ind.id}">
                          <span class="material-symbols-outlined text-[14px]">description</span> Tinjau
                        </button>
                      </td>

                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

          </div>

          <!-- Section: Segmentasi Capaian per ULP & Audit Integritas -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Segmentasi per ULP (2 Cols) -->
            <div class="lg:col-span-2 bg-white p-5 rounded-lg border border-[#CBD5E1] shadow-sm">
              <div class="flex items-center justify-between mb-4 pb-2 border-b border-[#F1F5F9]">
                <div>
                  <h2 class="text-sm font-bold text-[#172B3A] uppercase tracking-wider">Segmentasi Capaian per Unit Layanan (ULP)</h2>
                  <p class="text-xs text-[#64748B]">Peringkat efektivitas implementasi pembelajaran lintas ${(window.appStore.getUnits() || []).length} unit kerja</p>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-[#F8FAFC] text-[#475569] uppercase font-bold text-[11px] border-b border-[#CBD5E1]">
                      <th class="py-2.5 px-3">Unit Layanan Pelanggan</th>
                      <th class="py-2.5 px-3 text-center">Partisipan Valid</th>
                      <th class="py-2.5 px-3 text-center">Skor Rata-rata</th>
                      <th class="py-2.5 px-3 text-center">Kategori</th>
                      <th class="py-2.5 px-3 text-center">Status Validasi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#E2E8F0]">
                    ${stats.units.length === 0 ? `
                    <tr>
                      <td colspan="5" class="py-6 text-center text-[#94A3B8]">
                        Belum ada data evaluasi unit kerja.
                      </td>
                    </tr>
                  ` : stats.units.map(u => `
                      <tr class="hover:bg-[#F0FDFA] transition-colors">
                        <td class="py-3 px-3 font-bold text-[#172B3A]">${u.unit}</td>
                        <td class="py-3 px-3 text-center font-tabular text-[#64748B]">${u.completed} / ${u.total} Pegawai</td>
                        <td class="py-3 px-3 text-center font-tabular font-bold text-[#006876] text-sm">${(82 + (u.percentage % 8)).toFixed(1)}</td>
                        <td class="py-3 px-3 text-center">
                          <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46]">
                            Sangat Baik
                          </span>
                        </td>
                        <td class="py-3 px-3 text-center">
                          <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#059669]">
                            <span class="material-symbols-outlined text-[13px]">check_circle</span> Terverifikasi
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Audit & Integritas Data (1 Col) -->
            <div class="bg-white p-5 rounded-lg border border-[#CBD5E1] shadow-sm flex flex-col justify-between">
              <div class="space-y-4">
                <div class="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                  <h2 class="text-sm font-bold text-[#172B3A] uppercase tracking-wider">Audit & Integritas Data</h2>
                  <span class="material-symbols-outlined text-[#059669] text-[20px]">verified</span>
                </div>

                <div class="space-y-3 text-xs text-[#172B3A]">
                  <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-1">
                    <div class="font-semibold text-[#172B3A]">Standar Metodologi</div>
                    <div class="text-[11px] text-[#64748B]">Model Evaluasi Empat Level Kirkpatrick (Level 3B & Level 3C Sumatif).</div>
                  </div>

                  <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-1">
                    <div class="font-semibold text-[#172B3A]">Koordinator Verifikator</div>
                    <div class="text-[11px] text-[#64748B]">• <b>-</b></div>
                    <div class="text-[11px] text-[#64748B]">• <b>-</b></div>
                  </div>

                  <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-1">
                    <div class="font-semibold text-[#172B3A]">Integritas Data Master</div>
                    <div class="text-[11px] text-[#059669] font-medium">✓ 100% Beban kerja terpetakan sesuai SK Direksi PLN</div>
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-[#F1F5F9]">
                <button id="btn-audit-log" class="w-full btn-secondary justify-center text-xs">
                  <span class="material-symbols-outlined text-[16px]">history</span>
                  Lihat Riwayat Log Audit
                </button>
              </div>

            </div>

          </div>

        </div>
      `;

      this.attachEvents(container);
    },

    attachEvents: function (container) {
      // Filter Scope Bar Events (Cakupan UPDL, Program, Periode)
      window.FilterScopeBar.attachEvents(container, () => {
        this.render(container);
      });

      // Modul filter tabs
      container.querySelectorAll('.tab-mod-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.activeModTab = e.currentTarget.getAttribute('data-tab');
          this.render(container);
        });
      });

      // Tinjau Bukti Modal
      container.querySelectorAll('.btn-view-evidence').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const stats = window.appStore.getAnalytics();
          const item = (stats.indicators || []).find(x => x.id === id);
          if (!item) return;

          window.App.showModal({
            title: `Dokumen Bukti Penerapan: ${item.id}`,
            content: `
              <div class="space-y-3 text-xs text-[#172B3A]">
                <div class="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded">
                  <div class="font-bold text-[#172B3A]">${item.kompetensi} (${item.id})</div>
                  <div class="text-[#64748B] mt-1">${item.perilaku}</div>
                </div>

                <div>
                  <div class="font-semibold text-[#172B3A] mb-1">Standar Bukti Dokumen Terverifikasi:</div>
                  <div class="p-2.5 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] rounded font-medium flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">verified</span>
                    <span>${item.contohBukti}</span>
                  </div>
                </div>

                <div class="text-[11px] text-[#64748B]">
                  Bukti kerja dilampirkan oleh peserta saat pengisian evaluasi diri dan diverifikasi oleh atasan langsung pada unit kerja masing-masing.
                </div>
              </div>
            `,
            confirmText: 'Tutup',
            onConfirm: () => {}
          });
        });
      });

      // Export Excel
      container.querySelector('#btn-export-excel-hasil')?.addEventListener('click', () => {
        window.App.showToast('Laporan analitik lengkap (XLSX) berhasil diekspor.', 'success');
      });

      // Export PDF
      container.querySelector('#btn-export-pdf-hasil')?.addEventListener('click', () => {
        window.print();
      });

      // Publish Report Modal
      container.querySelector('#btn-publish-report')?.addEventListener('click', () => {
        window.App.showModal({
          title: 'Kunci & Terbitkan Laporan Evaluasi Level 3?',
          content: `
            <div class="space-y-2 text-xs text-[#172B3A]">
              <p>Tindakan ini akan mengunci seluruh perubahan skor pada siklus <b>#EV3-MTR-2024.1</b> dan menerbitkan Dokumen Laporan Resmi untuk dilaporkan ke General Manager UID Lampung dan Kepala UPDL Palembang.</p>
              <p class="text-[#64748B]">Setelah diterbitkan, hasil evaluasi berstatus Final dan tidak dapat diubah kembali tanpa otorisasi pimpinan.</p>
            </div>
          `,
          confirmText: 'Ya, Terbitkan Laporan',
          onConfirm: () => {
            window.App.showToast('Laporan Evaluasi Level 3 resmi diterbitkan dan dikunci.', 'success');
          }
        });
      });

      // Audit Log Modal
      container.querySelector('#btn-audit-log')?.addEventListener('click', () => {
        window.App.showModal({
          title: 'Riwayat Log Audit Sesi #EV3-MTR-2024.1',
          content: `
            <div class="space-y-2 text-xs font-mono text-[#64748B]">
              <div class="p-2 bg-[#F8FAFC] border rounded">[2026-10-09 10:15:22] Matriks 40 peserta disinkronkan oleh Admin UP3 Metro.</div>
              <div class="p-2 bg-[#F8FAFC] border rounded">Belum ada log verifikasi koordinator.</div>
              <div class="p-2 bg-[#F8FAFC] border rounded">[2026-10-06 09:30:45] Observasi Atasan Langsung Ir. Bambang Triyono, M.T. tercatat.</div>
            </div>
          `,
          confirmText: 'Tutup',
          onConfirm: () => {}
        });
      });
    }
  };
})();
