# Chọn đúng ID hội thoại

`User ID` là mã tài khoản cá nhân; `Group ID` là mã nhóm. Chúng không phải tên hoặc số điện thoại. Sau khi đăng nhập, chạy `slimai-zalo find "<tên>"` để tìm trong bạn bè và nhóm; kết quả có `type`, `id`, `name`. Chạy `slimai-zalo groups` để xem mọi nhóm và Group ID. Dùng `type=user` với `send user` hoặc `read user`; dùng `type=group` với `send group` hoặc `read group`.

Nếu tên trùng, cho người dùng đối chiếu danh sách kết quả trước khi gửi. Không đoán ID và không công khai danh sách ID/tin nhắn. `find` không tìm người lạ ngoài danh sách bạn bè.

`oa send` cần OA User ID, lấy từ sự kiện/webhook hoặc dữ liệu người dùng của chính OA. Đây là mã trong ngữ cảnh OA; không lấy User ID của tài khoản cá nhân từ `find` để dùng thay. CLI chưa có lệnh liệt kê người dùng OA, nên nếu thiếu mã này, hướng dẫn người dùng lấy từ hệ thống OA.
