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
  interval = 30000, // 30 seconds
  onSave 
}: UseAutoSaveOptions = {}) => {
  const { 
    hasUnsavedChanges,
    isSaving,
    saveCurrentScenario,
    scenario 
  } = useScenarioStore()
  
  const { showError, showSuccess } = useNotifications()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveAttempt = useRef<number>(0)

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!scenario || !hasUnsavedChanges || isSaving) {
      return
    }

    // Additional guard: don't attempt auto-save for empty scenarios
    if (scenario.founders?.length === 0 && scenario.rounds?.length === 0) {
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
  }, [scenario, hasUnsavedChanges, isSaving, saveCurrentScenario, showError, onSave])

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
      if (hasUnsavedChanges && scenario && !isSaving) {
        // Attempt to save on unmount (best effort)
        performAutoSave().catch(console.error)
      }
    }
  }, [hasUnsavedChanges, scenario, isSaving, performAutoSave])

  // Manual save function
  const manualSave = async (): Promise<boolean> => {
    if (!scenario) {
      showError('No scenario to save', 'Please create a scenario first.')
      return false
    }

    try {
      const success = await saveCurrentScenario()
      
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
  }

  return {
    manualSave,
    isAutoSaveEnabled: enabled && !!scenario,
    hasUnsavedChanges,
    isSaving,
    performAutoSave
  }
}
