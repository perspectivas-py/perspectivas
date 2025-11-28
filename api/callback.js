// /api/callback.js
// Serverless Function en Vercel (Node)
// Requiere simple-oauth2: npm install simple-oauth2

const { AuthorizationCode } = require('simple-oauth2');

const config = {
  client: {
    id: process.env.Ov23li5ZS4FB1zXwg4Q8,
    secret: process.env.cf16325cbe8eb9382deaaad250da7feedce35de2,
  },
  auth: {
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
    authorizeHost: 'https://github.com',
    authorizePath: '/login/oauth/authorize',
  },
};

const client = new AuthorizationCode(config);

// Genera el HTML que envía el resultado al CMS vía postMessage
function buildHtml(status, payload) {
  const content = JSON.stringify(payload);
  const message = JSON.stringify(`authorization:github:${status}:${content}`);

  return `
<!DOCTYPE html>
<html>
  <body>
    <script>
      (function () {
        function receiveMessage(e) {
          console.log("receiveMessage %o", e);
          // Envía el mensaje final al window principal donde está Decap CMS
          window.opener.postMessage(
            ${message},
            e.origin
          );
          window.removeEventListener("message", receiveMessage, false);
          window.close();
        }

        // Escucha handshake desde la ventana principal
        window.addEventListener("message", receiveMessage, false);

        // Inicia el handshake con el CMS
        console.log("Sending message: %o", "github");
        window.opener.postMessage("authorizing:github", "*");
      })();
    </script>
  </body>
</html>`;
}

module.exports = async (req, res) => {
  try {
    const { code } = req.query || {};

    if (!code) {
      console.error('Missing "code" query param in /api/callback');
      const html = buildHtml('error', { error: 'missing_code' });
      res.status(400).setHeader('Content-Type', 'text/html').send(html);
      return;
    }

    const redirectUri = process.env.REDIRECT_URI;

    if (!redirectUri) {
      console.error('REDIRECT_URI env var not set');
      const html = buildHtml('error', { error: 'missing_redirect_uri_env' });
      res.status(500).setHeader('Content-Type', 'text/html').send(html);
      return;
    }

    const tokenParams = {
      code,
      redirect_uri: redirectUri,
      scope: 'repo,user',
    };

    let token;
    try {
      const result = await client.getToken(tokenParams);
      // simple-oauth2 devuelve un AccessToken con la info en .token
      token = result.token && result.token.access_token
        ? result.token.access_token
        : result.access_token;
    } catch (error) {
      console.error('Access Token Error:', error.message);
      if (error.data) {
        console.error('Error data:', error.data);
      } else if (error.response && error.response.data) {
        console.error('Error response data:', error.response.data);
      }

      const html = buildHtml('error', {
        error: 'token_exchange_failed',
        message: error.message,
      });

      res.status(500).setHeader('Content-Type', 'text/html').send(html);
      return;
    }

    if (!token) {
      console.error('No access_token received from GitHub');
      const html = buildHtml('error', { error: 'missing_access_token' });
      res.status(500).setHeader('Content-Type', 'text/html').send(html);
      return;
    }

    // Éxito: devolvemos HTML que hace postMessage al CMS
    const html = buildHtml('success', {
      token,
      provider: 'github',
    });

    res.status(200).setHeader('Content-Type', 'text/html').send(html);
  } catch (err) {
    console.error('Unexpected error in /api/callback:', err);
    const html = buildHtml('error', { error: 'unexpected_error' });
    res.status(500).setHeader('Content-Type', 'text/html').send(html);
  }
};
