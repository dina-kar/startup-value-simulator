'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, ShareIcon, TrashIcon, CopyIcon, EyeIcon, FolderIcon, PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Banner, BannerIcon, BannerTitle } from '@/components/ui/banner'
import { AppLayout } from '@/components/layout/AppLayout'
import { CreateScenarioModal } from '@/components/modals/CreateScenarioModal'
import { DuplicateScenarioModal } from '@/components/modals/DuplicateScenarioModal'
import { EditScenarioNameModal } from '@/components/modals/EditScenarioNameModal'
import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { useNotifications } from '@/lib/stores/uiStore'
import { loadUserScenarios, deleteScenario } from '@/lib/database/queries'
import type { Scenario } from '@/types/scenario'

interface ScenarioWithMetadata extends Scenario {
  created_at?: string
  updated_at?: string
  founder_count?: number
  round_count?: number
  total_valuation?: number
}

export default function ScenariosPage() {
  const router = useRouter()
  const { setScenario, saveCurrentScenario } = useScenarioStore()
  const { showSuccess, showError } = useNotifications()
  
  const [scenarios, setScenarios] = useState<ScenarioWithMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadScenarios = useCallback(async () => {
    setLoading(true)
    try {
      const result = await loadUserScenarios()
      if (result.success && result.data) {
        // Add metadata to scenarios
        const scenariosWithMetadata = result.data.scenarios.map(scenario => ({
          ...scenario,
          founder_count: scenario.founders?.length || 0,
          round_count: scenario.rounds?.length || 0,
          total_valuation: scenario.rounds?.length > 0 
            ? scenario.rounds[scenario.rounds.length - 1]?.postMoney || 0 
            : 0
        }))
        setScenarios(scenariosWithMetadata)
      } else {
        showError('Failed to load scenarios', result.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error loading scenarios:', error)
      showError('Error', 'Failed to load scenarios')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    loadScenarios()
  }, [loadScenarios])

  const handleOpenScenario = (scenario: Scenario) => {
    setScenario(scenario)
    router.push('/builder')
  }

  const handleScenarioNameChange = async (scenario: Scenario, newName: string) => {
    try {
      // Update the scenario in the store
      const updatedScenario = { ...scenario, name: newName, updatedAt: new Date() }
      setScenario(updatedScenario, true) // Mark as changed
      
      // Force save the scenario with new name
      const success = await saveCurrentScenario(false, true)
      
      if (success) {
        // Update local state
        setScenarios(prevScenarios => 
          prevScenarios.map(s => s.id === scenario.id ? { ...s, name: newName } : s)
        )
      } else {
        throw new Error('Failed to save scenario name change')
      }
    } catch (error) {
      console.error('Error updating scenario name:', error)
      throw error // Re-throw to let the modal handle the error display
    }
  }

  const handleDeleteScenario = async (scenarioId: string, scenarioName: string) => {
    if (!confirm(`Are you sure you want to delete "${scenarioName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deleteScenario(scenarioId)
      if (result.success) {
        showSuccess('Scenario deleted', `"${scenarioName}" has been deleted.`)
        loadScenarios() // Reload the list
      } else {
        showError('Failed to delete scenario', result.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error deleting scenario:', error)
      showError('Error', 'Failed to delete scenario')
    }
  }

  const filteredScenarios = scenarios.filter(scenario =>
    scenario.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount.toLocaleString()}`
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <FolderIcon className="h-8 w-8" />
              My Scenarios
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize your cap table scenarios
            </p>
          </div>
          
          <CreateScenarioModal className="w-full sm:w-auto" />
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search scenarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>

        {/* Scenarios Grid */}
        {filteredScenarios.length === 0 ? (
          <div className="text-center py-12">
            <Banner className="bg-blue-50 text-blue-900 border-blue-200 max-w-md mx-auto">
              <BannerIcon icon={PlusIcon} />
              <div>
                <BannerTitle>No scenarios found</BannerTitle>
              </div>
            </Banner>
            
            {!searchTerm && (
              <CreateScenarioModal 
                className="mt-4"
                trigger={
                  <Button>
                    <PlusIcon size={16} className="mr-2" />
                    Create Your First Scenario
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow text-left w-full relative"
              >
                {/* Invisible button for main click action */}
                <button
                  type="button"
                  className="absolute inset-0 z-0 w-full h-full opacity-0 cursor-pointer"
                  onClick={() => handleOpenScenario(scenario)}
                  aria-label={`Open scenario ${scenario.name}`}
                />
                
                {/* Header */}
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {scenario.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {scenario.updated_at ? formatDate(scenario.updated_at) : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <EditScenarioNameModal
                      scenario={scenario}
                      onNameChange={(newName) => handleScenarioNameChange(scenario, newName)}
                      trigger={
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                          title="Rename scenario"
                          className="h-8 w-8 p-0 relative z-20"
                        >
                          <PencilIcon size={14} />
                        </Button>
                      }
                    />
                    <DuplicateScenarioModal
                      scenario={scenario}
                      onDuplicate={() => loadScenarios()} // Refresh the list after duplication
                      trigger={
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                          title="Duplicate scenario"
                          className="h-8 w-8 p-0 relative z-20"
                        >
                          <CopyIcon size={14} />
                        </Button>
                      }
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0 relative z-20"
                      title="Share scenario"
                    >
                      <ShareIcon size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0 relative z-20"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteScenario(scenario.id, scenario.name)
                      }}
                      title="Delete scenario"
                    >
                      <TrashIcon size={14} />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 mb-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Founders:</span>
                    <Badge variant="secondary">
                      {scenario.founder_count}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rounds:</span>
                    <Badge variant="outline">
                      {scenario.round_count}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Valuation:</span>
                    <span className="text-sm font-medium">
                      {scenario.total_valuation ? formatCurrency(scenario.total_valuation) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Open Button */}
                <Button
                  size="sm"
                  className="w-full relative z-20"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenScenario(scenario)
                  }}
                >
                  <EyeIcon size={14} className="mr-2" />
                  Open Scenario
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
