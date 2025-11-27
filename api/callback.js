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
    const provider = 'github'; // Debe coincidir con el 'name' en config.yml

    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <body>
        <h3>✅ Conectado con GitHub</h3>
        <p>Enviando llave de acceso al CMS...</p>
        <script>
          const token = "${token}";
          const provider = "${provider}";
          const message = "authorization:" + provider + ":success:{\"token\":\"" + token + "\",\"provider\":\"" + provider + "\"}";
          
          console.log("Iniciando envío repetitivo del mensaje...");

          // ENVIAR MENSAJE CADA 500ms (Fuerza bruta)
          // Esto asegura que si el CMS pestañeó, lo reciba en el siguiente intento.
          const interval = setInterval(() => {
            window.opener.postMessage(message, "*");
            window.opener.postMessage({ token: token, provider: provider }, "*");
          }, 500);

          // Cerrar la ventana después de 4 segundos (tiempo suficiente para conectar)
          setTimeout(() => {
             clearInterval(interval);
             window.close();
          }, 4000);
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
