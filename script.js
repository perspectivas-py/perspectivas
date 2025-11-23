/* script.js – Perspectivas Engine v4.0 (JSON /api/content.json) */

/*-------------------------------------------------------
  CONFIG
--------------------------------------------------------*/
const CONFIG = {
  limitNews: 10,
  cacheTime: 10 * 60 * 1000 // 10 minutos de caché en localStorage
};

// URL del JSON generado por Decap
const CONTENT_JSON_URL = "/api/content.json";

/*-------------------------------------------------------
  CACHÉ LOCAL
--------------------------------------------------------*/
const db = {
  save: (key, data) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ timestamp: Date.now(), payload: data })
      );
    } catch (e) {
      console.warn("Cache full / deshabilitado", e);
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

let CONTENT_DATA = null;
const CONTENT_CACHE_KEY = "perspectivas_content_json_v1";

/*-------------------------------------------------------
  HELPERS GENERALES
--------------------------------------------------------*/
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

const extractFirstImage = (markdown) => {
  if (!markdown) return null;
  const mdMatch = markdown.match(/!\[.*?\]\((.*?)\)/);
  if (mdMatch) return mdMatch[1];
  const htmlMatch = markdown.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlMatch) return htmlMatch[1];
  return null;
};

const safeArray = (val) => (Array.isArray(val) ? val : []);

/*-------------------------------------------------------
  CARGA Y NORMALIZACIÓN DE /api/content.json
--------------------------------------------------------*/
function normalizeContent(raw) {
  const sections = ["noticias", "programa", "analisis", "podcast", "sponsors"];
  const data = {};

  sections.forEach((key) => {
    const arr = safeArray(raw[key]).map((item) => {
      const clone = { ...item };
      clone.collection = key;

      // slug de seguridad si falta
      if (!clone.slug) {
        if (clone.title) {
          clone.slug = clone.title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        } else {
          clone.slug = `${key}-${Math.random().toString(36).slice(2, 8)}`;
        }
      }

      // imagen de respaldo
      if (!clone.thumbnail && !clone.image && clone.body) {
        clone.thumbnail = extractFirstImage(clone.body);
      }

      return clone;
    });

    // ordenar por fecha descendente si existe
    arr.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    data[key] = arr;
  });

  return data;
}

async function loadContent() {
  if (CONTENT_DATA) return CONTENT_DATA;

  const cached = db.get(CONTENT_CACHE_KEY);
  if (cached) {
    CONTENT_DATA = cached;
    return cached;
  }

  try {
    const res = await fetch(CONTENT_JSON_URL);
    if (!res.ok) throw new Error("No se pudo cargar content.json");
    const raw = await res.json();
    const normalized = normalizeContent(raw);
    CONTENT_DATA = normalized;
    db.save(CONTENT_CACHE_KEY, normalized);
    return normalized;
  } catch (e) {
    console.error("Error cargando /api/content.json:", e);
    // último recurso: intentar caché viejo crudo
    const stale = db.get(CONTENT_CACHE_KEY);
    if (stale) {
      CONTENT_DATA = stale;
      return stale;
    }
    return {
      noticias: [],
      programa: [],
      analisis: [],
      podcast: [],
      sponsors: []
    };
  }
}

/*-------------------------------------------------------
  RENDER DE CARDS
--------------------------------------------------------*/
const createCardHTML = (item, showVideo) => {
  const section = item.collection || "noticias";
  const slug = encodeURIComponent(item.slug || "");
  const link = `post.html?type=${encodeURIComponent(section)}&slug=${slug}`;
  let media = "";

  if (showVideo && item.embed_url && getYoutubeId(item.embed_url)) {
    media = `
      <div class="video-wrapper">
        <iframe src="https://www.youtube.com/embed/${getYoutubeId(
          item.embed_url
        )}" frameborder="0" allowfullscreen></iframe>
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
        <small class="card-meta">${formatDate(item.date)} | ${
    item.category || "General"
  }</small>
        <h3><a href="${link}">${item.title || ""}</a></h3>
      </div>
    </article>`;
};

const createPodcastHTML = (item) => {
  const section = item.collection || "podcast";
  const slug = encodeURIComponent(item.slug || "");
  const link = `post.html?type=${encodeURIComponent(section)}&slug=${slug}`;
  const imgUrl =
    item.thumbnail || "https://placehold.co/150x150/333/fff?text=Audio";

  return `
    <article class="podcast-card">
      <a href="${link}" class="podcast-img-link">
        <img src="${imgUrl}" alt="${item.title || ""}" loading="lazy">
        <div class="play-overlay"><span class="play-icon">▶</span></div>
      </a>
      <div class="podcast-content">
        <small class="podcast-meta">${formatDate(item.date)} | EPISODIO</small>
        <h3 class="podcast-title"><a href="${link}">${item.title || ""}</a></h3>
      </div>
    </article>`;
};

/*-------------------------------------------------------
  FILTROS DE CATEGORÍA (Noticias)
--------------------------------------------------------*/
function setupFilters(items, gridId) {
  const container = document.getElementById("category-filters");
  if (!container) return;

  const cats = ["Todas", ...new Set(items.map((i) => i.category || "General"))];
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
      container
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.cat;
      const filtered =
        cat === "Todas"
          ? items.slice(0, CONFIG.limitNews)
          : items.filter((i) => (i.category || "General") === cat);
      const grid = document.getElementById(gridId);
      if (!grid) return;
      grid.innerHTML = filtered.map((i) => createCardHTML(i)).join("");
    });
  });
}

/*-------------------------------------------------------
  PATROCINADORES – GRID
--------------------------------------------------------*/
function renderSponsorsGrid(entries) {
  const container = document.getElementById("sponsorsGrid");
  if (!container) return;

  container.innerHTML = "";

  if (!entries.length) {
    container.innerHTML = "<p>No hay patrocinadores activos.</p>";
    return;
  }

  entries.forEach((d) => {
    if (String(d.active) === "false") return;

    const tierClass = d.tier ? `tier-${d.tier}` : "";
    const logoUrl =
      d.logo || d.thumbnail || "https://placehold.co/200x60?text=Logo";

    const wrapper = document.createElement(d.url ? "a" : "div");
    wrapper.className = `sponsor-item ${tierClass}`;

    if (d.url) {
      wrapper.href = d.url;
      wrapper.target = "_blank";
      wrapper.rel = "noopener noreferrer sponsored";
      wrapper.title = d.title || "";
    }

    const img = document.createElement("img");
    img.src = logoUrl;
    img.alt = d.title || "Patrocinador";

    wrapper.appendChild(img);
    container.appendChild(wrapper);
  });
}

/*-------------------------------------------------------
  PATROCINADORES – SELECCIÓN PRO v3
--------------------------------------------------------*/
function pickSponsoredSmart(entries) {
  const now = new Date();

  let active = entries.filter((e) => String(e.active) !== "false");

  // filtrar por ventana de campaña
  const withCampaign = active.filter((e) => {
    const start = e.campaign_start ? new Date(e.campaign_start) : null;
    const end = e.campaign_end ? new Date(e.campaign_end) : null;

    if (start && end) return now >= start && now <= end;
    if (start && !end) return now >= start;
    if (!start && end) return now <= end;
    return true; // sin fechas => siempre válido
  });

  const pool = withCampaign.length ? withCampaign : active;
  if (!pool.length) return null;

  pool.sort((a, b) => {
    const pa = a.priority ? Number(a.priority) : 999;
    const pb = b.priority ? Number(b.priority) : 999;
    return pa - pb;
  });

  // aleatorizar dentro del mismo nivel de prioridad más alto
  const bestPriority = pool[0].priority ? Number(pool[0].priority) : 999;
  const same = pool.filter(
    (p) => (p.priority ? Number(p.priority) : 999) === bestPriority
  );
  return same[Math.floor(Math.random() * same.length)];
}

function renderSponsoredSite(entries) {
  const cardEl = document.getElementById("sponsoredSiteCard");
  if (!cardEl) return;

  const d = pickSponsoredSmart(entries);
  if (!d) {
    cardEl.innerHTML = "<p>No hay sitio patrocinado disponible.</p>";
    cardEl.classList.remove("skeleton-card");
    return;
  }

  const logoUrl =
    d.logo || d.thumbnail || "https://placehold.co/400x250?text=Patrocinador";

  // fade-out
  cardEl.style.transition = "opacity 0.6s ease";
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
                 Conocé a <strong>${d.title}</strong>, aliado de Perspectivas en el desarrollo económico del Paraguay.
               </p>`
            : ""
        }

        ${
          d.sector
            ? `<div class="sponsored-sector">Sector: ${d.sector}</div>`
            : ""
        }

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
          src="${logoUrl}"
          alt="${d.title || "Patrocinador"}">
      </div>
    `;

    // fade-in
    requestAnimationFrame(() => {
      cardEl.style.opacity = 1;
    });
  }, 250);
}

function startSponsoredScheduler(entries) {
  if (!entries || !entries.length) return;

  // primera carga
  renderSponsoredSite(entries);

  // rotación automática cada 3 minutos
  setInterval(() => {
    renderSponsoredSite(entries);
  }, 3 * 60 * 1000);
}

/*-------------------------------------------------------
  CARGA DE PATROCINADORES (Home)
--------------------------------------------------------*/
function loadSponsorsHome(sponsors) {
  try {
    if (sponsors && sponsors.length) {
      renderSponsorsGrid(sponsors);
      startSponsoredScheduler(sponsors);
    }
  } catch (err) {
    console.error("Error cargando sponsors:", err);
    const grid = document.getElementById("sponsorsGrid");
    const block = document.getElementById("sponsoredSiteCard");

    if (grid) grid.innerHTML = "<p>Error al cargar los patrocinadores.</p>";
    if (block) {
      block.innerHTML = "<p>Error cargando sitio patrocinado.</p>";
      block.classList.remove("skeleton-card");
    }
  }
}

/*-------------------------------------------------------
  NEWSLETTER
--------------------------------------------------------*/
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
      // aquí podrías mandar a un backend real
      await new Promise((r) => setTimeout(r, 1000));
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

/*-------------------------------------------------------
  HOME INIT
--------------------------------------------------------*/
async function initHome() {
  const data = await loadContent();

  const news = data.noticias || [];
  const prog = data.programa || [];
  const analysis = data.analisis || [];
  const podcasts = data.podcast || [];

  if (!news.length && !prog.length) return;

  // ---------- Hero & Noticias ----------
  if (news.length > 0) {
    const hero = news[0];
    const heroEl = document.querySelector(".featured-card-bbc");

    if (heroEl) {
      const heroImg =
        hero.thumbnail ||
        hero.image ||
        "https://placehold.co/800x400/eee/999?text=Perspectivas";
      const section = hero.collection || "noticias";
      const link = `post.html?type=${encodeURIComponent(
        section
      )}&slug=${encodeURIComponent(hero.slug)}`;

      heroEl.innerHTML = `
        <a href="${link}">
          <img src="${heroImg}" alt="${hero.title || ""}">
          <h2>${hero.title || ""}</h2>
          <p>${hero.description || ""}</p>
        </a>`;
    }

    const sideEl = document.getElementById("top-list-bbc");
    if (sideEl) {
      sideEl.innerHTML = news
        .slice(1, 4)
        .map((n) => {
          const section = n.collection || "noticias";
          const link = `post.html?type=${encodeURIComponent(
            section
          )}&slug=${encodeURIComponent(n.slug)}`;
          return `
          <li>
            <a href="${link}">
              <h4>${n.title || ""}</h4>
              <small>${formatDate(n.date)}</small>
            </a>
          </li>`;
        })
        .join("");
    }

    const newsGrid = document.getElementById("news-grid");
    if (newsGrid) {
      const slice = news.slice(4, 4 + CONFIG.limitNews);
      newsGrid.innerHTML = slice.map((n) => createCardHTML(n)).join("");
      setupFilters(news.slice(4), "news-grid");
    }
  }

  // ---------- Otros Grids ----------
  const progGrid = document.getElementById("program-grid");
  if (progGrid)
    progGrid.innerHTML = prog
      .slice(0, 6)
      .map((p) => createCardHTML(p, true))
      .join("");

  const anaGrid = document.getElementById("analisis-grid");
  if (anaGrid)
    anaGrid.innerHTML = analysis
      .slice(0, 4)
      .map((a) => createCardHTML(a))
      .join("");

  const podGrid = document.getElementById("podcast-grid");
  if (podGrid)
    podGrid.innerHTML = podcasts
      .slice(0, 4)
      .map((p) => createPodcastHTML(p))
      .join("");

  // Newsletter
  setupNewsletter();

  // Buscador
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const grid = document.getElementById("news-grid");
      if (!grid) return;

      if (term.length < 2) {
        grid.innerHTML = news
          .slice(4, 4 + CONFIG.limitNews)
          .map((n) => createCardHTML(n))
          .join("");
      } else {
        grid.innerHTML = news
          .filter((n) =>
            (n.title || "").toLowerCase().includes(term.toLowerCase())
          )
          .map((n) => createCardHTML(n))
          .join("");
      }
    });
  }

  // Patrocinadores
  loadSponsorsHome(data.sponsors || []);
}

/*-------------------------------------------------------
  POST PAGE
--------------------------------------------------------*/
async function initPost() {
  const params = new URLSearchParams(window.location.search);
  let type = params.get("type") || params.get("collection");
  let slug = params.get("slug") || params.get("id");

  // compatibilidad con URLs antiguas (?folder=content/noticias/posts)
  if (!type) {
    const folder = params.get("folder") || "";
    if (folder.includes("noticias")) type = "noticias";
    else if (folder.includes("programa")) type = "programa";
    else if (folder.includes("analisis")) type = "analisis";
    else if (folder.includes("podcast")) type = "podcast";
  }

  if (!type) type = "noticias";

  const data = await loadContent();
  const list = data[type] || [];
  const post =
    list.find((i) => i.slug === slug) ||
    list.find((i) => String(i.id) === String(slug)) ||
    list[0];

  const el = document.getElementById("article-detail");
  if (!el) return;

  if (!post) {
    el.innerHTML = "<p>Error cargando contenido.</p>";
    return;
  }

  document.title = post.title || "Perspectivas";

  if (typeof marked === "undefined") {
    try {
      await import("https://cdn.jsdelivr.net/npm/marked/marked.min.js");
    } catch (e) {
      console.error("No se pudo cargar marked:", e);
    }
  }

  let video = "";
  if (post.embed_url) {
    const vid = getYoutubeId(post.embed_url);
    if (vid) {
      video = `
        <div class="video-wrapper" style="margin:2rem 0">
          <iframe src="https://www.youtube.com/embed/${vid}"
                  frameborder="0" allowfullscreen></iframe>
        </div>`;
    }
  }

  let htmlContent = post.body
    ? typeof marked !== "undefined"
      ? marked.parse(post.body)
      : post.body
    : "";

  const thumbnail = post.thumbnail || post.image;
  let featuredImgHTML = "";

  if (!video && thumbnail) {
    featuredImgHTML = `<img src="${thumbnail}" class="featured-image">`;

    // eliminar posible duplicado dentro del body
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
       <span class="article-category">${post.category || "Noticia"}</span>
       <h1 class="article-title">${post.title || ""}</h1>
       <time class="article-meta">${formatDate(post.date)}</time>
    </header>

    ${video}
    ${featuredImgHTML}

    <div class="article-content">${htmlContent}</div>
  `;
}

/*-------------------------------------------------------
  DOM READY
--------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("post.html")) {
    initPost();
  } else {
    initHome();
  }

  const menuToggle = document.getElementById("menu-toggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      document.getElementById("nav-list").classList.toggle("active");
    });
  }
});
