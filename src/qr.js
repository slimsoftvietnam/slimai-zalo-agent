import http from 'node:http';

export async function startQrPage() {
  let image = null;
  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.url === '/qr.png' && image) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      return res.end(image);
    }
    if (req.url === '/' || req.url === '/qr') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<!doctype html><meta charset="utf-8"><title>SlimAI Zalo</title><style>body{font:18px system-ui;text-align:center;padding:3rem}img{width:300px}</style><h1>Đăng nhập Zalo</h1><p>Dùng ứng dụng Zalo trên điện thoại để quét mã.</p><img src="/qr.png" alt="Mã QR"><script>setTimeout(()=>location.reload(),3000)</script>');
    }
    res.writeHead(404); res.end();
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}/qr`,
    address: server.address(),
    setImage(base64) { image = Buffer.from(base64.replace(/^data:image\/png;base64,/, ''), 'base64'); },
    close() { image = null; return new Promise(resolve => server.close(resolve)); }
  };
}
