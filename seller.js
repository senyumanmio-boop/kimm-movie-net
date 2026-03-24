const API_KEY = '1306003844bd5fa3d43d44726d5a9cb0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
let isLoading = false;
let currentTab = 'home';
let searchTimeout;

// 1. INITIALIZE APP
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
}

// 2. SEARCH
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

// 3. NAVIGASI TAB
function pindahTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById('search-result-section').classList.add('hidden');
    
    const targetTab = document.getElementById(`tab-${tab}`);
    if (targetTab) targetTab.classList.remove('hidden');
    
    const btnHome = document.getElementById('btn-home');
    const btnMovie = document.getElementById('btn-movie');
    
    if (tab === 'home') {
        btnHome.classList.add('text-red-600');
        btnMovie.classList.remove('text-red-600');
    } else {
        btnMovie.classList.add('text-red-600');
        btnHome.classList.remove('text-red-600');
        loadTabMovie(); // Fungsi ini yang kita pakai
    }
    window.scrollTo(0,0);
}

// 4. LOAD KATALOG (20 BARIS OTOMATIS)
async function loadTabMovie() {
    const container = document.getElementById('katalog-container');
    if (!container || container.innerHTML !== "") return; // Jangan load ulang kalau sudah ada isinya

    const daftarKategori = [
        { nama: "Lagi Rame (Trending)", url: `${BASE_URL}/trending/movie/week?api_key=${API_KEY}` },
        { nama: "Film Indonesia Terbaru", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_origin_country=ID` },
        { nama: "Hollywood Blockbuster", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_origin_country=US` },
        { nama: "Horror Malam Jumat", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27` },
        { nama: "Action & Petualangan", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28` },
        { nama: "Drakor (Korea)", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_origin_country=KR` },
        { nama: "Anime & Kartun", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16` },
        { nama: "Komedi Kocak", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35` },
        { nama: "Sci-Fi & Robot", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=878` },
        { nama: "Misteri & Teka-teki", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=9648` },
        { nama: "Romantis Bikin Baper", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10749` },
        { nama: "Film Thailand", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_origin_country=TH` },
        { nama: "Documentary", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=99` },
        { nama: "Family Time", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10751` },
        { nama: "War (Perang)", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10752` },
        { nama: "Thriller Menegangkan", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=53` },
        { nama: "Fantasy Magic", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=14` },
        { nama: "Music & Concert", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10402` },
        { nama: "Western (Koboi)", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=37` },
        { nama: "Crime (Kriminal)", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=80` }
    ];

    container.innerHTML = `<h2 class="text-2xl font-black italic uppercase mb-8 px-4 text-white">KATALOG <span class="text-red-600">FILM</span></h2>`;

    for (const kat of daftarKategori) {
        const rowId = `row-${kat.nama.replace(/\s+/g, '')}`;
        const rowHTML = `
            <div class="mb-10">
                <h3 class="text-red-600 font-black uppercase italic ml-4 mb-4 tracking-wider text-xs">${kat.nama}</h3>
                <div id="${rowId}" class="flex overflow-x-auto gap-4 px-4 no-scrollbar pb-2 min-h-[150px]">
                    <div class="min-w-[150px] h-56 bg-white/5 animate-pulse rounded-2xl"></div>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', rowHTML);

        try {
            const res = await fetch(`${kat.url}&language=id-ID&sort_by=popularity.desc`);
            const data = await res.json();
            const rowContainer = document.getElementById(rowId);
            if (rowContainer && data.results) {
                rowContainer.innerHTML = "";
                renderSlider(data.results, rowId);
            }
        } catch (e) { console.error("Error di: " + kat.nama); }
    }
}

// 5. RENDER HELPERS
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
            <h4 class="text-[9px] font-bold mt-2 truncate text-gray-300 uppercase">${movie.title}</h4>
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
            <div class="relative h-64 rounded-2xl overflow-hidden border border-white/10 group-hover:border-red-600 transition-all">
                <img src="${IMG_PATH + movie.poster_path}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            </div>
            <h3 class="text-[10px] font-black mt-2 truncate uppercase text-white">${movie.title}</h3>
        `;
        list.appendChild(card);
    });
}

// 6. HOME & HERO
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

// 7. DETAIL & WATCHLIST
async function bukaDetail(id) {
    const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=id-ID`);
    const movie = await res.json();
    
    document.getElementById('modalContent').innerHTML = `
        <img src="${IMG_PATH + movie.poster_path}" class="w-full md:w-2/5 object-cover h-[400px] md:h-auto">
        <div class="p-8 flex flex-col justify-center bg-[#0a0a0a]">
            <h2 class="text-3xl font-black mb-2 italic uppercase text-white leading-tight">${movie.title}</h2>
            <div class="flex gap-4 mb-4 text-[10px] font-black text-red-600 italic">
                <span>⭐ ${movie.vote_average.toFixed(1)}</span>
                <span>📅 ${movie.release_date.split('-')[0]}</span>
            </div>
            <p class="text-gray-400 text-[11px] mb-6 leading-relaxed line-clamp-4">${movie.overview}</p>
            <div class="flex flex-wrap gap-3">
                <button onclick="window.open('https://vidsrc.to/embed/movie/${id}', '_blank')" 
                    class="bg-red-600 px-6 py-3 rounded-full font-black text-[9px] uppercase tracking-widest text-white shadow-lg shadow-red-600/20">Mulai Nonton</button>
                <button onclick="saveWatchlist(${movie.id}, '${movie.title.replace(/'/g, "\\'")}', '${movie.poster_path}')" 
                    class="bg-white/10 border border-white/20 px-6 py-3 rounded-full font-black text-[9px] uppercase tracking-widest text-white hover:bg-white/20 transition">
                    + Watchlist
                </button>
            </div>
        </div>
    `;
    document.getElementById('movieModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function saveWatchlist(id, title, poster) {
    let list = JSON.parse(localStorage.getItem('my_watchlist')) || [];
    if (!list.find(m => m.id === id)) {
        list.push({id, title, poster});
        localStorage.setItem('my_watchlist', JSON.stringify(list));
        alert("Sip! Film tersimpan di Watchlist.");
    } else { alert("Udah ada di daftar kamu, Kim!"); }
}

function tutupModal() {
    document.getElementById('movieModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// 8. SCROLL
window.onscroll = () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 800) {
        if (currentTab === 'home' && !isLoading) loadTabHome();
    }
};

// ==========================================
// 9. FITUR NOVEL (KIMMLIB)
// ==========================================

// Data Novel (Kamu bisa tambah terus di sini)
const novelData = [
    {
        id: 1,
        title: "The Art of Coding",
        author: "Kim Robi",
        category: "Psychology",
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300",
        desc: "Kisah perjuangan seorang remaja Batam membangun ekosistem digital.",
        content: `
            <div class="max-w-2xl mx-auto py-10">
                <h1 class="text-4xl font-black mb-2 uppercase italic tracking-tighter text-red-600">Bab 1: Baris Pertama</h1>
                <p class="text-gray-500 font-bold mb-10 uppercase text-xs tracking-widest">Oleh: Kim Robi</p>
                
                <div class="space-y-6 text-gray-300 leading-loose text-lg font-medium">
                    <p>Malam itu di Batam, cahaya dari layar laptop menyinari wajah Kim. Suasana hening, hanya terdengar suara ketikan keyboard yang ritmis. "Satu baris lagi," gumamnya...</p>
                    <p>Membangun KimmMovie bukan soal koding semata, tapi soal konsistensi. Setiap error adalah guru, dan setiap baris kode adalah batu bata untuk istana masa depannya...</p>
                    <p>Dia tahu bahwa dunia digital sangat luas, namun dia tidak gentar. Dengan semangat "Smadar FC" di dadanya, dia terus mengetik hingga fajar menyingsing.</p>
                </div>
                
                <div class="h-40 flex flex-col items-center justify-center border-t border-white/10 mt-20">
                    <div class="w-12 h-1 bg-red-600 mb-4"></div>
                    <p class="text-gray-500 italic text-sm text-center font-bold uppercase">Bersambung ke Bab Berikutnya... <br> <span class="text-white">Pantau terus KimmLib!</span></p>
                </div>
            </div>
        `
    },
    {
        id: 2,
        title: "Rahasia Algoritma",
        author: "Robi",
        category: "Thriller",
        cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300",
        desc: "Ketika sebuah kode bisa mengendalikan seluruh kota Batam.",
        content: `
            <div class="max-w-2xl mx-auto py-10">
                <h1 class="text-4xl font-black mb-2 uppercase italic tracking-tighter text-red-600">Bab 1: Glitch</h1>
                <div class="space-y-6 text-gray-300 leading-loose text-lg font-medium mt-10">
                    <p>Lampu jalanan di Nagoya tiba-tiba berkedip serentak. Tidak ada yang sadar, kecuali seorang anak yang sedang asyik dengan konsol gamenya...</p>
                    <p>"Ini bukan bug biasa," bisiknya sembari memperhatikan barisan kode yang berjalan terlalu cepat di layarnya.</p>
                </div>
            </div>
        `
    }
];

// Fungsi Buka Tab Novel (Panggil dari Navigasi)
function loadTabNovel() {
    const container = document.getElementById('pane-novels');
    if (!container) return;
    
    // Render Daftar Novel
    const novelGrid = container.querySelector('.grid');
    if (novelGrid) {
        novelGrid.innerHTML = novelData.map(n => `
            <div onclick="openNovel(${n.id})" class="glass p-6 rounded-[32px] flex gap-6 border border-white/5 hover:border-red-600 transition-all cursor-pointer group">
                <div class="w-32 h-48 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
                    <img src="${n.cover}" class="w-full h-full object-cover group-hover:scale-110 transition-all duration-500">
                </div>
                <div class="flex flex-col justify-center">
                    <span class="text-red-600 font-black text-[10px] tracking-[.3em] uppercase mb-2">${n.category}</span>
                    <h3 class="text-2xl font-black mb-2 group-hover:text-red-600 transition-colors">${n.title}</h3>
                    <p class="text-gray-500 text-xs mb-4 line-clamp-3 font-medium">${n.desc}</p>
                    <div class="flex items-center gap-4">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest"><i class="fa fa-user text-red-600 mr-1"></i> ${n.author}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Fungsi Membuka Isi Novel (Reader)
function openNovel(id) {
    const novel = novelData.find(n => n.id === id);
    const readerModal = document.getElementById('readerModal');
    const readerContent = document.getElementById('readerContent');
    
    if(novel && readerModal && readerContent) {
        readerContent.innerHTML = novel.content;
        readerModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        // Animasi Fade In
        readerModal.style.opacity = '0';
        setTimeout(() => readerModal.style.opacity = '1', 10);
    }
}

function closeReader() {
    const readerModal = document.getElementById('readerModal');
    if (readerModal) {
        readerModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// ==========================================
// 10. FITUR MUSIC (LOFI PLAYER)
// ==========================================
let isPlaying = false;
const audio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); // Ganti dengan link MP3 Lofi

function toggleMusic(btn) {
    const icon = btn.querySelector('i');
    if (!isPlaying) {
        audio.play();
        icon.classList.replace('fa-play', 'fa-pause');
        btn.classList.add('animate-pulse');
        isPlaying = true;
    } else {
        audio.pause();
        icon.classList.replace('fa-pause', 'fa-play');
        btn.classList.remove('animate-pulse');
        isPlaying = false;
    }
}

// Tambahkan inisialisasi novel saat tab dipindah
const originalPindahTab = pindahTab;
pindahTab = function(tab) {
    originalPindahTab(tab);
    if(tab === 'novels') loadTabNovel();
};
