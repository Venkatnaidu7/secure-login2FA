# 🚀 Quick Start Guide

Get the Secure Login System running in 5 minutes!

## 1️⃣ Install Dependencies (1 minute)

```bash
npm install
```

This installs all required packages:
- express (web framework)
- bcryptjs (password hashing)
- express-session (session management)
- speakeasy (2FA/TOTP)
- qrcode (QR code generation)
- express-validator (input validation)
- helmet (security headers)
- sqlite3 (database)

## 2️⃣ Configure Environment (30 seconds)

```bash
cp .env.example .env
```

The default `.env` is good for development. For production, update:
```env
SESSION_SECRET=your-very-secret-key-here
NODE_ENV=production
ALLOWED_ORIGIN=https://yourdomain.com
```

## 3️⃣ Start the Server (1 minute)

```bash
npm start
```

You should see:
```
🔒 Secure Login System running on http://localhost:3000
Environment: development
✓ Users table initialized
✓ Database indexes created
```

## 4️⃣ Open in Browser

Visit: **http://localhost:3000**

You should see the login page! 🎉

## 5️⃣ Test It Out

### Create Account
1. Click **Register**
2. Enter details:
   - Username: `demouser`
   - Email: `demo@example.com`
   - Password: `Demo@Pass123`
3. Click **Create Account**

### Login
1. Click **Login**
2. Enter:
   - Username: `demouser`
   - Password: `Demo@Pass123`
3. Click **Login**

### Enable 2FA (Optional)
1. Click **Enable 2FA**
2. Scan QR code with authenticator app:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
   - Any TOTP app
3. Enter the 6-digit code from your app
4. Click **Confirm & Enable 2FA**
5. Next login will require 2FA ✓

## 🧪 Test Different Scenarios

### Test Weak Password
**Register tab →** Password: `weak`
```
❌ Shows requirements:
   ✗ At least 8 characters
   ✗ Uppercase letter
   ✗ Number
   ✗ Special character
```

### Test SQL Injection
**Login tab →** Username: `' OR '1'='1`
```
❌ Returns "Invalid credentials"
```
✓ SQL injection prevented!

### Test Duplicate Account
**Register tab →** Use same username as before
```
❌ Returns "Username already exists"
```

### Test 2FA
**After enabling 2FA:**
1. Logout
2. Login with username/password
3. Prompted for 2FA code
4. Enter code from authenticator app
5. Logged in ✓

## 📁 Project Structure

```
secure-login/
├── server.js              # Express server with API routes
├── database.js            # SQLite database with parameterized queries
├── public/
│   └── index.html        # Frontend UI (HTML/CSS/JavaScript)
├── secure_login.db       # SQLite database (created on first run)
├── package.json          # Node.js dependencies
├── .env                  # Environment configuration (create from .env.example)
├── .env.example          # Environment template
├── README.md             # Full documentation
├── SECURITY_TESTING.md   # Security test cases
└── QUICKSTART.md         # This file
```

## 🔧 Development Mode

For automatic restart on code changes:

```bash
npm run dev
```

Requires `nodemon` (already installed).

## 📝 API Endpoints

All endpoints return JSON and include CORS headers.

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Check if logged in

### 2FA
- `POST /api/2fa/setup` - Generate QR code
- `POST /api/2fa/verify` - Enable 2FA
- `POST /api/2fa/verify-login` - Verify during login
- `POST /api/2fa/disable` - Disable 2FA
- `GET /api/2fa/status` - Check if 2FA enabled

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Use different port
PORT=3001 npm start
```

### "Module not found" error
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Database errors
```bash
# Delete database and restart (loses all data)
rm secure_login.db
npm start
```

### 2FA QR code not showing
- Refresh page
- Check browser console (F12) for errors
- Ensure `qrcode` package installed: `npm list qrcode`

### Authenticator app not working
1. Check phone time is correct (TOTP is time-based)
2. Try different app (Google Authenticator, Microsoft Authenticator, Authy)
3. Disable 2FA and re-enable to get new secret

## 🔐 Security Features Used

✅ **Bcrypt Password Hashing** - 10 rounds, unique salts
✅ **SQL Injection Prevention** - Parameterized queries
✅ **XSS Protection** - Input validation & sanitization
✅ **CSRF Protection** - SameSite cookies
✅ **Session Security** - HttpOnly, Secure flags
✅ **2FA Authentication** - TOTP with QR codes
✅ **Security Headers** - Helmet.js integration

## 📚 Learn More

- **Full Documentation**: Read `README.md`
- **Security Details**: Read `SECURITY_TESTING.md`
- **API Reference**: See `server.js` comments
- **Database Schema**: See `database.js` comments

## 🎓 What You're Learning

This project demonstrates:

1. **Backend Security**
   - Password hashing algorithms
   - Input validation & parameterized queries
   - Session management
   - API security

2. **Frontend Security**
   - Client-side validation
   - Password strength indicators
   - Secure form handling

3. **Authentication Patterns**
   - Registration flow
   - Login flow
   - 2FA flow
   - Logout & session destruction

4. **Best Practices**
   - Environment configuration
   - Error handling
   - Code organization
   - Security headers

## 💡 Next Steps

### To Learn More:
1. Read `README.md` for comprehensive documentation
2. Check `SECURITY_TESTING.md` to test security features
3. Review `server.js` to understand the API
4. Review `database.js` to understand database security

### To Extend the System:
1. Add password reset with email
2. Add email verification
3. Add rate limiting to prevent brute force
4. Add backup codes for 2FA
5. Add user profile management
6. Add login history
7. Add activity logging
8. Add admin panel

### To Deploy:
1. Change all secrets in `.env`
2. Set `NODE_ENV=production`
3. Enable HTTPS
4. Use PostgreSQL instead of SQLite
5. Add rate limiting
6. Setup database backups
7. Configure domain
8. Deploy to Heroku, AWS, DigitalOcean, etc.

## ✨ You're All Set!

Your secure login system is running! 🔒

Try it out, test the security features, and explore the code.

Happy learning! 🚀

---

**Need Help?**
1. Check the error message in terminal
2. Read the relevant section in `README.md`
3. Review `SECURITY_TESTING.md` for common issues
4. Check browser console (F12) for frontend errors
