# ASEAN Demand Radar

Shows which book to test in which ASEAN country, with sources, then drafts a test kit for a person to approve. This is a hackathon prototype that runs on one machine.

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and add your `GEMINI_API_KEY`.
3. Run `npx tsx --env-file=.env.local scripts/check-model.ts` to list Gemma models. Set `GEMMA_MODEL` to the Gemma 4 model, then run it again to test access.
4. Run `npm run dev` and open http://localhost:3000.

## Adding evidence

The app has no market data until you add sourced evidence. Never add a finding without a real source.

- **Screenshot:** use **Add market evidence** in the app. Crop out usernames and faces first.
- **Google Trends:** download the country CSV, then run `npx tsx scripts/import-trends.ts <csv file> "<search term>" <source link>`. Trends scores are relative interest, not search counts.

Run a book again after adding evidence to update its scores.

## Saving a replay for the demo

Run `npx tsx --env-file=.env.local scripts/save-replay.ts <page image>`, which needs evidence to exist. Open `/?replay=1` to play it. The app always labels a replay, and offers it after an API failure.

## Working today

Book reading, evidence reading, scoring, the heatmap, sources, test kit with approval, sign-up form, real sign-up counts and sample results.

## Planned

Live data feeds, live comment analysis, real sales tracking, learning from results, other businesses and Startup ASEAN reporting.

## Limits

- Evidence and sign-ups are stored as local files, so the sign-up link needs hosting and a real database before the seller can share it publicly.
- Numbers under **Sample data for illustration** on the Results page are made up.
- Scoring weights in `lib/score.ts` and reach values in `data/countries.json` are starting defaults for the team to adjust.
