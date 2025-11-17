// --------------------------------------
// Configuración local para página de noticia
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
    console.error("❌ Error al cargar la noticia:", error);
    safeSetInnerHTML("<h1>Error</h1><p>No se pudo cargar el artículo solicitado.</p>");
  }
});

// --------------------------------------
// Cargar artículo
// --------------------------------------
async function loadArticle(type, id) {
  const path = ARTICLE_CONTENT_PATHS[type] || ARTICLE_CONTENT_PATHS.noticias;

  const encodedId = encodeURIComponent(id).replace(/%2F/g, "/");
  const fileUrl = `https://raw.githubusercontent.com/${ARTICLE_REPO}/${ARTICLE_BRANCH}/${path}/${encodedId}`;

  const markdown = await fetchMarkdown(fileUrl);
  const { frontmatter, content } = parseFrontmatterArticle(markdown);

  renderArticle(frontmatter, content, type, id);
}

// --------------------------------------
// Fetch
// --------------------------------------
async function fetchMarkdown(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar el archivo Markdown: ${url}`);
  return await res.text();
}

// --------------------------------------
// Parse frontmatter
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
// Render
// --------------------------------------
function renderArticle(fm, content, type, id) {
  const container = getArticleContainer();
  if (!container) return;

  const title = fm.title || "Sin título";
  const date = formatDateArticle(fm.date);
  const readTime = estimateReadingTime(content);

  // buscar primera imagen
  const firstImage = findFirstImageFromAny(content);

  // eliminar primera imagen (markdown, img, figure)
  let cleanedContent = removeFirstImage(content);

  const htmlContent = window.marked ? window.marked.parse(cleanedContent.trim()) : cleanedContent.trim();

  container.innerHTML = `
    <h1>${title}</h1>

    <div class="article-meta-info">
      <span>${date}</span>
      <span>⏱ ${readTime} min de lectura</span>
    </div>

    ${firstImage ? `<div class="featured-image"><img src="${firstImage}" alt=""></div>` : ""}

    <article class="article-content">
      ${htmlContent}
    </article>

    <div id="share-buttons">
      ${renderShareButtons(title)}
    </div>
  `;
}

// --------------------------------------
// Utilidades DOM
// --------------------------------------
function getArticleContainer() {
  let el = document.querySelector(".full-article");
  if (!el) el = document.getElementById("article-container");
  return el;
}

function safeSetInnerHTML(html) {
  const el = getArticleContainer();
  if (el) el.innerHTML = html;
}

// --------------------------------------
// Utilidades de contenido
// --------------------------------------
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

// Encuentra la primera imagen válida
function findFirstImageFromAny(content) {
  // Markdown ![]()
  const md = content.match(/!\[[^\]]*]\((.*?)\)/);
  if (md) return md[1];

  // <img src="">
  const htmlImg = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlImg) return htmlImg[1];

  // <figure><img src=""></figure>
  const fig = content.match(/<figure([\s\S]*?)<img[^>]+src=["']([^"']+)["']/i);
  if (fig) return fig[2];

  return null;
}

// Elimina la primera imagen markdown, img o figure del contenido
function removeFirstImage(content) {
  return content
    .replace(/!\[[^\]]*]\((.*?)\)/, "")                         // markdown
    .replace(/<figure[\s\S]*?<\/figure>/i, "")                 // figure
    .replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/i, "");      // html <img>
}

// --------------------------------------
// Redes sociales
// --------------------------------------
function renderShareButtons(title) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(title);
  return `
    <a href="https://twitter.com/intent/tweet?url=${url}&text=${text}" target="_blank">🐦</a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank">📘</a>
    <a href="https://api.whatsapp.com/send?text=${text}%20${url}" target="_blank">💬</a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank">💼</a>
  `;
}
