# 🔒 Security Testing Guide

This guide demonstrates how the security features protect against common attacks.

## 1. SQL Injection Prevention Testing

### What is SQL Injection?
SQL Injection occurs when an attacker inserts malicious SQL code into input fields to manipulate database queries.

### Test Case: Username Field
**Attack Attempt:**
```
Username: ' OR '1'='1
Password: anything
```

**What Would Happen (Without Protection):**
```sql
-- Vulnerable code would create:
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = 'hash'
-- This returns the first user regardless of password!
```

**What Actually Happens (With Our Protection):**
```javascript
// Our parameterized query:
db.get('SELECT * FROM users WHERE username = ?', [username])

// SQLite treats the entire input as a string literal, not SQL code
// So ' OR '1'='1' is just a username to look up
// Result: "Invalid credentials" ✓
```

### Test Case: Email Field
**Attack Attempt:**
```
Email: test@example.com'); DROP TABLE users; --
```

**Why It Fails:**
- The entire string is treated as an email value
- SQLite never interprets `DROP TABLE users` as a command
- The database remains safe ✓

### Testing Procedure
1. Start the server: `npm start`
2. Go to Registration tab
3. Try SQL injection in username: `' OR '1'='1`
4. Expected: "Username already exists" or normal validation error
5. Never returns data or drops tables ✓

## 2. Password Security Testing

### Bcrypt Hashing Verification

**Inspect the Database:**
```bash
# Install sqlite3 CLI if needed
brew install sqlite3  # macOS
apt-get install sqlite3  # Linux

# Open database
sqlite3 secure_login.db

# View users table
SELECT id, username, password_hash FROM users;
```

**Observation:**
```
id | username | password_hash
1  | testuser | $2b$10$abcdef... (60 characters always)
```

**Key Points:**
- Password hashes start with `$2b$10$` (bcrypt format)
- Always 60 characters long
- Each password has unique hash due to salt
- Hash includes salt (no separate storage needed)
- Impossible to reverse (one-way function)

### Rainbow Table Resistance

**Same Password, Different Users:**
```javascript
// User 1: password = "SecurePass123!"
// Hash: $2b$10$N7x4yZ2mK9... (with unique salt)

// User 2: password = "SecurePass123!"
// Hash: $2b$10$aF3pQ8vL2x... (with different unique salt)
// Different hash despite same password!
```

This prevents attackers from using pre-computed hash tables (rainbow tables).

### Password Strength Validation

**Invalid Passwords (Will Be Rejected):**
- `short` - Too short (needs 8+)
- `Password123` - Missing special character
- `password123!` - Missing uppercase
- `PASSWORD123!` - Missing lowercase
- `Pass123` - Missing special character

**Valid Password:**
- `SecurePass123!` ✓

**Testing:**
1. Go to Registration
2. Try entering `Password123` (missing special char)
3. See "Requirement not met" in red
4. Password field not submitted ✓

## 3. XSS (Cross-Site Scripting) Prevention

### What is XSS?
XSS occurs when an attacker injects JavaScript code that executes in other users' browsers.

### Test Case: Script Injection
**Attack Attempt:**
```
Username: <script>alert('XSS')</script>
```

**Why It Fails:**
1. Input validation rejects special characters
2. Output is HTML-escaped (< becomes &lt;)
3. CSP headers prevent inline scripts
4. No eval() or innerHTML used unsafely

**Result:** Registration fails with "Username can only contain alphanumeric characters..." ✓

### Test Case: Image-based XSS
**Attack Attempt:**
```
Email: test@example.com<img src=x onerror="alert('XSS')">
```

**Why It Fails:**
1. Email validation rejects non-email characters
2. Input must pass `isEmail()` validator
3. CSP headers block event handler execution

**Result:** Invalid email error ✓

### Testing Procedure
1. Try registering with: `test<img src=x>`
2. See validation error
3. JavaScript never executes ✓

## 4. CSRF (Cross-Site Request Forgery) Prevention

### What is CSRF?
CSRF is when a malicious site makes requests to your account without your knowledge.

### How We Prevent It

**SameSite Cookie Flag:**
```javascript
// Our cookie setting:
cookie: {
  sameSite: 'strict' // <-- This prevents CSRF
}
```

**How It Works:**
1. User logs in to our site
2. Browser sets `secure-login-cookie` with `SameSite=Strict`
3. User visits evil.com (attacker site)
4. Evil.com tries to send request to our server
5. Browser REFUSES to include the cookie (different origin)
6. Our server doesn't process the request ✓

### Verification
You cannot easily test this without a separate domain, but the protection is in place:
```bash
curl -i http://localhost:3000/api/auth/logout -X POST
# Without valid session, returns 401 Unauthorized ✓
```

## 5. Session Security Testing

### Session Expiration

**Test:**
```bash
# Start server with SESSION_MAX_AGE=5000 (5 seconds) for testing
SESSION_MAX_AGE=5000 npm start

# Login
# Wait 6 seconds
# Refresh page or make request
# Session should be invalid ✓
```

### HttpOnly Cookie Protection

**Browser Console Test:**
1. Login and go to Dashboard
2. Open DevTools (F12)
3. Go to Console
4. Try: `console.log(document.cookie)`
5. Result: Empty (session cookie is HttpOnly) ✓
6. JavaScript cannot access session cookie

**Why This Matters:**
- Even if XSS succeeds, attacker cannot steal session cookie
- Cookie only sent in HTTP requests, not accessible to JavaScript

### Secure Flag (Production)

In production (`NODE_ENV=production`):
```javascript
cookie: {
  secure: true // Only sent over HTTPS
}
```

**Without HTTPS:**
- Cookies never sent over plain HTTP
- Attacker cannot intercept via man-in-the-middle

## 6. Two-Factor Authentication (2FA) Testing

### TOTP Security

**Test Setup:**
1. Register and login
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
   - Google Authenticator (mobile)
   - Microsoft Authenticator
   - Authy
4. Enter the 6-digit code
5. 2FA enabled ✓

### Token Verification

**Why Time-Based Tokens Are Secure:**
```javascript
// TOTP Algorithm (RFC 6238):
// 1. Server has secret: "JBSWY3DPEBLW64TMMQ..."
// 2. Current time: 1234567890
// 3. Generate code: HMAC-SHA1(secret, time/30)
// 4. Code valid for 30-second window (±30 seconds)
// 5. After 30 seconds, new code required

// Each code:
- Valid for only 30 seconds
- Impossible to predict (uses HMAC-SHA1)
- Unique to this account (different secret per user)
- Impossible to replay (time-bound)
```

**Test Replay Attack:**
1. Generate 2FA code (e.g., 123456)
2. Use it to login
3. Logout
4. Try using the SAME code again immediately
5. Result: "Invalid code" ✓
   (Time has moved past 30-second window or code already used)

### Backup Strategy

**Current Implementation:**
- If you lose access to authenticator, only option is admin reset
- **TODO for production:** Implement backup codes

**Recommended for Production:**
```javascript
// When enabling 2FA, generate and display:
const backupCodes = generateBackupCodes(10); // 10 codes
// Show to user once: "Save these codes somewhere safe"
// Each can be used once to login if phone lost
```

## 7. Password Reset Security (Future Implementation)

**Current Limitation:** No password reset function yet

**Secure Implementation When Added:**
```javascript
// DO NOT implement like this (UNSAFE):
// POST /reset-password with password change
// (No verification it's really the user)

// DO implement like this (SAFE):
// 1. User requests password reset
// 2. Send email with unique token
// 3. Token valid for 1 hour only
// 4. User clicks link, confirms identity
// 5. Only then allows password change
// 6. Invalidate token after use
```

## 8. Brute Force Attack Prevention (Ready to Add)

### Current Vulnerability:
No rate limiting (password guessing possible)

### How to Add:
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 5,                        // Max 5 attempts
  skipSuccessfulRequests: true   // Don't count successful logins
});

app.post('/api/auth/login', loginLimiter, ...);
```

**Result:** After 5 failed attempts in 15 minutes, cannot try again ✓

## 9. Dependency Security

### Check for Vulnerabilities:
```bash
# Built into npm
npm audit

# Detailed report
npm audit --detailed

# Fix automatically
npm audit fix
```

**Regular Maintenance:**
```bash
# Update packages monthly
npm update

# Check for outdated packages
npm outdated
```

## 10. Security Checklist

### Before Production Deployment:

- [ ] Change SESSION_SECRET to random string
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/TLS
- [ ] Set secure: true in cookie config
- [ ] Add rate limiting to login endpoint
- [ ] Implement email verification
- [ ] Add password reset with tokens
- [ ] Add backup codes for 2FA
- [ ] Enable HTTPS redirect
- [ ] Set up HSTS headers
- [ ] Configure CSP properly
- [ ] Run `npm audit`
- [ ] Move to PostgreSQL (or MySQL)
- [ ] Add logging and monitoring
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Test with OWASP ZAP
- [ ] Have security.txt file
- [ ] Setup uptime monitoring

## 11. Manual Security Audit

### Test Cases to Run:

1. **Registration Validation**
   ```
   ✓ Username too short (< 3 chars)
   ✓ Username with special chars
   ✓ Invalid email format
   ✓ Weak password
   ✓ Duplicate username
   ✓ Duplicate email
   ```

2. **Login Security**
   ```
   ✓ Wrong password
   ✓ Nonexistent user
   ✓ SQL injection attempt
   ✓ XSS attempt
   ✓ Session fixation attempt
   ```

3. **2FA Security**
   ```
   ✓ Invalid token (not 6 digits)
   ✓ Expired token
   ✓ Replay token
   ✓ Enable/disable 2FA multiple times
   ```

4. **Session Security**
   ```
   ✓ Cookie httpOnly flag present
   ✓ Cookie sameSite flag present
   ✓ Session destroyed on logout
   ✓ Cannot access after expiration
   ```

## Tools for Testing

### Browser DevTools
```
F12 → Application → Cookies → Inspect security flags
```

### OWASP ZAP (Free Security Scanner)
```bash
# Download: https://www.zaproxy.org/
# Scan: http://localhost:3000
# Reports vulnerabilities
```

### SQLMap (SQL Injection Testing)
```bash
# Test if vulnerable (it's not, but good practice)
sqlmap -u "http://localhost:3000/api/auth/login" \
  -d "username=test&password=test" \
  --batch
```

## Vulnerability Reporting

If you find a security issue:
1. Do NOT post publicly
2. Email security details
3. Include proof-of-concept
4. Allow 90 days for fix
5. Responsible disclosure ✓

---

**Remember: Security is a process, not a destination.**

Regular testing, updates, and vigilance keep systems safe! 🔒
