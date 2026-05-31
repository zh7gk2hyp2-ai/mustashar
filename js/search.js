/* ══════════════════════════════════════
   SEARCH — البحث والفلاتر
══════════════════════════════════════ */
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

  res.sort((a, b) =>
    sort === 'rating'    ? b.rating    - a.rating :
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
