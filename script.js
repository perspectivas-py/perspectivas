document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main'; // O 'master' si usas esa rama
  // IMPORTANTE: Esta ruta debe coincidir con la de tu config.yml
  const postsPath = 'content/noticias'; 

  const noticiasContainer = document.getElementById('lista-noticias');

  if (!noticiasContainer) {
    console.error('Error: No se encontró el contenedor con id "lista-noticias".');
    return;
  }

  fetch(`https://api.github.com/repos/${repo}/contents/${postsPath}?ref=${branch}`)
    .then(response => {
      if (!response.ok) throw new Error('Respuesta de red no fue exitosa.');
      return response.json();
    })
    .then(files => {
      if (!Array.isArray(files) || files.length === 0) {
        noticiasContainer.innerHTML = '<p>No hay noticias para mostrar todavía.</p>';
        return;
      }

      noticiasContainer.innerHTML = ''; // Limpiar antes de añadir contenido
      
      files.forEach(file => {
        if (file.type !== 'file' || !file.download_url) return;

        fetch(file.download_url)
          .then(response => response.text())
          .then(markdown => {
            const postHTML = crearTarjetaNoticia(markdown);
            noticiasContainer.innerHTML += postHTML;
          });
      });
    })
    .catch(error => {
      console.error('Error al cargar las noticias:', error);
      noticiasContainer.innerHTML = '<p>Ocurrió un error al cargar las noticias.</p>';
    });

  function parseFrontmatter(markdownContent) {
    const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
    const match = frontmatterRegex.exec(markdownContent);
    const frontmatter = {};
    let content = markdownContent;

    if (match) {
      content = markdownContent.replace(match[0], '').trim();
      match[1].split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          frontmatter[key.trim()] = valueParts.join(':').trim().replace(/"/g, '');
        }
      });
    }
    return { frontmatter, content };
  }

  function crearTarjetaNoticia(markdown) {
    const { frontmatter, content } = parseFrontmatter(markdown);
    const bodyHtml = marked.parse(content || '');
    const fecha = new Date(frontmatter.date);
    const fechaFormateada = !isNaN(fecha) 
      ? fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Fecha no disponible';

    return `
      <article class="noticia-card">
        <h3>${frontmatter.title || 'Sin título'}</h3>
        <p class="fecha">${fechaFormateada}</p>
        <div class="contenido-resumen">
          ${bodyHtml.substring(0, 250)}...
        </div>
        <a href="#" class="leer-mas">Leer más</a>
      </article>
    `;
  }
});
