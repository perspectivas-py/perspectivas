// noticia-script.js — MÓDULO PRO DE NOTICIA v3.1
console.log("📰 Noticia PRO v3.1 cargado");

const ARTICLE_CONTENT_URL = "content.json";

const TYPE_LABELS = {
  "noticias": "Actualidad",
  "analisis": "Análisis",
  "programa": "Programa",
  "podcast": "Podcast"
};

function normalizeSlug(value = "") {
  return value
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

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

// Renderiza el bloque de "Claves del día" con hasta 4 bullets accionables
function renderKeyPoints(article) {
  const panel = document.getElementById("article-key-points");
  const list = document.getElementById("article-key-points-list");
  if (!panel || !list) return;

  const candidateSources = [
    article.key_points,
    article.keyPoints,
    article.takeaways,
    article.featured?.highlights
  ];

  const points = candidateSources.find(Array.isArray) || [];
  const normalizedPoints = points
    .map(point => typeof point === "string" ? point.trim() : point)
    .filter(Boolean)
    .slice(0, 4);

  if (!normalizedPoints.length) {
    panel.hidden = true;
    list.innerHTML = "";
    return;
  }

  list.innerHTML = normalizedPoints.map((point, index) => `
    <li class="key-point-item">
      <span class="key-point-index">${String(index + 1).padStart(2, "0")}</span>
      <p>${point}</p>
    </li>
  `).join("");

  panel.hidden = false;
}

// Renderiza el bloque de contexto rápido con una mini línea de tiempo
function renderContextTimeline(article) {
  const panel = document.getElementById("article-context-panel");
  const list = document.getElementById("article-context-timeline");
  if (!panel || !list) return;

  const candidateSources = [
    article.context_timeline,
    article.contextTimeline,
    article.timeline,
    article.context
  ];

  const steps = candidateSources.find(Array.isArray) || [];
  const normalizedSteps = steps
    .map(step => {
      if (!step) return null;
      if (typeof step === "string") {
        return { title: step, detail: "" };
      }
      if (typeof step === "object") {
        return {
          title: step.title || step.label || step.heading || "",
          detail: step.detail || step.description || step.text || "",
          date: step.date || step.when || "",
          status: step.status || step.type || step.stage || "",
          outlook: step.outlook || step.next || step.expectation || ""
        };
      }
      return null;
    })
    .filter(step => step && (step.title || step.detail))
    .slice(0, 4);

  if (!normalizedSteps.length) {
    panel.hidden = true;
    list.innerHTML = "";
    return;
  }

  list.innerHTML = normalizedSteps.map((step, index) => {
    const descriptionParts = [step.detail, step.outlook].filter(Boolean);
    const statusVariant = step.status
      ? step.status.toString().trim().toLowerCase().replace(/\s+/g, "-")
      : "";
    return `
      <li class="context-step">
        <div class="context-step-icon" aria-hidden="true">
          <span class="context-step-dot" data-variant="${statusVariant}"></span>
          ${index < normalizedSteps.length - 1 ? '<span class="context-step-line"></span>' : ""}
        </div>
        <div class="context-step-body">
          <div class="context-step-meta">
            ${step.date ? `<span class="context-step-date">${step.date}</span>` : ""}
            ${step.status ? `<span class="context-step-status">${step.status}</span>` : ""}
          </div>
          <h4>${step.title}</h4>
          ${descriptionParts.length ? `<p>${descriptionParts.join(" ")}</p>` : ""}
        </div>
      </li>
    `;
  }).join("");

  panel.hidden = false;
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
    const normalizedTarget = normalizeSlug(articleId);
    const article = allNews.find(a => {
      const identifiers = [a.slug, a.id].filter(Boolean);
      return identifiers.some(idValue => idValue === articleId || normalizeSlug(idValue) === normalizedTarget);
    });

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

    // Actualizamos el <title>
    document.title = `${article.title} | Perspectivas`;

    // ----------------------------------------------------
    // DETECCIÓN DE MODO CINE (TIPO PROGRAMA / VIDEO)
    // ----------------------------------------------------
    if (article.type === "programa" || article.type === "video") {
        console.log("🎬 Activando MODO CINE / VIDEO");
        document.body.classList.add("cinema-mode");
        
        // Reemplazar main completo para layout personalizado
        const mainWrapper = document.querySelector('.article-main-wrapper');
        if (mainWrapper) {
            
            // Buscar video relacionado (Sidebar)
            const relatedVideos = allNews
               .filter(a => a.type === "programa" && (a.slug || a.id) !== articleId)
               .slice(0, 5); // Tomar 5 videos

            // Obtener URL de embed (limpia)
            let embedSrc = article.embed_url || "";
            if(embedSrc.includes("watch?v=")) {
                embedSrc = embedSrc.replace("watch?v=", "embed/");
            }
            
            // Construir HTML del sidebar lateral
            const sidebarHtml = relatedVideos.map(vid => {
                 let thumb = vid.thumbnail || '/assets/img/default_news.jpg';
                 return `
                 <a href="/noticia.html?type=programa&id=${encodeURIComponent(vid.slug || vid.id)}" class="sidebar-video-card">
                    <div class="sidebar-video-thumb">
                        <img src="${thumb}" alt="${vid.title}">
                    </div>
                    <div class="sidebar-video-info">
                        <h4>${vid.title}</h4>
                        <span class="sidebar-video-time">${formatDate(vid.date)}</span>
                    </div>
                 </a>`;
            }).join("");

            mainWrapper.innerHTML = `
            <div class="cinema-layout-container">
                <!-- COLUMNA PRINCIPAL -->
                <div class="cinema-main-column">
                    
                    <!-- VIDEO PLAYER -->
                    <div class="cinema-video-wrapper">
                         ${ embedSrc ? `<iframe src="${embedSrc}" allowfullscreen allow="autoplay; encrypted-media"></iframe>` : '<p style="color:#fff; padding:2rem; text-align:center;">Video no disponible.</p>' }
                    </div>
                    
                    <!-- HEADER INFO -->
                    <div class="cinema-header">
                        <h1 class="cinema-title">${article.title}</h1>
                        <p class="cinema-subtitle">${article.description || ''}</p>
                        
                        <div class="cinema-meta-row">
                             <span class="cinema-tag">Programa TV</span>
                             <span class="meta-date">${formatDate(article.date)}</span>
                             <span class="meta-share">Comparte esto <i class="fas fa-share-alt" style="margin-left:5px;"></i></span>
                        </div>
                    </div>
                    
                    <!-- DETALLE TEXTO (Si hubiere) -->
                    <div class="article-body-text" style="color: #ccc; max-width: 100%;">
                        ${htmlBody}
                    </div>

                </div>

                <!-- COLUMNA LATERAL (EXPLORAR) -->
                <aside class="cinema-sidebar">
                    <h3 class="cinema-sidebar-title">Explorar más</h3>
                    ${sidebarHtml}
                </aside>
            </div>
            `;
            // Detenemos aquí, ya no ejecutamos el renderizado estándar de noticia
            return; 
        }
    }

    // Resolver Categoría a mostrar (Lógica normal si NO es programa)
    const categoryKey = article.category?.toLowerCase();
    const categoryLabel = CATEGORY_LABELS[categoryKey] || TYPE_LABELS[article.type] || "Actualidad";
    const kickerLabel = (article.kicker && article.kicker.trim()) || categoryLabel;

    // Sub-navegación (Etiquetas en header oscuro)
    const subNav = document.getElementById("sub-navigation");
    if (subNav) {
      subNav.innerHTML = "";
      let subItems = [];

      // 1. Agregar Categoría (si existe)
      if (article.category) {
        const catKey = article.category.toLowerCase();
        const catLabel = kickerLabel || CATEGORY_LABELS[catKey] || article.category;
        subItems.push(`<a href="/categoria.html?cat=${encodeURIComponent(article.category)}" class="sub-nav-link" style="font-weight:800; color: #fff;">${(catLabel || "").toUpperCase()}</a>`);

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

    // Plantilla principal del artículo - ESTILO TELEGRAPH (3 COLUMNAS)
    console.log("🎨 Renderizando HTML del artículo...");
    console.log("📊 Datos del artículo:", {
      title: article.title,
      author: article.author,
      date: article.date,
      tags: article.tags,
      thumbnail: article.thumbnail,
      caption: article.caption
    });
    
    // COLUMNA IZQUIERDA (STICKY): METADATA NUEVA - DISEÑO MODERNO
    
    // Preparar datos para el sidebar
    const pageUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(article.title);
    
    // Fecha completa
    const fullDateOptions = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    let fullDateStr = "";
    if (article.date) {
        // Ajustamos la zona horaria si es necesario, o lo dejamos por defecto
        fullDateStr = new Date(article.date).toLocaleDateString('es-PY', fullDateOptions) + " GMT"; 
    }

    // Datos de autor (Mock / Lógica simple)
    const authorName = article.author || "Redacción Perspectivas";
    const authorRole = authorName.includes("Perspectivas") ? "Equipo Editorial" : "Colaborador Especial";
    
    // Lógica inteligente para imagen de autor
    let authorImg = "assets/img/perspectivas-logo.jpeg"; // Default
    
    if (article.author_image) {
        // 1. Si el artículo tiene foto de autor explícita (cargada via CMS)
        authorImg = article.author_image;
    } else if (authorName.includes("Perspectivas")) {
        // 2. Si es de la casa
        authorImg = "assets/img/perspectivas-logo.jpeg";
    } else {
        // 3. Fallback: Avatar generado con iniciales
        authorImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=f0f0f0&color=333&size=128`;
    }

    let sidebarHtml = `<div class="article-meta-sidebar-new">`;
    
    // 1. Autor
    sidebarHtml += `
      <div class="author-profile">
        <img src="${authorImg}" class="author-avatar" alt="${authorName}">
        <div class="author-details">
          <span class="author-name">${authorName}</span>
          <span class="author-role">${authorRole}</span>
        </div>
      </div>`;
    
    // 2. Fecha
    sidebarHtml += `
      <div class="sidebar-date-section">
        <span class="article-date-full">${fullDateStr}</span>
      </div>`;
    
    // 3. Temas (Tags)
    if (article.tags && article.tags.length > 0) {
      sidebarHtml += `
        <div class="sidebar-topics-section">
          <span class="sidebar-label">Temas relacionados</span>
          <div class="topics-list-text">
            ${article.tags.map(t => `<a href="categoria.html?tag=${encodeURIComponent(t)}" class="topic-link">${t}</a>`).join(", ")}
          </div>
        </div>`;
    }
    
    // 4. Acciones (Lectura, Bookmark) - SIN GIFT
    sidebarHtml += `
      <div class="sidebar-actions-section">
         <div style="font-size: 0.85rem; margin-bottom: 0.75rem; color: #555; display:flex; align-items:center; gap:0.5rem">
            <i class="far fa-clock"></i> ${lectura}
         </div>
         <div class="action-row">
            <button class="action-icon-btn" aria-label="Guardar" title="Guardar para leer después">
              <i class="far fa-bookmark"></i>
            </button>
            <button class="action-icon-btn" aria-label="Comentarios" title="Ver comentarios">
              <i class="far fa-comment"></i> <span style="font-size: 0.8em">3</span>
            </button>
         </div>
      </div>`;

    // 5. Redes Sociales (Circulares)
    sidebarHtml += `
      <div class="sidebar-social-row">
        <a href="https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}" target="_blank" class="social-circle-btn" aria-label="X">
            <i class="fab fa-x-twitter"></i>
        </a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${pageUrl}" target="_blank" class="social-circle-btn" aria-label="Facebook">
            <i class="fab fa-facebook-f"></i>
        </a>
         <a href="https://wa.me/?text=${pageTitle}%20${pageUrl}" target="_blank" class="social-circle-btn" aria-label="WhatsApp">
            <i class="fab fa-whatsapp"></i>
        </a>
        <a href="mailto:?subject=${pageTitle}&body=${pageUrl}" class="social-circle-btn" aria-label="Email">
            <i class="far fa-envelope"></i>
        </a>
      </div>`;
    
    sidebarHtml += `</div>`; // Cierre sidebar
    
    const sidebarLeftContainer = document.getElementById("sidebar-left-content");
    if (sidebarLeftContainer) {
      sidebarLeftContainer.innerHTML = sidebarHtml;
    }
    
    // COLUMNA CENTRAL: TÍTULO + FOTO + CONTENIDO
    // 1. Inyectar título
    const titleEl = document.getElementById("article-title-main");
    if (titleEl) {
      titleEl.textContent = article.title;
    }

    // 1b. Inyectar subtítulo (si existe elemento y contenido)
    const subtitleEl = document.getElementById("article-subtitle");
    if (subtitleEl) {
      subtitleEl.textContent = article.description || article.summary_short || article.summary || "";
    }
    
    // 2. Inyectar foto
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
    
    // 3. Inyectar contenido del artículo
    const bodyContainer = document.getElementById("article-body-content");
    if (bodyContainer) {
      bodyContainer.innerHTML = `<section class="article-body">${htmlBody}</section>`;
    }

    renderKeyPoints(article);
    renderContextTimeline(article);

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
function initNoticia() {
  console.log("🎬 Inicializando noticia-script.js");
  loadArticle();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNoticia);
} else {
  initNoticia();
}
