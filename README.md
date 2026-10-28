# Web Server Security: Exploitation and Mitigation

**Course:** Cyber Security (IT-30001)  
**Institute:** IIIT Allahabad  
**Semester:** Autumn 2026  
**Group:** 13 — Section C  
**Instructor:** Dr. Soumyadev Maity

## 1. Project Overview

This project demonstrates common web application vulnerabilities, their potential impact, and suitable mitigation techniques through controlled security testing.

The project covers SQL Injection, Cross-Site Scripting (XSS), and Cross-Site Request Forgery (CSRF).

## 2. Group Members and Contributions

| Enrollment Number | Member Name | Contribution |
|---|---|---|
| IIB2024008 | Krish Dhaked | Implemented SQL Injection Authentication Bypass, compared vulnerable and secure login implementations, and demonstrated parameterized queries as a mitigation. |
| IIB2024009 | Himanshu Vitthalani | Worked on Stored Cross-Site Scripting (XSS), demonstrating the risks of unsafe handling and rendering of user-generated content and its mitigation. |
| IIB2024010 | Mayank Kumar Jha | Worked on GET-Based Cross-Site Request Forgery (CSRF), demonstrating forged actions and explaining appropriate request-validation protections. |

## 3. SQL Injection — Authentication Bypass

**Member:** Krish Dhaked (IIB2024008)

SQL Injection occurs when untrusted input changes the intended logic of an SQL query. Authentication bypass may allow unauthorized access through a vulnerable login system.

**Mitigation:** Use parameterized queries, validate input, apply least privilege, and handle errors safely.

## 4. Cross-Site Scripting (XSS) — Stored XSS

**Member:** Himanshu Vitthalani (IIB2024009)

Stored XSS occurs when untrusted content is saved by an application and later rendered unsafely, potentially causing script execution in another user's browser.

**Mitigation:** Use context-aware output encoding, sanitize permitted HTML, avoid unsafe DOM operations, and apply Content Security Policy (CSP).

## 5. Cross-Site Request Forgery (CSRF) — GET-Based Forged Action

**Member:** Mayank Kumar Jha (IIB2024010)

CSRF tricks an authenticated user's browser into sending an unintended request. GET-based CSRF can occur when an application improperly uses GET requests to perform state-changing operations.

**Mitigation:** Avoid state-changing GET requests, use CSRF tokens, configure appropriate `SameSite` cookie settings, and validate requests on the server.

## 6. Conclusion

This project demonstrates the importance of secure web application development. SQL injection, XSS, and CSRF exploit different weaknesses, so each requires appropriate security controls. Understanding these vulnerabilities and applying their mitigations helps developers build safer applications.

**Disclaimer:** This project is intended for cybersecurity education and authorized testing in controlled environments only.
