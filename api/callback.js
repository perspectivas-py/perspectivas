const { AuthorizationCode } = require('simple-oauth2');

module.exports = async (req, res) => {
  // 1. Configuración del cliente con tus credenciales HARDCODED
  const client = new AuthorizationCode({
    client: {
      id: 'Ov23li5ZS4FB1zXwg4Q8',      // <--- PEGA TU ID
      secret: 'cf16325cbe8eb9382deaaad250da7feedce35de2', // <--- PEGA TU SECRET
    },
    auth: {
      tokenHost: 'https://github.com',
      tokenPath: '/login/oauth/access_token',
    },
  });

  const { code } = req.query;

  try {
    // 2. Intercambiar el código por el token de acceso
    const accessToken = await client.getToken({
      code,
      redirect_uri: `https://${req.headers.host}/api/callback`,
    });

    const token = accessToken.token.access_token;

    // 3. Preparar el mensaje de éxito
    // Usamos JSON.stringify para evitar problemas de comillas
    const messageData = { token, provider: 'github' };
    const messageString = JSON.stringify(messageData);
    
    // El string final que espera Decap CMS
    const postMessageBody = `authorization:github:success:${messageString}`;

    // 4. Generar el HTML de respuesta
    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Autenticando...</title>
      </head>
      <body>
        <h3>✅ Autenticación exitosa</h3>
        <p>Enviando credenciales al editor...</p>
        <p>Si esta ventana no se cierra en 3 segundos, puedes cerrarla manualmente.</p>
        
        <script>
          // Función principal
          (function() {
            try {
              console.log("Enviando mensaje al CMS...");
              
              // Enviar mensaje a la ventana padre (el CMS)
              window.opener.postMessage('${postMessageBody}', '*');
              
              // Cerrar esta ventana popup
              setTimeout(function() {
                window.close();
              }, 500);
              
            } catch (err) {
              console.error("Error enviando mensaje:", err);
              document.body.innerHTML += "<p style='color:red'>Error: " + err.message + "</p>";
            }
          })();
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlResponse);

  } catch (error) {
    console.error('Access Token Error', error.message);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
};
