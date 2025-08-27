'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, ShareIcon, TrashIcon, CopyIcon, EyeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Banner, BannerIcon, BannerTitle } from '@/components/ui/banner'
import { AppLayout } from '@/components/layout/AppLayout'
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

export default function DashboardPage() {
  const router = useRouter()
  const { setScenario, createNewScenario } = useScenarioStore()
  const { showSuccess, showError } = useNotifications()
  
  const [scenarios, setScenarios] = useState<ScenarioWithMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadScenarios()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadScenarios = async () => {
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
  }

  const handleCreateNew = () => {
    createNewScenario('New Scenario')
    router.push('/builder')
  }

  const handleOpenScenario = (scenario: Scenario) => {
    setScenario(scenario)
    router.push('/builder')
  }

  const handleDuplicateScenario = (scenario: Scenario) => {
    const duplicatedScenario = {
      ...scenario,
      id: crypto.randomUUID(),
      name: `${scenario.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setScenario(duplicatedScenario)
    router.push('/builder')
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
            <h1 className="text-3xl font-bold text-foreground">
              Scenario Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and analyze your cap table scenarios
            </p>
          </div>
          
          <Button onClick={handleCreateNew} className="w-full sm:w-auto">
            <PlusIcon size={16} className="mr-2" />
            Create New Scenario
          </Button>
        </div>

        {/* Search and Filters */}
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg border p-6">
            <div className="text-2xl font-bold text-foreground">{scenarios.length}</div>
            <div className="text-sm text-muted-foreground">Total Scenarios</div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-2xl font-bold text-foreground">
              {scenarios.reduce((acc, s) => acc + (s.founder_count || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Founders</div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-2xl font-bold text-foreground">
              {scenarios.reduce((acc, s) => acc + (s.round_count || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Rounds</div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(scenarios.reduce((acc, s) => acc + (s.total_valuation || 0), 0))}
            </div>
            <div className="text-sm text-muted-foreground">Total Valuation</div>
          </div>
        </div>

        {/* Scenarios Table */}
        {filteredScenarios.length === 0 ? (
          <div className="text-center py-12">
            <Banner className="bg-blue-50 text-blue-900 border-blue-200 max-w-md mx-auto">
              <BannerIcon icon={PlusIcon} />
              <div>
                <BannerTitle>No scenarios found</BannerTitle>
                <p className="text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Create your first scenario to get started.'}
                </p>
              </div>
            </Banner>
            
            {!searchTerm && (
              <Button onClick={handleCreateNew} className="mt-4">
                <PlusIcon size={16} className="mr-2" />
                Create Your First Scenario
              </Button>
            )}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario Name</TableHead>
                  <TableHead>Founders</TableHead>
                  <TableHead>Rounds</TableHead>
                  <TableHead>Current Valuation</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScenarios.map((scenario) => (
                  <TableRow key={scenario.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell 
                      className="font-medium"
                      onClick={() => handleOpenScenario(scenario)}
                    >
                      <div>
                        <div className="font-medium text-foreground">
                          {scenario.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => handleOpenScenario(scenario)}>
                      <Badge variant="secondary">
                        {scenario.founder_count} founder{scenario.founder_count !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => handleOpenScenario(scenario)}>
                      <Badge variant="outline">
                        {scenario.round_count} round{scenario.round_count !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => handleOpenScenario(scenario)}>
                      <span className="font-medium">
                        {scenario.total_valuation ? formatCurrency(scenario.total_valuation) : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell onClick={() => handleOpenScenario(scenario)}>
                      <span className="text-muted-foreground">
                        {scenario.updated_at ? formatDate(scenario.updated_at) : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenScenario(scenario)
                          }}
                          title="Open scenario"
                        >
                          <EyeIcon size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateScenario(scenario)
                          }}
                          title="Duplicate scenario"
                        >
                          <CopyIcon size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700"
                          title="Share scenario"
                        >
                          <ShareIcon size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteScenario(scenario.id, scenario.name)
                          }}
                          title="Delete scenario"
                        >
                          <TrashIcon size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
