/**
 * Google Apps Script sync for the counselor registration response tab.
 *
 * This file is designed to live in the same Apps Script project as
 * google-sheets-student-sync.gs so it can reuse optionalText_, requiredText_,
 * normalizeGender_ and normalizeDate_.
 */

const COUNSELOR_SHEET = 'Đăng ký Tư vấn viên tâm lý học đường';
const COUNSELOR_STATUS_HEADER = 'Trạng thái';
const COUNSELOR_STATUS_ACTIVE_LABEL = 'Đang hoạt động';
const COUNSELOR_STATUS_ON_LEAVE_LABEL = 'Tạm nghỉ';
const COUNSELOR_STATUS_INACTIVE_LABEL = 'Ngừng hoạt động';

/**
 * Run once to add the Sheet-side status control.
 * Existing counselor rows default to active; blank/formatted rows stay blank.
 */
function setupCounselorStatusColumn() {
  const spreadsheet = SpreadsheetApp.getActive();
  const sheet = spreadsheet.getSheetByName(COUNSELOR_SHEET);
  if (!sheet) throw new Error(`Không tìm thấy tab: ${COUNSELOR_SHEET}`);

  const currentLastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, currentLastColumn).getDisplayValues()[0]
    .map((header) => optionalText_(header));
  let statusColumn = headers.indexOf(COUNSELOR_STATUS_HEADER) + 1;
  if (!statusColumn) {
    const lastHeaderColumn = headers.reduce(
      (lastColumn, header, index) => header ? index + 1 : lastColumn,
      0,
    );
    statusColumn = lastHeaderColumn + 1;
    sheet.getRange(1, lastHeaderColumn)
      .copyTo(sheet.getRange(1, statusColumn), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    sheet.getRange(1, statusColumn).setValue(COUNSELOR_STATUS_HEADER);
  }

  const validation = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      COUNSELOR_STATUS_ACTIVE_LABEL,
      COUNSELOR_STATUS_ON_LEAVE_LABEL,
      COUNSELOR_STATUS_INACTIVE_LABEL,
    ], true)
    .setAllowInvalid(false)
    .setHelpText('Chọn trạng thái để cập nhật hồ sơ tư vấn viên trên Web.')
    .build();
  sheet.getRange(2, statusColumn, Math.max(sheet.getMaxRows() - 1, 1), 1)
    .setDataValidation(validation);
  sheet.getRange(1, statusColumn).setNote(
    'Không xóa dòng. Chọn "Ngừng hoạt động" để ẩn hồ sơ khỏi Web nhưng vẫn giữ dữ liệu trong database.',
  );
  sheet.setColumnWidth(statusColumn, 170);

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const activeHeaders = sheet.getRange(1, 1, 1, Math.max(statusColumn, currentLastColumn))
    .getDisplayValues()[0]
    .map((header) => optionalText_(header));
  const firstNameIndex = activeHeaders.indexOf('Tên');
  const lastNameIndex = activeHeaders.indexOf('Họ');
  const phoneIndex = activeHeaders.indexOf('Số điện thoại liên hệ');
  if ([firstNameIndex, lastNameIndex, phoneIndex].some((index) => index < 0)) {
    throw new Error(`Tab ${COUNSELOR_SHEET} thiếu cột họ, tên hoặc số điện thoại.`);
  }

  const width = Math.max(statusColumn, currentLastColumn);
  const rows = sheet.getRange(2, 1, lastRow - 1, width).getValues();
  const statuses = rows.map((row) => {
    const currentStatus = optionalText_(row[statusColumn - 1]);
    const isCounselor = optionalText_(row[firstNameIndex])
      && optionalText_(row[lastNameIndex])
      && optionalText_(row[phoneIndex]);
    return [currentStatus || (isCounselor ? COUNSELOR_STATUS_ACTIVE_LABEL : '')];
  });
  sheet.getRange(2, statusColumn, statuses.length, 1).setValues(statuses);
}

function installCounselorSyncTriggers() {
  const spreadsheet = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers()
    .filter((trigger) => [
      'handleCounselorFormSubmit',
      'handleCounselorEdit',
    ].includes(trigger.getHandlerFunction()))
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('handleCounselorFormSubmit')
    .forSpreadsheet(spreadsheet)
    .onFormSubmit()
    .create();
  ScriptApp.newTrigger('handleCounselorEdit')
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();
}

function handleCounselorFormSubmit(event) {
  if (!event || !event.range) throw new Error('Thiếu dữ liệu sự kiện gửi Google Form.');
  syncCounselorRow_(event.range.getSheet(), event.range.getRow());
}

function handleCounselorEdit(event) {
  if (!event || !event.range || event.range.getRow() <= 1) return;
  const sheet = event.range.getSheet();
  if (sheet.getName() !== COUNSELOR_SHEET) return;
  const firstRow = event.range.getRow();
  const lastRow = firstRow + event.range.getNumRows() - 1;
  for (let row = firstRow; row <= lastRow; row += 1) syncCounselorRow_(sheet, row);
}

function syncAllCounselors() {
  const spreadsheet = SpreadsheetApp.getActive();
  const sheet = spreadsheet.getSheetByName(COUNSELOR_SHEET);
  if (!sheet) throw new Error(`Không tìm thấy tab: ${COUNSELOR_SHEET}`);

  let syncedCount = 0;
  let skippedCount = 0;
  for (let row = 2; row <= sheet.getLastRow(); row += 1) {
    if (syncCounselorRow_(sheet, row)) syncedCount += 1;
    else skippedCount += 1;
  }
  console.log(
    `Đồng bộ tư vấn viên hoàn tất: ${syncedCount} dòng, bỏ qua ${skippedCount} dòng trống/chưa đủ dữ liệu.`,
  );
}

function syncCounselorRow_(sheet, rowNumber) {
  if (sheet.getName() !== COUNSELOR_SHEET) return false;

  const columnCount = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, columnCount).getDisplayValues()[0];
  const values = sheet.getRange(rowNumber, 1, 1, columnCount).getValues()[0];
  const row = Object.fromEntries(
    headers.map((header, index) => [optionalText_(header), values[index]]),
  );
  if (!values.some((value) => optionalText_(value))) return false;

  // The current API renders `firstName lastName`; keep Vietnamese Họ + Tên order on Web.
  const firstName = optionalText_(row['Họ']);
  const lastName = optionalText_(row['Tên']);
  const phoneNumber = optionalText_(row['Số điện thoại liên hệ']);
  const email = optionalText_(row['Email liên hệ']);
  if (!firstName || !lastName || !phoneNumber) {
    console.log(
      `Bỏ qua dòng ${rowNumber} trong tab ${sheet.getName()}: chưa đủ họ, tên hoặc số điện thoại.`,
    );
    return false;
  }

  postCounselor_({
    firstName,
    lastName,
    gender: normalizeGender_(row['Giới tính']),
    phoneNumber,
    email: email || null,
    dateOfBirth: normalizeDate_(row['Ngày sinh']),
    role: 'COUNSELOR',
    specialization: optionalText_(row['Chuyên môn và chứng chỉ']) || null,
    status: normalizeCounselorStatus_(row[COUNSELOR_STATUS_HEADER]),
  });
  return true;
}

function postCounselor_(payload) {
  const properties = PropertiesService.getScriptProperties();
  const baseUrl = requiredText_(
    properties.getProperty('BACKEND_BASE_URL'),
    'BACKEND_BASE_URL',
  );
  const secret = requiredText_(
    properties.getProperty('GOOGLE_SHEETS_SYNC_SECRET'),
    'GOOGLE_SHEETS_SYNC_SECRET',
  );
  const response = UrlFetchApp.fetch(
    `${baseUrl.replace(/\/$/, '')}/integrations/google-sheets/counselors`,
    {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: `Bearer ${secret}` },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    },
  );

  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error(`Backend trả về HTTP ${status}. Kiểm tra Executions trong Apps Script để xử lý.`);
  }
}

function normalizeCounselorStatus_(value) {
  const normalized = optionalText_(value).toLocaleLowerCase('vi-VN');
  if (
    normalized === COUNSELOR_STATUS_INACTIVE_LABEL.toLocaleLowerCase('vi-VN')
    || normalized === 'inactive'
  ) return 'INACTIVE';
  if (
    normalized === COUNSELOR_STATUS_ON_LEAVE_LABEL.toLocaleLowerCase('vi-VN')
    || normalized === 'on_leave'
  ) return 'ON_LEAVE';
  return 'ACTIVE';
}
