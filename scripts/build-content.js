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
  analisis: "content/analisis/_posts",
  programa: "content/programa/posts",
  podcast: "content/podcast/posts",
  sponsors: "content/sponsors",
  tapas: "content/tapas",
  videos_destacados: "content/videos_destacados/posts",
};

// Función de normalización consistente
function normalizeTag(tag) {
  return (tag || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function deriveKicker(data = {}) {
  const candidates = [data.kicker, data?.featured?.kicker, data.subcategory, data.category_label, data.category, data.type];
  const value = candidates.find(entry => typeof entry === "string" && entry.trim());
  return value ? value.trim() : "";
}

function deriveSummaryShort(data = {}, maxLength = 180) {
  const raw = (data.summary || data.description || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  if (raw.length <= maxLength) return raw;
  return `${raw.slice(0, maxLength).trim().replace(/[\s,.;:-]+$/, "")}…`;
}

function normalizeFeatured(rawFeatured) {
  const defaults = {
    is_featured: false,
    is_main_featured: false,
    is_section_featured: false,
    show_in_latest: true
  };

  if (typeof rawFeatured === "boolean") {
    return { ...defaults, is_featured: rawFeatured };
  }

  if (rawFeatured && typeof rawFeatured === "object" && !Array.isArray(rawFeatured)) {
    return {
      ...rawFeatured,
      is_featured: Boolean(rawFeatured.is_featured ?? rawFeatured.is_main_featured ?? false),
      is_main_featured: Boolean(rawFeatured.is_main_featured),
      is_section_featured: Boolean(rawFeatured.is_section_featured),
      show_in_latest: rawFeatured.show_in_latest === undefined ? defaults.show_in_latest : Boolean(rawFeatured.show_in_latest)
    };
  }

  return { ...defaults };
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

      const normalizedFeatured = normalizeFeatured(data.featured);

      return {
        ...data,
        id: data.id || slug,
        type,
        slug,
        category: data.category || "",
        title: data.title || slug,
        description: data.summary || data.description || "",
        thumbnail: data.thumbnail || "/assets/img/default.jpg",
        body: content.trim(),
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        featured: normalizedFeatured,
        tags: tags,
        tags_normalized: tags.map(t => normalizeTag(t)), // Índice normalizado pre-calculado
        kicker: deriveKicker({ ...data, featured: normalizedFeatured }),
        summary_short: deriveSummaryShort(data)
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function main() {
  console.log("🚀 Iniciando generación de content.json...");

  const data = {
    noticias: loadCollection(COLLECTIONS.noticias, "noticias"),
    analisis: [
      ...loadCollection("content/analisis/posts", "analisis"),
      ...loadCollection("content/analisis/_posts", "analisis")
    ].sort((a, b) => new Date(b.date) - new Date(a.date)),
    programa: loadCollection(COLLECTIONS.programa, "programa"),
    podcast: loadCollection(COLLECTIONS.podcast, "podcast"),
    sponsors: loadCollection(COLLECTIONS.sponsors, "sponsors"),
    tapas: loadCollection(COLLECTIONS.tapas, "tapa"),
    videos_destacados: loadCollection(COLLECTIONS.videos_destacados, "videos_destacados"),
  };

  // GENERAR ÍNDICE DE TAGS (BD de Etiquetas)
  console.log("🗂️ Generando índice de etiquetas (tags.json)...");
  const tagsIndex = {};

  [...data.noticias, ...data.analisis, ...data.programa, ...data.podcast].forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tag => {
        const key = normalizeTag(tag);
        if (!tagsIndex[key]) {
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

  console.log(`📊 Estadísticas: ${data.noticias.length} noticias, ${data.analisis.length} análisis, ${data.tapas.length} tapas`);

  console.log("🏁 Finalizado con éxito!");
}

main();
