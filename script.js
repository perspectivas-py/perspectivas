/* script.js - Perspectivas Engine v3 PRO (JSON Local Final) */

/* -------------------------------
   1) Cargar el archivo content.json
----------------------------------*/
async function fetchContentJSON() {
  try {
    const res = await fetch("/content.json", { cache: "no-store" });

    if (!res.ok) throw new Error("No se pudo cargar content.json");

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("❌ Error cargando /content.json:", err);
    return null;
  }
}

/* -------------------------------
   2) Formatear fechas
----------------------------------*/
function formatDate(str) {
  if (!str) return "";
  try {
    return new Date(str).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return str;
  }
}

/* -------------------------------
   3) Crear tarjetas
----------------------------------*/
function createCardHTML(item) {
  return `
    <article class="card">
      <div class="card-img-container">
        <img src="${item.thumbnail}" loading="lazy">
      </div>
      <div class="card-content">
        <small class="card-meta">${formatDate(item.date)} | ${item.category}</small>
        <h3><a href="post.html?id=${item.slug}&type=${item.type}">${item.title}</a></h3>
      </div>
    </article>
  `;
}

/* -------------------------------
   4) Renderizar Home
----------------------------------*/
function renderHome(data) {
  /* HERO */
  const heroEl = document.querySelector(".featured-card-bbc");
  if (data.noticias.length > 0 && heroEl) {
    const hero = data.noticias[0];
    heroEl.innerHTML = `
      <a href="post.html?id=${hero.slug}&type=noticias">
        <img src="${hero.thumbnail}">
        <h2>${hero.title}</h2>
        <p>${hero.description || ""}</p>
      </a>
    `;
  }

  /* Noticias */
  const newsGrid = document.getElementById("news-grid");
  if (newsGrid) {
    newsGrid.innerHTML = data.noticias
      .slice(1, 9)
      .map(n => createCardHTML(n))
      .join("");
  }

  /* Programa */
  const progGrid = document.getElementById("program-grid");
  if (progGrid) {
    progGrid.innerHTML = data.programa
      .slice(0, 6)
      .map(p => createCardHTML(p))
      .join("");
  }

  /* Análisis */
  const anaGrid = document.getElementById("analisis-grid");
  if (anaGrid) {
    anaGrid.innerHTML = data.analisis
      .slice(0, 4)
      .map(p => createCardHTML(p))
      .join("");
  }

  /* Podcast */
  const podGrid = document.getElementById("podcast-grid");
  if (podGrid) {
    podGrid.innerHTML = data.podcast
      .slice(0, 4)
      .map(p => createCardHTML(p))
      .join("");
  }

  /* Sponsors */
  if (data.sponsors) {
    renderSponsorsGrid(data.sponsors);
    startSponsoredScheduler(data.sponsors);
  }
}

/* -------------------------------
   5) Renderizar Sponsors Grid
----------------------------------*/
function renderSponsorsGrid(list) {
  const container = document.getElementById("sponsorsGrid");
  if (!container) return;

  container.innerHTML = list
    .map(s => `
      <div class="sponsor-item">
        <img src="${s.logo}" alt="${s.title}">
      </div>
    `)
    .join("");
}

/* -------------------------------
   6) Sistema PRO de Rotación
----------------------------------*/
function pickSponsoredSmart(entries) {
  const now = new Date();

  // 1. Filtrar activos
  let active = entries.filter(e => e.active !== false);

  // 2. Campañas activas
  let campaign = active.filter(e => {
    const start = e.campaign_start ? new Date(e.campaign_start) : null;
    const end = e.campaign_end ? new Date(e.campaign_end) : null;

    if (start && end) return now >= start && now <= end;
    if (start && !end) return now >= start;
    if (!start && end) return now <= end;
    return true;
  });

  let pool = campaign.length ? campaign : active;

  // 3. Orden por prioridad
  pool.sort((a, b) => (a.priority || 999) - (b.priority || 999));

  return pool[0];
}

function renderSponsoredSite(entries) {
  const cardEl = document.getElementById("sponsoredSiteCard");
  if (!cardEl) return;

  const d = pickSponsoredSmart(entries);

  cardEl.innerHTML = `
    <div>
      <div class="sponsored-meta">Contenido patrocinado · Perspectivas</div>
      <h3>${d.headline || d.title}</h3>
      <p>${d.excerpt || ""}</p>
      ${d.sector ? `<div class="sponsored-sector">Sector: ${d.sector}</div>` : ""}
      ${
        d.url
          ? `<div class="sponsored-actions">
              <a class="sponsored-cta" href="${d.url}" target="_blank">Visitar sitio patrocinado</a>
             </div>`
          : ""
      }
    </div>
    <div>
      <img src="${d.logo}" alt="${d.title}">
    </div>
  `;
}

function startSponsoredScheduler(entries) {
  renderSponsoredSite(entries);

  setInterval(() => {
    const el = document.getElementById("sponsoredSiteCard");
    el.style.opacity = 0;

    setTimeout(() => {
      renderSponsoredSite(entries);
      el.style.opacity = 1;
    }, 600);
  }, 20000);
}

/* -------------------------------
   7) Página de Post Individual
----------------------------------*/
async function loadPost() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const type = params.get("type");

  const data = await fetchContentJSON();
  if (!data || !data[type]) {
    document.getElementById("article-detail").innerHTML = "<p>Error cargando post</p>";
    return;
  }

  const post = data[type].find(p => p.slug === id);
  if (!post) {
    document.getElementById("article-detail").innerHTML = "<p>No encontrado</p>";
    return;
  }

  document.title = post.title;

  document.getElementById("article-detail").innerHTML = `
    <header class="article-header">
      <span class="article-category">${post.category}</span>
      <h1 class="article-title">${post.title}</h1>
      <time class="article-meta">${formatDate(post.date)}</time>
    </header>

    <img src="${post.thumbnail}" class="featured-image">

    <div class="article-content">${post.body}</div>
  `;
}

/* -------------------------------
   8) INIT
----------------------------------*/
document.addEventListener("DOMContentLoaded", async () => {
  const isPost = window.location.pathname.includes("post.html");

  if (isPost) {
    loadPost();
  } else {
    const data = await fetchContentJSON();
    if (data) renderHome(data);
  }
});
