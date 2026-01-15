// noticia-script.js — MÓDULO PRO DE NOTICIA v3.1
console.log("📰 Noticia PRO v3.1 cargado");

const ARTICLE_CONTENT_URL = "content.json";

const CATEGORY_LABELS = {
  "macro": "Macroeconomía",
  "mercados-inversion": "Mercados e Inversión",
  "politica-economica": "Política Económica",
  "empresas": "Empresas",
  "empleo": "Empleo",
  "finanzas-personales": "Finanzas Personales",
  "educacion-financiera": "Educación Financiera",
  "actualidad": "Actualidad",
  "economia": "Economía",
  "negocios": "Negocios"
};

const TYPE_LABELS = {
  "noticias": "Actualidad",
  "analisis": "Análisis",
  "programa": "Programa",
  "podcast": "Podcast"
};

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

  // Filtrar el actual y mezclar aleatoriamente
  const items = allNews
    .filter(a => (a.slug || a.id) !== currentId)
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  if (!items.length) {
    container.innerHTML = `<p class="muted">Pronto tendremos más contenido relacionado.</p>`;
    return;
  }

  container.innerHTML = items.map(a => `
    <article class="related-card">
      <a href="/noticia.html?id=${encodeURIComponent(a.slug || a.id)}">
        <div class="related-card-img">
          <img src="${a.thumbnail}" alt="${a.title}">
        </div>
        <div class="related-card-content">
          <h4>${a.title}</h4>
          <span class="related-card-date">${formatDate(a.date)}</span>
        </div>
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
  console.log("📍 Article ID:", articleId);
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
    const res = await fetch(`${ARTICLE_CONTENT_URL}?t=${Date.now()}`);

    if (!res.ok) {
      throw new Error(`No se pudo cargar content.json (HTTP ${res.status})`);
    }

    console.log("✅ content.json cargado");
    const data = await res.json();

    // Combinar todas las colecciones
    const allNews = [
      ...(data.noticias || []),
      ...(data.analisis || []),
      ...(data.programa || []),
      ...(data.podcast || [])
    ];

    console.log(`📊 Total de artículos disponibles: ${allNews.length}`);

    // Buscamos por slug o por id
    console.log(`🔍 Buscando artículo: "${articleId}"`);
    const article = allNews.find(
      a => (a.slug === articleId) || (a.id === articleId)
    );

    if (!article) {
      console.error(`❌ Artículo no encontrado: "${articleId}"`);
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

    // Resolver Categoría a mostrar
    const categoryKey = article.category?.toLowerCase();
    const categoryLabel = CATEGORY_LABELS[categoryKey] || TYPE_LABELS[article.type] || "Actualidad";

    // Generar HTML de etiquetas
    const tagsHtml = (article.tags && article.tags.length > 0)
      ? `
      <div class="article-tags">
        ${article.tags.map(t => `<span class="tag-badge">#${t}</span>`).join("")}
      </div>`
      : "";

    // Sub-navegación (Etiquetas en header oscuro)
    const subNav = document.getElementById("sub-navigation");
    if (subNav) {
      subNav.innerHTML = "";
      let subItems = [];

      // 1. Agregar Categoría (si existe)
      if (article.category) {
        const catKey = article.category.toLowerCase();
        const catLabel = CATEGORY_LABELS[catKey] || article.category;
        subItems.push(`<a href="/categoria.html?cat=${encodeURIComponent(article.category)}" class="sub-nav-link" style="font-weight:800; color: #fff;">${catLabel.toUpperCase()}</a>`);

        // Separador sutil
        if (article.tags && article.tags.length > 0) {
          subItems.push('<span style="opacity:0.25; color: white;">|</span>');
        }
      }

      // 2. Agregar Tags
      if (article.tags && article.tags.length > 0) {
        article.tags.forEach(t => {
          subItems.push(`<a href="/categoria.html?tag=${encodeURIComponent(t)}" class="sub-nav-link">#${t}</a>`);
        });
      }

      if (subItems.length > 0) {
        subNav.innerHTML = subItems.join("");
        subNav.hidden = false;
      } else {
        subNav.hidden = true;
      }
    }

    // Plantilla principal del artículo - ESTILO TELEGRAPH
    console.log("🎨 Renderizando HTML del artículo...");
    console.log("📊 Datos del artículo:", {
      title: article.title,
      author: article.author,
      date: article.date,
      tags: article.tags,
      thumbnail: article.thumbnail,
      caption: article.caption
    });
    
    // HEADER: METADATA IZQUIERDA + FOTO DERECHA
    // 1. Título principal
    const titleEl = document.getElementById("article-title-main");
    if (titleEl) {
      titleEl.textContent = article.title;
    }
    
    // 2. Metadata (Autor, Fecha, Etiquetas, Tiempo lectura, Iconos)
    let metadataHtml = `<div class="article-meta-header">`;
    
    // Autor
    if (article.author) {
      metadataHtml += `
        <div class="meta-item author-section">
          <span class="meta-label">POR</span>
          <span class="author-name">${article.author}</span>
        </div>`;
    }
    
    // Fecha
    metadataHtml += `
      <div class="meta-item date-section">
        <span class="meta-label">FECHA</span>
        <span class="article-date">${formatDate(article.date)}</span>
      </div>`;
    
    // Etiquetas
    if (article.tags && article.tags.length > 0) {
      metadataHtml += `
        <div class="meta-item tags-section">
          <span class="meta-label">TEMAS</span>
          <div class="tags-list">
            ${article.tags.map(t => `<span class="tag-badge">#${t}</span>`).join("")}
          </div>
        </div>`;
    }
    
    // Tiempo de lectura
    metadataHtml += `
      <div class="meta-item reading-time-section">
        <span class="reading-time">${lectura}</span>
      </div>`;
    
    // Iconos de compartir (redes sociales)
    const pageUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(article.title);
    metadataHtml += `
      <div class="meta-item share-section">
        <span class="meta-label">COMPARTIR</span>
        <div class="share-icons">
          <a href="https://www.facebook.com/sharer/sharer.php?u=${pageUrl}" target="_blank" class="share-icon facebook" title="Compartir en Facebook">
            <i class="fab fa-facebook-f"></i>
          </a>
          <a href="https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}" target="_blank" class="share-icon twitter" title="Compartir en Twitter/X">
            <i class="fab fa-x-twitter"></i>
          </a>
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}" target="_blank" class="share-icon linkedin" title="Compartir en LinkedIn">
            <i class="fab fa-linkedin-in"></i>
          </a>
          <a href="https://wa.me/?text=${pageTitle}%20${pageUrl}" target="_blank" class="share-icon whatsapp" title="Compartir en WhatsApp">
            <i class="fab fa-whatsapp"></i>
          </a>
        </div>
      </div>`;
    
    metadataHtml += `</div>`;
    
    const metadataContainer = document.getElementById("article-metadata-content");
    if (metadataContainer) {
      metadataContainer.innerHTML = metadataHtml;
    }
    
    // 3. Foto principal (en la columna derecha del header)
    const heroFigure = document.getElementById("article-hero-figure");
    if (heroFigure) {
      if (article.thumbnail) {
        heroFigure.innerHTML = `
          <img src="${article.thumbnail}" alt="${article.title}">
          ${article.caption ? `<figcaption>${article.caption}</figcaption>` : ""}`;
      } else {
        heroFigure.innerHTML = `<p style="padding: 20px;">Imagen no disponible</p>`;
      }
    }
    
    // 4. Contenido principal del artículo
    container.innerHTML = `
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
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadArticle);
} else {
  loadArticle();
}
