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
      // Mapear campos del frontmatter al formato esperado
      return {
        id: data.id || slug,
        type,
        slug,
        category: data.category || "",
        title: data.title || slug,
        description: data.summary || data.description || "",
        thumbnail: data.thumbnail || "/assets/img/default.jpg",
        body: content.trim(),
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        featured: data.featured || false,
        tags: data.tags || [],
        ...data, // Mantener todos los campos del frontmatter (incluyendo embed_url, audio_url, author, etc)
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

  // Guarda el archivo en la raíz (Vercel sirve archivos estáticos desde la raíz)
  const rootPath = path.join(process.cwd(), "content.json");
  fs.writeFileSync(rootPath, JSON.stringify(data, null, 2));
  console.log("✔ content.json generado en la raíz");

  // También en public/ por si acaso
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const publicPath = path.join(publicDir, "content.json");
  fs.writeFileSync(publicPath, JSON.stringify(data, null, 2));
  console.log("✨ content.json también disponible en /public/content.json");

  console.log(`📊 Estadísticas: ${data.noticias.length} noticias, ${data.analisis.length} análisis`);

  console.log("🏁 Finalizado con éxito!");
}

main();
