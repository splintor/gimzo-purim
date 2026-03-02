# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start dev server (Remix with --manual mode)
yarn build        # Build for production
yarn start        # Serve the production build (remix-serve ./build/index.js)
yarn typecheck    # Run TypeScript type checking (tsc)
```

There is no test suite configured. Linting uses ESLint with the Remix config (`.eslintrc.cjs`).

## Project Overview

A Remix (v2) full-stack app for managing annual Purim "Mishloach Manot" (gift packages) registration for the Gimzo community. Replaces a previous JotForm-based solution. The UI is entirely in Hebrew with RTL layout.

**Runtime:** Node.js >= 18, Yarn 4.0.1, deployed on Vercel via `@vercel/remix`.

## Architecture

### Routes

- **`app/routes/_index.tsx`** — Main form page. Loader fetches family names and settings from Google Sheets. Action validates the submitted form server-side (recalculates price), saves to Sheets, sends a Telegram notification, and redirects to a payment link.
- **`app/routes/logger.tsx`** — Client-side logging endpoint that forwards messages to Telegram.
- **`app/routes/updateShipping.tsx`** — Recalculates and updates the shipping manifest in Google Sheets.

### Server Modules

- **`app/googleapis.server.ts`** — All Google Sheets API interactions: reading names/settings, saving registrations, and processing the shipping manifest. The `.server.ts` suffix ensures this code is never bundled for the client.
- **`app/telegram.server.ts`** — Sends notifications to a Telegram chat via bot API.
- **`app/calculateSum.ts`** — Shared price calculation logic used on both client and server for validation. Handles per-family pricing, bulk discounts, "send to all" pricing, and fadiha (insurance) costs.

### Data Flow

1. Family names and settings are stored in a Google Sheets spreadsheet with Hebrew-named sheets: `שמות` (names), `הגדרות` (settings), `הרשמות` (registrations), `משלוחים` (shipping).
2. The `?t=<hash>` query parameter loads previous year's selections to prepopulate the form.
3. On submission, the server recalculates the price from settings to prevent client-side tampering, logs mismatches to Telegram.
4. After saving, `processShipping()` rebuilds the entire shipping manifest and applies yellow highlighting for fadiha rows.

### Environment Variables

- `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` (base64-encoded), `GOOGLE_SHEET_ID` — Google Sheets access
- `TELEGRAM_BOT_API_TOKEN`, `TELEGRAM_CHAT_ID` — Telegram notifications
- `DO_NOT_SAVE_TO_WORKSHEET` — Skip sheet writes during development

## Key Conventions

- Path alias: `~/` maps to `./app/` (configured in tsconfig.json)
- TypeScript strict mode is enabled
- Settings keys and sheet names are in Hebrew — preserve them exactly as-is
- The `calculateSum` function is shared between client and server; changes must stay in sync
