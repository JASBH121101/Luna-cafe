# JB Expert QA — Luna Café

JB Expert QA is the project's deterministic, read-only browser audit.

## What it checks

- Desktop and mobile layouts at 1600, 1365, 390 and 360 CSS pixels.
- Horizontal overflow and header geometry.
- Product cards and local image loading.
- Theme switch in both directions.
- Desktop and mobile menu filters.
- Mobile navigation and cart open/close behavior.
- Serious and critical accessibility violations using Axe.

## Run locally

Install the open-source test dependencies without adding a runtime dependency to the site:

```bash
npm install --no-save --no-package-lock playwright@1.64.1 @axe-core/playwright@4.14.0
npx playwright install chromium
node tests/jb-expert-qa.mjs
```

The report and screenshots are written to `artifacts/jb-expert-qa/`.

## Cost and privacy

- No paid service or billing integration is used.
- No AI API key is required or configured.
- AI visual review is disabled.
- The browser tests run against a local copy of the static site and do not sign in, submit real orders, or modify production data.
- Axe findings and screenshots are saved as a GitHub Actions artifact for human review.
