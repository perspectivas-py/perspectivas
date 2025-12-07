// script.v3.js — MOTOR PRO DEFINITIVO
console.log("🚀 Perspectivas PRO v3 cargado");

// Ruta universal de Vercel
const CONTENT_URL = "/content.json";

async function initHome() {
  try {
    const res = await fetch(CONTENT_URL + `?t=${Date.now()}`); // evita cache viejo
    if (!res.ok) throw new Error("No se pudo cargar content.json");

    const data = await res.json();

    renderHero(data.noticias);
    renderSecondary(data.noticias);
    renderNoticiasLocales(data.noticias);
    renderAnalisis(data.analisis);
    renderPrograma(data.programa);
    renderPodcast(data.podcast);
    renderSponsors(data.sponsors);

  } catch (e) {
    console.error("❌ Error:", e);
    document.getElementById("hero").innerHTML = `<p>Error cargando contenido</p>`;
  }
}

function renderHero(n) {
  if (!n?.length) return;
  const a = n[0];

  document.getElementById("hero").innerHTML = `
    <img src="${a.thumbnail}" class="hero-img"/>
    <div class="hero-content">
      <div class="hero-section">${a.category}</div>
      <h2 class="hero-title">${a.title}</h2>
      <p class="hero-excerpt">${a.description ?? ""}</p>
    </div>
  `;
}

function renderSecondary(n) {
  document.getElementById("secondary-news").innerHTML =
    n.slice(1, 4)
      .map(a => `
        <div class="card">
          <img src="${a.thumbnail}"/>
          <div>
            <h3>${a.title}</h3>
            <small>${formatDate(a.date)}</small>
          </div>
        </div>
      `)
      .join("");
}

function renderNoticiasLocales(n) {
  document.getElementById("news-grid").innerHTML =
    n.slice(0, 12)
      .map(a => `
        <div class="card">
          <div class="card-img-container">
            <img src="${a.thumbnail}" alt="${a.title}">
          </div>
          <h3>${a.title}</h3>
          <div class="card-meta">${formatDate(a.date)}</div>
        </div>
      `)
      .join("");
}

function renderAnalisis(items) {
  document.getElementById("analisis-grid").innerHTML =
    items.map(a => `
      <div class="card">
        <img src="${a.thumbnail}">
        <h3>${a.title}</h3>
        <div class="card-meta">${formatDate(a.date)}</div>
      </div>
    `).join("");
}

function renderPrograma(items) {
  document.getElementById("program-grid").innerHTML =
    items.map(p => `
      <div class="card">
        <div class="video-wrapper">
          <iframe src="${p.embed_url}" frameborder="0"></iframe>
        </div>
        <h3>${p.title}</h3>
      </div>
    `).join("");
}

function renderPodcast(items) {
  document.getElementById("podcast-grid").innerHTML =
    items.map(p => `
      <div class="podcast-card">
        <img src="${p.thumbnail}">
        <p class="podcast-title">${p.title}</p>
        <small>${formatDate(p.date)}</small>
      </div>
    `).join("");
}

function renderSponsors(items) {
  document.getElementById("sponsorsGrid").innerHTML =
    items.map(s => `
      <div class="sponsor-item">
        <a href="${s.url}" target="_blank"><img src="${s.logo}"></a>
      </div>
    `).join("");
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("es-PY", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

initHome();
