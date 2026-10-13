-- ===============================================================
-- SQL Schema untuk Database UMKM Manager di Supabase
-- Buka Dashboard Supabase -> SQL Editor -> Tempel (Paste) kode ini -> Klik 'Run'
-- ===============================================================

-- 1. Tabel Produk (Products)
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null default 'Umum',
  price numeric not null default 0,
  stock integer not null default 0,
  sold integer not null default 0,
  image text default '',
  created_at timestamptz not null default now()
);

-- 2. Tabel Pesanan / Penjualan (Orders)
create table if not exists public.orders (
  id text primary key,
  customer text not null,
  product text not null,
  total numeric not null default 0,
  date text not null,
  status text not null default 'Pending',
  notes text default '',
  created_at timestamptz not null default now()
);

-- 3. Tabel Arus Kas / Keuangan (Cashflow)
create table if not exists public.cashflow (
  id text primary key,
  "desc" text not null,
  type text not null check (type in ('in', 'out')),
  amount numeric not null default 0,
  date text not null,
  category text not null default 'Umum',
  created_at timestamptz not null default now()
);

-- ===============================================================
-- Row Level Security (RLS) Policies
-- Memungkinkan aplikasi membaca & menulis data dengan anon key
-- ===============================================================

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.cashflow enable row level security;

-- Drop existing policies if any
drop policy if exists "Akses penuh produk" on public.products;
drop policy if exists "Akses penuh pesanan" on public.orders;
drop policy if exists "Akses penuh cashflow" on public.cashflow;

-- Buat Policy akses penuh
create policy "Akses penuh produk"
  on public.products
  for all
  to public
  using (true)
  with check (true);

create policy "Akses penuh pesanan"
  on public.orders
  for all
  to public
  using (true)
  with check (true);

create policy "Akses penuh cashflow"
  on public.cashflow
  for all
  to public
  using (true)
  with check (true);

-- ===============================================================
-- Aktifkan Supabase Realtime (Opsional)
-- Agar perubahan data otomatis ter-update antar perangkat secara langsung
-- ===============================================================
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.cashflow;

-- ===============================================================
-- Data Awal Produk & Kas (Sesuai Database Terkini)
-- ===============================================================
insert into public.products (id, name, category, price, stock, sold, image)
values
  ('PRD-001', 'Donat Klasik Gula Salju', 'Donat', 8000, 40, 125, '/images/products/donat.jpg'),
  ('PRD-002', 'Donat Bomboloni Nutella Lumer', 'Donat', 12000, 25, 94, '/images/products/donat-bomboloni.jpg'),
  ('PRD-003', 'Donat Tiramisu Almond Crunch', 'Donat', 11000, 30, 78, '/images/products/donat-tiramisu.jpg'),
  ('PRD-004', 'Classic Choco Chip Cookies', 'Cookies', 15000, 30, 86, '/images/products/cookies-cokelat.jpg'),
  ('PRD-005', 'Red Velvet Marshmallow Cookies', 'Cookies', 18000, 20, 62, '/images/products/cookies-red-velvet.jpg'),
  ('PRD-006', 'Matcha White Choco Cookies', 'Cookies', 16000, 24, 55, '/images/products/cookies-matcha.jpg')
on conflict (id) do nothing;

insert into public.cashflow (id, "desc", type, amount, date, category)
values
  ('TX-001', 'Saldo / Modal Kas Awal Toko', 'in', 500000, 'Hari Ini', 'Modal'),
  ('TX-002', 'Beli Tepung Terigu Protein Sedang & Mentega', 'out', 65000, 'Kemarin', 'Bahan Baku')
on conflict (id) do nothing;

