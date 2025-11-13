// Contenido completo y a prueba de balas para script.js

document.addEventListener('DOMContentLoaded', () => {
  // --- MODO OSCURO (sin cambios) ---
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  const themeIcon = themeToggle ? themeToggle.querySelector('.icon') : null;
  if(themeToggle){
    const toggleTheme=()=>{body.classList.toggle("dark-mode"),localStorage.setItem("theme",body.classList.contains("dark-mode")?"dark":"light"),themeIcon.textContent=body.classList.contains("dark-mode")?"☀️":"🌙"};
    "dark"===localStorage.getItem("theme")&&(body.classList.add("dark-mode"),themeIcon.textContent="☀️"),themeToggle.addEventListener("click",toggleTheme);
  }

  // --- CARGA DE NOTICIAS Y TICKER ---
  const mainStoryContainer = document.getElementById('main-story-container');
  const secondaryGridContainer = document.getElementById('secondary-grid-container');
  const tickerContainer = document.querySelector('.ticker');

  if (mainStoryContainer && secondaryGridContainer) {
    const repo = 'perspectivas-py/perspectivas';
    const branch = 'main';
    const postsPath = 'content/noticias/_posts'; // <-- ¡RUTA DEFINITIVA Y CORRECTA!

    console.log('Iniciando carga de noticias desde:', postsPath); // Mensaje de diagnóstico

    fetch(`https://api.github.com/repos/${repo}/contents/${postsPath}?ref=${branch}`)
      .then(response => {
        if (!response.ok) throw new Error(`La carpeta '${postsPath}' no fue encontrada en GitHub (error 404).`);
        return response.json();
      })
      .then(files => {
        if (!Array.isArray(files) || files.length === 0) {
          mainStoryContainer.innerHTML = '<p>No hay noticias para mostrar en este momento.</p>';
          return;
        }
        files.sort((a, b) => b.name.localeCompare(a.name));
        
        if (tickerContainer) populateTicker(files.slice(0, 7));

        files.forEach((file, index) => {
          if (file.type !== 'file' || !file.download_url) return;
          fetch(file.download_url).then(res => res.text()).then(md => {
            if (index === 0) mainStoryContainer.innerHTML = crearTarjetaPrincipal(md, file.name);
            else secondaryGridContainer.innerHTML += crearTarjetaSecundaria(md, file.name);
          });
        });
      })
      .catch(error => {
        console.error('Error final al cargar noticias:', error);
        mainStoryContainer.innerHTML = `<p style="color: red;">Error al cargar noticias: ${error.message}</p>`;
      });
  }
});

// --- FUNCIONES AUXILIARES ---
function parseFrontmatter(md){const match=/^---\s*([\s\S]*?)\s*---/.exec(md),data={frontmatter:{},content:md};if(match){data.content=md.replace(match[0],"").trim(),match[1].split("\n").forEach(line=>{const[key,...valueParts]=line.split(":");key&&valueParts.length>0&&(data.frontmatter[key.trim()]=valueParts.join(":").trim().replace(/"/g,""))});}const imageMatch=data.content.match(/!\[.*\]\((.*)\)/);return imageMatch&&(data.frontmatter.image=imageMatch[1]),data}
function crearTarjetaPrincipal(md,filename){const{frontmatter:f,content:c}=parseFrontmatter(md);return`<article class="card featured-card">${f.image?`<img src="${f.image}" alt="Imagen destacada">`:""}<div class="card-content"><h2><a href="noticia.html?type=noticias&id=${filename}">${f.title||"Sin título"}</a></h2><p>${c.substring(0,150)}...</p></div></article>`}
function crearTarjetaSecundaria(md,filename){const{frontmatter:f}=parseFrontmatter(md);return`<article class="card">${f.image?`<img src="${f.image}" alt="Imagen de noticia">`:""}<div class="card-content"><h3><a href="noticia.html?type=noticias&id=${filename}">${f.title||"Sin título"}</a></h3></div></article>`}
function populateTicker(files){const t=document.querySelector(".ticker");if(t){t.innerHTML="",files.forEach(e=>{const n=formatTitleFromFilename(e.name),a=document.createElement("a");a.href=`noticia.html?id=${e.name}`,a.textContent=n,a.classList.add("ticker-item"),t.appendChild(a)})}}
function formatTitleFromFilename(f){return f.replace(/\.md$/,"").replace(/^\d{4}-\d{2}-\d{2}-/,"").replace(/-/g," ").replace(/\b\w/g,l=>l.toUpperCase())}
