import test from 'node:test';
import assert from 'node:assert/strict';
import { setupOaPage } from '../src/oa-setup-page.js';

test('OA setup binds loopback and stores form only in vault', async () => {
  let url;
  let saved;
  const vault = { probe() {}, put(_name, value) { saved = value; } };
  const completion = setupOaPage(vault, text => { url = text.match(/http:\/\/\S+/)[0]; });
  while (!url) await new Promise(resolve => setTimeout(resolve, 5));
  assert.match(url, /^http:\/\/127\.0\.0\.1:/);
  const form = await fetch(url);
  assert.equal(form.status, 200);
  const data = new URLSearchParams({ appId: 'id', appSecret: 'secret', accessToken: 'token' });
  const posted = await fetch(url, { method: 'POST', headers: { Origin: new URL(url).origin, 'Content-Type': 'application/x-www-form-urlencoded' }, body: data });
  assert.equal(posted.status, 200);
  assert.equal(await completion, true);
  assert.equal(saved.appSecret, 'secret');
});
