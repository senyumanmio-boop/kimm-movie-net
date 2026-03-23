const API_KEY = '1306003844bd5fa3d43d44726d5a9cb0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
let isLoading = false;
let currentTab = 'home';
let searchTimeout;

// 1. INITIALIZE APP (Auto-Login & Data Load)
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
    const name = document.getElementById('userNameInput').value;
    if (name.trim() !== "") {
        localStorage.setItem('kimmMovie_user', name);
        document.getElementById('login-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('main-content').classList.remove('hidden');
            setTimeout(() => document.getElementById('main-content').style.opacity = '1', 100);
            initApp();
        }, 500);
    } else { alert("Isi namamu dulu bos!"); }
}

function initApp() {
    loadTabHome(); // Load Home (Hero & Trending)
}

// 2. SEARCH OPTIMIZATION (Live Search)
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

// --- FIX NAVIGASI & KATALOG ---
function pindahTab(tab) {
    activeTab = tab; // Update status tab aktif
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById('search-result-section').classList.add('hidden');
    
    const targetTab = document.getElementById(`tab-${tab}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }
    
    // Update warna icon navigasi
    const btnHome = document.getElementById('btn-home');
    const btnMovie = document.getElementById('btn-movie');
    
    if (tab === 'home') {
        btnHome.classList.add('text-red-600');
        btnMovie.classList.remove('text-red-600');
    } else {
        btnMovie.classList.add('text-red-600');
        btnHome.classList.remove('text-red-600');
        // PAKSA LOAD KATALOG BIAR LANGSUNG BANYAK
        loadTabMovie(); 
    }
    window.scrollTo(0,0);
}

// --- FIX KATALOG BIAR FULL BARIS ---
async function loadTabMovie() {
    const categories = [
        { nama: "Film Indonesia", params: "&with_origin_country=ID" },
        { nama: "Hollywood Hits", params: "&with_origin_country=US" },
        { nama: "Horror Malam Jumat", params: "&with_genres=27" },
        { nama: "Action Seru", params: "&with_genres=28" },
        { nama: "Anime & Kartun", params: "&with_genres=16" },
        { nama: "Drama Korea", params: "&with_origin_country=KR" }
    ];

    const containerKatalog = document.getElementById('tab-movie');
    // Bersihkan dulu tapi sisain judul atasnya
    containerKatalog.innerHTML = '<h2 class="text-2xl font-black italic uppercase mb-6 px-4 pt-4">KATALOG <span class="text-red-600">FILM</span></h2>';

    for (const kat of categories) {
        const sectionId = `section-${kat.nama.replace(/\s+/g, '')}`;
        const sectionHTML = `
            <div class="mb-8">
                <h3 class="text-red-600 font-black uppercase italic ml-4 mb-3 tracking-wider text-sm">${kat.nama}</h3>
                <div id="${sectionId}" class="flex overflow-x-auto gap-4 px-4 no-scrollbar pb-2">
                    <div class="min-w-[150px] h-56 bg-white/5 animate-pulse rounded-2xl"></div>
                    <div class="min-w-[150px] h-56 bg-white/5 animate-pulse rounded-2xl"></div>
                </div>
            </div>
        `;
        containerKatalog.insertAdjacentHTML('beforeend', sectionHTML);

        // Ambil data asli
        try {
            const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=id-ID&sort_by=popularity.desc${kat.params}`);
            const data = await res.json();
            const listContainer = document.getElementById(sectionId);
            listContainer.innerHTML = ""; // Hapus shimmer
            renderSlider(data.results, sectionId);
        } catch (e) { console.error("Gagal ambil " + kat.nama); }
    }
}
// 5. RENDER HELPERS
function renderSlider(movies, containerId) {
    const list = document.getElementById(containerId);
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
    movies.forEach(movie => {
        if (!movie.poster_path) return;
        const card = document.createElement('div');
        card.className = "cursor-pointer group";
        card.onclick = () => bukaDetail(movie.id);
        card.innerHTML = `
            <div class="relative h-64 rounded-2xl overflow-hidden border border-white/10">
                <img src="${IMG_PATH + movie.poster_path}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            </div>
            <h3 class="text-[10px] font-black mt-2 truncate uppercase text-white">${movie.title}</h3>
        `;
        list.appendChild(card);
    });
}

// 6. HOME & HERO LOGIC
async function loadTabHome() {
    if (isLoading) return;
    isLoading = true;
    try {
        const resTrending = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=id-ID`);
        const dataTrending = await resTrending.json();
        setHero(dataTrending.results[0]);
        
        const container = document.getElementById('home-recommend');
        if(currentPage === 1) container.innerHTML = "";
        renderGrid(dataTrending.results, 'home-recommend');
        currentPage++;
    } catch (e) { console.error(e); }
    isLoading = false;
}

function setHero(movie) {
    const banner = document.getElementById('hero-banner');
    banner.style.backgroundImage = `linear-gradient(to top, #000 10%, transparent 90%), url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`;
    document.getElementById('hero-title').innerText = movie.title;
    document.getElementById('hero-desc').innerText = movie.overview;
    document.getElementById('hero-btn-nonton').onclick = () => bukaDetail(movie.id);
}

// 7. MODAL DETAIL + WATCHLIST
async function bukaDetail(id) {
    const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=id-ID`);
    const movie = await res.json();
    
    document.getElementById('modalContent').innerHTML = `
        <img src="${IMG_PATH + movie.poster_path}" class="w-full md:w-2/5 object-cover h-[400px] md:h-auto">
        <div class="p-8 flex flex-col justify-center bg-[#0a0a0a]">
            <h2 class="text-3xl font-black mb-2 italic uppercase text-white">${movie.title}</h2>
            <div class="flex gap-4 mb-4 text-[10px] font-black text-red-600 italic">
                <span>⭐ ${movie.vote_average.toFixed(1)}</span>
                <span>📅 ${movie.release_date.split('-')[0]}</span>
            </div>
            <p class="text-gray-400 text-[11px] mb-6 leading-relaxed line-clamp-4">${movie.overview}</p>
            <div class="flex flex-wrap gap-3">
                <button onclick="window.open('https://vidsrc.to/embed/movie/${id}', '_blank')" 
                    class="bg-red-600 px-6 py-3 rounded-full font-black text-[9px] uppercase tracking-widest text-white">Mulai Nonton</button>
                <button onclick="saveWatchlist(${movie.id}, '${movie.title.replace(/'/g, "\\'")}', '${movie.poster_path}')" 
                    class="bg-white/10 border border-white/20 px-6 py-3 rounded-full font-black text-[9px] uppercase tracking-widest text-white hover:bg-white/20">
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
    } else {
        alert("Udah ada di daftar kamu, Kim!");
    }
}

function tutupModal() {
    document.getElementById('movieModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// 8. INFINITE SCROLL
window.onscroll = () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 800) {
        if (currentTab === 'home' && !isLoading) loadTabHome();
    }
};
