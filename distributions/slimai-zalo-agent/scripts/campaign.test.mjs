import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dispatch, sendOne } from './campaign.mjs';
const plan = () => ({ senderId: '100', message: 'Tin kiểm thử', recipients: [{ id: '200', name: 'Khách mẫu', type: 0, consent: true }] });
test('preview never logs in or sends', async () => {
  const root = mkdtempSync(join(tmpdir(), 'slimai-test-'));
  try { const result = await dispatch(plan(), { root, connect: () => { throw Error('Unexpected login'); } }); assert.equal(result.pending, 1); assert.equal(result.mode, 'preview'); }
  finally { rmSync(root, { recursive: true }); }
});
test('text failure stops before image', async () => {
  let calls = 0;
  await assert.rejects(sendOne({ sendMessage: async () => { calls++; return {}; } }, { ...plan(), image: 'sample.png' }, plan().recipients[0], () => {}));
  assert.equal(calls, 1);
});
test('text is recorded before image, partial result is retained', async () => {
  const events = []; let calls = 0;
  await assert.rejects(sendOne({ sendMessage: async () => { calls++; if (calls === 1) return { message: { msgId: 'text-id' } }; assert.equal(events[0].status, 'text_accepted'); throw Error('Image rejected'); } }, { ...plan(), image: 'sample.png' }, plan().recipients[0], event => events.push(event)));
  assert.deepEqual(events, [{ status: 'text_accepted', msgId: 'text-id' }]);
});
test('journal prevents retry after uncertain result and stops the batch', async () => {
  const root = mkdtempSync(join(tmpdir(), 'slimai-test-')); let calls = 0;
  const input = plan(); input.recipients.push({ id: '201', type: 0, consent: true });
  const connect = async () => ({ ownId: '100', api: { sendMessage: async () => { calls++; return {}; } } });
  try {
    assert.equal((await dispatch(input, { root, send: true, limit: 2, connect })).mode, 'stopped');
    assert.equal(calls, 1);
    assert.equal((await dispatch(input, { root })).pending, 1);
    assert.equal((await dispatch(plan(), { root, send: true, limit: 1, connect })).attempts, 0);
    assert.equal(calls, 1);
  } finally { rmSync(root, { recursive: true }); }
});
test('opt-out and wrong-account never send', async () => {
  const root = mkdtempSync(join(tmpdir(), 'slimai-test-'));
  try {
    writeFileSync(join(root, 'opt-outs.json'), '["200"]');
    assert.equal((await dispatch(plan(), { root })).pending, 0);
    writeFileSync(join(root, 'opt-outs.json'), '[]');
    await assert.rejects(dispatch(plan(), { root, send: true, limit: 1, connect: async () => ({ ownId: '999', api: {} }) }), /không khớp/);
  } finally { rmSync(root, { recursive: true }); }
});
