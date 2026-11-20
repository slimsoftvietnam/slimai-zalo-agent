# Nguồn gốc và phạm vi kiểm thử

Gói SlimAI Zalo Agent 1.0.0 được tổ chức theo [đặc tả mở Agent Skills](https://agentskills.io/specification), gồm SKILL.md, metadata giao diện, script và tài liệu tham chiếu. Đây là tính tương thích định dạng, không phải chứng chỉ ISO hoặc chứng nhận từ Zalo.

SlimAI là đơn vị đóng gói và duy trì phần skill mới. Lịch sử nguồn và giấy phép MIT bắt buộc nằm trong THIRD_PARTY_NOTICES.md và assets/cli/LICENSE. Không thay giấy phép upstream bằng tuyên bố SlimAI viết toàn bộ mã.

Bản runtime nguồn được khóa theo commit ghi trong thông báo bên thứ ba. Bộ cài tải Node.js 24 LTS từ nodejs.org qua HTTPS, đối chiếu SHA-256 với SHASUMS256.txt cùng máy chủ, rồi dùng npm ci --omit=dev --ignore-scripts. Checksum kiểm tra toàn vẹn theo manifest chính thức, không phải chữ ký độc lập. npm lockfile giữ integrity của từng gói. Không chạy install script của dependency, không cài Git/Python/Zalo PC hoặc thay PATH hệ thống.

QR chỉ nghe trên loopback, không tra IP công khai. Điểm vào SlimAI chỉ đăng ký login/account/msg/friend/group/conv, không đăng ký máy chủ MCP/OA hoặc tự cập nhật upstream. Runtime sử dụng thư mục auth riêng, giới hạn ACL thư mục dữ liệu cho người dùng hiện tại và SYSTEM trên Windows. Cookie vẫn là dữ liệu nhạy cảm ở dạng JSON, chưa được mã hóa bằng kho khóa hệ điều hành.

SDK zca-js dùng giao thức Zalo không chính thức. Tự động hóa tài khoản cá nhân vẫn có thể bị Zalo hạn chế. Không có số tin/ngày hoặc thời gian nghỉ được bảo đảm an toàn. Gói không cung cấp chức năng ngụy trang hành vi hoặc vượt giới hạn. Với triển khai doanh nghiệp dài hạn, đánh giá kênh Zalo OA theo chính sách và quyền gửi tương ứng.

Runtime rút gọn giữ zca-js 2.1.2, bỏ dependency MCP/Express/Zod không dùng. Lockfile đã cập nhật bản vá tương thích gồm undici 7.30.2, ws 8.23.0 và form-data 4.0.6. Không nâng SDK Zalo sang phiên bản khác khi chưa kiểm tra giao thức thực tế. Kết quả audit chỉ phản ánh cảnh báo đã biết của npm tại thời điểm chạy, không chứng minh phần mềm hoàn toàn an toàn.

Đây là bản đóng gói có các biện pháp giảm rủi ro cụ thể, chưa phải kiểm toán an toàn toàn bộ upstream. Kết quả npm audit ở thời điểm kiểm thử được đính kèm trong validation-report.md nếu có. Không nâng dependency phá tương thích một cách tự động. Trước khi phát hành bản mới, chạy test runner, kiểm thử bộ cài trong thư mục dữ liệu trống, kiểm tra help/phiên bản, kiểm tra listener bằng sự kiện giả, quét gói để tránh lộ dữ liệu tài khoản rồi tạo checksum cho ZIP.
