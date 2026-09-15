/**
 * GOOGLE APPS SCRIPT - FULL ERD SHEETS SYNC + QWENPAW ZALO BACKEND API
 * Spreadsheet: 1VFfQsEoNPE_WCP1SHYMFsN2n-Y4V4_RVvt77Iv305Bg
 *
 * ✅ CẬP NHẬT TỰ ĐỘNG ĐỒNG BỘ TOÀN DIỆN (REALTIME SYNC):
 * 1. Tự động đồng bộ khi GỬI FORM (onFormSubmit)
 * 2. Tự động đồng bộ tức thì khi SỬA/GÕ TAY TRỰC TIẾP TRÊN SHEET (onEdit)
 * 3. Tự động xử lý HỦY LỊCH (inactive + mở lại slot) & ĐẶT LỊCH MỚI (active / tạo PC-xx mới)
 * 4. Tự động kích hoạt lại (reactivate) phân công khi học sinh đặt lại lịch với TVV cũ
 */

const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1VFfQsEoNPE_WCP1SHYMFsN2n-Y4V4_RVvt77Iv305Bg',
  RESPONSE_SHEETS: [
    'Đăng ký tư vấn tâm lý học đường – Dành cho học sinh THCS',
    'Đăng ký tư vấn tâm lý học đường – Dành cho học sinh THPT',
    'Đăng ký Tư vấn viên tâm lý học đường',
    'Phản hồi sau phiên tư vấn',
    'Đăng ký lịch làm việc & thời gian rảnh – Tư vấn viên'
  ],
  HEADER_ROW: 1,
  DEFAULT_STATUS: 'active',
  PENDING_STATUS: 'pending',
  REQUEST_STATUS: 'new',
  SOURCE_PREFIX: 'google_form',
  ADMIN_ALERT_EMAIL: 'congteo87@gmail.com',
  TOKEN_EXPIRY_MINUTES: 15
});

const ENTITY_PREFIXES = Object.freeze({
  counselors: 'TTV-',
  students: 'HS-',
  parents: 'PH-',
  addresses: 'DC-',
  schools: 'TR-',
  counseling_requests: 'YCTV-',
  student_parents: 'HSPH-',
  consents: 'DONGY-',
  zalo_mappings: 'ZALO-',
  feedbacks: 'FB-',
  audit_logs: 'AUDIT-',
  bookings: 'BKG-',
  sessions: 'SES-',
  assessments: 'DG-',
  tests: 'TST-',
  test_assignments: 'GTST-',
  test_attempts: 'LANTHI-',
  results: 'KQ-',
  counselor_assignments: 'PC-',
  counselor_assignment_records: 'LS-',
  counselor_schedules: 'SCHED-',
  treatment_plans: 'KEHOACH-',
  availability_slots: 'SLOT-',
  notifications: 'NOTIF-'
});

const ERD_SCHEMA = Object.freeze({
  registration_tokens: ['token_id','token_hash','zalo_uid','form_type','booking_id','test_assignment_id','expires_at','used_at','created_at'],
  addresses: ['address_id','house_number','street_address','ward','city','province','country','postal_code','raw_address','created_at','updated_at'],
  schools: ['school_id','school_name','address_id','created_at','updated_at'],
  parents: ['parent_id','first_name','last_name','phone_number','email','date_of_birth','status','gender','address_id','created_at','updated_at'],
  counselors: ['counselor_id','first_name','last_name','gender','phone_number','email','date_of_birth','role','status','specialization','created_at','updated_at'],
  students: ['student_id','first_name','last_name','gender','phone_number','email','date_of_birth','grade_level','status','school_id','school_name','address_id','created_at','updated_at'],
  student_parents: ['student_parent_id','student_id','parent_id','relationship','is_primary','created_at'],
  zalo_mappings: ['zalo_mapping_id','zalo_uid','student_id','counselor_id','parent_id','role','status','linked_at','unlinked_at'],
  notifications: ['notification_id','recipient_role','student_id','counselor_id','parent_id','event_type','entity_type','entity_id','channel','message','status','sent_at','created_at'],
  counselor_assignments: ['assignment_id','student_id','counselor_id','status','created_at','updated_at'],
  counselor_assignment_records: ['assignment_record_id','assigned_at','ended_at','status','assignment_id','counselor_id','created_at','updated_at'],
  counselor_schedules: ['schedule_id','counselor_id','day_of_week','slot_start_time','slot_end_time','status','effective_from','effective_until','created_at','updated_at'],
  treatment_plans: ['treatment_plan_id','student_id','goal','start_date','frequency','proposed_sessions','price','status','created_at','updated_at'],
  availability_slots: ['availability_slot_id','counselor_id','status','buffer','start_time','end_time','created_at'],
  bookings: ['booking_id','start_time','end_time','booking_source','status','student_id','counselor_id','availability_slot_id','cancel_reason','cancelled_at','created_at','updated_at'],
  sessions: ['session_id','session_name','session_type','booking_id','started_at','ended_at','status','created_at'],
  assessments: ['assessment_id','student_id','counselor_id','session_id','booking_id','assessment_category','severity','outcome','notes','created_at'],
  feedbacks: ['feedback_id','student_id','session_id','counselor_id','rating','comment','category','created_at'],
  tests: ['test_id','test_name','test_type','status','platform','form_url','created_at','updated_at'],
  test_assignments: ['test_assignment_id','student_id','counselor_id','test_id','status','assigned_at','created_at','updated_at'],
  test_attempts: ['test_attempt_id','test_assignment_id','attempt_no','duration','status','submitted_at','assigned_at','created_at','updated_at'],
  results: ['result_id','test_attempt_id','score','category','created_at','updated_at'],
  counseling_requests: ['counseling_request_id','student_id','parent_id','requester_role','counseling_issue','problem_duration','previous_counseling','mood_last_2_weeks','anxiety_stress_level','sleep_eating_quality','has_support_person','self_harm_thoughts','preferred_method','preferred_time','additional_notes','status','source','created_at','updated_at'],
  consents: ['consent_id','student_id','parent_id','consent_type','status','consented_at','revoked_at','source','created_at','updated_at'],
  history: ['history_id','entity_type','entity_id','status','changed_by','reason','changed_at'],
  audit_logs: ['audit_log_id','actor_id','actor_role','action','entity_type','entity_id','value','created_at'],
  sync_jobs: ['sync_job_id','source_system','target_system','entity_type','entity_id','operation','status','retry_count','error_message','last_attempt_at','created_at'],
  users: ['user_id','email','password_hash','status','email_verified_at','failed_login_attempts','locked_until','last_login_at','password_changed_at','created_at','updated_at'],
  user_profiles: ['user_profile_id','user_id','student_id','parent_id','counselor_id','created_at','updated_at'],
  roles: ['role_id','role_code','role_name','description','is_active','created_at','updated_at'],
  permissions: ['permission_id','permission_code','permission_name','description','created_at'],
  user_roles: ['user_role_id','user_id','role_id','assigned_by','assigned_at','expires_at'],
  role_permissions: ['role_permission_id','role_id','permission_id','granted_at'],
  auth_sessions: ['auth_session_id','user_id','refresh_token_hash','ip_address','user_agent','device_name','expires_at','last_used_at','revoked_at','revoke_reason','created_at'],
  email_verification_tokens: ['email_verification_token_id','user_id','token_hash','expires_at','used_at','created_at'],
  password_reset_tokens: ['password_reset_token_id','user_id','token_hash','expires_at','used_at','created_at'],
  login_attempts: ['login_attempt_id','user_id','attempted_email','was_successful','failure_reason','ip_address','user_agent','attempted_at'],
  user_agreements: ['user_agreement_id','user_id','agreement_type','agreement_version','accepted_at','revoked_at','ip_address']
});

// ---------------------------------------------------------------------------
// SHEET CACHE
// ---------------------------------------------------------------------------
var SHEET_CACHE_ = {};

function getSheetCachedData_(sheetName) {
  if (!SHEET_CACHE_[sheetName]) {
    const ss = getSpreadsheet_();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      ensureHeaders_(sheet, ERD_SCHEMA[sheetName]);
      formatEntitySheet_(sheet);
    }
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn() || (ERD_SCHEMA[sheetName] ? ERD_SCHEMA[sheetName].length : 1);
    const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(clean_);
    let data = [];
    if (lastRow > 1) {
      data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    }
    SHEET_CACHE_[sheetName] = { sheet: sheet, headers: headers, data: data, lastRow: lastRow };
  }
  return SHEET_CACHE_[sheetName];
}

function clearSheetCache_() { SHEET_CACHE_ = {}; }

// ---------------------------------------------------------------------------
// MENU & SETUP
// ---------------------------------------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ERD Sync')
    .addItem('1. Khởi tạo toàn bộ hệ thống', 'initializeErdSync')
    .addItem('2. Tạo/kiểm tra các sheet ERD', 'setupErdSheets')
    .addItem('3. ⚡ Đồng bộ TẤT CẢ phản hồi từ TẤT CẢ form', 'syncAllExistingResponses')
    .addItem('4. Cài lại các trigger tự động', 'installFormSubmitTrigger')
    .addItem('5. Khởi tạo QwenPaw API Backend', 'setupQwenPaw')
    .addItem('6. Cập nhật trạng thái Chấm công', 'highlightPastSlots')
    .addItem('7. Cấp quyền gửi Mail Cảnh báo', 'grantEmailPermission')
    .addSeparator()
    .addItem('8. 🔄 Đồng bộ Phân công từ Bookings', 'syncCounselorAssignmentsFromBookings')
    .addToUi();
}

function grantEmailPermission() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Xác nhận quyền gửi Mail', 'Đã cấp quyền thành công!');
}

function initializeErdSync() {
  clearSheetCache_();
  setupErdSheets();
  setupQwenPaw();
  syncAllExistingResponsesCore_();
  highlightPastSlots();
  clearSheetCache_();
  safeToast_('Hoàn tất khởi tạo toàn bộ ERD & QwenPaw!', 'ERD Sync', 8);
}

function safeToast_(message, title, seconds) {
  try { getSpreadsheet_().toast(message, title || 'QwenPaw', seconds || 5); }
  catch (e) { console.log((title || 'QwenPaw') + ': ' + message); }
}

function setupErdSheets() {
  const ss = getSpreadsheet_();
  Object.keys(ERD_SCHEMA).forEach(function(sheetName) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    ensureHeaders_(sheet, ERD_SCHEMA[sheetName]);
    formatEntitySheet_(sheet);
  });
}

function formatEntitySheet_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (!lastColumn) return;
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, lastColumn)
    .setBackground('#1F4E78').setFontColor('#FFFFFF')
    .setFontWeight('bold').setWrap(true);
  sheet.autoResizeColumns(1, lastColumn);
  for (let col = 1; col <= lastColumn; col++) {
    if (sheet.getColumnWidth(col) > 240) sheet.setColumnWidth(col, 240);
  }
}

function installFormSubmitTrigger() {
  const ss = getSpreadsheet_();
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    const handler = trigger.getHandlerFunction();
    if (handler === 'onFormSubmit' || handler === 'autoSyncCounselorAssignments') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
  // Trigger nền là lớp tự phục hồi cho booking cũ hoặc booking được ghi từ
  // nguồn khác. Booking tạo qua QwenPaw vẫn phân công ngay trong createBooking_.
  ScriptApp.newTrigger('autoSyncCounselorAssignments')
    .timeBased()
    .everyMinutes(5)
    .create();
  safeToast_('Đã cài trigger Form submit và tự đồng bộ phân công mỗi 5 phút.', 'QwenPaw', 6);
}

// ---------------------------------------------------------------------------
// TRIGGERS TỰ ĐỘNG (FORM SUBMIT & ON EDIT REAL-TIME)
// ---------------------------------------------------------------------------

/**
 * Trigger tự động khi có Form submit mới
 */
function onFormSubmit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (!isFormResponseSheet_(sheet)) return;

  clearSheetCache_();
  syncResponseRow_(sheet, e.range.getRow(), false);
  syncCounselorAssignmentsFromBookings(true);
  highlightPastSlots();
  clearSheetCache_();
}

/**
 * Trigger tự động khi Admin gõ/sửa ô trên Google Sheets trực tiếp (Real-time)
 */
function onEdit(e) {
  if (!e || !e.range) return;
  try {
    const sheet = e.range.getSheet();
    const sheetName = clean_(sheet.getName());
    if (sheetName === 'bookings') {
      clearSheetCache_();
      syncCounselorAssignmentsFromBookings(true);
      highlightPastSlots();
    }
  } catch(err) {
    console.warn('Lỗi onEdit: ' + safeError_(err));
  }
}

function syncAllExistingResponses() {
  clearSheetCache_();
  setupErdSheets();
  syncAllExistingResponsesCore_();
  highlightPastSlots();
  clearSheetCache_();
  safeToast_('Đã đồng bộ xong tất cả phản hồi từ tất cả form!', 'ERD Sync', 6);
}

function syncAllExistingResponsesCore_() {
  const ss = getSpreadsheet_();
  const allSheets = ss.getSheets();
  
  // Bước 1: Ưu tiên đồng bộ các sheet được khai báo rõ trong CONFIG
  CONFIG.RESPONSE_SHEETS.forEach(function(sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    syncAllRowsInSheet_(sheet);
  });

  // Bước 2: Quét thêm các sheet chưa được khai báo nhưng có dấu hiệu là Form Response
  allSheets.forEach(function(sheet) {
    const name = sheet.getName();
    if (CONFIG.RESPONSE_SHEETS.indexOf(name) !== -1) return;
    if (!isFormResponseSheet_(sheet)) return;
    syncAllRowsInSheet_(sheet);
  });
  
  // ✅ Tự động đồng bộ phân công từ tất cả booking sau khi sync xong
  syncCounselorAssignmentsFromBookings();
}

function syncAllRowsInSheet_(sheet) {
  if (!sheet || sheet.getLastRow() <= CONFIG.HEADER_ROW) return;
  const sheetName = sheet.getName();
  let successCount = 0;
  let errorCount = 0;

  for (let row = CONFIG.HEADER_ROW + 1; row <= sheet.getLastRow(); row++) {
    try {
      syncResponseRow_(sheet, row, true);
      successCount++;
    } catch (error) {
      errorCount++;
      console.warn('Bỏ qua ' + sheetName + '!row' + row + ': ' + safeError_(error));
    }
  }

  console.log('[SYNC] ' + sheetName + ': ' + successCount + ' dòng OK, ' + errorCount + ' lỗi');
}

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------
function pickEmail_(row) {
  const exact = pick_(row, [
    'Địa chỉ email', 'Email nhận thông tin', 'Email cá nhân',
    'Email', 'Email Address', 'Email liên hệ', 'Email liên lạc'
  ]);
  if (exact) return clean_(exact);
  const keys = Object.keys(row);
  for (let i = 0; i < keys.length; i++) {
    if (/email/i.test(normalize_(keys[i])) && row[keys[i]]) return clean_(row[keys[i]]);
  }
  return '';
}

function pickPhone_(row) {
  const exact = pick_(row, [
    'Số điện thoại liên hệ', 'Số điện thoại',
    'Số điện thoại phụ huynh/người liên hệ khẩn cấp',
    'Số điện thoại phụ huynh', 'Số điện thoại tư vấn viên', 'SĐT'
  ]);
  if (exact) return clean_(exact);
  const keys = Object.keys(row);
  for (let i = 0; i < keys.length; i++) {
    if (/(so dien thoai|phone|sdt)/i.test(normalize_(keys[i])) && row[keys[i]]) return clean_(row[keys[i]]);
  }
  return '';
}

function validateAndConsumeToken_(rawToken, formType, now) {
  if (!rawToken) return { valid: false, zalo_uid: '', error: 'Thiếu token' };
  try {
    const hash = hashToken_(rawToken);
    const records = queryRecords_('registration_tokens', function(r) { return r.token_hash === hash; });
    if (!records.length) return { valid: false, zalo_uid: '', error: 'Token không tồn tại' };
    const tok = records[0];
    if (tok.used_at) return { valid: false, zalo_uid: '', error: 'Token đã được sử dụng' };
    const expiry = asDate_(tok.expires_at);
    if (expiry && expiry < now) return { valid: false, zalo_uid: '', error: 'Token hết hạn' };
    updateRecordField_('registration_tokens', 'token_id', tok.token_id, { used_at: now });
    return { valid: true, zalo_uid: String(tok.zalo_uid || ''), booking_id: String(tok.booking_id || ''), test_assignment_id: String(tok.test_assignment_id || '') };
  } catch(e) {
    return { valid: false, zalo_uid: '', error: e.message };
  }
}

function generateOneTimeToken_(zaloUid, formType, bookingId, testAssignmentId, now) {
  const rawToken = 'qwp_' + Utilities.getUuid().replace(/-/g,'');
  const tokenHash = hashToken_(rawToken);
  const expiry = new Date(now.getTime() + CONFIG.TOKEN_EXPIRY_MINUTES * 60000);
  upsert_('registration_tokens', {
    token_id: cleanId_('registration_tokens', [tokenHash]),
    token_hash: tokenHash, zalo_uid: zaloUid || '', form_type: formType || '',
    booking_id: bookingId || '', test_assignment_id: testAssignmentId || '',
    expires_at: expiry, used_at: '', created_at: now
  });
  return { raw_token: rawToken, token_hash: tokenHash, expires_at: expiry };
}

function queryRecords_(sheetName, predicate) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(clean_);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  return data.reduce(function(acc, row) {
    const obj = rowObject_(headers, row);
    if (!predicate || predicate(obj)) acc.push(obj);
    return acc;
  }, []);
}

function updateRecordField_(sheetName, idHeader, idValue, updateObj) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return false;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(clean_);
  const idCol = headers.indexOf(idHeader) + 1;
  if (!idCol) return false;
  const found = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1)
    .createTextFinder(String(idValue)).matchEntireCell(true).findNext();
  if (!found) return false;
  const row = found.getRow();
  Object.keys(updateObj).forEach(function(key) {
    const col = headers.indexOf(key) + 1;
    if (col > 0) sheet.getRange(row, col).setValue(updateObj[key]);
  });
  return true;
}

function linkZaloMapping_(zaloUid, studentId, counselorId, submittedAt) {
  if (!zaloUid) return;
  const existing = getZaloMapping_(zaloUid);
  upsert_('zalo_mappings', {
    zalo_mapping_id: cleanId_('zalo_mappings', [zaloUid]),
    zalo_uid: zaloUid,
    student_id: studentId || existing.student_id,
    counselor_id: counselorId || existing.counselor_id,
    status: CONFIG.DEFAULT_STATUS,
    linked_at: submittedAt, unlinked_at: ''
  });
}

function getZaloMapping_(zaloUid) {
  if (!zaloUid) return { student_id: '', counselor_id: '' };
  const records = queryRecords_('zalo_mappings', function(r) { return r.zalo_uid === zaloUid; });
  if (records.length) return { student_id: String(records[0].student_id || ''), counselor_id: String(records[0].counselor_id || '') };
  return { student_id: '', counselor_id: '' };
}

function cleanId_(sheetName, lookupFields, padLength) {
  const prefix = ENTITY_PREFIXES[sheetName] || (sheetName.substring(0, 3).toUpperCase() + '-');
  padLength = padLength || 2;
  const cached = getSheetCachedData_(sheetName);
  const headers = cached.headers;
  const data = cached.data;

  if (data.length === 0) return prefix + '01';

  const validLookups = (lookupFields || []).map(clean_).filter(Boolean);
  if (validLookups.length > 0) {
    for (let r = 0; r < data.length; r++) {
      const rowObj = rowObject_(headers, data[r]);
      const currentId = String(rowObj[headers[0]] || '').trim();
      let isMatch = false;
      for (let i = 0; i < validLookups.length; i++) {
        const val = validLookups[i].toLowerCase();
        ['email', 'phone_number', 'school_name', 'raw_address', 'zalo_uid'].forEach(function(col) {
          if (rowObj[col] && String(rowObj[col]).toLowerCase().trim() === val) isMatch = true;
        });
      }
      if (isMatch && currentId.startsWith(prefix)) return currentId;
    }
  }

  let maxNum = 0;
  for (let r = 0; r < data.length; r++) {
    const idVal = String(data[r][0] || '').trim();
    if (idVal.startsWith(prefix)) {
      const n = parseInt(idVal.replace(prefix, ''), 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  }
  return prefix + String(maxNum + 1).padStart(padLength, '0');
}

// ---------------------------------------------------------------------------
// SYNC: FORM HỌC SINH
// ---------------------------------------------------------------------------
function syncResponseRow_(sourceSheet, rowNumber, isBatchMode) {
  const isBatch = (isBatchMode === true);
  var lock = null;
  if (!isBatch) {
    lock = getExecutionLock_();
    lock.waitLock(30000);
  }
  try {
    const lastColumn = sourceSheet.getLastColumn();
    if (lastColumn <= 0) return;
    const headers = sourceSheet.getRange(CONFIG.HEADER_ROW, 1, 1, lastColumn).getDisplayValues()[0];
    const values = sourceSheet.getRange(rowNumber, 1, 1, lastColumn).getValues()[0];
    if (isBlankRow_(values)) return;

    const row = rowObject_(headers, values);
    const sourceName = sourceSheet.getName();
    const source = CONFIG.SOURCE_PREFIX + ':' + sourceName;
    const submittedAt = asDate_(pick_(row, ['Timestamp', 'Thời gian', 'Dấu thời gian'])) || new Date();
    const now = new Date();

    const formKind = detectFormKind_(headers);
    if (formKind === 'availability') { syncCounselorScheduleResponse_(row, source, submittedAt, now, rowNumber); return; }
    if (formKind === 'feedback')     { syncFeedbackResponse_(row, source, submittedAt, now, rowNumber); return; }
    if (formKind === 'counselor')    { syncCounselorResponse_(row, source, submittedAt, now, rowNumber); return; }

    const formIdentity = validateFormIdentity_(row, formKind);
    const zaloUid      = formIdentity.zalo_uid;
    const studentEmail = pickEmail_(row);
    const studentPhone = pickPhone_(row);
    let studentFirstName = clean_(pick_(row, ['Tên (học sinh)', 'Tên']));
    let studentLastName  = clean_(pick_(row, ['Họ (học sinh)', 'Họ']));
    const birthDate = asDate_(pick_(row, ['Ngày sinh']));

    const schoolName = clean_(pick_(row, ['Tên trường', 'Trường']));
    const schoolId = schoolName ? cleanId_('schools', [schoolName]) : '';
    if (schoolId) {
      upsert_('schools', { school_id: schoolId, school_name: schoolName, address_id: '', created_at: submittedAt, updated_at: now });
    }

    const rawAddress = clean_(pick_(row, ['Địa chỉ (Quận/Phường, Thành phố)', 'Địa chỉ']));
    const addressId = rawAddress ? cleanId_('addresses', [rawAddress]) : '';
    if (addressId) {
      upsert_('addresses', Object.assign({ address_id: addressId, raw_address: rawAddress, country: 'Việt Nam', created_at: submittedAt, updated_at: now }, parseVietnameseAddress_(rawAddress)));
    }

    const studentId = cleanId_('students', [studentEmail, studentPhone, studentLastName + ' ' + studentFirstName]);
    upsert_('students', {
      student_id: studentId, first_name: studentFirstName, last_name: studentLastName,
      gender: clean_(pick_(row, ['Giới tính'])), phone_number: studentPhone, email: studentEmail,
      date_of_birth: birthDate || '', grade_level: clean_(pick_(row, ['Lớp/Khối', 'Khối/Lớp'])),
      status: CONFIG.DEFAULT_STATUS, school_id: schoolId, school_name: schoolName,
      address_id: addressId, created_at: submittedAt, updated_at: now
    });

    if (zaloUid) upsertZaloMapping_(zaloUid, studentId, '', '', 'student', 'active', now);

    const parentLastName  = clean_(pick_(row, ['Họ (phụ huynh/người giám hộ)', 'Họ (phụ huynh/người thân)', 'Họ phụ huynh']));
    const parentFirstName = clean_(pick_(row, ['Tên (phụ huynh/người giám hộ)', 'Tên (phụ huynh/người thân)', 'Tên phụ huynh']));
    const parentPhone     = clean_(pick_(row, ['Số điện thoại phụ huynh', 'Số điện thoại phụ huynh/người liên hệ khẩn cấp']));
    const parentEmail     = clean_(pick_(row, ['Email phụ huynh']));
    const relationship    = clean_(pick_(row, ['Quan hệ với học sinh'])) || 'Phụ huynh';
    const hasParent = !!(parentLastName || parentFirstName || parentPhone || parentEmail);
    const parentId = hasParent ? cleanId_('parents', [parentEmail, parentPhone, parentLastName + ' ' + parentFirstName]) : '';

    if (parentId) {
      upsert_('parents', {
        parent_id: parentId, first_name: parentFirstName, last_name: parentLastName,
        phone_number: parentPhone, email: parentEmail, status: CONFIG.DEFAULT_STATUS,
        address_id: addressId, created_at: submittedAt, updated_at: now
      });
      upsert_('student_parents', {
        student_parent_id: cleanId_('student_parents', [studentId + '_' + parentId]),
        student_id: studentId, parent_id: parentId,
        relationship: relationship, is_primary: true, created_at: submittedAt
      });
    }

    const requestId = cleanId_('counseling_requests', [sourceName + '_ROW_' + rowNumber]);
    const extraNotes = compactNotes_([
      ['Mức chán nản', pick_(row, ['Mức độ chán nản, mất hứng thú trong 2 tuần qua'])],
      ['Áp lực học tập', pick_(row, ['Mức độ áp lực học tập/thi cử hiện tại'])],
      ['Mất phương hướng', pick_(row, ['Bạn có cảm thấy mất phương hướng về tương lai (nghề nghiệp, ngành học) không'])],
      ['Giới tính chuyên viên', pick_(row, ['Bạn có muốn được tư vấn bởi chuyên viên nam hay nữ không'])],
      ['Ghi chú', pick_(row, ['Ghi chú thêm'])]
    ]);
    upsert_('counseling_requests', {
      counseling_request_id: requestId, student_id: studentId, parent_id: parentId,
      requester_role: clean_(pick_(row, ['Người điền form là ai?'])),
      counseling_issue: clean_(pick_(row, ['Vấn đề cần tư vấn'])),
      problem_duration: clean_(pick_(row, ['Thời gian vấn đề kéo dài'])),
      previous_counseling: toBoolean_(pick_(row, ['Đã từng tư vấn tâm lý trước đây chưa', 'Đã từng tư vấn/trị liệu tâm lý trước đây chưa'])),
      mood_last_2_weeks: clean_(pick_(row, ['Tâm trạng trong 2 tuần qua', 'Mức độ chán nản, mất hứng thú trong 2 tuần qua'])),
      anxiety_stress_level: clean_(pick_(row, ['Mức độ lo lắng/căng thẳng', 'Mức độ lo lắng, bồn chồn, khó thư giãn'])),
      sleep_eating_quality: clean_(pick_(row, ['Chất lượng giấc ngủ và ăn uống', 'Khó khăn về giấc ngủ'])),
      has_support_person: clean_(pick_(row, ['Có người để chia sẻ khi buồn không', 'Bạn có người để chia sẻ khi gặp khó khăn không'])),
      self_harm_thoughts: clean_(pick_(row, ['Trong 2 tuần qua có từng nghĩ đến việc làm tổn thương bản thân không', 'Trong 2 tuần qua có từng có ý nghĩ làm tổn thương bản thân hoặc không muốn sống nữa không'])),
      preferred_method: clean_(pick_(row, ['Hình thức tư vấn mong muốn'])),
      preferred_time: clean_(pick_(row, ['Khung giờ thuận tiện'])),
      additional_notes: extraNotes, status: CONFIG.REQUEST_STATUS, source: source,
      created_at: submittedAt, updated_at: now
    });

    const selfHarmAnswer = clean_(pick_(row, ['Trong 2 tuần qua có từng nghĩ đến việc làm tổn thương bản thân không', 'Trong 2 tuần qua có từng có ý nghĩ làm tổn thương bản thân hoặc không muốn sống nữa không']));
    if (isSelfHarmRisk_(selfHarmAnswer)) createCrisisAlert_(studentId, selfHarmAnswer, sourceName, rowNumber, now);

    writeConsent_(studentId, parentId, requestId, 'participation', pick_(row, ['Tôi đồng ý cho con em tham gia tư vấn tâm lý tại Trung tâm', 'Tôi đồng ý tham gia tư vấn tâm lý tại Trung tâm và hiểu thông tin được bảo mật theo quy định']), source, submittedAt, now);
    writeConsent_(studentId, parentId, requestId, 'contact', pick_(row, ['Tôi đồng ý cho Trung tâm liên hệ qua Zalo/điện thoại để trao đổi tiến trình', 'Tôi đồng ý cho Trung tâm liên hệ qua Zalo/điện thoại/email để trao đổi lịch hẹn']), source, submittedAt, now);
    writeConsent_(studentId, parentId, requestId, 'guardian_awareness', pick_(row, ['Phụ huynh/người giám hộ đã biết và đồng ý cho việc đăng ký này chưa']), source, submittedAt, now);

    upsert_('audit_logs', {
      audit_log_id: cleanId_('audit_logs', [requestId + '_audit']),
      actor_id: parentId || studentId, actor_role: clean_(pick_(row, ['Người điền form là ai?'])),
      action: 'FORM_RESPONSE_SYNCED', entity_type: 'counseling_request',
      entity_id: requestId, value: sourceName + '!row=' + rowNumber, created_at: now
    });

    enqueueZaloNotification_(
      'student', studentId, '', '',
      'FORM_REGISTRATION_CONFIRMED',
      'Đăng ký tư vấn đã được tiếp nhận thành công. Bạn sẽ nhận thông báo khi có lịch hẹn hoặc cập nhật mới.',
      'counseling_request', requestId, now
    );
    markFormTokenUsed_(formIdentity);
  } finally {
    if (lock) lock.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// SYNC: FORM TƯ VẤN VIÊN
// ---------------------------------------------------------------------------
function syncCounselorResponse_(row, source, submittedAt, now, rowNumber) {
  const formIdentity = validateFormIdentity_(row, 'counselor');
  const zaloUid = formIdentity.zalo_uid;
  const email = pickEmail_(row);
  const phone = pickPhone_(row);
  const firstName = clean_(pick_(row, ['Tên', 'Tên (tư vấn viên)']));
  const lastName  = clean_(pick_(row, ['Họ', 'Họ (tư vấn viên)']));
  const counselorId = cleanId_('counselors', [email, phone, lastName + ' ' + firstName]);
  upsert_('counselors', {
    counselor_id: counselorId, first_name: firstName, last_name: lastName,
    gender: clean_(pick_(row, ['Giới tính'])), phone_number: phone, email: email,
    date_of_birth: asDate_(pick_(row, ['Ngày sinh'])) || '', role: 'counselor', status: 'pending',
    specialization: compactNotes_([
      ['Chuyên môn', pick_(row, ['Chuyên môn', 'Chuyên ngành'])],
      ['Chứng chỉ', pick_(row, ['Chứng chỉ', 'Bằng cấp'])],
      ['Kinh nghiệm', pick_(row, ['Số năm kinh nghiệm', 'Kinh nghiệm'])]
    ]), created_at: submittedAt, updated_at: now
  });
  if (zaloUid) upsertZaloMapping_(zaloUid, '', counselorId, '', 'counselor', 'pending', now);

  enqueueZaloNotification_(
    'counselor', '', counselorId, '',
    'FORM_COUNSELOR_REGISTERED',
    'Đăng ký Tư vấn viên đã được tiếp nhận. Hồ sơ đang chờ quản trị viên xét duyệt.',
    'counselor', counselorId, now
  );
  markFormTokenUsed_(formIdentity);
}

// ---------------------------------------------------------------------------
// SYNC: FORM LỊCH TRỰC TƯ VẤN VIÊN
// ---------------------------------------------------------------------------
function syncCounselorScheduleResponse_(row, source, submittedAt, now, rowNumber) {
  const formIdentity = validateFormIdentity_(row, 'availability');
  const zaloUid = formIdentity.zalo_uid;
  requireIdentity_(zaloUid, 'Counselor');
  const mapping = mappingForUid_(zaloUid);

  const email = pickEmail_(row);
  const phone = pickPhone_(row);
  const counselors = sheetRowsByName_('counselors');

  let counselor = null;
  if (email || phone) {
    counselor = counselors.find(function(c) {
      return (email && clean_(c.email).toLowerCase() === email.toLowerCase()) ||
             (phone && clean_(c.phone_number) === phone);
    });
  }
  if (!counselor || clean_(counselor.counselor_id) !== clean_(mapping.counselor_id)) {
    throw new Error('Email hoặc số điện thoại Form không khớp Tư vấn viên đang đăng nhập Zalo');
  }

  const counselorId = counselor.counselor_id;

  const dayMap = { 'thu 2':1, 'thu 3':2, 'thu 4':3, 'thu 5':4, 'thu 6':5, 'thu 7':6 };
  const daysList = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
  const selectedDaysRaw = clean_(pick_(row, ['Ngày đăng ký làm việc', 'Ngày']));

  const schedules = daysList.map(function(dayName) {
    const rawTime = row[dayName] || '';
    const timeVal = extractTimeString_(rawTime);
    const selected = selectedDaysRaw.toLowerCase().indexOf(dayName.toLowerCase()) !== -1 || !!timeVal;
    return { dayName: dayName, timeVal: timeVal, selected: selected };
  }).filter(function(item) { return item.selected && item.timeVal; });

  if (schedules.length < 3) {
    enqueueZaloNotification_(
      'counselor', '', counselorId, '',
      'FORM_COUNSELOR_SCHEDULE_REJECTED',
      'Đăng ký lịch làm việc chưa được ghi nhận: bạn cần chọn ít nhất 3 ngày và điền giờ hợp lệ cho từng ngày. Hãy gõ /dangkylamviec để lấy liên kết mới.',
      'schedule_submission', source + '!row=' + rowNumber, now
    );
    throw new Error('Tư vấn viên cần đăng ký ít nhất 3 ngày có khung giờ hợp lệ');
  }

  schedules.forEach(function(item) {
    const dow = dayMap[normalize_(item.dayName)];
    const startT = item.timeVal.length === 5 ? item.timeVal + ':00' : item.timeVal;
    const endT = addHoursToTimeStringOnly_(startT, 1);
    const scheduleId = cleanId_('counselor_schedules', [counselorId + '_' + dow + '_' + startT]);
    upsert_('counselor_schedules', { schedule_id: scheduleId, counselor_id: counselorId, day_of_week: dow, slot_start_time: startT, slot_end_time: endT, status: 'ACTIVE', effective_from: dateKey_(submittedAt), effective_until: '', created_at: submittedAt, updated_at: now });
    const targetDate = getNextWeekdayDate_(submittedAt, dow);
    const dateStr = Utilities.formatDate(targetDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const slotId = cleanId_('availability_slots', [counselorId + '_' + dateStr + '_' + startT]);
    upsert_('availability_slots', { availability_slot_id: slotId, counselor_id: counselorId, status: 'PENDING', buffer: 15, start_time: dateStr + ' ' + startT, end_time: dateStr + ' ' + endT, created_at: submittedAt });
  });

  enqueueZaloNotification_(
    'counselor', '', counselorId, '',
    'FORM_COUNSELOR_SCHEDULE_REGISTERED',
    'Đăng ký lịch làm việc đã được tiếp nhận thành công (' + schedules.length + ' ngày). Các khung giờ đang chờ quản trị viên duyệt.',
    'schedule_submission', source + '!row=' + rowNumber, now
  );
  markFormTokenUsed_(formIdentity);
}

// ---------------------------------------------------------------------------
// SYNC: FORM PHẢN HỒI
// ---------------------------------------------------------------------------
function syncFeedbackResponse_(row, source, submittedAt, now, rowNumber) {
  const bookingId = clean_(pick_(row, ['BookingID', 'Booking ID', 'Mã booking']));
  if (!bookingId) throw new Error('Form feedback thiếu BookingID');
  const formIdentity = validateFormIdentity_(row, 'feedback', bookingId);
  const booking = findRecord_('bookings', 'booking_id', bookingId);
  if (!booking) throw new Error('BookingID trong Form feedback không tồn tại');
  if (normalize_(booking.status) !== 'completed') throw new Error('Chỉ nhận feedback sau khi booking hoàn thành');
  const studentMapping = mappingForUid_(formIdentity.zalo_uid);
  if (clean_(studentMapping.student_id) !== clean_(booking.student_id)) {
    throw new Error('Người gửi feedback không thuộc booking này');
  }
  const ratingVal = clean_(pick_(row, ['Mức độ hài lòng chung (1-5)', 'Điểm đánh giá', 'Mức độ hài lòng', 'Rating']));
  const commentVal = compactNotes_([
    ['Hài lòng', ratingVal],
    ['Hữu ích nhất', pick_(row, ['Điều bạn thấy hữu ích nhất'])],
    ['Nhận xét', pick_(row, ['Nhận xét hoặc góp ý thêm', 'Góp ý', 'Bình luận'])]
  ]);
  let studentId = '', counselorId = '', sessionId = '';
  studentId = booking.student_id;
  counselorId = booking.counselor_id;
  const session = sessionForBooking_(bookingId);
  if (!session) throw new Error('Booking hoàn thành nhưng chưa có session');
  sessionId = session.session_id;
  upsert_('feedbacks', {
    feedback_id: cleanId_('feedbacks', [bookingId || ('ROW_' + rowNumber)]),
    student_id: studentId, session_id: sessionId, counselor_id: counselorId,
    rating: ratingVal, comment: commentVal, category: 'form', created_at: submittedAt
  });
  markFormTokenUsed_(formIdentity);
}

// ---------------------------------------------------------------------------
// HIGHLIGHT AVAILABILITY SLOTS
// ---------------------------------------------------------------------------
function highlightPastSlots() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName('availability_slots');
  if (!sheet || sheet.getLastRow() <= 1) return;
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(clean_);
  const startCol = headers.indexOf('start_time') + 1;
  const endCol   = headers.indexOf('end_time') + 1;
  const statusCol= headers.indexOf('status') + 1;
  if (!startCol || !statusCol) return;
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  const now = new Date();
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  for (let i = 0; i < data.length; i++) {
    const rowNum = i + 2;
    const startVal = asDate_(data[i][startCol - 1]);
    const endVal   = asDate_(data[i][endCol - 1]);
    let status = clean_(data[i][statusCol - 1]).toUpperCase();
    if (startVal && endVal && now >= startVal && now <= endVal) {
      if (status !== 'WORKING') { status = 'WORKING'; sheet.getRange(rowNum, statusCol).setValue('WORKING'); }
      sheet.getRange(rowNum, 1, 1, lastCol).setBackground('#D9EAD3');
    } else if (startVal && startVal < todayStart) {
      if (status === 'PENDING' || status === '' || status === 'OPEN') { sheet.getRange(rowNum, statusCol).setValue('ABSENT'); }
      sheet.getRange(rowNum, 1, 1, lastCol).setBackground('#F4CCCC');
    } else if (status === 'PENDING' || status === '') {
      sheet.getRange(rowNum, 1, 1, lastCol).setBackground('#FFFFFF');
    } else if (status === 'BOOKED') {
      sheet.getRange(rowNum, 1, 1, lastCol).setBackground('#FFF2CC');
    }
  }
}

// ---------------------------------------------------------------------------
// UTILITY FUNCTIONS
// ---------------------------------------------------------------------------
function extractTimeString_(val) {
  if (!val) return '';
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone(), 'HH:mm:ss');
  const str = String(val).trim();
  if (str.indexOf(':') !== -1) {
    const parts = str.split(':');
    return parts[0].padStart(2,'0') + ':' + parts[1].padStart(2,'0') + ':' + (parts[2] || '00').padStart(2,'0');
  }
  return str;
}

function addHoursToTimeStringOnly_(timeStr, h) {
  const parts = String(timeStr).split(':');
  if (parts.length >= 2) {
    let hr = parseInt(parts[0], 10) + (h || 1);
    if (hr >= 24) hr %= 24;
    return String(hr).padStart(2,'0') + ':' + parts[1].padStart(2,'0') + ':' + (parts[2] || '00').padStart(2,'0');
  }
  return timeStr;
}

function getNextWeekdayDate_(baseDate, target) {
  const d = new Date(baseDate.getTime());
  const cur = d.getDay() === 0 ? 7 : d.getDay();
  let diff = target - cur;
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function writeConsent_(studentId, parentId, requestId, type, rawValue, source, submittedAt, now) {
  const value = clean_(rawValue);
  if (!value) return;
  const status = consentStatus_(value);
  upsert_('consents', {
    consent_id: cleanId_('consents', [requestId + '_' + type]),
    student_id: studentId, parent_id: parentId, counseling_request_id: requestId,
    consent_type: type, status: status,
    consented_at: status === 'granted' ? submittedAt : '',
    revoked_at: status === 'revoked' ? submittedAt : '',
    source: source, created_at: submittedAt, updated_at: now
  });
}

function isSelfHarmRisk_(value) {
  const t = normalize_(value);
  return /\bco\b/.test(t) && !/\bkhong\b/.test(t);
}

function createCrisisAlert_(studentId, answer, sourceName, rowNumber, now) {
  upsert_('notifications', {
    notification_id: cleanId_('notifications', [studentId + '_alert_' + rowNumber]),
    recipient_role: 'crisis_team', student_id: studentId, counselor_id: '',
    event_type: 'SELF_HARM_RISK', entity_type: 'counseling_request',
    entity_id: cleanId_('counseling_requests', [sourceName + '_ROW_' + rowNumber]),
    channel: 'internal', message: 'Cảnh báo tự tổn thương: ' + answer,
    status: 'pending', sent_at: '', created_at: now
  });
}

function ensureHeaders_(sheet, expectedHeaders) {
  if (!expectedHeaders) return;
  const lastCol = sheet.getLastColumn();
  let existing = [];
  if (lastCol > 0 && sheet.getLastRow() > 0) existing = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(clean_);
  if (!existing.some(Boolean)) { sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]); return; }
  const missing = expectedHeaders.filter(function(h) { return existing.indexOf(h) === -1; });
  if (missing.length) sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
}

function upsert_(sheetName, record) {
  const cached = getSheetCachedData_(sheetName);
  const sheet = cached.sheet;
  const headers = cached.headers;
  const data = cached.data;
  const idHeader = ERD_SCHEMA[sheetName] ? ERD_SCHEMA[sheetName][0] : headers[0];
  const idColumn = headers.indexOf(idHeader) + 1;
  const idValue = String(record[idHeader] || '');
  if (!idColumn || !idValue) throw new Error('Không tìm thấy khóa chính cho ' + sheetName);

  let targetRow = data.length + 2;
  let targetIndex = -1;

  for (let r = 0; r < data.length; r++) {
    if (String(data[r][idColumn - 1] || '') === idValue) { targetIndex = r; targetRow = r + 2; break; }
  }

  if (targetIndex === -1 && data.length > 0) {
    for (let r = 0; r < data.length; r++) {
      const rowObj = rowObject_(headers, data[r]);
      const em = clean_(record.email), ph = clean_(record.phone_number);
      if ((em && rowObj.email && clean_(rowObj.email).toLowerCase() === em.toLowerCase()) ||
          (ph && rowObj.phone_number && clean_(rowObj.phone_number) === ph)) {
        targetIndex = r; targetRow = r + 2; break;
      }
    }
  }

  const current = targetIndex !== -1 ? data[targetIndex] : new Array(headers.length).fill('');
  const output = headers.map(function(h, i) {
    return Object.prototype.hasOwnProperty.call(record, h) ? record[h] : current[i];
  });

  if (targetIndex !== -1) data[targetIndex] = output;
  else { data.push(output); cached.lastRow++; }

  sheet.getRange(targetRow, 1, 1, headers.length).setValues([output]);
}

function rowObject_(headers, values) {
  return headers.reduce(function(obj, h, i) { obj[clean_(h)] = values[i]; return obj; }, {});
}

function getSpreadsheet_() {
  try { const a = SpreadsheetApp.getActiveSpreadsheet(); if (a) return a; } catch(e) {}
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function getExecutionLock_() { return LockService.getScriptLock(); }

function pick_(row, aliases) {
  for (let i = 0; i < aliases.length; i++) {
    const v = row[aliases[i]];
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return '';
}

function parseVietnameseAddress_(rawAddress) {
  const parts = String(rawAddress).split(',').map(clean_).filter(Boolean);
  const result = { street_address: parts[0] || '' };
  parts.slice(1).forEach(function(part) {
    const n = normalize_(part);
    if (/^(phuong|xa|thi tran)/.test(n)) result.ward = part;
    else if (/^(tp|thanh pho)/.test(n)) result.city = part;
    else if (/^(tinh)/.test(n)) result.province = part;
    else if (!result.city) result.city = part;
  });
  return result;
}

function consentStatus_(v) {
  const t = normalize_(v);
  if (/khong dong y|tu choi/.test(t)) return 'revoked';
  if (/toi dong y|da biet va dong y|dong y/.test(t)) return 'granted';
  return 'pending';
}

function toBoolean_(v) {
  const t = normalize_(v);
  if (!t) return '';
  if (/^(co|da|yes|true)/.test(t)) return true;
  if (/^(khong|chua|no|false)/.test(t)) return false;
  return v;
}

function compactNotes_(pairs) {
  return pairs.filter(function(p) { return p[1] !== undefined && p[1] !== null && String(p[1]).trim() !== ''; })
    .map(function(p) { return p[0] + ': ' + clean_(p[1]); }).join('\n');
}

function clean_(v) { return (v === null || v === undefined) ? '' : String(v).trim(); }

function normalize_(v) {
  return clean_(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/\s+/g,' ');
}

function asDate_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (!v) return null;
  const p = new Date(v);
  return isNaN(p.getTime()) ? null : p;
}

function dateKey_(v) {
  return v instanceof Date && !isNaN(v.getTime())
    ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd') : clean_(v);
}

function isBlankRow_(values) { return !values.some(function(v) { return v !== '' && v !== null; }); }

function isFormResponseSheet_(sheet) {
  if (!sheet) return false;
  const name = clean_(sheet.getName());
  if (CONFIG.RESPONSE_SHEETS.indexOf(name) !== -1) return true;
  if (/^form responses\b/i.test(name)) return true;
  if (/^(câu trả lời|phan hoi|phản hồi)/i.test(normalize_(name))) return true;
  if (sheet.getLastRow() >= CONFIG.HEADER_ROW && sheet.getLastColumn() > 0) {
    const firstCell = normalize_(sheet.getRange(CONFIG.HEADER_ROW, 1).getDisplayValue());
    if (/timestamp|dau thoi gian|thoi gian/.test(firstCell)) return true;
  }
  return false;
}

function detectFormKind_(headers) {
  const n = headers.map(normalize_).join('|');
  if (/thu 2|thu 3|thu 4|thu 5|thu 6|thu 7|thoi gian bat dau ca|availability|slot/.test(n)) return 'availability';
  if (/booking.?id|ma booking|hai long|feedback/.test(n)) return 'feedback';
  if (/chuyen mon|chuyen nganh|chung chi|kinh nghiem|tu van vien/.test(n)) return 'counselor';
  return 'student';
}

function extractZaloUid_(row) { return clean_(pick_(row, ['ZaloUID','Zalo UID','Zalo ID','UID Zalo'])); }
function extractFormToken_(row) { return clean_(pick_(row, ['QwenPawToken','QwenPaw Token','Mã xác thực QwenPaw'])); }

function validateFormIdentity_(row, formKind, bindingId) {
  const zaloUid = extractZaloUid_(row);
  const token = extractFormToken_(row);
  const storedKind = ['student','thcs','thpt'].indexOf(formKind) !== -1 ? 'student' : formKind;
  if (!zaloUid || !token) throw new Error('Form thiếu ZaloUID hoặc QwenPawToken');

  const sheet = ensurePrivateSheet_(QWENPAW_TOKEN_SHEET, QWENPAW_TOKEN_HEADERS);
  const tokenHash = hashToken_(token);
  const now = new Date();
  const found = sheetRows_(sheet).find(function(item) {
    return clean_(item.token_hash) === tokenHash &&
      clean_(item.form_kind) === storedKind &&
      clean_(item.zalo_uid) === zaloUid &&
      clean_(item.binding_id) === clean_(bindingId || '');
  });
  if (!found || found.used_at || !(asDate_(found.expires_at) > now)) {
    throw new Error('Token Form không hợp lệ, đã dùng hoặc đã hết hạn');
  }
  return { zalo_uid: zaloUid, token_sheet: sheet, token_row: found.__row };
}

function markFormTokenUsed_(identity) {
  if (!identity || !identity.token_sheet || !identity.token_row) throw new Error('Không thể xác nhận token Form');
  setSheetCell_(identity.token_sheet, identity.token_row, 'used_at', new Date());
}

// ---------------------------------------------------------------------------
// QWENPAW ZALO BOT BACKEND API
// ---------------------------------------------------------------------------

const QWENPAW_TOKEN_SHEET = 'qwenpaw_tokens';
const QWENPAW_JOB_SHEET = 'qwenpaw_failed_jobs';
const QWENPAW_GUARDIAN_LINK_SHEET = 'qwenpaw_guardian_links';
const QWENPAW_TOKEN_HEADERS = ['token_hash','form_kind','zalo_uid','binding_id','expires_at','used_at','created_at'];
const QWENPAW_JOB_HEADERS = ['job_id','request_id','sender_id','text','replayable','error','status','created_at','updated_at'];
const QWENPAW_GUARDIAN_LINK_HEADERS = ['request_id','student_id','guardian_zalo_uid','code_hash','status','expires_at','approved_at','created_at'];

function setupQwenPaw() {
  setupErdSheets();
  ensurePrivateSheet_(QWENPAW_TOKEN_SHEET, QWENPAW_TOKEN_HEADERS);
  ensurePrivateSheet_(QWENPAW_JOB_SHEET, QWENPAW_JOB_HEADERS);
  ensurePrivateSheet_(QWENPAW_GUARDIAN_LINK_SHEET, QWENPAW_GUARDIAN_LINK_HEADERS);
  // Cài luôn trigger nền; người triển khai không phải chạy hàm đồng bộ thủ công.
  installFormSubmitTrigger();
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('QWENPAW_API_SECRET');
  if (!secret) { secret = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('QWENPAW_API_SECRET', secret); }
  props.setProperty('QWENPAW_REQUIRE_FORM_TOKEN', 'true');
  Logger.log('QWENPAW_API_SECRET: ' + secret);
  safeToast_('Secret API: ' + secret, 'QwenPaw', 10);
  return 'QWENPAW_API_SECRET=' + secret;
}

function doGet() {
  return jsonResponse_({
    ok: true,
    service: 'qwenpaw-zalo-backend',
    version: 2,
    build: 'auto-counselor-assignment-20260913'
  });
}

/**
 * Tự phục hồi phân công khi Web API được sử dụng. Cache giúp tránh quét toàn bộ
 * bookings theo từng tin nhắn; tối đa một lần trong mỗi 5 phút cho mỗi deployment.
 */
function maybeAutoSyncCounselorAssignments_() {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'QWENPAW_AUTO_ASSIGNMENT_SYNC_V2';
  if (cache.get(cacheKey)) return;
  syncCounselorAssignmentsFromBookings(true);
  cache.put(cacheKey, '1', 300);
}

/**
 * Chỉ tự đồng bộ trước các lệnh thực sự phụ thuộc vào phân công. Các action
 * polling notification chạy mỗi vài giây không được phép kích hoạt quét Sheet.
 */
function actionNeedsAssignmentSync_(action) {
  return [
    'counselor_students',
    'update_student',
    'assign_test',
    'complete_booking',
    'get_failed_job',
    'guardian_contact_counselor'
  ].indexOf(clean_(action)) !== -1;
}

function doPost(e) {
  clearSheetCache_();
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    requireApiSecret_(body.secret);
    const action = clean_(body.action);
    // Chạy trước các lệnh phụ thuộc phân công để /danhsachhocvien thấy dữ liệu ngay.
    if (actionNeedsAssignmentSync_(action)) maybeAutoSyncCounselorAssignments_();
    return jsonResponse_({ ok: true, data: dispatchQwenPawAction_(action, body.payload || {}) });
  } catch(error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonResponse_({ ok: false, retryable: false, error: safeError_(error) });
  } finally {
    clearSheetCache_();
  }
}

function jsonResponse_(v) { return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON); }
function safeError_(e) { const t = clean_(e && e.message ? e.message : e); return t.length > 240 ? t.substring(0,240) : t || 'Yêu cầu không hợp lệ'; }

function requireApiSecret_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty('QWENPAW_API_SECRET');
  if (!expected || !constantTimeEquals_(String(provided||''), expected)) throw new Error('Không xác thực được backend');
}

function constantTimeEquals_(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function hashToken_(token) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(token), Utilities.Charset.UTF_8);
  return bytes.map(function(b) { return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2); }).join('');
}

function ensurePrivateSheet_(name, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  ensureHeaders_(sheet, headers);
  sheet.hideSheet();
  return sheet;
}

function issueOnboardingToken_(formKind, zaloUid, bindingId) {
  if (['student','thcs','thpt','counselor','feedback','availability'].indexOf(formKind) === -1) throw new Error('Loại Form không hợp lệ');
  const storedKind = ['student','thcs','thpt'].indexOf(formKind) !== -1 ? 'student' : formKind;
  const token = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  const now = new Date();
  appendRowObject_(ensurePrivateSheet_(QWENPAW_TOKEN_SHEET, QWENPAW_TOKEN_HEADERS), {
    token_hash: hashToken_(token), form_kind: storedKind, zalo_uid: zaloUid,
    binding_id: bindingId || '', expires_at: new Date(now.getTime() + 15*60*1000), used_at: '', created_at: now
  });
  return token;
}

function consumeOnboardingToken_(formKind, zaloUid, token, bindingId) {
  const sheet = ensurePrivateSheet_(QWENPAW_TOKEN_SHEET, QWENPAW_TOKEN_HEADERS);
  const hash = hashToken_(token);
  const found = sheetRows_(sheet).find(function(r) {
    return r.token_hash === hash && r.form_kind === formKind && r.zalo_uid === zaloUid && clean_(r.binding_id) === clean_(bindingId);
  });
  if (!found || found.used_at || !(asDate_(found.expires_at) > new Date())) throw new Error('Token Form không hợp lệ, đã dùng hoặc đã hết hạn');
  setSheetCell_(sheet, found.__row, 'used_at', new Date());
}

function upsertZaloMapping_(zaloUid, studentId, counselorId, parentId, role, status, now) {
  if (!zaloUid) throw new Error('Không thể tạo mapping khi thiếu ZaloUID');
  const existing = findRecord_('zalo_mappings', 'zalo_uid', zaloUid);
  if (existing && normalize_(existing.status) !== 'unlinked') {
    const sameRole = !clean_(existing.role) || normalize_(existing.role) === normalize_(role);
    const sameEntity = (!studentId || !clean_(existing.student_id) || clean_(existing.student_id) === clean_(studentId)) &&
      (!counselorId || !clean_(existing.counselor_id) || clean_(existing.counselor_id) === clean_(counselorId)) &&
      (!parentId || !clean_(existing.parent_id) || clean_(existing.parent_id) === clean_(parentId));
    if (!sameRole || !sameEntity) throw new Error('Zalo UID đã liên kết với một tài khoản hoặc vai trò khác');
  }
  upsert_('zalo_mappings', {
    zalo_mapping_id: cleanId_('zalo_mappings', [zaloUid]), zalo_uid: zaloUid,
    student_id: studentId || (existing ? existing.student_id : ''),
    counselor_id: counselorId || (existing ? existing.counselor_id : ''),
    parent_id: parentId || (existing ? existing.parent_id : ''),
    role: role || (existing ? existing.role : ''), status: status || 'active', linked_at: now, unlinked_at: ''
  });
}

function requestGuardianLink_(guardianUid, studentId) {
  if (!guardianUid || !studentId) throw new Error('Thiếu Zalo UID hoặc mã học sinh');
  const student = findRecord_('students', 'student_id', studentId);
  if (!student || ['active','approved','enabled'].indexOf(normalize_(student.status)) === -1) throw new Error('Không tìm thấy học sinh đang hoạt động');
  const studentUid = zaloUidFor_('student', studentId);
  if (!studentUid) throw new Error('Học sinh chưa liên kết Zalo');
  const mapping = findRecord_('zalo_mappings', 'zalo_uid', guardianUid);
  if (mapping && normalize_(mapping.status) !== 'unlinked' && clean_(mapping.parent_id) === '') throw new Error('Tài khoản Zalo đã liên kết với vai trò khác');
  const code = Utilities.getUuid().replace(/-/g,'').substring(0, 6).toUpperCase();
  const now = new Date();
  appendRowObject_(ensurePrivateSheet_(QWENPAW_GUARDIAN_LINK_SHEET, QWENPAW_GUARDIAN_LINK_HEADERS), {
    request_id: Utilities.getUuid(), student_id: studentId, guardian_zalo_uid: guardianUid,
    code_hash: hashToken_(code), status: 'pending', expires_at: new Date(now.getTime() + 15*60*1000), approved_at: '', created_at: now
  });
  return { message: 'Đã gửi yêu cầu xác nhận tới học sinh.', notifications: [[studentUid, 'Có yêu cầu liên kết Người giám hộ. Đồng ý: /chapnhannguoigiamho ' + code]] };
}

function approveGuardianLink_(studentUid, code) {
  requireIdentity_(studentUid, 'Student');
  const studentId = clean_(mappingForUid_(studentUid).student_id);
  const sheet = ensurePrivateSheet_(QWENPAW_GUARDIAN_LINK_SHEET, QWENPAW_GUARDIAN_LINK_HEADERS);
  const now = new Date();
  const request = sheetRows_(sheet).find(function(r) {
    return r.student_id === studentId && r.code_hash === hashToken_(code) && normalize_(r.status) === 'pending' && asDate_(r.expires_at) > now;
  });
  if (!request) throw new Error('Mã xác nhận không hợp lệ hoặc đã hết hạn');
  const guardianUid = clean_(request.guardian_zalo_uid);
  const existing = findRecord_('zalo_mappings', 'zalo_uid', guardianUid);
  if (existing && normalize_(existing.status) !== 'unlinked' && clean_(existing.parent_id) === '') throw new Error('Tài khoản Người giám hộ đã liên kết vai trò khác');

  let parentId = existing && clean_(existing.parent_id) ? clean_(existing.parent_id) : '';
  if (!parentId) {
    const relations = sheetRowsByName_('student_parents').filter(function(r) {
      return clean_(r.student_id) === studentId && !!clean_(r.parent_id);
    });
    const candidates = relations.map(function(r) {
      return {
        relation: r,
        parent: findRecord_('parents', 'parent_id', clean_(r.parent_id))
      };
    }).filter(function(item) {
      return item.parent && ['active','approved','enabled'].indexOf(normalize_(item.parent.status)) !== -1;
    });
    const primaryCandidates = candidates.filter(function(item) {
      return item.relation.is_primary === true || ['true','1','yes','x'].indexOf(normalize_(item.relation.is_primary)) !== -1;
    });

    if (primaryCandidates.length === 1) {
      parentId = clean_(primaryCandidates[0].parent.parent_id);
    } else if (candidates.length === 1) {
      parentId = clean_(candidates[0].parent.parent_id);
    } else if (candidates.length > 1) {
      throw new Error('Học sinh có nhiều hồ sơ Người giám hộ; cần chỉ định một hồ sơ chính trước khi liên kết Zalo');
    } else {
      parentId = cleanId_('parents', [guardianUid]);
    }
  }

  const conflictingMapping = sheetRowsByName_('zalo_mappings').find(function(r) {
    return clean_(r.parent_id) === parentId && clean_(r.zalo_uid) !== guardianUid &&
      ['unlinked','revoked','inactive','disabled'].indexOf(normalize_(r.status)) === -1;
  });
  if (conflictingMapping) throw new Error('Hồ sơ Người giám hộ này đã liên kết với một tài khoản Zalo khác');

  if (!findRecord_('parents', 'parent_id', parentId)) {
    upsert_('parents', { parent_id: parentId, first_name: 'Người giám hộ', last_name: '', phone_number: '', email: '', date_of_birth: '', status: 'active', gender: '', address_id: '', created_at: now, updated_at: now });
  }
  const existingRelation = sheetRowsByName_('student_parents').find(function(r) {
    return clean_(r.student_id) === studentId && clean_(r.parent_id) === parentId;
  });
  if (!existingRelation) {
    upsert_('student_parents', { student_parent_id: cleanId_('student_parents', [studentId + '_' + parentId]), student_id: studentId, parent_id: parentId, relationship: 'Người giám hộ', is_primary: false, created_at: now });
  }
  upsertZaloMapping_(guardianUid, '', '', parentId, 'guardian', 'active', now);
  setSheetCell_(sheet, request.__row, 'status', 'approved');
  setSheetCell_(sheet, request.__row, 'approved_at', now);
  upsert_('audit_logs', { audit_log_id: cleanId_('audit_logs', [studentId + '_guardian_' + parentId]), actor_id: studentId, actor_role: 'student', action: 'GUARDIAN_LINK_APPROVED', entity_type: 'parent', entity_id: parentId, value: '', created_at: now });
  return { message: 'Đã xác nhận Người giám hộ.', notifications: [[guardianUid, 'Học sinh đã xác nhận liên kết.']] };
}

function dispatchQwenPawAction_(action, payload) {
  const args = Array.isArray(payload.args) ? payload.args : [];
  switch(action) {
    case 'issue_onboarding_token': return { token: issueOnboardingToken_(clean_(args[0]), clean_(args[1]), clean_(args[2])) };
    case 'resolve_identity': return resolveIdentity_(clean_(args[0]));
    case 'student_profile_id': return studentProfileId_(clean_(args[0]));
    case 'request_guardian_link': return withLock_(function() { return requestGuardianLink_(clean_(args[0]), clean_(args[1])); });
    case 'approve_guardian_link': return withLock_(function() { return approveGuardianLink_(clean_(args[0]), clean_(args[1])); });
    case 'list_slots': return listSlots_();
    case 'create_booking': return withLock_(function() { return createBooking_(clean_(args[0]), clean_(args[1])); });
    case 'list_bookings': return listBookings_(clean_(args[0]));
    case 'cancel_booking': return withLock_(function() { return cancelBooking_(clean_(args[0]), clean_(args[1])); });
    case 'reschedule_booking': return withLock_(function() { return rescheduleBooking_(clean_(args[0]), clean_(args[1]), clean_(args[2])); });
    case 'counselor_students': return counselorStudents_(clean_(args[0]));
    case 'counselor_schedule': return counselorSchedule_(clean_(args[0]));
    case 'guardian_children': return guardianChildren_(clean_(args[0]));
    case 'guardian_student_info': return guardianStudentInfo_(clean_(args[0]), clean_(args[1]));
    case 'guardian_bookings': return guardianBookings_(clean_(args[0]), clean_(args[1]));
    case 'guardian_contact_counselor': return withLock_(function() { return guardianContactCounselor_(clean_(args[0]), clean_(args[1]), clean_(args[2])); });
    case 'claim_zalo_notifications': return withLock_(function() { return claimZaloNotifications_(Number(args[0]) || 20); });
    case 'mark_zalo_notification_sent': return withLock_(function() { return markZaloNotificationSent_(clean_(args[0])); });
    case 'release_zalo_notification': return withLock_(function() { return releaseZaloNotification_(clean_(args[0])); });
    case 'update_student': return withLock_(function() { return updateStudent_(clean_(args[0]), clean_(args[1]), clean_(args[2]), clean_(args[3])); });
    case 'assign_test': return withLock_(function() { return assignTest_(clean_(args[0]), clean_(args[1]), clean_(args[2]), clean_(args[3])); });
    case 'add_feedback': return withLock_(function() { return addFeedback_(clean_(args[0]), clean_(args[1]), Number(args[2]), clean_(args[3])); });
    case 'complete_booking': return withLock_(function() { return completeBooking_(clean_(args[0]), clean_(args[1]), clean_(args[2])); });
    case 'record_failed_job': return withLock_(function() { return recordFailedJob_(clean_(args[0]), clean_(args[1]), clean_(args[2]), clean_(args[3])); });
    case 'get_failed_job': return getFailedJob_(clean_(args[0]), clean_(args[1]));
    case 'mark_failed_job': return withLock_(function() { return markFailedJob_(clean_(args[0]), clean_(args[1])); });
    default: throw new Error('Action không được hỗ trợ: ' + action);
  }
}

function withLock_(cb) {
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { return cb(); } finally { lock.releaseLock(); }
}

function sheetRowsByName_(name) {
  const cached = getSheetCachedData_(name);
  if (!cached || !cached.data.length) return [];
  return cached.data.map(function(values, i) { const r = rowObject_(cached.headers, values); r.__row = i + 2; return r; });
}

function sheetRows_(sheet) {
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return [];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(clean_);
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues().map(function(values, i) {
    const r = rowObject_(headers, values); r.__row = i + 2; return r;
  });
}

function findRecord_(sheetName, key, value) {
  return sheetRowsByName_(sheetName).find(function(r) { return String(r[key]||'') === String(value||''); }) || null;
}

function appendRowObject_(sheet, record) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(clean_);
  sheet.appendRow(headers.map(function(h) { return Object.prototype.hasOwnProperty.call(record, h) ? record[h] : ''; }));
}

function setSheetCell_(sheet, rowNumber, header, value) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(clean_);
  const col = headers.indexOf(header) + 1;
  if (!col) throw new Error('Thiếu cột ' + header + ' trong ' + sheet.getName());
  sheet.getRange(rowNumber, col).setValue(value);
}

function resolveIdentity_(zaloUid) {
  const mapping = findRecord_('zalo_mappings', 'zalo_uid', zaloUid);
  if (!mapping || normalize_(mapping.status) === 'unlinked') return { zalo_uid: zaloUid, role: 'Unknown', name: '', status: '' };
  if (mapping.counselor_id) {
    const c = findRecord_('counselors', 'counselor_id', mapping.counselor_id);
    if (!c) return { zalo_uid: zaloUid, role: 'Unknown', name: '', status: 'missing_record' };
    const active = ['active','approved','enabled'].indexOf(normalize_(c.status)) !== -1;
    return { zalo_uid: zaloUid, role: active ? 'Counselor' : 'Pending Counselor', name: [c.last_name, c.first_name].filter(Boolean).join(' '), status: c.status };
  }
  if (mapping.student_id) {
    const s = findRecord_('students', 'student_id', mapping.student_id);
    if (s && ['active','approved','enabled'].indexOf(normalize_(s.status)) !== -1) return { zalo_uid: zaloUid, role: 'Student', name: [s.last_name, s.first_name].filter(Boolean).join(' '), status: s.status };
  }
  if (mapping.parent_id) {
    const p = findRecord_('parents', 'parent_id', mapping.parent_id);
    if (p && ['active','approved','enabled'].indexOf(normalize_(p.status)) !== -1) return { zalo_uid: zaloUid, role: 'Guardian', name: [p.last_name, p.first_name].filter(Boolean).join(' '), status: p.status };
  }
  return { zalo_uid: zaloUid, role: 'Unknown', name: '', status: '' };
}

function requireIdentity_(zaloUid, expectedRole) {
  const id = resolveIdentity_(zaloUid);
  if (expectedRole && id.role !== expectedRole) throw new Error('Bạn không có quyền thực hiện thao tác này');
  return id;
}

function mappingForUid_(zaloUid) {
  const m = findRecord_('zalo_mappings', 'zalo_uid', zaloUid);
  if (!m || ['unlinked','revoked','inactive','disabled'].indexOf(normalize_(m.status)) !== -1) {
    throw new Error('Không tìm thấy mapping Zalo đang hoạt động');
  }
  return m;
}

function zaloUidFor_(kind, id) {
  const key = kind === 'student' ? 'student_id' : kind === 'counselor' ? 'counselor_id' : 'parent_id';
  const m = sheetRowsByName_('zalo_mappings').find(function(r) { return r[key] === id && normalize_(r.status) !== 'unlinked'; });
  return m ? clean_(m.zalo_uid) : '';
}

function listSlots_() {
  return sheetRowsByName_('availability_slots').filter(function(r) { return ['open','available'].indexOf(normalize_(r.status)) !== -1; })
    .map(function(r) {
      const c = findRecord_('counselors', 'counselor_id', r.counselor_id) || {};
      return { SlotID: r.availability_slot_id, CounselorID: r.counselor_id, CounselorName: [c.last_name, c.first_name].filter(Boolean).join(' '), Slot: [r.start_time, r.end_time].filter(Boolean).join(' - '), Status: r.status };
    });
}

function listBookings_(zaloUid) {
  const id = requireIdentity_(zaloUid);
  const m = mappingForUid_(zaloUid);
  const key = id.role === 'Student' ? 'student_id' : id.role === 'Counselor' ? 'counselor_id' : '';
  const val = id.role === 'Student' ? m.student_id : m.counselor_id;
  if (!key || !val) throw new Error('Bạn không có quyền xem booking');
  return sheetRowsByName_('bookings').filter(function(r) { return r[key] === val; }).map(toBookingDto_);
}

function toBookingDto_(r) {
  return { BookingID: r.booking_id, StudentID: r.student_id, CounselorID: r.counselor_id, SlotID: r.availability_slot_id, Slot: [r.start_time, r.end_time].filter(Boolean).join(' - '), Status: r.status, FeedbackSent: r.feedback_sent === true || r.feedback_sent === 'true' };
}

// ---------------------------------------------------------------------------
// QUẢN LÝ PHÂN CÔNG TƯ VẤN VIÊN (COUNSELOR_ASSIGNMENTS)
// ---------------------------------------------------------------------------

function isBookingActive_(statusStr) {
  const st = normalize_(statusStr);
  const activeList = ['confirm', 'confirmed', 'rescheduled', 'booked', 'active', 'open', 'da_xac_nhan', 'da_dat', 'cho_dien_ra'];
  return activeList.indexOf(st) !== -1;
}

/**
 * Đóng phân công cũ khi học sinh đã hủy hết lịch với TVV
 */
function closeCounselorAssignmentIfNoActiveBookings_(studentId, counselorId, now) {
  studentId = clean_(studentId);
  counselorId = clean_(counselorId);
  now = now || new Date();
  if (!studentId || !counselorId) return;

  const activeBookings = sheetRowsByName_('bookings').filter(function(r) {
    return clean_(r.student_id) === studentId &&
      clean_(r.counselor_id) === counselorId &&
      isBookingActive_(r.status);
  });

  if (activeBookings.length === 0) {
    const assignments = sheetRowsByName_('counselor_assignments').filter(function(a) {
      return clean_(a.student_id) === studentId &&
        clean_(a.counselor_id) === counselorId &&
        ['active', 'assigned'].indexOf(normalize_(a.status)) !== -1;
    });
    
    const assignSheet = getSpreadsheet_().getSheetByName('counselor_assignments');
    if (assignSheet) {
      assignments.forEach(function(a) {
        setSheetCell_(assignSheet, a.__row, 'status', 'inactive');
        setSheetCell_(assignSheet, a.__row, 'updated_at', now);
      });
    }

    const recordSheet = getSpreadsheet_().getSheetByName('counselor_assignment_records');
    if (recordSheet) {
      const records = sheetRowsByName_('counselor_assignment_records').filter(function(r) {
        return clean_(r.counselor_id) === counselorId &&
          ['active', 'assigned'].indexOf(normalize_(r.status)) !== -1 &&
          !r.ended_at;
      });
      records.forEach(function(rec) {
        const aId = clean_(rec.assignment_id);
        const isStudentAssign = assignments.some(function(a) { return clean_(a.assignment_id) === aId; });
        if (isStudentAssign) {
          setSheetCell_(recordSheet, rec.__row, 'status', 'inactive');
          setSheetCell_(recordSheet, rec.__row, 'ended_at', now);
          setSheetCell_(recordSheet, rec.__row, 'updated_at', now);
        }
      });
    }
  }
}

/**
 * Tạo mới hoặc kích hoạt lại phân công khi có booking mới
 */
function ensureCounselorAssignment_(studentId, counselorId, assignedAt) {
  studentId = clean_(studentId);
  counselorId = clean_(counselorId);
  assignedAt = asDate_(assignedAt) || new Date();
  if (!studentId || !counselorId) throw new Error('Thiếu học sinh hoặc tư vấn viên để tạo phân công');

  const now = new Date();
  const rows = sheetRowsByName_('counselor_assignments');
  const activeRows = rows.filter(function(r) {
    return clean_(r.student_id) === studentId &&
      ['active','assigned'].indexOf(normalize_(r.status)) !== -1;
  });

  // 1. Nếu đã có phân công active với chính TVV này -> Giữ nguyên
  const sameActive = activeRows.find(function(r) {
    return clean_(r.counselor_id) === counselorId;
  });
  if (sameActive) return clean_(sameActive.assignment_id);

  // 2. Nếu đang có phân công active với TVV khác -> tự đóng TVV cũ
  activeRows.forEach(function(oldAssign) {
    const oldCounselorId = clean_(oldAssign.counselor_id);
    if (oldCounselorId && oldCounselorId !== counselorId) {
      closeCounselorAssignmentIfNoActiveBookings_(studentId, oldCounselorId, now);
    }
  });

  // 3. Tìm xem trước đây từng có cặp phân công này chưa (kể cả inactive)
  const oldPair = rows.find(function(r) {
    return clean_(r.student_id) === studentId && clean_(r.counselor_id) === counselorId;
  });
  
  const assignmentId = oldPair && clean_(oldPair.assignment_id)
    ? clean_(oldPair.assignment_id)
    : cleanId_('counselor_assignments', [studentId + '_' + counselorId]);

  // Cập nhật hoặc tạo mới với status = active
  upsert_('counselor_assignments', {
    assignment_id: assignmentId,
    student_id: studentId,
    counselor_id: counselorId,
    status: 'active',
    created_at: oldPair && oldPair.created_at ? oldPair.created_at : assignedAt,
    updated_at: now
  });

  upsert_('counselor_assignment_records', {
    assignment_record_id: cleanId_('counselor_assignment_records', [assignmentId + '_' + now.getTime()]),
    assigned_at: assignedAt,
    ended_at: '',
    status: 'active',
    assignment_id: assignmentId,
    counselor_id: counselorId,
    created_at: now,
    updated_at: now
  });

  return assignmentId;
}

// ---------------------------------------------------------------------------
// QUẢN LÝ BOOKINGS
// ---------------------------------------------------------------------------
function createBooking_(zaloUid, slotId) {
  requireIdentity_(zaloUid, 'Student');
  const studentId = mappingForUid_(zaloUid).student_id;
  const slot = findRecord_('availability_slots', 'availability_slot_id', slotId);
  if (!slot || ['open','available'].indexOf(normalize_(slot.status)) === -1) throw new Error('Slot không tồn tại hoặc không còn trống');
  const now = new Date();
  
  // Tự động phân công counselor khi tạo booking
  ensureCounselorAssignment_(studentId, slot.counselor_id, now);
  
  const bookingId = cleanId_('bookings', [studentId + '_' + slotId]);
  upsert_('bookings', { booking_id: bookingId, start_time: slot.start_time, end_time: slot.end_time, booking_source: 'zalo', status: 'confirmed', student_id: studentId, counselor_id: slot.counselor_id, availability_slot_id: slotId, cancel_reason: '', cancelled_at: '', created_at: now, updated_at: now });
  setSheetCell_(getSpreadsheet_().getSheetByName('availability_slots'), slot.__row, 'status', 'booked');
  const cUid = zaloUidFor_('counselor', slot.counselor_id);
  return { message: 'Đặt lịch thành công. Mã ' + bookingId + '.', notifications: cUid ? [[cUid, 'Có booking mới ' + bookingId + '.']] : [] };
}

function requireBookingActor_(zaloUid, bookingId) {
  const booking = findRecord_('bookings', 'booking_id', bookingId);
  if (!booking) throw new Error('Không tìm thấy booking');
  const m = mappingForUid_(zaloUid);
  if (booking.student_id !== m.student_id && booking.counselor_id !== m.counselor_id) throw new Error('Bạn không có quyền với booking này');
  return booking;
}

function cancelBooking_(zaloUid, bookingId) {
  const booking = requireBookingActor_(zaloUid, bookingId);
  if (['confirmed','rescheduled','confirm','booked','active'].indexOf(normalize_(booking.status)) === -1) {
    throw new Error('Chỉ có thể hủy booking đang chờ diễn ra');
  }
  
  const now = new Date();
  const sheet = getSpreadsheet_().getSheetByName('bookings');
  
  // 1. Đổi status booking sang cancelled & ghi thời gian hủy
  setSheetCell_(sheet, booking.__row, 'status', 'cancelled');
  setSheetCell_(sheet, booking.__row, 'cancelled_at', now);
  setSheetCell_(sheet, booking.__row, 'updated_at', now);
  
  // 2. Mở lại Slot cho học sinh khác
  const slot = findRecord_('availability_slots', 'availability_slot_id', booking.availability_slot_id);
  if (slot) setSheetCell_(getSpreadsheet_().getSheetByName('availability_slots'), slot.__row, 'status', 'open');
  
  // 3. Tự động đóng phân công TVV nếu không còn booking nào khác
  closeCounselorAssignmentIfNoActiveBookings_(booking.student_id, booking.counselor_id, now);

  const m = mappingForUid_(zaloUid);
  const target = booking.student_id === m.student_id ? zaloUidFor_('counselor', booking.counselor_id) : zaloUidFor_('student', booking.student_id);
  return { message: 'Đã hủy booking ' + bookingId + '.', notifications: target ? [[target, 'Booking ' + bookingId + ' đã được hủy.']] : [] };
}

function rescheduleBooking_(zaloUid, bookingId, slotId) {
  const booking = requireBookingActor_(zaloUid, bookingId);
  if (['confirmed','rescheduled','confirm','booked','active'].indexOf(normalize_(booking.status)) === -1) throw new Error('Chỉ có thể đổi booking đang chờ diễn ra');
  const newSlot = findRecord_('availability_slots', 'availability_slot_id', slotId);
  if (!newSlot || ['open','available'].indexOf(normalize_(newSlot.status)) === -1) throw new Error('Slot mới không còn trống');
  
  const now = new Date();
  ensureCounselorAssignment_(booking.student_id, newSlot.counselor_id, now);
  
  const bSheet = getSpreadsheet_().getSheetByName('bookings');
  const updates = { availability_slot_id: slotId, counselor_id: newSlot.counselor_id, start_time: newSlot.start_time, end_time: newSlot.end_time, status: 'rescheduled', updated_at: now };
  Object.keys(updates).forEach(function(k) { setSheetCell_(bSheet, booking.__row, k, updates[k]); });
  
  const oldSlot = findRecord_('availability_slots', 'availability_slot_id', booking.availability_slot_id);
  if (oldSlot) setSheetCell_(getSpreadsheet_().getSheetByName('availability_slots'), oldSlot.__row, 'status', 'open');
  setSheetCell_(getSpreadsheet_().getSheetByName('availability_slots'), newSlot.__row, 'status', 'booked');
  
  return { message: 'Booking ' + bookingId + ' đã đổi lịch.', notifications: [] };
}

/**
 * Hàm trigger nền. Tự sửa dữ liệu phân công mà không hiện toast liên tục.
 */
function autoSyncCounselorAssignments() {
  try {
    return syncCounselorAssignmentsFromBookings(true);
  } catch (err) {
    console.error('Lỗi tự đồng bộ counselor_assignments: ' + safeError_(err));
    throw err;
  }
}

/**
 * Đồng bộ phân công cho toàn bộ bookings.
 * silent=true khi được gọi bởi trigger để không làm phiền người dùng Sheets.
 */
function syncCounselorAssignmentsFromBookings(silent) {
  clearSheetCache_();
  const result = withLock_(function() {
    const allBookings = sheetRowsByName_('bookings');
    const validBookings = allBookings.filter(function(r) {
      return isBookingActive_(r.status) && !!clean_(r.student_id) && !!clean_(r.counselor_id);
    });

    let created = 0;
    let existing = 0;
    const conflicts = [];

    // 1. Phân công / Kích hoạt lại cho các booking còn hiệu lực
    validBookings.forEach(function(booking) {
      const alreadyExists = sheetRowsByName_('counselor_assignments').some(function(r) {
        return clean_(r.student_id) === clean_(booking.student_id) &&
          clean_(r.counselor_id) === clean_(booking.counselor_id) &&
          ['active','assigned'].indexOf(normalize_(r.status)) !== -1;
      });
      try {
        ensureCounselorAssignment_(booking.student_id, booking.counselor_id, booking.created_at);
        if (alreadyExists) existing++; else created++;
      } catch (err) {
        conflicts.push(clean_(booking.booking_id) + ': ' + clean_(err && err.message ? err.message : err));
      }
    });

    // 2. Dọn dẹp phân công cho các học sinh chỉ còn booking cancelled
    const allStudents = sheetRowsByName_('students');
    allStudents.forEach(function(st) {
      const sId = clean_(st.student_id);
      const studentActiveBookings = validBookings.filter(function(b) { return clean_(b.student_id) === sId; });
      if (studentActiveBookings.length === 0) {
        const assignments = sheetRowsByName_('counselor_assignments').filter(function(a) {
          return clean_(a.student_id) === sId && ['active','assigned'].indexOf(normalize_(a.status)) !== -1;
        });
        const assignSheet = getSpreadsheet_().getSheetByName('counselor_assignments');
        if (assignSheet) {
          assignments.forEach(function(a) {
            setSheetCell_(assignSheet, a.__row, 'status', 'inactive');
            setSheetCell_(assignSheet, a.__row, 'updated_at', new Date());
          });
        }
      }
    });

    return { scanned: validBookings.length, created: created, existing: existing, conflicts: conflicts };
  });
  clearSheetCache_();
  if (silent !== true) {
    safeToast_(
      'Đã đồng bộ phân công: ' + result.created + ' mới, ' + result.existing + ' đã có.',
      'QwenPaw', 6
    );
  }
  return result;
}

function counselorStudents_(zaloUid) {
  requireIdentity_(zaloUid, 'Counselor');
  const counselorId = mappingForUid_(zaloUid).counselor_id;
  const ids = sheetRowsByName_('counselor_assignments').filter(function(r) { return r.counselor_id === counselorId && ['active','assigned'].indexOf(normalize_(r.status)) !== -1; }).map(function(r) { return r.student_id; });
  return sheetRowsByName_('students').filter(function(r) { return ids.indexOf(r.student_id) !== -1; }).map(function(r) { return { StudentID: r.student_id, Name: [r.last_name, r.first_name].filter(Boolean).join(' '), Status: r.status }; });
}

function assertAssignedStudent_(zaloUid, studentId) {
  const counselorId = mappingForUid_(zaloUid).counselor_id;
  const assigned = sheetRowsByName_('counselor_assignments').some(function(r) { return r.counselor_id === counselorId && r.student_id === studentId && ['active','assigned'].indexOf(normalize_(r.status)) !== -1; });
  if (!assigned) throw new Error('Học viên không thuộc tư vấn viên này');
  return counselorId;
}

function updateStudent_(zaloUid, studentId, field, value) {
  requireIdentity_(zaloUid, 'Counselor');
  assertAssignedStudent_(zaloUid, studentId);
  if (field === 'Status') {
    if (['active','pending','inactive','closed'].indexOf(normalize_(value)) === -1) throw new Error('Trạng thái không hợp lệ');
    const s = findRecord_('students', 'student_id', studentId);
    if (!s) throw new Error('Không tìm thấy học viên');
    setSheetCell_(getSpreadsheet_().getSheetByName('students'), s.__row, 'status', normalize_(value));
  } else if (field === 'NextAction') {
    upsert_('audit_logs', { audit_log_id: cleanId_('audit_logs', [studentId + '_action']), actor_id: mappingForUid_(zaloUid).counselor_id, actor_role: 'counselor', action: 'NEXT_ACTION_UPDATED', entity_type: 'student', entity_id: studentId, value: value, created_at: new Date() });
  } else { throw new Error('Trường cập nhật không được phép'); }
  return { message: 'Đã cập nhật ' + field + ' của ' + studentId + '.', notifications: [] };
}

function assignTest_(zaloUid, studentId, testId, note) {
  requireIdentity_(zaloUid, 'Counselor');
  const counselorId = assertAssignedStudent_(zaloUid, studentId);
  const test = findRecord_('tests', 'test_id', testId);
  if (!test || !clean_(test.form_url)) throw new Error('Không tìm thấy TEST_ID hoặc bài test chưa có Form URL');
  const id = cleanId_('test_assignments', [studentId + '_' + testId]);
  upsert_('test_assignments', { test_assignment_id: id, student_id: studentId, counselor_id: counselorId, test_id: testId, status: 'assigned', assigned_at: new Date(), created_at: new Date(), updated_at: new Date() });
  const sUid = zaloUidFor_('student', studentId);
  return { message: 'Đã tạo bài test ' + id + ' cho ' + studentId + '.', notifications: sUid ? [[sUid, 'Bạn được giao bài test: ' + test.form_url + (note ? '\n' + note : '')]] : [] };
}

function sessionForBooking_(bookingId) { return sheetRowsByName_('sessions').find(function(r) { return r.booking_id === bookingId; }) || null; }

function addFeedback_(zaloUid, bookingId, rating, comment) {
  requireIdentity_(zaloUid, 'Student');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Điểm phải từ 1 đến 5');
  const booking = requireBookingActor_(zaloUid, bookingId);
  if (normalize_(booking.status) !== 'completed') throw new Error('Chỉ gửi feedback sau khi hoàn thành');
  const session = sessionForBooking_(bookingId);
  if (!session) throw new Error('Chưa có session');
  if (sheetRowsByName_('feedbacks').some(function(r) { return r.session_id === session.session_id; })) throw new Error('Đã gửi feedback');
  upsert_('feedbacks', { feedback_id: cleanId_('feedbacks', [bookingId]), student_id: booking.student_id, session_id: session.session_id, counselor_id: booking.counselor_id, rating: rating, comment: comment, category: 'zalo', created_at: new Date() });
  return { message: 'Feedback đã ghi nhận.', notifications: [] };
}

function completeBooking_(zaloUid, bookingId, outcome) {
  requireIdentity_(zaloUid, 'Counselor');
  const booking = requireBookingActor_(zaloUid, bookingId);
  if (booking.counselor_id !== mappingForUid_(zaloUid).counselor_id) throw new Error('Booking không thuộc tư vấn viên này');
  if (['confirmed','rescheduled','confirm','booked','active'].indexOf(normalize_(booking.status)) === -1) throw new Error('Chỉ hoàn thành booking đang chờ diễn ra');
  const sessionId = cleanId_('sessions', [bookingId]);
  upsert_('sessions', { session_id: sessionId, session_name: 'Zalo ' + bookingId, session_type: 'counseling', booking_id: bookingId, started_at: booking.start_time, ended_at: new Date(), status: 'completed', created_at: new Date() });
  const bSheet = getSpreadsheet_().getSheetByName('bookings');
  setSheetCell_(bSheet, booking.__row, 'status', 'completed');
  setSheetCell_(bSheet, booking.__row, 'updated_at', new Date());
  upsert_('assessments', { assessment_id: cleanId_('assessments', [sessionId]), student_id: booking.student_id, counselor_id: booking.counselor_id, session_id: sessionId, booking_id: bookingId, assessment_category: 'session_outcome', severity: '', outcome: outcome, notes: outcome, created_at: new Date() });
  const sUid = zaloUidFor_('student', booking.student_id);
  return { message: 'Đã hoàn thành booking ' + bookingId + '.', notifications: sUid ? [[sUid, 'Phiên tư vấn đã hoàn thành.']] : [] };
}

function recordFailedJob_(requestId, senderId, text, error) {
  const safe = ['/slots','/lichtrong','/bookings','/lichhen','/students','/danhsachhocvien','/whoami','/toilaai'];
  const cmd = clean_(text).split(/\s+/,1)[0].toLowerCase();
  const replayable = safe.indexOf(cmd) !== -1;
  const jobId = 'JOB-' + Utilities.getUuid().substring(0,10);
  appendRowObject_(ensurePrivateSheet_(QWENPAW_JOB_SHEET, QWENPAW_JOB_HEADERS), { job_id: jobId, request_id: requestId, sender_id: senderId, text: replayable ? clean_(text).substring(0,500) : '', replayable: replayable, error: clean_(error).substring(0,240), status: 'failed', created_at: new Date(), updated_at: '' });
  return jobId;
}

function getFailedJob_(jobId, actorUid) {
  const job = sheetRows_(ensurePrivateSheet_(QWENPAW_JOB_SHEET, QWENPAW_JOB_HEADERS)).find(function(r) { return r.job_id === jobId; });
  if (!job) throw new Error('Không tìm thấy failed job');
  const actor = resolveIdentity_(actorUid);
  let ok = job.sender_id === actorUid;
  if (!ok && actor.role === 'Counselor') {
    const src = resolveIdentity_(job.sender_id);
    if (src.role === 'Student') { const sId = mappingForUid_(job.sender_id).student_id; ok = sheetRowsByName_('counselor_assignments').some(function(r) { return r.counselor_id === mappingForUid_(actorUid).counselor_id && r.student_id === sId && ['active','assigned'].indexOf(normalize_(r.status)) !== -1; }); }
  }
  if (!ok) throw new Error('Bạn không có quyền chạy lại yêu cầu này');
  return { JobID: job.job_id, RequestID: job.request_id, SenderID: job.sender_id, Text: job.text, Replayable: job.replayable === true || job.replayable === 'true', Error: job.error, Status: job.status };
}

function markFailedJob_(jobId, status) {
  const sheet = ensurePrivateSheet_(QWENPAW_JOB_SHEET, QWENPAW_JOB_HEADERS);
  const job = sheetRows_(sheet).find(function(r) { return r.job_id === jobId; });
  if (!job) throw new Error('Không tìm thấy failed job');
  setSheetCell_(sheet, job.__row, 'status', clean_(status));
  setSheetCell_(sheet, job.__row, 'updated_at', new Date());
  return {};
}

function studentProfileId_(zaloUid) { requireIdentity_(zaloUid, 'Student'); return { StudentID: clean_(mappingForUid_(zaloUid).student_id) }; }

function counselorSchedule_(zaloUid) {
  requireIdentity_(zaloUid, 'Counselor');
  const cId = clean_(mappingForUid_(zaloUid).counselor_id);
  return sheetRowsByName_('counselor_schedules').filter(function(r) { return r.counselor_id === cId && ['active','approved','enabled'].indexOf(normalize_(r.status)) !== -1; })
    .map(function(r) { return { Day: r.day_of_week, Start: r.slot_start_time, End: r.slot_end_time, Status: r.status }; });
}

function guardianStudentIds_(zaloUid) {
  requireIdentity_(zaloUid, 'Guardian');
  const parentId = clean_(mappingForUid_(zaloUid).parent_id);
  if (!parentId) throw new Error('Mapping Người giám hộ chưa hợp lệ');
  return sheetRowsByName_('student_parents').filter(function(r) { return r.parent_id === parentId; }).map(function(r) { return clean_(r.student_id); }).filter(Boolean);
}

function requireGuardianStudent_(zaloUid, studentId) {
  if (!studentId || guardianStudentIds_(zaloUid).indexOf(studentId) === -1) throw new Error('Bạn không có quyền xem học sinh này');
  const s = findRecord_('students', 'student_id', studentId);
  if (!s) throw new Error('Không tìm thấy học sinh');
  return s;
}

function guardianChildren_(zaloUid) {
  const ids = guardianStudentIds_(zaloUid);
  return sheetRowsByName_('students').filter(function(r) { return ids.indexOf(r.student_id) !== -1; })
    .map(function(r) { return { StudentID: r.student_id, Name: [r.last_name, r.first_name].filter(Boolean).join(' '), Status: r.status }; });
}

function guardianBookings_(zaloUid, studentId) {
  requireGuardianStudent_(zaloUid, studentId);
  return sheetRowsByName_('bookings').filter(function(r) { return r.student_id === studentId && ['confirmed','rescheduled','completed'].indexOf(normalize_(r.status)) !== -1; })
    .map(function(r) { return { BookingID: r.booking_id, Slot: [r.start_time, r.end_time].filter(Boolean).join(' - '), Status: r.status }; });
}

function guardianStudentInfo_(zaloUid, studentId) {
  const s = requireGuardianStudent_(zaloUid, studentId);
  const upcoming = guardianBookings_(zaloUid, studentId).filter(function(i) { return ['confirmed','rescheduled'].indexOf(normalize_(i.Status)) !== -1; })[0];
  return { message: 'Học sinh: ' + ([s.last_name, s.first_name].filter(Boolean).join(' ') || studentId) + '\nTrạng thái: ' + (s.status || 'chưa cập nhật') + '\nLịch hẹn gần nhất: ' + (upcoming ? upcoming.Slot : 'Chưa có') };
}

function guardianContactCounselor_(zaloUid, studentId, message) {
  requireGuardianStudent_(zaloUid, studentId);
  const text = clean_(message);
  if (!text || text.length > 500) throw new Error('Nội dung 1-500 ký tự');
  const booking = sheetRowsByName_('bookings').filter(function(r) { return r.student_id === studentId && ['confirmed','rescheduled'].indexOf(normalize_(r.status)) !== -1; })[0];
  if (!booking) throw new Error('Học sinh chưa có tư vấn viên phụ trách');
  const c = findRecord_('counselors', 'counselor_id', booking.counselor_id);
  if (!c || ['active','approved','enabled'].indexOf(normalize_(c.status)) === -1) throw new Error('Tư vấn viên chưa sẵn sàng');
  const cUid = zaloUidFor_('counselor', booking.counselor_id);
  if (!cUid) throw new Error('Tư vấn viên chưa liên kết Zalo');
  return { message: 'Đã chuyển lời nhắn đến tư vấn viên.', notifications: [[cUid, 'Người giám hộ của ' + studentId + ' nhắn: ' + text]] };
}

function enqueueZaloNotification_(role, studentId, counselorId, parentId, eventType, message, entityType, entityId, now) {
  const stableKey = [eventType, entityType, entityId, role, studentId, counselorId, parentId].join('|');
  const id = 'NOTIF-' + hashToken_(stableKey).substring(0, 24);
  if (findRecord_('notifications', 'notification_id', id)) return;
  upsert_('notifications', { notification_id: id, recipient_role: role, student_id: studentId || '', counselor_id: counselorId || '', parent_id: parentId || '', event_type: eventType, entity_type: entityType || '', entity_id: entityId || '', channel: 'zalo', message: message, status: 'pending', sent_at: '', created_at: now || new Date() });
}

function notificationRecipientUid_(row) {
  const role = normalize_(row.recipient_role);
  if (role === 'student') return zaloUidFor_('student', row.student_id);
  if (role === 'counselor') return zaloUidFor_('counselor', row.counselor_id);
  if (role === 'guardian' || role === 'parent') return zaloUidFor_('guardian', row.parent_id);
  return '';
}

function claimZaloNotifications_(limit) {
  const sheet = getSpreadsheet_().getSheetByName('notifications'); if (!sheet) return [];
  const now = new Date(), stale = new Date(now.getTime() - 5*60*1000);
  return sheetRows_(sheet).filter(function(r) { return normalize_(r.channel) === 'zalo' && (normalize_(r.status) === 'pending' || (normalize_(r.status) === 'dispatching' && (!asDate_(r.sent_at) || asDate_(r.sent_at) < stale))); })
    .slice(0, Math.max(1, Math.min(Number(limit)||20, 50)))
    .map(function(r) {
      const uid = notificationRecipientUid_(r);
      if (!uid) { setSheetCell_(sheet, r.__row, 'status', 'failed'); return null; }
      setSheetCell_(sheet, r.__row, 'status', 'dispatching');
      setSheetCell_(sheet, r.__row, 'sent_at', now);
      return { notification_id: r.notification_id, recipient_uid: uid, message: r.message };
    }).filter(Boolean);
}

function markZaloNotificationSent_(id) {
  const sheet = getSpreadsheet_().getSheetByName('notifications');
  const row = sheetRows_(sheet).find(function(r) { return r.notification_id === id; });
  if (!row) throw new Error('Không tìm thấy notification');
  setSheetCell_(sheet, row.__row, 'status', 'sent');
  setSheetCell_(sheet, row.__row, 'sent_at', new Date());
  return {};
}

function releaseZaloNotification_(id) {
  const sheet = getSpreadsheet_().getSheetByName('notifications');
  const row = sheetRows_(sheet).find(function(r) { return r.notification_id === id; });
  if (!row) throw new Error('Không tìm thấy notification');
  setSheetCell_(sheet, row.__row, 'status', 'pending');
  setSheetCell_(sheet, row.__row, 'sent_at', '');
  return {};
}
