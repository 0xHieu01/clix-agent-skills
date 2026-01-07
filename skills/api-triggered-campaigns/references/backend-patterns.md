# Backend Implementation Patterns

This reference focuses on production-safe backend triggering:

- auth
- timeouts
- retries
- dedupe
- logging

## Recommended wrapper shape

Implement a single function in your backend (service/module) that all call sites
use:

- input: `campaign_id`, `audience`, `properties`, `correlation_id`
- output: `trigger_id` (or structured error)

Centralizing this wrapper ensures consistent auth, timeouts, and error handling.

## Secrets + configuration

- Store secrets in your secret manager (or env vars on the server).
- Use different keys per environment (dev/staging/prod).
- Never send `X-Clix-API-Key` to mobile/web clients.

Required environment variables (suggested names):

- `CLIX_PROJECT_ID`
- `CLIX_API_KEY`

## Timeouts

Always set a client-side timeout (example: 3–10 seconds). The API is “send-like”
and should not block core request handling indefinitely.

## Retries (safe defaults)

Retry only when it’s plausibly transient:

- network errors / timeouts
- `5xx` responses

Do **not** retry blindly on `4xx` (usually contract/auth issues).

Use exponential backoff and cap total retry time.

## Dedupe (prevent double-sends)

Typical causes of duplicates:

- message triggered by at-least-once job processing
- retries at the application layer
- replays after partial failures

Best practice:

- Define a stable dedupe key (e.g., `order_id + campaign_id`).
- Store it for a short TTL (e.g., 24h) in Redis/DB to prevent re-sends.

## Logging + observability

Log:

- `campaign_id`
- your correlation id (order id / ticket id)
- `audience` mode (broadcast/targets)
- Clix response `trigger_id` on success
- HTTP status + response body on failures (redact secrets)

## Payload conventions

- Prefer snake_case keys in `properties`.
- Prefer primitives.
- Pre-format display values (currency, duration, timestamps) if you want
  consistent rendering.
- Avoid free-text PII by default.

## Examples

See:

- `examples/trigger-campaign-node.js`
- `examples/trigger-campaign-python.py`
