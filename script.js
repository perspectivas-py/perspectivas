// Contenido completo para el NUEVO script.js

// --- CONFIGURACIÓN GLOBAL ---
const REPO = 'perspectivas-py/perspectivas';
const BRANCH = 'main';
const NEWS_PATH = 'content/noticias/_posts';
const ANALYSIS_PATH = 'content/analisis/_posts'; // (Lo usaremos en el futuro)

// --- FUNCIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
  // Cuando el DOM esté listo, cargamos las noticias.
  loadNews();
});

// --- FUNCIÓN PARA CARGAR NOTICIAS ---
async function loadNews() {
  const newsGrid = document.getElementById('news-grid');
  const featuredCard = document.querySelector('.featured-card');
  const topList = document.getElementById('top-list');

  if (!newsGrid || !featuredCard || !topList) return; // Si no estamos en la home, no hacemos nada.

  try {
    const files = await fetchFiles(NEWS_PATH);
    if (!files || files.length === 0) {
      newsGrid.innerHTML = '<p>No hay noticias para mostrar.</p>';
      return;
    }

    // El primer archivo (el más reciente) es el destacado.
    const featuredFile = files[0];
    const featuredContent = await fetchFileContent(featuredFile.download_url);
    renderFeaturedArticle(featuredCard, featuredContent);

    // Los siguientes 4 artículos van a la lista de destacados.
    const topFiles = files.slice(1, 5);
    renderTopList(topList, topFiles);

    // Todos los artículos (excluyendo el principal) van a la cuadrícula general.
    const gridFiles = files.slice(1);
    renderNewsGrid(newsGrid, gridFiles);

  } catch (error) {
    console.error("Error al cargar las noticias:", error);
    newsGrid.innerHTML = '<p style="color: red;">Ocurrió un error al cargar las noticias.</p>';
  }
}

// --- FUNCIONES AUXILIARES DE RENDERIZADO ---

function renderFeaturedArticle(container, markdown) {
  const { frontmatter, content } = parseFrontmatter(markdown);
  const imageUrl = findFirstImage(content) || 'https://via.placeholder.com/1000x560?text=Portada';
  
  container.querySelector('img').src = imageUrl;
  container.querySelector('time').textContent = formatDate(frontmatter.date);
  container.querySelector('h1').textContent = frontmatter.title || 'Sin Título';
  container.querySelector('.dek').textContent = frontmatter.summary || content.substring(0, 120) + '...';
  // Nota: Este diseño no tiene un enlace único para la noticia, asume navegación por scroll.
}

async function renderTopList(container, files) {
  container.innerHTML = ''; // Limpiar
  for (const file of files) {
    // Para la lista solo necesitamos el título, no el contenido completo.
    const title = formatTitleFromFilename(file.name);
    const listItem = document.createElement('li');
    // Nota: El enlace debería ir a la noticia específica, por ahora lo dejamos simple.
    listItem.innerHTML = `<a href="#">${title}</a>`;
    container.appendChild(listItem);
  }
}

async function renderNewsGrid(container, files) {
  container.innerHTML = ''; // Limpiar
  for (const file of files) {
    const content = await fetchFileContent(file.download_url);
    container.innerHTML += createNewsCard(content);
  }
}

function createNewsCard(markdown) {
  const { frontmatter, content } = parseFrontmatter(markdown);
  const imageUrl = findFirstImage(content) || 'https://via.placeholder.com/400x225?text=Noticia';
  return `
    <article class="card">
      <img src="${imageUrl}" alt="">
      <div class="card-body">
        <time datetime="${frontmatter.date}">${formatDate(frontmatter.date)}</time>
        <h3><a href="#">${frontmatter.title || 'Sin Título'}</a></h3>
      </div>
    </article>
  `;
}

// --- FUNCIONES DE UTILIDAD (API, PARSEO, FORMATO) ---

async function fetchFiles(path) {
  const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`);
  if (!response.ok) throw new Error(`No se pudo acceder a la carpeta: ${path}`);
  const files = await response.json();
  // Ordenar de más reciente a más antiguo
  return files.sort((a, b) => b.name.localeCompare(a.name));
}

async function fetchFileContent(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar el contenido del archivo: ${url}`);
  return await response.text();
}

function parseFrontmatter(markdownContent) { /* ... (esta función se mantiene igual) ... */ }
function findFirstImage(content) { /* ... (esta función se mantiene igual) ... */ }
function formatTitleFromFilename(filename) { /* ... (esta función se mantiene igual) ... */ }
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}
