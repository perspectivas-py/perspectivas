/* script.js - Perspectivas Engine v3.0 (Patrocinadores Integrado PRO) */

const CONFIG = {
  username: 'perspectivas-py',
  repo: 'perspectivas',
  limitNews: 10,
  cacheTime: 15 * 60 * 1000, // 15 min
};

const PATHS = {
  noticias: 'content/noticias/posts',
  programa: 'content/programa/posts',
  analisis: 'content/analisis/posts',
  podcast: 'content/podcast/posts',
  sponsors: 'content/sponsors'
};

const BASE_API = `https://api.github.com/repos/${CONFIG.username}/${CONFIG.repo}/contents`;

/* ---------------------------------------------------------
   SISTEMA DE CACHÉ
--------------------------------------------------------- */
const db = {
  save: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), payload: data }));
    } catch (e) {}
  },

  get: (key) => {
    const record = localStorage.getItem(key);
    if (!record) return null;

    const { timestamp, payload } = JSON.parse(record);
    if (Date.now() - timestamp > CONFIG.cacheTime) return null;

    return payload;
  }
};

/* ---------------------------------------------------------
   HELPERS GENERALES
--------------------------------------------------------- */
const formatDate = (str) => {
  if (!str) return "";
  return new Date(str).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

const getYoutubeId = (url) => {
  if (!url) return null;
  const m = url.match(/^.*(youtu.be\/|v\/|embed\/|watch\?v=)([^#&?]{11}).*/);
  return m ? m[2] : null;
};

const extractFirstImage = (md) => {
  const mdImg = md.match(/!\[.*?\]\((.*?)\)/);
  if (mdImg) return mdImg[1];
  const htmlImg = md.match(/<img[^>]+src=["']([^"']+)["']/i);
  return htmlImg ? htmlImg[1] : null;
};

const parseMarkdown = (text) => {
  const front = text.match(/^---([\s\S]*?)---/);
  if (!front) return { attributes: {}, body: text };

  const attrs = {};
  front[1].split("\n").forEach(line => {
    const [key, ...value] = line.split(":");
    if (key && value) attrs[key.trim()] = value.join(":").trim().replace(/^['"]|['"]$/g, "");
  });

  return {
    attributes: attrs,
    body: text.replace(front[0], "").trim()
  };
};

/* ---------------------------------------------------------
   HELPERS SPONSORS
--------------------------------------------------------- */
const shuffleArray = (arr) =>
  arr.map(a => ({ sort: Math.random(), value: a }))
     .sort((a, b) => a.sort - b.sort)
     .map(a => a.value);

const resolveMediaUrl = (path) => !path ? "" : path;

/* ---------------------------------------------------------
   FETCH COLLECTIONS
--------------------------------------------------------- */
async function fetchCollection(path, type) {
  const cacheKey = `persp_cache_${type}`;
  const cached = db.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${BASE_API}/${path}`);
    if (!res.ok) return [];

    const json = await res.json();
    const mdFiles = json.filter(f => f.name.endsWith(".md"));

    const items = await Promise.all(
      mdFiles.map(async (f) => {
        const raw = await fetch(f.download_url);
        const text = await raw.text();
        const { attributes, body } = parseMarkdown(text);

        return {
          ...attributes,
          body,
          slug: f.name.replace(".md", ""),
          folder: path,
          thumbnail: attributes.thumbnail || extractFirstImage(body)
        };
      })
    );

    const sorted = items.sort((a, b) => new Date(b.date) - new Date(a.date));
    db.save(cacheKey, sorted);
    return sorted;

  } catch (e) {
    return [];
  }
}

/* ---------------------------------------------------------
   RENDER CARDS
--------------------------------------------------------- */
const createCardHTML = (item, showVideo = false) => {
  const link = `post.html?id=${item.slug}&folder=${item.folder}`;
  const img = item.thumbnail || "https://placehold.co/600x400/eee/999?text=Perspectivas";

  return `
    <article class="card">
      <div class="card-img-container">
        <a href="${link}">
          <img src="${img}" alt="${item.title}" loading="lazy">
        </a>
      </div>
      <div class="card-content">
        <small class="card-meta">${formatDate(item.date)} | ${item.category}</small>
        <h3><a href="${link}">${item.title}</a></h3>
      </div>
    </article>
  `;
};

/* ---------------------------------------------------------
   GRID DE SPONSORS
--------------------------------------------------------- */
function renderSponsorsGrid(entries) {
  const box = document.getElementById("sponsorsGrid");
  if (!box) return;

  if (!entries.length) {
    box.innerHTML = "<p>No hay patrocinadores activos.</p>";
    return;
  }

  const randomized = shuffleArray(entries);

  box.innerHTML = randomized
    .filter(d => String(d.active) !== "false")
    .map(d => `
      <a class="sponsor-item tier-${d.tier || ''}"
         href="${d.url || '#'}"
         target="_blank"
         rel="noopener noreferrer sponsored">
        <img src="${resolveMediaUrl(d.logo)}" alt="${d.title}">
      </a>
    `)
    .join("");
}

/* ---------------------------------------------------------
   SPONSOR SMART PICK (Campañas + Prioridades)
--------------------------------------------------------- */
function pickSponsoredSmart(entries) {
  const now = new Date();

  const active = entries.filter(e => String(e.active) !== "false");

  // Filtrar campañas activas
  const campaign = active.filter(e => {
    const start = e.campaign_start ? new Date(e.campaign_start) : null;
    const end = e.campaign_end ? new Date(e.campaign_end) : null;

    if (start && end) return now >= start && now <= end;
    if (start && !end) return now >= start;
    if (!start && end) return now <= end;

    return true;
  });

  const pool = campaign.length ? campaign : active;

  // Orden por prioridad
  pool.sort((a, b) => (Number(a.priority || 999)) - (Number(b.priority || 999)));

  return pool[0];
}

/* ---------------------------------------------------------
   RENDER SPONSORED BLOCK (Bloque destacado)
--------------------------------------------------------- */
function renderSponsoredSite(entries) {
  const card = document.getElementById("sponsoredSiteCard");
  if (!card) return;

  const d = pickSponsoredSmart(entries);
  if (!d) {
    card.innerHTML = "<p>No hay patrocinador disponible.</p>";
    return;
  }

  const logo = resolveMediaUrl(d.logo);

  card.innerHTML = `
    <div>
      <div class="sponsored-meta">Contenido patrocinado · Perspectivas</div>

      <h3>${d.headline || d.title}</h3>

      ${
        d.excerpt
          ? `<p>${d.excerpt}</p>`
          : `<p class="sponsored-tagline">
               Conocé a <strong>${d.title}</strong>, aliado de Perspectivas en el desarrollo económico del Paraguay.
             </p>`
      }

      ${d.sector ? `<div class="sponsored-sector">Sector: ${d.sector}</div>` : ""}

      ${
        d.url
          ? `<div class="sponsored-actions">
               <a href="${d.url}" class="sponsored-cta" target="_blank" rel="noopener noreferrer sponsored">
                 Visitar sitio patrocinado
               </a>
             </div>`
          : ""
      }
    </div>

    <div>
      <img src="${logo}" alt="${d.title}">
    </div>
  `;
}
// ---------------------------------------------------------
// RENDER: Sitio Patrocinado (bloque destacado)
// ---------------------------------------------------------
function renderSponsoredSite(entries) {
  const cardEl = document.getElementById("sponsoredSiteCard");
  if (!cardEl) return;

  // Selección inteligente
  const featured = pickSponsoredSmart(entries);
  if (!featured) {
    cardEl.innerHTML = "<p>No hay patrocinadores activos.</p>";
    return;
  }

  const logoUrl = resolveMediaUrl(featured.logo);

  cardEl.classList.remove("skeleton-card");
  cardEl.innerHTML = `
    <div>
      <div class="sponsored-meta">Contenido patrocinado · Perspectivas</div>

      <h3>${featured.headline || featured.title || 'Sitio patrocinado'}</h3>

      ${
        featured.excerpt
          ? `<p>${featured.excerpt}</p>`
          : featured.title
            ? `<p class="sponsored-tagline">
                 Conocé a <strong>${featured.title}</strong>, aliado de Perspectivas en el desarrollo económico del Paraguay.
               </p>`
            : ''
      }

      ${featured.sector ? `<div class="sponsored-sector">Sector: ${featured.sector}</div>` : ''}

      ${
        featured.url
          ? `<div class="sponsored-actions">
               <a class="sponsored-cta" href="${featured.url}" target="_blank" rel="noopener noreferrer sponsored">
                 Visitar sitio patrocinado
               </a>
             </div>`
          : ''
      }
    </div>

    <div>
      <img
        src="${logoUrl || 'https://placehold.co/400x250?text=Patrocinador'}"
        alt="${featured.title || 'Patrocinador'}">
    </div>
  `;
}

/* ---------------------------------------------------------
   ROTACIÓN PRO v3 (animación + scheduler)
--------------------------------------------------------- */
function startSponsoredScheduler(entries) {
  // Carga inicial inmediata
  renderSponsoredSite(entries);

  setInterval(() => {
    const card = document.getElementById("sponsoredSiteCard");
    if (!card) return;

    // fade-out
    card.style.opacity = 0;

    setTimeout(() => {
      renderSponsoredSite(entries);

      setTimeout(() => {
        card.style.opacity = 1;
      }, 80);

    }, 500);

  }, 12000); // cada 12 segundos
}

/* ---------------------------------------------------------
   HOME: CARGA DE SPONSORS
--------------------------------------------------------- */
async function loadSponsorsHome() {
  try {
    const sponsors = await fetchCollection(PATHS.sponsors, "sponsors");

    if (sponsors.length) {
      renderSponsorsGrid(sponsors);
      startSponsoredScheduler(sponsors);
    }

  } catch (e) {
    const g = document.getElementById("sponsorsGrid");
    const s = document.getElementById("sponsoredSiteCard");
    if (g) g.innerHTML = "<p>Error al cargar patrocinadores.</p>";
    if (s) s.innerHTML = "<p>Error cargando sitio patrocinado.</p>";
  }
}

/* ---------------------------------------------------------
   HOME INIT
--------------------------------------------------------- */
async function initHome() {
  const news = await fetchCollection(PATHS.noticias, "noticias");
  const prog = await fetchCollection(PATHS.programa, "programa");
  const analysis = await fetchCollection(PATHS.analisis, "analisis");
  const podcasts = await fetchCollection(PATHS.podcast, "podcast");

  // Hero
  if (news.length) {
    const hero = news[0];
    const el = document.querySelector(".featured-card-bbc");

    if (el) {
      el.innerHTML = `
        <a href="post.html?id=${hero.slug}&folder=${hero.folder}">
          <img src="${hero.thumbnail}" alt="${hero.title}">
          <h2>${hero.title}</h2>
          <p>${hero.description || ''}</p>
        </a>
      `;
    }
  }

  // Sponsors
  loadSponsorsHome();
}

/* ---------------------------------------------------------
   DOM READY
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("post.html")) return;
  initHome();
});
