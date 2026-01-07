# Personalization + Dynamic Filters (`trigger.*`)

In API-triggered campaigns, your backend passes a `properties` map. These keys
become available as `trigger.*` inside:

- templates (title/body/subtitle)
- deep links / URLs
- audience rules (dynamic filtering)

## Naming + stability

- Use **snake_case** keys (`store_location`, `order_id`).
- Keep keys stable over time; changing keys can break targeting and templates.

## Missing data behavior

If a property is missing, templates will often render it as an empty string.
Design templates so they still read well.

Suggested patterns:

- Provide defaults: `{{ trigger.discount | default: "10%" }}`
- Use guards/conditionals for optional blocks (keep logic minimal).

## Pre-format values in backend

Templates are not a full programming language. Prefer sending pre-formatted
values:

- send `"$29.99"` (string) rather than `2999` (number) if you want displayed
  currency
- send `"2:30 PM"` rather than raw timestamps if that’s what the message should
  show

## Dynamic audience filtering constraints

Keep on-demand filtering fast:

- max **3 attributes** per audience definition
- use simple AND/OR combinations

If you need complex targeting:

- compute recipients in your backend
- use `audience.targets` to specify recipients explicitly

## Coordinate with event tracking and user properties

For templates that depend on:

- `user.*`: ensure your app sets user properties correctly (see
  `clix-user-management`)
- `event.*`: use event-triggered campaigns (see `clix-event-tracking`)
- `trigger.*`: use this skill (API-triggered campaigns)
