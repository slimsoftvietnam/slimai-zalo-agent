import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { findThreads, listGroups, readGroup, readIncomingUser, sendPersonal } from '../src/personal.js';

test('find, group history and send use public API shapes', async () => {
  const calls = [];
  const api = {
    getAllFriends: async () => [{ userId: 'u1', displayName: 'Lan' }],
    getAllGroups: async () => ({ gridVerMap: { g1: '1' } }),
    getGroupInfo: async () => ({ gridInfoMap: { g1: { groupId: 'g1', name: 'Marketing' } } }),
    getGroupChatHistory: async () => ({ groupMsgs: [{ content: 'Hello' }] }),
    sendMessage: async (...args) => { calls.push(args); return { message: { msgId: 1 } }; }
  };
  assert.deepEqual(await findThreads(api, 'Lan'), [{ type: 'user', id: 'u1', name: 'Lan' }]);
  assert.deepEqual(await listGroups(api), [{ id: 'g1', name: 'Marketing' }]);
  assert.equal((await readGroup(api, 'g1'))[0].content, 'Hello');
  await sendPersonal(api, 'group', 'g1', 'Hi');
  assert.equal(calls[0][1], 'g1');
});

test('incoming personal messages are scoped to selected sender', async () => {
  const emitter = new EventEmitter();
  emitter.start = () => {
    emitter.emit('message', { threadId: 'other', type: 0, data: { content: 'skip' } });
    emitter.emit('message', { threadId: 'u1', type: 0, data: { content: 'hello' } });
  };
  emitter.stop = () => {};
  const result = await readIncomingUser({ listener: emitter }, 'u1', 1);
  assert.equal(result.length, 1);
  assert.equal(result[0].content, 'hello');
});
