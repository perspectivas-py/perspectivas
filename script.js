// Reemplaza TODO el contenido de script.js con esto

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
    const postsPath = 'content/noticias/_posts';

    fetch(`https://api.github.com/repos/${repo}/contents/${postsPath}?ref=${branch}`)
      .then(response => response.json())
      .then(files => {
        if (!Array.isArray(files) || files.length === 0) {
          mainStoryContainer.innerHTML = '<p>No hay noticias para mostrar.</p>';
          return;
        }
        files.sort((a, b) => b.name.localeCompare(a.name));
        
        // **NUEVO: Llenar el Ticker con los titulares**
        if (tickerContainer) {
          populateTicker(files.slice(0, 7)); // Tomamos las 7 noticias más recientes para el ticker
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

// **NUEVA FUNCIÓN: Poblar el Ticker**
function populateTicker(files) {
  const ticker = document.querySelector('.ticker');
  if (!ticker) return;
  ticker.innerHTML = ''; // Limpiamos por si acaso
  files.forEach(file => {
    const title = formatTitleFromFilename(file.name);
    const link = document.createElement('a');
    link.href = `noticia.html?id=${file.name}`;
    link.textContent = title;
    link.classList.add('ticker-item');
    ticker.appendChild(link);
  });
}

// **NUEVA FUNCIÓN: Formatear título desde el nombre del archivo**
function formatTitleFromFilename(filename) {
  return filename
    .replace(/\.md$/, '') // Quitar la extensión .md
    .replace(/^\d{4}-\d{2}-\d{2}-/, '') // Quitar la fecha del inicio
    .replace(/-/g, ' ') // Reemplazar guiones por espacios
    .replace(/\b\w/g, l => l.toUpperCase()); // Poner en mayúscula la primera letra de cada palabra
}

function parseFrontmatter(markdownContent) {
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(markdownContent);
  const data = { frontmatter: {}, content: markdownContent };
  if (match) {
    data.content = markdownContent.replace(match[0], '').trim();
    match[1].split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        data.frontmatter[key.trim()] = valueParts.join(':').trim().replace(/"/g, '');
      }
    });
  }
  const imageMatch = data.content.match(/!\[.*\]\((.*)\)/);
  if (imageMatch) {
    data.frontmatter.image = imageMatch[1];
  }
  return data;
}

function crearTarjetaPrincipal(markdown, filename) {
  const { frontmatter, content } = parseFrontmatter(markdown);
  return `
    <article class="card featured-card">
      ${frontmatter.image ? `<img src="${frontmatter.image}" alt="Imagen destacada">` : ''}
      <div class="card-content">
        <h2><a href="/noticia?type=noticias&id=${filename}">${frontmatter.title || 'Sin título'}</a></h2>
        <p>${content.substring(0, 150)}...</p>
      </div>
    </article>
  `;
}

function crearTarjetaSecundaria(markdown, filename) {
  const { frontmatter } = parseFrontmatter(markdown);
  return `
    <article class="card">
      ${frontmatter.image ? `<img src="${frontmatter.image}" alt="Imagen de noticia">` : ''}
      <div class="card-content">
        <h3><a href="/noticia?type=noticias&id=${filename}">${frontmatter.title || 'Sin título'}</a></h3>
      </div>
    </article>
  `;
}
