/**
 * build-content.js
 * Genera /public/content.json y /api/content.json desde Markdown (Decap CMS)
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Configuración de rutas
const contentDir = path.join(__dirname, '../content');
// CAMBIO CLAVE: Guardamos en la raíz (../content.json) en lugar de (../public/content.json)
const outputFile = path.join(__dirname, '../content.json');

// Definir las colecciones y sus rutas relativas dentro de /content/
const collections = [
    { name: 'noticias', path: 'noticias/posts' },
    { name: 'analisis', path: 'analisis' }, // Ajustar si tienen subcarpeta posts
    { name: 'podcast', path: 'podcast' },
    { name: 'programa', path: 'programa' },
    { name: 'sponsors', path: 'sponsors' }
];

const allContent = {};

// Función para obtener archivos de una colección
const getCollectionData = (collectionName, relativePath) => {
    const dirPath = path.join(contentDir, relativePath);
    
    // Verificar si la carpeta existe
    if (!fs.existsSync(dirPath)) {
        console.warn(`⚠️ Advertencia: La carpeta ${dirPath} no existe. Se saltará.`);
        return [];
    }

    const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.md'));
    
    const items = files.map(filename => {
        const filePath = path.join(dirPath, filename);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);

        return {
            ...data, // Metadatos (título, fecha, autor, imagen)
            slug: filename.replace('.md', ''),
            body: content, // El cuerpo del artículo
            collection: collectionName
        };
    });

    // Ordenar por fecha descendente (lo más nuevo primero) si tienen fecha
    return items.sort((a, b) => {
        if (a.date && b.date) {
            return new Date(b.date) - new Date(a.date);
        }
        return 0;
    });
};

// Ejecutar proceso
console.log('🏗️  Iniciando construcción de content.json...');

try {
    collections.forEach(col => {
        allContent[col.name] = getCollectionData(col.name, col.path);
        console.log(`✅ Colección procesada: ${col.name} (${allContent[col.name].length} items)`);
    });

    fs.writeFileSync(outputFile, JSON.stringify(allContent, null, 2));
    console.log(`🎉 ÉXITO: content.json generado correctamente en: ${outputFile}`);

} catch (error) {
    console.error('❌ ERROR FATAL construyendo content.json:', error);
    process.exit(1);
    module.exports = {};

}
