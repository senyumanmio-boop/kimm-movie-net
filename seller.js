let currentPage = 1;
        let currentUrl = "";
function toggleBookmark(id, title) {
    let favorites = JSON.parse(localStorage.getItem('kimm_fav')) || [];
    const index = favorites.indexOf(id);
    
    if (index === -1) {
        favorites.push(id);
        alert(`Film ${title} ditambahkan ke favorit!`);
    } else {
        favorites.splice(index, 1);
        alert(`Film ${title} dihapus dari favorit.`);
    }
    localStorage.setItem('kimm_fav', JSON.stringify(favorites));
    ambilDataFilm(); // Refresh tampilan
}

        async function masukKeHome() {
            profile.style.display = 'none';
            main.classList.remove('hidden');
            setTimeout(() => { 
                main.style.opacity = '1'; 
                currentUrl = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=id-ID`;
                ambilDataFilm(currentUrl); 
            }, 100);
        }

        async function ambilDataFilm(url, isLoadMore = false) {
            try {
                const res = await fetch(`${url}&page=${currentPage}`);
                const data = await res.json();
                
                // Set Banner Hero dari film pertama di halaman 1
                if (currentPage === 1 && data.results.length > 0) {
                    const hero = data.results[0];
                    document.getElementById('hero-banner').style.backgroundImage = `url(https://image.tmdb.org/t/p/original${hero.backdrop_path})`;
                    document.getElementById('hero-title').innerText = hero.title;
                    document.getElementById('hero-desc').innerText = hero.overview;
                    document.getElementById('hero-nonton').onclick = () => window.open(`https://vidsrc.to/embed/movie/${hero.id}`, '_blank');
                }

                tampilkanFilm(data.results, isLoadMore);
            } catch (error) { console.error("Gagal ambil data:", error); }
        }

        // Fungsi Tampilkan Film dengan fitur Append (Tambah ke bawah)
        function tampilkanFilm(movies, isLoadMore) {
            if (!isLoadMore) container.innerHTML = ""; 
            
            movies.forEach((movie, i) => {
                const card = document.createElement('div');
                card.className = "movie-card flex flex-col shadow-lg shadow-black/50";
                const linkNonton = `https://vidsrc.to/embed/movie/${movie.id}`;

                card.innerHTML = `
                    <div class="relative group h-72 overflow-hidden">
                        <img src="${movie.poster_path ? IMG_PATH + movie.poster_path : 'https://via.placeholder.com/500x750'}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 text-center p-4">
                            <p class="text-[10px] text-gray-300 mb-2 line-clamp-4">${movie.overview}</p>
                            <button onclick="getTrailer(${movie.id})" class="bg-white text-black px-6 py-2 rounded-full text-[10px] font-bold w-32">TRAILER</button>
                            <a href="${linkNonton}" target="_blank" class="bg-red-600 text-white px-6 py-2 rounded-full text-[10px] font-bold w-32">NONTON</a>
                        </div>
                    </div>
                    <div class="p-4 bg-[#111] flex-grow">
                        <h2 class="font-bold text-[12px] mb-1 truncate">${movie.title}</h2>
                        <p class="text-[10px] text-yellow-500 font-bold italic">⭐ ${movie.vote_average.toFixed(1)}</p>
                    </div>`;
                container.appendChild(card);
            });
        }

        // Tombol Load More
        document.getElementById('loadMore').addEventListener('click', () => {
            currentPage++;
            ambilDataFilm(currentUrl, true);
        });
