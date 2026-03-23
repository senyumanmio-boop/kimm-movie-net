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
    loadTabHome(); 
}

// 2. SEARCH OPTIMIZATION
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
        loadTabMovie(); // Langsung isi katalog pas diklik
    }
    window.scrollTo(0,0);
}

async function loadSemuaKategori() {
    const container = document.getElementById('katalog-container');
    if (!container) return;

    // Daftar Genre & Negara (Biar dapet 20-30 baris)
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

    container.innerHTML = ""; // Bersihkan

    // Loop Otomatis bikin baris
    for (const kat of daftarKategori) {
        const rowId = `row-${kat.nama.replace(/\s+/g, '')}`;
        
        // 1. Tempel Baris Baru ke HTML
        const rowHTML = `
            <div>
                <h3 class="text-red-600 font-black uppercase italic ml-4 mb-4 tracking-wider text-sm">${kat.nama}</h3>
                <div id="${rowId}" class="flex overflow-x-auto gap-4 px-4 no-scrollbar pb-2 min-h-[150px]">
                    <div class="min-w-[150px] h-56 bg-white/5 animate-pulse rounded-2xl"></div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', rowHTML);

        // 2. Fetch Data Film
        try {
            const res = await fetch(`${kat.url}&language=id-ID&sort_by=popularity.desc`);
            const data = await res.json();
            const rowContainer = document.getElementById(rowId);
            
            if (rowContainer && data.results) {
                rowContainer.innerHTML = ""; // Hapus loading
                renderBarisFilm(data.results, rowId); // Pakai fungsi render kamu
            }
        } catch (e) { console.error("Error di: " + kat.nama); }
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

