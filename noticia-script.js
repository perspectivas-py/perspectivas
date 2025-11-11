document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const postsPath = 'content/noticias';
  const articleContainer = document.getElementById('contenido-noticia');

  // 1. Obtener el ID de la noticia desde la URL
  const urlParams = new URLSearchParams(window.location.search);
  const noticiaId = urlParams.get('id');

  if (!noticiaId) {
    articleContainer.innerHTML = '<h1>Error: No se ha especificado una noticia para cargar.</h1>';
    return;
  }

  // 2. Construir la URL del archivo y hacer fetch
  const fileUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${postsPath}/${noticiaId}`;

  fetch(fileUrl)
    .then(response => {
      if (!response.ok) throw new Error('No se pudo encontrar la noticia.');
      return response.text();
    })
    .then(markdown => {
      // 3. Procesar el markdown y mostrarlo en la página
      const { frontmatter, content } = parseFrontmatter(markdown);
      const bodyHtml = marked.parse(content || '');

      // Actualizar el título de la página
      document.title = `${frontmatter.title || 'Noticia'} | Perspectivas`;

      const fecha = new Date(frontmatter.date);
      const fechaFormateada = !isNaN(fecha) 
        ? fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';
      
      articleContainer.innerHTML = `
        <h1>${frontmatter.title || 'Sin título'}</h1>
        <p class="meta">${fechaFormateada}</p>
        <div class="article-content">
          ${bodyHtml}
        </div>
      `;
    })
    .catch(error => {
      console.error('Error al cargar la noticia:', error);
      articleContainer.innerHTML = '<h1>Error 404: Noticia no encontrada.</h1>';
    });

  // Reutilizamos la misma función para parsear que en el script principal
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
});
