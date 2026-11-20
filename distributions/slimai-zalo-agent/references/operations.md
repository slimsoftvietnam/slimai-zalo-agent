# Vận hành SlimAI Zalo Agent

Các lệnh dưới đây chạy từ thư mục skill. Khi dùng trong tác vụ, thay bằng đường dẫn tuyệt đối và quote đường dẫn có khoảng trắng. Bộ cài chính thức chỉ hỗ trợ Windows. Nội dung gửi và người nhận phải nằm trong yêu cầu đã được phép.

## Kiểm tra, đăng nhập và tìm người nhận

```powershell
& .\scripts\setup.ps1 -CheckOnly
& .\scripts\zalo.ps1 --json status
& .\scripts\zalo.ps1 login
& .\scripts\zalo.ps1 --json friend search 'Tên người nhận'
& .\scripts\zalo.ps1 --json friend find 'Số điện thoại đã chuẩn hóa'
& .\scripts\zalo.ps1 --json group list --query 'Tên nhóm'
& .\scripts\zalo.ps1 --json group info ID_NHOM
```

`status.loggedIn` mới xác nhận phiên đang dùng; chỉ có activeAccount chưa chứng minh đăng nhập thành công. Người dùng cần tự quét QR trên điện thoại. Dùng URL `http://127.0.0.1:18927/qr` mà CLI thực tế báo, hoặc mở ảnh `auth/qr.png` dưới thư mục dữ liệu. Không gửi QR cho bên thứ ba. Nếu cổng bận, dùng `login --qr-port 18928` rồi mở URL CLI báo.

Tìm bạn theo tên có thể không bỏ dấu. Thử tên đầy đủ hoặc số do người dùng cung cấp. Nhóm cộng đồng có thể trả danh sách qua `gridInfoMap[id].memVerList` dạng `uid_version`; `group members` có thể rỗng nếu nguồn dùng trường khác. Kiểm tra payload `group info`, không suy ra nhóm không có ai. Quyền xem thành viên và sự đồng ý nhận tin riêng là hai điều khác nhau.

## Tệp kế hoạch

Tạo JSON UTF-8 ngoài thư mục skill. Không đưa thông tin khách vào bản skill phân phối. Ví dụ dưới đây chỉ là dữ liệu mẫu, phải thay UID thật trước khi gửi.

```json
{
  "senderId": "100",
  "message": "Chào bạn, mình từ SlimAI. Đây là thông tin bạn đã yêu cầu.",
  "image": "C:\\DuLieu\\anh-khoa-hoc.jpg",
  "recipients": [
    {"id": "200", "name": "Khách mẫu", "type": 0, "consent": true}
  ]
}
```

- `senderId` lấy từ `--json status`, `id` là UID người nhận hoặc threadId nhóm, luôn lưu dạng chuỗi để tránh mất chính xác số lớn.
- `type: 0` là nhắn riêng, `type: 1` là tin vào nhóm.
- `consent: true` chỉ ghi sau khi xác định phạm vi liên hệ đã được phép; không tự thêm chỉ để qua kiểm tra.
- Bỏ trường `image` nếu chỉ gửi text. Ảnh phải tồn tại và dùng đường dẫn tuyệt đối.

```powershell
# Xem trước, không đăng nhập và không gửi
& .\scripts\run.ps1 campaign 'C:\DuLieu\plan.json'
# Sau chỉ thị gửi của người dùng, thử đúng 1 người
& .\scripts\run.ps1 campaign 'C:\DuLieu\plan.json' --send --limit 1
```

`--limit` là giới hạn số người trong lần chạy, không phải hạn mức Zalo cho phép. Runner không tự thêm ngẫu nhiên thời gian nghỉ hoặc thay lời nhắn để giả làm người thật. Muốn chia nhiều đợt, thống nhất lịch theo nhu cầu khách và chỉ tiếp tục khi đợt trước không có kết quả cần rà soát.

## Kết quả và chống gửi trùng

| Kết quả | Ý nghĩa | Hành động |
|---|---|---|
| preview | Chỉ xem trước | Đọc số người, nội dung và ảnh |
| accepted | API trả mã tin cho đủ phần | Báo số yêu cầu được nhận, không nói đã đọc |
| text_accepted rồi needs_review | Text đã có mã, ảnh chưa chắc thành công | Kiểm tra hội thoại, chỉ bổ sung đúng phần thiếu |
| attempted rồi needs_review | Kết quả thiếu mã hoặc có lỗi | Dừng và đối chiếu, không tự gửi lại |
| Có dispatch.lock | Một tiến trình đang chạy hoặc đã dừng bất thường | Xác minh tiến trình trước khi gỡ khóa |

Nhật ký `dispatch.jsonl` nằm trong thư mục dữ liệu. Dấu vân tay tính từ tài khoản gửi, người nhận, loại hội thoại, nguyên văn tin và nội dung tệp ảnh. Đổi tên plan hoặc ảnh không làm gửi trùng. Đổi nội dung tạo dấu vân tay mới; vì vậy không sửa nội dung để vượt qua dòng đang cần rà soát. Không xóa nhật ký để chạy lại toàn bộ.

Nếu cần gửi bù, đối chiếu trên ứng dụng, tạo yêu cầu bổ sung cụ thể cho đúng người và đúng phần thiếu. Không coi lỗi `120` là bằng chứng chắc chắn cả tài khoản đã bị khóa; ghi nguyên mã, dừng đợt và báo người dùng. Tương tự với `122`, `127`, captcha, đăng nhập thất bại và cảnh báo từ Zalo. Không thử nhiều cách liên tiếp để né hạn chế.

Khách từ chối nhận tin riêng → thêm UID dạng chuỗi vào `%LOCALAPPDATA%\SlimAI\ZaloAgent\opt-outs.json`, một mảng JSON như `["200"]`. Giữ các UID đã có. Runner kiểm tra lại danh sách trước mỗi người nhận.

## Đổi máy, cập nhật và gỡ

Chạy `INSTALL.cmd` trên máy mới, đăng nhập lại QR. Bộ phân phối không chứa phiên tài khoản cũ. Không tự chép auth qua email hoặc link công khai.

Cập nhật bằng cách dừng listener SlimAI và các đợt gửi của runtime này, sao lưu dữ liệu riêng vào nơi bảo mật, thay gói skill sau khi kiểm thử rồi chạy lại setup. Lockfile khóa dependency đã kiểm thử. Không dùng `npm update` hoặc `audit fix --force` trên phiên đang chạy. Bản vá mới cần được thử trong thư mục dữ liệu riêng trước khi thay runtime thật.

Gỡ skill khỏi thư mục skills chỉ gỡ khả năng tự nhận diện. Dừng các tiến trình và lịch của skill trước; dữ liệu riêng được giữ lại. Xóa auth hoặc lịch sử là thao tác riêng cần người dùng yêu cầu. Có thể chọn thư mục thử nghiệm bằng `$env:SLIMAI_ZALO_DATA='C:\DuLieu\SlimAI-Test'` rồi chạy setup với `-DataRoot` cùng đường dẫn.
