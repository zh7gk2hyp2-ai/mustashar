/* ══════════════════════════════════════
   AUTH — تسجيل دخول المشرف والمنسوب
   admin / tu2025
══════════════════════════════════════ */
const ADMIN = { user: 'admin', pass: 'tu2025' };

function isLoggedIn()           { return sessionStorage.getItem('mu_auth') === '1'; }

/* ── Nav state ─────────────────────────── */
function updateNav() {
  const adminIn = isLoggedIn();
  const consIn  = isConsultantLoggedIn();
  const orgIn   = (typeof isOrgLoggedIn === 'function') && isOrgLoggedIn();

  const show = (id, vis) => {
    document.getElementById('nl-' + id) && (document.getElementById('nl-' + id).style.display  = vis ? '' : 'none');
    document.getElementById('mob-' + id) && (document.getElementById('mob-' + id).style.display = vis ? '' : 'none');
  };

  show('dashboard', adminIn);
  show('portal',    consIn);
  show('orgportal', orgIn);

  /* login / logout button */
  const btn      = document.getElementById('navLoginBtn');
  const mobLogin = document.getElementById('mob-login');
  const logoutFn = adminIn ? logout : consIn ? consultantLogout : orgIn && typeof orgLogout === 'function' ? orgLogout : null;
  if (logoutFn) {
    btn.textContent = '🚪 خروج';
    btn.onclick = logoutFn;
    if (mobLogin) { mobLogin.textContent = '🚪 خروج'; mobLogin.onclick = logoutFn; }
  } else {
    btn.textContent = 'تسجيل الدخول';
    btn.onclick = () => openLoginModal();
    if (mobLogin) { mobLogin.textContent = 'تسجيل الدخول'; mobLogin.onclick = () => openLoginModal(); }
  }
}

/* ── Modal open ────────────────────────── */
function openLoginModal(tab) {
  switchLoginTab(tab || 'admin');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginErr').style.display = 'none';
  ['loginConsEmail','loginConsPass','loginConsOtp','loginConsNewPass','loginConsConfPass'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['loginConsErr','loginOtpErr','loginChPassErr'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  showConsStep('creds');
  /* reset org tab */
  ['loginOrgEmail','loginOrgPass','loginOrgOtp','loginOrgNewPass','loginOrgConfPass'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['loginOrgErr','loginOrgOtpErr','loginOrgChPassErr','oregErr'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  if (typeof showOrgLoginStep === 'function') showOrgLoginStep('creds');
  document.getElementById('loginOv').classList.add('open');
}

/* ── Tab switcher ──────────────────────── */
function switchLoginTab(tab) {
  ['admin','consultant','org'].forEach(t => {
    document.getElementById('tab-' + t)?.classList.toggle('on', t === tab);
    document.getElementById('tabp-' + t)?.classList.toggle('on', t === tab);
  });
}

/* kept for backward compat */
function navDash()   { if (isLoggedIn()) go('dashboard'); else openLoginModal('admin'); }
function navPortal() { if (isConsultantLoggedIn()) go('portal'); else openLoginModal('consultant'); }

/* ── Admin login ───────────────────────── */
function doLogin() {
  const u   = document.getElementById('loginUser').value.trim();
  const p   = document.getElementById('loginPass').value;
  const err = document.getElementById('loginErr');

  if (u === ADMIN.user && p === ADMIN.pass) {
    /* clear any existing consultant session first */
    sessionStorage.removeItem('mu_cons');
    sessionStorage.removeItem('mu_cons_token');
    sessionStorage.removeItem('mu_cons_local');

    sessionStorage.setItem('mu_auth', '1');
    err.style.display = 'none';
    document.getElementById('loginOv').classList.remove('open');
    updateNav();
    go('dashboard');
    toast('مرحباً بك في لوحة التحكم', 't-ok');
  } else {
    err.textContent = '⚠️ اسم المستخدم أو كلمة المرور غير صحيحة';
    err.style.display = 'block';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginPass').focus();
  }
}

function logout() {
  sessionStorage.removeItem('mu_auth');
  sessionStorage.removeItem('mu_token');
  sessionStorage.removeItem('mu_admin');
  updateNav();
  go('home');
  toast('تم تسجيل الخروج بنجاح', 't-inf');
}

function togglePassVis() {
  const inp = document.getElementById('loginPass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

/* run on load */
updateNav();
