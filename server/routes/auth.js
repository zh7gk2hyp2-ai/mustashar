const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../db/pool');
const authMW   = require('../middleware/auth');

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'بيانات ناقصة' });

  try {
    const [rows] = await db.query(
      'SELECT * FROM admins WHERE username = ? AND is_active = 1 LIMIT 1',
      [username.trim()]
    );
    const admin = rows[0];
    if (!admin) return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

    await db.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role, name: admin.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );

    res.json({
      token,
      admin: { id: admin.id, username: admin.username, role: admin.role, name: admin.full_name }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* GET /api/auth/me */
router.get('/me', authMW, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, full_name, email, role, last_login FROM admins WHERE id = ?',
      [req.admin.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/* POST /api/auth/change-password */
router.post('/change-password', authMW, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' });

  try {
    const [rows] = await db.query('SELECT password_hash FROM admins WHERE id = ?', [req.admin.id]);
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE admins SET password_hash = ? WHERE id = ?', [hash, req.admin.id]);
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
