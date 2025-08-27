'use client';

import { useState } from 'react'
import { SaveIcon, ShareIcon, FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SaveStatus } from '@/components/ui/save-status'
import { UserMenu } from '@/components/auth/UserMenu'
import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { useUIStore } from '@/lib/stores/uiStore'
import { useAutoSave } from '@/lib/hooks/useAutoSave'
import { useNotifications } from '@/lib/stores/uiStore'
import { useAuth } from '@/lib/auth/AuthContext'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  className?: string
}

export const AppHeader = ({ className }: AppHeaderProps) => {
  const { 
    scenario, 
    isSaving,
    saveCurrentScenario,
    setScenario 
  } = useScenarioStore()
  
  const { setShareModalOpen } = useUIStore()
  const { showSuccess, showError } = useNotifications()
  const { manualSave } = useAutoSave({ enabled: true })
  const { user } = useAuth()
  
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')

  const handleNameEdit = () => {
    if (!scenario) return
    setTempName(scenario.name)
    setIsEditingName(true)
  }

  const handleNameSave = async () => {
    if (!scenario || !tempName.trim()) {
      setIsEditingName(false)
      return
    }

    const updatedScenario = {
      ...scenario,
      name: tempName.trim(),
      updatedAt: new Date()
    }

    setScenario(updatedScenario)
    setIsEditingName(false)
    
    // Auto-save the name change
    const success = await saveCurrentScenario()
    if (success) {
      showSuccess('Scenario name updated')
    } else {
      showError('Failed to save name change')
    }
  }

  const handleNameCancel = () => {
    setIsEditingName(false)
    setTempName('')
  }

  const handleManualSave = async () => {
    await manualSave()
    // Notification is handled by the useAutoSave hook
  }

  const handleShare = () => {
    if (!scenario) {
      showError('No scenario to share', 'Please create a scenario first.')
      return
    }
    setShareModalOpen(true)
  }

  if (!scenario) {
    return (
      <header className={cn(
        'flex items-center justify-between p-4 border-b bg-background',
        className
      )}>
        <div className="flex items-center gap-4">
          <FileTextIcon size={24} className="text-primary" />
          <h1 className="text-xl font-semibold">Startup Value Simulator</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <ShareIcon size={16} className="mr-2" />
            Share
          </Button>
          <UserMenu />
        </div>
      </header>
    )
  }

  return (
    <header className={cn(
      'flex items-center justify-between p-4 border-b bg-background',
      className
    )}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <FileTextIcon size={24} className="text-primary" />
        
        {isEditingName ? (
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNameSave()
                } else if (e.key === 'Escape') {
                  handleNameCancel()
                }
              }}
              onBlur={handleNameSave}
              autoFocus
              className="text-lg font-semibold"
              placeholder="Scenario name..."
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleNameEdit}
            className="text-xl font-semibold text-left hover:bg-muted px-2 py-1 rounded transition-colors truncate"
            title="Click to edit name"
          >
            {scenario.name}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <SaveStatus />
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon size={16} className="mr-2" />
                Save
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <ShareIcon size={16} className="mr-2" />
            Share
          </Button>
          
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
