// script.js — PRO v3 FINAL
// Lee SIEMPRE el content.json más reciente generado por Vercel

console.log("🚀 Perspectivas PRO v3 inicializado");

async function loadContent() {
  try {
    const res = await fetch(`/.vercel/path0/content.json?ts=${Date.now()}`);
    if (!res.ok) throw new Error("No se pudo cargar content.json");

    const data = await res.json();

    renderHero(data.noticias);
    renderSecondary(data.noticias);
    renderNoticiasLocales(data.noticias);
    renderAnalisis(data.analisis);
    renderPrograma(data.programa);
    renderPodcast(data.podcast);
    renderSponsors(data.sponsors);

  } catch (err) {
    console.error("❌ Error cargando contenido:", err);
    document.getElementById("home-news").innerHTML =
      `<div class="error-box">Error al cargar contenido</div>`;
  }
}

function renderHero(noticias) {
  if (!noticias?.length) return;

  const main = noticias[0];
  document.getElementById("hero").innerHTML = `
    <img src="${main.thumbnail}" alt="${main.title}" class="hero-img"/>
    <div class="hero-content">
      <div class="hero-section">${main.category}</div>
      <h2 class="hero-title">${main.title}</h2>
      <p class="hero-excerpt">${main.description || ""}</p>
    </div>
  `;
}

function renderSecondary(noticias) {
  const container = document.getElementById("secondary-news");
  container.innerHTML = noticias.slice(1, 4).map(n => `
    <div class="card">
      <img src="${n.thumbnail}" />
      <div>
        <h3>${n.title}</h3>
        <small>${formatDate(n.date)}</small>
      </div>
    </div>
  `).join("");
}

function renderNoticiasLocales(noticias) {
  const grid = document.getElementById("news-grid");
  grid.innerHTML = noticias.map(n => `
    <div class="card">
      <div class="card-img-container">
        <img src="${n.thumbnail}" alt="${n.title}">
      </div>
      <h3>${n.title}</h3>
      <div class="card-meta">${formatDate(n.date)}</div>
    </div>
  `).join("");
}

function renderAnalisis(items) {
  document.getElementById("analisis-grid").innerHTML = items.map(a => `
    <div class="card">
      <div class="card-img-container">
        <img src="${a.thumbnail}" alt="${a.title}">
      </div>
      <h3>${a.title}</h3>
      <div class="card-meta">${formatDate(a.date)}</div>
    </div>
  `).join("");
}

function renderPrograma(items) {
  document.getElementById("program-grid").innerHTML = items.map(p => `
    <div class="card">
      <div class="video-wrapper">
        <iframe src="${p.embed_url}" frameborder="0"></iframe>
      </div>
      <h3>${p.title}</h3>
    </div>
  `).join("");
}

function renderPodcast(items) {
  document.getElementById("podcast-grid").innerHTML = items.map(pod => `
    <div class="podcast-card">
      <a class="podcast-img-link">
        <img src="${pod.thumbnail}">
        <span class="play-overlay"><span class="play-icon">▶</span></span>
      </a>
      <div class="podcast-content">
        <div class="podcast-meta">${formatDate(pod.date)}</div>
        <p class="podcast-title">${pod.title}</p>
      </div>
    </div>
  `).join("");
}

function renderSponsors(items) {
  document.getElementById("sponsorsGrid").innerHTML = items.map(s => `
    <div class="sponsor-item tier-Gold">
      <a href="${s.url}" target="_blank"><img src="${s.logo}" /></a>
    </div>
  `).join("");
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("es-PY", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

loadContent();
