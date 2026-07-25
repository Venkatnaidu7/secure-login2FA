# 🛠️ Detailed Setup & Troubleshooting Guide

Complete step-by-step setup with troubleshooting for every possible issue.

## ✅ Pre-Installation Checklist

Before you begin, verify you have:

- [ ] **Node.js 14+** installed
  ```bash
  node --version
  # Should show v14.0.0 or higher
  ```

- [ ] **npm** installed
  ```bash
  npm --version
  # Should show 6.0.0 or higher
  ```

- [ ] **Terminal/Command line** access
  - Windows: Command Prompt, PowerShell, or Git Bash
  - Mac: Terminal
  - Linux: Any terminal

- [ ] **Text editor** for editing files
  - VS Code (recommended)
  - Sublime Text
  - Any text editor

## 📦 Installation Steps

### Step 1: Navigate to Project Directory

```bash
cd /path/to/secure-login
```

### Step 2: Install Dependencies

```bash
npm install
```

**Expected Output:**
```
added XXX packages in Xs
```

**If you see errors:**

**Error: "npm command not found"**
```bash
# Install Node.js from https://nodejs.org/
# Then try again
npm --version
```

**Error: "permission denied"**
```bash
# Try with sudo (may require password)
sudo npm install

# Or fix npm permissions
npm config set prefix /usr/local/
```

**Error: "gyp ERR!" or "node-gyp"**
```bash
# Install build tools
# Windows: npm install --global windows-build-tools
# Mac: xcode-select --install
# Linux: sudo apt-get install python3 make g++

npm install
```

### Step 3: Create Environment File

```bash
cp .env.example .env
```

**Verify the file was created:**
```bash
cat .env  # macOS/Linux
type .env  # Windows
```

### Step 4: (Optional) Update Environment Variables

Edit `.env` for custom settings:

```bash
nano .env     # macOS/Linux
notepad .env  # Windows (or use VS Code)
```

Key variables to consider:
```env
PORT=3000              # Change if 3000 is in use
NODE_ENV=development   # Change to 'production' before deploying
SESSION_SECRET=change-me-in-production
```

### Step 5: Start the Server

```bash
npm start
```

**Expected Output:**
```
🔒 Secure Login System running on http://localhost:3000
Environment: development
✓ Users table initialized
✓ Database indexes created
```

### Step 6: Open in Browser

Visit: **http://localhost:3000**

You should see the login page with beautiful purple gradient design! 🎨

---

## 🐛 Troubleshooting Guide

### Issue: "Command not found: npm"

**Cause:** Node.js/npm not installed or not in PATH

**Solutions:**

1. **Check if Node.js is installed:**
   ```bash
   node --version
   npm --version
   ```

2. **If not installed:**
   - Download from https://nodejs.org/
   - Install the LTS version
   - Restart terminal/computer

3. **If installed but "not found":**
   - **Windows:** Restart Command Prompt or PowerShell
   - **Mac:** Restart Terminal
   - **Linux:** Run `source ~/.bashrc`

---

### Issue: "Port 3000 already in use"

**Cause:** Another process is using port 3000

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

1. **Use a different port:**
   ```bash
   PORT=3001 npm start
   # Visit http://localhost:3001
   ```

2. **Kill the process using port 3000:**
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

3. **Find what's using the port:**
   ```bash
   # macOS
   lsof -i :3000
   
   # Linux
   sudo lsof -i :3000
   
   # Windows
   netstat -ano | findstr :3000
   ```

---

### Issue: "Cannot find module 'express'"

**Cause:** Dependencies not installed or corrupted

**Error Message:**
```
Error: Cannot find module 'express'
at Function.Module._load
```

**Solutions:**

1. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json  # macOS/Linux
   rmdir /s node_modules & del package-lock.json  # Windows
   npm install
   ```

2. **Check if node_modules exists:**
   ```bash
   ls node_modules  # macOS/Linux
   dir node_modules  # Windows
   # Should see many folders
   ```

3. **Verify npm installation:**
   ```bash
   npm list | head -20
   ```

---

### Issue: "Error: ENOENT: no such file or directory, open 'secure_login.db'"

**Cause:** Database file not created (normal on first run, but something went wrong)

**Solution:**

```bash
# Delete and let app recreate it
rm secure_login.db  # macOS/Linux
del secure_login.db  # Windows

# Restart server
npm start
```

---

### Issue: "listen EACCES: permission denied"

**Cause:** Don't have permission to use port 3000

**Error Message:**
```
Error: listen EACCES: permission denied :::3000
```

**Solutions:**

1. **Use a port > 1024:**
   ```bash
   PORT=8080 npm start
   # Visit http://localhost:8080
   ```

2. **Run with sudo (not recommended):**
   ```bash
   sudo npm start
   ```

---

### Issue: "Registration not working"

**Symptoms:** Click register, nothing happens or page freezes

**Troubleshooting:**

1. **Check browser console for errors:**
   ```
   F12 → Console tab → See any red errors?
   ```

2. **Check server logs:**
   - Are there errors in terminal?
   - Look for "error" in red text

3. **Test with valid inputs:**
   - Username: `testuser123` (alphanumeric, 3+ chars)
   - Email: `test@example.com` (valid email)
   - Password: `TestPass123!` (8+ chars, upper, lower, digit, special)

4. **Check database:**
   ```bash
   sqlite3 secure_login.db
   SELECT * FROM users;
   .quit
   ```

---

### Issue: "2FA QR code not showing"

**Symptoms:** Enable 2FA button works but no QR code appears

**Troubleshooting:**

1. **Check browser console (F12):**
   - Any JavaScript errors?
   - Look for "qrcode" errors

2. **Verify qrcode package installed:**
   ```bash
   npm list qrcode
   # Should show version
   ```

3. **Check server logs:**
   - Any error messages?
   - Look for "2FA setup error"

4. **Refresh page:**
   ```
   Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   ```

5. **Try different authenticator app:**
   - Google Authenticator
   - Microsoft Authenticator
   - Authy

---

### Issue: "2FA not working after enable"

**Symptoms:** 2FA shows enabled but won't accept codes

**Troubleshooting:**

1. **Verify authenticator app time:**
   - Open Settings → Date & Time
   - Check that time is correct (TOTP is time-based)
   - If wrong, correct it

2. **Try different time window:**
   - TOTP is time-sensitive
   - Codes change every 30 seconds
   - Try code from different moment

3. **Check that 2FA was saved:**
   ```bash
   sqlite3 secure_login.db
   SELECT username, two_fa_enabled, two_fa_secret FROM users;
   .quit
   ```
   - Should see `two_fa_enabled = 1`
   - Should see `two_fa_secret` has value

4. **Disable and re-enable 2FA:**
   - Go to Dashboard → Security Settings
   - Click "Disable 2FA"
   - Click "Enable 2FA" again
   - Scan new QR code
   - Try codes again

---

### Issue: "Session not persisting / keeps logging out"

**Symptoms:** Login works but gets logged out immediately

**Troubleshooting:**

1. **Check browser cookies:**
   ```
   F12 → Application → Cookies → http://localhost:3000
   Should see "connect.sid" cookie
   ```

2. **Check .env SESSION_SECRET:**
   ```bash
   grep SESSION_SECRET .env
   # Should have a value (not empty)
   ```

3. **Check if cookies enabled:**
   - Browser → Settings → Privacy
   - Cookies should be enabled

4. **Clear browser data:**
   ```
   F12 → Application → Clear all
   Reload page
   Try login again
   ```

---

### Issue: "Database is locked"

**Symptoms:** Application freezes or gets "database is locked" error

**Cause:** Database file is being accessed by multiple processes

**Solutions:**

1. **Restart server:**
   ```bash
   # Ctrl+C to stop (or Cmd+C on Mac)
   npm start
   ```

2. **Close other database connections:**
   ```bash
   # If you have sqlite3 shell open
   .quit
   ```

3. **Delete and recreate database:**
   ```bash
   rm secure_login.db  # macOS/Linux
   del secure_login.db  # Windows
   npm start
   # Database recreated automatically
   ```

---

### Issue: "CORS error in browser console"

**Symptoms:** See error like "Access to XMLHttpRequest blocked by CORS"

**Cause:** Frontend and backend on different origins

**Solutions:**

1. **Update ALLOWED_ORIGIN in .env:**
   ```env
   ALLOWED_ORIGIN=http://localhost:3000
   ```

2. **Restart server:**
   ```bash
   npm start
   ```

3. **Check if server is running:**
   ```
   Visit http://localhost:3000
   Should see login page
   ```

---

## ✨ Post-Installation Testing

After successful installation, run these tests:

### Test 1: Registration
```
1. Click "Register"
2. Enter username: "demouser"
3. Enter email: "demo@example.com"
4. Enter password: "Demo@Pass123"
5. Click "Create Account"
Expected: Success message
```

### Test 2: Login
```
1. Click "Login"
2. Enter username: "demouser"
3. Enter password: "Demo@Pass123"
4. Click "Login"
Expected: See "Welcome, demouser!" dashboard
```

### Test 3: Logout
```
1. On dashboard, click "Logout"
Expected: Back at login page
```

### Test 4: Password Validation
```
1. Click "Register"
2. Enter password: "weak"
3. See red X marks next to unmet requirements
Expected: Cannot submit form without strong password
```

### Test 5: 2FA Setup
```
1. Login as demouser
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
4. Enter 6-digit code
5. Click "Confirm & Enable 2FA"
Expected: "2FA enabled successfully" message
```

### Test 6: Login with 2FA
```
1. Logout
2. Login with username/password
3. Prompted for 2FA code
4. Enter code from authenticator app
5. Click "Verify Code"
Expected: Logged in to dashboard
```

---

## 🚀 Development vs Production

### Development Setup (Current)

```env
NODE_ENV=development
PORT=3000
SESSION_SECRET=development-key-only
ALLOWED_ORIGIN=http://localhost:3000
```

**For Development:**
- No HTTPS required
- Cookies sent over HTTP (OK for localhost)
- Secret doesn't need to be random

### Production Setup

```bash
# Generate secure secrets
export SESSION_SECRET=$(openssl rand -hex 32)
export NODE_ENV=production
export ALLOWED_ORIGIN=https://yourdomain.com
export PORT=443
```

**For Production:**
- [ ] Use HTTPS/TLS certificate
- [ ] Set secure: true for cookies
- [ ] Generate random SESSION_SECRET
- [ ] Use PostgreSQL instead of SQLite
- [ ] Add rate limiting
- [ ] Enable HTTPS redirect
- [ ] Setup logging
- [ ] Configure domain/firewall
- [ ] Setup database backups

---

## 📚 Verification Commands

**Check Node.js:**
```bash
node --version
# Expected: v14.0.0 or higher
```

**Check npm:**
```bash
npm --version
# Expected: 6.0.0 or higher
```

**Check installed packages:**
```bash
npm list --depth=0
# Should show:
# express
# bcryptjs
# speakeasy
# qrcode
# etc.
```

**Check if port 3000 is available:**
```bash
# macOS/Linux
lsof -i :3000
# Empty output = port available

# Windows
netstat -ano | findstr :3000
# Empty output = port available
```

**Check server connectivity:**
```bash
curl http://localhost:3000
# Should return HTML of login page
```

**View database:**
```bash
sqlite3 secure_login.db
SELECT COUNT(*) as user_count FROM users;
.quit
```

---

## 🆘 Getting Help

**If stuck:**

1. **Check the README.md** for comprehensive docs
2. **Check SECURITY_TESTING.md** for security details
3. **Check QUICKSTART.md** for quick reference
4. **Review error messages carefully** - they usually tell you what's wrong
5. **Check browser console (F12)** for JavaScript errors
6. **Check terminal logs** for server errors
7. **Google the error message** - likely others had same issue

**Common Search Terms:**
- "npm ERR! Error: EACCES: permission denied"
- "Port 3000 already in use"
- "Cannot find module"
- "CORS error"

---

## ✅ Success Checklist

- [ ] Node.js and npm installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created
- [ ] Server starts without errors (`npm start`)
- [ ] Can access http://localhost:3000
- [ ] Can register a new account
- [ ] Can login with account
- [ ] Can logout successfully
- [ ] Can enable 2FA
- [ ] Can login with 2FA
- [ ] Database file exists (secure_login.db)

**If all checked: You're all set! 🎉**

---

**Next Steps:**
1. Read QUICKSTART.md for quick overview
2. Read README.md for full documentation
3. Explore the code in `server.js` and `database.js`
4. Try extending features (password reset, email verification, etc.)
5. Deploy to production when ready!

Happy coding! 🚀
