const router = require('express').Router();
const db     = require('../db/pool');
const authMW = require('../middleware/auth');

const BASE_SELECT = `
  SELECT c.*, col.name AS college_name
  FROM consultants c
  LEFT JOIN colleges col ON col.id = c.college_id`;

/* GET /api/consultants — public list with filters */
router.get('/', async (req, res) => {
  try {
    const { q, college, available, lang, minRating, page = 1, limit = 20 } = req.query;
    const where = ['c.is_verified = 1'];
    const params = [];

    if (q) {
      where.push('MATCH(c.full_name, c.title, c.ai_summary) AGAINST(? IN BOOLEAN MODE)');
      params.push(q + '*');
    }
    if (college)    { where.push('c.college_id = ?');    params.push(college); }
    if (available)  { where.push('c.is_available = ?');  params.push(available === 'true' ? 1 : 0); }
    if (minRating)  { where.push('c.rating >= ?');       params.push(minRating); }
    if (lang)       { where.push('JSON_CONTAINS(c.languages, JSON_QUOTE(?))'); params.push(lang); }

    const offset = (Math.max(1, +page) - 1) * Math.min(50, +limit);
    const sql = `${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY c.rating DESC LIMIT ? OFFSET ?`;
    params.push(+limit, offset);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* GET /api/consultants/:id — public profile */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`${BASE_SELECT} WHERE c.id = ?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'المستشار غير موجود' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* PATCH /api/consultants/:id/availability — admin */
router.patch('/:id/availability', authMW, async (req, res) => {
  try {
    const { is_available } = req.body;
    await db.query('UPDATE consultants SET is_available = ? WHERE id = ?', [!!is_available, req.params.id]);
    res.json({ message: 'تم تحديث حالة التوفر' });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* PUT /api/consultants/:id — admin update */
router.put('/:id', authMW, async (req, res) => {
  try {
    const allowed = ['title','department','phone','rate','rate_type','exp_years',
                     'skills','languages','certs','admin_exp','training_exp',
                     'research_exp','ai_summary','linkedin_url','is_available','avatar_color'];
    const fields = [];
    const vals   = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        vals.push(typeof req.body[key] === 'object' ? JSON.stringify(req.body[key]) : req.body[key]);
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
    vals.push(req.params.id);
    await db.query(`UPDATE consultants SET ${fields.join(', ')} WHERE id = ?`, vals);
    res.json({ message: 'تم تحديث بيانات المستشار' });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* GET /api/consultants/:id/reviews — public */
router.get('/:id/reviews', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT r.rating, r.comment, r.created_at FROM reviews r WHERE r.consultant_id = ? ORDER BY r.created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
