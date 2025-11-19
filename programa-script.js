// --- SCRIPT COMPLETO Y CORREGIDO PARA programa.html ---

document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const postsPath = 'content/programa/posts';
  const gridContainer = document.getElementById('program-grid');

  if (!gridContainer) {
    console.error("No se encontró el contenedor #program-grid.");
    return;
  }
  
  gridContainer.innerHTML = '<p>Cargando episodios...</p>';

  // Usamos el anti-caché para obtener siempre la lista más reciente de episodios
  const timestamp = `&_=${new Date().getTime()}`;
  fetch(`https://api.github.com/repos/${repo}/contents/${postsPath}?ref=${branch}${timestamp}`)
    .then(res => {
      if (!res.ok) throw new Error(`No se pudo acceder a la carpeta de episodios: ${res.statusText}`);
      return res.json();
    })
    .then(files => {
      if (!Array.isArray(files) || files.length === 0) {
        gridContainer.innerHTML = '<p>No hay episodios publicados por el momento.</p>';
        return;
      }

      // Vaciamos el contenedor antes de añadir las tarjetas nuevas
      gridContainer.innerHTML = ''; 
      
      // Ordenamos de más reciente a más antiguo
      files.sort((a, b) => b.name.localeCompare(a.name)); 
      
      files.forEach(file => {
        if (file.type !== 'file' || !file.download_url) return;
        
        fetch(file.download_url)
          .then(res => res.text())
          .then(md => {
            gridContainer.innerHTML += crearTarjetaPrograma(md, file.name);
          });
      });
    })
    .catch(err => {
      console.error("Error al cargar los episodios del programa:", err);
      gridContainer.innerHTML = `<p style="color:red;">Error al cargar: ${err.message}</p>`;
    });
});

function crearTarjetaPrograma(markdown, filename) {
  const { frontmatter } = parseFrontmatter(markdown);
  
  // --- CORRECCIÓN 1: Se elimina la extensión .md del ID para una URL limpia ---
  const slug = filename.replace(/\.md$/, '');
  const url = `noticia.html?type=programa&id=${slug}`;
  
  const thumbnailUrl = getYouTubeThumbnail(frontmatter.embed_url) || 'https://placehold.co/400x225/EFEFEF/AAAAAA?text=Episodio';
  
  return `
    <article class="card">
      <a href="${url}"><img src="${thumbnailUrl}" alt="Miniatura para ${frontmatter.title || 'Episodio'}"></a>
      <div class="card-body">
        <time datetime="${frontmatter.date}">${formatDate(frontmatter.date)}</time>
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

// --- CORRECCIÓN 2: FUNCIONES DE UTILIDAD AÑADIDAS ---

function parseFrontmatter(md) {
  const match = /^---\s*([\s\S]*?)\s*---/.exec(md);
  const data = { frontmatter: {}, content: md };
  if (match) {
    data.content = md.replace(match[0], "").trim();
    match[1].split("\n").forEach(line => {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length > 0) {
        data.frontmatter[key.trim()] = valueParts.join(":").trim().replace(/"/g, "");
      }
    });
  }
  return data;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
}
