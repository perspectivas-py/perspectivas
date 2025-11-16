// --- CONFIGURACIÓN GLOBAL ---
const REPO = 'perspectivas-py/perspectivas';
const BRANCH = 'main';
const NEWS_PATH = 'content/noticias/_posts';

// --- FUNCIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
  loadNews();
  activateDarkMode();
  activateMobileMenu();
});

// --- LÓGICA DE CARGA DE NOTICIAS (VERSIÓN BBC) ---
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
    newsGrid.innerHTML = `<p style="color: red;">${error.message}</p>`;
  }
}

// --- FUNCIONES DE RENDERIZADO (VERSIÓN BBC) ---
function renderFeaturedArticleBBC(container, filename, frontmatter, content) {
  const imageUrl = findFirstImage(content) || 'https://via.placeholder.com/800x450?text=Perspectivas';
  const link = `noticia.html?type=noticias&id=${filename}`;
  container.querySelector('.featured-image-container a').href = link;
  container.querySelector('img').src = imageUrl;
  container.querySelector('img').alt = `Imagen para: ${frontmatter.title}`;
  container.querySelector('time').textContent = formatDate(frontmatter.date);
  container.querySelector('h1 a').href = link;
  container.querySelector('h1 a').textContent = frontmatter.title || 'Sin Título';
  container.querySelector('.dek').textContent = frontmatter.summary || content.substring(0, 150) + '...';
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
  const imageUrl = findFirstImage(content) || 'https://via.placeholder.com/400x225?text=Perspectivas';
  const link = `noticia.html?type=noticias&id=${filename}`;
  return `<article class="card"><a href="${link}"><img src="${imageUrl}" alt=""></a><div class="card-body"><time datetime="${frontmatter.date}">${formatDate(frontmatter.date)}</time><h3><a href="${link}">${frontmatter.title || 'Sin Título'}</a></h3></div></article>`;
}

// --- FUNCIONES DE UTILIDAD ---
async function fetchFiles(path){const r=await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`);if(!r.ok)throw new Error(`No se pudo acceder a la carpeta: ${path}`);const e=await r.json();return e.sort((r,e)=>e.name.localeCompare(r.name))}async function fetchFileContent(r){const e=await fetch(r);if(!e.ok)throw new Error(`No se pudo cargar el contenido del archivo: ${r}`);return await e.text()}function parseFrontmatter(r){const e=/^---\s*([\s\S]*?)\s*---/.exec(r),t={frontmatter:{},content:r};return e&&(t.content=r.replace(e[0],"").trim(),e[1].split("\n").forEach(r=>{const[e,...o]=r.split(":");e&&o.length>0&&(t.frontmatter[e.trim()]=o.join(":").trim().replace(/"/g,""))})),t}function findFirstImage(r){const e=r.match(/!\[.*\]\((.*)\)/);return e&&e[1]?e[1].startsWith("http")?e[1]:e[1].startsWith("/")?e[1]:`/${e[1]}`:null}function formatTitleFromFilename(r){return r.replace(/\.md$/,"").replace(/^\d{4}-\d{2}-\d{2}-/,"").replace(/-/g," ").replace(/\b\w/g,r=>r.toUpperCase())}function formatDate(r){if(!r)return"";const e=new Date(r),t={day:"numeric",month:"short",year:"numeric"};return e.toLocaleDateString("es-ES",t)}

// --- LÓGICA DE MENÚ MÓVIL Y MODO OSCURO ---
function activateDarkMode(){const t=document.getElementById("themeToggle"),e=document.body,o=t?t.querySelector(".icon"):null;if(t){const n=()=>{e.classList.toggle("dark-mode");const t=e.classList.contains("dark-mode")?"dark":"light";localStorage.setItem("theme",t),o&&(o.textContent="dark"===t?"☀️":"🌙")};"dark"===localStorage.getItem("theme")&&(e.classList.add("dark-mode"),o&&(o.textContent="☀️")),t.addEventListener("click",n)}}
function activateMobileMenu(){const t=document.getElementById("menu-toggle"),e=document.getElementById("nav-list");t&&e&&t.addEventListener("click",()=>{e.classList.toggle("is-open");const o=e.classList.contains("is-open");t.setAttribute("aria-expanded",o),t.innerHTML=o?"&times;":"☰"})}
