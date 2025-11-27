const { AuthorizationCode } = require('simple-oauth2');

module.exports = async (req, res) => {
  const client = new AuthorizationCode({
    client: {
      // 👇 PEGA TUS CREDENCIALES AQUÍ DENTRO DE LAS COMILLAS
      id: 'Ov23li5ZS4FB1zXwg4Q8', 
      secret: 'cf16325cbe8eb9382deaaad250da7feedce35de2', 
    },
    auth: {
      tokenHost: 'https://github.com',
      tokenPath: '/login/oauth/access_token',
    },
  });

  const { code } = req.query;

  try {
    const accessToken = await client.getToken({
      code,
      redirect_uri: `https://${req.headers.host}/api/callback`,
    });

    const token = accessToken.token.access_token;

    // Script que inyecta el token en Decap CMS y cierra la ventana popup
    const script = `
      <script>
        (function() {
          function recieveMessage(e) {
            console.log("recieveMessage %o", e);
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify({ token, provider: 'github' })}', 
              e.origin
            );
          }
          window.addEventListener("message", recieveMessage, false);
          window.opener.postMessage(
            'authorization:github:success:${JSON.stringify({ token, provider: 'github' })}', 
            '*'
          );
        })()
      </script>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(script);

  } catch (error) {
    console.error('Access Token Error', error.message);
    res.status(500).json('Authentication failed');
  }
};
