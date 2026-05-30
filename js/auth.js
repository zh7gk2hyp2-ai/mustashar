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

  /* show/hide protected links */
  ['dashboard'].forEach(id => {
    document.getElementById('nl-' + id).style.display    = adminIn ? '' : 'none';
    document.getElementById('mob-' + id).style.display   = adminIn ? '' : 'none';
  });
  ['portal'].forEach(id => {
    document.getElementById('nl-' + id).style.display    = consIn  ? '' : 'none';
    document.getElementById('mob-' + id).style.display   = consIn  ? '' : 'none';
  });

  /* login / logout button */
  const btn     = document.getElementById('navLoginBtn');
  const mobLogin = document.getElementById('mob-login');
  if (adminIn) {
    btn.textContent = '🚪 خروج';
    btn.onclick = logout;
    if (mobLogin) { mobLogin.textContent = '🚪 خروج'; mobLogin.onclick = logout; }
  } else if (consIn) {
    btn.textContent = '🚪 خروج';
    btn.onclick = consultantLogout;
    if (mobLogin) { mobLogin.textContent = '🚪 خروج'; mobLogin.onclick = consultantLogout; }
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
  if (document.getElementById('loginConsEmpId'))
    document.getElementById('loginConsEmpId').value = '';
  if (document.getElementById('loginConsEmail'))
    document.getElementById('loginConsEmail').value = '';
  if (document.getElementById('loginConsErr'))
    document.getElementById('loginConsErr').style.display = 'none';
  document.getElementById('loginOv').classList.add('open');
}

/* ── Tab switcher ──────────────────────── */
function switchLoginTab(tab) {
  ['admin','consultant'].forEach(t => {
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
