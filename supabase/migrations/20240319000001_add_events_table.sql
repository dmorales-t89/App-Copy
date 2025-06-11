-- Create events table
create table public.events (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    date timestamp with time zone not null,
    start_time text,
    end_time text,
    color text not null,
    image_url text,
    group_id text not null,
    notes text
);

-- Set up Row Level Security (RLS)
alter table public.events enable row level security;

-- Create policy to allow users to select their own events
create policy "Users can view their own events"
on public.events
for select
using (auth.uid() = user_id);

-- Create policy to allow users to insert their own events
create policy "Users can insert their own events"
on public.events
for insert
with check (auth.uid() = user_id);

-- Create policy to allow users to update their own events
create policy "Users can update their own events"
on public.events
for update
using (auth.uid() = user_id);

-- Create policy to allow users to delete their own events
create policy "Users can delete their own events"
on public.events
for delete
using (auth.uid() = user_id); 