-- ============================================================================
-- SEED DATA — optional, safe to skip in production.
-- Creates one demo customer/building/elevator so the dashboard isn't empty.
-- ============================================================================

insert into customers (customer_code, name, phone, email, city, is_active)
values ('CUST-001', 'Skyline Apartments', '9876500001', 'contact@skyline.example', 'Mumbai', true)
on conflict (customer_code) do nothing;

-- ============================================================================
-- CREATING YOUR FIRST ADMIN USER
-- ============================================================================
-- 1. In the Supabase Dashboard: Authentication -> Users -> Add user
--    Create a user with your email + a password. Copy the generated User UID.
-- 2. Run this, replacing the UID and details:
--
--    insert into profiles (id, full_name, email, role, is_active)
--    values ('paste-user-uid-here', 'Admin User', 'admin@example.com', 'admin', true);
--
-- 3. Log in at /login with that email + password — you'll land on the admin
--    dashboard with full access.
--
-- To create a technician: create the auth user the same way, then:
--    insert into profiles (id, full_name, email, role, is_active)
--    values ('tech-user-uid', 'Ramesh Kumar', 'ramesh@example.com', 'technician', true);
--    insert into technicians (id, employee_code, specialization)
--    values ('tech-user-uid', 'TECH-001', 'Elevator Mechanic');
