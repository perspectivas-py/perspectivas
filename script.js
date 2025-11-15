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
        return { ...file, frontmatter, content }; // Devolvemos todo
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
    newsGrid.innerHTML = '<p style="color: red;">Ocurrió un error al cargar las noticias.</p>';
  }
}

// --- FUNCIONES DE RENDERIZADO (VERSIÓN CORREGIDA) ---

function renderFeaturedArticle(container, filename, frontmatter, content) {
  const imageUrl = findFirstImage(content) || 'https://via.placeholder.com/1000x560?text=Perspectivas';
  
  container.querySelector('img').src = imageUrl;
  container.querySelector('img').alt = `Imagen para: ${frontmatter.title || 'Noticia destacada'}`;
  container.querySelector('time').textContent = formatDate(frontmatter.date);
  container.querySelector('h1').textContent = frontmatter.title || 'Sin Título';
  // LÍNEA CORREGIDA: Usamos 'content' que sí existe aquí
  container.querySelector('.dek').textContent = frontmatter.summary || content.substring(0, 120) + '...';
  
  const link = `noticia.html?type=noticias&id=${filename}`;
  container.querySelector('h1').innerHTML = `<a href="${link}">${frontmatter.title || 'Sin Título'}</a>`;
  container.querySelector('img').parentElement.href = link;
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

// ... (El resto de las funciones auxiliares y del menú móvil se mantienen igual) ...
// (Incluyendo fetchFiles, fetchFileContent, parseFrontmatter, findFirstImage, formatDate, activateDarkMode, activateMobileMenu)
