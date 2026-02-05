-- Seed products (match apps/web/data/products.json)
-- Run after schema.sql in Supabase SQL Editor

INSERT INTO products (slug, name, price_per_day, description, category, image, agreement, info, requires_delivery)
VALUES
  ('minigravare', 'Minigrävare 1.8 ton', 1500, 'Kompakt minigrävare för grävning, schakt och trädgårdsarbete. Lättmanövrerad och lämplig för trånga utrymmen. Levereras med bränsle och grundinstruktion.', 'entreprenad', '', 'standard-uthyrning', NULL, false),
  ('dumper', 'Hjuldumper Batteri', 900, 'Tyst och miljövänlig batteridriven hjuldumper. Perfekt för inomhus eller känsliga områden. Lastkapacitet upp till 500 kg.', 'entreprenad', '', 'standard-uthyrning', NULL, false),
  ('markvibrator', 'Markvibrator', 600, 'Effektiv markvibrator för packning av grus, sand och asfalt. Lämplig för mindre entreprenader och trädgårdsarbeten.', 'entreprenad', '', 'standard-uthyrning', NULL, false),
  ('kompaktor', 'Kompaktor / Platta', 750, 'Vibrerande platta för packning av jord och beläggningar. Robust och enkel att hantera vid schakt och omläggning.', 'entreprenad', '', 'standard-uthyrning', NULL, false),
  ('bastuvagn', 'Mobil Bastuvagn Lyx', 2500, 'Lyxig mobil bastu på släp. Enkel att köra till plats, snabb uppvärmning. Perfekt för event, trädgårdsfest eller firma.', 'event', '/images/bastuvagn.jpg', 'bastu-uthyrning', 'Plats för 6 pers', true),
  ('badtunna', 'Badtunna', 1200, 'Träbadtunna för utomhus. Perfekt för event och avkoppling.', 'event', '', 'standard-uthyrning', NULL, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_per_day = EXCLUDED.price_per_day,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image = EXCLUDED.image,
  agreement = EXCLUDED.agreement,
  info = EXCLUDED.info,
  requires_delivery = EXCLUDED.requires_delivery,
  updated_at = NOW();
