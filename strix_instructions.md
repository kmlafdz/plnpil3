# PLN Corpu PIL Level 3 - Security Audit Scope & Guidelines for Strix

## 1. Application Overview
- **Name:** PLN Corporate University - Sistem Evaluasi Level 3 UP3 Metro
- **Stack:** Node.js Express Backend, MariaDB (`pln_pil_3`), Vanilla JS / Tailwind SPA Frontend
- **Main Server File:** `server.js`
- **Database Connector:** `db.js`

## 2. Key Security Areas to Audit & Validate
1. **Source Code & Sensitive File Protection:**
   - Verify that static file serving denies access to `.env`, `server.js`, `db.js`, `package.json`, and root project files.
2. **Broken Object Level Authorization (BOLA / IDOR):**
   - Test `POST /api/evaluations` to ensure participants (`role: peserta`) can ONLY modify their own respondent data and CANNOT alter `atasan` or `koordinator` evaluations.
3. **Authentication & 2FA Biometric Integrity:**
   - Test `/api/auth/login` and `/api/auth/verify-face`.
   - Ensure the server strictly validates Cosine Similarity against MariaDB `admin_biometrics` and rejects arbitrary client booleans.
4. **SQL Injection:**
   - Verify all SQL queries use prepared statement parameterization (`pool.query(sql, [params])`).
5. **Rate Limiting & Token Revocation:**
   - Verify that revoked tokens in `revoked_tokens` table cannot be reused after `/api/auth/logout`.

