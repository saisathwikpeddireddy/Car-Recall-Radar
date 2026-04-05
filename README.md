# Car Recall Radar

Federal safety data, in plain English.

Type any used car and get its NHTSA safety record — recalls, complaints, investigations — summarized by Claude into a plain-English verdict with actionable next steps.

## Setup

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run dev
```

## Features

- Streaming Claude safety briefs with verdict and next steps
- Stats dashboard, complaint breakdown, and competitor benchmarking
- Contextual follow-up questions with topic guardrails
- Vehicle images, search history, and print-friendly reports
