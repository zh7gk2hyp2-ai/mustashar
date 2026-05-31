/* ══════════════════════════════════════
   DASHBOARD — لوحة التحكم (يتطلب تسجيل دخول)
══════════════════════════════════════ */
function showPanel(id) {
  document.querySelectorAll('.dpanel').forEach(p => p.classList.remove('act'));
  document.getElementById('pan-' + id).classList.add('act');
  document.querySelectorAll('.dsec a').forEach(a => a.classList.remove('on'));
  document.getElementById('dp-' + id).classList.add('on');
  if (id === 'kpis')      renderKPIs();
  if (id === 'analytics') renderCharts();
  if (id === 'email')     renderEmailSettingsPanel();
}

/* ══════════════════════════════════════
   EMAIL SETTINGS — إعدادات البريد
══════════════════════════════════════ */
const _EMAIL_DEFAULTS = {
  from:   'noreply@tu.edu.sa',
  notify: 'turcc@tu.edu.sa',
  apSubj: 'تهانينا! تم قبول طلبك في منصة مستشار – جامعة الطائف',
  apBody: `عزيزي/عزيزتي {name}،

يسعدنا إعلامك بأن طلب انضمامك إلى منصة مستشار (رقم الطلب: {req_number}) قد تمت الموافقة عليه.

يمكنك الآن تسجيل الدخول إلى بوابة المنسوب باستخدام:
- رقم المنسوب: {emp_id}
- البريد الإلكتروني: {email}

مع تحياتنا،
مركز البحوث والاستشارات – جامعة الطائف
📞 0127270020 | turcc@tu.edu.sa`,
  rjSubj: 'بشأن طلبك في منصة مستشار – جامعة الطائف',
  rjBody: `عزيزي/عزيزتي {name}،

نشكرك على اهتمامك بالانضمام إلى منصة مستشار.
بعد مراجعة طلبك (رقم الطلب: {req_number})، نأسف لإعلامك بعدم قبوله في الوقت الحالي.

{note}

للاستفسار: turcc@tu.edu.sa | 0127270020

مركز البحوث والاستشارات – جامعة الطائف`
};

function getEmailSettings() {
  return Object.assign({}, _EMAIL_DEFAULTS,
    JSON.parse(localStorage.getItem('mu_email_cfg') || 'null') || {});
}

function renderEmailSettingsPanel() {
  const s = getEmailSettings();
  document.getElementById('em-from').value    = s.from;
  document.getElementById('em-notify').value  = s.notify;
  document.getElementById('em-ap-subj').value = s.apSubj;
  document.getElementById('em-ap-body').value = s.apBody;
  document.getElementById('em-rj-subj').value = s.rjSubj;
  document.getElementById('em-rj-body').value = s.rjBody;
}

function saveEmailSettingsUI() {
  const s = {
    from:   document.getElementById('em-from').value.trim(),
    notify: document.getElementById('em-notify').value.trim(),
    apSubj: document.getElementById('em-ap-subj').value.trim(),
    apBody: document.getElementById('em-ap-body').value.trim(),
    rjSubj: document.getElementById('em-rj-subj').value.trim(),
    rjBody: document.getElementById('em-rj-body').value.trim()
  };
  localStorage.setItem('mu_email_cfg', JSON.stringify(s));
  toast('✅ تم حفظ إعدادات البريد', 't-ok');
}

function resetEmailSettingsUI() {
  localStorage.removeItem('mu_email_cfg');
  renderEmailSettingsPanel();
  toast('تم استعادة الإعدادات الافتراضية', 't-inf');
}

/* helper — apply template variables */
function applyEmailTemplate(tpl, reg) {
  return tpl
    .replace(/{name}/g,       `${reg.firstName} ${reg.lastName}`)
    .replace(/{req_number}/g,  reg.id)
    .replace(/{emp_id}/g,      reg.empId || '')
    .replace(/{email}/g,       reg.email || '')
    .replace(/{note}/g,        reg.rejectionNote || '');
}

/* ── مؤشرات الأداء KPIs ── */
function renderKPIs() {
  const regs      = getRegs();
  const approved  = regs.filter(r => r.status === 'معتمد').length + DATA.length;
  const totalRegs = DATA.length + regs.length;
  const contracts = STATE.contracts.length;
  const avgRating = DATA.reduce((s, c) => s + c.rating, 0) / DATA.length;

  const kpis = [
    {
      label:   'المنسوبون المسجلون',
      icon:    '👤',
      current: totalRegs,
      target:  KPI_TARGETS.registeredConsultants,
      unit:    'منسوب',
      color:   'var(--blue)',
    },
    {
      label:   'الملفات المعتمدة',
      icon:    '✅',
      current: approved,
      target:  KPI_TARGETS.approvedProfiles,
      unit:    'ملف',
      color:   'var(--green)',
    },
    {
      label:   'طلبات التعاقد (الكلي)',
      icon:    '📄',
      current: contracts,
      target:  KPI_TARGETS.monthlyContracts,
      unit:    'طلب',
      color:   'var(--gold)',
    },
    {
      label:   'متوسط التقييم',
      icon:    '⭐',
      current: +avgRating.toFixed(1),
      target:  KPI_TARGETS.avgRating,
      unit:    'من 5',
      color:   '#f59e0b',
      decimal: true,
    },
    {
      label:   'هدف الجهات الشريكة',
      icon:    '🏢',
      current: Math.min(STATE.contracts.map(c => c.org).filter((v,i,a)=>a.indexOf(v)===i).length, KPI_TARGETS.partnerEntities),
      target:  KPI_TARGETS.partnerEntities,
      unit:    'جهة',
      color:   'var(--teal)',
    },
    {
      label:   'وقت الاستجابة المستهدف',
      icon:    '⏱️',
      current: 24,
      target:  KPI_TARGETS.responseHours,
      unit:    'ساعة',
      color:   'var(--mid)',
      inverse: true,
    },
  ];

  document.getElementById('kpiCards').innerHTML =
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">` +
    kpis.map(k => {
      const pct   = k.inverse
        ? Math.min(100, Math.round((k.target / Math.max(k.current, 1)) * 100))
        : Math.min(100, Math.round((k.current / k.target) * 100));
      const val   = k.decimal ? k.current.toFixed(1) : k.current;
      const tgt   = k.decimal ? k.target.toFixed(1)  : k.target;
      const badge = pct >= 100 ? '<span class="tag tag-g" style="margin-right:8px">✓ تحقق</span>'
                  : pct >= 60  ? '<span class="tag tag-gold" style="margin-right:8px">جارٍ</span>'
                  :              '<span class="tag tag-r" style="margin-right:8px">دون الهدف</span>';
      return `
        <div style="background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rl);padding:20px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:1.4rem">${k.icon}</span>
              <span style="font-size:.82rem;font-weight:700;color:var(--txt2)">${k.label}</span>
            </div>
            ${badge}
          </div>
          <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:10px">
            <span style="font-size:1.9rem;font-weight:900;color:${k.color}">${val}</span>
            <span style="font-size:.78rem;color:var(--muted)">/ ${tgt} ${k.unit}</span>
          </div>
          <div style="background:var(--surf2);border-radius:6px;overflow:hidden;height:8px">
            <div style="width:${pct}%;height:100%;background:${k.color};border-radius:6px;transition:width .6s"></div>
          </div>
          <div style="font-size:.72rem;color:var(--muted);margin-top:5px;text-align:left">${pct}%</div>
        </div>`;
    }).join('') + '</div>';
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
  renderConsTable(getAllConsultants());
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
    `<tr><th>الاسم</th><th>الكلية</th><th>النوع</th><th>السعر</th><th>تضارب</th><th>الحالة</th><th>التاريخ</th><th>إجراء</th></tr>` +
    (regs.length
      ? regs.slice().reverse().map(r =>
          `<tr>
            <td>
              <strong>${r.firstName} ${r.lastName}</strong>
              <div style="font-size:.72rem;color:var(--muted)">${r.email || ''} ${r.empId ? '| ' + r.empId : ''}</div>
            </td>
            <td style="font-size:.78rem;color:var(--muted)">${r.college}</td>
            <td>${r.type}</td>
            <td style="font-size:.78rem;color:var(--blue);font-weight:700">${r.rate ? r.rate + ' ر/' + r.rateType : '—'}</td>
            <td>${r.conflict ? '<span class="tag tag-r">⚠️ يراجع</span>' : '<span class="tag tag-g">✓ لا يوجد</span>'}</td>
            <td><span class="tag ${statusClass(r.status)}" id="rs-${r.id}">${r.status}</span></td>
            <td>${r.date}</td>
            <td>
              <div style="display:flex;gap:5px">
                <button class="btn btn-g btn-sm" onclick="approveReg('${r.id}')">قبول</button>
                <button class="btn btn-sm" style="background:rgba(192,57,43,.08);color:var(--red);border-radius:10px;padding:7px 10px;font-size:.78rem;font-weight:700" onclick="rejectReg('${r.id}')">رفض</button>
              </div>
            </td>
          </tr>`).join('')
      : '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px">لا توجد طلبات تسجيل بعد</td></tr>');
}

function approveReg(id) {
  const reg = getRegs().find(r => r.id === id);
  updateRegStatus(id, 'معتمد');
  const el = document.getElementById('rs-' + id);
  if (el) { el.textContent = 'معتمد'; el.className = 'tag tag-g'; }

  const badge = document.getElementById('pendingBadge');
  if (badge) {
    const n = getRegs().filter(r => r.status === 'قيد المراجعة').length;
    badge.textContent = n > 0 ? n + ' طلب جديد' : 'لا يوجد جديد';
    badge.className = 'tag ' + (n > 0 ? 'tag-gold' : 'tag-g');
  }

  /* show email preview toast */
  if (reg) {
    const s = getEmailSettings();
    const subj = applyEmailTemplate(s.apSubj, reg);
    toast(`✅ تم القبول — سيُرسل بريد إلى: ${reg.email}\nالموضوع: ${subj}`, 't-ok', 5000);
  } else {
    toast('تم قبول الطلب ✓', 't-ok');
  }
}

function rejectReg(id) {
  const note = prompt('ملاحظة الرفض (اختياري):') || '';
  const reg  = getRegs().find(r => r.id === id);
  if (reg) reg.rejectionNote = note;
  updateRegStatus(id, 'مرفوض');
  const el = document.getElementById('rs-' + id);
  if (el) { el.textContent = 'مرفوض'; el.className = 'tag tag-r'; }

  if (reg) {
    const s    = getEmailSettings();
    const subj = applyEmailTemplate(s.rjSubj, { ...reg, rejectionNote: note });
    toast(`❌ تم الرفض — سيُرسل بريد إلى: ${reg.email}\nالموضوع: ${subj}`, 't-inf', 5000);
  } else {
    toast('تم رفض الطلب', 't-inf');
  }
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
        <td>
          ${c.name}
          ${c._fromReg ? '<span class="tag tag-b" style="font-size:.65rem;margin-right:6px">جديد</span>' : ''}
        </td>
        <td style="font-size:.78rem;color:var(--muted)">${c.college}</td>
        <td class="stars">${c.rating ? c.rating + '★' : '—'}</td>
        <td>${c.contracts || 0}</td>
        <td><span class="tag ${c.verified ? 'tag-g' : 'tag-r'}">${c.verified ? 'معتمد' : 'قيد المراجعة'}</span></td>
        <td><button class="btn btn-g btn-sm" onclick="go('profile','${c.id}')">عرض</button></td>
      </tr>`).join('');
}

function filterDash() {
  const q = document.getElementById('dashSearch').value.toLowerCase();
  renderConsTable(getAllConsultants().filter(c =>
    [c.name, c.college, c.dept].join(' ').toLowerCase().includes(q)));
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

/* ── الرسوم البيانية Chart.js ── */
const _charts = {};

function destroyChart(id) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

function renderBarChart() { /* legacy — now handled by renderCharts */ }

function renderCharts() {
  const regs      = getRegs();
  const ct        = STATE.contracts;

  /* 1. توزيع المنسوبين حسب الكلية */
  const colMap = {};
  DATA.forEach(c => { colMap[c.college] = (colMap[c.college] || 0) + 1; });
  const colLabels = Object.keys(colMap).slice(0, 8);
  const colVals   = colLabels.map(l => colMap[l]);

  destroyChart('chartColleges');
  const ctxC = document.getElementById('chartColleges');
  if (ctxC) {
    _charts.chartColleges = new Chart(ctxC, {
      type: 'bar',
      data: {
        labels: colLabels,
        datasets: [{ label: 'عدد المنسوبين', data: colVals,
          backgroundColor: 'rgba(0,102,51,.75)', borderRadius: 6,
          borderSkipped: false }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(0,0,0,.05)' } },
          y: { ticks: { font: { family: 'Cairo', size: 11 } } }
        }
      }
    });
  }

  /* 2. حالات طلبات التعاقد */
  const statuses = ['قيد الدراسة','مقبول','تحت التنفيذ','مكتمل','مرفوض'];
  const stColors = ['#f59e0b','#006633','#087a45','#15803d','#c0392b'];
  const stCounts = statuses.map(s => ct.filter(c => c.status === s).length);

  destroyChart('chartContracts');
  const ctxK = document.getElementById('chartContracts');
  if (ctxK) {
    _charts.chartContracts = new Chart(ctxK, {
      type: 'doughnut',
      data: { labels: statuses, datasets: [{ data: stCounts, backgroundColor: stColors, borderWidth: 2 }] },
      options: {
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Cairo', size: 11 }, padding: 12 } } },
        cutout: '62%'
      }
    });
  }

  /* 3. التسجيلات حسب الحالة */
  const rStatuses = ['قيد المراجعة','معتمد','مرفوض'];
  const rColors   = ['#f59e0b','#006633','#c0392b'];
  const rCounts   = rStatuses.map(s => regs.filter(r => r.status === s).length);

  destroyChart('chartRegs');
  const ctxR = document.getElementById('chartRegs');
  if (ctxR) {
    _charts.chartRegs = new Chart(ctxR, {
      type: 'bar',
      data: {
        labels: rStatuses,
        datasets: [{ label: 'الطلبات', data: rCounts, backgroundColor: rColors, borderRadius: 8, borderSkipped: false }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }
}
