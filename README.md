# MealGenie AI Vision

Cross‑platform Vite + React app. Works on Windows and macOS.

## Requirements
- Node.js LTS
- npm

## Development
```
npm install
npm run dev
```
Open `http://localhost:8080/`.

## Mac Quickstart (TRAE)
- Install Xcode CLT: `xcode-select --install`
- Install Node.js LTS (Homebrew): `brew install node`
- Open TRAE → New workspace → Clone from Git → paste:
  `https://github.com/mathguy022/Mealgenie-ai-vision-new.git`
- In TRAE terminal:
  - `npm install`
  - `cp .env.local.example .env.local` and edit with your keys
  - `npm run dev`
- Preview: `http://localhost:8080/`

## Environment
Create `.env.local` for any secrets. Do not commit secrets.
See `.env.local.example` for required variables:
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_OPENROUTER_API_KEY
```

## Build
```
npm run build
npm run preview
```
