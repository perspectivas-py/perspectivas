// script.v3.js — MOTOR PRO DEFINITIVO (Corregido)
console.log("🚀 Perspectivas PRO v3 cargado");

const CONTENT_URL = "content.json";

const MARKET_QUOTES = [
  { label: "USD / Gs", value: "7.320", change: "+0,4%" },
  { label: "Peso Argentino", value: "Gs. 13,20", change: "-1,1%" },
  { label: "Real Brasileño", value: "Gs. 1.470", change: "+0,2%" },
  { label: "Euro", value: "Gs. 8.020", change: "+0,3%" },
  { label: "Petróleo WTI", value: "USD 72,45", change: "-0,8%" },
  { label: "Soja CME", value: "USD 13,05/bu", change: "+0,5%" },
  { label: "Carne (USDA)", value: "USD 4,85/kg", change: "+0,1%" }
];

const FX_SPREAD = 0.006; // 0.6% spread estimado
const FLAG_CDN_BASE = "https://flagcdn.com";
const FX_REFERENCE_FALLBACK = "exchangerate.host · Indicativo";

const FX_CONFIG = [
  {
    currency: "Dólar estadounidense",
    code: "USD",
    amount: "1 USD",
    units: 1,
    flagCode: "us",
    reference: "Banco Central del Paraguay",
    fallback: {
      buy: "₲ 7.300",
      sell: "₲ 7.360",
      variation: "+0,4%",
      lastUpdate: "08 Ene 2026 · 11:35"
    }
  },
  {
    currency: "Euro",
    code: "EUR",
    amount: "1 EUR",
    units: 1,
    flagCode: "eu",
    reference: "BCE / bancos corresponsales",
    fallback: {
      buy: "₲ 7.880",
      sell: "₲ 7.980",
      variation: "+0,3%",
      lastUpdate: "08 Ene 2026 · 11:20"
    }
  },
  {
    currency: "Real brasileño",
    code: "BRL",
    amount: "1 BRL",
    units: 1,
    flagCode: "br",
    reference: "Banco Central do Brasil",
    fallback: {
      buy: "₲ 1.430",
      sell: "₲ 1.470",
      variation: "-0,1%",
      lastUpdate: "08 Ene 2026 · 10:55"
    }
  },
  {
    currency: "Peso argentino",
    code: "ARS",
    amount: "1.000 ARS",
    units: 1000,
    flagCode: "ar",
    reference: "BCRA · dólar export",
    fallback: {
      buy: "₲ 9.600",
      sell: "₲ 9.950",
      variation: "+1,4%",
      lastUpdate: "08 Ene 2026 · 10:10"
    }
  },
  {
    currency: "Peso chileno",
    code: "CLP",
    amount: "1.000 CLP",
    units: 1000,
    flagCode: "cl",
    reference: "Banco Central de Chile",
    fallback: {
      buy: "₲ 10.020",
      sell: "₲ 10.250",
      variation: "+0,8%",
      lastUpdate: "08 Ene 2026 · 11:00"
    }
  },
  {
    currency: "Peso uruguayo",
    code: "UYU",
    amount: "1 UYU",
    units: 1,
    flagCode: "uy",
    reference: "BROU · pizarra",
    fallback: {
      buy: "₲ 178",
      sell: "₲ 185",
      variation: "+0,2%",
      lastUpdate: "08 Ene 2026 · 09:45"
    }
  },
  {
    currency: "Guaraní paraguayo",
    code: "PYG",
    amount: "1.000 PYG",
    units: 1000,
    flagCode: "py",
    reference: "Base local",
    fallback: {
      buy: "₲ 1.000",
      sell: "₲ 1.000",
      variation: "0,0%",
      lastUpdate: "08 Ene 2026 · 11:35"
    }
  }
];

const FX_RETAIL_SPEC = {
  currency: "Dólar minorista (casas de cambio)",
  code: "USD MIN",
  amount: "1 USD",
  units: 1,
  flagCode: "us",
  reference: "Casas de cambio minoristas · Asunción",
  margin: 0.018,
  fallback: {
    buy: "₲ 7.360",
    sell: "₲ 7.520",
    variation: "+0,6%",
    lastUpdate: "08 Ene 2026 · 11:35"
  }
};

const FX_FALLBACK_QUOTES = (() => {
  const base = FX_CONFIG.map(cfg => ({
    currency: cfg.currency,
    code: cfg.code,
    amount: cfg.amount,
    flagCode: cfg.flagCode,
    buy: cfg.fallback.buy,
    sell: cfg.fallback.sell,
    variation: cfg.fallback.variation,
    reference: cfg.reference,
    lastUpdate: cfg.fallback.lastUpdate,
    midValue: computeFallbackMid(cfg.fallback.buy, cfg.fallback.sell)
  }));

  const retailFallback = buildRetailFallbackQuote(base, FX_RETAIL_SPEC);
  if (retailFallback) base.push(retailFallback);
  return base;
})();

const flagIconUrl = (code = "") => {
  const normalized = (code || "").toLowerCase();
  return `${FLAG_CDN_BASE}/w40/${normalized || "un"}.png`;
};

const NOTICIAS_INITIAL_LIMIT = 15;
const NOTICIAS_INCREMENT = 15;
let noticiasLocalesState = {
  source: [],
  visible: NOTICIAS_INITIAL_LIMIT
};
let noticiasViewMoreBtn = null;
let categoryFilterContainers = [];
let currentCategory = "all";
let noticiasFilterSource = [];

const SECTION_LIMIT = 6;
const SECTION_INCREMENT = 6;

function createSectionController({ gridId, buttonId, limit = SECTION_LIMIT, increment = SECTION_INCREMENT, renderItem, emptyMessage }) {
  const state = { source: [], visible: limit };
  let button = null;

  function updateButton() {
    if (!button) return;
    const hasMore = state.source.length > state.visible;
    button.hidden = !hasMore;
  }

  function render() {
    const container = document.getElementById(gridId);
    if (!container) return;

    if (!state.source.length) {
      container.innerHTML = emptyMessage || `<p class="empty-copy">No hay contenido disponible.</p>`;
      updateButton();
      return;
    }

    const slice = state.source.slice(0, state.visible);
    const meta = { total: state.source.length };
    container.innerHTML = slice
      .map((item, idx) => renderItem(item, idx, meta))
      .join("");

    updateButton();
  }

  function setSource(items) {
    state.source = Array.isArray(items) ? items : [];
    state.visible = Math.min(limit, state.source.length);
    render();
  }

  function handleViewMore() {
    state.visible = Math.min(state.source.length, state.visible + increment);
    render();
  }

  function init(items) {
    button = document.getElementById(buttonId);
    if (button && !button.dataset.bound) {
      button.addEventListener("click", handleViewMore);
      button.dataset.bound = "true";
    }
    setSource(items);
  }

  return { init, setSource, render };
}

const analisisController = (() => {
  const state = { source: [], visible: 6 };
  let button = null;

  function render() {
    const featured = document.getElementById("analisis-featured");
    const grid = document.getElementById("analisis-grid");

    if (!featured || !grid) return;

    if (!state.source.length) {
      featured.innerHTML = "";
      grid.innerHTML = `<p class="empty-copy">No encontramos análisis disponibles.</p>`;
      if (button) button.hidden = true;
      return;
    }

    // Primera nota como miniportada
    const firstItem = state.source[0];
    featured.innerHTML = `
      <a href="/noticia.html?id=${encodeURIComponent(firstItem.slug || firstItem.id)}" class="featured-card">
        <div class="featured-card-img">
          <img src="${firstItem.thumbnail}" alt="${firstItem.title}"/>
        </div>
        <div class="featured-card-content">
          <h3>${firstItem.title}</h3>
          <small>${formatDate(firstItem.date)}</small>
        </div>
      </a>
    `;

    // Resto en grid (a partir del índice 1)
    const remaining = state.source.slice(1, state.visible);
    grid.innerHTML = remaining
      .map(item => `
        <a href="/noticia.html?id=${encodeURIComponent(item.slug || item.id)}" class="card">
          <img src="${item.thumbnail}" alt="${item.title}">
          <h3>${item.title}</h3>
          <div class="card-meta">${formatDate(item.date)}</div>
        </a>
      `)
      .join("");

    // Botón "Ver más" si hay más de lo visible
    if (button) {
      button.hidden = state.source.length <= state.visible;
    }
  }

  function setSource(items) {
    state.source = Array.isArray(items) ? items : [];
    state.visible = 6; // Mostrar la primera (featured) + 5 en grid = 6 total
    render();
  }

  function init() {
    button = document.getElementById("analisis-view-more");
    if (button && !button.dataset.bound) {
      button.addEventListener("click", () => {
        state.visible += 6;
        render();
      });
      button.dataset.bound = "true";
    }
  }

  return { init, setSource };
})();

const programaController = createSectionController({
  gridId: "program-grid",
  buttonId: "program-view-more",
  renderItem: (item) => {
    // Helper para obtener miniatura de YouTube si no hay thumbnail explícito
    let thumb = item.thumbnail;
    if ((!thumb || thumb.includes("default_news")) && item.embed_url && item.embed_url.includes("youtube")) {
         try {
             // asume formato embed/VIDEO_ID
             const parts = item.embed_url.split('/');
             const vid = parts.pop() || parts.pop(); 
             thumb = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
         } catch(e) {}
    }
    thumb = thumb || '/assets/img/default_news.jpg';

    return `
    <a href="/noticia.html?type=programa&id=${encodeURIComponent(item.slug || item.id)}" class="program-card">
      <div class="program-thumb-wrapper">
        <img src="${thumb}" alt="${item.title}" loading="lazy">
        <div class="play-overlay">
           <svg class="play-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </div>
      </div>
      <div class="program-card-content">
        <h3 class="program-card-title">${item.title}</h3>
        <p class="program-card-desc">${item.description || ''}</p>
        <span class="program-card-meta">Programa Perspectivas</span>
      </div>
    </a>
  `;
  },
  emptyMessage: `<p class="empty-copy">Aún no cargamos episodios del programa.</p>`
});

const podcastController = createSectionController({
  gridId: "podcast-grid",
  buttonId: "podcast-view-more",
  renderItem: (item, idx, meta) => {
    const total = meta && typeof meta.total === "number" ? meta.total : 0;
    const episodeNumber = total ? String(total - idx).padStart(2, "0") : String(idx + 1).padStart(2, "0");
    const dateLabel = formatDate(item.date);
    return `
      <article class="podcast-card">
        <div class="podcast-cover">
          <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
          <span class="podcast-badge">EP ${episodeNumber}</span>
          <button class="podcast-play" type="button" aria-label="Reproducir episodio ${episodeNumber}">
            <span>▶</span>
          </button>
        </div>
        <div class="podcast-body">
          <p class="podcast-meta">${dateLabel || "Nuevo"}</p>
          <h3>${item.title}</h3>
          <p class="podcast-tagline">Serie Perspectivas Podcast</p>
          <div class="podcast-actions">
            <a class="podcast-listen" href="/noticia.html?id=${encodeURIComponent(item.slug || item.id)}">Escuchar ahora</a>
            <button class="podcast-share" type="button" aria-label="Compartir episodio ${episodeNumber}">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.59 10.51 15.4 6.49" />
                <path d="M8.59 13.49 15.4 17.51" />
              </svg>
            </button>
          </div>
        </div>
      </article>
    `;
  },
  emptyMessage: `<p class="empty-copy">No hay episodios del podcast para mostrar.</p>`
});

// Toggle del buscador en el drawer
function initSearchToggle() {
  const searchToggleHeader = document.getElementById("search-toggle-header");
  const searchToggleDrawer = document.getElementById("search-toggle");
  const searchInput = document.getElementById("search-input");
  const drawer = document.getElementById("category-drawer");

  if (!searchInput) return;

  // Click en el icono de búsqueda del header
  if (searchToggleHeader && searchToggleHeader.dataset.bound !== "true") {
    searchToggleHeader.dataset.bound = "true";
    searchToggleHeader.addEventListener("click", (e) => {
      e.preventDefault();
      // Abrir drawer si está cerrado
      if (!drawer.classList.contains("open")) {
        drawer.classList.add("open");
        document.getElementById("category-drawer-toggle").setAttribute("aria-expanded", "true");
        drawer.setAttribute("aria-hidden", "false");
      }
      // Mostrar campo de búsqueda
      searchInput.classList.remove("hidden");
      setTimeout(() => searchInput.focus(), 100);
    });
  }

  // Click en el icono de búsqueda dentro del drawer
  if (searchToggleDrawer && searchToggleDrawer.dataset.bound !== "true") {
    searchToggleDrawer.dataset.bound = "true";
    searchToggleDrawer.addEventListener("click", (e) => {
      e.preventDefault();
      searchInput.classList.toggle("hidden");
      if (!searchInput.classList.contains("hidden")) {
        searchInput.focus();
      }
    });
  }

  // Filtrar noticias mientras se escribe
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    filterNewsBySearch(query);
  });

  // Cerrar buscador al presionar Escape
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.classList.add("hidden");
      searchInput.value = "";
      filterNewsBySearch("");
    }
  });
}

function filterNewsBySearch(query) {
  // Aquí puedes implementar la lógica de filtrado de noticias
  // Por ahora solo limpiamos o aplicamos el filtro
  console.log("Buscando:", query);
}

function initMenuToggle() {
  const menuToggle = document.getElementById("menu-toggle");
  const navList = document.getElementById("nav-list");
  if (!menuToggle || !navList) return;
  if (menuToggle.dataset.bound === "true") return;
  menuToggle.dataset.bound = "true";

  const closeMenu = () => {
    navList.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = !navList.classList.contains("active");
    navList.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  navList.querySelectorAll("a").forEach(link =>
    link.addEventListener("click", closeMenu)
  );

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

function initHeaderScrollState() {
  const header = document.querySelector(".site-header");
  const anchor = document.getElementById("noticias");
  if (!header) return;
  if (header.dataset.bound === "true") return;
  header.dataset.bound = "true";

  let collapsePoint = 140;
  let ticking = false;

  const computeCollapsePoint = () => {
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      const scrollTop = window.scrollY || window.pageYOffset;
      collapsePoint = rect.top + scrollTop - (header.offsetHeight || 0) - 16;
    } else {
      // En páginas de artículo preferimos mantener el encabezado estable
      collapsePoint = Number.POSITIVE_INFINITY;
    }
  };

  const update = () => {
    const scrollTop = window.scrollY || window.pageYOffset;
    const buffer = 10;

    if (!Number.isFinite(collapsePoint)) {
      header.classList.remove("scrolled");
      ticking = false;
      return;
    }

    // Hysteresis logic to prevent flickering
    if (scrollTop > collapsePoint + buffer) {
      header.classList.add("scrolled");
    } else if (scrollTop < collapsePoint - buffer) {
      header.classList.remove("scrolled");
    }
    ticking = false;
  };

  computeCollapsePoint();
  update();

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    computeCollapsePoint();
    update();
  });
}

async function initHome() {
  console.log("🔄 Iniciando carga de datos...");

  renderMarketTicker("ticker-track-top");
  renderMarketTicker("ticker-track-bottom");
  initSearchToggle();
  initMenuToggle();
  await loadFxQuotes();

  try {
    // 1. CACHE BUSTING: Agregamos timestamp para obligar a Vercel/Navegador a bajar la versión nueva
    const uniqueUrl = `${CONTENT_URL}?t=${new Date().getTime()}`;

    const res = await fetch(uniqueUrl);

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    console.log("📦 Datos frescos recibidos:", data); // Mirá la consola para confirmar fecha

    // 2. RENDERIZADO MODULAR
    const heroArticle = renderHero(data.noticias);

    // Filtrar la noticia que se usó como Hero para que no se repita en el resto de la página
    const remainingNoticias = data.noticias.filter(n => (n.slug || n.id) !== (heroArticle.slug || heroArticle.id));

    renderSecondary(remainingNoticias);
    initNoticiasLocales(remainingNoticias);
    renderCategoryFilters(remainingNoticias);
    renderTopReads(remainingNoticias);
    initAnalisisSection(data.analisis);
    initProgramaSection(data.programa);
    initPodcastSection(data.podcast);
    renderSponsors(data.sponsors);

  } catch (e) {
    console.error("❌ Error crítico cargando contenido:", e);
    const hero = document.getElementById("hero");
    if (hero) hero.innerHTML = `<p style="text-align:center; padding: 2rem; color: red;">Hubo un error cargando las noticias. Por favor recarga la página.</p>`;
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

async function renderHeroFromFile() {
  const container = document.getElementById("hero");
  if (!container) return;

  try {
    // Cargar el archivo markdown más reciente
    const filePath = "content/noticias/posts/2025-11-22-bcp-mantiene-anclada-la-tasa-de-interes.md?t=" + new Date().getTime();
    const res = await fetch(filePath);
    const markdown = await res.text();

    // Extraer frontmatter
    const match = markdown.match(/^---\n([\s\S]*?)\n---/);
    if (!match) throw new Error("No frontmatter found");

    const frontmatter = match[1];
    const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, "");

    // Parser simple de YAML frontmatter
    const title = frontmatter.match(/title:\s*(.+)/)?.[1]?.trim() || "Sin título";
    const summary = frontmatter.match(/summary:\s*(.+)/)?.[1]?.trim() || "Sin resumen";
    const slug = frontmatter.match(/slug:\s*(.+)/)?.[1]?.trim() || "default";
    let thumbnail = frontmatter.match(/thumbnail:\s*(.+)/)?.[1]?.trim() || "";

    // Si la ruta es relativa, convertirla a URL completa
    if (thumbnail.startsWith('/')) {
      thumbnail = window.location.origin + thumbnail;
    }

    // Fallback si no hay thumbnail válido
    if (!thumbnail || thumbnail.startsWith('/')) {
      thumbnail = "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&h=500&fit=crop&q=80";
    }

    const category = frontmatter.match(/category:\s*(.+)/)?.[1]?.trim() || "Actualidad";

    // Cambiar la clase del contenedor a hero
    container.className = 'hero';

    container.innerHTML = `
      <a href="/noticia.html?id=${encodeURIComponent(slug)}" class="hero-link-wrapper">
        <img src="${thumbnail}" class="hero-img" alt="${title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221200%22 height=%22500%22%3E%3Crect fill=%22%23667eea%22 width=%221200%22 height=%22500%22/%3E%3C/svg%3E'"/>
        <div class="hero-content">
          <div class="hero-section">${category.toUpperCase()}</div>
          <h2 class="hero-title">${title}</h2>
          <p class="hero-excerpt">${summary}</p>
        </div>
      </a>
    `;
  } catch (e) {
    console.error("Error cargando hero desde archivo:", e);
    // Fallback completo
    const container = document.getElementById("hero");
    if (container) {
      container.className = 'hero';
      container.innerHTML = `
        <a href="/noticia.html?id=2025-11-22-bcp-mantiene-anclada-la-tasa-de-interes" class="hero-link-wrapper">
          <img src="https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&h=500&fit=crop&q=80" class="hero-img" alt="Portada"/>
          <div class="hero-content">
            <div class="hero-section">MACROECONOMÍA</div>
            <h2 class="hero-title">BCP mantiene "anclada" la tasa de interés con una inflación a la baja</h2>
            <p class="hero-excerpt">El Comité de Política Monetaria decidió, por unanimidad, mantener la tasa de interés de política monetaria (TPM) en 6,0% anual.</p>
          </div>
        </a>
      `;
    }
  }
}

function renderHero(n) {
  const container = document.getElementById("hero");
  if (!container || !n?.length) return null;

  // 🎯 Buscar la noticia marcada como is_main_featured
  let heroArticle = n.find(noticia => {
    const featured = noticia.featured;
    return featured &&
      typeof featured === 'object' &&
      featured.is_main_featured === true;
  });

  // Si no hay ninguna marcada como principal, usa la más reciente
  if (!heroArticle) {
    heroArticle = n[0];
  }

  // Cambiar la clase del contenedor a hero
  container.className = 'hero';

  container.innerHTML = `
    <a href="/noticia.html?id=${encodeURIComponent(heroArticle.slug || heroArticle.id)}" class="hero-link-wrapper">
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

  return heroArticle;
}

function renderSecondary(n) {
  const container = document.getElementById("secondary-news");
  if (!container || !n?.length) return;

  // Tomamos los primeros 4 de la lista recibida (que ya debería venir sin la Hero)
  const cardsHtml = n.slice(0, 4)
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

  container.innerHTML = `
    ${cardsHtml}
  `;
}

function initNoticiasLocales(noticias) {
  noticiasViewMoreBtn = document.getElementById("news-view-more");
  if (noticiasViewMoreBtn && !noticiasViewMoreBtn.dataset.bound) {
    noticiasViewMoreBtn.addEventListener("click", handleNoticiasViewMore);
    noticiasViewMoreBtn.dataset.bound = "true";
  }
  setNoticiasLocalesSource(noticias);
}

function setNoticiasLocalesSource(list) {
  noticiasLocalesState.source = Array.isArray(list) ? list : [];
  noticiasLocalesState.visible = Math.min(
    NOTICIAS_INITIAL_LIMIT,
    noticiasLocalesState.source.length
  );
  renderNoticiasLocales();
  updateNoticiasViewMore();
}

function handleNoticiasViewMore() {
  noticiasLocalesState.visible = Math.min(
    noticiasLocalesState.source.length,
    noticiasLocalesState.visible + NOTICIAS_INCREMENT
  );
  renderNoticiasLocales();
  updateNoticiasViewMore();
}

function updateNoticiasViewMore() {
  if (!noticiasViewMoreBtn) return;
  const hasMore = noticiasLocalesState.source.length > noticiasLocalesState.visible;
  noticiasViewMoreBtn.hidden = !hasMore;
}

function renderNoticiasLocales() {
  const container = document.getElementById("news-grid");
  if (!container) return;

  const data = noticiasLocalesState.source || [];
  if (!data.length) {
    container.innerHTML = `<p class="empty-copy">No encontramos noticias en esta categoría.</p>`;
    updateNoticiasViewMore();
    return;
  }

  const slice = data.slice(0, noticiasLocalesState.visible);

  // Primera noticia como mini portada (si hay contenido)
  let html = '';
  if (slice.length > 0) {
    const featured = slice[0];
    html += `
      <a href="/noticia.html?id=${encodeURIComponent(featured.slug || featured.id)}" class="card card-featured">
        <div class="card-img-container">
          <img src="${featured.thumbnail}" alt="${featured.title}">
        </div>
        <div class="card-featured-content">
          <h3>${featured.title}</h3>
          <div class="card-meta">${formatDate(featured.date)}</div>
        </div>
      </a>
    `;
  }

  // Resto de noticias normales
  if (slice.length > 1) {
    html += '<div class="news-grid-secondary">';
    html += slice.slice(1)
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
    html += '</div>';
  }

  container.innerHTML = html;
}

function initAnalisisSection(items) {
  analisisController.init();
  analisisController.setSource(items);
}

function initProgramaSection(items) {
  programaController.init(items);
  initProgramCarousel();
}

function initProgramCarousel() {
  const carousel = document.getElementById("program-grid");
  const prevBtn = document.getElementById("program-prev");
  const nextBtn = document.getElementById("program-next");

  if (!carousel || !prevBtn || !nextBtn) return;

  const scrollAmount = 350; // Ancho de tarjeta + gap

  prevBtn.addEventListener("click", () => {
    carousel.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  });

  nextBtn.addEventListener("click", () => {
    carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });
  });
}

function initPodcastSection(items) {
  podcastController.init(items);
}

function renderSponsors(items) {
  const container = document.getElementById("sponsorsGrid");
  if (!container || !items?.length) return;
  
  // Filtrar solo los visibles (visible !== false para dar soporte a los que no tienen el campo)
  const visibleItems = items.filter(s => s.visible !== false);
  
  if (visibleItems.length === 0) {
      container.parentElement.style.display = 'none'; // Ocultar sección si no hay nada
      return;
  } else {
      container.parentElement.style.display = 'block';
  }

  container.innerHTML = visibleItems.map(s => `
      <div class="sponsor-item">
        <a href="${s.url}" target="_blank" rel="noopener noreferrer">
            <img src="${s.logo}" alt="Sponsor">
        </a>
      </div>
    `).join("");
}

// Renderizar filtros de categorías
function renderCategoryFilters(noticias) {
  noticiasFilterSource = Array.isArray(noticias) ? noticias : [];
  const containers = [
    document.getElementById("category-filters"),
    document.getElementById("category-drawer-filters")
  ].filter(Boolean);

  if (!containers.length || !noticiasFilterSource.length) return;

  // Mapeo de categorías: value -> label en español
  const categoryLabels = {
    "macro": "Macroeconomía",
    "mercados-inversion": "Mercados e Inversión",
    "politica-economica": "Política Económica",
    "empresas": "Empresas",
    "empleo": "Empleo",
    "finanzas-personales": "Finanzas Personales",
    "educacion-financiera": "Educación Financiera",
    "actualidad": "Actualidad",
    "economia": "Economía",
    "negocios": "Negocios"
  };

  // Obtener categorías disponibles y normalizarlas
  const availableCategories = [...new Set(noticiasFilterSource.map(n => n.category).filter(Boolean))];

  // Crear lista ordenada de categorías con sus etiquetas
  const categories = Object.entries(categoryLabels)
    .filter(([key]) => availableCategories.includes(key))
    .map(([key, label]) => ({ key, label }));

  const html = [
    '<button class="filter-btn" data-category="all">Todas</button>',
    ...categories.map(cat => `<button class="filter-btn" data-category="${cat.key}">${cat.label}</button>`)
  ].join("");

  categoryFilterContainers = containers;

  containers.forEach(container => {
    container.innerHTML = html;
    container.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const category = btn.dataset.category || "all";
        applyCategoryFilter(category);
        if (container.id === "category-drawer-filters") {
          closeCategoryDrawer();
        }
      });
    });
  });

  applyCategoryFilter(currentCategory);
}

function applyCategoryFilter(category) {
  currentCategory = category || "all";
  syncCategoryFilterState();
  const filtered = currentCategory === "all"
    ? noticiasFilterSource
    : noticiasFilterSource.filter(n => n.category === currentCategory);
  setNoticiasLocalesSource(filtered);
}

function syncCategoryFilterState() {
  categoryFilterContainers.forEach(container => {
    container.querySelectorAll(".filter-btn").forEach(btn => {
      const target = btn.dataset.category || "all";
      btn.classList.toggle("active", target === currentCategory);
    });
  });
}

function setCategoryDrawerState(open) {
  const drawer = document.getElementById("category-drawer");
  const toggle = document.getElementById("category-drawer-toggle");
  if (!drawer || !toggle) return;
  drawer.classList.toggle("open", !!open);
  toggle.setAttribute("aria-expanded", String(!!open));
  drawer.setAttribute("aria-hidden", String(!open));
}

function closeCategoryDrawer() {
  setCategoryDrawerState(false);
}

function initCategoryDrawer() {
  const toggle = document.getElementById("category-drawer-toggle");
  const drawer = document.getElementById("category-drawer");
  const closeBtn = document.getElementById("category-drawer-close");
  if (!toggle || !drawer) return;
  if (toggle.dataset.bound === "true") return;
  toggle.dataset.bound = "true";

  toggle.addEventListener("click", () => {
    const isOpen = drawer.classList.contains("open");
    setCategoryDrawerState(!isOpen);
  });

  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = "true";
    closeBtn.addEventListener("click", () => setCategoryDrawerState(false));
  }

  if (!drawer.dataset.bound) {
    drawer.dataset.bound = "true";
    document.addEventListener("click", (event) => {
      if (!drawer.classList.contains("open")) return;
      if (drawer.contains(event.target) || toggle.contains(event.target)) return;
      setCategoryDrawerState(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setCategoryDrawerState(false);
      }
    });
  }
}

// Renderizar top 5 de más leídas en grid
function renderTopReads(noticias) {
  const container = document.getElementById("top-reads-grid");
  if (!container || !noticias?.length) return;

  // Ordenar por views (descendente) y tomar top 5
  const withViews = noticias.filter(n => !Number.isNaN(Number(n.views)));
  const source = withViews.length ? withViews : [...noticias];

  const topReads = source
    .sort((a, b) => {
      if (withViews.length) {
        return Number(b.views) - Number(a.views);
      }
      return new Date(b.date || 0) - new Date(a.date || 0);
    })
    .slice(0, 5);

  container.innerHTML = topReads.map((n, idx) => {
    const thumb = n.thumbnail || "/assets/img/nasdaq.avif";
    const rank = idx + 1;
    const metaPieces = [
      formatDate(n.date),
      n.views ? `${Number(n.views).toLocaleString("es-PY")} lecturas` : null
    ].filter(Boolean);

    return `
      <a href="/noticia.html?id=${encodeURIComponent(n.slug || n.id)}" class="top-read-card">
        <div class="top-read-thumb">
          <img src="${thumb}" alt="${n.title}" loading="lazy" />
          <span class="top-read-rank">${rank}</span>
        </div>
        <div class="top-read-info">
          <p class="top-read-category">${n.category || "Noticias"}</p>
          <h3>${n.title}</h3>
          ${metaPieces.length ? `<p class="top-read-meta">${metaPieces.join(" · ")}</p>` : ""}
        </div>
      </a>
    `;
  }).join("");
}

async function loadFxQuotes() {
  try {
    const quotes = await fetchFxQuotes();
    renderQuotes(quotes);
  } catch (error) {
    console.warn("⚠️ No pudimos traer cotizaciones en vivo, usamos fallback.", error);
    renderQuotes(FX_FALLBACK_QUOTES);
  }
}

async function fetchFxQuotes() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const previousDate = yesterday.toISOString().split("T")[0];

  const requests = FX_CONFIG.map(async (cfg) => {
    if (cfg.code === "PYG") {
      return {
        currency: cfg.currency,
        code: cfg.code,
        amount: cfg.amount,
        flagCode: cfg.flagCode,
        buy: cfg.fallback.buy,
        sell: cfg.fallback.sell,
        variation: cfg.fallback.variation,
        reference: cfg.reference,
        lastUpdate: cfg.fallback.lastUpdate
      };
    }

    const units = cfg.units || 1;
    const latestUrl = `https://api.exchangerate.host/latest?base=${cfg.code}&symbols=PYG`;
    const prevUrl = `https://api.exchangerate.host/${previousDate}?base=${cfg.code}&symbols=PYG`;

    try {
      const [latestRes, prevRes] = await Promise.all([
        fetch(latestUrl),
        fetch(prevUrl)
      ]);

      if (!latestRes.ok) throw new Error(`HTTP ${latestRes.status}`);
      const latestData = await latestRes.json();
      const prevData = prevRes.ok ? await prevRes.json() : null;

      const latestRate = latestData?.rates?.PYG;
      if (!latestRate) throw new Error("Sin rate PYG");
      const prevRate = prevData?.rates?.PYG || null;

      const midValue = latestRate * units;
      const prevValue = prevRate ? prevRate * units : null;
      const spread = cfg.spread ?? FX_SPREAD;
      const halfSpread = spread / 2;
      const buyValue = midValue * (1 - halfSpread);
      const sellValue = midValue * (1 + halfSpread);
      const variationPct = prevValue ? ((midValue - prevValue) / prevValue) * 100 : 0;

      return {
        currency: cfg.currency,
        code: cfg.code,
        amount: cfg.amount,
        flagCode: cfg.flagCode,
        buy: formatGuarani(buyValue),
        sell: formatGuarani(sellValue),
        variation: formatVariation(variationPct),
        reference: cfg.reference || FX_REFERENCE_FALLBACK,
        lastUpdate: formatUpdateLabel(latestData?.date),
        midValue
      };
    } catch (error) {
      console.warn(`⚠️ Falló la cotización de ${cfg.code}`, error);
      return {
        currency: cfg.currency,
        code: cfg.code,
        amount: cfg.amount,
        flagCode: cfg.flagCode,
        buy: cfg.fallback.buy,
        sell: cfg.fallback.sell,
        variation: cfg.fallback.variation,
        reference: cfg.reference || FX_REFERENCE_FALLBACK,
        lastUpdate: cfg.fallback.lastUpdate,
        midValue: computeFallbackMid(cfg.fallback.buy, cfg.fallback.sell)
      };
    }
  });

  const quotes = await Promise.all(requests);
  const retailQuote = buildRetailQuoteFromUsd(quotes, FX_RETAIL_SPEC);
  if (retailQuote) quotes.push(retailQuote);
  return quotes;
}

function formatGuarani(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0
  }).format(value);
}

function formatVariation(value) {
  if (!Number.isFinite(value)) return "0,0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2).replace(".", ",")}%`;
}

function formatUpdateLabel(dateStr) {
  const now = new Date();
  const baseDate = dateStr ? new Date(`${dateStr}T12:00:00Z`) : now;
  const dateLabel = baseDate.toLocaleDateString("es-PY", { day: "2-digit", month: "short" });
  const timeLabel = now.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${dateLabel} · ${timeLabel}`;
}

function parseGuaraniValue(value) {
  if (typeof value !== "string") return Number(value) || NaN;
  const normalized = value
    .replace(/[^0-9,.-]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  return Number(normalized);
}

function computeFallbackMid(buy, sell) {
  const buyNum = parseGuaraniValue(buy);
  const sellNum = parseGuaraniValue(sell);
  if (Number.isFinite(buyNum) && Number.isFinite(sellNum)) {
    return (buyNum + sellNum) / 2;
  }
  if (Number.isFinite(buyNum)) return buyNum;
  if (Number.isFinite(sellNum)) return sellNum;
  return NaN;
}

function buildRetailQuoteFromUsd(quotes, spec) {
  if (!spec) return null;
  const usdQuote = quotes?.find(q => q.code === "USD");
  if (!usdQuote || !Number.isFinite(usdQuote.midValue)) {
    const fallbackMid = computeFallbackMid(spec.fallback?.buy, spec.fallback?.sell);
    return {
      currency: spec.currency,
      code: spec.code,
      amount: spec.amount,
      flagCode: spec.flagCode || "us",
      buy: spec.fallback?.buy || "—",
      sell: spec.fallback?.sell || "—",
      variation: spec.fallback?.variation || "0,0%",
      reference: spec.reference || FX_REFERENCE_FALLBACK,
      lastUpdate: spec.fallback?.lastUpdate || "",
      midValue: fallbackMid
    };
  }

  const margin = spec.margin ?? 0.018;
  const buyValue = usdQuote.midValue * (1 - margin);
  const sellValue = usdQuote.midValue * (1 + margin);

  return {
    currency: spec.currency,
    code: spec.code,
    amount: spec.amount,
    flagCode: spec.flagCode || usdQuote.flagCode || "us",
    buy: formatGuarani(buyValue),
    sell: formatGuarani(sellValue),
    variation: usdQuote.variation,
    reference: spec.reference || usdQuote.reference,
    lastUpdate: usdQuote.lastUpdate,
    midValue: usdQuote.midValue
  };
}

function buildRetailFallbackQuote(baseQuotes, spec) {
  if (!spec) return null;
  const usdFallback = baseQuotes?.find(q => q.code === "USD");
  const fallbackMid = computeFallbackMid(spec.fallback?.buy, spec.fallback?.sell);
  return {
    currency: spec.currency,
    code: spec.code,
    amount: spec.amount,
    flagCode: spec.flagCode || usdFallback?.flagCode || "us",
    buy: spec.fallback?.buy || usdFallback?.buy || "—",
    sell: spec.fallback?.sell || usdFallback?.sell || "—",
    variation: spec.fallback?.variation || usdFallback?.variation || "0,0%",
    reference: spec.reference || usdFallback?.reference || FX_REFERENCE_FALLBACK,
    lastUpdate: spec.fallback?.lastUpdate || usdFallback?.lastUpdate || "",
    midValue: Number.isFinite(fallbackMid) ? fallbackMid : usdFallback?.midValue
  };
}

function renderQuotes(quotes = FX_FALLBACK_QUOTES) {
  const container = document.getElementById("quotes-grid");
  if (!container) return;

  const source = Array.isArray(quotes) && quotes.length ? quotes : FX_FALLBACK_QUOTES;

  container.innerHTML = source.map(item => {
    const change = (item.variation || "").trim();
    const trend = change.startsWith("-") ? "down" : change.startsWith("+") ? "up" : "neutral";
    const flagSrc = flagIconUrl(item.flagCode);
    const referenceLabel = item.reference || FX_REFERENCE_FALLBACK;
    const updateLabel = item.lastUpdate ? ` · ${item.lastUpdate}` : "";

    return `
      <article class="quote-card">
        <div class="quote-flag-row">
          <img class="quote-flag" src="${flagSrc}" alt="Bandera ${item.currency}" loading="lazy" width="48" height="32">
          <div>
            <p class="quote-country">${item.currency}</p>
            <p class="quote-currency">${item.amount}</p>
          </div>
        </div>
        <div class="quote-book">
          <div class="quote-field">
            <p class="quote-label">Compra</p>
            <p class="quote-price">${item.buy}</p>
          </div>
          <div class="quote-field">
            <p class="quote-label">Venta</p>
            <p class="quote-price">${item.sell}</p>
          </div>
        </div>
        ${change ? `<p class="quote-variation">Tendencia <span class="quote-change ${trend}">${change}</span></p>` : ""}
        <p class="quote-meta">
          <span class="quote-code">${item.code}</span> · ${referenceLabel}${updateLabel}
        </p>
      </article>
    `;
  }).join("");
}

function renderMarketTicker(trackId) {
  const track = document.getElementById(trackId);
  if (!track || !MARKET_QUOTES.length) return;

  const itemsHtml = MARKET_QUOTES.map(item => {
    const change = item.change || "";
    const trimmed = change.trim();
    const trend = trimmed.startsWith("-") ? "down" : trimmed.startsWith("+") ? "up" : "";

    return `
      <span class="ticker-item">
        <span class="ticker-label-mini">${item.label}</span>
        <span class="ticker-value">${item.value}</span>
        ${change ? `<span class="ticker-change ${trend}">${change}</span>` : ""}
      </span>
    `;
  }).join("");

  track.innerHTML = itemsHtml + itemsHtml;
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
  initHeaderScrollState();
  initCategoryDrawer();
  const isHome = document.getElementById("hero") !== null;
  const isNoticia = document.getElementById("contenido-noticia") !== null;

  if (isHome) initHome();
  // if (isNoticia) renderNoticia(); // Deshabilitado para evitar conflicto con noticia-script.js
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRouter);
} else {
  initRouter();
}

