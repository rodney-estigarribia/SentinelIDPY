# Technology Stack

**Analysis Date:** 2026-03-23

## Languages

**Primary:**
- Python 3.11 - Core bot logic, PDF generation, analytics processing
- PHP 7.4+ - WordPress plugin for metrics extraction via REST API
- HTML/CSS - PDF template rendering with WeasyPrint

## Runtime

**Environment:**
- Python 3.11 (slim Docker image from `python:3.11-slim`)
- WordPress with REST API enabled

**Package Manager:**
- pip - Python dependency management
- Lockfile: `requirements.txt` present (no lock-only file, versions pinned)

## Frameworks

**Core:**
- python-telegram-bot 20.8 - Telegram bot framework with job-queue
- WeasyPrint 68.0+ - HTML/CSS to PDF conversion
- Ollama (external) - Local LLM for text improvement (qwen2.5-coder:1.5b model)

**PDF & Reporting:**
- fpdf2 2.8.2 - PDF generation library (primary in root requirements)
- weasyprint 68.0 - HTML/CSS template-based PDF rendering (maintenance_bot)
- Pillow 10.2.0 - Image processing and compression (WEBP conversion)

**HTTP & Data:**
- requests 2.31.0/2.32.3 - HTTP client for WordPress REST API calls

**Development & Testing:**
- pytest 7.0+ - Test framework (specified in maintenance_bot/requirements.txt)

**Utilities:**
- python-dotenv 1.0.1 - Environment variable management

## Key Dependencies

**Critical:**
- requests 2.31.0/2.32.3 - Fetches infrastructure/metrics data from WordPress endpoints
- weasyprint 68.0 - Renders templated PDFs with inline HTML/CSS
- python-telegram-bot 20.8 - Bot application runtime with job queue support
- Pillow 10.2.0 - Optimizes before/after images to WEBP format

**Infrastructure:**
- fpdf2 2.8.2 - Fallback PDF generation (legacy, available)
- Ollama (external service) - Local LLM inference, default endpoint: `http://host.docker.internal:11434/api/generate`

## Configuration

**Environment Variables:**
- `TELEGRAM_TOKEN` - Bot API token (required, causes startup failure if missing)
- `ALLOWED_USERS` - Comma-separated user IDs for whitelist (e.g., "12345,67890")
- `WF_REPORT_TOKEN` - Security token for WordPress REST endpoint authentication (min 32 chars, matches `sentinel_idpy_report_token` WordPress option)

**Runtime Configuration:**
- `clientes.json` - Client configuration (URLs and names for bot selection)
- `.env.example` - Template for environment variables

## Platform Requirements

**Development:**
- Docker 20.10+ (optional, for containerized deployment)
- Docker Compose 1.29+ (for orchestration)
- Python 3.11+ with pip

**Production:**
- Docker container with:
  - Volumes: `./reportes` (persistent report storage), `./clientes.json` (client config)
  - Network: `host.docker.internal` alias for Ollama/WordPress access
  - Environment: All required env vars passed via docker-compose
- WordPress installation (for sentinel-idpy-connector.php plugin)
- Ollama instance (optional, for text improvement via AI)
- Telegram Bot API (requires internet connectivity)

**System Dependencies (in Dockerfile):**
- libjpeg-dev - Image processing
- zlib1g-dev - Compression library for images

---

*Stack analysis: 2026-03-23*
