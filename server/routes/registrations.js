const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db/pool');
const authMW  = require('../middleware/auth');
const { generateConsultantSummary } = require('../services/ai');

/* ── File upload config ────────────────────────────── */
const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf','.doc','.docx','.jpg','.jpeg','.png'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) return cb(null, true);
    cb(new Error('نوع الملف غير مسموح به'));
  }
});

/* POST /api/registrations — public submit */
router.post('/', upload.fields([{ name:'cv', maxCount:1 }, { name:'certs', maxCount:5 }]), async (req, res) => {
  const b = req.body;
  const required = ['first_name','last_name','emp_id','phone','email','work_type','consent_pdpl'];
  for (const f of required) {
    if (!b[f]) return res.status(400).json({ error: `الحقل ${f} مطلوب` });
  }

  try {
    const [dup] = await db.query('SELECT id FROM registrations WHERE emp_id = ?', [b.emp_id]);
    if (dup.length) return res.status(409).json({ error: 'رقم المنسوب مسجل مسبقاً' });

    const reqNum = 'TU-' + String(Date.now()).slice(-6);
    const cvPath = req.files?.cv?.[0]?.filename || null;
    const certsPath = req.files?.certs?.map(f => f.filename) || [];

    const [result] = await db.query(`
      INSERT INTO registrations
        (req_number, first_name, last_name, emp_id, phone, email, college_id,
         work_type, rate, rate_type, admin_exp, training_exp, research_exp,
         skills, languages, has_conflict, conflict_detail,
         consent_publish, consent_pdpl, consent_ai,
         cv_path, certs_path)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        reqNum,
        b.first_name.trim(), b.last_name.trim(),
        b.emp_id.trim(), b.phone.trim(), b.email.trim().toLowerCase(),
        b.college_id || null,
        b.work_type,
        b.rate ? parseFloat(b.rate) : null,
        b.rate_type || null,
        b.admin_exp || null,
        b.training_exp || null,
        b.research_exp || null,
        b.skills ? JSON.stringify(Array.isArray(b.skills) ? b.skills : b.skills.split(',').map(s=>s.trim())) : '[]',
        b.languages ? JSON.stringify(Array.isArray(b.languages) ? b.languages : b.languages.split(',').map(s=>s.trim())) : '[]',
        b.has_conflict === 'true' || b.has_conflict === '1' ? 1 : 0,
        b.conflict_detail || null,
        b.consent_publish === 'true' || b.consent_publish === '1' ? 1 : 1,
        1, /* consent_pdpl — mandatory */
        b.consent_ai === 'true' || b.consent_ai === '1' ? 1 : 0,
        cvPath,
        JSON.stringify(certsPath)
      ]
    );

    res.status(201).json({ message: 'تم إرسال الطلب بنجاح', req_number: reqNum, id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* GET /api/registrations — admin list */
router.get('/', authMW, async (req, res) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const where = status ? 'WHERE r.status = ?' : '';
    const params = status ? [status] : [];
    params.push(Math.min(50, +limit), (Math.max(1, +page) - 1) * Math.min(50, +limit));

    const [rows] = await db.query(`
      SELECT r.*, c.name AS college_name
      FROM registrations r
      LEFT JOIN colleges c ON c.id = r.college_id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?`, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* GET /api/registrations/:id — admin */
router.get('/:id', authMW, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, c.name AS college_name
      FROM registrations r
      LEFT JOIN colleges c ON c.id = r.college_id
      WHERE r.id = ?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'الطلب غير موجود' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* PATCH /api/registrations/:id/approve — admin */
router.patch('/:id/approve', authMW, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT * FROM registrations WHERE id = ? FOR UPDATE', [req.params.id]);
    const reg = rows[0];
    if (!reg) { await conn.rollback(); return res.status(404).json({ error: 'الطلب غير موجود' }); }
    if (reg.status === 'معتمد') { await conn.rollback(); return res.status(409).json({ error: 'الطلب معتمد مسبقاً' }); }

    /* update registration status */
    await conn.query(
      'UPDATE registrations SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      ['معتمد', req.admin.id, reg.id]
    );

    /* create or update consultant record */
    const fullName = `${reg.first_name} ${reg.last_name}`;
    await conn.query(`
      INSERT INTO consultants
        (registration_id, emp_id, full_name, college_id, work_type, email, phone,
         rate, rate_type, skills, languages, admin_exp, training_exp, research_exp, ai_summary)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        full_name=VALUES(full_name), college_id=VALUES(college_id),
        email=VALUES(email), phone=VALUES(phone),
        rate=VALUES(rate), rate_type=VALUES(rate_type)`,
      [reg.id, reg.emp_id, fullName, reg.college_id, reg.work_type, reg.email, reg.phone,
       reg.rate, reg.rate_type, reg.skills, reg.languages,
       reg.admin_exp, reg.training_exp, reg.research_exp, reg.ai_summary]
    );

    /* get new consultant id then generate AI summary asynchronously */
    const [consRows] = await conn.query(
      'SELECT id FROM consultants WHERE registration_id = ?', [reg.id]
    );
    const consultantId = consRows[0]?.id;

    /* audit log */
    await conn.query(
      'INSERT INTO audit_log (admin_id, action, entity, entity_id, ip_address) VALUES (?,?,?,?,?)',
      [req.admin.id, 'approve_registration', 'registrations', reg.id, req.ip]
    );

    await conn.commit();
    res.json({ message: 'تم قبول الطلب وإنشاء ملف المستشار' });

    /* generate AI summary after responding — non-blocking */
    if (consultantId && reg.consent_ai) {
      const collegeRow = await db.query(
        'SELECT name FROM colleges WHERE id = ?', [reg.college_id]
      ).then(([r]) => r[0]);
      generateConsultantSummary({ ...reg, college_name: collegeRow?.name })
        .then(summary => {
          if (summary) {
            return db.query(
              'UPDATE consultants SET ai_summary = ? WHERE id = ?',
              [summary, consultantId]
            );
          }
        })
        .catch(err => console.error('[AI] فشل تحديث الملخص:', err.message));
    }
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    conn.release();
  }
});

/* PATCH /api/registrations/:id/reject — admin */
router.patch('/:id/reject', authMW, async (req, res) => {
  try {
    const { rejection_note } = req.body;
    const [result] = await db.query(
      'UPDATE registrations SET status = ?, reviewed_by = ?, reviewed_at = NOW(), rejection_note = ? WHERE id = ?',
      ['مرفوض', req.admin.id, rejection_note || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'الطلب غير موجود' });
    res.json({ message: 'تم رفض الطلب' });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
