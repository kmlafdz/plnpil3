/**
 * View: Laporan & Ekspor Data
 * Laporan eksekutif siap cetak yang mengikuti cakupan filter aktif (UPDL, Program, Periode)
 * serta ekspor data responden ke CSV (dapat dibuka di Excel).
 */

(function () {
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Kategori kualitatif berdasarkan indeks skor 25–100 (selaras dengan status indikator di store)
  const getCategory = (score) => {
    if (!score) return { label: 'Belum Ada Data', color: '#64748B' };
    if (score >= 80) return { label: 'Sangat Efektif', color: '#059669' };
    if (score >= 70) return { label: 'Efektif', color: '#0F96A9' };
    return { label: 'Perlu Penguatan', color: '#D97706' };
  };

  const fmtScore = (v) => (v ? v : '–');

  window.LaporanView = {
    // Ambil cakupan filter aktif dalam bentuk objek siap tampil
    getScope: function () {
      const s = window.appStore.state;
      const updl = s.activeDashboardUpdl && s.activeDashboardUpdl !== 'ALL'
        ? window.appStore.getUpdls().find(u => u.id === s.activeDashboardUpdl) : null;
      const program = s.activeDashboardProgram && s.activeDashboardProgram !== 'ALL'
        ? window.appStore.getPrograms().find(p => p.id === s.activeDashboardProgram) : null;
      const period = s.activeDashboardPeriod && s.activeDashboardPeriod !== 'ALL'
        ? window.appStore.getPeriods().find(p => p.id === s.activeDashboardPeriod) : null;
      return {
        updlLabel: updl ? updl.nama : 'Semua UPDL',
        programLabel: program ? program.nama : 'Semua Program Pembelajaran',
        periodLabel: period ? period.nama : 'Semua Periode',
        periodKode: period ? period.kode : ''
      };
    },

    // Responden sesuai filter cakupan tanpa terpengaruh kata kunci pencarian dari halaman lain
    getScopedRespondents: function () {
      const store = window.appStore;
      const savedQuery = store.state.searchQuery;
      store.state.searchQuery = '';
      const list = store.getRespondents();
      store.state.searchQuery = savedQuery;
      return list;
    },

    render: function (container) {
      const stats = window.appStore.getAnalytics();
      const settings = window.appStore.getSettings();
      const scope = this.getScope();
      const overall = getCategory(stats.scores.combined);
      const hasData = stats.totalRespondents > 0;
      const hasTarget = settings.target.baseline && settings.target.target;
      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const units = [...stats.units].sort((a, b) => b.percentage - a.percentage || a.unit.localeCompare(b.unit));
      const signers = [settings.penandatangan.internal, settings.penandatangan.eksternal, settings.penandatangan.mengetahui];

      container.innerHTML = `
        <div class="flex flex-col gap-6">

          <!-- Header Laporan -->
          <div class="no-print flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#CBD5E1]">
            <div>
              <h1 class="text-2xl font-bold text-[#172B3A] tracking-tight">Laporan Eksekutif Evaluasi Level 3</h1>
              <p class="text-xs text-[#64748B] mt-0.5">
                Isi laporan mengikuti cakupan yang dipilih di bawah. Penandatangan dan target kinerja diatur di menu Pengaturan.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button id="btn-download-csv" class="btn-secondary" ${hasData ? '' : 'disabled style="opacity:.5;cursor:not-allowed"'}>
                <span class="material-symbols-outlined text-[16px]">file_download</span>
                Unduh Data (Excel/CSV)
              </button>
              <button id="btn-print-laporan" class="btn-primary">
                <span class="material-symbols-outlined text-[16px]">print</span>
                Cetak / Simpan PDF
              </button>
            </div>
          </div>

          <div class="no-print">
            ${window.FilterScopeBar.render()}
          </div>

          <!-- Lembar Laporan (area cetak) -->
          <article id="laporan-print-area" class="bg-white p-8 sm:p-12 rounded-lg border border-[#CBD5E1] shadow-sm max-w-5xl mx-auto w-full space-y-8">

            <!-- Kop Dokumen -->
            <header class="flex items-center justify-between gap-6 pb-6 border-b-2 border-[#172B3A]">
              <div class="flex items-center gap-4">
                <img src="logo.png" alt="Logo PLN" class="h-14 w-auto object-contain" />
                <div>
                  <div class="text-sm font-bold text-[#172B3A] tracking-wider uppercase">${esc(settings.instansi)}</div>
                  <div class="text-xs font-semibold text-[#006876] uppercase">${esc(settings.unitPelaksana)}</div>
                  <div class="text-[11px] text-[#64748B]">Cakupan: ${esc(scope.updlLabel)}</div>
                </div>
              </div>
              <div class="text-right text-xs">
                <div class="font-bold text-[#172B3A]">EVALUASI LEVEL 3</div>
                <div class="text-[#64748B]">${esc(scope.periodLabel)}</div>
                ${scope.periodKode ? `<div class="text-[10px] text-[#64748B] font-mono">Kode: ${esc(scope.periodKode)}</div>` : ''}
                <div class="text-[10px] text-[#64748B]">Dicetak: ${today}</div>
              </div>
            </header>

            <!-- 1. Ringkasan -->
            <section class="space-y-3">
              <h2 class="text-xs font-bold uppercase tracking-wider text-[#172B3A] bg-[#F1F5F9] p-2 rounded">1. Ringkasan Eksekutif</h2>
              <p class="text-xs text-[#172B3A] leading-relaxed">
                Laporan ini mengukur penerapan hasil pembelajaran <b>${esc(scope.programLabel)}</b> di lingkungan kerja peserta
                berdasarkan penilaian tiga perspektif: peserta, atasan langsung, dan koordinator.
                ${hasTarget ? `Sasaran program adalah menurunkan susut jaringan distribusi dari <b>${esc(settings.target.baseline)}</b> menjadi <b>${esc(settings.target.target)}</b>${settings.target.deadline ? ` pada ${esc(settings.target.deadline)}` : ''}.` : ''}
              </p>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                <div class="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-center">
                  <div class="text-[11px] text-[#64748B]">Total Responden</div>
                  <div class="text-xl font-bold text-[#172B3A] mt-1 font-tabular">${stats.totalRespondents}</div>
                </div>
                <div class="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-center">
                  <div class="text-[11px] text-[#64748B]">Penilaian Lengkap (3 Perspektif)</div>
                  <div class="text-xl font-bold text-[#172B3A] mt-1 font-tabular">${stats.fullCompleted} <span class="text-xs font-medium text-[#64748B]">(${stats.fullRate}%)</span></div>
                </div>
                <div class="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-center">
                  <div class="text-[11px] text-[#64748B]">Skor Gabungan</div>
                  <div class="text-xl font-bold text-[#006876] mt-1 font-tabular">${fmtScore(stats.scores.combined)}<span class="text-xs font-medium text-[#64748B]"> / 100</span></div>
                </div>
                <div class="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-center">
                  <div class="text-[11px] text-[#64748B]">Kategori</div>
                  <div class="text-sm font-bold mt-2" style="color:${overall.color}">${overall.label}</div>
                </div>
              </div>
            </section>

            ${hasData ? `
            <!-- 2. Progres Pengisian -->
            <section class="space-y-3">
              <h2 class="text-xs font-bold uppercase tracking-wider text-[#172B3A] bg-[#F1F5F9] p-2 rounded">2. Progres Pengisian per Perspektif</h2>
              <table class="w-full text-left text-xs border-collapse border border-[#CBD5E1]">
                <thead>
                  <tr class="bg-[#F8FAFC] text-[#172B3A] font-bold border-b border-[#CBD5E1]">
                    <th class="p-2.5 border-r border-[#CBD5E1]">Perspektif</th>
                    <th class="p-2.5 border-r border-[#CBD5E1] text-center">Selesai</th>
                    <th class="p-2.5 border-r border-[#CBD5E1] text-center">Persentase</th>
                    <th class="p-2.5 text-center">Skor Rata-rata</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#CBD5E1]">
                  ${[
                    ['Peserta (Evaluasi Diri)', stats.completedPeserta, stats.pesertaRate, stats.scores.peserta],
                    ['Atasan Langsung', stats.completedAtasan, stats.atasanRate, stats.scores.atasan],
                    ['Koordinator', stats.completedKoordinator, stats.koordinatorRate, stats.scores.koordinator]
                  ].map(([label, done, rate, score]) => `
                    <tr>
                      <td class="p-2.5 border-r border-[#CBD5E1] font-medium">${label}</td>
                      <td class="p-2.5 border-r border-[#CBD5E1] text-center font-tabular">${done} / ${stats.totalRespondents}</td>
                      <td class="p-2.5 border-r border-[#CBD5E1] text-center font-tabular">${rate}%</td>
                      <td class="p-2.5 text-center font-tabular">${fmtScore(score)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </section>

            <!-- 3. Rekap per Modul -->
            <section class="space-y-3">
              <h2 class="text-xs font-bold uppercase tracking-wider text-[#172B3A] bg-[#F1F5F9] p-2 rounded">3. Skor per Modul Pembelajaran</h2>
              <table class="w-full text-left text-xs border-collapse border border-[#CBD5E1]">
                <thead>
                  <tr class="bg-[#F8FAFC] text-[#172B3A] font-bold border-b border-[#CBD5E1]">
                    <th class="p-2.5 border-r border-[#CBD5E1]">Modul</th>
                    <th class="p-2.5 border-r border-[#CBD5E1] text-center">Peserta</th>
                    <th class="p-2.5 border-r border-[#CBD5E1] text-center">Atasan</th>
                    <th class="p-2.5 border-r border-[#CBD5E1] text-center">Koordinator</th>
                    <th class="p-2.5 border-r border-[#CBD5E1] text-center">Gabungan</th>
                    <th class="p-2.5 text-center">Kategori</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#CBD5E1]">
                  ${stats.modules.map(m => {
                    const cat = getCategory(m.combined);
                    return `
                      <tr>
                        <td class="p-2.5 border-r border-[#CBD5E1] font-medium">Bagian ${esc(m.code)}: ${esc(m.title)}</td>
                        <td class="p-2.5 border-r border-[#CBD5E1] text-center font-tabular">${fmtScore(m.peserta)}</td>
                        <td class="p-2.5 border-r border-[#CBD5E1] text-center font-tabular">${fmtScore(m.atasan)}</td>
                        <td class="p-2.5 border-r border-[#CBD5E1] text-center font-tabular">${fmtScore(m.koordinator)}</td>
                        <td class="p-2.5 border-r border-[#CBD5E1] text-center font-bold font-tabular text-[#006876]">${fmtScore(m.combined)}</td>
                        <td class="p-2.5 text-center font-semibold" style="color:${cat.color}">${cat.label}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </section>

            <!-- 4. Capaian per Unit -->
            <section class="space-y-3">
              <h2 class="text-xs font-bold uppercase tracking-wider text-[#172B3A] bg-[#F1F5F9] p-2 rounded">4. Kelengkapan Penilaian per Unit</h2>
              <table class="w-full text-left text-xs border-collapse border border-[#CBD5E1]">
                <thead>
                  <tr class="bg-[#F8FAFC] text-[#172B3A] font-bold border-b border-[#CBD5E1]">
                    <th class="p-2.5 border-r border-[#CBD5E1]">Unit</th>
                    <th class="p-2.5 border-r border-[#CBD5E1] text-center">Jumlah Peserta</th>
                    <th class="p-2.5 border-r border-[#CBD5E1] text-center">Lengkap</th>
                    <th class="p-2.5 text-center">Persentase</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#CBD5E1]">
                  ${units.map(u => `
                    <tr>
                      <td class="p-2.5 border-r border-[#CBD5E1] font-medium">${esc(u.unit)}</td>
                      <td class="p-2.5 border-r border-[#CBD5E1] text-center font-tabular">${u.total}</td>
                      <td class="p-2.5 border-r border-[#CBD5E1] text-center font-tabular">${u.completed}</td>
                      <td class="p-2.5 text-center font-bold font-tabular text-[#006876]">${u.percentage}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </section>
            ` : `
            <div class="p-8 text-center border border-dashed border-[#CBD5E1] rounded text-xs text-[#64748B]">
              <span class="material-symbols-outlined text-3xl text-[#94A3B8] block mb-1">inbox</span>
              Belum ada responden pada cakupan ini. Ubah pilihan UPDL, program, atau periode di atas.
            </div>
            `}

            <!-- Pengesahan -->
            <footer class="pt-8 border-t border-[#CBD5E1] grid grid-cols-3 gap-4 text-center text-xs break-inside-avoid">
              ${signers.map((s, i) => `
                <div>
                  <div class="text-[#64748B]">${i === 2 ? 'Mengetahui,<br />' : ''}${esc(s.jabatan)}</div>
                  <div class="font-bold text-[#172B3A] ${i === 2 ? 'mt-12' : 'mt-16'}">${esc(s.nama) || '(.................................)'}</div>
                  ${s.nip ? `<div class="text-[10px] text-[#64748B]">NIP ${esc(s.nip)}</div>` : ''}
                </div>
              `).join('')}
            </footer>
          </article>
        </div>
      `;

      this.attachEvents(container);
    },

    exportCsv: function () {
      const store = window.appStore;
      const list = this.getScopedRespondents();
      if (list.length === 0) {
        window.App.showToast('Tidak ada data untuk diekspor pada cakupan ini.', 'error');
        return;
      }

      const avgIndex = (part) => {
        const vals = Object.values((part && part.scores) || {});
        if (!part || part.status !== 'SELESAI' || vals.length === 0) return '';
        return (vals.reduce((a, b) => a + b, 0) / vals.length / 4 * 100).toFixed(1).replace('.', ',');
      };
      const status = (part) => (part && part.status === 'SELESAI' ? 'Selesai' : 'Belum');
      const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

      const header = ['No', 'NIP', 'Nama', 'Jabatan', 'Unit', 'Modul', 'Atasan Langsung', 'Koordinator',
        'Status Peserta', 'Status Atasan', 'Status Koordinator', 'Skor Peserta', 'Skor Atasan', 'Skor Koordinator'];
      const rows = list.map((r, i) => {
        const ev = store.getEvaluation(r.id) || {};
        return [
          i + 1, r.nip, r.nama, r.jabatan, r.unit, (r.modules || []).join(', '),
          r.atasan?.nama || '', r.koordinatorEksternal?.nama || '',
          status(ev.peserta), status(ev.atasan), status(ev.koordinator),
          avgIndex(ev.peserta), avgIndex(ev.atasan), avgIndex(ev.koordinator)
        ];
      });

      // Pemisah ";" + BOM UTF-8 agar langsung terbaca rapi oleh Excel berlokal Indonesia
      const csv = '\uFEFF' + [header, ...rows].map(row => row.map(cell).join(';')).join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_evaluasi_l3_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      window.App.showToast(`${list.length} baris data responden berhasil diunduh.`, 'success');
    },

    attachEvents: function (container) {
      window.FilterScopeBar.attachEvents(container, () => this.render(container));
      container.querySelector('#btn-print-laporan')?.addEventListener('click', () => window.print());
      container.querySelector('#btn-download-csv')?.addEventListener('click', () => this.exportCsv());
    }
  };
})();
