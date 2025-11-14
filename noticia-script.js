// Contenido completo y final para noticia-script.js

document.addEventListener('DOMContentLoaded', () => {
  // ... (código inicial para obtener repo, branch, type, id... no cambia) ...

  fetch(url).then(response => response.text()).then(markdown => {
    const { frontmatter, content } = parseFrontmatter(markdown);
    const bodyHtml = marked.parse(content || '');
    const fecha = new Date(frontmatter.date);
    const fechaFormateada = !isNaN(fecha) ? `Publicado el ${fecha.toLocaleDateString('es-ES', { /* ... */ })}` : '';
    const autorMeta = type === 'analisis' && frontmatter.author ? `...` : '';

    // --- ¡NUEVA LÓGICA! ---
    let contentHtml = '';
    if (type === 'programa' && frontmatter.embed_url) {
      contentHtml = `
        <div class="video-container">
          <iframe src="${frontmatter.embed_url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
        <div class="article-content">${bodyHtml}</div>
      `;
    } else {
      const { featuredImageUrl, remainingContent } = extractFeaturedImage(content);
      const articleBodyHtml = marked.parse(remainingContent || '');
      contentHtml = `
        ${featuredImageUrl ? `<figure class="featured-image"><img src="${featuredImageUrl}" alt="..."></figure>` : ''}
        <div class="article-content">${articleBodyHtml}</div>
      `;
    }
    
    articleContainer.innerHTML = `<h1>${frontmatter.title || 'Sin título'}</h1><p class="meta">...</p><hr><div class="article-meta-info">...</div>${contentHtml}`;
    
    // ... (código para tiempo de lectura y botones de compartir no cambia) ...
  });
});

// ... (todas las funciones auxiliares se mantienen igual, pero ahora necesitas añadir 'extractFeaturedImage' también) ...
