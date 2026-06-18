<div align="center">
  <h1>LeadScout AI</h1>
  <p><strong>Find leads faster with Gemini-powered web and Google Maps search.</strong></p>
  <p>A focused React + Vite app for discovering businesses, extracting public contact details, and exporting results to CSV.</p>
</div>

---

## Overview

LeadScout AI is an AI-assisted lead discovery tool built with React, Vite, TypeScript, and the Google Gemini API. It lets you search in two modes:

- `Web Search` for broad discovery across the public web
- `Local Maps` for nearby businesses and location-aware results

The app gathers public information only, shows results as cards, and can export the current lead list to CSV.

## Key Features

- Gemini-powered lead generation with Google Search grounding
- Google Maps-powered local business discovery
- Progressively loads more leads until the target count is reached or search limits are hit
- Client-side deduplication to reduce repeated results
- CSV export with name, email, phone, website, address, description, and source URL
- Dark, polished UI with responsive cards and inline search controls
- Browser geolocation support for better Maps results

## How It Works

1. You enter a target query such as a business type, niche, or service category.
2. You choose either `Web Search` or `Local Maps`.
3. The app calls Gemini with the appropriate tool:
   - `googleSearch` for web-based discovery
   - `googleMaps` for nearby location-based discovery
4. Results are normalized into lead cards and rendered immediately.
5. You can keep fetching more results or export the list as CSV.

## Tech Stack

- React 19
- Vite 6
- TypeScript
- Tailwind CSS via CDN
- `@google/genai`

## Requirements

- Node.js 18 or newer
- A Gemini API key
- Browser permission for location access if you want the best Maps results

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root and add your Gemini API key:

   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the app in your browser:

   `http://localhost:3000`

## Available Scripts

- `npm run dev` - start the Vite dev server
- `npm run build` - build the app for production
- `npm run preview` - preview the production build locally

## Usage

### Web Search

Use this mode when you want broad lead discovery across the public web.

- Best for agencies, service businesses, and category-based searches
- Works well when you want contact details such as email, phone, and website
- You can add an optional location hint to narrow the query

Example queries:

- `Marketing agencies in London`
- `B2B SaaS founders`
- `Wedding photographers in Austin`

### Local Maps

Use this mode when you want nearby businesses and physical locations.

- Requests browser geolocation on mount
- Falls back to default coordinates if location access is unavailable
- Useful for local service businesses such as plumbers, clinics, or salons

Example queries:

- `Plumbers`
- `Coffee shops`
- `Dental clinics`

## Environment Notes

- The app expects `GEMINI_API_KEY` in `.env.local`.
- `vite.config.ts` injects that value into `process.env.API_KEY` and `process.env.GEMINI_API_KEY` at build time.
- The Maps experience is better when the browser grants location access.
- If geolocation is denied, the app uses fallback coordinates centered on San Francisco.

## Project Structure

```text
.
├── App.tsx
├── index.tsx
├── index.html
├── types.ts
├── services/
│   └── geminiService.ts
├── components/
│   ├── Icons.tsx
│   └── LeadCard.tsx
├── vite.config.ts
├── metadata.json
└── README.md
```

## Implementation Highlights

- Search state lives in `App.tsx`
- Gemini integration is isolated in `services/geminiService.ts`
- Lead rendering is handled by `components/LeadCard.tsx`
- Shared SVG icons live in `components/Icons.tsx`

## Limitations

- This tool aggregates public information only.
- Email extraction depends on what is publicly available.
- Results may be incomplete or imperfect, so verification before outreach is still required.

## Troubleshooting

- `API Key is missing.`  
  Make sure `GEMINI_API_KEY` exists in `.env.local` and restart the dev server.

- No leads appear in Maps mode  
  Allow browser location access, or try a broader query.

- CSV export does nothing  
  Ensure there are results on screen before exporting.

## License

No license has been specified in this repository.
