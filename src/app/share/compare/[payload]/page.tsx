"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { GitCompareIcon, AlertCircleIcon, UsersIcon, DollarSignIcon, TrendingUpIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ComparisonChart, ExitDistributionChart } from '@/components/charts/ComparisonChart'
import { Badge } from '@/components/ui/badge'
import { CalculationEngine } from '@/lib/financial/CalculationEngine'
import type { Scenario, CapTableCalculations } from '@/types/scenario'
import { loadSharedScenario } from '@/lib/database/queries'

interface DecodedPayload { v:number; t:number; tokens:string[] }

export default function SharedComparisonPage() {
  const params = useParams()
  const payload = params.payload as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [items, setItems] = useState<Array<{scenario:Scenario; calculations:CapTableCalculations|null}>>([])
  interface ComparisonMetrics { totalValuation:number; founderOwnership:number; investorOwnership:number; esopOwnership:number; totalFunding:number; rounds:number; exitValue100M:number; exitValue500M:number }
  const [metrics, setMetrics] = useState<ComparisonMetrics[]>([])

  useEffect(() => {
    const run = async () => {
      if (!payload) return
      setLoading(true)
      setError(null)
      try {
        let decoded: DecodedPayload | null = null
        try {
          let b64 = payload.replace(/-/g,'+').replace(/_/g,'/')
          // restore padding
          while (b64.length % 4) b64 += '='
          decoded = JSON.parse(atob(b64))
        } catch {
          throw new Error('Invalid share payload')
        }
        if (!decoded || !Array.isArray(decoded.tokens) || decoded.tokens.length === 0) {
          throw new Error('No scenarios in shared comparison')
        }
        const results: Array<{scenario:Scenario; calculations:CapTableCalculations|null}> = []
        for (const token of decoded.tokens.slice(0,4)) { // cap at 4 as in UI
          const res = await loadSharedScenario(token)
          if (res.success && res.data) {
            try {
              const engine = new CalculationEngine(res.data)
              const calc = engine.calculateCapTable()
              results.push({ scenario: res.data, calculations: calc })
            } catch (e) {
              console.warn('Calculation failed for shared scenario token', token, e)
              results.push({ scenario: res.data, calculations: null })
            }
          }
        }
        if (results.length === 0) throw new Error('Could not load any shared scenarios')
        // derive metrics similar to compare page
        setItems(results)
        const derived = results.map(({ scenario, calculations }) => {
          if (!calculations) return {
            totalValuation: 0,
            founderOwnership: 0,
            investorOwnership: 0,
            esopOwnership: 0,
            totalFunding: 0,
            rounds: scenario.rounds.length,
            exitValue100M: 0,
            exitValue500M: 0
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
          return { totalValuation, founderOwnership, investorOwnership, esopOwnership, totalFunding, rounds: scenario.rounds.length, exitValue100M, exitValue500M }
        })
        setMetrics(derived)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load shared comparison'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [payload])

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shared comparison...</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-12 text-center max-w-md">
          <AlertCircleIcon size={40} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout showSidebar={false}>
      <div className="container mx-auto px-4 py-8" data-export="scenario-comparison">
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center gap-2">
            <GitCompareIcon className="h-6 w-6 text-primary" />
            <span className="font-semibold">Startup Value Simulator</span>
          </div>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Shared Comparison</h1>
            <p className="text-muted-foreground mt-1">Read-only view of multiple shared scenarios</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <GitCompareIcon size={20} />
            Scenarios ({items.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {items.map(({scenario}) => (
              <Badge key={scenario.id} variant="secondary" className="px-3 py-1">
                {scenario.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Metrics table similar to compare page */}
        {metrics.length > 0 && (
          <div className="bg-card rounded-lg border p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><TrendingUpIcon size={20}/> Key Metrics</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    {items.map(({scenario}) => <TableHead key={scenario.id} className="text-center">{scenario.name}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Current Valuation</TableCell>
                    {items.map(({scenario},i) => <TableCell key={`val-${scenario.id}`} className="text-center">${metrics[i].totalValuation.toLocaleString()}</TableCell>)}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Funding</TableCell>
                    {items.map(({scenario},i) => <TableCell key={`fund-${scenario.id}`} className="text-center">${metrics[i].totalFunding.toLocaleString()}</TableCell>)}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Funding Rounds</TableCell>
                    {items.map(({scenario},i) => <TableCell key={`rounds-${scenario.id}`} className="text-center">{metrics[i].rounds}</TableCell>)}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Founder Ownership</TableCell>
                    {items.map(({scenario},i) => <TableCell key={`founder-${scenario.id}`} className="text-center text-blue-600 font-medium">{metrics[i].founderOwnership.toFixed(1)}%</TableCell>)}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Investor Ownership</TableCell>
                    {items.map(({scenario},i) => <TableCell key={`investor-${scenario.id}`} className="text-center">{metrics[i].investorOwnership.toFixed(1)}%</TableCell>)}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">ESOP Pool</TableCell>
                    {items.map(({scenario},i) => <TableCell key={`esop-${scenario.id}`} className="text-center">{metrics[i].esopOwnership.toFixed(1)}%</TableCell>)}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Exit Value ($100M)</TableCell>
                    {items.map(({scenario},i) => <TableCell key={`exit100-${scenario.id}`} className="text-center text-green-600 font-medium">${Math.round(metrics[i].exitValue100M).toLocaleString()}</TableCell>)}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Exit Value ($500M)</TableCell>
                    {items.map(({scenario},i) => <TableCell key={`exit500-${scenario.id}`} className="text-center text-green-600 font-medium">${Math.round(metrics[i].exitValue500M).toLocaleString()}</TableCell>)}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><UsersIcon size={18}/> Ownership Distribution</h3>
              <div className="space-y-6">
                {items.map(({scenario, calculations}) => (
                  <div key={scenario.id} className="page-break-avoid">
                    {calculations && <ComparisonChart calculations={calculations} title={scenario.name} className="h-64" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><DollarSignIcon size={18}/> Exit Distribution ($100M)</h3>
              <div className="space-y-6">
                {items.map(({scenario, calculations}) => (
                  <div key={scenario.id} className="page-break-avoid">
                    {calculations && <ExitDistributionChart calculations={calculations} title={scenario.name} exitValue={100_000_000} className="h-64" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
