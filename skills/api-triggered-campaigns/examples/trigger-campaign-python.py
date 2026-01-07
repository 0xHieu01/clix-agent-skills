"""
Minimal Python example: trigger an API-triggered campaign.

Requirements:
  pip install requests
Env vars:
  - CLIX_PROJECT_ID
  - CLIX_API_KEY
"""

import json
import os
import sys
from typing import Any, Dict

import requests


def trigger_campaign(*, campaign_id: str, audience: Dict[str, Any], properties: Dict[str, Any]) -> Dict[str, Any]:
    project_id = os.environ.get("CLIX_PROJECT_ID")
    api_key = os.environ.get("CLIX_API_KEY")
    if not project_id or not api_key:
        raise RuntimeError("Missing CLIX_PROJECT_ID or CLIX_API_KEY")

    url = f"https://api.clix.so/api/v1/campaigns/{campaign_id}:trigger"
    res = requests.post(
        url,
        headers={
            "X-Clix-Project-ID": project_id,
            "X-Clix-API-Key": api_key,
            "Content-Type": "application/json",
        },
        json={"audience": audience, "properties": properties},
        timeout=10,
    )
    if res.status_code >= 400:
        raise RuntimeError(f"Clix trigger failed ({res.status_code}): {res.text}")
    return res.json()


def main() -> int:
    out = trigger_campaign(
        campaign_id="019aa002-1d0e-7407-a0c5-5bfa8dd2be30",  # replace
        audience={"broadcast": True},
        properties={
            "store_location": "San Francisco",
            "order_id": "ORD-12345",
            "item_count": 3,
            "pickup_time": "2:30 PM",
        },
    )
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())

