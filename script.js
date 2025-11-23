/* script.js – Perspectivas Engine v3 PRO (JSON + Sponsors) */

/* =========================================
   CONFIG
   ========================================= */
const CONFIG = {
  cacheTime: 15 * 60 * 1000, // 15 min
  // Orden de fuentes para content.json: primero tu sitio, luego GitHub raw
  contentSources: [
    "/api/content.json",
    "https://raw.githubusercontent.com/perspectivas-py/perspectivas/main/api/content.json"
  ]
};

/* =========================================
   CACHE LOCAL (localStorage)
   ========================================= */
const db = {
  save: (key, data) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ timestamp: Date.now(), payload: data })
      );
    } catch (e) {
      console.warn("Cache full / no disponible", e);
    }
  },
  get: (key) => {
    try {
      const record = localStorage.getItem(key);
      if (!record) return null;
      const { timestamp, payload } = JSON.parse(record);
      if (Date.now() - timestamp > CONFIG.cacheTime) return null;
      return payload;
    } catch (e) {
      return null;
    }
  }
};

/* =========================================
   HELPERS GENERALES
   ========================================= */
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
  const match = url.match(
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  );
  return match && match[2].length === 11 ? match[2] : null;
};

const shuffleArray = (arr) =>
  arr
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);

/* =========================================
   CARGA ÚNICA DE content.json
   ========================================= */
let CONTENT_CACHE = null;

async function fetchContentJson() {
  // 1) cache en memoria
  if (CONTENT_CACHE) return CONTENT_CACHE;

  // 2) cache en localStorage
  const cached = db.get("perspectivas_content_json");
  if (cached) {
    CONTENT_CACHE = cached;
    return cached;
  }

  // 3) intentamos desde las fuentes
  let lastError = null;
  for (const url of CONFIG.contentSources) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} al pedir ${url}`);
        continue;
      }
      const json = await res.json();
      CONTENT_CACHE = json;
      db.save("perspectivas_content_json", json);
      return json;
    } catch (err) {
      lastError = err;
    }
  }

  console.error("Error cargando /api/content.json:", lastError);
  throw lastError || new Error("No se pudo cargar content.json");
}

/* =========================================
   RENDER DE TARJETAS
   ========================================= */
const createCardHTML = (sectionKey, item, showVideo) => {
  const link = `post.html?section=${encodeURIComponent(
    sectionKey
  )}&slug=${encodeURIComponent(item.slug || "")}`;

  let media = "";
  const youtubeId = item.embed_url ? getYoutubeId(item.embed_url) : null;

  if (showVideo && youtubeId) {
    media = `
      <div class="video-wrapper">
        <iframe src="https://www.youtube.com/embed/${youtubeId}"
                frameborder="0" allowfullscreen></iframe>
      </div>`;
  } else {
    const imgUrl =
      item.thumbnail ||
      item.image ||
      "https://placehold.co/600x400/eee/999?text=Perspectivas";
    media = `
      <div class="card-img-container">
        <a href="${link}">
          <img src="${imgUrl}" loading="lazy" alt="${item.title || ""}">
        </a>
      </div>`;
  }

  return `
    <article class="card">
      ${media}
      <div class="card-content">
        <small class="card-meta">
          ${formatDate(item.date)} | ${item.category || sectionKey}
        </small>
        <h3><a href="${link}">${item.title || "Sin título"}</a></h3>
      </div>
    </article>`;
};

const createPodcastHTML = (item) => {
  const link = `post.html?section=podcast&slug=${encodeURIComponent(
    item.slug || ""
  )}`;
  const imgUrl =
    item.thumbnail ||
    item.image ||
    "https://placehold.co/150x150/333/fff?text=Audio";

  return `
    <article class="podcast-card">
      <a href="${link}" class="podcast-img-link">
        <img src="${imgUrl}" alt="${item.title || ""}" loading="lazy">
        <div class="play-overlay"><span class="play-icon">▶</span></div>
      </a>
      <div class="podcast-content">
        <small class="podcast-meta">
          ${formatDate(item.date)} | EPISODIO
        </small>
        <h3 class="podcast-title"><a href="${link}">${item.title || ""}</a></h3>
      </div>
    </article>`;
};

/* =========================================
   FILTROS DE CATEGORÍA EN NOTICIAS
   ========================================= */
function setupFilters(sectionKey, items, gridId) {
  const container = document.getElementById("category-filters");
  if (!container) return;
  const cats = ["Todas", ...new Set(items.map((i) => i.category).filter(Boolean))];

  container.innerHTML = cats
    .map(
      (c) =>
        `<button class="filter-btn ${
          c === "Todas" ? "active" : ""
        }" data-cat="${c}">${c}</button>`
    )
    .join("");

  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".filter-btn").forEach((b) =>
        b.classList.remove("active")
      );
      btn.classList.add("active");
      const cat = btn.dataset.cat;
      const filtered =
        cat === "Todas" ? items : items.filter((i) => i.category === cat);
      const grid = document.getElementById(gridId);
      if (!grid) return;
      grid.innerHTML = filtered
        .map((i) => createCardHTML(sectionKey, i))
        .join("");
    });
  });
}

/* =========================================
   PATROCINADORES – GRILLA
   ========================================= */
function resolveMediaUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : path;
}

function renderSponsorsGrid(entries) {
  const container = document.getElementById("sponsorsGrid");
  if (!container) return;

  container.innerHTML = "";

  if (!entries.length) {
    container.innerHTML = "<p>No hay patrocinadores activos por el momento.</p>";
    return;
  }

  const randomized = shuffleArray(entries);

  randomized.forEach((d) => {
    if (String(d.active) === "false") return;

    const tierClass = d.tier ? `tier-${d.tier}` : "";
    const logoUrl = resolveMediaUrl(d.logo);

    const wrapper = document.createElement(d.url ? "a" : "div");
    wrapper.className = `sponsor-item ${tierClass}`;

    if (d.url) {
      wrapper.href = d.url;
      wrapper.target = "_blank";
      wrapper.rel = "noopener noreferrer sponsored";
      wrapper.title = d.title || "";
    }

    const img = document.createElement("img");
    img.src = logoUrl || "https://placehold.co/200x60?text=Logo";
    img.alt = d.title || "Patrocinador";
    wrapper.appendChild(img);

    container.appendChild(wrapper);
  });
}

/* =========================================
   PATROCINADORES – BLOQUE DESTACADO PRO v3
   ========================================= */

// Selección inteligente según campaña / prioridad
function pickSponsoredSmart(entries) {
  const now = new Date();

  // Activos
  const active = entries.filter((e) => String(e.active) !== "false");
  if (!active.length) return null;

  // Campañas vigentes
  const campaignActive = active.filter((e) => {
    const start = e.campaign_start ? new Date(e.campaign_start) : null;
    const end = e.campaign_end ? new Date(e.campaign_end) : null;

    if (start && end) return now >= start && now <= end;
    if (start && !end) return now >= start;
    if (!start && end) return now <= end;
    return true; // sin fechas -> válido siempre
  });

  const pool = campaignActive.length ? campaignActive : active;

  // Orden por prioridad (1 es más importante)
  pool.sort((a, b) => {
    const pa = a.priority ? Number(a.priority) : 999;
    const pb = b.priority ? Number(b.priority) : 999;
    return pa - pb;
  });

  return pool[0] || null;
}

function renderSponsoredSite(entries) {
  const cardEl = document.getElementById("sponsoredSiteCard");
  if (!cardEl) return;

  const d = pickSponsoredSmart(entries);
  if (!d) {
    cardEl.classList.remove("skeleton-card");
    cardEl.innerHTML = "<p>No hay sitio patrocinado disponible.</p>";
    return;
  }

  const logoUrl = resolveMediaUrl(d.logo);

  cardEl.style.opacity = 0;

  setTimeout(() => {
    cardEl.classList.remove("skeleton-card");
    cardEl.innerHTML = `
      <div>
        <div class="sponsored-meta">
          Contenido patrocinado · Perspectivas
        </div>

        <h3>${d.headline || d.title || "Sitio patrocinado"}</h3>

        ${
          d.excerpt
            ? `<p>${d.excerpt}</p>`
            : d.title
            ? `<p class="sponsored-tagline">
                 Conocé a <strong>${d.title}</strong>, aliado de Perspectivas
                 en el desarrollo económico del Paraguay.
               </p>`
            : ""
        }

        ${d.sector ? `<div class="sponsored-sector">Sector: ${d.sector}</div>` : ""}

        ${
          d.url
            ? `<div class="sponsored-actions">
                 <a class="sponsored-cta"
                    href="${d.url}"
                    target="_blank"
                    rel="noopener noreferrer sponsored">
                   Visitar sitio patrocinado
                 </a>
               </div>`
            : ""
        }
      </div>

      <div>
        <img
          src="${logoUrl || "https://placehold.co/400x250?text=Patrocinador"}"
          alt="${d.title || "Patrocinador"}">
      </div>
    `;

    cardEl.style.opacity = 1;
  }, 250);
}

// Rotación automática cada X minutos
function startSponsoredScheduler(entries) {
  if (!entries || !entries.length) return;

  renderSponsoredSite(entries);

  setInterval(() => {
    const cardEl = document.getElementById("sponsoredSiteCard");
    if (!cardEl) return;

    cardEl.style.transition = "opacity 0.6s ease";
    cardEl.style.opacity = 0;

    setTimeout(() => {
      renderSponsoredSite(entries);
      setTimeout(() => {
        cardEl.style.opacity = 1;
      }, 50);
    }, 600);
  }, 3 * 60 * 1000); // 3 minutos
}

/* =========================================
   NEWSLETTER
   ========================================= */
function setupNewsletter() {
  const form = document.getElementById("newsletter-form");
  const msg = document.getElementById("newsletter-msg");
  if (!form || !msg) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("email");
    const plan = document.getElementById("plan").value;
    const btn = form.querySelector("button");

    if (!emailInput.value.includes("@")) {
      msg.textContent = "Email inválido";
      msg.className = "msg-feedback msg-error";
      return;
    }

    const originalText = btn.textContent;
    btn.textContent = "Enviando...";
    btn.disabled = true;

    try {
      // Simulación de envío
      await new Promise((r) => setTimeout(r, 800));
      msg.textContent = `¡Suscrito al plan ${plan}!`;
      msg.className = "msg-feedback msg-success";
      form.reset();
    } catch (e) {
      msg.textContent = "Error al enviar.";
      msg.className = "msg-feedback msg-error";
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

/* =========================================
   HOME
   ========================================= */
async function initHome() {
  let content;
  try {
    content = await fetchContentJson();
  } catch (e) {
    console.error("Error cargando contenido JSON:", e);
    const heroEl = document.querySelector(".featured-card-bbc");
    if (heroEl) heroEl.innerHTML = "<p>Error al cargar portada.</p>";
    return;
  }

  const noticias = content.noticias || [];
  const programa = content.programa || [];
  const analisis = content.analisis || [];
  const podcast = content.podcast || [];
  const sponsors = content.sponsors || [];

  // ---------- Hero + destacados ----------
  if (noticias.length > 0) {
    const hero = noticias[0];
    const heroEl = document.querySelector(".featured-card-bbc");

    if (heroEl) {
      const img =
        hero.thumbnail ||
        hero.image ||
        "https://placehold.co/800x400/eee/999?text=Perspectivas";
      heroEl.innerHTML = `
        <a href="post.html?section=noticias&slug=${encodeURIComponent(
          hero.slug || ""
        )}">
          <img src="${img}" alt="${hero.title || ""}">
          <h2>${hero.title || ""}</h2>
          <p>${hero.description || ""}</p>
        </a>`;
    }

    const sideEl = document.getElementById("top-list-bbc");
    if (sideEl) {
      sideEl.innerHTML = noticias
        .slice(1, 4)
        .map(
          (n) => `
        <li>
          <a href="post.html?section=noticias&slug=${encodeURIComponent(
            n.slug || ""
          )}">
            <h4>${n.title || ""}</h4>
            <small>${formatDate(n.date)}</small>
          </a>
        </li>`
        )
        .join("");
    }

    const newsGrid = document.getElementById("news-grid");
    if (newsGrid) {
      const rest = noticias.slice(4);
      newsGrid.innerHTML = rest
        .map((n) => createCardHTML("noticias", n))
        .join("");
      setupFilters("noticias", rest, "news-grid");
    }
  }

  // ---------- Programa ----------
  const progGrid = document.getElementById("program-grid");
  if (progGrid && programa.length) {
    progGrid.innerHTML = programa
      .slice(0, 6)
      .map((p) => createCardHTML("programa", p, true))
      .join("");
  }

  // ---------- Análisis ----------
  const anaGrid = document.getElementById("analisis-grid");
  if (anaGrid && analisis.length) {
    anaGrid.innerHTML = analisis
      .slice(0, 4)
      .map((a) => createCardHTML("analisis", a))
      .join("");
  }

  // ---------- Podcast ----------
  const podGrid = document.getElementById("podcast-grid");
  if (podGrid && podcast.length) {
    podGrid.innerHTML = podcast
      .slice(0, 4)
      .map((p) => createPodcastHTML(p))
      .join("");
  }

  // ---------- Newsletter ----------
  setupNewsletter();

  // ---------- Buscador en noticias ----------
  const searchInput = document.getElementById("search-input");
  if (searchInput && noticias.length) {
    const baseList = (content.noticias || []).slice(4);
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const grid = document.getElementById("news-grid");
      if (!grid) return;

      if (term.length < 2) {
        grid.innerHTML = baseList
          .map((n) => createCardHTML("noticias", n))
          .join("");
      } else {
        grid.innerHTML = baseList
          .filter(
            (n) =>
              (n.title || "").toLowerCase().includes(term) ||
              (n.description || "").toLowerCase().includes(term)
          )
          .map((n) => createCardHTML("noticias", n))
          .join("");
      }
    });
  }

  // ---------- Patrocinadores ----------
  if (sponsors.length) {
    renderSponsorsGrid(sponsors);
    startSponsoredScheduler(sponsors);
  }
}

/* =========================================
   POST DETAIL
   ========================================= */
async function initPost() {
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section") || "noticias";
  const slug = params.get("slug");
  const el = document.getElementById("article-detail");

  if (!el || !slug) return;

  let content;
  try {
    content = await fetchContentJson();
  } catch (e) {
    el.innerHTML = "<p>Error cargando contenido.</p>";
    return;
  }

  const list = content[section] || [];
  const item = list.find((i) => i.slug === slug);

  if (!item) {
    el.innerHTML = "<p>Contenido no encontrado.</p>";
    return;
  }

  document.title = item.title || "Perspectivas";

  if (typeof marked === "undefined") {
    await import("https://cdn.jsdelivr.net/npm/marked/marked.min.js");
  }

  const youtubeId = item.embed_url ? getYoutubeId(item.embed_url) : null;
  let video = "";
  if (youtubeId) {
    video = `
      <div class="video-wrapper" style="margin:2rem 0">
        <iframe src="https://www.youtube.com/embed/${youtubeId}"
                frameborder="0" allowfullscreen></iframe>
      </div>`;
  }

  const thumbnail = item.thumbnail || item.image;
  let featuredImgHTML = "";

  let htmlContent = item.body
    ? marked.parse(item.body)
    : "<p>(Sin contenido)</p>";

  if (!video && thumbnail) {
    featuredImgHTML = `<img src="${thumbnail}" class="featured-image">`;

    // Eliminamos posible primera imagen duplicada
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const firstImg = tempDiv.querySelector("img");
    if (
      firstImg &&
      (firstImg.getAttribute("src") === thumbnail ||
        firstImg.src === thumbnail)
    ) {
      firstImg.remove();
      htmlContent = tempDiv.innerHTML;
    }
  }

  el.innerHTML = `
    <header class="article-header">
      <span class="article-category">${item.category || "Noticia"}</span>
      <h1 class="article-title">${item.title || ""}</h1>
      <time class="article-meta">${formatDate(item.date)}</time>
    </header>

    ${video}
    ${featuredImgHTML}

    <div class="article-content">${htmlContent}</div>
  `;
}

/* =========================================
   DOM READY
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("post.html")) {
    initPost();
  } else {
    initHome();
  }

  document.getElementById("menu-toggle")?.addEventListener("click", () => {
    document.getElementById("nav-list").classList.toggle("active");
  });
});
