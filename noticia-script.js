// --------------------------------------
// Configuración local para página de noticia
// --------------------------------------
const ARTICLE_REPO = 'perspectivas-py/perspectivas';
const ARTICLE_BRANCH = 'main';

// --- MAPA DE RUTAS CORRECTO ---
const ARTICLE_CONTENT_PATHS = {
  noticias: "content/noticias/posts",
  analisis: "content/analisis/_posts",
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
// Cargar artículo (ANTI-CACHÉ Y ROBUSTO)
// --------------------------------------
async function loadArticle(type, id) {
  const path = ARTICLE_CONTENT_PATHS[type] || ARTICLE_CONTENT_PATHS.noticias;
  
  // Manejo de IDs con o sin extensión .md
  const filename = id.endsWith('.md') ? id : `${id}.md`;
  const encodedFilename = encodeURIComponent(filename).replace(/%2F/g, "/");
  
  const fileUrl = `https://raw.githubusercontent.com/${ARTICLE_REPO}/${ARTICLE_BRANCH}/${path}/${encodedFilename}`;

  const markdown = await fetchMarkdown(fileUrl);
  const { frontmatter, content } = parseFrontmatterArticle(markdown);

  renderArticle(frontmatter, content, type, id);
}

// --------------------------------------
// Fetch (ANTI-CACHÉ)
// --------------------------------------
async function fetchMarkdown(url) {
  const cacheBustingUrl = `${url}?t=${new Date().getTime()}`;
  const res = await fetch(cacheBustingUrl);
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
    frontmatter[key.trim()] = rest.join(":").trim().replace(/^['"]|['"]$/g, '');
  });

  const content = md.replace(match[0], "").trim();
  return { frontmatter, content };
}

// --------------------------------------
// Render (CON SOPORTE INTELIGENTE PARA VIDEO)
// --------------------------------------
function renderArticle(fm, content, type, id) {
  const container = getArticleContainer();
  if (!container) return;

  const title = fm.title || "Sin título";
  const date = formatDateArticle(fm.date);
  const readTime = estimateReadingTime(content);
  
  const firstImage = findFirstImageFromAny(content);
  let cleanedContent = removeFirstImage(content);

  // Buscamos VIDEO (Ahora soporta el código iframe completo)
  const videoId = fm.embed_url ? extractYoutubeId(fm.embed_url) : null;

  const htmlContent = window.marked ? window.marked.parse(cleanedContent.trim()) : cleanedContent.trim();

  // Lógica: Video mata Imagen. Si hay video, se muestra el video.
  let featuredMedia = '';
  
  if (videoId) {
    featuredMedia = `
      <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000; margin-bottom: 25px; border-radius: 4px;">
        <iframe 
          src="https://www.youtube.com/embed/${videoId}" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>`;
  } else if (firstImage) {
    featuredMedia = `<div class="featured-image"><img src="${firstImage}" alt="${title}"></div>`;
  }

  container.innerHTML = `
    <h1>${title}</h1>

    <div class="article-meta-info">
      <span>${date}</span>
      <span>⏱ ${readTime} min de lectura</span>
    </div>

    ${featuredMedia}

    <div id="share-buttons">
      ${renderShareButtons(title)}
    </div>

    <article class="article-content">
      ${htmlContent}
    </article>
  `;
}

// --------------------------------------
// EXTRACTOR DE ID YOUTUBE (MEJORADO)
// --------------------------------------
function extractYoutubeId(urlOrCode) {
  if (!urlOrCode) return null;

  // 1. Si el usuario pegó todo el código <iframe>, extraemos solo la URL del 'src'
  if (urlOrCode.includes('<iframe')) {
    const srcMatch = urlOrCode.match(/src=["']([^"']+)["']/);
    if (srcMatch && srcMatch[1]) {
      urlOrCode = srcMatch[1]; // Ahora trabajamos solo con la URL limpia
    }
  }

  // 2. Extraemos el ID del video de la URL
  let videoId = null;
  if (urlOrCode.includes('youtu.be/')) {
    videoId = urlOrCode.split('youtu.be/')[1].split('?')[0];
  } else if (urlOrCode.includes('v=')) {
    videoId = urlOrCode.split('v=')[1].split('&')[0];
  } else if (urlOrCode.includes('/embed/')) {
    videoId = urlOrCode.split('/embed/')[1].split('?')[0];
  }
  return videoId;
}

// --------------------------------------
// Redes sociales
// --------------------------------------
function renderShareButtons(title) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(title);
  
  return `
    <span>Compartir:</span>
    <div class="share-icons">
      <a href="https://twitter.com/intent/tweet?url=${url}&text=${text}" target="_blank" aria-label="Compartir en Twitter"><i class="fab fa-twitter"></i></a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" aria-label="Compartir en Facebook"><i class="fab fa-facebook-f"></i></a>
      <a href="https://api.whatsapp.com/send?text=${text}%20${url}" target="_blank" aria-label="Compartir en WhatsApp"><i class="fab fa-whatsapp"></i></a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" aria-label="Compartir en LinkedIn"><i class="fab fa-linkedin"></i></a>
    </div>
  `;
}

// --------------------------------------
// Utilidades DOM y Contenido
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
function formatDateArticle(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });
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
