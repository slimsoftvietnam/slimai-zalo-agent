import http from 'node:http';
import { randomUUID } from 'node:crypto';

export async function setupOaPage(vault, log = console.log) {
  vault.probe();
  const nonce = randomUUID();
  let finish;
  const completed = new Promise(resolve => { finish = resolve; });
  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'");
    if (req.method === 'GET' && req.url === `/${nonce}`) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<!doctype html><meta charset="utf-8"><title>SlimAI OA</title><style>body{font:17px system-ui;max-width:30rem;margin:3rem auto}label{display:block;margin:1rem 0}input{width:100%;padding:.5rem}button{padding:.6rem 1rem}</style><h1>Kết nối Zalo OA</h1><p>Thông tin được lưu trong kho khóa của máy này.</p><form method="post" action="/${nonce}"><label>App ID<input name="appId" required autocomplete="off"></label><label>App Secret<input name="appSecret" type="password" required autocomplete="off"></label><label>Access Token<input name="accessToken" type="password" required autocomplete="off"></label><label>Refresh Token (nếu có)<input name="refreshToken" type="password" autocomplete="off"></label><button>Lưu an toàn</button></form>`);
    }
    if (req.method === 'POST' && req.url === `/${nonce}` && req.headers.origin === `http://127.0.0.1:${server.address().port}`) {
      let body = '';
      req.on('data', chunk => { body += chunk; if (body.length > 32768) req.destroy(); });
      req.on('end', () => {
        try {
          const data = Object.fromEntries(new URLSearchParams(body));
          if (!data.appId || !data.appSecret || !data.accessToken) throw new Error('missing');
          vault.put('oa', { appId: data.appId, appSecret: data.appSecret, accessToken: data.accessToken, refreshToken: data.refreshToken || '' });
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Đã lưu OA. Bạn có thể đóng trang này.');
          finish(true);
        } catch {
          res.writeHead(400); res.end('Không lưu được. Kiểm tra dữ liệu và kho khóa.');
        }
      });
      return;
    }
    res.writeHead(404); res.end();
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const url = `http://127.0.0.1:${server.address().port}/${nonce}`;
  log(`Mở ${url} để nhập thông tin OA trên máy này.`);
  const timeout = setTimeout(() => finish(false), 5 * 60 * 1000);
  try { return await completed; }
  finally { clearTimeout(timeout); await new Promise(resolve => server.close(resolve)); }
}
