/**
 * build-content.js
 * Genera content.json y api/content.json desde Markdown del CMS
 * Compatible con Decap CMS, Vercel y Netlify
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

// carpetas de contenido
const COLLECTIONS = {
  noticias: "content/noticias",
  analisis: "content/analisis",
  programa: "content/programa",
  podcast: "content/podcast",
  sponsors: "content/sponsors"
};

// lectura de archivos .md de una carpeta
function loadCollection(folder, typeName) {
  const dir = path.join(process.cwd(), folder);

  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));

  return files.map(filename => {
    const filePath = path.join(dir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data: frontmatter, content } = matter(raw);

    // id obligatorio
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

// genera el JSON final
function buildJSON() {
  const output = {};

  for (const [key, folder] of Object.entries(COLLECTIONS)) {
    output[key] = loadCollection(folder, key);
  }

  return output;
}

// rutas de salida
const outRoot = path.join(process.cwd(), "public", "content.json");
const outApi = path.join(process.cwd(), "api", "content.json");

// asegurar carpetas
if (!fs.existsSync(path.join(process.cwd(), "public")))
  fs.mkdirSync(path.join(process.cwd(), "public"));

if (!fs.existsSync(path.join(process.cwd(), "api")))
  fs.mkdirSync(path.join(process.cwd(), "api"));

const json = buildJSON();

// escribir archivos
fs.writeFileSync(outRoot, JSON.stringify(json, null, 2));
fs.writeFileSync(outApi, JSON.stringify(json, null, 2));

console.log("✔ content.json y api/content.json generados con éxito.");
