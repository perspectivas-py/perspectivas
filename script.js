// === Perspectivas v3 PRO ===
// Sistema dinámico usando content.json en la RAÍZ del proyecto
// Arquitectura optimizada para Vercel - 2025

const CONTENT_URL = "/content.json"; // 👈 JSON único ORIGEN DE DATOS

document.addEventListener("DOMContentLoaded", initSite);

async function initSite() {
  showLoading();
  try {
    const data = await fetchContent();
    hideLoading();
    renderHome(data);
    renderSecondary(data);
    renderSponsors(data.sponsors || []);
  } catch (err) {
    showError(err);
  }
}

/* ==========================
   FETCH DEL JSON PRINCIPAL
   ========================== */
async function fetchContent() {
  const res = await fetch(CONTENT_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Error cargando content.json");
  return res.json();
}

/* ==========================
   PORTADA PRINCIPAL
   ========================== */
function renderHome(data) {
  const noticias = data.noticias || [];
  if (!noticias.length) return;

  const hero = noticias[0]; // la más reciente
  document.querySelector("#hero").innerHTML = `
    <article class="hero-main">
      <img src="${hero.thumbnail}" alt="${hero.title}" class="hero-img">
      <div class="hero-content">
        <span class="hero-section">${hero.category}</span>
        <h1 class="hero-title">${hero.title}</h1>
        <p class="hero-excerpt">${hero.description ?? ""}</p>
      </div>
    </article>
  `;
}

/* ==========================
   NOTICIAS SECUNDARIAS
   ========================== */
function renderSecondary(data) {
  const noticias = data.noticias?.slice(1, 5) || []; // siguientes 4
  const container = document.querySelector("#secondary-news");

  container.innerHTML = noticias
    .map(
      n => `
      <article class="card">
        <div class="card-img-container">
          <img src="${n.thumbnail}" alt="">
        </div>
        <div>
          <h3>${n.title}</h3>
          <p class="card-meta">${formatDate(n.date)} — ${n.category}</p>
        </div>
      </article>
    `
    )
    .join("");
}

/* ==========================
   SPONSORS (Aliados)
   ========================== */
function renderSponsors(sponsors) {
  if (!sponsors.length) return;

  const grid = document.querySelector("#sponsorsGrid");
  grid.innerHTML = sponsors
    .map(
      s => `
      <div class="sponsor-item tier-Gold">
        <a href="${s.url}" target="_blank" rel="noopener">
          <img src="${s.logo}" alt="${s.title}">
        </a>
      </div>
    `
    )
    .join("");
}

/* ==========================
   UTILIDADES
   ========================== */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

/* LOADING & ERRORES */
function showLoading() {
  document.body.insertAdjacentHTML("beforeend", `<div id="loading">Cargando contenido...</div>`);
}
function hideLoading() {
  document.querySelector("#loading")?.remove();
}
function showError(err) {
  console.error("❌ ERROR:", err);
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="error-box">Error cargando contenido. <button onclick="location.reload()">Reintentar</button></div>`
  );
}
