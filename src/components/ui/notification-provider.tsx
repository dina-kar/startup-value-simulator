'use client';

import { useEffect } from 'react'
import { CheckCircleIcon, AlertCircleIcon, InfoIcon, AlertTriangleIcon } from 'lucide-react'
import { useNotifications } from '@/lib/stores/uiStore'
import { Banner, BannerIcon, BannerTitle, BannerClose } from '@/components/ui/banner'
import { cn } from '@/lib/utils'

const notificationIcons = {
  success: CheckCircleIcon,
  error: AlertCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
}

const notificationStyles = {
  success: 'bg-emerald-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-blue-500 text-white',
}

export const NotificationProvider = () => {
  const { notifications, removeNotification } = useNotifications()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => {
        const Icon = notificationIcons[notification.type]
        
        return (
          <Banner
            key={notification.id}
            className={cn(
              'shadow-lg border-0 rounded-lg',
              notificationStyles[notification.type]
            )}
            inset
          >
            <BannerIcon icon={Icon} />
            <div className="flex-1 min-w-0">
              <BannerTitle className="font-medium text-white">
                {notification.title}
              </BannerTitle>
              {notification.message && (
                <p className="text-sm text-white/90 mt-1 break-words">
                  {notification.message}
                </p>
              )}
            </div>
            <BannerClose 
              onClick={() => removeNotification(notification.id)}
              className="text-white/80 hover:text-white hover:bg-white/10"
            />
          </Banner>
        )
      })}
    </div>
  )
}

// Auto-remove notifications hook
export const useAutoRemoveNotifications = () => {
  const { notifications, removeNotification } = useNotifications()

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    notifications.forEach((notification) => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          removeNotification(notification.id)
        }, notification.duration)
        
        timers.push(timer)
      }
    })

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [notifications, removeNotification])
}
