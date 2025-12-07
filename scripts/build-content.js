/**
 * build-content.js PRO — Perspectivas
 * Unifica todas las colecciones Markdown en un único content.json para la web.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Rutas de colecciones
const COLLECTIONS = {
  noticias: "content/noticias/posts",
  analisis: "content/analisis/posts",
  programa: "content/programa/posts",
  podcast: "content/podcast/posts",
  sponsors: "content/sponsors",
};

function loadCollection(folder, type) {
  const collectionPath = path.join(process.cwd(), folder);
  if (!fs.existsSync(collectionPath)) return [];

  return fs.readdirSync(collectionPath)
    .filter(file => file.endsWith(".md") || file.endsWith(".mdx"))
    .map(file => {
      const raw = fs.readFileSync(path.join(collectionPath, file), "utf8");
      const { data, content } = matter(raw);
      const slug = file.replace(/\.mdx?$/, "");
      return {
        ...data,
        type,
        slug,
        body: content.trim(),
        date: data.date ? new Date(data.date).toISOString() : null,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Más recientes arriba
}

async function main() {
  console.log("🚀 Iniciando generación de content.json...");

  const data = {
    noticias: loadCollection(COLLECTIONS.noticias, "noticias"),
    analisis: loadCollection(COLLECTIONS.analisis, "analisis"),
    programa: loadCollection(COLLECTIONS.programa, "programa"),
    podcast: loadCollection(COLLECTIONS.podcast, "podcast"),
    sponsors: loadCollection(COLLECTIONS.sponsors, "sponsors"),
  };

  // Guarda el archivo interno para Vercel
  const internalPath = path.join(process.cwd(), "content.json");
  fs.writeFileSync(internalPath, JSON.stringify(data, null, 2));
  console.log("✔ content.json generado internamente");

  // COPIA PUBLICABLE
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

  const publicPath = path.join(publicDir, "content.json");
  fs.writeFileSync(publicPath, JSON.stringify(data, null, 2));
  console.log("✨ content.json disponible para la web en /public/content.json");

  console.log("🏁 Finalizado con éxito!");
}

main();
