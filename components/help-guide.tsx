"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HelpCircle } from "lucide-react"

interface HelpSection {
  title: string
  steps: string[]
}

interface HelpGuideProps {
  title: string
  description?: string
  sections: HelpSection[]
}

export function HelpGuide({ title, description, sections }: HelpGuideProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-full"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Ayuda</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-base">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-3">
                <h3 className="font-semibold text-lg text-primary border-b pb-2">
                  {section.title}
                </h3>
                <ol className="space-y-2">
                  {section.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                        {stepIndex + 1}
                      </span>
                      <span className="text-sm text-muted-foreground leading-relaxed pt-0.5">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// Pre-configured help guides for different pages
export const homeHelpSections: HelpSection[] = [
  {
    title: "🛒 Cómo agregar productos al carrito",
    steps: [
      "Busca el producto navegando por categorías o usando la barra de búsqueda en la parte superior.",
      "Cuando encuentres un producto, haz clic en el botón '+' que aparece en la esquina inferior derecha de la tarjeta del producto.",
      "El producto se agregará automáticamente a tu carrito. Verás que el contador del carrito (arriba a la derecha) aumenta.",
      "Si deseas agregar más unidades del mismo producto, vuelve a hacer clic en '+'. Para quitar unidades, usa el botón '-'.",
    ],
  },
  {
    title: "🔍 Cómo buscar productos",
    steps: [
      "Ubica la barra de búsqueda en la parte superior de la pantalla (donde dice 'Buscar productos...').",
      "Escribe el nombre del producto que buscas. Por ejemplo: 'leche', 'yogur', 'queso'.",
      "Los resultados se mostrarán automáticamente mientras escribes.",
      "Para ver todos los productos nuevamente, borra el texto de la barra de búsqueda.",
    ],
  },
  {
    title: "📁 Cómo filtrar por categorías",
    steps: [
      "Debajo de la barra de búsqueda verás la lista horizontal de categorías.",
      "Haz clic en una categoría para ver solo los productos de ese tipo.",
      "Si hay muchas categorías, puedes desplazarte lateralmente o usar las flechas izquierda/derecha cuando aparezcan.",
      "El botón 'Todos' te permite volver a ver todos los productos disponibles.",
      "La categoría seleccionada se resalta para que sepas cuál estás viendo.",
    ],
  },
  {
    title: "🏷️ Cómo aprovechar las ofertas",
    steps: [
      "En la parte superior de la página verás la sección de ofertas destacadas.",
      "Haz clic en cualquier oferta para ver los detalles completos y los productos incluidos.",
      "Algunas ofertas aplican descuentos automáticos cuando agregas cierta cantidad de productos.",
      "Los descuentos se calculan y muestran automáticamente en tu carrito.",
    ],
  },
  {
    title: "📤 Cómo enviar tu pedido",
    steps: [
      "Haz clic en el ícono del carrito (arriba a la derecha) para abrir tu carrito de compras.",
      "Revisa los productos, cantidades y el total de tu pedido.",
      "Si todo está correcto, haz clic en el botón 'Enviar por WhatsApp'.",
      "Si es tu primera vez, se abrirá una confirmación para ingresar tu teléfono y, si quieres, guardarlo para próximos pedidos.",
      "Si ya guardaste tu teléfono, el sistema salta esa confirmación y abre WhatsApp directamente.",
      "Se abrirá WhatsApp con un mensaje prearmado con tu pedido. Solo debes enviarlo.",
      "¡Listo! Recibirás confirmación de tu pedido por WhatsApp.",
    ],
  },
  {
    title: "🗑️ Cómo modificar o vaciar el carrito",
    steps: [
      "Abre el carrito haciendo clic en el ícono del carrito (arriba a la derecha).",
      "Para cambiar la cantidad de un producto, usa los botones '+' y '-' junto a cada item.",
      "Para eliminar un producto completamente, reduce su cantidad a 0 con el botón '-'.",
      "Para vaciar todo el carrito, haz clic en el botón 'Vaciar Carrito' en la parte inferior.",
    ],
  },
  {
    title: "📄 Cómo exportar el catálogo a PDF",
    steps: [
      "Haz clic en el botón 'Exportar' que está en la parte superior, junto al botón de Ayuda.",
      "Se abrirá un diálogo donde puedes elegir qué productos incluir en el PDF.",
      "Selecciona 'Vista actual' (o 'Solo [Categoría]') para exportar únicamente lo que estás viendo filtrado.",
      "Selecciona 'Todos los productos' para generar un PDF con el catálogo completo.",
      "Haz clic en 'Descargar PDF' y espera a que se genere el archivo.",
      "El PDF incluirá imágenes, nombres y precios de los productos, organizados por categorías.",
    ],
  },
]

export const productDetailHelpSections: HelpSection[] = [
  {
    title: "🛒 Cómo agregar este producto al carrito",
    steps: [
      "Haz clic en el botón 'Agregar al carrito' para añadir una unidad del producto.",
      "Una vez agregado, aparecerán botones '+' y '-' para ajustar la cantidad.",
      "El subtotal se actualiza automáticamente mostrando el precio según la cantidad.",
      "Si hay ofertas aplicables, verás el descuento reflejado en el subtotal.",
    ],
  },
  {
    title: "🏷️ Cómo funcionan las ofertas de este producto",
    steps: [
      "Debajo de la información del producto verás las ofertas disponibles.",
      "Cada oferta muestra el tipo de descuento y las condiciones para aplicarlo.",
      "Haz clic en una oferta para ver más detalles.",
      "Los descuentos se aplican automáticamente cuando cumples las condiciones (por ejemplo, comprar cierta cantidad).",
    ],
  },
  {
    title: "💰 Entender los precios y descuentos",
    steps: [
      "El precio unitario se muestra en grande debajo del nombre del producto.",
      "Si agregas productos al carrito, verás el subtotal calculado.",
      "Cuando aplica una oferta, verás el precio original tachado y el precio con descuento.",
      "El ahorro total se muestra en verde para que veas cuánto estás ahorrando.",
    ],
  },
  {
    title: "🔙 Cómo volver a la tienda",
    steps: [
      "Haz clic en 'Volver a la tienda' en la parte superior izquierda.",
      "También puedes abrir el carrito desde el ícono de la esquina superior derecha para revisar tu compra sin salir.",
      "Tu carrito se mantiene guardado, no perderás los productos agregados.",
    ],
  },
]

export const dealDetailHelpSections: HelpSection[] = [
  {
    title: "📦 Cómo funciona esta oferta",
    steps: [
      "Esta página muestra los detalles completos de la oferta seleccionada.",
      "Verás el tipo de oferta (Pack/Combo, Precio por cantidad, etc.) en la parte superior.",
      "Los 'Niveles de precio' muestran cómo cambia el precio según la cantidad que lleves.",
      "Cuando aplica descuento, verás el precio original tachado y el precio final actualizado.",
    ],
  },
  {
    title: "🛒 Cómo agregar productos de esta oferta",
    steps: [
      "Usa los botones '+' y '-' principales de la oferta para subir o bajar la cantidad aplicada.",
      "En Pack/Combo, el '+' principal agrega un pack completo (todos los productos del combo) y el '-' quita un pack completo.",
      "También puedes agregar productos individuales desde las tarjetas de productos debajo.",
      "El botón 'Agregar todos por separado' agrega una unidad de cada producto del listado.",
      "Los descuentos se aplican automáticamente en tu carrito según las condiciones de la oferta.",
    ],
  },
  {
    title: "📊 Entender los niveles de precio",
    steps: [
      "Los niveles indican el umbral de unidades y el precio o descuento que se activa en cada tramo.",
      "Por ejemplo: '4+ unidades → $160 total' significa que al llegar a 4 unidades se aplica ese total promocional.",
      "Si hay varios niveles, el nivel activo se resalta automáticamente al alcanzar su cantidad mínima.",
      "La cantidad mostrada junto al precio ayuda a entender si el total corresponde a una o más aplicaciones de la oferta.",
    ],
  },
  {
    title: "💡 Tipos de ofertas explicados",
    steps: [
      "Pack/Combo: Un conjunto de productos a precio especial. Se agregan todos juntos.",
      "Precio por cantidad: El precio unitario baja mientras más compres.",
      "Precio mayorista: A partir de cierta cantidad, aplica un precio especial.",
      "% Descuento: Se aplica un porcentaje de descuento sobre el precio original.",
    ],
  },
]

export const adminCategoriesHelpSections: HelpSection[] = [
  {
    title: "➕ Cómo crear una nueva categoría",
    steps: [
      "Haz clic en el botón '+ Nueva categoría' en la parte superior.",
      "Se abrirá un formulario para ingresar los datos de la categoría.",
      "Escribe el nombre de la categoría (ej: 'Leches', 'Quesos', 'Yogures').",
      "Opcionalmente puedes cargar una imagen para representar la categoría en la tienda.",
      "Haz clic en 'Guardar' para crear la categoría.",
    ],
  },
  {
    title: "✏️ Cómo editar una categoría existente",
    steps: [
      "Busca la categoría que deseas modificar en la lista.",
      "Haz clic en el ícono de lápiz (editar) junto a la categoría.",
      "Modifica el nombre y/o la imagen según necesites.",
      "Haz clic en 'Guardar' para aplicar los cambios.",
    ],
  },
  {
    title: "🗑️ Cómo eliminar una categoría",
    steps: [
      "Busca la categoría que deseas eliminar en la lista.",
      "Haz clic en el ícono de basura (eliminar) junto a la categoría.",
      "Confirma la eliminación en el mensaje que aparece.",
      "⚠️ Importante: Si hay productos usando esa categoría, primero debes reasignarlos o eliminarlos.",
    ],
  },
  {
    title: "📋 Entender la lista de categorías",
    steps: [
      "Cada fila muestra una categoría con su imagen y nombre.",
      "Las categorías se usan para organizar los productos en la tienda.",
      "Los clientes pueden filtrar productos por categoría en la página principal.",
      "Si tienes muchas categorías, puedes navegar la tabla con la paginación inferior.",
    ],
  },
]

export const adminProductsHelpSections: HelpSection[] = [
  {
    title: "➕ Cómo crear un nuevo producto",
    steps: [
      "Haz clic en el botón '+ Nuevo producto' en la parte superior.",
      "Completa el nombre del producto (ej: 'Leche Entera 1L', 'Queso Crema 280g').",
      "Ingresa el precio del producto (solo números, ej: 150.50).",
      "Selecciona la categoría a la que pertenece el producto (opcional).",
      "Sube una imagen del producto haciendo clic en el área de imagen.",
      "Define si el producto estará marcado como 'Producto destacado'.",
      "Haz clic en 'Guardar' para crear el producto.",
    ],
  },
  {
    title: "✏️ Cómo editar un producto existente",
    steps: [
      "Busca el producto que deseas modificar en la lista.",
      "Haz clic en el ícono de lápiz (editar) junto al producto.",
      "Modifica los campos que necesites: nombre, precio, categoría o imagen.",
      "Haz clic en 'Guardar' para aplicar los cambios.",
    ],
  },
  {
    title: "🖼️ Cómo subir una imagen de producto",
    steps: [
      "En el formulario de producto, busca el área de 'Imagen'.",
      "Haz clic en el área para seleccionar una imagen de tu dispositivo.",
      "Selecciona una imagen en formato JPEG, PNG, GIF o WebP.",
      "La imagen se subirá automáticamente y verás una vista previa.",
      "Para mejores resultados, usa imágenes cuadradas, con fondo transparente y de buena calidad.",
    ],
  },
  {
    title: "🗑️ Cómo eliminar un producto",
    steps: [
      "Busca el producto que deseas eliminar en la lista.",
      "Haz clic en el ícono de basura (eliminar) junto al producto.",
      "Confirma la eliminación en el mensaje que aparece.",
      "⚠️ Importante: Si el producto está en ofertas activas, primero debes quitarlo de esas ofertas.",
    ],
  },
  {
    title: "📄 Cómo navegar la lista de productos",
    steps: [
      "La tabla muestra imagen, nombre, precio, categoría y estado de destacado de cada producto.",
      "Si tienes muchos productos, usa los botones 'Anterior' y 'Siguiente' al pie de la tabla.",
      "Puedes editar o eliminar cada producto desde la columna de acciones.",
    ],
  },
]

export const adminDealsHelpSections: HelpSection[] = [
  {
    title: "➕ Cómo crear una nueva oferta",
    steps: [
      "Haz clic en el botón '+ Nueva oferta' en la parte superior.",
      "Ingresa un título claro para la oferta (ej: 'Pack Desayuno', '2da unidad con descuento').",
      "Opcionalmente agrega una descripción explicando la oferta.",
      "Selecciona el tipo de oferta (ver sección 'Tipos de ofertas').",
      "Selecciona el/los producto(s) que participan en la oferta.",
      "Configura los niveles de precio según el tipo de oferta.",
      "Opcionalmente define fecha de inicio y fin, e imagen de la oferta.",
      "Haz clic en 'Guardar' para crear la oferta.",
    ],
  },
  {
    title: "📊 Tipos de ofertas explicados",
    steps: [
      "Pack/Combo (bundle): Varios productos juntos a precio total especial.",
      "Precio por cantidad (tiered_total): Define precios o descuentos por tramos de cantidad.",
      "Precio mayorista (threshold_unit): Cambia el precio a partir de una cantidad mínima.",
      "% Descuento (percent_off): Aplica un porcentaje de descuento sobre el precio original.",
    ],
  },
  {
    title: "💰 Cómo configurar niveles de precio",
    steps: [
      "Los niveles definen el precio según la cantidad comprada.",
      "Para ofertas que lo permiten, usa 'Agregar tier' para crear nuevos niveles.",
      "Ingresa la cantidad mínima (ej: 3 para 'desde 3 unidades').",
      "Selecciona el tipo de precio: Precio Total, Precio Unitario, o % Descuento.",
      "Ingresa el valor correspondiente.",
      "En bundle y percent_off normalmente se usa un solo nivel; en tiered_total/threshold_unit puedes usar varios.",
    ],
  },
  {
    title: "🛍️ Cómo seleccionar productos para la oferta",
    steps: [
      "En el formulario de oferta, verás la sección 'Productos'.",
      "Haz clic en los productos que quieres incluir en la oferta.",
      "Los productos seleccionados se marcan con un check.",
      "Para Pack/Combo puedes seleccionar múltiples productos.",
      "Para otros tipos de oferta, generalmente se selecciona un solo producto.",
      "Puedes ajustar la cantidad de cada producto si es necesario.",
    ],
  },
  {
    title: "✏️ Cómo editar una oferta existente",
    steps: [
      "Busca la oferta que deseas modificar en la lista.",
      "Haz clic en el ícono de lápiz (editar) junto a la oferta.",
      "Modifica los campos que necesites.",
      "Haz clic en 'Guardar' para aplicar los cambios.",
      "Los cambios se reflejarán inmediatamente en la tienda.",
    ],
  },
  {
    title: "🗑️ Cómo eliminar una oferta",
    steps: [
      "Busca la oferta que deseas eliminar en la lista.",
      "Haz clic en el ícono de basura (eliminar) junto a la oferta.",
      "Confirma la eliminación en el mensaje que aparece.",
      "La oferta dejará de mostrarse en la tienda inmediatamente.",
    ],
  },
  {
    title: "💡 Consejos para ofertas efectivas",
    steps: [
      "Usa títulos claros y atractivos que el cliente entienda rápido.",
      "Incluye el descuento en el título si es significativo (ej: '20% OFF en Lácteos').",
      "Para combos, agrupa productos que se complementen.",
      "Revisa que el precio de oferta sea realmente menor al precio normal.",
      "Activa/desactiva la oferta según temporada y usa fechas para automatizar su vigencia.",
    ],
  },
]
