'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { CopyIcon } from 'lucide-react'
import { useScenarioStore } from '@/lib/stores/scenarioStore'
import type { Scenario } from '@/types/scenario'

interface DuplicateScenarioModalProps {
  scenario: Scenario
  trigger?: React.ReactNode
  onDuplicate?: () => void
}

export function DuplicateScenarioModal({ scenario, trigger, onDuplicate }: DuplicateScenarioModalProps) {
  const [open, setOpen] = useState(false)
  const [scenarioName, setScenarioName] = useState(`${scenario.name} (Copy)`)
  const [isDuplicating, setIsDuplicating] = useState(false)
  
  const router = useRouter()
  const { setScenario } = useScenarioStore()

  const handleDuplicate = async () => {
    if (!scenarioName.trim()) return
    
    setIsDuplicating(true)
    
    try {
      const duplicatedScenario: Scenario = {
        ...scenario,
        id: crypto.randomUUID(),
        name: scenarioName.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setScenario(duplicatedScenario, true) // Mark as changed to trigger save
      
      setOpen(false)
      setScenarioName(`${scenario.name} (Copy)`) // Reset for next use
      router.push('/builder')
      onDuplicate?.()
    } catch (error) {
      console.error('Error duplicating scenario:', error)
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setScenarioName(`${scenario.name} (Copy)`) // Reset when closing
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && scenarioName.trim()) {
      e.preventDefault()
      handleDuplicate()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <CopyIcon size={16} className="mr-2" />
            Duplicate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicate Scenario</DialogTitle>
          <DialogDescription>
            Create a copy of "{scenario.name}". You can customize the name for the new scenario.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="scenario-name">New Scenario Name</Label>
            <Input
              id="scenario-name"
              placeholder="Enter name for the duplicate scenario..."
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
            onClick={handleDuplicate}
            disabled={!scenarioName.trim() || isDuplicating}
          >
            {isDuplicating ? 'Duplicating...' : 'Create Copy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
