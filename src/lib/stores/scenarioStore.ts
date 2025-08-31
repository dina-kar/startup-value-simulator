import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Scenario, Founder, Round, ESOPConfig, CapTableCalculations } from '@/types/scenario'
import { CalculationEngine } from '@/lib/financial/CalculationEngine'
import { saveScenario, loadScenario, deleteScenario } from '@/lib/database/queries'

interface ScenarioState {
  // Current scenario data
  scenario: Scenario | null
  founders: Founder[]
  rounds: Round[]
  esop: ESOPConfig
  exitValue: number
  
  // Calculated results
  calculations: CapTableCalculations | null
  validationErrors: string[]
  
  // Loading states
  isCalculating: boolean
  isSaving: boolean
  isLoading: boolean
  
  // Auto-save state
  hasUnsavedChanges: boolean
  lastSaved: Date | null
  
  // Actions - Scenario management
  setScenario: (scenario: Scenario, markAsChanged?: boolean) => void
  createNewScenario: (name: string) => void
  clearScenario: () => void
  loadScenarioById: (scenarioId: string) => Promise<boolean>
  saveCurrentScenario: (isPublic?: boolean, forceUpsert?: boolean) => Promise<boolean>
  deleteScenarioById: (scenarioId: string) => Promise<boolean>
  
  // Actions - Founders
  addFounder: (founder: Omit<Founder, 'id' | 'currentEquity' | 'shares'>) => void
  updateFounder: (id: string, updates: Partial<Founder>) => void
  removeFounder: (id: string) => void
  
  // Actions - Rounds
  addRound: (round: Omit<Round, 'id' | 'createdAt' | 'order'>) => void
  updateRound: (id: string, updates: Partial<Round>) => void
  removeRound: (id: string) => void
  reorderRounds: (roundIds: string[]) => void
  
  // Actions - ESOP
  updateESOPConfig: (updates: Partial<ESOPConfig>) => void
  
  // Actions - Exit value
  setExitValue: (value: number) => void
  
  // Actions - Calculations
  recalculate: () => void
  validate: () => string[]
  
  // Auto-save management
  markAsChanged: () => void
  markAsSaved: () => void
}

const defaultESOPConfig: ESOPConfig = {
  poolSize: 20, // 20% pool
  isPreMoney: false,
  currentSize: 20,
  allocated: 0,
  available: 20
}

export const useScenarioStore = create<ScenarioState>()(
  devtools(
    (set, get) => ({
      // Initial state
      scenario: null,
      founders: [],
      rounds: [],
      esop: defaultESOPConfig,
      exitValue: 100_000_000, // $100M default exit
      calculations: null,
      validationErrors: [],
      isCalculating: false,
      isSaving: false,
      isLoading: false,
      hasUnsavedChanges: false,
      lastSaved: null,

      // Scenario management
      setScenario: (scenario, markAsChanged = false) => {
        set({
          scenario,
          founders: scenario.founders,
          rounds: scenario.rounds,
          esop: scenario.esop,
          exitValue: scenario.exitValue,
          hasUnsavedChanges: markAsChanged,
          lastSaved: markAsChanged ? null : scenario.updatedAt
        })
        if (markAsChanged) {
          get().markAsChanged()
        }
        get().recalculate()
      },

      createNewScenario: (name) => {
        const newId = crypto.randomUUID()
        
        const scenario: Scenario = {
          id: newId,
          name,
          founders: [],
          rounds: [],
          esop: defaultESOPConfig,
          exitValue: 100_000_000,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        set({
          scenario,
          founders: [],
          rounds: [],
          esop: defaultESOPConfig,
          exitValue: 100_000_000,
          calculations: null,
          validationErrors: [],
          hasUnsavedChanges: true,
          lastSaved: null
        })
        console.log('Initialized new scenario. Will auto-save when it has founders or rounds, or when manually saved.')
      },

      clearScenario: () => {
        set({
          scenario: null,
          founders: [],
          rounds: [],
          esop: defaultESOPConfig,
          exitValue: 100_000_000,
          calculations: null,
          validationErrors: [],
          hasUnsavedChanges: false,
          lastSaved: null
        })
      },

      // Load scenario from database
      loadScenarioById: async (scenarioId: string): Promise<boolean> => {
        set({ isLoading: true })
        
        try {
          const result = await loadScenario(scenarioId)
          
          if (result.success && result.data) {
            get().setScenario(result.data)
            return true
          } else {
            console.error('Failed to load scenario:', result.error)
            return false
          }
        } catch (error) {
          console.error('Error loading scenario:', error)
          return false
        } finally {
          set({ isLoading: false })
        }
      },

      // Save current scenario to database
      saveCurrentScenario: async (isPublic = false, forceUpsert = false): Promise<boolean> => {
        const state = get()
        
        if (!state.scenario) {
          console.error('No scenario to save')
          return false
        }

        // Only save scenarios with meaningful data unless explicitly forced
        const hasMeaningfulData = state.founders.length > 0 || state.rounds.length > 0 || forceUpsert
        if (!hasMeaningfulData) {
          console.log('Skipping save: scenario has no meaningful data yet. Use manual save to force.')
          return false
        }

        console.log('Starting to save scenario:', state.scenario.id, 'Name:', state.scenario.name)
        set({ isSaving: true })

        try {
          // Update scenario with current state
          const updatedScenario: Scenario = {
            ...state.scenario,
            founders: state.founders,
            rounds: state.rounds,
            esop: state.esop,
            exitValue: state.exitValue,
            isPublic,
            updatedAt: new Date()
          }

          console.log('About to call saveScenario with data:', {
            id: updatedScenario.id,
            name: updatedScenario.name,
            foundersCount: updatedScenario.founders.length,
            roundsCount: updatedScenario.rounds.length
          })

          const result = await saveScenario({ 
            scenario: updatedScenario, 
            isPublic 
          })

          if (result.success) {
            console.log('Scenario saved successfully!')
            set({
              scenario: updatedScenario,
              hasUnsavedChanges: false,
              lastSaved: new Date()
            })
            return true
          } else {
            // Provide more detailed error information
            const errorMessage = result.error || 'Unknown error occurred'
            console.error('Failed to save scenario:', errorMessage)
            
            // Check for common database issues
            if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
              console.error('Database tables not found. Please run: npm run setup:db')
            } else if (errorMessage.includes('authentication')) {
              console.error('Authentication issue. Please log out and log back in.')
            } else if (errorMessage.includes('permission')) {
              console.error('Permission denied. Check Row Level Security policies.')
            }
            
            return false
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred'
          console.error('Error saving scenario:', errorMessage)
          return false
        } finally {
          set({ isSaving: false })
        }
      },

      // Delete scenario from database
      deleteScenarioById: async (scenarioId: string): Promise<boolean> => {
        set({ isLoading: true })

        try {
          const result = await deleteScenario(scenarioId)
          
          if (result.success) {
            // If the deleted scenario is currently loaded, clear it
            const currentScenario = get().scenario
            if (currentScenario?.id === scenarioId) {
              get().clearScenario()
            }
            return true
          } else {
            console.error('Failed to delete scenario:', result.error)
            return false
          }
        } catch (error) {
          console.error('Error deleting scenario:', error)
          return false
        } finally {
          set({ isLoading: false })
        }
      },

      // Founder management
      addFounder: (founderData) => {
        const founder: Founder = {
          ...founderData,
          id: crypto.randomUUID(),
          currentEquity: founderData.initialEquity,
          shares: 0 // Will be calculated
        }
        
        try {
          set((state) => ({
            founders: [...state.founders, founder]
          }))
          get().markAsChanged()
          get().recalculate()
        } catch (error) {
          // If calculation fails, remove the founder that was just added
          set((state) => ({
            founders: state.founders.filter(f => f.id !== founder.id)
          }))
          throw error
        }
      },

      updateFounder: (id, updates) => {
        set((state) => ({
          founders: state.founders.map(founder =>
            founder.id === id ? { ...founder, ...updates } : founder
          )
        }))
        get().markAsChanged()
        get().recalculate()
      },

      removeFounder: (id) => {
        set((state) => ({
          founders: state.founders.filter(founder => founder.id !== id)
        }))
        get().markAsChanged()
        get().recalculate()
      },

      // Round management
      addRound: (roundData) => {
        const round: Round = {
          ...roundData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          order: get().rounds.length + 1
        }
        
        set((state) => ({
          rounds: [...state.rounds, round]
        }))
        get().markAsChanged()
        get().recalculate()
      },

      updateRound: (id, updates) => {
        set((state) => ({
          rounds: state.rounds.map(round =>
            round.id === id ? { ...round, ...updates } : round
          )
        }))
        get().markAsChanged()
        get().recalculate()
      },

      removeRound: (id) => {
        set((state) => ({
          rounds: state.rounds.filter(round => round.id !== id)
            .map((round, index) => ({ ...round, order: index + 1 }))
        }))
        get().markAsChanged()
        get().recalculate()
      },

      reorderRounds: (roundIds) => {
        set((state) => {
          const roundMap = new Map(state.rounds.map(round => [round.id, round]))
          const reorderedRounds = roundIds
            .map(id => roundMap.get(id))
            .filter((round): round is Round => round !== undefined)
            .map((round, index) => ({
              ...round,
              order: index + 1
            }))
          return { rounds: reorderedRounds }
        })
        get().markAsChanged()
        get().recalculate()
      },

      // ESOP management
      updateESOPConfig: (updates) => {
        set((state) => ({
          esop: { ...state.esop, ...updates }
        }))
        get().markAsChanged()
        get().recalculate()
      },

      // Exit value
      setExitValue: (value) => {
        set({ exitValue: value })
        get().markAsChanged()
        get().recalculate()
      },

      // Calculations
      recalculate: () => {
        const state = get()
        
        if (state.founders.length === 0) {
          set({ calculations: null, validationErrors: [] })
          return
        }

        set({ isCalculating: true })

        try {
          // Create temporary scenario for calculations
          const scenario: Scenario = {
            id: state.scenario?.id || 'temp',
            name: state.scenario?.name || 'Temp Scenario',
            userId: state.scenario?.userId,
            founders: state.founders,
            rounds: state.rounds,
            esop: state.esop,
            exitValue: state.exitValue,
            isPublic: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }

          // Validate first
          const errors = CalculationEngine.validate(scenario)
          if (errors.length > 0) {
            set({ 
              validationErrors: errors, 
              calculations: null,
              isCalculating: false 
            })
            return
          }

          // Calculate
          const engine = new CalculationEngine(scenario)
          const calculations = engine.calculateCapTable()

          set({ 
            calculations, 
            validationErrors: [],
            isCalculating: false 
          })
        } catch (error) {
          console.error('Calculation error:', error)
          set({ 
            validationErrors: [error instanceof Error ? error.message : 'Calculation failed'],
            calculations: null,
            isCalculating: false
          })
        }
      },

      validate: () => {
        const state = get()
        
        if (state.founders.length === 0) {
          return []
        }

        const scenario: Scenario = {
          id: state.scenario?.id || 'temp',
          name: state.scenario?.name || 'Temp Scenario',
          userId: state.scenario?.userId,
          founders: state.founders,
          rounds: state.rounds,
          esop: state.esop,
          exitValue: state.exitValue,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        return CalculationEngine.validate(scenario)
      },

      // Auto-save management
      markAsChanged: () => {
        set({ hasUnsavedChanges: true })
      },

      markAsSaved: () => {
        set({ 
          hasUnsavedChanges: false,
          lastSaved: new Date()
        })
      }
    }),
    {
      name: 'scenario-store'
    }
  )
)
