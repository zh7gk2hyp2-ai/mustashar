/* ══════════════════════════════════════
   DATA — بيانات المستشارين التجريبية
══════════════════════════════════════ */
const DATA = [
  {id:1,name:"د. أحمد سعد العتيبي",title:"أستاذ مشارك – علوم الحاسب",college:"كلية الحاسبات وتقنية المعلومات",dept:"قسم علوم الحاسب",type:"أكاديمي",exp_years:14,
   skills:["تحليل البيانات","الذكاء الاصطناعي","إدارة المشاريع","Python","تعلم الآلة"],
   certs:["PMP","AWS Certified","Python Institute"],admin_exp:"رئيس قسم – 4 سنوات",training_exp:"120+ ساعة تدريبية",
   research:["18 ورقة بحثية","3 براءات اختراع"],
   summary:"خبير في علوم البيانات والذكاء الاصطناعي بخبرة 14 عاماً في تصميم الحلول التقنية وتحليل البيانات الضخمة. نفّذ أكثر من 40 مشروع استشاري لجهات حكومية وخاصة.",
   rating:4.9,reviews:23,contracts:18,color:"#006633",verified:true,available:true,lang:["العربية","الإنجليزية"],
   rate:800,rateType:"ساعة",conflict:false,consentPublish:true},

  {id:2,name:"أ.د. سارة خالد المالكي",title:"أستاذ – الصحة العامة",college:"كلية الطب",dept:"قسم الصحة العامة",type:"أكاديمي",exp_years:19,
   skills:["الصحة العامة","الوبائيات","التدريب الصحي","SPSS","البحث الوبائي"],
   certs:["Board Certified Epidemiologist","ISO 9001 Lead Auditor"],admin_exp:"عميدة مشاركة للشؤون الأكاديمية",training_exp:"250+ ساعة تدريبية",
   research:["35 ورقة بحثية","رئاسة 7 مؤتمرات"],
   summary:"قيادية أكاديمية في الصحة العامة والوبائيات، قدّمت استشارات لمنظمة الصحة العالمية ووزارة الصحة السعودية. متخصصة في إعداد البرامج الوقائية.",
   rating:5.0,reviews:31,contracts:27,color:"#087a45",verified:true,available:true,lang:["العربية","الإنجليزية","الفرنسية"],
   rate:1200,rateType:"يوم",conflict:false,consentPublish:true},

  {id:3,name:"م. فيصل عبدالله الزهراني",title:"مهندس أول – الهندسة المدنية",college:"كلية الهندسة",dept:"قسم الهندسة المدنية",type:"أكاديمي",exp_years:11,
   skills:["الهندسة الإنشائية","إدارة المشاريع","AutoCAD","تقييم المباني","BIM"],
   certs:["PE – Professional Engineer","PMP","LEED"],admin_exp:"مدير مشاريع البنية التحتية",training_exp:"60 ساعة تدريبية",
   research:["12 ورقة بحثية"],
   summary:"مهندس مدني متخصص في التصميم الإنشائي وإدارة مشاريع البنية التحتية. قدّم خدمات استشارية لأكثر من 30 مشروع عمراني في منطقة مكة والطائف.",
   rating:4.7,reviews:15,contracts:12,color:"#1a7340",verified:true,available:false,lang:["العربية","الإنجليزية"],
   rate:950,rateType:"يوم",conflict:false,consentPublish:true},

  {id:4,name:"د. نورة علي القحطاني",title:"أستاذ مساعد – المالية",college:"كلية إدارة الأعمال",dept:"قسم المالية",type:"أكاديمي",exp_years:9,
   skills:["التمويل الإسلامي","التحليل المالي","تقييم الأصول","Excel المتقدم","نمذجة مالية"],
   certs:["CFA Level II","CIPA","SOCPA"],admin_exp:"رئيسة وحدة الجودة",training_exp:"90 ساعة تدريبية",
   research:["9 أوراق بحثية"],
   summary:"متخصصة في التمويل الإسلامي والتحليل المالي مع خبرة في تقييم المشاريع الاستثمارية. قدّمت استشارات مالية لمؤسسات حكومية وصناديق استثمارية.",
   rating:4.8,reviews:19,contracts:14,color:"#33a06f",verified:true,available:true,lang:["العربية","الإنجليزية"],
   rate:700,rateType:"ساعة",conflict:false,consentPublish:true},

  {id:5,name:"د. محمد راشد الثقفي",title:"أستاذ مشارك – القانون",college:"كلية الشريعة والأنظمة",dept:"قسم القانون الخاص",type:"أكاديمي",exp_years:16,
   skills:["العقود التجارية","النزاعات القانونية","أنظمة العمل","الملكية الفكرية","التحكيم"],
   certs:["محامٍ مُرخَّص","شهادة التحكيم الدولي"],admin_exp:"وكيل كلية للتطوير",training_exp:"150 ساعة تدريبية",
   research:["22 ورقة قانونية","3 كتب مؤلَّفة"],
   summary:"مستشار قانوني متخصص في قانون الأعمال والعقود التجارية والملكية الفكرية. خبرة واسعة في فض النزاعات والتحكيم التجاري.",
   rating:4.6,reviews:28,contracts:22,color:"#c8941f",verified:true,available:true,lang:["العربية","الإنجليزية"],
   rate:900,rateType:"ساعة",conflict:false,consentPublish:true},

  {id:6,name:"أ. هند سلطان العسيري",title:"محاضر أول – التربية",college:"كلية التربية",dept:"قسم المناهج",type:"أكاديمي",exp_years:8,
   skills:["التصميم التعليمي","التدريب على التدريس","مهارات القيادة","ADDIE","التعليم الإلكتروني"],
   certs:["Instructional Designer","TOT"],admin_exp:"منسقة برامج التدريب",training_exp:"200+ ساعة تدريبية",
   research:["6 أوراق بحثية"],
   summary:"متخصصة في تصميم البرامج التدريبية وتطوير المناهج. نفّذت برامج تطوير مهني لأكثر من 1000 معلم ومعلمة.",
   rating:4.9,reviews:41,contracts:35,color:"#087a45",verified:true,available:true,lang:["العربية"],
   rate:600,rateType:"ساعة",conflict:false,consentPublish:true},
];

/* ══ KPI targets (السنة الأولى) ═══════════ */
const KPI_TARGETS = {
  registeredConsultants: 300,
  approvedProfiles:      250,
  monthlyContracts:       10,   // per quarter (K23)
  avgRating:             3.8,
  responseHours:          40,   // 5 days × 8h (K25)
  partnerEntities:        20,
  profileCompletion:      70,   // % (K4)
  verifiedProfiles:       70,   // % (K14)
  aiSummaryRate:          80,   // % (K17)
  contractCompletion:     70,   // % (K26)
  searchConversion:        5,   // % (K29)
  annualRevenue:      200000,   // SAR (K37)
};

/* نسبة التوزيع المالي */
const REVENUE_SPLIT = { consultant: 70, university: 30 };

/* ══ State ═══════════════════════════════ */
const STATE = {
  shortlist: JSON.parse(localStorage.getItem('mu_sl') || '[]'),
  contracts: JSON.parse(localStorage.getItem('mu_ct') || '[]'),
  currentProfile: null,
  save() {
    localStorage.setItem('mu_sl', JSON.stringify(this.shortlist));
    localStorage.setItem('mu_ct', JSON.stringify(this.contracts));
  },
  toggleSL(id) {
    const sid = String(id);
    const i = this.shortlist.findIndex(x => String(x) === sid);
    if (i > -1) this.shortlist.splice(i, 1);
    else this.shortlist.push(id);
    this.save();
    return i === -1;
  },
  isSL(id) { const sid = String(id); return this.shortlist.some(x => String(x) === sid); }
};

/* ══ Contracts helpers ═══════════════════ */
function getContracts() {
  return JSON.parse(localStorage.getItem('mu_ct') || '[]');
}
function saveContracts(cts) {
  localStorage.setItem('mu_ct', JSON.stringify(cts));
  STATE.contracts = cts;
}
function addContract(data) {
  const cts = getContracts();
  const id  = 'CT-' + Date.now().toString(36).slice(-5).toUpperCase();
  const entry = {
    id,
    consultantId:       data.consultantId       !== undefined ? data.consultantId : null,
    consultant:         data.consultant         || '',
    orgId:              data.orgId              || null,
    org:                data.org                || '',
    orgEmail:           data.orgEmail           || '',
    contact:            data.contact            || '',
    service:            data.service            || '',
    desc:               data.desc               || '',
    mode:               data.mode               || 'حضوري',
    duration:           data.duration           || '',
    fee:                data.fee                || 0,
    status:             'قيد الدراسة',
    consultantDecision: null,
    consultantNote:     '',
    adminDecision:      null,
    orgRating:          null,
    orgRatingNote:      '',
    date: new Date().toLocaleDateString('ar-SA')
  };
  cts.push(entry);
  saveContracts(cts);
  return entry;
}
function updateContract(id, patch) {
  const cts = getContracts();
  const i   = cts.findIndex(c => String(c.id) === String(id));
  if (i > -1) { Object.assign(cts[i], patch); saveContracts(cts); return cts[i]; }
  return null;
}

/* ══ Orgs helpers ═════════════════════════ */
function getOrgs() {
  return JSON.parse(localStorage.getItem('mu_orgs') || '[]');
}
function saveOrgs(orgs) {
  localStorage.setItem('mu_orgs', JSON.stringify(orgs));
}
function _getOrgPwd(orgId) {
  try { return JSON.parse(localStorage.getItem('mu_org_pwd') || '{}')[orgId] || null; } catch { return null; }
}
function _saveOrgPwd(orgId, pass) {
  const s = JSON.parse(localStorage.getItem('mu_org_pwd') || '{}');
  s[orgId] = pass;
  localStorage.setItem('mu_org_pwd', JSON.stringify(s));
}

/* ══ Registrations helpers ═══════════════ */
function getRegs() {
  return JSON.parse(localStorage.getItem('mu_regs') || '[]');
}
function saveRegs(regs) {
  localStorage.setItem('mu_regs', JSON.stringify(regs));
}

/* ══ Merge approved registrations into consultant list ══ */
const _COLORS = ['#006633','#087a45','#1a7340','#33a06f','#c8941f','#002b16','#15803d','#087a45'];

function regToConsultant(reg, idx) {
  return {
    id:           reg.id,
    name:         `${reg.firstName} ${reg.lastName}`,
    title:        reg.adminExp ? reg.adminExp.split(/[،,\n]/)[0].trim() : reg.type,
    college:      reg.college || '',
    dept:         reg.college || '',
    type:         reg.type || 'أكاديمي',
    exp_years:    0,
    skills:       Array.isArray(reg.skills) ? reg.skills : [],
    certs:        [],
    admin_exp:    reg.adminExp || '',
    training_exp: reg.trainExp || '',
    research_exp: reg.resExp   || '',
    research:     reg.resExp   ? [reg.resExp] : [],
    summary:      [reg.adminExp, reg.trainExp, reg.resExp].filter(Boolean).join(' | ') || '',
    rating:       0,
    reviews:      0,
    contracts:    0,
    color:        _COLORS[idx % _COLORS.length],
    verified:     true,
    available:    true,
    lang:         Array.isArray(reg.langs) ? reg.langs : ['العربية'],
    rate:         reg.rate ? parseFloat(reg.rate) : null,
    rateType:     reg.rateType || '',
    conflict:     !!reg.conflict,
    consentPublish: reg.consentPublish !== false,
    email:        reg.email  || '',
    empId:        reg.empId  || '',
    _fromReg:     true
  };
}

function getAllConsultants() {
  const approved = getRegs()
    .filter(r => r.status === 'معتمد' && r.consentPublish !== false)
    .map((r, i) => regToConsultant(r, DATA.length + i));
  return [...DATA, ...approved];
}
