// --- CONFIGURACIÓN GLOBAL ---
const REPO = "perspectivas-py/perspectivas";
const BRANCH = "main";
const NEWS_PATH = "content/noticias/posts";

// --- FUNCIÓN PRINCIPAL ---
document.addEventListener("DOMContentLoaded", () => {
  try {
    loadNews();
    activateDarkMode();
    activateMobileMenu();
  } catch (error) {
    console.error("Error al iniciar:", error);
  }
});

// --- CARGA PRINCIPAL DE NOTICIAS ---
async function loadNews() {
  const featuredCard = document.querySelector(".featured-card-bbc");
  const topList = document.getElementById("top-list-bbc");
  const newsGrid = document.getElementById("news-grid");
  if (!featuredCard || !topList || !newsGrid) return;

  try {
    const files = await fetchFiles(NEWS_PATH);

    const allPosts = await Promise.all(
      files.map(async file => {
        const markdown = await fetchFileContent(file.download_url);
        const { frontmatter, content } = parseFrontmatter(markdown);
        return {
          ...file,
          frontmatter,
          content,
          category: frontmatter.category || "sin-categoria",
          tags: frontmatter.tags || []
        };
      })
    );

    // --- CORRECCIÓN 3: ORDENAR TODAS LAS NOTICIAS POR FECHA (MÁS RECIENTE PRIMERO) ---
    // Esto garantiza que el contenido nuevo siempre esté al principio.
    allPosts.sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date));

    // El destacado es el marcado como 'featured' o, en su defecto, el más reciente.
    let featuredPost =
      allPosts.find(post => String(post.frontmatter.featured) === "true") ||
      allPosts[0];

    const otherPosts = allPosts.filter(p => p.name !== featuredPost.name);

    renderFeaturedArticleBBC(featuredCard, featuredPost);
    renderTopListBBC(topList, otherPosts.slice(0, 4));
    renderNewsGrid(newsGrid, otherPosts); // Renderiza todas las demás noticias

    // Inicializamos los filtros DESPUÉS de renderizar todo el contenido.
    initCategoryFilter();
    initSearchFilter();

  } catch (error) {
    console.error("Error al cargar noticias:", error);
    featuredCard.innerHTML = `<p style="color:red;font-weight:bold">Error: ${error.message}</p>`;
  }
}

// --- RENDER DESTACADA (LÍMITE DE TEXTO AUMENTADO) ---
function renderFeaturedArticleBBC(container, post) {
  const { name, frontmatter, content } = post;
  let imageUrl = findFirstImage(content) || 
    "https://placehold.co/800x450/EFEFEF/AAAAAA?text=Perspectivas";

  const link = `noticia.html?type=noticias&id=${name.replace(/\.md$/, '')}`;

  container.innerHTML = `
    <div class="featured-image-container">
      <a href="${link}"><img src="${imageUrl}" alt=""></a>
    </div>
    <div class="featured-body">
      <time datetime="${frontmatter.date}">${formatDate(frontmatter.date)}</time>
      <h1><a href="${link}">${frontmatter.title || "Sin título"}</a></h1>
      <p class="dek">${frontmatter.summary || content.substring(0, 220) + '...'}</p>
    </div>
  `;
}

// --- LISTA LATERAL (LÍMITE DE TEXTO AUMENTADO) ---
function renderTopListBBC(container, files) {
  container.innerHTML = "";
  files.forEach(post => {
    const link = `noticia.html?type=noticias&id=${post.name.replace(/\.md$/, '')}`;
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="${link}">
        <h4>${post.frontmatter.title || formatTitleFromFilename(post.name)}</h4>
        <p>${post.frontmatter.summary || post.content.substring(0, 120) + '...'}</p>
      </a>
    `;
    container.appendChild(li);
  });
}

// --- GRID PRINCIPAL ---
function renderNewsGrid(container, files) {
  container.innerHTML = "";
  files.forEach(post => {
    container.innerHTML += createNewsCard(post);
  });
}

function createNewsCard(post) {
  const { name, frontmatter, content, category } = post;
  const link = `noticia.html?type=noticias&id=${name}`;
  const img = findFirstImage(content) ||
    "https://placehold.co/400x225/EFEFEF/AAAAAA?text=Perspectivas";

  return `
    <article class="card" data-category="${category.toLowerCase()}">
      <a href="${link}">
        <img src="${img}" alt="">
      </a>
      <div class="card-body">
        <time datetime="${frontmatter.date}">${formatDate(frontmatter.date)}</time>
        <h3><a href="${link}">${frontmatter.title}</a></h3>
      </div>
    </article>
  `;
}

// --- FILTRO DE CATEGORÍAS ---
function initCategoryFilter() {
  const btns = document.querySelectorAll("#category-filters button");
  const cards = document.querySelectorAll("#news-grid .card");
  if (!btns.length || !cards.length) return;

  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.cat;

      cards.forEach(card => {
        card.style.display = (cat === "all" || card.dataset.category === cat) ? "" : "none";
      });
    });
  });
}

// --- BUSCADOR ---
function initSearchFilter() {
  const input = document.getElementById("search-input");
  const cards = document.querySelectorAll("#news-grid .card");

  if (!input) return;

  input.addEventListener("input", () => {
    const q = normalizeText(input.value);

    cards.forEach(card => {
      const title = normalizeText(card.querySelector("h3").innerText);
      card.style.display = title.includes(q) ? "" : "none";
    });
  });
}

function normalizeText(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// --- UTILS ---
async function fetchFiles(path) {
  // --- CORRECCIÓN 4: ANTI-CACHÉ ---
  // Se añade un parámetro único a la URL para forzar la obtención de datos frescos.
  const timestamp = `&_=${new Date().getTime()}`;
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}${timestamp}`);
  if (!r.ok) throw new Error(`No se pudo acceder al contenido: ${path}`);
  return await r.json();
}

async function fetchFileContent(url) {
  // Se añade el mismo truco anti-caché aquí para la portada.
  const cacheBustingUrl = `${url}?t=${new Date().getTime()}`;
  const r = await fetch(cacheBustingUrl);
  if (!r.ok) throw new Error("No se pudo cargar archivo");
  return await r.text();
}

function parseFrontmatter(md) {
  const match = /^---\s*([\s\S]*?)\s*---/.exec(md);
  const data = { frontmatter: {}, content: md };

  if (match) {
    const lines = match[1].split("\n");
    lines.forEach(line => {
      const [key, ...rest] = line.split(":");
      if (key && rest.length) {
        // Aseguramos que el valor se limpie de comillas y espacios extra
        data.frontmatter[key.trim()] = rest.join(":").trim().replace(/^['"]|['"]$/g, '');
      }
    });
    data.content = md.replace(match[0], "").trim();
  }
  return data;
}

function findFirstImage(content) {
  const mdImg = content.match(/!\[.*\]\((.*?)\)/);
  if (mdImg) return mdImg[1];

  const htmlImg = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return htmlImg ? htmlImg[1] : null;
}

function formatTitleFromFilename(fn) {
  return fn.replace(/\.md$/, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// --- DARK MODE ---
function activateDarkMode() {
  const btn = document.getElementById("themeToggle");
  const body = document.body;
  const icon = btn?.querySelector(".icon");

  if (!btn) return;

  const toggle = () => {
    body.classList.toggle("dark-mode");
    const mode = body.classList.contains("dark-mode") ? "dark" : "light";
    localStorage.setItem("theme", mode);
    if (icon) icon.textContent = mode === "dark" ? "☀️" : "🌙";
  };

  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    if (icon) icon.textContent = "☀️";
  }

  btn.addEventListener("click", toggle);
}

// --- MENÚ MÓVIL ---
function activateMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-list");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    nav.classList.toggle("is-open");
    const isOpen = nav.classList.contains("is-open");
    toggle.innerHTML = isOpen ? "&times;" : "☰";
    toggle.setAttribute("aria-expanded", isOpen);
  });
}
