import test from 'node:test';
import assert from 'node:assert/strict';
import { Vault, assertPlatform } from '../src/vault.js';

class FakeEntry {
  static values = new Map();
  constructor(service, name) { this.key = `${service}/${name}`; }
  setPassword(value) { FakeEntry.values.set(this.key, value); }
  getPassword() { return FakeEntry.values.get(this.key) ?? null; }
  deletePassword() { FakeEntry.values.delete(this.key); }
}

test('vault stores and removes secrets without files', () => {
  const vault = new Vault(FakeEntry);
  vault.probe();
  vault.put('personal', { cookie: 'secret' });
  assert.deepEqual(vault.get('personal'), { cookie: 'secret' });
  vault.remove('personal');
  assert.equal(vault.get('personal'), null);
});

test('unsupported platforms fail closed', () => {
  assert.throws(() => assertPlatform('linux'), /Windows và macOS/);
});

test('locked vault fails preflight', () => {
  class LockedEntry extends FakeEntry { setPassword() { throw new Error('locked'); } }
  assert.throws(() => new Vault(LockedEntry).probe(), /Không dùng được/);
});
