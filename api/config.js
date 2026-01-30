// /api/config.js - Servir configuración de Decap CMS

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

export default (req, res) => {
  try {
    const configPath = path.join(process.cwd(), 'editor', 'config.yml');
    const content = fs.readFileSync(configPath, 'utf8');
    const config = YAML.parse(content);

    // Detectar el dominio actual dinámicamente
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    config.backend.base_url = baseUrl;
    config.site_url = baseUrl;
    config.display_url = baseUrl;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.statusCode = 200;
    res.end(JSON.stringify(config));
  } catch (error) {
    console.error('❌ [CONFIG] Error:', error.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to load config', message: error.message }));
  }
};
