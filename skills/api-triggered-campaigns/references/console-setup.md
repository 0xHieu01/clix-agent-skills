# Console Setup (API-Triggered Campaigns)

This reference is for configuring the campaign **once** in the Clix console so
your backend only needs to trigger with a small, stable payload.

## 1) Create the campaign

In the Clix console:

1. Go to **Campaigns** → **Create Campaign**
2. Choose your channel (push/in-app/email/etc.)
3. In **Schedule & Launch**, select **API-Triggered**

After saving, copy the `campaign_id`:

- From the campaign details, or
- From the URL: `.../campaigns/{campaign_id}`

## 2) Dynamic audience filters (`trigger.*`)

API-triggered campaigns support dynamic filtering where the **filter value**
comes from the trigger payload (your API request).

Example audience rule:

```
Group 1
  user_role equals "store_staff"
  AND
  store_location equals {{ trigger.store_location }}
```

Then your backend passes:

```json
{
  "properties": { "store_location": "San Francisco" }
}
```

So delivery is limited to users matching:

- static condition: `user_role == "store_staff"`
- dynamic condition: `store_location == "San Francisco"`

## 3) Limitations (design constraints)

To keep on-demand filtering fast:

- Keep audience definitions simple: **max 3 attributes**
- Combine with **AND**/**OR** only within those constraints

If you need complex targeting logic (many attributes, heavy joins), do it in
your backend and use `audience.targets` for explicit recipients.

## 4) Dynamic content (templates + deep links)

Use `trigger.*` properties in templates:

- Title: `New order at {{ trigger.store_name }}`
- Body: `Order #{{ trigger.order_id }} from {{ trigger.customer_name }}`
- Deep link: `myapp://orders/{{ trigger.order_id }}`

Guidance:

- For optional data, use defaults/guards so empty strings still read well.
- Prefer pre-formatted values sent from backend (currency, durations, times).

## 5) Verification checklist in console

- Campaign type is **API-Triggered**
- Audience rules reference `trigger.*` keys that your backend will send
- Template preview renders correctly with a sample payload
- Message Logs show no rendering errors after a test trigger
