import { usePreferencesStore } from '@/lib/stores/preferencesStore'

// Hook-style helper for React components
export function useCurrencyFormatter() {
  const currency = usePreferencesStore(s => s.currency)
  return (value: number, opts: Intl.NumberFormatOptions = {}) => formatCurrency(value, currency, opts)
}

// Pure function (non-hook) to format given currency (for non-react contexts)
export function formatCurrency(value: number, currency: string, opts: Intl.NumberFormatOptions = {}) {
  if (value == null || Number.isNaN(value)) return '—'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2, ...opts }).format(value)
  } catch {
    // Fallback: prefix with symbol from mapping
    const symbol = currencySymbolMap[currency] || '$'
    return symbol + value.toLocaleString()
  }
}

export const currencySymbolMap: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  INR: '₹'
}
