// --- CONFIGURACIÓN GLOBAL ---
const REPO = 'perspectivas-py/perspectivas';
const BRANCH = 'main';
const NEWS_PATH = 'content/noticias/_posts';

// --- FUNCIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
  try {
    loadNews();
    activateDarkMode();
    activateMobileMenu();
  } catch (error) {
    console.error("Error Crítico al iniciar la aplicación:", error);
    document.body.innerHTML = `<div style="text-align:center; padding: 50px;"><h1>Error Crítico</h1><p>El sitio no pudo cargarse. Revisa la consola (F12) para ver los detalles.</p></div>`;
  }
});

// --- LÓGICA DE CARGA DE NOTICIAS ---
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

    let featuredPost = allPosts.find(post => String(post.frontmatter.featured) === 'true') || allPosts[0];
    const otherPosts = allPosts.filter(post => post.name !== featuredPost.name);

    renderFeaturedArticleBBC(featuredCard, featuredPost.name, featuredPost.frontmatter, featuredPost.content);
    renderTopListBBC(topList, otherPosts.slice(0, 4));
    renderNewsGrid(newsGrid, otherPosts);

  } catch (error) {
    console.error("Error al cargar las noticias:", error);
    featuredCard.innerHTML = `<p style="color: red; font-weight: bold;">Error: ${error.message}</p>`;
  }
}

// --- FUNCIONES DE RENDERIZADO (VERSIÓN A PRUEBA DE BALAS) ---
function renderFeaturedArticleBBC(container, filename, frontmatter, content) {
  // LÓGICA CORREGIDA Y A PRUEBA DE BALAS
  let imageUrl = findFirstImage(content);
  if (!imageUrl) { // Si NO se encuentra una imagen en el artículo
    imageUrl = 'https://via.placeholder.com/800x450.png?text=Perspectivas';
  }
  
  const link = `noticia.html?type=noticias&id=${filename}`;
  
  // Borramos el contenido 'Cargando...' y construimos el nuevo HTML
  container.innerHTML = `
    <div class="featured-image-container">
      <a href="${link}"><img src="${imageUrl}" alt="Imagen para: ${frontmatter.title || 'Noticia destacada'}"></a>
    </div>
    <div class="featured-body">
      <time datetime="${frontmatter.date}">${formatDate(frontmatter.date)}</time>
      <h1><a href="${link}">${frontmatter.title || 'Sin Título'}</a></h1>
      <p class="dek">${frontmatter.summary || content.substring(0, 150) + '...'}</p>
    </div>
  `;
}

function renderTopListBBC(container, files) {
  container.innerHTML = '';
  files.forEach(post => {
    const listItem = document.createElement('li');
    const link = `noticia.html?type=noticias&id=${post.name}`;
    listItem.innerHTML = `<a href="${link}"><h4>${post.frontmatter.title || formatTitleFromFilename(post.name)}</h4><p>${post.frontmatter.summary || post.content.substring(0, 80) + '...'}</p></a>`;
    container.appendChild(listItem);
  });
}

async function renderNewsGrid(container, files) {
  container.innerHTML = '';
  for (const post of files) {
    container.innerHTML += createNewsCard(post.name, post.frontmatter, post.content);
  }
}

function createNewsCard(filename, frontmatter, content) {
  const imageUrl = findFirstImage(content) || 'https://via.placeholder.com/400x225.png?text=Perspectivas';
  const link = `noticia.html?type=noticias&id=${filename}`;
  return `<article class="card"><a href="${link}"><img src="${imageUrl}" alt=""></a><div class="card-body"><time datetime="${frontmatter.date}">${formatDate(frontmatter.date)}</time><h3><a href="${link}">${frontmatter.title || 'Sin Título'}</a></h3></div></article>`;
}

// --- FUNCIONES DE UTILIDAD ---
async function fetchFiles(path) { const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`); if (!r.ok) throw new Error(`No se pudo acceder a la carpeta de GitHub: ${path}`); return await r.json(); }
async function fetchFileContent(url) { const r = await fetch(url); if (!r.ok) throw new Error(`No se pudo cargar el contenido del archivo: ${url}`); return await r.text(); }
function parseFrontmatter(markdownContent) { const match = /^---\s*([\s\S]*?)\s*---/.exec(markdownContent); const data = { frontmatter: {}, content: markdownContent }; if (match) { data.content = markdownContent.replace(match[0], "").trim(); match[1].split("\n").forEach(line => { const [key, ...valueParts] = line.split(":"); if (key && valueParts.length > 0) { data.frontmatter[key.trim()] = valueParts.join(":").trim().replace(/"/g, ""); } }); } return data; }
function findFirstImage(content) { const imageMatch = content.match(/!\[.*\]\((.*)\)/); if (imageMatch && imageMatch[1]) { let imageUrl = imageMatch[1]; if (imageUrl.startsWith('http')) { return imageUrl; } return imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl; } return null; }
function formatTitleFromFilename(filename) { return filename.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
function formatDate(dateString) { if (!dateString) return ''; const date = new Date(dateString); const options = { day: 'numeric', month: 'short', year: 'numeric' }; return date.toLocaleDateString('es-ES', options); }

// --- LÓGICA DE UI ---
function activateDarkMode(){const t=document.getElementById("themeToggle"),e=document.body,o=t?t.querySelector(".icon"):null;if(!t)return;const n=()=>{e.classList.toggle("dark-mode");const t=e.classList.contains("dark-mode")?"dark":"light";localStorage.setItem("theme",t),o&&(o.textContent="dark"===t?"☀️":"🌙")};"dark"===localStorage.getItem("theme")&&(e.classList.add("dark-mode"),o&&(o.textContent="☀️")),t.addEventListener("click",n)}
function activateMobileMenu(){const t=document.getElementById("menu-toggle"),e=document.getElementById("nav-list");if(!t||!e)return;t.addEventListener("click",()=>{e.classList.toggle("is-open");const o=e.classList.contains("is-open");t.setAttribute("aria-expanded",o),t.innerHTML=o?"&times;":"☰"})}
