# Stored XSS Lab

> Educational use only. The vulnerable mode is intentionally unsafe. The server
> binds to `127.0.0.1` and is intended to be used only on your own computer.

## Run the lab

```powershell
cd IIB2024009
npm install
npm start
```

Open <http://127.0.0.1:3002>. The application starts in vulnerable mode.

To run the mitigated version, stop the first server and run:

```powershell
npm run start:secure
```

The secure version uses the same URL and displays a green secure-mode banner.

## Demonstration

1. In vulnerable mode, submit this harmless proof-of-concept comment:

   ```html
   <img src=x onerror=alert('Stored XSS')>
   ```

2. The browser displays a small alert when it renders the stored comment. Dismiss
   it, refresh the page, and observe that the payload executes again because the
   comment remains in the in-memory guestbook.
3. Stop the vulnerable server and start secure mode.
4. Submit the exact same comment. It appears as literal text and does not execute.
5. Use **Reset comments** to clear the guestbook between demonstrations.

The alert is only a visible proof that injected markup was executed; it does not
read browser data, send network requests, or affect any other site. The app is
bound to loopback and should not be exposed publicly.

## Vulnerable code path and root cause

`POST /comments` stores the submitted comment in memory. `GET /` later inserts
that comment into an HTML list. In vulnerable mode, the value is inserted as
markup without encoding, so the browser interprets the comment as HTML and
executes its event handler. This is **stored XSS** because the submitted content
is retained and affects a later page render.

## Mitigation implemented

Secure mode applies context-aware HTML encoding to each comment before putting it
in an HTML text node. Characters that can form markup (`&`, `<`, `>`, `"`, and
`'`) are converted to entities. The browser therefore displays the payload as
text rather than interpreting it as an element. The same payload is blocked in
the secure-mode demonstration.

## Other mitigation options (theory)

- **Framework auto-escaping:** Render untrusted values through a framework's
  escaped text interpolation rather than constructing raw HTML.
- **HTML sanitization:** If user-authored rich HTML is a product requirement,
  sanitize it with a maintained allow-list sanitizer. Encoding is preferable
  when rich HTML is not needed.
- **Content Security Policy (CSP):** A restrictive policy can block inline
  scripts and event handlers, reducing the impact of injection. Treat CSP as
  defense-in-depth, not as a replacement for safe rendering.
- **HttpOnly cookies:** Prevent client-side scripts from reading cookies marked
  `HttpOnly`; this does not prevent XSS or stop injected code from acting in the
  user's page.
- **Safe DOM sinks:** On client-rendered pages, use `textContent` for plain text
  and avoid assigning untrusted strings to `innerHTML`.

## Ownership declaration

| Member | Roll number | Category | Variant |
|---|---|---|---|
| Name to be completed by student | IIB2024009 | XSS | Stored XSS |

## Tests

```powershell
npm test
```

The tests verify that vulnerable mode returns the submitted markup, secure mode
encodes the same value, and invalid comment lengths are rejected.
