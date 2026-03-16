"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import type { CartItem, Product, Deal, PricedCartResult, DealApplication } from "@/types/product"
import { getDealPrice } from "@/types/product"
import { getDealUnitPrice } from "@/context/deal-pricing"
import { createPricingRequestManager } from "@/context/pricing-request-manager"

const CART_STORAGE_KEY = 'shopping-cart'

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product) => void
  addDealToCart: (deal: Deal, quantity?: number) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  submitCart: () => void
  totalItems: number
  totalPrice: number
  // New pricing fields
  baseTotal: number
  discountTotal: number
  finalTotal: number
  dealsApplied: DealApplication[]
  isLoadingPricing: boolean
  pricingError: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [pricedResult, setPricedResult] = useState<PricedCartResult | null>(null)
  const [isLoadingPricing, setIsLoadingPricing] = useState(false)
  const [pricingError, setPricingError] = useState<string | null>(null)
  
  // Debounce ref to avoid too many API calls
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const pricingRequestManagerRef = useRef(createPricingRequestManager())
  const hasHydratedStorageRef = useRef(false)

  // Load cart from sessionStorage on mount
  useEffect(() => {
    let hydrationTimeout: NodeJS.Timeout | null = null

    try {
      const stored = sessionStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsedItems = JSON.parse(stored)
        if (Array.isArray(parsedItems)) {
          const normalizedItems = parsedItems.filter(
            (item) =>
              item &&
              typeof item === "object" &&
              typeof item.id === "number" &&
              typeof item.quantity === "number" &&
              item.quantity > 0 &&
              !item.isDeal,
          )

          if (normalizedItems.length !== parsedItems.length) {
            sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedItems))
          }

          hydrationTimeout = setTimeout(() => {
            setItems(normalizedItems)
          }, 0)
        }
      }
    } catch (error) {
      console.error('Error loading cart from sessionStorage:', error)
    }
    hasHydratedStorageRef.current = true

    return () => {
      if (hydrationTimeout) {
        clearTimeout(hydrationTimeout)
      }
    }
  }, [])

  // Save cart to sessionStorage whenever items change (after hydration)
  useEffect(() => {
    if (!hasHydratedStorageRef.current) return
    
    try {
      if (items.length > 0) {
        sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      } else {
        sessionStorage.removeItem(CART_STORAGE_KEY)
      }
    } catch (error) {
      console.error('Error saving cart to sessionStorage:', error)
    }
  }, [items])

  // Fetch pricing from API
  const fetchPricing = useCallback(async (cartItems: CartItem[]) => {
    // Filter only regular products (not deals) for pricing API
    const regularItems = cartItems.filter(item => !item.isDeal && item.id > 0)
    
    if (regularItems.length === 0) {
      pricingRequestManagerRef.current.cancel()
      setPricedResult(null)
      setPricingError(null)
      setIsLoadingPricing(false)
      return
    }

    setIsLoadingPricing(true)
    setPricingError(null)

    const result = await pricingRequestManagerRef.current.run(
      regularItems.map((item) => ({
        productId: item.id,
        qty: item.quantity,
      })),
    )

    if (!result.isLatest) {
      return
    }

    if (result.status === "success") {
      setPricedResult(result.data)
      setPricingError(null)
      setIsLoadingPricing(false)
      return
    }

    if (result.status === "error") {
      console.error('Error fetching pricing:', result.error)
      setPricingError(result.error.message)
      setPricedResult(null)
      setIsLoadingPricing(false)
      return
    }

    setIsLoadingPricing(false)
  }, [])

  // Debounced pricing fetch when items change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      fetchPricing(items)
    }, 300) // 300ms debounce

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [items, fetchPricing])

  useEffect(() => {
    const pricingRequestManager = pricingRequestManagerRef.current
    return () => {
      pricingRequestManager.cancel()
    }
  }, [])

  // Merge pricing info into items
  const pricedItems = items.map(item => {
    if (item.isDeal || item.id < 0) {
      // Deals keep their original pricing
      return item
    }
    
    const pricedItem = pricedResult?.items.find(p => p.productId === item.id)
    if (pricedItem) {
      return {
        ...item,
        finalUnitPrice: pricedItem.finalUnitPrice,
        lineFinalTotal: pricedItem.lineFinalTotal,
        appliedDeals: pricedItem.appliedDeals
      }
    }
    return item
  })

  const addToCart = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id && !item.isDeal)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && !item.isDeal ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const addDealToCart = (deal: Deal, quantity: number = 1) => {
    const safeQuantity = Number.isInteger(quantity) && quantity > 0 ? quantity : 1
    const dealPrice = getDealPrice(deal, safeQuantity)
    if (dealPrice === null || !deal.products) return

    setItems((prev) => {
      // Use negative ID to distinguish deals from regular products
      const dealItemId = -deal.id
      const existing = prev.find((item) => item.id === dealItemId && item.isDeal)

      if (existing) {
        const newQuantity = existing.quantity + safeQuantity
        const newPrice = getDealPrice(deal, newQuantity) || dealPrice
        return prev.map((item) =>
          item.id === dealItemId && item.isDeal 
            ? { ...item, quantity: newQuantity, price: getDealUnitPrice(newPrice, newQuantity) } 
            : item,
        )
      }

      const dealItem: CartItem = {
        id: dealItemId,
        name: deal.title,
        price: getDealUnitPrice(dealPrice, safeQuantity),
        image: deal.image,
        quantity: safeQuantity,
        isDeal: true,
        dealId: deal.id,
        dealTitle: deal.title,
        originalPrice: deal.original_price,
      }

      return [...prev, dealItem]
    })
  }

  const removeFromCart = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setItems((prev) => prev.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    pricingRequestManagerRef.current.cancel()
    setItems([])
    setPricedResult(null)
    setPricingError(null)
    setIsLoadingPricing(false)
    try {
      sessionStorage.removeItem(CART_STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing cart from sessionStorage:', error)
    }
  }

  const submitCart = () => {
    // Here you could add logic to send the order to an API
    // For now, just clear the cart
    clearCart()
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  
  // Calculate totals - use pricing API result for regular products
  const regularItemsBaseTotal = items
    .filter(item => !item.isDeal && item.id > 0)
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
  
  const dealItemsTotal = items
    .filter(item => item.isDeal)
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
  
  const baseTotal = pricedResult?.totals.baseTotal ?? regularItemsBaseTotal
  const discountTotal = pricedResult?.totals.discountTotal ?? 0
  const finalTotal = (pricedResult?.totals.finalTotal ?? regularItemsBaseTotal) + dealItemsTotal
  
  // For backwards compatibility
  const totalPrice = finalTotal

  return (
    <CartContext.Provider
      value={{ 
        items: pricedItems, 
        addToCart, 
        addDealToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart,
        submitCart,
        totalItems, 
        totalPrice,
        baseTotal,
        discountTotal,
        finalTotal,
        dealsApplied: pricedResult?.dealsApplied ?? [],
        isLoadingPricing,
        pricingError
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}
