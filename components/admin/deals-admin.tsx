"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Trash2, X } from "lucide-react"
import type { Deal, Product, DealType, ApplyMode } from "@/types/product"
import { getDealPrice } from "@/types/product"
import { createDealAction, updateDealAction, deleteDealAction, getDealsAction } from "@/app/admin/actions"
import Image from "next/image"
import { ImageUpload } from "@/components/ui/image-upload"
import { HelpGuide, adminDealsHelpSections } from "@/components/help-guide"
import { getAdminDialogContentClassName } from "@/lib/admin-dialog"
import { toDateTimeLocalInputValue } from "@/lib/datetime-local"
import { resolveImageForSubmit, uploadImageFile } from "@/lib/image-submit"
import { formatCurrency } from "@/lib/currency"

interface DealsAdminProps {
  deals: Deal[]
  setDeals: (deals: Deal[]) => void
  products: Product[]
}

const dealTypeOptions: { value: DealType; label: string; description: string }[] = [
  { value: "bundle", label: "Bundle/Pack", description: "Combo con precio fijo (pack x2, mayo+atún)" },
  { value: "tiered_total", label: "Precio por cantidad", description: "1x $45 / 3x $120" },
  { value: "threshold_unit", label: "Precio mayorista", description: "Llevando más de 2: $650 c/u" },
  { value: "percent_off", label: "Porcentaje de descuento", description: "20% OFF" },
]

const applyModeOptions: { value: ApplyMode; label: string; description: string }[] = [
  { value: "best_price", label: "Mejor precio", description: "Elige la combinación más barata" },
  { value: "repeatable", label: "Repetible", description: "6 unidades = 2 veces la promo" },
  { value: "once", label: "Una vez", description: "Solo una vez por compra" },
]

interface ProductSelection {
  product_id: number
  quantity: number
}

interface TierInput {
  min_qty: number
  max_qty: number | null
  total_price: string
  unit_price: string
  discount_pct: string
  price_type: 'total' | 'unit' | 'percent'
}

const ITEMS_PER_PAGE = 8

export function DealsAdmin({ deals, setDeals, products }: DealsAdminProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    button_text: "Agregar",
    button_link: "",
    is_active: true,
    deal_type: "bundle" as DealType,
    apply_mode: "best_price" as ApplyMode,
    starts_at: "",
    ends_at: "",
    selected_products: [] as ProductSelection[],
    tiers: [{ min_qty: 1, max_qty: null, total_price: "", unit_price: "", discount_pct: "", price_type: "total" as const }] as TierInput[],
  })
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(deals.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedDeals = deals.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const refreshDeals = async () => {
    const latestDeals = await getDealsAction()
    setDeals(latestDeals)
  }

  const calculateOriginalPrice = () => {
    return formData.selected_products.reduce((sum, sp) => {
      const product = products.find((p) => p.id === sp.product_id)
      return sum + (product?.price || 0) * sp.quantity
    }, 0)
  }

  // Calcular el porcentaje de descuento para un tier específico
  const calculateTierDiscount = (tier: TierInput): number | null => {
    const originalPrice = calculateOriginalPrice()
    if (originalPrice <= 0) return null

    let tierPrice: number | null = null

    if (tier.price_type === 'total' && tier.total_price) {
      tierPrice = parseFloat(tier.total_price)
    } else if (tier.price_type === 'unit' && tier.unit_price) {
      // Para precio unitario, multiplicamos por la cantidad del tier
      const totalQty = formData.selected_products.reduce((sum, sp) => sum + sp.quantity, 0) || 1
      tierPrice = parseFloat(tier.unit_price) * totalQty * tier.min_qty
    } else if (tier.price_type === 'percent' && tier.discount_pct) {
      return parseFloat(tier.discount_pct)
    }

    if (tierPrice === null || tierPrice <= 0) return null

    // Calcular precio original para la cantidad del tier
    const originalForQty = originalPrice * tier.min_qty
    const discount = Math.round((1 - tierPrice / originalForQty) * 100)
    
    return discount > 0 ? discount : null
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image: "",
      button_text: "Agregar",
      button_link: "",
      is_active: true,
      deal_type: "bundle",
      apply_mode: "best_price",
      starts_at: "",
      ends_at: "",
      selected_products: [],
      tiers: [{ min_qty: 1, max_qty: null, total_price: "", unit_price: "", discount_pct: "", price_type: "total" }],
    })
    setSelectedImageFile(null)
    setEditingDeal(null)
    setErrorMessage(null)
  }

  const toggleProductSelection = (productId: number) => {
    setFormData((prev) => {
      const existing = prev.selected_products.find(sp => sp.product_id === productId)
      if (existing) {
        // Desmarcar producto
        return {
          ...prev,
          selected_products: prev.selected_products.filter(sp => sp.product_id !== productId)
        }
      }
      
      // Si no es bundle, solo permitir 1 producto
      if (prev.deal_type !== 'bundle') {
        return {
          ...prev,
          selected_products: [{ product_id: productId, quantity: 1 }]
        }
      }
      
      // Bundle permite múltiples productos
      return {
        ...prev,
        selected_products: [...prev.selected_products, { product_id: productId, quantity: 1 }]
      }
    })
  }

  const updateProductQuantity = (productId: number, quantity: number) => {
    setFormData((prev) => ({
      ...prev,
      selected_products: prev.selected_products.map(sp =>
        sp.product_id === productId ? { ...sp, quantity: Math.max(1, quantity) } : sp
      )
    }))
  }

  const addTier = () => {
    const lastTier = formData.tiers[formData.tiers.length - 1]
    const newMinQty = lastTier ? lastTier.min_qty + 1 : 1
    
    // Determinar price_type según deal_type
    let defaultPriceType: 'total' | 'unit' | 'percent' = 'total'
    if (formData.deal_type === 'percent_off') {
      defaultPriceType = 'percent'
    } else if (formData.deal_type === 'threshold_unit') {
      defaultPriceType = 'unit'
    }
    
    setFormData(prev => ({
      ...prev,
      tiers: [...prev.tiers, { min_qty: newMinQty, max_qty: null, total_price: "", unit_price: "", discount_pct: "", price_type: defaultPriceType }]
    }))
  }

  const removeTier = (index: number) => {
    if (formData.tiers.length <= 1) return
    setFormData(prev => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index)
    }))
  }

  const updateTier = (index: number, field: keyof TierInput, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      tiers: prev.tiers.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      )
    }))
  }

  // Validar si el tipo de tier es válido para el deal_type actual
  const getValidPriceTypes = (): Array<'total' | 'unit' | 'percent'> => {
    switch (formData.deal_type) {
      case 'bundle':
        return ['total'] // Bundle solo precio total fijo
      case 'tiered_total':
        return ['total', 'unit', 'percent'] // Todos los tipos
      case 'threshold_unit':
        return ['unit', 'total', 'percent'] // Precio desde umbral
      case 'percent_off':
        return ['percent'] // Solo porcentaje
      default:
        return ['total']
    }
  }

  // Determinar si se permiten múltiples tiers
  const allowMultipleTiers = (): boolean => {
    return formData.deal_type === 'tiered_total' || formData.deal_type === 'threshold_unit'
  }

  // Obtener hint según el tipo de deal
  const getDealTypeHint = (): string => {
    switch (formData.deal_type) {
      case 'bundle':
        return 'Combo/pack con precio fijo. Selecciona productos y define 1 tier con precio total.'
      case 'tiered_total':
        return 'Precio según cantidad comprada. Crea múltiples tiers (ej: 2x $45, 4x $80).'
      case 'threshold_unit':
        return 'Descuento desde cierto umbral. Define precio/descuento que aplica cuando qty >= min.'
      case 'percent_off':
        return 'Porcentaje de descuento. Define % que aplica a los productos seleccionados.'
      default:
        return ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const image = await resolveImageForSubmit({
        existingImage: formData.image,
        selectedFile: selectedImageFile,
        uploadFile: uploadImageFile,
      })

      // Convert tiers to the format expected by the API
      const tiersData = formData.tiers.map(tier => ({
        min_qty: tier.min_qty,
        max_qty: tier.max_qty,
        total_price: tier.price_type === 'total' && tier.total_price ? Number.parseFloat(tier.total_price) : null,
        unit_price: tier.price_type === 'unit' && tier.unit_price ? Number.parseFloat(tier.unit_price) : null,
        discount_pct: tier.price_type === 'percent' && tier.discount_pct ? Number.parseFloat(tier.discount_pct) : null,
      }))

      const dealData = {
        title: formData.title,
        description: formData.description || null,
        image: image,
        button_text: formData.button_text,
        button_link: formData.button_link || null,
        is_active: formData.is_active,
        deal_type: formData.deal_type,
        apply_mode: formData.apply_mode,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
        products: formData.selected_products,
        tiers: tiersData,
      }

      const result = editingDeal
        ? await updateDealAction(editingDeal.id, dealData)
        : await createDealAction(dealData)

      if (!result) {
        throw new Error("No se pudo guardar la oferta")
      }

      await refreshDeals()

      setIsOpen(false)
      resetForm()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar la oferta")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (deal: Deal) => {
    setErrorMessage(null)
    setEditingDeal(deal)
    
    // Convert deal products to selection format
    const selected_products: ProductSelection[] = deal.products?.map(dp => ({
      product_id: dp.product_id,
      quantity: dp.quantity
    })) || []

    // Convert tiers to form format
    const tiers: TierInput[] = deal.tiers?.map(tier => ({
      min_qty: tier.min_qty,
      max_qty: tier.max_qty,
      total_price: tier.total_price?.toString() || "",
      unit_price: tier.unit_price?.toString() || "",
      discount_pct: tier.discount_pct?.toString() || "",
      price_type: tier.total_price !== null ? 'total' : tier.unit_price !== null ? 'unit' : 'percent'
    })) || [{ min_qty: 1, max_qty: null, total_price: "", unit_price: "", discount_pct: "", price_type: "total" }]

    setFormData({
      title: deal.title,
      description: deal.description || "",
      image: deal.image || "",
      button_text: deal.button_text,
      button_link: deal.button_link || "",
      is_active: deal.is_active ?? true,
      deal_type: deal.deal_type || "bundle",
      apply_mode: deal.apply_mode || "best_price",
      starts_at: toDateTimeLocalInputValue(deal.starts_at),
      ends_at: toDateTimeLocalInputValue(deal.ends_at),
      selected_products,
      tiers,
    })
    setSelectedImageFile(null)
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta oferta?")) return

    setErrorMessage(null)

    try {
      const result = await deleteDealAction(id)
      if (!result) {
        throw new Error("No se pudo eliminar la oferta")
      }
      await refreshDeals()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo eliminar la oferta")
    }
  }

  const originalPrice = calculateOriginalPrice()

  // Helper to get display price from deal
  const getDisplayPrice = (deal: Deal): string => {
    const price = getDealPrice(deal, 1);
    return price !== null ? `${formatCurrency(Number(price))}` : "-"
  }

  // Helper to get products count with quantities
  const getProductsInfo = (deal: Deal): string => {
    if (!deal.products || deal.products.length === 0) return "0 productos"
    const total = deal.products.reduce((sum, dp) => sum + dp.quantity, 0)
    return `${deal.products.length} producto(s), ${total} unidad(es)`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ofertas ({deals.length})</CardTitle>
        <div className="flex items-center gap-2">
          <HelpGuide
            title="Administrar Ofertas"
            description="Guía completa para crear y gestionar ofertas y promociones"
            sections={adminDealsHelpSections}
          />
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">
                  Nueva oferta
                </span>
              </Button>
            </DialogTrigger>
          <DialogContent className={getAdminDialogContentClassName("max-w-3xl")}>
            <DialogHeader>
              <DialogTitle>{editingDeal ? "Editar Oferta" : "Nueva Oferta"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal_type">Tipo de oferta</Label>
                  <select
                    id="deal_type"
                    value={formData.deal_type}
                    onChange={(e) => {
                      const newType = e.target.value as DealType
                      // Ajustar tiers y price_type según el nuevo tipo
                      let newPriceType: 'total' | 'unit' | 'percent' = 'total'
                      if (newType === 'percent_off') {
                        newPriceType = 'percent'
                      } else if (newType === 'threshold_unit') {
                        newPriceType = 'unit'
                      }
                      
                      // Ajustar apply_mode según tipo
                      let newApplyMode = formData.apply_mode
                      if (newType === 'percent_off') {
                        newApplyMode = 'once'
                      }
                      
                      // Si no es bundle y hay más de 1 producto, mantener solo el primero
                      let newProducts = formData.selected_products
                      if (newType !== 'bundle' && newProducts.length > 1) {
                        newProducts = [newProducts[0]]
                      }
                      
                      setFormData({ 
                        ...formData, 
                        deal_type: newType,
                        apply_mode: newApplyMode,
                        selected_products: newProducts,
                        tiers: [{ min_qty: 1, max_qty: null, total_price: "", unit_price: "", discount_pct: "", price_type: newPriceType }]
                      })
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    {dealTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {getDealTypeHint()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Products selection with quantity */}
              <div className="space-y-2">
                <div>
                  <Label>Productos incluidos en la oferta</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.deal_type === 'bundle' 
                      ? 'Selecciona múltiples productos para el pack/combo'
                      : 'Selecciona 1 producto para esta oferta'
                    }
                  </p>
                </div>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {products.map((product) => {
                      const selection = formData.selected_products.find(sp => sp.product_id === product.id)
                      const isSelected = !!selection
                      return (
                        <div
                          key={product.id}
                          className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 border border-primary"
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          {/* <Checkbox checked={isSelected} onCheckedChange={() => toggleProductSelection(product.id)} /> */}
                          <Image
                            src={product.image || "/placeholder.svg?height=32&width=32"}
                            alt={product.name}
                            width={32}
                            height={32}
                            className="rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(Number(product.price))}</p>
                          </div>
                          {isSelected && formData.deal_type === 'bundle' && (
                            <div className="flex items-center gap-1">
                              <Label className="text-xs">Cant:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={selection.quantity}
                                onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value) || 1)}
                                className="w-16 h-7 text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                {formData.selected_products.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {formData.selected_products.length} producto(s) seleccionado(s) - Precio original:{" "}
                    <strong>{formatCurrency(Number(originalPrice))}</strong>
                  </p>
                )}
              </div>

              {/* Tiers configuration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Niveles de precio (Tiers)</Label>
                    {formData.deal_type === 'bundle' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Bundle usa 1 tier con precio fijo total
                      </p>
                    )}
                    {formData.deal_type === 'percent_off' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Define el % de descuento que se aplica
                      </p>
                    )}
                  </div>
                  {allowMultipleTiers() && (
                    <Button type="button" variant="outline" size="sm" onClick={addTier}>
                      <Plus className="w-3 h-3 mr-1" /> Agregar tier
                    </Button>
                  )}
                </div>
                <div className="border rounded-lg p-4 space-y-3">
                  {formData.tiers.map((tier, index) => {
                    const discountPct = calculateTierDiscount(tier)
                    const validPriceTypes = getValidPriceTypes()
                    
                    return (
                    <div key={index} className="flex flex-wrap items-end gap-2 p-3 bg-muted/30 rounded-lg border">
                      <div className="space-y-1">
                        <Label className="text-xs">Min Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={tier.min_qty}
                          onChange={(e) => updateTier(index, 'min_qty', parseInt(e.target.value) || 1)}
                          className="w-20 h-8"
                          disabled={formData.deal_type === 'percent_off'}
                        />
                      </div>
                      {allowMultipleTiers() && (
                        <div className="space-y-1">
                          <Label className="text-xs">Max Qty</Label>
                          <Input
                            type="number"
                            min={tier.min_qty}
                            value={tier.max_qty || ""}
                            onChange={(e) => updateTier(index, 'max_qty', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-20 h-8"
                            placeholder="∞"
                          />
                        </div>
                      )}
                      
                      {/* Solo mostrar selector de tipo si hay múltiples opciones */}
                      {validPriceTypes.length > 1 && (
                        <div className="space-y-1">
                          <Label className="text-xs">Tipo precio</Label>
                          <select
                            disabled
                            value={tier.price_type}
                            onChange={(e) => {
                              const newType = e.target.value as 'total' | 'unit' | 'percent'
                              if (validPriceTypes.includes(newType)) {
                                updateTier(index, 'price_type', newType)
                              }
                            }}
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                          >
                            {validPriceTypes.includes('total') && <option value="total">Precio total</option>}
                            {validPriceTypes.includes('unit') && <option value="unit">Precio c/u</option>}
                            {validPriceTypes.includes('percent') && <option value="percent">% Descuento</option>}
                          </select>
                        </div>
                      )}
                      
                      {tier.price_type === 'total' && validPriceTypes.includes('total') && (
                        <div className="space-y-1">
                          <Label className="text-xs">Precio total</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={tier.total_price}
                            onChange={(e) => updateTier(index, 'total_price', e.target.value)}
                            className="w-24 h-8"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                      {tier.price_type === 'unit' && validPriceTypes.includes('unit') && (
                        <div className="space-y-1">
                          <Label className="text-xs">Precio c/u</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={tier.unit_price}
                            onChange={(e) => updateTier(index, 'unit_price', e.target.value)}
                            className="w-24 h-8"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                      {tier.price_type === 'percent' && validPriceTypes.includes('percent') && (
                        <div className="space-y-1">
                          <Label className="text-xs">% Descuento</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={tier.discount_pct}
                            onChange={(e) => updateTier(index, 'discount_pct', e.target.value)}
                            className="w-24 h-8"
                            placeholder="0"
                          />
                        </div>
                      )}
                      {/* Mostrar porcentaje de descuento calculado */}
                      {discountPct !== null && discountPct > 0 && (
                        <div className="flex items-center">
                          <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {tier.min_qty > 1 ? `${tier.min_qty}+ → ` : ''}{discountPct}% OFF
                          </span>
                        </div>
                      )}
                      {formData.tiers.length > 1 && allowMultipleTiers() && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeTier(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )})}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apply_mode">Modo de aplicación</Label>
                  <select
                    id="apply_mode"
                    value={formData.apply_mode}
                    onChange={(e) => setFormData({ ...formData, apply_mode: e.target.value as ApplyMode })}
                    className="w-full rounded-md border border-input bg-neutral-100 px-3 py-2"
                    disabled
                  >
                    {applyModeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {formData.deal_type === 'percent_off' 
                      ? 'Percent_off aplica una sola vez por defecto'
                      : applyModeOptions.find(o => o.value === formData.apply_mode)?.description
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Fecha inicio (opcional)</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ends_at">Fecha fin (opcional)</Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Imagen</Label>
                  <ImageUpload
                    value={formData.image}
                    file={selectedImageFile}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    onFileChange={setSelectedImageFile}
                    placeholder="Selecciona una imagen para la oferta"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                />
                <Label htmlFor="is_active">Oferta activa</Label>
              </div>

              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {errorMessage && <p className="mb-3 text-sm text-destructive">{errorMessage}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagen</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Precio Original</TableHead>
              <TableHead>Precio Oferta</TableHead>
              <TableHead>Activa</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDeals.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell>
                  <Image
                    src={deal.image || "/placeholder.svg?height=40&width=40"}
                    alt={deal.title}
                    width={40}
                    height={40}
                    className="rounded-md"
                  />
                </TableCell>
                <TableCell className="font-medium">{deal.title}</TableCell>
                <TableCell>
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {dealTypeOptions.find(o => o.value === deal.deal_type)?.label || deal.deal_type}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{getProductsInfo(deal)}</span>
                </TableCell>
                <TableCell>{deal.original_price ? `${formatCurrency(Number(deal.original_price))}` : "-"}</TableCell>
                <TableCell className="font-bold text-primary">
                  {getDisplayPrice(deal)}
                  {deal.tiers && deal.tiers.length > 1 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (+{deal.tiers.length - 1} tiers)
                    </span>
                  )}
                </TableCell>
                <TableCell>{deal.is_active !== false ? "Sí" : "No"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(deal)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(deal.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {deals.length > ITEMS_PER_PAGE && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Pagina {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
