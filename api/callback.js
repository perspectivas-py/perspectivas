const { AuthorizationCode } = require('simple-oauth2');

module.exports = async (req, res) => {
  // --- CREDENCIALES ---
  const client = new AuthorizationCode({
    client: {
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
    const provider = 'github'; // Debe coincidir con el backend name del config.yml

    // --- CORRECCIÓN AQUÍ ---
    // 1. Creamos el objeto puro
    const messageContent = { token: token, provider: provider };
    
    // 2. Construimos el string mágico que espera Decap CMS
    // Estructura: authorization:PROVIDER:success:JSON_STRING
    const message = "authorization:" + provider + ":success:" + JSON.stringify(messageContent);

    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <body>
        <h3>✅ Autenticado</h3>
        <p>Volviendo al gestor...</p>
        <script>
          (function() {
            // El mensaje ya viene preparado desde el servidor correctamente
            const msg = '${message}';
            
            console.log("Enviando a CMS:", msg);

            // Intentar enviar repetidamente por si el navegador va lento
            const interval = setInterval(function() {
              if (window.opener) {
                window.opener.postMessage(msg, "*");
              }
            }, 200);

            // Cerrar ventana
            setTimeout(function() {
              clearInterval(interval);
              window.close();
            }, 1500);
          })();
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
