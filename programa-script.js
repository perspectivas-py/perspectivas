document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const postsPath = 'content/programa/_posts';
  const gridContainer = document.getElementById('program-grid');
  if(!gridContainer) return;
  gridContainer.innerHTML = '';

  fetch(`https://api.github.com/repos/${repo}/contents/${postsPath}?ref=${branch}`)
    .then(res => res.json()).then(files => {
      if(!Array.isArray(files) || files.length === 0) {
        gridContainer.innerHTML = '<p>No hay episodios publicados.</p>';
        return;
      }
      files.sort((a, b) => b.name.localeCompare(a.name));
      files.forEach(file => {
        if(file.type !== 'file' || !file.download_url) return;
        fetch(file.download_url).then(res => res.text())
          .then(md => gridContainer.innerHTML += crearTarjetaPrograma(md, file.name));
      });
    }).catch(err => gridContainer.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`);
});

function crearTarjetaPrograma(markdown, filename) {
  const { frontmatter } = parseFrontmatter(markdown);
  const url = `noticia.html?type=programa&id=${filename}`;
  const thumbnailUrl = getYouTubeThumbnail(frontmatter.embed_url) || 'https://via.placeholder.com/400x225?text=Episodio';
  return `
    <article class="card">
      <a href="${url}"><img src="${thumbnailUrl}" alt=""></a>
      <div class="card-body">
        <time>${formatDate(frontmatter.date)}</time>
        <h3><a href="${url}">${frontmatter.title || 'Sin Título'}</a></h3>
      </div>
    </article>
  `;
}

function getYouTubeThumbnail(embedUrl) {
  if (!embedUrl || !embedUrl.includes('youtube.com/embed/')) return null;
  const videoId = embedUrl.split('/').pop();
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// ... (Aquí necesitas copiar y pegar las funciones 'parseFrontmatter' y 'formatDate' de tu archivo 'analisis-script.js') ...
