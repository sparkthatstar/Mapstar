# Mapstar

> Find lodges in Nigeria. Skip the agent fees.

A live map of verified rental lodges in Imo and Enugu — green stars = available now, orange = coming soon, red = physically verified by Mapstar. Direct-from-landlord rentals, escrow deposits, e-signed tenancy agreements, and admin-regulated agent fee caps.

## What's built (this scaffold)

- **Map-first home interface** with star-shaped colored pins (green/orange/blue/grey/red)
- **Map ↔ List toggle** with stateful filter/sort preservation
- **Advanced filter panel** — price, lodge type, amenities, trust signals, sort
- **Listing detail modal** with full fee breakdown computed live from the admin FeeConfig table
- **Admin portal** at `/admin` — separated from the public app, no link visible to landlords/tenants
- **Admin login** with HTTP-only signed cookie session (7-day TTL, HMAC-SHA256)
- **6-tab admin dashboard**: Overview, Fee Configuration, Listings, Users, Reports Queue, Analytics
- **FeeConfig table** — admin-regulated single-row table; all fee calculations read from here at runtime
- **Server-side auth enforcement** on `PATCH /api/fees` — 401 without admin session
- **Supabase-ready Prisma schema** with PostGIS extension (raw SQL in `supabase/schema.sql`)
- **API routes**: `GET/PATCH /api/fees`, `GET /api/listings`, `POST /api/admin/login`, `POST /api/admin/logout`
- **Mock seed data**: 14 listings across Owerri & Enugu anchor neighborhoods
- **Middleware** adds `X-Robots-Tag: noindex` on `/admin/*` so search engines never index it

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Map | react-leaflet + OpenStreetMap (swap to Mapbox in production via `NEXT_PUBLIC_MAPBOX_TOKEN`) |
| DB | Prisma ORM + SQLite (dev) / PostgreSQL (Supabase, prod) |
| Geo | PostGIS extension (raw SQL; Prisma cannot natively create geography columns) |
| Auth (planned) | Supabase Auth + VerifyMe KYC |
| Payments (planned) | Paystack + Flutterwave backup |
| E-sign (planned) | YouSign |
| Hosting | Vercel (frontend) + Supabase (DB + Auth) |

## Quick start (dev sandbox)

```bash
bun install
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET
bun run db:push      # creates SQLite db
bun run scripts/seed.ts  # seeds FeeConfig row
bun run dev          # http://localhost:3000
```
