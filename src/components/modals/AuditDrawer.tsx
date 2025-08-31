'use client'

import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Calculator, X, AlertCircle, CheckCircle, Info } from 'lucide-react'

interface AuditDrawerProps {
  className?: string
}

export function AuditDrawer({ className }: AuditDrawerProps) {
  const { calculations, founders, rounds, esop, validationErrors } = useScenarioStore()
  const { isAuditDrawerOpen, setAuditDrawerOpen } = useUIStore()
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const formatShares = (shares: number) => {
    if (shares >= 1000000) {
      return `${(shares / 1000000).toFixed(1)}M`
    }
    if (shares >= 1000) {
      return `${(shares / 1000).toFixed(1)}K`
    }
    return shares.toFixed(0)
  }

  return (
    <Drawer open={isAuditDrawerOpen} onOpenChange={setAuditDrawerOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className={className}>
          <Calculator className="h-4 w-4 mr-2" />
          Audit Trail
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[95vh]">
        <div className="mx-auto w-full max-w-7xl">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Calculation Audit Trail
              {validationErrors.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validationErrors.length} Error{validationErrors.length > 1 ? 's' : ''}
                </Badge>
              )}
              {validationErrors.length === 0 && calculations && (
                <Badge variant="default" className="ml-2 bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Valid
                </Badge>
              )}
            </DrawerTitle>
            <DrawerDescription>
              Detailed breakdown of all calculations, formulas, and assumptions used in this scenario
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0">
            {validationErrors.length > 0 ? (
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Validation Errors</h3>
                  <ul className="space-y-1">
                    {validationErrors.map((error) => (
                      <li key={error} className="text-red-700 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : calculations ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="rounds">Round Analysis</TabsTrigger>
                  <TabsTrigger value="ownership">Ownership</TabsTrigger>
                  <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 max-h-[60vh] overflow-y-auto">
                  {/* Quick Summary */}
                  <section>
                    <h3 className="text-lg font-semibold mb-3">Scenario Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm text-blue-600">Total Rounds</div>
                        <div className="text-xl font-bold text-blue-900">{rounds.length}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-sm text-green-600">Capital Raised</div>
                        <div className="text-xl font-bold text-green-900">
                          {formatCurrency(rounds.reduce((sum, round) => sum + round.amount, 0))}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-sm text-purple-600">Total Shares</div>
                        <div className="text-xl font-bold text-purple-900">
                          {formatShares(calculations.totalShares)}
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <div className="text-sm text-orange-600">ESOP Pool</div>
                        <div className="text-xl font-bold text-orange-900">{formatPercentage(esop.poolSize)}</div>
                      </div>
                    </div>
                  </section>

                  {/* Initial Setup */}
                  <section>
                    <h3 className="text-lg font-semibold mb-3">Initial Configuration</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Founder Allocation</h4>
                          <div className="space-y-2">
                            {founders.map(founder => (
                              <div key={founder.id} className="flex justify-between items-center bg-white rounded p-2">
                                <span className="font-medium">{founder.name}</span>
                                <div className="text-right">
                                  <div className="font-semibold">{formatPercentage(founder.initialEquity)}</div>
                                  <div className="text-xs text-gray-500">
                                    {formatShares((founder.initialEquity / 100) * calculations.totalShares)} shares
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">ESOP Configuration</h4>
                          <div className="bg-white rounded p-3 space-y-2">
                            <div className="flex justify-between">
                              <span>Pool Size:</span>
                              <span className="font-semibold">{formatPercentage(esop.poolSize)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Timing:</span>
                              <span className="font-semibold">{esop.isPreMoney ? 'Pre-money' : 'Post-money'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Allocated:</span>
                              <span className="font-semibold">{formatPercentage(esop.allocated)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Available:</span>
                              <span className="font-semibold">{formatPercentage(esop.available)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </TabsContent>

                <TabsContent value="rounds" className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {calculations.roundResults.map((result, index) => {
                    const round = rounds.find(r => r.id === result.roundId)
                    if (!round) return null

                    return (
                      <div key={result.roundId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">
                            Round {index + 1}: {round.name}
                          </h3>
                          <Badge variant={round.type === 'SAFE' ? 'secondary' : 'default'}>
                            {round.type}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <span className="text-sm text-gray-600">Investment</span>
                            <div className="font-semibold">{formatCurrency(round.amount)}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Pre-Money</span>
                            <div className="font-semibold">{formatCurrency(result.preMoney)}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Share Price</span>
                            <div className="font-semibold">{formatCurrency(result.sharePrice)}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Dilution</span>
                            <div className="font-semibold text-red-600">{formatPercentage(result.dilution)}</div>
                          </div>
                        </div>

                        {/* Calculation Formula */}
                        <div className="bg-blue-50 rounded p-3 mb-4">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Calculation Steps
                          </h4>
                          {round.type === 'Priced' ? (
                            <div className="text-sm space-y-1 font-mono">
                              <div>1. Price per Share = Pre-Money Valuation ÷ Pre-Round Shares</div>
                              <div className="ml-4 text-blue-700">
                                = {formatCurrency(result.preMoney)} ÷ {formatShares(calculations.totalShares - result.sharesIssued)} 
                                = <span className="font-bold">{formatCurrency(result.sharePrice)}</span>
                              </div>
                              
                              <div>2. New Shares = Investment ÷ Price per Share</div>
                              <div className="ml-4 text-blue-700">
                                = {formatCurrency(round.amount)} ÷ {formatCurrency(result.sharePrice)} 
                                = <span className="font-bold">{formatShares(result.sharesIssued)} shares</span>
                              </div>
                              
                              <div>3. Dilution = New Shares ÷ Total Shares After Round</div>
                              <div className="ml-4 text-blue-700">
                                = {formatShares(result.sharesIssued)} ÷ {formatShares(result.totalShares)} 
                                = <span className="font-bold">{formatPercentage(result.dilution)}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm space-y-1 font-mono">
                              <div>1. Cap Price = Valuation Cap ÷ Pre-Round Shares</div>
                              <div className="ml-4 text-blue-700">
                                = {formatCurrency(round.valuationCap || 0)} ÷ {formatShares(calculations.totalShares - result.sharesIssued)}
                              </div>
                              
                              {round.discount && round.discount > 0 && (
                                <>
                                  <div>2. Discounted Price = Current Round Price × (1 - Discount)</div>
                                  <div className="ml-4 text-blue-700">
                                    Discount: {formatPercentage(round.discount)}
                                  </div>
                                </>
                              )}
                              
                              <div>3. SAFE Conversion Price = min(Cap Price, Discounted Price)</div>
                              <div className="ml-4 text-blue-700">
                                = <span className="font-bold">{formatCurrency(result.sharePrice)}</span>
                              </div>
                              
                              <div>4. SAFE Shares = Investment ÷ Conversion Price</div>
                              <div className="ml-4 text-blue-700">
                                = {formatCurrency(round.amount)} ÷ {formatCurrency(result.sharePrice)} 
                                = <span className="font-bold">{formatShares(result.sharesIssued)} shares</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ESOP Adjustments */}
                        {round.esopAdjustment?.expand && (
                          <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Info className="h-4 w-4 text-orange-600" />
                              ESOP Pool Adjustment
                            </h4>
                            <div className="text-sm space-y-1">
                              <div>Target Pool Size: {formatPercentage(round.esopAdjustment.newPoolSize || 0)}</div>
                              <div>Timing: {round.esopAdjustment.isPreMoney ? 'Pre-money' : 'Post-money'}</div>
                              <div className="text-orange-700">
                                {round.esopAdjustment.isPreMoney 
                                  ? 'Pool expansion dilutes existing shareholders before new investment'
                                  : 'Pool expansion occurs after new investment, diluting all shareholders proportionally'
                                }
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </TabsContent>

                <TabsContent value="ownership" className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Current Ownership */}
                  <section>
                    <h3 className="text-lg font-semibold mb-3">Current Ownership Distribution</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {calculations.currentOwnership.map(owner => (
                        <div key={owner.stakeholderId} className="bg-white border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">{owner.stakeholderName}</span>
                            <Badge variant={
                              owner.stakeholderType === 'founder' ? 'default' :
                              owner.stakeholderType === 'esop' ? 'secondary' : 'outline'
                            }>
                              {owner.stakeholderType}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Ownership:</span>
                              <span className="font-semibold">{formatPercentage(owner.percentage)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Shares:</span>
                              <span className="font-semibold">{formatShares(owner.shares)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Exit Distribution */}
                  {calculations.exitDistribution.length > 0 && (
                    <section>
                      <h3 className="text-lg font-semibold mb-3">Exit Value Distribution</h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {calculations.exitDistribution.map(exit => (
                            <div key={exit.stakeholderId} className="bg-white rounded p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{exit.stakeholderName}</span>
                                <span className="text-lg font-bold text-green-700">
                                  {formatCurrency(exit.netValue)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {formatPercentage(exit.percentage)} of exit value
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}
                </TabsContent>

                <TabsContent value="assumptions" className="space-y-4 max-h-[60vh] overflow-y-auto">
                  <section>
                    <h3 className="text-lg font-semibold mb-3">Key Assumptions & Methodology</h3>
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Financial Calculations</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          <li>Base share count: 10,000,000 shares (for calculation precision)</li>
                          <li>All valuations are in USD</li>
                          <li>Share prices calculated using pre-money valuation ÷ pre-round shares</li>
                          <li>Dilution calculated as new shares ÷ total shares after round</li>
                          <li>No rounding errors considered in display (internal precision: 6 decimal places)</li>
                        </ul>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium mb-2">SAFE Conversion Logic</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          <li>SAFEs convert at the better of valuation cap or discount price</li>
                          <li>Discount applied to the price per share of the triggering priced round</li>
                          <li>If only cap is provided, conversion occurs at cap price</li>
                          <li>If only discount is provided, conversion occurs at discounted round price</li>
                          <li>Multiple SAFEs in same round convert simultaneously</li>
                        </ul>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-medium mb-2">ESOP Pool Management</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          <li>Pre-money ESOP: pool sized before investment, dilutes founders only</li>
                          <li>Post-money ESOP: pool sized after investment, dilutes all shareholders</li>
                          <li>ESOP percentage maintained through subsequent rounds unless explicitly adjusted</li>
                          <li>Unallocated ESOP shares available for future employee grants</li>
                        </ul>
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Current Limitations</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          <li>No liquidation preferences modeled (assuming pro-rata distribution)</li>
                          <li>No anti-dilution provisions considered</li>
                          <li>Secondary sales not yet implemented in calculations</li>
                          <li>No modeling of drag-along or tag-along rights</li>
                          <li>Assumes all rounds close successfully</li>
                        </ul>
                      </div>
                    </div>
                  </section>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Calculations Available</h3>
                <p className="text-gray-500">Add founders and funding rounds to see calculation details.</p>
              </div>
            )}
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                <X className="h-4 w-4 mr-2" />
                Close Audit Trail
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
