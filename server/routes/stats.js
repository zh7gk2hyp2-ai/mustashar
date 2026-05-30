const router = require('express').Router();
const db     = require('../db/pool');
const authMW = require('../middleware/auth');

/* GET /api/stats/dashboard — admin KPIs */
router.get('/dashboard', authMW, async (req, res) => {
  try {
    const [[totals]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM registrations)                                    AS total_registrations,
        (SELECT COUNT(*) FROM registrations WHERE status = 'قيد المراجعة')      AS pending_registrations,
        (SELECT COUNT(*) FROM consultants  WHERE is_verified = 1)               AS approved_consultants,
        (SELECT COUNT(*) FROM contracts)                                         AS total_contracts,
        (SELECT COUNT(*) FROM contracts WHERE status = 'مكتمل')                 AS completed_contracts,
        (SELECT ROUND(AVG(rating),2) FROM consultants WHERE is_verified = 1)    AS avg_rating,
        (SELECT COUNT(DISTINCT org_name) FROM contracts)                        AS partner_entities,
        (SELECT COALESCE(SUM(university_share),0) FROM contracts WHERE status='مكتمل') AS university_revenue
    `);

    const [byCollege] = await db.query(`
      SELECT col.name, COUNT(c.id) AS count
      FROM consultants c
      JOIN colleges col ON col.id = c.college_id
      WHERE c.is_verified = 1
      GROUP BY col.id
      ORDER BY count DESC
      LIMIT 10`);

    const [byStatus] = await db.query(`
      SELECT status, COUNT(*) AS count
      FROM contracts
      GROUP BY status`);

    const [recent] = await db.query(`
      SELECT r.req_number, r.first_name, r.last_name, r.status, r.created_at, col.name AS college_name
      FROM registrations r
      LEFT JOIN colleges col ON col.id = r.college_id
      ORDER BY r.created_at DESC LIMIT 5`);

    res.json({ totals, byCollege, byStatus, recent });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* GET /api/stats/colleges — public */
router.get('/colleges', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM colleges ORDER BY name');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
