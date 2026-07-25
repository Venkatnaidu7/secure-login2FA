const express = require('express');
const session = require('express-session');
const bcrypt  = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode  = require('qrcode');
const { body, validationResult } = require('express-validator');
const helmet  = require('helmet');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const Database = require('./database');

const app = express();
const db  = new Database(path.join(__dirname, 'secure_login.db'));

// ── Helmet with a CSP that allows our own external scripts/styles ──
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'"],          // only /public/app.js
        styleSrc:    ["'self'"],          // only /public/style.css
        imgSrc:      ["'self'", "data:"], // data: needed for QR code <img>
        connectSrc:  ["'self'"],
        fontSrc:     ["'self'"],
        objectSrc:   ["'none'"],
        frameSrc:    ["'none'"],
      }
    }
  })
);

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Explicit root route — always serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'strict',
    maxAge:    1000 * 60 * 60 * 24
  }
}));

db.initialize().catch(err => { console.error('DB init failed:', err); process.exit(1); });

// ── Validation rules ──────────────────────────────────────────────
const validateUsername = body('username')
  .trim().isLength({ min:3, max:30 }).withMessage('Username must be 3–30 characters')
  .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Letters, numbers, hyphens and underscores only')
  .escape();

const validateEmail = body('email')
  .trim().isEmail().withMessage('Invalid email address')
  .normalizeEmail();

const validatePassword = body('password')
  .isLength({ min:8 }).withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  .withMessage('Password must contain uppercase, lowercase, numbers and a special character');

// ── Helpers ───────────────────────────────────────────────────────
function validationFailed(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success:false, errors: errors.array().map(e => ({ message: e.msg })) });
    return true;
  }
  return false;
}

function requireAuth(req, res) {
  if (!req.session.userId) {
    res.status(401).json({ success:false, message:'Not authenticated' });
    return false;
  }
  return true;
}

// ── Auth routes ───────────────────────────────────────────────────
app.get('/api/auth/status', (req, res) => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      userId:        req.session.userId,
      username:      req.session.username,
      requires2fa:   req.session.requires2fa || false
    });
  } else {
    res.json({ authenticated: false });
  }
});

app.post('/api/auth/register', [validateUsername, validateEmail, validatePassword], async (req, res) => {
  try {
    if (validationFailed(req, res)) return;
    const { username, email, password } = req.body;

    if (await db.findUserByUsername(username))
      return res.status(409).json({ success:false, message:'Username already exists' });
    if (await db.findUserByEmail(email))
      return res.status(409).json({ success:false, message:'Email already registered' });

    const hash   = await bcrypt.hash(password, 10);
    const userId = await db.createUser(username, email, hash);
    res.status(201).json({ success:true, message:'Registration successful', userId });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success:false, message:'Registration failed' });
  }
});

app.post('/api/auth/login',
  [body('username').trim().escape(), body('password').notEmpty()],
  async (req, res) => {
    try {
      if (validationFailed(req, res)) return;
      const { username, password } = req.body;
      const user = await db.findUserByUsername(username);
      if (!user || !(await bcrypt.compare(password, user.password_hash)))
        return res.status(401).json({ success:false, message:'Invalid credentials' });

      req.session.userId   = user.id;
      req.session.username = user.username;

      if (user.two_fa_enabled) {
        req.session.requires2fa = true;
        return res.json({ success:true, requires2fa:true });
      }
      req.session.requires2fa = false;
      res.json({ success:true, requires2fa:false, userId:user.id, username:user.username });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success:false, message:'Login failed' });
    }
  }
);

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    res.clearCookie('connect.sid');
    if (err) return res.status(500).json({ success:false });
    res.json({ success:true });
  });
});

// ── 2FA routes ────────────────────────────────────────────────────
app.post('/api/2fa/setup', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const secret = speakeasy.generateSecret({
      name:   `SecureLogin (${req.session.username})`,
      issuer: 'Secure Login System'
    });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    req.session.tempSecret = secret.base32;
    res.json({ success:true, qrCode });
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({ success:false, message:'2FA setup failed' });
  }
});

app.post('/api/2fa/verify', [body('token').isLength({ min:6, max:6 }).isNumeric()], async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (validationFailed(req, res)) return;
    const { token } = req.body;
    const secret    = req.session.tempSecret;
    if (!secret) return res.status(400).json({ success:false, message:'Start 2FA setup first' });

    const ok = speakeasy.totp.verify({ secret, encoding:'base32', token, window:2 });
    if (!ok) return res.status(401).json({ success:false, message:'Invalid code' });

    await db.enable2FA(req.session.userId, secret);
    delete req.session.tempSecret;
    res.json({ success:true, message:'2FA enabled' });
  } catch (err) {
    console.error('2FA verify error:', err);
    res.status(500).json({ success:false, message:'2FA verification failed' });
  }
});

app.post('/api/2fa/verify-login', [body('token').isLength({ min:6, max:6 }).isNumeric()], async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    if (!req.session.requires2fa)
      return res.status(400).json({ success:false, message:'Not in 2FA state' });
    if (validationFailed(req, res)) return;

    const user = await db.getUserById(req.session.userId);
    if (!user || !user.two_fa_secret)
      return res.status(401).json({ success:false, message:'Invalid 2FA state' });

    const ok = speakeasy.totp.verify({
      secret:   user.two_fa_secret,
      encoding: 'base32',
      token:    req.body.token,
      window:   2
    });
    if (!ok) return res.status(401).json({ success:false, message:'Invalid code' });

    req.session.requires2fa = false;
    res.json({ success:true });
  } catch (err) {
    console.error('2FA login verify error:', err);
    res.status(500).json({ success:false, message:'Verification failed' });
  }
});

app.post('/api/2fa/disable', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    await db.disable2FA(req.session.userId);
    res.json({ success:true });
  } catch (err) {
    console.error('2FA disable error:', err);
    res.status(500).json({ success:false });
  }
});

app.get('/api/2fa/status', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const user = await db.getUserById(req.session.userId);
    res.json({ success:true, enabled: !!user.two_fa_enabled });
  } catch (err) {
    res.status(500).json({ success:false });
  }
});

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success:false, message:'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔒 Secure Login running on http://localhost:${PORT}`);
});
