document.addEventListener('DOMContentLoaded', () => {
  
  // --- FUNCIONALIDAD DEL MODO OSCURO ---
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  const themeIcon = themeToggle ? themeToggle.querySelector('.icon') : null;

  const toggleTheme = () => {
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'dark');
      if(themeIcon) themeIcon.textContent = '☀️';
    } else {
      localStorage.setItem('theme', 'light');
      if(themeIcon) themeIcon.textContent = '🌙';
    }
  };

  if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-mode');
    if(themeIcon) themeIcon.textContent = '☀️';
  }

  if(themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // --- FUNCIONALIDAD PARA CARGAR NOTICIAS Y TICKER ---
  const mainStoryContainer = document.getElementById('main-story-container');
  const secondaryGridContainer = document.getElementById('secondary-grid-container');
  const tickerContainer = document.querySelector('.ticker');

  if (mainStoryContainer && secondaryGridContainer) {
    const repo = 'perspectivas-py/perspectivas';
    const branch = 'main';
    const postsPath = 'content/noticias/_posts'; // <-- Ruta del contenido

    fetch(`https://api.github.com/repos/${repo}/contents/${postsPath}?ref=${branch}`)
      .then(response => response.json())
      .then(files => {
        if (!Array.isArray(files) || files.length === 0) {
          mainStoryContainer.innerHTML = '<p>No hay noticias para mostrar.</p>';
          return;
        }
        files.sort((a, b) => b.name.localeCompare(a.name));
        
        if (tickerContainer) {
          populateTicker(files.slice(0, 7));
        }

        files.forEach((file, index) => {
          if (file.type !== 'file' || !file.download_url) return;
          fetch(file.download_url)
            .then(response => response.text())
            .then(markdown => {
              if (index === 0) {
                mainStoryContainer.innerHTML = crearTarjetaPrincipal(markdown, file.name);
              } else {
                secondaryGridContainer.innerHTML += crearTarjetaSecundaria(markdown, file.name);
              }
            });
        });
      })
      .catch(error => console.error('Error al cargar las noticias:', error));
  }
});

// --- FUNCIONES AUXILIARES ---

function populateTicker(files) {
  // ... (esta función se mantiene igual)
}

function formatTitleFromFilename(filename) {
  // ... (esta función se mantiene igual)
}

function parseFrontmatter(markdownContent) {
  // ... (esta función se mantiene igual)
}

function crearTarjetaPrincipal(markdown, filename) {
  const { frontmatter, content } = parseFrontmatter(markdown);
  // ▼▼▼ AQUÍ ESTÁ EL CAMBIO ▼▼▼
  const url = `noticia.html?type=noticias&id=${filename}`;
  return `
    <article class="card featured-card">
      ${frontmatter.image ? `<img src="${frontmatter.image}" alt="Imagen destacada">` : ''}
      <div class="card-content">
        <h2><a href="${url}">${frontmatter.title || 'Sin título'}</a></h2>
        <p>${content.substring(0, 150)}...</p>
      </div>
    </article>
  `;
}

function crearTarjetaSecundaria(markdown, filename) {
  const { frontmatter } = parseFrontmatter(markdown);
  // ▼▼▼ AQUÍ ESTÁ EL CAMBIO ▼▼▼
  const url = `noticia.html?type=noticias&id=${filename}`;
  return `
    <article class="card">
      ${frontmatter.image ? `<img src="${frontmatter.image}" alt="Imagen de noticia">` : ''}
      <div class="card-content">
        <h3><a href="${url}">${frontmatter.title || 'Sin título'}</a></h3>
      </div>
    </article>
  `;
}
