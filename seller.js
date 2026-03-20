// --- FITUR SEARCH BAR CANGGIH ---
document.getElementById('searchInput').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value.toLowerCase();
        currentPage = 1;

        if (query) {
            let extraParams = "";
            
            // 1. Deteksi Negara (Origin Country)
            if (query.includes("indonesia") || query.includes("indo")) extraParams += "&with_origin_country=ID";
            if (query.includes("jepang") || query.includes("japan")) extraParams += "&with_origin_country=JP";
            if (query.includes("korea")) extraParams += "&with_origin_country=KR";
            if (query.includes("barat") || query.includes("hollywood")) extraParams += "&with_origin_country=US";

            // 2. Deteksi Genre/Tipe
            if (query.includes("horor") || query.includes("horror")) extraParams += "&with_genres=27";
            if (query.includes("anime") || query.includes("animasi")) extraParams += "&with_genres=16";
            if (query.includes("action") || query.includes("aksi")) extraParams += "&with_genres=28";
            if (query.includes("komedi") || query.includes("lucu")) extraParams += "&with_genres=35";
            if (query.includes("romance") || query.includes("romantis")) extraParams += "&with_genres=10749";

            // 3. Bersihkan kata kunci murni (menghapus kata bantu negara/genre agar tidak bentrok)
            const cleanQuery = query.replace(/(indonesia|indo|jepang|japan|korea|barat|hollywood|horor|horror|anime|animasi|action|aksi|komedi|lucu|romance|romantis)/gi, "").trim();

            // 4. Logika Penentuan URL
            if (cleanQuery === "" && extraParams !== "") {
                // Jika cuma ketik "Horor Indonesia", gunakan DISCOVER (lebih akurat untuk filter)
                currentUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=id-ID${extraParams}`;
            } else {
                // Jika ketik "Spiderman", gunakan SEARCH standar
                currentUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${cleanQuery}&language=id-ID${extraParams}`;
            }
        } else {
            // Jika kolom search kosong, balik ke populer
            currentUrl = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=id-ID`;
        }
        
        ambilDataFilm(currentUrl, false);
        window.scrollTo({top: 0, behavior: 'smooth'});
    }
});
// --- 1. KONSTANTA & VARIABEL ---
const API_KEY = '1306003844bd5fa3d43d44726d5a9cb0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
let currentUrl = "";
const container = document.getElementById('movie-list'); 

// --- 2. FITUR BOOKMARK (LOCAL STORAGE) ---
function toggleBookmark(e, id, title) {
    e.stopPropagation(); // Biar pas klik Love, modal detail gak kebuka
    let favorites = JSON.parse(localStorage.getItem('kimm_fav')) || [];
    const index = favorites.indexOf(id);
    
    if (index === -1) {
        favorites.push(id);
        alert(`✅ ${title} masuk ke daftar favorit!`);
    } else {
        favorites.splice(index, 1);
        alert(`❌ ${title} dihapus dari favorit.`);
    }
    localStorage.setItem('kimm_fav', JSON.stringify(favorites));
    
    // Update warna hati tanpa refresh
    const icon = e.target;
    icon.classList.toggle('text-red-600');
}

// --- 3. FITUR SKELETON LOADING (EFEK KEDIP) ---
function tampilkanSkeleton() {
    const skeletons = Array(10).fill(`<div class="skeleton h-72 rounded-xl"></div>`).join('');
    if (currentPage === 1) {
        container.innerHTML = skeletons;
    } else {
        const skeletonContainer = document.createElement('div');
        skeletonContainer.id = "temp-skeleton";
        skeletonContainer.className = "grid grid-cols-2 md:grid-cols-5 gap-4 col-span-full";
        skeletonContainer.innerHTML = skeletons;
        container.appendChild(skeletonContainer);
    }
}

// --- 4. LOGIKA AMBIL DATA ---
async function masukKeHome() {
    // Pastikan variabel 'profile' dan 'main' sudah didefinisikan di HTML kamu
    document.getElementById('profile-screen').style.display = 'none'; 
    const main = document.getElementById('main-content');
    main.classList.remove('hidden');
    
    setTimeout(() => { 
        main.style.opacity = '1'; 
        currentUrl = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=id-ID`;
        ambilDataFilm(currentUrl); 
    }, 100);
}

async function ambilDataFilm(url, isLoadMore = false) {
    try {
        if (!isLoadMore) {
            currentPage = 1;
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
        
        tampilkanSkeleton();

        const res = await fetch(`${url}&page=${currentPage}`);
        const data = await res.json();
        
        // Hapus skeleton setelah data muncul
        const tempSkeleton = document.getElementById('temp-skeleton');
        if (tempSkeleton) tempSkeleton.remove();

        // Set Banner cuma di halaman 1
        if (currentPage === 1 && data.results.length > 0) {
            setHero(data.results[0]);
        }

        tampilkanFilm(data.results, isLoadMore);
    } catch (error) { 
        console.error("Gagal ambil data:", error); 
    }
}

function setHero(hero) {
    const banner = document.getElementById('hero-banner');
    banner.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${hero.backdrop_path})`;
    document.getElementById('hero-title').innerText = hero.title;
    document.getElementById('hero-desc').innerText = hero.overview || "Nikmati film terbaik di KimmMovie.";
    document.getElementById('hero-nonton').onclick = () => window.open(`https://vidsrc.to/embed/movie/${hero.id}`, '_blank');
}

// --- 5. TAMPILKAN DAFTAR FILM ---
function tampilkanFilm(movies, isLoadMore) {
    if (!isLoadMore) container.innerHTML = ""; 
    
    let favorites = JSON.parse(localStorage.getItem('kimm_fav')) || [];

    movies.forEach((movie) => {
        const isFav = favorites.includes(movie.id) ? 'text-red-600' : 'text-white';
        const card = document.createElement('div');
        card.className = "movie-card flex flex-col shadow-lg shadow-black/50 relative cursor-pointer";
        
        // Buka modal kalau kartu diklik
        card.onclick = () => bukaDetail(movie.id);

        card.innerHTML = `
            <div class="relative group h-72 overflow-hidden">
                <div onclick="toggleBookmark(event, ${movie.id}, '${movie.title.replace(/'/g, "\\'")}')" class="absolute top-2 right-2 z-50 bg-black/50 p-2 rounded-full hover:scale-110 transition">
                    <span class="heart-icon ${isFav} transition-colors">❤</span>
                </div>
                <img src="${movie.poster_path ? IMG_PATH + movie.poster_path : 'https://via.placeholder.com/500x750'}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 text-center p-4">
                    <button onclick="event.stopPropagation(); getTrailer(${movie.id})" class="bg-white text-black px-6 py-2 rounded-full text-[10px] font-bold w-32">TRAILER</button>
                    <a href="https://vidsrc.to/embed/movie/${movie.id}" target="_blank" onclick="event.stopPropagation()" class="bg-red-600 text-white px-6 py-2 rounded-full text-[10px] font-bold w-32 text-center">NONTON</a>
                </div>
            </div>
            <div class="p-4 bg-[#111] flex-grow">
                <h2 class="font-bold text-[12px] mb-1 truncate">${movie.title}</h2>
                <div class="flex justify-between items-center">
                    <p class="text-[10px] text-yellow-500 font-bold italic">⭐ ${movie.vote_average.toFixed(1)}</p>
                    <p class="text-[9px] text-gray-500">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
                </div>
            </div>`;
        container.appendChild(card);
    });
}

// --- 6. MODAL DETAIL (AKTOR, TAHUN, DESKRIPSI) ---
async function bukaDetail(id) {
    try {
        const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=credits`);
        const movie = await res.json();
        
        const modal = document.getElementById('movieModal');
        const content = document.getElementById('modalContent');
        
        // Ambil 5 nama aktor
        const casts = movie.credits.cast.slice(0, 5).map(c => c.name).join(", ");
        
        content.innerHTML = `
            <img src="${IMG_PATH + movie.poster_path}" class="w-full md:w-1/3 object-cover h-full">
            <div class="p-8 flex flex-col justify-center">
                <h2 class="text-3xl md:text-5xl font-black mb-2">${movie.title}</h2>
                <div class="flex gap-4 mb-4 text-sm font-bold text-red-500">
                    <span>⭐ ${movie.vote_average.toFixed(1)}</span>
                    <span>📅 ${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                </div>
                <p class="text-gray-300 text-sm mb-6 leading-relaxed">${movie.overview || 'Tidak ada deskripsi tersedia.'}</p>
                <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-6 font-bold">Aktor Utama: ${casts || 'Informasi tidak tersedia'}</p>
                <div class="flex gap-4">
                    <button onclick="window.open('https://vidsrc.to/embed/movie/${id}', '_blank')" class="bg-red-600 px-8 py-3 rounded-full font-black text-xs hover:bg-red-700 transition">NONTON SEKARANG</button>
                    <button onclick="tutupModal()" class="bg-gray-800 px-8 py-3 rounded-full font-black text-xs hover:bg-gray-700 transition">TUTUP</button>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    } catch (err) {
        console.error("Gagal memuat detail:", err);
    }
}

function tutupModal() {
    document.getElementById('movieModal').classList.add('hidden');
}

// --- 7. TRAILER ---
async function getTrailer(id) {
    const res = await fetch(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if(trailer) window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
    else alert("Trailer tidak ditemukan.");
}

// --- 8. EVENT LISTENER ---
document.getElementById('loadMore').addEventListener('click', () => {
    currentPage++;
    ambilDataFilm(currentUrl, true);
});
