/* ══════════════════════════════════════
   PORTAL — بوابة المنسوب
══════════════════════════════════════ */

function isConsultantLoggedIn() {
  return !!sessionStorage.getItem('mu_cons');
}

function getConsultantSession() {
  try { return JSON.parse(sessionStorage.getItem('mu_cons') || 'null'); } catch { return null; }
}

function navPortal() {
  if (isConsultantLoggedIn()) {
    go('portal');
  } else {
    switchLoginTab('consultant');
    document.getElementById('loginUser').value = '';
    document.getElementById('loginConsEmail').value = '';
    document.getElementById('loginConsErr').style.display = 'none';
    document.getElementById('loginOv').classList.add('open');
  }
}

async function doConsultantLogin() {
  const empId = document.getElementById('loginConsEmpId').value.trim();
  const email = document.getElementById('loginConsEmail').value.trim();
  const err   = document.getElementById('loginConsErr');
  if (!empId || !email) { err.textContent = '⚠️ يرجى إدخال رقم المنسوب والبريد الإلكتروني'; err.style.display = 'block'; return; }

  const btn = document.getElementById('consLoginBtn');
  btn.disabled = true;
  btn.textContent = 'جارٍ التحقق...';

  try {
    /* try real backend first, fall back to localStorage check */
    let success = false;
    try {
      await API.consultantLogin(empId, email);
      success = true;
    } catch (apiErr) {
      /* if backend not available, check localStorage registrations */
      const regs = getRegs ? getRegs() : [];
      const found = regs.find(r =>
        (r.empId || r.emp_id) === empId &&
        (r.email || '').toLowerCase() === email.toLowerCase() &&
        r.status === 'معتمد'
      );
      if (found) {
        const cons = { id: found.empId || found.emp_id, full_name: `${found.firstName || found.first_name} ${found.lastName || found.last_name}`, emp_id: found.empId || found.emp_id };
        sessionStorage.setItem('mu_cons', JSON.stringify(cons));
        sessionStorage.setItem('mu_cons_local', '1');
        success = true;
      }
    }

    if (!success) {
      err.textContent = '⚠️ بيانات غير صحيحة أو الحساب غير معتمد بعد';
      err.style.display = 'block';
      return;
    }

    err.style.display = 'none';
    document.getElementById('loginOv').classList.remove('open');
    go('portal');
    toast('مرحباً بك في بوابة المنسوب', 't-ok');
    renderPortal();
  } catch (e) {
    err.textContent = '⚠️ ' + (e.message || 'خطأ في الاتصال');
    err.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'دخول ←';
  }
}

function consultantLogout() {
  API.consultantLogout();
  sessionStorage.removeItem('mu_cons_local');
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
