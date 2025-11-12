document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  
  // LEEMOS LOS PARÁMETROS DE LA URL
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');
  const articleType = urlParams.get('type') || 'noticias'; // Si no hay tipo, asumimos que es 'noticias'

  // CONSTRUIMOS LA RUTA DINÁMICAMENTE
  const postsPath = `${articleType}/_posts`;
  const articleContainer = document.getElementById('contenido-noticia');

  if (!articleId) { /* ... el resto del script no cambia ... */ }

  const fileUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${postsPath}/${articleId}`;
  
  // ... el fetch y el resto del código permanecen exactamente iguales ...
});
// ... las funciones auxiliares (parseFrontmatter, etc.) también permanecen iguales ...
