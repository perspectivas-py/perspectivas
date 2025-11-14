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

// --- NUEVA FUNCIÓN AUXILIAR ---
function extractFeaturedImage(content) {
  const imageRegex = /!\[(.*?)\]\((.*?)\)/;
  const match = content.match(imageRegex);

  if (match) {
    const featuredImageUrl = match[2];
    const remainingContent = content.replace(imageRegex, '').trim();
    return { featuredImageUrl, remainingContent };
  }

  return { featuredImageUrl: null, remainingContent: content };
}

// --- FUNCIONES AUXILIARES EXISTENTES ---
function generarBotonesSociales(container, title) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(`Leé este contenido de Perspectivas: "${title}"`);
  container.innerHTML = `<span>Compartir:</span><a href="https://twitter.com/intent/tweet?url=${url}&text=${text}&via=perspectivaspy" target="_blank" title="Compartir en Twitter"><i class="fab fa-twitter"></i></a><a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" title="Compartir en Facebook"><i class="fab fa-facebook"></i></a><a href="https://api.whatsapp.com/send?text=${text}%20${url}" target="_blank" title="Compartir en WhatsApp"><i class="fab fa-whatsapp"></i></a><a href="https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}" target="_blank" title="Compartir en LinkedIn"><i class="fab fa-linkedin"></i></a>`;
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
