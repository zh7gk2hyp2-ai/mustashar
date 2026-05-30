const router = require('express').Router();
const db     = require('../db/pool');
const jwt    = require('jsonwebtoken');

function consultantAuthMW(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'غير مصرح' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'consultant') return res.status(403).json({ error: 'صلاحيات غير كافية' });
    req.consultant = payload;
    next();
  } catch {
    res.status(401).json({ error: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' });
  }
}

/* POST /api/consultant/login — emp_id + email */
router.post('/login', async (req, res) => {
  const { emp_id, email } = req.body;
  if (!emp_id || !email) return res.status(400).json({ error: 'رقم المنسوب والبريد الإلكتروني مطلوبان' });

  try {
    const [rows] = await db.query(
      `SELECT c.id, c.emp_id, c.full_name, c.email, c.college_id, c.is_verified
       FROM consultants c
       WHERE c.emp_id = ? AND LOWER(c.email) = LOWER(?) AND c.is_verified = 1`,
      [emp_id.trim(), email.trim()]
    );

    if (!rows[0]) return res.status(401).json({ error: 'بيانات غير صحيحة أو الحساب غير معتمد بعد' });

    const token = jwt.sign(
      { id: rows[0].id, emp_id: rows[0].emp_id, role: 'consultant' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );

    res.json({ token, consultant: { id: rows[0].id, full_name: rows[0].full_name, emp_id: rows[0].emp_id } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* GET /api/consultant/me — profile */
router.get('/me', consultantAuthMW, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, col.name AS college_name
       FROM consultants c
       LEFT JOIN colleges col ON col.id = c.college_id
       WHERE c.id = ?`,
      [req.consultant.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'غير موجود' });
    const { email, phone, ...rest } = rows[0];
    res.json({ ...rest, email, phone });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* PATCH /api/consultant/profile — update own limited fields */
router.patch('/profile', consultantAuthMW, async (req, res) => {
  const allowed = ['phone', 'linkedin_url', 'is_available', 'rate', 'rate_type', 'title', 'department'];
  const fields = [];
  const vals   = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      vals.push(req.body[key]);
    }
  }
  if (!fields.length) return res.status(400).json({ error: 'لا بيانات للتحديث' });
  vals.push(req.consultant.id);
  try {
    await db.query(`UPDATE consultants SET ${fields.join(', ')} WHERE id = ?`, vals);
    res.json({ message: 'تم تحديث بياناتك بنجاح' });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* GET /api/consultant/contracts — own contracts */
router.get('/contracts', consultantAuthMW, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ct.id, ct.org_name, ct.contact_name, ct.service_type, ct.description,
              ct.duration, ct.mode, ct.estimated_value, ct.consultant_share,
              ct.university_share, ct.status, ct.created_at, ct.updated_at
       FROM contracts ct
       WHERE ct.consultant_id = ?
       ORDER BY ct.created_at DESC`,
      [req.consultant.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* GET /api/consultant/stats — own stats */
router.get('/stats', consultantAuthMW, async (req, res) => {
  try {
    const [[row]] = await db.query(
      `SELECT rating, reviews_count, contracts_count,
              (SELECT COUNT(*) FROM contracts WHERE consultant_id = ? AND status = 'مكتمل')  AS completed,
              (SELECT COALESCE(SUM(consultant_share),0) FROM contracts WHERE consultant_id = ? AND status = 'مكتمل') AS total_earned
       FROM consultants WHERE id = ?`,
      [req.consultant.id, req.consultant.id, req.consultant.id]
    );
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = { router, consultantAuthMW };
