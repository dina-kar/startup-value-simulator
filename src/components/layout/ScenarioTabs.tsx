'use client'

import { useUIStore } from '@/lib/stores/uiStore'
import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'

export function ScenarioTabs() {
  const { activeTab, setActiveTab } = useUIStore()
  const { founders, validationErrors, calculations } = useScenarioStore()

  // Determine completion status for each tab
  const setupComplete = founders.length > 0 && validationErrors.length === 0
  const roundsComplete = (calculations?.roundResults.length ?? 0) > 0
  
  const getTabStatus = (tab: string) => {
    switch (tab) {
      case 'setup':
        return setupComplete ? 'complete' : validationErrors.length > 0 ? 'error' : 'incomplete'
      case 'rounds':
        return roundsComplete ? 'complete' : 'incomplete'
      case 'results':
        return calculations ? 'complete' : 'incomplete'
      default:
        return 'incomplete'
    }
  }

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'setup' | 'rounds' | 'results')}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="setup" className="flex items-center gap-2">
          <StatusIcon status={getTabStatus('setup')} />
          Setup
        </TabsTrigger>
        <TabsTrigger value="rounds" className="flex items-center gap-2">
          <StatusIcon status={getTabStatus('rounds')} />
          Funding Rounds
        </TabsTrigger>
        <TabsTrigger value="results" className="flex items-center gap-2">
          <StatusIcon status={getTabStatus('results')} />
          Results
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
