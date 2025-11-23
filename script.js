/* script.js - Perspectivas Engine v4 (content.json + Sponsors PRO) */

/* ---------------------------------------------------------
   CONFIG
--------------------------------------------------------- */
const CONFIG = {
  contentUrl: '/api/content.json',   // Ruta del JSON estático
  cacheTime: 15 * 60 * 1000,        // 15 minutos
  limitNews: 10
};

/* ---------------------------------------------------------
   CACHÉ LOCAL (localStorage)
--------------------------------------------------------- */
const db = {
  save(key, data) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ timestamp: Date.now(), payload: data })
      );
    } catch (e) {
      console.warn('Cache full', e);
    }
  },
  get(key) {
    const record = localStorage.getItem(key);
    if (!record) return null;
    const { timestamp, payload } = JSON.parse(record);
    if (Date.now() - timestamp > CONFIG.cacheTime) return null;
    return payload;
  }
};

const CONTENT_CACHE_KEY = 'perspectivas_content_v1';

/* ---------------------------------------------------------
   HELPERS GENERALES
--------------------------------------------------------- */
const formatDate = (str) => {
  if (!str) return '';
  try {
    return new Date(str).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return str;
  }
};

const getYoutubeId = (url) => {
  if (!url) return null;
  const match = url.match(
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  );
  return match && match[2].length === 11 ? match[2] : null;
};

function sortByDateDesc(arr) {
  return (arr || []).slice().sort(
    (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
  );
}

/* ---------------------------------------------------------
   CARGA DE CONTENT.JSON
--------------------------------------------------------- */
async function loadContent() {
  const cached = db.get(CONTENT_CACHE_KEY);
  if (cached) return cached;

  const res = await fetch(CONFIG.contentUrl);
  if (!res.ok) throw new Error('No se pudo cargar content.json');

  const data = await res.json();
  db.save(CONTENT_CACHE_KEY, data);
  return data;
}

/* ---------------------------------------------------------
   RENDER CARDS
--------------------------------------------------------- */
const createCardHTML = (item, showVideo) => {
  const type = item.type || 'noticias';
  const link = `post.html?id=${encodeURIComponent(item.slug)}&type=${encodeURIComponent(type)}`;
  let media = '';

  if (showVideo && item.embed_url && getYoutubeId(item.embed_url)) {
    media = `
      <div class="video-wrapper">
        <iframe src="https://www.youtube.com/embed/${getYoutubeId(item.embed_url)}"
                frameborder="0" allowfullscreen></iframe>
      </div>`;
  } else {
    const imgUrl = item.thumbnail || 'https://placehold.co/600x400/eee/999?text=Perspectivas';
    media = `
      <div class="card-img-container">
        <a href="${link}">
          <img src="${imgUrl}" loading="lazy" alt="${item.title || ''}">
        </a>
      </div>`;
  }

  return `
    <article class="card">
      ${media}
      <div class="card-content">
        <small class="card-meta">
          ${formatDate(item.date)} | ${item.category || item.type || ''}
        </small>
        <h3><a href="${link}">${item.title || ''}</a></h3>
      </div>
    </article>`;
};

const createPodcastHTML = (item) => {
  const type = item.type || 'podcast';
  const link = `post.html?id=${encodeURIComponent(item.slug)}&type=${encodeURIComponent(type)}`;
  const imgUrl = item.thumbnail || 'https://placehold.co/150x150/333/fff?text=Audio';

  return `
    <article class="podcast-card">
      <a href="${link}" class="podcast-img-link">
        <img src="${imgUrl}" alt="${item.title || ''}" loading="lazy">
        <div class="play-overlay"><span class="play-icon">▶</span></div>
      </a>
      <div class="podcast-content">
        <small class="podcast-meta">${formatDate(item.date)} | EPISODIO</small>
        <h3 class="podcast-title"><a href="${link}">${item.title || ''}</a></h3>
      </div>
    </article>`;
};

/* ---------------------------------------------------------
   PATROCINADORES – GRID
--------------------------------------------------------- */
function resolveMediaUrl(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : path;
}

function shuffleArray(arr) {
  return arr
    .map(item => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function renderSponsorsGrid(entries) {
  const container = document.getElementById('sponsorsGrid');
  if (!container) return;

  const list = (entries || []).filter(e => String(e.active) !== 'false');
  container.innerHTML = '';

  if (!list.length) {
    container.innerHTML = '<p>No hay patrocinadores activos.</p>';
    return;
  }

  const randomized = shuffleArray(list);

  randomized.forEach(d => {
    const tierClass = d.tier ? `tier-${d.tier}` : '';
    const logoUrl = resolveMediaUrl(d.logo);

    const wrapper = document.createElement(d.url ? 'a' : 'div');
    wrapper.className = `sponsor-item ${tierClass}`;

    if (d.url) {
      wrapper.href = d.url;
      wrapper.target = '_blank';
      wrapper.rel = 'noopener noreferrer sponsored';
      wrapper.title = d.title || '';
    }

    const img = document.createElement('img');
    img.src = logoUrl || 'https://placehold.co/200x60?text=Logo';
    img.alt = d.title || 'Patrocinador';

    wrapper.appendChild(img);
    container.appendChild(wrapper);
  });
}

/* ---------------------------------------------------------
   PATROCINADORES – BLOQUE PRO (Smart + campañas)
--------------------------------------------------------- */
function pickSponsoredSmart(entries) {
  const now = new Date();

  let active = (entries || []).filter(e => String(e.active) !== 'false');
  if (!active.length) return null;

  const campaignActive = active.filter(e => {
    const start = e.campaign_start ? new Date(e.campaign_start) : null;
    const end   = e.campaign_end ? new Date(e.campaign_end) : null;

    if (start && end) return now >= start && now <= end;
    if (start && !end) return now >= start;
    if (!start && end) return now <= end;
    return true;
  });

  const pool = campaignActive.length ? campaignActive : active;

  pool.sort((a, b) => {
    const pa = a.priority ? Number(a.priority) : 999;
    const pb = b.priority ? Number(b.priority) : 999;
    return pa - pb;
  });

  // Si hay alguno marcado como featured:true, lo favorecemos
  const featured = pool.find(e => String(e.featured) === 'true');
  return featured || pool[0];
}

function renderSponsoredSite(entries) {
  const cardEl = document.getElementById('sponsoredSiteCard');
  if (!cardEl) return;

  const d = pickSponsoredSmart(entries);
  if (!d) {
    cardEl.classList.remove('skeleton-card');
    cardEl.innerHTML = '<p>No hay sitio patrocinado disponible.</p>';
    return;
  }

  const logoUrl = resolveMediaUrl(d.logo);

  // Fade-out
  cardEl.style.opacity = 0;

  setTimeout(() => {
    cardEl.classList.remove('skeleton-card');

    cardEl.innerHTML = `
      <div>
        <div class="sponsored-meta">
          Contenido patrocinado · Perspectivas
        </div>

        <h3>${d.headline || d.title || 'Sitio patrocinado'}</h3>

        ${
          d.excerpt
            ? `<p>${d.excerpt}</p>`
            : d.title
              ? `<p class="sponsored-tagline">
                   Conocé a <strong>${d.title}</strong>, aliado de Perspectivas en el desarrollo económico del Paraguay.
                 </p>`
              : ''
        }

        ${d.sector ? `<div class="sponsored-sector">Sector: ${d.sector}</div>` : ''}

        ${
          d.url
            ? `<div class="sponsored-actions">
                 <a class="sponsored-cta"
                    href="${d.url}"
                    target="_blank"
                    rel="noopener noreferrer sponsored">
                   Visitar sitio patrocinado
                 </a>
               </div>`
            : ''
        }
      </div>

      <div>
        <img
          src="${logoUrl || 'https://placehold.co/400x250?text=Patrocinador'}"
          alt="${d.title || 'Patrocinador'}">
      </div>
    `;

    // Fade-in
    cardEl.style.opacity = 1;
  }, 250);
}

function startSponsoredScheduler(entries) {
  if (!entries || !entries.length) return;
  renderSponsoredSite(entries);

  // Cada 3 minutos reevalúa campañas/prioridades
  setInterval(() => {
    renderSponsoredSite(entries);
  }, 3 * 60 * 1000);
}

/* ---------------------------------------------------------
   NEWSLETTER
--------------------------------------------------------- */
function setupNewsletter() {
  const form = document.getElementById('newsletter-form');
  const msg  = document.getElementById('newsletter-msg');
  if (!form || !msg) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('email');
    const plan = document.getElementById('plan').value;
    const btn  = form.querySelector('button');

    if (!emailInput.value.includes('@')) {
      msg.textContent = 'Email inválido';
      msg.className = 'msg-feedback msg-error';
      return;
    }

    const originalText = btn.textContent;
    btn.textContent = 'Enviando...';
    btn.disabled = true;

    try {
      // Aquí iría tu integración real (Brevo/Mailchimp/etc.)
      await new Promise(r => setTimeout(r, 1000));
      msg.textContent = `¡Suscrito al plan ${plan}!`;
      msg.className = 'msg-feedback msg-success';
      form.reset();
    } catch (e2) {
      msg.textContent = 'Error al enviar.';
      msg.className = 'msg-feedback msg-error';
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

/* ---------------------------------------------------------
   HOME
--------------------------------------------------------- */
async function initHome() {
  try {
    const data = await loadContent();

    const news     = sortByDateDesc(data.noticias);
    const prog     = sortByDateDesc(data.programa);
    const analysis = sortByDateDesc(data.analisis);
    const podcasts = sortByDateDesc(data.podcast);
    const sponsors = (data.sponsors || []).filter(s => String(s.active) !== 'false');

    /* Hero + destacados */
    if (news.length > 0) {
      const hero   = news[0];
      const heroEl = document.querySelector('.featured-card-bbc');

      if (heroEl) {
        const heroImg = hero.thumbnail || 'https://placehold.co/800x400/eee/999?text=Perspectivas';
        const type = hero.type || 'noticias';
        heroEl.innerHTML = `
          <a href="post.html?id=${encodeURIComponent(hero.slug)}&type=${encodeURIComponent(type)}">
            <img src="${heroImg}" alt="${hero.title || ''}">
            <h2>${hero.title || ''}</h2>
            <p>${hero.description || ''}</p>
          </a>`;
      }

      const sideEl = document.getElementById('top-list-bbc');
      if (sideEl) {
        sideEl.innerHTML = news.slice(1, 4).map(n => {
          const type = n.type || 'noticias';
          return `
            <li>
              <a href="post.html?id=${encodeURIComponent(n.slug)}&type=${encodeURIComponent(type)}">
                <h4>${n.title || ''}</h4>
                <small>${formatDate(n.date)}</small>
              </a>
            </li>`;
        }).join('');
      }

      const newsGrid = document.getElementById('news-grid');
      if (newsGrid) {
        const slice = news.slice(1, 1 + CONFIG.limitNews);
        newsGrid.innerHTML = slice.map(n => createCardHTML(n)).join('');
      }

      // Filtros por categoría
      const container = document.getElementById('category-filters');
      if (container) {
        const cats = ['Todas', ...new Set(news.map(i => i.category || 'General'))];
        container.innerHTML = cats.map(c => `
          <button class="filter-btn ${c === 'Todas' ? 'active' : ''}"
                  data-cat="${c}">${c}</button>`).join('');

        container.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', () => {
            container.querySelectorAll('.filter-btn')
                     .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const cat = btn.dataset.cat;
            const filtered =
              cat === 'Todas'
                ? news.slice(1, 1 + CONFIG.limitNews)
                : news.filter(i => (i.category || 'General') === cat);

            document.getElementById('news-grid').innerHTML =
              filtered.map(i => createCardHTML(i)).join('');
          });
        });
      }

      // Buscador
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.addEventListener('input', e => {
          const term = e.target.value.toLowerCase();
          const grid = document.getElementById('news-grid');
          if (!grid) return;

          if (term.length < 2) {
            grid.innerHTML =
              news.slice(1, 1 + CONFIG.limitNews).map(n => createCardHTML(n)).join('');
          } else {
            grid.innerHTML =
              news.filter(n => (n.title || '').toLowerCase().includes(term))
                  .map(n => createCardHTML(n))
                  .join('');
          }
        });
      }
    }

    /* Otros grids */
    const progGrid = document.getElementById('program-grid');
    if (progGrid) {
      progGrid.innerHTML = prog.slice(0, 6).map(p => createCardHTML(p, true)).join('');
    }

    const anaGrid = document.getElementById('analisis-grid');
    if (anaGrid) {
      anaGrid.innerHTML = analysis.slice(0, 4).map(a => createCardHTML(a)).join('');
    }

    const podGrid = document.getElementById('podcast-grid');
    if (podGrid) {
      podGrid.innerHTML = podcasts.slice(0, 4).map(p => createPodcastHTML(p)).join('');
    }

    /* Newsletter */
    setupNewsletter();

    /* Sponsors */
    if (sponsors.length) {
      renderSponsorsGrid(sponsors);
      startSponsoredScheduler(sponsors);
    }

  } catch (err) {
    console.error('Error en initHome:', err);
  }
}

/* ---------------------------------------------------------
   POST
--------------------------------------------------------- */
async function initPost() {
  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('id');
  const type   = params.get('type') || 'noticias';
  const el     = document.getElementById('article-detail');
  if (!slug || !el) return;

  try {
    const data = await loadContent();
    const list = data[type] || [];
    const item = list.find(p => String(p.slug) === String(slug));

    if (!item) {
      el.innerHTML = '<p>Error cargando contenido.</p>';
      return;
    }

    document.title = item.title || 'Perspectivas';

    if (typeof marked === 'undefined') {
      await import('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
    }

    let video = '';
    if (item.embed_url) {
      const vid = getYoutubeId(item.embed_url);
      if (vid) {
        video = `
          <div class="video-wrapper" style="margin:2rem 0">
            <iframe src="https://www.youtube.com/embed/${vid}"
                    frameborder="0" allowfullscreen></iframe>
          </div>`;
      }
    }

    let htmlContent = marked.parse(item.body || '');
    const thumbnail = item.thumbnail;
    let featuredImgHTML = '';

    if (!video && thumbnail) {
      featuredImgHTML = `<img src="${thumbnail}" class="featured-image">`;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const firstImg = tempDiv.querySelector('img');

      if (firstImg &&
          (firstImg.getAttribute('src') === thumbnail || firstImg.src === thumbnail)) {
        firstImg.remove();
        htmlContent = tempDiv.innerHTML;
      }
    }

    el.innerHTML = `
      <header class="article-header">
        <span class="article-category">${item.category || type}</span>
        <h1 class="article-title">${item.title || ''}</h1>
        <time class="article-meta">${formatDate(item.date)}</time>
      </header>

      ${video}
      ${featuredImgHTML}

      <div class="article-content">${htmlContent}</div>
    `;
  } catch (err) {
    console.error('Error en initPost:', err);
    el.innerHTML = '<p>Error cargando contenido.</p>';
  }
}

/* ---------------------------------------------------------
   DOM READY
--------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('post.html')) {
    initPost();
  } else {
    initHome();
  }

  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.getElementById('nav-list').classList.toggle('active');
  });
});
