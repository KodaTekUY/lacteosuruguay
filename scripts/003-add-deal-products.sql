-- =====================================================
-- DEALS SCHEMA V2: Tiers, Bundles & Multi-Offer System
-- =====================================================

-- 1) Add deal_type, apply_mode and date range to deals table
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS deal_type VARCHAR(30) NOT NULL DEFAULT 'bundle',
ADD COLUMN IF NOT EXISTS apply_mode VARCHAR(20) NOT NULL DEFAULT 'best_price',
ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP;

-- deal_type options:
--   'bundle'         → combo/pack con precio fijo (pack x2, mayonesa+atún, etc.)
--   'tiered_total'   → "1x $45 / 3x $120" (precio total por cantidad)
--   'threshold_unit' → "llevando más de 2: $650 c/u"
--   'percent_off'    → "20% off"

-- apply_mode options:
--   'best_price'  → en el carrito elegís la combinación de tiers que deje el total más barato
--   'repeatable'  → si querés "3x $120" repetible (6 unidades = 2 veces la promo)
--   'once'        → solo una vez por compra

-- Remove old deal_price column if exists (replaced by deal_tiers)
ALTER TABLE deals DROP COLUMN IF EXISTS deal_price;

-- 2) Create junction table for deals and products (many-to-many) with quantity
CREATE TABLE IF NOT EXISTS deal_products (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE(deal_id, product_id)
);

-- Add quantity column if table already exists
ALTER TABLE deal_products
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- 3) Create deal_tiers table for multi-tier pricing
CREATE TABLE IF NOT EXISTS deal_tiers (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- Cantidad total "gatillo" para aplicar este tier
  -- (para deals de 1 producto, es la cantidad de ese producto;
  --  para combos, es "1 combo", "2 combos", etc.)
  min_qty INTEGER NOT NULL DEFAULT 1,
  max_qty INTEGER,

  -- Elegís UNA de estas formas de precio:
  total_price DECIMAL(10,2),     -- ej: 3x $120 (total)
  unit_price  DECIMAL(10,2),     -- ej: desde 3: $650 c/u
  discount_pct DECIMAL(5,2),     -- opcional si querés % en vez de precio final

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraint: exactamente UNA forma de precio debe estar definida
  CHECK (
    (total_price IS NOT NULL)::int +
    (unit_price  IS NOT NULL)::int +
    (discount_pct IS NOT NULL)::int = 1
  )
);

-- =====================================================
-- EJEMPLOS DE USO (comentados para referencia)
-- =====================================================

-- A) "Toalla: 1x $45 / 3x $120"
--    deals.deal_type = 'tiered_total'
--    deal_products: 1 producto (toalla), quantity = 1
--    deal_tiers:
--      min_qty=1, total_price=45
--      min_qty=3, total_price=120

-- B) "Johnnie Walker Red: $650 c/u llevando más de 2"
--    deals.deal_type = 'threshold_unit'
--    deal_tiers: min_qty=3, unit_price=650
--    products.price queda como precio normal (ej 799)

-- C) "Cristal pack x2 $165"
--    deals.deal_type = 'bundle'
--    deal_products: cristal, quantity = 2
--    deal_tiers: min_qty=1, total_price=165

-- D) "Mayonesa + Atún $240"
--    deal_type='bundle'
--    deal_products: mayo qty=1, atún qty=1
--    deal_tiers: total_price=240
