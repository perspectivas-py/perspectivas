// scripts/build-content.js — Versión PRO v3 Final

import fs from "fs";
import matter from "gray-matter";
import path from "path";

const collections = [
  { key: "noticias", folder: "content/noticias/posts" },
  { key: "analisis", folder: "content/analisis" },
  { key: "programa", folder: "content/programa/posts" },
  { key: "podcast", folder: "content/podcast/posts" },
  { key: "sponsors", folder: "content/sponsors" }
];

function loadCollection({ key, folder }) {
  const dir = path.join(process.cwd(), folder);
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".md") || f.endsWith(".mdx"))
    .map(file => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);

      return {
        ...data,
        body: content.trim(),
        slug: data.slug || file.replace(/\.mdx?$/, "")
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

(function build() {
  console.log("🛠️ Generando content.json...");

  const data = {};
  collections.forEach(col => {
    data[col.key] = loadCollection(col);
  });

  fs.writeFileSync(
    "content.json",
    JSON.stringify(data, null, 2)
  );

  console.log("✅ content.json actualizado con éxito");
})();
