// --------------------------------------
// Configuración local para página de noticia
// (NOMBRES DIFERENTES para no chocar con script.js)
// --------------------------------------
const ARTICLE_REPO = 'perspectivas-py/perspectivas';
const ARTICLE_BRANCH = 'main';

const ARTICLE_CONTENT_PATHS = {
  noticias: "content/noticias/posts",
  analisis: "content/analisis/posts",
  programa: "content/programa/posts",
};

// --------------------------------------
// Inicio
// --------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type") || "noticias";
  const id = params.get("id");

  if (!id) {
    safeSetInnerHTML("<h1>Error</h1><p>No se encontró el identificador del artículo.</p>");
    return;
  }

  try {
    await loadArticle(type, id);
  } catch (error) {
    console.error("Error al cargar la noticia:", error);
    safeSetInnerHTML("<h1>Error</h1><p>No se pudo cargar el artículo solicitado.</p>");
  }
});

// --------------------------------------
// Función principal
// --------------------------------------
async function loadArticle(type, id) {
  const path = ARTICLE_CONTENT_PATHS[type] || ARTICLE_CONTENT_PATHS.noticias;

  // Codificar bien el nombre del archivo (tildes, ñ, etc.)
  const encodedId = encodeURIComponent(id).replace(/%2F/g, "/");
  const fileUrl = `https://raw.githubusercontent.com/${ARTICLE_REPO}/${ARTICLE_BRANCH}/${path}/${encodedId}`;

  const markdown = await fetchMarkdown(fileUrl);
  const { frontmatter, content } = parseFrontmatterArticle(markdown);

  renderArticle(frontmatter, content, type, id);
}

// --------------------------------------
// Fetch Markdown
// --------------------------------------
async function fetchMarkdown(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar el archivo: ${url}`);
  return await res.text();
}

// --------------------------------------
// Parse Frontmatter (versión local, nombre distinto)
// --------------------------------------
function parseFrontmatterArticle(md) {
  const match = /^---\s*([\s\S]+?)\s*---/.exec(md);
  if (!match) return { frontmatter: {}, content: md };

  const frontmatter = {};
  match[1].split("\n").forEach(line => {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) return;
    frontmatter[key.trim()] = rest.join(":").trim().replace(/"/g, "");
  });

  const content = md.replace(match[0], "").trim();
  return { frontmatter, content };
}

// --------------------------------------
// Render de la noticia
// --------------------------------------
function renderArticle(fm, content, type, id) {
  const container = getArticleContainer();
  if (!container) return;

  const title = fm.title || "Sin título";
  const date = formatDateArticle(fm.date);
  const readTime = estimateReadingTime(content);
  const image = findFirstImageArticle(content);
  const htmlContent = window.marked ? window.marked.parse(content) : content;

  container.innerHTML = `
    <h1>${title}</h1>

    <div class="article-meta-info">
      <span>${date}</span>
      <span>⏱ ${readTime} min de lectura</span>
    </div>

    ${image ? `<div class="featured-image"><img src="${image}" alt=""></div>` : ""}

    <article class="article-content">
      ${htmlContent}
    </article>

    <div id="share-buttons">
      ${renderShareButtons(title)}
    </div>
  `;
}

// --------------------------------------
// Utilidades de render
// --------------------------------------
function getArticleContainer() {
  // Usa el <section> o <article> con clase .full-article (tu plantilla actual)
  let el = document.querySelector(".full-article");

  // Si algún día agregas un id="article-container", también lo soporta
  if (!el) el = document.getElementById("article-container");

  if (!el) {
    console.error("No se encontró contenedor para el artículo (.full-article ni #article-container)");
  }
  return el;
}

function safeSetInnerHTML(html) {
  const el = getArticleContainer();
  if (el) el.innerHTML = html;
}

function formatDateArticle(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function estimateReadingTime(text) {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function findFirstImageArticle(content) {
  const match = content.match(/!\[[^\]]*]\((.*?)\)/);
  return match ? match[1] : null;
}

function renderShareButtons(title) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(title);

  return `
    <a href="https://twitter.com/intent/tweet?url=${url}&text=${text}" target="_blank" rel="noopener">🐦</a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" rel="noopener">📘</a>
    <a href="https://api.whatsapp.com/send?text=${text}%20${url}" target="_blank" rel="noopener">💬</a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" rel="noopener">💼</a>
  `;
}
