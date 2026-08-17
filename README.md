# Ava Palmieri — AI Resume

An AI-powered resume that generates personalized cover letters based on who's viewing it.

This is a fixed fork of the original `ava-resume` repo. The original relied on
Clearbit's company-enrichment API for domain-to-company lookups, which Clearbit
(now under HubSpot) has been sunsetting since March 2025 — that was causing the
cover-letter flow to error out. This version resolves company names entirely
locally (no external lookup service, no extra API key) and degrades gracefully
to a hand-written fallback letter if the Claude API call ever fails, so the
feature never breaks for visitors.

## How it works

1. Visitor lands on the page — modal asks for their work email
2. Email domain is sent to `/api/lookup`, which resolves a company name locally (known-companies list + generic formatting fallback — no external service)
3. Company name is sent to `/api/generate`, which calls Claude to write a tailored cover letter (falls back to a pre-written letter if the API call fails or the key isn't set)
4. Cover letter appears on the page, written specifically for that company

## Project structure

```
ava-resume/
├── public/
│   └── index.html        # Main resume page
├── api/
│   ├── lookup.js         # Local company-name resolution (no external API)
│   └── generate.js       # Claude cover letter generation, with fallback
├── vercel.json            # Vercel deployment config
└── README.md
```

## Setup & Deploy

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ava-resume.git
git push -u origin main
```

### 2. Deploy on Vercel
- Go to vercel.com and sign in with GitHub
- Click "Add New Project"
- Import your `ava-resume` repo
- Click Deploy

### 3. Add environment variables
In your Vercel project dashboard → Settings → Environment Variables, add:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

That's the only environment variable this project needs. Without it, the
cover-letter feature still works — it just serves the built-in fallback
letter instead of a Claude-generated one.

### 4. Get your API key
- **Anthropic**: console.anthropic.com → API Keys

## Customization
- Update your LinkedIn/GitHub URLs in `public/index.html`
- Add more companies to the `knownCompanies` object in `api/lookup.js` (purely cosmetic — everything else falls back to a formatted version of the domain automatically)
- Edit the cover letter prompt (and the `fallbackLetter` function) in `api/generate.js` to update your background as it changes
