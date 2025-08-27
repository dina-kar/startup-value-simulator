'use client';

import { useState } from 'react'
import { ShareIcon, ExternalLinkIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CopyButton } from '@/components/ui/copy-button'
import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { useUIStore } from '@/lib/stores/uiStore'
import { useNotifications } from '@/lib/stores/uiStore'
import { shareScenario } from '@/lib/database/queries'

export const ShareModal = () => {
  const { scenario } = useScenarioStore()
  const { shareModalOpen, setShareModalOpen } = useUIStore()
  const { showSuccess, showError } = useNotifications()
  
  const [shareUrl, setShareUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGeneratedLink, setHasGeneratedLink] = useState(false)

  const generateShareLink = async () => {
    if (!scenario) {
      showError('No scenario to share', 'Please create a scenario first.')
      return
    }

    setIsGenerating(true)

    try {
      const result = await shareScenario(scenario.id)
      
      if (result.success && result.data) {
        setShareUrl(result.data.shareUrl)
        setHasGeneratedLink(true)
        showSuccess('Share link generated', 'Your scenario is now publicly accessible.')
      } else {
        showError('Failed to generate share link', result.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error generating share link:', error)
      showError('Error', 'An unexpected error occurred while generating the share link.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    setShareModalOpen(false)
    // Reset state when modal closes
    setTimeout(() => {
      setShareUrl('')
      setHasGeneratedLink(false)
    }, 200)
  }

  if (!scenario) {
    return null
  }

  return (
    <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShareIcon size={20} />
            Share Scenario
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Scenario Name</Label>
            <Input 
              value={scenario.name} 
              readOnly 
              className="bg-muted"
            />
          </div>

          {!hasGeneratedLink ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Generate a public link to share this scenario. Anyone with the link will be able to view your scenario in read-only mode.
              </p>
              
              <Button 
                onClick={generateShareLink}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating Link...
                  </>
                ) : (
                  <>
                    <ShareIcon size={16} className="mr-2" />
                    Generate Share Link
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Share URL</Label>
                <div className="flex mt-1">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    className="bg-muted rounded-r-none"
                  />
                  <CopyButton 
                    value={shareUrl}
                    className="rounded-l-none border-l-0"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(shareUrl, '_blank')}
                  className="w-full"
                >
                  <ExternalLinkIcon size={16} className="mr-2" />
                  Preview Share Link
                </Button>
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> This link provides read-only access to your scenario. 
                  Viewers can see all calculations and charts but cannot make changes.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            {hasGeneratedLink ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
