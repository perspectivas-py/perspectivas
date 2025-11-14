document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const articleContainer = document.getElementById('contenido-noticia');
  
  // Leemos los parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type') || 'noticias'; // 'noticias', 'analisis', o 'programa'
  const id = urlParams.get('id');

  if (!id) return;
  
  const path = `content/${type}/_posts/${id}`;
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;

  fetch(url)
    .then(response => response.text())
    .then(markdown => {
      const { frontmatter, content } = parseFrontmatter(markdown);
      
      // Preparamos la fecha y el autor
      const fecha = new Date(frontmatter.date);
      const fechaFormateada = !isNaN(fecha) ? `Publicado el ${fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}` : '';
      const autorMeta = (type === 'analisis' && frontmatter.author) ? `<span class="author-meta">Por: ${frontmatter.author}</span>` : '';
      
      let mediaHtml = '';
      let bodyHtml = '';

      // --- LÓGICA INTELIGENTE SEGÚN EL TIPO ---
      
      if (type === 'programa' && frontmatter.embed_url) {
        // CASO 1: Es un PROGRAMA con video
        mediaHtml = `
          <div class="video-container">
            <iframe src="${frontmatter.embed_url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        `;
        // Renderizamos todo el contenido markdown debajo
        bodyHtml = marked.parse(content || '');

      } else {
        // CASO 2: Es NOTICIA o ANÁLISIS (Texto + Imagen)
        // Extraemos la imagen destacada para que no se repita
        const { featuredImageUrl, remainingContent } = extractFeaturedImage(content);
        
        if (featuredImageUrl) {
          mediaHtml = `
            <figure class="featured-image">
              <img src="${featuredImageUrl}" alt="Imagen principal: ${frontmatter.title || ''}">
            </figure>
          `;
        }
        // Renderizamos el resto del contenido sin la imagen
        bodyHtml = marked.parse(remainingContent || '');
      }
      
      // Inyectamos el HTML final
      articleContainer.innerHTML = `
        <h1>${frontmatter.title || 'Sin título'}</h1>
        <p class="meta">${fechaFormateada}${autorMeta ? ` • ${autorMeta}` : ''}</p>
        
        ${mediaHtml}

        <hr>
        <div class="article-meta-info">
          <div id="reading-time"></div>
          <div id="share-buttons"></div>
        </div>
        <div class="article-content">${bodyHtml}</div>
      `;
      
      // Funciones extra (tiempo lectura, compartir)
      const textForTime = type === 'programa' ? (content || '') : (content || ''); // Calculamos sobre el texto disponible
      const readingTime = Math.ceil(textForTime.trim().split(/\s+/).length / 200);
      document.getElementById('reading-time').innerHTML = `<span>🕒 ${readingTime} min de lectura</span>`;
      generarBotonesSociales(document.getElementById('share-buttons'), frontmatter.title);
    });
});

// --- FUNCIONES AUXILIARES ---

function extractFeaturedImage(content) {
  const imageRegex = /!\[(.*?)\]\((.*?)\)/;
  const match = content.match(imageRegex);
  if (match) {
    return { featuredImageUrl: match[2], remainingContent: content.replace(imageRegex, '').trim() };
  }
  return { featuredImageUrl: null, remainingContent: content };
}

function generarBotonesSociales(container, title) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(`Leé este contenido de Perspectivas: "${title}"`);
  container.innerHTML = `<span>Compartir:</span><a href="https://twitter.com/intent/tweet?url=${url}&text=${text}&via=perspectivaspy" target="_blank" title="Twitter"><i class="fab fa-twitter"></i></a><a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" title="Facebook"><i class="fab fa-facebook"></i></a><a href="https://api.whatsapp.com/send?text=${text}%20${url}" target="_blank" title="WhatsApp"><i class="fab fa-whatsapp"></i></a><a href="https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}" target="_blank" title="LinkedIn"><i class="fab fa-linkedin"></i></a>`;
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
