const { AuthorizationCode } = require('simple-oauth2');

module.exports = async (req, res) => {
  // --- CREDENCIALES ---
  const client = new AuthorizationCode({
    client: {
      id: 'TU_CLIENT_ID', 
      secret: 'TU_CLIENT_SECRET', 
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
    const provider = 'github'; 

    // ESTRUCTURA EXACTA: authorization:github:success:{ "token": "...", "provider": "github" }
    const content = JSON.stringify({ token, provider });
    const msg = `authorization:${provider}:success:${content}`;

    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <body>
        <h3>✅ Autenticación Completada</h3>
        <p>Conectando con el CMS...</p>
        <script>
          const msg = '${msg}';
          console.log("Enviando mensaje único:", msg);

          function send() {
            // Enviar mensaje al origen exacto (seguridad y precisión)
            // Si window.opener existe, le enviamos el mensaje
            if (window.opener) {
              window.opener.postMessage(msg, "*");
            }
          }

          // Enviar inmediatamente
          send();
          
          // Reintentar cada 0.5s por si el CMS estaba cargando
          const interval = setInterval(send, 500);

          // Cerrar ventana a los 2 segundos
          setTimeout(() => {
            clearInterval(interval);
            window.close();
          }, 2000);
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlResponse);

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Authentication failed');
  }
};
