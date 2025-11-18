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

  try {
    const files = await fetch(`https://api.github.com/repos/${CAT_REPO}/contents/${CAT_PATH}?ref=${CAT_BRANCH}`);
    const list = await files.json();

    let posts = await Promise.all(
      list.map(async file => {
        const res = await fetch(file.download_url);
        const md = await res.text();
        const { frontmatter, content } = parseFrontmatter(md);

        return {
          name: file.name,
          frontmatter,
          content,
          category: frontmatter.category || "sin-categoria"
        };
      })
    );

    posts = posts.filter(p => p.category === currentCategory);

    if (posts.length === 0) {
      gridEl.innerHTML = `<p>No hay noticias en esta categoría.</p>`;
      return;
    }

    gridEl.innerHTML = posts.map(post => createNewsCard(
      post.name, post.frontmatter, post.content, post.category
    )).join("");

  } catch (err) {
    console.error(err);
    gridEl.innerHTML = `<p>Error cargando noticias.</p>`;
  }
}

// título bonito:
function formCategoryTitle(cat) {
  return cat.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}
