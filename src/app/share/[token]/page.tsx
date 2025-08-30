'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ExternalLinkIcon, AlertCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Banner, BannerIcon, BannerTitle } from '@/components/ui/banner'
import { ScenarioTabs } from '@/components/layout/ScenarioTabs'
import { ScenarioSetupForm } from '@/components/forms/ScenarioSetupForm'
import { RoundsManager } from '@/components/rounds/RoundsManager'
import { ResultsView } from '@/components/results/ResultsView'
import { useUIStore } from '@/stores/uiStore'
import { loadSharedScenario } from '@/lib/database/queries'
import type { Scenario } from '@/types/scenario'

export default function SharedScenarioPage() {
  const params = useParams()
  const token = params.token as string
  
  const { activeScenarioTab } = useUIStore()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sharedScenario, setSharedScenario] = useState<Scenario | null>(null)

  useEffect(() => {
    const loadSharedScenarioData = async () => {
      if (!token) return
      
      setLoading(true)
      setError(null)

      try {
        const result = await loadSharedScenario(token)
        
        if (result.success && result.data) {
          setSharedScenario(result.data)
          // TODO: Load the shared scenario data into the store
          // For now, we'll just display the shared scenario
        } else {
          setError(result.error || 'Failed to load scenario')
        }
      } catch (err) {
        console.error('Error loading shared scenario:', err)
        setError('An unexpected error occurred while loading the scenario.')
      } finally {
        setLoading(false)
      }
    }

    loadSharedScenarioData()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shared scenario...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full">
          <Banner className="bg-red-50 text-red-900 border-red-200">
            <BannerIcon icon={AlertCircleIcon} />
            <div className="flex-1">
              <BannerTitle className="font-semibold">
                Scenario Not Found
              </BannerTitle>
              <p className="text-sm mt-1">
                {error}
              </p>
            </div>
          </Banner>
          
          <div className="mt-6 text-center">
            <Button 
              onClick={() => { window.location.href = '/' }}
              variant="outline"
            >
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!sharedScenario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircleIcon size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No scenario data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header for shared view */}
      <header className="border-b bg-background p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {sharedScenario.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Shared scenario • Read-only view
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Banner className="bg-blue-50 text-blue-900 border-blue-200 px-3 py-1">
                <BannerIcon icon={ExternalLinkIcon} />
                <BannerTitle className="text-sm">
                  Shared View
                </BannerTitle>
              </Banner>
              
              <Button 
                onClick={() => { window.location.href = '/builder' }}
                variant="outline"
                size="sm"
              >
                Create Your Own
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="text-muted-foreground">
              This is a shared scenario. You can view all calculations and charts but cannot make changes.
            </p>
          </div>

          <ScenarioTabs />

          <div className="mt-6">
            {activeScenarioTab === 'setup' && (
              <div className="relative">
                <div className="pointer-events-none opacity-75">
                  <ScenarioSetupForm />
                </div>
                <div className="absolute inset-0 bg-background/10 backdrop-blur-[0.5px] rounded-lg flex items-center justify-center">
                  <div className="bg-background/90 p-4 rounded-lg border shadow-sm">
                    <p className="text-sm text-muted-foreground text-center">
                      <ExternalLinkIcon size={16} className="inline mr-2" />
                      Read-only shared view
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeScenarioTab === 'rounds' && (
              <div className="relative">
                <div className="pointer-events-none opacity-75">
                  <RoundsManager />
                </div>
                <div className="absolute inset-0 bg-background/10 backdrop-blur-[0.5px] rounded-lg flex items-center justify-center">
                  <div className="bg-background/90 p-4 rounded-lg border shadow-sm">
                    <p className="text-sm text-muted-foreground text-center">
                      <ExternalLinkIcon size={16} className="inline mr-2" />
                      Read-only shared view
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeScenarioTab === 'results' && <ResultsView />}
          </div>
        </div>
      </div>
    </div>
  )
}
