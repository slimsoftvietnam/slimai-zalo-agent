import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
export function startQrServer(path, port = 18927) {
  const server = http.createServer((req, res) => {
    const allowedHosts = ['127.0.0.1:' + server.address().port, 'localhost:' + server.address().port];
    if (!allowedHosts.includes(req.headers.host)) { res.writeHead(403); res.end(); return; }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'");
    if (!['/', '/qr', '/qr.png'].includes(req.url)) { res.writeHead(404); res.end(); return; }
    if (req.url === '/qr.png') {
      if (!existsSync(path)) { res.writeHead(404); res.end(); return; }
      res.setHeader('Content-Type', 'image/png'); res.end(readFileSync(path)); return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SlimAI · Đăng nhập Zalo</title><style>body{font:18px system-ui;max-width:500px;margin:60px auto;padding:24px;background:#f3f6ff;color:#14233f}img{width:280px;max-width:100%}h1{color:#3155ca}</style><h1>SlimAI Zalo Agent</h1><p>Mở Zalo điện thoại → QR → quét mã → xác nhận đăng nhập.</p><img src="/qr.png" alt="Mã QR đăng nhập"><p>Mã hết hạn? Làm mới trang khi CLI tạo mã mới. Khi CLI báo thành công, đóng trang này.</p></html>');
  });
  server.on('error', error => console.error('Không mở được trang QR cục bộ: ' + error.message + '. Dùng tệp QR hiển thị bởi CLI.'));
  server.listen(port, '127.0.0.1', () => console.log('SlimAI QR: http://127.0.0.1:' + server.address().port + '/qr'));
  return { get url() { return 'http://127.0.0.1:' + (server.address()?.port || port) + '/qr'; }, close: () => server.close() };
}
