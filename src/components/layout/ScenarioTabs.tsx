'use client'

import { useUIStore } from '@/lib/stores/uiStore'
import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
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
    <div>
      {/* Mobile Popover Selector */}
      <div className="sm:hidden mb-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <StatusIcon status={getTabStatus(activeTab)} />
                {activeTab === 'setup' ? 'Setup' : activeTab === 'rounds' ? 'Funding Rounds' : 'Results'}
              </span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[200px] p-2">
            <ul className="space-y-1 text-sm">
              {(['setup','rounds','results'] as const).map(tab => (
                <li key={tab}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`w-full flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted text-left ${activeTab===tab?'bg-muted font-medium':''}`}
                  >
                    <StatusIcon status={getTabStatus(tab)} />
                    {tab === 'setup' ? 'Setup' : tab === 'rounds' ? 'Funding Rounds' : 'Results'}
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'setup' | 'rounds' | 'results')} className="transition-opacity">
        <div className="relative -mx-4 mb-2 sm:mx-0 sm:mb-0 hidden sm:block">
          <TabsList className="grid grid-cols-3 gap-0">
            <TabsTrigger
              value="setup"
              className="flex items-center gap-2 whitespace-nowrap text-sm px-3 py-2.5"
            >
              <StatusIcon status={getTabStatus('setup')} />
              <span>Setup</span>
            </TabsTrigger>
            <TabsTrigger
              value="rounds"
              className="flex items-center gap-2 whitespace-nowrap text-sm px-3 py-2.5"
            >
              <StatusIcon status={getTabStatus('rounds')} />
              Funding Rounds
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="flex items-center gap-2 whitespace-nowrap text-sm px-3 py-2.5"
            >
              <StatusIcon status={getTabStatus('results')} />
              <span>Results</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </div>
  )
}
