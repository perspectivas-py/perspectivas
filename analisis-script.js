document.addEventListener('DOMContentLoaded', () => {
  const repo = 'perspectivas-py/perspectivas';
  const branch = 'main';
  const postsPath = 'analisis/_posts'; // <-- ¡Buscamos en la nueva carpeta!
  const gridContainer = document.getElementById('analisis-grid');

  fetch(`https://api.github.com/repos/${repo}/contents/${postsPath}?ref=${branch}`)
    .then(response => response.json())
    .then(files => {
      files.sort((a, b) => b.name.localeCompare(a.name));
      files.forEach(file => {
        fetch(file.download_url)
          .then(res => res.text())
          .then(md => gridContainer.innerHTML += crearTarjetaAnalisis(md, file.name));
      });
    });
});

function crearTarjetaAnalisis(markdown, filename) {
  const { frontmatter } = parseFrontmatter(markdown);
  // URL INTELIGENTE: Le decimos a la página de detalle que esto es un 'analisis'
  const url = `noticia.html?type=analisis&id=${filename}`;
  return `
    <article class="card">
      ${frontmatter.image ? `<img src="${frontmatter.image}" alt="">` : ''}
      <div class="card-content">
        <h3><a href="${url}">${frontmatter.title || 'Sin título'}</a></h3>
        <p class="meta">Por: ${frontmatter.author || 'Anónimo'}</p>
      </div>
    </article>
  `;
}

// (Copia las mismas funciones parseFrontmatter y de imagen que están en script.js)
function parseFrontmatter(markdownContent) {
    const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
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
}```

---

### **Paso 3: Unificar la Página de Artículos (El Toque Profesional)**

Ahora viene la parte inteligente. En lugar de crear un `analisis-detalle.html`, vamos a mejorar nuestro `noticia.html` y su script para que puedan mostrar **cualquier** tipo de contenido. Lo haremos leyendo un parámetro `type` desde la URL.

**Acción 1: Actualizar el `script.js` de la Portada**

Tenemos que decirle que los enlaces de noticias ahora deben incluir `type=noticias`.
**Busca y reemplaza** la función `crearTarjetaSecundaria` en tu `script.js` principal:

```javascript
// En script.js (el de la portada)
function crearTarjetaSecundaria(markdown, filename) {
  const { frontmatter } = parseFrontmatter(markdown);
  // URL INTELIGENTE: Le decimos que esto es una 'noticia'
  const url = `noticia.html?type=noticias&id=${filename}`;
  return `
    <article class="card">
      ${frontmatter.image ? `<img src="${frontmatter.image}" alt="Imagen de noticia">` : ''}
      <div class="card-content">
        <h3><a href="${url}">${frontmatter.title || 'Sin título'}</a></h3>
      </div>
    </article>
  `;
}
// Haz lo mismo para la función crearTarjetaPrincipal
