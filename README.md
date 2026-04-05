# Car Recall Radar

Federal safety data, in plain English.

Type any used car and get its NHTSA safety record — recalls, complaints, investigations — summarized by Claude into a plain-English verdict with actionable next steps.

## Stack

React + Vite + Tailwind CSS + Claude (Sonnet) + NHTSA API

## Setup

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run dev             # starts frontend + API server
```

Open http://localhost:5173

## Features

- Three parallel NHTSA API calls (recalls, complaints, model validation)
- Streaming Claude responses for progressive rendering
- Stats dashboard: complaints, crashes, fires, injuries, deaths
- Complaint breakdown visualization by component category
- Competitor benchmarking against similar vehicles
- Actionable next steps tailored to the vehicle's issues
- Contextual follow-up suggestions powered by Claude
- Topic guardrails to keep conversation on car safety
- Vehicle image rendering
- Print-friendly report export
- Search history caching within session
- Starter suggestions for quick exploration

## Deployment

Deployed on Vercel with serverless API routes. Set `VITE_ANTHROPIC_API_KEY` in your Vercel environment variables.
