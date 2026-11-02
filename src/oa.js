import { stdin, stdout } from 'node:process';

export async function hiddenPrompt(label) {
  if (!stdin.isTTY || !stdin.setRawMode) throw new Error('Cần terminal tương tác để nhập bí mật an toàn.');
  stdout.write(`${label}: `);
  return new Promise((resolve, reject) => {
    let value = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const cleanup = () => { stdin.off('data', onData); stdin.setRawMode(false); stdin.pause(); stdout.write('\n'); };
    const onData = key => {
      if (key === '\r' || key === '\n') { cleanup(); resolve(value); }
      else if (key === '\u0003') { cleanup(); reject(new Error('Đã hủy.')); }
      else if (key === '\u007f') value = value.slice(0, -1);
      else if (key >= ' ') value += key;
    };
    stdin.on('data', onData);
  });
}

export async function configureOA(vault, prompt = hiddenPrompt) {
  vault.probe();
  const appId = await prompt('OA App ID');
  const appSecret = await prompt('OA App Secret');
  const accessToken = await prompt('OA Access Token');
  const refreshToken = await prompt('OA Refresh Token (Enter nếu chưa có)');
  if (!appId || !appSecret || !accessToken) throw new Error('Thiếu App ID, App Secret hoặc Access Token.');
  vault.put('oa', { appId, appSecret, accessToken, refreshToken });
  return { configured: true };
}

export async function callOA(vault, path, { method = 'GET', body } = {}, fetcher = fetch) {
  const creds = vault.get('oa');
  if (!creds) throw new Error('Chưa cấu hình OA. Dùng: slimai-zalo oa setup');
  const response = await fetcher(`https://openapi.zalo.me${path}`, {
    method,
    headers: { access_token: creds.accessToken, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Zalo OA trả HTTP ${response.status}.`);
  const data = await response.json();
  if (data.error && data.error !== 0) throw new Error(`Zalo OA từ chối yêu cầu (mã ${data.error}).`);
  return data;
}

export function oaProfile(vault, fetcher) {
  return callOA(vault, '/v2.0/oa/getoa', {}, fetcher);
}

export function oaSend(vault, userId, text, fetcher) {
  if (!userId || !text) throw new Error('Cần user ID và nội dung.');
  return callOA(vault, '/v3.0/oa/message/cs', {
    method: 'POST', body: { recipient: { user_id: userId }, message: { text } }
  }, fetcher);
}
