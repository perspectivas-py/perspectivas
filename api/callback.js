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

export default async (req, res) => {
  try {
    const { headers, url: reqUrl } = req;

    // Obtener el dominio actual dinámicamente para construir la URL de parsing
    const protocol = headers['x-forwarded-proto'] || 'https';
    const host = headers['x-forwarded-host'] || headers.host || 'perspectivaspy.vercel.app';
    const baseUrl = `${protocol}://${host}`;

    // Parsear el código de la URL
    const urlObj = new URL(reqUrl, baseUrl);
    const code = urlObj.searchParams.get('code');

    console.log('🔄 [CALLBACK] Recibido code:', code ? '✓ presente' : '✗ FALTA');

    if (!code) {
      console.error('❌ [CALLBACK] Missing code');
      const html = buildHtml('error', { error: 'missing_code' });
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
      return;
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/callback`;

    if (!clientId || !clientSecret) {
      console.error('❌ [CALLBACK] Missing credentials');
      const html = buildHtml('error', { error: 'server_config_error' });
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
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
      res.statusCode = tokenResponse.status;
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
      return;
    }

    const tokenData = await tokenResponse.json();
    console.log('📦 [CALLBACK] Token response:', JSON.stringify(tokenData, null, 2));

    if (!tokenData.access_token) {
      console.error('❌ [CALLBACK] No access_token en respuesta');
      const html = buildHtml('error', { error: 'no_access_token' });
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
      return;
    }

    console.log('✅ [CALLBACK] Token obtenido exitosamente');

    // Éxito: enviar token al CMS
    const html = buildHtml('success', {
      token: tokenData.access_token,
      provider: 'github',
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(html);

  } catch (error) {
    console.error('❌ [CALLBACK] Error:', error.message);
    const html = buildHtml('error', { error: error.message });
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  }
};
