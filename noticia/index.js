// Contenido completo para noticia/index.js
import { parse } from 'node-html-parser';
import { parseFrontmatter, findFirstImage } from '../utils/parseFrontmatter.js';

// ... (config de runtime no cambia) ...
export default async function handler(request) {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'noticias';
    const id = searchParams.get('id');

    if (!id) throw new Error('ID de artículo no especificado');

    const { frontmatter, content } = await getArticleData(type, id);
    const imageUrl = findFirstImage(content) || 'https://perspectivaspy.vercel.app/assets/img/portada.jpg';
    
    const root = parse(htmlBase);

    root.querySelector('title').set_content(`${frontmatter.title || 'Artículo'} | Perspectivas`);
    root.querySelector('meta[name="description"]').setAttribute('content', frontmatter.summary || '');
    root.querySelector('meta[property="og:title"]').setAttribute('content', frontmatter.title);
    root.querySelector('meta[property="og:description"]').setAttribute('content', frontmatter.summary || '');
    root.querySelector('meta[property="og:image"]').setAttribute('content', imageUrl);
    root.querySelector('meta[property="og:url"]').setAttribute('content', request.url);
    root.querySelector('meta[name="twitter:title"]').setAttribute('content', frontmatter.title);
    root.querySelector('meta[name="twitter:description"]').setAttribute('content', frontmatter.summary || '');
    root.querySelector('meta[name="twitter:image"]').setAttribute('content', imageUrl);
    
    return new Response(root.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error en Edge Function:', error);
    return new Response(`Error en el servidor: ${error.message}. Revisa los logs de Vercel.`, { status: 500 });
  }
}

async function getArticleData(type, id) {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const path = `content/${type}/_posts/${id}`; // <-- RUTA UNIFICADA
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Artículo no encontrado en GitHub');
  const markdown = await response.text();
  return parseFrontmatter(markdown);
}

const htmlBase = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Perspectivas</title>
  <meta name="description" content=""><meta property="og:type" content="article"><meta property="og:title" content=""><meta property="og:description" content=""><meta property="og:image" content=""><meta property="og:url" content=""><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content=""><meta name="twitter:description" content=""><meta name="twitter:image" content="">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Lato:wght@400;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <div class="brand"><a href="/" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 15px;"><img class="logo" src="/assets/img/logo.jpeg" alt="Perspectivas"><div><h1 class="site-title">Perspectivas</h1></div></a></div>
      <nav class="main-nav"><a href="/">Inicio</a><a href="/analisis.html">Análisis</a></nav>
      <button id="themeToggle" class="theme-toggle" aria-label="Alternar modo oscuro"><span class="icon">🌙</span></button>
    </div>
  </header>
  <main class="container">
    <article id="contenido-noticia" class="full-article"><p style="text-align: center; padding: 40px;">Cargando contenido...</p></article>
  </main>
  <footer class="site-footer">
    <div class="container"><div class="footer-row"><span>© 2025 Perspectivas · <a href="/">Volver al inicio</a></span></div></div>
  </footer>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="/article-loader.js"></script><script src="/script.js"></script>
</body>
</html>
`;
