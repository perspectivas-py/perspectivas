// /api/auth.js

module.exports = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error('Faltan variables de entorno');
    return res.status(500).send('Server config error');
  }

  const scope = 'repo,user';

  const authorizeUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}`;

  res.writeHead(302, { Location: authorizeUrl });
  res.end();
};
