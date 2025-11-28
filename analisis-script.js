// Contenido completo y a prueba de balas para analisis-script.js

document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const postsPath = 'content/analisis/_posts'; // <-- ¡RUTA DEFINITIVA Y CORRECTA!
  const gridContainer = document.getElementById('analisis-grid');

  if (!gridContainer) return;
  
  gridContainer.innerHTML = '';
  console.log('Iniciando carga de análisis desde:', postsPath); // Mensaje de diagnóstico

  fetch(`https://api.github.com/repos/${repo}/contents/${postsPath}?ref=${branch}`)
    .then(response => {
      if (!response.ok) throw new Error(`La carpeta '${postsPath}' no fue encontrada en GitHub (error 404).`);
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
      console.error("Error final al cargar los análisis:", error);
      gridContainer.innerHTML = `<p style="color: red;">Error al cargar análisis: ${error.message}</p>`;
    });
});

function crearTarjetaAnalisis(md,filename){const{frontmatter:f}=parseFrontmatter(md);return`<article class="card">${f.image?`<img src="${f.image}" alt="">`:""}<div class="card-content"><h3><a href="noticia.html?type=analisis&id=${encodeURIComponent(filename)}">${f.title||"Sin título"}</a></h3><p class="meta" style="color: var(--color-text-secondary); font-size: 0.9em;">Por: ${f.author||"Anónimo"}</p></div></article>`}
function parseFrontmatter(md){const match=/^---\s*([\s\S]*?)\s*---/.exec(md),data={frontmatter:{},content:md};if(match){data.content=md.replace(match[0],"").trim(),match[1].split("\n").forEach(line=>{const[key,...valueParts]=line.split(":");key&&valueParts.length>0&&(data.frontmatter[key.trim()]=valueParts.join(":").trim().replace(/"/g,""))});}const imageMatch=data.content.match(/!\[.*\]\((.*)\)/);return imageMatch&&(data.frontmatter.image=imageMatch[1]),data}
