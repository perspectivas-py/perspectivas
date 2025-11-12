// Importamos las funciones necesarias
import { parse } from 'node-html-parser';
// ¡OJO! La ruta para importar debe ser correcta desde la carpeta `noticia`
import { parseFrontmatter, findFirstImage } from '../utils/parseFrontmatter.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'noticias';
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Artículo no encontrado: ID no especificado', { status: 404 });
    }

    const { frontmatter, content } = await getArticleData(type, id);
    // Usamos la imagen del artículo o una por defecto si no hay
    const imageUrl = findFirstImage(content) || 'https://perspectivaspy.vercel.app/assets/img/portada.jpg';
    
    const root = parse(htmlBase);

    // Inyectamos las metaetiquetas
    root.querySelector('title').set_content(`${frontmatter.title} | Perspectivas`);
    root.querySelector('meta[name="description"]').setAttribute('content', frontmatter.summary || '');
    root.querySelector('meta[property="og:title"]').setAttribute('content', frontmatter.title);
    root.querySelector('meta[property="og:description"]').setAttribute('content', frontmatter.summary || '');
    root.querySelector('meta[property="og:image"]').setAttribute('content', imageUrl);
    root.querySelector('meta[property="og:url"]').setAttribute('content', request.url);
    root.querySelector('meta[name="twitter:title"]').setAttribute('content', frontmatter.title);
    root.querySelector('meta[name="twitter:description"]').setAttribute('content', frontmatter.summary || '');
    root.querySelector('meta[name="twitter:image"]').setAttribute('content', imageUrl);
    
    // Devolvemos el HTML modificado
    return new Response(root.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error(error);
    return new Response(`Error al procesar la solicitud: ${error.message}`, { status: 500 });
  }
}

async function getArticleData(type, id) {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const path = `${type}/_posts/${id}`;
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('No se pudo encontrar el artículo en GitHub');
  }
  const markdown = await response.text();
  return parseFrontmatter(markdown);
}

// Plantilla HTML Base
const htmlBase = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Perspectivas</title>
  
  <meta name="description" content="">
  <meta property="og:type" content="article">
  <meta property="og:title" content="">
  <meta property="og:description" content="">
  <meta property="og:image" content="">
  <meta property="og:url" content="">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="">
  <meta name="twitter:description" content="">
  <meta name="twitter:image" content="">
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  
  <!-- ¡IMPORTANTE! Las rutas a los archivos estáticos ahora son absolutas desde la raíz -->
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <div class="brand">
        <a href="/" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 15px;">
          <img class="logo" src="/assets/img/logo.jpeg" alt="Perspectivas">
          <div><h1 class="site-title">Perspectivas</h1></div>
        </a>
      </div>
      <nav class="main-nav">
        <a href="/">Inicio</a>
        <a href="/analisis.html">Análisis</a>
      </nav>
      <button id="themeToggle" class="theme-toggle" aria-label="Alternar modo oscuro">
        <span class="icon">🌙</span>
      </button>
    </div>
  </header>
  
  <main class="container">
    <article id="contenido-noticia" class="full-article">
      <p style="text-align: center; padding: 40px;">Cargando contenido del artículo...</p>
    </article>
  </main>
  
  <footer class="site-footer">
    <div class="container">
      <div class="footer-row">
        <span>© 2025 Perspectivas · <a href="/">Volver al inicio</a></span>
      </div>
    </div>
  </footer>
  
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <!-- Este script se encargará de rellenar el contenido en el lado del cliente -->
  <script src="/article-loader.js"></script>
  <!-- Este script se encargará del modo oscuro -->
  <script src="/script.js"></script>
</body>
</html>
`;```

---

### **Paso 3: Archivo `article-loader.js` (El Rellenador del Lado del Cliente)**

El archivo `noticia/index.js` ahora solo se encarga de las metaetiquetas. Necesitamos un nuevo script para cargar el contenido del artículo en el navegador del usuario.

1.  **Crea un archivo** en la **raíz** de tu proyecto llamado `article-loader.js`.
2.  Pega el siguiente código en él (es una versión simplificada del antiguo `noticia-script.js`):

```javascript
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
      const fechaFormateada = !isNaN(fecha) ? `Publicado el ${fecha.toLocaleDateDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}` : '';
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

function generarBotonesSociales(container, title) { /* ... esta función se mantiene igual ... */ }
function parseFrontmatter(markdownContent) { /* ... esta función se mantiene igual ... */ }
// ¡IMPORTANTE! Debes copiar las funciones 'generarBotonesSociales' y 'parseFrontmatter' de versiones anteriores de los scripts y pegarlas aquí.
