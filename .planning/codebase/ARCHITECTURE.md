# Architecture

**Analysis Date:** 2026-03-23

## Pattern Overview

**Overall:** Three-tier distributed system with WordPress plugin frontend, Python async bot orchestrator, and Telegram UI.

**Key Characteristics:**
- Multi-module design: Uptime monitor, REST API reporting, Telegram bot, and maintenance automation
- Async request handling for slow network operations (SSL checks, API calls)
- Token-based authentication between Python clients and WordPress endpoints
- AI-augmented workflow using local Ollama inference
- Data-driven recommendations engine with financial ROI calculations

## Layers

**WordPress Plugin Layer (PHP):**
- Purpose: Extract infrastructure, security, and analytics metrics from WordPress sites
- Location: `src/wordpress-plugin/sentinel-idpy-connector.php`
- Contains: REST endpoint handlers, Matomo analytics integration, security checks, admin UI
- Depends on: WordPress core, Matomo plugin (optional), Wordfence plugin (optional)
- Used by: Python clients via HTTP GET requests to `/wp-json/sentinel/v1/stats`

**Data Fetching Layer (Python):**
- Purpose: Aggregate data from multiple client WordPress sites and external sources
- Location: `maintenance_bot/client_fetcher.py`
- Contains: HTTP client for WordPress endpoints, SSL certificate validation, metrics normalization
- Depends on: requests library, ssl/socket modules
- Used by: Main bot orchestrator for populating report context

**AI Enhancement Layer (Python):**
- Purpose: Polish user-provided maintenance notes and generate strategic recommendations
- Location: `maintenance_bot/ai_handler.py`, `maintenance_bot/recommendation_engine.py`
- Contains: Ollama API client, system prompts for text improvement, analytics-based suggestion engine
- Depends on: requests library, local Ollama service
- Used by: Main bot for text augmentation and roadmap generation

**Report Generation Layer (Python):**
- Purpose: Render collected data into professional PDF reports
- Location: `maintenance_bot/html_pdf_generator.py`, `maintenance_bot/pdf_generator.py` (legacy)
- Contains: HTML template rendering, CSS styling, WeasyPrint PDF generation
- Depends on: weasyprint, jinja2 (implicit in HTML building)
- Used by: Main bot's `generate_report()` function

**Bot Orchestration Layer (Python):**
- Purpose: Manage conversation state, coordinate data collection, and trigger report generation
- Location: `maintenance_bot/main.py`
- Contains: Telegram bot handlers, ConversationHandler state machine, request/response routing
- Depends on: python-telegram-bot, all other Python modules
- Used by: Telegram API as webhook consumer

**Uptime Monitor Layer (Python):**
- Purpose: Periodic health checks with failure notifications
- Location: `src/uptime/monitor.py`
- Contains: HTTP GET checks, Telegram alert sender
- Depends on: requests, Telegram API
- Used by: GitHub Actions cron jobs every 30 minutes

**Monthly Report Generator (Python):**
- Purpose: Automated report collection and distribution
- Location: `src/reporting/report.py`
- Contains: Report aggregation logic, PDF generation
- Depends on: requests, WordPress endpoints
- Used by: GitHub Actions cron jobs (monthly)

## Data Flow

**Maintenance Report Generation Flow:**

1. User sends `/review` command to Telegram bot
2. `start()` handler loads `maintenance_bot/clientes.json`, displays client selection
3. `client_selected()` handler triggered:
   - Calls `ClientDataFetcher.fetch_all_data(client_url)` → queries `/wp-json/sentinel/v1/stats`
   - Extracts: `infrastructure` (disk usage), `metricas` (Matomo analytics), `wordfence` (security), `maintenance` (updates)
   - Calls `ClientDataFetcher.obtener_dias_ssl(client_url)` → checks SSL certificate expiry
   - Stores all data in `context.user_data`
4. Bot asks user for maintenance notes (bitácora)
5. `process_bitacora()` sends notes to Ollama via `AIHandler.improve_text()`
6. User reviews/edits AI-improved text
7. Bot collects before/after photos (optional)
8. Bot asks for strategic roadmap notes
9. `process_hoja_de_ruta()` generates data-driven recommendations:
   - `RecommendationEngine.generate(metrics_data)` → analyzes mobile bounce rate, exit pages, overall bounce rate
   - Produces 3 prioritized recommendations with investment/ROI estimates
   - `RecommendationEngine.format_for_prompt()` formats for AI context
   - `AIHandler.improve_roadmap(raw_notes, data_context)` → professional strategic points
10. `generate_report()` orchestrates PDF creation:
    - `HTMLPDFGenerator.__init__()` receives all collected data
    - `HTMLPDFGenerator.generate(filename)` renders HTML template
    - WeasyPrint converts to PDF
    - Bot sends PDF to user
11. Cleanup: temporary image files removed from `maintenance_bot/reportes/`

**WordPress Data Endpoint Flow:**

1. WordPress admin configures token in Settings → SentinelIDPY
2. Token stored in `sentinel_idpy_report_token` option
3. Python client sends GET request to `/wp-json/sentinel/v1/stats`:
   - Header: `X-WF-Report-Token: [token]`
   - Param (fallback): `?token=[token]`
4. `verify_wf_report_token()` validates token through 4 fallback methods
5. `get_wordfence_blocked_stats()` callback aggregates:
   - Infrastructure: disk space from `disk_free()`, disk space calculations
   - Wordfence: `get_option('wordfence_blocks')` for blocked attack counts
   - Matomo: `sentinel_get_matomo_data()` queries Matomo API for analytics
   - Maintenance: `sentinel_get_maintenance_status()` checks plugin/theme updates
6. Returns JSON response with all metrics

**Recommendation Engine Flow:**

- Input: Matomo metrics object with visitors, bounce_rate, devices, exit_pages
- Rule 1: If mobile bounce rate > 50%, estimate conversion loss → investment/ROI
- Rule 2: If any exit page > 50% exit rate, suggest cart recovery → ROI
- Rule 3: If general bounce rate > 40%, suggest content improvement → ROI
- Rule 4: If conversions not tracked, recommend setup
- Output: Sorted list of top 3 recommendations with financial impact
- Used by: `improve_roadmap()` to contextualize AI suggestions

**State Management:**

- Bot conversation state stored in `context.user_data` dict (session-level):
  - `client`: Selected client metadata
  - `session_id`: Unique ID for temp file naming
  - `infrastructure_data`: Disk usage metrics
  - `metrics_data`: Normalized Matomo analytics
  - `wordfence_data`: Security metrics
  - `maintenance_data`: Update status
  - `ssl_days`: Days until certificate expires
  - `raw_text`, `improved_text`, `final_text`: Text versions at each stage
  - `antes_img`, `despues_img`: Temp image file paths
  - `data_recommendations`: Generated recommendations
  - `hoja_de_ruta`: Final roadmap text

## Key Abstractions

**ClientDataFetcher:**
- Purpose: Encapsulate REST client behavior and data normalization
- Examples: `src/uptime/monitor.py`, `maintenance_bot/client_fetcher.py`
- Pattern: Static methods for each data type (fetch_all_data, extract_metrics, obtener_dias_ssl)
- Key method: `fetch_all_data()` handles SSL verification disable for self-signed certs in Docker

**AIHandler:**
- Purpose: Encapsulate Ollama API interaction with system prompts
- Location: `maintenance_bot/ai_handler.py`
- Methods: `improve_text()` (tactical polish), `improve_roadmap()` (strategic planning)
- Fallback: Returns original text if Ollama unreachable
- System prompts: Enforce active voice, bullet points, max 4 items

**RecommendationEngine:**
- Purpose: Transform raw analytics into business-focused recommendations
- Methods: `generate()` (analyze metrics, produce recommendations), `financial_summary()` (calculate ROI), `format_for_prompt()` (AI context), `format_for_pdf()` (report text)
- Decision logic: Priority-based sorting, Gs. currency calculations, investment thresholds

**HTMLPDFGenerator:**
- Purpose: Render structured data into professional PDF reports
- Location: `maintenance_bot/html_pdf_generator.py`
- Methods: `generate(filename)`, internal builders for sections (health cards, metrics, devices, recommendations)
- Dependencies: WeasyPrint for PDF conversion, HTML template at `maintenance_bot/templates/executive_report.html`

**ConversationHandler:**
- Purpose: Manage multi-step Telegram interaction state machine
- Locations: python-telegram-bot framework, instantiated in `main.py`
- States: INICIO → BITACORA → REVISION_IA → CAPTURA_ANTES → CAPTURA_DESPUES → HOJA_DE_RUTA → REVISION_RUTA
- Callbacks: Each state transitions through user actions (text, photo, /skip, button clicks)

## Entry Points

**Telegram Bot Main:**
- Location: `maintenance_bot/main.py`
- Triggers: `docker-compose up -d` or direct Python execution
- Responsibilities: Load clients, initialize Telegram app, register handlers, run polling loop

**GitHub Actions - Uptime Monitor:**
- Location: `.github/workflows/main.yml`
- Triggers: Every 30 minutes via cron
- Responsibilities: Run `src/uptime/monitor.py`, check all sites, send Telegram alerts

**GitHub Actions - Monthly Report:**
- Location: `.github/workflows/report.yml`
- Triggers: Monthly (scheduled)
- Responsibilities: Run `src/reporting/report.py`, aggregate all sites, send PDF via Telegram

**Mock Server (Development):**
- Location: `mock_sentinel_server.py`
- Triggers: Manual `python mock_sentinel_server.py`
- Responsibilities: Simulate WordPress endpoints for testing without real sites

## Error Handling

**Strategy:** Try-except wrappers with graceful degradation. Errors logged; operations continue with empty/default data.

**Patterns:**

1. **Network Errors (Timeouts, Connection Refused):**
   - `ClientDataFetcher.fetch_all_data()`: logs error, returns `{}`
   - `AIHandler.improve_text()`: logs error, returns original text
   - Falls back to manual user input or skipped sections

2. **Data Parsing Errors:**
   - `ClientDataFetcher.extract_metrics()`: normalizes string percentages ("45%") to floats
   - `HTMLPDFGenerator._build_metrics_section()`: checks metric existence before access, returns placeholder if empty
   - No crash on missing analytics data; PDF still renders

3. **SSL Validation Errors:**
   - `ClientDataFetcher.obtener_dias_ssl()`: catches socket.timeout, socket.gaierror, general Exception
   - Returns `None` if SSL check fails; PDF renders with "unknown" certificate status

4. **Telegram API Errors:**
   - `generate_report()`: wrapped in try-except, logs error, replies with ❌ error message
   - Ensures cleanup (file deletion) happens in finally block regardless of error

5. **PDF Generation Errors:**
   - WeasyPrint failures logged, user notified
   - Temporary image files cleaned up in finally block even if PDF generation fails

## Cross-Cutting Concerns

**Logging:**
- Framework: Python `logging` module, basicConfig in `main.py` with INFO level
- Locations: Every major operation in `client_fetcher.py`, `ai_handler.py`, `main.py`
- Format: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
- WordPress: `error_log()` in PHP for token verification and Matomo queries

**Validation:**

- **Token validation:** WordPress plugin enforces 32-char minimum; client sends header + query param (fallbacks)
- **Text length limits:** Telegram handlers enforce 1500 char max per message (DOS protection)
- **Path sanitization:** `generate_report()` strips special characters from client names before file naming
- **Client selection:** Only JSON-loaded clients permitted; user ID in ALLOWED_USERS whitelist

**Authentication:**

- **Telegram:** User ID must be in `ALLOWED_USERS` env var (comma-separated list)
- **WordPress:** Token stored in encrypted WordPress options, passed via header or query param
- **SSL:** Disabled for self-signed certs in Docker (`verify=False` in requests)

**Security Hardening:**

- Tokens: Minimum 32 characters, no shared secrets in code
- Temporary files: Named with `session_id` UUID, stored in isolated `reportes/` directory, deleted after report sent
- Rate limiting: No explicit limits; relies on Telegram bot's built-in throttling
- Input sanitization: `sanitize_text_field()` in WordPress, text length checks in Python

---

*Architecture analysis: 2026-03-23*
