import { useEffect, useRef, useCallback } from 'react'
import { useScenarioStore } from '@/stores/scenarioStore'
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
    id: scenarioId,
    isDirty,
    isSaving,
    markClean,
    setSaving 
  } = useScenarioStore()
  
  const { showSuccess, showError } = useNotifications()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveAttempt = useRef<number>(0)

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!scenarioId || !isDirty || isSaving) {
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
      setSaving(true)
      
      // TODO: Implement actual save to database
      // For now, just simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      markClean()
      setSaving(false)
      showSuccess('Auto-saved', undefined, 2000) // Show for 2 seconds
      onSave?.(true)
    } catch (error) {
      console.error('Auto-save error:', error)
      setSaving(false)
      showError('Auto-save error', 'An error occurred while saving. Please save manually.', 10000)
      onSave?.(false)
    }
  }, [scenarioId, isDirty, isSaving, setSaving, markClean, showSuccess, showError, onSave])

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled || !scenarioId) {
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
  }, [enabled, scenarioId, interval, performAutoSave])

  // Save when component unmounts if there are unsaved changes
  useEffect(() => {
    return () => {
      if (isDirty && scenarioId && !isSaving) {
        // Attempt to save on unmount (best effort)
        performAutoSave().catch(console.error)
      }
    }
  }, [isDirty, scenarioId, isSaving, performAutoSave])

  // Manual save function
  const manualSave = async (): Promise<boolean> => {
    if (!scenarioId) {
      showError('No scenario to save', 'Please create a scenario first.')
      return false
    }

    try {
      setSaving(true)
      
      // TODO: Implement actual save to database
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      markClean()
      setSaving(false)
      showSuccess('Scenario saved', 'Your changes have been saved successfully.')
      onSave?.(true)
      return true
    } catch (error) {
      console.error('Manual save error:', error)
      setSaving(false)
      showError('Save error', 'An error occurred while saving. Please try again.')
      onSave?.(false)
      return false
    }
  }

  return {
    manualSave,
    isAutoSaveEnabled: enabled && !!scenarioId,
    hasUnsavedChanges: isDirty,
    isSaving,
    performAutoSave
  }
}
