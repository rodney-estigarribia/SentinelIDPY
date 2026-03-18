#!/usr/bin/env python3
"""Debug script to test the infrastructure data fetching."""
import os
import requests
import json
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

WF_REPORT_TOKEN = os.getenv("WF_REPORT_TOKEN", "your_token_here")

def test_fetch(client_url):
    """Test fetching infrastructure data from a client."""
    endpoint = f"{client_url}/wp-json/sentinel/v1/stats"
    headers = {
        'User-Agent': 'SentinelIDPY-MaintenanceBot/1.0',
        'X-WF-Report-Token': WF_REPORT_TOKEN
    }

    print(f"\n{'='*60}")
    print(f"Testing endpoint: {endpoint}")
    print(f"Token: {WF_REPORT_TOKEN[:10]}...")
    print(f"{'='*60}\n")

    try:
        response = requests.get(endpoint, headers=headers, timeout=15, verify=False)
        print(f"✓ Status Code: {response.status_code}")
        print(f"✓ Response Headers: {dict(response.headers)}")

        data = response.json()
        print(f"\n✓ Full Response:\n{json.dumps(data, indent=2)}")

        infra_data = data.get('infrastructure', {})
        print(f"\n✓ Infrastructure Data:\n{json.dumps(infra_data, indent=2)}")

        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Test with a sample client URL (replace with your actual client URL)
    test_url = "http://localhost:8080"  # Example, replace with actual URL
    test_fetch(test_url)
