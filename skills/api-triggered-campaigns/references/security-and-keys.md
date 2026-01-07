# Security & Key Handling

API-triggered campaigns use secret credentials. Treat them like database
passwords.

## Which key is used here?

The trigger endpoint uses:

- `X-Clix-Project-ID`
- `X-Clix-API-Key` (**Secret API Key**)

Do not confuse this with mobile SDK public keys.

## Rules (do this by default)

- **Backend-only**: never expose the secret key in mobile/web apps.
- **No source control**: do not commit keys in git (including examples).
- **Use a secret store**: Vault / AWS Secrets Manager / GCP Secret Manager /
  Doppler / 1Password CLI, etc.
- **Rotate** keys periodically; rotate immediately if leaked.
- **Separate environments**: dev/staging/prod should not share secret keys.

## Logging

- Never log request headers containing secrets.
- If you log the payload for debugging, consider redacting sensitive properties.

## Least privilege

If Clix supports scoped keys in your environment, prefer keys limited to the
required API calls.
