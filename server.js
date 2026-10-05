// Static server for Heroku: serves only dist/, forces HTTPS, sets security headers.
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'dist');
const PROD = process.env.NODE_ENV === 'production';

// Hash every inline <script> at boot so the CSP allows exactly those and nothing else.
const htmlFiles = ['index.html', 'brand/index.html', 'checklist/index.html'];
const scriptHashes = htmlFiles.flatMap((f) => {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
    (m) => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`
  );
});

const CSP = [
  "default-src 'self'",
  `script-src ${scriptHashes.join(' ')}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true); // Heroku's router sets X-Forwarded-Proto

app.use((req, res, next) => {
  if (PROD && req.protocol !== 'https') {
    return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
  }
  res.set({
    'Strict-Transport-Security': 'max-age=31536000',
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  });
  next();
});

app.use(express.static(ROOT, { extensions: ['html'], dotfiles: 'ignore', maxAge: '1h' }));
app.use((req, res) => res.status(404).type('text').send('Not found'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
