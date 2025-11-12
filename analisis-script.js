document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  // <-- ¡ESTA ES LA RUTA CORRECTA Y DEFINITIVA! -->
  const postsPath = 'analisis/_posts'; 
  const gridContainer = document.getElementById('analisis-grid');

  if (!gridContainer) {
    console.error("El contenedor 'analisis-grid' no fue encontrado.");
    return;
  }
  
  gridContainer.innerHTML = ''; // Limpiamos el mensaje "Cargando..."

  fetch(`https://api.github.com/repos/${repo}/contents/${postsPath}?ref=${branch}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('No se pudo encontrar la carpeta de análisis. Verifica la ruta en el script y en GitHub.');
        }
        return response.json();
    })
    .then(files => {
      if (!Array.isArray(files) || files.length === 0) {
        gridContainer.innerHTML = '<p>No hay artículos de análisis publicados por el momento.</p>';
        return;
      }

      files.sort((a, b) => b.name.localeCompare(a.name));
      files.forEach(file => {
        if (file.type !== 'file' || !file.download_url) return;
        fetch(file.download_url)
          .then(res => res.text())
          .then(md => gridContainer.innerHTML += crearTarjetaAnalisis(md, file.name));
      });
    })
    .catch(error => {
        console.error("Error al cargar los análisis:", error);
        gridContainer.innerHTML = `<p>Ocurrió un error al cargar el contenido. ${error.message}</p>`;
    });
});

function crearTarjetaAnalisis(markdown, filename) {
  const { frontmatter } = parseFrontmatter(markdown);
  const url = `/noticia?type=noticias&id=${filename}`;
  return `
    <article class="card">
      ${frontmatter.image ? `<img src="${frontmatter.image}" alt="">` : ''}
      <div class="card-content">
        <h3><a href="/noticia?type=analisis&id=${filename}">${frontmatter.title || 'Sin título'}</a></h3>
        <p class="meta" style="color: var(--color-text-secondary); font-size: 0.9em;">Por: ${frontmatter.author || 'Anónimo'}</p>
      </div>
    </article>
  `;
}

function parseFrontmatter(markdownContent) {
    const frontmatterRegex = /^---\s*([\s*[\s\S]*?)\s*---/;
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
    const imageMatch = data.content.match(/!\[.*\]\((.*)\)/);
    if (imageMatch) {
      data.frontmatter.image = imageMatch[1];
    }
    return data;
}
