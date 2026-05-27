import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(__dirname, '..');
const docsDirectory = path.join(rootDirectory, 'docs');
const port = readPort(process.env.OPENAPI_DOCS_PORT ?? process.env.PORT ?? '3001');

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.yaml', 'application/yaml; charset=utf-8'],
  ['.yml', 'application/yaml; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    if (requestUrl.pathname === '/') {
      sendHtml(response, renderSwaggerUiHtml());
      return;
    }

    if (requestUrl.pathname === '/docs') {
      response.writeHead(302, { Location: '/' });
      response.end();
      return;
    }

    const filePath = resolveDocsPath(requestUrl.pathname);
    if (!filePath) {
      sendText(response, 404, 'Not found');
      return;
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      sendText(response, 404, 'Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentTypes.get(path.extname(filePath)) ?? 'application/octet-stream',
      'Content-Length': String(fileStat.size),
      'Cache-Control': 'no-store',
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      sendText(response, 404, 'Not found');
      return;
    }

    sendText(response, 500, 'Internal server error');
  }
});

server.listen(port, () => {
  console.log(`OpenAPI docs server listening on http://localhost:${port}/`);
  console.log(`Raw OpenAPI YAML available at http://localhost:${port}/openapi.yaml`);
});

function resolveDocsPath(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const relativePath = decodedPath.replace(/^\/+/, '');
  const filePath = path.resolve(docsDirectory, relativePath);

  if (!filePath.startsWith(`${docsDirectory}${path.sep}`) && filePath !== docsDirectory) {
    return null;
  }
  if (!existsSync(filePath)) {
    return null;
  }

  return filePath;
}

function readPort(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error('OPENAPI_DOCS_PORT must be an integer between 1 and 65535');
  }

  return parsed;
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(message);
}

function sendHtml(response, html) {
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(html);
}

function renderSwaggerUiHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Blood Pressure Tracker API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #f7f7f7; }
      .swagger-ui .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout'
      });
    </script>
  </body>
</html>`;
}
