# Báo cáo tích hợp Apps Script chính

Ngày thực hiện: 14/09/2026  
Dự án Apps Script chính: `1JnbDRa71Y_-jrXeN80RVMKPT8n8GE7gC7d8JIT5HJ75kyoSU720CpAiq`

## Kết quả

- Đã đối chiếu `Code.gs` đang lưu trên Apps Script với bản mã được bàn giao: 94.076 ký tự, 1.803 dòng.
- Đã giữ nguyên toàn bộ `Code.gs` gốc của ERD Sync, QwenPaw và Zalo.
- Đã thêm file độc lập `WebBackendSync.gs` vào dự án Apps Script chính.
- Đã kiểm tra Apps Script nhận diện được hàm `setupWebBackendSync`, chứng tỏ file mới được phân tích cú pháp thành công.
- Đã lưu bản sao mã gốc tại `scripts/apps-script-main-original-2026-09-14.gs`.
- Đã cấu hình Script Properties cho Backend và khóa đồng bộ; giá trị khóa không được ghi vào tài liệu bàn giao.
- Đã bổ sung các OAuth scope tối thiểu cần thiết trong `appsscript.json`, gồm quyền quản lý trigger, đọc/ghi Sheet, gọi Backend và gửi email của hệ thống gốc.
- Đã chạy `setupWebBackendSync` thành công lúc 19:53 ngày 14/09/2026.
- Đã chạy `syncAllWebBackendProfiles` thành công và kiểm tra lại qua URL tunnel hiện hành lúc 20:02: **8 dòng đồng bộ, 12 dòng bỏ qua, 0 lỗi**.

## Chức năng bổ sung

File `WebBackendSync.gs` chỉ phụ trách luồng Sheet → Backend → PostgreSQL cho ba tab nguồn:

1. Học sinh THCS.
2. Học sinh THPT.
3. Tư vấn viên.

Các chức năng chính:

- Tạo cột `Trạng thái` và danh sách chọn phù hợp cho học sinh, tư vấn viên.
- Tự động đồng bộ khi Google Form tạo dòng mới.
- Tự động đồng bộ khi khách hàng sửa trực tiếp trên Sheet.
- Đồng bộ lại toàn bộ dữ liệu đang có bằng `syncAllWebBackendProfiles`.
- Tách học sinh THCS/THPT bằng `schoolLevel`.
- Học sinh `Ngừng theo dõi` được gửi thành `INACTIVE` (soft delete).
- Tư vấn viên `Tạm nghỉ` được gửi thành `ON_LEAVE`; `Ngừng hoạt động` thành `INACTIVE`.
- Chỉ gửi dữ liệu hồ sơ cần cho giao diện quản trị, không gửi câu trả lời tư vấn/đánh giá tâm lý.

## Bảo vệ phần của thành viên khác

- Không sửa `CONFIG`, `ERD_SCHEMA`, `doGet`, `doPost` hoặc các hàm QwenPaw/Zalo.
- Không thay đổi trigger `onFormSubmit`, `autoSyncCounselorAssignments` của hệ thống gốc.
- Hai trigger mới có tên riêng: `handleWebBackendFormSubmit` và `handleWebBackendEdit`.
- Khi cài lại, phần bổ sung chỉ xóa và tạo lại hai trigger do chính nó quản lý.
- Nếu Backend tạm ngừng, lỗi chỉ được ghi trong Executions và không làm dừng luồng ERD/QwenPaw.

## Trạng thái kích hoạt

Script Properties của dự án chính hiện đã có:

- `BACKEND_BASE_URL`: URL Backend kết thúc bằng `/api`.
- `GOOGLE_SHEETS_SYNC_SECRET`: cùng giá trị với Backend.

Đã kiểm tra trực tiếp danh sách trigger của dự án. Tổng cộng có 5 trigger và các trigger gốc vẫn được giữ nguyên:

- Trigger mới `handleWebBackendFormSubmit`: đồng bộ khi Google Form tạo dòng mới.
- Trigger mới `handleWebBackendEdit`: đồng bộ khi khách hàng chỉnh sửa trực tiếp trên Sheet.
- Trigger gốc `onFormSubmit`: được giữ nguyên.
- Trigger gốc `onSpreadsheetEdit`: được giữ nguyên.
- Trigger gốc `autoSyncCounselorAssignments`: được giữ nguyên.

Kết quả đồng bộ toàn bộ gần nhất: **8 thành công / 12 bỏ qua / 0 lỗi**. Các dòng bị bỏ qua là dòng trống hoặc không đủ trường định danh bắt buộc, không phải lỗi hệ thống.

Lưu ý: trigger gốc `onSpreadsheetEdit` do người dùng khác sở hữu đang hiển thị tỷ lệ lỗi 97,3% trong màn hình Triggers. Phần tích hợp mới không chỉnh sửa trigger này; thành viên phụ trách luồng gốc nên kiểm tra riêng lịch sử Executions của nó.

## Lưu ý triển khai

Backend local hiện được công khai tạm thời qua `https://714676cb7fb353.lhr.life/api`. URL tunnel này chỉ hoạt động khi cả Backend và tiến trình tunnel trên máy đang chạy, đồng thời có thể thay đổi sau khi khởi động lại. Khi bàn giao production, `BACKEND_BASE_URL` phải chuyển sang URL HTTPS cố định của Backend đã triển khai. Tài khoản đăng nhập Web vẫn là một tài khoản Admin duy nhất theo phạm vi đã chốt.
