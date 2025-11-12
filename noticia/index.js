// Importamos las funciones necesarias
import { parse } from 'node-html-parser';
import { parseFrontmatter } from '../../utils/parseFrontmatter'; // Usaremos una función auxiliar

// Esta es la configuración que le dice a Vercel que esto es una Edge Function
export const config = {
  runtime: 'edge',
};

// Esta es la función principal que se ejecuta en el servidor de Vercel
export default async function handler(request) {
  // Obtenemos los parámetros de la URL (ej: ?type=noticias&id=mi-articulo.md)
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'noticias';
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Artículo no encontrado', { status: 404 });
  }

  // Obtenemos los datos del artículo desde GitHub
  const { frontmatter, content } = await getArticleData(type, id);
  const imageUrl = findFirstImage(content) || 'https://perspectivaspy.vercel.app/assets/img/portada.jpg'; // Imagen por defecto

  // Parseamos el HTML base para poder modificarlo
  const root = parse(htmlBase);

  // Inyectamos dinámicamente las metaetiquetas para SEO y redes sociales
  root.querySelector('title').set_content(`${frontmatter.title} | Perspectivas`);
  root.querySelector('meta[name="description"]').setAttribute('content', frontmatter.summary || '');
  root.querySelector('meta[property="og:title"]').setAttribute('content', frontmatter.title);
  root.querySelector('meta[property="og:description"]').setAttribute('content', frontmatter.summary || '');
  root.querySelector('meta[property="og:image"]').setAttribute('content', imageUrl);
  root.querySelector('meta[property="og:url"]').setAttribute('content', request.url);
  root.querySelector('meta[name="twitter:title"]').setAttribute('content', frontmatter.title);
  root.querySelector('meta[name="twitter:description"]').setAttribute('content', frontmatter.summary || '');
  root.querySelector('meta[name="twitter:image"]').setAttribute('content', imageUrl);

  // Devolvemos el HTML ya modificado
  return new Response(root.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

// Función para obtener los datos del artículo desde la API de GitHub
async function getArticleData(type, id) {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const path = `${type}/_posts/${id}`;
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('No se pudo encontrar el artículo');
  }
  const markdown = await response.text();
  return parseFrontmatter(markdown);
}

// Función para encontrar la primera imagen en el cuerpo del artículo
function findFirstImage(content) {
    const imageMatch = content.match(/!\[.*\]\((.*)\)/);
    return imageMatch ? imageMatch[1] : null;
}

// Aquí definimos la plantilla HTML base de nuestra página de artículo
const htmlBase = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Perspectivas</title>
  
  <!-- SEO y Metaetiquetas para Redes Sociales -->
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
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header class="site-header"><!-- Tu header aquí --></header>
  <main class="container">
    <article id="contenido-noticia" class="full-article">
      <p style="text-align: center; padding: 40px;">Cargando contenido...</p>
    </article>
  </main>
  <footer class="site-footer"><!-- Tu footer aquí --></footer>
  
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="/noticia-script.js"></script>
</body>
</html>
`;
