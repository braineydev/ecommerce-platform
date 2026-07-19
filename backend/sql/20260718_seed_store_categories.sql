-- Run once against the application database before adding products.
-- Keeps the catalogue taxonomy intentionally small and consistent.
insert into public.categories (name, slug)
values
  ('Phones', 'phones'),
  ('Appliances', 'appliances'),
  ('Accessories', 'accessories')
on conflict (slug) do update set name = excluded.name;
