"use client"

import { useEffect, useState } from "react"
import { X, Minus, Plus, Trash2, MessageCircle, Tag, Percent, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/context/cart-context"
import { formatCurrency } from "@/lib/currency"
import { clearStoredCheckoutPhone, getStoredCheckoutPhone, persistCheckoutPhone } from "@/lib/checkout-phone"

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

function isValidPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, "")
  return digitsOnly.length >= 8 && digitsOnly.length <= 15
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    baseTotal,
    discountTotal,
    finalTotal,
    dealsApplied,
    isLoadingPricing,
  } = useCart()

  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false)
  const [customerPhone, setCustomerPhone] = useState("")
  const [rememberPhone, setRememberPhone] = useState(true)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)

  useEffect(() => {
    const storedPhone = getStoredCheckoutPhone()
    if (storedPhone) {
      setCustomerPhone(storedPhone)
    }
  }, [])

  const buildWhatsAppMessage = (phone: string) => {
    const message = items
      .map((item) => {
        const finalPrice = item.finalUnitPrice ?? item.price
        const hasDiscount = item.appliedDeals && item.appliedDeals.length > 0

        if (item.isDeal && item.originalPrice) {
          return `- OFERTA: ${item.name} x${item.quantity} - ${formatCurrency(Number(item.price) * item.quantity)} (antes: ${formatCurrency(Number(item.originalPrice) * item.quantity)})`
        }

        if (hasDiscount) {
          const originalTotal = formatCurrency(Number(item.price) * item.quantity)
          const discountedTotal = formatCurrency(item.lineFinalTotal ?? Number(finalPrice) * item.quantity)
          return `- ${item.name} x${item.quantity} - ${discountedTotal} (antes: ${originalTotal})`
        }

        return `- ${item.name} x${item.quantity} - ${formatCurrency(Number(finalPrice) * item.quantity)}`
      })
      .join("\n")

    let dealsSummary = ""
    if (dealsApplied.length > 0) {
      dealsSummary =
        "\n\n*Ofertas aplicadas:*\n" +
        dealsApplied
          .map((deal) => `- ${deal.title}: -${formatCurrency(deal.discountTotal)}`)
          .join("\n")
    }

    const customerLine = `Cliente: ${phone}`
    const subtotal = `\n\nSubtotal: ${formatCurrency(baseTotal)}`
    const savings = discountTotal > 0 ? `\n*Descuentos: ${formatCurrency(discountTotal)}*` : ""
    const total = `\n*Total: ${formatCurrency(Number(finalTotal))}*`

    return `*Pedido WEB* ${customerLine}\n\n*Mi Pedido:*\n\n${message}${dealsSummary}${subtotal}${savings}${total}`
  }

  const handleStartCheckout = () => {
    setCheckoutError(null)
    const storedPhone = getStoredCheckoutPhone()
    if (storedPhone) {
      setCustomerPhone(storedPhone)
      void registerOrderAndOpenWhatsApp(storedPhone, true)
      return
    }
    setRememberPhone(true)
    setIsCheckoutDialogOpen(true)
  }

  const handleCheckoutDialogChange = (open: boolean) => {
    setIsCheckoutDialogOpen(open)
    if (!open) {
      setCheckoutError(null)
    }
  }

  const registerOrderAndOpenWhatsApp = async (phoneOverride?: string, forceRemember = false) => {
    if (items.length === 0) return

    const normalizedPhone = (phoneOverride ?? customerPhone).trim()
    if (!isValidPhone(normalizedPhone)) {
      setCheckoutError("Ingresa un telefono valido (8 a 15 digitos).")
      return
    }

    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
    if (!whatsappNumber) {
      setCheckoutError("Falta configurar NEXT_PUBLIC_WHATSAPP_NUMBER.")
      return
    }

    setIsSubmittingOrder(true)
    setCheckoutError(null)

    try {
      const baseMessage = buildWhatsAppMessage(normalizedPhone)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: normalizedPhone,
          whatsappMessage: baseMessage,
          totals: {
            baseTotal,
            discountTotal,
            finalTotal,
          },
          items: items.map((item) => {
            const unitPrice = Number(item.finalUnitPrice ?? item.price)
            const lineTotal = Number(item.lineFinalTotal ?? unitPrice * item.quantity)

            return {
              productId: item.isDeal ? null : item.id,
              dealId: item.isDeal ? (item.dealId ?? null) : null,
              isDeal: Boolean(item.isDeal),
              name: item.name,
              quantity: item.quantity,
              unitPrice,
              lineTotal,
            }
          }),
        }),
      })

      if (!response.ok) {
        throw new Error("No se pudo registrar el pedido")
      }

      const finalMessage = buildWhatsAppMessage(normalizedPhone)
      const encodedMessage = encodeURIComponent(finalMessage)
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

      const shouldRememberPhone = forceRemember || rememberPhone
      if (shouldRememberPhone) {
        persistCheckoutPhone(normalizedPhone)
      } else {
        clearStoredCheckoutPhone()
      }

      window.open(whatsappUrl, "_blank")
      setIsCheckoutDialogOpen(false)
      setCustomerPhone(shouldRememberPhone ? normalizedPhone : "")
    } catch {
      setCheckoutError("No se pudo registrar el pedido. Intenta nuevamente.")
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  const handleConfirmCheckoutClick = () => {
    void registerOrderAndOpenWhatsApp()
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 cursor-pointer" onClick={onClose} />}

      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md transform bg-background shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-xl font-bold">Tu Carrito</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <p>Tu carrito esta vacio</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const hasAppliedDeals = item.appliedDeals && item.appliedDeals.length > 0
                  const showDiscountedPrice =
                    hasAppliedDeals && item.finalUnitPrice && item.finalUnitPrice < item.price

                  return (
                    <div key={item.id} className="flex gap-4 rounded-xl bg-muted p-3">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                        {(item.isDeal || hasAppliedDeals) && (
                          <div className="absolute top-1 left-1 rounded-full bg-primary p-1 text-primary-foreground">
                            {item.isDeal ? <Tag className="h-3 w-3" /> : <Percent className="h-3 w-3" />}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{item.name}</h3>

                        {item.isDeal && item.originalPrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground line-through">
                              {formatCurrency(Number(item.originalPrice))}
                            </span>
                            <span className="font-bold text-primary">{formatCurrency(Number(item.price))}</span>
                          </div>
                        ) : showDiscountedPrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground line-through">
                              {formatCurrency(Number(item.price))}
                            </span>
                            <span className="font-bold text-primary">
                              {formatCurrency(Number(item.finalUnitPrice))}
                            </span>
                          </div>
                        ) : (
                          <p className="font-bold text-primary">{formatCurrency(Number(item.price))}</p>
                        )}

                        {hasAppliedDeals && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.appliedDeals!.map((deal, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                              >
                                {deal.dealTitle}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full bg-transparent"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full bg-transparent"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-7 w-7 text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {dealsApplied.length > 0 && (
                  <div className="mt-4 rounded-xl bg-secondary/70 p-3">
                    <h4 className="mb-2 flex items-center gap-1 text-sm font-semibold text-secondary-foreground">
                      <Tag className="h-4 w-4" />
                      Ofertas aplicadas
                    </h4>
                    <div className="space-y-1">
                      {dealsApplied.map((deal) => (
                        <div key={deal.dealId} className="flex justify-between text-sm">
                          <span className="text-secondary-foreground/90">
                            {deal.title} {deal.timesApplied > 1 && `(x${deal.timesApplied})`}
                          </span>
                          <span className="font-medium text-primary">
                            -{formatCurrency(deal.discountTotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-3 border-t p-4">
              {isLoadingPricing && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando ofertas...
                </div>
              )}

              {discountTotal > 0 && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(baseTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-primary">
                    <span>Descuento:</span>
                    <span>-{formatCurrency(discountTotal)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(Number(finalTotal))}</span>
              </div>

              <Button
                className="w-full gap-2 rounded-full bg-green-500 text-white hover:bg-green-600"
                size="lg"
                onClick={handleStartCheckout}
              >
                <MessageCircle className="h-5 w-5" />
                Enviar por WhatsApp
              </Button>
              <Button variant="outline" className="w-full rounded-full bg-transparent" onClick={clearCart}>
                Vaciar Carrito
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isCheckoutDialogOpen} onOpenChange={handleCheckoutDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirma tu telefono</DialogTitle>
            <DialogDescription>
              Antes de abrir WhatsApp, registramos tu pedido para poder hacer seguimiento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="customer-phone">Telefono</Label>
            <Input
              id="customer-phone"
              type="tel"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="Ej: 095 555 555"
              autoComplete="tel"
              disabled={isSubmittingOrder}
            />
            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="remember-phone"
                checked={rememberPhone}
                onCheckedChange={(checked) => setRememberPhone(checked === true)}
                disabled={isSubmittingOrder}
              />
              <div className="grid gap-1 leading-none">
                <Label htmlFor="remember-phone" className="cursor-pointer text-sm font-medium">
                  Guardar para proximos pedidos
                </Label>
                <p className="text-xs text-muted-foreground">
                  Si esta activado, no te volvemos a pedir el telefono.
                </p>
              </div>
            </div>
            {checkoutError && <p className="text-sm text-destructive">{checkoutError}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCheckoutDialogOpen(false)}
              disabled={isSubmittingOrder}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmCheckoutClick} disabled={isSubmittingOrder} className="gap-2">
              {isSubmittingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  Continuar a WhatsApp
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
