import test from 'node:test';
import assert from 'node:assert/strict';
import { configureOA, oaSend } from '../src/oa.js';

test('OA setup saves secret only through vault and send uses token header', async () => {
  let saved;
  const vault = { probe() {}, put(_name, value) { saved = value; }, get() { return saved; } };
  const inputs = ['app', 'secret', 'token', 'refresh'];
  await configureOA(vault, async () => inputs.shift());
  const result = await oaSend(vault, 'user-1', 'Xin chào', async (url, options) => {
    assert.equal(url, 'https://openapi.zalo.me/v3.0/oa/message/cs');
    assert.equal(options.headers.access_token, 'token');
    assert.deepEqual(JSON.parse(options.body), { recipient: { user_id: 'user-1' }, message: { text: 'Xin chào' } });
    return { ok: true, json: async () => ({ error: 0, data: { message_id: '123' } }) };
  });
  assert.equal(result.data.message_id, '123');
});
