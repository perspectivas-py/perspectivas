// -------------------------------------------------------------
// CARGADOR DE NOTICIAS POR CATEGORÍA
// -------------------------------------------------------------
const CAT_REPO = "perspectivas-py/perspectivas";
const CAT_BRANCH = "main";
const CAT_PATH = "content/noticias/posts";

// leer parámetro cat de la URL
const params = new URLSearchParams(window.location.search);
const currentCategory = params.get("cat") || "";

// ejecutar carga
document.addEventListener("DOMContentLoaded", loadCategoryNews);

async function loadCategoryNews() {

  const titleEl = document.getElementById("category-title");
  const gridEl = document.getElementById("category-grid");

  if (!currentCategory) {
    titleEl.textContent = "Categoría no especificada";
    gridEl.innerHTML = "<p>No se puede cargar la categoría.</p>";
    return;
  }

  titleEl.textContent = formCategoryTitle(currentCategory);
    gridEl.innerHTML = "<p>Cargando noticias...</p>";

  try {
   const files = await fetch(
      `https://api.github.com/repos/${CAT_REPO}/contents/${CAT_PATH}?ref=${CAT_BRANCH}`,
      { cache: "no-store" }
    );

    if (!files.ok) throw new Error("No se pudo cargar el listado de noticias.");

    const list = await files.json();
   const markdownFiles = Array.isArray(list)
      ? list.filter((f) => f.type === "file" && f.download_url)
      : [];

    let posts = await Promise.all(
  markdownFiles.map(async (file) => {
        const md = await fetchMarkdownFile(file.download_url);
        const { frontmatter, content } = parseMarkdownFrontmatter(md);

        return {
          name: file.name,
          frontmatter,
          content,
          category: normalizeCategory(frontmatter.category)
        };
      })
    );

    posts = posts
      .filter((p) => p.category === normalizeCategory(currentCategory))
      .sort((a, b) => {
        const dateA = new Date(a.frontmatter.date || 0).getTime();
        const dateB = new Date(b.frontmatter.date || 0).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return b.name.localeCompare(a.name);
      });

    if (posts.length === 0) {
      gridEl.innerHTML = `<p>No hay noticias en esta categoría.</p>`;
      return;
    }

    gridEl.innerHTML = posts
      .map(({ name, frontmatter, content }) =>
        buildNewsCardFromMarkdown(name, frontmatter, content)
      )
      .join("");
  } catch (err) {
    console.error(err);
    gridEl.innerHTML = `<p>Error cargando noticias.</p>`;
  }
}

// título bonito:
function formCategoryTitle(cat) {
  return cat.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function normalizeCategory(cat) {
  return (cat || "").toString().trim().toLowerCase();
}
