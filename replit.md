# Kaya POS

## Overview
A Point of Sale (POS) application built with a full-stack TypeScript architecture. Features a dashboard with revenue overview, order tracking, customer management, and a POS terminal.

## Project Architecture

### Tech Stack
- **Frontend**: React 19 + Vite + TailwindCSS v4 + shadcn/ui components
- **Backend**: Express 5 (TypeScript) serving both API and client
- **Database**: PostgreSQL (via Drizzle ORM)
- **State Management**: Zustand + TanStack React Query
- **Routing**: Wouter
- **Offline Storage**: Dexie (IndexedDB)

### Directory Structure
```
client/          - React frontend (Vite)
  src/
    components/  - UI components (shadcn/ui based)
    pages/       - Route pages
    hooks/       - Custom React hooks
    lib/         - Utility functions
    assets/      - Static assets
server/          - Express backend
  index.ts       - Server entry point (port 5000)
  routes.ts      - API routes (/api prefix)
  storage.ts     - Storage interface (in-memory)
  vite.ts        - Vite dev middleware
  static.ts      - Production static file serving
shared/          - Shared code (schema, types)
  schema.ts      - Drizzle schema definitions
script/          - Build scripts
  build.ts       - Production build (esbuild + vite)
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

## Recent Changes
- 2026-02-19: Initial setup in Replit environment, database provisioned, dependencies installed
