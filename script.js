// =============================
// CONFIG
// =============================
const REPO = "perspectivas-py/perspectivas";
const BRANCH = "main";
const NEWS_PATH = "content/noticias/posts";

// Colores por categoría
const CATEGORY_COLORS = {
  "Macro": "#004b8d",
  "Política económica": "#8d0000",
  "Inmobiliario": "#1a7f1a",
  "Empresas": "#7a008d",
  "Opinión": "#8a5500",
  "Educación financiera": "#006c6c",
  "Agroindustria": "#3f6600",
  "Comercio exterior": "#5e008d"
};


// =============================
// START
// =============================
document.addEventListener("DOMContentLoaded", () => {
  loadNews();
  activateDarkMode();
  activateMobileMenu();
});


// =============================
// MAIN LOAD FUNCTION
// =============================
async function loadNews() {
  const featuredCard = document.querySelector(".featured-card-bbc");
  const topList = document.getElementById("top-list-bbc");
  const newsGrid = document.getElementById("news-grid");
  if (!featuredCard || !topList || !newsGrid) return;

  try {
    const files = await fetchFiles(NEWS_PATH);
    const posts = await loadPosts(files);

    // Ordenar por fecha DESC
    posts.sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date));

    const featured = posts.find(p => p.frontmatter.featured === "true" || p.frontmatter.featured === true);
    const firstFeatured = featured || posts[0];
    const others = posts.filter(p => p !== firstFeatured);

    renderFeaturedArticleBBC(featuredCard, firstFeatured);
    renderTopListBBC(topList, others.slice(0, 4));

    setupCategoryFilters(posts, others, newsGrid, topList);
    renderWithUrlFilter(posts, others, newsGrid, topList);

  } catch (err) {
    console.error("Error al cargar noticias:", err);
    featuredCard.innerHTML = "<p>Error cargando contenido.</p>";
  }
}


// =============================
// LOAD HELPERS
// =============================
async function fetchFiles(path) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`);
  if (!r.ok) throw new Error("No se pudo acceder al repositorio.");
  return await r.json();
}

async function loadPosts(files) {
  return Promise.all(
    files.map(async file => {
      const markdown = await fetchFileContent(file.download_url);
      const { frontmatter, content } = parseFrontmatter(markdown);

      // Si falta summary, autogenerarlo
      if (!frontmatter.summary) {
        frontmatter.summary = content.slice(0, 180) + "...";
      }

      // Tiempo estimado de lectura
      frontmatter.readtime = estimateReading(content);

      return { ...file, frontmatter, content };
    })
  );
}

async function fetchFileContent(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("No se pudo cargar el archivo: " + url);
  return await r.text();
}


// =============================
// FRONTMATTER PARSE
// =============================
function parseFrontmatter(md) {
  const m = /^---\s*([\s\S]*?)\s*---/.exec(md);
  const data = { frontmatter: {}, content: md };

  if (m) {
    data.content = md.replace(m[0], "").trim();
    m[1].split("\n").forEach(line => {
      const [key, ...v] = line.split(":");
      if (key && v.length > 0) {
        data.frontmatter[key.trim()] = v.join(":").trim().replace(/"/g, "");
      }
    });
  }
  return data;
}


// =============================
// RENDER BBC LAYOUT
// =============================
function renderFeaturedArticleBBC(container, post) {
  const fm = post.frontmatter;
  const content = post.content;
  const img = findFirstImage(content) || fm.image || "https://placehold.co/800x450/EEE/333?text=Perspectivas";
  const url = `noticia.html?type=noticias&id=${post.name}`;

  // Validación featured requiere imagen
  if ((fm.featured === "true" || fm.featured === true) && !fm.image) {
    console.warn("⚠ Noticia destacada sin imagen:", fm.title);
  }

  container.innerHTML = `
    <div class="featured-image-container">
      <a href="${url}">
        <img src="${img}" alt="Imagen principal" />
      </a>
    </div>
    <div class="featured-body">
      <time>${formatDate(fm.date)}</time>
      <h1><a href="${url}">${fm.title}</a></h1>
      <p class="dek">${fm.summary}</p>
      <p class="meta-read">${fm.readtime} min de lectura</p>
    </div>
  `;
}

function renderTopListBBC(container, posts) {
  container.innerHTML = "";
  posts.forEach(post => {
    const fm = post.frontmatter;
    const url = `noticia.html?type=noticias&id=${post.name}`;
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="${url}">
        <h4>${fm.title}</h4>
        <p>${fm.summary}</p>
      </a>`;
    container.appendChild(li);
  });
}


// =============================
// NEWS GRID
// =============================
function renderNewsGrid(container, posts) {
  container.innerHTML = posts.map(createNewsCard).join("");
}

function createNewsCard(post) {
  const fm = post.frontmatter;
  const url = `noticia.html?type=noticias&id=${post.name}`;
  const img = findFirstImage(post.content) || fm.image || "https://placehold.co/600x350/EEE/333?text=Perspectivas";
  const badge = fm.category ? `<span class="badge" style="background:${CATEGORY_COLORS[fm.category] || "#444"}">${fm.category}</span>` : "";

  return `
    <article class="card">
      <a href="${url}">
        <img src="${img}" alt="">
      </a>
      <div class="card-body">
        ${badge}
        <time>${formatDate(fm.date)}</time>
        <h3><a href="${url}">${fm.title}</a></h3>
        <small>${fm.readtime} min de lectura</small>
      </div>
    </article>`;
}


// =============================
// CATEGORY FILTER + URL FILTER
// =============================
function setupCategoryFilters(allPosts, others, newsGrid, topList) {
  const filterBox = document.getElementById("category-filters");
  if (!filterBox) return;

  const categories = [...new Set(allPosts.map(p => p.frontmatter.category).filter(Boolean))];

  let activeCat = null;

  function applyFilter(category) {
    activeCat = category;
    setUrlFilters(category);
    applyUrlFilters(allPosts, others, newsGrid, topList);
  }

  filterBox.innerHTML = `
    <button class="filter-pill" data-cat="">Todos</button>
    ${categories.map(cat => `<button class="filter-pill" data-cat="${cat}">${cat}</button>`).join("")}
  `;

  filterBox.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", e => {
      applyFilter(e.target.dataset.cat || null);
    });
  });
}


// =============================
// URL FILTER LOGIC
// =============================
function renderWithUrlFilter(allPosts, others, newsGrid, topList) {
  applyUrlFilters(allPosts, others, newsGrid, topList);
}

function applyUrlFilters(allPosts, others, newsGrid, topList) {
  const params = new URLSearchParams(location.search);
  const cat = params.get("cat");

  let filtered = others;

  if (cat) {
    filtered = filtered.filter(p => p.frontmatter.category === cat);
  }

  renderNewsGrid(newsGrid, filtered);
  renderTopListBBC(topList, filtered.slice(0, 4));
}

function setUrlFilters(cat) {
  const url = new URL(location);
  if (!cat) {
    url.searchParams.delete("cat");
  } else {
    url.searchParams.set("cat", cat);
  }
  history.replaceState(null, "", url);
}


// =============================
// UTILITIES
// =============================
function findFirstImage(content) {
  const m = content.match(/!\[.*?\]\((.*?)\)/);
  return m ? m[1] : null;
}

function estimateReading(text) {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 220)); // 220 wpm
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-PY", { day: "numeric", month: "short", year: "numeric" });
}


// =============================
// UI
// =============================
function activateDarkMode(){const t=document.getElementById("themeToggle"),e=document.body,o=t?t.querySelector(".icon"):null;if(!t)return;const n=()=>{e.classList.toggle("dark-mode");const t=e.classList.contains("dark-mode")?"dark":"light";localStorage.setItem("theme",t),o&&(o.textContent="dark"===t?"☀️":"🌙")};"dark"===localStorage.getItem("theme")&&(e.classList.add("dark-mode"),o&&(o.textContent="☀️")),t.addEventListener("click",n)}
function activateMobileMenu(){const t=document.getElementById("menu-toggle"),e=document.getElementById("nav-list");if(!t||!e)return;t.addEventListener("click",()=>{e.classList.toggle("is-open");const o=e.classList.contains("is-open");t.setAttribute("aria-expanded",o),t.innerHTML=o?"&times;":"☰"})}
