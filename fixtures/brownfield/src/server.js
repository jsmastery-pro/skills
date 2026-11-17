'use strict';

// A minimal notes app for the brownfield fixture: sign in, then a dashboard of
// your own notes. No dependencies, so `npm start` works on a fresh copy.
const http = require('node:http');
const { randomBytes } = require('node:crypto');
const { findUser, notesFor } = require('./auth/users');

const PORT = Number(process.env.PORT) || 3000;
const sessions = new Map(); // session id -> email

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const page = (title, body) =>
  `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${body}</body></html>`;

const loginForm = (error) =>
  page(
    'Sign in',
    `<h1>Sign in</h1>${error ? `<p role="alert">${escape(error)}</p>` : ''}
<form method="post" action="/login">
  <label>Email <input name="email" type="email" required></label>
  <label>Password <input name="password" type="password" required></label>
  <button type="submit">Sign in</button>
</form>`
  );

function sessionEmail(req) {
  const match = /(?:^|;\s*)sid=([a-f0-9]+)/.exec(req.headers.cookie || '');
  return match ? sessions.get(match[1]) ?? null : null;
}

function readForm(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) {
        req.removeAllListeners('data');
        req.resume(); // drain the rest so the 413 reaches the client
        reject(new Error('form too large'));
      }
    });
    req.on('end', () => resolve(Object.fromEntries(new URLSearchParams(body))));
    req.on('error', reject);
  });
}

function send(res, status, html, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
  res.end(html);
}

const redirect = (res, location, headers = {}) => {
  res.writeHead(303, { Location: location, ...headers });
  res.end();
};

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const email = sessionEmail(req);

  if (req.method === 'GET' && pathname === '/') return redirect(res, email ? '/dashboard' : '/login');
  if (req.method === 'GET' && pathname === '/login') return send(res, 200, loginForm());

  if (req.method === 'POST' && pathname === '/login') {
    let form;
    try {
      form = await readForm(req);
    } catch {
      return send(res, 413, page('Too large', '<h1>Form too large</h1>'), { Connection: 'close' });
    }
    const user = findUser(form.email, form.password);
    if (!user) return send(res, 401, loginForm('Wrong email or password.'));
    const sid = randomBytes(24).toString('hex');
    sessions.set(sid, user.email);
    return redirect(res, '/dashboard', { 'Set-Cookie': `sid=${sid}; HttpOnly; SameSite=Lax; Path=/` });
  }

  if (req.method === 'GET' && pathname === '/dashboard') {
    if (!email) return redirect(res, '/login');
    const items = notesFor(email).map((n) => `<li>${escape(n)}</li>`).join('');
    return send(res, 200, page('Dashboard', `<h1>Dashboard</h1><p>Signed in as ${escape(email)}</p><ul>${items}</ul>`));
  }

  send(res, 404, page('Not found', '<h1>Not found</h1>'));
});

server.listen(PORT, () => console.log(`listening on http://localhost:${PORT}`));
