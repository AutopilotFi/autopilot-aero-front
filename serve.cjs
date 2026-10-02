// Minimal static server with clean URLs: node serve.cjs [port]
// /checklist → checklist/index.html (or checklist.html), / → index.html
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.argv[2]) || 4321;
const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };

function resolve(urlPath) {
  const base = path.join(root, urlPath);
  if (!base.startsWith(root)) return null;
  const candidates = path.extname(base) ? [base] : [path.join(base, 'index.html'), base + '.html'];
  return candidates.find((f) => fs.existsSync(f) && fs.statSync(f).isFile()) || null;
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  // Old .html links redirect to their clean URL.
  if (urlPath.endsWith('.html') && urlPath !== '/index.html' && !urlPath.startsWith('/assets/')) {
    res.writeHead(301, { Location: urlPath.replace(/(\/index)?\.html$/, '') || '/' });
    return res.end();
  }
  const file = resolve(urlPath);
  if (!file) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Autopilot landing: http://localhost:${port}`));
