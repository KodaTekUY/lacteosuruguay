# Multiple Product Images Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Permitir múltiples fotos por producto, usando la primera como imagen principal en cards/listados y mostrando todas en `/producto/[id]` con un carrusel simple.

**Architecture:** Agregar un campo `images` al producto como fuente de verdad y mantener `image` como alias de la primera foto para preservar compatibilidad con consumidores existentes. Extender el admin para cargar varias imágenes, serializarlas antes de guardar y reutilizar el carrusel existente para la galería de detalle.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Neon/Postgres, Vitest, Tailwind, Embla carousel via `components/ui/carousel.tsx`

### Task 1: Modelado y tests de imágenes de producto

**Files:**
- Create: `lib/product-images.ts`
- Modify: `lib/__tests__/image-submit.test.ts`
- Modify: `lib/validation/__tests__/admin.test.ts`

**Step 1: Write the failing tests**

- Cubrir serialización de múltiples imágenes con URLs existentes y archivos nuevos.
- Cubrir validación `images` para creación y edición de productos.
- Cubrir selección de imagen principal y fallback a placeholder.

**Step 2: Run tests to verify they fail**

Run: `npm test -- lib/__tests__/image-submit.test.ts lib/validation/__tests__/admin.test.ts`

Expected: fallos por funciones/campos aún no implementados.

**Step 3: Write minimal implementation**

- Agregar helpers para normalizar, deduplicar y resolver arrays de imágenes.
- Extender schemas de admin para aceptar `images`.

**Step 4: Run tests to verify they pass**

Run: `npm test -- lib/__tests__/image-submit.test.ts lib/validation/__tests__/admin.test.ts`

Expected: PASS.

### Task 2: Persistencia y compatibilidad del producto

**Files:**
- Create: `scripts/006-add-product-images.sql`
- Modify: `scripts/001-create-tables.sql`
- Modify: `lib/db.ts`
- Modify: `types/product.ts`
- Modify: `lib/db/__tests__/read-resilience.test.ts`

**Step 1: Write the failing tests**

- Cubrir lecturas que expongan `images`.
- Cubrir updates que permitan limpiar o reemplazar el array.

**Step 2: Run test to verify it fails**

Run: `npm test -- lib/db/__tests__/read-resilience.test.ts`

Expected: FAIL por queries/tipos desactualizados.

**Step 3: Write minimal implementation**

- Seleccionar y devolver `images` desde DB.
- Mantener `image` alineada con `images[0]`.
- Insertar/actualizar `products.images`.

**Step 4: Run test to verify it passes**

Run: `npm test -- lib/db/__tests__/read-resilience.test.ts`

Expected: PASS.

### Task 3: Admin y detalle de producto

**Files:**
- Modify: `components/admin/products-admin.tsx`
- Modify: `app/producto/[id]/product-detail-client.tsx`
- Modify: `components/product-card.tsx`

**Step 1: Write the failing tests**

- Si no hay harness UI útil, cubrir la lógica extraída en helpers en lugar del árbol visual completo.

**Step 2: Run targeted tests to verify failures**

Run: `npm test -- lib/__tests__/image-submit.test.ts`

Expected: FAIL si falta integración de helpers.

**Step 3: Write minimal implementation**

- Permitir agregar/remover múltiples slots de imagen en admin.
- Usar la primera foto como portada.
- Mostrar carrusel con carets laterales y puntos inferiores en `/producto/[id]`.

**Step 4: Run verification**

Run: `npm test -- lib/__tests__/image-submit.test.ts lib/validation/__tests__/admin.test.ts lib/db/__tests__/read-resilience.test.ts`

Expected: PASS.

### Task 4: Verificación final

**Files:**
- Modify: `app/producto/[id]/product-detail-client.tsx`
- Modify: `components/admin/products-admin.tsx`
- Modify: `lib/db.ts`

**Step 1: Run focused test suite**

Run: `npm test -- lib/__tests__/image-submit.test.ts lib/validation/__tests__/admin.test.ts lib/db/__tests__/read-resilience.test.ts`

**Step 2: Run broader safety checks**

Run: `npm test`

**Step 3: Run lint/build if time permits**

Run: `npm run lint`

Run: `npm run build`
