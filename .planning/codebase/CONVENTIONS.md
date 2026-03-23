# Coding Conventions

**Analysis Date:** 2026-03-23

## Naming Patterns

**Files:**
- Snake case for Python modules: `client_fetcher.py`, `recommendation_engine.py`, `ai_handler.py`, `html_pdf_generator.py`
- PascalCase for PHP plugins: `sentinel-idpy-connector.php` (hyphenated for readability)
- Test files use `test_` prefix: `test_client_fetcher.py`, `test_connection.py`

**Functions:**
- Snake case for all functions: `load_clients()`, `fetch_all_data()`, `extract_metrics()`, `obtener_dias_ssl()`
- Async functions use `async def` prefix: `async def start()`, `async def generate_report()`
- Private helper functions use underscore prefix: `_get_mobile_bounce()`, `_get_top_exit()`, `_build_health_cards()`
- Telegram handler functions follow pattern: `handle_photo_antes()`, `process_bitacora()`, `skip_hoja_de_ruta()`

**Variables:**
- Snake case for all variables: `client_id`, `raw_text`, `ssl_days`, `infra_data`, `metrics_data`
- Context state stored in `context.user_data` dict with snake_case keys: `context.user_data['client']`, `context.user_data['infrastructure_data']`
- Environment variables in UPPER_CASE: `TELEGRAM_TOKEN`, `ALLOWED_USERS`, `WF_REPORT_TOKEN`
- Constants in UPPER_CASE: `CLIENTS_FILE`, `TOKEN`, `TEMPLATE_DIR`, `MESES`

**Types:**
- Type hints used in function signatures: `def fetch_all_data(client_url: str) -> dict:`
- Method return types documented: `-> dict`, `-> str`, `-> int`, `-> None`, `-> list`

**Classes:**
- PascalCase for all classes: `ClientDataFetcher`, `AIHandler`, `RecommendationEngine`, `HTMLPDFGenerator`
- Static methods used extensively for utility classes that are not meant to be instantiated

## Code Style

**Formatting:**
- 4-space indentation (Python default)
- Line breaks after imports before code
- Blank lines separate logical sections
- Multi-line dicts/lists aligned for readability

**Linting:**
- No explicit linting configuration detected
- Code follows PEP 8 conventions informally
- No automated formatter configured (no `.prettierrc`, no `eslint` config)

**Comments:**
- Minimal inline comments; code is self-documenting
- Section headers use visual separators: `# ─── SECTION BUILDERS ─────────────────────────────────────────` (in `html_pdf_generator.py`)
- Inline comments explain non-obvious intent, not what code does

## Import Organization

**Order:**
1. Standard library imports: `os`, `json`, `logging`, `asyncio`, `uuid`, `datetime`
2. Third-party imports: `requests`, `telegram.*`, `weasyprint`
3. Local imports: `from ai_handler import AIHandler`, `from client_fetcher import ClientDataFetcher`

**Path Aliases:**
- No path aliases configured; relative imports used for co-located modules
- Example from `main.py`: `from ai_handler import AIHandler` (same directory)

## Error Handling

**Patterns:**
- Try/except with specific exception types: `requests.exceptions.RequestException`, `json.JSONDecodeError`, `socket.timeout`, `socket.gaierror`
- Broad `Exception` catch used as fallback in critical operations with logging: `except Exception as e: logger.error(f"...")`
- SSL/socket errors handled separately from general request errors: distinct error paths for timeouts, DNS failures
- Handlers return original data or safe defaults on error: returns `raw_text`, empty dict `{}`, `None`
- Critical operations wrapped in try/finally for cleanup: `finally: os.remove(path)` in `generate_report()`

**Error Logging:**
- All errors logged with context: `logger.error(f"Error consultando {client_url}: {e}")`
- Warnings used for non-critical issues: `logger.warning(f"...")`
- Debug info at key decision points: `logger.info(f"...")`

## Logging

**Framework:** `logging` (Python standard library)

**Configuration:**
- Root logger configured in `main.py`: `logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)`
- Module-level loggers: `logger = logging.getLogger(__name__)` in each file
- INFO level for informational messages, WARNING for issues, ERROR for failures

**Patterns:**
- Log at function entry/exit for async handlers: `logger.info(f"Infrastructure: {infra_data}, Metrics: {metrics_data}, SSL: {ssl_days}")`
- Log before API calls: `logger.info(f"Fetching data from: {endpoint}")`
- Log response codes and data keys: `logger.info(f"Response status code: {response.status_code}")`, `logger.info(f"Data keys received: {list(data.keys())}")`
- Log token validity separately from errors: `error_log()` in PHP; Python uses standard logger
- Security-relevant events logged: token mismatches, failed auth attempts

## Function Design

**Size:**
- Functions are concise, typically 5-25 lines
- Async handlers in Telegram bot are longer (30-60 lines) due to state management complexity

**Parameters:**
- Telegram handlers accept `(update: Update, context: ContextTypes.DEFAULT_TYPE)` signature consistently
- Static methods accept parameters without `self`
- Optional parameters use `None` defaults: `infra_data=None`, `ssl_days=None`

**Return Values:**
- Methods return structured dicts for complex data: `extract_metrics()` returns normalized metrics dict
- Methods return `None` for "not found" cases: `obtener_dias_ssl()`, `extract_metrics()`
- Async handlers return conversation state (integer constant) or `ConversationHandler.END`
- Chainable data: `ClientDataFetcher.fetch_all_data()` → extract methods work on returned dict

## Module Design

**Exports:**
- Class-based modules export single class: `ClientDataFetcher`, `AIHandler`, `RecommendationEngine`
- `main.py` is entry point with conditional execution: `if __name__ == "__main__": main()`
- Test modules can be executed: `if __name__ == "__main__":` with test data in `recommendation_engine.py`, `ai_handler.py`

**Class Organization:**
- Static method grouping for utility classes: `ClientDataFetcher` and `RecommendationEngine` use only `@staticmethod`
- Instance methods used for stateful classes: `AIHandler` stores `api_url` and `model`, `HTMLPDFGenerator` stores all report data
- Private methods prefixed with underscore: `_build_health_cards()`, `_build_metrics_section()` in `HTMLPDFGenerator`

## Security Patterns

**Token Validation:**
- Tokens passed via headers and query params: `'X-WF-Report-Token': WF_REPORT_TOKEN` and `'token': WF_REPORT_TOKEN`
- Minimum token length enforced: 32 characters (in WordPress plugin)
- Tokens stored in environment variables, not hardcoded
- Input sanitization in WordPress: `sanitize_text_field()`, `esc_attr()`, `esc_html__()`

**Path Safety:**
- Client names sanitized before file operations: `"".join(c for c in client['nombre'] if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')`
- Prevents Path Traversal attacks when creating PDF filenames
- File operations use full paths, not user-controlled strings

**Request Limits:**
- Character limits enforced on user input: max 1500 characters for bitacora and roadmap notes
- Timeout set on HTTP requests: `timeout=15` seconds
- SSL verification disabled for Docker self-signed certs: `verify=False` in requests

## Async Pattern

**Concurrency:**
- Blocking operations run in executor: `await loop.run_in_executor(None, ClientDataFetcher.fetch_all_data, client['url'])`
- Allows non-blocking Telegram UI while fetching data, calling AI, generating PDFs
- Used for: data fetching, AI processing, PDF generation, SSL checks

## Data Normalization

**Pattern:**
- External data normalized on extraction: `ClientDataFetcher.extract_metrics()` handles string/numeric bounce_rate conversion
- Percentage strings converted to floats: `'45%'` → `45.0`
- Empty/invalid values default to 0: `float(bounce_raw.replace('%', '').strip() or 0)`
- Type consistency enforced: all bounce_rate values become `float` regardless of input format

---

*Convention analysis: 2026-03-23*
