/* script.js - Perspectivas Engine v2.1 (Optimized) */

// 1. CONFIGURACIÓN CENTRAL
const CONFIG = {
  username: 'perspectivas-py', // Usuario detectado de tu código anterior
  repo: 'perspectivas',
  branch: 'main',
  limitNews: 10, // Paginación solicitada
};

const BASE_API = `https://api.github.com/repos/${CONFIG.username}/${CONFIG.repo}/contents/content`;

// Variables de Estado Global (para filtros)
let globalNews = []; 

// 2. UTILIDADES
const getCacheBust = () => `?t=${Date.now()}`;

// Formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric"
  });
};

// Detectar ID de YouTube
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

// 3. FETCHING DE DATOS
async function fetchCollection(folder) {
  try {
    const response = await fetch(`${BASE_API}/${folder}${getCacheBust()}`);
    if (!response.ok) throw new Error(`Error cargando ${folder}`);
    const files = await response.json();

    const mdFiles = files.filter(f => f.name.endsWith('.md'));

    const contentPromises = mdFiles.map(async (file) => {
      const res = await fetch(file.download_url);
      const text = await res.text();
      const { attributes, body } = parseMarkdown(text);
      return {
        ...attributes,
        body,
        slug: file.name.replace('.md', ''),
        folder: folder,
        category: attributes.category || 'General' // Asegurar categoría por defecto
      };
    });

    const items = await Promise.all(contentPromises);
    // Ordenar por fecha descendente
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));

  } catch (error) {
    console.error(`Error en ${folder}:`, error);
    return [];
  }
}

// 4. RENDERIZADO (UI)

const createCardHTML = (item, showVideo = false) => {
  let mediaHTML = '';
  const link = `post.html?id=${item.slug}&folder=${item.folder}`;
  
  if (showVideo && item.embed_url) {
    const videoId = getYoutubeId(item.embed_url);
    if (videoId) {
      mediaHTML = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
    }
  } 
  
  if (!mediaHTML) {
    const imgUrl = item.thumbnail || "https://placehold.co/600x400?text=Perspectivas";
    mediaHTML = `<div class="card-img-container"><a href="${link}"><img src="${imgUrl}" alt="${item.title}" loading="lazy"></a></div>`;
  }

  const excerpt = item.description || item.body.substring(0, 100) + '...';

  return `
    <article class="card">
      ${mediaHTML}
      <div class="card-content">
        <small class="card-meta">${formatDate(item.date)} | ${item.category}</small>
        <h3><a href="${link}">${item.title}</a></h3>
        <p>${excerpt}</p>
      </div>
    </article>
  `;
};

const renderHero = (item) => {
  const container = document.querySelector('.featured-card-bbc');
  if (!item || !container) return;

  const link = `post.html?id=${item.slug}&folder=${item.folder}`;
  const imgUrl = item.thumbnail || "https://placehold.co/800x400?text=Portada";

  container.innerHTML = `
    <a href="${link}">
      <img src="${imgUrl}" alt="${item.title}">
      <h2>${item.title}</h2>
      <p class="featured-excerpt">${item.description || ''}</p>
    </a>
  `;
};

const renderTopList = (items) => {
  const container = document.getElementById('top-list-bbc');
  if (!container) return;
  
  container.innerHTML = items.map(item => `
    <li>
      <a href="post.html?id=${item.slug}&folder=${item.folder}">
        <h4>${item.title}</h4>
        <small>${formatDate(item.date)}</small>
      </a>
    </li>
  `).join('');
};

const renderGrid = (items, elementId, isVideoSection = false) => {
  const container = document.getElementById(elementId);
  if (!container) {
    console.warn(`Container #${elementId} not found`);
    return;
  }
  container.innerHTML = items.map(item => createCardHTML(item, isVideoSection)).join('');
};

// 5. FILTROS Y BÚSQUEDA

const setupFilters = (items, gridId) => {
  const container = document.getElementById('category-filters');
  if (!container) return;

  // Extraer categorías únicas
  const categories = ['Todas', ...new Set(items.map(i => i.category))];

  container.innerHTML = categories.map(cat => 
    `<button class="filter-btn ${cat === 'Todas' ? 'active' : ''}" data-cat="${cat}">${cat}</button>`
  ).join('');

  // Lógica de clic
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      // Actualizar clases visuales
      container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const selectedCat = btn.dataset.cat;
      const filtered = selectedCat === 'Todas' 
        ? items.slice(0, CONFIG.limitNews) // Respetar límite si es "Todas"
        : items.filter(i => i.category === selectedCat);

      renderGrid(filtered, gridId);
    });
  });
};

const setupSearch = (allItems) => {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const newsGrid = document.getElementById('news-grid');
    
    if (term.length < 2) {
      // Si borra, restaurar grid original (primeros X items)
      renderGrid(globalNews.slice(4, 4 + CONFIG.limitNews), 'news-grid');
      return; 
    }

    const filtered = allItems.filter(item => 
      item.title.toLowerCase().includes(term) || 
      (item.description && item.description.toLowerCase().includes(term))
    );

    renderGrid(filtered, 'news-grid');
  });
};

// 6. INICIALIZACIÓN (MAIN)
async function initApp() {
  console.log("Iniciando Perspectivas Engine...");
  
  // A. Cargar Datos
  // NOTA: Asumiendo rutas 'content/noticias', 'content/programa', 'content/analisis'
  const allNews = await fetchCollection('noticias'); 
  const allProgram = await fetchCollection('programa');
  const allAnalysis = await fetchCollection('analisis');

  globalNews = allNews; // Guardar referencia para filtros

  // B. Renderizar Noticias (Layout Distribuido)
  if (allNews.length > 0) {
    // 1. Portada
    renderHero(allNews[0]);
    
    // 2. Sidebar (3 siguientes)
    renderTopList(allNews.slice(1, 4));

    // 3. Grid Principal (Resto hasta el límite)
    const gridItems = allNews.slice(4, 4 + CONFIG.limitNews);
    renderGrid(gridItems, 'news-grid');

    // 4. Configurar Filtros (Solo para las noticias locales)
    // Pasamos 'allNews.slice(4)' para filtrar sobre las noticias que no son destacadas,
    // o 'allNews' si queremos que el grid pueda mostrar cualquier noticia filtrada.
    // Usaremos 'allNews' excluyendo las 4 primeras para no repetir visualmente si se filtra "Todas".
    setupFilters(allNews.slice(4), 'news-grid');
  }

  // C. Renderizar Programa (Videos)
  renderGrid(allProgram.slice(0, 6), 'program-grid', true);

  // D. Renderizar Análisis
  renderGrid(allAnalysis.slice(0, 4), 'analisis-grid');

  // E. Configurar Buscador (Busca en TODO)
  setupSearch([ ...allNews, ...allProgram, ...allAnalysis ]);
}

// Menú Móvil
const menuToggle = document.getElementById('menu-toggle');
if(menuToggle) {
    menuToggle.addEventListener('click', () => {
    document.getElementById('nav-list').classList.toggle('active');
  });
}

// Arrancar
document.addEventListener('DOMContentLoaded', initApp);
