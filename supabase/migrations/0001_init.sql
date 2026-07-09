-- ============================================================================
-- VOLGA ELEVATORS ERP — Full Database Schema
-- Run this in Supabase SQL Editor, or via `supabase db push` with the CLI.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================
create type user_role as enum ('admin', 'technician');
create type service_status as enum ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
create type complaint_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type payment_status as enum ('paid', 'pending', 'unpaid', 'overdue', 'partial');
create type amc_status as enum ('active', 'expired', 'cancelled');
create type attendance_status as enum ('present', 'absent', 'half_day', 'on_leave');
create type notification_type as enum (
  'new_complaint', 'new_service_request', 'amc_expiry',
  'payment_due', 'job_assigned', 'job_completed', 'general'
);

-- ============================================================================
-- PROFILES (extends auth.users)
-- ============================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role user_role not null default 'technician',
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_profiles_role on profiles(role);

-- ============================================================================
-- COMPANY SETTINGS (single row config table)
-- ============================================================================
create table company_settings (
  id int primary key default 1,
  company_name text not null default 'Volga Elevators Pvt Ltd',
  logo_url text,
  address text,
  phone text,
  email text,
  gst_number text,
  invoice_prefix text default 'VE-INV-',
  theme_primary text default '#0D9488',
  theme_secondary text default '#2DD4BF',
  theme_accent text default '#A7FEEB',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into company_settings (id) values (1);

-- ============================================================================
-- CUSTOMERS
-- ============================================================================
create table customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text unique not null,
  name text not null,
  email text,
  phone text not null,
  address text,
  city text,
  gst_number text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_customers_active on customers(is_active) where deleted_at is null;
create index idx_customers_search on customers using gin (to_tsvector('english', name || ' ' || coalesce(phone,'') || ' ' || coalesce(email,'')));

-- ============================================================================
-- BUILDINGS
-- ============================================================================
create table buildings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  name text not null,
  address text not null,
  city text,
  pincode text,
  total_floors int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_buildings_customer on buildings(customer_id);

-- ============================================================================
-- ELEVATORS
-- ============================================================================
create table elevators (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  elevator_code text unique not null,
  elevator_type text not null default 'Passenger',
  brand text,
  model text,
  capacity_kg int,
  floors_served int,
  installation_date date,
  last_service_date date,
  next_service_due date,
  status text not null default 'operational',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_elevators_building on elevators(building_id);
create index idx_elevators_next_service on elevators(next_service_due);

-- ============================================================================
-- AMC CONTRACTS
-- ============================================================================
create table amc_contracts (
  id uuid primary key default gen_random_uuid(),
  contract_number text unique not null,
  customer_id uuid not null references customers(id) on delete cascade,
  elevator_id uuid references elevators(id) on delete set null,
  start_date date not null,
  end_date date not null,
  contract_value numeric(12,2) not null default 0,
  visits_per_year int not null default 12,
  status amc_status not null default 'active',
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_amc_status on amc_contracts(status);
create index idx_amc_end_date on amc_contracts(end_date);

-- ============================================================================
-- TECHNICIANS (extra profile info; 1:1 with profiles where role = technician)
-- ============================================================================
create table technicians (
  id uuid primary key references profiles(id) on delete cascade,
  employee_code text unique not null,
  specialization text,
  base_salary numeric(12,2) not null default 0,
  join_date date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- SERVICE REQUESTS
-- ============================================================================
create table service_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text unique not null,
  customer_id uuid not null references customers(id),
  elevator_id uuid references elevators(id),
  assigned_technician_id uuid references technicians(id),
  request_type text not null default 'breakdown',
  priority text not null default 'normal',
  description text,
  status service_status not null default 'pending',
  scheduled_date date,
  completed_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_sr_status on service_requests(status);
create index idx_sr_technician on service_requests(assigned_technician_id);
create index idx_sr_scheduled on service_requests(scheduled_date);

-- ============================================================================
-- MAINTENANCE RECORDS
-- ============================================================================
create table maintenance_records (
  id uuid primary key default gen_random_uuid(),
  elevator_id uuid not null references elevators(id) on delete cascade,
  service_request_id uuid references service_requests(id),
  technician_id uuid references technicians(id),
  maintenance_type text not null default 'routine',
  work_performed text,
  parts_used text,
  service_date date not null default current_date,
  next_due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_mr_elevator on maintenance_records(elevator_id);

-- ============================================================================
-- COMPLAINTS
-- ============================================================================
create table complaints (
  id uuid primary key default gen_random_uuid(),
  complaint_number text unique not null,
  customer_id uuid not null references customers(id),
  elevator_id uuid references elevators(id),
  subject text not null,
  description text,
  status complaint_status not null default 'open',
  priority text not null default 'normal',
  assigned_technician_id uuid references technicians(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_complaints_status on complaints(status);

-- ============================================================================
-- PAYMENTS
-- ============================================================================
create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  customer_id uuid not null references customers(id),
  amc_contract_id uuid references amc_contracts(id),
  amount numeric(12,2) not null,
  amount_paid numeric(12,2) not null default 0,
  due_date date,
  paid_date date,
  status payment_status not null default 'pending',
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_payments_status on payments(status);
create index idx_payments_due on payments(due_date);

-- ============================================================================
-- TECHNICIAN SALARY
-- ============================================================================
create table technician_salary (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references technicians(id) on delete cascade,
  month int not null,
  year int not null,
  base_amount numeric(12,2) not null default 0,
  bonus numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  advances_deducted numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null default 0,
  paid_on date,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (technician_id, month, year)
);

-- ============================================================================
-- TECHNICIAN ADVANCES
-- ============================================================================
create table technician_advances (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references technicians(id) on delete cascade,
  amount numeric(12,2) not null,
  reason text,
  advance_date date not null default current_date,
  is_settled boolean not null default false,
  settled_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_advances_tech on technician_advances(technician_id);

-- ============================================================================
-- ATTENDANCE
-- ============================================================================
create table attendance (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references technicians(id) on delete cascade,
  date date not null default current_date,
  status attendance_status not null default 'present',
  check_in time,
  check_out time,
  notes text,
  created_at timestamptz not null default now(),
  unique (technician_id, date)
);
create index idx_attendance_date on attendance(date);

-- ============================================================================
-- INVENTORY (warehouse stock)
-- ============================================================================
create table inventory (
  id uuid primary key default gen_random_uuid(),
  item_code text unique not null,
  item_name text not null,
  category text,
  quantity int not null default 0,
  unit text not null default 'pcs',
  reorder_level int not null default 5,
  unit_cost numeric(12,2) not null default 0,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_inventory_low_stock on inventory(quantity, reorder_level);

-- ============================================================================
-- SPARE PARTS (parts catalog, distinct from generic inventory)
-- ============================================================================
create table spare_parts (
  id uuid primary key default gen_random_uuid(),
  part_code text unique not null,
  part_name text not null,
  compatible_brands text,
  stock_quantity int not null default 0,
  unit_price numeric(12,2) not null default 0,
  supplier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references profiles(id) on delete cascade,
  type notification_type not null default 'general',
  title text not null,
  message text,
  is_read boolean not null default false,
  related_table text,
  related_id uuid,
  created_at timestamptz not null default now()
);
create index idx_notifications_recipient on notifications(recipient_id, is_read);

-- ============================================================================
-- ACTIVITY LOGS (audit trail)
-- ============================================================================
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
create index idx_activity_logs_entity on activity_logs(entity_table, entity_id);
create index idx_activity_logs_created on activity_logs(created_at desc);

-- ============================================================================
-- updated_at trigger helper
-- ============================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'profiles','customers','buildings','elevators','amc_contracts','technicians',
      'service_requests','maintenance_records','complaints','payments',
      'technician_salary','technician_advances','inventory','spare_parts','company_settings'
    ])
  loop
    execute format('create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- activity log trigger helper (generic)
-- ============================================================================
create or replace function log_activity()
returns trigger as $$
begin
  insert into activity_logs (actor_id, action, entity_table, entity_id, details)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'customers','buildings','elevators','amc_contracts','service_requests',
      'complaints','payments','technician_salary','technician_advances','inventory'
    ])
  loop
    execute format('create trigger trg_log_activity after insert or update or delete on %I for each row execute function log_activity();', t);
  end loop;
end $$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table profiles enable row level security;
alter table company_settings enable row level security;
alter table customers enable row level security;
alter table buildings enable row level security;
alter table elevators enable row level security;
alter table amc_contracts enable row level security;
alter table technicians enable row level security;
alter table service_requests enable row level security;
alter table maintenance_records enable row level security;
alter table complaints enable row level security;
alter table payments enable row level security;
alter table technician_salary enable row level security;
alter table technician_advances enable row level security;
alter table attendance enable row level security;
alter table inventory enable row level security;
alter table spare_parts enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin' and is_active
  );
$$ language sql security definer stable;

-- PROFILES: everyone can read all profiles (needed for assigning jobs, showing names);
-- users can update only their own row; only admins can insert/delete others.
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_own_or_admin" on profiles for update using (auth.uid() = id or is_admin());
create policy "profiles_insert_admin" on profiles for insert with check (is_admin() or auth.uid() = id);
create policy "profiles_delete_admin" on profiles for delete using (is_admin());

-- COMPANY SETTINGS: everyone can read, only admin can write
create policy "settings_select_all" on company_settings for select using (true);
create policy "settings_update_admin" on company_settings for update using (is_admin());

-- Admin-only full access tables (customers, buildings, elevators, AMC, payments,
-- salary, advances, inventory, spare parts are business/financial data — admin managed,
-- technicians get read access where relevant to their jobs).
create policy "customers_all_admin" on customers for all using (is_admin()) with check (is_admin());
create policy "customers_select_tech" on customers for select using (not is_admin());

create policy "buildings_all_admin" on buildings for all using (is_admin()) with check (is_admin());
create policy "buildings_select_tech" on buildings for select using (not is_admin());

create policy "elevators_all_admin" on elevators for all using (is_admin()) with check (is_admin());
create policy "elevators_select_tech" on elevators for select using (not is_admin());

create policy "amc_all_admin" on amc_contracts for all using (is_admin()) with check (is_admin());

create policy "technicians_select_all" on technicians for select using (true);
create policy "technicians_write_admin" on technicians for all using (is_admin()) with check (is_admin());

-- SERVICE REQUESTS: admin full access; technician can see + update only their assigned jobs
create policy "sr_admin_all" on service_requests for all using (is_admin()) with check (is_admin());
create policy "sr_tech_select" on service_requests for select using (
  assigned_technician_id = auth.uid()
);
create policy "sr_tech_update_own" on service_requests for update using (
  assigned_technician_id = auth.uid()
) with check (assigned_technician_id = auth.uid());

create policy "mr_admin_all" on maintenance_records for all using (is_admin()) with check (is_admin());
create policy "mr_tech_select" on maintenance_records for select using (
  technician_id = auth.uid()
);
create policy "mr_tech_insert" on maintenance_records for insert with check (
  technician_id = auth.uid()
);

create policy "complaints_admin_all" on complaints for all using (is_admin()) with check (is_admin());
create policy "complaints_tech_select" on complaints for select using (
  assigned_technician_id = auth.uid()
);

create policy "payments_admin_all" on payments for all using (is_admin()) with check (is_admin());

create policy "salary_admin_all" on technician_salary for all using (is_admin()) with check (is_admin());
create policy "salary_tech_select_own" on technician_salary for select using (
  technician_id = auth.uid()
);

create policy "advances_admin_all" on technician_advances for all using (is_admin()) with check (is_admin());
create policy "advances_tech_select_own" on technician_advances for select using (
  technician_id = auth.uid()
);

create policy "attendance_admin_all" on attendance for all using (is_admin()) with check (is_admin());
create policy "attendance_tech_own" on attendance for select using (technician_id = auth.uid());
create policy "attendance_tech_insert_own" on attendance for insert with check (technician_id = auth.uid());
create policy "attendance_tech_update_own" on attendance for update using (technician_id = auth.uid());

create policy "inventory_admin_all" on inventory for all using (is_admin()) with check (is_admin());
create policy "inventory_tech_select" on inventory for select using (not is_admin());

create policy "spare_parts_admin_all" on spare_parts for all using (is_admin()) with check (is_admin());
create policy "spare_parts_tech_select" on spare_parts for select using (not is_admin());

create policy "notifications_own" on notifications for select using (recipient_id = auth.uid());
create policy "notifications_update_own" on notifications for update using (recipient_id = auth.uid());
create policy "notifications_admin_insert" on notifications for insert with check (true);

create policy "activity_logs_admin_select" on activity_logs for select using (is_admin());

-- ============================================================================
-- Notification triggers: fire on key events
-- ============================================================================
create or replace function notify_admins(p_type notification_type, p_title text, p_message text, p_table text, p_id uuid)
returns void as $$
begin
  insert into notifications (recipient_id, type, title, message, related_table, related_id)
  select id, p_type, p_title, p_message, p_table, p_id from profiles where role = 'admin' and is_active;
end;
$$ language plpgsql security definer;

create or replace function trg_notify_new_complaint()
returns trigger as $$
begin
  perform notify_admins('new_complaint', 'New complaint received', new.subject, 'complaints', new.id);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_complaint_created after insert on complaints
  for each row execute function trg_notify_new_complaint();

create or replace function trg_notify_new_service_request()
returns trigger as $$
begin
  perform notify_admins('new_service_request', 'New service request', new.request_number, 'service_requests', new.id);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_service_request_created after insert on service_requests
  for each row execute function trg_notify_new_service_request();

create or replace function trg_notify_job_assigned()
returns trigger as $$
begin
  if new.assigned_technician_id is not null and (old.assigned_technician_id is null or old.assigned_technician_id <> new.assigned_technician_id) then
    insert into notifications (recipient_id, type, title, message, related_table, related_id)
    values (new.assigned_technician_id, 'job_assigned', 'New job assigned', new.request_number, 'service_requests', new.id);
  end if;
  if new.status = 'completed' and old.status <> 'completed' then
    perform notify_admins('job_completed', 'Job completed', new.request_number, 'service_requests', new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer;
create trigger on_service_request_updated after update on service_requests
  for each row execute function trg_notify_job_assigned();

-- ============================================================================
-- DASHBOARD VIEWS (used by the admin/technician dashboards)
-- ============================================================================
create or replace view v_dashboard_admin_stats as
select
  (select count(*) from customers where deleted_at is null) as total_customers,
  (select count(*) from buildings where deleted_at is null) as total_buildings,
  (select count(*) from elevators where deleted_at is null) as total_elevators,
  (select count(*) from amc_contracts where status = 'active') as active_amc,
  (select count(*) from amc_contracts where status = 'expired') as expired_amc,
  (select count(*) from service_requests where scheduled_date = current_date and deleted_at is null) as today_services,
  (select count(*) from service_requests where status in ('pending','assigned') and deleted_at is null) as pending_services,
  (select count(*) from service_requests where status = 'completed' and deleted_at is null) as completed_services,
  (select coalesce(sum(amount_paid),0) from payments) as total_revenue,
  (select count(*) from complaints where status = 'open') as open_complaints,
  (select count(*) from complaints where status = 'resolved') as resolved_complaints;

grant select on v_dashboard_admin_stats to authenticated;

-- Seed a couple of demo lookups (safe defaults, no PII)
comment on schema public is 'Volga Elevators ERP schema — generated for Supabase deployment.';
