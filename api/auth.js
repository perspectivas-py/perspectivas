// /api/auth.js - OAuth GitHub para Decap CMS

module.exports = (req, res) => {
  // Obtener parámetros del query string
  const { provider = 'github', redirect_uri } = req.query;

  // Variables de entorno o valores por defecto
  const clientId = process.env.GITHUB_CLIENT_ID || 'Iv23liDtN7D3PYU7Rp1a';
  const redirectUri = redirect_uri || process.env.REDIRECT_URI || 'https://perspectivaspy.vercel.app/editor';

  if (!clientId) {
    console.error('❌ GITHUB_CLIENT_ID no configurado');
    return res.status(500).json({ error: 'Server config error: Missing GITHUB_CLIENT_ID' });
  }

  const scope = 'repo,user';

  // Construir URL de autorización de GitHub
  const authorizeUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&allow_signup=true`;

  // Redirigir a GitHub
  res.setHeader('Location', authorizeUrl);
  res.status(302).end();
};
