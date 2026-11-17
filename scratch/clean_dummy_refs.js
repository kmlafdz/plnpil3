const fs = require('fs');
const path = require('path');

// 1. Update js/data.js
const dataPath = path.join(__dirname, '../js/data.js');
let dataContent = fs.readFileSync(dataPath, 'utf8');
dataContent = dataContent.replace(/config:\s*\{[\s\S]*?koordinatorInternal:\s*\{[\s\S]*?\}\s*\}/, `config: {
    unit: '',
    induk: '',
    updl: '',
    program: '',
    sessionCode: '',
    sessionPeriod: '',
    manajemenTarget: {
      baseline: '',
      target: '',
      deadline: ''
    },
    koordinatorEksternal: {
      nama: '',
      nip: '',
      unit: ''
    },
    koordinatorInternal: {
      nama: '',
      nip: '',
      unit: ''
    }
  }`);
fs.writeFileSync(dataPath, dataContent, 'utf8');
console.log('js/data.js updated!');

// 2. Update js/views/hasil.js
const hasilPath = path.join(__dirname, '../js/views/hasil.js');
let hasilContent = fs.readFileSync(hasilPath, 'utf8');

// Replace Koordinator Verifikator text in hasil.js
hasilContent = hasilContent.replace(
  /• <b>Azam Zulmi Agusti Nuro<\/b> \(8810743Z\) — UPDL Palembang/g,
  '• <b>-</b>'
);
hasilContent = hasilContent.replace(
  /• <b>Akkhita Nurrul Febriyanti<\/b> \(8909014M\) — UP3 Metro/g,
  '• <b>-</b>'
);
hasilContent = hasilContent.replace(
  /\[2026-10-08 14:02:11\] Verifikasi Koordinator Eksternal Azam Zulmi Agusti Nuro disetujui\./g,
  'Belum ada log verifikasi koordinator.'
);

// Segmentasi ULP table empty state in hasil.js
hasilContent = hasilContent.replace(
  /\$\{stats\.units\.map\(u => `/g,
  `\${stats.units.length === 0 ? \`
                    <tr>
                      <td colspan="5" class="py-6 text-center text-[#94A3B8]">
                        Belum ada data evaluasi unit kerja.
                      </td>
                    </tr>
                  \` : stats.units.map(u => \``
);
fs.writeFileSync(hasilPath, hasilContent, 'utf8');
console.log('js/views/hasil.js updated!');

// 3. Update js/views/penugasan.js
const penugasanPath = path.join(__dirname, '../js/views/penugasan.js');
let penugasanContent = fs.readFileSync(penugasanPath, 'utf8');

// Dropdown options koordinator in penugasan.js
penugasanContent = penugasanContent.replace(
  /<option value="8810743Z">Azam Zulmi Agusti Nuro \(NIP 8810743Z\) — Specialist UPDL Palembang<\/option>\s*<option value="8909014M">Akkhita Nurrul Febriyanti \(NIP 8909014M\) — Koordinator Internal UP3 Metro<\/option>/g,
  '${window.appStore.getUsers().filter(u => u.role.includes("koordinator") || u.role === "admin").map(u => `<option value="${u.nip}">${u.nama} (NIP ${u.nip}) — ${u.jabatan || u.role}</option>`).join("") || `<option value="">Belum ada master koordinator terdaftar</option>`}'
);

penugasanContent = penugasanContent.replace(
  /<option value="Azam Zulmi Agusti Nuro\|8810743Z\|Koordinator Eksternal \/ UPDL Palembang"[\s\S]*?<\/option>\s*<option value="Akkhita Nurrul Febriyanti\|8909014M\|Koordinator Internal UP3 Metro"[\s\S]*?<\/option>/g,
  '${window.appStore.getUsers().filter(u => u.role.includes("koordinator") || u.role === "admin").map(u => `<option value="${u.nama}|${u.nip}|${u.jabatan || u.role}">${u.nama} (${u.jabatan || u.role})</option>`).join("") || `<option value="">Belum ada master koordinator terdaftar</option>`}'
);

fs.writeFileSync(penugasanPath, penugasanContent, 'utf8');
console.log('js/views/penugasan.js updated!');
