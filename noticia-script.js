document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const postsPath = 'noticias/_posts';
  const articleContainer = document.getElementById('contenido-noticia');
  
  const urlParams = new URLSearchParams(window.location.search);
  const noticiaId = urlParams.get('id');

  if (!noticiaId) {
    articleContainer.innerHTML = '<h1>Error: Noticia no especificada.</h1>';
    return;
  }

  const fileUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${postsPath}/${noticiaId}`;

  fetch(fileUrl)
    .then(response => response.text())
    .then(markdown => {
      const { frontmatter, content } = parseFrontmatter(markdown);
      const bodyHtml = marked.parse(content || '');

      document.title = `${frontmatter.title || 'Noticia'} | Perspectivas`;

      const fecha = new Date(frontmatter.date);
      const fechaFormateada = !isNaN(fecha) 
        ? `Publicado el ${fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`
        : '';
      
      articleContainer.innerHTML = `
        <h1>${frontmatter.title || 'Sin título'}</h1>
        <p class="meta">${fechaFormateada}</p>
        <hr>
        <div class="article-meta-info">
          <div id="reading-time"></div>
          <div id="share-buttons"></div>
        </div>
        <div class="article-content">${bodyHtml}</div>
      `;
      
      // *** NUEVAS FUNCIONES PREMIUM ***
      // 1. Calcular y mostrar tiempo de lectura
      const readingTimeContainer = document.getElementById('reading-time');
      const tiempoDeLectura = calcularTiempoLectura(content);
      readingTimeContainer.innerHTML = `<span>🕒 ${tiempoDeLectura} min de lectura</span>`;
      
      // 2. Generar y mostrar botones para compartir
      const shareButtonsContainer = document.getElementById('share-buttons');
      generarBotonesSociales(shareButtonsContainer, frontmatter.title);

    })
    .catch(error => {
      console.error('Error al cargar la noticia:', error);
      articleContainer.innerHTML = '<h1>Error 404: Noticia no encontrada.</h1>';
    });
});

function parseFrontmatter(markdownContent) {
  // (Esta función no cambia, la dejamos como está)
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

// *** NUEVA FUNCIÓN: Calcular tiempo de lectura ***
function calcularTiempoLectura(texto) {
  const palabrasPorMinuto = 200;
  const numeroDePalabras = texto.trim().split(/\s+/).length;
  return Math.ceil(numeroDePalabras / palabrasPorMinuto);
}

// *** NUEVA FUNCIÓN: Generar botones de redes sociales ***
function generarBotonesSociales(container, title) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(`Leé esta nota de Perspectivas: "${title}"`);

  container.innerHTML = `
    <span>Compartir:</span>
    <a href="https://twitter.com/intent/tweet?url=${url}&text=${text}&via=perspectivaspy" target="_blank" title="Compartir en Twitter">Twitter</a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" title="Compartir en Facebook">Facebook</a>
    <a href="https://api.whatsapp.com/send?text=${text}%20${url}" target="_blank" title="Compartir en WhatsApp">WhatsApp</a>
    <a href="https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}" target="_blank" title="Compartir en LinkedIn">LinkedIn</a>
  `;
}
