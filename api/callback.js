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
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'perspectivaspy.vercel.app';
    const baseUrl = `${protocol}://${host}`;

    console.log('🔄 [CALLBACK] Recibido');
    console.log('  - Code:', code ? '✓ presente' : '✗ FALTA');
    console.log('  - Base URL:', baseUrl);

    if (!code) {
      console.error('❌ [CALLBACK] Missing code');
      const html = buildHtml('error', { error: 'missing_code' });
      res.status(400).setHeader('Content-Type', 'text/html').send(html);
      return;
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/callback`;

    console.log('🔐 [CALLBACK] OAuth Config:');
    console.log('  - Client ID:', clientId ? '✓ configurado' : '✗ FALTA');
    console.log('  - Client Secret:', clientSecret ? '✓ configurado' : '✗ FALTA');
    console.log('  - Redirect URI:', redirectUri);

    if (!clientId || !clientSecret) {
      console.error('❌ [CALLBACK] Missing credentials');
      const html = buildHtml('error', { error: 'server_config_error' });
      res.status(500).setHeader('Content-Type', 'text/html').send(html);
      return;
    }

    // Intercambiar code por access_token
    console.log('📡 [CALLBACK] Intercambiando code por token...');
    
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
      console.error('❌ [CALLBACK] Token response not OK:', tokenResponse.status, tokenResponse.statusText);
      const errorData = await tokenResponse.text();
      console.error('  Response:', errorData);
      const html = buildHtml('error', { error: 'token_exchange_failed', status: tokenResponse.status });
      res.status(tokenResponse.status).setHeader('Content-Type', 'text/html').send(html);
      return;
    }

    const tokenData = await tokenResponse.json();
    console.log('📦 [CALLBACK] Token response:', JSON.stringify(tokenData, null, 2));

    if (!tokenData.access_token) {
      console.error('❌ [CALLBACK] No access_token en respuesta');
      const html = buildHtml('error', { error: 'no_access_token' });
      res.status(400).setHeader('Content-Type', 'text/html').send(html);
      return;
    }

    console.log('✅ [CALLBACK] Token obtenido exitosamente');

    // Éxito: enviar token al CMS
    const html = buildHtml('success', {
      token: tokenData.access_token,
      provider: 'github',
    });

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('❌ [CALLBACK] Error:', error.message);
    console.error(error.stack);
    const html = buildHtml('error', { error: error.message });
    res.status(500).setHeader('Content-Type', 'text/html').send(html);
  }
};
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
