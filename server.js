import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Log de la solicitud
  console.log(`📍 ${req.method} ${pathname} ${JSON.stringify(parsedUrl.query)}`);

  // --- NUEVO: Manejo dinámico de API ---
  if (pathname.startsWith('/api/') && pathname !== '/api/config') {
    const apiRoute = pathname.replace('/api/', '');
    const apiFilePath = path.join(PUBLIC_DIR, 'api', `${apiRoute}.js`);

    if (fs.existsSync(apiFilePath)) {
      (async () => {
        try {
          // Importar dinámicamente el handler
          const module = await import(url.pathToFileURL(apiFilePath).href);
          const handler = module.default;

          if (typeof handler === 'function') {
            await handler(req, res);
          } else {
            console.error(`❌ Handler no encontrado en ${apiFilePath}`);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Invalid API handler' }));
          }
        } catch (e) {
          console.error(`❌ Error ejecutando API ${apiRoute}:`, e);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'API Execution Error', message: e.message }));
        }
      })();
      return;
    }
  }

  // ENDPOINT: /api/config - Servir config.yml como JSON para Decap CMS
  if (pathname === '/api/config') {
    const configPath = path.join(PUBLIC_DIR, 'editor', 'config.yml');
    fs.readFile(configPath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Config not found' }));
        return;
      }

      try {
        const config = YAML.parse(content);

        // Detectar si es localhost o ngrok y ajustar URLs
        const isLocal = req.headers.host?.includes('localhost') || req.headers.host?.includes('.ngrok');
        if (isLocal) {
          const protocol = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers.host;
          config.backend.base_url = `${protocol}://${host}`;
          config.site_url = `${protocol}://${host}`;
          config.display_url = `${protocol}://${host}`;
          console.log(`🔧 [CONFIG] Ajustando URLs para entorno local/ngrok: ${config.backend.base_url}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ config }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Invalid YAML' }));
      }
    });
    return;
  }

  // Servir archivos estáticos normalmente
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  } else if (pathname === '/editor/' || pathname === '/editor') {
    pathname = '/editor/index.html';
  } else if (pathname === '/noticia' || pathname === '/noticia/') {
    // Si es /noticia sin parámetros, servir noticia.html preservando query string
    pathname = '/noticia.html';
  } else if (pathname.endsWith('/')) {
    // Si termina con /, agregar index.html
    pathname = pathname + 'index.html';
  } else if (!pathname.includes('.')) {
    // Si no tiene extensión, asumir .html
    pathname = pathname + '.html';
  }

  // Ruta completa del archivo
  const filePath = path.join(PUBLIC_DIR, pathname);

  // Prevenir path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Leer y servir el archivo
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }

    // Determinar content-type
    const ext = path.extname(filePath).toLowerCase();
    const isAsset = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.avif', '.webp'].includes(ext);

    const contentType = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.avif': 'image/avif',
      '.webp': 'image/webp'
    }[ext] || 'application/octet-stream';

    // Headers de caché: Assets estáticos por 1 hora, el resto no-cache
    const cacheHeader = isAsset
      ? 'public, max-age=3600'
      : 'no-cache, must-revalidate';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheHeader,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  });
});

server.listen(PORT, 'localhost', () => {
  console.log(`
  ┌─────────────────────────────────────────────┐
  │                                             │
  │   🚀 Perspectivas Local Server              │
  │                                             │
  │   - Local:    http://localhost:${PORT}         │
  │   - Network:  http://192.168.100.124:${PORT}   │
  │                                             │
  │   Ctrl+C para detener                       │
  │                                             │
  └─────────────────────────────────────────────┘
  `);
});
