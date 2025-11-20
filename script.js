/* script.js - Perspectivas Engine v2.3 (Fix Rutas) */

// 1. CONFIGURACIÓN Y RUTAS
const CONFIG = {
  username: 'perspectivas-py', 
  repo: 'perspectivas',
  limitNews: 10,
};

// DEFINICIÓN EXACTA DE TUS CARPETAS EN GITHUB
const PATHS = {
  noticias: 'content/noticias/posts',
  programa: 'content/programa/posts', 
  analisis: 'content/analisis/posts'  
};

const BASE_API = `https://api.github.com/repos/${CONFIG.username}/${CONFIG.repo}/contents`;

// 2. UTILIDADES
const getCacheBust = () => `?t=${Date.now()}`;

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric", month: "short", year: "numeric"
    });
  } catch (e) { return dateString; }
};

const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Parsear Frontmatter
const parseMarkdown = (text) => {
  const frontmatterRegex = /^---([\s\S]*?)---/;
  const match = text.match(frontmatterRegex);
  if (!match) return { attributes: {}, body: text };

  const frontmatterBlock = match[1];
  const body = text.replace(frontmatterRegex, '').trim();
  const attributes = {};

  frontmatterBlock.split('\n').forEach(line => {
    const [key, ...value] = line.split(':');
    if (key && value) {
      let val = value.join(':').trim();
      val = val.replace(/^['"](.*)['"]$/, '$1');
      attributes[key.trim()] = val;
    }
  });
  return { attributes, body };
};

// 3. FETCHING
async function fetchCollection(folderPath, sectionName) {
  try {
    // Llamada a la API para listar archivos
    const apiUrl = `${BASE_API}/${folderPath}${getCacheBust()}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error(`Error HTTP: ${response.status} buscando en: ${folderPath}`);
      throw new Error(`No encontrada: ${folderPath}`);
    }
    
    const files = await response.json();
    
    // Filtrar solo MD y evitar subcarpetas extrañas
    const mdFiles = files.filter(f => f.name.endsWith('.md'));

    const items = await Promise.all(mdFiles.map(async (file) => {
      const res = await fetch(file.download_url);
      const text = await res.text();
      const { attributes, body } = parseMarkdown(text);
      return {
        ...attributes,
        body,
        slug: file.name.replace('.md', ''),
        folder: folderPath, // Guardamos la ruta completa para saber dónde buscar luego
        category: attributes.category || 'General',
        date: attributes.date || new Date().toISOString(),
        section: sectionName
      };
    }));

    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error(`Fallo crítico cargando ${sectionName}:`, error);
    return [];
  }
}

// Fetch Individual (Router)
async function fetchSinglePost(folderPath, slug) {
  try {
    const apiUrl = `${BASE_API}/${folderPath}/${slug}.md${getCacheBust()}`;
    const fileRes = await fetch(apiUrl);
    if (!fileRes.ok) throw new Error("Post no encontrado");
    const fileData = await fileRes.json();
    const contentRes = await fetch(fileData.download_url);
    return parseMarkdown(await contentRes.text());
  } catch (error) {
    console.error(error);
    return null;
  }
}

// 4. RENDER UI (HOME)
const createCardHTML = (item, showVideo) => {
  const link = `post.html?id=${item.slug}&folder=${item.folder}`; // Pasamos la carpeta correcta en la URL
  let mediaHTML = '';

  if (showVideo && item.embed_url && getYoutubeId(item.embed_url)) {
    mediaHTML = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${getYoutubeId(item.embed_url)}" frameborder="0" allowfullscreen></iframe></div>`;
  } else {
    const img = item.thumbnail || "https://placehold.co/600x400?text=Perspectivas";
    mediaHTML = `<div class="card-img-container"><a href="${link}"><img src="${img}" loading="lazy"></a></div>`;
  }

  const excerpt = item.description || (item.body ? item.body.substring(0, 100) + '...' : '');

  return `
    <article class="card">
      ${mediaHTML}
      <div class="card-content">
        <small class="card-meta">${formatDate(item.date)} | ${item.category}</small>
        <h3><a href="${link}">${item.title}</a></h3>
      </div>
    </article>
  `;
};

const setupFilters = (items, gridId) => {
  const container = document.getElementById('category-filters');
  if (!container) return;
  const categories = ['Todas', ...new Set(items.map(i => i.category))];
  
  container.innerHTML = categories.map(cat => 
    `<button class="filter-btn ${cat === 'Todas' ? 'active' : ''}" data-cat="${cat}">${cat}</button>`
  ).join('');

  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filtered = btn.dataset.cat === 'Todas' 
        ? items.slice(0, CONFIG.limitNews) 
        : items.filter(i => i.category === btn.dataset.cat);
      const grid = document.getElementById(gridId);
      if(grid) grid.innerHTML = filtered.map(i => createCardHTML(i)).join('');
    });
  });
};

async function initHome() {
  // Usamos las rutas corregidas del objeto PATHS
  const allNews = await fetchCollection(PATHS.noticias, 'noticias');
  const allProgram = await fetchCollection(PATHS.programa, 'programa');
  const allAnalysis = await fetchCollection(PATHS.analisis, 'analisis');

  // Render Hero
  if (allNews.length > 0) {
    const hero = allNews[0];
    const heroContainer = document.querySelector('.featured-card-bbc');
    if (heroContainer) {
      heroContainer.innerHTML = `
        <a href="post.html?id=${hero.slug}&folder=${hero.folder}">
          <img src="${hero.thumbnail || ''}" alt="${hero.title}">
          <h2>${hero.title}</h2>
          <p class="featured-excerpt">${hero.description || ''}</p>
        </a>`;
    }
    
    const sidebar = document.getElementById('top-list-bbc');
    if (sidebar) {
      sidebar.innerHTML = allNews.slice(1, 4).map(item => `
        <li><a href="post.html?id=${item.slug}&folder=${item.folder}">
          <h4>${item.title}</h4><small>${formatDate(item.date)}</small>
        </a></li>`).join('');
    }

    const grid = document.getElementById('news-grid');
    if (grid) {
        // Render inicial
        grid.innerHTML = allNews.slice(4, 4 + CONFIG.limitNews).map(i => createCardHTML(i)).join('');
        // Configurar filtros sobre las noticias RESTANTES (excluyendo hero y sidebar)
        setupFilters(allNews.slice(4), 'news-grid');
    }
  } else {
    // Manejo de error visual si no carga nada
    const heroContainer = document.querySelector('.featured-card-bbc');
    if(heroContainer) heroContainer.innerHTML = "<p>No se encontraron noticias. Verifica la conexión o la configuración.</p>";
  }

  const progGrid = document.getElementById('program-grid');
  if (progGrid) progGrid.innerHTML = allProgram.slice(0, 6).map(i => createCardHTML(i, true)).join(''); // True para video
  
  const anaGrid = document.getElementById('analisis-grid');
  if (anaGrid) anaGrid.innerHTML = allAnalysis.slice(0, 4).map(i => createCardHTML(i)).join('');
}

// 5. RENDER POST (DETALLE)
async function initPost() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('id');
  // Recuperamos la carpeta desde la URL, si no existe, intentamos adivinar con la ruta de noticias
  const folder = params.get('folder') || PATHS.noticias; 
  const container = document.getElementById('article-detail');

  if (!slug || !container) return;

  const data = await fetchSinglePost(folder, slug);
  
  if (!data) {
    container.innerHTML = `
      <div style="text-align:center; padding:4rem 0;">
        <h3>Error al cargar noticia</h3>
        <p>Es posible que la ruta del archivo haya cambiado.</p>
        <a href="index.html" style="color:red;">Volver al inicio</a>
      </div>`;
    return;
  }

  const { attributes, body } = data;
  document.title = `${attributes.title} | Perspectivas`;
  
  // Cargar librería Marked dinámicamente si no está
  if(typeof marked === 'undefined') {
     await import('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
  }
  const htmlContent = marked.parse(body);
  
  let videoHTML = '';
  if (attributes.embed_url && getYoutubeId(attributes.embed_url)) {
      videoHTML = `<div class="article-video video-wrapper"><iframe src="https://www.youtube.com/embed/${getYoutubeId(attributes.embed_url)}" frameborder="0" allowfullscreen></iframe></div>`;
  }

  container.innerHTML = `
    <header class="article-header">
      <span class="article-category">${attributes.category || 'Noticia'}</span>
      <h1 class="article-title">${attributes.title}</h1>
      <time class="article-meta">${formatDate(attributes.date)} | ${attributes.author || 'Redacción'}</time>
    </header>
    ${videoHTML}
    ${!videoHTML && attributes.thumbnail ? `<img src="${attributes.thumbnail}" alt="${attributes.title}">` : ''}
    <div class="article-content">${htmlContent}</div>
  `;
}

// 6. INICIO
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('post.html')) {
    initPost();
  } else {
    initHome();
    const menuToggle = document.getElementById('menu-toggle');
    if(menuToggle) {
      menuToggle.addEventListener('click', () => {
        document.getElementById('nav-list').classList.toggle('active');
      });
    }
  }
});
