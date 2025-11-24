// -----------------------------------------------------
// CARGA DE TEMAS / TAGS DE NOTICIAS
// -----------------------------------------------------
const T_REPO = "perspectivas-py/perspectivas";
const T_BRANCH = "main";
const T_PATH = "content/noticias/posts";

const paramsTema = new URLSearchParams(window.location.search);
const tema = paramsTema.get("t") || "";

document.addEventListener("DOMContentLoaded", loadTema);

async function loadTema() {
  const titleEl = document.getElementById("tema-title");
  const gridEl = document.getElementById("tema-grid");

  if (!tema) {
    titleEl.textContent = "Tema no especificado";
    gridEl.innerHTML = `<p>No se puede cargar el tema.</p>`;
    return;
  }

  titleEl.textContent = formatTemaTitle(tema);

  gridEl.innerHTML = `<p>Cargando noticias...</p>`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${T_REPO}/contents/${T_PATH}?ref=${T_BRANCH}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("No se pudo cargar el listado de noticias.");

    const files = await res.json();
    const markdownFiles = Array.isArray(files)
      ? files.filter((f) => f.type === "file" && f.download_url)
      : [];

    let posts = await Promise.all(
      markdownFiles.map(async (file) => {
        const md = await fetchMarkdownFile(file.download_url);
        const { frontmatter, content } = parseMarkdownFrontmatter(md);

        const tags = normalizeTags(frontmatter.tags);

        return { name: file.name, frontmatter, content, tags };
      })
    );

    posts = posts
      .filter((post) => post.tags.includes(tema.toLowerCase()))
      .sort((a, b) => {
        const dateA = new Date(a.frontmatter.date || 0).getTime();
        const dateB = new Date(b.frontmatter.date || 0).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return b.name.localeCompare(a.name);
      });

    if (posts.length === 0) {
      gridEl.innerHTML = `<p>No hay contenido relacionado con este tema.</p>`;
      return;
    }

    gridEl.innerHTML = posts
      .map(({ name, frontmatter, content }) =>
        buildNewsCardFromMarkdown(name, frontmatter, content)
      )
      .join("")

  } catch (err) {
    console.error(err);
    gridEl.innerHTML = `<p>Error cargando contenido del tema.</p>`;
  }
}

function formatTemaTitle(t) {
  return t.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => t.toLowerCase());

  // soporte para cadenas separadas por coma
  return tags
    .toString()
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}
