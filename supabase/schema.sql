-- Hisab: Personal finance schema for Supabase
-- Run this in Supabase SQL Editor after creating a project

-- Profiles (one per auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Cash, bank, and investment accounts
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'investment')),
  balance numeric(14, 2) not null default 0,
  opening_balance numeric(14, 2) not null default 0,
  institution text,
  invested_amount numeric(14, 2) not null default 0,
  current_value numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts(user_id);

-- Income / expense categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  unique (user_id, name, type)
);

create index if not exists categories_user_id_idx on public.categories(user_id);

-- Saved contact names (no login required for contacts)
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  unique (user_id, name)
);

-- All money events
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (
    type in (
      'expense',
      'income',
      'transfer',
      'investment_deposit',
      'investment_withdrawal',
      'settlement',
      'loan_given'
    )
  ),
  amount numeric(14, 2) not null,
  personal_amount numeric(14, 2),
  description text,
  category_id uuid references public.categories(id) on delete set null,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_date_idx on public.transactions(transaction_date desc);

-- Signed movements: positive = money into account, negative = out
create table if not exists public.account_movements (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  amount numeric(14, 2) not null
);

create index if not exists account_movements_txn_idx on public.account_movements(transaction_id);

-- Who owes you (split lunch, loan given, etc.)
create table if not exists public.split_receivables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  contact_name text not null,
  amount numeric(14, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at timestamptz,
  settlement_transaction_id uuid references public.transactions(id) on delete set null,
  paid_to_account_id uuid references public.accounts(id) on delete set null
);

create index if not exists split_receivables_user_status_idx
  on public.split_receivables(user_id, status);

-- Auto-create profile + default categories on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );

  insert into public.categories (user_id, name, type) values
    (new.id, 'Salary', 'income'),
    (new.id, 'Other Income', 'income'),
    (new.id, 'Food', 'expense'),
    (new.id, 'Transport', 'expense'),
    (new.id, 'Shopping', 'expense'),
    (new.id, 'Bills', 'expense'),
    (new.id, 'Health', 'expense'),
    (new.id, 'Other', 'expense');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.contacts enable row level security;
alter table public.transactions enable row level security;
alter table public.account_movements enable row level security;
alter table public.split_receivables enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "accounts_all_own" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories_all_own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "contacts_all_own" on public.contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_all_own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "movements_via_transaction" on public.account_movements
  for all using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and t.user_id = auth.uid()
    )
  );

create policy "splits_all_own" on public.split_receivables
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
