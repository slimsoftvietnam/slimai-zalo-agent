#!/usr/bin/env node
import { Command } from 'commander';
import { registerLoginCommands } from './commands/login.js';
import { registerMsgCommands } from './commands/msg.js';
import { registerFriendCommands } from './commands/friend.js';
import { registerGroupCommands } from './commands/group.js';
import { registerConvCommands } from './commands/conv.js';
import { registerAccountCommands } from './commands/account.js';
import { autoLogin } from './core/zalo-client.js';
const program = new Command();
program.name('slimai-zalo').description('SlimAI Zalo Agent').version('1.0.0').option('--json', 'Machine-readable JSON');
program.hook('preAction', async () => {
  if (program.opts().json) process.env.ZALO_JSON_MODE = '1';
  const command = program.args[0];
  if (!['login','account','help'].includes(command)) await autoLogin(program.opts().json);
});
for (const register of [registerLoginCommands, registerMsgCommands, registerFriendCommands, registerGroupCommands, registerConvCommands, registerAccountCommands]) register(program);
program.parse();
