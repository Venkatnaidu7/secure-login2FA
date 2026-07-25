# 🏗️ System Architecture & Data Flows

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Frontend (index.html)                       │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ UI Components:                                      │ │   │
│  │  │ • Login Form                                        │ │   │
│  │  │ • Registration Form                                 │ │   │
│  │  │ • 2FA QR Code Scanner                               │ │   │
│  │  │ • Dashboard                                         │ │   │
│  │  │ • Security Settings                                 │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Features:                                           │ │   │
│  │  │ • Real-time password strength indicator             │ │   │
│  │  │ • Client-side validation                            │ │   │
│  │  │ • Responsive design                                 │ │   │
│  │  │ • Error/Success messages                            │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↕ HTTP(S)                               │
│                    JSON Request/Response                         │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Middleware Stack                           │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Security Middleware:                                │ │   │
│  │  │ • Helmet.js (Security Headers)                      │ │   │
│  │  │ • CORS (Cross-Origin Protection)                    │ │   │
│  │  │ • express-session (Session Management)              │ │   │
│  │  │ • express-validator (Input Validation)              │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              API Routes                                  │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Authentication:                                     │ │   │
│  │  │ • POST /api/auth/register                           │ │   │
│  │  │ • POST /api/auth/login                              │ │   │
│  │  │ • POST /api/auth/logout                             │ │   │
│  │  │ • GET /api/auth/status                              │ │   │
│  │  │                                                     │ │   │
│  │  │ 2FA:                                                │ │   │
│  │  │ • POST /api/2fa/setup                               │ │   │
│  │  │ • POST /api/2fa/verify                              │ │   │
│  │  │ • POST /api/2fa/verify-login                        │ │   │
│  │  │ • POST /api/2fa/disable                             │ │   │
│  │  │ • GET /api/2fa/status                               │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Utilities                                   │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ • bcryptjs (Password Hashing)                       │ │   │
│  │  │ • speakeasy (TOTP/2FA)                              │ │   │
│  │  │ • qrcode (QR Code Generation)                       │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↕ Parameterized Queries                │
│                      (SQL Injection Safe)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SQLite3 Database (secure_login.db)                     │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Users Table:                                        │ │   │
│  │  │ ┌─────────────────────────────────────────────────┐ │ │   │
│  │  │ │ id (INTEGER PRIMARY KEY)                        │ │ │   │
│  │  │ │ username (TEXT UNIQUE)                          │ │ │   │
│  │  │ │ email (TEXT UNIQUE)                             │ │ │   │
│  │  │ │ password_hash (TEXT - Bcrypt, never plaintext)  │ │ │   │
│  │  │ │ created_at (DATETIME)                           │ │ │   │
│  │  │ │ two_fa_enabled (BOOLEAN)                        │ │ │   │
│  │  │ │ two_fa_secret (TEXT - Base32 encoded TOTP)      │ │ │   │
│  │  │ │ last_login (DATETIME)                           │ │ │   │
│  │  │ └─────────────────────────────────────────────────┘ │ │   │
│  │  │                                                     │ │   │
│  │  │ Indexes for Fast Lookup:                           │ │   │
│  │  │ • idx_username (ON username)                       │ │   │
│  │  │ • idx_email (ON email)                             │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Registration Flow

```
User Form Input
     ↓
┌────────────────────────────────┐
│  Client-side Validation        │
│ • Check password strength      │
│ • Basic format validation      │
└────────────────────────────────┘
     ↓
POST /api/auth/register
     ↓
┌────────────────────────────────┐
│  Server-side Validation        │
│ • Trim & escape input          │
│ • Validate username format     │
│ • Validate email format        │
│ • Validate password strength   │
└────────────────────────────────┘
     ↓
     ├─── Invalid? ──→ Return 400 Bad Request ──→ Show error to user
     │
     └─── Valid? ──→ Check Database
                      ↓
                   ┌─────────────────────────────┐
                   │ Username or Email Exists?   │
                   └─────────────────────────────┘
                      ↓              ↓
                    YES             NO
                     ↓               ↓
              Return 409         Continue
              Conflict           ↓
                 ↓          ┌──────────────────────┐
              Show          │ Hash Password        │
              error     ┌──→│ bcrypt (10 rounds)   │
              to user   │   └──────────────────────┘
                        │        ↓
                        │   ┌──────────────────────┐
                        │   │ Insert User Record   │
                        └──→│ • Save username      │
                            │ • Save email         │
                            │ • Save password hash │
                            │ • Set created_at     │
                            │ • Set 2FA disabled   │
                            └──────────────────────┘
                                  ↓
                         ┌─────────────────────┐
                         │ Return Success      │
                         │ HTTP 201 Created    │
                         └─────────────────────┘
                                  ↓
                         Show "Registration Successful"
                         Prompt to login
```

## Login Flow

```
User Form Input (username + password)
     ↓
POST /api/auth/login
     ↓
┌────────────────────────────────┐
│  Input Validation              │
│ • Trim username                │
│ • Escape special characters    │
│ • Validate not empty           │
└────────────────────────────────┘
     ↓
     ├─── Invalid? ──→ Return 400 ──→ Show error
     │
     └─── Valid? ──→ Database Query (Parameterized)
                      ↓
                   ┌──────────────────────────┐
                   │ SELECT * FROM users      │
                   │ WHERE username = ?       │
                   │ [username_parameter]     │
                   │                          │
                   │ (Parameter binding       │
                   │  prevents SQL injection) │
                   └──────────────────────────┘
                      ↓
          ┌──────────────────────────┐
          │ User Found in Database?  │
          └──────────────────────────┘
             ↓              ↓
            NO              YES
             ↓               ↓
        Return 401      ┌──────────────────────┐
        Unauthorized    │ Compare Passwords    │
             ↓          │                      │
        Show error  ┌──→│ bcrypt.compare(      │
                    │   │   user_input,       │
                    │   │   stored_hash       │
                    │   │ )                    │
                    │   └──────────────────────┘
                    │          ↓
                    │   ┌──────────────────────┐
                    │   │ Match?               │
                    │   └──────────────────────┘
                    │      ↓         ↓
                    │     YES        NO
                    │      ↓          ↓
                    │      │      Return 401
                    │      │      Unauthorized
                    │      │          ↓
                    └──────→      Show error
                             ↓
                        ┌────────────────────────┐
                        │ Check 2FA Status       │
                        │                        │
                        │ user.two_fa_enabled?   │
                        └────────────────────────┘
                             ↓            ↓
                           FALSE          TRUE
                             ↓             ↓
                        Set Session  ┌──────────────┐
                        req.userId   │ Set Temp     │
                        req.username │ Session      │
                        return user  │ req.userId   │
                        data         │ requires2fa  │
                             ↓       │ = true       │
                        HTTP 200     └──────────────┘
                        Login                 ↓
                        Success       Return JSON
                                    {"requires2fa": true}
                             ↓
                        Redirect to 2FA form
```

## 2FA Setup Flow

```
User Clicks "Enable 2FA"
     ↓
GET /api/2fa/setup
     ↓
┌─────────────────────────────┐
│ Generate TOTP Secret        │
│                             │
│ Using speakeasy:            │
│ • Create random base32      │
│ • Create otpauth_url        │
│ • Include user info         │
└─────────────────────────────┘
     ↓
┌─────────────────────────────┐
│ Generate QR Code            │
│                             │
│ Using qrcode library:       │
│ • Encode otpauth_url        │
│ • Generate data URL image   │
└─────────────────────────────┘
     ↓
┌─────────────────────────────┐
│ Store in Session            │
│ req.session.tempSecret      │
│ (Temporary, not in DB yet)  │
└─────────────────────────────┘
     ↓
Return JSON with QR code image
     ↓
Display to User
User scans with Authenticator App
     ↓
┌─────────────────────────────┐
│ User Enters 6-digit Code    │
│ From Authenticator App      │
└─────────────────────────────┘
     ↓
POST /api/2fa/verify {token: "123456"}
     ↓
┌─────────────────────────────┐
│ Verify TOTP Token           │
│                             │
│ Using speakeasy:            │
│ • Get secret from session   │
│ • Get current time          │
│ • Verify code matches       │
│ • Allow 30-sec window       │
└─────────────────────────────┘
     ↓
     ├─── Invalid? ──→ Return 401 ──→ Show error
     │
     └─── Valid? ──→ ┌────────────────────┐
                     │ Save to Database    │
                     │                     │
                     │ UPDATE users SET    │
                     │ two_fa_enabled=1,   │
                     │ two_fa_secret=?     │
                     │ WHERE id=?          │
                     │                     │
                     │ (Parameterized)     │
                     └────────────────────┘
                             ↓
                     ┌────────────────────┐
                     │ Clear Temp Secret  │
                     │ from Session       │
                     └────────────────────┘
                             ↓
                     Return HTTP 200
                     "2FA enabled successfully"
                             ↓
                     Show success message
                     2FA now active!
```

## Login with 2FA Flow

```
User Login (username + password)
     ↓
[Standard Login Flow - see above]
     ↓
2FA Enabled → Return {"requires2fa": true}
     ↓
┌─────────────────────────────┐
│ Display 2FA Token Entry     │
│ "Enter 6-digit code"        │
└─────────────────────────────┘
     ↓
POST /api/2fa/verify-login {token: "123456"}
     ↓
┌──────────────────────────────┐
│ Check Session State          │
│ • User ID exists?            │
│ • requires2fa flag set?      │
└──────────────────────────────┘
     ↓
     ├─── Invalid? ──→ Return 401 ──→ Show error
     │
     └─── Valid? ──→ Get User from DB
                      ↓
                   ┌──────────────────────┐
                   │ Get 2FA Secret       │
                   │ FROM user record     │
                   └──────────────────────┘
                      ↓
                   ┌──────────────────────┐
                   │ Verify TOTP Token    │
                   │                      │
                   │ speakeasy.totp.verify│
                   │ (secret, token)      │
                   └──────────────────────┘
                      ↓
                   ┌──────────────────────┐
                   │ Match?               │
                   └──────────────────────┘
                      ↓             ↓
                     YES            NO
                      ↓              ↓
                ┌──────────    Return 401
                │             Unauthorized
                │                  ↓
                │            Show error
                │            "Invalid code"
                ↓
           ┌──────────────────┐
           │ Clear 2FA Flag   │
           │ requires2fa=false│
           └──────────────────┘
                ↓
           ┌──────────────────┐
           │ Return 200       │
           │ "Login Successful"│
           └──────────────────┘
                ↓
           ┌──────────────────┐
           │ Redirect to      │
           │ Dashboard        │
           │ (Fully Logged In)│
           └──────────────────┘
```

## Security Layers Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: BROWSER                              │
│ • HTTPS enforcement                                              │
│ • XSS Content-Security-Policy                                   │
│ • CORS headers                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 LAYER 2: NETWORK & TRANSPORT                     │
│ • HTTPS/TLS encryption                                           │
│ • Certificate validation                                         │
│ • HSTS headers                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 3: API & SESSION SECURITY                     │
│ • CORS validation                                                │
│ • SameSite=Strict cookies                                        │
│ • HttpOnly flag on cookies                                       │
│ • Secure flag on cookies (production)                            │
│ • Session timeout                                                │
│ • Input validation & sanitization                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           LAYER 4: DATA & AUTHENTICATION SECURITY                │
│ • Parameterized SQL queries (SQL injection prevention)           │
│ • Bcrypt password hashing (10 rounds)                            │
│ • Unique salts per password                                      │
│ • TOTP for 2FA (RFC 6238)                                        │
│ • 30-second verification window                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           LAYER 5: DATABASE & DATA PROTECTION                    │
│ • Encrypted password hashes                                      │
│ • Base32-encoded 2FA secrets                                     │
│ • Database indexes for quick lookup                              │
│ • Foreign key constraints (when extended)                        │
└─────────────────────────────────────────────────────────────────┘
```

## Security Features Breakdown

```
INPUT SECURITY
├── Username
│   ├── Length: 3-30 characters
│   ├── Pattern: [a-zA-Z0-9_-] only
│   └── Validation: express-validator
├── Email
│   ├── Format: RFC 5322 compliant
│   ├── Normalization: toLowerCase()
│   └── Validation: Built-in validator
└── Password
    ├── Length: 8+ characters
    ├── Complexity: Upper + Lower + Digit + Special
    ├── Strength indicator: Real-time feedback
    └── Validation: Regex + express-validator

DATABASE SECURITY
├── SQL Queries
│   ├── Method: Parameterized statements
│   ├── Binding: ? placeholders
│   ├── Example: "SELECT * FROM users WHERE username = ?"
│   └── Protection: Automatic escaping
├── Stored Data
│   ├── Passwords: Bcrypt (never plaintext)
│   ├── 2FA Secrets: Base32 encoded
│   ├── Sensitive Fields: Never logged
│   └── PII: Minimal storage
└── Schema
    ├── Indexes: username, email for speed
    ├── Constraints: UNIQUE on username, email
    ├── Data Types: Appropriate sizes
    └── Timestamps: Audit trail

PASSWORD HASHING
├── Algorithm: Bcrypt
├── Rounds: 10 (adaptive cost)
├── Salt: Unique per password
├── Hash Length: Always 60 characters
├── Comparison: Time-constant comparison
├── Speed: Intentionally slow (prevents brute force)
└── Verification: bcryptjs.compare()

SESSION MANAGEMENT
├── Storage: express-session (server-side)
├── Cookie Settings
│   ├── httpOnly: true (XSS protection)
│   ├── secure: true in production (HTTPS only)
│   ├── sameSite: strict (CSRF protection)
│   ├── path: / (site-wide)
│   ├── maxAge: 86400000 ms (24 hours)
│   └── name: connect.sid
├── Data Stored
│   ├── userId: User ID in database
│   ├── username: Display name
│   ├── requires2fa: 2FA verification flag
│   └── tempSecret: Temporary 2FA secret (setup only)
└── Invalidation: destroy() on logout

2FA IMPLEMENTATION
├── Algorithm: TOTP (RFC 6238)
├── Hash: HMAC-SHA1
├── Time Window: 30 seconds
├── Verification Window: ±30 seconds (clock skew)
├── Code Length: 6 digits
├── QR Code: otpauth:// URL format
├── Compatible With
│   ├── Google Authenticator
│   ├── Microsoft Authenticator
│   ├── Authy
│   ├── FreeOTP
│   └── Any RFC 6238 app
└── Secret Storage: Base32 encoded in DB

SECURITY HEADERS (Helmet.js)
├── Content-Security-Policy
│   ├── Prevents inline scripts
│   ├── Restricts resource sources
│   └── Blocks unsafe-eval
├── X-Frame-Options: DENY
│   └── Prevents clickjacking
├── X-Content-Type-Options: nosniff
│   └── Prevents MIME sniffing
├── Strict-Transport-Security
│   └── Forces HTTPS for 1 year
├── X-XSS-Protection
│   └── Browser-level XSS filter
└── Referrer-Policy
    └── Controls referrer information
```

## Data Flow for Critical Operations

```
PASSWORD HASHING FLOW:
┌────────────────────┐
│ User: "Test@123"   │
└────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ bcrypt.hash(password, 10)          │
│ Bcrypt Algorithm:                   │
│ 1. Generate random salt (16 bytes)  │
│ 2. Apply key expansion (10 rounds)  │
│ 3. Hash with Blowfish cipher        │
│ 4. Combine salt + hash              │
│ 5. Encode as modular crypt format   │
└─────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ $2b$10$SaltValueHashValueMoreHashValue    │
│                                           │
│ $2b      = Bcrypt version                │
│ $10      = Cost (10 rounds)              │
│ $Salt    = Random salt (22 chars)        │
│ HashPart = Password hash (31 chars)      │
│           Total: 60 characters           │
└──────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Store in Database                   │
│ (Never store plaintext password!)   │
└─────────────────────────────────────┘

LOGIN VERIFICATION:
┌────────────────────┐
│ User: "Test@123"   │  (What user typed)
└────────────────────┘
         ↓
┌──────────────────────────┐
│ Retrieve from Database:  │
│ $2b$10$SaltHash...       │
│    (Original hash)       │
└──────────────────────────┘
         ↓
┌──────────────────────────────────┐
│ bcrypt.compare(input, stored)   │
│ Time-constant comparison:        │
│ • Hashes input with stored salt  │
│ • Compares byte-by-byte         │
│ • Always takes same time         │
│ • Prevents timing attacks       │
└──────────────────────────────────┘
         ↓
┌──────────────────────┐
│ Match = Grant Access │
│ NoMatch = Deny       │
└──────────────────────┘
```

---

This architecture provides defense-in-depth security with multiple layers protecting against various attack vectors. 🔒
