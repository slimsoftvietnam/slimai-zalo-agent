#!/usr/bin/env node
import { Vault, assertPlatform } from './vault.js';
import { loginPersonal, personalApi, findThreads, listGroups, sendPersonal, readGroup, readIncomingUser } from './personal.js';
import { oaProfile, oaSend } from './oa.js';
import { setupOaPage } from './oa-setup-page.js';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const [command, subcommand, ...rest] = process.argv.slice(2);
const json = process.argv.includes('--json');
const args = rest.filter(x => x !== '--json');
const print = value => console.log(JSON.stringify(value, null, json ? 0 : 2));

async function main() {
  if (command === '--version' || command === 'version') return console.log(pkg.version);
  if (command === 'help' || !command) return console.log(`SlimAI Zalo Agent ${pkg.version}\n  doctor | login | status | logout\n  find <tên> | groups | read group <id> [số tin]\n  read user <id> [số giây] (tin mới đến)\n  send user|group <id> <nội dung>\n  oa setup|status|profile|send <user-id> <nội dung>|logout\n  --json: kết quả dạng JSON`);
  assertPlatform();
  const vault = new Vault();
  if (command === 'doctor') {
    vault.probe();
    return print({ supported: true, node: process.version, keychain: 'ready', version: pkg.version });
  }
  if (command === 'status') return print({ personal: !!vault.get('personal'), oa: !!vault.get('oa') });
  if (command === 'logout') { vault.remove('personal'); return print({ personal: false }); }
  if (command === 'login') return print(await loginPersonal(vault));
  if (command === 'oa') {
    if (subcommand === 'setup') return print({ configured: await setupOaPage(vault) });
    if (subcommand === 'logout') { vault.remove('oa'); return print({ oa: false }); }
    if (subcommand === 'status') return print({ configured: !!vault.get('oa') });
    if (subcommand === 'profile') return print(await oaProfile(vault));
    if (subcommand === 'send') return print(await oaSend(vault, args[0], args.slice(1).join(' ')));
    throw new Error('Lệnh OA không hợp lệ. Dùng: slimai-zalo help');
  }
  const api = await personalApi(vault);
  if (command === 'find') return print(await findThreads(api, [subcommand, ...args].filter(Boolean).join(' ')));
  if (command === 'groups') return print(await listGroups(api));
  if (command === 'read' && subcommand === 'group') return print(await readGroup(api, args[0], Number(args[1] || 20)));
  if (command === 'read' && subcommand === 'user') return print(await readIncomingUser(api, args[0], Number(args[1] || 30)));
  if (command === 'send' && (subcommand === 'user' || subcommand === 'group')) return print(await sendPersonal(api, subcommand, args[0], args.slice(1).join(' ')));
  throw new Error('Lệnh không hợp lệ. Dùng: slimai-zalo help');
}

main().catch(() => { console.error('Lệnh thất bại. Kiểm tra kết nối, quyền kho khóa hoặc phiên đăng nhập.'); process.exitCode = 1; });
