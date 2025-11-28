/* script.js - Perspectivas Engine PRO v4 (Home HERO Featured + Secondary News + JSON Unified Loader) */

/* ============================================================
   CONFIG
============================================================ */
const CONFIG = {
  limitNews: 10,
  rotationTime: 12000, // patrocinador: 12 seg
};

/* ============================================================
   LOAD JSON
============================================================ */
async function loadContentJSON() {
  try {
    const res = await fetch("/public/content.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar content.json");
    return await res.json();
  } catch (e) {
    console.error("ERROR cargando content.json:", e);
    return null;
  }
}

/* ============================================================
   HELPERS
============================================================ */
const formatDate = (str) => {
  if (!str) return "";
  try {
    return new Date(str).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch (e) {
    return str;
  }
};

const getYoutubeId = (url) => {
  if (!url) return null;
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return match && match[2].length === 11 ? match[2] : null;
};

function resolveMediaUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : path;
}

/* ============================================================
   HERO PRO — NOTICIA DESTACADA FEATURED
============================================================ */
function renderHeroFeatured(posts) {
  const featured = posts.find(p => String(p.featured) === "true" || p.featured === true);
  if (!featured) return;

  const heroEl = document.getElementById("hero");
  if (!heroEl) return;

  const img = featured.thumbnail || featured.image || "https://placehold.co/1200x600?text=Perspectivas";

  heroEl.innerHTML = `
    <img src="${img}" alt="${featured.title}" class="hero-img">
    <div class="hero-content">
      <span class="hero-section">${featured.section || featured.category || "Noticias"}</span>
      <h2 class="hero-title">
        <a href="post.html?id=${featured.id}&type=noticias">${featured.title}</a>
      </h2>
      ${featured.excerpt ? `<p class="hero-excerpt">${featured.excerpt}</p>` : ""}
    </div>
  `;
}

/* ============================================================
   NOTICIAS SECUNDARIAS (NO featured)
============================================================ */
function renderSecondaryNews(posts) {
  const secondary = posts
    .filter(p => !(String(p.featured) === "true" || p.featured === true))
    .slice(0, 4);

  const container = document.getElementById("secondary-news");
  if (!container) return;

  container.innerHTML = secondary.map(n => `
    <article class="card">
      <img src="${n.thumbnail || n.image || 'https://placehold.co/400x250'}" loading="lazy">
      <div>
        <h3><a href="post.html?id=${n.id}&type=noticias">${n.title}</a></h3>
        <small>${formatDate(n.date)}</small>
        ${n.excerpt ? `<p>${n.excerpt}</p>` : ""}
      </div>
    </article>
  `).join("");
}

/* ============================================================
   RENDER HOME
============================================================ */
function renderHome(data) {
  const news = data.noticias || [];
  const prog = data.programa || [];
  const analisis = data.analisis || [];
  const podcasts = data.podcast || [];
  const sponsors = data.sponsors || [];

  /* HERO PRO FEATURED */
  if (news.length) renderHeroFeatured(news);

  /* SECUNDARIAS */
  renderSecondaryNews(news);

  /* NEWS GRID */
  const newsGrid = document.getElementById("news-grid");
  if (newsGrid) {
    newsGrid.innerHTML = news
      .filter(n => !(String(n.featured) === "true" || n.featured === true))
      .slice(4, 4 + CONFIG.limitNews)
      .map(cardHTML)
      .join("");
  }

  /* PROGRAMA */
  const progGrid = document.getElementById("program-grid");
  if (progGrid) {
    progGrid.innerHTML = prog.slice(0, 6)
      .map(p => cardHTML(p, true))
      .join("");
  }

  /* ANÁLISIS */
  const anaGrid = document.getElementById("analisis-grid");
  if (anaGrid) {
    anaGrid.innerHTML = analisis.slice(0, 4)
      .map(a => cardHTML(a))
      .join("");
  }

  /* PODCAST */
  const podGrid = document.getElementById("podcast-grid");
  if (podGrid) {
    podGrid.innerHTML = podcasts.slice(0, 4)
      .map(podcastHTML)
      .join("");
  }

  /* SPONSORS */
  if (sponsors.length) startSponsorsRotation(sponsors);
   
/* MÁS LEÍDAS */
const topEl = document.getElementById("top-reads");
if (topEl && ranked.length) {
  topEl.innerHTML = ranked.map((n, i) => `
    <li>
      <a href="post.html?id=${n.id}&type=noticias">
        <strong>${i + 1}. ${n.title}</strong>
        <small style="display:block;color:#666">${n.views} visitas</small>
      </a>
    </li>
  `).join("");
}
}

/* ============================================================
   INIT HOME
============================================================ */
async function initHome() {
  const data = await loadContentJSON();
  if (!data) return;

  renderHome(data);

   const news = data.noticias || [];
/* LOAD VIEW COUNTS */
const views = JSON.parse(localStorage.getItem("views") || "{}");

/* JOIN DATA + VIEWS */
const ranked = news
  .map(n => ({
    ...n,
    views: views[n.id] || 0
  }))
  .sort((a, b) => b.views - a.views) // mayor a menor
  .slice(0, 5); // TOP 5


  /* Buscador */
  const search = document.getElementById("search-input");
  if (search) {
    search.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const newsGrid = document.getElementById("news-grid");
      if (!newsGrid) return;

      if (!term || term.length < 2) {
        newsGrid.innerHTML = data.noticias
          .filter(n => !(String(n.featured) === "true" || n.featured === true))
          .slice(4, 4 + CONFIG.limitNews)
          .map(cardHTML)
          .join("");
      } else {
        newsGrid.innerHTML = data.noticias
          .filter(n => n.title.toLowerCase().includes(term))
          .map(cardHTML)
          .join("");
      }
    });
  }
}

/* ============================================================
   INIT POST
============================================================ */
async function initPost() {
  const p = new URLSearchParams(window.location.search);
  const id = p.get("id");
  const type = p.get("type");

  const data = await loadContentJSON();
  if (!data || !id || !type) return;

  const list = data[type] || [];
  const item = list.find(x => x.id === id);
  if (!item) return;
   /* =======================
   CONTADOR DE VISITAS LOCAL
   ======================= */
const views = JSON.parse(localStorage.getItem("views") || "{}");
views[item.id] = (views[item.id] || 0) + 1;
localStorage.setItem("views", JSON.stringify(views));


  const el = document.getElementById("article-detail");
  if (!el) return;

  document.title = item.title;

  let video = "";
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

  let featured = "";
  if (!video && item.thumbnail) {
    featured = `<img src="${item.thumbnail}" class="featured-image">`;
  }

  el.innerHTML = `
    <header class="article-header">
       <span class="article-category">${item.category}</span>
       <h1 class="article-title">${item.title}</h1>
       <time class="article-meta">${formatDate(item.date)}</time>
    </header>

    ${video}
    ${featured}

    <div class="article-content">${item.body_html}</div>
  `;
}

/* ============================================================
   DOM READY
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("post.html")) {
    initPost();
  } else {
    initHome();
  }
});
