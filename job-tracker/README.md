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
