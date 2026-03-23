# External Integrations

**Analysis Date:** 2026-03-23

## APIs & External Services

**Telegram Bot API:**
- Service: Telegram Bot API (cloud-hosted)
- What it's used for: Bot messaging, command handling, file uploads, inline keyboards
- SDK/Client: python-telegram-bot 20.8
- Auth: Bot token via `TELEGRAM_TOKEN` environment variable
- Entry point: `main.py` - Application.builder().token(TOKEN).build()
- Rate limits: Standard Telegram rate limiting applies

**WordPress REST API:**
- Service: WordPress REST API (client-hosted)
- What it's used for: Fetches infrastructure metrics, analytics, security, maintenance data
- Endpoint: `GET /wp-json/sentinel/v1/stats` (requires authentication)
- SDK/Client: requests library (native HTTP)
- Auth: Token-based via `X-WF-Report-Token` header + query parameter fallback
- Implementation: `client_fetcher.py` - ClientDataFetcher.fetch_all_data()

**Ollama Local LLM:**
- Service: Ollama (self-hosted inference engine)
- What it's used for: Text improvement/professionalization, roadmap generation
- Endpoint: `http://host.docker.internal:11434/api/generate`
- SDK/Client: requests library (native HTTP)
- Model: qwen2.5-coder:1.5b
- Timeout: 15 seconds per request
- Fallback: Returns original text if Ollama unavailable
- Implementation: `ai_handler.py` - AIHandler class
- Note: Docker service uses `host.docker.internal` alias; local dev can use `localhost:11434`

## Data Storage

**Databases:**
- Connection: None (application is stateless)
- Client sites: Stored in `clientes.json` (JSON file)
- Reports: Generated PDFs stored in `reportes/` directory (local filesystem)
- Backup info: Read from UpdraftPlus WordPress option if available

**File Storage:**
- Local filesystem only
- Report directory: `reportes/` (mounted as Docker volume)
- Temporary images: `reportes/tmp_{session_id}_antes.jpg`, `reportes/tmp_{session_id}_desp.jpg`
- Generated PDFs: `reportes/Reporte_{client_name}_{random_hex}.pdf`
- WebP conversions: Auto-generated in `reportes/` from JPG source

**Caching:**
- None (stateless per request)
- Telegram conversation state: In-memory via `context.user_data`

## Authentication & Identity

**Auth Provider:**
- Custom token-based auth for WordPress endpoint
- Token implementation in `sentinel-idpy-connector.php`:
  - Stored as WordPress option: `sentinel_idpy_report_token`
  - Min length: 32 characters (enforced)
  - Verification logic: `verify_wf_report_token()` checks header + query param
  - Token sources checked (in order):
    1. Header: `X-WF-Report-Token` (with underscores)
    2. Header: `x-wf-report-token` (with hyphens)
    3. Server var: `$_SERVER['HTTP_X_WF_REPORT_TOKEN']`
    4. Query param: `token` (fallback for proxy-stripped headers)

**Bot User Whitelist:**
- Telegram user ID whitelist via `ALLOWED_USERS` env var (comma-separated IDs)
- Validation in `main.py` - start() function checks `update.effective_user.id`
- Returns ConversationHandler.END if user not in whitelist

## Monitoring & Observability

**Error Tracking:**
- None (structured logging to stdout/stderr)

**Logs:**
- Python logging module with format: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
- Level: INFO
- Logged to console (stdout)
- Files:
  - `main.py`: User action logging, error tracking
  - `client_fetcher.py`: REST endpoint calls, SSL checks, data extraction
  - `ai_handler.py`: Ollama request errors
  - `html_pdf_generator.py`: PDF generation status
  - `sentinel-idpy-connector.php`: error_log() calls for debugging

**WordPress Plugin Logging:**
- Uses error_log() for debugging token verification
- Logs: Token presence/length, token match success/failure, Matomo API errors
- Location: WordPress debug.log

## CI/CD & Deployment

**Hosting:**
- Docker container (self-hosted via docker-compose)
- Container name: `sentinel_maintenance_bot`
- Restart policy: unless-stopped
- Build: Local Dockerfile in `maintenance_bot/`

**CI Pipeline:**
- GitHub Actions (based on .github/workflows/ mentioned in README)
- Workflows:
  - `main.yml` - Uptime monitor (cron every 30 min) - for `src/uptime/monitor.py`
  - `report.yml` - Monthly PDF report generation (cron monthly) - for `src/reporting/report.py`
- Note: Maintenance bot deployment is manual via docker-compose

## Environment Configuration

**Required env vars:**
- `TELEGRAM_TOKEN` - Bot token from @BotFather (no default, raises ValueError if missing)
- `WF_REPORT_TOKEN` - Security token matching WordPress option (min 32 chars)
- `ALLOWED_USERS` - Comma-separated Telegram user IDs (optional, empty string = no restriction)

**Optional env vars:**
- `OLLAMA_HOST` - Default: `http://host.docker.internal:11434` (Docker-aware)
- `OLLAMA_MODEL` - Default: `qwen2.5-coder:1.5b`

**Secrets location:**
- `.env` file in `maintenance_bot/` (git-ignored)
- docker-compose.yml passes vars from `.env` to container
- WordPress option for token: Settings → SentinelIDPY (Admin settings page)

## Webhooks & Callbacks

**Incoming:**
- Telegram updates (automatic via polling in `app.run_polling()`)
- No manual webhooks configured

**Outgoing:**
- Telegram message sends (via python-telegram-bot)
- PDF document uploads to Telegram chat (via update.message.reply_document)
- HTTP GET requests to WordPress `/wp-json/sentinel/v1/stats`
- HTTP GET requests to Ollama `/api/generate`

## REST Endpoint Specifications

**WordPress REST Endpoint (Client-side):**

```
GET /wp-json/sentinel/v1/stats
```

**Auth:** Header `X-WF-Report-Token: {token}` OR Query param `token={token}`

**Response Structure:**
```json
{
  "status": "success",
  "wordfence": {
    "total_attacks": 45,
    "top_ips": [{"ip": "192.168.1.1", "count": 10}, ...],
    "top_urls": [{"url": "/wp-admin", "count": 5}, ...],
    "top_reasons": [{"reason": "Brute force", "count": 3}, ...],
    "top_usernames": [{"user": "admin", "count": 2}, ...],
    "last_scan": "2026-03-23 10:30:00"
  },
  "infrastructure": {
    "disk_total": "50 GB",
    "disk_free": "10 GB",
    "disk_used_percentage": 80,
    "disk_total_gb": 50.0,
    "disk_free_gb": 10.0,
    "disk_used_gb": 40.0,
    "php_version": "8.2.0",
    "wp_version": "6.4.2",
    "server_ip": "203.0.113.1"
  },
  "maintenance": {
    "recent_updates": [{"name": "Plugin Name", "version": "1.2.3"}, ...],
    "pending_updates": {"plugins": 2, "themes": 0, "wordpress": 0},
    "last_backup": "2026-03-20 02:15:00",
    "site_health": {"status": "good", "good": 8, "recommended": 1, "critical": 0}
  },
  "security": {
    "ssl_days_left": 180
  },
  "metricas": {
    "nb_visits": 1250,
    "nb_uniq_visitors": 870,
    "bounce_rate": "42.5%",
    "top_pages": [...],
    "prev_month": {...},
    "devices": [...],
    "exit_pages": [...],
    "conversions": {...} | null
  }
}
```

**Dependencies on WordPress:**
- Wordfence plugin (optional) - provides `wp_wfHits` table data
- Matomo Analytics plugin (optional) - provides `metricas` key
- UpdraftPlus (optional) - provides backup history

**Ollama Endpoint (Local):**

```
POST /api/generate
```

**Request:**
```json
{
  "model": "qwen2.5-coder:1.5b",
  "prompt": "[system_prompt]\n\n[user_input]",
  "stream": false
}
```

**Response:**
```json
{
  "response": "[generated_text]"
}
```

## Data Flow Summary

1. **Telegram User** sends `/review` command
2. **main.py** loads clients from `clientes.json` and displays selection
3. User selects client → **client_fetcher.py** calls `ClientDataFetcher.fetch_all_data()`
4. **HTTP GET** to `https://client-site.com/wp-json/sentinel/v1/stats` with token header
5. **sentinel-idpy-connector.php** (WordPress plugin) verifies token, queries local DB (Wordfence, Matomo, UpdraftPlus)
6. Response JSON returned to bot with infrastructure/analytics/security data
7. User provides work notes → **AIHandler** sends to Ollama for improvement (optional)
8. User uploads before/after photos (stored temporarily in `reportes/`)
9. **html_pdf_generator.py** renders template with data + photos → PDF file
10. **Telegram** receives PDF via reply_document

---

*Integration audit: 2026-03-23*
