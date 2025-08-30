import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { 
  Scenario, 
  Founder, 
  Round, 
  ESOPConfig,
  CapTableCalculations 
} from '@/types/scenario'
import { CalculationEngine } from '@/lib/financial/CalculationEngine'
import { nanoid } from 'nanoid'

// Founder-related slice
interface FounderSlice {
  founders: Founder[]
  addFounder: (founder: Omit<Founder, 'id' | 'currentEquity' | 'shares'>) => void
  updateFounder: (id: string, updates: Partial<Founder>) => void
  removeFounder: (id: string) => void
}

// ESOP-related slice
interface ESOPSlice {
  esop: ESOPConfig
  updateESOPConfig: (updates: Partial<ESOPConfig>) => void
}

// Round-related slice
interface RoundSlice {
  rounds: Round[]
  addRound: (round: Omit<Round, 'id' | 'order' | 'createdAt'>) => void
  updateRound: (id: string, updates: Partial<Round>) => void
  removeRound: (id: string) => void
  reorderRounds: (roundIds: string[]) => void
}

// Scenario metadata slice
interface ScenarioMetaSlice {
  id: string
  name: string
  userId?: string
  exitValue: number
  shareToken?: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  updateScenarioMeta: (updates: Partial<Pick<Scenario, 'name' | 'exitValue' | 'isPublic'>>) => void
  setExitValue: (value: number) => void
  generateShareToken: () => string
}

// Calculated results slice
interface CalculationsSlice {
  calculations: CapTableCalculations | null
  validationErrors: string[]
  isCalculating: boolean
  lastCalculatedAt?: Date
  recalculate: () => void
  validateScenario: () => string[]
}

// Auto-save slice
interface AutoSaveSlice {
  isDirty: boolean
  isSaving: boolean
  lastSavedAt?: Date
  saveError?: string
  markDirty: () => void
  markClean: () => void
  setSaving: (saving: boolean) => void
  setSaveError: (error?: string) => void
}

// Combined store type
type ScenarioStore = FounderSlice & 
  ESOPSlice & 
  RoundSlice & 
  ScenarioMetaSlice & 
  CalculationsSlice & 
  AutoSaveSlice

// Create founder slice
const createFounderSlice = (
  set: (fn: (state: ScenarioStore) => void) => void,
  get: () => ScenarioStore
): FounderSlice => ({
  founders: [],
  
  addFounder: (founderData) => {
    set((state) => {
      const newFounder: Founder = {
        ...founderData,
        id: nanoid(),
        currentEquity: founderData.initialEquity,
        shares: 0 // Will be calculated
      }
      state.founders.push(newFounder)
      state.markDirty()
    })
    get().recalculate()
  },

  updateFounder: (id, updates) => {
    set((state) => {
      const index = state.founders.findIndex(f => f.id === id)
      if (index !== -1) {
        Object.assign(state.founders[index], updates)
        state.markDirty()
      }
    })
    get().recalculate()
  },

  removeFounder: (id) => {
    set((state) => {
      state.founders = state.founders.filter(f => f.id !== id)
      state.markDirty()
    })
    get().recalculate()
  }
})

// Create ESOP slice
const createESOPSlice = (
  set: (fn: (state: ScenarioStore) => void) => void,
  get: () => ScenarioStore
): ESOPSlice => ({
  esop: {
    poolSize: 20,
    isPreMoney: true,
    currentSize: 20,
    allocated: 0,
    available: 20
  },

  updateESOPConfig: (updates) => {
    set((state) => {
      Object.assign(state.esop, updates)
      state.markDirty()
    })
    get().recalculate()
  }
})

// Create round slice
const createRoundSlice = (
  set: (fn: (state: ScenarioStore) => void) => void,
  get: () => ScenarioStore
): RoundSlice => ({
  rounds: [],

  addRound: (roundData) => {
    set((state) => {
      const newRound: Round = {
        ...roundData,
        id: nanoid(),
        order: state.rounds.length,
        createdAt: new Date()
      }
      state.rounds.push(newRound)
      state.markDirty()
    })
    get().recalculate()
  },

  updateRound: (id, updates) => {
    set((state) => {
      const index = state.rounds.findIndex(r => r.id === id)
      if (index !== -1) {
        Object.assign(state.rounds[index], updates)
        state.markDirty()
      }
    })
    get().recalculate()
  },

  removeRound: (id) => {
    set((state) => {
      state.rounds = state.rounds.filter(r => r.id !== id)
      // Reorder remaining rounds
      state.rounds.forEach((round, index) => {
        round.order = index
      })
      state.markDirty()
    })
    get().recalculate()
  },

  reorderRounds: (roundIds) => {
    set((state) => {
      const reorderedRounds = roundIds.map(id => 
        state.rounds.find(r => r.id === id)
      ).filter((round): round is Round => round !== undefined)
      
      reorderedRounds.forEach((round, index) => {
        round.order = index
      })
      
      state.rounds = reorderedRounds
      state.markDirty()
    })
    get().recalculate()
  }
})

// Create scenario meta slice
const createScenarioMetaSlice = (
  set: (fn: (state: ScenarioStore) => void) => void,
  get: () => ScenarioStore
): ScenarioMetaSlice => ({
  id: nanoid(),
  name: 'New Scenario',
  exitValue: 100000000, // Default $100M exit
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),

  updateScenarioMeta: (updates) => {
    set((state) => {
      Object.assign(state, updates)
      state.updatedAt = new Date()
      state.markDirty()
    })
  },

  setExitValue: (value) => {
    set((state) => {
      state.exitValue = value
      state.updatedAt = new Date()
      state.markDirty()
    })
    get().recalculate()
  },

  generateShareToken: () => {
    const token = nanoid(12)
    set((state) => {
      state.shareToken = token
      state.isPublic = true
      state.updatedAt = new Date()
      state.markDirty()
    })
    return token
  }
})

// Create calculations slice
const createCalculationsSlice = (
  get: () => ScenarioStore,
  set: (fn: (state: ScenarioStore) => void) => void
): CalculationsSlice => ({
  calculations: null,
  validationErrors: [],
  isCalculating: false,

  recalculate: () => {
    const state = get()
    
    set((draft) => {
      draft.isCalculating = true
      draft.validationErrors = []
    })

    try {
      // Create scenario object for calculation
      const scenario: Scenario = {
        id: state.id,
        name: state.name,
        userId: state.userId,
        founders: state.founders,
        rounds: state.rounds,
        esop: state.esop,
        exitValue: state.exitValue,
        shareToken: state.shareToken,
        isPublic: state.isPublic,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt
      }

      // Validate first
      const errors = CalculationEngine.validate(scenario)
      
      if (errors.length > 0) {
        set((draft) => {
          draft.validationErrors = errors
          draft.isCalculating = false
        })
        return
      }

      // Calculate
      const engine = new CalculationEngine(scenario)
      const calculations = engine.calculateCapTable()

      set((draft) => {
        draft.calculations = calculations
        draft.validationErrors = []
        draft.isCalculating = false
        draft.lastCalculatedAt = new Date()
      })

    } catch (error) {
      console.error('Calculation error:', error)
      set((draft) => {
        draft.validationErrors = [error instanceof Error ? error.message : 'Calculation failed']
        draft.isCalculating = false
      })
    }
  },

  validateScenario: () => {
    const state = get()
    const scenario: Scenario = {
      id: state.id,
      name: state.name,
      userId: state.userId,
      founders: state.founders,
      rounds: state.rounds,
      esop: state.esop,
      exitValue: state.exitValue,
      shareToken: state.shareToken,
      isPublic: state.isPublic,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt
    }

    const errors = CalculationEngine.validate(scenario)
    
    set((draft) => {
      draft.validationErrors = errors
    })

    return errors
  }
})

// Main store creator
const createScenarioStore = () => create<ScenarioStore>()(
  devtools(
    persist(
      immer((set, get) => {
        // Auto-save slice with proper set function
        const autoSaveSlice: AutoSaveSlice = {
          isDirty: false,
          isSaving: false,
          
          markDirty: () => set((state) => {
            state.isDirty = true
            state.updatedAt = new Date()
          }),
          
          markClean: () => set((state) => {
            state.isDirty = false
            state.lastSavedAt = new Date()
          }),
          
          setSaving: (saving) => set((state) => {
            state.isSaving = saving
            if (saving) state.saveError = undefined
          }),
          
          setSaveError: (error) => set((state) => {
            state.saveError = error
            state.isSaving = false
          })
        }

        return {
          ...createFounderSlice(set, get),
          ...createESOPSlice(set, get),
          ...createRoundSlice(set, get),
          ...createScenarioMetaSlice(set, get),
          ...createCalculationsSlice(get, set),
          ...autoSaveSlice
        }
      }),
      {
        name: 'scenario-storage',
        partialize: (state) => ({
          id: state.id,
          name: state.name,
          founders: state.founders,
          rounds: state.rounds,
          esop: state.esop,
          exitValue: state.exitValue,
          shareToken: state.shareToken,
          isPublic: state.isPublic,
          createdAt: state.createdAt,
          updatedAt: state.updatedAt
        })
      }
    ),
    { name: 'scenario-store' }
  )
)

// Create and export the store
export const useScenarioStore = createScenarioStore()

// Helper selectors for derived data
export const scenarioSelectors = {
  // Get current ownership percentages
  getCurrentOwnership: (state: ScenarioStore) => 
    state.calculations?.currentOwnership || [],
  
  // Get exit distribution
  getExitDistribution: (state: ScenarioStore) =>
    state.calculations?.exitDistribution || [],
  
  // Get round results
  getRoundResults: (state: ScenarioStore) =>
    state.calculations?.roundResults || [],
  
  // Get validation status
  isValid: (state: ScenarioStore) =>
    state.validationErrors.length === 0,
  
  // Get dirty status
  hasUnsavedChanges: (state: ScenarioStore) =>
    state.isDirty,
  
  // Get total founder equity
  getTotalFounderEquity: (state: ScenarioStore) =>
    state.founders.reduce((sum, founder) => sum + founder.initialEquity, 0),
  
  // Get remaining equity available
  getRemainingEquity: (state: ScenarioStore) => {
    const founderTotal = state.founders.reduce((sum, founder) => sum + founder.initialEquity, 0)
    return 100 - state.esop.poolSize - founderTotal
  }
}
