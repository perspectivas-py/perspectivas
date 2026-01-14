/**
 * validate-hero.js — Validación de Portada Principal
 * Verifica que solo haya UNA noticia marcada como is_main_featured: true
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

function validateHero() {
  console.log("🔍 Validando portada principal...\n");

  const collectionPath = path.join(process.cwd(), "content/noticias/posts");
  
  if (!fs.existsSync(collectionPath)) {
    console.log("⚠️ Carpeta de noticias no encontrada");
    return;
  }

  let mainFeaturedCount = 0;
  const mainFeaturedList = [];

  fs.readdirSync(collectionPath)
    .filter(file => file.endsWith(".md"))
    .forEach(file => {
      const raw = fs.readFileSync(path.join(collectionPath, file), "utf8");
      const { data } = matter(raw);
      
      if (data.featured && data.featured.is_main_featured === true) {
        mainFeaturedCount++;
        mainFeaturedList.push({
          file: file,
          title: data.title,
          date: data.date
        });
      }
    });

  console.log("📋 Resultados de la validación:");
  console.log(`   Total de noticias con is_main_featured: true: ${mainFeaturedCount}\n`);

  if (mainFeaturedCount === 0) {
    console.log("⚠️  ADVERTENCIA: No hay noticia marcada como portada principal.");
    console.log("   Se mostrará la noticia más reciente.\n");
    return;
  }

  if (mainFeaturedCount === 1) {
    console.log("✅ CORRECTO: Solo hay una portada principal.\n");
    console.log(`   📰 ${mainFeaturedList[0].title}`);
    console.log(`   📅 ${mainFeaturedList[0].date}`);
    console.log(`   📄 ${mainFeaturedList[0].file}\n`);
    return;
  }

  if (mainFeaturedCount > 1) {
    console.log("❌ ERROR: Hay MÚLTIPLES noticias como portada principal!\n");
    console.log("   Debes dejar SOLO UNA con is_main_featured: true");
    console.log("   Las otras deben tener is_main_featured: false\n");
    console.log("   Noticias con conflicto:\n");
    
    mainFeaturedList.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title}`);
      console.log(`      📅 ${item.date}`);
      console.log(`      📄 ${item.file}\n`);
    });
    
    console.log("   ⚠️  ACCIÓN REQUERIDA:");
    console.log("   - Revisa los archivos .md listados arriba");
    console.log("   - Deja is_main_featured: true en solo UNO");
    console.log("   - Cambia los demás a is_main_featured: false");
    console.log("   - Guarda los cambios y haz commit\n");
  }
}

validateHero();
