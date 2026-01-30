{
  // Categorías principales para Análisis (Sincronizadas con script.v3.js)
  const ANALYSIS_CATEGORIES = [
    { key: 'opinion-editorial', label: 'Opinión Editorial', color: '#7c3aed' },
    { key: 'macro', label: 'Macroeconomía', color: '#3b82f6' },
    { key: 'politica', label: 'Política Económica', color: '#f97316' },
    { key: 'regional', label: 'Regional', color: '#06b6d4' },
    { key: 'internacional', label: 'Internacional', color: '#10b981' },
    { key: 'columnistas', label: 'Columnistas', color: '#ec4899' }
  ];

  // Función de normalización de slugs
  function normalizeSlug(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Renderiza el submenú de categorías
  function renderCategorySubmenu(currentCategory) {
    const container = document.getElementById('category-tags-container');
    const submenu = document.getElementById('category-submenu');

    if (!container || !submenu) return;

    const normalizedCurrent = normalizeSlug(currentCategory || '');

    // Reordenar categorías: la activa primero, luego las demás
    const orderedCategories = [...ANALYSIS_CATEGORIES];
    const activeIndex = orderedCategories.findIndex(cat =>
      normalizedCurrent === cat.key || normalizedCurrent.includes(cat.key)
    );

    if (activeIndex > 0) {
      const activeCategory = orderedCategories.splice(activeIndex, 1)[0];
      orderedCategories.unshift(activeCategory);
    }

    container.innerHTML = orderedCategories.map(cat => {
      const isActive = normalizedCurrent === cat.key || normalizedCurrent.includes(cat.key);
      const activeClass = isActive ? 'active' : '';
      const styleAttr = isActive ? `style="--tag-color: ${cat.color};"` : '';

      return `
        <a href="/categoria.html?cat=${encodeURIComponent(cat.key)}" 
           class="category-tag ${activeClass}" 
           ${styleAttr}>
          ${cat.label}
        </a>
      `;
    }).join('');

    submenu.style.display = 'block';
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Detectar categoría desde URL y renderizar submenú
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('cat') || 'opinion-editorial';
    renderCategorySubmenu(category);

    const repo = 'perspectivas-py/perspectivas';
    const branch = 'main';
    const postsPath = 'content/analisis/_posts';
    const gridContainer = document.getElementById('analisis-grid');

    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    console.log('Iniciando carga de análisis desde:', postsPath);

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

  function crearTarjetaAnalisis(md, filename) { 
    const { frontmatter: f } = parseFrontmatter(md); 
    return `<article class="card">${f.image ? `<img src="${f.image}" alt="">` : ""}<div class="card-content"><h3><a href="noticia.html?type=analisis&id=${filename}">${f.title || "Sin título"}</a></h3><p class="meta" style="color: var(--color-text-secondary); font-size: 0.9em;">Por: ${f.author || "Anónimo"}</p></div></article>`;
  }

  function parseFrontmatter(md) { 
    const match = /^---\s*([\s\S]*?)\s*---/.exec(md), data = { frontmatter: {}, content: md }; 
    if (match) { 
      data.content = md.replace(match[0], "").trim(), 
      match[1].split("\n").forEach(line => { 
        const [key, ...valueParts] = line.split(":"); 
        key && valueParts.length > 0 && (data.frontmatter[key.trim()] = valueParts.join(":").trim().replace(/"/g, "")); 
      }); 
    } 
    const imageMatch = data.content.match(/!\[.*\]\((.*)\)/); 
    return imageMatch && (data.frontmatter.image = imageMatch[1]), data; 
  }
}
