'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CopyButton } from '@/components/ui/copy-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ShareIcon, LinkIcon, ExternalLinkIcon, CheckIcon, CopyIcon } from 'lucide-react'
import { shareScenario } from '@/lib/database/queries'
import { useNotifications } from '@/lib/stores/uiStore'
import type { Scenario } from '@/types/scenario'

interface ShareModalProps {
  scenario: Scenario
  children?: React.ReactNode
}

export function ShareModal({ scenario, children }: ShareModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const { showSuccess, showError } = useNotifications()

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const result = await shareScenario(scenario.id, { isPublic: true, canView: true, canCopy: true })
      if (result.success && result.data) {
        setShareUrl(result.data.shareUrl)
        showSuccess('Public link ready', 'Anyone with the link can view this scenario.')
      } else {
        showError('Share failed', result.error || 'Unknown error')
      }
    } catch (e) {
      console.error('Share error', e)
      showError('Share error', 'Could not create public link')
    } finally {
      setIsSharing(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showSuccess('Copied', 'Link copied to clipboard')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      showError('Error', 'Failed to copy to clipboard')
    }
  }

  const openShareLink = () => { if (shareUrl) window.open(shareUrl, '_blank') }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700">
            <ShareIcon size={16} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShareIcon size={20} />
            Share Scenario
          </DialogTitle>
          <DialogDescription>
            Create a single public view-only link for "{scenario.name}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!shareUrl && (
            <Button 
              onClick={handleShare} 
              disabled={isSharing}
              className="w-full"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating link...
                </>
              ) : (
                <>
                  <LinkIcon size={16} className="mr-2" />
                  Create Public Link
                </>
              )}
            </Button>
          )}

          {shareUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckIcon size={16} />
                <span className="text-sm font-medium">Public link ready</span>
              </div>
              <div className="space-y-2">
                <Label>Public URL</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="font-mono text-sm" />
                  <CopyButton content={shareUrl} onCopy={() => copyToClipboard(shareUrl)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={openShareLink} variant="outline" className="flex-1">
                  <ExternalLinkIcon size={16} className="mr-2" />
                  Open
                </Button>
                <Button onClick={() => copyToClipboard(shareUrl)} variant="secondary" className="flex-1">
                  <CopyIcon size={16} className="mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
