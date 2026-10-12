/**
 * ============================================================================
 *  DENT-Z OFFICIAL — BACKEND & DATA ANALYTICS (Google Apps Script)  v4.0.0
 * ============================================================================
 *  ไฟล์เดียวจบ รวมทุกระบบหลังบ้าน & การวิเคราะห์ข้อมูลสถิติ DENT-Z:
 *   1. Web App (doPost)  รับคำสั่งจองสินค้า & ฟอร์มปรึกษาปัญหาผิวรอบปากจากหน้าเว็บ
 *   2. บันทึกสลิปลง Google Drive (แยกโฟลเดอร์ตามเดือน: DENT-Z Slips/yyyy-MM)
 *   3. ส่งอีเมลยืนยันถึงลูกค้า + แจ้งเตือนแอดมิน (แนบไฟล์ภาพสลิปจริงในอีเมล)
 *   4. เปลี่ยน "สถานะ" ในชีท → ส่งอีเมลแจ้งลูกค้าอัตโนมัติ:
 *        🟢 ชำระเงินแล้ว  /  🚚 จัดส่งแล้ว (พร้อมเลขพัสดุ & ปุ่มติดตาม)  /  🔴 ยกเลิก
 *   5. Dashboard (📊 Summary): สรุปยอดขาย, เงินสมทบทุน, สถานะ, ยอดรายเดือน (มีกราฟ), แพ็กเกจยอดนิยม
 *   6. User Profiles (👤 User Profiles): สรุปผู้สนับสนุนแต่ละคน + ระดับผู้สนับสนุน (VIP/VVIP) + ผลทดสอบ
 *   7. สรุปยอดประจำวันส่งเข้าอีเมลแอดมินทุกวันเวลา 20:00 น.
 *   8. ป้องกันออเดอร์ซ้ำ, ล็อกการเขียนพร้อมกัน (LockService), บันทึก Error ลงชีท "System Log"
 *   9. ระบบเชื่อมต่อ Firebase Firestore ดั้งเดิม (Orders, Users, Quiz Results, Consultations)
 *  10. เครื่องมือคำนวณสถิติวิจัย (Chi-square test, Independent t-test, One-way ANOVA)
 *
 *  🔒 ความปลอดภัยของข้อมูลเดิม (Zero Data Loss):
 *   • คอลัมน์เดิม A–L ของชีท 📦 Orders อยู่ตำแหน่งเดิม 100% (ข้อมูลเก่าไม่ถูกย้ายหรือลบ)
 *   • คอลัมน์ใหม่ M–Q ถูกเพิ่มต่อท้ายอย่างเป็นระเบียบ
 *   • ระบบ Sync ข้อมูลจะรักษาค่า "สถานะ" และ "เลขพัสดุ" เดิมไว้เสมอ ไม่ลบทับ
 * ============================================================================
 */

// ============================================================================
// 0) CONFIG — ปรับแต่งค่าของระบบ
// ============================================================================
const VERSION = '4.0.0';

const CONFIG = {
  SHOP_NAME: "DENT-Z Official",
  SENDER_NAME: "DENT-Z Official",             // ชื่อผู้ส่งที่ลูกค้าเห็นในอีเมล
  TAGLINE: "Clean Teeth, Fresh Breath, Healthy Smile • นวัตกรรมยาสีฟันเพื่อสุขภาพช่องปาก",

  // อีเมลแอดมินที่จะรับแจ้งเตือนออเดอร์ใหม่และสรุปยอด
  ADMIN_EMAIL: 'dentz.official@gmail.com',
  ADMIN_CC: '',                               // อีเมลเพิ่มเติม (คั่นด้วยเครื่องหมายจุลภาค เช่น 'a@gmail.com,b@gmail.com')

  // Google Spreadsheet ID
  SPREADSHEET_ID: '11kmE4bM0bcftk36nUPBd0LQhYdtU4XnvSJ9u8sgvMxc',

  // Firebase Service Account Credentials (ระบบเดิม)
  FIREBASE_PROJECT_ID: 'dent-z-app',
  SERVICE_ACCOUNT_EMAIL: 'firebase-adminsdk-fbsvc@dent-z-app.iam.gserviceaccount.com',
  SERVICE_ACCOUNT_PRIVATE_KEY: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDFX2j8HpnN1LL3
H5XNTvj0sJfUId4OYEZG/iR5xxsoVQAYBhpN4s5doaSyfYHpFQF62App2vRa/YWo
oUGhGdZiwD0n2M4A0c7ParaGlErI6Rh+N68WVte6AMRpDrQBADu7s6kuoMtPkIsg
9ZhTY8tu+hHgEcl9UBiUUtObi3yXmgwsSIvE5QWAc4cTvGlKAZHG9OP+s28mxKgI
z1STjgZAc2OcxZzw2yY1gfGp6hzXaYUsbHDkbdSpNTvgmwwhSd1RedhTDkA+GEIK
h6F0+DfqDWyGNKiWtb3Z2yIfUq2LsQ6qyiuh5/VAIqnVgzhCC34cpB0ONjHVw5MP
a35YftndAgMBAAECggEAAw6KOrVinmx35RnpIQfjFS8S+ucXYFOfYwQWnog15HcE
jFqz15b2qT6SpW0KMQjxP+zOpHsOo8YfZtAwiwUya88cY1yZPCwDrvSxJP5w9hGe
Hn5QSOFJcAkJAbOHmChfxHVw3lcBLxdHAFitZkU6ZlqbIkREQZuW9d0eh98uK87h
AK0ojaggFzS0ttX5VHLDmc5VWRnUWsBu1bBjo5qi2n9PpIA0faBxaMUra+8U5zmJ
72kkmfMrPiJnwvme+NTXFos2bWBkUbRyn9Vr8HLoDo7sthmvs/oZPs7saG78/9ki
rmp4zdmap0/FfUH/f4NDyVWhSIj3vYaG59ngXBiDpQKBgQDkk1KBsDyHX8EFvG5u
0WRyp1+iGANCooH6ujyE2JwqCeDip1UzlwNGKSH6k39hgHqYY4sa2lcW1jhiq1I3
QRfGREF+PNnPR1FUasQbKOQDtHRvgaGby2rs8xZkNMmn45AcHHBD8Dj1SHuRnfJ/
0ztUD5fsx85XumJdRGgH/OT70wKBgQDdDbJjKOqjHrsZy6e5zBLk+ED6agxe0Ds2
/IvrOTxmpYGR55sJzaChcd9JSLu8BNnzWuTdNERYGrS9nt3nrYwm2C3EHxP7aBTH
uHgrR5PzRb6AKg3t2ztf7otvIm1r2IUyOlMKKqUJUhdhmtDYVedK8LG9OPmQVdOb
l95VUw61jwKBgG9YiMeeR04Wyht2OEGJhSoI+KAonGX4beLqmBKKxkAAQemHZAzW
koS6AtBiy5l+kbnsO9Yf6G66egsus8Uw01kE5PaOw/eiIS9DNzaXy8M2Q8YR2tze
0b6NiCnWQSmkxA29mL6vpb9uyKsdywSTrIH9ep+gkZbQt5wBd7/0ZMN7AoGBAKUb
M+BokUihDXKo8HAQAxTOcAoZ539x3KinXQKmT30DpZGLAfwCgDXVzcb48m/u17Oy
cjrebSW5XMI8xNXkhEgHM7fG1q/y/4JlQCxjXBhaQX2M67Z7BxASJkct2bixklr/
wUJYs8gQbrJSZicPkqAgw0DoK08pK9KNTl1Amj31AoGATr5lr2iRM0v9koQ+7h+t
RKoJAjPTdVQNcCqPXnLj1K4eTq3phRM188BYuoU4avLg1giUfD+Nbi3uoeRVPZ4u
ETFlWSRB+4E3OVmunMQQv5K0fr+P3kINP9+bYNEzBwtko6n4+g6sZUe+Ui4uGYGd
5zu1+tfU2etvedsW2ZaJqTE=
-----END PRIVATE KEY-----`,

  // จัดเก็บสลิปใน Google Drive
  SLIP_FOLDER_NAME: "DENT-Z Slips",
  SLIP_PUBLIC_LINK: true,
  MAX_SLIP_BYTES: 10 * 1024 * 1024,          // 10MB

  TIMEZONE: 'Asia/Bangkok',
  WEBSITE_URL: 'https://dentz-web.github.io/dentz-website/',
  LINE_URL: 'https://line.me/ti/p/@dentz',
  FACEBOOK_URL: 'https://www.facebook.com/dentzofficial',

  // การส่งอีเมลอัตโนมัติ
  SEND_CUSTOMER_CONFIRMATION: true,
  SEND_ADMIN_NOTIFICATION: true,
  ATTACH_SLIP_TO_ADMIN_EMAIL: true,
  SEND_STATUS_EMAILS: true,

  // สรุปยอดประจำวัน
  DAILY_SUMMARY_ENABLED: true,
  DAILY_SUMMARY_HOUR: 20,                   // 20:00 น.

  // ระดับผู้สนับสนุน (Supporter Tiers)
  VIP_THRESHOLD: 1000,                      // ยอดสนับสนุนสะสม >= 1,000 ฿ = 💚 VIP Supporter
  VVIP_THRESHOLD: 3000,                     // ยอดสนับสนุนสะสม >= 3,000 ฿ = 👑 VVIP Supporter
};

// ============================================================================
// 1) โครงสร้างชีท & สีประจำแบรนด์ DENT-Z
// ============================================================================
const SHEETS = {
  ORDERS: '📦 Orders',
  CUSTOMERS: '👤 User Profiles',
  SUMMARY: '📊 Summary',
  QUIZ: '🧠 Quiz Results',
  CONSULT: '💬 Consultations',
  CHI_SQUARE: '📐 Chi-square',
  T_TEST: '📐 t-test',
  ANOVA: '📐 ANOVA',
  LOG: 'System Log',
};

// ลำดับคอลัมน์ในชีท 📦 Orders (คงที่ A–L แบบเดิม 100% + เสริม M–Q สำหรับ Workflow ใหม่)
const COL = {
  ORDER_ID: 1,    // A: เลขที่คำสั่งซื้อ (Order ID)
  TIMESTAMP: 2,   // B: วันที่/เวลา (Timestamp)
  NAME: 3,        // C: ชื่อ-นามสกุล (Name)
  PHONE: 4,       // D: เบอร์โทร (Phone)
  EMAIL: 5,       // E: อีเมล (Email)
  ADDRESS: 6,     // F: ที่อยู่จัดส่ง (Address)
  PACKAGE: 7,     // G: แพ็กเกจที่เลือก (Package)
  QTY: 8,         // H: จำนวน (Quantity)
  TOTAL: 9,       // I: ยอดรวมสุทธิ (฿) (Net Total)
  DONATE: 10,     // J: เงินสมทบทุน (฿) (Donation)
  UID: 11,        // K: รหัสลูกค้า (User ID)
  SLIP: 12,       // L: สลิปการโอนเงิน (Slip Link)
  STATUS: 13,     // M: สถานะคำสั่งซื้อ (Status)
  TRACKING: 14,   // N: เลขพัสดุ (Tracking Number)
  NOTE: 15,       // O: หมายเหตุ (Note)
  EMAIL_LOG: 16,  // P: ประวัติส่งอีเมล (Email Log)
  DATA: 17,       // Q: ข้อมูลระบบ (System JSON Data)
};
const NUM_COLS = 17;

const HEADERS = [
  '🧾 เลขที่คำสั่งจอง (Order ID)',
  '📅 วันที่/เวลา (Timestamp)',
  '👤 ชื่อลูกค้า (Name)',
  '📞 เบอร์โทร (Phone)',
  '📧 อีเมล (Email)',
  '📍 ที่อยู่จัดส่ง (Address)',
  '🎁 แพ็กเกจที่เลือก (Package)',
  '📦 จำนวน (Qty)',
  '💰 ยอดรวมสุทธิ (฿)',
  '❤️ เงินสมทบทุน (฿)',
  '🔑 รหัสลูกค้า (UID)',
  '🔗 สลิปการโอนเงิน (Slip)',
  '🚦 สถานะ (Status)',
  '🚚 เลขพัสดุ (Tracking)',
  '📝 หมายเหตุ (Note)',
  '📨 อีเมลที่ส่งแล้ว (Email Log)',
  '⚙️ ข้อมูลระบบ (ห้ามแก้ไข)',
];

const STATUS = {
  PENDING: '🟡 รอตรวจสอบสลิป',
  PAID: '🟢 ชำระเงินแล้ว',
  PREPARING: '📦 กำลังเตรียมจัดส่ง',
  SHIPPED: '🚚 จัดส่งแล้ว',
  CANCELLED: '🔴 ยกเลิก',
};
const STATUS_LIST = [STATUS.PENDING, STATUS.PAID, STATUS.PREPARING, STATUS.SHIPPED, STATUS.CANCELLED];
const STATUS_COLORS = {
  PENDING: { bg: '#fff4cc', fg: '#7a5b00' },
  PAID: { bg: '#dcf5e3', fg: '#1e6b35' },
  PREPARING: { bg: '#e3ecfb', fg: '#24467a' },
  SHIPPED: { bg: '#e9e1f7', fg: '#4b2d7f' },
  CANCELLED: { bg: '#fbe0e0', fg: '#8a1f1f' },
};

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const OUR_TRIGGER_HANDLERS = ['handleOrderEdit', 'syncAll', 'sendDailySummary', 'syncData', 'syncAllData'];

// ธีมสีทางการ DENT-Z (Emerald Green & Clean Modern Healthcare)
const BRAND = {
  PRIMARY: '#166534',     // เขียวมรกตเข้ม DENT-Z
  DARK: '#0a2e1a',        // เขียวเกือบดำ / พื้นหัวตาราง
  HEADER_BG: '#166534',
  ACCENT: '#22c55e',      // เขียวสดใส
  LIGHT_BG: '#f0fdf4',    // เขียวอ่อนพาสเทล
  GOLD: '#d97706',        // ทองสำหรับยอดสมทบทุน / VIP
  BG: '#f8fafc',          // พื้นหลังอีเมล
  CARD_BG: '#ffffff',
  MUTED: '#64748b',       // เทาข้อความเสริม
  BORDER: '#e2e8f0',      // ขอบเส้นแบ่ง
};

// ============================================================================
// 2) WEB APP ENTRY POINTS (doGet & doPost)
// ============================================================================

/** เปิดดู Web App URL เพื่อเช็กสถานะการทำงาน */
function doGet() {
  return json_({
    status: 'ok',
    service: CONFIG.SHOP_NAME + ' Backend API',
    version: VERSION,
    timestamp: new Date().toISOString()
  });
}

/** รับข้อมูลจากหน้าเว็บ (คำสั่งซื้อสินค้า หรือ แบบฟอร์มปรึกษาปัญหาผิวรอบปาก) */
function doPost(e) {
  let data;
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('ไม่มีข้อมูลที่ส่งมา (Empty payload)');
    }
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    logError_('doPost/parse', err);
    return json_({ status: 'error', success: false, message: 'รูปแบบข้อมูลไม่ถูกต้อง: ' + err.message });
  }

  const type = data.type || 'order';

  if (type === 'ping') {
    return json_({ status: 'ok', success: true, version: VERSION });
  }

  // 1. กรณีเป็นฟอร์มปรึกษาปัญหาผิวรอบปาก (Consultation)
  if (type === 'consult') {
    try {
      return json_(handleConsult_(data));
    } catch (err) {
      logError_('doPost/consult', err, JSON.stringify(data));
      return json_({ status: 'error', success: false, message: err.message });
    }
  }

  // 2. กรณีเป็นคำสั่งจองสินค้า (Order Checkout)
  if (type === 'order') {
    try {
      return json_(handleOrder_(data));
    } catch (err) {
      logError_('doPost/order', err, summarizePayload_(data));
      notifyAdminOfError_(err, data);
      return json_({ status: 'error', success: false, message: err.message });
    }
  }

  return json_({ status: 'error', success: false, message: 'ไม่รู้จักประเภทคำขอ (Unknown type): ' + type });
}

// ============================================================================
// 3) ORDER PROCESSING (ประมวลผลคำสั่งจองสินค้า)
// ============================================================================

function handleOrder_(data) {
  const order = normalizeOrder_(data);
  const ss = getSs_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  let row;
  let slip = { url: order.slipLink || '', blob: null, error: '' };
  let sheet;

  try {
    sheet = ensureOrdersSheet_(ss);

    // ป้องกันออเดอร์ซ้ำ
    const existingRow = findRowByOrderId_(sheet, order.orderId);
    if (existingRow > 0) {
      const slipFormula = sheet.getRange(existingRow, COL.SLIP).getFormula();
      logInfo_('doPost/duplicate', 'ได้รับออเดอร์ซ้ำ ข้ามการบันทึก', order.orderId);
      return {
        status: 'success',
        success: true,
        duplicate: true,
        orderId: order.orderId,
        slipUrl: extractUrl_(slipFormula) || order.slipLink,
        emailSent: true
      };
    }

    // จัดเก็บสลิปลง Google Drive
    if (data.slip_base64 || data.slipBase64) {
      try {
        slip = saveSlip_(order, data);
      } catch (slipErr) {
        slip.error = slipErr.message;
        logError_('saveSlip', slipErr, order.orderId);
      }
    }

    row = appendOrderRow_(sheet, order, slip);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  // ส่งอีเมล (ทำหลังปลดล็อก เพื่อให้ระบบรับออเดอร์อื่นได้ทันทีโดยไม่ต้องรอส่งเมล)
  let emailSent = false;
  let adminNotified = false;
  let customerEmailError = '';

  // 1. ส่งอีเมลยืนยันให้ลูกค้า
  if (CONFIG.SEND_CUSTOMER_CONFIRMATION && isEmail_(order.customer.email)) {
    try {
      sendCustomerOrderConfirmation_(order);
      emailSent = true;
      appendEmailLog_(sheet, row, 'CONFIRM', '✅ ยืนยันคำสั่งซื้อถึงลูกค้า');
    } catch (mailErr) {
      customerEmailError = mailErr.message;
      appendEmailLog_(sheet, row, 'CONFIRM-FAIL', '❌ ส่งอีเมลยืนยันไม่สำเร็จ: ' + mailErr.message);
      logError_('mail/customer', mailErr, order.orderId);
    }
  }

  // 2. ส่งอีเมลแจ้งเตือนแอดมิน (พร้อมแนบสลิป)
  if (CONFIG.SEND_ADMIN_NOTIFICATION) {
    try {
      sendAdminNewOrder_(order, slip, ss, sheet, row, customerEmailError);
      adminNotified = true;
      appendEmailLog_(sheet, row, 'ADMIN', '🔔 แจ้งเตือนแอดมินแล้ว');
    } catch (mailErr) {
      appendEmailLog_(sheet, row, 'ADMIN-FAIL', '❌ แจ้งเตือนแอดมินไม่สำเร็จ: ' + mailErr.message);
      logError_('mail/admin', mailErr, order.orderId);
    }
  }

  return {
    status: 'success',
    success: true,
    orderId: order.orderId,
    slipUrl: slip.url || order.slipLink || '',
    emailSent: emailSent,
    adminNotified: adminNotified
  };
}

function normalizeOrder_(data) {
  const customer = {
    name: str_(data.name || data['name (ชื่อ-นามสกุล)'] || 'คุณลูกค้า', 200),
    phone: str_(data.phone || data['phone (เบอร์โทรศัพท์)'] || '-', 50),
    address: str_(data.address || data['address (ที่อยู่จัดส่ง)'] || 'ไม่ระบุที่อยู่', 2000),
    email: str_(data.email || data.userEmail || '', 200),
  };

  const packageName = str_(data.package || data['package (แพ็กเกจที่ต้องการ)'] || data['package_(แพ็กเกจที่ต้องการ)'] || 'DENT-Z Supporter Package', 150);
  const quantity = Math.max(1, parseInt(data.quantity, 10) || 1);
  const netTotal = parseFloat(data.net_total || data.Net_Total || data['Net_Total (ยอดรวมสุทธิ)'] || data.totalPrice || 0);
  const donate = parseFloat(data.donate || data.donate_preset || data['donate_preset (เงินสมทบทุน)'] || data.donate_custom || data['donate_custom (จำนวนเงินที่ระบุเอง)'] || 0);

  let orderId = str_(data.orderId || data.order_id || '', 50);
  if (!/^DZ-\d{6}-[A-Z0-9]{4,8}$/.test(orderId)) {
    orderId = generateOrderId_(new Date());
  }

  return {
    orderId: orderId,
    createdAt: new Date(),
    customer: customer,
    package: packageName,
    quantity: quantity,
    netTotal: netTotal,
    donate: donate,
    uid: str_(data.userId || data.uid || 'anonymous', 128),
    slipLink: str_(data.slip_link || data.slipLink || '', 1000),
    status: STATUS.PENDING,
  };
}

function appendOrderRow_(sheet, order, slip) {
  const row = new Array(NUM_COLS).fill('');
  row[COL.ORDER_ID - 1] = order.orderId;
  row[COL.TIMESTAMP - 1] = order.createdAt;
  row[COL.NAME - 1] = safeCell_(order.customer.name);
  row[COL.PHONE - 1] = "'" + order.customer.phone;
  row[COL.EMAIL - 1] = safeCell_(order.customer.email);
  row[COL.ADDRESS - 1] = safeCell_(order.customer.address);
  row[COL.PACKAGE - 1] = safeCell_(order.package);
  row[COL.QTY - 1] = order.quantity;
  row[COL.TOTAL - 1] = order.netTotal;
  row[COL.DONATE - 1] = order.donate;
  row[COL.UID - 1] = safeCell_(order.uid);
  
  const slipDisplayUrl = slip.url || order.slipLink;
  row[COL.SLIP - 1] = slipDisplayUrl && slipDisplayUrl !== '-'
    ? '=HYPERLINK("' + slipDisplayUrl + '", "🔍 ดูภาพสลิป")'
    : (slip.error ? 'เซฟสลิปไม่สำเร็จ: ' + slip.error : 'ไม่มีสลิป');

  row[COL.STATUS - 1] = STATUS.PENDING;
  row[COL.TRACKING - 1] = '';
  row[COL.NOTE - 1] = order.donate > 0 ? 'สมทบทุนโครงการ ' + money_(order.donate) + ' ฿' : '';
  row[COL.EMAIL_LOG - 1] = '';
  row[COL.DATA - 1] = JSON.stringify({ v: 1, package: order.package, donate: order.donate, qty: order.quantity });

  const r = Math.max(sheet.getLastRow(), 1) + 1;
  sheet.getRange(r, 1, 1, NUM_COLS).setValues([row]);
  sheet.getRange(r, COL.TIMESTAMP).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(r, COL.TOTAL).setNumberFormat('฿#,##0.00');
  sheet.getRange(r, COL.DONATE).setNumberFormat('฿#,##0.00');
  return r;
}

// ============================================================================
// 4) CONSULTATION PROCESSING (ฟอร์มปรึกษาปัญหาผิวรอบปาก)
// ============================================================================

function handleConsult_(data) {
  const ss = getSs_();
  const sheet = getOrCreateSheet_(ss, SHEETS.CONSULT, '#ff9800');
  
  const name = str_(data.name || data['name (ชื่อ-นามสกุล)'] || 'คุณลูกค้า', 200);
  const email = str_(data.email || data['email (อีเมล)'] || '', 200);
  const message = str_(data.message || data['message (ข้อความ)'] || data['message (ปัญหา/อาการที่ต้องการปรึกษา)'] || '-', 3000);
  const consultId = 'CS-' + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyMMdd-HHmmss');
  const now = new Date();

  // บันทึกลงชีท 💬 Consultations
  const headers = ['ID', 'Timestamp', 'ชื่อ-นามสกุล', 'อีเมล', 'ปัญหา/อาการที่ปรึกษา'];
  if (sheet.getLastRow() < 1) {
    const headRange = sheet.getRange(1, 1, 1, headers.length);
    headRange.setValues([headers]);
    headRange.setBackground(BRAND.DARK);
    headRange.setFontColor('#ffffff');
    headRange.setFontWeight('bold');
    sheet.setRowHeight(1, 38);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([consultId, Utilities.formatDate(now, CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm:ss'), name, email, message]);

  // ส่งอีเมลยืนยันถึงลูกค้า
  if (isEmail_(email)) {
    try {
      sendCustomerConsultConfirmation_({ name: name, email: email, message: message, consultId: consultId });
    } catch (e) {
      logError_('mail/consult-customer', e);
    }
  }

  // ส่งอีเมลแจ้งเตือนแอดมิน
  try {
    sendAdminNewConsult_({ name: name, email: email, message: message, consultId: consultId });
  } catch (e) {
    logError_('mail/consult-admin', e);
  }

  return { status: 'success', success: true, message: 'Consultation recorded', consultId: consultId };
}

// ============================================================================
// 5) DRIVE SLIP UPLOAD (จัดเก็บสลิปตามเดือนใน Google Drive)
// ============================================================================

function saveSlip_(order, data) {
  let b64 = String(data.slip_base64 || data.slipBase64 || '');
  if (!b64) return { url: '', blob: null, error: '' };

  const marker = b64.indexOf('base64,');
  if (marker > -1) b64 = b64.substring(marker + 7);

  const bytes = Utilities.base64Decode(b64);
  if (!bytes.length) throw new Error('ไฟล์สลิปว่างเปล่า');
  if (bytes.length > CONFIG.MAX_SLIP_BYTES) throw new Error('ไฟล์สลิปใหญ่เกินขีดจำกัด');

  const mime = /^image\/(jpeg|png|webp|gif|heic)$/.test(String(data.slipMimeType || '')) ? data.slipMimeType : 'image/jpeg';
  const ext = mime.split('/')[1].replace('jpeg', 'jpg');
  const safeName = order.customer.name.replace(/[^\w\u0E00-\u0E7F]+/g, '_').slice(0, 40);
  const blob = Utilities.newBlob(bytes, mime, order.orderId + '_' + safeName + '.' + ext);

  const folder = getSlipFolder_(order.createdAt);
  const file = folder.createFile(blob);
  file.setDescription('DENT-Z Order ' + order.orderId + ' • ' + order.customer.name + ' • ฿' + money_(order.netTotal));

  if (CONFIG.SLIP_PUBLIC_LINK) {
    try {
      if (typeof DriveApp.Access !== 'undefined' && typeof DriveApp.Permission !== 'undefined') {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
    } catch (shareErr) {
      logInfo_('saveSlip/share', 'ตั้งค่าแชร์ลิงก์สาธารณะไม่ได้: ' + shareErr.message, order.orderId);
    }
  }
  return { url: file.getUrl(), blob: blob, error: '' };
}

function getSlipFolder_(date) {
  const props = PropertiesService.getScriptProperties();
  let root = null;
  const savedId = props.getProperty('SLIP_FOLDER_ID');
  if (savedId) {
    try { root = DriveApp.getFolderById(savedId); } catch (e) { root = null; }
  }
  if (!root) {
    const found = DriveApp.getFoldersByName(CONFIG.SLIP_FOLDER_NAME);
    root = found.hasNext() ? found.next() : DriveApp.createFolder(CONFIG.SLIP_FOLDER_NAME);
    props.setProperty('SLIP_FOLDER_ID', root.getId());
  }
  const monthName = Utilities.formatDate(date || new Date(), CONFIG.TIMEZONE, 'yyyy-MM');
  const sub = root.getFoldersByName(monthName);
  return sub.hasNext() ? sub.next() : root.createFolder(monthName);
}

// ============================================================================
// 6) STATUS CHANGE → AUTO EMAIL (Installable onEdit Trigger)
// ============================================================================

/**
 * ฟังก์ชันรับเหตุการณ์แก้ไขใน Google Sheet อัตโนมัติ (Trigger: onEdit installable)
 * เมื่อแอดมินเปลี่ยนสถานะเป็น:
 *   - 🟢 ชำระเงินแล้ว
 *   - 🚚 จัดส่งแล้ว (พร้อมเลขพัสดุ)
 *   - 🔴 ยกเลิก
 * ระบบจะส่งอีเมลแจ้งลูกค้าทันที
 */
function handleOrderEdit(e) {
  try {
    if (!e || !e.range || !CONFIG.SEND_STATUS_EMAILS) return;
    const sheet = e.range.getSheet();
    if (sheet.getName() !== SHEETS.ORDERS) return;

    const c0 = e.range.getColumn();
    const c1 = e.range.getLastColumn();
    const touchesStatus = c0 <= COL.STATUS && c1 >= COL.STATUS;
    const touchesTracking = c0 <= COL.TRACKING && c1 >= COL.TRACKING;
    if (!touchesStatus && !touchesTracking) return;

    const r0 = Math.max(2, e.range.getRow());
    const r1 = Math.min(e.range.getLastRow(), r0 + 49); // สูงสุด 50 แถวต่อครั้ง ป้องกันสแปม
    for (let r = r0; r <= r1; r++) {
      const result = processStatusEmail_(sheet, r, false);
      if (result.message) toast_(result.message, result.sent ? '📨 ส่งอีเมลแล้ว' : 'ℹ️ แจ้งเตือน', 6);
    }
  } catch (err) {
    logError_('handleOrderEdit', err);
  }
}

function processStatusEmail_(sheet, row, force) {
  const values = sheet.getRange(row, 1, 1, NUM_COLS).getValues()[0];
  const slipFormula = sheet.getRange(row, COL.SLIP).getFormula();
  const order = rowToOrder_(values, row, slipFormula);
  const key = order.statusKey;

  if (key !== 'PAID' && key !== 'SHIPPED' && key !== 'CANCELLED') {
    return { sent: false, message: '' };
  }
  if (!force && order.emailLog.indexOf('[' + key + ']') > -1) {
    return { sent: false, message: '' }; // ส่งไปแล้ว ไม่ส่งซ้ำ
  }

  const label = order.orderId || ('แถว ' + row);
  if (!isEmail_(order.customer.email)) {
    return { sent: false, message: 'ออเดอร์ ' + label + ' ไม่มีอีเมลลูกค้าที่ถูกต้อง' };
  }
  if (key === 'SHIPPED' && !order.tracking) {
    return { sent: false, message: 'กรุณากรอก "เลขพัสดุ" ในคอลัมน์ N ของออเดอร์ ' + label + ' ก่อนเปลี่ยนเป็นจัดส่งแล้ว' };
  }

  try {
    sendStatusEmail_(order, key);
    const labels = {
      PAID: '🟢 แจ้งยืนยันการชำระเงิน',
      SHIPPED: '🚚 แจ้งจัดส่งสินค้า (' + order.tracking + ')',
      CANCELLED: '🔴 แจ้งยกเลิกคำสั่งซื้อ'
    };
    appendEmailLog_(sheet, row, key, labels[key]);
    return { sent: true, message: labels[key] + ' ถึง ' + order.customer.email + ' เรียบร้อย' };
  } catch (err) {
    appendEmailLog_(sheet, row, key + '-FAIL', '❌ ส่งอีเมลไม่สำเร็จ: ' + err.message);
    logError_('mail/status', err, label);
    return { sent: false, message: 'ส่งอีเมลไม่สำเร็จ: ' + err.message };
  }
}

// ============================================================================
// 7) EMAIL NOTIFICATIONS & TEMPLATES (DENT-Z BRANDED)
// ============================================================================

function sendMail_(opts) {
  if (MailApp.getRemainingDailyQuota() < 1) {
    throw new Error('โควตาส่งอีเมลของบัญชีนี้หมดแล้วสำหรับวันนี้ (Gmail quota reached)');
  }
  const message = {
    to: opts.to,
    subject: opts.subject,
    htmlBody: opts.html,
    body: htmlToText_(opts.html),
    name: CONFIG.SENDER_NAME,
  };
  if (opts.replyTo) message.replyTo = opts.replyTo;
  if (opts.cc) message.cc = opts.cc;
  if (opts.attachments && opts.attachments.length) message.attachments = opts.attachments;
  MailApp.sendEmail(message);
}

// 1. อีเมลยืนยันคำสั่งซื้อถึงลูกค้า
function sendCustomerOrderConfirmation_(order) {
  const body =
    h1_('ขอบคุณสำหรับการสั่งจองสินค้า DENT-Z 🦷') +
    p_('สวัสดีครับคุณ <b>' + esc_(order.customer.name) + '</b>') +
    p_('เราได้รับคำสั่งจองสินค้าและสลิปการโอนเงินสนับสนุนของคุณเรียบร้อยแล้ว ทีมงานกำลังดำเนินการตรวจสอบความถูกต้อง และจะจัดส่งสินค้าตามรอบที่กำหนดครับ') +
    orderMetaBox_(order, 'PENDING') +
    dentzItemsTable_(order) +
    sectionTitle_('ข้อมูลการจัดส่ง') +
    infoTable_([
      ['ชื่อผู้รับ', esc_(order.customer.name)],
      ['เบอร์โทร', esc_(order.customer.phone)],
      ['ที่อยู่จัดส่ง', nl2br_(esc_(order.customer.address))],
    ]) +
    progressSteps_(1) +
    '<div style="text-align:center;margin:28px 0 8px;">' +
      button_('💬 สอบถามข้อมูลทาง LINE', CONFIG.LINE_URL, '#06C755') +
    '</div>' +
    small_('หากมีข้อสงสัยเพิ่มเติม สามารถตอบกลับอีเมลนี้ หรือติดต่อเราได้ทาง LINE Official ครับ');

  sendMail_({
    to: order.customer.email,
    subject: 'ยืนยันการสั่งจองสินค้า #' + order.orderId + ' — ' + CONFIG.SHOP_NAME,
    html: layout_('ยืนยันการสั่งจองสินค้า #' + order.orderId + ' เรียบร้อยแล้ว', body),
    replyTo: getAdminEmail_(),
  });
}

// 2. อีเมลแจ้งเตือนแอดมินเมื่อมีออเดอร์ใหม่ (แนบสลิปจริง)
function sendAdminNewOrder_(order, slip, ss, sheet, row, customerEmailError) {
  const admin = getAdminEmail_();
  if (!admin) throw new Error('ไม่พบอีเมลแอดมิน');

  const warnings = [];
  if (slip.error) warnings.push('บันทึกสลิปไม่สำเร็จ: ' + slip.error);
  if (!slip.url && !slip.error && (!order.slipLink || order.slipLink === '-')) warnings.push('ออเดอร์นี้ไม่มีสลิปแนบมา');
  if (!isEmail_(order.customer.email)) warnings.push('ลูกค้าไม่มีอีเมล จึงไม่ได้ส่งอีเมลยืนยัน');
  if (customerEmailError) warnings.push('ส่งอีเมลยืนยันถึงลูกค้าไม่สำเร็จ: ' + customerEmailError);

  const sheetUrl = ss.getUrl() + '#gid=' + sheet.getSheetId() + '&range=A' + row;
  const willAttach = CONFIG.ATTACH_SLIP_TO_ADMIN_EMAIL && slip.blob;

  const body =
    h1_('📦 มีออเดอร์ใหม่เข้ามาแล้ว!') +
    orderMetaBox_(order, 'PENDING') +
    (warnings.length ? warningBox_(warnings) : '') +
    sectionTitle_('ข้อมูลลูกค้า') +
    infoTable_([
      ['ชื่อลูกค้า', esc_(order.customer.name)],
      ['อีเมล', order.customer.email ? '<a href="mailto:' + esc_(order.customer.email) + '" style="color:' + BRAND.PRIMARY + ';">' + esc_(order.customer.email) + '</a>' : '-'],
      ['เบอร์โทร', '<a href="tel:' + esc_(order.customer.phone.replace(/[^\d+]/g, '')) + '" style="color:' + BRAND.PRIMARY + ';">' + esc_(order.customer.phone) + '</a>'],
      ['ที่อยู่จัดส่ง', nl2br_(esc_(order.customer.address))],
      ['User ID', '<span style="color:' + BRAND.MUTED + ';font-size:12px;">' + esc_(order.uid || '-') + '</span>'],
    ]) +
    dentzItemsTable_(order) +
    '<div style="text-align:center;margin:28px 0 8px;">' +
      (slip.url ? button_('🔍 เปิดดูสลิปโอนเงิน', slip.url, BRAND.PRIMARY) + '&nbsp;&nbsp;' : '') +
      button_('📊 เปิดดูใน Google Sheet', sheetUrl, '#1e6b35') +
    '</div>' +
    (willAttach ? small_('📎 แนบไฟล์ภาพสลิปมาพร้อมอีเมลนี้แล้ว') : '') +
    small_('เมื่อตรวจสอบสลิปเรียบร้อยแล้ว ให้เปลี่ยนคอลัมน์ "สถานะ" ในชีทเป็น <b>' + STATUS.PAID + '</b> ระบบจะส่งอีเมลแจ้งลูกค้าให้อัตโนมัติ');

  sendMail_({
    to: admin,
    cc: CONFIG.ADMIN_CC || '',
    subject: '📦 ออเดอร์ใหม่ #' + order.orderId + ' • ฿' + money_(order.netTotal) + ' • ' + order.customer.name + ' (DENT-Z)',
    html: layout_('ออเดอร์ใหม่จาก ' + order.customer.name + ' ยอด ฿' + money_(order.netTotal), body),
    replyTo: isEmail_(order.customer.email) ? order.customer.email : '',
    attachments: willAttach ? [slip.blob] : [],
  });
}

// 3. อีเมลแจ้งเปลี่ยนสถานะคำสั่งซื้อ (PAID, SHIPPED, CANCELLED)
function sendStatusEmail_(order, key) {
  let subject, preheader, body;

  if (key === 'PAID') {
    subject = 'ยืนยันการชำระเงินเรียบร้อย #' + order.orderId + ' — ' + CONFIG.SHOP_NAME;
    preheader = 'เราตรวจสอบและยืนยันยอดเงินคำสั่งจอง #' + order.orderId + ' เรียบร้อยแล้ว';
    body =
      h1_('ยืนยันการชำระเงินเรียบร้อยแล้ว ✨') +
      p_('สวัสดีครับคุณ <b>' + esc_(order.customer.name) + '</b>') +
      p_('ทีมงาน DENT-Z ได้ตรวจสอบและยืนยันการชำระเงินของคุณเรียบร้อยแล้ว ขณะนี้ทีมงานกำลังจัดเตรียมแพ็กเกจสินค้าอย่างพิถีพิถัน เมื่อเริ่มจัดส่งแล้วจะแจ้งเลขพัสดุให้ทราบทางอีเมลนี้ครับ') +
      orderMetaBox_(order, 'PAID') +
      dentzItemsTable_(order) +
      progressSteps_(2);
  } else if (key === 'SHIPPED') {
    const trackUrl = trackingUrl_(order.tracking);
    subject = 'สินค้าของคุณจัดส่งแล้ว 🚚 #' + order.orderId + ' — ' + CONFIG.SHOP_NAME;
    preheader = 'เลขพัสดุของคุณคือ ' + order.tracking;
    body =
      h1_('สินค้า DENT-Z ของคุณออกเดินทางแล้ว 🚚') +
      p_('สวัสดีครับคุณ <b>' + esc_(order.customer.name) + '</b>') +
      p_('คำสั่งจองสินค้าของคุณถูกบรรจุและจัดส่งเรียบร้อยแล้ว สามารถติดตามสถานะพัสดุได้ด้วยเลขด้านล่างนี้ครับ') +
      '<div style="background:' + BRAND.LIGHT_BG + ';border:2px dashed #86efac;border-radius:16px;padding:22px;text-align:center;margin:22px 0;">' +
        '<div style="font-size:12px;color:' + BRAND.MUTED + ';letter-spacing:1px;font-weight:bold;">เลขพัสดุจัดส่ง (TRACKING NUMBER)</div>' +
        '<div style="font-family:Consolas,Menlo,monospace;font-size:26px;font-weight:bold;color:' + BRAND.PRIMARY + ';letter-spacing:3px;margin:8px 0;">' + esc_(order.tracking) + '</div>' +
        (trackUrl ? '<div style="margin-top:14px;">' + button_('📍 ตรวจสอบสถานะพัสดุ', trackUrl, BRAND.PRIMARY) + '</div>' : '<div style="font-size:12px;color:' + BRAND.MUTED + ';margin-top:8px;">สามารถนำเลขพัสดุไปตรวจสอบได้ที่เว็บไซต์ของบริษัทขนส่ง</div>') +
      '</div>' +
      orderMetaBox_(order, 'SHIPPED') +
      dentzItemsTable_(order) +
      sectionTitle_('จัดส่งไปยัง') +
      infoTable_([
        ['ชื่อผู้รับ', esc_(order.customer.name)],
        ['ที่อยู่', nl2br_(esc_(order.customer.address))],
      ]) +
      progressSteps_(3) +
      p_('ขอขอบคุณที่ร่วมเป็นส่วนหนึ่งในการสนับสนุนนวัตกรรมยาสีฟัน DENT-Z ครับ 🦷✨');
  } else if (key === 'CANCELLED') {
    subject = 'คำสั่งจองสินค้า #' + order.orderId + ' ถูกยกเลิก — ' + CONFIG.SHOP_NAME;
    preheader = 'แจ้งยกเลิกคำสั่งจองสินค้า #' + order.orderId;
    body =
      h1_('แจ้งยกเลิกคำสั่งจองสินค้า') +
      p_('สวัสดีครับคุณ <b>' + esc_(order.customer.name) + '</b>') +
      p_('คำสั่งจองสินค้าตามรายละเอียดด้านล่างนี้ถูกยกเลิกแล้ว หากท่านได้โอนเงินมาแล้ว ทีมงานจะติดต่อกลับเพื่อประสานงานคืนเงิน หรือสามารถทักติดต่อเราได้ทันทีทาง LINE') +
      orderMetaBox_(order, 'CANCELLED') +
      dentzItemsTable_(order) +
      '<div style="text-align:center;margin:28px 0 8px;">' +
        button_('💬 ติดต่อเราทาง LINE', CONFIG.LINE_URL, '#06C755') +
      '</div>';
  } else {
    return;
  }

  body += small_('มีข้อสงสัยเกี่ยวกับคำสั่งจอง ตอบกลับอีเมลนี้ได้ตลอดเวลาครับ');
  sendMail_({
    to: order.customer.email,
    subject: subject,
    html: layout_(preheader, body),
    replyTo: getAdminEmail_()
  });
}

// 4. อีเมลยืนยันการรับข้อความปรึกษาปัญหาผิวรอบปาก (Consultation)
function sendCustomerConsultConfirmation_(c) {
  const body =
    h1_('ได้รับข้อความปรึกษาปัญหาของคุณแล้ว 💡') +
    p_('สวัสดีครับคุณ <b>' + esc_(c.name) + '</b>') +
    p_('ทีมงาน DENT-Z ได้รับข้อความปรึกษาปัญหาผิวรอบปากและช่องปากของคุณเรียบร้อยแล้ว ทีมเภสัชกรและทันตแพทย์ของเราจะรีบตรวจสอบและตอบกลับคำแนะนำให้คุณทางอีเมลนี้โดยเร็วที่สุดครับ') +
    '<div style="background:#f8fafc;border-left:4px solid ' + BRAND.PRIMARY + ';padding:16px 20px;border-radius:8px;margin:20px 0;">' +
      '<div style="font-size:12px;color:' + BRAND.MUTED + ';font-weight:bold;margin-bottom:6px;">ข้อความที่คุณส่งมา:</div>' +
      '<div style="font-size:14px;color:#334155;line-height:1.6;">' + nl2br_(esc_(c.message)) + '</div>' +
    '</div>' +
    '<div style="text-align:center;margin:24px 0 8px;">' +
      button_('💬 ปรึกษาเพิ่มเติมผ่าน LINE OA', CONFIG.LINE_URL, '#06C755') +
    '</div>' +
    small_('ด้วยความเคารพอย่างสูง, ทีมงาน DENT-Z');

  sendMail_({
    to: c.email,
    subject: 'DENT-Z: ได้รับข้อความปรึกษาปัญหาของคุณแล้ว #' + c.consultId,
    html: layout_('ได้รับข้อความปรึกษาของคุณแล้ว', body),
    replyTo: getAdminEmail_(),
  });
}

function sendAdminNewConsult_(c) {
  const admin = getAdminEmail_();
  if (!admin) return;

  const body =
    h1_('💡 มีข้อความปรึกษาใหม่จากลูกค้า (DENT-Z)') +
    infoTable_([
      ['รหัส', esc_(c.consultId)],
      ['ชื่อผู้ปรึกษา', esc_(c.name)],
      ['อีเมล', '<a href="mailto:' + esc_(c.email) + '">' + esc_(c.email) + '</a>'],
      ['ปัญหา/อาการ', nl2br_(esc_(c.message))],
    ]) +
    '<div style="text-align:center;margin:24px 0 8px;">' +
      button_('📧 ตอบกลับลูกค้าทันที', 'mailto:' + encodeURIComponent(c.email) + '?subject=' + encodeURIComponent('คำแนะนำจาก DENT-Z สำหรับคุณ ' + c.name), BRAND.PRIMARY) +
    '</div>';

  sendMail_({
    to: admin,
    subject: '💡 มีข้อความปรึกษาใหม่จาก: ' + c.name + ' (DENT-Z)',
    html: layout_('มีข้อความปรึกษาใหม่จาก ' + c.name, body),
    replyTo: isEmail_(c.email) ? c.email : '',
  });
}

function notifyAdminOfError_(err, data) {
  try {
    const admin = getAdminEmail_();
    if (!admin) return;
    const body =
      h1_('⚠️ ระบบรับออเดอร์พบข้อผิดพลาด') +
      p_('ระบบไม่สามารถบันทึกออเดอร์นี้ได้โดยสมบูรณ์ กรุณาตรวจสอบข้อมูลลูกค้าและสลิป') +
      warningBox_([String(err.message)]) +
      infoTable_([
        ['ชื่อ', esc_(data && data.name || '-')],
        ['อีเมล', esc_(data && data.email || '-')],
        ['เบอร์โทร', esc_(data && data.phone || '-')],
        ['ยอดเงิน', '฿' + money_(Number(data && data.net_total || data.totalPrice || 0))],
      ]);
    sendMail_({
      to: admin,
      subject: '⚠️ ' + CONFIG.SHOP_NAME + ': รับออเดอร์ไม่สำเร็จ',
      html: layout_('รับออเดอร์ไม่สำเร็จ', body)
    });
  } catch (e) {
    logError_('notifyAdminOfError', e);
  }
}

// ---------- ส่วนประกอบ Template อีเมล ----------

function layout_(preheader, inner) {
  const year = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy');
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:' + BRAND.BG + ';font-family:sans-serif;">' +
    '<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">' + esc_(preheader) + '</span>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + BRAND.BG + ';padding:24px 12px;"><tr><td align="center">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);border:1px solid ' + BRAND.BORDER + ';">' +
    '<tr><td style="background:' + BRAND.HEADER_BG + ';padding:32px 30px;text-align:center;">' +
      '<div style="font-size:32px;font-weight:900;letter-spacing:3px;color:#ffffff;font-family:sans-serif;">DENT-Z</div>' +
      '<div style="font-size:12px;color:#86efac;letter-spacing:1px;margin-top:6px;text-transform:uppercase;font-weight:600;">HYDROXYAPATITE TOOTHPASTE & ORAL CARE</div>' +
    '</td></tr>' +
    '<tr><td style="padding:32px 28px;font-size:15px;line-height:1.7;color:#334155;">' + inner + '</td></tr>' +
    '<tr><td style="background:' + BRAND.LIGHT_BG + ';padding:22px 28px;text-align:center;font-size:12px;color:' + BRAND.MUTED + ';border-top:1px solid #dcfce7;line-height:1.8;">' +
      '<a href="' + CONFIG.LINE_URL + '" style="color:' + BRAND.PRIMARY + ';text-decoration:none;font-weight:bold;">LINE Official</a> &nbsp;·&nbsp; ' +
      '<a href="' + CONFIG.FACEBOOK_URL + '" style="color:' + BRAND.PRIMARY + ';text-decoration:none;font-weight:bold;">Facebook Page</a> &nbsp;·&nbsp; ' +
      '<a href="' + CONFIG.WEBSITE_URL + '" style="color:' + BRAND.PRIMARY + ';text-decoration:none;font-weight:bold;">เยี่ยมชมเว็บไซต์</a><br>' +
      '© ' + year + ' ' + esc_(CONFIG.SHOP_NAME) + ' — นวัตกรรมยาสีฟันเพื่อสุขภาพช่องปากและรอยยิ้มที่มั่นใจ' +
    '</td></tr></table></td></tr></table></body></html>';
}

function h1_(t) { return '<h1 style="font-size:22px;font-weight:bold;color:' + BRAND.DARK + ';margin:0 0 16px;">' + t + '</h1>'; }
function p_(t) { return '<p style="margin:0 0 12px;color:#334155;">' + t + '</p>'; }
function small_(t) { return '<p style="margin:16px 0 0;font-size:12px;color:' + BRAND.MUTED + ';text-align:center;">' + t + '</p>'; }
function sectionTitle_(t) { return '<div style="font-size:13px;font-weight:bold;letter-spacing:1px;color:' + BRAND.PRIMARY + ';text-transform:uppercase;margin:26px 0 10px;">' + t + '</div>'; }

function button_(label, url, bg) {
  return '<a href="' + esc_(url) + '" target="_blank" style="display:inline-block;background:' + bg + ';color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 26px;border-radius:999px;margin:4px 0;box-shadow:0 4px 12px rgba(0,0,0,0.1);">' + label + '</a>';
}

function badge_(key) {
  const c = STATUS_COLORS[key] || STATUS_COLORS.PENDING;
  return '<span style="display:inline-block;background:' + c.bg + ';color:' + c.fg + ';font-size:12px;font-weight:bold;padding:5px 14px;border-radius:999px;">' + esc_(STATUS[key] || '') + '</span>';
}

function orderMetaBox_(order, key) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + BRAND.LIGHT_BG + ';border:1px solid #bbf7d0;border-radius:14px;margin:20px 0;"><tr>' +
    '<td style="padding:16px 18px;"><div style="font-size:12px;color:' + BRAND.MUTED + ';">เลขที่คำสั่งซื้อ</div><div style="font-size:17px;font-weight:bold;color:' + BRAND.PRIMARY + ';letter-spacing:.5px;">#' + esc_(order.orderId) + '</div></td>' +
    '<td style="padding:16px 18px;"><div style="font-size:12px;color:' + BRAND.MUTED + ';">วันที่สั่งจอง</div><div style="font-size:14px;color:#1e293b;">' + esc_(thaiDate_(order.createdAt)) + '</div></td>' +
    '<td style="padding:16px 18px;text-align:right;">' + badge_(key) + '</td>' +
    '</tr></table>';
}

function dentzItemsTable_(order) {
  return sectionTitle_('รายละเอียดการสั่งจอง & ยอดสนับสนุน') +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse;">' +
      '<tr>' +
        '<td style="padding:10px 0;border-bottom:1px solid ' + BRAND.BORDER + ';"><b>แพ็กเกจที่เลือก:</b></td>' +
        '<td style="padding:10px 0;border-bottom:1px solid ' + BRAND.BORDER + ';text-align:right;">' + esc_(order.package) + ' (× ' + (order.quantity || 1) + ')</td>' +
      '</tr>' +
      (order.donate > 0 ?
      '<tr>' +
        '<td style="padding:10px 0;border-bottom:1px solid ' + BRAND.BORDER + ';color:' + BRAND.GOLD + ';"><b>เงินสมทบทุนโครงการ:</b></td>' +
        '<td style="padding:10px 0;border-bottom:1px solid ' + BRAND.BORDER + ';text-align:right;font-weight:bold;color:' + BRAND.GOLD + ';">+ ฿' + money_(order.donate) + '</td>' +
      '</tr>' : '') +
      '<tr>' +
        '<td style="padding:14px 0 0;font-size:16px;font-weight:bold;color:' + BRAND.DARK + ';">ยอดโอนสุทธิ</td>' +
        '<td style="padding:14px 0 0;text-align:right;font-weight:bold;font-size:20px;color:' + BRAND.PRIMARY + ';">฿' + money_(order.netTotal) + '</td>' +
      '</tr>' +
    '</table>';
}

function infoTable_(pairs) {
  let rows = '';
  pairs.forEach(function (p) {
    rows += '<tr><td style="padding:8px 12px 8px 0;color:' + BRAND.MUTED + ';font-size:13px;width:110px;vertical-align:top;white-space:nowrap;">' + p[0] + '</td>' +
      '<td style="padding:8px 0;font-size:14px;color:#1e293b;vertical-align:top;">' + p[1] + '</td></tr>';
  });
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + rows + '</table>';
}

function warningBox_(lines) {
  return '<div style="background:#fff7e6;border:1px solid #f3d38b;border-radius:12px;padding:14px 16px;margin:16px 0;font-size:13px;color:#7a5200;">' +
    lines.map(function (l) { return '⚠️ ' + esc_(l); }).join('<br>') + '</div>';
}

function progressSteps_(current) {
  const steps = ['1. ตรวจสอบสลิป', '2. เตรียมสินค้า', '3. จัดส่ง & แจ้งเลขพัสดุ'];
  let cells = '';
  steps.forEach(function (label, i) {
    const n = i + 1;
    const done = n < current;
    const active = n === current;
    const circleBg = done ? '#166534' : (active ? '#22c55e' : '#e2e8f0');
    const circleFg = done || active ? '#ffffff' : '#94a3b8';
    cells += '<td style="text-align:center;width:33%;vertical-align:top;padding:0 4px;">' +
      '<div style="display:inline-block;width:30px;height:30px;line-height:30px;border-radius:50%;background:' + circleBg + ';color:' + circleFg + ';font-weight:bold;font-size:13px;">' + (done ? '✓' : n) + '</div>' +
      '<div style="font-size:12px;margin-top:6px;color:' + (active ? BRAND.PRIMARY : BRAND.MUTED) + ';font-weight:' + (active ? 'bold' : 'normal') + ';">' + label + '</div>' +
      '</td>';
  });
  return sectionTitle_('ขั้นตอนการดำเนินการ') + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 20px;"><tr>' + cells + '</tr></table>';
}

function trackingUrl_(tracking) {
  const t = String(tracking || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!t) return '';
  if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(t)) return 'https://track.thailandpost.co.th/?trackNumber=' + encodeURIComponent(t);
  if (/^(TH|FL|KEX|SPX)/i.test(t)) return 'https://www.flashexpress.co.th/tracking/?se=' + encodeURIComponent(t);
  return 'https://track.thailandpost.co.th/?trackNumber=' + encodeURIComponent(t);
}

// ============================================================================
// 8) SYNC: DASHBOARD & USER PROFILES
// ============================================================================

function syncAll() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    toast_('ระบบกำลังประมวลผลอยู่ กรุณารอสักครู่', '⏳ กำลัง Sync', 5);
    return;
  }
  try {
    const ss = getSs_();
    const sheet = ensureOrdersSheet_(ss);
    const orders = readOrders_(sheet);

    // ดึง Quiz Results & Users หากมี
    const quizSheet = ss.getSheetByName(SHEETS.QUIZ);
    const quizRows = quizSheet && quizSheet.getLastRow() > 1 ? quizSheet.getDataRange().getValues().slice(1) : [];
    const userSheet = ss.getSheetByName(SHEETS.CUSTOMERS);
    const userRows = userSheet && userSheet.getLastRow() > 1 ? userSheet.getDataRange().getValues().slice(1) : [];

    buildCustomers_(ss, orders, userRows, quizRows);
    buildSummary_(ss, orders, quizRows, userRows);

    toast_('อัปเดต Dashboard และ User Profiles สำเร็จ (' + orders.length + ' ออเดอร์)', '✅ Sync สำเร็จ', 4);
  } catch (err) {
    logError_('syncAll', err);
    toast_('Sync ไม่สำเร็จ: ' + err.message, '❌ Error', 8);
    throw err;
  } finally {
    lock.releaseLock();
  }
}

function syncData() { syncAll(); }

function readOrders_(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const values = sheet.getRange(2, 1, last - 1, NUM_COLS).getValues();
  const slipFormulas = sheet.getRange(2, COL.SLIP, last - 1, 1).getFormulas();
  const out = [];

  values.forEach(function (row, i) {
    if (!row[COL.NAME - 1] && !row[COL.EMAIL - 1] && !row[COL.PACKAGE - 1] && !row[COL.ORDER_ID - 1]) return;
    out.push(rowToOrder_(row, i + 2, slipFormulas[i] ? slipFormulas[i][0] : ''));
  });
  return out;
}

function rowToOrder_(row, rowIndex, slipFormula) {
  const status = str_(row[COL.STATUS - 1], 100);
  return {
    row: rowIndex,
    orderId: str_(row[COL.ORDER_ID - 1], 50),
    createdAt: toDate_(row[COL.TIMESTAMP - 1]),
    customer: {
      name: str_(row[COL.NAME - 1], 200),
      phone: normalizePhone_(row[COL.PHONE - 1]),
      email: str_(row[COL.EMAIL - 1], 200),
      address: str_(row[COL.ADDRESS - 1], 2000),
    },
    package: str_(row[COL.PACKAGE - 1], 150),
    quantity: Math.max(1, Number(row[COL.QTY - 1]) || 1),
    netTotal: Number(row[COL.TOTAL - 1]) || 0,
    donate: Number(row[COL.DONATE - 1]) || 0,
    uid: str_(row[COL.UID - 1], 128),
    status: status,
    statusKey: statusKey_(status),
    tracking: str_(row[COL.TRACKING - 1], 100),
    note: str_(row[COL.NOTE - 1], 500),
    emailLog: String(row[COL.EMAIL_LOG - 1] || ''),
    slipUrl: extractUrl_(slipFormula) || str_(row[COL.SLIP - 1], 500),
  };
}

// สร้างชีท 👤 User Profiles (จัดระดับผู้สนับสนุน VIP/VVIP)
function buildCustomers_(ss, orders, userRows, quizRows) {
  const sheet = getOrCreateSheet_(ss, SHEETS.CUSTOMERS, '#4285f4');
  const map = {};

  // แมป Quiz Type จาก Quiz Results
  const uidToQuiz = {};
  const emailToQuiz = {};
  (quizRows || []).forEach(function (qr) {
    const qUid = qr[0];
    const qType = qr[2];
    if (qUid && qType) uidToQuiz[qUid] = qType;
  });
  (userRows || []).forEach(function (ur) {
    const uUid = ur[0];
    const uEmail = ur[2];
    const uType = ur[3];
    if (uUid && uType) uidToQuiz[uUid] = uType;
    if (uEmail && uType) emailToQuiz[String(uEmail).toLowerCase()] = uType;
  });

  orders.forEach(function (o) {
    const key = (o.customer.email || '').toLowerCase() || o.uid || o.customer.phone;
    if (!key) return;
    if (!map[key]) {
      map[key] = {
        name: '',
        email: o.customer.email,
        phone: '',
        orders: 0,
        spent: 0,
        donated: 0,
        first: null,
        last: null,
        packages: {},
        quizType: uidToQuiz[o.uid] || emailToQuiz[(o.customer.email || '').toLowerCase()] || '-'
      };
    }
    const c = map[key];
    if (!c.last || (o.createdAt && o.createdAt >= c.last)) {
      c.name = o.customer.name || c.name;
      c.phone = o.customer.phone || c.phone;
    }
    if (o.createdAt) {
      if (!c.first || o.createdAt < c.first) c.first = o.createdAt;
      if (!c.last || o.createdAt > c.last) c.last = o.createdAt;
    }
    if (o.statusKey === 'CANCELLED') return;
    c.orders += 1;
    c.spent += o.netTotal;
    c.donated += o.donate;
    if (o.package) {
      c.packages[o.package] = (c.packages[o.package] || 0) + o.quantity;
    }
  });

  const headers = [
    '👤 ชื่อลูกค้า',
    '📧 อีเมล',
    '📞 เบอร์โทร',
    '📦 จำนวนครั้งที่สั่งจอง',
    '💰 ยอดสนับสนุนรวม (฿)',
    '❤️ เงินสมทบทุนสะสม (฿)',
    '⭐ ระดับผู้สนับสนุน (Tier)',
    '🗓️ สั่งจองครั้งแรก',
    '🕒 สั่งจองล่าสุด',
    '🎁 แพ็กเกจที่ชื่นชอบ',
    '🧠 ผลทดสอบ (Quiz Type)'
  ];

  const rows = Object.keys(map).map(function (k) {
    const c = map[k];
    let tier = '🤍 Supporter';
    if (c.spent >= CONFIG.VVIP_THRESHOLD) tier = '👑 VVIP Supporter';
    else if (c.spent >= CONFIG.VIP_THRESHOLD) tier = '💚 VIP Supporter';

    return [
      c.name,
      c.email,
      c.phone ? "'" + c.phone : '',
      c.orders,
      c.spent,
      c.donated,
      tier,
      c.first || '',
      c.last || '',
      topKey_(c.packages),
      c.quizType
    ];
  });
  rows.sort(function (a, b) { return b[4] - a[4]; });

  sheet.clear();
  const headRange = sheet.getRange(1, 1, 1, headers.length);
  headRange.setValues([headers]);
  headRange.setBackground(BRAND.DARK);
  headRange.setFontColor('#ffffff');
  headRange.setFontWeight('bold');
  headRange.setHorizontalAlignment('center');
  headRange.setVerticalAlignment('middle');
  headRange.setWrap(true);
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(2, 1, rows.length, headers.length).setVerticalAlignment('middle');
    sheet.getRange(2, 5, rows.length, 2).setNumberFormat('฿#,##0.00');
    sheet.getRange(2, 8, rows.length, 2).setNumberFormat('dd/MM/yyyy HH:mm');
    sheet.getRange(2, 4, rows.length, 1).setHorizontalAlignment('center');
    sheet.getRange(2, 7, rows.length, 1).setHorizontalAlignment('center');
  }
  [180, 220, 130, 150, 160, 160, 160, 150, 150, 200, 180].forEach(function (w, i) {
    sheet.setColumnWidth(i + 1, w);
  });
  sheet.getRange(1, 1).setNote('ชีทนี้สร้างอัตโนมัติจากชีท 📦 Orders ทุกครั้งที่กด Sync (ออเดอร์ที่ยกเลิกไม่ถูกนับยอด)');
}

// สร้างชีท 📊 Summary (Dashboard ครบวงจรพร้อมกราฟ)
function buildSummary_(ss, orders, quizRows, userRows) {
  const sheet = getOrCreateSheet_(ss, SHEETS.SUMMARY, '#0f9d58');
  sheet.getCharts().forEach(function (ch) { sheet.removeChart(ch); });
  sheet.clear();
  sheet.setHiddenGridlines(true);

  const tz = CONFIG.TIMEZONE;
  const now = new Date();
  const todayKey = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const monthKey = Utilities.formatDate(now, tz, 'yyyy-MM');

  const valid = orders.filter(function (o) { return o.statusKey !== 'CANCELLED'; });
  const revenue = sum_(valid, 'netTotal');
  const donations = sum_(valid, 'donate');
  const itemsSold = sum_(valid, 'quantity');

  const customerKeys = {};
  const repeatCounter = {};
  valid.forEach(function (o) {
    const k = (o.customer.email || '').toLowerCase() || o.uid || o.customer.phone;
    if (!k) return;
    customerKeys[k] = true;
    repeatCounter[k] = (repeatCounter[k] || 0) + 1;
  });
  const totalCustomers = Object.keys(customerKeys).length;
  const repeatCustomers = Object.keys(repeatCounter).filter(function (k) { return repeatCounter[k] > 1; }).length;

  const todayOrders = valid.filter(function (o) { return o.createdAt && Utilities.formatDate(o.createdAt, tz, 'yyyy-MM-dd') === todayKey; });
  const monthOrders = valid.filter(function (o) { return o.createdAt && Utilities.formatDate(o.createdAt, tz, 'yyyy-MM') === monthKey; });

  // 1. หัวข้อ Dashboard
  sheet.getRange('B2').setValue('📊 ' + CONFIG.SHOP_NAME + ' — Executive Dashboard');
  sheet.getRange('B2').setFontSize(20);
  sheet.getRange('B2').setFontWeight('bold');
  sheet.getRange('B2').setFontColor(BRAND.DARK);

  sheet.getRange('B3').setValue('อัปเดตล่าสุด: ' + thaiDate_(now) + '   •   ข้อมูลยอดขายไม่รวมออเดอร์ที่ยกเลิก');
  sheet.getRange('B3').setFontColor(BRAND.MUTED);
  sheet.getRange('B3').setFontSize(10);

  // 2. ตาราง KPI (ฝั่งซ้าย)
  let r = 5;
  r = writeBlock_(sheet, r, 2, '💰 ภาพรวมยอดสนับสนุน & การเงิน', ['ตัวชี้วัด', 'ค่า'], [
    ['ยอดสนับสนุนรวมทั้งหมด', revenue],
    ['ยอดเงินสมทบทุนโครงการรวม', donations],
    ['ยอดสนับสนุนเดือนนี้', sum_(monthOrders, 'netTotal')],
    ['ยอดสนับสนุนวันนี้', sum_(todayOrders, 'netTotal')],
    ['ยอดเฉลี่ยต่อคำสั่งจอง', valid.length ? revenue / valid.length : 0],
    ['จำนวนคำสั่งจองทั้งหมด', valid.length],
    ['จำนวนชิ้นที่สั่งจองสะสม', itemsSold],
    ['ผู้สนับสนุนทั้งหมด', totalCustomers],
    ['ผู้สนับสนุนที่สั่งซื้อซ้ำ', repeatCustomers],
  ], function (range) {
    range.offset(0, 1, 5, 1).setNumberFormat('฿#,##0.00');
    range.offset(5, 1, 4, 1).setNumberFormat('#,##0');
  });

  // 3. ตารางสถานะคำสั่งซื้อ
  const statusRows = STATUS_LIST.map(function (s) {
    const key = statusKey_(s);
    const list = orders.filter(function (o) { return o.statusKey === key; });
    return [s, list.length, sum_(list, 'netTotal')];
  });
  const noStatus = orders.filter(function (o) { return !o.statusKey; });
  if (noStatus.length) statusRows.push(['⚪ ยังไม่ระบุสถานะ (ออเดอร์เดิม)', noStatus.length, sum_(noStatus, 'netTotal')]);
  r = writeBlock_(sheet, r + 1, 2, '🚦 สถานะคำสั่งจอง', ['สถานะ', 'จำนวน', 'ยอดเงิน'], statusRows, function (range) {
    range.offset(0, 2, statusRows.length, 1).setNumberFormat('฿#,##0.00');
  });

  // 4. ตารางยอดขายรายเดือน (12 เดือนล่าสุด)
  const months = {};
  valid.forEach(function (o) {
    if (!o.createdAt) return;
    const k = Utilities.formatDate(o.createdAt, tz, 'yyyy-MM');
    if (!months[k]) months[k] = { orders: 0, qty: 0, revenue: 0, donate: 0 };
    months[k].orders += 1;
    months[k].qty += o.quantity;
    months[k].revenue += o.netTotal;
    months[k].donate += o.donate;
  });
  const monthRows = Object.keys(months).sort().slice(-12).map(function (k) {
    const parts = k.split('-');
    return [
      TH_MONTHS[parseInt(parts[1], 10) - 1] + ' ' + (parseInt(parts[0], 10) + 543),
      months[k].orders,
      months[k].qty,
      months[k].revenue
    ];
  });
  const monthStart = r + 1;
  r = writeBlock_(sheet, monthStart, 2, '📅 ยอดสนับสนุนรายเดือน (12 เดือนล่าสุด)', ['เดือน', 'ออเดอร์', 'ชิ้น', 'ยอดเงิน'],
    monthRows.length ? monthRows : [['ยังไม่มีข้อมูล', '', '', '']], function (range) {
      if (monthRows.length) range.offset(0, 3, monthRows.length, 1).setNumberFormat('฿#,##0.00');
    });

  // 5. แพ็กเกจยอดนิยม (ฝั่งขวา)
  const pkgTally = {};
  valid.forEach(function (o) {
    const p = o.package || 'ไม่ระบุแพ็กเกจ';
    pkgTally[p] = (pkgTally[p] || 0) + o.quantity;
  });
  const totalPkgs = Object.keys(pkgTally).reduce(function (s, k) { return s + pkgTally[k]; }, 0);
  const pkgRows = Object.keys(pkgTally).sort(function (a, b) { return pkgTally[b] - pkgTally[a]; })
    .map(function (k) { return [k, pkgTally[k], totalPkgs ? pkgTally[k] / totalPkgs : 0]; });

  let rr = 5;
  rr = writeBlock_(sheet, rr, 7, '🎁 แพ็กเกจที่ได้รับความนิยม', ['แพ็กเกจ', 'จำนวนชิ้น', 'สัดส่วน'],
    pkgRows.length ? pkgRows : [['ยังไม่มีข้อมูล', '', '']], function (range) {
      if (pkgRows.length) range.offset(0, 2, pkgRows.length, 1).setNumberFormat('0.0%');
    }) + 1;

  // 6. ข้อมูลผู้ใช้และแบบทดสอบ (ฝั่งขวา)
  const totalUsers = (userRows || []).length;
  const totalQuiz = (quizRows || []).length;
  const typeCounts = {};
  (quizRows || []).forEach(function (qr) {
    if (qr[2]) typeCounts[qr[2]] = (typeCounts[qr[2]] || 0) + 1;
  });
  const quizRowsData = Object.entries(typeCounts).sort(function (a, b) { return b[1] - a[1]; })
    .map(function (entry) { return [entry[0], entry[1], totalQuiz ? entry[1] / totalQuiz : 0]; });

  rr = writeBlock_(sheet, rr, 7, '🧠 สถิติผลแบบทดสอบช่องปาก (Quiz)', ['บุคลิกภาพ / Type', 'จำนวนคน', 'สัดส่วน'],
    quizRowsData.length ? quizRowsData : [['ยังไม่มีข้อมูลแบบทดสอบ', totalUsers, 1]], function (range) {
      if (quizRowsData.length) range.offset(0, 2, quizRowsData.length, 1).setNumberFormat('0.0%');
    });

  [20, 240, 110, 110, 130, 30, 240, 100, 100].forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });

  // 7. กราฟแท่งยอดสนับสนุนรายเดือน
  if (monthRows.length) {
    const chart = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(sheet.getRange(monthStart + 1, 2, monthRows.length + 1, 1))
      .addRange(sheet.getRange(monthStart + 1, 5, monthRows.length + 1, 1))
      .setNumHeaders(1)
      .setPosition(Math.max(r, rr) + 2, 2, 0, 0)
      .setOption('title', 'ยอดสนับสนุนรายเดือน (฿)')
      .setOption('legend', { position: 'none' })
      .setOption('colors', [BRAND.PRIMARY])
      .setOption('width', 750)
      .setOption('height', 320)
      .build();
    sheet.insertChart(chart);
  }
}

function writeBlock_(sheet, row, col, title, header, rows, formatFn) {
  const width = header.length;
  sheet.getRange(row, col, 1, width).merge().setValue(title);
  sheet.getRange(row, col, 1, width).setFontWeight('bold');
  sheet.getRange(row, col, 1, width).setFontSize(12);
  sheet.getRange(row, col, 1, width).setFontColor('#ffffff');
  sheet.getRange(row, col, 1, width).setBackground(BRAND.PRIMARY);

  sheet.getRange(row + 1, col, 1, width).setValues([header]);
  sheet.getRange(row + 1, col, 1, width).setFontWeight('bold');
  sheet.getRange(row + 1, col, 1, width).setBackground('#e2f1e7');
  sheet.getRange(row + 1, col, 1, width).setFontColor(BRAND.DARK);

  const padded = rows.map(function (r) {
    const x = r.slice(0, width);
    while (x.length < width) x.push('');
    return x;
  });
  const body = sheet.getRange(row + 2, col, padded.length, width);
  body.setValues(padded);
  body.setBackground('#ffffff');
  sheet.getRange(row + 1, col, padded.length + 1, width)
    .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  if (width > 1) sheet.getRange(row + 2, col + 1, padded.length, width - 1).setHorizontalAlignment('right');
  if (formatFn) formatFn(body);
  return row + 2 + padded.length;
}

// ============================================================================
// 9) DAILY SUMMARY EMAIL (สรุปยอดประจำวันส่งเข้าอีเมลแอดมิน)
// ============================================================================

function sendDailySummary() {
  if (!CONFIG.DAILY_SUMMARY_ENABLED) return;
  try {
    const ss = getSs_();
    const orders = readOrders_(ensureOrdersSheet_(ss));
    const tz = CONFIG.TIMEZONE;
    const todayKey = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

    const today = orders.filter(function (o) {
      return o.statusKey !== 'CANCELLED' && o.createdAt && Utilities.formatDate(o.createdAt, tz, 'yyyy-MM-dd') === todayKey;
    });
    const pending = orders.filter(function (o) { return o.statusKey === 'PENDING'; });
    const toShip = orders.filter(function (o) { return o.statusKey === 'PAID' || o.statusKey === 'PREPARING'; });

    if (!today.length && !pending.length && !toShip.length) return;

    const listHtml = function (list) {
      if (!list.length) return p_('<span style="color:' + BRAND.MUTED + ';">— ไม่มีรายการ —</span>');
      return infoTable_(list.slice(0, 30).map(function (o) {
        return [
          '#' + esc_(o.orderId || ('แถว ' + o.row)),
          esc_(o.customer.name) + ' • ฿' + money_(o.netTotal) +
          (o.createdAt ? ' <span style="color:' + BRAND.MUTED + ';font-size:12px;">(' + esc_(Utilities.formatDate(o.createdAt, tz, 'dd/MM HH:mm')) + ')</span>' : '')
        ];
      }));
    };

    const sheet = ss.getSheetByName(SHEETS.ORDERS);
    const body =
      h1_('สรุปยอดประจำวัน ' + esc_(thaiDate_(new Date()).split(' เวลา')[0])) +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 6px;"><tr>' +
        kpiCell_('ออเดอร์วันนี้', today.length) +
        kpiCell_('ยอดเงินวันนี้', '฿' + money_(sum_(today, 'netTotal'))) +
        kpiCell_('รอตรวจสลิป', pending.length) +
        kpiCell_('รอจัดส่ง', toShip.length) +
      '</tr></table>' +
      sectionTitle_('🟡 รายการรอตรวจสอบสลิป') + listHtml(pending) +
      sectionTitle_('📦 ชำระแล้ว รอจัดส่ง') + listHtml(toShip) +
      '<div style="text-align:center;margin:24px 0 0;">' +
        button_('📊 เปิดดู Google Sheet', ss.getUrl() + '#gid=' + sheet.getSheetId(), BRAND.PRIMARY) +
      '</div>';

    sendMail_({
      to: getAdminEmail_(),
      cc: CONFIG.ADMIN_CC || '',
      subject: '📊 สรุปยอดประจำวัน ' + CONFIG.SHOP_NAME + ' — ' + today.length + ' ออเดอร์ใหม่',
      html: layout_('สรุปยอดประจำวัน DENT-Z', body)
    });
  } catch (err) {
    logError_('sendDailySummary', err);
  }
}

function kpiCell_(label, value) {
  return '<td style="width:25%;padding:4px;"><div style="background:' + BRAND.LIGHT_BG + ';border:1px solid #bbf7d0;border-radius:12px;padding:14px 8px;text-align:center;">' +
    '<div style="font-size:20px;font-weight:bold;color:' + BRAND.PRIMARY + ';">' + value + '</div>' +
    '<div style="font-size:11px;color:' + BRAND.MUTED + ';margin-top:2px;">' + label + '</div></div></td>';
}

// ============================================================================
// 10) SETUP & MIGRATION (ติดตั้งและอัปเกรดระบบโดยไม่ให้ข้อมูลเดิมสูญหาย)
// ============================================================================

function setupSystem() {
  const ss = getSs_();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());

  const sheet = ensureOrdersSheet_(ss);
  const migrated = migrateOldRows_(sheet);
  formatOrdersSheet_(sheet);

  getOrCreateSheet_(ss, SHEETS.CUSTOMERS, '#4285f4');
  getOrCreateSheet_(ss, SHEETS.SUMMARY, '#0f9d58');
  getOrCreateSheet_(ss, SHEETS.QUIZ, '#ea4335');
  getOrCreateSheet_(ss, SHEETS.CONSULT, '#ff9800');

  getSlipFolder_(new Date());
  installTriggers_(ss);
  syncAll();

  // จัดลำดับแท็บชีทหลัก
  [SHEETS.ORDERS, SHEETS.CUSTOMERS, SHEETS.SUMMARY, SHEETS.QUIZ, SHEETS.CONSULT].forEach(function (name, i) {
    const s = ss.getSheetByName(name);
    if (s) { ss.setActiveSheet(s); ss.moveActiveSheet(i + 1); }
  });
  ss.setActiveSheet(sheet);

  alert_('✅ ติดตั้งและปรับปรุงระบบ DENT-Z เรียบร้อยแล้ว',
    'เวอร์ชันสคริปต์: ' + VERSION +
    '\nอีเมลแอดมิน: ' + getAdminEmail_() +
    '\nออเดอร์เดิมที่สร้าง Order ID ให้: ' + migrated + ' รายการ' +
    '\n\nขั้นตอนสุดท้าย:' +
    '\n1. กด Deploy → Manage deployments' +
    '\n2. กดปุ่ม ✏️ (Edit) แล้วเลือก Version: New version' +
    '\n3. กด Deploy เพื่อให้ Web App ใช้งานโค้ดเวอร์ชัน 4.0.0 ใหม่ล่าสุดทันทีครับ');
}

function setupTriggers() {
  installTriggers_(getSs_());
  alert_('✅ เปิดระบบอัตโนมัติแล้ว',
    '• เปลี่ยนสถานะในชีท 📦 Orders → ส่งอีเมลแจ้งลูกค้าอัตโนมัติ\n' +
    '• Sync Dashboard ทุก 1 ชั่วโมง\n' +
    (CONFIG.DAILY_SUMMARY_ENABLED ? '• ส่งสรุปยอดประจำวันเวลา ' + CONFIG.DAILY_SUMMARY_HOUR + ':00 น.' : ''));
}

function installTriggers_(ss) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (OUR_TRIGGER_HANDLERS.indexOf(t.getHandlerFunction()) > -1) {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('handleOrderEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('syncAll').timeBased().everyHours(1).create();
  if (CONFIG.DAILY_SUMMARY_ENABLED) {
    ScriptApp.newTrigger('sendDailySummary').timeBased().atHour(CONFIG.DAILY_SUMMARY_HOUR).everyDays(1).inTimezone(CONFIG.TIMEZONE).create();
  }
}

function ensureOrdersSheet_(ss) {
  let sheet = ss.getSheetByName(SHEETS.ORDERS);
  if (!sheet) {
    sheet = ss.getSheetByName('Orders'); // เผื่อกรณีใช้ชื่อ Orders ภาษาอังกฤษ
  }
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.ORDERS, 0);
    sheet.setTabColor('#166534');
  }
  if (sheet.getMaxColumns() < NUM_COLS) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), NUM_COLS - sheet.getMaxColumns());
  }

  const first = String(sheet.getRange(1, 1).getValue() || '');
  if (first === '') {
    sheet.getRange(1, 1, 1, NUM_COLS).setValues([HEADERS]);
  } else if (first.indexOf('Order ID') === -1 && first.indexOf('เลขที่') === -1) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, NUM_COLS).setValues([HEADERS]);
  } else if (sheet.getMaxColumns() >= NUM_COLS) {
    // เติมหัวคอลัมน์ใหม่ M–Q (COL.STATUS เป็นต้นไป)
    sheet.getRange(1, COL.STATUS, 1, NUM_COLS - COL.STATUS + 1).setValues([HEADERS.slice(COL.STATUS - 1)]);
  }
  return sheet;
}

function migrateOldRows_(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const n = last - 1;
  const values = sheet.getRange(2, 1, n, NUM_COLS).getValues();
  const used = {};
  values.forEach(function (r) { if (r[COL.ORDER_ID - 1]) used[r[COL.ORDER_ID - 1]] = true; });

  const idCol = [], phoneCol = [], statusCol = [];
  let count = 0;

  values.forEach(function (r) {
    const hasData = r[COL.NAME - 1] || r[COL.EMAIL - 1] || r[COL.PACKAGE - 1];
    let id = r[COL.ORDER_ID - 1];
    if (hasData && !id) {
      const base = toDate_(r[COL.TIMESTAMP - 1]) || new Date();
      do { id = generateOrderId_(base); } while (used[id]);
      used[id] = true;
      count++;
    }
    idCol.push([id]);

    let phone = r[COL.PHONE - 1];
    if (typeof phone === 'number' && String(phone).length === 9) phone = "'0" + phone;
    phoneCol.push([phone]);

    let st = r[COL.STATUS - 1];
    if (hasData && !st) st = STATUS.PENDING;
    statusCol.push([st]);
  });

  sheet.getRange(2, COL.ORDER_ID, n, 1).setValues(idCol);
  sheet.getRange(2, COL.PHONE, n, 1).setValues(phoneCol);
  sheet.getRange(2, COL.STATUS, n, 1).setValues(statusCol);
  return count;
}

function formatOrdersSheet_(sheet) {
  const maxRows = sheet.getMaxRows();
  const header = sheet.getRange(1, 1, 1, NUM_COLS);
  header.setValues([HEADERS]);
  header.setBackground(BRAND.PRIMARY);
  header.setFontColor('#ffffff');
  header.setFontWeight('bold');
  header.setHorizontalAlignment('center');
  header.setVerticalAlignment('middle');
  header.setWrap(true);
  sheet.setRowHeight(1, 44);
  sheet.setFrozenRows(1);

  const widths = [160, 160, 180, 130, 210, 280, 220, 80, 130, 130, 160, 130, 170, 170, 200, 280, 80];
  widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });

  if (maxRows > 1) {
    sheet.getRange(2, COL.TIMESTAMP, maxRows - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    sheet.getRange(2, COL.TOTAL, maxRows - 1, 1).setNumberFormat('฿#,##0.00');
    sheet.getRange(2, COL.DONATE, maxRows - 1, 1).setNumberFormat('฿#,##0.00');
    sheet.getRange(2, COL.QTY, maxRows - 1, 1).setNumberFormat('0').setHorizontalAlignment('center');
    sheet.getRange(2, COL.ADDRESS, maxRows - 1, 1).setWrap(true);
    sheet.getRange(2, COL.EMAIL_LOG, maxRows - 1, 1).setWrap(true).setFontSize(9).setFontColor('#64748b');
    sheet.getRange(2, 1, maxRows - 1, NUM_COLS).setVerticalAlignment('top');

    // Dropdown เมนูสถานะ
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUS_LIST, true).setAllowInvalid(false)
      .setHelpText('เลือกสถานะ — ระบบจะส่งอีเมลแจ้งลูกค้าอัตโนมัติเมื่อเป็น ชำระเงินแล้ว / จัดส่งแล้ว / ยกเลิก').build();
    sheet.getRange(2, COL.STATUS, maxRows - 1, 1).setDataValidation(rule).setHorizontalAlignment('center').setFontWeight('bold');

    // สีพื้นหลังตามสถานะ
    const statusRange = sheet.getRange(2, COL.STATUS, maxRows - 1, 1);
    const kept = sheet.getConditionalFormatRules().filter(function (rl) {
      return !rl.getRanges().some(function (rg) { return rg.getColumn() === COL.STATUS && rg.getNumColumns() === 1; });
    });
    const statusRules = Object.keys(STATUS).map(function (k) {
      return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(STATUS[k])
        .setBackground(STATUS_COLORS[k].bg).setFontColor(STATUS_COLORS[k].fg).setRanges([statusRange]).build();
    });
    sheet.setConditionalFormatRules(kept.concat(statusRules));
  }

  // ตัวกรองข้อมูล
  const filter = sheet.getFilter();
  if (filter && filter.getRange().getNumColumns() < NUM_COLS) filter.remove();
  if (!sheet.getFilter()) sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), NUM_COLS).createFilter();

  sheet.getRange(1, COL.STATUS).setNote('เปลี่ยนสถานะ → ระบบส่งอีเมลแจ้งลูกค้าอัตโนมัติ\n🟢 ชำระเงินแล้ว → แจ้งยืนยันการชำระเงิน\n🚚 จัดส่งแล้ว → แจ้งเลขพัสดุ (ต้องกรอกคอลัมน์ N)\n🔴 ยกเลิก → แจ้งยกเลิก');
  sheet.getRange(1, COL.TRACKING).setNote('กรอกเลขพัสดุ แล้วเปลี่ยนสถานะเป็น 🚚 จัดส่งแล้ว');
  sheet.getRange(1, COL.DATA).setNote('ข้อมูลระบบสำหรับ Dashboard — ห้ามแก้ไข');
  sheet.hideColumns(COL.DATA);
}

// ============================================================================
// 11) FIREBASE FIRESTORE SYNC & AUTHENTICATION (ระบบเดิมของ DENT-Z)
// ============================================================================

function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = Utilities.base64EncodeWebSafe(JSON.stringify({
    iss: CONFIG.SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));
  const signInput = header + '.' + claim;
  const signature = Utilities.base64EncodeWebSafe(
    Utilities.computeRsaSha256Signature(signInput, CONFIG.SERVICE_ACCOUNT_PRIVATE_KEY)
  );
  const jwt = signInput + '.' + signature;

  const tokenResponse = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  return JSON.parse(tokenResponse.getContentText()).access_token;
}

function firestoreQueryAll(token, collectionPath) {
  let allDocs = [];
  let pageToken = null;
  do {
    let url = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionPath}?pageSize=300`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const response = UrlFetchApp.fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      muteHttpExceptions: true
    });
    const data = JSON.parse(response.getContentText());
    allDocs = allDocs.concat(data.documents || []);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return allDocs;
}

function parseDoc(doc) {
  const result = { _id: (doc.name || '').split('/').pop() };
  const fields = doc.fields || {};
  for (const [key, val] of Object.entries(fields)) {
    if (val.stringValue !== undefined) result[key] = val.stringValue;
    else if (val.integerValue !== undefined) result[key] = parseInt(val.integerValue, 10);
    else if (val.doubleValue !== undefined) result[key] = parseFloat(val.doubleValue);
    else if (val.booleanValue !== undefined) result[key] = val.booleanValue;
    else if (val.timestampValue !== undefined) result[key] = val.timestampValue;
    else if (val.mapValue !== undefined) result[key] = parseMap(val.mapValue);
    else if (val.arrayValue !== undefined) result[key] = parseArray(val.arrayValue);
  }
  return result;
}

function parseMap(mapVal) {
  const obj = {};
  const fields = mapVal.fields || {};
  for (const [k, v] of Object.entries(fields)) {
    if (v.stringValue !== undefined) obj[k] = v.stringValue;
    else if (v.integerValue !== undefined) obj[k] = parseInt(v.integerValue, 10);
    else if (v.doubleValue !== undefined) obj[k] = parseFloat(v.doubleValue);
    else if (v.booleanValue !== undefined) obj[k] = v.booleanValue;
    else if (v.mapValue !== undefined) obj[k] = parseMap(v.mapValue);
  }
  return obj;
}

function parseArray(arrVal) {
  const values = arrVal.values || [];
  return values.map(v => {
    if (v.stringValue !== undefined) return v.stringValue;
    if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
    if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
    if (v.mapValue !== undefined) return parseMap(v.mapValue);
    return null;
  });
}

/** Sync Orders จาก Firestore โดยรักษาค่า Status & Tracking เดิมไว้เสมอ ไม่ลบทับ */
function syncOrders(ss, token) {
  const sheet = ensureOrdersSheet_(ss);
  const docs = firestoreQueryAll(token, 'orders');

  // อ่านข้อมูลและสถานะเดิมที่มีอยู่แล้วในชีท เพื่อไม่ให้ทับค่าที่แอดมินแก้ไว้
  const existingMap = {};
  const last = sheet.getLastRow();
  if (last >= 2) {
    const existingValues = sheet.getRange(2, 1, last - 1, NUM_COLS).getValues();
    const existingFormulas = sheet.getRange(2, COL.SLIP, last - 1, 1).getFormulas();
    existingValues.forEach((r, idx) => {
      const orderId = r[COL.ORDER_ID - 1];
      if (orderId) {
        existingMap[orderId] = {
          status: r[COL.STATUS - 1] || STATUS.PENDING,
          tracking: r[COL.TRACKING - 1] || '',
          note: r[COL.NOTE - 1] || '',
          emailLog: r[COL.EMAIL_LOG - 1] || '',
          slipFormula: existingFormulas[idx] ? existingFormulas[idx][0] : ''
        };
      }
    });
  }

  const rows = docs.map(doc => {
    const d = parseDoc(doc);
    const orderId = d._id || generateOrderId_(new Date());
    const existing = existingMap[orderId] || {};

    const slipLink = d.slip_link || '';
    const slipDisplay = existing.slipFormula
      ? existing.slipFormula
      : (slipLink ? '=HYPERLINK("' + slipLink + '", "🔍 ดูภาพสลิป")' : 'ไม่มีสลิป');

    const donate = parseFloat(d.donate_preset || 0) + parseFloat(d.donate_custom || 0) || parseFloat(d.donate || 0);

    return [
      orderId,
      d.timestamp ? new Date(d.timestamp) : new Date(),
      safeCell_(d.name || ''),
      d.phone ? "'" + d.phone : '',
      safeCell_(d.email || ''),
      safeCell_(d.address || ''),
      safeCell_(d.package || ''),
      parseInt(d.quantity, 10) || 1,
      parseFloat(d.net_total || d.Net_Total || 0),
      donate,
      safeCell_(d.userId || 'anonymous'),
      slipDisplay,
      existing.status || STATUS.PENDING,
      existing.tracking || '',
      existing.note || (donate > 0 ? 'สมทบทุน ' + money_(donate) + ' ฿' : ''),
      existing.emailLog || '',
      JSON.stringify({ v: 1, package: d.package, donate: donate })
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, NUM_COLS).setValues(rows);
    formatOrdersSheet_(sheet);
  }
  Logger.log(`✅ Synced ${rows.length} orders from Firestore`);
  return rows;
}

function syncUsersAndQuiz(ss, token) {
  const userSheet = getOrCreateSheet_(ss, SHEETS.CUSTOMERS, '#4285f4');
  const quizSheet = getOrCreateSheet_(ss, SHEETS.QUIZ, '#ea4335');
  const docs = firestoreQueryAll(token, 'users');

  const userHeaders = ['User ID', 'ชื่อ', 'อีเมล', 'ผลแบบทดสอบล่าสุด', 'วันที่ทำแบบทดสอบ'];
  const quizHeaders = ['User ID', 'วันที่', 'ผลลัพธ์ (Type)', 'CARE', 'FLAVOR', 'INGREDIENT', 'LIFE', 'SENS', 'TEXTURE', 'WHITE', 'คะแนนรวม'];

  const userRows = [];
  const quizRows = [];

  docs.forEach(doc => {
    const d = parseDoc(doc);
    const uid = d._id;
    const qh = d.quizHistory;
    userRows.push([
      uid,
      d.displayName || d.name || '',
      d.email || '',
      (qh && qh.type) ? qh.type : 'ยังไม่ได้ทำแบบทดสอบ',
      (qh && qh.date) ? new Date(qh.date).toLocaleString('th-TH') : ''
    ]);

    if (qh && qh.scores) {
      const s = qh.scores;
      const total = (s.CARE||0)+(s.FLAVOR||0)+(s.INGREDIENT||0)+(s.LIFE||0)+(s.SENS||0)+(s.TEXTURE||0)+(s.WHITE||0);
      quizRows.push([
        uid,
        qh.date ? new Date(qh.date).toLocaleString('th-TH') : '',
        qh.type || '',
        s.CARE||0, s.FLAVOR||0, s.INGREDIENT||0, s.LIFE||0, s.SENS||0, s.TEXTURE||0, s.WHITE||0,
        total
      ]);
    }
  });

  writeSheetWithHeader_(userSheet, userHeaders, userRows);
  writeSheetWithHeader_(quizSheet, quizHeaders, quizRows);
  return { users: userRows, quizResults: quizRows };
}

function syncConsultations(ss, token) {
  const sheet = getOrCreateSheet_(ss, SHEETS.CONSULT, '#ff9800');
  const docs = firestoreQueryAll(token, 'consultations');
  const headers = ['ID', 'Timestamp', 'ชื่อ-นามสกุล', 'อีเมล', 'ปัญหา/อาการที่ปรึกษา'];

  const rows = docs.map(doc => {
    const d = parseDoc(doc);
    return [
      d._id || '',
      d.timestamp ? new Date(d.timestamp).toLocaleString('th-TH') : '',
      d.name || '',
      d.email || '',
      d.message || ''
    ];
  });

  writeSheetWithHeader_(sheet, headers, rows);
  return rows;
}

function syncAllData() {
  const ss = getSs_();
  let token = null;
  try {
    token = getAccessToken();
  } catch (authErr) {
    Logger.log('Firebase Auth Error: ' + authErr.message);
  }

  if (token) {
    syncOrders(ss, token);
    syncUsersAndQuiz(ss, token);
    syncConsultations(ss, token);
  }
  syncAll();
}

// ============================================================================
// 12) STATISTICAL ANALYSIS ENGINE (สถิติวิจัย Chi-Square, t-Test, ANOVA)
// ============================================================================

function runAllStats() {
  const ss = getSs_();
  const quizSheet = ss.getSheetByName(SHEETS.QUIZ);
  const orderSheet = ss.getSheetByName(SHEETS.ORDERS);
  const userSheet = ss.getSheetByName(SHEETS.CUSTOMERS);

  if (!quizSheet || !orderSheet || !userSheet) {
    alert_('⚠️ ไม่พบชีทข้อมูล', 'กรุณากด "Sync ข้อมูลทั้งหมด" ก่อนเพื่อเตรียมข้อมูลสำหรับการคำนวณสถิติ');
    return;
  }

  const quizRows = quizSheet.getDataRange().getValues().slice(1).filter(r => r[0]);
  const orderRows = orderSheet.getDataRange().getValues().slice(1).filter(r => r[0]);
  const userRows = userSheet.getDataRange().getValues().slice(1).filter(r => r[0]);

  runChiSquare(ss, quizRows, orderRows, userRows);
  runTTest(ss, quizRows);
  runANOVA(ss, quizRows);

  alert_('✅ การคำนวณสถิติเสร็จสมบูรณ์', 'อัปเดตผลการทดสอบในชีท 📐 Chi-square, 📐 t-test, และ 📐 ANOVA เรียบร้อยแล้ว');
}

function runChiSquare(ss, quizRows, orderRows, userRows) {
  const sheet = getOrCreateSheet_(ss, SHEETS.CHI_SQUARE, '#ff6d00');
  sheet.clearContents();

  const uidToType = {};
  const emailToType = {};
  userRows.forEach(r => {
    const uid = r[0];
    const email = r[2] || r[1];
    const type = r[3] || r[10];
    if (uid && type && type !== 'ยังไม่ได้ทำแบบทดสอบ') uidToType[uid] = type;
    if (email && type && type !== 'ยังไม่ได้ทำแบบทดสอบ') emailToType[String(email).toLowerCase()] = type;
  });

  const matchedOrders = [];
  orderRows.forEach(r => {
    const email = String(r[COL.EMAIL - 1] || '').toLowerCase();
    const pkg = r[COL.PACKAGE - 1];
    const uid = r[COL.UID - 1];

    let type = '(สั่งซื้อโดยไม่ได้ทำแบบทดสอบ)';
    if (uid && uidToType[uid]) type = uidToType[uid];
    else if (email && emailToType[email]) type = emailToType[email];

    if (pkg) matchedOrders.push({ type: type, pkg: pkg });
  });

  const allPackages = [...new Set(orderRows.map(r => r[COL.PACKAGE - 1]).filter(Boolean))];
  const allTypes = [...new Set(matchedOrders.map(o => o.type))];
  const validTypes = allTypes.length > 0 ? allTypes : ['(ยังไม่มีข้อมูล)'];
  const validPackages = allPackages.length > 0 ? allPackages : ['(ยังไม่มีข้อมูล)'];

  const matrix = validTypes.map(() => validPackages.map(() => 0));
  matchedOrders.forEach(order => {
    const ti = validTypes.indexOf(order.type);
    const pi = validPackages.indexOf(order.pkg);
    if (ti >= 0 && pi >= 0) matrix[ti][pi]++;
  });

  const output = [
    ['📐 Chi-square Test: ประเภทบุคลิกภาพ vs แพ็กเกจที่เลือก'],
    [''],
    ['Cross-tabulation Table (ดึงข้อมูลจากแพ็กเกจจริงในระบบ):'],
    ['ประเภท / แพ็กเกจ', ...validPackages, 'รวม'],
    ...validTypes.map((t, i) => [t, ...matrix[i], matrix[i].reduce((a, b) => a + b, 0)]),
    ['รวม', ...validPackages.map((_, j) => matrix.reduce((s, r) => s + r[j], 0)), matrix.flat().reduce((a, b) => a + b, 0)],
    ['']
  ];

  if (matrix.flat().some(v => v > 0)) {
    const statMatrix = [];
    validTypes.forEach((t, i) => {
      if (t !== '(สั่งซื้อโดยไม่ได้ทำแบบทดสอบ)') statMatrix.push(matrix[i]);
    });

    if (statMatrix.length >= 2) {
      const result = chiSquareTest(statMatrix);
      const sig = result.pValue < 0.05 ? '✅ มีนัยสำคัญทางสถิติ (p < 0.05)' : '❌ ไม่มีนัยสำคัญทางสถิติ (p ≥ 0.05)';
      output.push(
        ['ผลการคำนวณสถิติ Chi-square (ไม่นับรวมคนที่ไม่ได้ทำแบบทดสอบ):'],
        ['χ² (Chi-square)', result.chi2],
        ['Degrees of Freedom (df)', result.df],
        ['p-value', result.pValue],
        ['ผลสรุป', sig],
        ['']
      );
    } else {
      output.push(
        ['ผลการทดสอบ Chi-square:'],
        ['⚠️ ยังไม่สามารถคำนวณค่าทางสถิติได้ — ต้องมีลูกค้าที่ทำแบบทดสอบอย่างน้อย 2 กลุ่มขึ้นไปมาสั่งซื้อก่อน']
      );
    }
  } else {
    output.push(['⚠️ ยังไม่มีข้อมูลใดๆ ในระบบ']);
  }

  const maxCols = Math.max(...output.map(r => r.length));
  const paddedOutput = output.map(r => {
    const newRow = [...r];
    while (newRow.length < maxCols) newRow.push('');
    return newRow;
  });
  sheet.getRange(1, 1, paddedOutput.length, maxCols).setValues(paddedOutput);
  sheet.getRange(1, 1, 1, 5).setBackground('#e65100').setFontColor('#ffffff').setFontWeight('bold');
}

function runTTest(ss, quizRows) {
  const sheet = getOrCreateSheet_(ss, SHEETS.T_TEST, '#7b1fa2');
  sheet.clearContents();

  const types = [...new Set(quizRows.map(r => r[2]).filter(Boolean))];
  const targetType = types.length > 0 ? types[0] : 'The Sensitive Type';

  const targetScores = quizRows.filter(r => r[2] === targetType).map(r => r[8]); // SENS
  const otherScores = quizRows.filter(r => r[2] !== targetType && r[2]).map(r => r[8]);

  const output = [
    [`📐 Independent t-test: คะแนน SENS ระหว่าง "${targetType}" กับกลุ่มอื่น`],
    [''],
    ['กลุ่ม', 'n', 'ค่าเฉลี่ย (Mean)', 'ผลต่าง']
  ];

  if (targetScores.length >= 2 && otherScores.length >= 2) {
    const result = tTest(targetScores, otherScores);
    output.push(
      [targetType, result.n1, result.mean1, ''],
      ['กลุ่มอื่นๆ', result.n2, result.mean2, (result.mean1 - result.mean2).toFixed(2)],
      [''],
      ['ผลการทดสอบ t-test:'],
      ['t-statistic', result.t],
      ['Degrees of Freedom (df)', result.df],
      ['p-value (2-tailed)', result.pValue],
      ['ผลสรุป', result.pValue < 0.05 ? '✅ มีนัยสำคัญทางสถิติ (p < 0.05)' : '❌ ไม่มีนัยสำคัญทางสถิติ (p ≥ 0.05)'],
      [''],
      ['--- การทดสอบเพิ่มเติม: คะแนนรวมทุกมิติ ---'],
      ['กลุ่ม', 'n', 'คะแนนรวมเฉลี่ย', '']
    );

    types.forEach(g => {
      const scores = quizRows.filter(r => r[2] === g).map(r => r[10]);
      const mean = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '-';
      output.push([g, scores.length, mean, '']);
    });
  } else {
    output.push(['⚠️ ต้องการข้อมูลมากกว่านี้ (อย่างน้อย 2 คนต่อกลุ่ม) เพื่อคำนวณ t-test']);
  }

  const maxCols = 4;
  const paddedOutput = output.map(r => {
    const newRow = [...r];
    while (newRow.length < maxCols) newRow.push('');
    return newRow;
  });
  sheet.getRange(1, 1, paddedOutput.length, maxCols).setValues(paddedOutput);
  sheet.getRange(1, 1, 1, 4).setBackground('#6a1b9a').setFontColor('#ffffff').setFontWeight('bold');
}

function runANOVA(ss, quizRows) {
  const sheet = getOrCreateSheet_(ss, SHEETS.ANOVA, '#1565c0');
  sheet.clearContents();

  const types = [...new Set(quizRows.map(r => r[2]).filter(Boolean))];
  const groups = types.map(t => quizRows.filter(r => r[2] === t).map(r => r[10]));
  const validGroups = groups.filter(g => g.length >= 2);
  const validTypes = types.filter((_, i) => groups[i].length >= 2);

  const output = [
    ['📐 One-way ANOVA: เปรียบเทียบคะแนนรวมแบบทดสอบระหว่างกลุ่มบุคลิกภาพ'],
    [''],
    ['กลุ่ม (Type)', 'n', 'ค่าเฉลี่ยคะแนนรวม']
  ];

  validTypes.forEach((t, i) => {
    const g = validGroups[i];
    const mean = (g.reduce((a, b) => a + b, 0) / g.length).toFixed(2);
    output.push([t, g.length, parseFloat(mean)]);
  });
  output.push(['']);

  if (validGroups.length >= 2) {
    const result = oneWayANOVA(validGroups);
    output.push(
      ['ผลการทดสอบ ANOVA:'],
      ['F-statistic', result.F],
      ['df (Between groups)', result.dfBetween],
      ['df (Within groups)', result.dfWithin],
      ['p-value', result.pValue],
      ['ผลสรุป', result.pValue < 0.05 ? '✅ มีนัยสำคัญทางสถิติ (p < 0.05)' : '❌ ไม่มีนัยสำคัญทางสถิติ (p ≥ 0.05)']
    );
  } else {
    output.push(['⚠️ ต้องการข้อมูลอย่างน้อย 2 กลุ่ม โดยแต่ละกลุ่มมีอย่างน้อย 2 คน เพื่อคำนวณ ANOVA']);
  }

  const maxCols = 3;
  const paddedOutput = output.map(r => {
    const newRow = [...r];
    while (newRow.length < maxCols) newRow.push('');
    return newRow;
  });
  sheet.getRange(1, 1, paddedOutput.length, maxCols).setValues(paddedOutput);
  sheet.getRange(1, 1, 1, 3).setBackground('#0d47a1').setFontColor('#ffffff').setFontWeight('bold');
}

// ---------- ฟังก์ชันคณิตศาสตร์สถิติชั้นสูง ----------

function chiSquareTest(observed) {
  const rowTotals = observed.map(row => row.reduce((a, b) => a + b, 0));
  const colTotals = observed[0].map((_, j) => observed.reduce((sum, row) => sum + row[j], 0));
  const grandTotal = rowTotals.reduce((a, b) => a + b, 0);
  if (grandTotal === 0) return { chi2: 0, df: 0, pValue: 1 };

  let chi2 = 0;
  let df = (observed.length - 1) * (observed[0].length - 1);

  for (let i = 0; i < observed.length; i++) {
    for (let j = 0; j < observed[0].length; j++) {
      const expected = (rowTotals[i] * colTotals[j]) / grandTotal;
      if (expected > 0) chi2 += Math.pow(observed[i][j] - expected, 2) / expected;
    }
  }
  const pValue = 1 - chiSquareCDF(chi2, df);
  return { chi2: Math.round(chi2 * 100) / 100, df: df, pValue: Math.round(pValue * 10000) / 10000 };
}

function chiSquareCDF(x, k) {
  if (x <= 0) return 0;
  return lowerIncGamma(k / 2, x / 2) / gamma(k / 2);
}

function gamma(z) {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1;
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  let x2 = c[0];
  for (let i = 1; i < g + 2; i++) x2 += c[i] / (z + i);
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x2;
}

function lowerIncGamma(a, x) {
  let sum = 0, term = 1 / a;
  for (let n = 1; n <= 200; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < 1e-10) break;
  }
  return Math.exp(-x) * Math.pow(x, a) * (1 / a + sum);
}

function tTest(group1, group2) {
  if (group1.length < 2 || group2.length < 2) return { t: 0, df: 0, pValue: 1, n1: group1.length, n2: group2.length };
  const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length;
  const mean2 = group2.reduce((a, b) => a + b, 0) / group2.length;
  const var1 = group1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (group1.length - 1);
  const var2 = group2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (group2.length - 1);
  const se = Math.sqrt(var1 / group1.length + var2 / group2.length);
  if (se === 0) return { t: 0, df: 0, pValue: 1, n1: group1.length, n2: group2.length };
  const t = (mean1 - mean2) / se;
  const df = Math.pow(var1 / group1.length + var2 / group2.length, 2) /
    (Math.pow(var1 / group1.length, 2) / (group1.length - 1) + Math.pow(var2 / group2.length, 2) / (group2.length - 1));
  const pValue = 2 * (1 - tCDF(Math.abs(t), df));
  return {
    t: Math.round(t * 1000) / 1000,
    df: Math.round(df * 10) / 10,
    pValue: Math.round(pValue * 10000) / 10000,
    mean1: Math.round(mean1 * 100) / 100,
    mean2: Math.round(mean2 * 100) / 100,
    n1: group1.length,
    n2: group2.length
  };
}

function tCDF(t, df) {
  const x = df / (df + t * t);
  return 1 - 0.5 * betaInc(x, df / 2, 0.5);
}

function betaInc(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return betaFunc(a, b);
  // สมมาตรความแม่นยำสูง ป้องกันการลู่ออกเมื่อ x > 0.5
  if (x > (a + 1) / (a + b + 2)) {
    return betaFunc(a, b) - betaInc(1 - x, b, a);
  }
  let result = 0, term = 1;
  for (let m = 0; m <= 200; m++) {
    if (m > 0) term *= (m - 1 + a) * x / m;
    result += term / (a + m);
    if (Math.abs(term) < 1e-12) break;
  }
  return Math.pow(x, a) * Math.pow(1 - x, b) * result;
}

function oneWayANOVA(groups) {
  const k = groups.length;
  if (k < 2) return { F: 0, dfBetween: 0, dfWithin: 0, pValue: 1 };
  const allValues = groups.flat();
  const grandMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
  const groupMeans = groups.map(g => g.reduce((a, b) => a + b, 0) / g.length);
  const ssBetween = groups.reduce((sum, g, i) => sum + g.length * Math.pow(groupMeans[i] - grandMean, 2), 0);
  const ssWithin = groups.reduce((sum, g, i) => sum + g.reduce((s, x) => s + Math.pow(x - groupMeans[i], 2), 0), 0);
  const dfBetween = k - 1;
  const dfWithin = allValues.length - k;
  if (dfWithin <= 0 || ssWithin === 0) return { F: 0, dfBetween, dfWithin, pValue: 1 };
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const F = msBetween / msWithin;
  const pValue = 1 - fCDF(F, dfBetween, dfWithin);
  return {
    F: Math.round(F * 1000) / 1000,
    dfBetween: dfBetween,
    dfWithin: dfWithin,
    pValue: Math.round(pValue * 10000) / 10000,
    groupMeans: groupMeans.map(m => Math.round(m * 100) / 100),
    groupSizes: groups.map(g => g.length)
  };
}

function fCDF(f, d1, d2) {
  const x = d1 * f / (d1 * f + d2);
  const val = betaInc(x, d1 / 2, d2 / 2) / betaFunc(d1 / 2, d2 / 2);
  return Math.max(0, Math.min(1, val));
}

function betaFunc(a, b) {
  return gamma(a) * gamma(b) / gamma(a + b);
}

// ============================================================================
// 13) CUSTOM MENU & ADMIN TOOLS
// ============================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🦷 DENT-Z Management')
    .addItem('🔄 Sync ข้อมูลทั้งหมด (Firestore + Dashboard)', 'syncAllData')
    .addItem('📊 อัปเดตเฉพาะ Dashboard & ผู้สนับสนุน (จากชีท Orders)', 'syncAll')
    .addItem('📐 คำนวณสถิติวิจัย (Chi-square / t-test / ANOVA)', 'runAllStats')
    .addSeparator()
    .addItem('📧 ส่งอีเมลยืนยันคำสั่งซื้ออีกครั้ง (แถวที่เลือก)', 'resendConfirmationForSelectedRow')
    .addItem('📨 ส่งอีเมลตามสถานะปัจจุบันอีกครั้ง (แถวที่เลือก)', 'resendStatusEmailForSelectedRow')
    .addSeparator()
    .addItem('🛠️ ติดตั้ง / อัปเกรดระบบ (กดซ้ำได้ ข้อมูลไม่หาย)', 'setupSystem')
    .addItem('⏱️ เปิดระบบอัตโนมัติ (อีเมลสถานะ + Sync ประจำชั่วโมง)', 'setupTriggers')
    .addItem('🧪 ส่งอีเมลทดสอบมาที่แอดมิน', 'testEmails')
    .addItem('🔍 ตรวจสอบสถานะระบบ (Health Check)', 'healthCheck')
    .addToUi();
}

function getSelectedOrderRow_() {
  const ss = getSs_();
  const sheet = ss.getActiveSheet();
  if (sheet.getName() !== SHEETS.ORDERS) throw new Error('กรุณาไปที่ชีท "📦 Orders" แล้วคลิกเลือกแถวของออเดอร์ก่อน');
  const row = sheet.getActiveRange().getRow();
  if (row < 2) throw new Error('กรุณาคลิกเลือกแถวของออเดอร์ (ไม่ใช่แถวหัวตาราง)');
  return { sheet: sheet, row: row };
}

function resendConfirmationForSelectedRow() {
  try {
    const sel = getSelectedOrderRow_();
    const values = sel.sheet.getRange(sel.row, 1, 1, NUM_COLS).getValues()[0];
    const order = rowToOrder_(values, sel.row, sel.sheet.getRange(sel.row, COL.SLIP).getFormula());
    if (!isEmail_(order.customer.email)) throw new Error('ออเดอร์นี้ไม่มีอีเมลลูกค้าที่ถูกต้อง');
    if (!order.orderId) {
      order.orderId = generateOrderId_(order.createdAt || new Date());
      sel.sheet.getRange(sel.row, COL.ORDER_ID).setValue(order.orderId);
    }
    if (!order.createdAt) order.createdAt = new Date();
    if (!confirm_('ส่งอีเมลยืนยันคำสั่งซื้อ #' + order.orderId + '\nถึง ' + order.customer.email + ' ?')) return;
    sendCustomerOrderConfirmation_(order);
    appendEmailLog_(sel.sheet, sel.row, 'CONFIRM', '✅ ส่งอีเมลยืนยันซ้ำ (โดยแอดมิน)');
    alert_('✅ ส่งแล้ว', 'ส่งอีเมลยืนยันถึง ' + order.customer.email + ' เรียบร้อย');
  } catch (err) {
    alert_('❌ ส่งไม่สำเร็จ', err.message);
  }
}

function resendStatusEmailForSelectedRow() {
  try {
    const sel = getSelectedOrderRow_();
    const status = sel.sheet.getRange(sel.row, COL.STATUS).getValue();
    const key = statusKey_(status);
    if (key !== 'PAID' && key !== 'SHIPPED' && key !== 'CANCELLED') {
      throw new Error('สถานะปัจจุบัน (' + (status || 'ว่าง') + ') ไม่มีอีเมลแจ้งลูกค้า');
    }
    if (!confirm_('ส่งอีเมลแจ้งสถานะ "' + status + '" ให้ลูกค้าอีกครั้ง?')) return;
    const result = processStatusEmail_(sel.sheet, sel.row, true);
    alert_(result.sent ? '✅ ส่งแล้ว' : 'ℹ️ แจ้งเตือน', result.message || 'ไม่มีอีเมลที่ต้องส่ง');
  } catch (err) {
    alert_('❌ ส่งไม่สำเร็จ', err.message);
  }
}

function testEmails() {
  const admin = getAdminEmail_();
  const sample = {
    orderId: generateOrderId_(new Date()),
    createdAt: new Date(),
    customer: {
      name: 'ลูกค้าทดสอบ (DENT-Z Test)',
      email: admin,
      phone: '0812345678',
      address: '123/45 ซอยสุขุมวิท 21 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110'
    },
    package: 'Gold Supporter Package (ยาสีฟันขนาด 30g + 7g + Travel Set)',
    quantity: 1,
    netTotal: 1000,
    donate: 200,
    uid: 'TEST-UID',
    tracking: 'EF123456789TH',
    slipLink: 'https://dentz-web.github.io/dentz-website/'
  };

  try {
    sendCustomerOrderConfirmation_(sample);
    const ss = getSs_();
    const sheet = ensureOrdersSheet_(ss);
    sendAdminNewOrder_(sample, { url: '', blob: null, error: '' }, ss, sheet, 2, '');
    sendStatusEmail_(sample, 'SHIPPED');
    alert_('✅ ส่งอีเมลทดสอบเรียบร้อยแล้ว', 'ส่งอีเมลตัวอย่าง 3 ฉบับ (ยืนยันคำสั่งซื้อ / แจ้งเตือนแอดมิน / แจ้งจัดส่งพร้อมเลขพัสดุ) ไปที่ ' + admin + ' แล้วครับ');
  } catch (err) {
    alert_('❌ ส่งอีเมลทดสอบไม่สำเร็จ', err.message);
  }
}

function healthCheck() {
  const ss = getSs_();
  const sheet = ss.getSheetByName(SHEETS.ORDERS);
  const triggers = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  const has = function (name) { return triggers.indexOf(name) > -1 ? '✅' : '❌'; };
  let webAppUrl = '';
  try { webAppUrl = ScriptApp.getService().getUrl() || ''; } catch (e) { webAppUrl = ''; }

  alert_('🔍 ตรวจสอบสถานะระบบ ' + CONFIG.SHOP_NAME,
    'เวอร์ชันสคริปต์: ' + VERSION +
    '\nอีเมลแอดมิน: ' + getAdminEmail_() +
    '\nโควตาส่งอีเมลที่เหลือวันนี้: ' + MailApp.getRemainingDailyQuota() + ' ฉบับ' +
    '\nจำนวนออเดอร์ในชีท: ' + (sheet ? Math.max(sheet.getLastRow() - 1, 0) : 0) +
    '\n\nระบบทำงานอัตโนมัติ:' +
    '\n' + has('handleOrderEdit') + ' อีเมลแจ้งเมื่อเปลี่ยนสถานะ (onEdit)' +
    '\n' + has('syncAll') + ' Sync Dashboard ทุก 1 ชั่วโมง' +
    '\n' + has('sendDailySummary') + ' ส่งสรุปยอดประจำวัน' +
    '\n\nWeb App URL:\n' + (webAppUrl || '(ยังไม่ได้ Deploy หรือต้องกด Manage Deployments)')
  );
}

// ============================================================================
// 14) HELPER FUNCTIONS (ฟังก์ชันเสริมความปลอดภัย & การจัดการข้อมูล)
// ============================================================================

function getSs_() {
  if (CONFIG.SPREADSHEET_ID) {
    try { return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); } catch (e) { /* ignore */ }
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const saved = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (saved) return SpreadsheetApp.openById(saved);
  throw new Error('ไม่พบ Google Sheet — กรุณาใส่ SPREADSHEET_ID ใน CONFIG');
}

function getOrCreateSheet_(ss, name, color) {
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    if (color) s.setTabColor(color);
  }
  return s;
}

function writeSheetWithHeader_(sheet, headers, rows) {
  sheet.clearContents();
  const data = [headers, ...rows];
  sheet.getRange(1, 1, data.length, headers.length).setValues(data);
  const headRange = sheet.getRange(1, 1, 1, headers.length);
  headRange.setBackground(BRAND.PRIMARY);
  headRange.setFontColor('#ffffff');
  headRange.setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function getAdminEmail_() {
  if (CONFIG.ADMIN_EMAIL) return CONFIG.ADMIN_EMAIL;
  let email = '';
  try { email = Session.getEffectiveUser().getEmail(); } catch (e) { email = ''; }
  if (!email) { try { email = Session.getActiveUser().getEmail(); } catch (e) { email = ''; } }
  return email;
}

function generateOrderId_(date) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
  return 'DZ-' + Utilities.formatDate(date || new Date(), CONFIG.TIMEZONE, 'yyMMdd') + '-' + rand;
}

function findRowByOrderId_(sheet, orderId) {
  const last = sheet.getLastRow();
  if (last < 2 || !orderId) return -1;
  const cell = sheet.getRange(2, COL.ORDER_ID, last - 1, 1).createTextFinder(orderId).matchEntireCell(true).findNext();
  return cell ? cell.getRow() : -1;
}

function appendEmailLog_(sheet, row, tag, label) {
  try {
    const cell = sheet.getRange(row, COL.EMAIL_LOG);
    const prev = String(cell.getValue() || '');
    const line = '[' + tag + '] ' + label + ' • ' + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm');
    cell.setValue(prev ? prev + '\n' + line : line);
  } catch (e) {
    logError_('appendEmailLog', e);
  }
}

function statusKey_(s) {
  const v = String(s || '').trim();
  if (!v) return '';
  for (const k in STATUS) if (STATUS[k] === v) return k;
  if (v.indexOf('ยกเลิก') > -1) return 'CANCELLED';
  if (v.indexOf('จัดส่งแล้ว') > -1) return 'SHIPPED';
  if (v.indexOf('เตรียม') > -1) return 'PREPARING';
  if (v.indexOf('ชำระ') > -1) return 'PAID';
  if (v.indexOf('รอ') > -1) return 'PENDING';
  return '';
}

function str_(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 500); }
function sum_(list, field) { return list.reduce(function (s, o) { return s + (Number(o[field]) || 0); }, 0); }
function isEmail_(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '')); }

function safeCell_(v) {
  const s = String(v == null ? '' : v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function normalizePhone_(v) {
  if (typeof v === 'number') {
    const s = String(v);
    return s.length === 9 ? '0' + s : s;
  }
  return String(v || '').replace(/^'/, '').trim();
}

function toDate_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === 'string' && v) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function extractUrl_(formula) {
  const m = String(formula || '').match(/"(https?:\/\/[^"]+)"/);
  return m ? m[1] : '';
}

function topKey_(obj) {
  let best = '', n = 0;
  Object.keys(obj || {}).forEach(function (k) { if (obj[k] > n) { best = k; n = obj[k]; } });
  return best;
}

function money_(n) {
  const v = Number(n) || 0;
  const fixed = Math.abs(v % 1) > 0.001 ? v.toFixed(2) : v.toFixed(0);
  return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function thaiDate_(d) {
  if (!d) return '-';
  const tz = CONFIG.TIMEZONE;
  const day = Utilities.formatDate(d, tz, 'd');
  const month = TH_MONTHS[parseInt(Utilities.formatDate(d, tz, 'M'), 10) - 1];
  const year = parseInt(Utilities.formatDate(d, tz, 'yyyy'), 10) + 543;
  return day + ' ' + month + ' ' + year + ' เวลา ' + Utilities.formatDate(d, tz, 'HH:mm') + ' น.';
}

function esc_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function nl2br_(s) { return String(s).replace(/\r?\n/g, '<br>'); }

function htmlToText_(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h1)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n').trim();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function summarizePayload_(data) {
  if (!data) return '';
  const copy = {};
  Object.keys(data).forEach(function (k) { if (k !== 'slip_base64' && k !== 'slipBase64') copy[k] = data[k]; });
  return JSON.stringify(copy).slice(0, 1500);
}

function toast_(msg, title, seconds) {
  try { getSs_().toast(msg, title || CONFIG.SHOP_NAME, seconds || 5); } catch (e) { /* headless */ }
}

function alert_(title, msg) {
  try { SpreadsheetApp.getUi().alert(title, msg, SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) { Logger.log(title + '\n' + msg); }
}

function confirm_(msg) {
  try {
    const ui = SpreadsheetApp.getUi();
    return ui.alert('ยืนยัน', msg, ui.ButtonSet.YES_NO) === ui.Button.YES;
  } catch (e) { return true; }
}

function logInfo_(where, message, detail) { writeLog_('INFO', where, message, detail); }
function logError_(where, err, detail) { writeLog_('ERROR', where, (err && err.message) || String(err), detail || (err && err.stack) || ''); }

function writeLog_(level, where, message, detail) {
  try {
    Logger.log('[' + level + '] ' + where + ': ' + message);
    const ss = getSs_();
    let sheet = ss.getSheetByName(SHEETS.LOG);
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.LOG);
      sheet.setTabColor('#9e9e9e');
      const headRange = sheet.getRange(1, 1, 1, 5);
      headRange.setValues([['เวลา', 'ระดับ', 'ส่วนของระบบ', 'ข้อความ', 'รายละเอียด']]);
      headRange.setBackground('#555555');
      headRange.setFontColor('#ffffff');
      headRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
      sheet.setColumnWidths(1, 5, 180);
      sheet.setColumnWidth(4, 360);
      sheet.setColumnWidth(5, 500);
    }
    sheet.appendRow([new Date(), level, where, String(message).slice(0, 1000), String(detail || '').slice(0, 2000)]);
    if (sheet.getLastRow() > 1200) sheet.deleteRows(2, 200);
  } catch (e) {
    Logger.log('writeLog_ failed: ' + e.message);
  }
}
