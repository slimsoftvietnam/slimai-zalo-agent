# SlimAI Zalo Agent

Công cụ kết nối Zalo cho các tác vụ thường dùng trên Windows và macOS. Tài khoản cá nhân sử dụng giao diện không chính thức của Zalo; tài khoản có thể bị giới hạn hoặc phiên có thể ngừng hoạt động khi Zalo thay đổi hệ thống. Zalo Official Account dùng OpenAPI của Zalo.

## Cài trực tiếp bằng Codex

Dán câu này vào Codex:

> Cài skill SlimAI Zalo Agent từ https://github.com/slimsoftvietnam/slimai-zalo-agent/tree/v0.1.1/skills/slimai-zalo-agent, kiểm tra môi trường, cài CLI và hướng dẫn tôi dùng.

Codex sẽ tải skill trực tiếp từ GitHub, kiểm tra Windows/macOS, Node.js, npm và kho khóa rồi cài CLI. Bạn chỉ cần duyệt thay đổi hệ thống được đề xuất; không cần tải ZIP hoặc mở terminal. Sau khi cài skill, hãy bắt đầu lượt trò chuyện mới để Codex nhận skill.

Yêu cầu Node.js 20 trở lên và kho khóa hệ điều hành đang mở.

Nếu tự cài, dùng bản phát hành có gắn tag:

```bash
npm install -g git+https://github.com/slimsoftvietnam/slimai-zalo-agent.git#v0.1.1
slimai-zalo doctor
slimai-zalo login
```

`login` in địa chỉ trang QR cục bộ. Mở trang đó trên máy tính và quét bằng ứng dụng Zalo trên điện thoại. Không gửi mã QR hoặc cookie cho người khác.

## Lệnh

```text
slimai-zalo doctor                         Kiểm tra môi trường và kho khóa
slimai-zalo status                         Kiểm tra có phiên đã lưu
slimai-zalo login                          Đăng nhập tài khoản cá nhân bằng QR
slimai-zalo logout                         Xóa phiên cá nhân khỏi kho khóa
slimai-zalo find <tên>                     Tìm bạn bè và nhóm theo tên
slimai-zalo groups                         Liệt kê nhóm
slimai-zalo read group <id> [số tin]       Đọc lịch sử nhóm gần đây
slimai-zalo read user <id> [số giây]       Chờ và đọc tin mới từ một người
slimai-zalo send user <id> <nội dung>      Gửi tin cá nhân
slimai-zalo send group <id> <nội dung>     Gửi tin nhóm
slimai-zalo oa setup                       Mở trang cục bộ để nhập khóa OA
slimai-zalo oa status                      Kiểm tra cấu hình OA
slimai-zalo oa profile                     Lấy hồ sơ OA
slimai-zalo oa send <id> <nội dung>        Gửi tin chăm sóc OA
slimai-zalo oa logout                      Xóa khóa OA
```

Thêm `--json` để nhận đầu ra JSON. Tin nhắn cá nhân chỉ đọc được khi mới đến trong lúc lệnh `read user` đang chạy; hiện chưa hỗ trợ đọc lại lịch sử cá nhân. Lịch sử nhóm tùy thuộc dữ liệu Zalo cung cấp. Token OA cần được cấp sẵn qua Zalo Developers và có thể hết hạn; khi đó chạy `oa setup` để nhập token mới. Chức năng OA phụ thuộc quyền của OA và giới hạn của Zalo.

## Bảo mật

Thông tin phiên, proxy có mật khẩu (khi được hỗ trợ về sau), App Secret và token OA chỉ lưu trong Windows Credential Manager hoặc macOS Keychain dưới dịch vụ `vn.slimai.zalo-agent`. Không có cơ chế dự phòng lưu văn bản thuần. Trang QR chỉ mở trên `127.0.0.1`, không ghi ảnh QR ra đĩa. Lệnh `status` cho biết có thông tin được lưu, không cam kết phiên còn được Zalo chấp nhận; lệnh cần kết nối sẽ xác minh khi dùng.

Không đưa bí mật vào đối số dòng lệnh, prompt chat hoặc log. Khi dùng OA, nhập trên trang cục bộ do CLI mở; trang tự đóng sau khi lưu hoặc sau 5 phút.

Liên hệ: info@slimsoft.vn. Tìm hiểu thêm về SlimAI tại https://ai.slim.vn/.
