/**
 * API endpoint que genera content.json dinámicamente desde GitHub
 * Esto asegura que siempre se muestren las notas más recientes
 */

const REPO = "perspectivas-py/perspectivas";
const BRANCH = "main";

function parseFrontmatter(md) {
  const m = /^---\s*([\s\S]*?)\s*---/.exec(md);
  const data = { frontmatter: {}, content: md };

  if (m) {
    data.content = md.replace(m[0], "").trim();
    let currentKey = null;
    let currentIndent = -1;
    let nestedObj = null;

    m[1].split("\n").forEach(line => {
      if (!line.trim()) return;

      const indent = line.search(/\S/);
      const lineContent = line.trim();
      const [key, ...v] = lineContent.split(":");

      if (key && v.length > 0) {
        const value = v.join(":").trim().replace(/^["']|["']$/g, "");

        if (!value || value === '{}') {
          currentKey = key.trim();
          nestedObj = {};
          data.frontmatter[currentKey] = nestedObj;
          currentIndent = indent;
        } else {
          if (nestedObj && indent > currentIndent) {
            nestedObj[key.trim()] = value;
          } else {
            nestedObj = null;
            data.frontmatter[key.trim()] = value;
          }
        }
      }
    });
  }
  return data;
}

async function loadCollectionFromGitHub(folder, type) {
  try {
    const url = `https://api.github.com/repos/${REPO}/contents/${folder}?ref=${BRANCH}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`Error cargando ${folder}:`, res.status);
      return [];
    }

    const files = await res.json();
    if (!Array.isArray(files)) return [];

    const items = await Promise.all(
      files
        .filter(f => f.name.endsWith(".md") || f.name.endsWith(".mdx"))
        .map(async f => {
          try {
            const textRes = await fetch(f.download_url);
            const text = await textRes.text();
            const { frontmatter, content } = parseFrontmatter(text);
            const slug = f.name.replace(/\.mdx?$/, "");

            let featuredObj = {
              is_featured: false,
              is_main_featured: false,
              show_in_latest: true
            };

            if (typeof frontmatter.featured === 'object' && frontmatter.featured !== null) {
              featuredObj = {
                is_featured: frontmatter.featured.is_featured === "true" || frontmatter.featured.is_featured === true,
                is_main_featured: frontmatter.featured.is_main_featured === "true" || frontmatter.featured.is_main_featured === true,
                show_in_latest: frontmatter.featured.show_in_latest !== "false" && frontmatter.featured.show_in_latest !== false
              };
            }

            return {
              id: frontmatter.id || slug,
              type,
              slug,
              category: frontmatter.category || "",
              title: frontmatter.title || slug,
              description: frontmatter.summary || frontmatter.description || "",
              thumbnail: frontmatter.thumbnail || "/assets/img/default.jpg",
              body: content.trim(),
              date: frontmatter.date ? new Date(frontmatter.date).toISOString() : new Date().toISOString(),
              featured: featuredObj,
              tags: frontmatter.tags ? (Array.isArray(frontmatter.tags) ? frontmatter.tags : frontmatter.tags.split(",").map(t => t.trim())) : [],
            };
          } catch (error) {
            console.error(`Error procesando ${f.name}:`, error);
            return null;
          }
        })
    );

    return items
      .filter(item => item !== null)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error(`Error cargando colección ${folder}:`, error);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    console.log("🔄 Generando content.json dinámicamente desde GitHub...");

    const [noticias, analisisPosts, analisisUnderscorePosts, programa, podcast, sponsors] = await Promise.all([
      loadCollectionFromGitHub("content/noticias/posts", "noticias"),
      loadCollectionFromGitHub("content/analisis/posts", "analisis"),
      loadCollectionFromGitHub("content/analisis/_posts", "analisis"),
      loadCollectionFromGitHub("content/programa/posts", "programa"),
      loadCollectionFromGitHub("content/podcast/posts", "podcast"),
      loadCollectionFromGitHub("content/sponsors", "sponsors"),
    ]);

    const analisis = [...analisisPosts, ...analisisUnderscorePosts]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const data = {
      noticias,
      analisis,
      programa,
      podcast,
      sponsors,
    };

    // Headers para cache control (cache por 1 minuto, revalidar en background)
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

    console.log(`✅ Generado: ${data.noticias.length} noticias, ${data.analisis.length} análisis`);

    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (error) {
    console.error("❌ Error generando content.json:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Error generando contenido",
      message: error.message
    }));
  }
}

