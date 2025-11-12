document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const postsPath = 'noticias/_posts'; 

  // Referencias a los NUEVOS contenedores
  const mainStoryContainer = document.getElementById('main-story-container');
  const secondaryGridContainer = document.getElementById('secondary-grid-container');

  if (!mainStoryContainer || !secondaryGridContainer) {
    console.error('Error: Faltan los contenedores de noticias principal o secundario.');
    return;
  }

  fetch(`https://api.github.com/repos/${repo}/contents/${postsPath}?ref=${branch}`)
    .then(response => response.json())
    .then(files => {
      if (!Array.isArray(files) || files.length === 0) {
        mainStoryContainer.innerHTML = '<p>No hay noticias para mostrar.</p>';
        return;
      }

      files.sort((a, b) => b.name.localeCompare(a.name)); // La más reciente primero

      // Procesamos cada archivo con su índice
      files.forEach((file, index) => {
        if (file.type !== 'file' || !file.download_url) return;

        fetch(file.download_url)
          .then(response => response.text())
          .then(markdown => {
            // El primer artículo (índice 0) va al contenedor principal
            if (index === 0) {
              const postHTML = crearTarjetaPrincipal(markdown, file.name);
              mainStoryContainer.innerHTML = postHTML;
            } 
            // El resto va a la cuadrícula secundaria
            else {
              const postHTML = crearTarjetaSecundaria(markdown, file.name);
              secondaryGridContainer.innerHTML += postHTML;
            }
          });
      });
    })
    .catch(error => console.error('Error al cargar las noticias:', error));

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
    // Buscamos la primera imagen en el contenido markdown para usarla como portada
    const imageMatch = data.content.match(/!\[.*\]\((.*)\)/);
    if (imageMatch) {
      data.frontmatter.image = imageMatch[1];
    }
    return data;
  }

  // Plantilla para el ARTÍCULO DESTACADO
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

  // Plantilla para las TARJETAS SECUNDARIAS
  function crearTarjetaSecundaria(markdown, filename) {
    const { frontmatter, content } = parseFrontmatter(markdown);
    return `
      <article class="card">
        ${frontmatter.image ? `<img src="${frontmatter.image}" alt="Imagen de noticia">` : ''}
        <div class="card-content">
          <h3><a href="noticia.html?id=${filename}">${frontmatter.title || 'Sin título'}</a></h3>
        </div>
      </article>
    `;
  }
});
