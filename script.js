/* script.js - Perspectivas Engine v3.0 (Patrocinadores Integrado) */

const CONFIG = {
  username: 'perspectivas-py',
  repo: 'perspectivas',
  limitNews: 10,
  cacheTime: 15 * 60 * 1000, // 15 min caché
};

const PATHS = {
  noticias: 'content/noticias/posts',
  programa: 'content/programa/posts',
  analisis: 'content/analisis/posts',
  podcast: 'content/podcast/posts',
  sponsors: 'content/sponsors'
};

const BASE_API = `https://api.github.com/repos/${CONFIG.username}/${CONFIG.repo}/contents`;

// ---------------------------------------------------------
// SISTEMA DE CACHÉ
// ---------------------------------------------------------
const db = {
  save: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), payload: data }));
    } catch (e) { console.warn("Cache full", e); }
  },
  get: (key) => {
    const record = localStorage.getItem(key);
    if (!record) return null;
    const { timestamp, payload } = JSON.parse(record);
    if (Date.now() - timestamp > CONFIG.cacheTime) return null;
    return payload;
  }
};

// ---------------------------------------------------------
// Helpers generales
// ---------------------------------------------------------
const formatDate = (str) => {
  if (!str) return "";
  try {
    return new Date(str).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch (e) { return str; }
};

const getYoutubeId = (url) => {
  if (!url) return null;
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
};

const extractFirstImage = (markdown) => {
  const mdMatch = markdown.match(/!\[.*?\]\((.*?)\)/);
  if (mdMatch) return mdMatch[1];
  const htmlMatch = markdown.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlMatch) return htmlMatch[1];
  return null;
};

const parseMarkdown = (text) => {
  const match = text.match(/^---([\s\S]*?)---/);
  if (!match) return { attributes: {}, body: text };

  const attributes = {};
  match[1].split("\n").forEach(line => {
    const [key, ...val] = line.split(":");
    if (key && val) attributes[key.trim()] = val.join(":").trim().replace(/^['"]|['"]$/g, "");
  });

  return {
    attributes,
    body: text.replace(match[0], "").trim()
  };
};

// ---------------------------------------------------------
// Helpers para Patrocinadores
// ---------------------------------------------------------
function shuffleArray(arr) {
  return arr
    .map(item => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function resolveMediaUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : path;
}

// ---------------------------------------------------------
// Fetch de colecciones
// ---------------------------------------------------------
async function fetchCollection(path, type) {
  const cacheKey = `perspectivas_v3_${type}`;
  const cachedData = db.get(cacheKey);
  if (cachedData) return cachedData;

  try {
    const res = await fetch(`${BASE_API}/${path}`);
    if (res.status === 403) throw new Error("403 API Limit");
    if (!res.ok) return [];

    const files = await res.json();
    const mdFiles = files.filter(f => f.name.endsWith(".md"));

    const items = await Promise.all(
      mdFiles.map(async (f) => {
        const r = await fetch(f.download_url);
        const t = await r.text();
        const { attributes, body } = parseMarkdown(t);
        const finalImage =
          attributes.thumbnail || attributes.image || extractFirstImage(body) || null;

        return {
          ...attributes,
          body,
          slug: f.name.replace(".md", ""),
          folder: path,
          category: attributes.category || "General",
          thumbnail: finalImage
        };
      })
    );

    const sortedItems = items.sort((a, b) => new Date(b.date) - new Date(a.date));
    db.save(cacheKey, sortedItems);
    return sortedItems;

  } catch (e) {
    const stale = localStorage.getItem(cacheKey);
    return stale ? JSON.parse(stale).payload : [];
  }
}

async function fetchSinglePost(folder, slug) {
  try {
    const res = await fetch(`${BASE_API}/${folder}/${slug}.md`);
    if (!res.ok) throw new Error("Not found");
    const meta = await res.json();
    const contentRes = await fetch(meta.download_url);
    const { attributes, body } = parseMarkdown(await contentRes.text());

    if (!attributes.thumbnail && !attributes.image) {
      attributes.thumbnail = extractFirstImage(body);
    }

    return { attributes, body };

  } catch (e) { return null; }
}

// ---------------------------------------------------------
// Rendering Cards
// ---------------------------------------------------------
const createCardHTML = (item, showVideo) => {
  const link = `post.html?id=${item.slug}&folder=${item.folder}`;
  let media = "";

  if (showVideo && item.embed_url && getYoutubeId(item.embed_url)) {
    media = `
      <div class="video-wrapper">
        <iframe src="https://www.youtube.com/embed/${getYoutubeId(item.embed_url)}"
                frameborder="0" allowfullscreen></iframe>
      </div>`;
  } else {
    const imgUrl = item.thumbnail || "https://placehold.co/600x400/eee/999?text=Perspectivas";
    media = `
      <div class="card-img-container">
         <a href="${link}"><img src="${imgUrl}" loading="lazy" alt="${item.title}"></a>
      </div>`;
  }

  return `
    <article class="card">
      ${media}
      <div class="card-content">
        <small class="card-meta">${formatDate(item.date)} | ${item.category}</small>
        <h3><a href="${link}">${item.title}</a></h3>
      </div>
    </article>`;
};

const createPodcastHTML = (item) => {
  const link = `post.html?id=${item.slug}&folder=${item.folder}`;
  const imgUrl = item.thumbnail || "https://placehold.co/150x150/333/fff?text=Audio";

  return `
    <article class="podcast-card">
      <a href="${link}" class="podcast-img-link">
        <img src="${imgUrl}" alt="${item.title}" loading="lazy">
        <div class="play-overlay"><span class="play-icon">▶</span></div>
      </a>
      <div class="podcast-content">
        <small class="podcast-meta">${formatDate(item.date)} | EPISODIO</small>
        <h3 class="podcast-title"><a href="${link}">${item.title}</a></h3>
      </div>
    </article>`;
};

// ---------------------------------------------------------
// RENDER: Patrocinadores (grilla)
// ---------------------------------------------------------
function renderSponsorsGrid(entries) {
  const container = document.getElementById("sponsorsGrid");
  if (!container) return;

  container.innerHTML = "";

  if (!entries.length) {
    container.innerHTML = "<p>No hay patrocinadores activos.</p>";
    return;
  }

  const randomized = shuffleArray(entries);

  randomized.forEach(d => {
    if (String(d.active) === "false") return;

    const tierClass = d.tier ? `tier-${d.tier}` : "";
    const logoUrl = resolveMediaUrl(d.logo);

    const wrapper = document.createElement(d.url ? "a" : "div");
    wrapper.className = `sponsor-item ${tierClass}`;

    if (d.url) {
      wrapper.href = d.url;
      wrapper.target = "_blank";
      wrapper.rel = "noopener noreferrer sponsored";
    }

    const img = document.createElement("img");
    img.src = logoUrl || "https://placehold.co/200x60?text=Logo";
    img.alt = d.title || "Patrocinador";

    wrapper.appendChild(img);
    container.appendChild(wrapper);
  });
}

// ---------------------------------------------------------
// Scheduler PRO v3 — rotación automática + campañas
// ---------------------------------------------------------
function startSponsoredScheduler(entries) {
  // 1. Primera carga inmediata
  renderSponsoredSite(entries);

  // 2. Rotación automática cada 3 minutos
  setInterval(() => {
    const cardEl = document.getElementById("sponsoredSiteCard");
    if (!cardEl) return;

    // Fade-out suave ANTES de cambiar contenido
    cardEl.style.transition = "opacity 0.6s ease";
    cardEl.style.opacity = 0;

    setTimeout(() => {
      // Reemplazo del contenido
      renderSponsoredSite(entries);

      // Fade-in suave
      setTimeout(() => {
        cardEl.style.opacity = 1;
      }, 50);

    }, 600);
  }, 3 * 60 * 1000);
}

// ---------------------------------------------------------
// CARGA DE PATROCINADORES (Home)
// ---------------------------------------------------------
async function loadSponsorsHome() {
  try {
    const sponsors = await fetchCollection(PATHS.sponsors, "sponsors");

    if (sponsors.length) {
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

// ---------------------------------------------------------
// Newsletter
// ---------------------------------------------------------
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
      await new Promise(r => setTimeout(r, 1000));
      msg.textContent = `¡Suscrito al plan ${plan}!`;
      msg.className = "msg-feedback msg-success";
      form.reset();
    } catch (e) {
      msg.textContent = "Error al enviar.";
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

// ---------------------------------------------------------
// HOME INIT
// ---------------------------------------------------------
async function initHome() {
  const news = await fetchCollection(PATHS.noticias, "noticias");
  const prog = await fetchCollection(PATHS.programa, "programa");
  const analysis = await fetchCollection(PATHS.analisis, "analisis");
  const podcasts = await fetchCollection(PATHS.podcast, "podcast");

  if (news.length === 0 && prog.length === 0) return;

  // ---------------- Hero & Noticias ----------------
  if (news.length > 0) {
    const hero = news[0];
    const heroEl = document.querySelector(".featured-card-bbc");

    if (heroEl) {
      const heroImg = hero.thumbnail || "https://placehold.co/800x400/eee/999?text=Perspectivas";
      heroEl.innerHTML = `
        <a href="post.html?id=${hero.slug}&folder=${hero.folder}">
          <img src="${heroImg}" alt="${hero.title}">
          <h2>${hero.title}</h2>
          <p>${hero.description || ""}</p>
        </a>`;
    }

    const sideEl = document.getElementById("top-list-bbc");
    if (sideEl) {
      sideEl.innerHTML = news.slice(1, 4).map(n => `
        <li>
          <a href="post.html?id=${n.slug}&folder=${n.folder}">
            <h4>${n.title}</h4>
            <small>${formatDate(n.date)}</small>
          </a>
        </li>`).join("");
    }

    const newsGrid = document.getElementById("news-grid");
    if (newsGrid) {
      newsGrid.innerHTML = news.slice(4, 4 + CONFIG.limitNews).map(n => createCardHTML(n)).join("");
    }
  }

  // ---------------- Otros Grids ----------------
  const progGrid = document.getElementById("program-grid");
  if (progGrid) progGrid.innerHTML = prog.slice(0, 6).map(p => createCardHTML(p, true)).join("");

  const anaGrid = document.getElementById("analisis-grid");
  if (anaGrid) anaGrid.innerHTML = analysis.slice(0, 4).map(a => createCardHTML(a)).join("");

  const podGrid = document.getElementById("podcast-grid");
  if (podGrid) podGrid.innerHTML = podcasts.slice(0, 4).map(p => createPodcastHTML(p)).join("");

  // ---------------- Newsletter ----------------
  setupNewsletter();

  // ---------------- Buscador ----------------
  document.getElementById("search-input")?.addEventListener("input", e => {
    const term = e.target.value.toLowerCase();
    const grid = document.getElementById("news-grid");
    if (!grid) return;

    if (term.length < 2) {
      grid.innerHTML = news.slice(4, 4 + CONFIG.limitNews).map(n => createCardHTML(n)).join("");
    } else {
      grid.innerHTML = news
        .filter(n => n.title.toLowerCase().includes(term))
        .map(n => createCardHTML(n))
        .join("");
    }
  });

  // ---------------- Patrocinadores (Nuevo) ----------------
  loadSponsorsHome();
}

// ---------------------------------------------------------
// POST PAGE
// ---------------------------------------------------------
async function initPost() {
  const p = new URLSearchParams(window.location.search);
  const slug = p.get("id");
  const folder = p.get("folder") || PATHS.noticias;
  const el = document.getElementById("article-detail");
  if (!slug || !el) return;

  const data = await fetchSinglePost(folder, slug);
  if (!data) {
    el.innerHTML = "<p>Error cargando noticia</p>";
    return;
  }

  document.title = data.attributes.title;
  if (typeof marked === "undefined") {
    await import("https://cdn.jsdelivr.net/npm/marked/marked.min.js");
  }

  let video = "";
  if (data.attributes.embed_url) {
    const vid = getYoutubeId(data.attributes.embed_url);
    if (vid) {
      video = `
        <div class="video-wrapper" style="margin:2rem 0">
          <iframe src="https://www.youtube.com/embed/${vid}"
                  frameborder="0" allowfullscreen></iframe>
        </div>`;
    }
  }

  let htmlContent = marked.parse(data.body);
  const thumbnail = data.attributes.thumbnail;
  let featuredImgHTML = "";

  if (!video && thumbnail) {
    featuredImgHTML = `<img src="${thumbnail}" class="featured-image">`;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const firstImg = tempDiv.querySelector("img");

    if (firstImg && (firstImg.getAttribute("src") === thumbnail || firstImg.src === thumbnail)) {
      firstImg.remove();
      htmlContent = tempDiv.innerHTML;
    }
  }

  el.innerHTML = `
    <header class="article-header">
       <span class="article-category">${data.attributes.category || "Noticia"}</span>
       <h1 class="article-title">${data.attributes.title}</h1>
       <time class="article-meta">${formatDate(data.attributes.date)}</time>
    </header>

    ${video}
    ${featuredImgHTML}

    <div class="article-content">${htmlContent}</div>
  `;
}

// ---------------------------------------------------------
// DOM Ready
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("post.html")) initPost();
  else initHome();

  document.getElementById("menu-toggle")?.addEventListener("click", () => {
    document.getElementById("nav-list").classList.toggle("active");
  });
});
