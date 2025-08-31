'use client'

import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { CapTableTable } from '@/components/charts/CapTableTable'
import { OwnershipChart } from '@/components/charts/OwnershipChart'
import { ExitWaterfallChart } from '@/components/charts/ExitWaterfallChart'
import { AuditDrawer } from '@/components/modals/AuditDrawer'
import { ShareModal } from '@/components/modals/ShareModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ShareIcon } from 'lucide-react'

export function ResultsView() {
  const { calculations, founders, validationErrors, rounds, scenario } = useScenarioStore()

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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="captable">Cap Table</TabsTrigger>
          <TabsTrigger value="ownership">Ownership</TabsTrigger>
          <TabsTrigger value="exit">Exit Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
                          : 'bg-gray-100 text-gray-700'
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
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </TabsContent>

        {/* Cap Table Tab */}
        <TabsContent value="captable">
          <CapTableTable />
        </TabsContent>

        {/* Ownership Chart Tab */}
        <TabsContent value="ownership">
          <OwnershipChart />
        </TabsContent>

        {/* Exit Analysis Tab */}
        <TabsContent value="exit">
          <ExitWaterfallChart />
        </TabsContent>
      </Tabs>
    </div>
  )
}
