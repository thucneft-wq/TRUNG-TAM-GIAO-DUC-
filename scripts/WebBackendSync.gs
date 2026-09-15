/**
 * WEB BACKEND SYNC - PHAN BO SUNG CHO APPS SCRIPT CHINH
 *
 * File nay hoat dong doc lap voi Code.gs cua ERD/QwenPaw/Zalo.
 * Khong sua, ghi de hoac xoa cac trigger hien co cua du an chinh.
 *
 * Script Properties bat buoc:
 * - BACKEND_BASE_URL=https://your-backend.example.com/api
 * - GOOGLE_SHEETS_SYNC_SECRET=<same value as backend .env>
 *
 * Chay setupWebBackendSync() mot lan de:
 * 1. Them cot Trang thai va danh sach chon vao 3 tab nguon.
 * 2. Cai trigger rieng cho submit Form va sua truc tiep tren Sheet.
 *
 * Chay syncAllWebBackendProfiles() khi can dong bo du lieu dang co.
 */

const WEB_SYNC_CONFIG = Object.freeze({
  STUDENT_SHEETS: Object.freeze({
    'Đăng ký tư vấn tâm lý học đường – Dành cho học sinh THCS': 'THCS',
    'Đăng ký tư vấn tâm lý học đường – Dành cho học sinh THPT': 'THPT'
  }),
  COUNSELOR_SHEET: 'Đăng ký Tư vấn viên tâm lý học đường',
  STATUS_HEADER: 'Trạng thái',
  STUDENT_STATUSES: Object.freeze([
    'Đang hoạt động',
    'Ngừng theo dõi'
  ]),
  COUNSELOR_STATUSES: Object.freeze([
    'Đang hoạt động',
    'Tạm nghỉ',
    'Ngừng hoạt động'
  ])
});

/**
 * Ham cai dat duy nhat can chay thu cong mot lan.
 */
function setupWebBackendSync() {
  webSyncSetupStatusColumns_();
  installWebBackendSyncTriggers();
  webSyncToast_(
    'Đã thêm cột Trạng thái và cài trigger đồng bộ Web/Database.',
    'Web Backend Sync',
    7
  );
}

/**
 * Chi xoa/cai lai hai trigger do chinh file nay quan ly.
 * Trigger ERD/QwenPaw/Zalo cua Code.gs duoc giu nguyen.
 */
function installWebBackendSyncTriggers() {
  const spreadsheet = webSyncSpreadsheet_();
  const ownedHandlers = [
    'handleWebBackendFormSubmit',
    'handleWebBackendEdit'
  ];

  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (ownedHandlers.indexOf(trigger.getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('handleWebBackendFormSubmit')
    .forSpreadsheet(spreadsheet)
    .onFormSubmit()
    .create();

  ScriptApp.newTrigger('handleWebBackendEdit')
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();
}

/**
 * Trigger rieng cho dong moi tu Google Form.
 * Loi ket noi Backend chi duoc ghi log, khong lam dung luong ERD/QwenPaw.
 */
function handleWebBackendFormSubmit(event) {
  if (!event || !event.range) return;
  try {
    webSyncSourceRow_(event.range.getSheet(), event.range.getRow());
  } catch (error) {
    console.error('[WEB SYNC][FORM] ' + webSyncError_(error));
  }
}

/**
 * Trigger installable cho chinh sua truc tiep tren Sheet.
 * Installable trigger duoc dung vi UrlFetchApp can quyen truy cap mang.
 */
function handleWebBackendEdit(event) {
  if (!event || !event.range || event.range.getRow() <= 1) return;
  const sheet = event.range.getSheet();
  if (!webSyncIsSourceSheet_(sheet.getName())) return;

  const firstRow = event.range.getRow();
  const lastRow = firstRow + event.range.getNumRows() - 1;
  for (let rowNumber = firstRow; rowNumber <= lastRow; rowNumber++) {
    try {
      webSyncSourceRow_(sheet, rowNumber);
    } catch (error) {
      console.error(
        '[WEB SYNC][EDIT] ' + sheet.getName() + '!row=' + rowNumber + ': ' + webSyncError_(error)
      );
    }
  }
}

/**
 * Dong bo lai toan bo hoc sinh THCS, THPT va tu van vien dang co.
 */
function syncAllWebBackendProfiles() {
  const spreadsheet = webSyncSpreadsheet_();
  const sheetNames = Object.keys(WEB_SYNC_CONFIG.STUDENT_SHEETS)
    .concat([WEB_SYNC_CONFIG.COUNSELOR_SHEET]);
  let synced = 0;
  let skipped = 0;
  let failed = 0;

  sheetNames.forEach(function(sheetName) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      console.warn('[WEB SYNC] Không tìm thấy tab: ' + sheetName);
      return;
    }

    for (let rowNumber = 2; rowNumber <= sheet.getLastRow(); rowNumber++) {
      try {
        if (webSyncSourceRow_(sheet, rowNumber)) synced++;
        else skipped++;
      } catch (error) {
        failed++;
        console.error(
          '[WEB SYNC][BULK] ' + sheetName + '!row=' + rowNumber + ': ' + webSyncError_(error)
        );
      }
    }
  });

  const message = 'Hoàn tất: ' + synced + ' dòng đồng bộ, ' + skipped +
    ' dòng bỏ qua, ' + failed + ' lỗi.';
  console.log('[WEB SYNC] ' + message);
  webSyncToast_(message, 'Web Backend Sync', 8);
  return { synced: synced, skipped: skipped, failed: failed };
}

function webSyncSetupStatusColumns_() {
  const spreadsheet = webSyncSpreadsheet_();

  Object.keys(WEB_SYNC_CONFIG.STUDENT_SHEETS).forEach(function(sheetName) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error('Không tìm thấy tab: ' + sheetName);
    webSyncConfigureStatusColumn_(
      sheet,
      WEB_SYNC_CONFIG.STUDENT_STATUSES,
      WEB_SYNC_CONFIG.STUDENT_STATUSES[0],
      ['Tên (học sinh)', 'Họ (học sinh)', 'Số điện thoại liên hệ'],
      'Chọn "Ngừng theo dõi" để ẩn học sinh khỏi Web nhưng vẫn giữ dữ liệu trong Database.'
    );
  });

  const counselorSheet = spreadsheet.getSheetByName(WEB_SYNC_CONFIG.COUNSELOR_SHEET);
  if (!counselorSheet) {
    throw new Error('Không tìm thấy tab: ' + WEB_SYNC_CONFIG.COUNSELOR_SHEET);
  }
  webSyncConfigureStatusColumn_(
    counselorSheet,
    WEB_SYNC_CONFIG.COUNSELOR_STATUSES,
    WEB_SYNC_CONFIG.COUNSELOR_STATUSES[0],
    ['Họ', 'Số điện thoại liên hệ'],
    'Tạm nghỉ sẽ hiện UNACTIVE trên Web. Ngừng hoạt động sẽ ẩn hồ sơ nhưng vẫn giữ dữ liệu trong Database.'
  );
}

function webSyncConfigureStatusColumn_(sheet, statusLabels, defaultStatus, identityHeaders, helpText) {
  const currentLastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, currentLastColumn)
    .getDisplayValues()[0]
    .map(webSyncText_);
  const lastHeaderColumn = headers.reduce(function(lastColumn, header, index) {
    return header ? index + 1 : lastColumn;
  }, 0);
  let statusColumn = headers.indexOf(WEB_SYNC_CONFIG.STATUS_HEADER) + 1;

  if (!statusColumn) {
    statusColumn = Math.max(lastHeaderColumn + 1, 1);
    if (lastHeaderColumn > 0) {
      sheet.getRange(1, lastHeaderColumn).copyTo(
        sheet.getRange(1, statusColumn),
        SpreadsheetApp.CopyPasteType.PASTE_FORMAT,
        false
      );
    }
    sheet.getRange(1, statusColumn).setValue(WEB_SYNC_CONFIG.STATUS_HEADER);
  }

  const validation = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusLabels, true)
    .setAllowInvalid(false)
    .setHelpText(helpText)
    .build();
  sheet.getRange(2, statusColumn, Math.max(sheet.getMaxRows() - 1, 1), 1)
    .setDataValidation(validation);
  sheet.getRange(1, statusColumn).setNote(helpText);
  sheet.setColumnWidth(statusColumn, 170);

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const width = Math.max(statusColumn, currentLastColumn);
  const activeHeaders = sheet.getRange(1, 1, 1, width)
    .getDisplayValues()[0]
    .map(webSyncText_);
  const identityIndexes = identityHeaders.map(function(header) {
    return activeHeaders.indexOf(header);
  });
  const rows = sheet.getRange(2, 1, lastRow - 1, width).getValues();
  const statuses = rows.map(function(row) {
    const currentStatus = webSyncText_(row[statusColumn - 1]);
    const hasIdentity = identityIndexes.every(function(index) {
      return index >= 0 && webSyncText_(row[index]);
    });
    return [currentStatus || (hasIdentity ? defaultStatus : '')];
  });
  sheet.getRange(2, statusColumn, statuses.length, 1).setValues(statuses);
}

function webSyncSourceRow_(sheet, rowNumber) {
  const sheetName = sheet.getName();
  if (WEB_SYNC_CONFIG.STUDENT_SHEETS[sheetName]) {
    return webSyncStudentRow_(sheet, rowNumber, WEB_SYNC_CONFIG.STUDENT_SHEETS[sheetName]);
  }
  if (sheetName === WEB_SYNC_CONFIG.COUNSELOR_SHEET) {
    return webSyncCounselorRow_(sheet, rowNumber);
  }
  return false;
}

function webSyncStudentRow_(sheet, rowNumber, schoolLevel) {
  const rowData = webSyncRowData_(sheet, rowNumber);
  if (!rowData) return false;
  const row = rowData.row;

  const firstName = webSyncPick_(row, ['Tên (học sinh)', 'Tên học sinh', 'Tên']);
  const lastName = webSyncPick_(row, ['Họ (học sinh)', 'Họ học sinh', 'Họ']);
  const phoneNumber = webSyncPick_(row, ['Số điện thoại liên hệ', 'Số điện thoại', 'SĐT']);
  if (!firstName || !lastName || !phoneNumber) {
    console.log('[WEB SYNC] Bỏ qua ' + sheet.getName() + '!row=' + rowNumber +
      ': chưa đủ họ, tên hoặc số điện thoại.');
    return false;
  }

  webSyncPost_('/integrations/google-sheets/students', {
    firstName: firstName,
    lastName: lastName,
    gender: webSyncGender_(webSyncPick_(row, ['Giới tính'])),
    phoneNumber: phoneNumber,
    email: webSyncNullable_(webSyncPick_(row, [
      'Email nhận thông tin',
      'Email Address',
      'Địa chỉ email',
      'Email'
    ])),
    dateOfBirth: webSyncDate_(webSyncPickRaw_(row, ['Ngày sinh'])),
    status: webSyncStudentStatus_(row[WEB_SYNC_CONFIG.STATUS_HEADER]),
    schoolLevel: schoolLevel,
    schoolName: webSyncNullable_(webSyncPick_(row, ['Tên trường', 'Trường học']))
  });
  return true;
}

function webSyncCounselorRow_(sheet, rowNumber) {
  const rowData = webSyncRowData_(sheet, rowNumber);
  if (!rowData) return false;
  const row = rowData.row;

  const name = webSyncCounselorName_(row);
  const phoneNumber = webSyncPick_(row, ['Số điện thoại liên hệ', 'Số điện thoại', 'SĐT']);
  if (!name.firstName || !name.lastName || !phoneNumber) {
    console.log('[WEB SYNC] Bỏ qua ' + sheet.getName() + '!row=' + rowNumber +
      ': chưa đủ họ, tên hoặc số điện thoại.');
    return false;
  }

  webSyncPost_('/integrations/google-sheets/counselors', {
    firstName: name.firstName,
    lastName: name.lastName,
    gender: webSyncGender_(webSyncPick_(row, ['Giới tính'])),
    phoneNumber: phoneNumber,
    email: webSyncNullable_(webSyncPick_(row, [
      'Email liên hệ',
      'Email Address',
      'Địa chỉ email',
      'Email'
    ])),
    dateOfBirth: webSyncDate_(webSyncPickRaw_(row, ['Ngày sinh'])),
    role: 'COUNSELOR',
    specialization: webSyncNullable_(webSyncPick_(row, [
      'Chuyên môn và chứng chỉ',
      'Chuyên môn',
      'Chuyên ngành'
    ])),
    status: webSyncCounselorStatus_(row[WEB_SYNC_CONFIG.STATUS_HEADER])
  });
  return true;
}

function webSyncCounselorName_(row) {
  const familyName = webSyncPick_(row, ['Họ', 'Họ (tư vấn viên)']);
  const givenName = webSyncPick_(row, ['Tên', 'Tên (tư vấn viên)']);
  if (familyName && givenName) {
    // API hien thi firstName + lastName, nen giu thu tu Ho + Ten tren Web.
    return { firstName: familyName, lastName: givenName };
  }

  const fullName = webSyncPick_(row, ['Họ và tên', 'Họ tên', 'Tên đầy đủ']);
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return {
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts[parts.length - 1]
    };
  }
  return { firstName: familyName || '', lastName: givenName || '' };
}

function webSyncRowData_(sheet, rowNumber) {
  if (rowNumber <= 1 || rowNumber > sheet.getLastRow()) return null;
  const columnCount = sheet.getLastColumn();
  if (!columnCount) return null;
  const headers = sheet.getRange(1, 1, 1, columnCount).getDisplayValues()[0];
  const values = sheet.getRange(rowNumber, 1, 1, columnCount).getValues()[0];
  if (!values.some(function(value) { return webSyncText_(value); })) return null;

  const row = {};
  headers.forEach(function(header, index) {
    row[webSyncText_(header)] = values[index];
  });
  return { row: row, values: values };
}

function webSyncPost_(path, payload) {
  const properties = PropertiesService.getScriptProperties();
  const baseUrl = webSyncRequired_(
    properties.getProperty('BACKEND_BASE_URL'),
    'BACKEND_BASE_URL'
  ).replace(/\/$/, '');
  const secret = webSyncRequired_(
    properties.getProperty('GOOGLE_SHEETS_SYNC_SECRET'),
    'GOOGLE_SHEETS_SYNC_SECRET'
  );
  const response = UrlFetchApp.fetch(baseUrl + path, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + secret },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    const body = webSyncText_(response.getContentText()).substring(0, 300);
    throw new Error('Backend trả về HTTP ' + status + (body ? ': ' + body : ''));
  }
}

function webSyncStudentStatus_(value) {
  const normalized = webSyncText_(value).toLocaleLowerCase('vi-VN');
  if (normalized === 'ngừng theo dõi' || normalized === 'inactive') return 'INACTIVE';
  return 'ACTIVE';
}

function webSyncCounselorStatus_(value) {
  const normalized = webSyncText_(value).toLocaleLowerCase('vi-VN');
  if (normalized === 'ngừng hoạt động' || normalized === 'inactive') return 'INACTIVE';
  if (normalized === 'tạm nghỉ' || normalized === 'on_leave') return 'ON_LEAVE';
  return 'ACTIVE';
}

function webSyncGender_(value) {
  const normalized = webSyncText_(value).toLocaleLowerCase('vi-VN');
  if (normalized === 'nam') return 'MALE';
  if (normalized === 'nữ' || normalized === 'nu') return 'FEMALE';
  return normalized ? 'OTHER' : null;
}

function webSyncDate_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const text = webSyncText_(value);
  const match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  return match
    ? match[3] + '-' + match[2].padStart(2, '0') + '-' + match[1].padStart(2, '0')
    : text || null;
}

function webSyncPick_(row, aliases) {
  return webSyncText_(webSyncPickRaw_(row, aliases));
}

function webSyncPickRaw_(row, aliases) {
  for (let index = 0; index < aliases.length; index++) {
    const value = row[aliases[index]];
    if (value !== undefined && value !== null && webSyncText_(value)) return value;
  }
  return '';
}

function webSyncNullable_(value) {
  const text = webSyncText_(value);
  return text || null;
}

function webSyncRequired_(value, fieldName) {
  const text = webSyncText_(value);
  if (!text) throw new Error('Thiếu Script Property: ' + fieldName);
  return text;
}

function webSyncText_(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function webSyncIsSourceSheet_(sheetName) {
  return !!WEB_SYNC_CONFIG.STUDENT_SHEETS[sheetName] ||
    sheetName === WEB_SYNC_CONFIG.COUNSELOR_SHEET;
}

function webSyncSpreadsheet_() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (error) {}
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function webSyncToast_(message, title, seconds) {
  try {
    webSyncSpreadsheet_().toast(message, title || 'Web Backend Sync', seconds || 5);
  } catch (error) {
    console.log((title || 'Web Backend Sync') + ': ' + message);
  }
}

function webSyncError_(error) {
  const text = webSyncText_(error && error.message ? error.message : error);
  return text.length > 500 ? text.substring(0, 500) : (text || 'Lỗi không xác định');
}
