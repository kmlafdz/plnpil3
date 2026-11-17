/**
 * Module: Avatar Manager (PLN Corporate University)
 * Mengelola fitur ubah avatar & foto profil:
 * 1. Unggah foto kustom (otomatis compress & crop 200x200 canvas data URL)
 * 2. Koleksi Preset Karakter Resmi Korporat PLN (SVG Inline, offline & instan)
 * 3. Gradien Inisial Modern PLN
 * 4. Sinkronisasi instan ke Sesi Auth, LocalStorage, dan Database MariaDB
 */

(function () {
  const PRESET_SVGS = [
    {
      id: 'pln-engineer-male',
      name: 'Engineer Lapangan Pria',
      role: 'Teknik & Operasi',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-eng-m" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#006876"/>
            <stop offset="100%" stop-color="#172B3A"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-eng-m)"/>
        <!-- Torso / Uniform -->
        <path d="M22 100 C22 75, 78 75, 78 100 Z" fill="#0E7490"/>
        <path d="M43 76 L57 76 L55 100 L45 100 Z" fill="#F59E0B"/>
        <!-- Head -->
        <circle cx="50" cy="52" r="18" fill="#FBCFE8"/>
        <!-- Hair -->
        <path d="M34 48 C34 38, 66 38, 66 48 Z" fill="#1E293B"/>
        <!-- Safety Helmet PLN -->
        <path d="M30 42 C30 26, 70 26, 70 42 Z" fill="#FACC15"/>
        <path d="M26 42 L74 42 C76 42, 76 45, 74 45 L26 45 C24 45, 24 42, 26 42 Z" fill="#EAB308"/>
        <!-- Lightning Emblem on Helmet -->
        <path d="M51 29 L46 36 L49 36 L48 41 L54 34 L51 34 Z" fill="#DC2626"/>
        <!-- Face Features -->
        <circle cx="44" cy="52" r="2" fill="#1E293B"/>
        <circle cx="56" cy="52" r="2" fill="#1E293B"/>
        <path d="M47 58 Q50 61 53 58" stroke="#1E293B" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'pln-engineer-female',
      name: 'Engineer Lapangan Wanita',
      role: 'Teknik & Operasi',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-eng-f" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0891B2"/>
            <stop offset="100%" stop-color="#0F766E"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-eng-f)"/>
        <!-- Hair Back -->
        <path d="M32 50 C28 65, 34 85, 36 90 L64 90 C66 85, 72 65, 68 50 Z" fill="#0F172A"/>
        <!-- Torso -->
        <path d="M22 100 C22 75, 78 75, 78 100 Z" fill="#0284C7"/>
        <path d="M44 76 L56 76 L54 100 L46 100 Z" fill="#F59E0B"/>
        <!-- Head -->
        <circle cx="50" cy="52" r="17" fill="#FDE047" opacity="0.9"/>
        <!-- Safety Helmet PLN -->
        <path d="M31 42 C31 27, 69 27, 69 42 Z" fill="#FACC15"/>
        <path d="M27 42 L73 42 C75 42, 75 45, 73 45 L27 45 C25 45, 25 42, 27 42 Z" fill="#EAB308"/>
        <!-- Lightning Bolt -->
        <path d="M51 30 L47 36 L50 36 L49 40 L54 34 L51 34 Z" fill="#DC2626"/>
        <!-- Face Features -->
        <circle cx="44" cy="52" r="2" fill="#1E293B"/>
        <circle cx="56" cy="52" r="2" fill="#1E293B"/>
        <path d="M47 58 Q50 61 53 58" stroke="#1E293B" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'pln-executive-male',
      name: 'Eksekutif / Manager Pria',
      role: 'Manajemen & Leader',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-exec-m" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E293B"/>
            <stop offset="100%" stop-color="#0F172A"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-exec-m)"/>
        <!-- Torso Suit -->
        <path d="M20 100 C20 74, 80 74, 80 100 Z" fill="#334155"/>
        <!-- White Shirt -->
        <polygon points="50,70 42,88 58,88" fill="#FFFFFF"/>
        <!-- Cyan Tie -->
        <polygon points="50,73 47,88 53,88" fill="#23C4DB"/>
        <polygon points="47,88 53,88 50,98" fill="#006876"/>
        <!-- Head -->
        <circle cx="50" cy="48" r="18" fill="#FED7AA"/>
        <!-- Short Neat Hair -->
        <path d="M32 44 C32 28, 68 28, 68 44 C65 33, 35 33, 32 44 Z" fill="#1E293B"/>
        <!-- Glasses -->
        <rect x="38" y="44" width="10" height="7" rx="2" fill="none" stroke="#23C4DB" stroke-width="1.5"/>
        <rect x="52" y="44" width="10" height="7" rx="2" fill="none" stroke="#23C4DB" stroke-width="1.5"/>
        <line x1="48" y1="47" x2="52" y2="47" stroke="#23C4DB" stroke-width="1.5"/>
        <!-- Smile -->
        <path d="M47 57 Q50 60 53 57" stroke="#1E293B" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'pln-executive-female',
      name: 'Eksekutif / Manager Wanita',
      role: 'Manajemen & Leader',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-exec-f" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E384D"/>
            <stop offset="100%" stop-color="#006876"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-exec-f)"/>
        <!-- Hair Long -->
        <path d="M30 45 C26 65, 30 85, 32 95 L68 95 C70 85, 74 65, 70 45 Z" fill="#1E293B"/>
        <!-- Torso Blazer -->
        <path d="M22 100 C22 75, 78 75, 78 100 Z" fill="#1E293B"/>
        <polygon points="50,75 42,92 58,92" fill="#23C4DB"/>
        <polygon points="50,82 45,95 55,95" fill="#FFFFFF"/>
        <!-- Head -->
        <circle cx="50" cy="48" r="17" fill="#FDE68A"/>
        <!-- Front Hair -->
        <path d="M33 46 C33 30, 67 30, 67 46 C62 35, 38 35, 33 46 Z" fill="#1E293B"/>
        <!-- Face Features -->
        <circle cx="44" cy="48" r="2" fill="#1E293B"/>
        <circle cx="56" cy="48" r="2" fill="#1E293B"/>
        <path d="M47 55 Q50 58 53 55" stroke="#E11D48" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'pln-tech-developer',
      name: 'Developer & Data Specialist',
      role: 'IT & Digitalisasi',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-dev" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6D28D9"/>
            <stop offset="100%" stop-color="#1E1B4B"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-dev)"/>
        <!-- Torso Hoodie -->
        <path d="M22 100 C22 75, 78 75, 78 100 Z" fill="#4338CA"/>
        <path d="M50 78 L50 100" stroke="#A5B4FC" stroke-width="2"/>
        <!-- Head -->
        <circle cx="50" cy="50" r="18" fill="#FBCFE8"/>
        <!-- Modern Hair -->
        <path d="M32 46 C32 30, 68 28, 68 44 C60 36, 40 38, 32 46 Z" fill="#312E81"/>
        <!-- Code / Glasses -->
        <rect x="37" y="46" width="11" height="8" rx="2" fill="#0F172A" stroke="#22D3EE" stroke-width="1.5"/>
        <rect x="52" y="46" width="11" height="8" rx="2" fill="#0F172A" stroke="#22D3EE" stroke-width="1.5"/>
        <line x1="48" y1="50" x2="52" y2="50" stroke="#22D3EE" stroke-width="1.5"/>
        <text x="40" y="52" fill="#22D3EE" font-size="5" font-family="monospace">&lt;/&gt;</text>
        <path d="M47 60 Q50 63 53 60" stroke="#1E293B" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'pln-trainer-corpu',
      name: 'Instruktur & Learning Coach',
      role: 'PLN CorpU Diklat',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-corpu" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284C7"/>
            <stop offset="100%" stop-color="#0369A1"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-corpu)"/>
        <!-- Torso -->
        <path d="M22 100 C22 75, 78 75, 78 100 Z" fill="#0F172A"/>
        <!-- Lanyard ID Card PLN -->
        <path d="M45 76 L48 90 L52 90 L55 76" fill="none" stroke="#23C4DB" stroke-width="2"/>
        <rect x="47" y="90" width="6" height="8" rx="1" fill="#FACC15"/>
        <!-- Head -->
        <circle cx="50" cy="48" r="18" fill="#FEE2E2"/>
        <!-- Hair -->
        <path d="M33 44 C33 30, 67 30, 67 44 C63 34, 37 34, 33 44 Z" fill="#334155"/>
        <!-- Eyes & Smile -->
        <circle cx="44" cy="48" r="2" fill="#1E293B"/>
        <circle cx="56" cy="48" r="2" fill="#1E293B"/>
        <path d="M46 56 Q50 60 54 56" stroke="#1E293B" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'pln-operator-hero',
      name: 'Petugas Siaga & Distribusi',
      role: 'Pelayanan Teknik',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-op" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#EA580C"/>
            <stop offset="100%" stop-color="#9A3412"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-op)"/>
        <!-- Torso Hi-Vis -->
        <path d="M22 100 C22 75, 78 75, 78 100 Z" fill="#0284C7"/>
        <path d="M34 78 L38 100 L44 100 L40 78 Z" fill="#FACC15"/>
        <path d="M66 78 L62 100 L56 100 L60 78 Z" fill="#FACC15"/>
        <!-- Head -->
        <circle cx="50" cy="52" r="17" fill="#FED7AA"/>
        <!-- White Hardhat with PLN Blue Stripe -->
        <path d="M31 43 C31 28, 69 28, 69 43 Z" fill="#FFFFFF"/>
        <path d="M27 43 L73 43 C75 43, 75 46, 73 46 L27 46 C25 46, 25 43, 27 43 Z" fill="#E2E8F0"/>
        <rect x="47" y="30" width="6" height="13" fill="#0284C7"/>
        <!-- Eyes & Confident Smile -->
        <circle cx="44" cy="53" r="2" fill="#1E293B"/>
        <circle cx="56" cy="53" r="2" fill="#1E293B"/>
        <path d="M46 59 Q50 63 54 59" stroke="#1E293B" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>`
    },
    {
      id: 'pln-emblem-electric',
      name: 'Simbol Energi PLN Impact Lab',
      role: 'Maskot Korporat',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-emb" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#006876"/>
            <stop offset="50%" stop-color="#172B3A"/>
            <stop offset="100%" stop-color="#0A1520"/>
          </linearGradient>
          <linearGradient id="bolt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#23C4DB"/>
            <stop offset="50%" stop-color="#FACC15"/>
            <stop offset="100%" stop-color="#EF4444"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-emb)"/>
        <!-- Hexagon Border -->
        <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" fill="none" stroke="#23C4DB" stroke-width="2" opacity="0.6"/>
        <polygon points="50,20 75,35 75,65 50,80 25,65 25,35" fill="#172B3A" opacity="0.8"/>
        <!-- Dynamic Lightning Bolt -->
        <path d="M54 26 L36 52 L48 52 L44 74 L66 46 L52 46 Z" fill="url(#bolt)"/>
      </svg>`
    }
  ];

  const GRADIENT_PALETTES = [
    { id: 'grad-pln-cyan', name: 'Electric Cyan', from: '#006876', to: '#23C4DB' },
    { id: 'grad-pln-navy', name: 'Royal Navy', from: '#102331', to: '#1E384D' },
    { id: 'grad-emerald', name: 'Eco Emerald', from: '#065F46', to: '#10B981' },
    { id: 'grad-sunset', name: 'Power Amber', from: '#B45309', to: '#F59E0B' },
    { id: 'grad-purple', name: 'Tech Violet', from: '#5B21B6', to: '#8B5CF6' },
    { id: 'grad-crimson', name: 'Safety Red', from: '#991B1B', to: '#EF4444' }
  ];

  window.AvatarManager = {
    // Kembalikan daftar preset resmi yang sudah dienkode ke data URI
    getPresets: function () {
      return PRESET_SVGS.map(p => ({
        ...p,
        dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(p.svg)}`
      }));
    },

    getGradients: function () {
      return GRADIENT_PALETTES;
    },

    /**
     * Hasilkan avatar SVG gradien berdasarkan nama dan palet warna
     */
    generateGradientAvatar: function (name, gradFrom, gradTo) {
      const initial = (name || 'U').trim().charAt(0).toUpperCase();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="grad-user" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${gradFrom}"/>
            <stop offset="100%" stop-color="${gradTo}"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#grad-user)"/>
        <text x="50" y="63" font-family="'Inter', sans-serif" font-size="42" font-weight="700" fill="#FFFFFF" text-anchor="middle">${initial}</text>
      </svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    },

    /**
     * Memproses file upload: crop center square & resize ke max 200x200 via Canvas
     * Menghasilkan Data URL terkompresi (~20-40 KB)
     */
    processUploadedFile: function (file) {
      return new Promise((resolve, reject) => {
        if (!file) return reject(new Error('Tidak ada file yang dipilih.'));

        if (!file.type.startsWith('image/')) {
          return reject(new Error('File harus berupa gambar (JPG, PNG, atau WebP).'));
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
        reader.onload = (e) => {
          const img = new Image();
          img.onerror = () => reject(new Error('Format gambar tidak didukung atau rusak.'));
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const targetSize = 200;
              canvas.width = targetSize;
              canvas.height = targetSize;
              const ctx = canvas.getContext('2d');

              // Hitung square crop tengah (object-fit: cover)
              const minDim = Math.min(img.width, img.height);
              const sx = (img.width - minDim) / 2;
              const sy = (img.height - minDim) / 2;

              ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

              // Ekspor sebagai JPEG terkompresi kualitas 0.85
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              resolve(dataUrl);
            } catch (err) {
              reject(err);
            }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    },

    /**
     * Simpan avatar baru ke seluruh state aplikasi:
     * - authManager.currentUser
     * - appStore.users & appStore.respondents
     * - sinkronisasi MariaDB server
     */
    saveAvatar: function (avatarDataUri) {
      const auth = window.authManager;
      if (!auth) return { success: false, message: 'Modul autentikasi belum siap.' };

      const user = auth.getUser();
      if (!user) return { success: false, message: 'Tidak ada sesi pengguna aktif.' };

      // 1. Simpan di authManager
      auth.updateCurrentUserAvatar(avatarDataUri);

      // 2. Beri notifikasi global update UI
      if (window.App && typeof window.App.updateUserProfileUI === 'function') {
        window.App.updateUserProfileUI(user);
      }

      return { success: true, user: user };
    },

    /**
     * Buka Modal Ubah Avatar Interaktif
     */
    openAvatarModal: function (options = {}) {
      const user = window.authManager ? window.authManager.getUser() : null;
      if (!user) {
        if (window.App) window.App.showToast('Silakan login terlebih dahulu.', 'error');
        return;
      }

      const presets = this.getPresets();
      const gradients = this.getGradients();
      let selectedAvatar = user.avatar || '';
      let activeTab = 'preset'; // 'preset' | 'upload' | 'gradient'

      const modalContainerId = 'avatar-changer-modal-container';
      let modalHost = document.getElementById(modalContainerId);
      if (!modalHost) {
        modalHost = document.createElement('div');
        modalHost.id = modalContainerId;
        document.body.appendChild(modalHost);
      }

      const renderModalContent = () => {
        const initial = (user.nama || 'U').charAt(0).toUpperCase();

        modalHost.innerHTML = `
          <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0B1C30]/75 backdrop-blur-sm animate-fadeIn">
            <div class="bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              
              <!-- Modal Header -->
              <div class="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-xl bg-[#006876]/10 text-[#006876] flex items-center justify-center">
                    <span class="material-symbols-outlined text-[20px]">account_circle</span>
                  </div>
                  <div>
                    <h3 class="text-sm sm:text-base font-bold text-[#172B3A] leading-tight">Ubah Avatar Profil</h3>
                    <p class="text-[11px] text-[#64748B]">Personalisasi foto tampilan Anda di sistem PLN Impact Lab</p>
                  </div>
                </div>
                <button type="button" id="btn-close-avatar-modal" class="p-1 rounded-lg text-[#64748B] hover:text-[#172B3A] hover:bg-[#E2E8F0] transition-colors" title="Tutup">
                  <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <!-- Live Preview Circle -->
              <div class="px-5 py-4 bg-gradient-to-b from-[#F8FAFC] to-white border-b border-[#F1F5F9] flex items-center gap-4">
                <div class="relative shrink-0">
                  <div id="avatar-live-preview" class="w-16 h-16 rounded-full overflow-hidden shadow-md ring-4 ring-[#23C4DB]/30 bg-[#006876] text-white flex items-center justify-center font-bold text-2xl">
                    ${selectedAvatar 
                      ? `<img src="${selectedAvatar}" alt="Preview" class="w-full h-full object-cover" />`
                      : initial}
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-bold text-[#172B3A] truncate">${user.nama || 'Pengguna'}</div>
                  <div class="text-[11px] text-[#006876] font-medium">${user.unit || 'PLN Unit'} • ${user.role || 'Pegawai'}</div>
                  <div class="text-[10px] text-[#64748B] mt-0.5">Avatar ini akan tampil di Sidebar, Topbar, dan Halaman Profil Anda.</div>
                </div>
              </div>

              <!-- Tabs Nav -->
              <div class="px-5 pt-3 flex border-b border-[#E2E8F0] gap-2 bg-white">
                <button type="button" class="tab-avatar-btn pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'preset' ? 'border-[#006876] text-[#006876]' : 'border-transparent text-[#64748B] hover:text-[#172B3A]'}" data-tab="preset">
                  <span class="material-symbols-outlined text-[16px]">groups</span>
                  <span>Karakter PLN</span>
                </button>
                <button type="button" class="tab-avatar-btn pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'upload' ? 'border-[#006876] text-[#006876]' : 'border-transparent text-[#64748B] hover:text-[#172B3A]'}" data-tab="upload">
                  <span class="material-symbols-outlined text-[16px]">upload_file</span>
                  <span>Unggah Foto</span>
                </button>
                <button type="button" class="tab-avatar-btn pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'gradient' ? 'border-[#006876] text-[#006876]' : 'border-transparent text-[#64748B] hover:text-[#172B3A]'}" data-tab="gradient">
                  <span class="material-symbols-outlined text-[16px]">palette</span>
                  <span>Gradien Inisial</span>
                </button>
              </div>

              <!-- Tab Body (Scrollable) -->
              <div class="p-5 overflow-y-auto flex-1 space-y-4">
                
                <!-- TAB 1: PRESET KARAKTER PLN -->
                <div id="tab-content-preset" class="${activeTab === 'preset' ? 'block' : 'hidden'} space-y-3">
                  <div class="text-[11px] text-[#64748B]">Pilih salah satu karakter resmi bertema PLN di bawah ini:</div>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    ${presets.map(p => {
                      const isSelected = selectedAvatar === p.dataUri;
                      return `
                        <button type="button" class="btn-select-preset relative flex flex-col items-center p-3 rounded-xl border text-center transition-all ${isSelected ? 'border-[#006876] bg-[#F0FDFA] ring-2 ring-[#006876]/30' : 'border-[#CBD5E1] hover:border-[#006876]/60 hover:bg-[#F8FAFC]'}" data-uri="${p.dataUri}">
                          <div class="w-14 h-14 rounded-full overflow-hidden shadow-sm mb-2 shrink-0">
                            <img src="${p.dataUri}" alt="${p.name}" class="w-full h-full object-cover" />
                          </div>
                          <div class="text-[11px] font-bold text-[#172B3A] leading-tight line-clamp-1">${p.name}</div>
                          <div class="text-[9px] text-[#64748B] leading-tight mt-0.5">${p.role}</div>
                          ${isSelected ? `<span class="material-symbols-outlined absolute top-1.5 right-1.5 text-[16px] text-[#006876] bg-white rounded-full">check_circle</span>` : ''}
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>

                <!-- TAB 2: UNGGAH FOTO SENDIRI -->
                <div id="tab-content-upload" class="${activeTab === 'upload' ? 'block' : 'hidden'} space-y-3">
                  <div class="border-2 border-dashed border-[#CBD5E1] hover:border-[#006876] rounded-xl p-6 text-center bg-[#F8FAFC] transition-colors cursor-pointer" id="dropzone-avatar">
                    <input type="file" id="input-file-avatar" accept="image/png, image/jpeg, image/webp" class="hidden" />
                    <div class="flex flex-col items-center gap-2 pointer-events-none">
                      <div class="w-12 h-12 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                        <span class="material-symbols-outlined text-[24px]">add_a_photo</span>
                      </div>
                      <div class="text-xs font-bold text-[#172B3A]">Klik atau Tarik Foto ke Sini</div>
                      <div class="text-[11px] text-[#64748B]">Mendukung file JPG, PNG, atau WebP (Maksimal 5MB)</div>
                      <div class="text-[10px] text-[#006876] font-medium mt-1">Sistem akan otomatis menyesuaikan rasio lingkaran 1:1</div>
                    </div>
                  </div>

                  <div id="upload-status-box" class="hidden p-2.5 rounded-lg text-xs border"></div>
                </div>

                <!-- TAB 3: GRADIEN INISIAL -->
                <div id="tab-content-gradient" class="${activeTab === 'gradient' ? 'block' : 'hidden'} space-y-3">
                  <div class="text-[11px] text-[#64748B]">Pilih palet warna gradien modern untuk inisial nama Anda:</div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    ${gradients.map(g => {
                      const gradUri = window.AvatarManager.generateGradientAvatar(user.nama, g.from, g.to);
                      const isSelected = selectedAvatar === gradUri;
                      return `
                        <button type="button" class="btn-select-gradient relative flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${isSelected ? 'border-[#006876] bg-[#F0FDFA] ring-2 ring-[#006876]/30' : 'border-[#CBD5E1] hover:border-[#006876]/60 hover:bg-[#F8FAFC]'}" data-uri="${gradUri}">
                          <div class="w-10 h-10 rounded-full overflow-hidden shadow-sm shrink-0">
                            <img src="${gradUri}" alt="${g.name}" class="w-full h-full object-cover" />
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="text-xs font-bold text-[#172B3A] leading-tight truncate">${g.name}</div>
                            <div class="text-[10px] text-[#64748B] mt-0.5">Inisial "${initial}"</div>
                          </div>
                          ${isSelected ? `<span class="material-symbols-outlined text-[16px] text-[#006876] shrink-0">check_circle</span>` : ''}
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>

              </div>

              <!-- Modal Footer -->
              <div class="px-5 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  ${user.avatar ? `
                    <button type="button" id="btn-remove-avatar" class="text-xs text-[#DC2626] hover:text-[#991B1B] font-semibold flex items-center gap-1 p-1">
                      <span class="material-symbols-outlined text-[16px]">delete</span>
                      <span>Hapus Foto (Gunakan Default)</span>
                    </button>
                  ` : ''}
                </div>

                <div class="flex items-center gap-2 ml-auto">
                  <button type="button" id="btn-cancel-avatar" class="px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#E2E8F0] rounded-lg transition-colors">
                    Batal
                  </button>
                  <button type="button" id="btn-save-avatar" class="btn-primary text-xs font-semibold py-2 px-4 shadow-sm flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[16px]">check</span>
                    <span>Terapkan Avatar</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        `;

        // Bind Events
        bindModalEvents();
      };

      const bindModalEvents = () => {
        const initial = (user.nama || 'U').charAt(0).toUpperCase();

        // Close handlers
        const closeModal = () => {
          modalHost.innerHTML = '';
        };

        modalHost.querySelector('#btn-close-avatar-modal')?.addEventListener('click', closeModal);
        modalHost.querySelector('#btn-cancel-avatar')?.addEventListener('click', closeModal);

        // Tab Switching
        modalHost.querySelectorAll('.tab-avatar-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            activeTab = btn.getAttribute('data-tab');
            renderModalContent();
          });
        });

        // Preset click
        modalHost.querySelectorAll('.btn-select-preset').forEach(btn => {
          btn.addEventListener('click', () => {
            selectedAvatar = btn.getAttribute('data-uri');
            updatePreview();
            renderModalContent();
          });
        });

        // Gradient click
        modalHost.querySelectorAll('.btn-select-gradient').forEach(btn => {
          btn.addEventListener('click', () => {
            selectedAvatar = btn.getAttribute('data-uri');
            updatePreview();
            renderModalContent();
          });
        });

        // Dropzone & File Input
        const dropzone = modalHost.querySelector('#dropzone-avatar');
        const fileInput = modalHost.querySelector('#input-file-avatar');
        const statusBox = modalHost.querySelector('#upload-status-box');

        if (dropzone && fileInput) {
          dropzone.addEventListener('click', () => fileInput.click());

          // Drag and drop handlers
          ['dragenter', 'dragover'].forEach(name => {
            dropzone.addEventListener(name, (e) => {
              e.preventDefault();
              dropzone.classList.add('border-[#006876]', 'bg-[#F0FDFA]');
            });
          });
          ['dragleave', 'drop'].forEach(name => {
            dropzone.addEventListener(name, (e) => {
              e.preventDefault();
              dropzone.classList.remove('border-[#006876]', 'bg-[#F0FDFA]');
            });
          });

          dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files && files[0]) handleFile(files[0]);
          });

          fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
          });
        }

        const handleFile = async (file) => {
          if (!statusBox) return;
          statusBox.className = 'p-2.5 rounded-lg text-xs border bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8] flex items-center gap-2';
          statusBox.innerHTML = '<span class="inline-block w-3.5 h-3.5 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin"></span> Memproses dan menyesuaikan rasio foto...';
          statusBox.classList.remove('hidden');

          try {
            const compressed = await window.AvatarManager.processUploadedFile(file);
            selectedAvatar = compressed;
            statusBox.className = 'p-2.5 rounded-lg text-xs border bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] flex items-center gap-2';
            statusBox.innerHTML = '<span class="material-symbols-outlined text-[16px] text-[#059669]">check_circle</span> Foto berhasil diproses dan siap diterapkan.';
            updatePreview();
          } catch (err) {
            statusBox.className = 'p-2.5 rounded-lg text-xs border bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]';
            statusBox.textContent = `Gagal memproses foto: ${err.message}`;
          }
        };

        const updatePreview = () => {
          const previewEl = modalHost.querySelector('#avatar-live-preview');
          if (!previewEl) return;
          if (selectedAvatar) {
            previewEl.innerHTML = `<img src="${selectedAvatar}" alt="Preview" class="w-full h-full object-cover" />`;
          } else {
            previewEl.textContent = initial;
          }
        };

        // Hapus Avatar
        modalHost.querySelector('#btn-remove-avatar')?.addEventListener('click', () => {
          selectedAvatar = '';
          const res = window.AvatarManager.saveAvatar('');
          closeModal();
          if (window.App) window.App.showToast('Foto profil telah dikembalikan ke inisial default.', 'info');
          if (typeof options.onSave === 'function') options.onSave(res.user);
        });

        // Simpan Avatar
        modalHost.querySelector('#btn-save-avatar')?.addEventListener('click', () => {
          const res = window.AvatarManager.saveAvatar(selectedAvatar);
          closeModal();
          if (res.success) {
            if (window.App) window.App.showToast('Avatar profil Anda berhasil diperbarui!', 'success');
            if (typeof options.onSave === 'function') options.onSave(res.user);
          } else {
            if (window.App) window.App.showToast(res.message, 'error');
          }
        });
      };

      // Tampilkan pertama kali
      renderModalContent();
    }
  };
})();
