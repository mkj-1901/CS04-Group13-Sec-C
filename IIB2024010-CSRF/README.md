# CSRF Demo – Cross-Site Request Forgery Lab

> **⚠️ Educational use only.** This application is intentionally vulnerable and must
> never be deployed on a public network. It is designed for a university Cyber Security
> assignment to demonstrate and then fix a GET-based CSRF vulnerability.

---

## 📁 Project Structure

```
IIB2024010-CSRF/
├── package.json
├── server.js              ← Victim app (port 3000)
├── attacker/
│   ├── server.js          ← Attacker's static server (port 3001)
│   ├── csrf-get.html      ← GET-based exploit (hidden <img>)
│   └── csrf-post.html     ← POST-based exploit (auto-submitting form)
└── README.md
```

---

## 🚀 Installation & Running

### 1. Install dependencies

```bash
cd IIB2024010-CSRF
npm install
```
<!-- .gitignore -->

**Repository Setup**

The repository includes a **.gitignore** file to exclude generated files and dependencies from version control, such as:

- `node_modules/`
- `dist/`
- `.env` files
- IDE folders (`.idea/`, `.vscode/`)
- Log files (`npm-debug.log`, `yarn-debug.log`, `yarn-error.log`)

This helps keep the repository clean and avoids committing large, unnecessary files.


### 2. Run in **Vulnerable** mode (default)

Open **two** terminals:

```bash
# Terminal 1 – Victim app
npm start
# → http://localhost:3000

# Terminal 2 – Attacker server
npm run attacker
# → http://localhost:3001
```

### 3. Run in **Secure** mode

```bash
# Terminal 1 – Victim app (secure)
npm run start:secure
# → http://localhost:3000 (with SECURE banner)

# Terminal 2 – Attacker server (unchanged)
npm run attacker
```

---

## 🧪 Step-by-Step Demo

### A. Vulnerable Mode

1. Start both servers in **vulnerable** mode (see above).
2. Open **http://localhost:3000** in your browser. Log in as **alice / alice123**.
3. Note alice's balance: **$1000**.
4. **Without logging out**, open a new tab and visit **http://localhost:3001/csrf-get.html**.
5. You see a harmless-looking "You won a prize!" page – but behind the scenes the hidden `<img>` tag has already fired `GET /transfer?to=attacker&amount=500`.
6. Go back to the dashboard tab and **refresh**. Alice's balance is now **$500**, and the attacker's balance is **$500**.
7. Check the victim server terminal – you'll see the transfer was logged.
8. Click **🔄 Reset Balances** to restore the original state.

### B. Secure Mode

1. Stop the victim server. Restart it with `npm run start:secure`.
2. Log in as **alice / alice123** again. Note the green **🔒 MODE: SECURE** banner.
3. Open **http://localhost:3001/csrf-get.html** in a new tab.
4. Go back and refresh the dashboard – **balance is still $1000**. The GET was blocked (405).
5. Open **http://localhost:3001/csrf-post.html** in a new tab.
6. The page auto-submits a POST form, but the server returns **403** because the CSRF token is missing.
7. Back on the dashboard, use the **legitimate transfer form** to send $100 to `attacker` – it **succeeds** because the form includes the correct `_csrf` token.

---

## 🔍 Root Cause

The vulnerable app uses a **state-changing GET request** (`GET /transfer`) that relies
solely on the session cookie for authentication. Because browsers attach cookies to
every request to a domain — even requests initiated by a different origin — an attacker
page can silently trigger the transfer using an `<img>` tag.

---

## 🛡️ Mitigations Implemented

| Defence | How it works in this demo |
|---|---|
| **Synchronizer Token** | A random 32-byte hex token is generated per session, embedded in the form as `_csrf`, and verified on `POST /transfer` using `crypto.timingSafeEqual`. |
| **Reject GET for state changes** | `GET /transfer` returns `405 Method Not Allowed` in secure mode. |
| **SameSite=strict cookie** | The session cookie is set with `sameSite: 'strict'`, preventing the browser from sending it on any cross-site request. |

### Other Mitigations (Theory)

- **SameSite Cookies (`Lax` / `Strict`):** Modern browsers default to `SameSite=Lax`, which blocks cookies on cross-site sub-requests (images, iframes) but still allows them on top-level navigations. `Strict` blocks cookies on all cross-site requests entirely. While effective as defense-in-depth, they should not be the sole protection because older browsers may not support them.

- **Re-authentication for Sensitive Actions:** Requiring the user to re-enter their password (or complete a CAPTCHA / 2FA challenge) before executing high-value operations like fund transfers ensures that even a forged request cannot succeed without active user participation.

- **Avoiding State-Changing GET Requests:** The HTTP specification states that GET should be safe and idempotent. Using POST/PUT/DELETE for state changes is a fundamental design principle that eliminates the simplest class of CSRF attacks (via `<img>`, `<script src>`, etc.), though POST-based CSRF is still possible without tokens.

---

## 📚 References

- OWASP CSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- MDN: SameSite cookies: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
