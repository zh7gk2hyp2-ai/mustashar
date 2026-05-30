/* ══════════════════════════════════════
   UI — التوجيه + البطاقات + Toast + Nav
══════════════════════════════════════ */

/* ── Routing ──────────────────────────── */
function go(pg, extra) {
  /* auth guards — check BEFORE showing any page */
  if (pg === 'dashboard' && !isLoggedIn())          { openLoginModal('admin');      return; }
  if (pg === 'portal'    && !isConsultantLoggedIn()) { openLoginModal('consultant'); return; }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('pg-' + pg)?.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('on'));
  document.getElementById('nl-' + pg)?.classList.add('on');
  window.scrollTo(0, 0);

  if (pg === 'search')              doSearch();
  if (pg === 'profile' && extra)    renderProfile(extra);
  if (pg === 'dashboard')           renderDash();
  if (pg === 'portal')              renderPortal();
  if (pg === 'about')               renderAbout();
  if (pg === 'home')                renderHome();
}

function toggleMob() {
  document.getElementById('mobMenu').classList.toggle('open');
}

/* ── Stars helper ─────────────────────── */
function star(n) {
  return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
}

/* ── Card builder ─────────────────────── */
function card(c) {
  const sl = STATE.isSL(c.id);
  return `<div class="cc">
    <div class="cc-top">
      <div class="cc-av" style="background:${c.color}">${c.name[3]}</div>
      <div>
        <div class="cc-name">${c.name}</div>
        <div class="cc-role">${c.title}</div>
        <div class="cc-coll">${c.college}</div>
      </div>
      <div class="cc-tr">
        ${c.verified ? '<span class="tag tag-g">✓ موثق</span>' : ''}
        <button style="font-size:1.1rem;background:none;border:none;cursor:pointer;transition:transform .2s"
          onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform=''"
          onclick="handleSL(${c.id},this)">${sl ? '❤️' : '🤍'}</button>
      </div>
    </div>
    <div class="cc-tags">
      ${c.skills.slice(0, 4).map(s => `<span class="tag">${s}</span>`).join('')}
      ${c.skills.length > 4 ? `<span class="tag tag-b">+${c.skills.length - 4}</span>` : ''}
    </div>
    <div class="cc-ft">
      <div><span class="stars">${star(c.rating)}</span><span class="cc-rat"> ${c.rating} (${c.reviews})</span></div>
      <div style="display:flex;gap:6px;align-items:center">
        <span class="${c.available ? 'tag tag-g' : 'tag tag-r'}">${c.available ? 'متاح' : 'مشغول'}</span>
        <button class="btn btn-p btn-sm" onclick="go('profile',${c.id})">الملف</button>
      </div>
    </div>
  </div>`;
}

function handleSL(id, btn) {
  const added = STATE.toggleSL(id);
  btn.textContent = added ? '❤️' : '🤍';
  toast(added ? 'أُضيف للقائمة' : 'حُذف من القائمة', added ? 't-ok' : 't-inf');
  updateSLPanel();
}

/* ── Toast ────────────────────────────── */
function toast(msg, type = 't-inf', dur = 3000) {
  const w = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  w.appendChild(t);
  setTimeout(() => t.remove(), dur);
}

/* ── HOME ─────────────────────────────── */
function renderHome() {
  const g = document.getElementById('homeGrid');
  if (g) g.innerHTML = DATA.slice(0, 6).map(c => card(c)).join('');
}

function goSearch() {
  const q = document.getElementById('homeQ')?.value.trim();
  if (q) window._sq = q;
  go('search');
}

function quickF(q)    { window._sq = q; go('search'); }
function searchCat(q) { window._sq = q; go('search'); }

/* ── SHORTLIST panel ──────────────────── */
function updateSLPanel() {
  const n = STATE.shortlist.length;
  document.getElementById('slnum').textContent = n;
  document.getElementById('slpanel').classList.toggle('show', n > 0);
}

function viewSL() {
  const items = DATA.filter(c => STATE.isSL(c.id));
  alert('قائمة المرشحين (' + items.length + '):\n' + items.map(c => c.name + ' | ' + c.rating + '★').join('\n'));
}

function exportSL() {
  const items = DATA.filter(c => STATE.isSL(c.id));
  const txt = items.map(c => `${c.name} | ${c.title} | ${c.college} | ${c.rating}★`).join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt),
    download: 'shortlist.txt'
  });
  a.click();
  toast('تم التصدير بنجاح', 't-ok');
}

/* ── PROFILE ──────────────────────────── */
function renderProfile(id) {
  const c = DATA.find(x => x.id === id) || DATA[0];
  STATE.currentProfile = c;
  const sl = STATE.isSL(c.id);
  document.getElementById('profileContent').innerHTML = `
<div class="phead">
  <div class="w"><div class="phead-in">
    <div class="p-av" style="background:${c.color}">${c.name[3]}</div>
    <div>
      <div class="p-name">${c.name}</div>
      <div class="p-role">${c.title} | ${c.dept}</div>
      <div class="p-tags">
        ${c.verified ? '<span class="ptag">✓ موثق</span>' : ''}
        <span class="ptag">${c.college}</span>
        <span class="ptag">${c.exp_years} سنة خبرة</span>
        <span class="ptag">${c.available ? '🟢 متاح' : '🔴 مشغول'}</span>
        ${c.lang.map(l => `<span class="ptag">${l}</span>`).join('')}
      </div>
      <div class="p-meta">
        <span class="pmi">⭐ ${c.rating} (${c.reviews} تقييم)</span>
        <span class="pmi">📄 ${c.contracts} تعاقد</span>
      </div>
    </div>
    <div class="p-acts">
      <button class="btn btn-gold" onclick="document.getElementById('contractOv').classList.add('open')">📄 طلب تعاقد</button>
      <button id="slBtn" class="btn btn-g" style="border-color:rgba(255,255,255,.3);color:#fff" onclick="togglePSL(${c.id})">${sl ? '❤️ في قائمتي' : '🤍 أضف للقائمة'}</button>
      <button class="btn btn-g" style="border-color:rgba(255,255,255,.3);color:#fff" onclick="go('search')">← رجوع</button>
    </div>
  </div></div>
</div>
<div class="w"><div class="playout">
  <div>
    <div class="pcard"><h3>🤖 الملخص الاحترافي</h3>
      <div class="ai-lbl">✨ مُنشأ بالذكاء الاصطناعي – معتمد من مركز البحوث</div>
      <div class="ai-sum">${c.summary}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px">${c.skills.map(s => `<span class="tag tag-b">${s}</span>`).join('')}</div>
    </div>
    <div class="pcard"><h3>🏛️ الخبرات الإدارية</h3>
      <div class="exp-row"><div class="exp-ico">🏛️</div><div><div class="exp-t">${c.admin_exp} <span class="vbadge">✓ موثق</span></div><div class="exp-o">${c.college}</div></div></div>
    </div>
    <div class="pcard"><h3>🎓 الخبرات التدريبية</h3>
      <div class="exp-row"><div class="exp-ico">🎓</div><div><div class="exp-t">${c.training_exp} <span class="vbadge">✓ موثق</span></div></div></div>
    </div>
    <div class="pcard"><h3>🔬 الخبرات البحثية</h3>
      ${c.research.map(r => `<div class="exp-row"><div class="exp-ico">📄</div><div><div class="exp-t">${r} <span class="vbadge">✓ موثق</span></div></div></div>`).join('')}
    </div>
    <div class="pcard"><h3>🏅 الشهادات الاحترافية</h3>
      <div class="skcloud">${c.certs.map(s => `<span class="tag tag-gold">🏅 ${s}</span>`).join('')}</div>
    </div>
    <div class="pcard"><h3>💡 المهارات</h3>
      <div class="skcloud">${c.skills.map(s => `<span class="sk">${s}</span>`).join('')}</div>
    </div>
  </div>
  <div>
    <div class="sc"><div class="rbig">
      <div class="rn">${c.rating}</div>
      <span class="rs">${star(c.rating)}</span>
      <div class="rc">بناءً على ${c.reviews} تقييم</div>
    </div></div>
    <div class="sc"><h4>معلومات سريعة</h4>
      <div class="inforow"><span class="l">التخصص</span><span class="v">${c.dept}</span></div>
      <div class="inforow"><span class="l">الكلية</span><span class="v">${c.college}</span></div>
      <div class="inforow"><span class="l">سنوات الخبرة</span><span class="v">${c.exp_years} سنة</span></div>
      <div class="inforow"><span class="l">التعاقدات</span><span class="v">${c.contracts}</span></div>
      <div class="inforow"><span class="l">الحالة</span><span class="v">${c.available ? '🟢 متاح' : '🔴 مشغول'}</span></div>
      <div class="inforow"><span class="l">اللغات</span><span class="v">${c.lang.join(' • ')}</span></div>
      ${c.rate ? `<div class="inforow"><span class="l">💰 السعر</span><span class="v" style="color:var(--blue)">${c.rate} ريال/${c.rateType}</span></div>` : ''}
      <div class="inforow" style="border-bottom:none"><span class="l" style="font-size:.7rem;color:var(--muted)">التوزيع</span><span class="v" style="font-size:.72rem"><span style="color:var(--blue)">70% منسوب</span> / <span style="color:var(--gold)">30% جامعة</span></span></div>
    </div>
    <div class="sc" style="text-align:center">
      <button class="btn btn-p" style="width:100%;margin-bottom:10px" onclick="document.getElementById('contractOv').classList.add('open')">📄 طلب تعاقد الآن</button>
      <button class="btn btn-g" style="width:100%" onclick="togglePSL(${c.id})">🤍 أضف لقائمة المرشحين</button>
    </div>
  </div>
</div></div>`;
}

function togglePSL(id) {
  const added = STATE.toggleSL(id);
  const btn = document.getElementById('slBtn');
  if (btn) btn.textContent = added ? '❤️ في قائمتي' : '🤍 أضف للقائمة';
  toast(added ? 'أُضيف للقائمة' : 'حُذف من القائمة', added ? 't-ok' : 't-inf');
}

/* ── CONTRACT modal ───────────────────── */
function submitContract() {
  const o1 = document.getElementById('co1').value.trim();
  const o2 = document.getElementById('co2').value.trim();
  const o3 = document.getElementById('co3').value.trim();
  const o4 = document.getElementById('co4').value;
  const o5 = document.getElementById('co5').value.trim();
  if (!o1 || !o2 || !o3 || !o4 || !o5) { toast('يرجى تعبئة الحقول الإلزامية', 't-err'); return; }
  STATE.contracts.push({
    id: Date.now(),
    consultant: STATE.currentProfile?.name || '—',
    org: o1, contact: o2, email: o3, service: o4, desc: o5,
    duration: document.getElementById('co6').value,
    mode: document.getElementById('co7').value,
    status: 'قيد الدراسة',
    date: new Date().toLocaleDateString('ar-SA')
  });
  STATE.save();
  document.getElementById('contractOv').classList.remove('open');
  ['co1','co2','co3','co5','co6'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('co4').selectedIndex = 0;
  toast('✅ تم إرسال طلبك! سيتواصل معك المركز خلال يومي عمل', 't-ok', 5000);
}

/* ── ABOUT ────────────────────────────── */
function renderAbout() {
  const techs = [
    {icon:'🤖',title:'الذكاء الاصطناعي',desc:'توليد ملفات تعريفية احترافية تلقائياً وخوارزمية بحث دلالية وزنية'},
    {icon:'🔐',title:'الأمان والخصوصية',desc:'تكامل SSO + HTTPS + امتثال كامل لنظام حماية البيانات السعودي'},
    {icon:'📊',title:'لوحة التقارير',desc:'55 مؤشر أداء KPI مع تقارير تفاعلية وتصدير Excel/PDF'},
    {icon:'✅',title:'التحقق الثلاثي',desc:'تحقق آلي + وثائقي + متقاطع لضمان دقة جميع الخبرات'},
    {icon:'📄',title:'عقود جاهزة',desc:'3 قوالب عقود معتمدة مع توقيع ثلاثي الأطراف وتتبع الحالة'},
    {icon:'⚖️',title:'حوكمة المصالح',desc:'نظام متكامل لكشف وإدارة تضارب المصالح قبل كل تعاقد'},
  ];
  document.getElementById('techCards').innerHTML = techs.map(t => `
    <div style="background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rl);padding:22px;transition:all .22s"
      onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='var(--shl)'"
      onmouseout="this.style.transform='';this.style.boxShadow=''">
      <div style="font-size:1.8rem;margin-bottom:10px">${t.icon}</div>
      <h3 style="color:var(--navy);margin-bottom:7px">${t.title}</h3>
      <p style="font-size:.82rem;color:var(--txt2)">${t.desc}</p>
    </div>`).join('');
}

/* ── Nav scroll shadow ────────────────── */
window.addEventListener('scroll', () => {
  document.getElementById('mainNav')?.classList.toggle('up', window.scrollY > 20);
});

/* ── Scroll animations ────────────────── */
const _io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.style.animationPlayState = 'running'; });
}, { threshold: .12 });
document.querySelectorAll('.au').forEach(el => {
  el.style.animationPlayState = 'paused';
  _io.observe(el);
});
