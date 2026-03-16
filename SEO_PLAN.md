# Plan SEO E-commerce Lácteos (2 Releases + Expansión)

## Resumen
Objetivo: subir visibilidad orgánica con base técnica sólida y despliegue gradual sin romper UX actual.

Estrategia acordada:
- URLs de producto/oferta se mantienen por ID (`/producto/[id]`, `/oferta/[id]`).
- Categorías SEO nuevas en `/categoria/[slug]` autogenerado desde nombre.
- Primero indexación limitada a Home, luego apertura total en una segunda release manual.
- Sin migración de schema de producto en esta fase (versión liviana).
- `Organization` sí, `LocalBusiness` no por ahora.
- Moneda SEO/Feed: `UYU`.

## Cambios importantes en interfaces públicas
- Nuevas variables de entorno:
- `SITE_URL` (obligatoria para canonical/sitemap/robots en producción).
- `BRAND_NAME` (nombre de marca para `Organization` schema).
- Nuevas rutas públicas:
- `/robots.txt` (`public/robots.ts`)
- `/sitemap.xml` (`public/sitemap.ts`)
- `/categoria/[slug]` (`app/categoria/[slug]/page.tsx`)
- `/merchant-feed.xml` (`app/merchant-feed.xml/route.ts`) en etapa Merchant
- Cambios de acceso interno:
- Home agrega enlaces HTML reales `<a href>` hacia categorías SEO (sin eliminar el filtro client-side actual).
- Helpers nuevos:
- Slug de categoría y utilidades SEO centralizadas.

## Release 1: Home-first (indexación controlada)
### Alcance funcional
- Dejar Home como única URL prioritaria indexable.
- Preparar base SEO global sin abrir todavía producto/oferta/categoría.

### Implementación
- Crear `lib/seo/site.ts`:
- lectura segura de `SITE_URL`
- builder de URL canónica
- defaults de marca desde `BRAND_NAME`
- Actualizar `app/layout.tsx`:
- `metadataBase`, title template, description, OpenGraph/Twitter básicos
- canonical de home
- En `app/page.tsx`:
- `generateMetadata` específico de Home
- JSON-LD `Organization` + `WebSite`
- Crear `app/robots.ts` para Release 1:
- `Allow: /`
- `Disallow: /admin`, `/api`, `/producto/`, `/oferta/`, `/categoria/`
- Crear `app/sitemap.ts` para Release 1:
- solo `/`
- Actualizar `app/admin/page.tsx`:
- `robots: { index: false, follow: false }`

### Validación (Release 1)
- `robots.txt` refleja bloqueo de rutas no-home.
- `sitemap.xml` contiene solo home.
- Rich Results Test válido para `Organization`.
- Search Console: envío de sitemap y request de indexación de home.

## Release 2: Apertura completa (categorías + productos + ofertas)
### Alcance funcional
- Abrir indexación de arquitectura completa.
- Mejorar enlazado interno y metadata por tipo de página.

### Implementación
- Crear `lib/seo/slug.ts`:
- `slugifyCategoryName(name)` (minúsculas, sin tildes, espacios→`-`)
- Añadir helpers DB en `lib/db.ts`:
- `getCategoryBySlug(slug)`
- `getProductsByCategoryId(categoryId)` reutilizable para página SEO de categoría
- Crear `app/categoria/[slug]/page.tsx`:
- resolve de categoría por slug
- listado de productos activos de esa categoría
- metadata única (title/description/canonical)
- JSON-LD `CollectionPage` + `ItemList`
- Ajustar `components/categories.tsx`:
- mantener botones de filtro
- agregar rail/lista visible con `<Link href="/categoria/[slug]">` para cada categoría
- En `app/producto/[id]/page.tsx`:
- agregar `generateMetadata`
- canonical absoluta
- title/description únicos con nombre + categoría + precio
- JSON-LD `Product` + `Offer` (priceCurrency `UYU`, availability desde `is_active`)
- En `app/oferta/[id]/page.tsx`:
- agregar `generateMetadata`
- canonical absoluta
- title/description únicos de oferta
- Actualizar `app/robots.ts` para Release 2:
- permitir `/producto/`, `/oferta/`, `/categoria/`
- mantener bloqueados `/admin` y `/api`
- Actualizar `app/sitemap.ts` para Release 2:
- incluir `/`
- incluir todas las categorías `/categoria/[slug]`
- incluir productos `/producto/[id]`
- incluir ofertas activas `/oferta/[id]`

### Validación (Release 2)
- Todas las páginas importantes tienen canonical, title y description únicos.
- Home contiene enlaces HTML reales a categorías.
- Sitemap lista categorías/productos/ofertas.
- URL Inspection confirma indexabilidad en rutas de negocio.
- Search Console sin errores de canonical duplicado ni cobertura por bloqueo involuntario.

## Etapa Merchant + Rich Listings (post Release 2)
### Implementación
- Crear `app/merchant-feed.xml/route.ts`:
- feed de productos activos con campos mínimos válidos (id, title, link, image_link, price UYU, availability)
- Documentar mapeo y operación en `docs/seo/merchant-center.md`:
- alta en Merchant Center
- validación del feed
- checklist de errores comunes de catálogo
- Validar consistencia entre:
- JSON-LD de producto
- URL real
- feed Merchant

### Validación
- Feed aceptado por Merchant Center sin errores críticos.
- Reportes de “Merchant listings” y “Product snippets” activos en Search Console.
- Rich Results Test OK en 3-5 productos representativos.

## Etapa Performance SEO (CWV)
### Implementación
- Auditar LCP en Home, Producto y Oferta (mobile-first).
- Ajustar `sizes`, `priority` y carga de imágenes above-the-fold.
- Añadir preconnect a CDN de imágenes en `app/layout.tsx`.
- Corregir elementos con riesgo de CLS en banners/cards.

### Validación
- Objetivos p75:
- LCP <= 2.5s
- INP <= 200ms
- CLS <= 0.1
- Verificación con PageSpeed + Search Console CWV.

## Tests y escenarios (obligatorios)
- Unit tests:
- `lib/seo/slug.ts`: tildes, espacios múltiples, mayúsculas, caracteres especiales.
- `lib/seo/site.ts`: canonical builder y normalización `SITE_URL`.
- Page metadata tests:
- Home/producto/oferta/categoría devuelven metadata esperada.
- Robots/sitemap tests:
- Release 1: solo home indexable.
- Release 2: cobertura completa de rutas de negocio.
- Structured data tests:
- snapshot/shape de JSON-LD para `Organization`, `Product`, `CollectionPage`.
- E2E smoke:
- navegación Home -> Categoría -> Producto -> Oferta con enlaces `<a href>` funcionales.

## Supuestos y defaults cerrados
- `SITE_URL` aún no definido: se implementa obligatorio antes de indexar.
- `BRAND_NAME` se toma de env con fallback temporal.
- Categoría por slug derivado de nombre; si se renombra, URL previa puede romperse (aceptado).
- Producto/oferta mantienen rutas por ID en esta fase.
- Sin cambios de schema DB para descripción/marca/SKU/GTIN/stock ahora.
- `LocalBusiness` se difiere hasta tener dirección/horarios/zona de delivery final.
