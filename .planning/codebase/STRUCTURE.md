# Codebase Structure

**Analysis Date:** 2026-03-23

## Directory Layout

```
SentinelIDPY/
├── .github/
│   └── workflows/           # GitHub Actions automation
│       ├── main.yml         # Uptime monitor (every 30 min)
│       └── report.yml       # Monthly report generation
├── .planning/
│   └── codebase/            # Codebase analysis documents
├── src/
│   ├── uptime/
│   │   └── monitor.py       # Uptime monitor implementation
│   ├── reporting/
│   │   └── report.py        # Monthly PDF report generator
│   └── wordpress-plugin/
│       ├── sentinel-idpy-connector.php  # Main WordPress plugin
│       └── test-headers.php # Header debugging helper
├── maintenance_bot/
│   ├── templates/
│   │   └── executive_report.html       # HTML/CSS PDF template
│   ├── tests/               # Unit tests
│   │   ├── __init__.py
│   │   └── test_client_fetcher.py
│   ├── reportes/            # Generated PDFs and temp images
│   ├── main.py              # Telegram bot orchestrator
│   ├── client_fetcher.py    # WordPress API client
│   ├── ai_handler.py        # Ollama AI integration
│   ├── html_pdf_generator.py # HTML/CSS-based PDF generation
│   ├── pdf_generator.py     # Legacy FPDF2-based generator
│   ├── recommendation_engine.py # Analytics recommendation logic
│   ├── test_connection.py   # Debug script
│   ├── clientes.json        # Client database (override by mount)
│   ├── .env                 # Environment variables (gitignored)
│   ├── .env.example         # Environment template
│   ├── .gitignore
│   ├── Dockerfile           # Docker image definition
│   ├── docker-compose.yml   # Multi-container setup
│   ├── requirements.txt     # Python dependencies
│   └── NotoEmoji-Variable.ttf # Font for PDF rendering
├── docs/                    # Documentation
│   └── archive/             # Historical docs
├── sites.json               # Global uptime monitor site list
├── mock_sentinel_server.py  # Development test server
├── requirements.txt         # Root Python dependencies
└── README.md                # Project overview
```

## Directory Purposes

**`.github/workflows/`:**
- Purpose: Automated CI/CD pipelines
- Contains: YAML workflow definitions
- Key files: `main.yml` (30-min uptime checks), `report.yml` (monthly reporting)

**`.planning/codebase/`:**
- Purpose: Generated codebase analysis documents
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md

**`src/uptime/`:**
- Purpose: Standalone uptime monitoring service
- Contains: Periodic health checks with Telegram alerts
- Key files: `monitor.py` (main logic using requests and Telegram API)

**`src/reporting/`:**
- Purpose: Automated monthly report generation
- Contains: PDF report aggregation logic
- Key files: `report.py` (loads all sites, fetches stats, generates PDF)

**`src/wordpress-plugin/`:**
- Purpose: WordPress REST endpoint provider
- Contains: PHP plugin code, security token handling, data extraction
- Key files: `sentinel-idpy-connector.php` (2,000+ lines: plugin setup, admin UI, REST handlers, Matomo integration, Wordfence queries, infrastructure calculations)

**`maintenance_bot/`:**
- Purpose: Interactive Telegram maintenance bot and report generator
- Contains: All Python bot logic, handlers, data fetchers, PDF generation, AI integration
- Key files: `main.py` (entry point, conversation handler), `client_fetcher.py` (data aggregation)

**`maintenance_bot/templates/`:**
- Purpose: HTML/CSS templates for PDF rendering
- Contains: Responsive HTML designed for WeasyPrint PDF conversion
- Key files: `executive_report.html` (16KB professional report template)

**`maintenance_bot/tests/`:**
- Purpose: Unit test suite
- Contains: Test fixtures and test cases
- Key files: `test_client_fetcher.py` (tests for data fetching)

**`maintenance_bot/reportes/`:**
- Purpose: Output directory for generated PDFs and temporary images
- Contains: Session-specific temp files (named `tmp_{session_id}_*.jpg`), final PDFs
- Auto-cleanup: Temporary images deleted after report generation; PDFs kept

**`docs/`:**
- Purpose: Project documentation
- Contains: Guides, architecture notes, roadmaps
- Key files: Varies; `archive/` stores historical versions

## Key File Locations

**Entry Points:**
- `maintenance_bot/main.py`: Telegram bot entry point (Application.builder().run_polling())
- `src/uptime/monitor.py`: Uptime monitor entry point (check_urls() → send_telegram_message())
- `src/reporting/report.py`: Monthly report entry point
- `mock_sentinel_server.py`: Development test server (Flask or similar)

**Configuration:**
- `maintenance_bot/.env`: Environment variables (TELEGRAM_TOKEN, ALLOWED_USERS, WF_REPORT_TOKEN)
- `maintenance_bot/.env.example`: Template for .env
- `maintenance_bot/clientes.json`: Client database (id, nombre, url, email)
- `sites.json`: Global site list for uptime monitor (name, url pairs)
- `maintenance_bot/docker-compose.yml`: Docker service definitions (bot + Ollama)

**Core Logic:**
- `maintenance_bot/main.py`: 380 lines — bot orchestration, conversation states, handler chain
- `maintenance_bot/client_fetcher.py`: 156 lines — REST client for WordPress endpoints
- `maintenance_bot/ai_handler.py`: 100 lines — Ollama integration with system prompts
- `maintenance_bot/recommendation_engine.py`: 196 lines — analytics analysis and ROI calculations
- `maintenance_bot/html_pdf_generator.py`: 26KB — HTML/CSS PDF generation with WeasyPrint
- `src/wordpress-plugin/sentinel-idpy-connector.php`: 2,000+ lines — WordPress plugin with REST API

**Testing:**
- `maintenance_bot/tests/test_client_fetcher.py`: Client fetcher tests
- `maintenance_bot/test_connection.py`: Manual debug script

**Styling & Templates:**
- `maintenance_bot/templates/executive_report.html`: Professional HTML report template
- `maintenance_bot/NotoEmoji-Variable.ttf`: Font file for emoji rendering in PDFs

## Naming Conventions

**Files:**
- Modules: `snake_case.py` (e.g., `client_fetcher.py`, `html_pdf_generator.py`)
- Entry points: `main.py`, `monitor.py`, `report.py`
- Tests: `test_*.py` (e.g., `test_client_fetcher.py`)
- Config: `*.json` (e.g., `clientes.json`, `sites.json`), `.env`
- Templates: `*.html` (e.g., `executive_report.html`)
- Temporary outputs: `tmp_{session_id}_*.jpg`, `Reporte_*.pdf`

**Directories:**
- Python packages: `snake_case` (e.g., `maintenance_bot`, `uptime`, `reporting`)
- Output: `reportes/` (Spanish, consistent with project language)
- Configuration: `.github/`, `.planning/`

**Functions/Classes:**
- Classes: PascalCase (e.g., `ClientDataFetcher`, `AIHandler`, `RecommendationEngine`, `HTMLPDFGenerator`)
- Methods: snake_case (e.g., `fetch_all_data()`, `extract_metrics()`, `improve_text()`)
- State constants: UPPERCASE (e.g., `INICIO`, `BITACORA`, `REVISION_IA`)
- Env vars: UPPERCASE_SNAKE (e.g., `TELEGRAM_TOKEN`, `WF_REPORT_TOKEN`, `ALLOWED_USERS`)

**JSON Keys:**
- Client properties: snake_case (e.g., `id`, `nombre`, `url`, `email`)
- Metrics: snake_case (e.g., `nb_visits`, `bounce_rate`, `nb_uniq_visitors`)
- Infrastructure: snake_case (e.g., `disk_used_gb`, `disk_total_gb`, `disk_used_percentage`)

## Where to Add New Code

**New Feature - Interactive Workflow Step:**
- Primary code: `maintenance_bot/main.py` (add state constant, handler function, conversation state transition)
- Example: To add "equipment inventory photo" step:
  1. Add state constant (e.g., `CAPTURA_EQUIPO = 10`)
  2. Add handler `async def handle_photo_equipo()` with file download logic
  3. Add transition in `ConversationHandler.states` dict
  4. Wire to return value of previous handler

**New Feature - Data Metric:**
- Infrastructure data: Extend `src/wordpress-plugin/sentinel-idpy-connector.php`
  - Add new function to extract metric (e.g., `sentinel_get_backup_status()`)
  - Add to JSON response in `get_wordfence_blocked_stats()` callback
  - Update `ClientDataFetcher.extract_metrics()` to normalize new field
  - Update `HTMLPDFGenerator._build_health_cards()` or new section builder

**New Feature - AI Enhancement:**
- New text processing: Add method to `AIHandler` class
- System prompt location: `ai_handler.py` __init__ (update `self.system_prompt`)
- Ollama integration: POST to `http://host.docker.internal:11434/api/generate` with JSON payload
- Fallback: Return input unchanged if Ollama unavailable

**New Feature - PDF Section:**
- Create builder method in `HTMLPDFGenerator` (e.g., `_build_custom_section()`)
- Return HTML string with inline styles (WeasyPrint-compatible CSS)
- Call from `generate()` method when rendering HTML template
- Add CSS classes to `maintenance_bot/templates/executive_report.html` if needed

**New Feature - Recommendation Rule:**
- Add static method to `RecommendationEngine` class (e.g., `_get_custom_metric()`)
- Add new rule block in `generate()` method with logic:
  1. Extract metric from `metrics_data`
  2. Calculate impact (visitors lost, conversion rate, etc.)
  3. Estimate investment and ROI
  4. Append recommendation dict to list
- Return sorted list (existing sort by priority at end)

**New Module - Bot Handler:**
- Location: `maintenance_bot/new_handler.py`
- Pattern: Class with static methods or standalone functions
- Import in `main.py` and instantiate if class-based
- Example: `ClientDataFetcher`, `AIHandler`, `RecommendationEngine`

**New Module - Data Processor:**
- Location: `src/new_module/processor.py`
- Pattern: Static methods for stateless processing
- No global state; pass context via function arguments
- Example: `src/uptime/monitor.py`, `src/reporting/report.py`

**Utilities:**
- Shared helpers: Create in `maintenance_bot/utils/` directory (create if missing)
- Date/time helpers: Current pattern uses Python `datetime` inline
- String formatting: Current pattern uses f-strings and `.format()`
- File operations: Use `os.path` for safe path handling

## Special Directories

**`maintenance_bot/reportes/`:**
- Purpose: Generated PDFs and temporary images
- Generated: Yes (created at runtime by `generate_report()`)
- Committed: No (in .gitignore)
- Content: `tmp_{session_id}_antes.jpg`, `tmp_{session_id}_desp.jpg`, `Reporte_*.pdf`
- Cleanup: Automatic for temp files; PDFs manually deleted

**`maintenance_bot/__pycache__/`:**
- Purpose: Python bytecode cache
- Generated: Yes (by Python interpreter)
- Committed: No (in .gitignore)

**`.github/workflows/`:**
- Purpose: GitHub Actions automation
- Committed: Yes
- Modifiable: Yes, but requires repo permissions
- Current workflows: 30-min uptime monitor, monthly report generation

**`docs/` and `docs/archive/`:**
- Purpose: Documentation and historical records
- Committed: Yes
- Content: Markdown guides, diagrams, previous architectural notes
- Archive: Old versions stored for reference

**`.env` in `maintenance_bot/`:**
- Purpose: Local environment configuration
- Generated: No (manual creation from `.env.example`)
- Committed: No (gitignored, contains secrets)
- Required vars: TELEGRAM_TOKEN, ALLOWED_USERS, WF_REPORT_TOKEN

**`.venv/`:**
- Purpose: Python virtual environment
- Generated: Yes (by `python -m venv`)
- Committed: No (gitignored)
- Usage: `source .venv/bin/activate` (macOS/Linux) or `.venv\Scripts\activate` (Windows)

---

*Structure analysis: 2026-03-23*
