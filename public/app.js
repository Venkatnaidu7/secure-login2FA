/* =========================================================
   app.js  –  All event listeners wired via addEventListener
   No inline handlers, no eval, CSP-safe
   ========================================================= */

const API = '/api';

// ─── DOM refs ──────────────────────────────────────────────
const $ = id => document.getElementById(id);

// sections
const authSection = $('auth-section');
const tfaSection  = $('tfa-section');
const dashSection = $('dash-section');

// messages
const authError   = $('auth-error');
const authSuccess = $('auth-success');
const tfaError    = $('tfa-error');
const dashSuccess = $('dash-success');
const dashError   = $('dash-error');

// ─── Helpers ───────────────────────────────────────────────
function showOnly(section) {
  [authSection, tfaSection, dashSection].forEach(s => s.classList.add('hidden'));
  section.classList.remove('hidden');
}

function flash(el, msg, ms = 5000) {
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), ms);
}

function clearFlash(...els) {
  els.forEach(el => el.classList.add('hidden'));
}

// ─── Tab switching ─────────────────────────────────────────
$('tab-login-btn').addEventListener('click', () => {
  $('login-tab').classList.remove('hidden');
  $('register-tab').classList.add('hidden');
  $('tab-login-btn').classList.add('active');
  $('tab-register-btn').classList.remove('active');
  clearFlash(authError, authSuccess);
});

$('tab-register-btn').addEventListener('click', () => {
  $('register-tab').classList.remove('hidden');
  $('login-tab').classList.add('hidden');
  $('tab-register-btn').classList.add('active');
  $('tab-login-btn').classList.remove('active');
  clearFlash(authError, authSuccess);
});

// ─── Password strength ─────────────────────────────────────
$('reg-password').addEventListener('input', () => {
  const p = $('reg-password').value;
  const checks = {
    'r-len': p.length >= 8,
    'r-up':  /[A-Z]/.test(p),
    'r-low': /[a-z]/.test(p),
    'r-num': /\d/.test(p),
    'r-sp':  /[@$!%*?&]/.test(p)
  };
  for (const [id, met] of Object.entries(checks)) {
    $(id).classList.toggle('met', met);
  }
});

// ─── API call wrapper ──────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(API + path, opts);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ─── Auth status on load ───────────────────────────────────
async function checkStatus() {
  try {
    const { data } = await api('GET', '/auth/status');
    if (data.authenticated) {
      if (data.requires2fa) {
        showOnly(tfaSection);
      } else {
        showOnly(dashSection);
        await loadDashboard(data.username);
      }
    } else {
      showOnly(authSection);
    }
  } catch {
    showOnly(authSection);
  }
}

// ─── Register ──────────────────────────────────────────────
$('register-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('register-btn');
  btn.disabled = true;
  clearFlash(authError, authSuccess);

  const username = $('reg-username').value.trim();
  const email    = $('reg-email').value.trim();
  const password = $('reg-password').value;

  try {
    const { ok, data } = await api('POST', '/auth/register', { username, email, password });
    if (ok && data.success) {
      flash(authSuccess, '✓ Registration successful! Please log in.');
      $('register-form').reset();
      // switch to login tab
      $('tab-login-btn').click();
    } else {
      const msg = data.errors
        ? data.errors.map(e => e.message).join(', ')
        : (data.message || 'Registration failed');
      flash(authError, msg);
    }
  } catch {
    flash(authError, 'Network error. Is the server running?');
  } finally {
    btn.disabled = false;
  }
});

// ─── Login ─────────────────────────────────────────────────
$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('login-btn');
  btn.disabled = true;
  clearFlash(authError, authSuccess);

  const username = $('login-username').value.trim();
  const password = $('login-password').value;

  try {
    const { ok, data } = await api('POST', '/auth/login', { username, password });
    if (ok && data.success) {
      $('login-form').reset();
      if (data.requires2fa) {
        flash(authSuccess, 'Credentials verified – enter your 2FA code.');
        setTimeout(() => showOnly(tfaSection), 800);
      } else {
        flash(authSuccess, '✓ Login successful!');
        setTimeout(async () => {
          showOnly(dashSection);
          await loadDashboard(data.username);
        }, 500);
      }
    } else {
      flash(authError, data.message || 'Invalid credentials');
    }
  } catch {
    flash(authError, 'Network error. Is the server running?');
  } finally {
    btn.disabled = false;
  }
});

// ─── 2FA verify (login) ────────────────────────────────────
$('tfa-form').addEventListener('submit', async e => {
  e.preventDefault();
  clearFlash(tfaError);
  const token = $('tfa-token').value.trim();

  const { ok, data } = await api('POST', '/2fa/verify-login', { token });
  if (ok && data.success) {
    $('tfa-token').value = '';
    showOnly(dashSection);
    // fetch username from status
    const s = await api('GET', '/auth/status');
    await loadDashboard(s.data.username);
  } else {
    flash(tfaError, data.message || 'Invalid code');
  }
});

// ─── Logout ────────────────────────────────────────────────
async function doLogout() {
  await api('POST', '/auth/logout');
  showOnly(authSection);
  $('tab-login-btn').click();
}
$('logout-btn').addEventListener('click', doLogout);
$('back-to-login-btn').addEventListener('click', doLogout);

// ─── Dashboard ─────────────────────────────────────────────
async function loadDashboard(username) {
  $('welcome-user').textContent = 'Welcome, ' + (username || '') + '!';
  clearFlash(dashSuccess, dashError);
  await refresh2FAStatus();
}

async function refresh2FAStatus() {
  const { ok, data } = await api('GET', '/2fa/status');
  if (!ok) return;

  const badge = $('tfa-badge');
  const area  = $('tfa-action-area');

  // clear old buttons safely
  while (area.firstChild) area.removeChild(area.firstChild);

  if (data.enabled) {
    badge.textContent = 'Enabled ✓';
    badge.className   = 'badge on';
    const btn = document.createElement('button');
    btn.className   = 'secondary-btn';
    btn.textContent = 'Disable 2FA';
    btn.addEventListener('click', disable2FA);
    area.appendChild(btn);
  } else {
    badge.textContent = 'Disabled';
    badge.className   = 'badge off';
    const btn = document.createElement('button');
    btn.className   = 'secondary-btn';
    btn.textContent = 'Enable 2FA';
    btn.addEventListener('click', startSetup2FA);
    area.appendChild(btn);
  }
}

// ─── 2FA Setup ─────────────────────────────────────────────
async function startSetup2FA() {
  clearFlash(dashSuccess, dashError);
  const { ok, data } = await api('POST', '/2fa/setup');
  if (!ok || !data.success) {
    flash(dashError, 'Could not start 2FA setup');
    return;
  }

  // Show QR code using the data URL returned from server
  const qr = $('qr-container');
  while (qr.firstChild) qr.removeChild(qr.firstChild);
  const img = document.createElement('img');
  img.src = data.qrCode;
  img.alt = '2FA QR Code';
  img.width = 180;
  qr.appendChild(img);

  $('tfa-setup-box').classList.remove('hidden');
}

$('confirm-2fa-btn').addEventListener('click', async () => {
  const token = $('tfa-setup-token').value.trim();
  clearFlash(dashSuccess, dashError);

  const { ok, data } = await api('POST', '/2fa/verify', { token });
  if (ok && data.success) {
    $('tfa-setup-box').classList.add('hidden');
    $('tfa-setup-token').value = '';
    flash(dashSuccess, '✓ 2FA enabled successfully!');
    await refresh2FAStatus();
  } else {
    flash(dashError, data.message || '2FA verification failed');
  }
});

$('cancel-2fa-btn').addEventListener('click', () => {
  $('tfa-setup-box').classList.add('hidden');
  $('tfa-setup-token').value = '';
});

async function disable2FA() {
  if (!confirm('Disable 2FA? This reduces your account security.')) return;
  const { ok, data } = await api('POST', '/2fa/disable');
  if (ok && data.success) {
    flash(dashSuccess, '2FA disabled.');
    await refresh2FAStatus();
  } else {
    flash(dashError, 'Failed to disable 2FA');
  }
}

// ─── Boot ──────────────────────────────────────────────────
checkStatus();
