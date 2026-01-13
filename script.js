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
// --- GENERADOR UNIVERSAL DE TARJETAS ---
// Esta función se usa cuando se renderizan listas dinámicas
function cardHTML(item) {
  return `
    <div class="card">
      <div class="card-img-container">
        <img src="${item.thumbnail}" alt="${item.title}">
      </div>
      <h3>${item.title}</h3>
      <div class="card-meta">${formatDate(item.date)}</div>
    </div>
  `;
}

// --- FUNCIONES DE RENDERIZADO ---

function renderHero(n) {
  const container = document.getElementById("hero");
  if (!container || !n?.length) return;

  const a = n[0]; // La noticia más nueva

  container.innerHTML = `
    <a href="/noticia.html?id=${encodeURIComponent(a.slug || a.id)}" class="hero-link">
      <img src="${a.thumbnail}" class="hero-img" alt="${a.title}"/>
      <div class="hero-content">
        <div class="hero-section">${a.category || "Actualidad"}</div>
        <h2 class="hero-title">${a.title}</h2>
        <p class="hero-excerpt">${a.description ?? ""}</p>
      </div>
    </a>
  `;
}

function renderSecondary(n) {
  const container = document.getElementById("secondary-news");
  if (!container || !n?.length) return;

  // Tomamos de la 2da a la 5ta noticia (índices 1, 2, 3, 4) - 4 destacadas en grid perfecto
  container.innerHTML = n.slice(1, 5)
    .map(a => `
      <a href="/noticia.html?id=${encodeURIComponent(a.slug || a.id)}" class="secondary-card">
        <div class="secondary-card-img">
          <img src="${a.thumbnail}" alt="${a.title}"/>
        </div>
        <h3>${a.title}</h3>
        <small>${formatDate(a.date)}</small>
      </a>
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
      <a href="/noticia.html?id=${encodeURIComponent(a.slug || a.id)}" class="card">
        <div class="card-img-container">
          <img src="${a.thumbnail}" alt="${a.title}">
        </div>
        <h3>${a.title}</h3>
        <div class="card-meta">${formatDate(a.date)}</div>
      </a>
    `)
    .join("");
}

function renderAnalisis(items) {
  const container = document.getElementById("analisis-grid");
  if (!container || !items?.length) return;

  container.innerHTML = items.map(a => `
      <a href="/noticia.html?id=${encodeURIComponent(a.slug || a.id)}" class="card">
        <img src="${a.thumbnail}" alt="${a.title}">
        <h3>${a.title}</h3>
        <div class="card-meta">${formatDate(a.date)}</div>
      </a>
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
// --- RENDER DE NOTICIA INDIVIDUAL ---
async function renderNoticia() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return; // no estamos en página de noticia

  const container = document.getElementById("contenido-noticia");
  if (!container) return;

  try {
    const res = await fetch(`${CONTENT_URL}?t=${new Date().getTime()}`);
    const data = await res.json();
    const item = data.noticias.find(n => n.slug === id || n.id === id);

    if (!item) {
      container.innerHTML = `<p style="padding:40px;text-align:center;color:red;">
        ❌ Noticia no encontrada
      </p>`;
      return;
    }

    container.innerHTML = `
      <h1 class="article-title">${item.title}</h1>
      <div class="article-meta">
        <span>${item.category || ""}</span> — 
        <span>${formatDate(item.date)}</span>
      </div>

      <img class="article-img" src="${item.thumbnail}" alt="${item.title}"/>

      <div class="article-body">
        ${marked.parse(item.body || "")}
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<p style="padding:40px;text-align:center;color:red;">
      ⚠️ Error cargando la noticia. Intentá más tarde.
    </p>`;
    console.error("Error renderNoticia()", e);
  }
}

// Ejecutar cuando el DOM esté listo
function initRouter() {
  const isHome = document.getElementById("hero") !== null;
  const isNoticia = document.getElementById("contenido-noticia") !== null;

  if (isHome) initHome();
  if (isNoticia) renderNoticia();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRouter);
} else {
  initRouter();
}

// --- WIDGET DE CLIMA ---
async function initWeatherWidget() {
  const weatherWidget = document.getElementById('weather-widget');
  const weatherTemp = document.getElementById('weather-temp');
  
  if (!weatherWidget || !weatherTemp) return;
  
  try {
    // Usar Open-Meteo API (sin apikey necesaria)
    const response = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-25.2637&longitude=-57.5759&current=temperature_2m&timezone=America/Asuncion'
    );
    
    if (!response.ok) throw new Error('Error obteniendo clima');
    
    const data = await response.json();
    const temp = Math.round(data.current.temperature_2m);
    
    weatherTemp.textContent = `${temp}°C`;
    weatherWidget.title = `Clima en Asunción: ${temp}°C`;
  } catch (error) {
    console.warn('No se pudo obtener el clima:', error);
    weatherTemp.textContent = '--°C';
  }
}

// Inicializar widget de clima cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWeatherWidget);
} else {
  initWeatherWidget();
}

// Actualizar clima cada 10 minutos
setInterval(initWeatherWidget, 10 * 60 * 1000);


