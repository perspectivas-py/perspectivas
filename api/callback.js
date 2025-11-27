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
    const provider = 'github'; 

    // Preparamos el mensaje exacto
    const data = JSON.stringify({ token: token, provider: provider });
    const msg = `authorization:${provider}:success:${data}`;

    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <body>
        <h3>✅ Autenticado</h3>
        <p id="status">Enviando credenciales...</p>
        <script>
          const msg = '${msg}';
          
          // Debug para la ventana popup
          console.log("Enviando mensaje:", msg);

          // Función de envío
          function send() {
            if (window.opener) {
              // 1. Enviar formato estándar
              window.opener.postMessage(msg, "*");
              // 2. Enviar formato JSON puro (por si acaso)
              window.opener.postMessage({ token: "${token}", provider: "${provider}" }, "*");
              
              // Intentar escribir en la consola de la ventana padre (El Espía)
              try {
                window.opener.console.log("✅ EL POPUP ESCRIBIÓ ESTO EN TU CONSOLA: Conexión establecida");
              } catch(e) {}
            } else {
              document.getElementById("status").innerText = "Error: No encuentro la ventana del editor.";
            }
          }

          // Enviar inmediatamente y repetir
          send();
          setInterval(send, 500);

          // Cerrar en 3 segundos
          setTimeout(() => window.close(), 3000);
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
