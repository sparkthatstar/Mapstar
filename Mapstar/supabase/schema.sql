-- =====================================================================
-- Mapstar — Supabase / PostgreSQL production schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New Query)
-- after running `bun run db:push` against your Supabase project.
-- =====================================================================

-- 1. Enable PostGIS extension
create extension if not exists postgis;

-- 2. Add geometry column to "Property" (populated by trigger from lat/lng)
alter table "Property"
  add column if not exists geom geography(Point, 4326);

-- 3. Populate geom from lat/lng for existing rows
update "Property"
  set geom = st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
  where geom is null and latitude is not null and longitude is not null;

-- 4. Trigger to keep geom in sync with lat/lng
create or replace function mapstar_sync_geom()
returns trigger as $$ begin
  new.geom := st_setsrid(st_makepoint(new.longitude, new.latitude), 4326)::geography;
  return new;
end;
 $$ language plpgsql;

drop trigger if exists trg_property_geom on "Property";
create trigger trg_property_geom
  before insert or update on "Property"
  for each row execute function mapstar_sync_geom();

-- 5. Spatial index for fast map-viewport queries
create index if not exists idx_property_geom on "Property" using gist (geom);

-- 6. Seed FeeConfig (admin-regulated fees)
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

-- 7. Spatial query helper — listings within radius of a point (e.g. school)
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
language sql as $$   select l.id, l."propertyId", l.status::text, l."annualRent",
         st_distance(p.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography)::integer as distance_meters
  from "Listing" l
  join "Property" p on p.id = l."propertyId"
  where st_dwithin(p.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
    and l.status in ('AVAILABLE', 'COMING_SOON', 'VERIFIED')
  order by distance_meters asc;
 $$;

-- 8. Seed anchor properties (Owerri + Enugu) — for beta launch demo
insert into "Property" (
  id, "landlordId", "agentId", title, description, "propertyType",
  city, state, area, address, latitude, longitude,
  bedrooms, bathrooms, toilets, "parkingSpaces",
  furnished, "hasBorehole", "hasPrepaidMeter", "hasInsideToilet"
) values
  ('prop_owerri_1', null, null, 'Self-con near IMSU main gate',
   'Newly built self-contained with prepaid meter, borehole water, tiled floors.',
   'SELF_CONTAINED', 'Owerri', 'Imo', 'Ikenegbu', '12 Ikenegbu Layout',
   5.497, 7.025, 0, 1, 1, 0, false, true, true, true),
  ('prop_owerri_2', null, null, '2-Bedroom flat in Works Layout',
   'Spacious 2-bedroom flat with inside toilet, prepaid meter, parking for 2 cars.',
   'TWO_BEDROOM_FLAT', 'Owerri', 'Imo', 'Works Layout', '8 Works Layout Ave',
   5.489, 7.030, 2, 2, 2, 2, false, true, true, true),
  ('prop_owerri_3', null, null, 'Room & parlour near Relief Market',
   'Affordable room & parlour self-con for students and young professionals.',
   'ROOM_PARLOUR', 'Owerri', 'Imo', 'Relief', '5 Relief Market Rd',
   5.482, 7.014, 0, 1, 1, 0, false, false, false, true),
  ('prop_owerri_4', null, null, 'Mini-flat in New Owerri',
   'Modern mini-flat in gated estate, close to Concord Hotel.',
   'MINI_FLAT', 'Owerri', 'Imo', 'New Owerri', '21 Concord Ave',
   5.458, 7.040, 1, 1, 1, 1, true, true, true, true),
  ('prop_owerri_5', null, null, '3-Bedroom flat in Aladinma',
   'Family-friendly 3-bedroom flat with borehole, generator wiring, ample parking.',
   'THREE_BEDROOM_FLAT', 'Owerri', 'Imo', 'Aladinma', '34 Aladinma I',
   5.505, 7.038, 3, 3, 3, 2, false, true, true, true),
  ('prop_enugu_1', null, null, 'Self-con near UNN gate',
   'Compact self-con for students, 5min walk to UNN main gate.',
   'SELF_CONTAINED', 'Enugu', 'Enugu', 'Nsukka', 'UNN Rd',
   6.861, 7.396, 0, 1, 1, 0, false, false, false, true),
  ('prop_enugu_2', null, null, '2-Bedroom flat in Independence Layout',
   'Executive 2-bedroom flat in Independence Layout, close to govt house.',
   'TWO_BEDROOM_FLAT', 'Enugu', 'Enugu', 'Independence Layout', '12 Independence Ave',
   6.454, 7.516, 2, 2, 2, 2, true, true, true, true),
  ('prop_enugu_3', null, null, 'Mini-flat in Trans-Ekulu',
   'Mini-flat in serene Trans-Ekulu neighborhood, prepaid meter installed.',
   'MINI_FLAT', 'Enugu', 'Enugu', 'Trans-Ekulu', '8 Trans-Ekulu Rd',
   6.470, 7.540, 1, 1, 1, 1, false, true, true, true),
  ('prop_enugu_4', null, null, '3-Bedroom flat in G.R.A.',
   'Premium 3-bedroom flat in Government Reserved Area with 24/7 security.',
   'THREE_BEDROOM_FLAT', 'Enugu', 'Enugu', 'G.R.A.', '5 G.R.A. Enugu',
   6.448, 7.504, 3, 3, 3, 3, true, true, true, true),
  ('prop_enugu_5', null, null, 'Room & parlour in Abakpa',
   'Budget-friendly room & parlour in Abakpa Nike, 10min to ESUT.',
   'ROOM_PARLOUR', 'Enugu', 'Enugu', 'Abakpa', '22 Abakpa Nike',
   6.482, 7.532, 0, 1, 1, 0, false, false, false, true)
on conflict (id) do nothing;

-- 9. Seed listings on the anchor properties
insert into "Listing" (
  id, "propertyId", status, "annualRent", "cautionFee", "legalFee", "agentFeeCap",
  "availableFrom", "vacatingDate", "comingSoon", "featured",
  "physicallyVerified", "lastVerifiedAt", "photoCount",
  "has360Tour", "hasVideoWalkthrough", "fairPriceBadge"
) values
  ('list_1', 'prop_owerri_1', 'AVAILABLE', 180000, 18000, 10000, 9000, now(), null, false, true, true, now(), 8, true, true, true),
  ('list_2', 'prop_owerri_2', 'AVAILABLE', 850000, 85000, 50000, 42500, now(), null, false, false, true, now() - interval '5 days', 8, true, true, true),
  ('list_3', 'prop_owerri_3', 'AVAILABLE', 120000, 12000, 5000, 6000, now(), null, false, false, false, null, 4, false, false, true),
  ('list_4', 'prop_owerri_4', 'COMING_SOON', 350000, 35000, 20000, 17500, now() + interval '21 days', now() + interval '21 days', true, false, false, null, 6, true, false, true),
  ('list_5', 'prop_owerri_5', 'AVAILABLE', 1100000, 110000, 60000, 55000, now(), null, false, true, true, now() - interval '2 days', 10, true, true, true),
  ('list_6', 'prop_enugu_1', 'AVAILABLE', 150000, 15000, 5000, 7500, now(), null, false, false, false, null, 4, false, false, true),
  ('list_7', 'prop_enugu_2', 'AVAILABLE', 1200000, 120000, 70000, 60000, now(), null, false, true, true, now() - interval '1 day', 10, true, true, true),
  ('list_8', 'prop_enugu_3', 'AVAILABLE', 450000, 45000, 25000, 22500, now(), null, false, false, true, now() - interval '7 days', 8, true, true, true),
  ('list_9', 'prop_enugu_4', 'AVAILABLE', 1500000, 150000, 80000, 75000, now(), null, false, true, true, now(), 12, true, true, true),
  ('list_10', 'prop_enugu_5', 'AVAILABLE', 100000, 10000, 5000, 5000, now(), null, false, false, false, null, 4, false, false, true)
on conflict (id) do nothing;

-- 10. Enable Row-Level Security policies
alter table "Property" enable row level security;
alter table "Listing" enable row level security;

drop policy if exists "Public read properties" on "Property";
create policy "Public read properties" on "Property"
  for select using (true);

drop policy if exists "Public read listings" on "Listing";
create policy "Public read listings" on "Listing"
  for select using (true);
