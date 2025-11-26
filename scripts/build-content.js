/**
 * build-content.js
 * Genera /public/content.json y /api/content.json desde Markdown (Decap CMS)
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const COLLECTIONS = {
  noticias: "content/noticias/posts",
  analisis: "content/analisis/posts",
  programa: "content/programa/posts",
  podcast: "content/podcast/posts",
  sponsors: "api/sponsors"
};

/* Lee archivos .md */
function loadCollection(folder) {
  const dir = path.join(process.cwd(), folder);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));

  return files.map(filename => {
    const raw = fs.readFileSync(path.join(dir, filename), "utf-8");
    const { data, content } = matter(raw);

    return {
      id: data.slug || filename.replace(".md", ""),
      type: data.type || "",
      category: data.category || "",
      date: data.date || "",
      title: data.title || "",
      description: data.description || "",
      thumbnail: data.thumbnail || "",
      embed_url: data.embed_url || "",
      body: content.trim(),
      slug: data.slug || ""
    };
  });
}

function buildJSON() {
  const output = {};
  for (const [key, folder] of Object.entries(COLLECTIONS)) {
    output[key] = loadCollection(folder);
  }
  return output;
}

function writeOutputs() {
  const json = buildJSON();

  const outPublic = path.join(process.cwd(), "public", "content.json");
  const outApiFolder = path.join(process.cwd(), "api");
  const outApi = path.join(outApiFolder, "content.json");

  if (!fs.existsSync("public")) fs.mkdirSync("public");
  if (!fs.existsSync(outApiFolder)) fs.mkdirSync(outApiFolder);

  fs.writeFileSync(outPublic, JSON.stringify(json, null, 2));
  fs.writeFileSync(outApi, JSON.stringify(json, null, 2));

  console.log("✔ content.json generado correctamente en /public y /api/");
}

writeOutputs();
