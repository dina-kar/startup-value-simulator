'use client'

import { useState } from 'react'
import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import { useNotifications } from '@/lib/stores/uiStore'

interface FounderFormData {
  name: string
  email: string
  initialEquity: number
  role?: string
}

export function ScenarioSetupForm() {
  const { 
    founders, 
    esop, 
    addFounder, 
    updateFounder, 
    removeFounder, 
    updateESOPConfig,
    validationErrors 
  } = useScenarioStore()
  
  const { showSuccess, showError } = useNotifications()
  
  const [newFounder, setNewFounder] = useState<FounderFormData>({
    name: '',
    email: '',
    initialEquity: 0,
    role: ''
  })

  const handleAddFounder = () => {
    if (!newFounder.name.trim()) {
      showError('Validation Error', 'Founder name is required')
      return
    }

    if (newFounder.initialEquity <= 0) {
      showError('Validation Error', 'Founder equity must be greater than 0')
      return
    }

    try {
      addFounder({
        name: newFounder.name.trim(),
        email: newFounder.email.trim(),
        initialEquity: newFounder.initialEquity,
        role: newFounder.role?.trim() || undefined
      })

      setNewFounder({
        name: '',
        email: '',
        initialEquity: 0,
        role: ''
      })

      showSuccess('Founder Added', `${newFounder.name} has been added to the cap table`)
    } catch {
      showError('Error', 'Failed to add founder')
    }
  }

  const handleFounderUpdate = (id: string, field: keyof FounderFormData, value: string | number) => {
    const updates: Partial<FounderFormData> = {
      [field]: value
    }
    updateFounder(id, updates)
  }

  const handleRemoveFounder = (id: string) => {
    const founder = founders.find(f => f.id === id)
    if (founder) {
      removeFounder(id)
      showSuccess('Founder Removed', `${founder.name} has been removed from the cap table`)
    }
  }

  const calculateRemainingEquity = () => {
    const usedEquity = founders.reduce((sum, founder) => sum + founder.initialEquity, 0) + 
                      parseFloat(newFounder.initialEquity.toString() || '0')
    return 100 - esop.poolSize - usedEquity
  }

  const remainingEquity = calculateRemainingEquity()

  return (
    <div className="space-y-8">
      {/* ESOP Configuration */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Employee Stock Option Pool (ESOP)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="esop-size">Pool Size (%)</Label>
            <Input
              id="esop-size"
              type="text"
              inputMode="decimal"
              defaultValue={esop.poolSize == null ? '' : String(esop.poolSize)}
              onBlur={(e) => {
              const raw = e.target.value.trim()
              if (raw === '') {
                updateESOPConfig({ poolSize: 0 })
                return
              }
              const normalized = raw.startsWith('.') ? `0${raw}` : raw
              const numValue = parseFloat(normalized)
              if (!Number.isNaN(numValue)) {
                updateESOPConfig({ poolSize: numValue })
              }
              }}
              placeholder="e.g., 20"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Typical range: 10-25% for early-stage startups
            </p>
          </div>
        </div>
      </div>

      {/* Founders Section */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Founders</h3>
        
        {/* Existing Founders */}
        {founders.length > 0 && (
          <div className="space-y-4 mb-6">
            {founders.map((founder) => (
              <div key={founder.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={founder.name}
                    onChange={(e) => handleFounderUpdate(founder.id, 'name', e.target.value)}
                    placeholder="Founder name"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={founder.email}
                    onChange={(e) => handleFounderUpdate(founder.id, 'email', e.target.value)}
                    placeholder="founder@example.com"
                  />
                </div>
                <div>
                  <Label>Equity (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={founder.initialEquity}
                    onChange={(e) => {
                      const value = e.target.value
                      const numValue = value === '' ? 0 : parseFloat(value)
                      if (!Number.isNaN(numValue)) {
                        handleFounderUpdate(founder.id, 'initialEquity', numValue)
                      }
                    }}
                    placeholder="50"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveFounder(founder.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Founder */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h4 className="font-medium mb-4">Add New Founder</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="new-founder-name">Name *</Label>
              <Input
                id="new-founder-name"
                value={newFounder.name}
                onChange={(e) => setNewFounder({ ...newFounder, name: e.target.value })}
                placeholder="Founder name"
              />
            </div>
            <div>
              <Label htmlFor="new-founder-email">Email</Label>
              <Input
                id="new-founder-email"
                type="email"
                value={newFounder.email}
                onChange={(e) => setNewFounder({ ...newFounder, email: e.target.value })}
                placeholder="founder@example.com"
              />
            </div>
            <div>
              <Label htmlFor="new-founder-equity">Equity (%) *</Label>
              <Input
                id="new-founder-equity"
                type="number"
                min="0"
                max={remainingEquity}
                step="0.1"
                value={newFounder.initialEquity || ''}
                onChange={(e) => {
                  const value = e.target.value
                  const numValue = value === '' ? 0 : parseFloat(value)
                  if (!Number.isNaN(numValue)) {
                    setNewFounder({ ...newFounder, initialEquity: numValue })
                  }
                }}
                placeholder="50"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddFounder} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Founder
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-sm">
            <p className="text-muted-foreground">
              Remaining equity available: <span className="font-medium">{remainingEquity.toFixed(1)}%</span>
              {remainingEquity < 0 && (
                <span className="text-red-600 ml-2">
                  ⚠️ Total equity exceeds 100%
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Validation Errors</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error) => (
              <li key={error}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {founders.length > 0 && validationErrors.length === 0 && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">Setup Complete ✓</h4>
          <p className="text-sm text-green-700">
            {founders.length} founder{founders.length > 1 ? 's' : ''} with {esop.poolSize}% ESOP pool configured.
            Ready to add funding rounds!
          </p>
        </div>
      )}
    </div>
  )
}
