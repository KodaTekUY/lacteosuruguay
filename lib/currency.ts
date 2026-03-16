interface CurrencyFormatOptions {
  locale?: string
  currency?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

const DEFAULT_CURRENCY = "ARS"
const DEFAULT_LOCALE = "es-AR"

export function formatCurrency(value: number, options: CurrencyFormatOptions = {}): string {
  const {
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options

  const safeValue = Number.isFinite(value) ? value : 0

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(safeValue)
}
