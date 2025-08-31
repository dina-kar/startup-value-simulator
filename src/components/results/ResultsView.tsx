"use client"

import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { useState } from 'react'
import { CapTableTable } from '@/components/charts/CapTableTable'
import { OwnershipChart } from '@/components/charts/OwnershipChart'
import { ExitWaterfallChart } from '@/components/charts/ExitWaterfallChart'
import { AuditDrawer } from '@/components/modals/AuditDrawer'
import { ShareModal } from '@/components/modals/ShareModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ShareIcon, ChevronDown } from 'lucide-react'

export function ResultsView() {
  const { 
    calculations, 
    rounds, 
    founders, 
    esop,
    scenario,
    validationErrors
  } = useScenarioStore()
  const [active, setActive] = useState('overview')

  if (founders.length === 0) {
    return (
      <div className="text-center py-12" data-export="scenario-results">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Setup Required
        </h3>
        <p className="text-gray-500">
          Please add founders in the Setup tab to see results.
        </p>
      </div>
    )
  }

  if (validationErrors.length > 0) {
    return (
      <div className="space-y-4" data-export="scenario-results">
        <div className="text-center py-8 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Validation Errors
          </h3>
          <p className="text-red-700 mb-4">
            Please fix the following issues:
          </p>
          <ul className="text-left inline-block space-y-1">
            {validationErrors.map((error) => (
              <li key={error} className="text-red-600">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  if (!calculations) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Calculating cap table...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8" data-export="scenario-results">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-4">Results & Analysis</h2>
          <p className="text-gray-600">
            Complete cap table analysis, ownership trends, and exit scenarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          {scenario && (
            <ShareModal scenario={scenario}>
              <Button variant="outline" size="sm">
                <ShareIcon className="h-4 w-4 mr-2" />
                Share Results
              </Button>
            </ShareModal>
          )}
          <AuditDrawer />
        </div>
      </div>

      {/* Mobile tab selector */}
      <div className="sm:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between mb-3">
              <span>{active === 'overview' ? 'Overview' : active === 'captable' ? 'Cap Table' : active === 'ownership' ? 'Ownership' : 'Exit Analysis'}</span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2" align="start">
            <ul className="space-y-1 text-sm">
              {['overview','captable','ownership','exit'].map(v => (
                <li key={v}>
                  <button
                    type="button"
                    onClick={() => setActive(v)}
                    className={`w-full text-left px-2 py-2 rounded-md hover:bg-muted ${active===v?'bg-muted font-medium':''}`}
                  >
                    {v === 'overview' ? 'Overview' : v === 'captable' ? 'Cap Table' : v === 'ownership' ? 'Ownership' : 'Exit Analysis'}
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
  <Tabs value={active} onValueChange={setActive} className="w-full">
        <TabsList className="hidden sm:grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="captable">Cap Table</TabsTrigger>
          <TabsTrigger value="ownership">Ownership</TabsTrigger>
          <TabsTrigger value="exit">Exit Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
  <TabsContent value="overview" className="space-y-6 data-[state=inactive]:hidden transition-opacity duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900">Total Shares</h3>
              <p className="text-2xl font-bold text-blue-700">
                {calculations.totalShares.toLocaleString()}
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900">Funding Rounds</h3>
              <p className="text-2xl font-bold text-green-700">
                {rounds.length}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {rounds.filter(r => r.type === 'SAFE').length} SAFEs, {rounds.filter(r => r.type === 'Priced').length} Priced
              </p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-medium text-purple-900">Total Raised</h3>
              <p className="text-2xl font-bold text-purple-700">
                ${rounds.reduce((sum, round) => sum + round.amount, 0).toLocaleString()}
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-medium text-orange-900">Current Valuation</h3>
              <p className="text-2xl font-bold text-orange-700">
                {calculations.roundResults.length > 0 
                  ? `$${calculations.roundResults[calculations.roundResults.length - 1].postMoney.toLocaleString()}`
                  : 'Pre-funding'
                }
              </p>
            </div>
          </div>

          {/* Round-by-Round Summary */}
          {calculations.roundResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Round History</h3>
              <div className="space-y-3">
                {calculations.roundResults.map((result) => {
                  const round = rounds.find(r => r.id === result.roundId)
                  if (!round) return null

                  return (
                    <div key={result.roundId} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{round.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            round.type === 'SAFE' 
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {round.type}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${round.amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">
                            {result.dilution.toFixed(1)}% dilution
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Pre-money:</span>
                          <div className="font-medium">${result.preMoney.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Post-money:</span>
                          <div className="font-medium">${result.postMoney.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Share Price:</span>
                          <div className="font-medium">${result.sharePrice.toFixed(4)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Shares Issued:</span>
                          <div className="font-medium">{result.sharesIssued.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* ESOP and Secondary Information */}
                      {(round.esopAdjustment?.expand || round.secondaryConfig?.enabled) && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {round.esopAdjustment?.expand && (
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  ESOP
                                </span>
                                <span>
                                  Expanded to {round.esopAdjustment.newPoolSize}% 
                                  ({round.esopAdjustment.isPreMoney ? 'pre-money' : 'post-money'})
                                </span>
                              </div>
                            )}
                            
                            {round.secondaryConfig?.enabled && (
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                                  Secondary
                                </span>
                                <span>
                                  {round.secondaryConfig.transactions.length} transaction(s)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Current Ownership Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Ownership</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {calculations.currentOwnership
                .filter(owner => owner.percentage > 0)
                .sort((a, b) => b.percentage - a.percentage)
                .map((stakeholder) => (
                  <div key={stakeholder.stakeholderId} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{stakeholder.stakeholderName}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stakeholder.stakeholderType === 'founder' 
                          ? 'bg-blue-100 text-blue-700'
                          : stakeholder.stakeholderType === 'investor'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {stakeholder.stakeholderType === 'esop' ? 'ESOP' : stakeholder.stakeholderType}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ownership:</span>
                        <span className="font-medium">{stakeholder.percentage.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Shares:</span>
                        <span className="font-medium">{stakeholder.shares.toLocaleString()}</span>
                      </div>
                      {stakeholder.stakeholderType !== 'esop' && calculations.roundResults.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Value at Current:</span>
                          <span className="font-medium">
                            ${(stakeholder.shares * calculations.roundResults[calculations.roundResults.length - 1].sharePrice).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* ESOP Details */}
          {calculations.currentOwnership.find(o => o.stakeholderType === 'esop') && (
            <div>
              <h3 className="text-lg font-semibold mb-4">ESOP Pool Analysis</h3>
              <div className="border rounded-lg p-4 bg-white">
                {(() => {
                  const esopOwner = calculations.currentOwnership.find(o => o.stakeholderType === 'esop')
                  if (!esopOwner) return null

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-gray-500">Current Pool Size:</span>
                        <div className="font-medium text-lg">{esopOwner.percentage.toFixed(2)}%</div>
                        <div className="text-sm text-gray-600">{esopOwner.shares.toLocaleString()} shares</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Allocated:</span>
                        <div className="font-medium text-lg">{((esop.allocated / esop.poolSize) * esopOwner.percentage).toFixed(2)}%</div>
                        <div className="text-sm text-gray-600">
                          {Math.round((esop.allocated / 100) * esopOwner.shares).toLocaleString()} shares
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Available:</span>
                        <div className="font-medium text-lg">{(esopOwner.percentage - ((esop.allocated / esop.poolSize) * esopOwner.percentage)).toFixed(2)}%</div>
                        <div className="text-sm text-gray-600">
                          {Math.round(((100 - esop.allocated) / 100) * esopOwner.shares).toLocaleString()} shares
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Cap Table Tab */}
  <TabsContent value="captable" className="mt-6 data-[state=inactive]:hidden transition-opacity duration-300">
          <div className="-mx-4 sm:mx-0 overflow-x-auto pb-4">
            <div className="min-w-[700px]">
              <CapTableTable />
            </div>
          </div>
        </TabsContent>

        {/* Ownership Chart Tab */}
  <TabsContent value="ownership" className="mt-6 data-[state=inactive]:hidden transition-opacity duration-300">
          <div className="-mx-4 sm:mx-0 overflow-x-auto pb-4">
            <div className="min-w-[640px]">
              <OwnershipChart />
            </div>
          </div>
        </TabsContent>

        {/* Exit Analysis Tab */}
  <TabsContent value="exit" className="mt-6 data-[state=inactive]:hidden transition-opacity duration-300">
          <div className="-mx-4 sm:mx-0 overflow-x-auto pb-4">
            <div className="min-w-[640px]">
              <ExitWaterfallChart />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
