-- Belize is below the usual GDP top 100, but Connections and Moneyle bonus
-- need a flag + GDP row once Belize dollar cash is in the money catalog.
INSERT INTO items (category_id, name, subtitle, value, display_value, image_url, meta, is_active)
SELECT id, 'Belize', 'Latin America & Caribbean', 3326500000, '$3.33B',
       '/moreless/flags/bz.webp', '{"iso2":"bz","iso3":"BLZ","year":2025}', 1
FROM categories WHERE slug = 'country-gdp'
  AND NOT EXISTS (
    SELECT 1 FROM items i
    JOIN categories c ON c.id = i.category_id
    WHERE c.slug = 'country-gdp' AND i.name = 'Belize'
  );
