/* ══════════════════════════════════════
   PORTAL — بوابة المنسوب
══════════════════════════════════════ */

function isConsultantLoggedIn() {
  return !!sessionStorage.getItem('mu_cons');
}

function getConsultantSession() {
  try { return JSON.parse(sessionStorage.getItem('mu_cons') || 'null'); } catch { return null; }
}


/* ── Consultant password helpers ─────────── */
function _getConsPwd(empId) {
  try { return JSON.parse(localStorage.getItem('mu_cons_pwd') || '{}')[empId] || null; } catch { return null; }
}
function _saveConsPwd(empId, pass) {
  const store = JSON.parse(localStorage.getItem('mu_cons_pwd') || '{}');
  store[empId] = pass;
  localStorage.setItem('mu_cons_pwd', JSON.stringify(store));
}
function _isStrongPwd(p) {
  return p.length >= 8 &&
    /[A-Z]/.test(p) &&
    /[a-z]/.test(p) &&
    /[0-9]/.test(p) &&
    /[^A-Za-z0-9]/.test(p);
}
/* live strength checker — pfx matches element IDs like pp-len, lp-len */
function checkPwdStrength(val, pfx) {
  const rules = [
    ['len',   val.length >= 8,          '8 أحرف على الأقل'],
    ['upper', /[A-Z]/.test(val),        'حرف كبير (A-Z)'],
    ['lower', /[a-z]/.test(val),        'حرف صغير (a-z)'],
    ['num',   /[0-9]/.test(val),        'رقم (0-9)'],
    ['sym',   /[^A-Za-z0-9]/.test(val), 'رمز خاص (!@#$...)'],
  ];
  rules.forEach(([k, ok, label]) => {
    const el = document.getElementById(`${pfx}-${k}`);
    if (!el) return;
    el.style.color   = ok ? 'var(--green)' : 'var(--muted)';
    el.textContent   = (ok ? '✓ ' : '☐ ') + label;
  });
}

/* temp state during login flow */
let _consOtpBundle = null; // {code, exp}
let _consReg       = null;

/* ── Step helper ──────────────────────────── */
function showConsStep(name) {
  ['creds','otp','chpass'].forEach(s => {
    const el = document.getElementById('cons-step-' + s);
    if (el) el.style.display = s === name ? '' : 'none';
  });
}

function toggleConsPassVis() {
  const inp = document.getElementById('loginConsPass');
  if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
}

/* ── Step 1: check credentials ────────────── */
async function doConsultantLogin() {
  const email = (document.getElementById('loginConsEmail')?.value || '').trim().toLowerCase();
  const pass  =  document.getElementById('loginConsPass')?.value  || '';
  const err   = document.getElementById('loginConsErr');

  if (!email || !pass) {
    err.textContent = '⚠️ يرجى إدخال البريد الجامعي وكلمة المرور';
    err.style.display = 'block'; return;
  }

  /* rate limit check */
  const rl = rlCheck('cons_' + email);
  if (!rl.ok) { err.textContent = rl.msg; err.style.display = 'block'; return; }

  const btn = document.getElementById('consLoginBtn');
  btn.disabled = true; btn.textContent = 'جارٍ التحقق...';

  try {
    sessionStorage.removeItem('mu_auth');
    sessionStorage.removeItem('mu_token');
    sessionStorage.removeItem('mu_admin');
    sessionStorage.removeItem('mu_org');

    const regs  = (typeof getRegs === 'function') ? getRegs() : [];
    const found = regs.find(r =>
      (r.email || '').toLowerCase() === email && r.status === 'معتمد'
    );

    if (!found) {
      rlFail('cons_' + email);
      err.textContent = '⚠️ البريد غير مسجّل أو الحساب لم يُعتمد بعد';
      err.style.display = 'block'; return;
    }

    /* verify password (SHA-256 hashed or default empId) */
    const pwdOk = await checkConsPwd(found.empId, pass, found.empId);
    if (!pwdOk) {
      rlFail('cons_' + email);
      err.textContent = '⚠️ كلمة المرور غير صحيحة';
      err.style.display = 'block'; return;
    }

    rlClear('cons_' + email);
    _consReg        = found;
    _consOtpBundle  = makeOtp();

    toast(`📧 رمز التحقق (صالح 5 دقائق) إلى ${email}: ${_consOtpBundle.code}`, 't-inf', 5000);
    err.style.display = 'none';
    document.getElementById('otpEmailHint').textContent = `تم إرسال الرمز إلى ${email}`;
    document.getElementById('loginConsOtp').value = '';
    document.getElementById('loginOtpErr').style.display = 'none';
    showConsStep('otp');
    setTimeout(() => document.getElementById('loginConsOtp')?.focus(), 100);

  } catch (e) {
    err.textContent = '⚠️ ' + (e.message || 'خطأ غير متوقع');
    err.style.display = 'block';
  } finally {
    btn.disabled = false; btn.textContent = 'دخول ←';
  }
}

/* ── Step 2: verify OTP ───────────────────── */
function verifyConsOtp() {
  const entered = (document.getElementById('loginConsOtp')?.value || '').trim();
  const err     = document.getElementById('loginOtpErr');
  if (!entered) { err.textContent = '⚠️ يرجى إدخال رمز التحقق'; err.style.display = 'block'; return; }
  if (otpExpired(_consOtpBundle)) {
    err.textContent = '⚠️ انتهت صلاحية الرمز — اضغط "إعادة إرسال"'; err.style.display = 'block'; return;
  }
  if (entered !== _consOtpBundle?.code) {
    err.textContent = '⚠️ الرمز غير صحيح، حاول مجدداً'; err.style.display = 'block'; return;
  }
  err.style.display = 'none';

  /* first login? no stored hash → force change */
  const hasPwd = !!(JSON.parse(localStorage.getItem('mu_cons_pwd')||'{}')[_consReg?.empId]);
  if (!hasPwd) {
    document.getElementById('loginConsNewPass').value  = '';
    document.getElementById('loginConsConfPass').value = '';
    document.getElementById('loginChPassErr').style.display = 'none';
    showConsStep('chpass');
    setTimeout(() => document.getElementById('loginConsNewPass')?.focus(), 100);
  } else {
    _completeConsLogin();
  }
}

function resendConsOtp() {
  if (!_consReg) return;
  _consOtpBundle = makeOtp();
  toast(`📧 رمز جديد (صالح 5 دقائق) إلى ${_consReg.email}: ${_consOtpBundle.code}`, 't-inf', 5000);
  document.getElementById('loginConsOtp').value = '';
  document.getElementById('loginOtpErr').style.display = 'none';
}

/* ── Step 3: change default password ─────── */
async function changeConsPassword() {
  const newPass  = document.getElementById('loginConsNewPass')?.value  || '';
  const confPass = document.getElementById('loginConsConfPass')?.value || '';
  const err      = document.getElementById('loginChPassErr');
  const btn      = document.querySelector('#cons-step-chpass .btn.btn-p');

  if (!_isStrongPwd(newPass)) {
    err.textContent = '⚠️ كلمة المرور لا تستوفي متطلبات الأمان'; err.style.display = 'block'; return;
  }
  if (newPass !== confPass) {
    err.textContent = '⚠️ كلمتا المرور غير متطابقتين'; err.style.display = 'block'; return;
  }
  if (newPass === _consReg.empId) {
    err.textContent = '⚠️ لا يمكن استخدام رقم المنسوب ككلمة مرور'; err.style.display = 'block'; return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'جارٍ الحفظ...'; }
  await saveConsPwdSecure(_consReg.empId, newPass);
  if (btn) { btn.disabled = false; btn.textContent = 'حفظ وتسجيل الدخول ←'; }
  err.style.display = 'none';
  _completeConsLogin();
}

/* ── Finalise login ───────────────────────── */
function _completeConsLogin() {
  const cons = {
    id:        _consReg.id,
    full_name: `${_consReg.firstName} ${_consReg.lastName}`,
    emp_id:    _consReg.empId,
    email:     _consReg.email
  };
  sessionStorage.setItem('mu_cons', JSON.stringify(cons));
  sessionStorage.setItem('mu_cons_local', '1');
  touchSession();
  _consOtpBundle = null;
  _consReg       = null;

  document.getElementById('loginOv').classList.remove('open');
  updateNav();
  go('portal');
  toast('مرحباً بك في بوابة المنسوب ✓', 't-ok');
}

function consultantLogout() {
  API.consultantLogout();
  sessionStorage.removeItem('mu_cons_local');
  updateNav();
  go('home');
  toast('تم تسجيل الخروج', 't-inf');
}

/* ── Portal rendering ─────────────────────── */
async function renderPortal() {
  if (!isConsultantLoggedIn()) { go('home'); return; }

  const cons = getConsultantSession();
  const name  = cons?.full_name || 'المنسوب';
  const empId = cons?.emp_id || '';
  document.getElementById('portalName').textContent    = name;
  document.getElementById('portalEmpId').textContent   = empId;
  document.getElementById('portalNameSide').textContent = name;
  document.getElementById('portalIdSide').textContent  = empId;

  showPortalPanel('overview');
  await loadPortalOverview();
  /* update incoming badge count */
  const pending = getContracts().filter(c =>
    String(c.consultantId) === String(cons?.id) &&
    (c.status === 'مرسل للمنسوب' || c.status === 'قيد الدراسة')
  ).length;
  const badge = document.getElementById('incoming-badge');
  if (badge) badge.textContent = pending > 0 ? ` (${pending})` : '';
}

function showPortalPanel(id) {
  document.querySelectorAll('.ppanel').forEach(p => p.classList.remove('act'));
  document.getElementById('pp-' + id)?.classList.add('act');
  document.querySelectorAll('.psec a').forEach(a => a.classList.remove('on'));
  document.getElementById('pnav-' + id)?.classList.add('on');
  if (id === 'incoming') loadPortalIncoming();
}

/* ── Incoming contracts for consultant ── */
function loadPortalIncoming() {
  const cons = getConsultantSession();
  if (!cons) return;
  const el  = document.getElementById('pp-incoming-list');
  if (!el) return;

  const pending = getContracts().filter(c =>
    String(c.consultantId) === String(cons.id) &&
    (c.status === 'مرسل للمنسوب' || c.status === 'قيد الدراسة')
  );
  const history = getContracts().filter(c =>
    String(c.consultantId) === String(cons.id) &&
    !['مرسل للمنسوب','قيد الدراسة'].includes(c.status)
  );

  const pHtml = pending.length
    ? pending.map(c => `
      <div class="pp-card" style="margin-bottom:14px;border-right:3px solid var(--gold)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-weight:700;color:var(--navy);font-size:.95rem">📄 ${c.service}</div>
            <div style="font-size:.8rem;color:var(--txt2);margin-top:4px">الجهة: <strong>${c.org}</strong> | التاريخ: ${c.date}</div>
            ${c.desc ? `<div style="font-size:.82rem;color:var(--txt2);margin-top:6px;line-height:1.6;padding:8px 12px;background:var(--surf2);border-radius:8px">${c.desc}</div>` : ''}
            <div style="font-size:.78rem;color:var(--muted);margin-top:6px">نمط التنفيذ: ${c.mode} | المدة: ${c.duration || 'غير محدد'}</div>
          </div>
          <span class="tag tag-gold">${c.status}</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
          <button class="btn btn-p btn-sm" onclick="acceptIncomingContract('${c.id}')">✅ قبول الطلب</button>
          <button class="btn btn-sm" style="background:rgba(192,57,43,.08);color:var(--red);border-radius:10px;padding:7px 12px;font-size:.8rem;font-weight:700"
            onclick="rejectIncomingContract('${c.id}')">❌ رفض الطلب</button>
        </div>
      </div>`).join('')
    : '<div style="text-align:center;padding:20px;color:var(--muted)">لا توجد طلبات واردة حالياً</div>';

  const hHtml = history.length
    ? `<h4 style="margin:20px 0 12px;color:var(--navy);font-size:.9rem">تاريخ الطلبات</h4>` +
      history.slice().reverse().map(c => {
        const cls = c.status==='مكتمل'?'tag-g':c.status==='مرفوض'||c.status==='مرفوض من المنسوب'?'tag-r':c.status==='تحت التنفيذ'?'tag-b':'tag-gold';
        const earn = c.fee ? `<span style="color:var(--green);font-weight:700">${Math.round(c.fee*0.7).toLocaleString('ar-SA')} ر.س</span>` : '';
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--surf);border:1px solid var(--bdr);border-radius:10px;margin-bottom:8px;flex-wrap:wrap;gap:6px">
          <div>
            <span style="font-weight:600;font-size:.85rem">${c.service} — ${c.org}</span>
            <div style="font-size:.75rem;color:var(--muted)">${c.date}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            ${earn}
            <span class="tag ${cls}" style="font-size:.65rem">${c.status}</span>
          </div>
        </div>`;
      }).join('')
    : '';

  el.innerHTML = pHtml + hHtml;

  /* incoming count badge */
  const badge = document.getElementById('incoming-badge');
  if (badge) badge.textContent = pending.length > 0 ? ` (${pending.length})` : '';
}

function acceptIncomingContract(id) {
  updateContract(id, { consultantDecision: 'مقبول', status: 'مقبول من المنسوب' });
  toast('✅ تم قبول الطلب — بانتظار موافقة المركز', 't-ok', 4000);
  loadPortalIncoming();
  loadPortalOverview();
}

function rejectIncomingContract(id) {
  const note = prompt('سبب الرفض (اختياري):') || '';
  updateContract(id, { consultantDecision: 'مرفوض', consultantNote: note, status: 'مرفوض من المنسوب' });
  toast('تم رفض الطلب', 't-inf');
  loadPortalIncoming();
}

async function loadPortalOverview() {
  const el = document.getElementById('pp-overview');
  if (!el) return;

  let profile = null;
  let stats   = { rating: 0, reviews_count: 0, contracts_count: 0, completed: 0, total_earned: 0 };
  let contracts = [];

  try {
    if (!sessionStorage.getItem('mu_cons_local')) {
      [profile, stats, contracts] = await Promise.all([
        API.getMyProfile(),
        API.getMyStats(),
        API.getMyContracts()
      ]);
    }
  } catch (_) {}

  /* stats cards */
  document.getElementById('pp-stats').innerHTML = `
    <div class="stat-c"><div class="si">⭐</div><div class="sv">${(stats.rating || 0).toFixed ? (+stats.rating).toFixed(1) : stats.rating || 0}</div><div class="sl">متوسط التقييم</div></div>
    <div class="stat-c"><div class="si">📄</div><div class="sv">${stats.contracts_count || 0}</div><div class="sl">إجمالي العقود</div></div>
    <div class="stat-c"><div class="si">✅</div><div class="sv">${stats.completed || 0}</div><div class="sl">عقود مكتملة</div></div>
    <div class="stat-c"><div class="si">💰</div><div class="sv">${Number(stats.total_earned || 0).toLocaleString('ar-SA')}</div><div class="sl">إجمالي الأرباح (ر.س)</div></div>`;

  /* contracts table */
  const ct = contracts.length
    ? contracts.map(c => `
        <tr>
          <td><strong>${c.org_name}</strong></td>
          <td style="font-size:.78rem">${c.service_type}</td>
          <td>${c.consultant_share ? Number(c.consultant_share).toLocaleString('ar-SA') + ' ر.س' : '—'}</td>
          <td><span class="tag ${contractStatusClass(c.status)}">${c.status}</span></td>
          <td style="font-size:.75rem;color:var(--muted)">${new Date(c.created_at).toLocaleDateString('ar-SA')}</td>
        </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">لا توجد عقود حتى الآن</td></tr>';
  document.getElementById('pp-contracts-tbl').innerHTML =
    '<tr><th>الجهة</th><th>نوع الخدمة</th><th>حصتك</th><th>الحالة</th><th>التاريخ</th></tr>' + ct;
}

function contractStatusClass(s) {
  if (s === 'مكتمل')        return 'tag-g';
  if (s === 'مرفوض')        return 'tag-r';
  if (s === 'تحت التنفيذ')  return 'tag-b';
  return 'tag-gold';
}

/* ── Edit profile ────────────────────────── */
function showEditProfile() {
  showPortalPanel('edit');
}

async function saveProfile() {
  const btn = document.getElementById('saveProfileBtn');
  btn.disabled = true;
  try {
    const data = {
      phone:        document.getElementById('ep-phone').value.trim() || undefined,
      linkedin_url: document.getElementById('ep-linkedin').value.trim() || undefined,
      title:        document.getElementById('ep-title').value.trim() || undefined,
      rate:         document.getElementById('ep-rate').value ? +document.getElementById('ep-rate').value : undefined,
      rate_type:    document.getElementById('ep-ratetype').value || undefined,
      is_available: document.getElementById('ep-available').value === '1' ? 1 : 0,
    };
    if (!sessionStorage.getItem('mu_cons_local')) {
      await API.updateMyProfile(data);
    }
    toast('تم حفظ التعديلات بنجاح ✓', 't-ok');
    showPortalPanel('overview');
    await loadPortalOverview();
  } catch (e) {
    toast('خطأ: ' + e.message, 't-err');
  } finally {
    btn.disabled = false;
  }
}

/* ── Portal: change password (after login) ── */
async function portalChangePassword() {
  const cons    = getConsultantSession();
  if (!cons) return;
  const curPass  = document.getElementById('pp-curpass')?.value  || '';
  const newPass  = document.getElementById('pp-newpass')?.value  || '';
  const confPass = document.getElementById('pp-confpass')?.value || '';
  const err      = document.getElementById('pp-pwd-err');
  const btn      = document.querySelector('#pp-chpass .btn.btn-p');

  const curOk = await checkConsPwd(cons.emp_id, curPass, cons.emp_id);
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
  if (newPass === cons.emp_id) {
    err.textContent = '⚠️ لا يمكن استخدام رقم المنسوب ككلمة مرور'; err.style.display = 'block'; return;
  }
  if (btn) { btn.disabled = true; btn.textContent = 'جارٍ الحفظ...'; }
  await saveConsPwdSecure(cons.emp_id, newPass);
  if (btn) { btn.disabled = false; btn.textContent = 'حفظ كلمة المرور ←'; }
  err.style.display = 'none';
  ['pp-curpass','pp-newpass','pp-confpass'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  checkPwdStrength('', 'pp');
  toast('✅ تم تغيير كلمة المرور بنجاح', 't-ok');
  showPortalPanel('overview');
}
