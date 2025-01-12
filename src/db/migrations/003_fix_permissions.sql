-- Grant usage on schema
grant usage on schema public to anon, authenticated;

-- Grant table permissions
grant all privileges on table public.users to anon, authenticated;

-- Grant sequence permissions if you're using identity columns
grant usage, select on all sequences in schema public to anon, authenticated;

-- Recreate policies with simpler conditions for testing
drop policy if exists "Allow all operations" on users;

create policy "Enable all access" on public.users
    for all
    to anon, authenticated
    using (true)
    with check (true); 