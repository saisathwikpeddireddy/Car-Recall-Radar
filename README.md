# Car Recall Radar

Federal safety data, in plain English.

Type any used car and get its NHTSA safety record — recalls, complaints, investigations — summarized by Claude into a plain-English verdict.

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
- Vehicle image rendering
- Follow-up questions with full conversation context
- Starter suggestions for quick exploration
