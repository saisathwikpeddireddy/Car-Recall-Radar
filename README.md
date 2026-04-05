# Car Recall Radar

Federal safety data, in plain English.

A single-page app where you type any used car and get its federal safety record summarized clearly. Pulls live data from NHTSA's free public API, synthesizes it with Claude, and returns a plain-English verdict.

## Stack

- React + Vite
- Tailwind CSS
- Anthropic SDK (Claude) for AI synthesis
- NHTSA Vehicle Safety API (no key required)

## Setup

```bash
npm install
cp .env.example .env
# Add your Anthropic API key to .env
```

## Development

```bash
npm run dev
```

This starts both the Vite dev server and the API proxy server. Open http://localhost:5173.

## How it works

1. User enters a vehicle (e.g. "2019 Honda CR-V")
2. App queries three NHTSA endpoints in parallel (recalls, complaints, model validation)
3. Raw JSON is passed to Claude with a structured system prompt
4. Claude streams back a safety brief with four sections: Recalls, Complaints, Investigations, and Verdict
5. User can ask follow-up questions with full conversation context
