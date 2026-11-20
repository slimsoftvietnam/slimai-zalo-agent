# Biên bản kiểm tra SlimAI Zalo Agent 1.0.0

Ngày kiểm tra 20/11/2026, Windows x64.

| Hạng mục | Kết quả |
|---|---|
| Cấu trúc và metadata | Vượt qua quick_validate.py của skill-creator |
| Bộ cài sạch trong thư mục dữ liệu riêng | Tự tải Node.js 24 LTS, kiểm SHA-256, npm ci và CLI --version thành công |
| Cài lặp lại | Dùng lại Node đã cài, npm ci theo lockfile thành công |
| Windows PowerShell 5.1 | Cài runtime vào thư mục SlimAI thật và chạy CheckOnly thành công; tiếng Việt hiển thị đúng |
| Phiên bản và trợ giúp CLI | Hiển thị SlimAI Zalo Agent 1.0.0 và các nhóm lệnh đã chọn |
| Bộ nhận chưa khởi động | Check trả not_started, không tạo phiên đăng nhập |
| 8 test tự động | Đạt, gồm preview, lỗi text, ảnh lỗi sau text, chống gửi trùng, opt-out, sai tài khoản, lọc reply, QR loopback và kiểm Host |
| Dependency production | 44 gói, npm audit báo 0 lỗ hổng đã biết sau cập nhật lockfile |
| Hướng dẫn HTML | Đã render và kiểm tra ở chiều rộng 1440px và 390px, không tràn ngang |
| Gói ZIP | Giải nén, đối chiếu checksum từng tệp và chạy status/monitor check thành công |

Bộ cài được thử trong dữ liệu cách ly. Test gửi dùng API giả, không gửi tin tới khách. Bộ skill mới chưa được đăng nhập hoặc gửi thật từ tài khoản người dùng; cần quét QR và gửi thử đúng người đã chọn khi bắt đầu sử dụng. Quy trình trước đây trên CLI gốc không thay thế kiểm thử phiên bản SlimAI đóng gói này.

Cookie, danh sách khách thật, ảnh chiến dịch, hàng đợi reply và lịch cá nhân không thuộc gói phát hành. Runtime cũ và bộ theo dõi đang có không được chuyển đổi hoặc dừng trong quá trình đóng gói.

Audit dependency và test tự động không thay thế đánh giá bảo mật toàn bộ upstream. Tài khoản vẫn có thể bị hạn chế do sử dụng giao thức Zalo không chính thức.
