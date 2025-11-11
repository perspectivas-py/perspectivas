document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const postsPath = 'content/noticias'; // Asegúrate que esta es la carpeta de tus noticias
  const articleContainer = document.getElementById('contenido-noticia');

  // Leer el parámetro 'id' de la URL (ej: noticia.html?id=mi-noticia.md)
  const urlParams = new URLSearchParams(window.location.search);
  const noticiaId = urlParams.get('id');

  if (!noticiaId) {
    articleContainer.innerHTML = '<h1>Error: Noticia no especificada.</h1>';
    return;
  }

  // Usamos la URL de 'raw' de GitHub para obtener el archivo de texto plano
  const fileUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${postsPath}/${noticiaId}`;

  fetch(fileUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('No se pudo cargar el archivo de la noticia.');
      }
      return response.text();
    })
    .then(markdown => {
      const { frontmatter, content } = parseFrontmatter(markdown);
      
      // Convertir el cuerpo del artículo de Markdown a HTML
      const bodyHtml = marked.parse(content || '');

      // Actualizar el título de la pestaña del navegador
      document.title = `${frontmatter.title || 'Noticia'} | Perspectivas`;

      // Formatear la fecha
      const fecha = new Date(frontmatter.date);
      const fechaFormateada = !isNaN(fecha) 
        ? `Publicado el ${fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`
        : '';
      
      // Inyectar el HTML final en el contenedor
      articleContainer.innerHTML = `
        <h1>${frontmatter.title || 'Sin título'}</h1>
        <p class="meta">${fechaFormateada}</p>
        <hr>
        <div class="article-content">
          ${bodyHtml}
        </div>
      `;
    })
    .catch(error => {
      console.error('Error al cargar la noticia:', error);
      articleContainer.innerHTML = '<h1>Error 404: La noticia solicitada no existe.</h1> <p>Es posible que el enlace sea incorrecto o que el contenido haya sido eliminado.</p>';
    });
});

// Esta función es una copia de la que usamos en script.js
// Sirve para separar los metadatos (título, fecha) del contenido principal
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
}```
