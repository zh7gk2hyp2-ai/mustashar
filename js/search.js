/* ══════════════════════════════════════
   SEARCH — البحث والفلاتر
   خوارزمية الترتيب: R×35% + Q×25% + T×20% + A×10%
   (من وثيقة الحوكمة القسم الرابع)
══════════════════════════════════════ */

/* ── درجة الترتيب المركّبة ── */
function _rankScore(c, q) {
  /* R: الصلة بالبحث (35%) */
  let R = 1;
  if (q) {
    R = 0;
    const fields = [
      { t: (c.name    ||'').toLowerCase(), w: 0.10 },
      { t: (c.title   ||'').toLowerCase(), w: 0.20 },
      { t: (c.skills  ||[]).join(' ').toLowerCase(), w: 0.30 },
      { t: (c.summary ||'').toLowerCase(), w: 0.15 },
      { t: (c.certs   ||[]).join(' ').toLowerCase(), w: 0.15 },
      { t: (c.college ||'').toLowerCase(), w: 0.10 },
    ];
    for (const f of fields) {
      if (f.t.includes(q)) {
        const n = (f.t.match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'g')) || []).length;
        R += f.w * Math.min(1, n * 0.5 + 0.5);
      }
    }
    R = Math.min(1, R);
  }

  /* Q: جودة الملف (25%) — نسبة اكتمال الحقول + الخبرات الموثقة */
  let Q = 0;
  if ((c.skills||[]).length  >= 3) Q += 0.20;
  if ((c.certs ||[]).length  >= 1) Q += 0.20;
  if (c.summary)                   Q += 0.20;
  if (c.admin_exp)                 Q += 0.15;
  if (c.training_exp)              Q += 0.15;
  if ((c.research||[]).length >= 1)Q += 0.10;
  Q = Math.min(1, Q);

  /* T: التقييم (20%) — مُعيَّار من 0 إلى 1 */
  const T = c.reviews >= 2 ? (c.rating || 0) / 5 : 0.60; /* قيمة افتراضية محايدة */

  /* A: النشاط الحديث (10%) */
  const A = Math.min(1, (c.contracts || 0) / 25);

  return R * 0.35 + Q * 0.25 + T * 0.20 + A * 0.10;
}

function doSearch() {
  const q = (document.getElementById('sq')?.value || window._sq || '').toLowerCase();
  window._sq = '';
  if (document.getElementById('sq') && q && !document.getElementById('sq').value)
    document.getElementById('sq').value = '';

  const coll   = document.getElementById('fcoll')?.value  || '';
  const avail  = document.getElementById('favail')?.value || '';
  const minR   = parseFloat(document.getElementById('frat')?.value || '0') || 0;
  const fVer   = document.getElementById('fver')?.checked;
  const fAva   = document.getElementById('fava')?.checked;
  const fAr    = document.getElementById('far')?.checked;
  const fEn    = document.getElementById('fen')?.checked;
  const fFr    = document.getElementById('ffr')?.checked;
  const sort   = document.getElementById('fsort')?.value || 'rating';

  let res = getAllConsultants().filter(c => {
    const hay = [c.name, c.title, c.college, c.dept, ...c.skills, ...c.certs, c.summary]
      .join(' ').toLowerCase();
    if (q && !hay.includes(q))             return false;
    if (coll && c.college !== coll)        return false;
    if (avail === '1' && !c.available)     return false;
    if (avail === '0' &&  c.available)     return false;
    if (c.rating < minR)                   return false;
    if (fVer && !c.verified)               return false;
    if (fAva && !c.available)              return false;
    if (fAr && !c.lang.includes('العربية'))       return false;
    if (fEn && !c.lang.includes('الإنجليزية'))    return false;
    if (fFr && !c.lang.includes('الفرنسية'))      return false;
    return true;
  });

  /* الترتيب: الافتراضي يستخدم المعادلة الوزنية من وثيقة الحوكمة */
  res.sort((a, b) =>
    sort === 'rating'    ? _rankScore(b, q) - _rankScore(a, q) :
    sort === 'exp'       ? b.exp_years - a.exp_years :
                          b.contracts  - a.contracts
  );

  document.getElementById('rcnt').textContent = res.length;
  const g = document.getElementById('sgrid');
  const n = document.getElementById('nores');
  if (!res.length) {
    g.innerHTML = '';
    n.style.display = 'block';
  } else {
    n.style.display = 'none';
    g.innerHTML = res.map(c => card(c)).join('');
  }
  updateSLPanel();
}

function clearF() {
  ['sq','fcoll','favail','frat','fsort'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = el.tagName === 'SELECT' ? el.options[0].value : '';
  });
  ['fver','fava','far','fen','ffr'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });
  doSearch();
}
