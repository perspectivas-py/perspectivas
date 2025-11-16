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
  const imageUrl = findFirstImage(content) || 'https://via.placeholder.com/1000x560.png?text=Perspectivas';
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
async function fetchFiles(path){/*...*/}
async function fetchFileContent(url){/*...*/}
function parseFrontmatter(markdownContent){/*...*/}
function findFirstImage(content){/*...*/}
function formatTitleFromFilename(filename){/*...*/}
function formatDate(dateString){/*...*/}

// --- LÓGICA DE UI (SIN CAMBIOS) ---
function activateDarkMode(){/*...*/}
function activateMobileMenu(){/*...*/}
