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

/* temp state during login flow */
let _consOtp  = null;
let _consReg  = null; // the matched registration record

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
  const email = (document.getElementById('loginConsEmail')?.value || '').trim();
  const pass  = (document.getElementById('loginConsPass')?.value  || '');
  const err   = document.getElementById('loginConsErr');

  if (!email || !pass) {
    err.textContent = '⚠️ يرجى إدخال البريد الجامعي وكلمة المرور';
    err.style.display = 'block';
    return;
  }

  const btn = document.getElementById('consLoginBtn');
  btn.disabled = true;
  btn.textContent = 'جارٍ التحقق...';

  try {
    /* clear any existing admin session */
    sessionStorage.removeItem('mu_auth');
    sessionStorage.removeItem('mu_token');
    sessionStorage.removeItem('mu_admin');

    /* find approved registration by email */
    const regs  = (typeof getRegs === 'function') ? getRegs() : [];
    const found = regs.find(r =>
      (r.email || '').toLowerCase() === email.toLowerCase() &&
      r.status === 'معتمد'
    );

    if (!found) {
      err.textContent = '⚠️ البريد غير مسجّل أو الحساب لم يُعتمد بعد';
      err.style.display = 'block';
      return;
    }

    /* check password: stored password OR default (empId) */
    const storedPwd  = _getConsPwd(found.empId);
    const expectedPwd = storedPwd || found.empId;
    if (pass !== expectedPwd) {
      err.textContent = '⚠️ كلمة المرور غير صحيحة';
      err.style.display = 'block';
      return;
    }

    /* credentials OK — generate OTP */
    _consReg = found;
    _consOtp = String(Math.floor(100000 + Math.random() * 900000));

    /* simulate sending email: show code in a toast (demo mode) */
    toast(`📧 رمز التحقق المرسل إلى ${email} هو: ${_consOtp}`, 't-inf', 20000);

    err.style.display = 'none';
    document.getElementById('otpEmailHint').textContent =
      `تم إرسال رمز التحقق إلى ${email}`;
    document.getElementById('loginConsOtp').value = '';
    document.getElementById('loginOtpErr').style.display = 'none';
    showConsStep('otp');
    setTimeout(() => document.getElementById('loginConsOtp')?.focus(), 100);

  } catch (e) {
    err.textContent = '⚠️ ' + (e.message || 'خطأ غير متوقع');
    err.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'دخول ←';
  }
}

/* ── Step 2: verify OTP ───────────────────── */
function verifyConsOtp() {
  const entered = (document.getElementById('loginConsOtp')?.value || '').trim();
  const err     = document.getElementById('loginOtpErr');
  if (!entered) { err.textContent = '⚠️ يرجى إدخال رمز التحقق'; err.style.display = 'block'; return; }
  if (entered !== _consOtp) { err.textContent = '⚠️ الرمز غير صحيح، حاول مجدداً'; err.style.display = 'block'; return; }

  err.style.display = 'none';

  /* first login? no stored password yet → force change */
  if (!_getConsPwd(_consReg.empId)) {
    document.getElementById('loginConsNewPass').value = '';
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
  _consOtp = String(Math.floor(100000 + Math.random() * 900000));
  toast(`📧 رمز جديد أُرسل إلى ${_consReg.email}: ${_consOtp}`, 't-inf', 20000);
  document.getElementById('loginConsOtp').value = '';
  document.getElementById('loginOtpErr').style.display = 'none';
}

/* ── Step 3: change default password ─────── */
function changeConsPassword() {
  const newPass  = document.getElementById('loginConsNewPass')?.value  || '';
  const confPass = document.getElementById('loginConsConfPass')?.value || '';
  const err      = document.getElementById('loginChPassErr');

  if (newPass.length < 8) {
    err.textContent = '⚠️ كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    err.style.display = 'block'; return;
  }
  if (newPass !== confPass) {
    err.textContent = '⚠️ كلمتا المرور غير متطابقتين';
    err.style.display = 'block'; return;
  }
  if (newPass === _consReg.empId) {
    err.textContent = '⚠️ لا يمكن استخدام رقم المنسوب ككلمة مرور';
    err.style.display = 'block'; return;
  }

  _saveConsPwd(_consReg.empId, newPass);
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
  _consOtp = null;
  _consReg = null;

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
}

function showPortalPanel(id) {
  document.querySelectorAll('.ppanel').forEach(p => p.classList.remove('act'));
  document.getElementById('pp-' + id)?.classList.add('act');
  document.querySelectorAll('.psec a').forEach(a => a.classList.remove('on'));
  document.getElementById('pnav-' + id)?.classList.add('on');
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
