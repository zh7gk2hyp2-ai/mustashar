require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const app = express();

/* ── Security ───────────────────────────────────────────── */
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'طلبات كثيرة، يرجى المحاولة لاحقاً' }
}));

/* stricter limit for login */
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'محاولات تسجيل دخول كثيرة، يرجى الانتظار 15 دقيقة' }
}));

/* ── Body / Static ──────────────────────────────────────── */
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));
app.use(express.static(path.join(__dirname, '..')));

/* ── Routes ─────────────────────────────────────────────── */
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/consultants',   require('./routes/consultants'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/contracts',     require('./routes/contracts'));
app.use('/api/stats',         require('./routes/stats'));

/* ── SPA fallback ───────────────────────────────────────── */
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'المسار غير موجود' });
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

/* ── Error handler ───────────────────────────────────────── */
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'خطأ داخلي في الخادم' });
});

/* ── Start ──────────────────────────────────────────────── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`منصة مستشار تعمل على المنفذ ${PORT}`));
