'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { PencilIcon } from 'lucide-react'
import { useNotifications } from '@/lib/stores/uiStore'
import type { Scenario } from '@/types/scenario'

interface EditScenarioNameModalProps {
  scenario: Scenario
  trigger?: React.ReactNode
  onNameChange?: (newName: string) => void
}

export function EditScenarioNameModal({ scenario, trigger, onNameChange }: EditScenarioNameModalProps) {
  const [open, setOpen] = useState(false)
  const [scenarioName, setScenarioName] = useState(scenario.name)
  const [isEditing, setIsEditing] = useState(false)
  
  const { showSuccess, showError } = useNotifications()

  // Update local state when scenario prop changes
  useEffect(() => {
    setScenarioName(scenario.name)
  }, [scenario.name])

  const handleSave = async () => {
    if (!scenarioName.trim()) {
      showError('Invalid name', 'Scenario name cannot be empty.')
      return
    }

    if (scenarioName.trim() === scenario.name) {
      setOpen(false)
      return
    }
    
    setIsEditing(true)
    
    try {
      // Call the parent callback to handle the name change
      await onNameChange?.(scenarioName.trim())
      
      showSuccess('Name updated', `Scenario renamed to "${scenarioName.trim()}"`)
      setOpen(false)
    } catch (error) {
      console.error('Error updating scenario name:', error)
      showError('Update failed', 'Failed to update scenario name. Please try again.')
    } finally {
      setIsEditing(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setScenarioName(scenario.name) // Reset when closing without saving
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && scenarioName.trim()) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <PencilIcon size={16} className="mr-2" />
            Rename
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Scenario</DialogTitle>
          <DialogDescription>
            Change the name of your scenario. This will be saved automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="scenario-name">Scenario Name</Label>
            <Input
              id="scenario-name"
              placeholder="Enter scenario name..."
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!scenarioName.trim() || isEditing || scenarioName.trim() === scenario.name}
          >
            {isEditing ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
