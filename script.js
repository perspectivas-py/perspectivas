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

// --- LÓGICA DE CARGA DE NOTICIAS (NUEVA VERSIÓN BBC) ---
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

// --- FUNCIONES DE RENDERIZADO (NUEVA VERSIÓN BBC) ---

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
    listItem.innerHTML = `
      <a href="${link}">
        <h4>${post.frontmatter.title || formatTitleFromFilename(post.name)}</h4>
        <p>${post.frontmatter.summary || post.content.substring(0, 80) + '...'}</p>
      </a>
    `;
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

// --- FUNCIONES DE UTILIDAD (SIN CAMBIOS) ---

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

// --- LÓGICA DE MENÚ MÓVIL Y MODO OSCURO (SIN CAMBIOS) ---

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

function activateMobileMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const navList = document.getElementById('nav-list');
  if (!menuToggle || !navList) return;

  menuToggle.addEventListener('click', () => {
    navList.classList.toggle('is-open');
    const isExpanded = navList.classList.contains('is-open');
    menuToggle.setAttribute('aria-expanded', isExpanded);
    menuToggle.innerHTML = isExpanded ? '&times;' : '☰';
  });
}
