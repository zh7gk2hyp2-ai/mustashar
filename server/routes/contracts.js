const router = require('express').Router();
const db     = require('../db/pool');
const authMW = require('../middleware/auth');

const UNIVERSITY_SHARE = 0.30;

/* POST /api/contracts — public submit */
router.post('/', async (req, res) => {
  const b = req.body;
  const required = ['consultant_id','org_name','contact_name','contact_email','service_type','description'];
  for (const f of required) {
    if (!b[f]) return res.status(400).json({ error: `الحقل ${f} مطلوب` });
  }

  try {
    const [cons] = await db.query('SELECT id, is_available FROM consultants WHERE id = ? AND is_verified = 1', [b.consultant_id]);
    if (!cons[0]) return res.status(404).json({ error: 'المستشار غير موجود' });

    const estimated = b.estimated_value ? parseFloat(b.estimated_value) : null;
    const uniShare  = estimated ? +(estimated * UNIVERSITY_SHARE).toFixed(2) : null;
    const conShare  = estimated ? +(estimated * (1 - UNIVERSITY_SHARE)).toFixed(2) : null;

    const [result] = await db.query(`
      INSERT INTO contracts
        (consultant_id, org_name, contact_name, contact_email, contact_phone,
         service_type, description, duration, mode,
         estimated_value, consultant_share, university_share)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        b.consultant_id,
        b.org_name.trim(), b.contact_name.trim(), b.contact_email.trim().toLowerCase(),
        b.contact_phone || null,
        b.service_type, b.description.trim(),
        b.duration || null,
        b.mode || 'مختلط',
        estimated, conShare, uniShare
      ]
    );

    res.status(201).json({
      message: 'تم إرسال طلب التعاقد. سيتواصل معك المركز خلال يومي عمل.',
      id: result.insertId
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* GET /api/contracts — admin list */
router.get('/', authMW, async (req, res) => {
  try {
    const { status, consultant_id, page = 1, limit = 30 } = req.query;
    const where = [];
    const params = [];

    if (status)        { where.push('ct.status = ?');        params.push(status); }
    if (consultant_id) { where.push('ct.consultant_id = ?'); params.push(consultant_id); }

    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    params.push(Math.min(50, +limit), (Math.max(1, +page) - 1) * Math.min(50, +limit));

    const [rows] = await db.query(`
      SELECT ct.*, c.full_name AS consultant_name, c.title AS consultant_title
      FROM contracts ct
      LEFT JOIN consultants c ON c.id = ct.consultant_id
      ${w}
      ORDER BY ct.created_at DESC
      LIMIT ? OFFSET ?`, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* PATCH /api/contracts/:id/status — admin */
router.patch('/:id/status', authMW, async (req, res) => {
  const valid = ['قيد الدراسة','مقبول','مرفوض','تحت التنفيذ','مكتمل'];
  const { status, admin_notes } = req.body;
  if (!valid.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });

  try {
    const [result] = await db.query(
      'UPDATE contracts SET status = ?, admin_notes = ? WHERE id = ?',
      [status, admin_notes || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'الطلب غير موجود' });

    if (status === 'مكتمل') {
      const [rows] = await db.query('SELECT consultant_id FROM contracts WHERE id = ?', [req.params.id]);
      if (rows[0]) {
        await db.query(
          'UPDATE consultants SET contracts_count = contracts_count + 1 WHERE id = ?',
          [rows[0].consultant_id]
        );
      }
    }
    res.json({ message: `تم تحديث الحالة إلى: ${status}` });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* POST /api/contracts/:id/review — submit review after completion */
router.post('/:id/review', async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'التقييم يجب أن يكون بين 1 و5' });

  try {
    const [rows] = await db.query(
      'SELECT id, consultant_id, status FROM contracts WHERE id = ?',
      [req.params.id]
    );
    const contract = rows[0];
    if (!contract) return res.status(404).json({ error: 'العقد غير موجود' });
    if (contract.status !== 'مكتمل') return res.status(400).json({ error: 'لا يمكن التقييم إلا بعد اكتمال العقد' });

    await db.query(
      'INSERT INTO reviews (contract_id, consultant_id, rating, comment) VALUES (?,?,?,?)',
      [contract.id, contract.consultant_id, rating, comment || null]
    );

    /* recalculate avg rating */
    const [avg] = await db.query(
      'SELECT AVG(rating) AS avg_r, COUNT(*) AS cnt FROM reviews WHERE consultant_id = ?',
      [contract.consultant_id]
    );
    await db.query(
      'UPDATE consultants SET rating = ?, reviews_count = ? WHERE id = ?',
      [+(avg[0].avg_r).toFixed(2), avg[0].cnt, contract.consultant_id]
    );

    res.status(201).json({ message: 'شكراً على تقييمك' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'تم تقديم تقييم لهذا العقد مسبقاً' });
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
