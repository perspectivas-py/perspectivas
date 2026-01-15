// -------------------------------------------------------------
// CARGADOR DE NOTICIAS POR CATEGORÍA - v4.0 (JSON Based)
// -------------------------------------------------------------
const CONTENT_URL = "content.json";

// leer parámetro cat o tag de la URL
const params = new URLSearchParams(window.location.search);
const currentCategory = params.get("cat") || "";
const currentTag = params.get("tag") || "";

// ejecutar carga
document.addEventListener("DOMContentLoaded", loadCategoryNews);

async function loadCategoryNews() {

  const titleEl = document.getElementById("category-title");
  const gridEl = document.getElementById("category-grid");

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
    // 1. Fetch content.json
    const res = await fetch(`${CONTENT_URL}?t=${Date.now()}`); // cache busting
    if (!res.ok) throw new Error("No se pudo cargar content.json");

    const data = await res.json();

    // 2. Combine all content sources
    const allPosts = [
      ...(data.noticias || []),
      ...(data.analisis || []),
      ...(data.programa || []),
      ...(data.podcast || [])
    ];

    // 3. Filter
    console.log(`🔎 Filtrando por: ${currentTag ? 'Tag=' + currentTag : 'Cat=' + currentCategory}`);
    
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
        return normalizeCategory(p.category) === normalizeCategory(currentCategory);
      }
    }).sort((a, b) => {
      // Sort by date desc
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

    // 4. Render
    if (posts.length === 0) {
      gridEl.innerHTML = `<p>No hay noticias en esta sección.</p>`;
      return;
    }

    gridEl.innerHTML = posts.map(item => buildNewsCard(item)).join("");

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
