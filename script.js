// --- CONFIGURACIÓN GLOBAL ---
const REPO = 'perspectivas-py/perspectivas';
const BRANCH = 'main';
const NEWS_PATH = 'content/noticias/_posts';

// --- FUNCIÓN PRINCIPAL DE ARRANQUE ---
document.addEventListener('DOMContentLoaded', () => {
  // Envolvemos todo en un try...catch para capturar cualquier error inicial
  try {
    console.log("DOM listo. Iniciando scripts.");
    loadNews();
    activateDarkMode();
    activateMobileMenu();
    console.log("Scripts de UI activados.");
  } catch (error) {
    console.error("Error fatal en el arranque:", error);
    document.body.innerHTML = `<p style="color:red; font-size: 24px; text-align: center; padding: 50px;">Error Crítico: El sitio no pudo cargarse. Revisa la consola (F12) para más detalles.</p>`;
  }
});

// --- LÓGICA DE CARGA DE NOTICIAS CON AUTODIAGNÓSTICO ---
async function loadNews() {
  console.log("Iniciando loadNews...");
  const featuredCard = document.querySelector('.featured-card-bbc');
  const topList = document.getElementById('top-list-bbc');
  const newsGrid = document.getElementById('news-grid');

  if (!featuredCard || !topList || !newsGrid) {
    console.warn("Advertencia: No se encontraron todos los contenedores de la portada. La carga de noticias se saltará.");
    return;
  }
  
  console.log("Contenedores encontrados. Procediendo a buscar datos en GitHub...");

  try {
    const files = await fetchFiles(NEWS_PATH);
    if (!files || files.length === 0) {
      featuredCard.innerHTML = '<p>No hay noticias para mostrar en este momento.</p>';
      return;
    }
    console.log(`Se encontraron ${files.length} archivos de noticias.`);

    const allPosts = await Promise.all(
      files.map(async file => {
        const markdown = await fetchFileContent(file.download_url);
        const { frontmatter, content } = parseFrontmatter(markdown);
        return { ...file, frontmatter, content };
      })
    );
    console.log("Todos los artículos han sido procesados.");

    let featuredPost = allPosts.find(post => String(post.frontmatter.featured) === 'true') || allPosts[0];
    const otherPosts = allPosts.filter(post => post.name !== featuredPost.name);
    console.log("Artículo destacado seleccionado:", featuredPost.name);

    renderFeaturedArticleBBC(featuredCard, featuredPost.name, featuredPost.frontmatter, featuredPost.content);
    console.log("Renderizado: Artículo destacado.");
    renderTopListBBC(topList, otherPosts.slice(0, 4));
    console.log("Renderizado: Lista de destacados.");
    renderNewsGrid(newsGrid, otherPosts);
    console.log("Renderizado: Grilla de más noticias.");

  } catch (error) {
    console.error("Error durante la carga de noticias:", error);
    // Mostramos el error directamente en la página para que lo veas
    featuredCard.innerHTML = `<p style="color: red; font-weight: bold;">Error al cargar: ${error.message}</p>`;
  }
}

// --- FUNCIONES DE RENDERIZADO ---
function renderFeaturedArticleBBC(container, filename, frontmatter, content) {
  const imageUrl = findFirstImage(content) || 'https://via.placeholder.com/800x450?text=Perspectivas';
  const link = `noticia.html?type=noticias&id=${filename}`;
  container.innerHTML = `
    <div class="featured-image-container">
      <a href="${link}"><img src="${imageUrl}" alt="Imagen para: ${frontmatter.title || ''}"></a>
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
  const imageUrl = findFirstImage(content) || 'https://via.placeholder.com/400x225?text=Perspectivas';
  const link = `noticia.html?type=noticias&id=${filename}`;
  return `<article class="card"><a href="${link}"><img src="${imageUrl}" alt=""></a><div class="card-body"><time datetime="${frontmatter.date}">${formatDate(frontmatter.date)}</time><h3><a href="${link}">${frontmatter.title || 'Sin Título'}</a></h3></div></article>`;
}

// --- FUNCIONES DE UTILIDAD ---
async function fetchFiles(path) {
  const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`);
  if (!response.ok) throw new Error(`No se pudo acceder a la carpeta de GitHub: ${path}`);
  return await response.json();
}
async function fetchFileContent(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar el contenido del archivo: ${url}`);
  return await response.text();
}
function parseFrontmatter(markdownContent) {
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(markdownContent);
  const data = { frontmatter: {}, content: markdownContent };
  if (match) {
    data.content = markdownContent.replace(match[0], '').trim();
    match[1].split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) { data.frontmatter[key.trim()] = valueParts.join(':').trim().replace(/"/g, ''); }
    });
  }
  return data;
}
function findFirstImage(content) {
  const imageMatch = content.match(/!\[.*\]\((.*)\)/);
  if (imageMatch && imageMatch[1]) {
    let imageUrl = imageMatch[1];
    if (imageUrl.startsWith('http')) return imageUrl;
    return imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
  }
  return null;
}
function formatTitleFromFilename(filename) {
  return filename.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
}

// --- LÓGICA DE UI (MENÚ MÓVIL Y MODO OSCURO) ---
function activateDarkMode(){const t=document.getElementById("themeToggle"),e=document.body,o=t?t.querySelector(".icon"):null;if(t){const n=()=>{e.classList.toggle("dark-mode");const t=e.classList.contains("dark-mode")?"dark":"light";localStorage.setItem("theme",t),o&&(o.textContent="dark"===t?"☀️":"🌙")};"dark"===localStorage.getItem("theme")&&(e.classList.add("dark-mode"),o&&(o.textContent="☀️")),t.addEventListener("click",n)}}
function activateMobileMenu(){const t=document.getElementById("menu-toggle"),e=document.getElementById("nav-list");t&&e&&t.addEventListener("click",()=>{e.classList.toggle("is-open");const o=e.classList.contains("is-open");t.setAttribute("aria-expanded",o),t.innerHTML=o?"&times;":"☰"})}
