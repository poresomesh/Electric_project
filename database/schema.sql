-- VoltWise production schema (PostgreSQL / Neon)
-- The current client can continue using the shared-state adapter while these
-- tables are introduced behind the API.

create table if not exists app_users (
  id uuid primary key,
  username text not null unique,
  display_name text not null,
  role text not null check (role in ('admin', 'block_incharge', 'viewer')),
  assigned_block_id uuid null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists blocks (
  id uuid primary key,
  name text not null,
  code text not null unique,
  category text not null,
  incharge_id uuid null references app_users(id),
  created_at timestamptz not null default now()
);

alter table app_users
  add constraint app_users_assigned_block_fk
  foreign key (assigned_block_id) references blocks(id);

create table if not exists meters (
  id uuid primary key,
  block_id uuid not null references blocks(id) on delete cascade,
  meter_number text not null unique,
  multiplier numeric(12,4) not null default 1 check (multiplier > 0),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists meter_readings (
  id uuid primary key,
  meter_id uuid not null references meters(id) on delete cascade,
  block_id uuid not null references blocks(id) on delete cascade,
  reading_date date not null,
  reading_time time not null,
  previous_reading numeric(18,4) not null check (previous_reading >= 0),
  current_reading numeric(18,4) not null check (current_reading >= previous_reading),
  units_consumed numeric(18,4) not null check (units_consumed >= 0),
  entered_by uuid not null references app_users(id),
  notes text,
  created_at timestamptz not null default now(),
  unique (meter_id, reading_date, reading_time)
);

create table if not exists daily_limit_policies (
  id uuid primary key,
  block_id uuid not null references blocks(id) on delete cascade,
  daily_limit_units numeric(18,4) not null check (daily_limit_units > 0),
  effective_from date not null,
  updated_by uuid not null references app_users(id),
  updated_at timestamptz not null default now(),
  unique (block_id, effective_from)
);

create table if not exists daily_exceedances (
  id uuid primary key,
  block_id uuid not null references blocks(id) on delete cascade,
  reading_date date not null,
  consumed_units numeric(18,4) not null,
  daily_limit_units numeric(18,4) not null,
  excess_units numeric(18,4) not null check (excess_units > 0),
  status text not null default 'open' check (status in ('open', 'responded', 'acknowledged')),
  remark text,
  responded_by uuid null references app_users(id),
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key,
  exceedance_id uuid not null references daily_exceedances(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists notification_receipts (
  notification_id uuid not null references notifications(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create index if not exists meter_readings_block_date_idx on meter_readings(block_id, reading_date);
create index if not exists daily_exceedances_block_date_idx on daily_exceedances(block_id, reading_date desc);
create index if not exists notifications_created_idx on notifications(created_at desc);

-- API authorization must enforce:
--   admin: all blocks and all exceedances
--   block_incharge: only assigned_block_id
--   viewer: read-only access according to product policy
-- Never rely on UI filtering as the authorization boundary.

-- Transitional shared-state table used by the current API adapter.
-- The normalized tables above are the target production model; this table
-- keeps existing clients compatible during the migration.
create table if not exists campus_state (
  id text primary key,
  version integer not null default 0,
  payload text not null,
  updated_at timestamptz not null default now()
);
