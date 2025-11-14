// --- CONFIGURACIÓN GLOBAL ---
const REPO = 'perspectivas-py/perspectivas';
const BRANCH = 'main';
const NEWS_PATH = 'content/noticias/_posts';

// --- FUNCIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
  // Cuando el DOM esté listo, cargamos las noticias y activamos el modo oscuro.
  loadNews();
  activateDarkMode();
});

// --- LÓGICA DE CARGA DE NOTICIAS ---
async function loadNews() {
  const featuredCard = document.querySelector('.featured-card');
  const topList = document.getElementById('top-list');
  const newsGrid = document.getElementById('news-grid');

  if (!featuredCard || !topList || !newsGrid) return; // Si no están los contenedores, no hacemos nada.

  try {
    const files = await fetchFiles(NEWS_PATH);
    if (!files || files.length === 0) {
      featuredCard.innerHTML = '<p>No hay noticias para mostrar.</p>';
      return;
    }

    // 1. El primer artículo (el más reciente) es el destacado.
    const featuredFile = files[0];
    const featuredContent = await fetchFileContent(featuredFile.download_url);
    renderFeaturedArticle(featuredCard, featuredFile.name, featuredContent);

    // 2. Los siguientes 4 artículos van a la lista de destacados.
    const topFiles = files.slice(1, 5);
    renderTopList(topList, topFiles);

    // 3. Todos los artículos (excluyendo el principal) van a la cuadrícula general.
    const gridFiles = files.slice(1);
    renderNewsGrid(newsGrid, gridFiles);

  } catch (error) {
    console.error("Error al cargar las noticias:", error);
    newsGrid.innerHTML = '<p style="color: red;">Ocurrió un error al cargar las noticias.</p>';
  }
}

// --- FUNCIONES DE RENDERIZADO (Dibujan el HTML) ---

function renderFeaturedArticle(container, filename, markdown) {
  const { frontmatter, content } = parseFrontmatter(markdown);
  const imageUrl = findFirstImage(content) || 'https://via.placeholder.com/1000x560?text=Perspectivas';
  
  container.querySelector('img').src = imageUrl;
  container.querySelector('time').textContent = formatDate(frontmatter.date);
  container.querySelector('h1').textContent = frontmatter.title || 'Sin Título';
  container.querySelector('.dek').textContent = frontmatter.summary || content.substring(0, 120) + '...';
  
  // Hacemos que toda la tarjeta sea un enlace
  const link = `noticia.html?type=noticias&id=${filename}`;
  container.querySelector('h1').innerHTML = `<a href="${link}">${frontmatter.title || 'Sin Título'}</a>`;
  container.querySelector('img').outerHTML = `<a href="${link}">${container.querySelector('img').outerHTML}</a>`;
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
  for (const file of files) {
    const content = await fetchFileContent(file.download_url);
    container.innerHTML += createNewsCard(file.name, content);
  }
}

function createNewsCard(filename, markdown) {
  const { frontmatter, content } = parseFrontmatter(markdown);
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

// --- FUNCIONES DE UTILIDAD (API, Parseo, Formato) ---

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
    if (imageMatch[1].startsWith('http')) return imageMatch[1];
    return imageMatch[1].startsWith('/') ? imageMatch[1] : `/${imageMatch[1]}`;
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

// --- LÓGICA DEL MODO OSCURO ---
function activateDarkMode() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const themeIcon = themeToggle ? themeToggle.querySelector('.icon') : null;
    if (!themeToggle) return;

    const toggleTheme = () => {
        body.classList.toggle('dark-mode');
        const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        if(themeIcon) themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    };

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        if(themeIcon) themeIcon.textContent = '☀️';
    }

    themeToggle.addEventListener('click', toggleTheme);
}
