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

  // 🎯 NUEVA LÓGICA: Busca la noticia marcada como is_main_featured en Decap CMS
  let heroArticle = n.find(noticia => {
    // Maneja tanto objetos como booleanos (compatibilidad con datos antiguos)
    const featured = noticia.featured;
    return featured && 
           typeof featured === 'object' && 
           featured.is_main_featured === true;
  });
  
  // Si no hay ninguna marcada como principal, usa la más reciente
  if (!heroArticle) {
    heroArticle = n[0];
  }

  container.innerHTML = `
    <a href="/noticia.html?id=${encodeURIComponent(heroArticle.slug || heroArticle.id)}" class="hero-link">
      <img src="${heroArticle.thumbnail}" class="hero-img" alt="${heroArticle.title}"/>
      <div class="hero-content">
        <div class="hero-section">${heroArticle.category || "Actualidad"}</div>
        <h2 class="hero-title">${heroArticle.title}</h2>
        <p class="hero-excerpt">${heroArticle.description ?? ""}</p>
      </div>
    </a>
  `;
  
  console.log("📰 Hero actualizado con:", heroArticle.title, "(is_main_featured:", 
    (typeof heroArticle.featured === 'object' && heroArticle.featured?.is_main_featured) || false, ")");
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

function selectSectionHeroArticles(items = []) {
  const pool = Array.isArray(items) ? [...items] : [];
  if (!pool.length) return { main: null, secondary: [] };

  const hero = pool.find(article => article?.featured?.is_section_featured) || pool[0];
  const filtered = pool.filter(article => (article.slug || article.id) !== (hero?.slug || hero?.id));
  const secondary = filtered.slice(0, 2);
  return { main: hero, secondary };
}

function renderNoticiasLocales(items) {
  if (!Array.isArray(items) || !items.length) return;

  const heroMain = document.getElementById("nlv2-hero-main");
  const heroSecondary = document.getElementById("nlv2-hero-secondary");
  const gridContainer = document.getElementById("news-grid");
  const contextFeed = document.getElementById("nlv2-context-feed");

  const { main, secondary } = selectSectionHeroArticles(items);

  if (heroMain && main) {
    heroMain.style.backgroundImage = `url(${main.thumbnail})`;
    heroMain.innerHTML = `
      <div class="nlv2-hero-kicker">${(main.kicker || main.category || "Actualidad").toUpperCase()}</div>
      <h3>${main.title}</h3>
      <p>${main.summary_short || main.description || ""}</p>
      <div class="nlv2-meta-row">
        <span>${formatDate(main.date)}</span>
        <a class="btn-link" href="/noticia.html?id=${encodeURIComponent(main.slug || main.id)}">Leer más →</a>
      </div>`;
  }

  if (heroSecondary && secondary.length) {
    heroSecondary.innerHTML = secondary.map(article => `
      <article class="nlv2-secondary-card">
        <div class="nlv2-meta-row">
          <span>${(article.kicker || article.category || "Actualidad").toUpperCase()}</span>
          <span>·</span>
          <span>${formatDate(article.date)}</span>
        </div>
        <h4>${article.title}</h4>
        <p>${article.summary_short || article.description || ""}</p>
        <a class="btn-link" href="/noticia.html?id=${encodeURIComponent(article.slug || article.id)}">Ver nota</a>
      </article>`).join("");
  }

  if (gridContainer) {
    const idsOmitidos = [main, ...secondary].filter(Boolean).map(article => article.slug || article.id);
    const gridItems = items.filter(article => !idsOmitidos.includes(article.slug || article.id)).slice(0, 12);
    gridContainer.innerHTML = gridItems.map(cardHTML).join("");
  }

  if (contextFeed) {
    const contextItems = items.slice(0, 4);
    contextFeed.innerHTML = contextItems.map(article => `
      <div class="nlv2-context-item">
        <h4>${article.title}</h4>
        <p>${article.summary_short || article.summary || article.description || ""}</p>
        <a class="btn-link" href="/noticia.html?id=${encodeURIComponent(article.slug || article.id)}">Seguir historia</a>
      </div>`).join("");
  }
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


