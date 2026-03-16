# MEJORAS

Estas mejoras las vamos a implementar ahora.

## MUST HAVE

1. [x] Escalar búsqueda/catálogo a servidor (filtros/paginación en DB).
Hoy se carga todo y se filtra en cliente, útil para catálogos chicos pero no para crecimiento.
Evidencia: page.tsx, home-client.tsx.
2. [x] Implementar infinite scroll en pantalla principal + paginación en pantallas de admin.
3. [x] Formalizar validación de inputs de admin con schema (Zod) en server actions.
Hoy se reciben objetos tipados pero sin validación robusta de dominio en runtime.
Evidencia: actions.ts, actions.ts.
4. [x] Mejorar consistencia del admin post-guardado (refetch server-side en vez de reconstrucción local).
En ofertas se generan IDs locales (id: 0) que no reflejan exactamente DB.
Evidencia: deals-admin.tsx, deals-admin.tsx.
5. [x] Optimizar imágenes para catálogo (activar optimización o pipeline de variantes).
next/image está con unoptimized: true; para ecommerce impacta LCP/costos de ancho de banda.
Evidencia: next.config.mjs.


## NICE TO HAVE

1. [x] Unificar formato monetario/locale (helper central Intl.NumberFormat).
Hay muchos toFixed(2) y $ hardcodeado; conviene centralizar para precios, promociones y exportes.
Evidencia: cart-drawer.tsx, product-card.tsx, catalog-export.tsx.
2. [x] Agregar cancelación de requests de pricing (AbortController) para evitar respuestas tardías pisando estado.
Hay debounce, pero no cancelación de fetch en vuelo.
Evidencia: cart-context.tsx, cart-context.tsx.
