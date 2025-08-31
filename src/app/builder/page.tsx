'use client'

import { useEffect } from 'react'
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute'
import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { useUIStore } from '@/lib/stores/uiStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { ScenarioTabs } from '@/components/layout/ScenarioTabs'
import { ScenarioSetupForm } from '@/components/forms/ScenarioSetupForm'
import { RoundsManager } from '@/components/rounds/RoundsManager'
import { ResultsView } from '@/components/results/ResultsView'
import { ShareModal } from '@/components/modals/ShareModal'
import { NotificationProvider, useAutoRemoveNotifications } from '@/components/ui/notification-provider'
import { useAutoSave } from '@/lib/hooks/useAutoSave'

export default function ScenarioBuilderPage() {
  const { scenario, createNewScenario } = useScenarioStore()
  const { activeTab } = useUIStore()

  // Enable auto-save
  useAutoSave({ enabled: true, interval: 30000 }) // 30 seconds

  // Auto-remove notifications
  useAutoRemoveNotifications()

  useEffect(() => {
    // Create a new scenario if none exists
    if (!scenario) {
      createNewScenario('New Scenario')
    }
  }, [scenario, createNewScenario])

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading scenario...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {scenario.name}
              </h1>
              <p className="text-muted-foreground">
                Model your cap table across funding rounds and see exit value distribution
              </p>
            </div>

            <ScenarioTabs />

            <div className="mt-6">
              {activeTab === 'setup' && <ScenarioSetupForm />}
              {activeTab === 'rounds' && <RoundsManager />}
              {activeTab === 'results' && <ResultsView />}
            </div>
          </div>
        </div>

        {/* Modals */}
        {scenario && <ShareModal scenario={scenario} />}
        
        {/* Notifications */}
        <NotificationProvider />
      </AppLayout>
    </ProtectedRoute>
  )
}
