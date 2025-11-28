const { AuthorizationCode } = require('simple-oauth2');

// /api/auth.js

module.exports = (req, res) => {
  const clientId = process.env.Ov23li5ZS4FB1zXwg4Q8;
  const redirectUri = process.env.https://perspectivaspy.vercel.app/api/callback
;

  if (!clientId || !redirectUri) {
    console.error('Faltan GITHUB_CLIENT_ID o REDIRECT_URI en las env vars');
    return res.status(500).send('Server config error');
  }

  const scope = 'repo,user';

  const authorizeUrl = `https://github.com/login/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}`;

  res.writeHead(302, { Location: authorizeUrl });
  res.end();
};

  res.redirect(authorizationUri);
};
