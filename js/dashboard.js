/* ══════════════════════════════════════
   DASHBOARD — لوحة التحكم (يتطلب تسجيل دخول)
══════════════════════════════════════ */
function showPanel(id) {
  document.querySelectorAll('.dpanel').forEach(p => p.classList.remove('act'));
  document.getElementById('pan-' + id).classList.add('act');
  document.querySelectorAll('.dsec a').forEach(a => a.classList.remove('on'));
  document.getElementById('dp-' + id).classList.add('on');
}

function renderDash() {
  const regs = getRegs();
  const ct   = STATE.contracts;

  /* ── الإحصاءات العلوية ── */
  const pendingCount = regs.filter(r => r.status === 'قيد المراجعة').length;
  document.getElementById('dashStats').innerHTML = `
    <div class="stat-c"><div class="si">👤</div><div class="sv">${DATA.length + regs.length}</div><div class="sl">إجمالي المسجلين</div></div>
    <div class="stat-c"><div class="si">🕐</div><div class="sv">${pendingCount}</div><div class="sl">طلبات قيد المراجعة</div></div>
    <div class="stat-c"><div class="si">📄</div><div class="sv">${ct.length}</div><div class="sl">طلبات تعاقد</div></div>
    <div class="stat-c"><div class="si">✅</div><div class="sv">${DATA.length}</div><div class="sl">ملف معتمد</div></div>`;

  /* ── آخر التسجيلات (نظرة عامة) ── */
  document.getElementById('dashRegs').innerHTML =
    `<tr><th>الاسم</th><th>الكلية</th><th>رقم الطلب</th><th>الحالة</th><th>التاريخ</th></tr>` +
    (regs.length
      ? regs.slice(-5).reverse().map(r =>
          `<tr>
            <td>${r.firstName} ${r.lastName}</td>
            <td style="font-size:.78rem;color:var(--muted)">${r.college}</td>
            <td style="font-size:.78rem">${r.id}</td>
            <td><span class="tag ${statusClass(r.status)}">${r.status}</span></td>
            <td>${r.date}</td>
          </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">لا توجد تسجيلات بعد</td></tr>');

  /* ── آخر طلبات التعاقد (نظرة عامة) ── */
  document.getElementById('dashContracts').innerHTML =
    `<tr><th>المستشار</th><th>الجهة</th><th>الخدمة</th><th>الحالة</th><th>التاريخ</th></tr>` +
    (ct.length
      ? ct.slice(-5).reverse().map(c =>
          `<tr>
            <td>${c.consultant}</td><td>${c.org}</td><td>${c.service}</td>
            <td><span class="tag tag-b">${c.status}</span></td>
            <td>${c.date}</td>
          </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">لا توجد طلبات بعد</td></tr>');

  /* ── باقي الألواح ── */
  renderPendingTable();
  renderConsTable(DATA);
  renderContractsList();
  renderBarChart();

  /* شارة عدد الطلبات المعلقة */
  const badge = document.getElementById('pendingBadge');
  if (badge) {
    badge.textContent = pendingCount > 0 ? pendingCount + ' طلب جديد' : 'لا يوجد جديد';
    badge.className = 'tag ' + (pendingCount > 0 ? 'tag-gold' : 'tag-g');
  }
}

/* ── جدول طلبات التسجيل الجديدة ── */
function renderPendingTable() {
  const regs = getRegs();
  const el = document.getElementById('pendingTable');
  if (!el) return;
  el.innerHTML =
    `<tr><th>الاسم</th><th>رقم المنسوب</th><th>الكلية</th><th>النوع</th><th>الحالة</th><th>التاريخ</th><th>إجراء</th></tr>` +
    (regs.length
      ? regs.slice().reverse().map(r =>
          `<tr>
            <td><strong>${r.firstName} ${r.lastName}</strong>
              <div style="font-size:.73rem;color:var(--muted)">${r.email}</div>
            </td>
            <td style="font-size:.78rem">${r.empId}</td>
            <td style="font-size:.78rem;color:var(--muted)">${r.college}</td>
            <td>${r.type}</td>
            <td><span class="tag ${statusClass(r.status)}" id="rs-${r.id}">${r.status}</span></td>
            <td>${r.date}</td>
            <td>
              <div style="display:flex;gap:5px">
                <button class="btn btn-g btn-sm" onclick="approveReg('${r.id}')">قبول</button>
                <button class="btn btn-sm" style="background:rgba(192,57,43,.08);color:var(--red);border-radius:10px;padding:7px 10px;font-size:.78rem;font-weight:700" onclick="rejectReg('${r.id}')">رفض</button>
              </div>
            </td>
          </tr>`).join('')
      : '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">لا توجد طلبات تسجيل بعد</td></tr>');
}

function approveReg(id) {
  updateRegStatus(id, 'معتمد');
  const el = document.getElementById('rs-' + id);
  if (el) { el.textContent = 'معتمد'; el.className = 'tag tag-g'; }
  toast('تم قبول الطلب ✓', 't-ok');
  const badge = document.getElementById('pendingBadge');
  if (badge) {
    const n = getRegs().filter(r => r.status === 'قيد المراجعة').length;
    badge.textContent = n > 0 ? n + ' طلب جديد' : 'لا يوجد جديد';
    badge.className = 'tag ' + (n > 0 ? 'tag-gold' : 'tag-g');
  }
}

function rejectReg(id) {
  updateRegStatus(id, 'مرفوض');
  const el = document.getElementById('rs-' + id);
  if (el) { el.textContent = 'مرفوض'; el.className = 'tag tag-r'; }
  toast('تم رفض الطلب', 't-inf');
}

function updateRegStatus(id, status) {
  const regs = getRegs();
  const reg = regs.find(r => r.id === id);
  if (reg) { reg.status = status; saveRegs(regs); }
}

function statusClass(s) {
  if (s === 'معتمد')        return 'tag-g';
  if (s === 'مرفوض')        return 'tag-r';
  return 'tag-gold';
}

/* ── جدول المنسوبين المعتمدين ── */
function renderConsTable(data) {
  document.getElementById('dashConsTable').innerHTML =
    `<tr><th>الاسم</th><th>الكلية</th><th>التقييم</th><th>التعاقدات</th><th>الحالة</th><th>إجراء</th></tr>` +
    data.map(c =>
      `<tr>
        <td>${c.name}</td>
        <td style="font-size:.78rem;color:var(--muted)">${c.college}</td>
        <td class="stars">${c.rating}★</td>
        <td>${c.contracts}</td>
        <td><span class="tag ${c.verified ? 'tag-g' : 'tag-r'}">${c.verified ? 'معتمد' : 'قيد المراجعة'}</span></td>
        <td><button class="btn btn-g btn-sm" onclick="go('profile',${c.id})">عرض</button></td>
      </tr>`).join('');
}

function filterDash() {
  const q = document.getElementById('dashSearch').value.toLowerCase();
  renderConsTable(DATA.filter(c => [c.name, c.college, c.dept].join(' ').toLowerCase().includes(q)));
}

/* ── قائمة طلبات التعاقد ── */
function renderContractsList() {
  const ct = STATE.contracts;
  document.getElementById('dashContractsList').innerHTML = ct.length
    ? ct.slice().reverse().map(c =>
        `<div class="dc-card">
          <div class="dc-head">
            <div class="dc-title">📄 ${c.service} – ${c.org}</div>
            <span class="dc-status tag tag-b">${c.status}</span>
          </div>
          <div class="dc-info">
            المستشار: ${c.consultant} | المسؤول: ${c.contact} | النمط: ${c.mode || '—'} | التاريخ: ${c.date}
          </div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn btn-g btn-sm"   onclick="updateContractStatus(this,'مقبول')">قبول</button>
            <button class="btn btn-sm" style="background:rgba(192,57,43,.08);color:var(--red);border-radius:10px;padding:7px 12px;font-size:.8rem;font-weight:700" onclick="updateContractStatus(this,'مرفوض')">رفض</button>
            <button class="btn btn-p btn-sm"   onclick="updateContractStatus(this,'تحت التنفيذ')">تحت التنفيذ</button>
            <button class="btn btn-g btn-sm"   onclick="updateContractStatus(this,'مكتمل')">مكتمل</button>
          </div>
        </div>`).join('')
    : '<div class="nores"><div class="ni">📄</div><h3>لا توجد طلبات</h3><p>ستظهر طلبات التعاقد هنا</p></div>';
}

function updateContractStatus(btn, status) {
  btn.closest('.dc-card').querySelector('.dc-status').textContent = status;
  toast('تم تحديث الحالة إلى: ' + status, 't-ok');
}

/* ── الرسم البياني ── */
function renderBarChart() {
  const cols = [
    ['كلية التربية',312], ['كلية الهندسة',189], ['كلية الحاسبات',156],
    ['كلية الطب',134], ['إدارة الأعمال',92], ['الشريعة والأنظمة',78]
  ];
  const max = Math.max(...cols.map(c => c[1]));
  document.getElementById('barChart').innerHTML =
    `<div style="display:flex;flex-direction:column;gap:12px">` +
    cols.map(([n, v]) =>
      `<div style="display:flex;align-items:center;gap:12px">
        <div style="width:130px;font-size:.78rem;color:var(--txt2);text-align:right">${n}</div>
        <div style="flex:1;background:var(--surf2);border-radius:6px;overflow:hidden">
          <div style="width:${(v / max * 100).toFixed(1)}%;height:28px;background:linear-gradient(90deg,var(--blue),var(--sky));border-radius:6px;display:flex;align-items:center;padding-right:8px;transition:width .5s">
            <span style="font-size:.75rem;font-weight:700;color:#fff">${v}</span>
          </div>
        </div>
      </div>`).join('') + '</div>';
}
