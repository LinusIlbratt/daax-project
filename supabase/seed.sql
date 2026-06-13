-- Seed products (match apps/web/data/products.json)
-- Run after schema.sql in Supabase SQL Editor

INSERT INTO products (slug, name, price_per_day, price_per_week, price_per_month, description, category, image, agreement, info, requires_delivery, is_active, created_by)
VALUES
  ('minigravare', 'Minigrävare 1.8 ton', 1500, 0, 0, 'Kompakt minigrävare för grävning, schakt och trädgårdsarbete. Lättmanövrerad och lämplig för trånga utrymmen. Levereras med bränsle och grundinstruktion.', 'entreprenad', '', 'standard-uthyrning', NULL, false, true, NULL),
  ('dumper', 'Hjuldumper Batteri', 900, 0, 0, 'Tyst och miljövänlig batteridriven hjuldumper. Perfekt för inomhus eller känsliga områden. Lastkapacitet upp till 500 kg.', 'entreprenad', '', 'standard-uthyrning', NULL, false, true, NULL),
  ('markvibrator', 'Markvibrator', 600, 0, 0, 'Effektiv markvibrator för packning av grus, sand och asfalt. Lämplig för mindre entreprenader och trädgårdsarbeten.', 'entreprenad', '', 'standard-uthyrning', NULL, false, true, NULL),
  ('kompaktor', 'Kompaktor / Platta', 750, 0, 0, 'Vibrerande platta för packning av jord och beläggningar. Robust och enkel att hantera vid schakt och omläggning.', 'entreprenad', '', 'standard-uthyrning', NULL, false, true, NULL),
  ('bastuvagn', 'Mobil Bastuvagn', 2500, 0, 0, 'Lyxig mobil bastu på släp. Enkel att köra till plats, snabb uppvärmning. Perfekt för event, trädgårdsfest eller firma.', 'event', '/images/bastuvagn.jpg', 'bastu-uthyrning', 'Plats för 6 pers', true, true, NULL)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_per_day = EXCLUDED.price_per_day,
  price_per_week = EXCLUDED.price_per_week,
  price_per_month = EXCLUDED.price_per_month,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image = EXCLUDED.image,
  agreement = EXCLUDED.agreement,
  info = EXCLUDED.info,
  requires_delivery = EXCLUDED.requires_delivery,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
