// Contenido completo y mejorado para noticia-script.js

document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const articleContainer = document.getElementById('contenido-noticia');
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type') || 'noticias';
  const id = urlParams.get('id');

  if (!id) return;
  
  const path = `content/${type}/_posts/${id}`;
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;

  fetch(url)
    .then(response => response.text())
    .then(markdown => {
      const { frontmatter, content } = parseFrontmatter(markdown);
      
      // --- ¡LA NUEVA LÓGICA DE IMAGEN DESTACADA! ---
      const { featuredImageUrl, remainingContent } = extractFeaturedImage(content);
      const bodyHtml = marked.parse(remainingContent || '');
      
      const fecha = new Date(frontmatter.date);
      const fechaFormateada = !isNaN(fecha) ? `Publicado el ${fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}` : '';
      const autorMeta = type === 'analisis' && frontmatter.author ? `<span class="author-meta">Por: ${frontmatter.author}</span>` : '';
      
      // Construimos el nuevo HTML con el contenedor para la imagen
      articleContainer.innerHTML = `
        <h1>${frontmatter.title || 'Sin título'}</h1>
        <p class="meta">${fechaFormateada}${autorMeta ? ` • ${autorMeta}` : ''}</p>
        
        ${featuredImageUrl ? `
          <figure class="featured-image">
            <img src="${featuredImageUrl}" alt="Imagen principal del artículo: ${frontmatter.title || ''}">
          </figure>
        ` : ''}

        <hr>
        <div class="article-meta-info">
          <div id="reading-time"></div>
          <div id="share-buttons"></div>
        </div>
        <div class="article-content">${bodyHtml}</div>
      `;
      
      const readingTime = Math.ceil((remainingContent || '').trim().split(/\s+/).length / 200);
      document.getElementById('reading-time').innerHTML = `<span>🕒 ${readingTime} min de lectura</span>`;
      generarBotonesSociales(document.getElementById('share-buttons'), frontmatter.title);
    });
});

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
