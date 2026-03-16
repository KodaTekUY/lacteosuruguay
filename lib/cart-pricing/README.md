# Cart Pricing Engine

## Resumen

Motor de cálculo de precios para el carrito con soporte para múltiples tipos de deals y modos de aplicación.

## Ubicación de Archivos

```
lib/cart-pricing/
├── index.ts          # Exports públicos
├── types.ts          # Tipos TypeScript
├── utils.ts          # Utilidades de redondeo
├── engine.ts         # Función pura priceCart()
├── service.ts        # Servicio con acceso a DB
└── __tests__/
    └── engine.test.ts # Tests unitarios

app/api/cart/price/
└── route.ts          # Endpoint POST /api/cart/price
```

## Uso

### Endpoint API

```bash
POST /api/cart/price
Content-Type: application/json

{
  "items": [
    { "productId": 1, "qty": 3 },
    { "productId": 2, "qty": 2 }
  ]
}
```

**Response:**
```json
{
  "items": [
    {
      "productId": 1,
      "qty": 3,
      "baseUnitPrice": 50,
      "finalUnitPrice": 40,
      "lineBaseTotal": 150,
      "lineFinalTotal": 120,
      "appliedDeals": [{ "dealId": 1, "dealTitle": "3x$120", "tierUsed": {...} }]
    }
  ],
  "dealsApplied": [
    {
      "dealId": 1,
      "title": "Toalla Promo",
      "timesApplied": 1,
      "tierUsed": { "minQty": 3, "price": 120 },
      "discountTotal": 30,
      "affectedProducts": [{ "productId": 1, "unitsUsed": 3 }]
    }
  ],
  "totals": {
    "baseTotal": 150,
    "discountTotal": 30,
    "finalTotal": 120
  }
}
```

### Uso Programático

```typescript
import { getCartPricingService } from '@/lib/cart-pricing'

const service = getCartPricingService()
const result = await service.priceCart([
  { productId: 1, qty: 3 },
  { productId: 2, qty: 2 }
])
```

## Tipos de Deal Soportados

### 1. `bundle` - Combo/Pack con precio fijo

Ejemplo: "Mayonesa + Atún = $240"

- `deal_products`: define la "receta" del combo (productos y cantidades requeridas)
- Se aplica N veces según stock disponible en carrito

```sql
-- Deal: Mayo + Atún $240
INSERT INTO deals (title, deal_type, apply_mode) VALUES ('Mayo + Atún', 'bundle', 'repeatable');
INSERT INTO deal_products (deal_id, product_id, quantity) VALUES (1, 10, 1), (1, 20, 1);
INSERT INTO deal_tiers (deal_id, min_qty, total_price) VALUES (1, 1, 240);
```

### 2. `tiered_total` - Precio total por cantidad

Ejemplo: "1x $45 / 3x $120"

- Múltiples tiers con diferentes precios totales
- `best_price`: usa DP para encontrar combinación óptima
- `repeatable`: aplica el tier múltiples veces

```sql
-- Deal: Toalla 1x$45, 3x$120
INSERT INTO deals (title, deal_type, apply_mode) VALUES ('Toalla Promo', 'tiered_total', 'best_price');
INSERT INTO deal_products (deal_id, product_id, quantity) VALUES (2, 30, 1);
INSERT INTO deal_tiers (deal_id, min_qty, total_price) VALUES (2, 1, 45), (2, 3, 120);
```

### 3. `threshold_unit` - Precio unitario desde umbral

Ejemplo: "Llevando más de 2: $650 c/u"

- Cuando qty >= min_qty, TODAS las unidades usan el unit_price del tier
- Interpretación: el descuento aplica a todas las unidades, no solo las que exceden el umbral

```sql
-- Deal: JW Red $650 c/u llevando 3+
INSERT INTO deals (title, deal_type, apply_mode) VALUES ('JW Red +2', 'threshold_unit', 'best_price');
INSERT INTO deal_products (deal_id, product_id, quantity) VALUES (3, 40, 1);
INSERT INTO deal_tiers (deal_id, min_qty, unit_price) VALUES (3, 3, 650);
```

### 4. `percent_off` - Porcentaje de descuento

Ejemplo: "20% off"

- Aplica porcentaje a todas las unidades de los productos afectados

```sql
-- Deal: 20% off en lácteos
INSERT INTO deals (title, deal_type, apply_mode) VALUES ('20% Lácteos', 'percent_off', 'once');
INSERT INTO deal_products (deal_id, product_id, quantity) VALUES (4, 50, 1);
INSERT INTO deal_tiers (deal_id, min_qty, discount_pct) VALUES (4, 1, 20);
```

## Modos de Aplicación (`apply_mode`)

| Modo | Descripción |
|------|-------------|
| `best_price` | Elige la combinación de tiers que minimiza el total (usa DP para tiered_total) |
| `repeatable` | El deal puede aplicarse múltiples veces (ej: 6 unidades con tier 3x = 2 aplicaciones) |
| `once` | El deal solo se aplica una vez por compra |

## Decisiones de Diseño

### 1. Precios Base desde DB
El `unitPrice` enviado por el cliente se **ignora completamente**. Siempre se usa `products.price` de la base de datos para evitar manipulación de precios.

### 2. Estrategia Greedy
Para múltiples deals compitiendo por los mismos productos:
1. Se evalúan todos los deals aplicables
2. Se ordenan por descuento total potencial (mayor primero)
3. Se aplican en ese orden, actualizando unidades disponibles

**Limitación:** No es óptimo global. Un deal con menos descuento pero que "libera" productos para otro deal mejor podría ser ignorado.

### 3. Tracking de Unidades
- Cada producto tiene `availableUnits` que se van "consumiendo"
- Una unidad no puede participar en dos deals simultáneamente
- Evita doble-aplicación sobre la misma mercadería

### 4. DP para tiered_total + best_price
Para encontrar la combinación óptima de tiers:
```
dp[q] = mínimo costo para cubrir q unidades

Para cada cantidad q de 1 a total:
  - Opción base: dp[q-1] + precio_unitario
  - Para cada tier t:
    - Si t.min_qty <= q: dp[q] = min(dp[q], dp[q - t.min_qty] + t.total_price)
```

### 5. Redondeo
- Todos los cálculos usan 2 decimales
- Función `round2()` usa redondeo estándar (round half away from zero)

## Queries SQL Usadas

### Obtener precios de productos
```sql
SELECT id, price FROM products WHERE id = ANY($1)
```

### Obtener deals activos para productos del carrito
```sql
WITH cart_product_ids AS (
  SELECT unnest($1::int[]) AS product_id
),
relevant_deals AS (
  SELECT DISTINCT d.id, d.title, d.deal_type, d.apply_mode, 
         d.is_active, d.starts_at, d.ends_at
  FROM deals d
  INNER JOIN deal_products dp ON dp.deal_id = d.id
  WHERE dp.product_id IN (SELECT product_id FROM cart_product_ids)
    AND d.is_active = true
    AND (d.starts_at IS NULL OR d.starts_at <= $2)
    AND (d.ends_at IS NULL OR d.ends_at >= $2)
)
SELECT 
  rd.id AS deal_id, rd.title, rd.deal_type, rd.apply_mode,
  rd.is_active, rd.starts_at, rd.ends_at,
  dp.product_id, dp.quantity AS product_quantity,
  dt.id AS tier_id, dt.min_qty, dt.max_qty,
  dt.total_price, dt.unit_price, dt.discount_pct
FROM relevant_deals rd
LEFT JOIN deal_products dp ON dp.deal_id = rd.id
LEFT JOIN deal_tiers dt ON dt.deal_id = rd.id
ORDER BY rd.id, dp.product_id, dt.min_qty
```

## TODOs para Mejoras Futuras

### Optimización Global
```typescript
// TODO: Implementar branch & bound o ILP para casos donde:
// - Deal A usa productos {1, 2} con descuento $30
// - Deal B usa productos {2, 3} con descuento $50
// - Deal C usa productos {1, 3} con descuento $40
// Greedy elegiría B ($50), pero A+C ($70) es mejor
// 
// Posible implementación:
// 1. Modelar como problema de cobertura de conjuntos con pesos
// 2. Usar programación lineal entera (ILP) con solver como GLPK
// 3. Branch & bound con poda por bound superior
```

### Soporte para Condiciones Adicionales
```typescript
// TODO: Agregar soporte para:
// - Deals con cantidad mínima de compra total
// - Deals exclusivos (si aplica A, no puede aplicar B)
// - Deals con límite de uso por cliente
// - Deals con códigos promocionales
```

### Caché de Deals
```typescript
// TODO: Implementar caché de deals activos
// - Invalidar cuando se crea/actualiza/elimina un deal
// - TTL de 5 minutos para deals que no cambian frecuentemente
```

## Tests

```bash
# Ejecutar tests
npm test

# Ejecutar con watch mode
npm run test:watch

# Ejecutar con coverage
npm run test:coverage
```

## Ejemplo Completo

```typescript
// Carrito: 5 toallas ($50 c/u), 2 mayonesas ($150 c/u), 2 atunes ($120 c/u)
const items = [
  { productId: 1, qty: 5 },  // Toallas
  { productId: 2, qty: 2 },  // Mayonesas  
  { productId: 3, qty: 2 }   // Atunes
]

// Deals activos:
// 1. Toalla: 1x$45, 3x$120 (tiered_total, best_price)
// 2. Mayo + Atún = $240 (bundle, repeatable)

// Resultado esperado:
// - Toallas: 5 unidades → 1x tier3 ($120) + 2x tier1 ($90) = $210 (ahorro $40)
// - Mayo + Atún: 2 bundles → 2x $240 = $480 (ahorro $60)
// - Total base: $250 + $300 + $240 = $790
// - Total final: $210 + $480 = $690
// - Descuento: $100
```
