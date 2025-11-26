const { AuthorizationCode } = require('simple-oauth2');

module.exports = async (req, res) => {
  // Debugging: Ver en los logs de Vercel si la variable existe
  console.log("Intentando Login...");
  console.log("Host:", req.headers.host);
  console.log("Client ID Status:", process.env.OAUTH_CLIENT_ID ? "CARGADO CORRECTAMENTE" : "ESTÁ UNDEFINED / VACÍO");

  const client = new AuthorizationCode({
    client: {
      id: process.env.OAUTH_CLIENT_ID,
      secret: process.env.OAUTH_CLIENT_SECRET,
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
