# Kaya POS

A modern, offline-first Point of Sale application built for Ghanaian businesses. Works without internet, syncs automatically when online, and can be installed on any device like a native app.

Designed for pharmacies, salons, restaurants, mini marts, wholesale shops, and any other business type.

## Features

### Authentication & User Management
- Secure login with password hashing (bcrypt)
- Three user roles: **Admin** (full access), **Manager** (all except user management), **Cashier** (POS + Transactions only)
- Admin dashboard to create, edit, deactivate users and reset passwords
- Offline access after first login — user session cached locally
- Default admin account created automatically on first run

### Sales & Checkout
- Fast product search and barcode scanning
- Cart with quantity controls
- Multiple payment methods: Cash, Mobile Money (MoMo), Card, and Credit
- Split payments across different methods
- Refunds and returns with automatic stock adjustment
- Save incomplete sales as drafts and resume later
- Atomic checkout — order and stock update succeed together or not at all (crash-safe)

### Business Profile & Customization
- Set business name, type, address, phone, email, and logo
- Business type options: Pharmacy, Salon, Restaurant, Retail, Wholesale, Other
- One-click category suggestions based on your business type
- 10 color themes to match your brand (Emerald, Blue, Indigo, Purple, Rose, Orange, Red, Green, Slate, Cyan)
- Business name shown in sidebar

### Business-Type-Specific Features
- **Pharmacy**: Dosage form, strength, prescription required, manufacturer fields; Rx badges on products; prescription verification warning at checkout
- **Salon**: Service time field for scheduling
- **Restaurant**: Serving size field
- **Retail/Wholesale**: Clean generic interface with no extra fields

### Inventory Management
- Add, edit, and manage products with optional images
- Organize products into categories
- Product variants (e.g., sizes, colors)
- Batch tracking with expiry date monitoring
- Low stock alerts and notifications
- Automatic stock deduction on sales

### Quotes
- Create price quotes for customers directly from the POS
- Set validity periods (default 30 days)
- View, manage, and convert quotes to actual sales

### Tax & Discounts
- Configurable tax rules with custom rates
- Set a default tax that auto-applies to orders
- Flat amount or percentage discounts at the order level

### Dashboard & Analytics
- Real-time revenue metrics from actual sales data
- Last 7 days revenue chart
- Month-over-month comparisons
- Active products, customer count, and order totals

### Transactions History
- Full order history with search and status filtering
- Filter by: Completed, Refunded, Returned
- Expandable detail view with payment breakdown

### Offline-First & Data Sync
- All data stored locally in the browser (IndexedDB) — works without internet
- Batched sync to PostgreSQL every 60 seconds when online
- Retry with exponential backoff on sync failures
- Manual sync button in Settings

### Crash & Data Resilience
- Cart auto-saved to localStorage — survives browser crashes and power outages
- Atomic checkout using database transactions
- React error boundary — crashes show a recovery screen, not a blank page
- Dexie database integrity maintained across sessions

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
| Database | PostgreSQL (Drizzle ORM + node-postgres) |
| Auth | bcryptjs + express-session + connect-pg-simple |
| Offline Storage | Dexie (IndexedDB) |
| State Management | Zustand + TanStack React Query |
| Routing | Wouter |
| Build Tool | Vite |

---

## Local Installation (Offline Setup)

This guide helps you run Kaya POS on your own computer — perfect for locations without reliable internet.

### Prerequisites

1. **Node.js 20+** — Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL 14+** — Download from [postgresql.org/download](https://www.postgresql.org/download/)
   - Windows: Use the installer from EnterpriseDB
   - Mac: `brew install postgresql@16` (using Homebrew)
   - Ubuntu/Debian: `sudo apt install postgresql postgresql-contrib`

### Step 1: Get the Project

Download or clone the project files to your computer:

```bash
git clone <your-repo-url>
cd kaya-pos
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up the Database

Create a PostgreSQL database for Kaya POS:

```bash
# Connect to PostgreSQL (use your postgres password)
psql -U postgres

# Create the database
CREATE DATABASE kayapos;

# Exit psql
\q
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/kayapos
SESSION_SECRET=any-random-string-here-make-it-long
```

Replace `your_password` with your PostgreSQL password.

### Step 5: Push the Database Schema

```bash
npm run db:push
```

This creates all the necessary tables in your database.

### Step 6: Start the Application

**Development mode:**
```bash
npm run dev
```

**Production mode (faster):**
```bash
npm run build
npm run start
```

### Step 7: Open in Browser

Go to **http://localhost:5000** in your browser.

### Step 8: Log In

A default admin account is created automatically:
- **Username:** `admin`
- **Password:** `admin123`

Change this password immediately after first login by going to **Users** in the sidebar.

### How Offline Mode Works

Once you log in the first time (requires the server running), all your data is stored locally in the browser. This means:

- **Products, orders, customers, settings** — all saved in your browser's IndexedDB
- **No internet needed** for day-to-day use after initial login
- **Data syncs** to PostgreSQL automatically when the server is reachable
- **If the server goes down**, the app continues working — data syncs when it comes back

### Running on a Local Network

To let multiple devices (tablets, phones) access the POS on your local network:

1. Find your computer's IP address:
   - Windows: Run `ipconfig` in Command Prompt, look for IPv4 Address
   - Mac/Linux: Run `ifconfig` or `ip addr`, look for your local IP (e.g., 192.168.1.x)

2. Start the server as usual: `npm run dev`

3. On other devices, open a browser and go to: `http://YOUR_IP:5000`
   - Example: `http://192.168.1.100:5000`

4. Each device gets its own local database — they sync independently to the server's PostgreSQL

---

## Deploy to Replit

Replit provides the easiest deployment — database and hosting are handled automatically.

### Steps

1. **Import the project** into Replit (fork or upload)
2. Replit automatically provisions a PostgreSQL database and sets `DATABASE_URL`
3. Push the database schema:
   ```bash
   npm run db:push
   ```
4. Click **Run** — the app starts on port 5000
5. To publish publicly, click **Deploy** in the top bar and follow the prompts

### Notes
- The database is included free with Replit
- The app auto-restarts on deploys
- Custom domains can be configured in Replit's deployment settings

---

## Deploy to the Cloud

Kaya POS is a full-stack app (Express backend + React frontend). Platforms that support traditional Node.js servers are the easiest option. Vercel can also work but requires additional setup.

### Option A: Railway or Render (Recommended for Full-Stack)

Since Kaya POS has a traditional Express server, platforms like **Railway** or **Render** are simpler alternatives that run your server directly without serverless conversion:

#### Railway

1. Go to [railway.app](https://railway.app) and create a new project
2. Add a **PostgreSQL** database from the Railway dashboard
3. Connect your GitHub repo or upload the project
4. Railway auto-detects Node.js and runs `npm run build` then `npm run start`
5. Set `SESSION_SECRET` in environment variables
6. `DATABASE_URL` is auto-configured by Railway

#### Render

1. Go to [render.com](https://render.com) and create a **Web Service**
2. Connect your repo
3. Set build command: `npm run build`
4. Set start command: `npm run start`
5. Add a **PostgreSQL** database from Render's dashboard
6. Set `DATABASE_URL` and `SESSION_SECRET` in environment variables

### Option B: Vercel (Requires Server Refactor)

Vercel uses serverless functions, so the Express server needs modification to work:

1. Refactor `server/index.ts` to export the Express app and only call `listen()` when not running on Vercel
2. Create an `api/index.ts` serverless entry point that imports and exports the app
3. Configure `vercel.json` to route `/api/*` to the serverless function and everything else to the static frontend
4. Use an external PostgreSQL provider (Neon, Supabase, or Railway) since Vercel doesn't include databases
5. Set `DATABASE_URL`, `SESSION_SECRET`, and `NODE_ENV=production` in Vercel's environment variables

This approach is more complex than Railway/Render. Choose Vercel if you specifically need its CDN and edge network features.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (auto-set on Replit) |
| `SESSION_SECRET` | Yes (production) | Secret for session encryption. **Must be set to a strong random value in production.** Falls back to a default in development only. |
| `PORT` | No | Server port (defaults to 5000) |
| `NODE_ENV` | No | Set to `production` for production builds |

---

## Project Structure

```
client/                  Frontend (React + Vite)
  src/
    components/
      layout/            DashboardLayout, NotificationBell, PWAInstallPrompt
      inventory/         Product, Category, Variant, Batch dialogs
      ui/                shadcn/ui components
    pages/
      Dashboard.tsx      Revenue metrics and analytics
      POS.tsx            Point of sale terminal
      Inventory.tsx      Product and stock management
      Transactions.tsx   Order history
      Settings.tsx       Business profile, themes, tax rules, sync
      Quotes.tsx         Quote management
      Admin.tsx          User management (admin only)
      Login.tsx          Authentication page
    hooks/               Custom React hooks
    lib/
      auth.ts            Auth state (Zustand store + localStorage cache)
      db.ts              Dexie database schema and seed data
      store.ts           Cart state (Zustand)
      sync.ts            Batched auto-sync with retry/backoff
      theme.ts           Color theme engine with presets
      utils.ts           Utility functions
    components/
      ErrorBoundary.tsx  Crash recovery wrapper
  public/                PWA manifest, service worker, icons

server/                  Backend (Express)
  index.ts               Server entry point (port 5000)
  routes.ts              Auth, admin, and sync API routes
  db.ts                  PostgreSQL connection (Drizzle + node-postgres)
  storage.ts             User CRUD operations
  vite.ts                Vite dev middleware
  static.ts              Production static file serving

shared/                  Shared code
  schema.ts              Drizzle schema (users, sessions, synced data tables)
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with username and password |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/me` | Get current authenticated user |
| POST | `/api/auth/register` | Create new user (admin only) |

### User Management (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create a new user |
| PATCH | `/api/admin/users/:id` | Update user (role, name, status, password) |

### Data Sync

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/sync/products` | Yes | Sync products (batched, 50 per request) |
| POST | `/api/sync/orders` | Yes | Sync completed orders |
| POST | `/api/sync/customers` | Yes | Sync customer records |
| POST | `/api/sync/business-settings` | Yes | Sync business profile |
| GET | `/api/sync/status` | No | Get server-side record counts |

## How It Works

Kaya POS uses an **offline-first architecture**:

1. **All data is stored locally** in the browser using IndexedDB (via Dexie). This means the app works even without internet.

2. **Authentication** happens on the server, but once logged in, your session is cached locally. You only need internet for the initial login.

3. **When online**, the app automatically syncs products, orders, customers, and business settings to PostgreSQL every 60 seconds. If sync fails, it retries with increasing delays (5s, 15s, 30s, 60s).

4. **The server** acts as a backup and sync target. Your data is safe even if you clear your browser.

5. **PWA support** means you can install the app on your phone or computer and use it like a regular app with offline support.

## Default Credentials

On first startup, a default admin account is created:

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

**Change this password immediately** after your first login.

## License

MIT
