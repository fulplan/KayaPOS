# Kaya POS

## Overview
A Point of Sale (POS) application built with a full-stack TypeScript architecture. Features a dashboard with real-time revenue analytics, order tracking, customer management, POS terminal with configurable taxes and discounts, inventory management with stock reconciliation, quotes, draft sales, offline-first PWA support, and automatic data sync to PostgreSQL. Built for Ghanaian businesses of all types (pharmacy, salon, restaurant, mini mart, wholesale).

## Project Architecture

### Tech Stack
- **Frontend**: React 19 + Vite + TailwindCSS v4 + shadcn/ui components
- **Backend**: Express 5 (TypeScript) serving both API and client
- **Database**: PostgreSQL (via Drizzle ORM) for server-side sync backup
- **State Management**: Zustand + TanStack React Query
- **Routing**: Wouter
- **Offline Storage**: Dexie (IndexedDB) - primary data store
- **PWA**: Service worker + Web manifest for installable offline-first app
- **Sync**: Auto-sync from Dexie to PostgreSQL every 60 seconds when online

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
    lib/         - Utility functions (db.ts, store.ts, sync.ts, utils.ts)
  public/        - Static assets (manifest.json, sw.js, icons/)
server/          - Express backend
  index.ts       - Server entry point (port 5000)
  routes.ts      - API routes (/api/sync/* endpoints)
  db.ts          - Drizzle database connection (Neon)
  vite.ts        - Vite dev middleware
  static.ts      - Production static file serving
  storage.ts     - User storage interface
shared/          - Shared code (schema with synced_products, synced_orders, synced_customers tables)
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
- PostgreSQL stores synced copies via: synced_products, synced_orders, synced_customers tables
- Auto-sync runs every 60 seconds; manual sync available in Settings

### API Routes
- `POST /api/sync/products` - Sync products from client to server
- `POST /api/sync/orders` - Sync completed orders (marks as synced in Dexie)
- `POST /api/sync/customers` - Sync customer records
- `GET /api/sync/status` - Get server-side record counts

### Features
- **Dashboard**: Real-time metrics from actual data (revenue, orders, active products, customers), last 7 days revenue chart, month-over-month comparisons, recent sales list (excludes drafts)
- **POS Terminal**: Product grid with image support, barcode scanning, cart, multiple payment methods (cash/MoMo/card/credit), split payments, refunds, returns, stock auto-deduction on checkout
- **Discounts**: Flat amount and percentage modes, both per-item and order-level
- **Tax Rules**: Configurable tax rates managed in Settings, selectable per-order in POS, default tax auto-applied
- **Draft Sales**: Save incomplete orders, load/resume later from POS cart toolbar
- **Quotes**: Create price quotes from POS cart with cart items preview, validity period, view/convert to sales from Quotes page
- **Inventory**: Product CRUD with optional image URLs, categories, variants, batch tracking with expiry dates, low stock alerts
- **Transactions**: Order history with status filtering (completed/refunded/returned), expandable detail view showing items, quantities, prices, payment breakdown, discount/tax info
- **Notifications**: Bell icon with dropdown showing low stock and expiring/expired batch alerts
- **Data Sync**: Auto-sync to PostgreSQL when online, manual sync button in Settings
- **PWA**: Web manifest, service worker with cache-first strategy for assets, navigation fallback, install prompt
- **Business-neutral**: No hardcoded sample data, generic categories, works for any business type

## Recent Changes
- 2026-02-19: Production readiness fixes - removed all mock/fake data, real dashboard metrics, stock reconciliation on checkout, overhauled Transactions with expandable detail view, product image support, server sync API, business-neutral seed data, improved quote dialog
- 2026-02-19: Added PWA support (service worker, web manifest, icons, install prompt, offline caching)
- 2026-02-19: Added Quotes feature (create/view/convert to sales)
- 2026-02-19: Added Draft Sales feature (save/load/resume incomplete orders)
- 2026-02-19: Added configurable tax rules in Settings page
- 2026-02-19: Added percentage discount option alongside flat discounts in POS
- 2026-02-19: Added notification bell with low stock and expiry alerts
- 2026-02-19: Added full Inventory Management module (product CRUD, categories, variants, batch tracking, expiry tracking)
- 2026-02-19: Initial setup in Replit environment, database provisioned, dependencies installed
