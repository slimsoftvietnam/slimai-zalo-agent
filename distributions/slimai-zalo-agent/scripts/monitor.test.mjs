import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReply } from './monitor.mjs';
const message = () => ({ type: 0, isSelf: false, threadId: '200', data: { msgId: 'reply-1', content: 'Tôi muốn biết thêm', quote: { globalMsgId: 'original-1', msg: 'Lời mời' } } });
test('listener excludes self, groups, unknown contacts and missing message IDs', () => {
  const allowed = new Set(['200']);
  for (const event of [{ ...message(), isSelf: true }, { ...message(), type: 1 }, { ...message(), threadId: '300' }, { ...message(), data: {} }]) assert.equal(normalizeReply(event, allowed), null);
});
test('listener retains reply identity and quote for an allowed contact', () => {
  const row = normalizeReply(message(), new Set(['200']));
  assert.equal(row.key, '200:reply-1'); assert.equal(row.text, 'Tôi muốn biết thêm');
  assert.deepEqual(row.quote, { msgId: 'original-1', text: 'Lời mời' });
});
