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

// Función de normalización consistente
function normalizeTag(tag) {
  return (tag || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function loadCollection(folder, type) {
  const collectionPath = path.join(process.cwd(), folder);
  if (!fs.existsSync(collectionPath)) return [];

  return fs.readdirSync(collectionPath)
    .filter(file => file.endsWith(".md") || file.endsWith(".mdx"))
    .map(file => {
      const raw = fs.readFileSync(path.join(collectionPath, file), "utf8");
      const { data, content } = matter(raw);
      const slug = file.replace(/\.mdx?$/, "");
      
      // Normalización de tags en tiempo de construcción
      const rawTags = data.tags || [];
      const tags = Array.isArray(rawTags) ? rawTags : [rawTags];
      
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
        tags: tags,
        tags_normalized: tags.map(t => normalizeTag(t)), // Índice normalizado pre-calculado
        ...data, 
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); 
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
  
  // GENERAR ÍNDICE DE TAGS (BD de Etiquetas)
  console.log("🗂️ Generando índice de etiquetas (tags.json)...");
  const tagsIndex = {};
  
  [...data.noticias, ...data.analisis, ...data.programa, ...data.podcast].forEach(item => {
      if(item.tags && Array.isArray(item.tags)) {
          item.tags.forEach(tag => {
              const key = normalizeTag(tag);
              if(!tagsIndex[key]) {
                  tagsIndex[key] = {
                      label: tag, // Guardamos la primera versión "bonita" que encontremos
                      items: []
                  };
              }
              // Guardamos solo lo necesario para listar (ahorro de espacio)
              tagsIndex[key].items.push({
                  id: item.slug || item.id,
                  title: item.title,
                  thumbnail: item.thumbnail,
                  date: item.date,
                  type: item.type
              });
          });
      }
  });
  
  // Ordenar items dentro de cada tag por fecha
  Object.keys(tagsIndex).forEach(key => {
      tagsIndex[key].items.sort((a, b) => new Date(b.date) - new Date(a.date));
  });
  
  // Guardar tags.json (Nuestra "Base de Datos" de etiquetas)
  fs.writeFileSync(path.join(process.cwd(), "tags.json"), JSON.stringify(tagsIndex, null, 2));
  fs.writeFileSync(path.join(process.cwd(), "public/tags.json"), JSON.stringify(tagsIndex, null, 2)); // Copia en public

  // Guarda el archivo principal
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
