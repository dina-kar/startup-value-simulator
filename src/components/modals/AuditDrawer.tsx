'use client'

import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileText, Calculator, TrendingUp } from 'lucide-react'

interface AuditDrawerProps {
  className?: string
}

export function AuditDrawer({ className }: AuditDrawerProps) {
  const { calculations, founders, rounds, esop } = useScenarioStore()
  
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

  if (!calculations) {
    return null
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Calculator className="h-4 w-4 mr-2" />
          View Calculations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Calculation Audit Trail
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of all calculations and assumptions used in this scenario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Initial Setup */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Initial Setup
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Total Initial Shares:</span>
                  <div className="text-lg">{formatNumber(calculations.totalShares, 0)}</div>
                </div>
                <div>
                  <span className="font-medium">ESOP Pool Size:</span>
                  <div className="text-lg">{formatPercentage(esop.poolSize)}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Founder Allocation:</h4>
                <div className="space-y-1">
                  {founders.map(founder => (
                    <div key={founder.id} className="flex justify-between text-sm">
                      <span>{founder.name}</span>
                      <span>{formatPercentage(founder.initialEquity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Round by Round Analysis */}
          {calculations.roundResults.map((result, index) => {
            const round = rounds.find(r => r.id === result.roundId)
            if (!round) return null

            return (
              <section key={result.roundId}>
                <h3 className="text-lg font-semibold mb-3">
                  Round {index + 1}: {round.name}
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  {/* Round Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Round Type:</span>
                      <div className="font-medium">{round.type}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Investment:</span>
                      <div className="font-medium">{formatCurrency(round.amount)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Pre-Money:</span>
                      <div className="font-medium">{formatCurrency(result.preMoney)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Post-Money:</span>
                      <div className="font-medium">{formatCurrency(result.postMoney)}</div>
                    </div>
                  </div>

                  {/* Calculation Details */}
                  <div className="bg-white rounded p-3 space-y-2">
                    <h4 className="font-medium">Calculation Steps:</h4>
                    {round.type === 'Priced' ? (
                      <div className="text-sm space-y-1">
                        <div>1. Share Price = Pre-Money ÷ Existing Shares</div>
                        <div className="ml-4">= {formatCurrency(result.preMoney)} ÷ {formatNumber(calculations.totalShares, 0)} = {formatCurrency(result.sharePrice)}</div>
                        
                        <div>2. New Shares Issued = Investment ÷ Share Price</div>
                        <div className="ml-4">= {formatCurrency(round.amount)} ÷ {formatCurrency(result.sharePrice)} = {formatNumber(result.sharesIssued, 0)}</div>
                        
                        <div>3. Dilution = New Shares ÷ Total Shares After Round</div>
                        <div className="ml-4">= {formatNumber(result.sharesIssued, 0)} ÷ {formatNumber(result.totalShares, 0)} = {formatPercentage(result.dilution)}</div>
                      </div>
                    ) : (
                      <div className="text-sm space-y-1">
                        <div>1. Valuation Cap: {formatCurrency(round.valuationCap || 0)}</div>
                        <div>2. Discount: {formatPercentage(round.discount || 0)}</div>
                        <div>3. Effective Price = (Cap ÷ Shares) × (1 - Discount)</div>
                        <div className="ml-4">= {formatCurrency(result.sharePrice)}</div>
                        <div>4. SAFE converts to {formatNumber(result.sharesIssued, 0)} shares</div>
                      </div>
                    )}
                  </div>

                  {/* Ownership After Round */}
                  <div>
                    <h4 className="font-medium mb-2">Ownership After Round:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {result.ownership.map(owner => (
                        <div key={owner.stakeholderId} className="flex justify-between text-sm bg-white rounded p-2">
                          <span>{owner.stakeholderName}</span>
                          <span className="font-medium">{formatPercentage(owner.percentage)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )
          })}

          {/* Final Ownership Summary */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Final Ownership Summary</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Share Distribution:</h4>
                  <div className="space-y-1">
                    {calculations.currentOwnership.map(owner => (
                      <div key={owner.stakeholderId} className="flex justify-between text-sm">
                        <span>{owner.stakeholderName}</span>
                        <span>{formatNumber(owner.shares, 0)} shares ({formatPercentage(owner.percentage)})</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Key Metrics:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Shares Outstanding:</span>
                      <span className="font-medium">{formatNumber(calculations.totalShares, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Capital Raised:</span>
                      <span className="font-medium">{formatCurrency(rounds.reduce((sum, round) => sum + round.amount, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Valuation:</span>
                      <span className="font-medium">
                        {calculations.roundResults.length > 0 
                          ? formatCurrency(calculations.roundResults[calculations.roundResults.length - 1].postMoney)
                          : 'Pre-funding'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Assumptions & Notes */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Assumptions & Notes</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm space-y-2">
              <ul className="list-disc list-inside space-y-1">
                <li>Initial share count is set to 10,000,000 for calculation purposes</li>
                <li>SAFE notes are treated as converting at the stated valuation cap with discount applied</li>
                <li>No liquidation preferences are currently modeled</li>
                <li>ESOP pool is allocated from the initial shares before any funding rounds</li>
                <li>All calculations assume standard conversion terms without special provisions</li>
                <li>Exit value distribution assumes pro-rata participation without preferences</li>
              </ul>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
