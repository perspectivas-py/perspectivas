export default async function handler(req, res) {
  const REPO = "perspectivas-py/perspectivas";
  const BRANCH = "main";
  const NEWS_PATH = "content/noticias/posts";
  const baseUrl = "https://perspectivaspy.vercel.app";

  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${NEWS_PATH}?ref=${BRANCH}`);
    if (!r.ok) throw new Error("GitHub API error: " + r.status);

    const files = await r.json();

    const posts = await Promise.all(
      files
        .filter(f => f.name.endsWith(".md"))
        .map(async f => {
          try {
            const text = await fetch(f.download_url).then(r => r.text());
            const fm = parseFrontmatter(text);

            if (!fm.frontmatter.date) return null;

            return {
              slug: f.name.replace(".md", ""),
              date: fm.frontmatter.date,
              title: fm.frontmatter.title || f.name.replace(".md", "")
            };
          } catch {
            return null;
          }
        })
    );

    const escapeXml = (str = "") =>
      str
        .replace(/&(?!(amp;|quot;|apos;|lt;|gt;))/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const validPosts = posts.filter(Boolean);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${validPosts.map(p => `
  <url>
    <loc>${baseUrl}/noticia.html?type=noticias&id=${encodeURIComponent(p.slug)}.md</loc>
    <lastmod>${p.date}</lastmod>
    <news:news>
      <news:publication>
        <news:name>Perspectivas</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${p.date}</news:publication_date>
      <news:title>${escapeXml(p.title)}</news:title>
    </news:news>
  </url>`).join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    return res.status(200).send(sitemap);

  } catch (err) {
    console.error("Sitemap error:", err);
    res.status(500).send("Error generating sitemap");
  }
}

function parseFrontmatter(md) {
  const m = /^---\s*([\s\S]*?)\s*---/.exec(md);
  const data = { frontmatter: {}, content: md };

  if (m) {
    data.content = md.replace(m[0], "").trim();
    m[1].split("\n").forEach(line => {
      const [key, ...v] = line.split(":");
      if (key && v.length > 0) {
        data.frontmatter[key.trim()] = v.join(":").trim().replace(/"/g, "");
      }
    });
  }
  return data;
}
