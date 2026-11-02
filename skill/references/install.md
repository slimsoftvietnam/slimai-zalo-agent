# Cài đặt do agent thực hiện

1. Kiểm tra `process.platform` tương ứng Windows/macOS, Node.js >=20 và `npm`. Kiểm tra `slimai-zalo --version` nếu đã có. Nếu thiếu Node.js, chuẩn bị cài bản LTS qua `winget` trên Windows hoặc Homebrew trên macOS; báo thay đổi cụ thể để người dùng duyệt. Nếu trình quản lý gói không có, cung cấp liên kết Node.js chính thức và dừng.
2. Kiểm tra kho khóa bằng `slimai-zalo doctor` nếu CLI đã có. Nếu chưa có, cài bản phát hành cố định: `npm install -g git+https://github.com/slimsoftvietnam/slimai-zalo-agent.git#v0.1.0`. Không dùng nhánh `main` làm nguồn cài.
3. Chạy lại `slimai-zalo --version`, `slimai-zalo doctor`, `slimai-zalo status`. Nếu thất bại, báo nguyên nhân có thể kiểm tra được; không yêu cầu người dùng chép bí mật vào chat.
4. Hướng dẫn: “Hãy yêu cầu tôi đăng nhập Zalo; khi mã QR xuất hiện, dùng Zalo trên điện thoại để quét.” Sau đó nêu ví dụ “Tìm nhóm Marketing”, “Đọc 10 tin gần đây trong nhóm …”, “Gửi … cho …”. Với OA, mở trang cục bộ từ `slimai-zalo oa setup` để người dùng tự nhập App ID, App Secret và token.

Không dùng thông tin phiên từ ứng dụng khác. Không tự xóa dữ liệu phiên cũ. Nếu cổng QR trên máy ở xa, không mở cổng ra Internet; chỉ dùng đường hầm riêng về localhost.
