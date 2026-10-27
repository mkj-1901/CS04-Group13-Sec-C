'use strict';

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { createApp } = require('../server');

const payload = "<img src=x onerror=alert('Stored XSS')>";

async function startServer(secure) {
  const server = createApp(secure).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  return {
    server,
    url: `http://127.0.0.1:${server.address().port}`
  };
}

async function postComment(url, comment) {
  return fetch(`${url}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ comment })
  });
}

test('vulnerable mode stores and renders the submitted HTML as markup', async (t) => {
  const { server, url } = await startServer(false);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const response = await postComment(url, payload);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<img src=x onerror=alert\('Stored XSS'\)>/);
});

test('secure mode HTML-encodes the same stored payload', async (t) => {
  const { server, url } = await startServer(true);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const response = await postComment(url, payload);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('&lt;img src=x onerror=alert(&#39;Stored XSS&#39;)&gt;'));
  assert.ok(!html.includes(payload));
});

test('rejects empty and oversized comments', async (t) => {
  const { server, url } = await startServer(true);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const empty = await postComment(url, '   ');
  assert.equal(empty.status, 400);

  const oversized = await postComment(url, 'a'.repeat(501));
  assert.equal(oversized.status, 400);
});
