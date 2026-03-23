// --- 1. KONSTANTA & KONFIGURASI ---
const API_KEY = '1306003844bd5fa3d43d44726d5a9cb0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';

let searchTimeout;
document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value;
    
    // Kasih delay 500ms biar gak spam API setiap ketik satu huruf
    searchTimeout = setTimeout(async () => {
        if (query.length > 2) {
            const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&language=id-ID`);
            const data = await res.json();
            document.getElementById('movie-grid').innerHTML = "";
            renderGrid(data.results, 'movie-grid');
            document.getElementById('search-result-section').classList.remove('hidden');
            document.getElementById('tab-home').classList.add('hidden');
        }
    }, 500);
});

// Variabel untuk Infinite Scroll
let currentPage = 1;
let isLoading = false;
let currentTab = 'home';

// --- 2. LOGIKA LOGIN & NAVIGASI TAB ---
function handleLogin() {
    const name = document.getElementById('userNameInput').value;
    if(name.trim() !== "") {
        document.getElementById('login-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('login-screen').style.display = 'none';
            const main = document.getElementById('main-content');
            main.classList.remove('hidden');
            setTimeout(() => {
                main.style.opacity = '1';
                pindahTab('home'); 
            }, 100);
        }, 500);
    } else { alert("Isi namamu dulu bos!"); }
}

function pindahTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById('search-result-section').classList.add('hidden');
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    
    const btnHome = document.getElementById('btn-home');
    const btnMovie = document.getElementById('btn-movie');
    
    if(tab === 'home') {
        btnHome.classList.replace('text-gray-500', 'text-red-600');
        btnMovie.classList.replace('text-red-600', 'text-gray-500');
        // Reset page saat balik ke home
        currentPage = 1;
        document.getElementById('home-recommend').innerHTML = ""; 
        loadTabHome();
    } else {
        btnMovie.classList.replace('text-gray-500', 'text-red-600');
        btnHome.classList.replace('text-red-600', 'text-gray-500');
        loadTabMovie();
    }
    window.scrollTo(0,0);
}

// --- 3. MUAT DATA HOME (WITH INFINITE SCROLL) ---
async function loadTabHome() {
    if (isLoading) return;
    isLoading = true;

    try {
        // Ambil film populer untuk daftar yang bisa di-scroll terus
        const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=id-ID&page=${currentPage}`);
        const data = await res.json();
        
        // Render data tambahan
        renderBarisFilm(data.results, 'home-recommend', true);

        // Jika ini halaman pertama, muat juga Trending & Hero
        if (currentPage === 1) {
            const resTrending = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=id-ID`);
            const dataTrending = await resTrending.json();
            renderBarisFilm(dataTrending.results, 'trending-list');
            setHero(dataTrending.results[0]);
        }

        currentPage++; // Siapkan halaman berikutnya
    } catch (e) {
        console.error("Gagal muat data home", e);
    } finally {
        isLoading = false;
    }
}

// --- 4. MUAT DATA MOVIE (VERSI MULTI PAGE) ---
async function loadTabMovie() {
    const categories = [
        ['list-indo', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_origin_country=ID&language=id-ID`],
        ['list-hollywood', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_origin_country=US&language=id-ID`],
        ['list-korea', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_origin_country=KR&language=id-ID`],
        ['list-thailand', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_origin_country=TH&language=id-ID`],
        ['list-action', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28&language=id-ID`],
        ['list-horror', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27&language=id-ID`],
        ['list-anime', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16&language=id-ID`]
    ];

    for (const [id, url] of categories) {
        let allMovies = [];
        for(let p = 1; p <= 4; p++) {
            try {
                const res = await fetch(`${url}&page=${p}`);
                const data = await res.json();
                allMovies = [...allMovies, ...data.results];
            } catch(e) { console.error("Error fetch page", p); }
        }
        renderBarisFilm(allMovies, id);
    }
}

// --- 5. RENDER & UI HELPER ---
// Ditambah parameter 'append' agar data tidak terhapus saat scroll
function renderBarisFilm(movies, containerId, append = false) {
    const list = document.getElementById(containerId);
    if (!list) return;
    if (!append) list.innerHTML = "";
    
    movies.forEach(movie => {
        if(!movie.poster_path) return;
        const card = document.createElement('div');
        card.className = "movie-card-slider";
        card.onclick = () => bukaDetail(movie.id);
        
        card.innerHTML = `
            <div class="relative h-64 overflow-hidden rounded-2xl border border-white/5 bg-[#111] group">
                <img src="${IMG_PATH + movie.poster_path}" loading="lazy" class="w-full h-full object-cover transition duration-500 group-hover:scale-110">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span class="text-[8px] font-black text-white uppercase tracking-widest">Nonton</span>
                </div>
                <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black text-yellow-500 italic">⭐ ${movie.vote_average.toFixed(1)}</div>
            </div>
            <h3 class="text-[10px] font-bold mt-2 truncate uppercase tracking-tighter text-gray-200 group-hover:text-red-600 transition-colors">${movie.title}</h3>
        `;
        list.appendChild(card);
    });
}

function setHero(movie) {
    const banner = document.getElementById('hero-banner');
    banner.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`;
    document.getElementById('hero-title').innerText = movie.title;
    document.getElementById('hero-desc').innerText = movie.overview;
    document.getElementById('hero-btn-nonton').onclick = () => bukaDetail(movie.id);
    document.getElementById('hero-btn-trailer').onclick = () => getTrailer(movie.id);
}

// --- 6. LOGIKA INFINITE SCROLL ---
window.onscroll = function() {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 700) {
        if (currentTab === 'home' && !isLoading) {
            loadTabHome();
        }
    }
};

// --- 7. FITUR SEARCH ---
document.getElementById('searchInput').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value.toLowerCase();
        if (query) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
            document.getElementById('search-result-section').classList.remove('hidden');
            
            const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&language=id-ID`);
            const data = await res.json();
            
            const container = document.getElementById('movie-list');
            container.innerHTML = "";
            data.results.forEach(movie => {
                if(!movie.poster_path) return;
                const card = document.createElement('div');
                card.className = "cursor-pointer group";
                card.onclick = () => bukaDetail(movie.id);
                card.innerHTML = `
                    <div class="relative h-72 rounded-2xl overflow-hidden border border-white/10 group-hover:border-red-600 transition-all">
                        <img src="${IMG_PATH + movie.poster_path}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    </div>
                    <h3 class="text-[11px] font-black mt-3 truncate uppercase text-white">${movie.title}</h3>
                `;
                container.appendChild(card);
            });
        }
    }
});

function backToHome() {
    document.getElementById('searchInput').value = "";
    pindahTab('home');
}

// --- 8. MODAL DETAIL ---
async function bukaDetail(id) {
    const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=credits`);
    const movie = await res.json();
    const casts = movie.credits.cast.slice(0, 5).map(c => c.name).join(", ");
    
    document.getElementById('modalContent').innerHTML = `
        <img src="${IMG_PATH + movie.poster_path}" class="w-full md:w-2/5 object-cover h-[450px] md:h-auto">
        <div class="p-8 flex flex-col justify-center bg-gradient-to-br from-[#111] to-black">
            <h2 class="text-4xl font-black mb-4 italic leading-none uppercase tracking-tighter text-white">${movie.title}</h2>
            <div class="flex gap-4 mb-6 text-xs font-black text-red-600 italic">
                <span>⭐ ${movie.vote_average.toFixed(1)}</span>
                <span>📅 ${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
            </div>
            <p class="text-gray-400 text-xs mb-8 leading-relaxed line-clamp-5">${movie.overview}</p>
            <div class="flex gap-4">
                <button onclick="window.open('https://vidsrc.to/embed/movie/${id}', '_blank')" class="bg-red-600 px-8 py-4 rounded-full font-black text-[10px] tracking-widest hover:scale-105 transition uppercase shadow-[0_0_20px_rgba(220,38,38,0.4)] text-white">Mulai Nonton</button>
            </div>
        </div>
    `;
    document.getElementById('movieModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function tutupModal() {
    document.getElementById('movieModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

async function getTrailer(id) {
    const res = await fetch(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if(trailer) window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
    else alert("Trailer tidak ditemukan!");
}
