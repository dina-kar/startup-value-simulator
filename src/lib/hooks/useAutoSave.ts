import { useEffect, useRef, useCallback } from 'react'
import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { useNotifications } from '@/lib/stores/uiStore'

interface UseAutoSaveOptions {
  enabled?: boolean
  interval?: number // in milliseconds
  onSave?: (success: boolean) => void
}

export const useAutoSave = ({ 
  enabled = true, 
  interval = 2000, // 2 seconds
  onSave 
}: UseAutoSaveOptions = {}) => {
  const { 
    hasUnsavedChanges,
    isSaving,
    saveCurrentScenario,
    scenario,
    founders,
    rounds
  } = useScenarioStore()
  
  const { showError, showSuccess } = useNotifications()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveAttempt = useRef<number>(0)

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!scenario || !hasUnsavedChanges || isSaving) {
      return
    }

    // Only auto-save scenarios with meaningful data
    const hasMeaningfulData = founders.length > 0 || rounds.length > 0
    if (!hasMeaningfulData) {
      console.log('Auto-save skipped: scenario has no meaningful data yet')
      return
    }

    // Prevent too frequent saves (minimum 5 seconds between attempts)
    const now = Date.now()
    if (now - lastSaveAttempt.current < 5000) {
      return
    }

    lastSaveAttempt.current = now

    try {
      console.log('Auto-saving scenario...')
      
      const success = await saveCurrentScenario()
      
      if (success) {
        onSave?.(true)
      } else {
        // Only show an error toast if repeated failures could impact user awareness
        showError('Auto-save failed', 'We could not save changes automatically. You can save manually.', 5000)
        onSave?.(false)
      }
    } catch (error) {
      console.error('Auto-save error:', error)
  showError('Auto-save error', 'An error occurred while saving automatically.', 8000)
      onSave?.(false)
    }
  }, [scenario, hasUnsavedChanges, isSaving, saveCurrentScenario, showError, onSave, founders.length, rounds.length])

  // Trigger immediate save when meaningful data is added
  useEffect(() => {
    if (founders.length > 0 || rounds.length > 0) {
      // Delay slightly to allow state to settle
      const timer = setTimeout(() => {
        if (hasUnsavedChanges && !isSaving) {
          console.log('Triggering immediate save due to meaningful data change')
          performAutoSave().catch(console.error)
        }
      }, 1000) // 1 second delay

      return () => clearTimeout(timer)
    }
  }, [founders.length, rounds.length, hasUnsavedChanges, isSaving, performAutoSave])

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled || !scenario) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set up new interval
    intervalRef.current = setInterval(performAutoSave, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, scenario, interval, performAutoSave])

  // Save when component unmounts if there are unsaved changes
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && scenario && !isSaving && (founders.length > 0 || rounds.length > 0)) {
        // Attempt to save on unmount (best effort)
        performAutoSave().catch(console.error)
      }
    }
  }, [hasUnsavedChanges, scenario, isSaving, performAutoSave, founders.length, rounds.length])

  // Manual save function
  const manualSave = useCallback(async () => {
    if (!scenario) {
      showError('No scenario to save', 'Please create a scenario first.')
      return false
    }

    try {
      // Force save even if scenario is empty when user manually requests it
      const success = await saveCurrentScenario(false, true)
      
      if (success) {
        showSuccess('Scenario saved', 'Your changes have been saved successfully.')
        onSave?.(true)
        return true
      } else {
        showError('Save failed', 'Failed to save scenario. Please try again.')
        onSave?.(false)
        return false
      }
    } catch (error) {
      console.error('Manual save error:', error)
      showError('Save error', 'An error occurred while saving. Please try again.')
      onSave?.(false)
      return false
    }
  }, [scenario, saveCurrentScenario, showSuccess, showError, onSave])

  return {
    manualSave,
    isAutoSaveEnabled: enabled && !!scenario,
    hasUnsavedChanges,
    isSaving,
    performAutoSave
  }
}
