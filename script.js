/* script.js - Perspectivas Engine v2.2 (Router & Detail View) */

// 1. CONFIGURACIÓN
const CONFIG = {
  username: 'perspectivas-py',
  repo: 'perspectivas',
  limitNews: 10,
};

const BASE_API = `https://api.github.com/repos/${CONFIG.username}/${CONFIG.repo}/contents/content`;

// 2. UTILIDADES
const getCacheBust = () => `?t=${Date.now()}`;

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric"
  });
};

const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Parsear Markdown y Frontmatter
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

// 3. API FETCHING
async function fetchCollection(folder) {
  try {
    const response = await fetch(`${BASE_API}/${folder}${getCacheBust()}`);
    if (!response.ok) throw new Error(`Error folder ${folder}`);
    const files = await response.json();
    const mdFiles = files.filter(f => f.name.endsWith('.md'));

    const items = await Promise.all(mdFiles.map(async (file) => {
      const res = await fetch(file.download_url);
      const text = await res.text();
      const { attributes, body } = parseMarkdown(text);
      return {
        ...attributes,
        body,
        slug: file.name.replace('.md', ''),
        folder: folder,
        category: attributes.category || 'General',
        date: attributes.date || new Date().toISOString()
      };
    }));

    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Función específica para cargar UN solo post (Detalle)
async function fetchSinglePost(folder, slug) {
  try {
    // Construimos la URL directa al archivo "raw" de GitHub user content o vía API
    // Usaremos la API para asegurar consistencia con la caché
    const apiUrl = `${BASE_API}/${folder}/${slug}.md${getCacheBust()}`;
    
    // Fetch metadata del archivo para obtener el download_url
    const fileRes = await fetch(apiUrl);
    if (!fileRes.ok) throw new Error("Post no encontrado");
    const fileData = await fileRes.json();

    // Fetch contenido raw
    const contentRes = await fetch(fileData.download_url);
    const text = await contentRes.text();
    return parseMarkdown(text);
  } catch (error) {
    console.error("Error loading post:", error);
    return null;
  }
}

// 4. RENDERIZADO HOME (UI)
const createCardHTML = (item, showVideo) => {
  let mediaHTML = '';
  const link = `post.html?id=${item.slug}&folder=${item.folder}`;
  
  if (showVideo && item.embed_url && getYoutubeId(item.embed_url)) {
    mediaHTML = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${getYoutubeId(item.embed_url)}" frameborder="0" allowfullscreen></iframe></div>`;
  } else {
    const img = item.thumbnail || "https://placehold.co/600x400?text=Perspectivas";
    mediaHTML = `<div class="card-img-container"><a href="${link}"><img src="${img}" loading="lazy"></a></div>`;
  }

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

async function initHome() {
  console.log("Iniciando HOME...");
  const allNews = await fetchCollection('noticias');
  const allProgram = await fetchCollection('programa');
  const allAnalysis = await fetchCollection('analisis');

  // Hero
  if (allNews.length > 0) {
    const hero = allNews[0];
    const heroContainer = document.querySelector('.featured-card-bbc');
    if (heroContainer) {
      heroContainer.innerHTML = `
        <a href="post.html?id=${hero.slug}&folder=noticias">
          <img src="${hero.thumbnail || ''}" alt="${hero.title}">
          <h2>${hero.title}</h2>
          <p class="featured-excerpt">${hero.description || ''}</p>
        </a>`;
    }
    
    // Sidebar
    const sidebar = document.getElementById('top-list-bbc');
    if (sidebar) {
      sidebar.innerHTML = allNews.slice(1, 4).map(item => `
        <li><a href="post.html?id=${item.slug}&folder=noticias">
          <h4>${item.title}</h4><small>${formatDate(item.date)}</small>
        </a></li>`).join('');
    }

    // Grid Noticias
    const grid = document.getElementById('news-grid');
    if (grid) grid.innerHTML = allNews.slice(4, 4 + CONFIG.limitNews).map(i => createCardHTML(i)).join('');
  }

  // Grids Programa y Análisis
  const progGrid = document.getElementById('program-grid');
  if (progGrid) progGrid.innerHTML = allProgram.slice(0, 6).map(i => createCardHTML(i, true)).join('');
  
  const anaGrid = document.getElementById('analisis-grid');
  if (anaGrid) anaGrid.innerHTML = allAnalysis.slice(0, 4).map(i => createCardHTML(i)).join('');
}

// 5. RENDERIZADO POST (DETALLE)
async function initPost() {
  console.log("Iniciando DETALLE...");
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('id');
  const folder = params.get('folder') || 'noticias'; // Default a noticias
  const container = document.getElementById('article-detail');

  if (!slug || !container) return;

  const data = await fetchSinglePost(folder, slug);
  
  if (!data) {
    container.innerHTML = "<p>Lo sentimos, no pudimos cargar la noticia. Verifica tu conexión.</p>";
    return;
  }

  const { attributes, body } = data;
  document.title = `${attributes.title} | Perspectivas`;

  // Parsear Markdown a HTML usando la librería 'marked'
  const htmlContent = marked.parse(body);
  
  // Verificar si hay video principal
  let videoHTML = '';
  if (attributes.embed_url) {
    const vId = getYoutubeId(attributes.embed_url);
    if (vId) {
      videoHTML = `
        <div class="article-video video-wrapper">
          <iframe src="https://www.youtube.com/embed/${vId}" frameborder="0" allowfullscreen></iframe>
        </div>`;
    }
  }

  // Render final
  container.innerHTML = `
    <header class="article-header">
      <span class="article-category">${attributes.category || 'Noticia'}</span>
      <h1 class="article-title">${attributes.title}</h1>
      <time class="article-meta">${formatDate(attributes.date)} | Por ${attributes.author || 'Redacción'}</time>
    </header>
    
    ${videoHTML}
    
    ${!videoHTML && attributes.thumbnail ? `<img src="${attributes.thumbnail}" alt="${attributes.title}">` : ''}
    
    <div class="article-content">
      ${htmlContent}
    </div>
  `;
}

// 6. ROUTER PRINCIPAL
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  // Detectar si estamos en Home (index.html o raíz /)
  if (path.includes('post.html')) {
    initPost();
  } else {
    // Asumimos Home para index.html o raíz
    initHome();
    
    // Menú móvil solo necesario en Home o Header general
    const menuToggle = document.getElementById('menu-toggle');
    if(menuToggle) {
      menuToggle.addEventListener('click', () => {
        document.getElementById('nav-list').classList.toggle('active');
      });
    }
  }
});
