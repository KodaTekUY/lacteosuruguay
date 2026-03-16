# Mejoras que vamos a proponer

Estas mejoras aun no han sido aprobadas, por lo que no las vamos a implementar aun.

## Mejoras

1. [x] Implementar checkout real (pedido persistido) ademas de WhatsApp.
Hoy el flujo cierra en wa.me y no queda orden en DB ni estado de pedido.
Evidencia: cart-drawer.tsx, cart-drawer.tsx, route.ts, route.ts.
2. [ ] Adecuar el modelo de datos a ecommerce lacteo (sku, marca, unidad/volumen, presentacion, peso, proveedor, estado).
products hoy solo guarda name, price, image, category_id, is_popular.
Evidencia: 001-create-tables.sql, db.ts.
3. [ ] Agregar inventario y vencimiento por lote (FEFO) para perecederos.
No hay stock ni lote/fecha de vencimiento en esquema actual.
Evidencia: 001-create-tables.sql.
4. [ ] Agregar logica de entrega refrigerada (franjas horarias, zonas, costo de envio minimo/maximo).
Actualmente no hay capa de envio ni validacion logistica en checkout.
Evidencia: cart-drawer.tsx, help-guide.tsx.
