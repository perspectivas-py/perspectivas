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

// --- LÓGICA DE CARGA DE NOTICIAS (VERSIÓN CORREGIDA) ---
async function loadNews() {
  const featuredCard = document.querySelector('.featured-card');
  const topList = document.getElementById('top-list');
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

    let featuredPost = allPosts.find(post => String(post.frontmatter.featured) === 'true');
    
    if (!featuredPost) {
      featuredPost = allPosts[0];
    }

    const otherPosts = allPosts.filter(post => post.name !== featuredPost.name);

    renderFeaturedArticle(featuredCard, featuredPost.name, featuredPost.frontmatter, featuredPost.content);
    renderTopList(topList, otherPosts.slice(0, 4));
    renderNewsGrid(newsGrid, otherPosts);

  } catch (error) {
    console.error("Error al cargar las noticias:", error);
    newsGrid.innerHTML = `<p style="color: red;">${error.message}</p>`;
  }
}

// --- FUNCIONES DE RENDERIZADO (VERSIÓN CORREGIDA) ---
// En script.js, reemplaza la función findFirstImage por esta versión

function findFirstImage(content) {
  const imageMatch = content.match(/!\[.*\]\((.*)\)/);
  if (imageMatch && imageMatch[1]) {
    let imageUrl = imageMatch[1];
    // Si la URL ya es una URL completa (empieza con http), la devolvemos.
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    // Para cualquier otra cosa, nos aseguramos de que empiece con una barra '/'.
    // Esto crea una ruta absoluta desde la raíz del sitio, que es lo más seguro.
    return imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
  }
  return null;
}
  }

  container.querySelector('time').textContent = formatDate(frontmatter.date);
  container.querySelector('h1').innerHTML = `<a href="noticia.html?type=noticias&id=${filename}">${frontmatter.title || 'Sin Título'}</a>`;
  container.querySelector('.dek').textContent = frontmatter.summary || content.substring(0, 120) + '...';
}

async function renderTopList(container, files) {
  container.innerHTML = '';
  for (const file of files) {
    const title = formatTitleFromFilename(file.name);
    const listItem = document.createElement('li');
    const link = `noticia.html?type=noticias&id=${file.name}`;
    listItem.innerHTML = `<a href="${link}">${title}</a>`;
    container.appendChild(listItem);
  }
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
  return `
    <article class="card">
      <a href="${link}"><img src="${imageUrl}" alt=""></a>
      <div class="card-body">
        <time datetime="${frontmatter.date}">${formatDate(frontmatter.date)}</time>
        <h3><a href="${link}">${frontmatter.title || 'Sin Título'}</a></h3>
      </div>
    </article>
  `;
}

// --- FUNCIONES DE UTILIDAD ---
async function fetchFiles(path) {
  const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`);
  if (!response.ok) throw new Error(`No se pudo acceder a la carpeta: ${path}`);
  const files = await response.json();
  return files.sort((a, b) => b.name.localeCompare(a.name));
}
async function fetchFileContent(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar el contenido del archivo: ${url}`);
  return await response.text();
}
function parseFrontmatter(markdownContent){const match=/^---\s*([\s\S]*?)\s*---/.exec(markdownContent),data={frontmatter:{},content:markdownContent};if(match){data.content=markdownContent.replace(match[0],"").trim(),match[1].split("\n").forEach(line=>{const[key,...valueParts]=line.split(":");key&&valueParts.length>0&&(data.frontmatter[key.trim()]=valueParts.join(":").trim().replace(/"/g,""))});}return data}
function findFirstImage(content){const match=content.match(/!\[.*\]\((.*)\)/);if(match&&match[1])return match[1].startsWith("http")?match[1]:match[1].startsWith("/")?match[1]:`/${match[1]}`;return null}
function formatTitleFromFilename(filename){return filename.replace(/\.md$/,"").replace(/^\d{4}-\d{2}-\d{2}-/,"").replace(/-/g," ").replace(/\b\w/g,l=>l.toUpperCase())}
function formatDate(dateString){if(!dateString)return"";const date=new Date(dateString),options={day:"numeric",month:"short",year:"numeric"};return date.toLocaleDateString("es-ES",options)}

// --- LÓGICA DE MENÚ MÓVIL Y MODO OSCURO ---
function activateDarkMode(){const t=document.getElementById("themeToggle"),e=document.body,o=t?t.querySelector(".icon"):null;if(t){const n=()=>{e.classList.toggle("dark-mode");const t=e.classList.contains("dark-mode")?"dark":"light";localStorage.setItem("theme",t),o&&(o.textContent="dark"===t?"☀️":"🌙")};"dark"===localStorage.getItem("theme")&&(e.classList.add("dark-mode"),o&&(o.textContent="☀️")),t.addEventListener("click",n)}}
function activateMobileMenu(){const t=document.getElementById("menu-toggle"),e=document.getElementById("nav-list");t&&e&&t.addEventListener("click",()=>{e.classList.toggle("is-open");const o=e.classList.contains("is-open");t.setAttribute("aria-expanded",o),t.innerHTML=o?"&times;":"☰"})}
