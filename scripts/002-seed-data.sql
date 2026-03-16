-- =====================================================
-- Seed data - catalogo mayorista
-- =====================================================
-- Este seed deja la base en estado limpio con:
-- - solo las categorias solicitadas
-- - solo los productos solicitados
-- - ofertas unicamente de tipo threshold_unit
--   (precio unitario a partir de cierta cantidad)

BEGIN;

-- Compatibilidad para entornos donde aun no se corrieron todos los updates
ALTER TABLE products
ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE deals
ADD COLUMN IF NOT EXISTS deal_type VARCHAR(30) NOT NULL DEFAULT 'bundle',
ADD COLUMN IF NOT EXISTS apply_mode VARCHAR(20) NOT NULL DEFAULT 'best_price',
ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS deal_products (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE(deal_id, product_id)
);

ALTER TABLE deal_products
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS deal_tiers (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  min_qty INTEGER NOT NULL DEFAULT 1,
  max_qty INTEGER,
  total_price DECIMAL(10,2),
  unit_price DECIMAL(10,2),
  discount_pct DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (total_price IS NOT NULL)::int +
    (unit_price IS NOT NULL)::int +
    (discount_pct IS NOT NULL)::int = 1
  )
);

-- Limpieza segura
DO $$
DECLARE
  table_list TEXT;
BEGIN
  SELECT string_agg(format('public.%I', t), ', ')
    INTO table_list
  FROM unnest(ARRAY[
    'order_items',
    'orders',
    'deal_tiers',
    'deal_products',
    'deals',
    'products',
    'categories'
  ]) AS t
  WHERE to_regclass('public.' || t) IS NOT NULL;

  IF table_list IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || table_list || ' RESTART IDENTITY CASCADE';
  END IF;
END $$;

ALTER TABLE categories ALTER COLUMN color SET DEFAULT 'bg-neutral-100';
ALTER TABLE deals ALTER COLUMN color SET DEFAULT 'bg-neutral-100';

-- =====================================================
-- Categorias
-- =====================================================
INSERT INTO categories (name, image) VALUES
  ('Queso', NULL),
  ('Lácteos', NULL),
  ('Miel', NULL),
  ('Objetos de Utilidad', NULL),
  ('Leche en Polvo', NULL),
  ('Insumos', NULL),
  ('Ración de Perro', NULL);

-- =====================================================
-- Productos
-- =====================================================
INSERT INTO products (name, price, image, category_id, is_popular, is_active) VALUES
  ('Queso Magro Sin Sal 1kg', 270.00, NULL, (SELECT id FROM categories WHERE name = 'Queso'), true, true),
  ('Queso Magro Con Sal 1kg', 270.00, NULL, (SELECT id FROM categories WHERE name = 'Queso'), true, true),
  ('Muzzarella Naturalact 1kg', 275.00, NULL, (SELECT id FROM categories WHERE name = 'Queso'), true, true),
  ('Muzzarella Gardet 1kg', 260.00, NULL, (SELECT id FROM categories WHERE name = 'Queso'), true, true),
  ('Queso Rallado Campestre 1kg', 235.00, NULL, (SELECT id FROM categories WHERE name = 'Queso'), true, true),
  ('Manteca Claldy 5kg', 285.00, NULL, (SELECT id FROM categories WHERE name = 'Lácteos'), true, true),
  ('Queso Colonia Especial con Ojo 1kg', 300.00, NULL, (SELECT id FROM categories WHERE name = 'Queso'), true, true),
  ('Queso Semiduro 3 Meses 1kg', 295.00, NULL, (SELECT id FROM categories WHERE name = 'Queso'), true, true),
  ('Miel 100% Pura 1kg', 170.00, NULL, (SELECT id FROM categories WHERE name = 'Miel'), true, true),
  ('10 Bandejas de Plastico 40cm x 60cm x 15cm', 200.00, NULL, (SELECT id FROM categories WHERE name = 'Objetos de Utilidad'), true, true),
  ('Pallet de Madera MERCOSUR', 400.00, NULL, (SELECT id FROM categories WHERE name = 'Objetos de Utilidad'), true, true),
  ('Queso Sbrinz al Vacío 3 Meses 1kg', 340.00, NULL, (SELECT id FROM categories WHERE name = 'Queso'), true, true),
  ('Leche en Polvo Parmalat 25kg', 4250.00, NULL, (SELECT id FROM categories WHERE name = 'Leche en Polvo'), true, true),
  ('Queso Danbo 1kg', 280.00, NULL, (SELECT id FROM categories WHERE name = 'Queso'), true, true),
  ('Azucar SantaIsabel 25kg', 1200.00, NULL, (SELECT id FROM categories WHERE name = 'Insumos'), true, true),
  ('Leche en Polvo Conaprole 25kg', 4900.00, NULL, (SELECT id FROM categories WHERE name = 'Leche en Polvo'), true, true),
  ('Leche en Polvo Purísima 25kg', 4900.00, NULL, (SELECT id FROM categories WHERE name = 'Leche en Polvo'), true, true),
  ('Dog Chow 21kg', 1850.00, NULL, (SELECT id FROM categories WHERE name = 'Ración de Perro'), true, true);

-- =====================================================
-- Ofertas
-- =====================================================
INSERT INTO deals (
  title,
  description,
  image,
  button_text,
  button_link,
  is_active,
  deal_type,
  apply_mode,
  starts_at,
  ends_at
) VALUES
  ('Oferta Queso Magro Sin Sal 1kg', '10x260u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Queso Magro Con Sal 1kg', '10x260u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Muzzarella Naturalact 1kg', '50x265u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Muzzarella Gardet 1kg', '50x250u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Queso Rallado Campestre 1kg', '100x225u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Manteca Claldy 5kg', '10x280u 20x275u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Queso Colonia Especial con Ojo 1kg', '25x295u 50x290u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Queso Semiduro 3 Meses 1kg', '25x290u 50x285u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Miel 100% Pura 1kg', '10x165u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta 10 Bandejas de Plastico 40cm x 60cm x 15cm', '5x190u 10x180u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Pallet de Madera MERCOSUR', '10x375u 50x350u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Queso Sbrinz al Vacío 3 Meses 1kg', '25x330u 50x320u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Leche en Polvo Parmalat 25kg', '2x4200u 5x4150u 10x4100u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Queso Danbo 1kg', '50x275u 100x270u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Azucar SantaIsabel 25kg', '5x1150u 10x1100u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Leche en Polvo Conaprole 25kg', '2x4850u 5x4800u 10x4750u 20x4700u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Leche en Polvo Purísima 25kg', '2x4850u 5x4800u 10x4750u 20x4700u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL),
  ('Oferta Dog Chow 21kg', '5x1750u 10x1700u', NULL, 'Agregar', NULL, true, 'threshold_unit', 'best_price', NULL, NULL);

-- =====================================================
-- Relacion ofertas-productos
-- =====================================================
INSERT INTO deal_products (deal_id, product_id, quantity) VALUES
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Magro Sin Sal 1kg'), (SELECT id FROM products WHERE name = 'Queso Magro Sin Sal 1kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Magro Con Sal 1kg'), (SELECT id FROM products WHERE name = 'Queso Magro Con Sal 1kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Muzzarella Naturalact 1kg'), (SELECT id FROM products WHERE name = 'Muzzarella Naturalact 1kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Muzzarella Gardet 1kg'), (SELECT id FROM products WHERE name = 'Muzzarella Gardet 1kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Rallado Campestre 1kg'), (SELECT id FROM products WHERE name = 'Queso Rallado Campestre 1kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Manteca Claldy 5kg'), (SELECT id FROM products WHERE name = 'Manteca Claldy 5kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Colonia Especial con Ojo 1kg'), (SELECT id FROM products WHERE name = 'Queso Colonia Especial con Ojo 1kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Semiduro 3 Meses 1kg'), (SELECT id FROM products WHERE name = 'Queso Semiduro 3 Meses 1kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Miel 100% Pura 1kg'), (SELECT id FROM products WHERE name = 'Miel 100% Pura 1kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta 10 Bandejas de Plastico 40cm x 60cm x 15cm'), (SELECT id FROM products WHERE name = '10 Bandejas de Plastico 40cm x 60cm x 15cm'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Pallet de Madera MERCOSUR'), (SELECT id FROM products WHERE name = 'Pallet de Madera MERCOSUR'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Sbrinz al Vacío 3 Meses 1kg'), (SELECT id FROM products WHERE name = 'Queso Sbrinz al Vacío 3 Meses 1kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Parmalat 25kg'), (SELECT id FROM products WHERE name = 'Leche en Polvo Parmalat 25kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Danbo 1kg'), (SELECT id FROM products WHERE name = 'Queso Danbo 1kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Azucar SantaIsabel 25kg'), (SELECT id FROM products WHERE name = 'Azucar SantaIsabel 25kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Conaprole 25kg'), (SELECT id FROM products WHERE name = 'Leche en Polvo Conaprole 25kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Purísima 25kg'), (SELECT id FROM products WHERE name = 'Leche en Polvo Purísima 25kg'), 1),
  ((SELECT id FROM deals WHERE title = 'Oferta Dog Chow 21kg'), (SELECT id FROM products WHERE name = 'Dog Chow 21kg'), 1);

-- =====================================================
-- Tiers de ofertas
-- =====================================================
INSERT INTO deal_tiers (deal_id, min_qty, max_qty, total_price, unit_price, discount_pct) VALUES
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Magro Sin Sal 1kg'), 10, NULL, NULL, 260.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Magro Con Sal 1kg'), 10, NULL, NULL, 260.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Muzzarella Naturalact 1kg'), 50, NULL, NULL, 265.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Muzzarella Gardet 1kg'), 50, NULL, NULL, 250.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Rallado Campestre 1kg'), 100, NULL, NULL, 225.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Manteca Claldy 5kg'), 10, NULL, NULL, 280.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Manteca Claldy 5kg'), 20, NULL, NULL, 275.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Colonia Especial con Ojo 1kg'), 25, NULL, NULL, 295.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Colonia Especial con Ojo 1kg'), 50, NULL, NULL, 290.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Semiduro 3 Meses 1kg'), 25, NULL, NULL, 290.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Semiduro 3 Meses 1kg'), 50, NULL, NULL, 285.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Miel 100% Pura 1kg'), 10, NULL, NULL, 165.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta 10 Bandejas de Plastico 40cm x 60cm x 15cm'), 5, NULL, NULL, 190.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta 10 Bandejas de Plastico 40cm x 60cm x 15cm'), 10, NULL, NULL, 180.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Pallet de Madera MERCOSUR'), 10, NULL, NULL, 375.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Pallet de Madera MERCOSUR'), 50, NULL, NULL, 350.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Sbrinz al Vacío 3 Meses 1kg'), 25, NULL, NULL, 330.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Sbrinz al Vacío 3 Meses 1kg'), 50, NULL, NULL, 320.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Parmalat 25kg'), 2, NULL, NULL, 4200.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Parmalat 25kg'), 5, NULL, NULL, 4150.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Parmalat 25kg'), 10, NULL, NULL, 4100.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Danbo 1kg'), 50, NULL, NULL, 275.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Queso Danbo 1kg'), 100, NULL, NULL, 270.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Azucar SantaIsabel 25kg'), 5, NULL, NULL, 1150.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Azucar SantaIsabel 25kg'), 10, NULL, NULL, 1100.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Conaprole 25kg'), 2, NULL, NULL, 4850.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Conaprole 25kg'), 5, NULL, NULL, 4800.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Conaprole 25kg'), 10, NULL, NULL, 4750.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Conaprole 25kg'), 20, NULL, NULL, 4700.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Purísima 25kg'), 2, NULL, NULL, 4850.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Purísima 25kg'), 5, NULL, NULL, 4800.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Purísima 25kg'), 10, NULL, NULL, 4750.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Leche en Polvo Purísima 25kg'), 20, NULL, NULL, 4700.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Dog Chow 21kg'), 5, NULL, NULL, 1750.00, NULL),
  ((SELECT id FROM deals WHERE title = 'Oferta Dog Chow 21kg'), 10, NULL, NULL, 1700.00, NULL);

COMMIT;
