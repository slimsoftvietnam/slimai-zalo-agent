import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const dataRoot = process.env.SLIMAI_ZALO_DATA || join(process.env.LOCALAPPDATA || homedir(), 'SlimAI', 'ZaloAgent');
export function readJson(path, fallback) {
  try { return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, '')); }
  catch (e) { if (e.code === 'ENOENT' && fallback !== undefined) return fallback; throw e; }
}
export async function loginClient() {
  const installation = readJson(join(dataRoot, 'installation.json'));
  process.env.SLIMAI_ZALO_HOME = join(dataRoot, 'auth');
  process.env.ZALO_JSON_MODE = '1';
  const client = await import(pathToFileURL(join(installation.runtime, 'src/core/zalo-client.js')).href);
  await client.autoLogin(true);
  return { api: client.getApi(), ownId: String(client.getOwnId()) };
}
