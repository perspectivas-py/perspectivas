/*
  build-content.js
  Generador unificado de content.json para Perspectivas
  PRO v3 — salida única en /public/content.json
*/

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

/* ============================================================
   CONFIG
============================================================ */

const CONTENT_FOLDERS = {
  noticias: "content/noticias",
  analisis: "content/analisis",
  programa: "content/programa",
  podcast: "content/podcast",
  sponsors: "content/sponsors"
};

/* ============================================================
   Helpers
============================================================ */

function loadCollection(folder, key) {
  const folderPath = path.join(process.cwd(), folder);
  const items = [];

  if (!fs.existsSync(folderPath)) {
    console.warn("⚠️ Carpeta no encontrada:", folderPath);
    return items;
  }

  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    if (!file.endsWith(".md") && !file.endsWith(".json")) continue;

    const fullPath = path.join(folderPath, file);

    if (file.endsWith(".md")) {
      // archivos Markdown + frontmatter
      const raw = fs.readFileSync(fullPath, "utf8");
      const parsed = matter(raw);

      items.push({
        id: parsed.data.slug || path.basename(file, ".md"),
        type: key,
        ...parsed.data,
        body: parsed.content || parsed.data.body || "",
        body_html: parsed.data.body_html || ""
      });

    } else if (file.endsWith(".json")) {
      // archivos JSON puros
      const obj = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      items.push(obj);
    }
  }

  return items;
}

/* ============================================================
   Build JSON
============================================================ */

function buildJSON() {
  const output = {};

  for (const key of Object.keys(CONTENT_FOLDERS)) {
    const folder = CONTENT_FOLDERS[key];
    output[key] = loadCollection(folder, key);
  }

  return output;
}

/* ============================================================
   SALIDA FINAL (ÚNICA) — /public/content.json
============================================================ */

const publicFolder = path.join(process.cwd(), "public");
const outPublic = path.join(publicFolder, "content.json");

// Crear carpeta /public si no existe
if (!fs.existsSync(publicFolder)) {
  fs.mkdirSync(publicFolder);
}

const json = buildJSON();

fs.writeFileSync(outPublic, JSON.stringify(json, null, 2));

console.log("✓ content.json generado correctamente en /public/content.json");
