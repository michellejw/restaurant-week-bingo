-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create users table
create table public.users (
    id uuid primary key default uuid_generate_v4(),
    email text unique not null,
    name text,
    isAdmin boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Create policies for users table
create policy "Allow public insert for new users" on public.users
    for insert
    with check (true);

create policy "Allow users to read their own data" on public.users
    for select
    using (auth.jwt() ->> 'email' = email);

create policy "Allow admins to read all data" on public.users
    for select
    using (
        exists (
            select 1 from public.users
            where email = auth.jwt() ->> 'email'
            and isAdmin = true
        )
    );

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger on_users_updated
    before update on public.users
    for each row
    execute function public.handle_updated_at(); 