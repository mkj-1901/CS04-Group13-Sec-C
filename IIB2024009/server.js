'use strict';

const express = require('express');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 3002);

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entities[character];
  });
}

function createApp(secure = false) {
  const app = express();
  const comments = [];

  app.use(express.urlencoded({ extended: false, limit: '2kb' }));

  function renderPage(message = '') {
    const renderedComments = comments.length
      ? comments.map((comment) => {
        const text = secure ? escapeHtml(comment) : comment;
        return `<li>${text}</li>`;
      }).join('')
      : '<li class="empty">No comments yet.</li>';

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Stored XSS Lab</title>
  <style>
    body { max-width: 760px; margin: 40px auto; padding: 0 20px; font: 16px/1.5 system-ui, sans-serif; color: #172033; }
    .banner { padding: 12px; border-radius: 6px; color: white; background: ${secure ? '#15803d' : '#b91c1c'}; font-weight: 700; }
    textarea { box-sizing: border-box; width: 100%; min-height: 100px; padding: 10px; }
    button { margin: 8px 8px 8px 0; padding: 9px 14px; cursor: pointer; }
    li { margin: 12px 0; overflow-wrap: anywhere; }
    .empty, .hint { color: #526079; }
    code { overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <p class="banner">MODE: ${secure ? 'SECURE' : 'VULNERABLE'} — loopback-only educational lab</p>
  <h1>Stored XSS: Guestbook</h1>
  <p>${secure
    ? 'Comments are HTML-encoded before being rendered.'
    : 'Comments are stored and later rendered as HTML without output encoding.'}</p>
  ${message ? `<p role="status">${message}</p>` : ''}
  <form method="post" action="/comments">
    <label for="comment">Add a comment (1–500 characters)</label>
    <textarea id="comment" name="comment" maxlength="500" required></textarea>
    <button type="submit">Post comment</button>
  </form>
  <form method="post" action="/reset"><button type="submit">Reset comments</button></form>
  <h2>Comments</h2>
  <ul>${renderedComments}</ul>
  <p class="hint">Local demonstration payload: <code>&lt;img src=x onerror=alert('Stored XSS')&gt;</code></p>
</body>
</html>`;
  }

  app.get('/', (_req, res) => {
    res.type('html').send(renderPage());
  });

  app.post('/comments', (req, res) => {
    const comment = req.body.comment;
    if (typeof comment !== 'string' || comment.trim().length === 0 || comment.length > 500) {
      return res.status(400).type('html').send(renderPage('Enter a comment with 1–500 characters.'));
    }

    comments.push(comment);
    return res.redirect('/');
  });

  app.post('/reset', (_req, res) => {
    comments.length = 0;
    res.redirect('/');
  });

  return app;
}

if (require.main === module) {
  const secure = process.argv.includes('--secure') || process.env.SECURE === 'true';
  createApp(secure).listen(PORT, HOST, () => {
    console.log(`Stored XSS lab (${secure ? 'SECURE' : 'VULNERABLE'}) listening at http://${HOST}:${PORT}`);
  });
}

module.exports = { createApp };
