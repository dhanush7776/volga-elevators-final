# Volga Elevators — Smart ERP

A full-stack elevator service/AMC/maintenance ERP. Next.js 14 (App Router) frontend
+ Supabase (Postgres, Auth, Storage, Realtime, RLS) backend. Mint/aqua glassmorphism
theme, role-based access (Admin / Technician), and a config-driven CRUD engine that
gives every module search, sort, filter, pagination, PDF/Excel/CSV export, and print
for free.

## 1. Create your Supabase project

1. Go to https://supabase.com/dashboard and create a new project.
2. Wait for it to finish provisioning, then open **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (keep this secret, server-side only)

## 2. Run the database migrations

Open **SQL Editor** in the Supabase dashboard and run, in order:

1. `supabase/migrations/0001_init.sql` — all tables, enums, RLS policies, triggers, views
2. `supabase/migrations/0002_storage.sql` — storage buckets + storage policies
3. `supabase/seed.sql` — optional demo data (read the comments — this is also where
   you create your first Admin login)

Or, if you use the Supabase CLI locally:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## 3. Create your first Admin user

1. Supabase Dashboard → **Authentication → Users → Add user**. Set an email + password.
2. Copy the generated **User UID**.
3. In the SQL Editor:

```sql
insert into profiles (id, full_name, email, role, is_active)
values ('paste-user-uid-here', 'Admin User', 'admin@example.com', 'admin', true);
```

4. You can now log in at `/login` with that email/password.

To add a technician, repeat with `role = 'technician'` and also insert a row into
`technicians` (see comments in `supabase/seed.sql`).

## 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` from step 1.

## 5. Install & run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to `/login`.

## 6. Deploy

**Vercel (recommended):**
1. Push this project to a GitHub repo.
2. Import it at https://vercel.com/new.
3. Add the same environment variables from `.env.local` in Vercel's project settings.
4. Deploy.

Any other Next.js-compatible host (Netlify, Render, your own server via `npm run build && npm run start`) works the same way — just set the same env vars.

## Project structure

```
app/
  login/                     Login + password reset
  dashboard/
    layout.tsx               Sidebar + auth guard shell
    page.tsx                 Admin dashboard (stats, revenue chart, complaints, activity)
    technician/page.tsx      Technician dashboard (assigned/pending/completed jobs)
    modules/[slug]/page.tsx  Generic module route — driven by lib/modules.ts
    settings/page.tsx        Company settings (logo, invoice prefix, GST, etc.)
    search/page.tsx          Global search across every module
lib/
  modules.ts                 ⭐ The registry: every module's table, columns, form
                              fields, and role permissions. Add a new module by
                              adding one object here — no new page needed.
  supabase/                  Browser / server / middleware Supabase clients
  export.ts                  PDF (jsPDF), Excel (SheetJS), CSV export
  date-ranges.ts             Today/Yesterday/This Week/.../Custom Range presets
  auth-context.tsx           React auth/profile context
components/
  CrudPage.tsx                The generic table+form+export+print engine
  crud/FormModal.tsx          Dynamic add/edit form, built from field config
  crud/ExportMenu.tsx          Export dropdown with date-range presets
  charts/                      Revenue + complaint charts (Recharts)
supabase/
  migrations/0001_init.sql    Full schema, enums, RLS policies, triggers, views
  migrations/0002_storage.sql Storage buckets + policies
  seed.sql                    Demo data + first-admin instructions
```

## Adding a new module

Everything about a module — its table, which columns show in the list, which
fields appear in the add/edit form, who can see/write it — lives in one place:
`lib/modules.ts`. To add a new module:

1. Add a table to a new migration file in `supabase/migrations/`.
2. Add one `ModuleConfig` object to the `MODULES` array in `lib/modules.ts`.
3. It automatically gets a sidebar link, and full CRUD with search, sort,
   filter, pagination, export, and print — no new page or component needed.

## Roles & permissions

- **Admin**: full access to every module, company settings, technician salary/advances, reports.
- **Technician**: sees their own dashboard (assigned/pending/completed jobs,
  today's schedule, attendance, salary, advances, notifications), can update
  their own service requests and attendance, and has read-only access to
  customers/buildings/elevators/inventory so they have context on the job.

All of this is enforced twice: once in the UI (buttons hidden when a role
can't act) and once in the database via Postgres Row Level Security — so even
a direct API call can't bypass permissions.

## Notes on what's included vs. what to customize

- The schema and CRUD engine cover all 18 modules from the spec (Customers,
  Buildings, Elevators, Service Requests, Maintenance Records, AMC Contracts,
  Complaints, Payments, Technician Salary/Advances, Attendance, Inventory,
  Spare Parts, Notifications, Activity Logs, Company Settings) plus Admin and
  Technician dashboards.
- Exports and printing work on every module out of the box.
- Notifications fire automatically via Postgres triggers on new complaints,
  new service requests, job assignment, and job completion — no extra backend
  code required.
- File uploads (customer documents, service reports, technician documents,
  etc.) use the Supabase Storage buckets created in `0002_storage.sql`. Wire
  up an upload button anywhere with `supabase.storage.from('bucket-name').upload(...)`
  the same way `settings/page.tsx` does for the company logo.
- The color theme (mint/aqua glass) lives in `tailwind.config.ts` — change the
  `mint` and `navy` color scales there to re-theme the whole app in one place.
