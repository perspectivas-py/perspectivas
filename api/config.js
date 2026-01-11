// /api/config.js - Servir config.yml para Decap CMS
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    // Leer el archivo config.yml
    const configPath = path.join(process.cwd(), 'editor', 'config.yml');
    const configContent = fs.readFileSync(configPath, 'utf8');

    // Servir con el MIME type correcto
    res.setHeader('Content-Type', 'application/x-yaml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(configContent);
  } catch (error) {
    console.error('❌ Error sirviendo config.yml:', error.message);
    res.status(404).json({ error: 'Config not found', message: error.message });
  }
};
