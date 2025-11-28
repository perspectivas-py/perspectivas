const { AuthorizationCode } = require('simple-oauth2');

module.exports = async (req, res) => {
  const client = new AuthorizationCode({
    client: {
      id: 'Ov23li5ZS4FB1zXwg4Q8', // <--- PEGA TU ID AQUÍ (mantén las comillas)
      secret: process.env.cf16325cbe8eb9382deaaad250da7feedce35de2, // El secreto lo dejamos oculto por ahora
    },
    auth: {
      tokenHost: 'https://github.com',
      tokenPath: '/login/oauth/access_token',
      authorizePath: '/login/oauth/authorize',
    },
  });

  const authorizationUri = client.authorizeURL({
    redirect_uri: `https://${req.headers.host}/api/callback`,
    scope: 'repo,user',
    state: Math.random().toString(36).substring(7),
  });

  res.redirect(authorizationUri);
};
