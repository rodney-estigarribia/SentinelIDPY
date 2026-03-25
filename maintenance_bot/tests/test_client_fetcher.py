import pytest
from maintenance_bot.client_fetcher import ClientDataFetcher


class TestExtractMetrics:
    """Tests for ClientDataFetcher.extract_metrics() static method."""

    def test_normal_data(self):
        """Full valid response with all fields present."""
        data = {
            'metricas': {
                'nb_visits': 1250,
                'nb_uniq_visitors': 870,
                'nb_actions': 3400,
                'avg_time_on_site': 185,
                'bounce_rate': '42.5%',
                'top_pages': [
                    {'label': '/home', 'nb_visits': 500, 'nb_hits': 600},
                    {'label': '/about', 'nb_visits': 300, 'nb_hits': 350},
                    {'label': '/contact', 'nb_visits': 200, 'nb_hits': 250},
                ],
            }
        }
        result = ClientDataFetcher.extract_metrics(data)
        assert result['nb_visits'] == 1250
        assert result['nb_uniq_visitors'] == 870
        assert result['nb_actions'] == 3400
        assert result['avg_time_on_site'] == 185
        assert result['bounce_rate'] == 42.5
        assert len(result['top_pages']) == 3

    def test_no_metricas_key(self):
        """Response without 'metricas' key returns None."""
        assert ClientDataFetcher.extract_metrics({}) is None
        assert ClientDataFetcher.extract_metrics({'other': 'data'}) is None

    def test_none_metricas(self):
        """'metricas' key is None returns None."""
        assert ClientDataFetcher.extract_metrics({'metricas': None}) is None

    def test_empty_metricas(self):
        """'metricas' key is empty dict returns None (falsy)."""
        assert ClientDataFetcher.extract_metrics({'metricas': {}}) is None

    def test_bounce_rate_string_with_percent(self):
        """bounce_rate as '45%' string."""
        data = {'metricas': {'bounce_rate': '45%'}}
        result = ClientDataFetcher.extract_metrics(data)
        assert result['bounce_rate'] == 45.0

    def test_bounce_rate_numeric(self):
        """bounce_rate as float (no string conversion needed)."""
        data = {'metricas': {'bounce_rate': 42.5}}
        result = ClientDataFetcher.extract_metrics(data)
        assert result['bounce_rate'] == 42.5

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

    def test_missing_fields_use_defaults(self):
        """Missing individual fields should use sensible defaults."""
        data = {'metricas': {'nb_visits': 100}}  # only one field
        result = ClientDataFetcher.extract_metrics(data)
        assert result['nb_visits'] == 100
        assert result['nb_uniq_visitors'] == 0
        assert result['nb_actions'] == 0
        assert result['avg_time_on_site'] == 0
        assert result['bounce_rate'] == 0.0
        assert result['top_pages'] == []

    def test_top_pages_truncated_to_3(self):
        """More than 3 top_pages should be sliced to 3."""
        pages = [{'label': f'/p{i}', 'nb_visits': i, 'nb_hits': i} for i in range(10)]
        data = {'metricas': {'top_pages': pages}}
        result = ClientDataFetcher.extract_metrics(data)
        assert len(result['top_pages']) == 3

    def test_bounce_rate_zero_string(self):
        """bounce_rate as '0%'."""
        data = {'metricas': {'bounce_rate': '0%'}}
        result = ClientDataFetcher.extract_metrics(data)
        assert result['bounce_rate'] == 0.0
