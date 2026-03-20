// --- 1. KONSTANTA & VARIABEL ---
const API_KEY = '1306003844bd5fa3d43d44726d5a9cb0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
let currentUrl = "";
const mainContainer = document.getElementById('movie-list'); // Ini tetap ada buat hasil search

// --- 2. LOGIKA AMBIL DATA MULTI-KATEGORI (NETFLIX STYLE) ---
async function loadSemuaKategori() {
    const daftarKategori = [
        ['trending-list', `${BASE_URL}/trending/movie/day?api_key=${API_KEY}&language=id-ID`],
        ['indo-list', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_origin_country=ID&language=id-ID`],
        ['hollywood-list', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_origin_country=US&language=id-ID`],
        ['anime-list', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16&language=id-ID`],
        ['horror-list', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27&language=id-ID`],
        ['romance-list', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10749&language=id-ID`],
        ['action-list', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28&language=id-ID`],
        ['comedy-list', `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35&language=id-ID`]
    ];

    for (const [idContainer, url] of daftarKategori) {
        try {
            const res = await fetch(url);
            const data = await res.json();
            renderBarisFilm(data.results, idContainer);
            
            // Set Hero Banner dari film trending pertama
            if (idContainer === 'trending-list' && data.results.length > 0) {
                setHero(data.results[0]);
            }
        } catch (err) {
            console.error(`Gagal muat ${idContainer}:`, err);
        }
    }
}

// Render film untuk baris yang bisa digeser (Horizontal)
function renderBarisFilm(movies, containerId) {
    const list = document.getElementById(containerId);
    if (!list) return;
    list.innerHTML = "";
    
    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = "movie-card-slider flex flex-col cursor-pointer shrink-0 w-[150px]";
        card.onclick = () => bukaDetail(movie.id);
        
        card.innerHTML = `
            <div class="relative overflow-hidden rounded-2xl h-60 shadow-lg group">
                <img src="${movie.poster_path ? IMG_PATH + movie.poster_path : 'https://via.placeholder.com/500x750'}" 
                     class="w-full h-full object-cover transition duration-300 group-hover:scale-110">
                <div class="absolute top-2 right-2 z-10 bg-black/50 p-2 rounded-full" onclick="toggleBookmark(event, ${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">
                    <span class="heart-icon text-white">❤</span>
                </div>
            </div>
            <h3 class="text-[11px] font-bold mt-2 truncate">${movie.title}</h3>
            <p class="text-[9px] text-gray-500">${movie.release_date ? movie.release_date.split('-')[0] : ''} • ⭐ ${movie.vote_average.toFixed(1)}</p>
        `;
        list.appendChild(card);
    });
}

// --- 3. FITUR SEARCH BAR CANGGIH ---
document.getElementById('searchInput').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value.toLowerCase();
        const categoriesSection = document.getElementById('categories-container');
        const searchResultSection = document.getElementById('search-result-section');

        if (query) {
            // Sembunyikan kategori Netflix, tampilkan hasil search (Grid)
            categoriesSection.classList.add('hidden');
            searchResultSection.classList.remove('hidden');
            
            let extraParams = "";
            if (query.includes("indonesia") || query.includes("indo")) extraParams += "&with_origin_country=ID";
            if (query.includes("jepang") || query.includes("japan")) extraParams += "&with_origin_country=JP";
            if (query.includes("korea")) extraParams += "&with_origin_country=KR";
            if (query.includes("barat") || query.includes("hollywood")) extraParams += "&with_origin_country=US";

            if (query.includes("horor") || query.includes("horror")) extraParams += "&with_genres=27";
            if (query.includes("anime") || query.includes("animasi")) extraParams += "&with_genres=16";
            if (query.includes("action") || query.includes("aksi")) extraParams += "&with_genres=28";
            if (query.includes("romance") || query.includes("romantis")) extraParams += "&with_genres=10749";

            const cleanQuery = query.replace(/(indonesia|indo|jepang|japan|korea|barat|hollywood|horor|horror|anime|animasi|action|aksi|romance|romantis)/gi, "").trim();

            if (cleanQuery === "" && extraParams !== "") {
                currentUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=id-ID${extraParams}`;
            } else {
                currentUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${cleanQuery}&language=id-ID${extraParams}`;
            }
            ambilDataFilmSearch(currentUrl);
        } else {
            // Kalau search kosong, balik ke mode kategori awal
            categoriesSection.classList.remove('hidden');
            searchResultSection.classList.add('hidden');
        }
    }
});

// Ambil data khusus untuk hasil pencarian (Tampilan Grid kebawah)
async function ambilDataFilmSearch(url) {
    const container = document.getElementById('movie-list');
    container.innerHTML = "<div class='skeleton h-72 w-full'></div>"; 
    const res = await fetch(url);
    const data = await res.json();
    tampilkanFilmGrid(data.results);
}

function tampilkanFilmGrid(movies) {
    const container = document.getElementById('movie-list');
    container.innerHTML = "";
    movies.forEach(movie => {
        // Gunakan fungsi tampilkanFilm yang lama atau buat card grid di sini
        const card = document.createElement('div');
        card.className = "movie-card flex flex-col cursor-pointer";
        card.onclick = () => bukaDetail(movie.id);
        card.innerHTML = `<img src="${IMG_PATH + movie.poster_path}" class="rounded-xl h-72 object-cover">
                          <h2 class="font-bold text-sm mt-2">${movie.title}</h2>`;
        container.appendChild(card);
    });
}

// --- 4. FUNGSI PENDUKUNG (BOOKMARK, MODAL, DLL - TETAP SAMA) ---
function toggleBookmark(e, id, title) {
    e.stopPropagation();
    let favorites = JSON.parse(localStorage.getItem('kimm_fav')) || [];
    const index = favorites.indexOf(id);
    if (index === -1) {
        favorites.push(id);
        alert(`✅ ${title} favorit!`);
    } else {
        favorites.splice(index, 1);
        alert(`❌ ${title} dihapus.`);
    }
    localStorage.setItem('kimm_fav', JSON.stringify(favorites));
}

async function masukKeHome() {
    document.getElementById('profile-screen').style.display = 'none'; 
    const main = document.getElementById('main-content');
    main.classList.remove('hidden');
    setTimeout(() => { 
        main.style.opacity = '1'; 
        loadSemuaKategori(); // Panggil fungsi sakti kita!
    }, 100);
}

// ... Masukkan fungsi bukaDetail, tutupModal, getTrailer, dan setHero dari kode lama kamu di bawah sini ...
