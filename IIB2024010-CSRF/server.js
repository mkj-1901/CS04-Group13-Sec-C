// ============================================================================
// CSRF DEMO – Victim Application (port 3000)
// University Cyber Security Assignment – LOCAL LAB USE ONLY
// ============================================================================
//
// Run modes:
//   VULNERABLE:  node server.js              (or npm start)
//   SECURE:      SECURE=true node server.js  (or npm run start:secure)
// ============================================================================

const express = require('express');
const session = require('express-session');
const crypto  = require('crypto');

const app  = express();
const PORT = 3000;

// Determine which mode we are running in.
const SECURE = process.env.SECURE === 'true';

// ---------------------------------------------------------------------------
// In-memory "database"
// ---------------------------------------------------------------------------
const users = {
  alice:    { password: 'alice123', balance: 1000, email: 'alice@example.com' },
  attacker: { password: 'evil123',  balance: 0,    email: 'attacker@evil.com' }
};

// Transaction log – array of { from, to, amount, timestamp }
let transactions = [];

// Helper: reset state for demo repeatability
function resetState() {
  users.alice.balance    = 1000;
  users.attacker.balance = 0;
  transactions           = [];
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Parse URL-encoded bodies (for POST /login and POST /transfer)
app.use(express.urlencoded({ extended: false }));

// Session configuration
// In VULNERABLE mode we intentionally omit sameSite so the browser defaults
// to 'Lax' (older browsers may treat it as 'None'), allowing cross-site
// cookie attachment on top-level navigations / img loads.
const sessionOptions = {
  secret: 'csrf-demo-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true
    // NOTE: sameSite is deliberately NOT set in vulnerable mode.
  }
};

if (SECURE) {
  // MITIGATION: defense-in-depth – strict SameSite cookie
  sessionOptions.cookie.sameSite = 'strict';
}

app.use(session(sessionOptions));

// Auth guard middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.username) return next();
  res.redirect('/login');
}

// ---------------------------------------------------------------------------
// Helpers – HTML templates
// ---------------------------------------------------------------------------

// Banner shown on every page indicating current mode
function modeBanner() {
  if (SECURE) {
    return `<div style="background:#16a34a;color:#fff;text-align:center;
            padding:10px;font-weight:bold;font-size:1.1rem;
            letter-spacing:1px;position:sticky;top:0;z-index:100;">
            🔒 MODE: SECURE</div>`;
  }
  return `<div style="background:#dc2626;color:#fff;text-align:center;
          padding:10px;font-weight:bold;font-size:1.1rem;
          letter-spacing:1px;position:sticky;top:0;z-index:100;">
          ⚠️ MODE: VULNERABLE</div>`;
}

function pageShell(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} – CSRF Demo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
           background: #f1f5f9; color: #1e293b; min-height: 100vh; }
    .container { max-width: 640px; margin: 40px auto; padding: 24px;
                 background: #fff; border-radius: 12px;
                 box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    h1, h2, h3 { margin-bottom: 16px; }
    label { display: block; margin-bottom: 4px; font-weight: 600; }
    input[type="text"], input[type="password"], input[type="number"] {
      width: 100%; padding: 8px 12px; margin-bottom: 12px;
      border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
    button, .btn { padding: 10px 20px; border: none; border-radius: 6px;
      font-size: 1rem; cursor: pointer; color: #fff;
      background: #2563eb; display: inline-block; text-decoration: none; }
    button:hover, .btn:hover { background: #1d4ed8; }
    .danger { background: #dc2626; }
    .danger:hover { background: #b91c1c; }
    .success { background: #16a34a; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; }
    .msg-ok  { background: #dcfce7; color: #166534; padding: 10px;
               border-radius: 6px; margin-bottom: 16px; }
    .msg-err { background: #fee2e2; color: #991b1b; padding: 10px;
               border-radius: 6px; margin-bottom: 16px; }
    a { color: #2563eb; }
    .nav { display: flex; gap: 16px; margin-bottom: 20px; }
  </style>
</head>
<body>
  ${modeBanner()}
  <div class="container">
    ${body}
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET / – redirect based on auth status
app.get('/', (req, res) => {
  res.redirect(req.session.username ? '/dashboard' : '/login');
});

// ---- Login ----------------------------------------------------------------

app.get('/login', (req, res) => {
  const msg = req.query.msg || '';
  res.send(pageShell('Login', `
    <h1>🔐 Login</h1>
    ${msg === 'invalid' ? '<div class="msg-err">Invalid credentials.</div>' : ''}
    ${msg === 'loggedout' ? '<div class="msg-ok">Logged out.</div>' : ''}
    <form method="POST" action="/login">
      <label for="username">Username</label>
      <input type="text" id="username" name="username" placeholder="alice" required>
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required>
      <button type="submit">Log In</button>
    </form>
    <p style="margin-top:16px;font-size:.9rem;color:#64748b;">
      Demo accounts: <strong>alice / alice123</strong> &nbsp;|&nbsp;
      <strong>attacker / evil123</strong>
    </p>
  `));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (user && user.password === password) {
    req.session.username = username;
    return res.redirect('/dashboard');
  }
  res.redirect('/login?msg=invalid');
});

// ---- Logout ---------------------------------------------------------------

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login?msg=loggedout'));
});

// ---- Dashboard ------------------------------------------------------------

app.get('/dashboard', requireAuth, (req, res) => {
  const username = req.session.username;
  const user     = users[username];

  // In SECURE mode, generate a CSRF token if one doesn't exist yet.
  let csrfField = '';
  if (SECURE) {
    // MITIGATION: synchronizer token – generate per session
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    csrfField = `<input type="hidden" name="_csrf" value="${req.session.csrfToken}">`;
  }

  // Build the transfer form – GET in vulnerable mode, POST in secure mode
  const formMethod = SECURE ? 'POST' : 'GET';

  // Recent transactions for this user
  const userTxns = transactions.filter(t => t.from === username || t.to === username);

  res.send(pageShell('Dashboard', `
    <div class="nav">
      <span>👤 <strong>${username}</strong></span>
      <span style="margin-left:auto;"><a href="/logout">Logout</a></span>
    </div>

    <h2>Account Overview</h2>
    <table>
      <tr><th>Email</th><td>${user.email}</td></tr>
      <tr><th>Balance</th><td>$${user.balance}</td></tr>
    </table>

    <hr style="margin:24px 0;">

    <h2>Transfer Funds</h2>
    <form method="${formMethod}" action="/transfer">
      ${csrfField}
      <label for="to">Recipient username</label>
      <input type="text" id="to" name="to" placeholder="e.g. attacker" required>
      <label for="amount">Amount ($)</label>
      <input type="number" id="amount" name="amount" min="1" required>
      <button type="submit">Send Money</button>
    </form>

    <hr style="margin:24px 0;">

    <h2>Recent Transactions</h2>
    ${userTxns.length === 0
      ? '<p style="color:#64748b;">No transactions yet.</p>'
      : `<table>
          <tr><th>From</th><th>To</th><th>Amount</th><th>Time</th></tr>
          ${userTxns.map(t => `
            <tr>
              <td>${t.from}</td>
              <td>${t.to}</td>
              <td>$${t.amount}</td>
              <td>${t.timestamp}</td>
            </tr>`).join('')}
         </table>`}

    <hr style="margin:24px 0;">
    <a href="/reset" class="btn danger" style="font-size:.85rem;">🔄 Reset Balances</a>
  `));
});

// ---- Transfer -------------------------------------------------------------

if (SECURE) {
  // MITIGATION: reject state-changing GET requests with 405
  app.get('/transfer', requireAuth, (req, res) => {
    console.log(`[BLOCKED] GET /transfer from ${req.session.username} – ` +
                `405 Method Not Allowed | ` +
                `Origin: ${req.headers.origin || '(none)'} | ` +
                `Referer: ${req.headers.referer || '(none)'}`);
    res.status(405).send(pageShell('Method Not Allowed', `
      <h1>405 – Method Not Allowed</h1>
      <p>State-changing operations via GET are disabled in secure mode.</p>
      <a href="/dashboard">← Back to Dashboard</a>
    `));
  });

  // MITIGATION: synchronizer token on POST /transfer
  app.post('/transfer', requireAuth, (req, res) => {
    const { to, amount, _csrf } = req.body;
    const from = req.session.username;

    // --- CSRF token validation ---
    const sessionToken = req.session.csrfToken || '';
    let tokenValid = false;

    if (_csrf && _csrf.length === sessionToken.length) {
      // Use timing-safe comparison to prevent timing side-channels
      tokenValid = crypto.timingSafeEqual(
        Buffer.from(_csrf, 'utf8'),
        Buffer.from(sessionToken, 'utf8')
      );
    }

    if (!tokenValid) {
      console.log(`[BLOCKED] POST /transfer from ${from} – ` +
                  `403 CSRF token invalid | ` +
                  `Origin: ${req.headers.origin || '(none)'} | ` +
                  `Referer: ${req.headers.referer || '(none)'}`);
      return res.status(403).send(pageShell('Forbidden', `
        <h1>403 – Forbidden</h1>
        <div class="msg-err">CSRF token missing or invalid – request blocked</div>
        <a href="/dashboard">← Back to Dashboard</a>
      `));
    }

    // Token is valid – proceed with transfer logic
    const result = executeTransfer(from, to, Number(amount));

    console.log(`[${result.ok ? 'SUCCESS' : 'FAILED'}] POST /transfer ` +
                `from=${from} to=${to} amount=${amount} | ` +
                `Origin: ${req.headers.origin || '(none)'} | ` +
                `Referer: ${req.headers.referer || '(none)'}`);

    res.redirect(`/dashboard`);
  });

} else {
  // VULNERABLE: state-changing GET, no proof of user intent.
  // Any cross-origin page can trigger this with an <img> tag or redirect
  // because the browser attaches session cookies automatically.
  app.get('/transfer', requireAuth, (req, res) => {
    const { to, amount } = req.query;
    const from = req.session.username;

    const result = executeTransfer(from, to, Number(amount));

    console.log(`[${result.ok ? 'SUCCESS' : 'FAILED'}] GET /transfer ` +
                `from=${from} to=${to} amount=${amount} | ` +
                `Origin: ${req.headers.origin || '(none)'} | ` +
                `Referer: ${req.headers.referer || '(none)'}`);

    // In a real attack the user never sees this page – the response goes
    // to a zero-pixel <img>.  For demo purposes we redirect back.
    res.redirect('/dashboard');
  });
}

// Shared transfer logic
function executeTransfer(from, to, amount) {
  if (!from || !to || !users[to]) {
    return { ok: false, msg: 'Recipient not found.' };
  }
  if (from === to) {
    return { ok: false, msg: 'Cannot transfer to yourself.' };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, msg: 'Invalid amount.' };
  }
  if (users[from].balance < amount) {
    return { ok: false, msg: 'Insufficient funds.' };
  }

  users[from].balance -= amount;
  users[to].balance   += amount;

  transactions.push({
    from,
    to,
    amount,
    timestamp: new Date().toLocaleTimeString()
  });

  return { ok: true };
}

// ---- Reset ----------------------------------------------------------------

app.get('/reset', (req, res) => {
  resetState();
  console.log('[RESET] Balances and transactions reset to defaults.');
  res.redirect(req.session.username ? '/dashboard' : '/login');
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log('');
  console.log(`====================================================`);
  console.log(`  CSRF Demo – Victim App`);
  console.log(`  Mode : ${SECURE ? '🔒 SECURE' : '⚠️  VULNERABLE'}`);
  console.log(`  URL  : http://localhost:${PORT}`);
  console.log(`====================================================`);
  console.log('');
});
