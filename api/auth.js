// /api/auth.js - OAuth GitHub para Decap CMS

module.exports = (req, res) => {
  try {
    // Obtener el dominio actual dinámicamente
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'perspectivaspy.vercel.app';
    const baseUrl = `${protocol}://${host}`;

    // Variables de entorno
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${baseUrl}/api/callback`;

    console.log('🔐 [AUTH] OAuth iniciado');
    console.log('  - Protocol:', protocol);
    console.log('  - Host:', host);
    console.log('  - Base URL:', baseUrl);
    console.log('  - Client ID:', clientId ? '✓ configurado' : '✗ FALTA');
    console.log('  - Redirect URI:', redirectUri);

    if (!clientId) {
      console.error('❌ [AUTH] GITHUB_CLIENT_ID no configurado');
      return res.status(500).json({ 
        error: 'Configuration Error',
        message: 'GITHUB_CLIENT_ID not configured in environment variables'
      });
    }

    const scope = 'repo,user';

    // Construir URL de autorización de GitHub
    const authorizeUrl =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&allow_signup=true`;

    console.log('✅ [AUTH] Redirigiendo a GitHub...');

    // Redirigir a GitHub
    res.setHeader('Location', authorizeUrl);
    res.status(302).end();

  } catch (error) {
    console.error('❌ [AUTH] Error crítico:', error.message);
    console.error(error.stack);
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message
    });
  }
};
