# Testing Patterns

**Analysis Date:** 2026-03-23

## Test Framework

**Runner:**
- pytest (inferred from `.pytest_cache` directory)
- Tests located in `maintenance_bot/tests/` directory

**Assertion Library:**
- pytest built-in assertions (standard `assert` statements)

**Run Commands:**
```bash
pytest maintenance_bot/tests/              # Run all tests
pytest maintenance_bot/tests/ -v           # Verbose output (inferred)
pytest maintenance_bot/tests/ --tb=short   # Show tracebacks (inferred)
```

**Dependencies:**
- pytest installed in venv (evidenced by `.pytest_cache/`)
- No explicit `pytest.ini` or `setup.cfg` with pytest config found
- Tests run via standard `pytest` discovery (test files named `test_*.py`)

## Test File Organization

**Location:**
- Dedicated `maintenance_bot/tests/` directory alongside source code
- Separate from source but same module level as handlers

**Naming:**
- Test files use `test_` prefix: `test_client_fetcher.py`, `test_connection.py`
- Test classes use `Test` prefix: `class TestExtractMetrics`
- Test methods use `test_` prefix: `test_normal_data()`, `test_bounce_rate_string_with_percent()`

**Structure:**
```
maintenance_bot/
├── tests/
│   ├── __init__.py          # Empty init file
│   └── test_client_fetcher.py
├── client_fetcher.py
├── main.py
└── [other modules]
```

## Test Types

**Unit Tests:**
- Focus: `ClientDataFetcher.extract_metrics()` static method
- Scope: Tests data normalization and extraction logic in isolation
- Location: `maintenance_bot/tests/test_client_fetcher.py`
- Approach: Class-based organization by feature (`TestExtractMetrics`)

**Integration Tests:**
- Not formally implemented
- Manual testing via `test_connection.py` script (standalone debug utility, not part of test suite)
- Debug script tests full endpoint with real HTTP requests

**E2E Tests:**
- Not implemented
- Telegram bot handlers tested manually via actual bot interaction
- No automated UI/workflow testing

## Test Structure

**Suite Organization:**
```python
class TestExtractMetrics:
    """Tests for ClientDataFetcher.extract_metrics() static method."""

    def test_normal_data(self):
        """Full valid response with all fields present."""
        data = {...}
        result = ClientDataFetcher.extract_metrics(data)
        assert result['nb_visits'] == 1250
```

**Patterns:**
- Single `describe` block per class focusing on one method
- Descriptive docstrings for each test explaining the scenario
- Test data embedded inline (not using fixtures/factories)
- Direct method call testing: `ClientDataFetcher.extract_metrics(data)`

**Assertion Style:**
```python
assert result['bounce_rate'] == 42.5
assert len(result['top_pages']) == 3
assert result is None
```

**Setup/Teardown:**
- No explicit setup/teardown found
- Test data created inline within each test method
- No shared fixtures or test factories

## Coverage

**Requirements:** None enforced (no coverage config found)

**Current Coverage:**
- `ClientDataFetcher.extract_metrics()`: Well-covered with 12+ test cases
- Other modules: Minimal to no automated test coverage

**Untested Areas:**
- `main.py`: All async Telegram handlers (no unit tests)
- `ai_handler.py`: No tests (depends on external Ollama service)
- `html_pdf_generator.py`: No tests (complex HTML/PDF generation logic)
- `recommendation_engine.py`: No tests (though has `__main__` test code)
- `client_fetcher.py`: Only `extract_metrics()` tested; other methods like `fetch_all_data()`, `obtener_dias_ssl()` not tested
- WordPress plugin: No automated tests (PHP testing not integrated)

## Mocking

**Framework:** None detected in current tests

**Current Approach:**
- No mocks used in existing tests
- Tests use real data objects, not mocked dependencies
- External dependencies (HTTP, SSL, Ollama) not mocked

**What Should Be Mocked:**
- HTTP requests in `fetch_all_data()` and `obtain_dias_ssl()`
- Ollama API calls in `AIHandler`
- WordPress REST endpoints
- File I/O operations (photo downloads, PDF generation)
- Telegram API interactions

## Test Examples

### Client Data Extraction

**Location:** `maintenance_bot/tests/test_client_fetcher.py`

**Test Pattern - Normalization:**
```python
def test_bounce_rate_string_with_percent(self):
    """bounce_rate as '45%' string."""
    data = {'metricas': {'bounce_rate': '45%'}}
    result = ClientDataFetcher.extract_metrics(data)
    assert result['bounce_rate'] == 45.0
```

**Test Pattern - Edge Cases:**
```python
def test_bounce_rate_empty_string(self):
    """bounce_rate as '' should default to 0."""
    data = {'metricas': {'bounce_rate': ''}}
    result = ClientDataFetcher.extract_metrics(data)
    assert result['bounce_rate'] == 0.0

def test_bounce_rate_just_percent(self):
    """bounce_rate as '%' should default to 0."""
    data = {'metricas': {'bounce_rate': '%'}}
    result = ClientDataFetcher.extract_metrics(data)
    assert result['bounce_rate'] == 0.0
```

**Test Pattern - Missing Data:**
```python
def test_missing_fields_use_defaults(self):
    """Missing individual fields should use sensible defaults."""
    data = {'metricas': {'nb_visits': 100}}  # only one field
    result = ClientDataFetcher.extract_metrics(data)
    assert result['nb_visits'] == 100
    assert result['nb_uniq_visitors'] == 0
    assert result['bounce_rate'] == 0.0
```

**Test Pattern - Array Truncation:**
```python
def test_top_pages_truncated_to_3(self):
    """More than 3 top_pages should be sliced to 3."""
    pages = [{'label': f'/p{i}', 'nb_visits': i, 'nb_hits': i} for i in range(10)]
    data = {'metricas': {'top_pages': pages}}
    result = ClientDataFetcher.extract_metrics(data)
    assert len(result['top_pages']) == 3
```

## Testing Gaps

**Priority 1 - Async Handlers:**
- All Telegram conversation handlers in `main.py` untested
- Recommendations: Use `pytest-asyncio` and mock `Update`, `ContextTypes`
- Test scenarios: client selection, text processing, image handling, state transitions

**Priority 2 - Data Fetching:**
- `ClientDataFetcher.fetch_all_data()` and `obtener_dias_ssl()` not unit tested
- Recommendations: Mock `requests` library with `pytest-httpserver` or `responses`
- Test scenarios: success, timeout, connection error, invalid SSL

**Priority 3 - AI Integration:**
- `AIHandler` methods not tested
- Recommendations: Mock Ollama API responses
- Test scenarios: successful prompt, timeout, malformed response, fallback behavior

**Priority 4 - PDF Generation:**
- `HTMLPDFGenerator.generate()` not tested
- Recommendations: Test HTML generation logic separately from PDF rendering
- Test scenarios: with/without infrastructure data, missing metrics, image failures

**Priority 5 - Recommendation Engine:**
- Logic in `RecommendationEngine` not formally tested (has `__main__` code but not pytest tests)
- Recommendations: Move `__main__` test code to proper test file
- Test scenarios: mobile bounce > 50%, high exit rate, high general bounce, no conversions

## Debug Utilities

**`test_connection.py`:**
- Not part of pytest suite
- Standalone script for manual testing HTTP endpoint
- Usage: `python test_connection.py` after setting environment variables
- Tests: Full endpoint response, token validation, infrastructure data extraction
- Useful for debugging Docker/network issues

**`recommendation_engine.py` `__main__`:**
- Mock data testing built into module
- Tests: recommendation generation, financial summary, text formatting
- Usage: `python -m recommendation_engine`
- Not integrated into test suite

**`ai_handler.py` `__main__`:**
- Simple test of `improve_text()` with Ollama
- Usage: `python ai_handler.py` with Ollama running on localhost
- Not integrated into test suite

## Documentation

**Docstrings:**
- Class docstrings present: `"""Consulta datos de infraestructura y almacenamiento desde los clientes."""`
- Method docstrings used for public methods: `"""Extrae y normaliza metricas de Matomo del response."""`
- Test method docstrings explain scenario: `"""bounce_rate as '45%' string."""`
- Function docstrings in WordPress plugin

**Test Documentation:**
- Each test method has docstring explaining what's being tested
- Examples show data format and expected behavior
- Good for understanding test intent without reading assertions

## Continuous Integration

**CI/CD:** Not detected (no `.github/workflows`, `.gitlab-ci.yml`, `jenkins`, etc.)

**Recommendations for Future:**
- Add GitHub Actions workflow to run pytest on push
- Run tests against multiple Python versions (3.9+)
- Integrate coverage reporting
- Fail CI if coverage drops below threshold

---

*Testing analysis: 2026-03-23*
