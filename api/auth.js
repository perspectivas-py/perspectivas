// /api/auth.js - OAuth GitHub para Decap CMS

module.exports = (req, res) => {
  try {
    console.log('🔐 [AUTH] Inicio de OAuth');
    console.log('  - Method:', req.method);
    console.log('  - URL:', req.url);
    console.log('  - Headers:', JSON.stringify(req.headers, null, 2));

    // Obtener el dominio actual dinámicamente
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    console.log('  - Protocol:', protocol);
    console.log('  - Host:', host);
    console.log('  - Base URL:', baseUrl);

    // Obtener variables de entorno
    const clientId = process.env.GITHUB_CLIENT_ID;

    console.log('  - Client ID:', clientId ? '✓ presente' : '✗ FALTA');

    if (!clientId) {
      console.error('❌ [AUTH] GITHUB_CLIENT_ID no configurado');
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'GITHUB_CLIENT_ID not configured in environment variables'
      });
    }

    const scope = 'repo,user';
    const redirectUri = `${baseUrl}/api/callback`;

    // Construir URL de autorización de GitHub
    const authorizeUrl =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&allow_signup=true`;

    console.log('✅ [AUTH] Redirigiendo a GitHub');
    console.log('  - Redirect URI:', redirectUri);
    console.log('  - Auth URL:', authorizeUrl);

    // Redirigir a GitHub
    res.writeHead(302, {
      'Location': authorizeUrl,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end();

  } catch (error) {
    console.error('❌ [AUTH] Error capturado:', error.message);
    console.error('Stack:', error.stack);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      type: error.name
    });
  }
};
