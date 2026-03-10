# Kaya POS

## Overview
A Point of Sale (POS) application built with a full-stack TypeScript architecture. Features a dashboard with real-time revenue analytics, order tracking, customer management, POS terminal with configurable taxes and discounts, inventory management with stock reconciliation, quotes, draft sales, offline-first PWA support, automatic data sync to PostgreSQL, user authentication with role-based access control (Admin/Manager/Cashier), admin user management, business profile setup, and business-type-specific product fields (pharmacy: dosage/prescription, salon: service time, restaurant: serving size). Built for Ghanaian businesses of all types.

## Project Architecture

### Tech Stack
- **Frontend**: React 19 + Vite + TailwindCSS v4 + shadcn/ui components
- **Backend**: Express 5 (TypeScript) serving both API and client
- **Database**: PostgreSQL (via Drizzle ORM with node-postgres) for server-side sync backup
- **Auth**: bcryptjs + express-session + connect-pg-simple
- **State Management**: Zustand + TanStack React Query
- **Routing**: Wouter
- **Offline Storage**: Dexie (IndexedDB) - primary data store
- **PWA**: Service worker + Web manifest for installable offline-first app
- **Sync**: Auto-sync from Dexie to PostgreSQL with batched sending and retry/backoff

### Directory Structure
```
client/          - React frontend (Vite)
  src/
    components/  - UI components (shadcn/ui based)
      layout/    - DashboardLayout, NotificationBell, PWAInstallPrompt
      inventory/ - Product/Category/Variant/Batch dialogs
      ui/        - shadcn/ui primitives
    pages/       - Route pages (Dashboard, POS, Inventory, Transactions, Settings, Quotes, Admin, Login)
    hooks/       - Custom React hooks
    lib/         - Utility functions (db.ts, store.ts, sync.ts, auth.ts, utils.ts)
  public/        - Static assets (manifest.json, sw.js, icons/)
server/          - Express backend
  index.ts       - Server entry point (port 5000)
  routes.ts      - API routes (auth, admin, sync endpoints)
  db.ts          - Drizzle database connection (node-postgres Pool)
  vite.ts        - Vite dev middleware
  static.ts      - Production static file serving
  storage.ts     - DatabaseStorage for user CRUD
shared/          - Shared code (schema.ts with all PostgreSQL tables)
script/          - Build scripts
```

### Key Configuration
- Server binds to `0.0.0.0:5000` (both API and frontend)
- Vite configured with `allowedHosts: true` for Replit proxy compatibility
- Database URL from `DATABASE_URL` environment variable
- Drizzle schema push: `npm run db:push`
- Default admin: username=`admin`, password=`admin123`

### Scripts
- `npm run dev` - Development server (tsx)
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run db:push` - Push schema to database

### Authentication
- Login requires internet; user cached in localStorage (`kaya_pos_user`) for offline use
- Sessions stored in PostgreSQL via connect-pg-simple
- Three roles: Admin (full access), Manager (all except user management), Cashier (POS + Transactions + Quotes + Dashboard)
- Default admin account created on first server start
- Auth state managed by Zustand store in `client/src/lib/auth.ts`

### Data Storage
- Primary data stored in Dexie (IndexedDB) for offline-first capability
- Dexie schema version 5 includes: products, orders, customers, categories, variants, batches, taxRules, quotes, businessSettings tables
- Product extended fields: dosageForm, strength, requiresPrescription, manufacturer (pharmacy); serviceTime (salon); servingSize (restaurant)
- PostgreSQL stores synced copies via: synced_products, synced_orders, synced_customers, synced_business_settings tables
- PostgreSQL also stores: users, sessions tables
- Auto-sync runs every 60 seconds with retry/backoff on failure; manual sync in Settings

### API Routes
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Destroy session
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/register` - Register new user
- `GET /api/admin/users` - List all users (admin only)
- `POST /api/admin/users` - Create user (admin only)
- `PATCH /api/admin/users/:id` - Update user (admin only)
- `POST /api/sync/products` - Sync products (batched, 50 per chunk)
- `POST /api/sync/orders` - Sync completed orders
- `POST /api/sync/customers` - Sync customer records
- `POST /api/sync/business-settings` - Sync business profile
- `GET /api/sync/status` - Get server-side record counts

### Features
- **Authentication**: Login/logout, role-based access, offline cached sessions
- **Dashboard**: Real-time metrics from actual data (revenue, orders, active products, customers), last 7 days revenue chart, month-over-month comparisons, recent sales list
- **POS Terminal**: Product grid with image support, barcode scanning, cart, multiple payment methods (cash/MoMo/card/credit), split payments, refunds, returns, atomic checkout (Dexie transaction), prescription warnings for pharmacy mode, Rx badges
- **Discounts**: Flat amount and percentage modes, both per-item and order-level
- **Tax Rules**: Configurable tax rates managed in Settings, selectable per-order in POS, default tax auto-applied
- **Draft Sales**: Save incomplete orders, load/resume later from POS cart toolbar
- **Quotes**: Create price quotes from POS cart, validity period, view/convert to sales
- **Inventory**: Product CRUD with business-type-specific fields, categories, variants, batch tracking with expiry dates, low stock alerts
- **Transactions**: Order history with status filtering, expandable detail view
- **User Management**: Admin page to create/edit/deactivate users, reset passwords, assign roles
- **Business Profile**: Set business name/type/contact in Settings, adapts categories and product fields
- **Notifications**: Bell icon with low stock and expiry alerts
- **Data Sync**: Batched sync with retry/backoff to PostgreSQL, manual sync in Settings
- **PWA**: Service worker, web manifest, install prompt, offline caching
- **Crash Resilience**: Error boundary, cart auto-save to localStorage, atomic checkout, database health check

## Recent Changes
- 2026-03-10: Added user authentication system with role-based access control (Admin/Manager/Cashier)
- 2026-03-10: Added admin user management page (create/edit/deactivate users, reset passwords)
- 2026-03-10: Added business profile setup in Settings (name, type, address, phone, email, logo)
- 2026-03-10: Added business-type-specific product fields (pharmacy: dosage/strength/prescription/manufacturer, salon: service time, restaurant: serving size)
- 2026-03-10: Added prescription warning at checkout for pharmacy mode with Rx badges on products
- 2026-03-10: Made POS checkout atomic with Dexie transactions (order + stock deduction)
- 2026-03-10: Added cart auto-save to localStorage for crash resilience
- 2026-03-10: Added React error boundary for graceful crash recovery
- 2026-03-10: Added batched sync with retry/backoff logic
- 2026-03-10: Cleaned up hardcoded data (removed "Yaw Asamoah/Manager", old Food/Drinks categories)
- 2026-03-10: Sidebar shows dynamic user name/role and business name
- 2026-02-19: Production readiness fixes, PWA support, Quotes, Draft Sales, Tax Rules, Inventory Management
- 2026-02-19: Initial setup in Replit environment, database provisioned, dependencies installed
