# Báo cáo cập nhật quản lý học sinh bằng Google Sheet

## Kết luận

Luồng quản lý học sinh đã được hoàn thiện theo phạm vi MVP: khách hàng thực hiện thêm,
sửa và ngừng theo dõi học sinh trên Google Sheet; Web chỉ đọc dữ liệu đang hoạt động.
Không cần thay đổi cấu trúc database vì bảng `Students` đã có cột `status`.

## Cách vận hành

- Hai tab THCS và THPT có cột dropdown `Trạng thái`.
- `Đang hoạt động` tương ứng với `ACTIVE` trong PostgreSQL và học sinh xuất hiện trên Web.
- `Ngừng theo dõi` tương ứng với `INACTIVE`; học sinh bị ẩn khỏi danh sách Web nhưng hồ sơ
  vẫn được giữ trong database để bảo toàn lịch sử.
- Không xóa cả dòng trên Sheet. Khi xóa dòng, trigger không còn đủ số điện thoại hoặc email
  để xác định hồ sơ cần ngừng theo dõi.
- Nếu cần khôi phục, chọn lại `Đang hoạt động`; hồ sơ được cập nhật thành `ACTIVE`.

## Luồng kỹ thuật

1. Khách hàng thay đổi dữ liệu hoặc trạng thái trên tab THCS hay THPT.
2. Trigger `handleStudentEdit` đọc đúng dòng vừa thay đổi.
3. Apps Script chuẩn hóa dữ liệu và gửi yêu cầu có Bearer secret tới backend HTTPS.
4. Backend tìm học sinh theo số điện thoại hoặc email.
5. Với `Ngừng theo dõi`, backend cập nhật học sinh và phân công tư vấn viên đang hiệu lực
   thành `INACTIVE` trong một transaction.
6. API danh sách chỉ trả học sinh `ACTIVE`, nên Web tự loại hồ sơ đã ngừng theo dõi sau khi
   làm mới hoặc đến chu kỳ tải lại dữ liệu.

## Kết quả kiểm thử ngày 13 tháng 9 năm 2026

- Apps Script thêm thành công dropdown cho cả hai tab THCS và THPT.
- Trigger chỉnh sửa chạy thành công khi đổi trạng thái theo cả hai chiều.
- Dòng dữ liệu thử được lưu `INACTIVE` và không xuất hiện trên Web.
- Hồ sơ nghiệp vụ được khôi phục `ACTIVE` sau lượt thử.
- PostgreSQL và Web cùng hiển thị 15 hồ sơ hoạt động: 8 THCS và 7 THPT.
- Backend vượt qua 34 trên 34 kiểm thử tự động và TypeScript type-check.
- Web không có nút xóa; mỗi dòng chỉ có thao tác mở đúng tab Sheet để cập nhật.

## Phạm vi và rủi ro còn lại

- Tunnel HTTPS hiện tại chỉ phục vụ chạy local và URL có thể đổi khi kết nối lại. Trước
  nghiệm thu cần triển khai backend lên một URL HTTPS ổn định và cập nhật
  `BACKEND_BASE_URL` trong Apps Script.
- Một tài khoản Admin dùng chung phù hợp với MVP nhưng audit log không phân biệt từng người
  thao tác. Nên chuyển sang tài khoản cá nhân và MFA khi mở rộng phạm vi.
- Xóa vật lý chỉ nên là quy trình quản trị database riêng, có sao lưu và phê duyệt; không
  cung cấp cho khách hàng trên Web hoặc Sheet.

## Tiêu chí nghiệm thu

- Thêm hoặc sửa một học sinh trên đúng tab sẽ cập nhật PostgreSQL.
- Chọn `Ngừng theo dõi` sẽ chuyển hồ sơ thành `INACTIVE` và ẩn khỏi Web.
- Chọn lại `Đang hoạt động` sẽ đưa hồ sơ trở lại danh sách.
- Dòng trống không được tạo thành học sinh trong database.
- THCS và THPT luôn hiển thị thành hai danh sách riêng trên Web.
