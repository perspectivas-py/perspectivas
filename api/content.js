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
    m[1].split("\n").forEach(line => {
      const [key, ...v] = line.split(":");
      if (key && v.length > 0) {
        const value = v.join(":").trim().replace(/^["']|["']$/g, "");
        data.frontmatter[key.trim()] = value;
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
              featured: frontmatter.featured === "true" || frontmatter.featured === true,
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

    const [noticias, analisis, programa, podcast, sponsors] = await Promise.all([
      loadCollectionFromGitHub("content/noticias/posts", "noticias"),
      loadCollectionFromGitHub("content/analisis/posts", "analisis"),
      loadCollectionFromGitHub("content/programa/posts", "programa"),
      loadCollectionFromGitHub("content/podcast/posts", "podcast"),
      loadCollectionFromGitHub("content/sponsors", "sponsors"),
    ]);

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
    
    return res.status(200).json(data);
  } catch (error) {
    console.error("❌ Error generando content.json:", error);
    return res.status(500).json({ 
      error: "Error generando contenido",
      message: error.message 
    });
  }
}

