# Dowin Frontend Performance Rules

## Frontend Touchpoints

Flag code when it:

- triggers repeated refetches from unstable query keys or repeated mount logic
- requests large payloads only to slice most of it on the client
- duplicates expensive derived calculations on every render without need
- renders large/unbounded lists without virtualization or pagination

## Bundle Size

The Cloudflare Worker build output must stay under the 3MB free-tier limit. Next.js bundles files placed in `src/app` (like `opengraph-image.png`) and server-side dependencies directly into the worker script. Do not place large static assets (> 200KB) in `src/app`; use optimized JPG/PNG or move larger assets to `public/`. `.webp` is ignored by Next.js file-based OG generation.
