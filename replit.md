# Kaya POS

## Overview
A Point of Sale (POS) application built with a full-stack TypeScript architecture. Features a dashboard with revenue overview, order tracking, customer management, POS terminal with configurable taxes and discounts, inventory management, quotes, draft sales, and offline-first PWA support. Built for Ghanaian businesses.

## Project Architecture

### Tech Stack
- **Frontend**: React 19 + Vite + TailwindCSS v4 + shadcn/ui components
- **Backend**: Express 5 (TypeScript) serving both API and client
- **Database**: PostgreSQL (via Drizzle ORM)
- **State Management**: Zustand + TanStack React Query
- **Routing**: Wouter
- **Offline Storage**: Dexie (IndexedDB)
- **PWA**: Service worker + Web manifest for installable offline-first app

### Directory Structure
```
client/          - React frontend (Vite)
  src/
    components/  - UI components (shadcn/ui based)
      layout/    - DashboardLayout, NotificationBell, PWAInstallPrompt
      inventory/ - Product/Category/Variant/Batch dialogs
      ui/        - shadcn/ui primitives
    pages/       - Route pages (Dashboard, POS, Inventory, Transactions, Settings, Quotes)
    hooks/       - Custom React hooks
    lib/         - Utility functions (db.ts, store.ts, utils.ts)
  public/        - Static assets (manifest.json, sw.js, icons/)
server/          - Express backend
  index.ts       - Server entry point (port 5000)
  routes.ts      - API routes (/api prefix)
  vite.ts        - Vite dev middleware
  static.ts      - Production static file serving
shared/          - Shared code (schema, types)
script/          - Build scripts
```

### Key Configuration
- Server binds to `0.0.0.0:5000` (both API and frontend)
- Vite configured with `allowedHosts: true` for Replit proxy compatibility
- Database URL from `DATABASE_URL` environment variable
- Drizzle schema push: `npm run db:push`

### Scripts
- `npm run dev` - Development server (tsx)
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run db:push` - Push schema to database

### Data Storage
- Primary data stored in Dexie (IndexedDB) for offline-first capability
- Dexie schema version 4 includes: products, orders, customers, categories, variants, batches, taxRules, quotes tables
- PostgreSQL available via Drizzle ORM for server-side needs (users table)

### Features
- **POS Terminal**: Product grid, barcode scanning, cart, multiple payment methods (cash/MoMo/card/credit), split payments, refunds, returns
- **Discounts**: Flat amount and percentage modes, both per-item and order-level
- **Tax Rules**: Configurable tax rates managed in Settings, selectable per-order in POS, default tax auto-applied
- **Draft Sales**: Save incomplete orders, load/resume later from POS cart toolbar
- **Quotes**: Create price quotes from POS cart with validity period, view/convert to sales from Quotes page
- **Inventory**: Product CRUD, categories, variants, batch tracking with expiry dates, low stock alerts
- **Notifications**: Bell icon with dropdown showing low stock and expiring/expired batch alerts
- **PWA**: Web manifest, service worker with cache-first strategy for assets, navigation fallback, install prompt

## Recent Changes
- 2026-02-19: Added PWA support (service worker, web manifest, icons, install prompt, offline caching)
- 2026-02-19: Added Quotes feature (create/view/convert to sales)
- 2026-02-19: Added Draft Sales feature (save/load/resume incomplete orders)
- 2026-02-19: Added configurable tax rules in Settings page
- 2026-02-19: Added percentage discount option alongside flat discounts in POS
- 2026-02-19: Added notification bell with low stock and expiry alerts
- 2026-02-19: Added full Inventory Management module (product CRUD, categories, variants, batch tracking, expiry tracking)
- 2026-02-19: Initial setup in Replit environment, database provisioned, dependencies installed
