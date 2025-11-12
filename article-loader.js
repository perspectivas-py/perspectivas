// Contenido completo para article-loader.js

document.addEventListener('DOMContentLoaded', () => {
  const articleContainer = document.getElementById('contenido-noticia');
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type') || 'noticias';
  const id = urlParams.get('id');

  // Si no hay ID en la URL, no hacemos nada.
  if (!id) {
    articleContainer.innerHTML = '<h1>Error: Artículo no encontrado.</h1>';
    return;
  }

  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const path = `${type}/_posts/${id}`;
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;

  // Buscamos el contenido del artículo en GitHub
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('No se pudo cargar el contenido del artículo.');
      return response.text();
    })
    .then(markdown => {
      // Usamos las funciones auxiliares para procesar el contenido
      const { frontmatter, content } = parseFrontmatter(markdown);
      const bodyHtml = marked.parse(content || '');
      
      const fecha = new Date(frontmatter.date);
      const fechaFormateada = !isNaN(fecha) ? `Publicado el ${fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}` : '';
      const autorMeta = type === 'analisis' && frontmatter.author ? `<span class="author-meta">Por: ${frontmatter.author}</span>` : '';
      
      // Reemplazamos el "Cargando..." con el contenido real del artículo
      articleContainer.innerHTML = `
        <h1>${frontmatter.title || 'Sin título'}</h1>
        <p class="meta">${fechaFormateada}${autorMeta ? ` • ${autorMeta}` : ''}</p>
        <hr>
        <div class="article-meta-info">
          <div id="reading-time"></div>
          <div id="share-buttons"></div>
        </div>
        <div class="article-content">${bodyHtml}</div>
      `;
      
      // Calculamos y mostramos el tiempo de lectura
      const readingTime = Math.ceil(content.trim().split(/\s+/).length / 200);
      document.getElementById('reading-time').innerHTML = `<span>🕒 ${readingTime} min de lectura</span>`;
      
      // Generamos y mostramos los botones para compartir en redes sociales
      generarBotonesSociales(document.getElementById('share-buttons'), frontmatter.title);
    })
    .catch(error => {
      console.error(error);
      articleContainer.innerHTML = '<h1>Error al cargar el contenido.</h1><p>Por favor, revisa que el enlace sea correcto.</p>';
    });
});


// --- FUNCIONES AUXILIARES ---
// Estas funciones son necesarias para que el script funcione.

function generarBotonesSociales(container, title) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(`Leé este contenido de Perspectivas: "${title}"`);
  container.innerHTML = `
    <span>Compartir:</span>
    <a href="https://twitter.com/intent/tweet?url=${url}&text=${text}&via=perspectivaspy" target="_blank" title="Compartir en Twitter"><i class="fab fa-twitter"></i></a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" title="Compartir en Facebook"><i class="fab fa-facebook"></i></a>
    <a href="https://api.whatsapp.com/send?text=${text}%20${url}" target="_blank" title="Compartir en WhatsApp"><i class="fab fa-whatsapp"></i></a>
    <a href="https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}" target="_blank" title="Compartir en LinkedIn"><i class="fab fa-linkedin"></i></a>
  `;
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
  return data;
}
