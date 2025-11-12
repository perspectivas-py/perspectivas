document.addEventListener('DOMContentLoaded', () => {
  const articleContainer = document.getElementById('contenido-noticia');
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type') || 'noticias';
  const id = urlParams.get('id');

  if (!id) return;

  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const path = `${type}/_posts/${id}`;
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;

  fetch(url)
    .then(response => response.text())
    .then(markdown => {
      const { frontmatter, content } = parseFrontmatter(markdown);
      const bodyHtml = marked.parse(content || '');
      
      const fecha = new Date(frontmatter.date);
      // CORRECCIÓN: Era toLocaleDateDateString, ahora es toLocaleDateString
      const fechaFormateada = !isNaN(fecha) ? `Publicado el ${fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}` : '';
      const autorMeta = type === 'analisis' && frontmatter.author ? `<span class="author-meta">Por: ${frontmatter.author}</span>` : '';
      
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
      
      const readingTime = Math.ceil(content.trim().split(/\s+/).length / 200);
      document.getElementById('reading-time').innerHTML = `<span>🕒 ${readingTime} min de lectura</span>`;
      
      generarBotonesSociales(document.getElementById('share-buttons'), frontmatter.title);
    });
});
