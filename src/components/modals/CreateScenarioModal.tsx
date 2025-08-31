'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { useScenarioStore } from '@/lib/stores/scenarioStore'

interface CreateScenarioModalProps {
  trigger?: React.ReactNode
  className?: string
}

export function CreateScenarioModal({ trigger, className }: CreateScenarioModalProps) {
  const [open, setOpen] = useState(false)
  const [scenarioName, setScenarioName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  
  const router = useRouter()
  const { createNewScenario } = useScenarioStore()

  const handleCreate = async () => {
    if (!scenarioName.trim()) return
    
    setIsCreating(true)
    
    try {
      console.log('Creating scenario with name:', scenarioName.trim())
      createNewScenario(scenarioName.trim())
      
      // Give a small delay to ensure the scenario is created
      await new Promise(resolve => setTimeout(resolve, 100))
      
      setOpen(false)
      setScenarioName('')
      router.push('/builder')
    } catch (error) {
      console.error('Error creating scenario:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setScenarioName('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && scenarioName.trim()) {
      e.preventDefault()
      handleCreate()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className={className}>
            <PlusIcon size={16} className="mr-2" />
            Create New Scenario
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Scenario</DialogTitle>
          <DialogDescription>
            Enter a name for your new cap table scenario. You can always change this later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="scenario-name">Scenario Name</Label>
            <Input
              id="scenario-name"
              placeholder="e.g., Series A Scenario, IPO Exit Plan..."
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
            onClick={handleCreate}
            disabled={!scenarioName.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Scenario'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
