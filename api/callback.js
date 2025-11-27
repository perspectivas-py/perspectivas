const { AuthorizationCode } = require('simple-oauth2');

module.exports = async (req, res) => {
  // 1. TUS CREDENCIALES (No olvides pegarlas aquí de nuevo)
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
    // 2. Obtener el token
    const accessToken = await client.getToken({
      code,
      redirect_uri: `https://${req.headers.host}/api/callback`,
    });

    const token = accessToken.token.access_token;
    const provider = 'github';

    // 3. Generar HTML que bombardea al CMS con el token en todos los formatos posibles
    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <body>
        <h3>✅ Autenticado. Conectando...</h3>
        <script>
          (function() {
            const token = "${token}";
            const provider = "${provider}";
            
            console.log("Enviando credenciales...");

            // Objeto de datos
            const data = { token: token, provider: provider };
            
            // INTENTO 1: Formato estándar de Netlify (Texto)
            // Es el más común para Decap CMS
            const msg1 = "authorization:" + provider + ":success:" + JSON.stringify(data);
            window.opener.postMessage(msg1, "*");
            
            // INTENTO 2: Objeto JSON puro
            // Algunas versiones modernas lo prefieren así
            window.opener.postMessage(data, "*");

            // INTENTO 3: Formato Stringify directo
            window.opener.postMessage(JSON.stringify(data), "*");

            // Cerrar ventana
            setTimeout(function() {
               window.close();
            }, 500);
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
