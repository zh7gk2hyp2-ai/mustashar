/* ══════════════════════════════════════
   AUTH — تسجيل دخول المشرف والمنسوب
   admin / tu2025
══════════════════════════════════════ */
const ADMIN = { user: 'admin', pass: 'tu2025' };

function isLoggedIn() {
  return sessionStorage.getItem('mu_auth') === '1';
}

/* ── Tab switcher ──────────────────────── */
function switchLoginTab(tab) {
  ['admin','consultant'].forEach(t => {
    document.getElementById('tab-' + t)?.classList.toggle('on', t === tab);
    document.getElementById('tabp-' + t)?.classList.toggle('on', t === tab);
  });
}

function navDash() {
  if (isLoggedIn()) {
    go('dashboard');
  } else {
    switchLoginTab('admin');
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginErr').style.display = 'none';
    document.getElementById('loginOv').classList.add('open');
  }
}

function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const err = document.getElementById('loginErr');

  if (u === ADMIN.user && p === ADMIN.pass) {
    sessionStorage.setItem('mu_auth', '1');
    err.style.display = 'none';
    document.getElementById('loginOv').classList.remove('open');
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
  go('home');
  toast('تم تسجيل الخروج بنجاح', 't-inf');
}

function togglePassVis() {
  const inp = document.getElementById('loginPass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}
