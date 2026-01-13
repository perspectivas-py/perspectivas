// noticia-script.js — MÓDULO PRO DE NOTICIA v3
console.log("📰 Noticia PRO v3 cargado");

const CONTENT_URL = "/content.json";

// Lee el id (slug) desde ?id=xxx
function getArticleIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  console.log("📍 Slug solicitado:", id);
  return id;
}

// Formato de fecha consistente con el resto del sitio
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// Estimación simple de tiempo de lectura (200 palabras / minuto)
function estimateReadingTime(text) {
  if (!text) return "1 min de lectura";
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min de lectura`;
}

// Renderiza la sección de relacionadas
function renderRelated(allNews, currentArticle) {
  const container = document.getElementById("relacionadas-grid");
  if (!container || !allNews?.length) return;

  const currentId = currentArticle.slug || currentArticle.id;
  const items = allNews
    .filter(a => (a.slug || a.id) !== currentId)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  if (!items.length) {
    container.innerHTML = `<p class="muted">Pronto tendremos más contenido relacionado.</p>`;
    return;
  }

  container.innerHTML = items.map(a => `
    <article class="card">
      <a href="/noticia.html?id=${encodeURIComponent(a.slug || a.id)}">
        <div class="card-img-container">
          <img src="${a.thumbnail}" alt="${a.title}">
        </div>
        <h3>${a.title}</h3>
        <div class="card-meta">${formatDate(a.date)}</div>
      </a>
    </article>
  `).join("");
}

// Carga y renderiza la noticia principal
async function loadArticle() {
  console.log("🚀 Iniciando loadArticle...");
  
  const container = document.getElementById("contenido-noticia");
  if (!container) {
    console.error("❌ No existe contenedor #contenido-noticia");
    return;
  }

  const articleId = getArticleIdFromUrl();
  if (!articleId) {
    console.warn("⚠️ No hay parámetro 'id' en la URL");
    container.innerHTML = `
      <h1>Error</h1>
      <p>No se encontró el artículo solicitado. Por favor, regresa al <a href="/">inicio</a>.</p>
    `;
    return;
  }

  try {
    // Cache busting sencillo para navegador
    console.log("📥 Cargando content.json...");
    const res = await fetch(`${CONTENT_URL}?t=${Date.now()}`);
    
    if (!res.ok) {
      throw new Error(`No se pudo cargar content.json (HTTP ${res.status})`);
    }

    console.log("✅ content.json cargado");
    const data = await res.json();
    
    // Combinar todas las colecciones
    const allNews = [
      ...(data.noticias || []), 
      ...(data.analisis || []), 
      ...(data.programa || [])
    ];
    
    console.log(`📊 Total de artículos disponibles: ${allNews.length}`);

    // Buscamos por slug o por id
    console.log(`🔍 Buscando artículo: "${articleId}"`);
    const article = allNews.find(
      a => (a.slug === articleId) || (a.id === articleId)
    );

    if (!article) {
      console.error(`❌ Artículo no encontrado: "${articleId}"`);
      console.log("Slugs disponibles:", allNews.map(a => a.slug).join(", "));
      
      container.innerHTML = `
        <h1>Error</h1>
        <p>No se pudo encontrar la noticia solicitada.</p>
        <p><a href="/">Volver al inicio</a></p>
      `;
      return;
    }

    console.log("✅ Artículo encontrado:", article.title);

    // Renderizamos el cuerpo desde Markdown usando marked
    let htmlBody = "";
    const bodySource = article.body || "";

    if (typeof marked !== "undefined") {
      console.log("📝 Renderizando markdown con marked.js...");
      htmlBody = marked.parse(bodySource);
    } else {
      console.warn("⚠️ marked.js no está disponible, usando fallback");
      htmlBody = `<p>${bodySource.replace(/\n\n/g, "</p><p>")}</p>`;
    }

    const lectura = estimateReadingTime(bodySource || article.description || "");

    // Actualizamos el <title> del documento
    document.title = `${article.title} | Perspectivas`;

    // Plantilla principal del artículo
    console.log("🎨 Renderizando HTML del artículo...");
    container.innerHTML = `
      <header class="article-header">
        <p class="article-category">${article.category || "Actualidad"}</p>
        <h1>${article.title}</h1>
        <div class="article-meta">
          <span>${formatDate(article.date)}</span>
          <span>·</span>
          <span>${lectura}</span>
        </div>
      </header>

      ${article.thumbnail ? `
      <figure class="article-hero">
        <img src="${article.thumbnail}" alt="${article.title}">
      </figure>
      ` : ""}

      <div class="article-toolbar">
        <div class="article-share">
          <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(article.title)}"
             target="_blank" rel="noopener noreferrer" aria-label="Compartir en X">
            <i class="fab fa-x-twitter"></i>
          </a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}"
             target="_blank" rel="noopener noreferrer" aria-label="Compartir en Facebook">
            <i class="fab fa-facebook-f"></i>
          </a>
          <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' ' + location.href)}"
             target="_blank" rel="noopener noreferrer" aria-label="Compartir en WhatsApp">
            <i class="fab fa-whatsapp"></i>
          </a>
          <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(location.href)}&title=${encodeURIComponent(article.title)}"
             target="_blank" rel="noopener noreferrer" aria-label="Compartir en LinkedIn">
            <i class="fab fa-linkedin-in"></i>
          </a>
        </div>
        <div class="article-reading-time">${lectura}</div>
      </div>

      <section class="article-body">
        ${htmlBody}
      </section>
    `;

    console.log("✅ Artículo renderizado correctamente");

    // Renderizamos noticias relacionadas
    renderRelated(allNews, article);

  } catch (err) {
    console.error("❌ Error al cargar la noticia:", err);
    container.innerHTML = `
      <h1>Error</h1>
      <p>No se pudo cargar el artículo solicitado.</p>
      <p><small>${err.message}</small></p>
      <p><a href="/">Volver al inicio</a></p>
    `;
  }
}

// Ejecutar cuando el DOM esté listo
console.log("⏳ Esperando DOM...");
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadArticle);
} else {
  loadArticle();
}

// Formato de fecha consistente con el resto del sitio
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// Estimación simple de tiempo de lectura (200 palabras / minuto)
function estimateReadingTime(text) {
  if (!text) return "1 min de lectura";
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min de lectura`;
}

// Renderiza la sección de relacionadas
function renderRelated(allNews, currentArticle) {
  const container = document.getElementById("relacionadas-grid");
  if (!container || !allNews?.length) return;

  const items = allNews
    .filter(a => (a.slug || a.id) !== (currentArticle.slug || currentArticle.id))
    .slice(0, 3);

  if (!items.length) {
    container.innerHTML = `<p class="muted">Pronto tendremos más contenido relacionado.</p>`;
    return;
  }

  container.innerHTML = items.map(a => `
    <article class="card">
      <a href="/noticia.html?id=${encodeURIComponent(a.slug || a.id)}">
        <div class="card-img-container">
          <img src="${a.thumbnail}" alt="${a.title}">
        </div>
        <h3>${a.title}</h3>
        <div class="card-meta">${formatDate(a.date)}</div>
      </a>
    </article>
  `).join("");
}

// Carga y renderiza la noticia principal
async function loadArticle() {
  const container = document.getElementById("contenido-noticia");
  if (!container) return;

  const articleId = getArticleIdFromUrl();
  if (!articleId) {
    container.innerHTML = `
      <h1>Error</h1>
      <p>No se encontró el artículo solicitado.</p>
    `;
    return;
  }

  try {
    // Cache busting sencillo para Vercel/navegador
    const res = await fetch(`${CONTENT_URL}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`No se pudo cargar content.json (status ${res.status})`);

    const data = await res.json();
    const allNews = [...(data.noticias || []), ...(data.analisis || []), ...(data.programa || [])];

    // Buscamos por slug o por id
    const article = allNews.find(
      a => (a.slug === articleId) || (a.id === articleId)
    );

    if (!article) {
      container.innerHTML = `
        <h1>Error</h1>
        <p>No se pudo encontrar la noticia con id <code>${articleId}</code>.</p>
      `;
      return;
    }

    // Renderizamos el cuerpo desde Markdown usando marked
    let htmlBody = "";
    const bodySource = article.body || "";

    if (typeof marked !== "undefined") {
      htmlBody = marked.parse(bodySource);
    } else {
      // Fallback ultra simple si por algún motivo marked no está
      htmlBody = `<p>${bodySource.replace(/\n\n/g, "</p><p>")}</p>`;
    }

    const lectura = estimateReadingTime(bodySource || article.description || "");

    // Actualizamos el <title> del documento
    document.title = `${article.title} | Perspectivas`;

    // Plantilla principal del artículo
    container.innerHTML = `
      <header class="article-header">
        <p class="article-category">${article.category || "Actualidad"}</p>
        <h1>${article.title}</h1>
        <div class="article-meta">
          <span>${formatDate(article.date)}</span>
          <span>·</span>
          <span>${lectura}</span>
        </div>
      </header>

      ${article.thumbnail ? `
      <figure class="article-hero">
        <img src="${article.thumbnail}" alt="${article.title}">
      </figure>
      ` : ""}

      <section class="article-body">
        ${htmlBody}
      </section>

      <section class="article-share">
        <span>Compartir:</span>
        <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(article.title)}"
           target="_blank" rel="noopener noreferrer" aria-label="Compartir en X">
          <i class="fab fa-x-twitter"></i>
        </a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}"
           target="_blank" rel="noopener noreferrer" aria-label="Compartir en Facebook">
          <i class="fab fa-facebook-f"></i>
        </a>
        <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' ' + location.href)}"
           target="_blank" rel="noopener noreferrer" aria-label="Compartir en WhatsApp">
          <i class="fab fa-whatsapp"></i>
        </a>
        <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(location.href)}&title=${encodeURIComponent(article.title)}"
           target="_blank" rel="noopener noreferrer" aria-label="Compartir en LinkedIn">
          <i class="fab fa-linkedin-in"></i>
        </a>
      </section>
    `;

    // Renderizamos noticias relacionadas
    renderRelated(allNews, article);

  } catch (err) {
    console.error("Error al cargar la noticia:", err);
    container.innerHTML = `
      <h1>Error</h1>
      <p>No se pudo cargar el artículo solicitado.</p>
    `;
  }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadArticle);
} else {
  loadArticle();
}
