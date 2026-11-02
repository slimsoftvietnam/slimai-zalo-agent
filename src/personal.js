import { Zalo, ThreadType, LoginQRCallbackEventType } from 'zca-js';
import { startQrPage } from './qr.js';

export async function loginPersonal(vault, logger = console.log) {
  vault.probe();
  const page = await startQrPage();
  logger(`Mở ${page.url} và quét bằng ứng dụng Zalo trên điện thoại.`);
  let credentials;
  try {
    const api = await new Zalo({ logging: false, checkUpdate: false }).loginQR({}, event => {
      if (event.type === LoginQRCallbackEventType.QRCodeGenerated) page.setImage(event.data.image);
      if (event.type === LoginQRCallbackEventType.QRCodeExpired) event.actions.abort();
      if (event.type === LoginQRCallbackEventType.GotLoginInfo) {
        credentials = { imei: event.data.imei, cookie: event.data.cookie, userAgent: event.data.userAgent };
      }
    });
    if (!credentials) {
      const ctx = api.getContext();
      credentials = { imei: ctx.imei, cookie: ctx.cookie.serializeSync().cookies, userAgent: ctx.userAgent };
    }
    vault.put('personal', credentials);
    return { loggedIn: true, userId: api.getOwnId() };
  } finally { await page.close(); }
}

export async function personalApi(vault) {
  const credentials = vault.get('personal');
  if (!credentials) throw new Error('Chưa đăng nhập. Dùng: slimai-zalo login');
  try { return await new Zalo({ logging: false, checkUpdate: false }).login(credentials); }
  catch { throw new Error('Phiên Zalo đã hết hạn hoặc bị từ chối. Hãy đăng nhập lại bằng QR.'); }
}

export async function findThreads(api, query) {
  const needle = query.toLocaleLowerCase('vi');
  const friends = (await api.getAllFriends()).filter(x => String(x.displayName || x.display_name || '').toLocaleLowerCase('vi').includes(needle))
    .map(x => ({ type: 'user', id: String(x.userId || x.user_id), name: x.displayName || x.display_name }));
  const ids = Object.keys((await api.getAllGroups()).gridVerMap || {});
  const groups = ids.length ? Object.values((await api.getGroupInfo(ids)).gridInfoMap || {}) : [];
  return friends.concat(groups.filter(x => String(x.name || '').toLocaleLowerCase('vi').includes(needle))
    .map(x => ({ type: 'group', id: String(x.groupId || x.group_id), name: x.name })));
}

export async function listGroups(api) {
  const ids = Object.keys((await api.getAllGroups()).gridVerMap || {});
  if (!ids.length) return [];
  return Object.values((await api.getGroupInfo(ids)).gridInfoMap || {}).map(x => ({ id: String(x.groupId || x.group_id), name: x.name }));
}

export async function sendPersonal(api, type, id, message) {
  if (!id || !message) throw new Error('Cần ID hội thoại và nội dung.');
  return api.sendMessage(message, id, type === 'group' ? ThreadType.Group : ThreadType.User);
}

export async function readGroup(api, id, count = 20) {
  if (!id) throw new Error('Cần ID nhóm.');
  return (await api.getGroupChatHistory(id, count)).groupMsgs;
}

export async function readIncomingUser(api, id, seconds = 30) {
  if (!id || !Number.isInteger(seconds) || seconds < 1 || seconds > 120) throw new Error('Cần ID và thời gian từ 1 đến 120 giây.');
  const messages = [];
  const onMessage = event => {
    if (event.type === ThreadType.User && String(event.threadId) === String(id) && !event.isSelf) {
      messages.push({ threadId: event.threadId, content: event.data?.content, timestamp: event.data?.ts });
    }
  };
  api.listener.on('message', onMessage);
  try {
    api.listener.start();
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    return messages;
  } finally {
    api.listener.off('message', onMessage);
    api.listener.stop();
  }
}
