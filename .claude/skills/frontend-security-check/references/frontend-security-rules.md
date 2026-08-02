# Dowin Frontend Security Rules

## Frontend Security Touchpoints

Check: protected actions are not exposed to the wrong role in visible UI flows; privileged mutations still depend on server-side enforcement; client code does not embed private keys or server secrets.

## Pre-Merge Pass

Confirm at least: role-gated UI matches server-side authorization, no secret material in client bundles, sensitive generated-API calls carry the right auth context.
