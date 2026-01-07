/**
 * Minimal Node.js example: trigger an API-triggered campaign.
 *
 * Requirements:
 * - Node 18+ (fetch is available) OR replace with your HTTP client
 * - Env vars:
 *   - CLIX_PROJECT_ID
 *   - CLIX_API_KEY
 */

const CLIX_PROJECT_ID = process.env.CLIX_PROJECT_ID;
const CLIX_API_KEY = process.env.CLIX_API_KEY;

if (!CLIX_PROJECT_ID || !CLIX_API_KEY) {
  throw new Error("Missing CLIX_PROJECT_ID or CLIX_API_KEY");
}

async function triggerCampaign({ campaignId, audience, properties }) {
  const url = `https://api.clix.so/api/v1/campaigns/${campaignId}:trigger`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Clix-Project-ID": CLIX_PROJECT_ID,
      "X-Clix-API-Key": CLIX_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audience,
      properties,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Clix trigger failed (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

// Example usage
async function main() {
  const campaignId = "019aa002-1d0e-7407-a0c5-5bfa8dd2be30"; // replace

  const payload = {
    audience: { broadcast: true },
    properties: {
      store_location: "San Francisco",
      order_id: "ORD-12345",
      item_count: 3,
      pickup_time: "2:30 PM",
    },
  };

  const out = await triggerCampaign({ campaignId, ...payload });
  console.log(out); // { trigger_id: "..." }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
