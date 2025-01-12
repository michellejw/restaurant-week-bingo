-- Drop existing policies if they exist
drop policy if exists "Enable insert for authenticated users only" on users;
drop policy if exists "Enable select for authenticated users only" on users;

-- Create new policies
create policy "Allow public insert" on users
  for insert
  with check (true);  -- Allows any insert

create policy "Allow public select" on users
  for select
  using (true);  -- Allows any select

-- Make sure RLS is enabled
alter table users enable row level security; 