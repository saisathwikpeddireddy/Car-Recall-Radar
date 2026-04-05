# Car Recall Radar

Federal safety data, in plain English.

**Live:** [car-recall-radar.vercel.app](https://car-recall-radar.vercel.app)

## What it does

Type any used car (e.g. "2019 Honda CR-V") and get its full NHTSA safety record — recalls, complaints, investigations — summarized by Claude into a plain-English verdict with actionable next steps.

## User Stories

- As a **used car buyer**, I want to see a vehicle's recall and complaint history in plain English so I can make an informed purchase decision.
- As a **buyer comparing options**, I want to see how a vehicle's safety record stacks up against competitors so I can pick the safest option.
- As a **buyer at a dealership**, I want a printable report with specific next steps (recall campaigns to verify, systems to inspect) so I can negotiate or walk away with confidence.
## Setup

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run dev
```

## Stack

React · Vite · Tailwind CSS · Claude Sonnet · NHTSA API · Vercel
