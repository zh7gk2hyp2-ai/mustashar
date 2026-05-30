-- ════════════════════════════════════════════════════════
--  منصة مستشار – بيانات أولية
--  تشغيل بعد schema.sql
-- ════════════════════════════════════════════════════════

USE mustashar_db;

-- ── المدير الافتراضي (كلمة المرور: tu2025 بعد التشفير)
-- bcrypt hash لـ "tu2025" بـ saltRounds=12
INSERT IGNORE INTO admins (username, password_hash, full_name, email, role) VALUES
  ('admin',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniQPuNXDHgW3VvSmrEWnGTM7C',
   'مدير النظام',
   'research@tu.edu.sa',
   'super_admin');

-- ── الكليات (17 كلية رسمية)
INSERT IGNORE INTO colleges (name) VALUES
  ('كلية التربية'),
  ('كلية الهندسة'),
  ('كلية الحاسبات وتقنية المعلومات'),
  ('كلية الطب'),
  ('كلية الصيدلة'),
  ('كلية العلوم'),
  ('كلية إدارة الأعمال'),
  ('كلية الشريعة والأنظمة'),
  ('كلية الآداب والعلوم الإنسانية'),
  ('كلية الاتصالات وتقنية المعلومات'),
  ('كلية العلوم الطبية التطبيقية'),
  ('كلية طب الأسنان'),
  ('كلية التمريض'),
  ('كلية الفنون والتصميم'),
  ('كلية السياحة والآثار'),
  ('كلية المجتمع'),
  ('كلية العمارة والتخطيط');

-- ── مستشار تجريبي (للاختبار)
INSERT IGNORE INTO consultants
  (emp_id, full_name, title, college_id, department, work_type, email, phone,
   rate, rate_type, exp_years, skills, languages, certs,
   admin_exp, training_exp, research_exp, ai_summary,
   rating, reviews_count, contracts_count, is_available, is_verified, avatar_color)
VALUES
  ('TU-001',
   'د. أحمد عبدالله الزهراني',
   'أستاذ مشارك – تقنية المعلومات',
   (SELECT id FROM colleges WHERE name='كلية الحاسبات وتقنية المعلومات'),
   'علم الحاسب',
   'أكاديمي',
   'a.alzahrani@tu.edu.sa',
   '0501234567',
   800.00, 'ساعة', 12,
   JSON_ARRAY('تحليل البيانات','الذكاء الاصطناعي','Python','إدارة المشاريع التقنية','التحول الرقمي'),
   JSON_ARRAY('العربية','الإنجليزية'),
   JSON_ARRAY('PMP','AWS Solutions Architect','CISA'),
   'رئيس قسم علم الحاسب 2018-2022، عضو لجنة التحول الرقمي الجامعي',
   'تدريب 200+ موظف في مجال التحول الرقمي، مدرب معتمد من PMI',
   'باحث رئيسي في 3 مشاريع ممولة من وزارة التعليم، 15 ورقة بحثية محكمة',
   'خبير متميز في التحول الرقمي وتحليل البيانات بخبرة 12 عامًا في القطاعين الأكاديمي والحكومي. قاد مشاريع تقنية بميزانيات تجاوزت 5 ملايين ريال وأسهم في رقمنة 7 جهات حكومية.',
   4.8, 24, 18, TRUE, TRUE, '#006633');
