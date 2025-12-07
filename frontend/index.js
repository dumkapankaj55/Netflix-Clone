/* =========================
   index.js (cleaned + separated)
   - TMDB fetch and build
   - YouTube trailer search (requires a valid YouTube API key)
   ========================= */

/* Replace the YOUTUBE_API_KEY below with your valid key if you want trailer search to work */
const TMDB_API_KEY = "e950e51d5d49e85f7c2f17f01eb23ba3"; // your TMDB key (keep secure in production)
const YOUTUBE_API_KEY = "REPLACE_WITH_YOUR_YOUTUBE_API_KEY"; // <-- replace to enable youtube search
const apiEndpoint = "https://api.themoviedb.org/3";
const imgPath = "https://image.tmdb.org/t/p/original";

const apiPaths = {
  fetchAllCategories: `${apiEndpoint}/genre/movie/list?api_key=${TMDB_API_KEY}`,
  fetchMoviesList: (id) => `${apiEndpoint}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${id}`,
  fetchTrending: `${apiEndpoint}/trending/all/day?api_key=${TMDB_API_KEY}&language=en-US`,
  searchOnYoutube: (query) => `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&maxResults=1`
};

// boots up the app
function init() {
  fetchTrendingMovies();
  fetchAndBuildAllSections();
}

function fetchTrendingMovies() {
  fetchAndbuildMovieSection(apiPaths.fetchTrending, 'Trending Now')
    .then(list => {
      if (Array.isArray(list) && list.length) {
        const randomIndex = parseInt(Math.random() * list.length);
        buildBannerSection(list[randomIndex]);
      }
    }).catch(err => {
      console.error(err);
    });
}

function buildBannerSection(movie) {
  if (!movie) return;
  const bannerCont = document.getElementById('banner-section');
  if (!bannerCont) return;

  bannerCont.style.backgroundImage = movie.backdrop_path ? `url('${imgPath}${movie.backdrop_path}')` : '';
  // clear previous
  bannerCont.innerHTML = '<div class="banner_fadeBottom"></div>';

  const div = document.createElement('div');
  div.className = "banner-content container";

  div.innerHTML = `
    <h2 class="banner__title">${movie.title || movie.name || ''}</h2>
    <p class="banner__info">Trending in movies | Released - ${movie.release_date || movie.first_air_date || 'N/A'}</p>
    <p class="banner__overview">${movie.overview && movie.overview.length > 200 ? movie.overview.slice(0,200).trim() + '...' : (movie.overview || '')}</p>
    <div class="action-buttons-cont">
      <button class="action-button">▶&nbsp;&nbsp; Play</button>
      <button class="action-button">ℹ️ &nbsp;&nbsp; More Info</button>
    </div>
  `;

  bannerCont.appendChild(div);
}

function fetchAndBuildAllSections() {
  fetch(apiPaths.fetchAllCategories)
    .then(res => res.json())
    .then(res => {
      const categories = res.genres;
      if (Array.isArray(categories) && categories.length) {
        categories.forEach(category => {
          fetchAndbuildMovieSection(apiPaths.fetchMoviesList(category.id), category.name);
        });
      }
    })
    .catch(err => console.error(err));
}

function fetchAndbuildMovieSection(fetchUrl, categoryName) {
  return fetch(fetchUrl)
    .then(res => res.json())
    .then(res => {
      const movies = res.results;
      if (Array.isArray(movies) && movies.length) {
        buildMoviesSection(movies.slice(0, 6), categoryName);
      }
      return movies;
    })
    .catch(err => {
      console.error(err);
      return [];
    });
}

function buildMoviesSection(list, categoryName) {
  const moviesCont = document.getElementById('movies-cont');
  if (!moviesCont) return;

  const moviesListHTML = list.map(item => {
    const safeTitle = (item.title || item.name || '').replace(/'/g, "\\'");
    return `
      <div class="movie-item" onmouseenter="searchMovieTrailer('${safeTitle}', 'yt${item.id}')">
        <img class="move-item-img" src="${imgPath}${item.backdrop_path || item.poster_path}" alt="${item.title || item.name}" />
        <div class="iframe-wrap" id="yt${item.id}"></div>
      </div>
    `;
  }).join('');

  const div = document.createElement('div');
  div.className = "movies-section";
  div.innerHTML = `
    <h2 class="movie-section-heading">${categoryName} <span class="explore-nudge">Explore All</span></h2>
    <div class="movies-row">${moviesListHTML}</div>
  `;

  moviesCont.appendChild(div);
}

/* Search YouTube for the movie trailer. Will only work if YOUTUBE_API_KEY is set above.
   If you don't have a YouTube API key, this function gracefully returns. */
function searchMovieTrailer(movieName, iframeId) {
  if (!movieName) return;
  if (YOUTUBE_API_KEY === "REPLACE_WITH_YOUR_YOUTUBE_API_KEY") {
    // no key provided — do nothing (or you can open YouTube search page instead)
    console.warn("YouTube API key not set. Replace YOUTUBE_API_KEY in index.js to enable trailer search.");
    return;
  }

  fetch(apiPaths.searchOnYoutube(movieName + " trailer"))
    .then(res => res.json())
    .then(res => {
      const bestResult = res.items && res.items[0];
      if (!bestResult) return;
      const videoId = bestResult.id.videoId;
      const container = document.getElementById(iframeId);
      if (!container) return;

      // clear existing
      container.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.width = "245";
      iframe.height = "150";
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&mute=1`;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.frameBorder = "0";
      container.appendChild(iframe);
    })
    .catch(err => console.error(err));
}

/* UI: header color on scroll, footer year, small auth button functions */
window.addEventListener('load', function () {
  init();

  // header background toggle on scroll
  window.addEventListener('scroll', function () {
    const header = document.getElementById('header');
    if (!header) return;
    if (window.scrollY > 5) header.classList.add('black-bg');
    else header.classList.remove('black-bg');
  });

  // footer year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // sign in / get started basic behavior
  const signInBtn = document.querySelector('.sign_in_button');
  const getStartedBtn = document.getElementById('getStartedBtn');
  const emailInput = document.getElementById('emailInput');

  if (signInBtn) {
    signInBtn.addEventListener('click', function () {
      const email = emailInput && emailInput.value ? emailInput.value.trim() : '';
      if (email) alert('Signing in with: ' + email);
      else alert('Please enter your email to sign in.');
    });
  }

  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', function () {
      const email = emailInput && emailInput.value ? emailInput.value.trim() : '';
      if (email) alert('Get started — email: ' + email);
      else alert('Enter email to get started.');
    });
  }
});
