-- ============================================================================
-- STORAGE BUCKETS
-- Run after 0001_init.sql. Creates all buckets required by the ERP and locks
-- them down so only authenticated users can read/write, admins can delete.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('customer-documents', 'customer-documents', false, 20971520),
  ('elevator-documents', 'elevator-documents', false, 20971520),
  ('service-reports', 'service-reports', false, 20971520),
  ('images', 'images', true, 10485760),
  ('invoices', 'invoices', false, 10485760),
  ('pdf-reports', 'pdf-reports', false, 20971520),
  ('technician-documents', 'technician-documents', false, 20971520),
  ('company-assets', 'company-assets', true, 5242880)
on conflict (id) do nothing;

-- Authenticated users can read from private buckets; admins can write/delete.
-- Images and company-assets are public-read (e.g. logos) but still admin-write.
do $$
declare b text;
begin
  for b in
    select unnest(array[
      'customer-documents','elevator-documents','service-reports',
      'invoices','pdf-reports','technician-documents'
    ])
  loop
    execute format($f$
      create policy "%1$s_read" on storage.objects for select
        using (bucket_id = '%1$s' and auth.role() = 'authenticated');
    $f$, b);
    execute format($f$
      create policy "%1$s_write" on storage.objects for insert
        with check (bucket_id = '%1$s' and is_admin());
    $f$, b);
    execute format($f$
      create policy "%1$s_update" on storage.objects for update
        using (bucket_id = '%1$s' and is_admin());
    $f$, b);
    execute format($f$
      create policy "%1$s_delete" on storage.objects for delete
        using (bucket_id = '%1$s' and is_admin());
    $f$, b);
  end loop;
end $$;

-- Public buckets: anyone can read, only admin can write
create policy "images_public_read" on storage.objects for select using (bucket_id = 'images');
create policy "images_admin_write" on storage.objects for insert with check (bucket_id = 'images' and is_admin());
create policy "images_admin_update" on storage.objects for update using (bucket_id = 'images' and is_admin());
create policy "images_admin_delete" on storage.objects for delete using (bucket_id = 'images' and is_admin());

create policy "company_assets_public_read" on storage.objects for select using (bucket_id = 'company-assets');
create policy "company_assets_admin_write" on storage.objects for insert with check (bucket_id = 'company-assets' and is_admin());
create policy "company_assets_admin_update" on storage.objects for update using (bucket_id = 'company-assets' and is_admin());
create policy "company_assets_admin_delete" on storage.objects for delete using (bucket_id = 'company-assets' and is_admin());
