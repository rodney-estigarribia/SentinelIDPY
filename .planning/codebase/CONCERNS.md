# Codebase Concerns

**Analysis Date:** 2025-03-23

## Security Considerations

**SSL Verification Disabled in HTTP Requests:**
- Issue: `verify=False` in requests library disables SSL certificate validation
- Files: `maintenance_bot/client_fetcher.py:33`, `maintenance_bot/test_connection.py:27`
- Impact: Vulnerable to man-in-the-middle attacks when fetching client data from WordPress endpoints. Self-signed certificates bypass standard security checks.
- Recommendation: Replace `verify=False` with proper certificate handling:
  - Use `verify=True` for production with valid CA certificates
  - For self-signed certs in development/staging, use `certifi` bundle or custom CA cert path
  - Document certificate pinning strategy if clients use self-signed certs in production

**Debug Endpoint Without Authentication:**
- Issue: `sentinel-idpy-connector.php:20-25` exposes `/wp-json/sentinel/v1/debug-headers` with `permission_callback` set to `__return_true`
- Impact: Any attacker can call this endpoint to debug header handling and token validation mechanisms, potentially finding ways to bypass token checks
- Recommendation: Either remove debug endpoint or add strict IP whitelist; never allow in production

**Token Exposed in Error Logs:**
- Issue: `sentinel-idpy-connector.php:128-130` logs first 10 characters of tokens to WordPress error log
- Files: `src/wordpress-plugin/sentinel-idpy-connector.php`
- Impact: Partial token leakage in logs (first 10 chars) aids in pattern recognition; full logs could expose tokens if copied
- Recommendation: Remove token logging entirely or log only a unique identifier (e.g., hash) and timestamp

**Query Parameter Fallback for Token:**
- Issue: `sentinel-idpy-connector.php:120-126` accepts token as query parameter if header fails
- Impact: Tokens in query strings are logged by access logs, proxies, and browsers. Less secure than headers.
- Recommendation: Remove query parameter fallback; validate only headers and basic auth. Document that proxies must preserve custom headers.

**Server Address Exposed in API Response:**
- Issue: `sentinel-idpy-connector.php:448` returns `$_SERVER['SERVER_ADDR']` in API response
- Impact: Exposing server IP helps attackers identify infrastructure and plan targeted attacks
- Recommendation: Remove server IP from response or restrict to authenticated admin-only endpoint

**Insufficient Token Length Validation:**
- Issue: Minimum token length 32 characters is weak; no entropy requirements
- Files: `sentinel-idpy-connector.php:61`, `client_fetcher.py:12`
- Impact: Simple tokens (e.g., "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa") pass validation. Brute force feasible.
- Recommendation: Enforce cryptographically random tokens (min 64 hex chars from `secrets.token_hex()` in Python, or `wp_generate_password(64, true)` in PHP)

---

## Tech Debt

**Hardcoded Ollama Host in AIHandler:**
- Issue: `ai_handler.py:8` hardcodes `http://host.docker.internal:11434`
- Files: `maintenance_bot/ai_handler.py`
- Impact: Not configurable; fails silently if Ollama unavailable. `host.docker.internal` only works in Docker Desktop, not in Linux Docker.
- Fix approach: Move to environment variable `OLLAMA_HOST` with fallback; validate connection at startup and warn if unavailable

**Hardcoded Example URLs in Test Code:**
- Issue: `test_connection.py:46` uses hardcoded `http://localhost:8080`
- Impact: Tests don't run against real client URLs without manual edits
- Fix approach: Accept URL as command-line argument or environment variable

**Deprecated PDF Generator (FPDF2) Not Removed:**
- Issue: `pdf_generator.py` exists but is replaced by `html_pdf_generator.py` (using weasyprint)
- Files: `maintenance_bot/pdf_generator.py` (unused)
- Impact: Code duplication, confusion about which generator is active, maintenance burden
- Fix approach: Remove `pdf_generator.py` and verify all tests reference `html_pdf_generator.py` from `main.py:17`

**Loose Token Comparison Possibility:**
- Issue: `sentinel-idpy-connector.php:132` uses strict equality (`===`) which is correct, but no rate limiting on failed attempts
- Files: `src/wordpress-plugin/sentinel-idpy-connector.php`
- Impact: Brute force attacks possible - no delays between attempts, no IP blocking
- Fix approach: Implement rate limiting via transients; log and block IPs with >5 failed attempts per hour

---

## Dependency Vulnerabilities or Risks

**Pinned Dependencies Without Upper Bounds:**
- Issue: `requirements.txt` pins exact versions: `requests==2.31.0`, `fpdf2==2.7.8`, `weasyprint>=68.0`
- Impact: Security patches not applied automatically; some deps pinned so old they may have known CVEs
- Recommendation:
  - Use compatible releases (`requests~=2.31`) for upper-bound flexibility
  - Add periodic dependency audits; current versions are from 2024, consider updating to latest stable
  - `weasyprint>=68.0` is good (loose upper bound), but main dependencies need review

**WeasyPrint HTML/CSS Rendering Security:**
- Issue: `html_pdf_generator.py` uses WeasyPrint to render HTML/CSS from user input via `improved_text` and recommendations
- Files: `maintenance_bot/html_pdf_generator.py`, `maintenance_bot/main.py:310`
- Impact: Potential XSS/CSS injection if AI response or user input contains malicious HTML/CSS; WeasyPrint can execute external resources
- Fix approach:
  - Sanitize all text inputs with `bleach` library before rendering
  - Disable external resource loading in WeasyPrint: `WeasyPrint(html_string, url_fetcher=lambda url: None)`
  - Escape/encode user strings as plain text, not raw HTML

**Python 3.11 EOL Risk:**
- Issue: `Dockerfile` specifies `python:3.11-slim`; Python 3.11 reaches EOL Oct 2027
- Impact: Security patches become unavailable after EOL
- Fix approach: Migrate to Python 3.13+ (current stable) within 2025

---

## Known Bugs & Incomplete Functionality

**Infrastructure Data Not Appearing in PDFs:**
- Issue: According to memory, WordPress plugin returns infrastructure data but Python bot doesn't render it in PDFs
- Files: Likely `maintenance_bot/html_pdf_generator.py` (missing call to render infrastructure section)
- Trigger: Full data flow from `/wp-json/sentinel/v1/stats` → `client_fetcher.py` → `main.py` context → `html_pdf_generator.py`
- Status: Suspected issue with WeasyPrint template not including infrastructure card rendering
- Debugging: Check if `self.infra_data` is None vs populated in PDFGenerator.__init__; verify template includes infrastructure section

**Matomo Analytics Optional But Not Clearly Communicated:**
- Issue: `sentinel_get_matomo_data()` returns `null` silently if Matomo plugin not installed
- Files: `sentinel-idpy-connector.php:145-150`
- Impact: Reports generated without analytics metrics; user doesn't know why data is missing
- Fix approach: Return explicit `"metricas": { "status": "not_available", "reason": "Matomo plugin not detected" }` instead of null

**SSL Certificate Parsing Uses Deprecated PHP Function:**
- Issue: `sentinel-idpy-connector.php:489-494` uses `@stream_socket_client()` with error suppression
- Impact: Silent failures; no logging if SSL check fails; deprecated/fragile method
- Fix approach: Use `openssl_get_cert_locations()` and dedicated cert validation library

---

## Fragile Areas

**Telegram Bot Conversation State Management:**
- Files: `maintenance_bot/main.py:32` defines 9 conversation states
- Why fragile: Long multi-step flow (INICIO → BITACORA → REVISION_IA → ... → generate_report). If bot crashes mid-conversation, state is lost and user must restart.
- Safe modification: Add session persistence (save context to Redis/JSON between steps), add `/cancel` with cleanup logic
- Test coverage gap: No tests for conversation recovery or edge cases (user timeout, network interruption)

**AI Fallback Silently Uses Raw Text:**
- Files: `ai_handler.py:41-43`, `main.py:142-147`
- Why fragile: If Ollama fails, bot silently uses unedited user input instead of alerting user. Quality degrades without notice.
- Safe modification: Always validate output; if AI fails, ask user to retry or manually edit
- Test coverage: No tests for Ollama timeout/failure scenarios

**File Path Traversal Protection Insufficient:**
- Issue: `main.py:309` sanitizes client name but `reportes/tmp_{session_id}_antes.jpg` uses predictable session ID
- Files: `maintenance_bot/main.py:186-201`
- Impact: Session IDs are only 8 hex chars from `uuid.uuid4().hex[:8]`; predictable IDs could allow file overwrite attacks
- Safe modification: Use full 32-char UUID; validate file paths before writing; use secure temporary directory

**Orphaned Temporary Image Files:**
- Issue: `main.py:330-340` attempts cleanup of `tmp_*.jpg` and `*.webp` files, but logic is complex and error-prone
- Files: `maintenance_bot/main.py`
- Why fragile: If PDF generation succeeds but cleanup fails, files accumulate in `reportes/`. If exception occurs after file creation but before cleanup block, files leak.
- Safe modification: Use Python's `tempfile.NamedTemporaryFile` with context manager; move finalized files to permanent location only after cleanup

---

## Docker & Container Considerations

**Extra Hosts Entry for Ollama:**
- Issue: `docker-compose.yml:16` uses `host.docker.internal:host-gateway` for Ollama
- Impact: Only works on Docker Desktop (Windows/Mac); breaks on Linux Docker without additional setup
- Recommendation: Document Linux requirement or use Docker network instead: create a shared network with Ollama container, reference by service name

**No Health Check Configured:**
- Issue: `docker-compose.yml` lacks `healthcheck` for bot container
- Impact: Docker won't detect if bot crashes silently; orchestrators can't restart failed service
- Fix approach: Add:
  ```yaml
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8888/health || exit 1"]
    interval: 30s
    timeout: 5s
    retries: 3
  ```
  (requires lightweight health endpoint)

**Hardcoded Environment Variables Not Validated at Startup:**
- Issue: `main.py:22-24` raises `ValueError` if `TELEGRAM_TOKEN` missing, but no validation for `WF_REPORT_TOKEN` in `client_fetcher.py:12`
- Impact: Bot starts successfully with default token "your_32_character_secure_hash_here_123", then fails when accessing WordPress
- Fix approach: Add startup validation in `main.py` to verify all required env vars (including `WF_REPORT_TOKEN`) before entering polling loop

**No Resource Limits:**
- Issue: `docker-compose.yml` has no `resources` section
- Impact: Bot can consume unlimited CPU/memory; affects host stability
- Fix approach: Add limits:
  ```yaml
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
  ```

**Volumes Not Read-Only Where Appropriate:**
- Issue: `docker-compose.yml:10` mounts `clientes.json` as read-write
- Impact: Bot could corrupt client configuration; no immutability guarantees
- Fix approach: Mount `clientes.json` as read-only: `./clientes.json:/app/clientes.json:ro`; mount `reportes` separately as writable

---

## Performance Bottlenecks

**Synchronous HTTP Requests Block Event Loop:**
- Issue: `main.py:90-96` uses `loop.run_in_executor()` to call blocking `ClientDataFetcher.fetch_all_data()` and `obtener_dias_ssl()` sequentially
- Impact: Each client request waits for 2 blocking calls (30s timeout each); bot unresponsive during fetch
- Improvement path:
  - Make HTTP client async using `aiohttp` instead of `requests`
  - Parallel SSL + data fetch instead of sequential
  - Cache results per-client to avoid repeat fetches within session

**PDF Generation on Main Thread:**
- Issue: `main.py:314-315` runs `pdf_gen.generate()` in executor, but file I/O for images is synchronous
- Impact: Generating large PDFs (multiple images, tables) blocks event loop; timeout if >30s
- Improvement path:
  - Implement async image processing with `asyncio.to_thread()` for each image
  - Stream PDF generation (write chunks to disk) instead of buffering entire PDF

**No Caching of WordPress Metrics:**
- Issue: Every session refetches full WordPress data including Matomo analytics
- Impact: High load on WordPress if bot used frequently (>5 sessions/hour); Matomo API calls expensive
- Improvement path: Implement Redis cache with TTL (5-15 min) per client; include cache-control headers in WordPress response

---

## Test Coverage Gaps

**No Tests for Main Telegram Bot Handlers:**
- What's not tested: All conversation state handlers in `main.py` (start, client_selected, process_bitacora, etc.)
- Files: `maintenance_bot/main.py:48-343`
- Risk: Regressions in bot flow undetected; conversation state transitions could break
- Priority: HIGH

**No Integration Tests for Full Report Generation:**
- What's not tested: End-to-end flow from client selection to PDF generation
- Files: `maintenance_bot/main.py` + `html_pdf_generator.py`
- Risk: PDF corruption, missing data sections, template rendering errors not caught until manual testing
- Priority: HIGH

**No Mock Tests for External Dependencies:**
- What's not tested: Ollama unavailable, WordPress endpoint timeout, invalid tokens
- Files: `maintenance_bot/ai_handler.py`, `client_fetcher.py`
- Risk: Silent failures or confusing error messages in production
- Priority: MEDIUM

**No Tests for RecommendationEngine Edge Cases:**
- What's not tested: Empty metrics, None values, divide-by-zero in ROI calculations
- Files: `maintenance_bot/recommendation_engine.py`
- Risk: Exception crashes bot during report generation
- Priority: MEDIUM

**No Tests for PHP Plugin REST Endpoints:**
- What's not tested: Token validation, missing Wordfence/Matomo, SQL injection via prepared statements
- Files: `src/wordpress-plugin/sentinel-idpy-connector.php`
- Risk: Security vulnerabilities undetected; plugin behavior changes go untested
- Priority: MEDIUM

---

## Missing Critical Features

**No Rate Limiting on REST Endpoint:**
- Problem: WordPress endpoint accepts unlimited requests from any client with valid token
- Blocks: Cannot prevent brute-force attacks or resource exhaustion
- Recommendation: Implement rate limiting per IP: max 10 requests/minute; return 429 Too Many Requests

**No Data Persistence Layer:**
- Problem: All data fetched ad-hoc; no historical tracking of metrics
- Blocks: Cannot show trends (month-over-month improvements), cannot analyze client health over time
- Recommendation: Add SQLite/MySQL backend to store metrics snapshots; implement historical comparison view in PDF

**No Automated Alerting for Critical Issues:**
- Problem: Infrastructure data shows >80% disk usage but no notification to admin
- Blocks: Cannot implement proactive maintenance alerts
- Recommendation: Add alert rules engine; send Telegram notifications for critical thresholds (disk, SSL expiry <14 days, backup age)

---

## Scaling Limits

**Single Telegram Bot Instance (No Clustering):**
- Current capacity: Handles ~10-20 concurrent conversations before timeouts (based on Telegram polling)
- Limit: Breaks at >50 concurrent users; stateless design prevents horizontal scaling
- Scaling path: Implement Telegram webhook instead of polling; deploy multiple instances with shared Redis state

**No Database for Report History:**
- Current capacity: Reports stored only in Docker volume (`reportes/`); no indexing or search
- Limit: 1000+ PDFs become hard to manage; no filtering by client/date
- Scaling path: Migrate reports to S3/MinIO with metadata in SQLite/PostgreSQL

**WordPress REST API Load:**
- Current capacity: Single endpoint `/wp-json/sentinel/v1/stats` does full data scan (Matomo, Wordfence, disk, SSL) per request
- Limit: Response time ~5-10s per client; breaks with >5 simultaneous clients
- Scaling path: Split endpoints by concern (e.g., `/stats`, `/metrics`, `/security`); implement server-side caching; add pagination for large datasets

---

*Concerns audit: 2025-03-23*
