// ==========================================
// 1. KONFIGURASI API (Movie & Novel)
// ==========================================
const API_KEY = '1306003844bd5fa3d43d44726d5a9cb0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
// API Sheety Lo
const NOVEL_API = 'https://api.sheety.co/40744eda28ba4514b7bcf2e4f9d38dd3/untitledSpreadsheet/sheet1';

let currentPage = 1;
let isLoading = false;
let currentTab = 'home';
let searchTimeout;

// ==========================================
// 2. INITIALIZE APP
// ==========================================
window.onload = () => {
    const savedName = localStorage.getItem('kimmMovie_user');
    if (savedName) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('main-content').style.opacity = '1';
        initApp();
    }
};

function handleLogin() {
    const nameInput = document.getElementById('userNameInput');
    const name = nameInput ? nameInput.value : "";
    
    if (name.trim() !== "") {
        localStorage.setItem('kimmMovie_user', name);
        document.getElementById('login-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('main-content').style.opacity = '1';
                initApp();
            }, 100);
        }, 500);
    } else { alert("Isi namamu dulu bos!"); }
}

function initApp() {
    loadTabHome(); 
    // Data novel akan dipanggil otomatis saat pindah ke tab 'novels'
}

// ==========================================
// 3. SISTEM NAVIGASI TAB
// ==========================================
function pindahTab(tab) {
    currentTab = tab;
    
    // Sembunyikan semua konten tab
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById('search-result-section').classList.add('hidden');
    
    // Munculkan tab target
    const targetTab = document.getElementById(`tab-${tab}`);
    if (targetTab) targetTab.classList.remove('hidden');
    
    // Update warna tombol navigasi (Biar merah kalo aktif)
    const btnHome = document.getElementById('btn-home');
    const btnMovie = document.getElementById('btn-movie');
    const btnNovel = document.getElementById('btn-novels');
    
    if (btnHome) btnHome.classList.toggle('text-red-600', tab === 'home');
    if (btnMovie) btnMovie.classList.toggle('text-red-600', tab === 'movie');
    if (btnNovel) btnNovel.classList.toggle('text-red-600', tab === 'novels');

    // Trigger Load Data
    if (tab === 'movie') loadTabMovie();
    if (tab === 'novels') fetchNovelsFromAPI();
    
    window.scrollTo(0,0);
}

// ==========================================
// 4. FITUR NOVEL (CUMA DARI GOOGLE SHEETS)
// ==========================================
async function fetchNovelsFromAPI() {
    // Cari container grid novel
    const grid = document.getElementById('novel-grid');
    if(!grid) return;

    grid.innerHTML = `<div class="col-span-full text-center text-white p-10 animate-pulse uppercase font-black italic">Sedang Menghubungkan ke KimmLib...</div>`;

    try {
        const res = await fetch(NOVEL_API);
        const data = await res.json();
        
        // Ambil data dari sheet1
        const novels = data.sheet1; 
        
        if (!novels || novels.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center text-gray-500 p-10 font-bold uppercase">Sheets lo masih kosong, Kim! Isi dulu.</div>`;
            return;
        }

        // Render HTML
        grid.innerHTML = novels.map(n => `
            <div onclick="openNovelFromAPI(${JSON.stringify(n).replace(/"/g, '&quot;')})" 
                 class="glass p-6 rounded-[32px] flex gap-6 border border-white/5 hover:border-red-600 transition-all cursor-pointer group shadow-2xl bg-white/5">
                <div class="w-24 md:w-32 h-36 md:h-48 flex-shrink-0 overflow-hidden rounded-2xl">
                    <img src="${n.cover || 'https://via.placeholder.com/300'}" class="w-full h-full object-cover group-hover:scale-110 transition-all duration-500">
                </div>
                <div class="flex flex-col justify-center overflow-hidden text-left">
                    <span class="text-red-600 font-black text-[10px] tracking-[.3em] uppercase mb-2">${n.category || 'NOVEL'}</span>
                    <h3 class="text-xl md:text-2xl font-black mb-2 text-white group-hover:text-red-600 transition truncate italic uppercase">${n.title}</h3>
                    <p class="text-gray-500 text-[10px] md:text-xs mb-4 line-clamp-2">${n.desc || 'Tidak ada deskripsi.'}</p>
                    <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest"><i class="fa fa-user text-red-600 mr-1"></i> ${n.author || 'KIM'}</span>
                </div>
            </div>
        `).join('');
    } catch (e) { 
        console.error("Gagal muat novel:", e);
        grid.innerHTML = `<div class="col-span-full text-center text-red-600 p-10 font-bold uppercase italic">Error API: Cek Koneksi Sheety lo!</div>`;
    }
}

function openNovelFromAPI(novel) {
    const readerContent = document.getElementById('readerContent');
    const modal = document.getElementById('readerModal');
    if(!readerContent || !modal) return;

    readerContent.innerHTML = `
        <div class="max-w-3xl mx-auto py-10 px-4">
            <div class="mb-10 border-b border-white/10 pb-10">
                <h1 class="text-4xl md:text-6xl font-black italic text-white mb-4 uppercase tracking-tighter">${novel.title}</h1>
                <p class="text-red-600 font-black italic uppercase tracking-widest text-sm">Author: ${novel.author}</p>
            </div>
            <div class="text-gray-300 text-lg md:text-xl leading-relaxed space-y-6 italic text-left">
                ${novel.content ? novel.content.replace(/\n/g, '<br>') : 'Konten kosong.'}
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeReader() {
    const modal = document.getElementById('readerModal');
    if(modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
    }
}

// ==========================================
// 5. FITUR MOVIE (TMDB)
// ==========================================
async function loadTabHome() {
    if (isLoading) return;
    isLoading = true;
    try {
        const resTrending = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=id-ID`);
        const dataTrending = await resTrending.json();
        if(dataTrending.results.length > 0) setHero(dataTrending.results[0]);
        
        const container = document.getElementById('home-recommend');
        if(currentPage === 1 && container) container.innerHTML = "";
        renderGrid(dataTrending.results, 'home-recommend');
        currentPage++;
    } catch (e) { console.error(e); }
    isLoading = false;
}

function setHero(movie) {
    const banner = document.getElementById('hero-banner');
    if(!banner || !movie) return;
    banner.style.backgroundImage = `linear-gradient(to top, #000 15%, transparent 95%), url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`;
    document.getElementById('hero-title').innerText = movie.title;
    document.getElementById('hero-desc').innerText = movie.overview;
    document.getElementById('hero-btn-nonton').onclick = () => bukaDetail(movie.id);
}

async function loadTabMovie() {
    const container = document.getElementById('katalog-container');
    if (!container || container.innerHTML !== "") return;

    const daftarKategori = [
        { nama: "Lagi Rame", url: `${BASE_URL}/trending/movie/week?api_key=${API_KEY}` },
        { nama: "Action & Petualangan", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28` },
        { nama: "Horror Malam Jumat", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27` }
    ];

    container.innerHTML = `<h2 class="text-2xl font-black italic uppercase mb-8 px-4 text-white">KATALOG <span class="text-red-600">FILM</span></h2>`;

    for (const kat of daftarKategori) {
        const rowId = `row-${kat.nama.replace(/\s+/g, '')}`;
        container.insertAdjacentHTML('beforeend', `
            <div class="mb-10">
                <h3 class="text-red-600 font-black uppercase italic ml-4 mb-4 tracking-wider text-xs">${kat.nama}</h3>
                <div id="${rowId}" class="flex overflow-x-auto gap-4 px-4 no-scrollbar pb-2 min-h-[150px]"></div>
            </div>`);

        try {
            const res = await fetch(`${kat.url}&language=id-ID`);
            const data = await res.json();
            renderSlider(data.results, rowId);
        } catch (e) { console.error(e); }
    }
}

// ==========================================
// 6. RENDER HELPERS
// ==========================================
function renderSlider(movies, containerId) {
    const list = document.getElementById(containerId);
    if(!list) return;
    movies.forEach(movie => {
        if (!movie.poster_path) return;
        const card = document.createElement('div');
        card.className = "min-w-[130px] md:min-w-[180px] group cursor-pointer";
        card.onclick = () => bukaDetail(movie.id);
        card.innerHTML = `
            <div class="relative h-48 md:h-64 overflow-hidden rounded-xl border border-white/5 bg-[#111]">
                <img src="${IMG_PATH + movie.poster_path}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black text-yellow-500">⭐ ${movie.vote_average.toFixed(1)}</div>
            </div>
            <h4 class="text-[9px] font-bold mt-2 truncate text-gray-300 uppercase text-left">${movie.title}</h4>
        `;
        list.appendChild(card);
    });
}

function renderGrid(movies, containerId) {
    const list = document.getElementById(containerId);
    if(!list) return;
    movies.forEach(movie => {
        if (!movie.poster_path) return;
        const card = document.createElement('div');
        card.className = "cursor-pointer group";
        card.onclick = () => bukaDetail(movie.id);
        card.innerHTML = `
            <div class="relative h-64 rounded-2xl overflow-hidden border border-white/10 group-hover:border-red-600 transition-all shadow-xl">
                <img src="${IMG_PATH + movie.poster_path}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            </div>
            <h3 class="text-[10px] font-black mt-2 truncate uppercase text-white tracking-widest text-left">${movie.title}</h3>
        `;
        list.appendChild(card);
    });
}

async function bukaDetail(id) {
    const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=id-ID`);
    const movie = await res.json();
    
    document.getElementById('modalContent').innerHTML = `
        <img src="${IMG_PATH + movie.poster_path}" class="w-full md:w-2/5 object-cover h-[400px] md:h-auto shadow-2xl">
        <div class="p-8 flex flex-col justify-center bg-[#0a0a0a] text-left">
            <h2 class="text-3xl font-black mb-2 italic uppercase text-white leading-tight">${movie.title}</h2>
            <div class="flex gap-4 mb-4 text-[10px] font-black text-red-600 italic">
                <span>⭐ ${movie.vote_average.toFixed(1)}</span>
                <span>📅 ${movie.release_date.split('-')[0]}</span>
            </div>
            <p class="text-gray-400 text-[11px] mb-6 leading-relaxed line-clamp-4">${movie.overview}</p>
            <button onclick="window.open('https://vidsrc.to/embed/movie/${id}', '_blank')" 
                class="bg-red-600 px-6 py-3 rounded-full font-black text-[9px] uppercase tracking-widest text-white shadow-lg shadow-red-600/20 hover:scale-105 transition">Mulai Nonton</button>
        </div>
    `;
    document.getElementById('movieModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function tutupModal() {
    document.getElementById('movieModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// ==========================================
// 7. SEARCH & MUSIC
// ==========================================
document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value;
    searchTimeout = setTimeout(async () => {
        if (query.length > 2) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
            document.getElementById('search-result-section').classList.remove('hidden');
            const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&language=id-ID`);
            const data = await res.json();
            const container = document.getElementById('movie-list');
            container.innerHTML = "";
            renderGrid(data.results, 'movie-list');
        } else if (query.length === 0) {
            pindahTab('home');
        }
    }, 500);
});

let isMusicPlaying = false;
const audio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); 

function toggleMusic(btn) {
    const icon = btn.querySelector('i');
    if (!isMusicPlaying) {
        audio.play();
        icon.classList.replace('fa-play', 'fa-pause');
        btn.classList.add('animate-pulse');
        isMusicPlaying = true;
    } else {
        audio.pause();
        icon.classList.replace('fa-pause', 'fa-play');
        btn.classList.remove('animate-pulse');
        isMusicPlaying = false;
    }
}
// Variable untuk debounce search biar gak kena limit API
let searchTimeout;

async function liveSearch(query) {
    clearTimeout(searchTimeout);
    const grid = document.getElementById('movie-grid');
    const trendingSection = document.querySelector('#pane-movies h2:first-of-type').parentElement;
    
    if (query.length < 1) {
        // Balikin ke tampilan awal kalau input kosong
        grid.innerHTML = "";
        moviePage = 1;
        loadMoreMovies();
        trendingSection.style.display = "block";
        return;
    }

    // Tunggu user selesai ngetik (300ms) baru tembak API
    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`${BASE_URL}/search/movie?api_key=${MOVIE_API_KEY}&query=${encodeURIComponent(query)}&language=id-ID`);
            const data = await res.json();
            
            // Sembunyiin trending pas lagi nyari
            trendingSection.style.display = "none";
            
            grid.innerHTML = ""; // Bersihin grid
            
            if (data.results.length === 0) {
                grid.innerHTML = `<p class="col-span-full text-center text-gray-500 py-20 font-bold italic uppercase">Film "${query}" gak ketemu, Kim!</p>`;
                return;
            }

            data.results.forEach(m => {
                if(!m.poster_path) return;
                const card = document.createElement('div');
                card.className = 'card-hover cursor-pointer group';
                card.onclick = () => openMovie(m.id);
                card.innerHTML = `
                    <div class="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 aspect-[2/3]">
                        <img src="${POSTER_URL + m.poster_path}" class="w-full h-full object-cover group-hover:scale-110 transition-all duration-500">
                    </div>
                    <h3 class="text-[10px] font-black mt-3 truncate uppercase tracking-tighter text-gray-400 group-hover:text-red-600 transition text-left">${m.title}</h3>
                `;
                grid.appendChild(card);
            });
        } catch (e) {
            console.error("Search Error:", e);
        }
    }, 300);
}

// Update handleLogin sedikit biar nama profil otomatis berubah
const originalHandleLogin = handleLogin;
handleLogin = function() {
    const name = document.getElementById('userNameInput').value || 'Kim';
    document.getElementById('profile-name').innerText = name;
    originalHandleLogin();
}
// ... (kode atas tetap sama)

        async function openMovie(id) {
            // 1. Coba ambil data bahasa Indonesia dulu
            const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${MOVIE_API_KEY}&append_to_response=videos,credits&language=id-ID`);
            let m = await res.json();
            
            // 2. FALLBACK: Kalau sinopsis Indo kosong, ambil dari English
            if (!m.overview || m.overview.length < 5) {
                const resEn = await fetch(`${BASE_URL}/movie/${id}?api_key=${MOVIE_API_KEY}&append_to_response=videos&language=en-US`);
                const dataEn = await resEn.json();
                m.overview = dataEn.overview;
                // Kalau trailer Indo gak ada, pakai trailer hasil search English
                if (!m.videos.results.length) m.videos.results = dataEn.videos.results;
            }

            const trailer = m.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || m.videos.results[0];
            const cast = m.credits.cast.slice(0, 10); 
            
            document.getElementById('modalData').innerHTML = `
                <div class="flex flex-col lg:flex-row gap-12 mb-16 text-left">
                    <div class="w-full lg:w-1/3">
                        <img src="${POSTER_URL + m.poster_path}" class="w-full rounded-[40px] shadow-2xl border border-white/10">
                        <div class="mt-6 flex flex-wrap gap-2">
                            ${m.genres.map(g => `<span class="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 uppercase">${g.name}</span>`).join('')}
                        </div>
                    </div>
                    <div class="w-full lg:w-2/3">
                        <div class="flex items-center gap-4 mb-4">
                            <span class="text-red-600 font-black text-xl italic tracking-tighter"><i class="fa fa-star"></i> ${m.vote_average.toFixed(1)}</span>
                            <span class="text-gray-500 font-bold text-xs uppercase">${m.release_date ? m.release_date.split('-')[0] : '-'}</span>
                            <span class="text-gray-500 font-bold text-xs uppercase">${m.runtime} Menit</span>
                        </div>
                        <h1 class="text-5xl md:text-8xl font-black italic uppercase leading-none mb-6 tracking-tighter">${m.title}</h1>
                        <h3 class="text-red-600 font-black uppercase text-sm mb-4 italic tracking-widest">Sinopsis:</h3>
                        <p class="text-gray-300 text-lg mb-8 opacity-80 leading-loose">${m.overview || 'Sinopsis belum tersedia untuk film ini.'}</p>
                        
                        <div class="mb-10">
                            <h3 class="text-red-600 font-black uppercase text-sm mb-6 italic tracking-widest">Pemeran Utama:</h3>
                            <div class="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                                ${cast.map(c => `
                                    <div class="min-w-[100px] text-center">
                                        <div class="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-white/10 mb-2">
                                            <img src="${c.profile_path ? 'https://image.tmdb.org/t/p/w185' + c.profile_path : 'https://via.placeholder.com/185x185?text=No+Photo'}" class="w-full h-full object-cover">
                                        </div>
                                        <p class="text-[9px] font-black uppercase text-white truncate w-24">${c.name}</p>
                                        <p class="text-[8px] font-bold uppercase text-gray-500 truncate w-24">${c.character}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <button onclick="window.open('https://vidsrc.to/embed/movie/${id}', '_blank')" class="bg-red-600 px-12 py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-red-600/30 hover:scale-105 transition-all">Mulai Nonton</button>
                    </div>
                </div>
                
                <div class="mb-20">
                    <h2 class="text-2xl font-black italic uppercase mb-8 flex items-center gap-3"><i class="fa fa-play text-red-600"></i> Official Trailer</h2>
                    <div class="relative w-full aspect-video rounded-[40px] overflow-hidden border border-white/10 shadow-2xl bg-white/5">
                        ${trailer ? 
                            `<iframe class="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/${trailer.key}?autoplay=0&rel=0" frameborder="0" allowfullscreen></iframe>` 
                            : `<div class="flex items-center justify-center h-full text-gray-500 font-bold italic uppercase">Trailer tidak ditemukan</div>`
                        }
                    </div>
                </div>
            `;
            document.getElementById('movieModal').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            document.getElementById('movieModal').scrollTop = 0;
        }
/* Khusus Mobile */
@media (max-width: 768px) {
    #modalData .flex-col {
        gap: 1.5rem !important; /* Jarak poster & teks lebih rapet */
    }

    #modalData h1 {
        font-size: 2.5rem !important; /* Font judul dikecilin biar gak kepotong */
        line-height: 1.1;
    }

    #modalData .w-full.lg\:w-1\/3 {
        width: 70% !important; /* Poster jangan menuhin layar banget, biar estetik */
        margin: 0 auto;
    }

    #modalData p {
        font-size: 1rem !important; /* Sinopsis biar enak dibaca */
        line-height: 1.6;
    }

    /* Tombol Nonton di HP biar Full Width */
    #modalData button {
        width: 100%;
        padding: 1rem !important;
        font-size: 12px !important;
    }
}

/* Biar scroll modal di HP halus */
#movieModal {
    -webkit-overflow-scrolling: touch;
}

        // ... (kode bawah tetap sama)

function playAmbient(type) {
    const sound = sounds[type];
    const btn = document.getElementById('btn-' + type);

    if (sound.paused) {
        // Coba play dan tangkap kalau ada error
        sound.play()
            .then(() => {
                console.log("Suara " + type + " mulai bunyi!");
                btn.style.background = "#ff4757";
                btn.style.boxShadow = "0 0 20px rgba(255, 71, 87, 0.5)";
            })
            .catch(error => {
                console.error("Gagal putar suara:", error);
                alert("Klik dulu di mana saja dalam web, baru tekan tombol suaranya!");
            });
    } else {
        sound.pause();
        btn.style.background = "#333";
        btn.style.boxShadow = "none";
    }
}
const sounds = {
    // Link ini stabil, HTTPS, dan gak bakal mati dalam 10 menit
    rain: new Audio('https://serv1.y2dl.space/dl/mp3/IW07s1ul3Bg.mp3?sig=Hb2zdWSp4vNEjMVtmptw2eeE8p3OmYwRsxV-tBajYZZy1pOAoT7CXGJMzOx3C35pDJ5mRQSzbtkjIS4MhAWLX1nkK6tcbh_kY5mzLLx47C7JqJKpR8vWTMOHOS6XtdQqD_juk3fk-ZodE-6L3RrvsajCAXLtaL60ruFTRX29VUe_4EfkYZeIEq2wSqZXQ8E8T5fEoqFgfma9n-EIfzNPsYkCSob1o8hAC0L1f8BTzgQZwLJs5TRFHsBeY0aQ4I2jjBhLW2jgRtSrKy9Rk-OnWc7TsUUV-A.U2oB4PchRgxOXUJyoAyGZvFNcnbajNf7BsY1RL6LygU&name=suara+hujan+pengantar+tidur+menenangkan+%285+menit%29'),
    wind: new Audio('https://commondatastorage.googleapis.com/codeskulptor-assets/soundtracks/digital_props_atmo_02.mp3'),
    fire: new Audio('https://actions.google.com/sounds/v1/ambient/fireplace_crackling.ogg'),
    water: new Audio('https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg')
};

Object.values(sounds).forEach(s => {
    s.loop = true;
    s.crossOrigin = "anonymous";
});
// ==========================================
// 4. FITUR NOVEL (100+ NOVELS GENERATOR)
// ==========================================
async function fetchNovelsFromAPI() {
    const grid = document.getElementById('novel-grid');
    if(!grid) return;

    grid.innerHTML = `<div class="col-span-full text-center text-white p-10 animate-pulse uppercase font-black italic">Menghubungkan ke Database 100+ Novel KimmLib...</div>`;

    try {
        const res = await fetch(NOVEL_API);
        const data = await res.json();
        const novelsFromSheet = data.sheet1 || []; 
        
        // PANGGIL GENERATOR 100 NOVEL
        const manualNovels = generate100Novels();
        
        // Gabungin data Sheets (kalo ada) sama 100 novel buatan JS
        const allNovels = [...novelsFromSheet, ...manualNovels];

        grid.innerHTML = allNovels.map((n, index) => `
            <div onclick="openNovelFromAPI(${JSON.stringify(n).replace(/"/g, '&quot;')})" 
                 class="glass p-6 rounded-[32px] flex gap-6 border border-white/5 hover:border-red-600 transition-all cursor-pointer group shadow-2xl bg-white/5 relative overflow-hidden"
                 style="animation-delay: ${index * 0.05}s">
                <div class="w-24 md:w-32 h-36 md:h-48 flex-shrink-0 overflow-hidden rounded-2xl shadow-lg border border-white/5">
                    <img src="${n.cover}" class="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" loading="lazy">
                </div>
                <div class="flex flex-col justify-center overflow-hidden text-left z-10">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-red-600 font-black text-[10px] tracking-[.3em] uppercase">${n.category}</span>
                        <span class="text-[8px] px-2 py-0.5 bg-white/10 rounded text-gray-400">#${index + 1}</span>
                    </div>
                    <h3 class="text-xl md:text-2xl font-black mb-2 text-white group-hover:text-red-600 transition truncate italic uppercase">${n.title}</h3>
                    <p class="text-gray-500 text-[10px] md:text-xs mb-4 line-clamp-2 italic">${n.desc}</p>
                    <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest"><i class="fa fa-user text-red-600 mr-1"></i> ${n.author}</span>
                </div>
                <div class="absolute -right-4 -bottom-4 text-white/5 text-6xl font-black italic select-none">${index + 1}</div>
            </div>
        `).join('');
    } catch (e) { 
        console.error("Gagal muat novel:", e);
        // Tetap munculin 100 novel kalau API Sheets lo error/limit
        grid.innerHTML = generate100Novels().map((n, index) => `
            <div onclick="openNovelFromAPI(${JSON.stringify(n).replace(/"/g, '&quot;')})" class="glass p-6 rounded-[32px] flex gap-6 border border-white/5 hover:border-red-600 transition-all cursor-pointer bg-white/5">
                </div>`).join('');
    }
}

// GENERATOR 100 JUDUL NOVEL (KEREN & BERVARIASI)
function generate100Novels() {
    const data = [];
    const subjects = ["Shadow", "Cyber", "Last", "Neon", "Red", "Code", "Ghost", "Dead", "Void", "Gold", "Night", "Batam", "Digital", "Echo", "Silent", "Lost", "Final", "Infinity", "Wild", "Black"];
    const objects = ["Hunter", "Script", "System", "City", "Soul", "Heaven", "Warrior", "Legend", "Protocol", "Memory", "Sky", "Empire", "Blade", "Justice", "Reality", "Game", "Force", "King", "Bite", "Heart"];
    const categories = ["ACTION", "CYBERPUNK", "DRAMA", "HORROR", "SCI-FI", "THRILLER", "FANTASY"];
    const authors = ["Kimm Movie", "Robi Dev", "Era Khaii", "Unknown"];

    for (let i = 1; i <= 100; i++) {
        const sub = subjects[Math.floor(Math.random() * subjects.length)];
        const obj = objects[Math.floor(Math.random() * objects.length)];
        const cat = categories[Math.floor(Math.random() * categories.length)];
        
        data.push({
            title: `${sub} ${obj} : Chapter ${i}`,
            author: authors[Math.floor(Math.random() * authors.length)],
            category: cat,
            cover: `https://picsum.photos/seed/kimm${i}/300/450`,
            desc: `Sebuah kisah epik tentang ${sub.toLowerCase()} yang mencoba menguasai ${obj.toLowerCase()} di masa depan.`,
            content: `Ini adalah isi dari novel ${sub} ${obj}. Ceritanya sangat panjang dan mendalam... \n\nDi sebuah sudut kota yang gelap, bayangan itu mulai bergerak. Tidak ada yang tahu bahwa hari ini akan menjadi hari terakhir bagi dunia lama. ${sub} telah bangkit, dan tidak ada protokol yang bisa menghentikannya. \n\n"Apakah kamu siap, Kim?" tanya sebuah suara dari kegelapan.`
        });
    }
    return data;
}
