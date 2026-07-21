-- Keep the catalogue category table authoritative for both the admin form and
-- the storefront. Safe to run repeatedly.
insert into public.categories (name, slug)
values
  ('Phones', 'phones'),
  ('Appliances', 'appliances'),
  ('Accessories', 'accessories')
on conflict (slug) do update set name = excluded.name;

-- An index makes category filtering fast as the catalogue grows. It does not
-- change or delete any existing products or categories.
create index if not exists products_category_id_idx
  on public.products (category_id);
