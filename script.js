// --- CONFIGURACIÓN GLOBAL ---
const REPO = 'perspectivas-py/perspectivas';
const BRANCH = 'main';
const NEWS_PATH = 'content/noticias/posts';

// --- FUNCIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
  try {
    loadNews();
    activateDarkMode();
    activateMobileMenu();
  } catch (error) {
    console.error("Error Crítico al iniciar la aplicación:", error);
    document.body.innerHTML = `<div style="text-align:center;padding:50px;"><h1>Error Crítico</h1><p>Revisa consola F12.</p></div>`;
  }
});

// --- CARGA DE NOTICIAS ---
async function loadNews() {
  const featuredCard = document.querySelector('.featured-card-bbc');
  const topList = document.getElementById('top-list-bbc');
  const newsGrid = document.getElementById('news-grid');
  if (!featuredCard || !topList || !newsGrid) return;

  try {
    const files = await fetchFiles(NEWS_PATH);
    if (!files || files.length === 0) {
      featuredCard.innerHTML = '<p>No hay noticias para mostrar.</p>';
      return;
    }

    const allPosts = await Promise.all(
      files.map(async file => {
        const markdown = await fetchFileContent(file.download_url);
        const { frontmatter, content } = parseFrontmatter(markdown);
        return { ...file, frontmatter, content };
      })
    );

    // ORDENAR POR FECHA DESCENDENTE
    allPosts.sort((a, b) => {
      const da = new Date(a.frontmatter.date || a.frontmatter.fecha || 0);
      const db = new Date(b.frontmatter.date || b.frontmatter.fecha || 0);
      return db - da;
    });

    // DESTACADA Y RESTO
    let featuredPost = allPosts.find(p => String(p.frontmatter.featured) === 'true') || allPosts[0];
    const otherPosts = allPosts.filter(p => p.name !== featuredPost.name);

    // RENDERIZADO
    renderFeaturedArticleBBC(featuredCard, featuredPost.name, featuredPost.frontmatter, featuredPost.content);
    renderTopListBBC(topList, otherPosts.slice(0, 4));
    renderNewsGrid(newsGrid, otherPosts);

    // ACTIVAR FILTROS
    setupCategoryFilters(allPosts, otherPosts, newsGrid, topList);

  } catch (error) {
    console.error("Error al cargar noticias:", error);
    featuredCard.innerHTML = `<p style="color:red;font-weight:bold;">Error: ${error.message}</p>`;
  }
}

// --- RENDER BBC ---
function renderFeaturedArticleBBC(container, filename, frontmatter, content) {
  let imageUrl = findFirstImage(content) || 'https://placehold.co/800x450/EFEFEF/AAAAAA?text=Perspectivas';
  const link = `noticia.html?type=noticias&id=${filename}`;
  container.innerHTML = `
    <div class="featured-image-container">
      <a href="${link}"><img src="${imageUrl}" alt="Imagen"></a>
    </div>
    <div class="featured-body">
      <time datetime="${frontmatter.date}">${formatDate(frontmatter.date)}</time>
      <h1><a href="${link}">${frontmatter.title || 'Sin Título'}</a></h1>
      <p class="dek">${frontmatter.summary || content.substring(0,150)+'...'}</p>
    </div>`;
}

function renderTopListBBC(container, files) {
  container.innerHTML = '';
  files.forEach(post => {
    const link = `noticia.html?type=noticias&id=${post.name}`;
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="${link}">
        <h4>${post.frontmatter.title || formatTitleFromFilename(post.name)}</h4>
        <p>${post.frontmatter.summary || post.content.substring(0,80)+'...'}</p>
      </a>`;
    container.appendChild(li);
  });
}

async function renderNewsGrid(container, files) {
  container.innerHTML = '';
  for (const post of files) {
    container.innerHTML += createNewsCard(post.name, post.frontmatter, post.content);
  }
}

function createNewsCard(filename, frontmatter, content) {
  const imageUrl = findFirstImage(content) || 'https://placehold.co/400x225/EFEFEF/AAAAAA?text=Perspectivas';
  const link = `noticia.html?type=noticias&id=${filename}`;
  const category = frontmatter.category || frontmatter.categoria || null;
  const categoryLabel = category ? `<span class="badge-cat">${category}</span>` : '';
  return `
  <article class="card">
    <a href="${link}"><img src="${imageUrl}" alt=""></a>
    <div class="card-body">
      ${categoryLabel}
      <time datetime="${frontmatter.date}">${formatDate(frontmatter.date)}</time>
      <h3><a href="${link}">${frontmatter.title || 'Sin Título'}</a></h3>
    </div>
  </article>`;
}

// --- CATEGORÍAS Y FILTROS ---
function setupCategoryFilters(allPosts, otherPosts, newsGrid, topList) {
  const filtersContainer = document.getElementById('category-filters');
  if (!filtersContainer) return;

  const categories = [...new Set(allPosts.map(p => (p.frontmatter.category || p.frontmatter.categoria || '').trim()).filter(Boolean))];

  if (!categories.length) {
    filtersContainer.style.display = 'none';
    return;
  }

  let active = 'Todos';

  const renderFilters = () => {
    filtersContainer.innerHTML = '';
    const allBtn = createFilterButton('Todos', active === 'Todos', () => {
      active = 'Todos';
      updateUI();
    });
    filtersContainer.appendChild(allBtn);

    categories.forEach(cat => {
      const btn = createFilterButton(cat, active === cat, () => {
        active = cat;
        updateUI();
      });
      filtersContainer.appendChild(btn);
    });
  };

  const updateUI = () => {
    const filtered =
      active === 'Todos'
        ? otherPosts
        : otherPosts.filter(p => (p.frontmatter.category || p.frontmatter.categoria) === active);

    renderNewsGrid(newsGrid, filtered);
    renderTopListBBC(topList, filtered.slice(0, 4));
    renderFilters();
  };

  const createFilterButton = (text, active, handler) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = text;
    btn.className = 'filter-pill' + (active ? ' is-active' : '');
    btn.onclick = handler;
    return btn;
  };

  renderFilters();
  updateUI();
}

// --- UTILIDADES ---
async function fetchFiles(path){const r=await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`);if(!r.ok)throw new Error("No se pudo acceder a GitHub.");return await r.json();}
async function fetchFileContent(url){const r=await fetch(url);if(!r.ok)throw new Error("No se pudo cargar archivo Markdown.");return await r.text();}
function parseFrontmatter(md){const m=/^---\s*([\s\S]*?)\s*---/.exec(md);const d={frontmatter:{},content:md};if(m){d.content=md.replace(m[0],"").trim();m[1].split("\n").forEach(l=>{const[k,...v]=l.split(":");if(k&&v.length>0)d.frontmatter[k.trim()]=v.join(":").trim().replace(/"/g,"");});}return d;}
function findFirstImage(c){const m=c.match(/!\[.*\]\((.*)\)/);if(m&&m[1])return m[1].startsWith('http')?m[1]:'/'+m[1];return null;}
function formatDate(d){if(!d)return'';return new Date(d).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});}
function formatTitleFromFilename(f){return f.replace(/\.md$/,'').replace(/^\d{4}-\d{2}-\d{2}-/,'').replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase());}

// --- UI ---
function activateDarkMode(){const t=document.getElementById("themeToggle"),e=document.body,o=t?t.querySelector(".icon"):null;if(!t)return;const n=()=>{e.classList.toggle("dark-mode");const t=e.classList.contains("dark-mode")?"dark":"light";localStorage.setItem("theme",t),o&&(o.textContent="dark"===t?"☀️":"🌙")};"dark"===localStorage.getItem("theme")&&(e.classList.add("dark-mode"),o&&(o.textContent="☀️")),t.addEventListener("click",n)}
function activateMobileMenu(){const t=document.getElementById("menu-toggle"),e=document.getElementById("nav-list");if(!t||!e)return;t.addEventListener("click",()=>{e.classList.toggle("is-open");const o=e.classList.contains("is-open");t.setAttribute("aria-expanded",o),t.innerHTML=o?"&times;":"☰"})}
