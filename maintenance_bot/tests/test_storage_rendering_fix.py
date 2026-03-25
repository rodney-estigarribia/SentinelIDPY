"""
Test to validate the storage data rendering fix.

The bug: When API fetch fails, it returned empty dict {}, which was treated
as falsy by "if not self.infra_data", causing storage section to not render.

The fix: Return None on API failure, and explicitly check "if self.infra_data is None"
"""

import pytest
from html_pdf_generator import HTMLPDFGenerator


class TestStorageRendering:
    """Tests for storage section rendering with different infra_data states."""

    def test_storage_renders_with_valid_data(self):
        """Storage section should render when infra_data is valid dict with values."""
        infra_data = {
            'disk_total_gb': 100.0,
            'disk_used_gb': 50.0,
            'disk_used_percentage': 50,
            'wp_version': '6.0',
            'php_version': '8.1'
        }
        gen = HTMLPDFGenerator(
            "TestClient",
            "Test text",
            infra_data=infra_data
        )
        storage_section = gen._build_storage_section()
        assert storage_section != ""
        assert "Almacenamiento del Servidor" in storage_section
        assert "50.0 GB usados de 100.0 GB totales (50%)" in storage_section

    def test_storage_skipped_with_none_data(self):
        """Storage section should skip when infra_data is None (API failed)."""
        gen = HTMLPDFGenerator(
            "TestClient",
            "Test text",
            infra_data=None  # Simulates API failure returning None
        )
        storage_section = gen._build_storage_section()
        assert storage_section == ""

    def test_storage_skipped_with_zero_disk_total(self):
        """Storage section should skip when disk_total_gb is 0."""
        infra_data = {
            'disk_total_gb': 0,  # No disk info available
            'disk_used_gb': 0,
            'disk_used_percentage': 0
        }
        gen = HTMLPDFGenerator(
            "TestClient",
            "Test text",
            infra_data=infra_data
        )
        storage_section = gen._build_storage_section()
        assert storage_section == ""

    def test_storage_skipped_with_missing_disk_total(self):
        """Storage section should skip when disk_total_gb key is missing."""
        infra_data = {
            'disk_used_gb': 50.0,
            'disk_used_percentage': 50
            # disk_total_gb is missing
        }
        gen = HTMLPDFGenerator(
            "TestClient",
            "Test text",
            infra_data=infra_data
        )
        storage_section = gen._build_storage_section()
        assert storage_section == ""

    def test_storage_warning_status_when_high_usage(self):
        """Storage section should show warning when usage >= 80%."""
        infra_data = {
            'disk_total_gb': 100.0,
            'disk_used_gb': 85.0,
            'disk_used_percentage': 85,
        }
        gen = HTMLPDFGenerator(
            "TestClient",
            "Test text",
            infra_data=infra_data
        )
        storage_section = gen._build_storage_section()
        assert "Tu espacio en disco está llegando al límite." in storage_section

    def test_storage_good_status_when_low_usage(self):
        """Storage section should show good status when usage < 80%."""
        infra_data = {
            'disk_total_gb': 100.0,
            'disk_used_gb': 50.0,
            'disk_used_percentage': 50,
        }
        gen = HTMLPDFGenerator(
            "TestClient",
            "Test text",
            infra_data=infra_data
        )
        storage_section = gen._build_storage_section()
        assert "Contás con muy buen espacio disponible." in storage_section

    def test_maintenance_skipped_with_none_infra(self):
        """Maintenance section should skip when both maintenance_data and infra_data are None/empty."""
        gen = HTMLPDFGenerator(
            "TestClient",
            "Test text",
            infra_data=None,  # None after API failure
            maintenance_data=None
        )
        maintenance_section = gen._build_maintenance_section()
        assert maintenance_section == ""

    def test_maintenance_renders_with_valid_infra(self):
        """Maintenance section should render when infra_data has version info."""
        infra_data = {
            'wp_version': '6.0',
            'php_version': '8.1'
        }
        maintenance_data = {
            'recent_updates': [
                {'name': 'Plugin A', 'version': '1.0'},
            ]
        }
        gen = HTMLPDFGenerator(
            "TestClient",
            "Test text",
            infra_data=infra_data,
            maintenance_data=maintenance_data
        )
        maintenance_section = gen._build_maintenance_section()
        assert maintenance_section != ""
        assert "WordPress 6.0" in maintenance_section
        assert "PHP 8.1" in maintenance_section


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
