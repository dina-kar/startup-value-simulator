'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
import { CreateScenarioModal } from '@/components/modals/CreateScenarioModal'
import { useAuth } from '@/lib/auth/AuthContext'
import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { useNotifications } from '@/lib/stores/uiStore'
import { loadUserScenarios, deleteScenario } from '@/lib/database/queries'
import { ShareModal } from '@/components/modals/ShareModal'
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
  const { setScenario } = useScenarioStore()
  const { showSuccess, showError } = useNotifications()
  const { user, loading: authLoading } = useAuth()
  
  const [scenarios, setScenarios] = useState<ScenarioWithMetadata[]>([])
  // Separate auth loading from data loading to avoid spinner deadlocks
  const [loading, setLoading] = useState(false)
  const fetchInFlight = useRef(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Redirect to login if not authenticated
  const hasRedirected = useRef(false)
  useEffect(() => {
    if (!authLoading && !user && !hasRedirected.current) {
      hasRedirected.current = true
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const showErrorRef = useRef(showError)
  useEffect(() => { showErrorRef.current = showError }, [showError])
  const loadScenarios = useCallback(async () => {
    if (fetchInFlight.current) return
    if (!user) {
      setLoading(false)
      return
    }
    fetchInFlight.current = true
    setLoading(true)
    // Failsafe timeout to ensure loading spinner cannot persist forever
    const timeout = setTimeout(() => {
      if (fetchInFlight.current) {
        console.warn('loadScenarios timeout fallback triggered')
        setLoading(false)
        fetchInFlight.current = false
      }
    }, 15000)
    try {
      const result = await loadUserScenarios()
      if (result.success && result.data) {
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
        showErrorRef.current('Failed to load scenarios', result.error || 'Unknown error')
        setScenarios([])
      }
    } catch (error) {
      console.error('Error loading scenarios:', error)
      showErrorRef.current('Error', 'Failed to load scenarios')
      setScenarios([])
    } finally {
      clearTimeout(timeout)
      setLoading(false)
      fetchInFlight.current = false
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    if (user) {
      loadScenarios()
    } else {
      setLoading(false)
      setScenarios([])
    }
  }, [authLoading, user, loadScenarios])

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
        // Remove the deleted scenario from local state instead of reloading
        setScenarios(prev => prev.filter(s => s.id !== scenarioId))
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
      return `$${(amount / 1000).toFixed(1)}K`    }
    return `$${amount.toLocaleString()}`
  }

  // Show auth-specific spinner while auth state is resolving
  if (authLoading) {
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

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading scenarios...</p>
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
          
          <CreateScenarioModal />
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
            
            {!searchTerm && (
              <CreateScenarioModal 
                trigger={
                  <Button className="mt-4">
                    <PlusIcon size={16} className="mr-2" />
                    Create Your First Scenario
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
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
                          <ShareModal scenario={scenario}>
                            <ShareIcon size={16} />
                          </ShareModal>
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
          </div>
        )}
      </div>
    </AppLayout>
  )
}
