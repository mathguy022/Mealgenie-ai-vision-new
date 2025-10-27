# MealGenie AI

AI-powered nutrition and meal planning. Scan meals in real-time, get personalized plans, and track progress with a clear daily dashboard.

## Tech Stack
- Vite
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth + data)

## Getting Started
1. Ensure Node.js 18+ is installed.
2. Install dependencies:
   ```sh
   npm i
   ```
3. Create `.env` in the project root and add:
   ```env
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
   ```
4. Start the dev server:
   ```sh
   npm run dev
   ```

## Scripts
- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm run preview` — preview the production build locally

## Project Structure
```
src/
  components/        // UI and shared components
  pages/             // Route pages (Welcome, Auth, Dashboard, Onboarding, etc.)
  contexts/          // Auth context
  integrations/      // Supabase client and types
  index.css          // Design tokens (colors, gradients, etc.)
  main.tsx           // App entry
```

## Notes
- Global header is shown on non-home pages for consistent branding.
- Tailwind tokens in `src/index.css` define colors, gradients, and shadows.
- Supabase env variables are required for auth and data.
