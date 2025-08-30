'use client'

import { useScenarioStore } from '@/stores/scenarioStore'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function CapTableTable() {
  const { calculations, exitValue } = useScenarioStore()

  if (!calculations) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-gray-500">No calculations available</p>
      </div>
    )
  }

  const { currentOwnership, exitDistribution } = calculations

  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Current Cap Table</h3>
        <p className="text-sm text-gray-600">
          Exit Value: ${exitValue.toLocaleString()}
        </p>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stakeholder</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Ownership %</TableHead>
            <TableHead className="text-right">Exit Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentOwnership.map((stakeholder) => {
            const exitData = exitDistribution.find(
              e => e.stakeholderId === stakeholder.stakeholderId
            )
            
            return (
              <TableRow key={stakeholder.stakeholderId}>
                <TableCell className="font-medium">
                  {stakeholder.stakeholderName}
                </TableCell>
                <TableCell className="capitalize">
                  {stakeholder.stakeholderType}
                </TableCell>
                <TableCell className="text-right">
                  {stakeholder.shares.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {stakeholder.percentage.toFixed(2)}%
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${exitData?.value.toLocaleString() || '0'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      
      <div className="p-4 border-t bg-gray-50">
        <div className="flex justify-between items-center text-sm">
          <span>Total Shares:</span>
          <span className="font-medium">
            {calculations.totalShares.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
