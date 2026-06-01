/* ══════════════════════════════════════
   ORG — بوابة الجهات الشريكة
══════════════════════════════════════ */

/* ── Session helpers ──────────────────── */
function isOrgLoggedIn() {
  return !!sessionStorage.getItem('mu_org');
}
function getOrgSession() {
  try { return JSON.parse(sessionStorage.getItem('mu_org') || 'null'); } catch { return null; }
}

/* ── Org Registration ─────────────────── */
function submitOrgReg() {
  const name    = (document.getElementById('oreg-name')?.value    || '').trim();
  const type    =  document.getElementById('oreg-type')?.value    || '';
  const email   = (document.getElementById('oreg-email')?.value   || '').trim().toLowerCase();
  const phone   = (document.getElementById('oreg-phone')?.value   || '').trim();
  const contact = (document.getElementById('oreg-contact')?.value || '').trim();
  const err     = document.getElementById('oreg-err');

  if (!name || !type || !email || !contact) {
    err.textContent = '⚠️ يرجى تعبئة جميع الحقول المطلوبة';
    err.style.display = 'block'; return;
  }
  if (!validEmail(email)) {
    err.textContent = '⚠️ البريد الإلكتروني غير صحيح';
    err.style.display = 'block'; return;
  }
  if (phone && !validPhone(phone)) {
    err.textContent = '⚠️ رقم الجوال غير صحيح';
    err.style.display = 'block'; return;
  }
  const orgs = getOrgs();
  if (orgs.find(o => o.email.toLowerCase() === email)) {
    err.textContent = '⚠️ هذا البريد مسجّل مسبقاً — يمكنك تسجيل الدخول مباشرةً';
    err.style.display = 'block'; return;
  }

  const id  = 'ORG-' + Date.now().toString(36).slice(-5).toUpperCase();
  /* status = قيد المراجعة — requires admin approval before login */
  const org = { id, name, type, email, phone, contact,
                status: 'قيد المراجعة', date: new Date().toLocaleDateString('ar-SA') };
  orgs.push(org);
  saveOrgs(orgs);

  toast(`📋 تم استلام طلب تسجيل الجهة (${id}) — سيُرسل إليك بريد عند الاعتماد`, 't-ok', 7000);
  err.style.display = 'none';
  showOrgLoginStep('creds');
}

/* ── 3-step login flow ────────────────── */
let _orgOtpBundle = null;
let _orgRec       = null;

function showOrgLoginStep(name) {
  ['reg','creds','otp','chpass'].forEach(s => {
    const el = document.getElementById('org-step-' + s);
    if (el) el.style.display = s === name ? '' : 'none';
  });
}

async function doOrgLogin() {
  const email = (document.getElementById('loginOrgEmail')?.value || '').trim().toLowerCase();
  const pass  =  document.getElementById('loginOrgPass')?.value  || '';
  const err   = document.getElementById('loginOrgErr');

  if (!email || !pass) {
    err.textContent = '⚠️ يرجى إدخال البريد وكلمة المرور';
    err.style.display = 'block'; return;
  }

  /* rate limit */
  const rl = rlCheck('org_' + email);
  if (!rl.ok) { err.textContent = rl.msg; err.style.display = 'block'; return; }

  const btn = document.getElementById('orgLoginBtn');
  btn.disabled = true; btn.textContent = 'جارٍ التحقق...';

  try {
    sessionStorage.removeItem('mu_auth');
    sessionStorage.removeItem('mu_cons');
    sessionStorage.removeItem('mu_cons_local');

    const orgs  = getOrgs();
    const found = orgs.find(o => o.email.toLowerCase() === email);
    if (!found) {
      rlFail('org_' + email);
      err.textContent = '⚠️ البريد غير مسجّل';
      err.style.display = 'block'; return;
    }
    if (found.status === 'قيد المراجعة') {
      err.textContent = '⚠️ طلب التسجيل لا يزال قيد المراجعة — سيُرسل إليك بريد عند الاعتماد';
      err.style.display = 'block'; return;
    }
    if (found.status !== 'نشطة') {
      err.textContent = '⚠️ الحساب غير نشط — تواصل مع المركز';
      err.style.display = 'block'; return;
    }
    const pwdOk = await checkOrgPwd(found.id, pass, found.email);
    if (!pwdOk) {
      rlFail('org_' + email);
      err.textContent = '⚠️ كلمة المرور غير صحيحة';
      err.style.display = 'block'; return;
    }
    rlClear('org_' + email);
    _orgRec       = found;
    _orgOtpBundle = makeOtp();
    toast(`📧 رمز التحقق (صالح 5 دقائق) إلى ${email}: ${_orgOtpBundle.code}`, 't-inf', 5000);
    err.style.display = 'none';
    document.getElementById('orgOtpHint').textContent = `تم إرسال الرمز إلى ${email}`;
    document.getElementById('loginOrgOtp').value = '';
    document.getElementById('loginOrgOtpErr').style.display = 'none';
    showOrgLoginStep('otp');
    setTimeout(() => document.getElementById('loginOrgOtp')?.focus(), 100);
  } catch(e) {
    err.textContent = '⚠️ ' + (e.message || 'خطأ');
    err.style.display = 'block';
  } finally {
    btn.disabled = false; btn.textContent = 'دخول ←';
  }
}

function verifyOrgOtp() {
  const entered = (document.getElementById('loginOrgOtp')?.value || '').trim();
  const err     = document.getElementById('loginOrgOtpErr');
  if (!entered) { err.textContent = '⚠️ يرجى إدخال الرمز'; err.style.display = 'block'; return; }
  if (otpExpired(_orgOtpBundle)) {
    err.textContent = '⚠️ انتهت صلاحية الرمز — اضغط "إعادة إرسال"'; err.style.display = 'block'; return;
  }
  if (entered !== _orgOtpBundle?.code) {
    err.textContent = '⚠️ الرمز غير صحيح'; err.style.display = 'block'; return;
  }
  err.style.display = 'none';
  const hasPwd = !!(JSON.parse(localStorage.getItem('mu_org_pwd')||'{}')[_orgRec?.id]);
  if (!hasPwd) {
    document.getElementById('loginOrgNewPass').value  = '';
    document.getElementById('loginOrgConfPass').value = '';
    document.getElementById('loginOrgChPassErr').style.display = 'none';
    showOrgLoginStep('chpass');
    setTimeout(() => document.getElementById('loginOrgNewPass')?.focus(), 100);
  } else {
    _completeOrgLogin();
  }
}

function resendOrgOtp() {
  if (!_orgRec) return;
  _orgOtpBundle = makeOtp();
  toast(`📧 رمز جديد (صالح 5 دقائق) إلى ${_orgRec.email}: ${_orgOtpBundle.code}`, 't-inf', 5000);
  document.getElementById('loginOrgOtp').value = '';
  document.getElementById('loginOrgOtpErr').style.display = 'none';
}

async function changeOrgPassword() {
  const newPass  = document.getElementById('loginOrgNewPass')?.value  || '';
  const confPass = document.getElementById('loginOrgConfPass')?.value || '';
  const err      = document.getElementById('loginOrgChPassErr');
  const btn      = document.querySelector('#org-step-chpass .btn.btn-p');
  if (!_isStrongPwd(newPass)) {
    err.textContent = '⚠️ كلمة المرور لا تستوفي متطلبات الأمان';
    err.style.display = 'block'; return;
  }
  if (newPass !== confPass) {
    err.textContent = '⚠️ كلمتا المرور غير متطابقتين';
    err.style.display = 'block'; return;
  }
  if (btn) { btn.disabled = true; btn.textContent = 'جارٍ الحفظ...'; }
  await saveOrgPwdSecure(_orgRec.id, newPass);
  if (btn) { btn.disabled = false; btn.textContent = 'حفظ وتسجيل الدخول ←'; }
  err.style.display = 'none';
  _completeOrgLogin();
}

function _completeOrgLogin() {
  const org = { id: _orgRec.id, name: _orgRec.name, email: _orgRec.email, contact: _orgRec.contact };
  sessionStorage.setItem('mu_org', JSON.stringify(org));
  touchSession();
  _orgOtpBundle = null; _orgRec = null;
  document.getElementById('loginOv').classList.remove('open');
  updateNav();
  go('orgportal');
  toast('مرحباً بك في بوابة الجهات ✓', 't-ok');
}

function orgLogout() {
  sessionStorage.removeItem('mu_org');
  updateNav();
  go('home');
  toast('تم تسجيل الخروج', 't-inf');
}

/* ── Portal rendering ─────────────────── */
function renderOrgPortal() {
  if (!isOrgLoggedIn()) { go('home'); return; }
  const org = getOrgSession();
  document.getElementById('orgPortalName').textContent     = org?.name    || 'الجهة';
  document.getElementById('orgPortalContact').textContent  = org?.contact || '';
  document.getElementById('orgPortalNameSide').textContent = org?.name    || '';
  showOrgPanel('overview');
  loadOrgOverview();
  loadOrgConsultantList();
}

function showOrgPanel(id) {
  document.querySelectorAll('.opanel').forEach(p => p.classList.remove('act'));
  document.getElementById('op-' + id)?.classList.add('act');
  document.querySelectorAll('.opsec a').forEach(a => a.classList.remove('on'));
  document.getElementById('opnav-' + id)?.classList.add('on');
  if (id === 'newreq') loadOrgConsultantList();
}

function loadOrgOverview() {
  const org = getOrgSession();
  if (!org) return;
  const cts       = getContracts().filter(c => c.orgId === org.id);
  const pending   = cts.filter(c => ['قيد الدراسة','مرسل للمنسوب'].includes(c.status)).length;
  const accepted  = cts.filter(c => c.status === 'مقبول من المنسوب').length;
  const active    = cts.filter(c => c.status === 'تحت التنفيذ').length;
  const completed = cts.filter(c => c.status === 'مكتمل').length;

  document.getElementById('op-stats').innerHTML = `
    <div class="stat-c"><div class="si">📋</div><div class="sv">${cts.length}</div><div class="sl">إجمالي الطلبات</div></div>
    <div class="stat-c"><div class="si">⏳</div><div class="sv">${pending}</div><div class="sl">قيد الدراسة</div></div>
    <div class="stat-c"><div class="si">⚙️</div><div class="sv">${active}</div><div class="sl">تحت التنفيذ</div></div>
    <div class="stat-c"><div class="si">✅</div><div class="sv">${completed}</div><div class="sl">مكتملة</div></div>`;

  const rows = cts.length
    ? [...cts].reverse().map(c => {
        const cls      = _orgCtCls(c.status);
        const canRate  = c.status === 'مكتمل' && !c.orgRating;
        const rateCell = canRate
          ? `<button class="btn btn-g btn-sm" onclick="showOrgPanel('rate');loadRateForm('${c.id}')">⭐ قيّم</button>`
          : c.orgRating
            ? `<span style="color:#f59e0b;font-size:.85rem">${'★'.repeat(c.orgRating)} ${c.orgRating}/5</span>`
            : '—';
        return `<tr>
          <td><strong>${c.consultant || 'غير محدد'}</strong></td>
          <td style="font-size:.78rem">${c.service}</td>
          <td><span class="tag ${cls}">${c.status}</span></td>
          <td style="font-size:.75rem;color:var(--muted)">${c.date}</td>
          <td>${rateCell}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">لا توجد طلبات بعد — أرسل طلبك الأول</td></tr>';

  document.getElementById('op-contracts-tbl').innerHTML =
    '<tr><th>المستشار</th><th>نوع الخدمة</th><th>الحالة</th><th>التاريخ</th><th>تقييم</th></tr>' + rows;
}

function _orgCtCls(s) {
  if (s === 'مكتمل')                return 'tag-g';
  if (s === 'مرفوض' || s === 'مرفوض من المنسوب') return 'tag-r';
  if (s === 'تحت التنفيذ' || s === 'مقبول من المنسوب') return 'tag-b';
  return 'tag-gold';
}

/* ── Load consultant list for new request ── */
function loadOrgConsultantList() {
  const sel = document.getElementById('opreq-consultant');
  if (!sel) return;
  const all = getAllConsultants().filter(c => c.available !== false && c.verified);
  sel.innerHTML = '<option value="">— اختر منسوباً (اختياري) —</option>' +
    all.map(c => `<option value="${c.id}">${c.name} | ${c.college || ''}</option>`).join('');
}

/* ── Submit new request ─────────────────── */
function submitOrgRequest() {
  const org = getOrgSession();
  if (!org) return;

  const consultantId = document.getElementById('opreq-consultant')?.value || '';
  const service      = document.getElementById('opreq-service')?.value    || '';
  const desc         = (document.getElementById('opreq-desc')?.value      || '').trim();
  const mode         = document.getElementById('opreq-mode')?.value       || 'حضوري';
  const duration     = (document.getElementById('opreq-duration')?.value  || '').trim();
  const err          = document.getElementById('opreq-err');

  if (!service || !desc) {
    err.textContent = '⚠️ يرجى اختيار نوع الخدمة وكتابة وصف المهمة';
    err.style.display = 'block'; return;
  }

  const all  = getAllConsultants();
  const cons = consultantId ? all.find(c => String(c.id) === String(consultantId)) : null;

  const ct = addContract({
    consultantId: cons?.id   || null,
    consultant:   cons?.name || 'غير محدد',
    orgId:        org.id,
    org:          org.name,
    orgEmail:     org.email,
    contact:      org.contact,
    service, desc, mode, duration
  });

  err.style.display = 'none';
  toast(`✅ تم إرسال الطلب — رقمه: ${ct.id}`, 't-ok', 5000);
  ['opreq-desc','opreq-duration'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const s = document.getElementById('opreq-service'); if (s) s.selectedIndex = 0;
  const co = document.getElementById('opreq-consultant'); if (co) co.selectedIndex = 0;
  showOrgPanel('overview');
  loadOrgOverview();
}

/* ── Rating ─────────────────────────────── */
let _ratingCtId   = null;
let _selectedStar = 0;

function loadRateForm(ctId) {
  _ratingCtId   = ctId;
  _selectedStar = 0;
  const ct = getContracts().find(c => String(c.id) === String(ctId));
  const el = document.getElementById('op-rate-info');
  if (el) el.textContent = ct ? `تقييم: ${ct.consultant} — ${ct.service}` : '';
  const note = document.getElementById('op-rating-note');
  if (note) note.value = '';
  setStarRating(0);
  document.getElementById('op-rating-err').style.display = 'none';
}

function setStarRating(val) {
  _selectedStar = val;
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById('orgstar-' + i);
    if (el) {
      el.style.color    = i <= val ? '#f59e0b' : 'var(--muted)';
      el.style.fontSize = '1.8rem';
    }
  }
}

function submitOrgRating() {
  const rating = _selectedStar;
  const note   = (document.getElementById('op-rating-note')?.value || '').trim();
  const err    = document.getElementById('op-rating-err');
  if (!rating) {
    err.textContent = '⚠️ يرجى اختيار عدد النجوم';
    err.style.display = 'block'; return;
  }
  if (!_ratingCtId) return;
  updateContract(_ratingCtId, { orgRating: rating, orgRatingNote: note });
  err.style.display = 'none';
  toast(`✅ شكراً على تقييمك (${rating}/5)`, 't-ok');
  _ratingCtId = null; _selectedStar = 0;
  showOrgPanel('overview');
  loadOrgOverview();
}

/* ── Org portal password change ─────────── */
async function orgPortalChangePassword() {
  const org = getOrgSession();
  if (!org) return;
  const curPass  = document.getElementById('op-curpass')?.value  || '';
  const newPass  = document.getElementById('op-newpass')?.value  || '';
  const confPass = document.getElementById('op-confpass')?.value || '';
  const err      = document.getElementById('op-pwd-err');
  const btn      = document.querySelector('#op-chpass .btn.btn-p');

  const curOk = await checkOrgPwd(org.id, curPass, org.email);
  if (!curOk) {
    err.textContent = '⚠️ كلمة المرور الحالية غير صحيحة'; err.style.display = 'block'; return;
  }
  if (!_isStrongPwd(newPass)) {
    err.textContent = '⚠️ كلمة المرور لا تستوفي متطلبات الأمان (8 أحرف + كبير + صغير + رقم + رمز)';
    err.style.display = 'block'; return;
  }
  if (newPass !== confPass) {
    err.textContent = '⚠️ كلمتا المرور غير متطابقتين'; err.style.display = 'block'; return;
  }
  if (btn) { btn.disabled = true; btn.textContent = 'جارٍ الحفظ...'; }
  await saveOrgPwdSecure(org.id, newPass);
  if (btn) { btn.disabled = false; btn.textContent = 'حفظ كلمة المرور ←'; }
  err.style.display = 'none';
  ['op-curpass','op-newpass','op-confpass'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  checkPwdStrength('', 'op');
  toast('✅ تم تغيير كلمة المرور بنجاح', 't-ok');
  showOrgPanel('overview');
}
