'use client'

import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { useCurrencyFormatter } from '@/lib/format/currency'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function CapTableTable() {
  const { calculations, exitValue, founders, esop, rounds } = useScenarioStore()
  const format = useCurrencyFormatter()

  if (!calculations) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-gray-500">No calculations available</p>
      </div>
    )
  }

  const { currentOwnership, exitDistribution } = calculations

  // Group stakeholders by type for better organization
  const groupedStakeholders = currentOwnership.reduce((acc, stakeholder) => {
    const type = stakeholder.stakeholderType
    if (!acc[type]) acc[type] = []
    acc[type].push(stakeholder)
    return acc
  }, {} as Record<string, typeof currentOwnership>)

  // Order: founders, investors, esop
  const orderedTypes = ['founder', 'investor', 'esop']
  
  const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) return format(value, { notation: 'compact', maximumFractionDigits: 1 })
    if (value >= 1_000_000) return format(value, { notation: 'compact', maximumFractionDigits: 1 })
    if (value >= 1_000) return format(value, { notation: 'compact', maximumFractionDigits: 1 })
    return format(value)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'founder':
        return 'bg-blue-100 text-blue-800'
      case 'investor':
        return 'bg-green-100 text-green-800'
      case 'esop':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSharePrice = () => {
    if (calculations.roundResults.length === 0) return 0
    return calculations.roundResults[calculations.roundResults.length - 1].sharePrice
  }

  const sharePrice = getSharePrice()

  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Current Cap Table</h3>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
          <span>Exit Value: {formatCurrency(exitValue)}</span>
          {sharePrice > 0 && <span>Current Share Price: {formatCurrency(sharePrice)}</span>}
          <span>Total Shares: {calculations.totalShares.toLocaleString()}</span>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stakeholder</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Ownership %</TableHead>
            <TableHead className="text-right">Current Value</TableHead>
            <TableHead className="text-right">Exit Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderedTypes.map(type => {
            const stakeholders = groupedStakeholders[type] || []
            if (stakeholders.length === 0) return null

            return stakeholders
              .sort((a, b) => b.percentage - a.percentage)
              .map((stakeholder) => {
                const exitData = exitDistribution.find(
                  e => e.stakeholderId === stakeholder.stakeholderId
                )
                
                const currentValue = sharePrice > 0 ? stakeholder.shares * sharePrice : 0
                
                return (
                  <TableRow key={stakeholder.stakeholderId}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{stakeholder.stakeholderName}</span>
                        {stakeholder.stakeholderType === 'esop' && (
                          <div className="text-xs text-gray-500 mt-1">
                            <div>Pool Size: {esop.poolSize}%</div>
                            <div>Allocated: {esop.allocated}%</div>
                            <div>Available: {(esop.poolSize - esop.allocated).toFixed(1)}%</div>
                          </div>
                        )}
                        {stakeholder.stakeholderType === 'founder' && (
                          <div className="text-xs text-gray-500 mt-1">
                            {(() => {
                              const founder = founders.find(f => f.id === stakeholder.stakeholderId)
                              return founder ? `Initial: ${founder.initialEquity}%` : ''
                            })()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getTypeColor(stakeholder.stakeholderType)}>
                        {stakeholder.stakeholderType === 'esop' ? 'ESOP' : stakeholder.stakeholderType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {stakeholder.shares.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {stakeholder.percentage.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {currentValue > 0 ? formatCurrency(currentValue) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(exitData?.value || 0)}
                    </TableCell>
                  </TableRow>
                )
              })
          })}
  </TableBody>
      </Table>
      
      <div className="p-4 border-t bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Total Shares:</span>
            <span className="font-medium font-mono">
              {calculations.totalShares.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Raised:</span>
            <span className="font-medium">
              ${rounds.reduce((sum, round) => sum + round.amount, 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Funding Rounds:</span>
            <span className="font-medium">
              {rounds.length} ({rounds.filter(r => r.type === 'SAFE').length} SAFEs)
            </span>
          </div>
          <div className="flex justify-between">
            <span>Exit Multiple:</span>
            <span className="font-medium">
              {calculations.roundResults.length > 0 
                ? `${(exitValue / calculations.roundResults[calculations.roundResults.length - 1].postMoney).toFixed(1)}x`
                : '-'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
