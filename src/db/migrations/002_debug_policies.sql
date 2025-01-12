-- First, drop existing policies
drop policy if exists "Allow public insert for new users" on users;
drop policy if exists "Allow users to read their own data" on users;
drop policy if exists "Allow admins to read all data" on users;

-- Create more permissive policies for debugging
create policy "Allow all operations" on users
    for all
    using (true)
    with check (true);

-- Verify RLS is enabled but not blocking operations
alter table users enable row level security; 