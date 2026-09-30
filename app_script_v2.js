// ================================================================
// DENT-Z ANALYTICS — Google Apps Script (UPDATED V3)
// ================================================================
// วิธีใช้:
// 1. เปิด Google Sheets "Dent-Z Analytics"
// 2. ไปที่ Extensions → Apps Script
// 3. ลบโค้ดเดิมทิ้ง แล้ว Copy โค้ดนี้วางแทนทั้งหมด
// 4. กด Save (Ctrl+S)
// 5. กลับไปที่หน้าชีท จะมีเมนู DENT-Z Analytics ด้านบน ให้กดเพื่อ Sync ข้อมูล
// ================================================================

// ---- CONFIG: กรอกข้อมูลของคุณที่นี่ ----
const FIREBASE_PROJECT_ID = 'dent-z-app';
const SPREADSHEET_ID = '11kmE4bM0bcftk36nUPBd0LQhYdtU4XnvSJ9u8sgvMxc';

// Service Account credentials
const SERVICE_ACCOUNT_EMAIL = 'firebase-adminsdk-fbsvc@dent-z-app.iam.gserviceaccount.com';
const SERVICE_ACCOUNT_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----`;

// ================================================================
// 1. AUTHENTICATION
// ================================================================

function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = Utilities.base64EncodeWebSafe(JSON.stringify({
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));
  const signInput = header + '.' + claim;
  const signature = Utilities.base64EncodeWebSafe(
    Utilities.computeRsaSha256Signature(signInput, SERVICE_ACCOUNT_PRIVATE_KEY)
  );
  const jwt = signInput + '.' + signature;

  const tokenResponse = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  return JSON.parse(tokenResponse.getContentText()).access_token;
}

// ================================================================
// 2. FIRESTORE QUERY
// ================================================================

function firestoreQueryAll(token, collectionPath) {
  let allDocs = [];
  let pageToken = null;
  do {
    let url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionPath}?pageSize=300`;
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
    else if (val.integerValue !== undefined) result[key] = parseInt(val.integerValue);
    else if (val.doubleValue !== undefined) result[key] = parseFloat(val.doubleValue);
    else if (val.booleanValue !== undefined) result[key] = val.booleanValue;
    else if (val.timestampValue !== undefined) result[key] = val.timestampValue;
    else if (val.mapValue) result[key] = parseMapValue(val.mapValue);
    else if (val.arrayValue) result[key] = (val.arrayValue.values || []).map(v => parseDoc({ fields: { _: v } })._);
    else result[key] = null;
  }
  return result;
}

function parseMapValue(mapVal) {
  const result = {};
  const fields = (mapVal && mapVal.fields) || {};
  for (const [key, val] of Object.entries(fields)) {
    if (val.stringValue !== undefined) result[key] = val.stringValue;
    else if (val.integerValue !== undefined) result[key] = parseInt(val.integerValue);
    else if (val.doubleValue !== undefined) result[key] = parseFloat(val.doubleValue);
    else if (val.booleanValue !== undefined) result[key] = val.booleanValue;
    else if (val.timestampValue !== undefined) result[key] = val.timestampValue;
    else if (val.mapValue) result[key] = parseMapValue(val.mapValue);
    else result[key] = null;
  }
  return result;
}

// ================================================================
// 3. SHEET HELPERS
// ================================================================

function getOrCreateSheet(ss, name, color) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (color) sheet.setTabColor(color);
  }
  return sheet;
}

function writeSheetWithHeader(sheet, headers, rows) {
  sheet.clearContents();
  const allData = [headers, ...rows];
  if (allData.length > 0) {
    sheet.getRange(1, 1, allData.length, headers.length).setValues(allData);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1a3a1a');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

// ================================================================
// 4. SYNC FUNCTIONS
// ================================================================

function syncOrders(ss, token) {
  const sheet = getOrCreateSheet(ss, '📦 Orders', '#34a853');
  const docs = firestoreQueryAll(token, 'orders');
  
  const headers = ['ID', 'Timestamp', 'ชื่อ-นามสกุล', 'เบอร์โทรศัพท์', 'อีเมล', 'ที่อยู่จัดส่ง', 'แพ็กเกจ', 'จำนวน', 'ยอดรวมสุทธิ (฿)', 'เงินสมทบทุน (฿)', 'User ID', 'สลิปการโอนเงิน (ภาพ)'];
  
  const rows = docs.map(doc => {
    const d = parseDoc(doc);
    return [
      d._id || '',
      d.timestamp ? new Date(d.timestamp).toLocaleString('th-TH') : '',
      d.name || '',
      d.phone || '',
      d.email || '',
      d.address || '',
      d.package || '',
      d.quantity || 1,
      parseFloat(d.net_total || d.Net_Total || 0),
      parseFloat(d.donate_preset || 0) + parseFloat(d.donate_custom || 0),
      d.userId || 'anonymous',
      d.slip_link ? '=HYPERLINK("' + d.slip_link + '", "🔍 ดูภาพสลิป")' : 'ไม่มีสลิป'
    ];
  });

  writeSheetWithHeader(sheet, headers, rows);
  if (sheet.getMaxRows() > 1) sheet.getRange(2, 7, sheet.getMaxRows() - 1, 1).clearDataValidations();
  Logger.log(`✅ Synced ${rows.length} orders`);
  return rows;
}

function syncUsersAndQuiz(ss, token) {
  const userSheet = getOrCreateSheet(ss, '👤 User Profiles', '#4285f4');
  const quizSheet = getOrCreateSheet(ss, '🧠 Quiz Results', '#ea4335');
  
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
  
  writeSheetWithHeader(userSheet, userHeaders, userRows);
  writeSheetWithHeader(quizSheet, quizHeaders, quizRows);
  return { users: userRows, quizResults: quizRows };
}

function syncConsultations(ss, token) {
  const sheet = getOrCreateSheet(ss, '💬 Consultations', '#ff9800');
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

  writeSheetWithHeader(sheet, headers, rows);
  return rows;
}

// ================================================================
// 5. STATISTICS ENGINE
// ================================================================

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
  return { chi2: Math.round(chi2 * 100) / 100, df, pValue: Math.round(pValue * 10000) / 10000 };
}

function chiSquareCDF(x, k) {
  if (x <= 0) return 0;
  return lowerIncGamma(k / 2, x / 2) / gamma(k / 2);
}
function gamma(z) {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1;
  const g = 7;
  const c = [0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
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
  return Math.exp(-x) * Math.pow(x, a) * (1/a + sum);
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
  const df = Math.pow(var1/group1.length + var2/group2.length, 2) /
    (Math.pow(var1/group1.length, 2)/(group1.length-1) + Math.pow(var2/group2.length, 2)/(group2.length-1));
  const pValue = 2 * (1 - tCDF(Math.abs(t), df));
  return { t: Math.round(t * 1000) / 1000, df: Math.round(df * 10) / 10, pValue: Math.round(pValue * 10000) / 10000, mean1: Math.round(mean1 * 100) / 100, mean2: Math.round(mean2 * 100) / 100, n1: group1.length, n2: group2.length };
}
function tCDF(t, df) {
  const x = df / (df + t * t);
  return 1 - 0.5 * betaInc(x, df/2, 0.5);
}
function betaInc(x, a, b) {
  let result = 0, term = 1;
  for (let m = 0; m <= 100; m++) {
    if (m > 0) term *= (m - 1 + a) * x / m;
    result += term / (a + m);
    if (Math.abs(term) < 1e-10) break;
  }
  return Math.pow(x, a) * Math.pow(1-x, b) * result;
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
  return { F: Math.round(F * 1000) / 1000, dfBetween, dfWithin, pValue: Math.round(pValue * 10000) / 10000, groupMeans: groupMeans.map(m => Math.round(m * 100) / 100), groupSizes: groups.map(g => g.length) };
}
function fCDF(f, d1, d2) {
  const x = d1 * f / (d1 * f + d2);
  return betaInc(x, d1/2, d2/2) / betaFunc(d1/2, d2/2);
}
function betaFunc(a, b) { return gamma(a) * gamma(b) / gamma(a + b); }


// ================================================================
// 6. RUN STATISTICAL TESTS (UPDATED - DYNAMIC MATCHING & FALLBACK)
// ================================================================

function runChiSquare(ss, quizRows, orderRows, userRows) {
  const sheet = getOrCreateSheet(ss, '📐 Chi-square', '#ff6d00');
  sheet.clearContents();
  
  // 1. สร้าง Mapping สำหรับจับคู่ Type ด้วย User ID หรือ อีเมล
  const uidToType = {};
  const emailToType = {};
  
  userRows.forEach(r => {
    const uid = r[0];
    const email = r[2];
    const type = r[3];
    if (uid && type && type !== 'ยังไม่ได้ทำแบบทดสอบ') uidToType[uid] = type;
    if (email && type && type !== 'ยังไม่ได้ทำแบบทดสอบ') emailToType[email] = type;
  });
  
  // 2. ดึงข้อมูลแพ็กเกจ และ Type ทั้งหมดที่มี
  const matchedOrders = [];
  
  orderRows.forEach(r => {
    const email = r[4];  // คอลัมน์อีเมลใน Orders (index 4)
    const pkg = r[6];    // คอลัมน์แพ็กเกจ (index 6)
    const uid = r[10];   // คอลัมน์ User ID (index 10)
    
    // พยายามหา Type ของคนที่สั่งซื้อนี้
    let type = '(สั่งซื้อโดยไม่ได้ทำแบบทดสอบ)'; // กำหนดค่าเริ่มต้นสำหรับคนที่ไม่ได้ทำแบบทดสอบ
    if (uid && uidToType[uid]) type = uidToType[uid];
    else if (email && emailToType[email]) type = emailToType[email];
    
    if (pkg) {
      matchedOrders.push({ type: type, pkg: pkg });
    }
  });
  
  // 3. กำหนดแกนแนวตั้ง (Types) และแนวนอน (Packages)
  const allPackages = [...new Set(orderRows.map(r => r[6]).filter(Boolean))];
  const allTypes = [...new Set(matchedOrders.map(o => o.type))];
  
  const validTypes = allTypes.length > 0 ? allTypes : ['(ยังไม่มีข้อมูล)'];
  const validPackages = allPackages.length > 0 ? allPackages : ['(ยังไม่มีข้อมูล)'];
  
  // 4. สร้างตารางเมทริกซ์ 0 และนับจำนวนลงไป
  const matrix = validTypes.map(() => validPackages.map(() => 0));
  
  matchedOrders.forEach(order => {
    const ti = validTypes.indexOf(order.type);
    const pi = validPackages.indexOf(order.pkg);
    if (ti >= 0 && pi >= 0) {
      matrix[ti][pi]++;
    }
  });
  
  // 5. เขียนผลลัพธ์ลงชีท
  const output = [
    ['📐 Chi-square Test: ประเภทบุคลิกภาพ vs แพ็กเกจที่เลือก'],
    [''],
    ['Cross-tabulation Table (ดึงข้อมูลจากแพ็กเกจจริงในระบบ):'],
    ['ประเภท / แพ็กเกจ', ...validPackages, 'รวม'],
    ...validTypes.map((t, i) => [t, ...matrix[i], matrix[i].reduce((a,b)=>a+b,0)]),
    ['รวม', ...validPackages.map((_,j) => matrix.reduce((s,r)=>s+r[j],0)), matrix.flat().reduce((a,b)=>a+b,0)],
    ['']
  ];
  
  if (matrix.flat().some(v => v > 0)) {
    // ถ้ามีคนที่ "ทำแบบทดสอบแล้วสั่งซื้อ" จริงๆ ถึงจะคำนวณ Chi-Square ให้
    // ตัดแถว "(สั่งซื้อโดยไม่ได้ทำแบบทดสอบ)" ออกจากการคำนวณสถิติ เพราะมันไม่ใช่บุคลิกภาพ
    const statMatrix = [];
    validTypes.forEach((t, i) => {
      if (t !== '(สั่งซื้อโดยไม่ได้ทำแบบทดสอบ)') {
        statMatrix.push(matrix[i]);
      }
    });

    if (statMatrix.length >= 2) {
      const result = chiSquareTest(statMatrix);
      const sig = result.pValue < 0.05 ? '✅ มีนัยสำคัญ (p < 0.05)' : '❌ ไม่มีนัยสำคัญ (p ≥ 0.05)';
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
        ['⚠️ ยังไม่สามารถคำนวณค่าทางสถิติได้ — ต้องมีลูกค้าที่ทำแบบทดสอบได้ผลลัพธ์บุคลิกภาพอย่างน้อย 2 ประเภทขึ้นไป มาสั่งซื้อสินค้าก่อน']
      );
    }
    
  } else {
    output.push(['⚠️ ยังไม่มีข้อมูลใดๆ ในระบบ']);
  }
  
  const maxCols = Math.max(...output.map(r=>r.length));
  const paddedOutput = output.map(r => {
    const newRow = [...r];
    while (newRow.length < maxCols) newRow.push('');
    return newRow;
  });
  sheet.getRange(1, 1, paddedOutput.length, maxCols).setValues(paddedOutput);
  sheet.getRange(1,1,1,5).setBackground('#e65100').setFontColor('#ffffff').setFontWeight('bold');
}

function runTTest(ss, quizRows) {
  const sheet = getOrCreateSheet(ss, '📐 t-test', '#7b1fa2');
  sheet.clearContents();
  
  const types = [...new Set(quizRows.map(r=>r[2]).filter(Boolean))];
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
      ['ผลสรุป', result.pValue < 0.05 ? '✅ มีนัยสำคัญ (p < 0.05)' : '❌ ไม่มีนัยสำคัญ (p ≥ 0.05)'],
      [''],
      ['--- การทดสอบเพิ่มเติม: คะแนนรวมทุกมิติ ---'],
      ['กลุ่ม', 'n', 'คะแนนรวมเฉลี่ย', '']
    );
    
    types.forEach(g => {
      const scores = quizRows.filter(r => r[2] === g).map(r => r[10]);
      const mean = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2) : '-';
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
  sheet.getRange(1,1,1,4).setBackground('#6a1b9a').setFontColor('#ffffff').setFontWeight('bold');
}

function runANOVA(ss, quizRows) {
  const sheet = getOrCreateSheet(ss, '📐 ANOVA', '#1565c0');
  sheet.clearContents();
  
  const types = [...new Set(quizRows.map(r=>r[2]).filter(Boolean))];
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
    const mean = (g.reduce((a,b)=>a+b,0)/g.length).toFixed(2);
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
      ['ผลสรุป', result.pValue < 0.05 ? '✅ มีนัยสำคัญ (p < 0.05)' : '❌ ไม่มีนัยสำคัญ (p ≥ 0.05)']
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
  sheet.getRange(1,1,1,3).setBackground('#0d47a1').setFontColor('#ffffff').setFontWeight('bold');
}

// ================================================================
// 7. SUMMARY DASHBOARD
// ================================================================

function writeSummary(ss, orderRows, userRows, quizRows) {
  const sheet = getOrCreateSheet(ss, '📊 Summary', '#0f9d58');
  sheet.clearContents();
  
  const totalOrders = orderRows.length;
  const totalRevenue = orderRows.reduce((sum, r) => sum + (parseFloat(r[8]) || 0), 0);
  const totalDonation = orderRows.reduce((sum, r) => sum + (parseFloat(r[9]) || 0), 0);
  const totalUsers = userRows.length;
  const totalQuiz = quizRows.length;
  
  const typeCounts = {};
  quizRows.forEach(r => { if (r[2]) typeCounts[r[2]] = (typeCounts[r[2]] || 0) + 1; });
  
  const pkgCounts = {};
  orderRows.forEach(r => { if (r[6]) pkgCounts[r[6]] = (pkgCounts[r[6]] || 0) + 1; });
  
  const now = new Date().toLocaleString('th-TH');
  
  const output = [
    ['📊 DENT-Z Analytics Dashboard', '', `อัปเดตล่าสุด: ${now}`],
    [''],
    ['--- ยอดขายและการสั่งจอง ---'],
    ['คำสั่งจองทั้งหมด', totalOrders, 'รายการ'],
    ['ยอดขายรวม', totalRevenue, '฿'],
    ['ยอดเงินสมทบทุนรวม', totalDonation, '฿'],
    ['ยอดเฉลี่ยต่อคำสั่งจอง', totalOrders > 0 ? Math.round(totalRevenue/totalOrders) : 0, '฿'],
    [''],
    ['--- แพ็กเกจที่ได้รับความนิยม ---'],
    ...Object.entries(pkgCounts).sort((a,b)=>b[1]-a[1]).map(([k,v]) => [k, v, 'ราย']),
    [''],
    ['--- ผู้ใช้งาน ---'],
    ['ผู้ใช้ทั้งหมด (Login)', totalUsers, 'คน'],
    ['ผู้ทำแบบทดสอบ', totalQuiz, 'คน'],
    [''],
    ['--- สัดส่วนผลแบบทดสอบ ---'],
    ...Object.entries(typeCounts).sort((a,b)=>b[1]-a[1]).map(([k,v]) => [k, v, `${Math.round(v/totalQuiz*100)}%`])
  ];
  
  const maxCols = Math.max(...output.map(r => r.length));
  const paddedOutput = output.map(r => {
    const newRow = [...r];
    while (newRow.length < maxCols) newRow.push('');
    return newRow;
  });
  sheet.getRange(1, 1, paddedOutput.length, maxCols).setValues(paddedOutput);
  sheet.getRange(1,1,1,3).setBackground('#0f9d58').setFontColor('#ffffff').setFontWeight('bold').setFontSize(14);
}

// ================================================================
// 8. MAIN FUNCTIONS
// ================================================================

function syncAllData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const token = getAccessToken();
  
  const orderRows = syncOrders(ss, token);
  const { users: userRows, quizResults: quizRows } = syncUsersAndQuiz(ss, token);
  syncConsultations(ss, token);
  writeSummary(ss, orderRows, userRows, quizRows);
}

function runAllStats() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const quizSheet = ss.getSheetByName('🧠 Quiz Results');
  const orderSheet = ss.getSheetByName('📦 Orders');
  const userSheet = ss.getSheetByName('👤 User Profiles');
  
  if (!quizSheet || !orderSheet || !userSheet) return;
  
  const quizRows = quizSheet.getDataRange().getValues().slice(1).filter(r => r[0]);
  const orderRows = orderSheet.getDataRange().getValues().slice(1).filter(r => r[0]);
  const userRows = userSheet.getDataRange().getValues().slice(1).filter(r => r[0]);
  
  // Update Chi-square to use userRows for matching
  runChiSquare(ss, quizRows, orderRows, userRows);
  runTTest(ss, quizRows);
  runANOVA(ss, quizRows);
}

function setupAll() {
  syncAllData();
  Utilities.sleep(2000);
  runAllStats();
  SpreadsheetApp.getUi().alert('✅ อัปเดตข้อมูลและสถิติเรียบร้อยแล้ว!');
}

// ================================================================
// 9. AUTO-TRIGGER
// ================================================================

function setupAutoTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncAllData').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('runAllStats').timeBased().everyHours(6).create();
}

// ================================================================
// 10. CUSTOM MENU
// ================================================================

function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu('DENT-Z Analytics')
    .addItem('🔄 ดึงข้อมูลและคำนวณสถิติใหม่ (Sync Now)', 'setupAll')
    .addSeparator()
    .addItem('ตั้งค่าให้ดึงอัตโนมัติ (Auto-Sync)', 'setupAutoTriggers')
    .addSeparator()
    .addItem('🗑️ ลบข้อมูลทั้งหมด (Reset)', 'clearAllData')
    .addToUi();
}

// ================================================================
// 11. CLEAR DATA
// ================================================================

function clearAllData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('⚠️ ยืนยันการลบข้อมูล', 'คุณต้องการลบข้อมูล "การสั่งจอง" และ "ผู้ใช้งาน" ทั้งหมดออกจากฐานข้อมูล (Firestore) และในตารางชีทนี้ใช่หรือไม่?\n\n*การกระทำนี้ไม่สามารถย้อนกลับได้*', ui.ButtonSet.YES_NO);
  
  if (response == ui.Button.YES) {
    const token = getAccessToken();
    let deletedCount = 0;
    
    const orders = firestoreQueryAll(token, 'orders');
    orders.forEach(doc => { deleteFirestoreDoc(token, doc.name); deletedCount++; });
    
    const consultations = firestoreQueryAll(token, 'consultations');
    consultations.forEach(doc => { deleteFirestoreDoc(token, doc.name); deletedCount++; });
    
    const users = firestoreQueryAll(token, 'users');
    users.forEach(doc => { deleteFirestoreDoc(token, doc.name); deletedCount++; });
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ['📦 Orders', '👤 User Profiles', '🧠 Quiz Results', '💬 Consultations', '📊 Summary', '📐 Chi-square', '📐 t-test', '📐 ANOVA'].forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (sheet) sheet.clearContents();
    });
    
    syncAllData();
    ui.alert('✅ สำเร็จ', `ลบข้อมูลออกจากฐานข้อมูลเรียบร้อย (ทั้งหมด ${deletedCount} รายการ)`, ui.ButtonSet.OK);
  }
}

function deleteFirestoreDoc(token, docName) {
  UrlFetchApp.fetch(`https://firestore.googleapis.com/v1/${docName}`, {
    method: 'delete',
    headers: { Authorization: `Bearer ${token}` },
    muteHttpExceptions: true
  });
}


// ================================================================
// 12. WEB APP API (รับข้อมูลจากหน้าเว็บและส่งอีเมล)
// ================================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const type = data.type; // 'consult' หรือ 'order'
    const toEmail = data.email;
    const name = data.name || 'คุณลูกค้า';
    
    let subject = '';
    let body = '';
    
    let slipDriveUrl = data.slip_link || '#';

    // ===== DENT-Z DRIVE UPLOAD =====
    if (type === 'order' && data.slip_base64) {
      try {
        let folder;
        const folders = DriveApp.getFoldersByName("DENT-Z Slips");
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder("DENT-Z Slips");
          folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        }
        
        const base64String = data.slip_base64.split(',')[1];
        const blob = Utilities.newBlob(Utilities.base64Decode(base64String), 'image/jpeg', 'Slip_' + name.replace(/[^a-zA-Z0-9ก-๙]/g, '_') + '_' + new Date().getTime() + '.jpg');
        
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        slipDriveUrl = file.getUrl();
      } catch (uploadErr) {
        // Fallback if Drive upload fails
      }
    }
    // ===============================

    if (type === 'consult') {
      subject = 'DENT-Z: ได้รับข้อความปรึกษาปัญหาผิวของคุณแล้ว';
      body = '<div style="font-family: sans-serif; padding: 20px; color: #333;"><h2 style="color: #166534;">สวัสดีครับ ' + name + '</h2><p>เราได้รับข้อความปรึกษาปัญหาผิวรอบปากของคุณเรียบร้อยแล้วครับ</p><p><strong>ข้อความของคุณ:</strong><br/>' + data.message + '</p><p>ทีมเภสัชกรและทันตแพทย์ของเราจะรีบตรวจสอบและส่งคำแนะนำกลับมายังอีเมลนี้โดยเร็วที่สุดครับ</p><br/><p>ด้วยความเคารพ,<br/><strong>ทีมงาน DENT-Z</strong></p></div>';
      
      MailApp.sendEmail({
        to: 'dentz.official@gmail.com',
        subject: '💡 มีข้อความปรึกษาใหม่จากลูกค้า (DENT-Z)',
        htmlBody: 'ลูกค้าชื่อ: ' + name + '<br/>อีเมล: ' + toEmail + '<br/>ข้อความ: ' + data.message
      });
      
    } else if (type === 'order') {
      subject = 'DENT-Z: ยืนยันการสั่งจองสินค้าสำเร็จ!';
      body = `<div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #166534;">สวัสดีครับ ${name}</h2>
          <p>ขอบคุณที่ร่วมเป็นส่วนหนึ่งและสนับสนุน <strong>DENT-Z</strong> ครับ!</p>
          <p>เราได้รับการสั่งจองสินค้าและเงินสนับสนุนของคุณเรียบร้อยแล้ว โดยมีรายละเอียดดังนี้:</p>
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px;">
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><b>แพ็กเกจที่เลือก:</b></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${data.package}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><b>เงินสมทบทุน:</b></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${data.donate || '0'} บาท</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><b>ยอดรวมสุทธิ:</b></td><td style="padding: 10px; border-bottom: 1px solid #eee;"><b style="color: #166534;">${data.net_total} บาท</b></td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><b>ที่อยู่จัดส่ง:</b></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${data.address || '-'}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><b>เบอร์โทรศัพท์:</b></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${data.phone || '-'}</td></tr>
          </table>
          <p>ทีมงานจะรีบตรวจสอบความถูกต้องของสลิปโอนเงิน และดำเนินการจัดส่งตามรอบที่กำหนดครับ</p>
          <p>หากมีข้อสงสัยเพิ่มเติม สามารถตอบกลับอีเมลนี้ได้เลยครับ</p>
          <br/><p>ด้วยความเคารพ,<br/><strong>ทีมงาน DENT-Z</strong></p>
        </div>`;
      
      MailApp.sendEmail({
        to: 'dentz.official@gmail.com',
        subject: '📦 มีออเดอร์ใหม่! (DENT-Z)',
        htmlBody: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #166534;">📦 แจ้งเตือนออเดอร์ใหม่ (DENT-Z)</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; width: 120px;"><b>ชื่อลูกค้า:</b></td><td style="padding: 8px; border: 1px solid #ddd;">${name}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><b>อีเมล:</b></td><td style="padding: 8px; border: 1px solid #ddd;">${toEmail}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><b>เบอร์โทร:</b></td><td style="padding: 8px; border: 1px solid #ddd;">${data.phone || '-'}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><b>ที่อยู่จัดส่ง:</b></td><td style="padding: 8px; border: 1px solid #ddd;">${data.address || '-'}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><b>แพ็กเกจ:</b></td><td style="padding: 8px; border: 1px solid #ddd;">${data.package}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><b>เงินสมทบทุน:</b></td><td style="padding: 8px; border: 1px solid #ddd;">${data.donate || '0'} บาท</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><b>ยอดโอนสุทธิ:</b></td><td style="padding: 8px; border: 1px solid #ddd;"><b style="color: #166534; font-size: 16px;">${data.net_total} บาท</b></td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><b>ลิงก์ดูสลิป:</b></td><td style="padding: 8px; border: 1px solid #ddd;"><a href="${slipDriveUrl}" target="_blank">คลิกเพื่อดูสลิป</a></td></tr>
          </table>
        </div>`
      });
    }

    if (toEmail) {
      MailApp.sendEmail({
        to: toEmail,
        subject: subject,
        htmlBody: body,
        name: 'DENT-Z Official'
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Email sent successfully' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
