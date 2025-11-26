/* script.js - Perspectivas Engine PRO v3 (JSON Unified Loader) */

/* ============================================================
   CONFIG
============================================================ */
const CONFIG = {
  limitNews: 10,
  rotationTime: 12000, // patrocinador: 12 seg
};

/* ============================================================
   LOAD JSON (content.json en la raíz)
============================================================ */
async function loadContentJSON() {
  try {
    const res = await fetch("/public/content.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar content.json");
    return await res.json();
  } catch (e) {
    console.error("ERROR cargando content.json:", e);
    return null;
  }
}

/* ============================================================
   HELPERS
============================================================ */
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
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return match && match[2].length === 11 ? match[2] : null;
};

function resolveMediaUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : path;
}

/* ============================================================
   MARKDOWN HELPERS (para otras páginas)
============================================================ */
async function fetchMarkdownFile(url) {
  const res = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo obtener ${url}`);
  return res.text();
}

function parseMarkdownFrontmatter(md) {
  const match = /^---\s*([\s\S]*?)\s*---/.exec(md);
  const data = { frontmatter: {}, content: md };

  if (match) {
    const lines = match[1].split("\n");
    let currentKey = null;

    lines.forEach((line) => {
      // lista YAML (ej: tags: \n  - valor)
      if (/^\s*-\s*/.test(line) && currentKey) {
        data.frontmatter[currentKey] = data.frontmatter[currentKey] || [];
        const value = line.replace(/^\s*-\s*/, "").trim().replace(/^['"]|['"]$/g, "");
        if (value) data.frontmatter[currentKey].push(value);
        return;
      }

      const [key, ...rest] = line.split(":");
      if (!key || rest.length === 0) return;

      currentKey = key.trim();
      const value = rest.join(":").trim();

      if (value) {
        data.frontmatter[currentKey] = value.replace(/^['"]|['"]$/g, "");
        currentKey = null;
      } else {
        // valor vacío => se asume que vienen ítems de lista debajo
        data.frontmatter[currentKey] = [];
      }
    });

    data.content = md.replace(match[0], "").trim();
  }

  return data;
}

function extractSummaryFromMarkdown(content, maxLength = 200) {
  if (!content) return "";

  const plain = content
    .replace(/!\[[^\]]*]\([^)]*\)/g, "") // imágenes
    .replace(/\[[^\]]*]\([^)]*\)/g, "") // links
    .replace(/[#>*_`~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 1)}…`;
}

function buildNewsCardFromMarkdown(filename, frontmatter, content) {
  const slug = filename.replace(/\.md$/i, "");
  const url = `noticia.html?type=noticias&id=${encodeURIComponent(slug)}`;

  const img =
    frontmatter.thumbnail || "https://placehold.co/600x400/eee/999?text=Perspectivas";

  const summary = frontmatter.summary || extractSummaryFromMarkdown(content);

  return `
    <article class="card">
      <div class="card-img-container">
        <a href="${url}">
          <img src="${img}" loading="lazy" alt="${frontmatter.title || "Noticia"}">
        </a>
      </div>
      <div class="card-content">
        <small class="card-meta">${formatDate(frontmatter.date)} | ${
    frontmatter.category || "General"
  }</small>
        <h3><a href="${url}">${frontmatter.title || "Sin título"}</a></h3>
        ${summary ? `<p>${summary}</p>` : ""}
      </div>
    </article>`;
}

/* ============================================================
   TEMPLATES HTML
============================================================ */
function cardHTML(item, showVideo) {
  const link = `post.html?id=${item.id}&type=${item.type}`;
  const img = item.thumbnail || "https://placehold.co/600x400/eee/999?text=Perspectivas";

  let media = `
    <div class="card-img-container">
      <a href="${link}">
        <img src="${img}" loading="lazy" alt="${item.title}">
      </a>
    </div>`;

  if (showVideo && item.embed_url && getYoutubeId(item.embed_url)) {
    media = `
      <div class="video-wrapper">
        <iframe src="https://www.youtube.com/embed/${getYoutubeId(item.embed_url)}"
                frameborder="0" allowfullscreen></iframe>
      </div>`;
  }

  return `
    <article class="card">
      ${media}
      <div class="card-content">
        <small class="card-meta">${formatDate(item.date)} | ${item.category || "General"}</small>
        <h3><a href="${link}">${item.title}</a></h3>
      </div>
    </article>`;
}

function podcastHTML(item) {
  const link = `post.html?id=${item.id}&type=${item.type}`;
  const img = item.thumbnail || "https://placehold.co/150x150/333/fff?text=Audio";

  return `
    <article class="podcast-card">
      <a href="${link}" class="podcast-img-link">
        <img src="${img}" loading="lazy">
        <div class="play-overlay"><span class="play-icon">▶</span></div>
      </a>
      <div class="podcast-content">
        <small class="podcast-meta">${formatDate(item.date)} | EPISODIO</small>
        <h3 class="podcast-title"><a href="${link}">${item.title}</a></h3>
      </div>
    </article>`;
}

/* ============================================================
   SPONSORS — SELECCIÓN SMART
============================================================ */
function pickSponsorSmart(sponsors) {
  const now = new Date();

  let active = sponsors.filter(s => String(s.active) !== "false");

  // aplicar campañas
  let campaign = active.filter(s => {
    const start = s.campaign_start ? new Date(s.campaign_start) : null;
    const end = s.campaign_end ? new Date(s.campaign_end) : null;

    if (start && end) return now >= start && now <= end;
    if (start && !end) return now >= start;
    if (!start && end) return now <= end;
    return true;
  });

  const pool = campaign.length ? campaign : active;

  pool.sort((a, b) => {
    const pa = a.priority ? Number(a.priority) : 999;
    const pb = b.priority ? Number(b.priority) : 999;
    return pa - pb;
  });

  return pool[0];
}

/* Render del bloque patrocinado */
function renderSponsoredSite(sponsors) {
  const cardEl = document.getElementById("sponsoredSiteCard");
  if (!cardEl) return;

  const d = pickSponsorSmart(sponsors);
  if (!d) return;

  const logoUrl = resolveMediaUrl(d.logo);

  cardEl.innerHTML = `
    <div>
      <div class="sponsored-meta">Contenido patrocinado · Perspectivas</div>
      <h3>${d.headline || d.title}</h3>

      ${d.excerpt
        ? `<p>${d.excerpt}</p>`
        : `<p class="sponsored-tagline">
             Conocé a <strong>${d.title}</strong>, aliado de Perspectivas.
           </p>`
      }

      ${d.sector ? `<div class="sponsored-sector">Sector: ${d.sector}</div>` : ""}

      ${d.url
        ? `<div class="sponsored-actions">
             <a class="sponsored-cta" href="${d.url}"
                target="_blank" rel="noopener noreferrer sponsored">
               Visitar sitio patrocinado
             </a>
           </div>`
        : ""
      }
    </div>

    <div>
      <img src="${logoUrl}" alt="${d.title}">
    </div>
  `;
}

/* Rotación Smart */
function startSponsorsRotation(sponsors) {
  renderSponsoredSite(sponsors);

  const cardEl = document.getElementById("sponsoredSiteCard");
  if (!cardEl) return;

  setInterval(() => {
    cardEl.style.opacity = 0;

    setTimeout(() => {
      renderSponsoredSite(sponsors);
      cardEl.style.opacity = 1;
    }, 500);

  }, CONFIG.rotationTime);
}

/* ============================================================
   RENDER HOME
============================================================ */
function renderHome(data) {
  const news = data.noticias || [];
  const prog = data.programa || [];
  const analisis = data.analisis || [];
  const podcasts = data.podcast || [];
  const sponsors = data.sponsors || [];

  /* HERO */
  if (news.length) {
    const hero = news[0];
    const heroEl = document.querySelector(".featured-card-bbc");

    if (heroEl) {
      const img = hero.thumbnail || "https://placehold.co/800x400?text=Perspectivas";

      heroEl.innerHTML = `
        <a href="post.html?id=${hero.id}&type=noticias">
          <img src="${img}">
          <h2>${hero.title}</h2>
          <p>${hero.description || ""}</p>
        </a>`;
    }

    const topList = document.getElementById("top-list-bbc");
    if (topList) {
      topList.innerHTML = news.slice(1, 4).map(n => `
        <li>
          <a href="post.html?id=${n.id}&type=noticias">
            <h4>${n.title}</h4>
            <small>${formatDate(n.date)}</small>
          </a>
        </li>`).join("");
    }
  }

  /* NEWS GRID */
  const newsGrid = document.getElementById("news-grid");
  if (newsGrid) {
    newsGrid.innerHTML = news.slice(4, 4 + CONFIG.limitNews)
      .map(n => cardHTML(n))
      .join("");
  }

  /* PROGRAMA */
  const progGrid = document.getElementById("program-grid");
  if (progGrid) {
    progGrid.innerHTML = prog.slice(0, 6)
      .map(p => cardHTML(p, true))
      .join("");
  }

  /* ANÁLISIS */
  const anaGrid = document.getElementById("analisis-grid");
  if (anaGrid) {
    anaGrid.innerHTML = analisis.slice(0, 4)
      .map(a => cardHTML(a))
      .join("");
  }

  /* PODCAST */
  const podGrid = document.getElementById("podcast-grid");
  if (podGrid) {
    podGrid.innerHTML = podcasts.slice(0, 4)
      .map(podcastHTML)
      .join("");
  }

  /* SPONSORS */
  if (sponsors.length) startSponsorsRotation(sponsors);
}

/* ============================================================
   INIT HOME
============================================================ */
async function initHome() {
  const data = await loadContentJSON();
  if (!data) return;

  renderHome(data);

  /* Buscador */
  const search = document.getElementById("search-input");
  if (search) {
    search.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const newsGrid = document.getElementById("news-grid");
      if (!newsGrid) return;

      if (!term || term.length < 2) {
        newsGrid.innerHTML = data.noticias.slice(4, 4 + CONFIG.limitNews)
          .map(cardHTML)
          .join("");
      } else {
        newsGrid.innerHTML = data.noticias
          .filter(n => n.title.toLowerCase().includes(term))
          .map(cardHTML)
          .join("");
      }
    });
  }
}

/* ============================================================
   INIT POST
============================================================ */
async function initPost() {
  const p = new URLSearchParams(window.location.search);
  const id = p.get("id");
  const type = p.get("type");

  const data = await loadContentJSON();
  if (!data || !id || !type) return;

  const list = data[type] || [];
  const item = list.find(x => x.id === id);
  if (!item) return;

  const el = document.getElementById("article-detail");
  if (!el) return;

  document.title = item.title;

  let video = "";
  if (item.embed_url) {
    const vid = getYoutubeId(item.embed_url);
    if (vid) {
      video = `
        <div class="video-wrapper" style="margin:2rem 0">
          <iframe src="https://www.youtube.com/embed/${vid}"
                  frameborder="0" allowfullscreen></iframe>
        </div>`;
    }
  }

  let featured = "";
  if (!video && item.thumbnail) {
    featured = `<img src="${item.thumbnail}" class="featured-image">`;
  }

  el.innerHTML = `
    <header class="article-header">
       <span class="article-category">${item.category}</span>
       <h1 class="article-title">${item.title}</h1>
       <time class="article-meta">${formatDate(item.date)}</time>
    </header>

    ${video}
    ${featured}

    <div class="article-content">${item.body_html}</div>
  `;
}

/* ============================================================
   DOM READY
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("post.html")) {
    initPost();
  } else {
    initHome();
  }
});
