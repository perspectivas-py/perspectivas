// /api/callback.js - GitHub OAuth Callback Handler

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
          window.opener.postMessage(
            ${message},
            e.origin
          );
          window.removeEventListener("message", receiveMessage, false);
          window.close();
        }

        window.addEventListener("message", receiveMessage, false);

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

    // Obtener el dominio actual dinámicamente
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    console.log('🔄 Callback recibido:');
    console.log('  - Code:', code);
    console.log('  - Base URL:', baseUrl);

    if (!code) {
      console.error('❌ Missing "code" query param in /api/callback');
      const html = buildHtml('error', { error: 'missing_code' });
      res.status(400).setHeader('Content-Type', 'text/html').send(html);
      return;
    }

    const clientId = process.env.GITHUB_CLIENT_ID || 'Iv23liDtN7D3PYU7Rp1a';
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/callback`;

    console.log('🔐 OAuth Config:');
    console.log('  - Client ID:', clientId);
    console.log('  - Redirect URI:', redirectUri);

    if (!clientSecret) {
      console.error('❌ GITHUB_CLIENT_SECRET no configurado');
      const html = buildHtml('error', { error: 'server_config_error' });
      res.status(500).setHeader('Content-Type', 'text/html').send(html);
      return;
    }

    // Intercambiar code por access_token usando fetch
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('❌ Error obteniendo token:', tokenResponse.statusText);
      const html = buildHtml('error', { error: 'token_exchange_failed' });
      res.status(tokenResponse.status).setHeader('Content-Type', 'text/html').send(html);
      return;
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('❌ No access_token en respuesta:', tokenData);
      const html = buildHtml('error', { error: 'no_access_token' });
      res.status(400).setHeader('Content-Type', 'text/html').send(html);
      return;
    }

    console.log('✅ Token obtenido exitosamente');

    // Éxito: enviar token al CMS
    const html = buildHtml('success', {
      token: tokenData.access_token,
      provider: 'github',
    });

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('❌ Error en /api/callback:', error.message);
    const html = buildHtml('error', { error: error.message });
    res.status(500).setHeader('Content-Type', 'text/html').send(html);
  }
};
      const result = await client.getToken(tokenParams);
      accessToken = result.token && result.token.access_token
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

    if (!accessToken) {
      console.error('No access_token received from GitHub');
      const html = buildHtml('error', { error: 'missing_access_token' });
      res.status(500).setHeader('Content-Type', 'text/html').send(html);
      return;
    }

    const html = buildHtml('success', {
      token: accessToken,
      provider: 'github',
    });

    res.status(200).setHeader('Content-Type', 'text/html').send(html);
  } catch (err) {
    console.error('Unexpected error in /api/callback:', err);
    const html = buildHtml('error', { error: 'unexpected_error' });
    res.status(500).setHeader('Content-Type', 'text/html').send(html);
  }
};
