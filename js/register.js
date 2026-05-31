/* ══════════════════════════════════════
   REGISTER — نموذج التسجيل (5 خطوات)
══════════════════════════════════════ */
let rStep = 1;
const rFiles = { cv: [], cert: [] };

/* chip toggle */
document.querySelectorAll('.chip').forEach(ch => {
  ch.addEventListener('click', () => ch.classList.toggle('on'));
});

function addSkill() {
  const inp = document.getElementById('rSkillCustom');
  const v = inp.value.trim();
  if (!v) return;
  const ch = document.createElement('span');
  ch.className = 'chip on';
  ch.textContent = v;
  ch.dataset.v = v;
  ch.addEventListener('click', () => ch.classList.toggle('on'));
  document.getElementById('skillG').appendChild(ch);
  inp.value = '';
}

function addCert() {
  const d = document.createElement('div');
  d.style.cssText = 'border-top:1px solid var(--bdr);padding-top:14px;margin-top:14px';
  d.innerHTML = `
    <div class="two">
      <div class="fi"><label>اسم الشهادة</label><input class="cname" placeholder="اسم الشهادة"></div>
      <div class="fi"><label>الجهة المانحة</label><input class="corg" placeholder="الجهة"></div>
    </div>
    <div class="two">
      <div class="fi"><label>السنة</label><input class="cyear" type="number" placeholder="2022"></div>
    </div>
    <button onclick="this.parentElement.remove()" style="font-size:.75rem;color:var(--red);font-weight:700;cursor:pointer">✕ حذف</button>`;
  document.getElementById('certsCont').appendChild(d);
}

function addFile(inp, key) {
  [...inp.files].forEach(f => {
    if (f.size > 10 * 1024 * 1024) { toast('حجم الملف يتجاوز 10MB', 't-err'); return; }
    rFiles[key].push(f);
    const li = document.createElement('div');
    li.className = 'fitem';
    li.innerHTML = `📎 ${f.name} <span class="frm" onclick="rmFile('${key}','${f.name}',this.parentElement)">✕</span>`;
    document.getElementById(key + 'L').appendChild(li);
  });
}

function rmFile(key, name, el) {
  rFiles[key] = rFiles[key].filter(f => f.name !== name);
  el.remove();
}

/* إظهار حقل التفاصيل عند اختيار وجود تضارب */
document.addEventListener('change', e => {
  if (e.target.id === 'r_conflict') {
    document.getElementById('conflictDetailBox').style.display =
      e.target.value === 'yes' ? 'block' : 'none';
  }
});

function rNext(cur) {
  if (cur === 1) {
    const req = ['r1','r2','r3','r4','r5','r6','r7'];
    if (req.some(id => !document.getElementById(id).value.trim())) {
      toast('يرجى تعبئة الحقول الإلزامية', 't-err');
      return;
    }
    if (!/^05\d{8}$/.test(document.getElementById('r4').value)) {
      toast('رقم الجوال غير صحيح', 't-err');
      return;
    }
    if (!document.getElementById('r_rate').value || !document.getElementById('r_rate_type').value) {
      toast('يرجى إدخال السعر التقديري ونوعه', 't-err');
      return;
    }
    if (!document.getElementById('r_consent_publish').checked) {
      toast('يرجى الموافقة على نشر الملف', 't-err');
      return;
    }
  }
  if (cur === 2) {
    if (!document.getElementById('r_conflict').value) {
      toast('يرجى تعبئة إعلان تضارب المصالح', 't-err');
      return;
    }
  }
  if (cur === 4 && !rFiles.cv.length) {
    toast('يرجى رفع السيرة الذاتية', 't-err');
    return;
  }
  if (cur === 4) buildReview();
  goRStep(cur + 1);
}

function rPrev(cur) { goRStep(cur - 1); }

function goRStep(n) {
  document.querySelectorAll('.sp').forEach(p => p.classList.remove('act'));
  document.getElementById('rsp' + n)?.classList.add('act');
  for (let i = 1; i <= 5; i++) {
    const sn = document.getElementById('sn' + i);
    if (!sn) continue;
    sn.classList.remove('act', 'done');
    if (i < n) sn.classList.add('done');
    else if (i === n) sn.classList.add('act');
    const sl = document.getElementById('sl' + i);
    if (sl) sl.classList.toggle('done', i < n);
  }
  rStep = n;
  window.scrollTo(0, 0);
}

function buildReview() {
  const skills   = [...document.querySelectorAll('#skillG .chip.on')].map(c => c.dataset.v || c.textContent);
  const langs    = [...document.querySelectorAll('#langG .chip.on')].map(c => c.dataset.v || c.textContent);
  const rate     = document.getElementById('r_rate').value;
  const rateType = document.getElementById('r_rate_type').value;
  const conflict = document.getElementById('r_conflict').value === 'yes' ? '⚠️ نعم – يراجع المركز' : '✅ لا يوجد';
  document.getElementById('reviewBox').innerHTML = `
    <div><strong>الاسم:</strong> ${document.getElementById('r1').value} ${document.getElementById('r2').value}</div>
    <div><strong>رقم المنسوب:</strong> ${document.getElementById('r3').value}</div>
    <div><strong>البريد:</strong> ${document.getElementById('r5').value}</div>
    <div><strong>الكلية:</strong> ${document.getElementById('r6').value}</div>
    <div><strong>طبيعة العمل:</strong> ${document.getElementById('r7').value === 'academic' ? 'أكاديمي' : 'إداري'}</div>
    <div><strong>المهارات:</strong> ${skills.join('، ') || '—'}</div>
    <div><strong>اللغات:</strong> ${langs.join('، ')}</div>
    <div><strong>السعر التقديري:</strong> ${rate} ريال / ${rateType} <span style="color:var(--muted);font-size:.75rem">(70% للمنسوب)</span></div>
    <div><strong>تضارب المصالح:</strong> ${conflict}</div>
    <div><strong>الموافقة على النشر:</strong> ✅ موافق</div>
    <div><strong>السيرة الذاتية:</strong> ${rFiles.cv.length ? '✅ مرفوعة' : '❌ مطلوبة'}</div>`;
}

function submitReg() {
  if (!document.getElementById('consent').checked || !document.getElementById('consent2').checked) {
    toast('يرجى الموافقة على جميع الإقرارات', 't-err');
    return;
  }

  const reqId  = 'TU-' + Date.now().toString().slice(-6);
  const skills = [...document.querySelectorAll('#skillG .chip.on')].map(c => c.dataset.v || c.textContent);
  const langs  = [...document.querySelectorAll('#langG .chip.on')].map(c => c.dataset.v || c.textContent);
  const empId  = document.getElementById('r3').value.trim();

  const regs = getRegs();

  /* منع التسجيل المكرر برقم المنسوب */
  const dup = regs.find(r => r.empId === empId);
  if (dup) {
    toast(`رقم المنسوب ${empId} مسجّل مسبقاً برقم طلب ${dup.id}`, 't-err', 6000);
    goRStep(1);
    return;
  }

  regs.push({
    id:             reqId,
    firstName:      document.getElementById('r1').value.trim(),
    lastName:       document.getElementById('r2').value.trim(),
    empId:          empId,
    phone:          document.getElementById('r4').value.trim(),
    email:          document.getElementById('r5').value.trim(),
    college:        document.getElementById('r6').value,
    type:           document.getElementById('r7').value === 'academic' ? 'أكاديمي' : 'إداري',
    rate:           document.getElementById('r_rate').value,
    rateType:       document.getElementById('r_rate_type').value,
    conflict:       document.getElementById('r_conflict').value === 'yes',
    conflictDetail: document.getElementById('r_conflict_detail')?.value.trim() || '',
    consentPublish: true,
    skills,
    langs,
    adminExp:       document.getElementById('r_admin').value.trim(),
    trainExp:       document.getElementById('r_train').value.trim(),
    resExp:         document.getElementById('r_res').value.trim(),
    status:         'قيد المراجعة',
    date:           new Date().toLocaleDateString('ar-SA'),
    timestamp:      Date.now()
  });
  saveRegs(regs);

  document.getElementById('reqN').textContent = reqId;
  document.getElementById('stepsNav').style.display = 'none';
  document.querySelectorAll('.sp').forEach(p => p.classList.remove('act'));
  document.getElementById('rspSucc').classList.add('act');
  toast('✅ تم الإرسال بنجاح!', 't-ok', 5000);
  window.scrollTo(0, 0);
}
