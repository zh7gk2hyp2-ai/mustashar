/* ══════════════════════════════════════
   SECURITY — الأمان والحماية
   SHA-256 + Rate Limiting + Session TTL
   + OTP Expiry + XSS Sanitization
══════════════════════════════════════ */

/* ── Password hashing (SHA-256 — Web Crypto API) ── */
async function hashPwd(password) {
  const data = new TextEncoder().encode(password + '\x00mu_salt_2025');
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function verifyPwd(input, stored) {
  if (!stored) return false;
  if (/^[0-9a-f]{64}$/.test(stored)) {
    return (await hashPwd(input)) === stored;
  }
  /* legacy plain-text fallback (migration) */
  return input === stored;
}

/* ── Secure password storage ─────────── */
async function saveConsPwdSecure(empId, password) {
  const h = await hashPwd(password);
  const s = JSON.parse(localStorage.getItem('mu_cons_pwd') || '{}');
  s[empId] = h;
  localStorage.setItem('mu_cons_pwd', JSON.stringify(s));
}
async function checkConsPwd(empId, input, defaultFallback) {
  const h = (JSON.parse(localStorage.getItem('mu_cons_pwd') || '{}'))[empId] || null;
  if (!h) return input === defaultFallback;
  return verifyPwd(input, h);
}

async function saveOrgPwdSecure(orgId, password) {
  const h = await hashPwd(password);
  const s = JSON.parse(localStorage.getItem('mu_org_pwd') || '{}');
  s[orgId] = h;
  localStorage.setItem('mu_org_pwd', JSON.stringify(s));
}
async function checkOrgPwd(orgId, input, defaultFallback) {
  const h = (JSON.parse(localStorage.getItem('mu_org_pwd') || '{}'))[orgId] || null;
  if (!h) return input === defaultFallback;
  return verifyPwd(input, h);
}

/* ── Rate limiting ──────────────────── */
const _RL_MAX  = 5;
const _RL_LOCK = 15 * 60 * 1000;

function rlCheck(key) {
  try {
    const d = (JSON.parse(localStorage.getItem('mu_rl') || '{}'))[key] || {};
    if (d.until && Date.now() < d.until) {
      const m = Math.ceil((d.until - Date.now()) / 60000);
      return { ok: false, msg: `⚠️ تم تعطيل تسجيل الدخول مؤقتاً — حاول بعد ${m} دقيقة` };
    }
    return { ok: true };
  } catch { return { ok: true }; }
}
function rlFail(key) {
  try {
    const all = JSON.parse(localStorage.getItem('mu_rl') || '{}');
    const d   = all[key] || { n: 0 };
    d.n = (d.n || 0) + 1;
    if (d.n >= _RL_MAX) { d.until = Date.now() + _RL_LOCK; d.n = 0; }
    all[key] = d;
    localStorage.setItem('mu_rl', JSON.stringify(all));
  } catch {}
}
function rlClear(key) {
  try {
    const all = JSON.parse(localStorage.getItem('mu_rl') || '{}');
    delete all[key];
    localStorage.setItem('mu_rl', JSON.stringify(all));
  } catch {}
}

/* ── OTP bundle ──────────────────────── */
function makeOtp() {
  return {
    code: String(Math.floor(100000 + Math.random() * 900000)),
    exp:  Date.now() + 5 * 60 * 1000
  };
}
function otpExpired(b)  { return !b || Date.now() > b.exp; }
function otpMinsLeft(b) { return b ? Math.max(0, Math.ceil((b.exp - Date.now()) / 60000)) : 0; }

/* ── Session TTL (8 hours) ───────────── */
const _SESSION_TTL = 8 * 60 * 60 * 1000;

function touchSession() {
  sessionStorage.setItem('mu_exp', String(Date.now() + _SESSION_TTL));
}
function sessionAlive() {
  const exp = sessionStorage.getItem('mu_exp');
  return !exp || Date.now() < Number(exp);
}
function guardSession() {
  const anySession = sessionStorage.getItem('mu_auth') ||
                     sessionStorage.getItem('mu_cons')  ||
                     sessionStorage.getItem('mu_org');
  if (anySession && !sessionAlive()) {
    sessionStorage.clear();
    if (typeof updateNav === 'function') updateNav();
    if (typeof toast === 'function')
      toast('انتهت جلستك تلقائياً — يرجى إعادة تسجيل الدخول', 't-inf', 6000);
    return false;
  }
  return true;
}

/* ── HTML escaping (XSS prevention) ─── */
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#x27;').replace(/`/g,'&#96;');
}

/* ── Input validation ────────────────── */
function validEmail(e) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test((e||'').trim());
}
function validPhone(p) {
  return !p || /^[0-9+\-\s]{7,15}$/.test(p.trim());
}
function validEmpId(id) {
  return /^[a-zA-Z0-9\-]{3,30}$/.test((id||'').trim());
}

/* ── Periodic session guard (15-min check) ── */
setInterval(guardSession, 15 * 60 * 1000);
