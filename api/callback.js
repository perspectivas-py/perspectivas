const { AuthorizationCode } = require('simple-oauth2');

module.exports = async (req, res) => {
  const client = new AuthorizationCode({
    client: {
      id: process.env.OAUTH_CLIENT_ID,
      secret: process.env.OAUTH_CLIENT_SECRET,
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
            
            // Enviar mensaje al opener (la ventana del CMS)
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify({ token, provider: 'github' })}', 
              e.origin
            );
          }

          window.addEventListener("message", recieveMessage, false);
          
          // Disparar el mensaje inmediatamente
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
