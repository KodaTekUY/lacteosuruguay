-- Adds gallery support for products while keeping the legacy image column
-- as the primary/cover image for backwards compatibility.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';

UPDATE products
SET images = ARRAY[image]
WHERE image IS NOT NULL
  AND image <> ''
  AND (images IS NULL OR cardinality(images) = 0);
