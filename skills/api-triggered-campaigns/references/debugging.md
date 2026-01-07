# Debugging API-Triggered Campaigns

Use this checklist when you triggered the API but users didn’t receive messages
or templates rendered incorrectly.

## 1) Confirm the campaign type and ID

- Campaign is configured as **API-Triggered**
- `campaign_id` in your backend call matches the console campaign

## 2) Confirm auth headers

- `X-Clix-Project-ID` is correct for the environment
- `X-Clix-API-Key` is a valid **secret** key for that project
- You are calling the correct base URL: `https://api.clix.so`

If you see `401`, fix credentials first.

## 3) Segment filtering is always applied

Even with `broadcast=true`, only users matching the campaign’s segment
definition are eligible.

If you use `targets`, targeted users must still match the segment rules.

## 4) Dynamic filters require exact keys

If your audience rules reference `{{ trigger.store_location }}`, then your API
call must include:

```json
{ "properties": { "store_location": "..." } }
```

Common failures:

- key mismatch: `storeLocation` vs `store_location`
- missing property
- property value type mismatch (string vs number)

## 5) Template rendering issues

Check Message Logs in the console for:

- missing variables
- syntax errors in templates
- unexpected empty strings

Fix approach:

- add `default` filters
- add minimal guards for optional blocks
- pre-format values in backend

## 6) API errors

- `400`: invalid/missing campaign id, malformed JSON, or campaign not
  triggerable
- `5xx`: transient server error (retry with backoff)

## 7) Rate limits and retry storms

If you trigger from high-volume workflows:

- throttle upstream events
- dedupe sends
- add backoff on retries

## 8) Minimal “known-good” test

Trigger once with:

- `broadcast=true`
- a single dynamic filter key with a known-matching value
- minimal properties used in template

Then expand gradually (more properties, more audience constraints).
