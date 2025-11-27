const { AuthorizationCode } = require('simple-oauth2');

module.exports = async (req, res) => {
  // --- TUS CREDENCIALES ---
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

    // Obtenemos el token limpio
    const token = accessToken.token.access_token;
    const provider = 'github';

    // Preparamos el objeto de datos de forma segura
    const data = JSON.stringify({ token: token, provider: provider });

    // Generamos el HTML. Nota cómo pasamos 'data' directamente para evitar errores de sintaxis.
    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <body>
        <h3>✅ Autenticado correctamente</h3>
        <p>Cerrando ventana y volviendo al editor...</p>
        <script>
          (function() {
            try {
              // Recuperamos los datos que inyectamos desde el servidor
              const data = ${data};
              
              // Construimos el mensaje en el formato exacto que pide Decap CMS
              // Formato: authorization:provider:success:{json}
              const message = "authorization:" + data.provider + ":success:" + JSON.stringify(data);
              
              console.log("Enviando mensaje al CMS:", message);

              // Usamos setInterval para insistir hasta que la ventana se cierre
              // Esto asegura que el CMS reciba el mensaje sí o sí.
              const interval = setInterval(function() {
                if (window.opener) {
                  window.opener.postMessage(message, "*");
                }
              }, 200);

              // Cerramos la ventana a los 2 segundos
              setTimeout(function() {
                clearInterval(interval);
                window.close();
              }, 2000);

            } catch (err) {
              alert("Error en el script de callback: " + err.message);
            }
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
