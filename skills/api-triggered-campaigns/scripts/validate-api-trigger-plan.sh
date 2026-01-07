#!/usr/bin/env bash
#
# Validate a Clix API-triggered campaign plan (api-trigger-plan.json).
#
# Usage:
#   bash skills/api-triggered-campaigns/scripts/validate-api-trigger-plan.sh path/to/api-trigger-plan.json
#
# What it validates:
# - JSON is valid
# - campaign_id is present (string)
# - dynamic_filter_keys is an array of <= 3 snake_case keys
# - properties is a non-empty object with snake_case keys
# - each property spec has a valid type and optional required/example/pii fields
# - example value matches declared type (basic check)
# - audience.mode is one of: broadcast | targets | default
# - if audience.mode == targets: targets is a non-empty array and each entry has exactly one identifier (project_user_id or device_id)
#
set -euo pipefail

plan_path="${1:-}"
if [[ -z "$plan_path" ]]; then
  echo "Usage: bash skills/api-triggered-campaigns/scripts/validate-api-trigger-plan.sh path/to/api-trigger-plan.json" >&2
  exit 2
fi

if [[ ! -f "$plan_path" ]]; then
  echo "Error: file not found: $plan_path" >&2
  exit 2
fi

validate_with_python() {
  python3 - "$plan_path" <<'PY'
import json
import re
import sys

path = sys.argv[1]
snake = re.compile(r"^[a-z][a-z0-9_]*$")

def is_primitive(v):
  return isinstance(v, (str, int, float, bool)) or v is None

with open(path, "r", encoding="utf-8") as f:
  data = json.load(f)

errors = []

campaign_id = data.get("campaign_id")
if not isinstance(campaign_id, str) or not campaign_id.strip():
  errors.append("campaign_id must be a non-empty string")

aud = data.get("audience", {})
if aud is None:
  aud = {}
if not isinstance(aud, dict):
  errors.append("audience must be an object if present")
  aud = {}

mode = aud.get("mode", "default")
if mode not in ("broadcast", "targets", "default"):
  errors.append("audience.mode must be one of: broadcast, targets, default")

targets = aud.get("targets")
if mode == "targets":
  if not isinstance(targets, list) or not targets:
    errors.append("audience.targets must be a non-empty array when audience.mode == 'targets'")
  else:
    for i, t in enumerate(targets):
      if not isinstance(t, dict):
        errors.append(f"audience.targets[{i}] must be an object")
        continue
      has_puid = isinstance(t.get("project_user_id"), str) and t.get("project_user_id").strip()
      has_did = isinstance(t.get("device_id"), str) and t.get("device_id").strip()
      if has_puid and has_did:
        errors.append(f"audience.targets[{i}] must specify exactly one of project_user_id or device_id (not both)")
      elif not has_puid and not has_did:
        errors.append(f"audience.targets[{i}] must specify exactly one of project_user_id or device_id")
else:
  # If not targets mode, we ignore targets but still validate shape if provided
  if targets is not None and not isinstance(targets, list):
    errors.append("audience.targets must be an array if present")

dfk = data.get("dynamic_filter_keys", [])
if dfk is None:
  dfk = []
if not isinstance(dfk, list):
  errors.append("dynamic_filter_keys must be an array if present")
else:
  if len(dfk) > 3:
    errors.append("dynamic_filter_keys must contain at most 3 entries")
  for i, k in enumerate(dfk):
    if not isinstance(k, str) or not snake.match(k):
      errors.append(f"dynamic_filter_keys[{i}] must be snake_case string")

props = data.get("properties")
if not isinstance(props, dict) or not props:
  errors.append("properties must be a non-empty object")
else:
  for key, spec in props.items():
    if not isinstance(key, str) or not snake.match(key):
      errors.append(f"properties key '{key}' must be snake_case")
    if not isinstance(spec, dict):
      errors.append(f"properties['{key}'] must be an object")
      continue
    t = spec.get("type")
    if t is None:
      errors.append(f"properties['{key}'].type is required")
      continue
    if t not in ("string", "number", "boolean", "datetime"):
      errors.append(
        f"properties['{key}'].type must be one of: string, number, boolean, datetime"
      )
    req = spec.get("required")
    if req is not None and not isinstance(req, bool):
      errors.append(f"properties['{key}'].required must be boolean if present")
    pii = spec.get("pii")
    if pii is not None and not isinstance(pii, bool):
      errors.append(f"properties['{key}'].pii must be boolean if present")

    ex = spec.get("example")
    if ex is not None:
      if not is_primitive(ex):
        errors.append(f"properties['{key}'].example must be a primitive (string/number/boolean/null)")
      else:
        if t == "string" and not isinstance(ex, str):
          errors.append(f"properties['{key}'].example must be a string")
        if t == "boolean" and not isinstance(ex, bool):
          errors.append(f"properties['{key}'].example must be a boolean")
        if t == "number":
          # In Python, bool is a subclass of int; exclude it explicitly.
          if isinstance(ex, bool) or not isinstance(ex, (int, float)):
            errors.append(f"properties['{key}'].example must be a number")
        if t == "datetime" and not isinstance(ex, str):
          errors.append(f"properties['{key}'].example must be an ISO-8601 string")

if errors:
  print("❌ api-trigger-plan validation failed:")
  for e in errors:
    print(f"- {e}")
  sys.exit(1)

print("✅ api-trigger-plan validation passed")
PY
}

if command -v python3 >/dev/null 2>&1; then
  validate_with_python
  exit 0
fi

echo "Warning: python3 not found; only checking JSON validity with node if available." >&2
if command -v node >/dev/null 2>&1; then
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('✅ JSON is valid');" "$plan_path"
  exit 0
fi

echo "Error: neither python3 nor node found; cannot validate." >&2
exit 2

