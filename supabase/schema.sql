-- =====================================================================
-- Mapstar — Supabase / PostgreSQL Production Schema & Clean Wipe
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New Query)
-- =====================================================================

-- 1. Enable PostGIS extension for geo-spatial indexing
create extension if not exists postgis;

-- 2. Add geometry column to "Property" (if not already present)
alter table "Property"
  add column if not exists geom geography(Point, 4326);

-- 3. Trigger to keep geom in sync with lat/lng
create or replace function mapstar_sync_geom()
returns trigger as $$ begin
  if new.longitude is not null and new.latitude is not null then
    new.geom := st_setsrid(st_makepoint(new.longitude, new.latitude), 4326)::geography;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_property_geom on "Property";
create trigger trg_property_geom
  before insert or update on "Property"
  for each row execute function mapstar_sync_geom();

-- 4. Spatial index for fast map-viewport queries
create index if not exists idx_property_geom on "Property" using gist (geom);

-- 5. Verification Applications Table
create table if not exists "VerificationApplication" (
  id text primary key,
  "userId" text not null,
  "userEmail" text not null,
  "fullName" text not null,
  phone text,
  type text not null default 'IDENTITY',
  nin text,
  bvn text,
  "businessName" text,
  "propertyOrOfficeAddress" text,
  notes text,
  status text not null default 'PENDING',
  "reviewedAt" timestamp with time zone,
  "reviewedBy" text,
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);

-- 6. Seed Regulated Fee Configuration
insert into "FeeConfig" (
  id, "successFeePercent", "agentFeeCapPercent", "tenantServiceFeeNaira",
  "agreementFeeNaira", "featuredBoost7DayNaira", "featuredBoost14DayNaira",
  "verifiedAgentAnnualNaira", "referralBountyNaira", "fairPriceTolerancePercent",
  "stampDutyPercent", "firstAgreementFreePerLandlord", "firstTimeLandlordListingCap",
  "updatedAt"
) values (
  'fee_config_default',
  3.0, 5.0, 3000,
  3000, 5000, 12000,
  10000, 1000, 10.0,
  0.78, true, 2,
  now()
)
on conflict (id) do nothing;

-- 7. Seed & Preserve Master Administrator Account
insert into "User" (
  id, email, "fullName", phone, role, "ninVerified", "bvnVerified", "passwordHash", "createdAt", "updatedAt"
) values (
  'user_admin_01',
  'mapstar777@gmail.com',
  'Mapking',
  '08000000000',
  'ADMIN',
  true,
  true,
  'e8f49a12c3b5706d:cf1abeb09a439092ef287e9a1f47c73eb260f2fb4612f8642f118444f4241f67:sha256',
  now(),
  now()
)
on conflict (email) do update set
  role = 'ADMIN',
  "ninVerified" = true,
  "bvnVerified" = true;

-- 8. CLEAN DATABASE WIPE: Purge all mock listings, properties, and non-admin users
delete from "Transaction" where id is not null;
delete from "Agreement" where id is not null;
delete from "Review" where id is not null;
delete from "Report" where id is not null;
delete from "SavedSearch" where id is not null;
delete from "Referral" where id is not null;
delete from "Listing" where id is not null;
delete from "Property" where id is not null;
delete from "Landlord" where id is not null;
delete from "Agent" where id is not null;
delete from "VerificationApplication" where id is not null;
delete from "User" where id != 'user_admin_01' and email != 'mapstar777@gmail.com';

-- 9. Row-Level Security (RLS) Policies for Mapstar Full Application Access
alter table "User" enable row level security;
drop policy if exists "Mapstar full user access" on "User";
create policy "Mapstar full user access" on "User" for all using (true) with check (true);

alter table "Property" enable row level security;
drop policy if exists "Mapstar full property access" on "Property";
create policy "Mapstar full property access" on "Property" for all using (true) with check (true);

alter table "Listing" enable row level security;
drop policy if exists "Mapstar full listing access" on "Listing";
create policy "Mapstar full listing access" on "Listing" for all using (true) with check (true);

alter table "VerificationApplication" enable row level security;
drop policy if exists "Mapstar full verification access" on "VerificationApplication";
create policy "Mapstar full verification access" on "VerificationApplication" for all using (true) with check (true);

alter table "FeeConfig" enable row level security;
drop policy if exists "Mapstar full feeconfig access" on "FeeConfig";
create policy "Mapstar full feeconfig access" on "FeeConfig" for all using (true) with check (true);

-- 10. Spatial Query Helper — listings within radius
create or replace function listings_within_radius(
  p_lat double precision,
  p_lng double precision,
  p_radius_meters integer
)
returns table (
  id text,
  property_id text,
  status text,
  annual_rent integer,
  distance_meters double precision
)
language sql as $$
  select l.id, l."propertyId", l.status::text, l."annualRent",
         st_distance(p.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography)::integer as distance_meters
  from "Listing" l
  join "Property" p on p.id = l."propertyId"
  where st_dwithin(p.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
    and l.status in ('AVAILABLE', 'COMING_SOON', 'VERIFIED')
  order by distance_meters asc;
$$;
