// =============================================
//  STREAMVAULT – APP LOGIC
// =============================================

let watchlist = JSON.parse(localStorage.getItem('sv_watchlist') || '[]');
let currentHeroIndex = 0;
let currentHeroMovie = HERO_MOVIES[0];
let currentModalMovie = null;

// ── NAVIGATION ──────────────────────────────
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  const nl = document.getElementById('nav-' + page);
  if (nl) nl.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (page === 'watchlist') renderWatchlist();
}

// ── HERO BANNER ──────────────────────────────
function setHero(index) {
  currentHeroIndex = index;
  currentHeroMovie = HERO_MOVIES[index];
  const h = HERO_MOVIES[index];
  document.getElementById('heroBg').style.backgroundImage = `url('${h.bg}')`;
  document.getElementById('heroTitle').textContent = h.title;
  document.getElementById('heroDesc').textContent = h.desc;
  document.getElementById('heroMeta').innerHTML = `
    <span class="hero-rating">⭐ ${h.rating}</span>
    <span>${h.year}</span><span>${h.duration}</span>
    <span class="genre-tag">${h.genre}</span>`;
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === index));
}

function autoRotateHero() {
  setInterval(() => {
    currentHeroIndex = (currentHeroIndex + 1) % HERO_MOVIES.length;
    setHero(currentHeroIndex);
  }, 6000);
}

// ── RENDER MOVIE CARD ────────────────────────
function createCard(movie) {
  const inList = watchlist.some(w => w.id === movie.id);
  const div = document.createElement('div');
  div.className = 'movie-card';
  div.innerHTML = `
    <div class="card-poster" onclick="openModal(${movie.id})">
      <img src="${movie.poster}" alt="${movie.title}" loading="lazy"
           onerror="this.src='https://via.placeholder.com/300x450/1a1a2e/e50914?text=${encodeURIComponent(movie.title)}'"/>
      <div class="card-overlay">
        <button class="card-play" onclick="event.stopPropagation();showPlayer()">▶</button>
      </div>
      ${movie.trending ? '<div class="badge-trending">TRENDING</div>' : ''}
      ${movie.award ? '<div class="badge-award">🏆</div>' : ''}
    </div>
    <div class="card-info">
      <div class="card-title">${movie.title}</div>
      <div class="card-meta">
        <span class="card-rating">⭐ ${movie.rating}</span>
        <span>${movie.year}</span>
        <span class="card-genre">${movie.genre}</span>
      </div>
      <button class="card-list-btn ${inList ? 'in-list' : ''}" onclick="event.stopPropagation();toggleWatchlist(${movie.id},this)">
        ${inList ? '✓ In List' : '+ My List'}
      </button>
    </div>`;
  return div;
}

// ── RENDER ROWS (horizontal scroll) ──────────
function renderRow(containerId, movies) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  movies.forEach(m => c.appendChild(createCard(m)));
}

// ── RENDER GRID ───────────────────────────────
function renderGrid(containerId, movies) {
  const c = document.getElementById(containerId);
  if (!c) return;
  if (!movies.length) {
    c.innerHTML = '<div class="empty-state"><div class="empty-icon">🎬</div><h3>No titles found</h3></div>';
    return;
  }
  c.innerHTML = '';
  movies.forEach(m => c.appendChild(createCard(m)));
}

// ── INIT ALL ROWS ────────────────────────────
function initRows() {
  renderRow('row-trending', ALL_MOVIES.filter(m => m.trending));
  renderRow('row-latest',   ALL_MOVIES.filter(m => m.year >= 2024).slice(0, 15));
  renderRow('row-awards',   ALL_MOVIES.filter(m => m.award));
  renderRow('row-action',   ALL_MOVIES.filter(m => m.genre === 'Action'));
  renderRow('row-comedy',   ALL_MOVIES.filter(m => m.genre === 'Comedy' || m.genre === 'Animation'));
  renderRow('row-horror',   ALL_MOVIES.filter(m => m.genre === 'Horror' || m.genre === 'Thriller'));

  renderGrid('movies-grid',   ALL_MOVIES.filter(m => m.type === 'movie'));
  renderGrid('series-grid',   ALL_MOVIES.filter(m => m.type === 'series'));
  renderGrid('trending-grid', ALL_MOVIES.filter(m => m.trending));
}

// ── FILTER MOVIES ────────────────────────────
function filterMovies() {
  const genre = document.getElementById('genreFilter').value;
  const year  = document.getElementById('yearFilter').value;
  const sort  = document.getElementById('sortFilter').value;
  let movies  = ALL_MOVIES.filter(m => m.type === 'movie');
  if (genre) movies = movies.filter(m => m.genre === genre);
  if (year)  movies = movies.filter(m => m.year === parseInt(year));
  if (sort.includes('Rating'))    movies.sort((a,b) => b.rating - a.rating);
  else if (sort.includes('Newest')) movies.sort((a,b) => b.year - a.year);
  else movies.sort((a,b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
  renderGrid('movies-grid', movies);
}

// ── SEARCH ───────────────────────────────────
function handleSearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!q) { navigate('home'); return; }
  const results = ALL_MOVIES.filter(m =>
    m.title.toLowerCase().includes(q) ||
    m.genre.toLowerCase().includes(q) ||
    m.cast.toLowerCase().includes(q)
  );
  navigate('search');
  document.querySelector('#page-search .page-header h1').textContent = `Results for "${document.getElementById('searchInput').value}"`;
  renderGrid('search-grid', results);
}

// ── MODAL ────────────────────────────────────
function openModal(id) {
  const movie = ALL_MOVIES.find(m => m.id === id);
  if (!movie) return;
  currentModalMovie = movie;
  document.getElementById('modalHero').style.cssText = `background-image:url('${movie.poster}');background-size:cover;background-position:top center;height:280px;border-radius:16px 16px 0 0;`;
  document.getElementById('modalTitle').textContent = movie.title;
  document.getElementById('modalDesc').textContent = movie.desc;
  document.getElementById('modalMeta').innerHTML = `
    <span class="hero-rating">⭐ ${movie.rating}</span>
    <span>${movie.year}</span><span>${movie.duration}</span>
    <span class="genre-tag">${movie.genre}</span>`;
  document.getElementById('modalCast').innerHTML = `<p style="color:#aaa;font-size:.85rem;margin-top:1rem"><strong style="color:#fff">Cast:</strong> ${movie.cast}</p>`;
  const inList = watchlist.some(w => w.id === id);
  const btn = document.getElementById('modalWatchlistBtn');
  btn.textContent = inList ? '✓ In List' : '+ My List';
  btn.onclick = () => { addToWatchlist(movie); btn.textContent = '✓ In List'; };
  document.getElementById('movieModal').classList.add('open');
}

function closeModal(e) {
  if (e.target.id === 'movieModal') document.getElementById('movieModal').classList.remove('open');
}

// ── PLAYER ───────────────────────────────────
function showPlayer() {
  document.getElementById('playerOverlay').classList.add('open');
  const title = currentModalMovie ? currentModalMovie.title : (currentHeroMovie ? currentHeroMovie.title : 'StreamVault');
  document.getElementById('playerTitle').textContent = `▶ Now Playing: ${title}`;
  animateProgress();
}

function closePlayer(e) {
  if (e.target.id === 'playerOverlay') document.getElementById('playerOverlay').classList.remove('open');
}

function animateProgress() {
  const fill = document.querySelector('.progress-fill');
  let w = 0;
  const iv = setInterval(() => {
    w += 0.1;
    if (fill) fill.style.width = w + '%';
    if (w >= 100) clearInterval(iv);
  }, 120);
}

// ── WATCHLIST ─────────────────────────────────
function addToWatchlist(movie) {
  if (!movie) return;
  if (watchlist.some(w => w.id === movie.id)) {
    showToast(`"${movie.title}" is already in your list!`);
    return;
  }
  watchlist.push(movie);
  localStorage.setItem('sv_watchlist', JSON.stringify(watchlist));
  showToast(`✓ "${movie.title}" added to My List`);
}

function toggleWatchlist(id, btn) {
  const movie = ALL_MOVIES.find(m => m.id === id);
  if (!movie) return;
  const idx = watchlist.findIndex(w => w.id === id);
  if (idx === -1) {
    watchlist.push(movie);
    btn.textContent = '✓ In List';
    btn.classList.add('in-list');
    showToast(`✓ "${movie.title}" added`);
  } else {
    watchlist.splice(idx, 1);
    btn.textContent = '+ My List';
    btn.classList.remove('in-list');
    showToast(`Removed from My List`);
  }
  localStorage.setItem('sv_watchlist', JSON.stringify(watchlist));
}

function renderWatchlist() {
  const c = document.getElementById('watchlist-grid');
  document.getElementById('watchlist-count').textContent = `${watchlist.length} title${watchlist.length !== 1 ? 's' : ''} saved`;
  if (!watchlist.length) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h3>Your watchlist is empty</h3><p>Browse and hit <strong>+ My List</strong> to save titles.</p><button class="btn-play" onclick="navigate('home')">Browse Now</button></div>`;
    return;
  }
  c.innerHTML = '';
  watchlist.forEach(m => c.appendChild(createCard(m)));
}

// ── SIGN IN ───────────────────────────────────
function doSignin() {
  const email = document.getElementById('signinEmail').value;
  if (!email) { showToast('Please enter your email'); return; }
  showToast(`👋 Welcome back, ${email.split('@')[0]}!`);
  setTimeout(() => navigate('home'), 1000);
}

// ── TOAST ─────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── NAVBAR SCROLL EFFECT ──────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60);
});

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setHero(0);
  autoRotateHero();
  initRows();
});
