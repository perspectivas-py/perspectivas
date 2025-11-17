// --------------------------------------
// Configuración Global
// --------------------------------------
const REPO = 'perspectivas-py/perspectivas';
const BRANCH = 'main';

const CONTENT_PATHS = {
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
    document.getElementById("article-container").innerHTML = `
      <h1>Error</h1><p>No se encontró el identificador del artículo.</p>
    `;
    return;
  }

  try {
    await loadArticle(type, id);
  } catch (error) {
    console.error(error);
    document.getElementById("article-container").innerHTML = `
      <h1>Error</h1><p>No se pudo cargar el artículo solicitado.</p>
    `;
  }
});

// --------------------------------------
// Función principal
// --------------------------------------
async function loadArticle(type, id) {
  const path = CONTENT_PATHS[type] || CONTENT_PATHS.noticias;

  // --- FIX CRÍTICO PARA ARCHIVOS CON TILDES Y Ñ ---
  const encodedId = encodeURIComponent(id).replace(/%2F/g, "/");
  const fileUrl = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}/${encodedId}`;

  const markdown = await fetchMarkdown(fileUrl);
  const { frontmatter, content } = parseFrontmatter(markdown);

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
// Parse Frontmatter
// --------------------------------------
function parseFrontmatter(md) {
  const match = /^---\s*([\s\S]+?)\s*---/.exec(md);
  if (!match) return { frontmatter: {}, content: md };

  const frontmatter = {};
  const fmLines = match[1].split("\n");

  fmLines.forEach(line => {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) return;
    frontmatter[key.trim()] = rest.join(":").trim().replace(/"/g, "");
  });

  const content = md.replace(match[0], "").trim();
  return { frontmatter, content };
}

// --------------------------------------
// Render Article
// --------------------------------------
function renderArticle(fm, content, type, id) {
  const container = document.getElementById("article-container");
  const title = fm.title || "Sin título";
  const date = formatDate(fm.date);
  const readTime = estimateReadingTime(content);
  const image = findFirstImage(content);
  const htmlContent = marked.parse(content);

  container.innerHTML = `
    <h1>${title}</h1>

    <div class="article-meta-info">
      <span>${date}</span>
      <span>⏱ ${readTime} min de lectura</span>
    </div>

    ${image ? `<div class="featured-image"><img src="${image}" alt="" /></div>` : ""}

    <article class="article-content">${htmlContent}</article>

    <div id="share-buttons">
      ${renderShareButtons(title, type, id)}
    </div>
  `;
}

// --------------------------------------
// Utilidades
// --------------------------------------
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function estimateReadingTime(text) {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200)); // 200 palabras por minuto
}

function findFirstImage(content) {
  const match = content.match(/!\[[^\]]*\]\((.*?)\)/);
  return match ? match[1] : null;
}

function renderShareButtons(title, type, id) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(title);

  return `
    <a href="https://twitter.com/intent/tweet?url=${url}&text=${text}" target="_blank">🐦</a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank">📘</a>
    <a href="https://api.whatsapp.com/send?text=${text}%20${url}" target="_blank">💬</a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank">💼</a>
  `;
}
