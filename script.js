// Contenido completo y final para script.js

document.addEventListener('DOMContentLoaded', () => {
  
  // --- FUNCIONALIDAD DEL MODO OSCURO ---
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  const themeIcon = themeToggle ? themeToggle.querySelector('.icon') : null;

  if(themeToggle){
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

  // --- FUNCIONALIDAD PARA CARGAR NOTICIAS Y TICKER ---
  const mainStoryContainer = document.getElementById('main-story-container');
  const secondaryGridContainer = document.getElementById('secondary-grid-container');
  const tickerContainer = document.querySelector('.ticker');

  if (mainStoryContainer && secondaryGridContainer) {
    const repo = 'perspectivas-py/perspectivas';
    const branch = 'main';
    const postsPath = 'content/noticias/_posts';

    fetch(`https://api.github.com/repos/${repo}/contents/${postsPath}?ref=${branch}`)
      .then(response => {
        if (!response.ok) throw new Error(`La carpeta de noticias no fue encontrada.`);
        return response.json();
      })
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
          fetch(file.download_url).then(res => res.text()).then(md => {
            if (index === 0) {
              // El primer artículo (el más reciente) va al contenedor principal
              mainStoryContainer.innerHTML = crearTarjetaPrincipal(md, file.name);
            } else {
              // El resto va a la cuadrícula secundaria
              secondaryGridContainer.innerHTML += crearTarjetaSecundaria(md, file.name);
            }
          });
        });
      })
      .catch(error => {
        console.error('Error al cargar noticias:', error);
        mainStoryContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
      });
  }
});

// --- FUNCIONES AUXILIARES ---

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
  if (imageMatch) data.frontmatter.image = imageMatch[1];
  return data;
}

function crearTarjetaPrincipal(markdown, filename) {
  const { frontmatter, content } = parseFrontmatter(markdown);
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

function populateTicker(files) {
  const ticker = document.querySelector('.ticker');
  if (!ticker) return;
  ticker.innerHTML = '';
  files.forEach(file => {
    const title = formatTitleFromFilename(file.name);
    const link = document.createElement('a');
    link.href = `noticia.html?type=noticias&id=${file.name}`;
    link.textContent = title;
    link.classList.add('ticker-item');
    ticker.appendChild(link);
  });
}

function formatTitleFromFilename(filename) {
  return filename.replace(/\.md$/,"").replace(/^\d{4}-\d{2}-\d{2}-/,"").replace(/-/g," ").replace(/\b\w/g,l=>l.toUpperCase());
}
