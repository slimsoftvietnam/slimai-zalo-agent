import test from 'node:test';
import assert from 'node:assert/strict';
import { startQrPage } from '../src/qr.js';

test('QR server listens only on loopback and closes cleanly', async () => {
  const page = await startQrPage();
  try {
    assert.equal(page.address.address, '127.0.0.1');
    const res = await fetch(page.url);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    page.setImage(Buffer.from('png').toString('base64'));
    assert.equal((await fetch(`${page.url}.png`)).status, 200);
  } finally { await page.close(); }
});
