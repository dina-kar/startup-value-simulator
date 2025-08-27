'use client'

import { AuthForm } from '@/components/auth/AuthForm'
import { NotificationProvider, useAutoRemoveNotifications } from '@/components/ui/notification-provider'

export default function LoginPage() {
  useAutoRemoveNotifications()

  return (
    <>
      <AuthForm mode="login" />
      <NotificationProvider />
    </>
  )
}
