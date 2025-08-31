'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { AppLayout } from '@/components/layout/AppLayout'
import { 
  PlusIcon, 
  TrashIcon, 
  Share2Icon,
  GitCompareIcon,
  TrendingUpIcon,
  DollarSignIcon,
  UsersIcon,
  LayersIcon
} from 'lucide-react'
import { shareScenario } from '@/lib/database/queries'
import { loadUserScenarios } from '@/lib/database/queries'
import { useNotifications } from '@/lib/stores/uiStore'
import { useAuth } from '@/lib/auth/AuthContext'
import { ComparisonChart, ExitDistributionChart } from '@/components/charts/ComparisonChart'
import { CalculationEngine } from '@/lib/financial/CalculationEngine'
import type { Scenario, CapTableCalculations } from '@/types/scenario'

interface ScenarioComparison {
  scenario: Scenario
  calculations: CapTableCalculations | null
}

interface ComparisonMetrics {
  totalValuation: number
  founderOwnership: number
  investorOwnership: number
  esopOwnership: number
  totalFunding: number
  rounds: number
  exitValue100M: number
  exitValue500M: number
}

export default function ComparePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { showSuccess, showError } = useNotifications()
  
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenarios, setSelectedScenarios] = useState<ScenarioComparison[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  // Metrics are derived; no state needed to avoid render loops

  // Redirect to login if not authenticated
  const hasRedirected = useRef(false)
  useEffect(() => {
    if (!authLoading && !user && !hasRedirected.current) {
      hasRedirected.current = true
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchInFlight = useRef(false)
  const showErrorRef = useRef(showError)
  useEffect(() => { showErrorRef.current = showError }, [showError])
  const loadScenariosData = useCallback(async () => {
    if (fetchInFlight.current) return
    if (!user) {
      setLoading(false)
      return
    }
    fetchInFlight.current = true
    setLoading(true)
    const timeout = setTimeout(() => {
      if (fetchInFlight.current) {
        console.warn('compare loadScenariosData timeout fallback triggered')
        setLoading(false)
        fetchInFlight.current = false
      }
    }, 15000)
    try {
      const result = await loadUserScenarios()
      if (result.success && result.data) {
        setScenarios(result.data.scenarios)
      } else {
        showErrorRef.current('Failed to load scenarios', result.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error loading scenarios:', error)
      showErrorRef.current('Error', 'Failed to load scenarios')
    } finally {
      clearTimeout(timeout)
      setLoading(false)
      fetchInFlight.current = false
    }
  }, [user])

  // Keep a ref to the loader to avoid effect dependency churn
  const loadFnRef = useRef(loadScenariosData)
  useEffect(() => { loadFnRef.current = loadScenariosData }, [loadScenariosData])

  const comparisonMetrics = useMemo<ComparisonMetrics[]>(() => {
    if (selectedScenarios.length === 0) return []
    return selectedScenarios.map(({ scenario, calculations }) => {
      if (!calculations) {
        return {
          totalValuation: 0,
          founderOwnership: 0,
          investorOwnership: 0,
          esopOwnership: 0,
          totalFunding: 0,
          rounds: scenario.rounds.length,
          exitValue100M: 0,
          exitValue500M: 0
        }
      }
      const totalValuation = calculations.roundResults.length > 0
        ? calculations.roundResults[calculations.roundResults.length - 1].postMoney
        : 0
      const founderOwnership = calculations.currentOwnership.filter(o => o.stakeholderType === 'founder').reduce((s, o) => s + o.percentage, 0)
      const investorOwnership = calculations.currentOwnership.filter(o => o.stakeholderType === 'investor').reduce((s, o) => s + o.percentage, 0)
      const esopOwnership = calculations.currentOwnership.filter(o => o.stakeholderType === 'esop').reduce((s, o) => s + o.percentage, 0)
      const totalFunding = scenario.rounds.reduce((s, r) => s + r.amount, 0)
      const founderShares = calculations.currentOwnership.filter(o => o.stakeholderType === 'founder').reduce((s, o) => s + o.shares, 0)
      const exitValue100M = (founderShares / calculations.totalShares) * 100000000
      const exitValue500M = (founderShares / calculations.totalShares) * 500000000
      return {
        totalValuation,
        founderOwnership,
        investorOwnership,
        esopOwnership,
        totalFunding,
        rounds: scenario.rounds.length,
        exitValue100M,
        exitValue500M
      }
    })
  }, [selectedScenarios])

  useEffect(() => {
    if (authLoading) return
    if (user) {
      loadFnRef.current()
    } else {
      setLoading(false)
    }
  }, [authLoading, user])

  // (Removed separate effect calling calculateComparisonMetrics to avoid dependency loop)

  const addScenario = async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    // Check if already selected
    if (selectedScenarios.some(s => s.scenario.id === scenarioId)) {
      showError('Already selected', 'This scenario is already in the comparison')
      return
    }

    // Limit to 4 scenarios for better visualization
    if (selectedScenarios.length >= 4) {
      showError('Limit reached', 'You can compare up to 4 scenarios at once')
      return
    }

    try {
      // Calculate the scenario
      const engine = new CalculationEngine(scenario)
      const calculations = engine.calculateCapTable()
      
      setSelectedScenarios(prev => [...prev, { scenario, calculations }])
      showSuccess('Scenario added', `"${scenario.name}" added to comparison`)
    } catch (error) {
      console.error('Error calculating scenario:', error)
      showError('Error', 'Failed to calculate scenario data')
    }
  }

  const removeScenario = (scenarioId: string) => {
    setSelectedScenarios(prev => prev.filter(s => s.scenario.id !== scenarioId))
  }

  const [shareLink, setShareLink] = useState<string | null>(null)

  const shareComparison = async () => {
    if (selectedScenarios.length === 0) {
      showError('Nothing to share', 'Add scenarios first')
      return
    }
    try {
      // Generate / ensure public share tokens for each scenario
      const tokenResults = await Promise.all(selectedScenarios.map(async ({ scenario }) => {
        const res = await shareScenario(scenario.id, { isPublic: true, canView: true })
        if (!res.success || !res.data) throw new Error(res.error || 'Share failed')
        return res.data.shareToken
      }))
  const json = JSON.stringify({ v:1, t: Date.now(), tokens: tokenResults })
  const b64 = typeof window !== 'undefined' ? btoa(json) : Buffer.from(json).toString('base64')
  // URL-safe base64 (no padding)
  const payload = b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
  const url = `${window.location.origin}/share/compare/${payload}`
      setShareLink(url)
      try { await navigator.clipboard?.writeText(url) } catch {}
    } catch (e) {
      console.error('Share comparison failed', e)
      showError('Share failed', 'Could not generate link')
    }
  }

  const filteredScenarios = scenarios.filter(scenario =>
    scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedScenarios.some(s => s.scenario.id === scenario.id)
  )

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

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading scenarios...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl" data-export="scenario-comparison">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Scenario Comparison
            </h1>
            <p className="text-muted-foreground mt-1">
              Compare multiple scenarios side by side to understand the impact of different funding strategies
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={shareComparison} 
              disabled={selectedScenarios.length === 0}
              variant="outline"
            >
              <Share2Icon size={16} className="mr-2" />
              Share Comparison
            </Button>
          </div>
        </div>
        {shareLink && (
          <div className="mb-8 bg-muted/40 border rounded-md p-3 text-xs break-all">
            <div className="font-medium mb-1">Share link (copied):</div>
            <div className="font-mono leading-snug select-all">{shareLink}</div>
          </div>
        )}

        {/* Scenario Selection */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <PlusIcon size={20} />
            Add Scenarios to Compare
          </h2>
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="search">Search scenarios</Label>
              <Input
                id="search"
                placeholder="Search by scenario name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredScenarios.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredScenarios.map((scenario) => (
                <Button
                  key={scenario.id}
                  variant="outline"
                  className="h-auto p-4 text-left justify-start"
                  onClick={() => addScenario(scenario.id)}
                >
                  <div>
                    <h4 className="font-medium">{scenario.name}</h4>
                    <div className="text-sm text-muted-foreground mt-1">
                      {scenario.founders?.length || 0} founders • {scenario.rounds?.length || 0} rounds
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {filteredScenarios.length === 0 && searchTerm && (
            <p className="text-muted-foreground text-center py-4">
              No scenarios found matching "{searchTerm}"
            </p>
          )}
        </div>

        {/* Selected Scenarios */}
        {selectedScenarios.length > 0 && (
          <div className="space-y-8">
            {/* Selected Scenarios List */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <GitCompareIcon size={20} />
                Selected Scenarios ({selectedScenarios.length}/4)
              </h2>
              
              <div className="flex flex-wrap gap-2">
                {selectedScenarios.map(({ scenario }) => (
                  <Badge key={scenario.id} variant="secondary" className="px-3 py-1">
                    {scenario.name}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-2 h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeScenario(scenario.id)}
                    >
                      <TrashIcon size={12} />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Comparison Metrics */}
            {comparisonMetrics.length > 0 && (
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUpIcon size={20} />
                  Key Metrics Comparison
                </h2>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        {selectedScenarios.map(({ scenario }) => (
                          <TableHead key={scenario.id} className="text-center">
                            {scenario.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Current Valuation</TableCell>
                        {comparisonMetrics.map((metrics, index) => (
                          <TableCell key={`valuation-${selectedScenarios[index].scenario.id}`} className="text-center">
                            {formatCurrency(metrics.totalValuation)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Total Funding</TableCell>
                        {comparisonMetrics.map((metrics, index) => (
                          <TableCell key={`funding-${selectedScenarios[index].scenario.id}`} className="text-center">
                            {formatCurrency(metrics.totalFunding)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Funding Rounds</TableCell>
                        {comparisonMetrics.map((metrics, index) => (
                          <TableCell key={`rounds-${selectedScenarios[index].scenario.id}`} className="text-center">
                            {metrics.rounds}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Founder Ownership</TableCell>
                        {comparisonMetrics.map((metrics, index) => (
                          <TableCell key={`founder-${selectedScenarios[index].scenario.id}`} className="text-center font-medium text-blue-600">
                            {formatPercentage(metrics.founderOwnership)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Investor Ownership</TableCell>
                        {comparisonMetrics.map((metrics, index) => (
                          <TableCell key={`investor-${selectedScenarios[index].scenario.id}`} className="text-center">
                            {formatPercentage(metrics.investorOwnership)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">ESOP Pool</TableCell>
                        {comparisonMetrics.map((metrics, index) => (
                          <TableCell key={`esop-${selectedScenarios[index].scenario.id}`} className="text-center">
                            {formatPercentage(metrics.esopOwnership)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Exit Value ($100M)</TableCell>
                        {comparisonMetrics.map((metrics, index) => (
                          <TableCell key={`exit100-${selectedScenarios[index].scenario.id}`} className="text-center font-medium text-green-600">
                            {formatCurrency(metrics.exitValue100M)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Exit Value ($500M)</TableCell>
                        {comparisonMetrics.map((metrics, index) => (
                          <TableCell key={`exit500-${selectedScenarios[index].scenario.id}`} className="text-center font-medium text-green-600">
                            {formatCurrency(metrics.exitValue500M)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Charts Comparison - Simplified for now */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ownership Distribution */}
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UsersIcon size={18} />
                  Ownership Distribution
                </h3>
                <div className="space-y-6">
                  {selectedScenarios.map(({ scenario, calculations }) => (
                    <div key={scenario.id} className="page-break-avoid">
                      {calculations && (
                        <ComparisonChart
                          calculations={calculations}
                          title={scenario.name}
                          className="h-64"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Exit Distribution */}
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSignIcon size={18} />
                  Exit Distribution ($100M)
                </h3>
                <div className="space-y-6">
                  {selectedScenarios.map(({ scenario, calculations }) => (
                    <div key={scenario.id} className="page-break-avoid">
                      {calculations && (
                        <ExitDistributionChart
                          calculations={calculations}
                          title={scenario.name}
                          exitValue={100_000_000}
                          className="h-64"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculation spinner removed; metrics compute synchronously */}
          </div>
        )}

        {/* Empty State */}
  {selectedScenarios.length === 0 && (
          <div className="text-center py-12">
            <LayersIcon size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scenarios selected</h3>
            <p className="text-muted-foreground mb-4">
              Select scenarios from the list above to start comparing them side by side.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}