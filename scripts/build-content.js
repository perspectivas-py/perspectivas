/**
 * build-content.js
 * Genera content.json y api/content.json desde Markdown (Decap CMS)
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

// colecciones manejadas por Decap CMS
const COLLECTIONS = {
  noticias: "content/noticias",
  analisis: "content/analisis",
  programa: "content/programa",
  podcast: "content/podcast",
  sponsors: "content/sponsors"
};

function loadCollection(folder, typeName) {
  const dir = path.join(process.cwd(), folder);

  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));

  return files.map(filename => {
    const raw = fs.readFileSync(path.join(dir, filename), "utf-8");
    const { data: frontmatter, content } = matter(raw);

    // id seguro
    const id =
      frontmatter.id ||
      frontmatter.slug ||
      filename.replace(/\.md$/, "");

    return {
      id,
      type: typeName,
      ...frontmatter,
      body_html: content.trim()
    };
  });
}

function buildJSON() {
  const output = {};

  for (const [key, folder] of Object.entries(COLLECTIONS)) {
    output[key] = loadCollection(folder, key);
  }

  return output;
}

// rutas de salida (AQUÍ ESTÁ EL CAMBIO: raíz del repo)
const outRoot = path.join(process.cwd(), "content.json");
const outApiFolder = path.join(process.cwd(), "api");
const outApi = path.join(outApiFolder, "content.json");

// aseguro carpeta /api
if (!fs.existsSync(outApiFolder)) {
  fs.mkdirSync(outApiFolder);
}

const json = buildJSON();

fs.writeFileSync(outRoot, JSON.stringify(json, null, 2));
fs.writeFileSync(outApi, JSON.stringify(json, null, 2));

console.log("✔ content.json y api/content.json generados correctamente en la raíz.");
