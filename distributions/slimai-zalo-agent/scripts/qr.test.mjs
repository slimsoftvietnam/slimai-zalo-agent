import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { request } from 'node:http';
import { startQrServer } from '../assets/cli/src/utils/qr-http-server.js';
test('QR uses loopback, refuses foreign Host, and disables caching', async () => {
  const server = startQrServer('missing-test-qr.png', 0);
  try {
    await setTimeout(40);
    assert.match(server.url, /^http:\/\/127\.0\.0\.1:\d+\/qr$/);
    const page = await fetch(server.url);
    assert.equal(page.status, 200); assert.equal(page.headers.get('cache-control'), 'no-store');
    assert.match(await page.text(), /SlimAI/);
    const missingImage = await fetch(server.url.replace('/qr', '/qr.png'));
    assert.equal(missingImage.status, 404);
    const blocked = await new Promise((done, reject) => { const req = request(server.url, { headers: { Host: 'untrusted.example' } }, res => { res.resume(); done(res.statusCode); }); req.on('error', reject); req.end(); });
    assert.equal(blocked, 403);
  } finally { server.close(); }
});
