// UI password gate for the preview. Loaded synchronously in <head> so nothing shows before it runs.
// This is a courtesy lock, not access control: the pages are static and the repo is public.
// Only a SHA-256 of the password lives here; an unlock is remembered per browser.
(function () {
  var HASH = '3807258f60c357658f236ae4bdf2882fae41f918c2df28afabdce80bef619c51';
  var KEY = 'ap-gate';
  var root = document.documentElement;
  try { if (localStorage.getItem(KEY) === HASH) return; } catch (e) { /* storage blocked: ask every visit */ }

  root.classList.add('gated');
  var css = document.createElement('style');
  css.textContent =
    'html.gated body>*:not(#gate){display:none!important}' +
    '#gate{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:var(--bg);font-family:var(--sans)}' +
    '#gate form{width:100%;max-width:360px;padding:28px 24px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(14,17,22,.04),0 12px 32px rgba(14,17,22,.06)}' +
    '#gate .g-brand{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:600}' +
    '#gate p{margin:14px 0 18px;color:var(--muted);font-size:15px;line-height:1.5}' +
    '#gate input{box-sizing:border-box;width:100%;height:46px;padding:0 14px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);font:inherit;font-size:16px}' +
    '#gate input:focus{outline:2px solid var(--blue);outline-offset:1px}' +
    '#gate button{width:100%;height:46px;margin-top:12px;border:none;border-radius:6px;background:var(--blue);color:#fff;font:inherit;font-size:16px;font-weight:600;cursor:pointer}' +
    '#gate button:hover{background:var(--blue-ink)}' +
    '#gate .g-err{min-height:20px;margin:10px 0 0;font-family:var(--mono);font-size:13px;color:#C8102E}';
  document.head.appendChild(css);

  function sha256(text) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var gate = document.createElement('div');
    gate.id = 'gate';
    gate.innerHTML =
      '<form autocomplete="off">' +
      '<div class="g-brand"><img src="/assets/favicon.svg" width="28" height="28" alt="">Autopilot</div>' +
      '<p>This preview is password protected.</p>' +
      '<label for="gatePw" style="position:absolute;left:-9999px">Password</label>' +
      '<input id="gatePw" type="password" placeholder="Password" autofocus>' +
      '<button type="submit">Enter</button>' +
      '<p class="g-err" role="alert"></p>' +
      '</form>';
    document.body.prepend(gate);
    var input = gate.querySelector('input'), err = gate.querySelector('.g-err');
    gate.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!window.crypto || !crypto.subtle) { err.textContent = 'Open this page over HTTPS.'; return; }
      sha256(input.value.trim()).then(function (h) {
        if (h !== HASH) { err.textContent = 'Wrong password.'; input.select(); return; }
        try { localStorage.setItem(KEY, HASH); } catch (e2) { /* unlock for this visit only */ }
        gate.remove();
        root.classList.remove('gated');
        window.dispatchEvent(new Event('resize')); // let canvases size themselves now they are visible
      });
    });
  });
})();
