import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface PreferencesState {
  currency: string
  setCurrency: (currency: string) => void
  // Track if initial load from profile happened to avoid duplicate fetches
  initialized: boolean
  setInitialized: () => void
}

export const usePreferencesStore = create<PreferencesState>()(
  devtools(
    (set) => ({
      currency: 'USD',
      initialized: false,
      setCurrency: (currency) => set({ currency }),
      setInitialized: () => set({ initialized: true })
    }),
    { name: 'preferences-store' }
  )
)

export const supportedCurrencies = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'CAD', symbol: 'C$', label: 'CAD (C$)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' }
]
