// Reemplaza TODO el contenido de script.js con esto

document.addEventListener('DOMContentLoaded', () => {
  
  // --- FUNCIONALIDAD DEL MODO OSCURO ---
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  const themeIcon = themeToggle ? themeToggle.querySelector('.icon') : null;

  // Función para cambiar el tema
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

  // Aplicar el tema guardado al cargar la página
  if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-mode');
    if(themeIcon) themeIcon.textContent = '☀️';
  }

  // Añadir el evento al botón
  if(themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // --- FUNCIONALIDAD PARA CARGAR NOTICIAS (Solo en la página principal) ---
  const mainStoryContainer = document.getElementById('main-story-container');
  const secondaryGridContainer = document.getElementById('secondary-grid-container');

  // Si los contenedores de noticias existen, ejecutamos la lógica para cargar noticias
  if (mainStoryContainer && secondaryGridContainer) {
    const repo = 'perspectivas-py/perspectivas';
    const branch = 'main';
    const postsPath = 'noticias/_posts';

    fetch(`https://api.github.com/repos/${repo}/contents/${postsPath}?ref=${branch}`)
      .then(response => response.json())
      .then(files => {
        if (!Array.isArray(files) || files.length === 0) {
          mainStoryContainer.innerHTML = '<p>No hay noticias para mostrar.</p>';
          return;
        }
        files.sort((a, b) => b.name.localeCompare(a.name));
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


// --- FUNCIONES AUXILIARES (no necesitan estar dentro del DOMContentLoaded) ---

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
        <h2><a href="noticia.html?id=${filename}">${frontmatter.title || 'Sin título'}</a></h2>
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
        <h3><a href="noticia.html?id=${filename}">${frontmatter.title || 'Sin título'}</a></h3>
      </div>
    </article>
  `;
}
