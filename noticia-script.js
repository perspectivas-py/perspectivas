document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const articleContainer = document.getElementById('contenido-noticia');

  // 1. LEEMOS LOS PARÁMETROS CLAVE DE LA URL
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');
  // Si no se especifica el tipo, asumimos que es una 'noticia' para mantener la retrocompatibilidad
  const articleType = urlParams.get('type') || 'noticias'; 

  if (!articleId) {
    articleContainer.innerHTML = '<h1>Error: Artículo no especificado.</h1>';
    return;
  }

  // 2. CONSTRUIMOS LA RUTA A LA CARPETA CORRECTA DE FORMA DINÁMICA
  const postsPath = `${articleType}/_posts`;
  const fileUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${postsPath}/${articleId}`;

  // 3. HACEMOS FETCH Y CONSTRUIMOS EL HTML (el resto del proceso es el mismo)
  fetch(fileUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('No se pudo cargar el archivo del artículo.');
      }
      return response.text();
    })
    .then(markdown => {
      const { frontmatter, content } = parseFrontmatter(markdown);
      const bodyHtml = marked.parse(content || '');

      document.title = `${frontmatter.title || 'Artículo'} | Perspectivas`;

      const fecha = new Date(frontmatter.date);
      const fechaFormateada = !isNaN(fecha) 
        ? `Publicado el ${fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`
        : '';

      // Si es un análisis y tiene autor, lo preparamos para mostrarlo
      const autorMeta = articleType === 'analisis' && frontmatter.author
        ? `<span class="author-meta">Por: ${frontmatter.author}</span>`
        : '';
      
      articleContainer.innerHTML = `
        <h1>${frontmatter.title || 'Sin título'}</h1>
        <p class="meta">
          ${fechaFormateada}
          ${autorMeta ? ` • ${autorMeta}` : ''}
        </p>
        <hr>
        <div class="article-meta-info">
          <div id="reading-time"></div>
          <div id="share-buttons"></div>
        </div>
        <div class="article-content">${bodyHtml}</div>
      `;
      
      // Funciones premium
      const readingTimeContainer = document.getElementById('reading-time');
      const tiempoDeLectura = calcularTiempoLectura(content);
      readingTimeContainer.innerHTML = `<span>🕒 ${tiempoDeLectura} min de lectura</span>`;
      
      const shareButtonsContainer = document.getElementById('share-buttons');
      generarBotonesSociales(shareButtonsContainer, frontmatter.title);
    })
    .catch(error => {
      console.error('Error al cargar el artículo:', error);
      articleContainer.innerHTML = '<h1>Error 404: Artículo no encontrado.</h1> <p>Es posible que el enlace sea incorrecto o que el contenido haya sido eliminado.</p>';
    });
});


// --- FUNCIONES AUXILIARES (no cambian) ---

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

function calcularTiempoLectura(texto) {
  const palabrasPorMinuto = 200;
  const numeroDePalabras = texto.trim().split(/\s+/).length;
  return Math.ceil(numeroDePalabras / palabrasPorMinuto);
}

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
