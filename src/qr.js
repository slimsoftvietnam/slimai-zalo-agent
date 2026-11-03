import http from 'node:http';

export async function startQrPage() {
  let image = null;
  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.url === '/qr.png') {
      if (!image) { res.writeHead(204); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'image/png' });
      return res.end(image);
    }
    if (req.url === '/' || req.url === '/qr') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<!doctype html><html lang="vi"><meta charset="utf-8"><title>SlimAI Zalo</title>
<style>body{font:18px system-ui;text-align:center;padding:3rem}img{width:300px;max-width:100%;display:none;margin:1.5rem auto}</style>
<h1>Đăng nhập Zalo</h1><p id="status" role="status">Đang tạo mã QR...</p><img id="qr" alt="Mã QR đăng nhập Zalo">
<script>
const status = document.getElementById('status');
const qr = document.getElementById('qr');
let imageUrl;
async function updateQr() {
  try {
    const response = await fetch('/qr.png', { cache: 'no-store' });
    if (response.status === 204) return;
    if (!response.ok) throw new Error('QR unavailable');
    const nextUrl = URL.createObjectURL(await response.blob());
    qr.src = nextUrl;
    qr.style.display = 'block';
    status.textContent = 'Dùng ứng dụng Zalo trên điện thoại để quét mã.';
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = nextUrl;
  } catch {
    clearInterval(timer);
    qr.style.display = 'none';
    status.textContent = 'Trang QR đã đóng. Hãy xem kết quả đăng nhập trong Codex. Nếu chưa đăng nhập, yêu cầu tạo mã QR mới.';
  }
}
const timer = setInterval(updateQr, 3000);
updateQr();
addEventListener('pagehide', () => { if (imageUrl) URL.revokeObjectURL(imageUrl); });
</script></html>`);
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
