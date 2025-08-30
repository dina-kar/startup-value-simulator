'use client';

import { CloudIcon, CloudCheckIcon, CloudUploadIcon } from 'lucide-react'
import { useScenarioStore } from '@/stores/scenarioStore'
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status'
import { cn } from '@/lib/utils'

interface SaveStatusProps {
  className?: string
  showText?: boolean
}

export const SaveStatus = ({ className, showText = true }: SaveStatusProps) => {
  const { 
    isSaving, 
    lastSavedAt, 
    name 
  } = useScenarioStore()

  if (!name) {
    return null
  }

  const getStatus = () => {
    if (isSaving) {
      return {
        status: 'maintenance' as const,
        icon: CloudUploadIcon,
        text: 'Saving...',
        color: 'text-blue-600'
      }
    }

    if (lastSavedAt) {
      const timeSince = Date.now() - lastSavedAt.getTime()
      const minutesAgo = Math.floor(timeSince / (1000 * 60))
      
      return {
        status: 'online' as const,
        icon: CloudCheckIcon,
        text: minutesAgo < 1 ? 'Just saved' : `Saved ${minutesAgo}m ago`,
        color: 'text-emerald-600'
      }
    }

    return {
      status: 'offline' as const,
      icon: CloudIcon,
      text: 'Not saved',
      color: 'text-gray-500'
    }
  }

  const { status, icon: Icon, text, color } = getStatus()

  return (
    <Status
      status={status}
      className={cn('px-2 py-1 text-xs', className)}
    >
      <StatusIndicator />
      <Icon size={14} className={cn('ml-1', color)} />
      {showText && (
        <StatusLabel className={cn('ml-1', color)}>
          {text}
        </StatusLabel>
      )}
    </Status>
  )
}
