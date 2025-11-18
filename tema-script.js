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

  try {
    const res = await fetch(`https://api.github.com/repos/${T_REPO}/contents/${T_PATH}?ref=${T_BRANCH}`);
    const files = await res.json();

    let posts = await Promise.all(
      files.map(async file => {
        const md = await fetchFileContent(file.download_url);
        const { frontmatter, content } = parseFrontmatter(md);

        const tags = Array.isArray(frontmatter.tags)
          ? frontmatter.tags.map(t => t.toLowerCase())
          : [];

        return { name: file.name, frontmatter, content, tags };
      })
    );

    posts = posts.filter(post => post.tags.includes(tema.toLowerCase()));

    if (posts.length === 0) {
      gridEl.innerHTML = `<p>No hay contenido relacionado con este tema.</p>`;
      return;
    }

    gridEl.innerHTML = posts.map(p =>
      createNewsCard(p.name, p.frontmatter, p.content, p.category)
    ).join("");

  } catch (err) {
    console.error(err);
    gridEl.innerHTML = `<p>Error cargando contenido del tema.</p>`;
  }
}

function formatTemaTitle(t) {
  return t.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}
