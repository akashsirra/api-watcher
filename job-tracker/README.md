# India Job Change Tracker

Tracks software engineering jobs from public ATS APIs and detects job changes.

## Current provider

- Greenhouse

## Current companies

- Airbnb
- Stripe
- Figma

## Filters

- Software roles
- India locations
- Entry / Mid / Senior experience
- Full-time / internship / part-time

## Change detection

- NEW
- UPDATED
- UNCHANGED
- CLOSED

## Usage

```bash
npm test
npm run scan
npm run scan -- --company stripe
npm run scan -- --level entry
npm run scan -- --location Bangalore
npm run scan -- --json
npm run scan -- --match
npm run scan -- --level entry --match


## Jev candidate matching

The tracker can optionally send each filtered job to TypeSafe's Jev decision API and return structured match signals:

- `skill_fit`: 0–4 score
- `role_fit`: 0–1 probability
- `application_action`: `APPLY`, `REVIEW`, or `SKIP`
- confidence/probabilities from Jev

Set the API key only in your local environment or secret store:

```bash
export JEV_API_KEY="your_key_here"
npm run scan -- --match
```

The key is read from `process.env.JEV_API_KEY` and is never stored in the repository. The candidate profile lives in `src/matching/candidate.js` so it can be updated as your skills and preferences change.

Jev is an optional decision layer: the existing deterministic filters still handle India location and software-role filtering before Jev evaluates fit.
