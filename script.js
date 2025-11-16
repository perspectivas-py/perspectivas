// --- CONFIGURACIÓN GLOBAL ---
const REPO = 'perspectivas-py/perspectivas';
const BRANCH = 'main';
const NEWS_PATH = 'content/noticias/_posts';

// --- FUNCIÓN PRINCIPAL DE ARRANQUE ---
document.addEventListener('DOMContentLoaded', () => {
  loadNews();
  activateDarkMode();
  activateMobileMenu();
});

// --- LÓGICA DE CARGA DE NOTICIAS ---
async function loadNews() {
  const mainStoryContainer = document.getElementById('main-story-container');
  const topList = document.getElementById('top-list');
  if (!mainStoryContainer || !topList) return;

  try {
    const files = await fetchFiles(NEWS_PATH);
    if (!files || files.length === 0) {
      mainStoryContainer.innerHTML = '<p>No hay noticias para mostrar.</p>';
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

    renderFeaturedArticle(mainStoryContainer, featuredPost.name, featuredPost.frontmatter, featuredPost.content);
    renderTopList(topList, otherPosts.slice(0, 4));

  } catch (error) {
    console.error("Error al cargar noticias:", error);
    mainStoryContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

// --- FUNCIONES DE RENDERIZADO ---
function renderFeaturedArticle(container, filename, frontmatter, content) {
  // ▼▼▼ LÍNEA CORREGIDA ▼▼▼
  const imageUrl = findFirstImage(content) || 'https://placehold.co/1000x560/EFEFEF/AAAAAA?text=Perspectivas';
  const link = `noticia.html?type=noticias&id=${filename}`;
  container.innerHTML = `
    <a href="${link}"><img src="${imageUrl}" alt="Imagen para: ${frontmatter.title || ''}"></a>
    <div class="featured-body">
      <time datetime="${frontmatter.date}">${formatDate(frontmatter.date)}</time>
      <h1><a href="${link}">${frontmatter.title || 'Sin Título'}</a></h1>
      <p class="dek">${frontmatter.summary || content.substring(0, 120) + '...'}</p>
    </div>
  `;
}
function renderTopList(container, files) {
  container.innerHTML = '';
  files.forEach(post => {
    const listItem = document.createElement('li');
    const link = `noticia.html?type=noticias&id=${post.name}`;
    listItem.innerHTML = `<a href="${link}">${post.frontmatter.title || formatTitleFromFilename(post.name)}</a>`;
    container.appendChild(listItem);
  });
}

// --- FUNCIONES DE UTILIDAD (SIN CAMBIOS) ---
async function fetchFiles(path){const r=await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`);if(!r.ok)throw new Error(`No se pudo acceder a la carpeta: ${path}`);const e=await r.json();return e.sort((r,e)=>e.name.localeCompare(r.name))}async function fetchFileContent(r){const e=await fetch(r);if(!e.ok)throw new Error(`No se pudo cargar el contenido: ${r}`);return await e.text()}function parseFrontmatter(r){const t=/^---\s*([\s\S]*?)\s*---/.exec(r),e={frontmatter:{},content:r};return t&&(e.content=r.replace(t[0],"").trim(),t[1].split("\n").forEach(r=>{const[t,...o]=r.split(":");t&&o.length>0&&(e.frontmatter[t.trim()]=o.join(":").trim().replace(/"/g,""))})),e}function findFirstImage(r){const t=r.match(/!\[.*\]\((.*)\)/);return t&&t[1]?t[1].startsWith("http")?t[1]:t[1].startsWith("/")?t[1]:`/${t[1]}`:null}function formatTitleFromFilename(r){return r.replace(/\.md$/,"").replace(/^\d{4}-\d{2}-\d{2}-/,"").replace(/-/g," ").replace(/\b\w/g,r=>r.toUpperCase())}function formatDate(r){if(!r)return"";const t=new Date(r),e={day:"numeric",month:"short",year:"numeric"};return t.toLocaleString("es-ES",e)}

// --- LÓGICA DE UI (SIN CAMBIOS) ---
function activateDarkMode(){const t=document.getElementById("themeToggle"),e=document.body,o=t?t.querySelector(".icon"):null;if(!t)return;const n=()=>{e.classList.toggle("dark-mode");const t=e.classList.contains("dark-mode")?"dark":"light";localStorage.setItem("theme",t),o&&(o.textContent="dark"===t?"☀️":"🌙")};"dark"===localStorage.getItem("theme")&&(e.classList.add("dark-mode"),o&&(o.textContent="☀️")),t.addEventListener("click",n)}
function activateMobileMenu(){const t=document.getElementById("menu-toggle"),e=document.getElementById("nav-list");if(!t||!e)return;t.addEventListener("click",()=>{e.classList.toggle("is-open");const o=e.classList.contains("is-open");t.setAttribute("aria-expanded",o),t.innerHTML=o?"&times;":"☰"})}
