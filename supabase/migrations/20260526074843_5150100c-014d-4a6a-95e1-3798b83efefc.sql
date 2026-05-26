
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  university text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, university)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'university'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  subject text not null,
  subject_slug text not null,
  university text not null,
  author text not null,
  pages integer not null default 0,
  downloads integer not null default 0,
  rating numeric(2,1) not null default 0,
  price integer not null default 0,
  premium boolean not null default false,
  cover text not null default 'from-blue-500 via-indigo-500 to-violet-600',
  preview text not null default '',
  tags text[] not null default '{}',
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

create index notes_subject_slug_idx on public.notes (subject_slug);
create index notes_university_idx on public.notes (university);
create index notes_created_at_idx on public.notes (created_at desc);

alter table public.notes enable row level security;

create policy "Approved notes are public"
  on public.notes for select to anon, authenticated using (approved = true);
create policy "Users can view own notes"
  on public.notes for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own notes"
  on public.notes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own notes"
  on public.notes for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own notes"
  on public.notes for delete to authenticated using (auth.uid() = user_id);
