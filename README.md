# Kaya POS

A modern Point of Sale application built for Ghanaian businesses. Works offline, syncs automatically when you're back online, and can be installed on any device like a native app.

Designed for pharmacies, salons, restaurants, mini marts, wholesale shops, and any other business that needs to manage sales and inventory.

## Features

### Sales & Checkout
- Fast product search and barcode scanning
- Cart with quantity controls and item-level discounts
- Multiple payment methods: Cash, Mobile Money (MoMo), Card, and Credit
- Split payments across different methods
- Refunds and returns with automatic stock adjustment
- Save incomplete sales as drafts and resume later

### Inventory Management
- Add, edit, and manage products with optional images
- Organize products into categories
- Product variants (e.g., sizes, colors)
- Batch tracking with expiry date monitoring
- Low stock alerts and notifications
- Automatic stock deduction on sales

### Quotes
- Create price quotes for customers directly or from the POS
- Set validity periods (default 30 days)
- View, manage, and convert quotes to actual sales
- Track quote status (Active, Converted, Expired)

### Tax & Discounts
- Configurable tax rules with custom rates
- Set a default tax that auto-applies to orders
- Flat amount or percentage discounts
- Per-item and order-level discount support

### Dashboard & Analytics
- Real-time revenue metrics from actual sales data
- Last 7 days revenue chart
- Month-over-month comparison with percentage changes
- Active products count, customer count, and order totals
- Recent sales list (excludes drafts)

### Transactions History
- Full order history with search and status filtering
- Filter by: Completed, Refunded, Returned
- Expandable detail view showing items, quantities, prices
- Payment breakdown and discount/tax information

### Notifications
- Low stock alerts when products fall below threshold
- Expiring and expired batch alerts
- Bell icon with real-time notification count

### Offline-First & Sync
- Works completely offline using local browser storage
- Automatically syncs data to the server every 60 seconds when online
- Manual sync button available in Settings
- Data backed up to PostgreSQL for safety

### PWA (Install as App)
- Install on phone, tablet, or desktop like a native app
- Works offline after installation
- Automatic caching of assets for fast loading

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Styling | TailwindCSS v4 + shadcn/ui |
| Backend | Express 5 (TypeScript) |
| Database | PostgreSQL (via Drizzle ORM) |
| Offline Storage | Dexie (IndexedDB) |
| State Management | Zustand + TanStack React Query |
| Routing | Wouter |
| Build Tool | Vite |

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (automatically provisioned on Replit)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Push the database schema:
   ```bash
   npm run db:push
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5000`

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
client/                  Frontend (React + Vite)
  src/
    components/
      layout/            Dashboard layout, notifications, PWA prompt
      inventory/         Product, category, variant, batch dialogs
      ui/                shadcn/ui components
    pages/               Dashboard, POS, Inventory, Transactions, Settings, Quotes
    hooks/               Custom React hooks
    lib/
      db.ts              Dexie database schema and seed data
      store.ts           Zustand state (cart, discounts, tax)
      sync.ts            Auto-sync logic (client to server)
      utils.ts           Utility functions
  public/                PWA manifest, service worker, icons

server/                  Backend (Express)
  index.ts               Server entry point (port 5000)
  routes.ts              Sync API routes
  db.ts                  PostgreSQL connection (Drizzle + pg)

shared/                  Shared code
  schema.ts              Drizzle schema (synced_products, synced_orders, synced_customers)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync/products` | Sync products from client to server |
| POST | `/api/sync/orders` | Sync completed orders to server |
| POST | `/api/sync/customers` | Sync customer records to server |
| GET | `/api/sync/status` | Get server-side record counts |

## How It Works

Kaya POS uses an **offline-first architecture**:

1. **All data is stored locally** in the browser using IndexedDB (via Dexie). This means the app works even without internet.

2. **When online**, the app automatically syncs your products, orders, and customers to a PostgreSQL database on the server every 60 seconds.

3. **The server** acts as a backup and sync target. Your data is safe even if you clear your browser.

4. **PWA support** means you can install the app on your phone or computer and use it like a regular app, with offline support built in.

## License

MIT
