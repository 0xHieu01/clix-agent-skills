# Trigger Campaign API (Contract)

This reference documents the backend API call used to trigger an API-triggered
campaign.

## Endpoint

```
POST https://api.clix.so/api/v1/campaigns/{campaign_id}:trigger
```

## Authentication headers (required)

- `X-Clix-Project-ID`: your project id
- `X-Clix-API-Key`: your **secret** API key (treat as a secret; never ship to
  clients)
- `Content-Type: application/json`

## Request body

Top-level:

- `audience` (optional): targeting for this trigger
- `properties` (optional): key-value map used for both audience +
  personalization

### Audience object

- `broadcast` (boolean, optional): when true, send to all users eligible under
  the campaign’s segment definition (ignores `targets`)
- `targets` (array, optional): specific recipients to narrow to (still filtered
  by the campaign’s segment definition)

### Target object

Each target should specify **exactly one**:

- `project_user_id` (string)
- `device_id` (string)

## Properties (`trigger.*`)

All keys in `properties` are available as `trigger.<key>` in:

- **Audience rules** (dynamic filters):
  `store_location == {{ trigger.store_location }}`
- **Templates** (title/body/subtitle/deep links):
  `Order #{{ trigger.order_id }}`

Best practices:

- Use **snake_case** keys.
- Prefer **primitives** (string/number/boolean). Pre-format for display (e.g.,
  send `"$29.99"` rather than `2999` if you want formatted output).
- Avoid PII by default (email, phone, free-text entered by users).

## Responses

### 200 OK

Returns a trigger identifier:

```json
{ "trigger_id": "5dbdd10e-6ea6-4ff7-836d-bd30a6d1a521" }
```

### 400 Bad Request

Common causes:

- missing/invalid `campaign_id`
- malformed JSON body
- campaign isn’t configured as API-triggered

### 401 Unauthorized

Common causes:

- missing/invalid `X-Clix-Project-ID` or `X-Clix-API-Key`

## Operational notes

- Delivery is asynchronous; the API returns quickly with `trigger_id`.
- Segment filtering is always applied:
  - `broadcast=true`: sends to all users matching segment
  - `targets=[...]`: sends only to targets who also match segment
