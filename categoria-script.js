// -------------------------------------------------------------
// CARGADOR DE NOTICIAS POR CATEGORÍA - v4.1 (JSON Based + Enhanced Logging)
// -------------------------------------------------------------
console.log("🔷 Categoria-script v4.1 INICIANDO...");

const CAT_CONTENT_URL = "content.json";

// leer parámetro cat o tag de la URL
const params = new URLSearchParams(window.location.search);
const currentCategory = params.get("cat") || "";
const currentTag = params.get("tag") || "";
console.log("🔷 Parámetros detectados - cat:", currentCategory, "tag:", currentTag);

// ejecutar carga
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔷 DOMContentLoaded disparado, llamando a loadCategoryNews()");
  loadCategoryNews().catch(err => {
    console.error("❌ Error crítico en loadCategoryNews:", err);
    const gridEl = document.getElementById("category-grid");
    if (gridEl) gridEl.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  });
});

async function loadCategoryNews() {
  console.log("🔷 loadCategoryNews() ejecutándose...");

  const titleEl = document.getElementById("category-title");
  const gridEl = document.getElementById("category-grid");

  console.log("🔷 Elementos DOM - titleEl:", !!titleEl, "gridEl:", !!gridEl);

  if (!currentCategory && !currentTag) {
    titleEl.textContent = "Categoría no especificada";
    gridEl.innerHTML = "<p>No se puede cargar la categoría.</p>";
    return;
  }

  // Set initial title
  if (currentTag) {
    titleEl.textContent = `Etiqueta: ${formCategoryTitle(currentTag)}`;
  } else {
    titleEl.textContent = formCategoryTitle(currentCategory);
  }
  gridEl.innerHTML = "<p>Cargando noticias...</p>";

  try {

    // ESTRATEGIA HÍBRIDA: INTENTAR USAR tags.json (Base de datos optimizada) SI ES UNA BÚSQUEDA POR TAG
    if (currentTag) {
      try {
        const tagsRes = await fetch(`tags.json?t=${Date.now()}`);
        if (tagsRes.ok) {
          const tagsDb = await tagsRes.json();
          const searchKey = normalizeCategory(currentTag);
          const tagData = tagsDb[searchKey];

          if (tagData && tagData.items && tagData.items.length > 0) {
            console.log(`✅ Tag encontrado en tags.json: ${tagData.label} (${tagData.items.length} items)`);
            titleEl.textContent = `Tema: ${tagData.label}`; // Usar el nombre bonito de la BD
            gridEl.innerHTML = tagData.items.map(item => buildNewsCard(item)).join("");
            return; // Terminamos aquí, mucho más rápido.
          } else {
            console.warn(`Tag "${currentTag}" no encontrado en tags.json, intentando búsqueda manual en content.json...`);
          }
        }
      } catch (e) {
        console.warn("Fallo al leer tags.json, usando content.json como fallback", e);
      }
    }

    // 1. Fetch content.json (Fallback o Búsqueda por Categoría)
    console.log("🔷 Iniciando fetch de content.json...");
    const res = await fetch(`${CAT_CONTENT_URL}?t=${Date.now()}`); // cache busting
    console.log("🔷 Fetch completado. Status:", res.status, "OK:", res.ok);
    if (!res.ok) throw new Error("No se pudo cargar content.json");

    const data = await res.json();
    console.log("🔷 JSON parseado. Noticias:", data.noticias?.length, "Analisis:", data.analisis?.length);

    // 2. Combine all content sources
    const allPosts = [
      ...(data.noticias || []),
      ...(data.analisis || []),
      ...(data.programa || []),
      ...(data.podcast || [])
    ];

    // 3. Filter
    console.log(`🔎 Filtrando por: ${currentTag ? 'Tag=' + currentTag : 'Cat=' + currentCategory}`);
    console.log(`🔎 Total posts para filtrar: ${allPosts.length}`);

    const posts = allPosts.filter(p => {
      if (currentTag) {
        // Check tags array (case insensitive / accent insensitive)
        const tags = p.tags || [];
        if (!Array.isArray(tags)) return false; // Protección si tags no es array

        // Normalizamos el tag buscado una sola vez
        const searchTag = normalizeCategory(currentTag);

        // Buscamos coincidencia
        const found = tags.some(t => normalizeCategory(t) === searchTag);
        if (found) console.log(`✅ Coincidencia encontrada: ${p.title} (tags: ${tags.join(', ')})`);
        return found;
      } else {
        // Check category
        const matches = normalizeCategory(p.category) === normalizeCategory(currentCategory);
        if (matches) console.log(`✅ Coincidencia categoría: ${p.title} (cat: ${p.category})`);
        return matches;
      }
    }).sort((a, b) => {
      // Sort by date desc
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

    console.log(`🔷 Resultados del filtrado: ${posts.length} artículos encontrados`);

    // 4. Render
    if (posts.length === 0) {
      gridEl.innerHTML = `<p>No hay noticias en esta sección.</p>`;
      return;
    }

    console.log("🔷 Renderizando cards...");
    gridEl.innerHTML = posts.map(item => buildNewsCard(item)).join("");
    console.log("✅ Renderizado completado!");

  } catch (err) {
    console.error(err);
    gridEl.innerHTML = `<p>Error cargando noticias: ${err.message}</p>`;
  }
}

// -------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------

function formCategoryTitle(cat) {
  return cat.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function normalizeCategory(cat) {
  // Normalize: lowercase, remove accents
  return (cat || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function buildNewsCard(item) {
  const thumb = item.thumbnail || "/assets/img/default_news.jpg";
  const cat = item.category || "General";
  const id = item.slug || item.id;

  let dateStr = "";
  if (item.date) {
    try {
      const d = new Date(item.date);
      dateStr = d.toLocaleDateString("es-PY", { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { }
  }

  return `
    <article class="card">
      <a href="/noticia.html?id=${encodeURIComponent(id)}">
        <div class="card-img-container">
          <img src="${thumb}" alt="${item.title}" loading="lazy">
        </div>
        <div class="card-content">
          <span class="card-category text-accent">${cat}</span>
          <h3>${item.title}</h3>
          <div class="card-meta">
            <span class="card-date">${dateStr}</span>
          </div>
        </div>
      </a>
    </article>
  `;
}
