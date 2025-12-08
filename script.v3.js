// script.v3.js — MOTOR PRO DEFINITIVO (Corregido)
console.log("🚀 Perspectivas PRO v3 cargado");

const CONTENT_URL = "/content.json";

async function initHome() {
  console.log("🔄 Iniciando carga de datos...");
  
  try {
    // 1. CACHE BUSTING: Agregamos timestamp para obligar a Vercel/Navegador a bajar la versión nueva
    const uniqueUrl = `${CONTENT_URL}?t=${new Date().getTime()}`;
    
    const res = await fetch(uniqueUrl);

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    console.log("📦 Datos frescos recibidos:", data); // Mirá la consola para confirmar fecha

    // 2. RENDERIZADO MODULAR
    renderHero(data.noticias);
    renderSecondary(data.noticias);
    renderNoticiasLocales(data.noticias);
    renderAnalisis(data.analisis);
    renderPrograma(data.programa);
    renderPodcast(data.podcast);
    renderSponsors(data.sponsors);

  } catch (e) {
    console.error("❌ Error crítico cargando contenido:", e);
    const hero = document.getElementById("hero");
    if(hero) hero.innerHTML = `<p style="text-align:center; padding: 2rem; color: red;">Hubo un error cargando las noticias. Por favor recarga la página.</p>`;
  }
}

// --- FUNCIONES DE RENDERIZADO ---

function renderHero(n) {
  const container = document.getElementById("hero");
  if (!container || !n?.length) return;

  const a = n[0]; // La noticia más nueva

  container.innerHTML = `
    <img src="${a.thumbnail}" class="hero-img" alt="${a.title}"/>
    <div class="hero-content">
      <div class="hero-section">${a.category || "Actualidad"}</div>
      <h2 class="hero-title">${a.title}</h2>
      <p class="hero-excerpt">${a.description ?? ""}</p>
    </div>
  `;
}

function renderSecondary(n) {
  const container = document.getElementById("secondary-news");
  if (!container || !n?.length) return;

  // Tomamos de la 2da a la 4ta noticia (índices 1, 2, 3)
  container.innerHTML = n.slice(1, 4)
    .map(a => `
      <div class="card">
        <img src="${a.thumbnail}" alt="${a.title}"/>
        <div>
          <h3>${a.title}</h3>
          <small>${formatDate(a.date)}</small>
        </div>
      </div>
    `)
    .join("");
}

function renderNoticiasLocales(n) {
  const container = document.getElementById("news-grid");
  if (!container || !n?.length) return;

  // Renderizamos las primeras 12. 
  // OJO: Esto duplica la Hero y las secundarias. 
  // Idealmente deberíamos hacer .slice(4, 16) para no repetir, pero lo dejo como pediste.
  container.innerHTML = n.slice(0, 12)
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
  const container = document.getElementById("analisis-grid");
  if (!container || !items?.length) return;

  container.innerHTML = items.map(a => `
      <div class="card">
        <img src="${a.thumbnail}" alt="${a.title}">
        <h3>${a.title}</h3>
        <div class="card-meta">${formatDate(a.date)}</div>
      </div>
    `).join("");
}

function renderPrograma(items) {
  const container = document.getElementById("program-grid");
  if (!container || !items?.length) return;

  container.innerHTML = items.map(p => `
      <div class="card">
        <div class="video-wrapper">
          <iframe src="${p.embed_url}" frameborder="0" allowfullscreen></iframe>
        </div>
        <h3>${p.title}</h3>
      </div>
    `).join("");
}

function renderPodcast(items) {
  const container = document.getElementById("podcast-grid");
  if (!container || !items?.length) return;

  container.innerHTML = items.map(p => `
      <div class="podcast-card">
        <img src="${p.thumbnail}" alt="${p.title}">
        <p class="podcast-title">${p.title}</p>
        <small>${formatDate(p.date)}</small>
      </div>
    `).join("");
}

function renderSponsors(items) {
  const container = document.getElementById("sponsorsGrid");
  if (!container || !items?.length) return;

  container.innerHTML = items.map(s => `
      <div class="sponsor-item">
        <a href="${s.url}" target="_blank" rel="noopener noreferrer">
            <img src="${s.logo}" alt="Sponsor">
        </a>
      </div>
    `).join("");
}

// Utilidad de fecha
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  // Ajuste simple para zona horaria si la fecha viene en UTC y querés evitar desfase de día
  return date.toLocaleDateString("es-PY", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHome);
} else {
    initHome();
}
