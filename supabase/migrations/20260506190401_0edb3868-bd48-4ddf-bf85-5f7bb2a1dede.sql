
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency text not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Categories
create type public.tx_type as enum ('income', 'expense');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type public.tx_type not null,
  color text not null default '#8b5cf6',
  icon text not null default 'Tag',
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "own cat select" on public.categories for select using (auth.uid() = user_id);
create policy "own cat insert" on public.categories for insert with check (auth.uid() = user_id);
create policy "own cat update" on public.categories for update using (auth.uid() = user_id);
create policy "own cat delete" on public.categories for delete using (auth.uid() = user_id);

-- Transactions
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type public.tx_type not null,
  amount numeric(14,2) not null check (amount >= 0),
  description text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "own tx select" on public.transactions for select using (auth.uid() = user_id);
create policy "own tx insert" on public.transactions for insert with check (auth.uid() = user_id);
create policy "own tx update" on public.transactions for update using (auth.uid() = user_id);
create policy "own tx delete" on public.transactions for delete using (auth.uid() = user_id);
create index on public.transactions (user_id, occurred_at desc);

-- Goals
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  deadline date,
  color text not null default '#06b6d4',
  created_at timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy "own goal select" on public.goals for select using (auth.uid() = user_id);
create policy "own goal insert" on public.goals for insert with check (auth.uid() = user_id);
create policy "own goal update" on public.goals for update using (auth.uid() = user_id);
create policy "own goal delete" on public.goals for delete using (auth.uid() = user_id);

-- AI recommendations
create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  focus text not null default 'general',
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.ai_recommendations enable row level security;
create policy "own ai select" on public.ai_recommendations for select using (auth.uid() = user_id);
create policy "own ai insert" on public.ai_recommendations for insert with check (auth.uid() = user_id);
create policy "own ai delete" on public.ai_recommendations for delete using (auth.uid() = user_id);

-- Trigger to create profile + default categories on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Salário', 'income', '#10b981', 'Wallet'),
    (new.id, 'Freelance', 'income', '#22c55e', 'Briefcase'),
    (new.id, 'Investimentos', 'income', '#06b6d4', 'TrendingUp'),
    (new.id, 'Alimentação', 'expense', '#f97316', 'UtensilsCrossed'),
    (new.id, 'Transporte', 'expense', '#3b82f6', 'Car'),
    (new.id, 'Moradia', 'expense', '#8b5cf6', 'Home'),
    (new.id, 'Lazer', 'expense', '#ec4899', 'Sparkles'),
    (new.id, 'Saúde', 'expense', '#ef4444', 'Heart'),
    (new.id, 'Educação', 'expense', '#eab308', 'GraduationCap'),
    (new.id, 'Outros', 'expense', '#64748b', 'Tag');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
