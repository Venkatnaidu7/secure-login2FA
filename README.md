# 🔒 Secure Login System

A production-ready web application demonstrating enterprise-grade authentication security practices with user registration, secure login, session management, and optional Two-Factor Authentication (2FA).

## ✨ Key Features

### 🔐 Password Security
- **Bcrypt Hashing**: Passwords hashed with 10 rounds of bcrypt (Argon2 alternative available)
- **Strong Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)
- **Salted Hashes**: Each password gets a unique salt, preventing rainbow table attacks

### 🛡️ Input Validation & Protection
- **Server-side Validation**: All inputs validated on the backend
- **SQL Injection Prevention**: Parameterized queries throughout (no string concatenation)
- **XSS Protection**: Input sanitization and HTML escaping
- **CSRF Protection**: SameSite cookie flags enabled
- **Rate Limiting**: Ready to integrate express-rate-limit
- **Input Sanitization**: Using express-validator for thorough validation

### 🔑 Session Management
- **Secure Cookies**: 
  - `httpOnly` flag prevents JavaScript access
  - `secure` flag forces HTTPS in production
  - `sameSite: strict` prevents CSRF
- **Session Expiration**: 24-hour default timeout
- **Logout Functionality**: Complete session destruction
- **Session ID Regeneration**: Prevents session fixation attacks

### 🔐 Two-Factor Authentication (2FA)
- **TOTP Support**: Time-based One-Time Password (RFC 6238)
- **QR Code Generation**: Easy setup with authenticator apps
- **Authenticator App Compatible**:
  - Google Authenticator
  - Microsoft Authenticator
  - Authy
  - FreeOTP
- **30-second Window**: Time window for token verification
- **Backup Codes**: Ready for implementation

### 🚀 Additional Security Headers
- **Helmet.js Integration**: Sets security headers
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Strict-Transport-Security
- **CORS Protection**: Configurable origin restrictions
- **Request Size Limits**: Prevents large payload attacks

## 📋 Installation & Setup

### Prerequisites
- Node.js 14+ 
- npm or yarn
- A terminal/command line

### Step 1: Clone & Install

```bash
# Navigate to the project directory
cd secure-login

# Install dependencies
npm install
```

### Step 2: Environment Configuration

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your secure values
nano .env
```

**Important environment variables to customize:**
```env
SESSION_SECRET=generate-a-random-string-here
ALLOWED_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### Step 3: Start the Server

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The server will start on `http://localhost:3000`

## 🎯 Usage Guide

### Registration
1. Click the "Register" tab
2. Enter username (3-30 alphanumeric characters, hyphens, underscores)
3. Enter a valid email address
4. Create a password meeting all requirements:
   - ✓ 8+ characters
   - ✓ Uppercase letter
   - ✓ Lowercase letter
   - ✓ Number
   - ✓ Special character
5. Click "Create Account"

### Login
1. Enter your username or email
2. Enter your password
3. If 2FA is enabled, enter your 6-digit code
4. You're logged in!

### Enable 2FA
1. After logging in, go to "Security Settings"
2. Click "Enable 2FA"
3. Scan the QR code with your authenticator app
4. Enter the 6-digit code from your app
5. 2FA is now enabled! 🎉

### Disable 2FA
1. In Security Settings, click "Disable 2FA"
2. Confirm the action
3. 2FA is disabled

## 🔐 Security Architecture

### Database Schema

```sql
users table:
├── id (INTEGER PRIMARY KEY)
├── username (TEXT UNIQUE)
├── email (TEXT UNIQUE)
├── password_hash (TEXT) - Bcrypt hash, never store plaintext
├── created_at (DATETIME)
├── two_fa_enabled (BOOLEAN)
├── two_fa_secret (TEXT) - TOTP secret, base32 encoded
└── last_login (DATETIME)
```

### Authentication Flow

```
Registration:
User Input → Validation → Check Duplicates → Bcrypt Hash → Store in DB

Login:
Username → Database Query → Bcrypt Compare → Session Creation → Return Token

2FA Setup:
User Request → Generate Secret → Encode QR → Return QR Code

2FA Verify:
User Token → TOTP Verify → Enable 2FA → Update DB

Login with 2FA:
Standard Login → 2FA Required → User Sends Token → TOTP Verify → Full Login
```

### Parameterized Query Example

```javascript
// ✅ SECURE - Prevents SQL Injection
const result = await db.get(
  'SELECT * FROM users WHERE username = ?',
  [username]
);

// ❌ UNSAFE - Vulnerable to SQL Injection
const result = db.get(`SELECT * FROM users WHERE username = '${username}'`);
```

## 🏗️ API Endpoints

### Authentication

#### `POST /api/auth/register`
Register a new user
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### `POST /api/auth/login`
Authenticate user
```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

#### `POST /api/auth/logout`
Destroy session and logout

#### `GET /api/auth/status`
Check current authentication status

### Two-Factor Authentication

#### `POST /api/2fa/setup`
Generate 2FA secret and QR code

#### `POST /api/2fa/verify`
Verify 2FA token and enable 2FA
```json
{
  "token": "123456"
}
```

#### `POST /api/2fa/verify-login`
Verify 2FA during login
```json
{
  "token": "123456"
}
```

#### `POST /api/2fa/disable`
Disable 2FA for user

#### `GET /api/2fa/status`
Check if 2FA is enabled

## 🚨 Security Best Practices Implemented

### ✅ What We Do Right

1. **Password Hashing**
   - Bcrypt with 10 rounds (configurable)
   - Unique salt per password
   - Salts embedded in hash (no separate storage)

2. **SQL Injection Prevention**
   - All queries use parameterized statements
   - No string concatenation in queries
   - SQLite3 driver handles parameter binding

3. **XSS Prevention**
   - Input validation and sanitization
   - express-validator escaping
   - Content-Security-Policy headers

4. **CSRF Protection**
   - SameSite=strict cookies
   - Session-based authentication
   - Origin validation

5. **Secure Session Management**
   - HttpOnly cookies (no JavaScript access)
   - Secure flag for HTTPS
   - Reasonable expiration times
   - Proper logout with session destruction

6. **2FA Security**
   - Time-based tokens (TOTP)
   - Specs-compliant (RFC 6238)
   - 30-second verification window
   - Secret stored encrypted in database

## 🔧 Extending the System

### Add Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts'
});

app.post('/api/auth/login', loginLimiter, ...);
```

### Add Password Reset

```javascript
// Generate reset token
const resetToken = crypto.randomBytes(32).toString('hex');
const tokenHash = await bcrypt.hash(resetToken, 10);

// Store in database with expiration
await db.createPasswordReset(userId, tokenHash, Date.now() + 3600000);

// Send email to user
await sendPasswordResetEmail(email, resetToken);
```

### Add Email Verification

```javascript
// Send verification email on registration
const verificationToken = crypto.randomBytes(32).toString('hex');
await db.setVerificationToken(userId, verificationToken);
await sendVerificationEmail(email, verificationToken);

// Verify endpoint
app.get('/api/auth/verify/:token', async (req, res) => {
  const user = await db.findByVerificationToken(req.params.token);
  if (user) {
    await db.markEmailVerified(user.id);
  }
});
```

## 📊 Testing Credentials

**Test Account** (after first run):
- Username: `testuser`
- Email: `test@example.com`
- Password: `TestPass123!`

## 🚀 Production Deployment

### Before Going Live

1. **Change All Secrets**
   ```bash
   export SESSION_SECRET=$(openssl rand -hex 32)
   ```

2. **Enable HTTPS**
   ```javascript
   cookie: {
     secure: true, // Only over HTTPS
     sameSite: 'strict'
   }
   ```

3. **Use PostgreSQL or MySQL**
   - SQLite is fine for learning, not production
   - Install `pg` or `mysql2`
   - Update database module

4. **Set NODE_ENV**
   ```bash
   export NODE_ENV=production
   ```

5. **Enable Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

6. **Add Logging**
   ```bash
   npm install winston
   ```

7. **Use Environment Variables**
   - Never commit `.env` file
   - Use `.env.example` as template
   - Validate all env vars on startup

8. **Database Backups**
   - Implement regular backups
   - Store securely and encrypted

## 🧪 Testing

### Manual Testing Checklist

- [ ] Register with valid credentials
- [ ] Reject registration with weak password
- [ ] Reject registration with duplicate username
- [ ] Login with correct credentials
- [ ] Reject login with wrong password
- [ ] Logout and verify session destroyed
- [ ] Enable 2FA and scan QR code
- [ ] Login with 2FA enabled
- [ ] Disable 2FA
- [ ] Test SQL injection attempt (should fail)
- [ ] Test XSS injection attempt (should fail)

### Test SQL Injection Prevention

Try this in username field:
```
' OR '1'='1
'; DROP TABLE users; --
admin' --
```

All should be safely escaped and return "Invalid credentials"

## 📚 Security References

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **NIST Password Guidelines**: https://pages.nist.gov/800-63-3/
- **Bcrypt Best Practices**: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- **2FA Standards**: https://tools.ietf.org/html/rfc6238
- **Session Management**: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

## 🤝 Contributing

Found a security issue? Please:
1. Don't open a public issue
2. Email details to security maintainer
3. Include steps to reproduce
4. Allow time for a fix before disclosure

## 📝 License

MIT License - Use freely, attribute the authors

## ⚠️ Disclaimer

This system demonstrates security best practices for educational purposes. While production-ready in many aspects, always:
- Have security audits before production
- Keep dependencies updated
- Monitor for vulnerabilities
- Follow your organization's security policies
- Consult security professionals for critical systems

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Change port
PORT=3001 npm start
```

### Database Locked
```bash
# Delete the database and start fresh
rm secure_login.db
npm start
```

### 2FA QR Code Not Displaying
- Ensure `qrcode` package is installed
- Check browser console for errors
- Try different authenticator app

### Session Not Persisting
- Check `.env` SESSION_SECRET is set
- Verify cookies are enabled
- Confirm httpOnly flag in production

---

**Made with ❤️ for secure authentication**
