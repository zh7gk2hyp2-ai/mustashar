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
  registeredConsultants: 200,
  approvedProfiles:      150,
  monthlyContracts:       50,
  avgRating:             4.5,
  responseHours:          48,
  partnerEntities:        30,
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
    const i = this.shortlist.indexOf(id);
    if (i > -1) this.shortlist.splice(i, 1);
    else this.shortlist.push(id);
    this.save();
    return i === -1;
  },
  isSL(id) { return this.shortlist.includes(id); }
};

/* ══ Registrations helpers ═══════════════ */
function getRegs() {
  return JSON.parse(localStorage.getItem('mu_regs') || '[]');
}
function saveRegs(regs) {
  localStorage.setItem('mu_regs', JSON.stringify(regs));
}
