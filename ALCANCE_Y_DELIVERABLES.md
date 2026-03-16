# Alcance y Deliverables de Entrega

Fecha: 2026-03-03  
Proyecto: Tienda online con checkout por WhatsApp

## 1) Resumen ejecutivo
Esta entrega deja una base funcional y productiva para catálogo de productos con:
- Tienda pública accesible y adaptable a distintos tipos de dispositivos.
- Motor de promociones con múltiples tipos de oferta.
- Carrito con pricing automático.
- Checkout vía WhatsApp.
- Panel admin autenticado para gestión de categorías, productos y ofertas.
- SEO técnico base: metadata global, JSON-LD home, `robots.txt` y `sitemap.xml`.

## 2) Alcance funcional implementado
#### Catálogo público
- Home con orden de secciones orientado a conversión.
- Banners de ofertas destacadas.
- Búsqueda de productos y filtrado por categoría.
- Grilla de productos con acceso a detalle.

#### Detalle de producto y oferta
- Página de producto con controles de cantidad y subtotal dinámico.
- Página de oferta con visualización de tiers y tipos de promoción.
- Integración coherente entre agregado desde producto y desde oferta.

#### Carrito y pricing
- Carrito lateral con control de cantidades, vaciado y resumen.
- Cálculo automático de ofertas aplicadas y totales.
- Persistencia del carrito en sesión.

#### Checkout por WhatsApp + registro
- Confirmación de teléfono antes de redirección a WhatsApp.
- Opción de recordar teléfono para próximos pedidos.
- Persistencia de preferencia en cookies.
- Registro de pedido e ítems en base de datos previo a la redirección de WhatsApp.
- El registro queda almacenado, pero no es consultable desde el panel dentro de este alcance.

#### Backoffice (admin)
- Login con cookie de sesión firmada.
- CRUD de categorías.
- CRUD de productos.
- CRUD de ofertas con relación oferta-producto y tiers.

#### Gestión de imágenes
- Validación de tipo y tamaño de archivo.
- Integración con CDN.

#### SEO técnico
- Metadata base y social metadata en layout.
- Metadata específica de home con canonical.
- JSON-LD `Organization` y `WebSite` en home.
- `robots.txt` habilita home, bloquea admin y rutas no indexables en este alcance.
- `sitemap.xml` solo con home.
- Rutas administrativas excluidas de indexación.
- Buenas prácticas técnicas de rendimiento: tiempo de carga, interactividad y estabilidad visual.

## 3) Evidencia de validación técnica
Se ejecutó validación completa sobre el estado actual:
- 27 archivos de test.
- 131 de 131 tests ejecutados correctamente.
- Formato, consistencia y estilo del código verificados mediante ESLint.

## 4) Carga inicial de productos
- Incluye hasta 20 productos y 10 ofertas.
- La carga adicional de productos u ofertas tiene un costo de $50 c/u.

## 5) Registro del dominio.
- Incluido dominio `.vercel.app`, por ejemplo `tiendalacteos.vercel.app`
- Dominios `.uy` tienen costo de $1000 por año.
- Dominios `.com` tienen costo de $1500 por año.
- Dominios `.com.uy` tienen costo de $2300 por año.
- Los dominios se registran con contrato a un año, es decir, una vez registrado, no se puede cancelar o modificar, se puede registrar otro y reemplazar.
- Los costos de dominios son estimados y pueden variar según el proveedor/registrador al momento de la contratación o renovación
- El registro está sujeto a disponibilidad.

## 6) Configuraciones requeridas para puesta en producción
- Credenciales del usuario de administración.
- Número de WhatsApp del negocio.
- Nombre de la marca/negocio.
- Dominio a utilizar.

## 7) Soporte
Incluye soporte correctivo para la resolución de errores o ajustes menores detectados sobre las funcionalidades incluidas en este documento.
Este soporte abarca:
- Corrección de textos.
- Corrección de defectos visuales o funcionales identificados dentro del alcance entregado.

## 8) Alcance NO incluido en esta entrega
La siguiente lista describe mejoras posibles para próximas etapas, orientadas a aumentar ventas y eficiencia operativa:

1. SEO avanzado.
- Apertura de indexación completa de categorías, productos y ofertas.
- Metadata dinámica por entidad (producto/oferta/categoría) y datos estructurados `Product/Offer`.
- Sitemap ampliado, estrategia de canónicas, control de facetas y mejoras de posicionamiento.
- Integración con Google Merchant Center y feed de productos para resultados enriquecidos (Productos directamente en resultados de Google).

2. Checkout con pagos online.
- Integración con pasarela de pagos (ejemplo: Mercado Pago / Stripe / PayPal).
- Confirmación automática de pago y flujo de compra sin salir del sitio.
- Mejora esperada: menor fricción y mayor tasa de conversión (más ventas, menos trabajo manual).

3. Gestión de pedidos en panel admin.
- Módulo para consultar pedidos registrados, cambiar estados y agregar observaciones.
- Búsqueda por fecha/cliente/estado y exportación para control administrativo.
- Mejora esperada: trazabilidad operativa y reducción de trabajo manual.

4. Automatizaciones comerciales.
- Notificaciones recordatorio de carritos abandonados (WhatsApp / email).
- Mensajes automáticos de seguimiento/encuesta post-compra.
- Segmentación de clientes frecuentes y campañas de recompra.

5. Logística y operación de delivery.
- Configuración de zonas, franjas horarias y reglas de envío.
- Cálculo de costo de envío según zona y monto.
- Mejora esperada: pedidos más precisos y mejor experiencia de entrega.

6. Analítica y métricas de negocio.
- Dashboard con embudo (visitas -> carrito -> pedido), ticket promedio y productos top.
- Eventos de conversión y atribución por canal/campaña.
- Mejora esperada: decisiones basadas en datos para escalar ventas.

7. Escalabilidad y hardening.
- Backups automáticos y procedimientos de recuperación.
- Endurecimiento de seguridad y monitoreo de errores/uptime.

Cualquier funcionalidad, integración, cambio visual o ajuste no detallado expresamente en este documento se considerará fuera de alcance y podrá cotizarse por separado.

## 9) Estado de entrega
Al momento de la entrega, el proyecto queda en estado **operativo dentro del alcance definido** con las funcionalidades incluidas en este documento.

- Sitio público funcional con catálogo, promociones, carrito y checkout por WhatsApp.
- Panel de administración funcional para gestión de categorías, productos y ofertas.
- Optimización técnica para motores de búsqueda.

Condiciones para puesta en producción:
- Credenciales de usuario, número de WhatsApp y nombre del negocio (aunque sea provisorio) correctamente configurados.
- Carga inicial de catálogo/ofertas aplicada.

Inicio de indexación:
- Se deja implementada la base técnica para facilitar la indexación y se inicia su solicitud.
- La indexación efectiva y sus tiempos dependen de Google.

Con esta entrega, el negocio cuenta con una base estable para operar ventas digitales y queda preparado para las mejoras de crecimiento que considere.
