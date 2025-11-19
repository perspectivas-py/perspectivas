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
// Cargar artículo (VERSIÓN ACTUALIZADA)
// --------------------------------------
async function loadArticle(type, id) {
  const path = ARTICLE_CONTENT_PATHS[type] || ARTICLE_CONTENT_PATHS.noticias;

  // --- CORRECCIÓN 3: Añadimos la extensión .md al final del ID para construir la URL correcta ---
  // Ahora el script puede manejar IDs limpios (sin extensión) para todos los tipos de contenido.
  const filename = `${id}.md`;
  
  const encodedFilename = encodeURIComponent(filename).replace(/%2F/g, "/");
  const fileUrl = `https://raw.githubusercontent.com/${ARTICLE_REPO}/${ARTICLE_BRANCH}/${path}/${encodedFilename}`;

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

// --- CORRECCIÓN 1: SE RESTAURA LA FUNCIÓN RENDERARTICLE ---
// Esta función había sido eliminada y es esencial para mostrar el contenido.
// --------------------------------------
function renderArticle(fm, content, type, id) {
  const container = getArticleContainer();
  if (!container) return;

  const title = fm.title || "Sin título";
  const date = formatDateArticle(fm.date);
  const readTime = estimateReadingTime(content);
  const firstImage = findFirstImageFromAny(content);
  let cleanedContent = removeFirstImage(content);
  const htmlContent = window.marked ? window.marked.parse(cleanedContent.trim()) : cleanedContent.trim();

  container.innerHTML = `
    <h1>${title}</h1>

    <div class="article-meta-info">
      <span>${date}</span>
      <span>⏱ ${readTime} min de lectura</span>
    </div>

    ${firstImage ? `<div class="featured-image"><img src="${firstImage}" alt=""></div>` : ""}

    <div id="share-buttons">
      ${renderShareButtons(title)}
    </div>

    <article class="article-content">
      ${htmlContent}
    </article>
  `;
}

// --- CORRECCIÓN 2: SE ELIMINA LA FUNCIÓN DUPLICADA ---
// Ahora solo hay una versión de renderShareButtons, la correcta.
// --------------------------------------
// Redes sociales (VERSIÓN CON ICONOS AGRUPADOS)
// --------------------------------------
function renderShareButtons(title) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(title);
  
  return `
    <span>Compartir:</span>
    <div class="share-icons">
      <a href="https://twitter.com/intent/tweet?url=${url}&text=${text}" target="_blank" aria-label="Compartir en Twitter">
        <i class="fab fa-twitter"></i>
      </a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" aria-label="Compartir en Facebook">
        <i class="fab fa-facebook-f"></i>
      </a>
      <a href="https://api.whatsapp.com/send?text=${text}%20${url}" target="_blank" aria-label="Compartir en WhatsApp">
        <i class="fab fa-whatsapp"></i>
      </a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" aria-label="Compartir en LinkedIn">
        <i class="fab fa-linkedin"></i>
      </a>
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

function findFirstImageFromAny(content) {
  const md = content.match(/!\[[^\]]*]\((.*?)\)/);
  if (md) return md[1];
  const htmlImg = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlImg) return htmlImg[1];
  const fig = content.match(/<figure([\s\S]*?)<img[^>]+src=["']([^"']+)["']/i);
  if (fig) return fig[2];
  return null;
}

function removeFirstImage(content) {
  return content
    .replace(/!\[[^\]]*]\((.*?)\)/, "")
    .replace(/<figure[\s\S]*?<\/figure>/i, "")
    .replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/i, "");
}
